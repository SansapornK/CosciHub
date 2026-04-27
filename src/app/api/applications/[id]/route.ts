// src/app/api/applications/[id]/route.ts
import { NextResponse } from "next/server";
import dbConnect from "@/libs/mongodb";
import Application from "@/models/Application";
import Job from "@/models/Job";
import User from "@/models/User";
import { getServerSession } from "next-auth";
import { authOptions } from "@/libs/auth";
import mongoose, { Types } from "mongoose";
import {
  notifyApplicationAccepted,
  notifyApplicationRejected,
  notifyWorkStarted,
  notifyWorkSubmitted,
  notifyRevisionRequested,
  notifyWorkApproved,
  notifyProgressUpdated,
  notifyStudentReviewReceived,
  notifyOwnerReviewReceived,
  notifyApplicationWithdrawnByStudent,
  notifyApplicationWithdrawnByEmployer,
} from "@/utils/notificationUtils";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await dbConnect();
    const { id } = await params;

    console.log("Checking ID in DB:", id);

    if (!mongoose.Types?.ObjectId.isValid(id)) {
      return NextResponse.json({ error: "ID ไม่ถูกต้อง" }, { status: 400 });
    }

    const application = await Application.findById(id)
      .populate("jobId")
      .populate("applicantId")
      .lean();

    if (!application) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    // ── inject ownerImage ──
    const app = application as any;
    if (app.jobId?.ownerId) {
      const owner = (await User.findById(app.jobId.ownerId)
        .select("profileImageUrl")
        .lean()) as any;
      if (owner?.profileImageUrl) app.jobId.ownerImage = owner.profileImageUrl; 
    }

    return NextResponse.json({ application: application });
  } catch (error) {
    return NextResponse.json({ error: "Server Error" }, { status: 500 });
  }
}

// ─── Helper สำหรับอัปเดต Job Progress ───
async function updateJobAverageProgress(jobId: string) {
  const applications = await Application.find({
    jobId: jobId,
    status: {
      $in: ["accepted", "in_progress", "submitted", "revision", "completed"],
    },
  });

  if (applications.length > 0) {
    const totalProgress = applications.reduce(
      (sum, app) => sum + (app.progress || 0),
      0,
    );
    const avgProgress = Math.round(totalProgress / applications.length);

    await (Job as any).findByIdAndUpdate(jobId, { progress: avgProgress });
  }
}

// ───  Helper ───────────────────────────────────
async function syncJobParticipants(jobId: string) {
  await dbConnect();
  const cleanJobId = jobId.trim();

  if (!mongoose.isValidObjectId(cleanJobId)) return;

  const allApplications = await Application.find({ jobId: cleanJobId }).lean();

  const allApplicantIds = [
    ...new Set(allApplications.map((app: any) => app.applicantId)),
  ];

  const assignedWorkerIds = [
    ...new Set(
      allApplications
        .filter((app: any) =>
          [
            "accepted",
            "in_progress",
            "submitted",
            "revision",
            "completed",
          ].includes(app.status),
        )
        .map((app: any) => app.applicantId),
    ),
  ];

  const JobModel = (mongoose.models.Job || Job) as any;

  await JobModel.findByIdAndUpdate(cleanJobId, {
    $set: {
      applicants: allApplicantIds,
      assignedTo: assignedWorkerIds,
    },
  });
}

// ─── เพิ่ม Helper สำหรับสรุปงานไปที่ Job ──────────────────────
async function syncJobSubmissions(jobId: string) {
  const apps = await Application.find({ jobId }).lean();

  const submissionsSummary = apps.map((a: any) => ({
    applicationId: a._id,
    applicantName: a.applicantName,
    status: a.status,
    hasLink: !!a.workLink,
    hasFiles: (a.attachments?.length || 0) > 0,
    lastSubmittedAt: a.updatedAt,
  }));

  const JobModel = (mongoose.models.Job || Job) as any;
  await JobModel.findByIdAndUpdate(jobId, {
    $set: { allSubmissions: submissionsSummary },
  });
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();
    const { id } = await params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { error: "Application ID ไม่ถูกต้อง" },
        { status: 400 },
      );
    }

    const user = await User.findOne({ email: session.user.email });
    if (!user) {
      return NextResponse.json({ error: "ไม่พบผู้ใช้" }, { status: 404 });
    }

    // ดึง application
    const application = (await Application.findById(id).lean()) as any;
    if (!application) {
      return NextResponse.json({ error: "ไม่พบใบสมัคร" }, { status: 404 });
    }

    // ตรวจสอบว่า user เป็นเจ้าของงานนั้น
    const job = await (Job as any).findById(application.jobId).lean();
    if (!job)
      return NextResponse.json({ error: "ไม่พบข้อมูลงาน" }, { status: 404 });

    // const isOwner = job.owner === user.name;
    const isOwner =
      (job.ownerId && job.ownerId.toString() === user._id.toString()) ||
      job.owner?.trim().toLowerCase() === user.name?.trim().toLowerCase();
    const isStudent = application.applicantEmail === user.email;

    // const { action, progress, rejectionNote, workLink, note, feedback } = await req.json();
    const {
      action,
      progress,
      progressNote,
      rejectionNote,
      workLink,
      note,
      feedback,
      attachments,
      rating,
      comment,
      isAnonymous,
      role,
    } = await req.json();

    if (!isOwner && !isStudent) {
      return NextResponse.json(
        { error: "ไม่มีสิทธิ์อัปเดตใบสมัครนี้" },
        { status: 403 },
      );
    }

    // ───  1. submitReview ──────────────────────────────────────────
    if (action === "submitReview") {
      const updateData: any = {};

      if (role === "student" && isStudent) {
        if (application.status !== "completed") {
          return NextResponse.json(
            { error: "ต้องรองานเสร็จสิ้นก่อนจึงจะรีวิวได้" },
            { status: 400 },
          );
        }
        updateData.studentReview = {
          rating: Number(rating),
          comment: comment,
          isAnonymous: isAnonymous ?? true,
          createdAt: new Date(),
        };
      } else if (role === "owner" && isOwner) {
        updateData.ownerReview = {
          rating: Number(rating),
          comment: comment,
          isAnonymous: isAnonymous ?? false,
          createdAt: new Date(),
        };

        updateData.status = "completed";
        updateData.progress = 100;
      } else {
        return NextResponse.json(
          { error: "ไม่มีสิทธิ์เข้าถึงส่วนนี้" },
          { status: 400 },
        );
      }
      const updated = await Application.findByIdAndUpdate(
        id,
        { $set: updateData },
        { new: true },
      );

      // ส่ง Notification หลัง save สำเร็จ
      try {
        if (role === "student" && isStudent) {
          // นิสิตรีวิว → แจ้งผู้ว่าจ้าง
          await notifyOwnerReviewReceived(
            application.jobId.toString(),
            application.applicantId.toString(),
            id,
          );
        } else if (role === "owner" && isOwner) {
          // ผู้ว่าจ้างรีวิว → แจ้งนิสิต
          await notifyStudentReviewReceived(
            application.jobId.toString(),
            application.applicantId.toString(),
            id,
          );
        }
      } catch (e) {
        console.error("Review notification error:", e);
      }

      // ถ้าเป็นเจ้าของงานรีวิว ต้อง Sync สถานะ Job ใหญ่ด้วย
      if (role === "owner") {
        await updateJobAverageProgress(application.jobId.toString());
        await syncJobParticipants(application.jobId.toString());

        const remainingActive = await Application.countDocuments({
          jobId: application.jobId,
          status: { $in: ["accepted", "in_progress", "submitted", "revision"] },
        });
        if (remainingActive === 0) {
          await (Job as any).findByIdAndUpdate(application.jobId, {
            $set: { status: "completed" },
          });
        }
      }
      return NextResponse.json({ success: true, application: updated });
    }

    // ── accept ─────────────────────────────────────────────────────────────
    if (action === "accept" && isOwner) {
      // ตรวจสอบ quota
      // ตรวจสอบ quota
      const capacity = job.capacity || 1;
      const acceptedCount = await Application.countDocuments({
        jobId: application.jobId,
        status: {
          $in: [
            "accepted",
            "in_progress",
            "submitted",
            "revision",
            "completed",
          ],
        },
      });

      if (acceptedCount >= capacity) {
        return NextResponse.json(
          { error: `รับครบ ${capacity} คนแล้ว` },
          { status: 400 },
        );
      }

      await Application.findByIdAndUpdate(id, {
        $set: { status: "accepted", updatedAt: new Date() },
      });

      try {
        await notifyApplicationAccepted(
          application.jobId.toString(),
          application.applicantId.toString(),
          id,
        );
      } catch (e) {
        console.error(e);
      }

      await syncJobParticipants(application.jobId.toString());

      const newAcceptedCount = acceptedCount + 1;
      const isFull = newAcceptedCount >= capacity;

      // ถ้าเต็ม quota → ปิดรับสมัครงานอัตโนมัติ
      if (isFull) {
        await (Job as any).findByIdAndUpdate(application.jobId, {
          $set: { status: "in_progress" },
        });
      }

      return NextResponse.json({
        success: true,
        message: isFull
          ? `รับครบ ${capacity} คน ปิดรับสมัครแล้ว`
          : `รับใบสมัครสำเร็จ (${newAcceptedCount}/${capacity})`,
        isFull,
      });
    }

    // ── reject ─────────────────────────────────────────────────────────────
    if (action === "reject" && isOwner) {
      await Application.findByIdAndUpdate(id, {
        $set: {
          status: "rejected",
          rejectionNote: rejectionNote || null,
          updatedAt: new Date(),
        },
      });
      try {
        await notifyApplicationRejected(
          application.jobId.toString(),
          application.applicantId.toString(),
          id,
        );
      } catch (e) {
        console.error(e);
      }

      await syncJobParticipants(application.jobId.toString());

      return NextResponse.json({ success: true, message: "ปฏิเสธใบสมัครแล้ว" });
    }

    // ─── approve (ยืนยันงานเสร็จ) ──────────────────────────────────
    if (action === "approve" && isOwner) {
      if (application.status !== "submitted")
        return NextResponse.json({ error: "งานยังไม่ถูกส่ง" }, { status: 400 });

      await Application.findByIdAndUpdate(id, {
        $set: {
          status: "completed",
          progress: 100,
          feedback: feedback || "ทำงานได้ยอดเยี่ยมมาก!",
          updatedAt: new Date(),
        },
      });

      await updateJobAverageProgress(application.jobId.toString());
      await syncJobParticipants(application.jobId.toString());

      const remainingActive = await Application.countDocuments({
        jobId: application.jobId,
        status: { $in: ["accepted", "in_progress", "submitted", "revision"] },
      });
      if (remainingActive === 0) {
        await (Job as any).findByIdAndUpdate(application.jobId, {
          $set: { status: "completed" },
        });
      }
      try {
        await notifyWorkApproved(
          application.jobId.toString(),
          application.applicantId.toString(),
          id,
        );
      } catch (e) {
        console.error(e);
      }

      return NextResponse.json({
        success: true,
        message: "ยืนยันงานเสร็จสิ้นแล้ว",
      });
    }

    // ── requestRevision (owner ขอแก้ไข) ────
    if (action === "requestRevision" && isOwner) {
      if (application.status !== "submitted") {
        return NextResponse.json({ error: "งานยังไม่ถูกส่ง" }, { status: 400 });
      }
      await Application.findByIdAndUpdate(id, {
        $set: {
          status: "revision",
          feedback: feedback || "รบกวนติดต่อกลับเพื่อรับ feedback",
          updatedAt: new Date(),
        },
      });
      try {
        await notifyRevisionRequested(
          application.jobId.toString(),
          application.applicantId.toString(),
          id,
        );
      } catch (e) {
        console.error(e);
      }
      return NextResponse.json({ success: true, message: "ส่งคำขอแก้ไขแล้ว" });
    }

    // student
    // ── updateProgress (นิสิตอัปเดต %) ────
    if (action === "updateProgress" && isStudent) {
      if (
        !["accepted", "in_progress", "revision"].includes(application.status)
      ) {
        return NextResponse.json(
          { error: "ไม่สามารถอัปเดต progress ได้" },
          { status: 400 },
        );
      }

      const newProgress = Math.min(100, Math.max(0, Number(progress)));
      const isFirstStart = application.status === "accepted";

      await Application.findByIdAndUpdate(id, {
        $set: {
          progress: newProgress,
          progressNote: progressNote?.trim() || null, // ← บันทึกโน้ตล่าสุด
          status: "in_progress",
          updatedAt: new Date(),
        },
        $push: {
          progressLogs: {
            // ← เพิ่ม history
            progress: newProgress,
            note: progressNote?.trim() || null,
            createdAt: new Date(),
          },
        },
      });

      if (isFirstStart) {
        try {
          await notifyWorkStarted(
            application.jobId.toString(),
            application.applicantId.toString(),
            id,
          );
        } catch (e) {
          console.error(e);
        }
      }

      try {
        await notifyProgressUpdated(
          application.jobId.toString(),
          application.applicantId.toString(),
          id,
          newProgress,
        );
      } catch (e) {
        console.error(e);
      }

      await updateJobAverageProgress(application.jobId.toString());

      return NextResponse.json({ success: true, progress: newProgress });
    }

    // ─── submit (นิสิตส่งงาน) ───────────────────────
    if (action === "submit" && isStudent) {
      if (
        !["in_progress", "revision", "accepted", "submitted"].includes(
          application.status,
        )
      ) {
        return NextResponse.json(
          { error: "ไม่สามารถส่งงานได้ในสถานะนี้" },
          { status: 400 },
        );
      }

      await Application.findByIdAndUpdate(id, {
        $set: {
          status: "submitted",
          // progress: 100,
          workLink: workLink,
          attachments: attachments || [],
          updatedAt: new Date(),
        },
      });

      await (Job as any).findByIdAndUpdate(application.jobId, {
        $set: { status: "awaiting" },
      });
      await syncJobSubmissions(application.jobId.toString());
      await updateJobAverageProgress(application.jobId.toString());

      try {
        await notifyWorkSubmitted(
          application.jobId.toString(),
          application.applicantId.toString(),
          id,
        );
      } catch (e) {
        console.error(e);
      }

      return NextResponse.json({
        success: true,
        message: "ส่งงานเรียบร้อยแล้ว รอผู้ว่าจ้างตรวจสอบ",
      });
    }

    // ─── withdraw (ยกเลิกใบสมัคร ก่อนเริ่มงาน) ──────
    if (action === "withdraw" && isStudent) {
      // ยกเลิกได้เฉพาะ pending หรือ accepted เท่านั้น
      if (!["pending", "accepted"].includes(application.status)) {
        return NextResponse.json(
          { error: "ไม่สามารถยกเลิกได้ เนื่องจากเริ่มทำงานไปแล้ว" },
          { status: 400 },
        );
      }

      // แจ้งเจ้าของงานว่านิสิตยกเลิกใบสมัคร
      console.log("[withdraw] Calling notifyApplicationWithdrawnByStudent...");
      try {
        const notiResult = await notifyApplicationWithdrawnByStudent(
          application.jobId.toString(),
          application.applicantId.toString(),
          id,
        );
        console.log("[withdraw] Notification result:", notiResult);
      } catch (e) {
        console.error("[withdraw] Notification error:", e);
      }

      await Application.findByIdAndDelete(id);
      await syncJobParticipants(application.jobId.toString());

      //  ตรวจสอบและคืน job status ถ้า capacity ยังไม่เต็ม
      const capacity = job.capacity || 1;
      const acceptedCount = await Application.countDocuments({
        jobId: application.jobId,
        status: {
          $in: [
            "accepted",
            "in_progress",
            "submitted",
            "revision",
            "completed",
          ],
        },
      });

      if (acceptedCount < capacity && job.status === "in_progress") {
        await (Job as any).findByIdAndUpdate(application.jobId, {
          $set: { status: "published" }, // ✅ เปิดรับสมัครใหม่
        });
      }

      return NextResponse.json({
        success: true,
        message: "ยกเลิกการสมัครแล้ว",
      });
    }

    // ─── employerWithdraw (ผู้ว่าจ้างยกเลิกการจ้างนิสิต) ──────
    if (action === "employerWithdraw" && isOwner) {
      // ยกเลิกได้เฉพาะ accepted เท่านั้น (ยังไม่เริ่มงาน)
      if (application.status !== "accepted") {
        return NextResponse.json(
          {
            error:
              "ไม่สามารถยกเลิกได้ เนื่องจากนิสิตเริ่มทำงานไปแล้ว หรือสถานะไม่ถูกต้อง",
          },
          { status: 400 },
        );
      }

      // แจ้งนิสิตว่าผู้ว่าจ้างยกเลิกใบสมัคร
      console.log(
        "[employerWithdraw] Calling notifyApplicationWithdrawnByEmployer...",
      );
      try {
        const notiResult = await notifyApplicationWithdrawnByEmployer(
          application.jobId.toString(),
          application.applicantId.toString(),
          id,
        );
        console.log("[employerWithdraw] Notification result:", notiResult);
      } catch (e) {
        console.error("[employerWithdraw] Notification error:", e);
      }

      // ลบ application
      await Application.findByIdAndDelete(id);
      await syncJobParticipants(application.jobId.toString());

      // ตรวจสอบจำนวนคนที่รับหลังจากยกเลิก
      const capacity = job.capacity || 1;
      const acceptedCount = await Application.countDocuments({
        jobId: application.jobId,
        status: {
          $in: [
            "accepted",
            "in_progress",
            "submitted",
            "revision",
            "completed",
          ],
        },
      });

      // ถ้าจำนวนคนที่รับไม่ครบ capacity แล้วให้เปลี่ยน job status กลับเป็น published
      if (acceptedCount < capacity && job.status === "in_progress") {
        await (Job as any).findByIdAndUpdate(application.jobId, {
          $set: { status: "published" },
        });
      }

      return NextResponse.json({
        success: true,
        message: "ยกเลิกการจ้างนิสิตแล้ว",
        acceptedCount,
        capacity,
      });
    }

    return NextResponse.json({ error: "action ไม่ถูกต้อง" }, { status: 400 });
  } catch (error: any) {
    console.error("[PATCH /api/applications/[id]] Error:", error);
    return NextResponse.json({ error: "เกิดข้อผิดพลาด" }, { status: 500 });
  }
}
