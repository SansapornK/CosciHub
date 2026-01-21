import { NextResponse } from "next/server";
import dbConnect from "@/libs/mongodb"; // ไฟล์เชื่อมต่อ DB ของคุณ
import Job from "@/models/Job"; // Model ของงาน

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    await dbConnect();
    
    const { id } = params;

    // ค้นหางานตาม ID
    const job = await Job.findById(id);

    if (!job) {
      return NextResponse.json(
        { message: "ไม่พบข้อมูลงาน" },
        { status: 404 }
      );
    }

    return NextResponse.json(job, { status: 200 });
  } catch (error: any) {
    return NextResponse.json(
      { message: "เกิดข้อผิดพลาดในการดึงข้อมูล", error: error.message },
      { status: 500 }
    );
  }
}