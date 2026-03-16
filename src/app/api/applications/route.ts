// app/api/applications/route.ts
import { NextResponse } from "next/server";
import dbConnect from "@/libs/mongodb"; 
import Application from "@/models/Application";
import Job from "@/models/Job";
import User from "@/models/User";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export async function POST(req: Request) {
  try {

    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();

    // ดึงข้อมูล User 
    const user = await User.findOne({ email: session.user.email });
    if (!user) {
      return NextResponse.json({ error: "ไม่พบข้อมูลผู้ใช้ในระบบ" }, { status: 404 });
    }

    const { jobId } = await req.json();
    if (!jobId) {
      return NextResponse.json({ error: "กรุณาระบุรหัสงาน" }, { status: 400 });
    }

    //ตรวจสอบข้อมูลงานที่จะสมัคร
    const job = await (Job as any).findById(jobId).lean().exec();
    if (!job) {
      return NextResponse.json({ error: "ไม่พบข้อมูลงานนี้" }, { status: 404 });
    }

    // ตรวจสอบว่าเป็นงานตัวเองหรือไม่
    if (job.owner === user.name) {
      return NextResponse.json({ error: "คุณไม่สามารถสมัครงานที่คุณเป็นเจ้าของได้" }, { status: 400 });
    }


    const newApplication = await Application.create({
      jobId: jobId,
      applicantEmail: user.email,
      applicantName: user.name, // ใช้ชื่อจาก DB แทน session เพื่อความถูกต้อง
      status: "pending",
      appliedDate: new Date()
    });

    return NextResponse.json(
      { message: "ส่งใบสมัครเรียบร้อยแล้ว", application: newApplication },
      { status: 201 }
    );

  } catch (error: any) {
    console.error("[POST /api/applications] Error:", error);

    // กรณีสมัครซ้ำ
    if (error.code === 11000) {
      return NextResponse.json(
        { error: "คุณได้ส่งใบสมัครงานนี้ไปแล้ว" },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "เกิดข้อผิดพลาดภายในเซิร์ฟเวอร์", details: error.message },
      { status: 500 }
    );
  }
}