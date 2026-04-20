// scr/app/api/jobs/[id]/route.ts
import { NextResponse } from "next/server";
import dbConnect from "@/libs/mongodb";
import Application from "@/models/Application";
import Job from "@/models/Job";
import User from "@/models/User";
import { getServerSession } from "next-auth";
import mongoose from "mongoose";

/* ── GET ── */
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await dbConnect();
    const { id } = await params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: "ID ไม่ถูกต้อง" }, { status: 400 });
    }

    const job = await Job.findById(id).lean();

    if (!job) {
      return NextResponse.json({ error: "ไม่พบข้อมูลงาน" }, { status: 404 });
    }

    return NextResponse.json(job);
  } catch (error) {
    console.error("GET Error:", error);
    return NextResponse.json({ error: "Server Error" }, { status: 500 });
  }
}

/* ── PATCH ── */
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await getServerSession();
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();

    const { id } = await params;

    const user = await User.findOne({ email: session.user.email });
    if (!user) {
      return NextResponse.json({ error: "ไม่พบข้อมูลผู้ใช้" }, { status: 404 });
    }

    // ตรวจสอบว่าเป็นเจ้าของงาน
    const existing = await (Job as any).findById(id).lean().exec();
    if (!existing) {
      return NextResponse.json({ error: "ไม่พบงาน" }, { status: 404 });
    }
    if (existing.ownerId.toString() !== user._id.toString()) {
      return NextResponse.json(
        { error: "ไม่มีสิทธิ์แก้ไขงานนี้" },
        { status: 403 },
      );
    }

    const data = await request.json();

    // Validate เฉพาะตอน publish
    if (data.status === "published") {
      const required = [
        "title",
        "category",
        "shortDescription",
        "description",
        "qualifications",
        "jobType",
        "budgetMin",
        "budgetMax",
        "capacity",
        "applicationDeadline",
      ];
      const missing = required.filter((f) => !data[f]);
      if (missing.length > 0) {
        return NextResponse.json(
          { error: `กรุณากรอกข้อมูลให้ครบ: ${missing.join(", ")}` },
          { status: 400 },
        );
      }
    }

    const allowedStatus = ["published", "draft", "closed"];
    const updatedJob = await (Job as any)
      .findByIdAndUpdate(
        id,
        {
          $set: {
            title: data.title,
            category: data.category,
            shortDescription: data.shortDescription,
            description: data.description,
            qualifications: data.qualifications,
            jobType: data.jobType,
            location: data.location || null,
            deliveryDate: data.deliveryDate
              ? new Date(data.deliveryDate)
              : null,
            budgetMin: Number(data.budgetMin),
            budgetMax: Number(data.budgetMax),
            capacity: Number(data.capacity),
            applicationDeadline: data.applicationDeadline
              ? new Date(data.applicationDeadline)
              : existing.applicationDeadline,
            ownerId: user._id,
            owner: user.name,
            status: allowedStatus.includes(data.status)
              ? data.status
              : existing.status,
          },
        },
        { new: true },
      )
      .lean()
      .exec();

    return NextResponse.json(
      { message: "อัปเดตงานสำเร็จ", job: updatedJob },
      { status: 200 },
    );
  } catch (error: any) {
    console.error("[PATCH /api/jobs/[id]] Error:", error);
    return NextResponse.json(
      { error: "เกิดข้อผิดพลาดภายในเซิร์ฟเวอร์" },
      { status: 500 },
    );
  }
}

/* ── DELETE ── */
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await getServerSession();
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();
    const { id } = await params;

    const user = await User.findOne({ email: session.user.email });
    const job = await (Job as any).findById(id).lean().exec();

    if (!job) {
      return NextResponse.json({ message: "ไม่พบงาน" }, { status: 404 });
    }
    if (job.ownerId.toString() !== user?._id.toString()) {
      return NextResponse.json(
        { error: "ไม่มีสิทธิ์ลบงานนี้" },
        { status: 403 },
      );
    }

    await (Job as any).findByIdAndDelete(id);
    return NextResponse.json({ message: "ลบงานสำเร็จ" }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json(
      { message: "เกิดข้อผิดพลาด", error: error.message },
      { status: 500 },
    );
  }
}
