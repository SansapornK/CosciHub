// src/app/api/applications/[id]/route.ts
import { NextResponse } from "next/server";
import dbConnect from "@/libs/mongodb";
import Application from "@/models/Application";
import Job from "@/models/Job";
import User from "@/models/User";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import mongoose from "mongoose";

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
    if (!job) {
      return NextResponse.json({ error: "ไม่พบข้อมูลงาน" }, { status: 404 });
    }
    if (job.owner !== user.name) {
      return NextResponse.json({ error: "ไม่มีสิทธิ์อัปเดตใบสมัครนี้" }, { status: 403 });
    }

    const { action, rejectionNote } = await req.json();

    // ── accept ─────────────────────────────────────────────────────────────
    if (action === "accept") {
      // ตรวจสอบ quota
      const capacity = job.capacity || 1;
      const acceptedCount = await Application.countDocuments({
        jobId: application.jobId,
        status: "accepted",
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
          $set: { status: "closed" },
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
    if (action === "reject") {
      await Application.findByIdAndUpdate(id, {
        $set: {
          status: "rejected",
          rejectionNote: rejectionNote || null,
          updatedAt: new Date(),
        },
      });

      return NextResponse.json({ success: true, message: "ปฏิเสธใบสมัครแล้ว" });
    }

    return NextResponse.json({ error: "action ไม่ถูกต้อง (accept | reject)" }, { status: 400 });

  } catch (error: any) {
    console.error("[PATCH /api/applications/[id]] Error:", error);
    return NextResponse.json({ error: "เกิดข้อผิดพลาด" }, { status: 500 });
  }
}