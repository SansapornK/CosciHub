// src/app/api/applications/[id]/route.ts
import { NextResponse } from "next/server";
import dbConnect from "@/libs/mongodb";
import Application from "@/models/Application";
import Job from "@/models/Job";
import User from "@/models/User";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import mongoose, { Types } from "mongoose";
import { constructFrom } from "date-fns";


export async function GET(
  req: Request, 
  { params }: { params: Promise<{ id: string }> } 
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

    return NextResponse.json({ application: application });
  } catch (error) {
    return NextResponse.json({ error: "Server Error" }, { status: 500 });
  }
}

// ─── Helper สำหรับอัปเดต Job Progress ───
async function updateJobAverageProgress(jobId: string) {
  const applications = await Application.find({
    jobId: jobId,
    status: { $in: ["accepted", "in_progress", "submitted", "revision", "completed"] }
  });

  if (applications.length > 0) {
    const totalProgress = applications.reduce((sum, app) => sum + (app.progress || 0), 0);
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
  
  const allApplicantIds = [...new Set(allApplications.map((app: any) => app.applicantId))];
  
  const assignedWorkerIds = [...new Set(allApplications
    .filter((app: any) => 
      ["accepted", "in_progress", "submitted", "revision", "completed"].includes(app.status)
    )
    .map((app: any) => app.applicantId))];

  const JobModel = (mongoose.models.Job || Job) as any;

  await JobModel.findByIdAndUpdate(cleanJobId, {
    $set: {
      applicants: allApplicantIds,
      assignedTo: assignedWorkerIds
    }
  });
}

// ─── เพิ่ม Helper สำหรับสรุปงานไปที่ Job ──────────────────────
async function syncJobSubmissions(jobId: string) {
  const apps = await Application.find({ jobId }).lean();
  
  const submissionsSummary = apps.map((a: any) => ({
    applicationId:   a._id,
    applicantName:   a.applicantName,
    status:          a.status,
    hasLink:         !!a.workLink,
    hasFiles:        (a.attachments?.length || 0) > 0,
    lastSubmittedAt: a.updatedAt
  }));

  const JobModel = (mongoose.models.Job || Job) as any;
  await JobModel.findByIdAndUpdate(jobId, {
    $set: { allSubmissions: submissionsSummary }
  });
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();
    const { id } = await params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Application ID ไม่ถูกต้อง" }, { status: 400 });
    }

    const user = await User.findOne({ email: session.user.email });
    if (!user) {
      return NextResponse.json({ error: "ไม่พบผู้ใช้" }, { status: 404 });
    }

    // ดึง application
    const application = await Application.findById(id).lean() as any;
    if (!application) {
      return NextResponse.json({ error: "ไม่พบใบสมัคร" }, { status: 404 });
    }

    // ตรวจสอบว่า user เป็นเจ้าของงานนั้น
    const job = await (Job as any).findById(application.jobId).lean();
    if (!job) return NextResponse.json({ error: "ไม่พบข้อมูลงาน" }, { status: 404 });

    // const isOwner = job.owner === user.name;
    const isOwner = job.owner?.trim().toLowerCase() === user.name?.trim().toLowerCase();
    const isStudent = application.applicantEmail === user.email;


    // const { action, progress, rejectionNote, workLink, note, feedback } = await req.json();
    const { action, progress, rejectionNote, workLink, note, feedback, attachments, rating, comment, isAnonymous, role } = await req.json();

    if (!isOwner && !isStudent) {
      return NextResponse.json({ error: "ไม่มีสิทธิ์อัปเดตใบสมัครนี้" }, { status: 403 });
    }

    // ─── ✅ 1. submitReview ──────────────────────────────────────────
    if (action === "submitReview") {
      const updateData: any = {};

      if (role === 'student' && isStudent) {
        if (application.status !== 'completed') {
           return NextResponse.json({ error: "ต้องรองานเสร็จสิ้นก่อนจึงจะรีวิวได้" }, { status: 400 });
        }
        updateData.studentReview = { 
          rating: Number(rating), 
          comment: comment, 
          isAnonymous: isAnonymous ?? true, 
          createdAt: new Date() 
        };
      } 
     else if (role === 'owner' && isOwner) {
        updateData.ownerReview = { 
          rating: Number(rating), 
          comment: comment, 
          isAnonymous: isAnonymous ?? false, 
          createdAt: new Date() 
        };
        
        updateData.status = "completed";
        updateData.progress = 100;
      } else {
        return NextResponse.json({ error: "ไม่มีสิทธิ์เข้าถึงส่วนนี้" }, { status: 400 });
      }
      const updated = await Application.findByIdAndUpdate(id, { $set: updateData }, { new: true });

      // ถ้าเป็นเจ้าของงานรีวิว ต้อง Sync สถานะ Job ใหญ่ด้วย
      if (role === 'owner') {
        await updateJobAverageProgress(application.jobId.toString());
        await syncJobParticipants(application.jobId.toString());
        
        const remainingActive = await Application.countDocuments({
          jobId: application.jobId,
          status: { $in: ["accepted", "in_progress", "submitted", "revision"] },
        });
        if (remainingActive === 0) {
          await (Job as any).findByIdAndUpdate(application.jobId, { $set: { status: "completed" } });
        }
      }
      return NextResponse.json({ success: true, application: updated });
    }

    // ── accept ─────────────────────────────────────────────────────────────
    if (action === "accept" && isOwner) {      // ตรวจสอบ quota
      // ตรวจสอบ quota
      const capacity = job.capacity || 1;
      const acceptedCount = await Application.countDocuments({
        jobId: application.jobId,
        status: { $in: ["accepted", "in_progress", "submitted", "revision", "completed"] },
      });

      if (acceptedCount >= capacity) {
        return NextResponse.json(
          { error: `รับครบ ${capacity} คนแล้ว` },
          { status: 400 }
        );
      }

      await Application.findByIdAndUpdate(id, {
        $set: { status: "accepted", updatedAt: new Date() },
      });

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

      await syncJobParticipants(application.jobId.toString());

      return NextResponse.json({ success: true, message: "ปฏิเสธใบสมัครแล้ว" });
    }

    // ─── 2. approve (ยืนยันงานเสร็จ) ──────────────────────────────────
    if (action === "approve" && isOwner) {
      if (application.status !== "submitted") return NextResponse.json({ error: "งานยังไม่ถูกส่ง" }, { status: 400 });
      
      await Application.findByIdAndUpdate(id, {
        $set: { 
          status: "completed", 
          progress: 100, 
          feedback: feedback || "ทำงานได้ยอดเยี่ยมมาก!", 
          updatedAt: new Date() 
        },
      });

      await updateJobAverageProgress(application.jobId.toString());
      await syncJobParticipants(application.jobId.toString());

      const remainingActive = await Application.countDocuments({
        jobId: application.jobId,
        status: { $in: ["accepted", "in_progress", "submitted", "revision"] },
      });
      if (remainingActive === 0) {
        await (Job as any).findByIdAndUpdate(application.jobId, { $set: { status: "completed" } });
      }
      return NextResponse.json({ success: true });
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
      return NextResponse.json({ success: true, message: "ส่งคำขอแก้ไขแล้ว" });
    }

    // student
    // ── updateProgress (นิสิตอัปเดต %) ────
    if (action === "updateProgress" && isStudent) {
      if (!["accepted", "in_progress", "revision"].includes(application.status)) {
        return NextResponse.json({ error: "ไม่สามารถอัปเดต progress ได้" }, { status: 400 });
      }
      const newProgress = Math.min(100, Math.max(0, Number(progress)));
      await Application.findByIdAndUpdate(id, {
        $set: {
          progress: newProgress,
          status: "in_progress", // เริ่มทำงาน
          updatedAt: new Date(),
        },
      });
      await updateJobAverageProgress(application.jobId.toString());

      return NextResponse.json({ success: true, progress: newProgress });
    }

    // ─── 3. submit (นิสิตส่งงาน - คลีนโค้ดแล้ว) ───────────────────────
    if (action === "submit" && isStudent) {
      if (!["in_progress", "revision", "accepted", "submitted"].includes(application.status)) {
        return NextResponse.json({ error: "ไม่สามารถส่งงานได้ในสถานะนี้" }, { status: 400 });
      }

      await Application.findByIdAndUpdate(id, {
        $set: { 
          status: "submitted", 
          progress: 100, 
          workLink: workLink, 
          attachments: attachments || [], 
          updatedAt: new Date() 
        },
      });

      await (Job as any).findByIdAndUpdate(application.jobId, { $set: { status: "awaiting" } });
      await syncJobSubmissions(application.jobId.toString());
      await updateJobAverageProgress(application.jobId.toString());

      return NextResponse.json({ success: true, message: "ส่งงานเรียบร้อยแล้ว" });
    }
    return NextResponse.json({ error: "action ไม่ถูกต้อง" }, { status: 400 });

  } catch (error: any) {
    console.error("[PATCH /api/applications/[id]] Error:", error);
    return NextResponse.json({ error: "เกิดข้อผิดพลาด" }, { status: 500 });
  }
}