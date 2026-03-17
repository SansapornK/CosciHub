// src/app/api/applications/[id]/route.ts
import { NextResponse } from "next/server";
import dbConnect from "@/libs/mongodb";
import Application from "@/models/Application";
import Job from "@/models/Job";
import User from "@/models/User";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import mongoose from "mongoose";
import { constructFrom } from "date-fns";

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

    const isOwner = job.owner === user.name;
    const isStudent = application.applicantEmail === user.email;


    const { action, progress, rejectionNote } = await req.json();

    if (!isOwner && !isStudent) {
      return NextResponse.json({ error: "ไม่มีสิทธิ์อัปเดตใบสมัครนี้" }, { status: 403 });
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

      return NextResponse.json({ success: true, message: "ปฏิเสธใบสมัครแล้ว" });
    }

    // ── approve (owner ยืนยันงานเสร็จ) ─────
    if (action === "approve" && isOwner) {
      if (application.status !== "submitted") {
        return NextResponse.json({ error: "งานยังไม่ถูกส่ง" }, { status: 400 });
      }
      await Application.findByIdAndUpdate(id, {
        $set: { status: "completed", updatedAt: new Date() },
      });

      // ตรวจสอบว่า job ทุก application เสร็จหมดไหม
      const remainingActive = await Application.countDocuments({
        jobId: application.jobId,
        status: { $in: ["accepted", "in_progress", "submitted", "revision"] },
      });
      if (remainingActive === 0) {
        await (Job as any).findByIdAndUpdate(application.jobId, {
          $set: { status: "completed" },
        });
      }

      return NextResponse.json({ success: true, message: "ยืนยันงานเสร็จสิ้นแล้ว" });
    }

    // ── requestRevision (owner ขอแก้ไข) ────
    if (action === "requestRevision" && isOwner) {
      if (application.status !== "submitted") {
        return NextResponse.json({ error: "งานยังไม่ถูกส่ง" }, { status: 400 });
      }
      await Application.findByIdAndUpdate(id, {
        $set: {
          status: "revision",
          rejectionNote: rejectionNote || null,
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
          status: "in_progress", // ✅ เริ่มทำงานแล้ว
          updatedAt: new Date(),
        },
      });
      return NextResponse.json({ success: true, progress: newProgress });
    }

    // ── submit (นิสิตส่งงาน) ───────────────
    if (action === "submit" && isStudent) {
      if (!["in_progress", "revision"].includes(application.status)) {
        return NextResponse.json({ error: "ไม่สามารถส่งงานได้ในสถานะนี้" }, { status: 400 });
      }
      await Application.findByIdAndUpdate(id, {
        $set: { status: "submitted", progress: 100, updatedAt: new Date() },
      });

      // Job → awaiting เมื่อมีคนส่งงาน
      await (Job as any).findByIdAndUpdate(application.jobId, {
        $set: { status: "awaiting" },
      });

      return NextResponse.json({ success: true, message: "ส่งงานเรียบร้อยแล้ว รอเจ้าของตรวจสอบ" });
    }

    return NextResponse.json({ error: "action ไม่ถูกต้อง" }, { status: 400 });

  } catch (error: any) {
    console.error("[PATCH /api/applications/[id]] Error:", error);
    return NextResponse.json({ error: "เกิดข้อผิดพลาด" }, { status: 500 });
  }
}