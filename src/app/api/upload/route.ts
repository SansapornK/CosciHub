import { NextResponse } from "next/server";
import cloudinary from "@/libs/cloudinary"; // นำเข้าตัวที่ config ไว้แล้ว

export async function POST(req: Request) {
  try {
    const { fileStr, fileName } = await req.json();

    if (!fileStr) {
      return NextResponse.json({ error: "ไม่พบข้อมูลไฟล์" }, { status: 400 });
    }

    // ✅ ใช้ cloudinary.uploader.upload โดยตรง
    const uploadResponse = await cloudinary.uploader.upload(fileStr, {
      resource_type: "auto", // รองรับทุกนามสกุลไฟล์
      folder: "coscihub_submissions",
      // กำหนดชื่อไฟล์ให้ไม่ซ้ำและอ่านง่าย
      public_id: `submission_${Date.now()}_${fileName.split('.')[0]}`, 
    });

    return NextResponse.json({
      url: uploadResponse.secure_url,
      public_id: uploadResponse.public_id,
      size: uploadResponse.bytes,
    });
  } catch (error: any) {
    console.error("Cloudinary Upload Error:", error);
    return NextResponse.json(
      { error: "อัปโหลดไฟล์ไม่สำเร็จ", details: error.message }, 
      { status: 500 }
    );
  }
}