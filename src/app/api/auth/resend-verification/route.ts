// src/app/api/auth/resend-verification/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../[...nextauth]/route";
import connectDB from "@/libs/mongodb";
import User from "@/models/User";
import AlumniVerification from "@/models/AlumniVerification";
import { sendTeacherVerificationEmails } from "@/libs/emailToProf";

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json(
        { error: "กรุณาเข้าสู่ระบบ" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { teacherEmails } = body;

    // Validate teacher emails
    if (!teacherEmails || !Array.isArray(teacherEmails)) {
      return NextResponse.json(
        { error: "กรุณาระบุอีเมลอาจารย์" },
        { status: 400 }
      );
    }

    // Filter valid emails
    const validEmails = [...new Set(teacherEmails)].filter(
      (email: string) => email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())
    );

    if (validEmails.length < 2) {
      return NextResponse.json(
        { error: "กรุณาระบุอีเมลอาจารย์ที่ถูกต้องอย่างน้อย 2 ท่าน" },
        { status: 400 }
      );
    }

    await connectDB();

    const user = await User.findOne({ email: session.user.email });

    if (!user) {
      return NextResponse.json(
        { error: "ไม่พบข้อมูลผู้ใช้" },
        { status: 404 }
      );
    }

    if (user.role !== "alumni") {
      return NextResponse.json(
        { error: "ฟีเจอร์นี้สำหรับศิษย์เก่าเท่านั้น" },
        { status: 400 }
      );
    }

    if (user.verificationStatus !== "pending") {
      return NextResponse.json(
        { error: "บัญชีของคุณได้รับการยืนยันแล้วหรือไม่อยู่ในสถานะรอยืนยัน" },
        { status: 400 }
      );
    }

    // Mark all old tokens as invalidated
    await AlumniVerification.updateMany(
      { alumniId: user._id, invalidated: { $ne: true } },
      { $set: { invalidated: true } }
    );

    // Send verification emails with new tokens
    await sendTeacherVerificationEmails({
      toEmails: validEmails,
      studentName: user.name,
      studentMajor: user.major,
      profileImageUrl: user.profileImageUrl,
      alumniId: user._id.toString(),
      alumniEmail: user.email,
    });

    return NextResponse.json({
      success: true,
      message: "ส่งอีเมลยืนยันไปยังอาจารย์เรียบร้อยแล้ว",
      teacherCount: validEmails.length,
    });
  } catch (error) {
    console.error("Error in resend-verification:", error);
    return NextResponse.json(
      { error: "เกิดข้อผิดพลาดในการส่งอีเมล กรุณาลองใหม่อีกครั้ง" },
      { status: 500 }
    );
  }
}
