// src/app/api/auth/reset-password/route.ts
import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import connectDB from "@/libs/mongodb";
import User from "@/models/User";
import PasswordResetToken from "@/models/PasswordResetToken";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { token, newPassword } = body;

    if (!token) {
      return NextResponse.json(
        { error: "ไม่พบ token สำหรับรีเซ็ตรหัสผ่าน" },
        { status: 400 }
      );
    }

    if (!newPassword) {
      return NextResponse.json(
        { error: "กรุณากรอกรหัสผ่านใหม่" },
        { status: 400 }
      );
    }

    if (newPassword.length < 8) {
      return NextResponse.json(
        { error: "รหัสผ่านต้องมีความยาวอย่างน้อย 8 ตัวอักษร" },
        { status: 400 }
      );
    }

    await connectDB();

    // Find token in database
    const resetToken = await PasswordResetToken.findOne({ token });

    if (!resetToken) {
      return NextResponse.json(
        { error: "ลิงก์รีเซ็ตรหัสผ่านไม่ถูกต้อง", code: "invalid" },
        { status: 400 }
      );
    }

    // Check if token is expired
    if (new Date() > resetToken.expiresAt) {
      return NextResponse.json(
        { error: "ลิงก์รีเซ็ตรหัสผ่านหมดอายุแล้ว กรุณาขอลิงก์ใหม่", code: "expired" },
        { status: 400 }
      );
    }

    // Check if token is already used
    if (resetToken.usedAt) {
      return NextResponse.json(
        { error: "ลิงก์นี้ถูกใช้งานไปแล้ว กรุณาขอลิงก์ใหม่", code: "used" },
        { status: 400 }
      );
    }

    // Find user by email
    const user = await User.findOne({ email: resetToken.email });

    if (!user) {
      return NextResponse.json(
        { error: "ไม่พบบัญชีผู้ใช้", code: "invalid" },
        { status: 400 }
      );
    }

    // Hash new password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    // Update user password
    await User.findByIdAndUpdate(user._id, {
      password: hashedPassword,
    });

    // Mark token as used
    await PasswordResetToken.findByIdAndUpdate(resetToken._id, {
      usedAt: new Date(),
    });

    return NextResponse.json({
      success: true,
      message: "รีเซ็ตรหัสผ่านสำเร็จ",
    });
  } catch (error) {
    console.error("Error in reset-password:", error);
    return NextResponse.json(
      { error: "เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง" },
      { status: 500 }
    );
  }
}

// GET endpoint to validate token
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get("token");

    if (!token) {
      return NextResponse.json(
        { valid: false, error: "ไม่พบ token", code: "invalid" },
        { status: 400 }
      );
    }

    await connectDB();

    const resetToken = await PasswordResetToken.findOne({ token });

    if (!resetToken) {
      return NextResponse.json(
        { valid: false, error: "ลิงก์ไม่ถูกต้อง", code: "invalid" },
        { status: 400 }
      );
    }

    if (new Date() > resetToken.expiresAt) {
      return NextResponse.json(
        { valid: false, error: "ลิงก์หมดอายุแล้ว", code: "expired" },
        { status: 400 }
      );
    }

    if (resetToken.usedAt) {
      return NextResponse.json(
        { valid: false, error: "ลิงก์ถูกใช้งานไปแล้ว", code: "used" },
        { status: 400 }
      );
    }

    return NextResponse.json({
      valid: true,
      email: resetToken.email,
    });
  } catch (error) {
    console.error("Error validating reset token:", error);
    return NextResponse.json(
      { valid: false, error: "เกิดข้อผิดพลาด" },
      { status: 500 }
    );
  }
}
