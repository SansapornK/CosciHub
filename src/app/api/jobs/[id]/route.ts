import { NextResponse } from "next/server";
import dbConnect from "@/libs/mongodb"; // ไฟล์เชื่อมต่อ DB ของคุณ
import Job from "@/models/Job"; // Model ของงาน

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }  //  เปลี่ยนเป็น Promise
) {
  try {
    await dbConnect();
    
    const { id } = await params;

    // ค้นหางานตาม ID
    const job = await (Job as any).findById(id).lean().exec();

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