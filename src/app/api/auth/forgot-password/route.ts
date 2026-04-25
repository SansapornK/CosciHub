// src/app/api/auth/forgot-password/route.ts
import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import nodemailer from "nodemailer";
import connectDB from "@/libs/mongodb";
import User from "@/models/User";
import PasswordResetToken from "@/models/PasswordResetToken";

const port = Number(process.env.EMAIL_SERVER_PORT);
const isSecure = port === 465;

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_SERVER_HOST,
  port: port,
  secure: isSecure,
  auth: {
    user: process.env.EMAIL_SERVER_USER,
    pass: process.env.EMAIL_SERVER_PASSWORD,
  },
});

const generateResetEmailHTML = (resetUrl: string, userName: string) => `
  <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e0e0e0; border-radius: 12px; overflow: hidden;">
    <div style="background: linear-gradient(135deg, #0047BA, #0066FF); padding: 30px 20px; text-align: center;">
      <h2 style="color: #fff; margin: 0; font-size: 22px;">COSCI HUB</h2>
      <p style="color: #e0e7ff; margin: 5px 0 0; font-size: 13px;">รีเซ็ตรหัสผ่าน</p>
    </div>
    <div style="padding: 30px; color: #333;">
      <p style="font-size: 16px;">สวัสดี คุณ${userName},</p>
      <p style="line-height: 1.7; color: #555;">
        เราได้รับคำขอรีเซ็ตรหัสผ่านสำหรับบัญชีของคุณ หากคุณไม่ได้ขอรีเซ็ตรหัสผ่าน กรุณาเพิกเฉยอีเมลนี้
      </p>
      <p style="line-height: 1.7; color: #555;">
        ลิงก์นี้จะหมดอายุภายใน <strong>1 ชั่วโมง</strong>
      </p>
      <div style="text-align: center; margin: 30px 0;">
        <a href="${resetUrl}" style="display: inline-block; background: #0066FF; color: #fff; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: bold;">
          ตั้งรหัสผ่านใหม่
        </a>
      </div>
      <p style="font-size: 12px; color: #888; text-align: center;">
        หากปุ่มไม่ทำงาน กรุณาคัดลอกลิงก์นี้ไปวางในเบราว์เซอร์:<br/>
        <a href="${resetUrl}" style="color: #0066FF; word-break: break-all;">${resetUrl}</a>
      </p>
    </div>
    <div style="background: #f8fafc; padding: 20px; text-align: center; border-top: 1px solid #e0e0e0;">
      <p style="font-size: 12px; color: #888; margin: 0;">
        COSCI HUB - ระบบหางานสำหรับนิสิตวิทยาลัยนวัตกรรมสื่อสารสังคม
      </p>
    </div>
  </div>
`;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email } = body;

    if (!email) {
      return NextResponse.json(
        { error: "กรุณากรอกอีเมล" },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: "รูปแบบอีเมลไม่ถูกต้อง" },
        { status: 400 }
      );
    }

    await connectDB();

    // Find user by email
    const user = await User.findOne({ email: email.toLowerCase() });

    // Always return success message for security (don't reveal if email exists)
    // But only send email if user exists
    if (user) {
      // Invalidate any existing tokens for this email
      await PasswordResetToken.updateMany(
        { email: email.toLowerCase(), usedAt: null },
        { $set: { usedAt: new Date() } }
      );

      // Generate new token
      const token = crypto.randomBytes(32).toString("hex");
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + 1); // 1 hour expiration

      // Save token to database
      await PasswordResetToken.create({
        email: email.toLowerCase(),
        token,
        expiresAt,
      });

      // Generate reset URL
      const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";
      const resetUrl = `${baseUrl}/reset-password?token=${token}`;

      // Send email
      try {
        await transporter.sendMail({
          from: `"COSCI HUB" <${process.env.EMAIL_SERVER_USER}>`,
          to: email,
          subject: "[COSCI HUB] รีเซ็ตรหัสผ่านของคุณ",
          html: generateResetEmailHTML(resetUrl, user.name || user.firstName),
        });
        console.log(`✅ Password reset email sent to ${email}`);
      } catch (emailError) {
        console.error("Error sending password reset email:", emailError);
        // Don't reveal email sending errors to user
      }
    }

    // Always return success for security
    return NextResponse.json({
      success: true,
      message: "หากอีเมลนี้มีอยู่ในระบบ คุณจะได้รับลิงก์รีเซ็ตรหัสผ่านทางอีเมล",
    });
  } catch (error) {
    console.error("Error in forgot-password:", error);
    return NextResponse.json(
      { error: "เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง" },
      { status: 500 }
    );
  }
}
