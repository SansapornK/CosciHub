// src/app/api/auth/verify-alumni/route.ts
import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/libs/mongodb';
import User from '@/models/User';
import AlumniVerification from '@/models/AlumniVerification';
import nodemailer from 'nodemailer';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const token = searchParams.get('token');
  const action = searchParams.get('action'); // รับค่า 'approve' หรือ 'reject'

  // 1. Validation เบื้องต้น
  if (!token || !['approve', 'reject'].includes(action || '')) {
    return NextResponse.redirect(new URL('/verify-result?status=invalid', req.url));
  }

  try {
    await connectToDatabase();

    // 2. ค้นหา Token ในฐานข้อมูล
    const verification = await AlumniVerification.findOne({ token });

    if (!verification) {
      return NextResponse.redirect(new URL('/verify-result?status=invalid', req.url));
    }

    // 3. ตรวจสอบเงื่อนไข (Expired / Used)
    if (new Date() > verification.expiresAt) {
      return NextResponse.redirect(new URL('/verify-result?status=expired', req.url));
    }

    if (verification.usedAt) {
      return NextResponse.redirect(new URL('/verify-result?status=already_used', req.url));
    }

    // 4. เตรียมสถานะใหม่
    const isApproveAction = action === 'approve';

    // 5. อัปเดตข้อมูล (Transaction-like updates)
    // อัปเดตสถานะใน User Collection
    const currentUser = await User.findById(verification.alumniId);
    if (!currentUser) {
      return NextResponse.redirect(new URL('/verify-result?status=invalid', req.url));
    }

    // กำหนดสถานะสุดท้ายที่จะบันทึกลง User
    let finalUserStatus: 'approved' | 'rejected' | 'pending' | 'not_required' = currentUser.verificationStatus || 'pending';

    if (isApproveAction) {
      // ถ้าอาจารย์ท่านนี้กด Approve ให้เป็น approved ทันที (เพราะถือว่ามีคนรับรองแล้ว 1 ท่าน)
      finalUserStatus = 'approved';
    } else if (currentUser.verificationStatus !== 'approved') {
      // ถ้าอาจารย์ท่านนี้กด Reject จะเปลี่ยนเป็น rejected เฉพาะเมื่อ "ยังไม่มีอาจารย์ท่านอื่นกด approved" เท่านั้น
      finalUserStatus = 'rejected';
    }

    // อัปเดตสถานะใน Token Collection
    await User.findByIdAndUpdate(verification.alumniId, {
      verificationStatus: finalUserStatus,
      emailVerified: finalUserStatus === 'approved', // จะถือว่า Verified ก็ต่อเมื่อสถานะเป็น approved
      verifiedBy: verification.teacherEmail,         // บันทึกอีเมลอาจารย์ท่านล่าสุดที่ดำเนินการ
      verifiedAt: new Date(),
    });

    // อัปเดตสถานะใน Token Collection ของอาจารย์ท่านนี้โดยเฉพาะ
    await AlumniVerification.findByIdAndUpdate(verification._id, {
      action: isApproveAction ? 'approved' : 'rejected',
      usedAt: new Date(),
    });

    // 6. ส่ง Email แจ้งผลกลับหา Alumni (Non-blocking)
    // ส่งสถานะปัจจุบัน (finalUserStatus) เพื่อให้ศิษย์เก่าทราบผลล่าสุด
    await sendResultEmailToAlumni(
      verification.alumniEmail,
      verification.alumniName,
      finalUserStatus as 'approved' | 'rejected', 
      verification.teacherEmail
    );


    // 7. Redirect ไปหน้า UI แสดงผลความสำเร็จ
    const resultStatus = isApproveAction ? 'approved' : 'rejected';
    const redirectUrl = new URL('/verify-result', req.url);
    redirectUrl.searchParams.set('status', resultStatus);
    redirectUrl.searchParams.set('name', verification.alumniName);
    
    return NextResponse.redirect(redirectUrl);

  } catch (error) {
    console.error('Verification Error:', error);
    return NextResponse.redirect(new URL('/verify-result?status=invalid', req.url));
  }
}

async function sendResultEmailToAlumni(
  email: string,
  name: string,
  status: 'approved' | 'rejected',
  teacherEmail: string
) {
  const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_SERVER_HOST,
    port: Number(process.env.EMAIL_SERVER_PORT),
    secure: process.env.EMAIL_SERVER_PORT === '465',
    auth: {
      user: process.env.EMAIL_SERVER_USER,
      pass: process.env.EMAIL_SERVER_PASSWORD,
    },
  });

  const isApproved = status === 'approved';
  const subject = isApproved 
    ? `[COSCI HUB] ยินดีด้วย! บัญชีของคุณได้รับการอนุมัติแล้ว`
    : `[COSCI HUB] แจ้งผลการตรวจสอบบัญชีของคุณ`;

  const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';

  const html = `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #eee; border-radius: 10px; overflow: hidden;">
      <div style="background: ${isApproved ? '#16a34a' : '#dc2626'}; padding: 20px; text-align: center; color: white;">
        <h2 style="margin: 0;">COSCI HUB</h2>
      </div>
      <div style="padding: 30px;">
        <p>เรียน คุณ ${name},</p>
        <p>ผลการตรวจสอบสถานะศิษย์เก่าของคุณคือ: <strong>${isApproved ? 'ผ่านการอนุมัติ' : 'ไม่ผ่านการอนุมัติ'}</strong></p>
        <p>ตรวจสอบโดยอาจารย์: ${teacherEmail}</p>
        ${isApproved 
          ? `<a href="${baseUrl}/auth?state=login" style="display:inline-block; padding:10px 20px; background:#16a34a; color:white; text-decoration:none; border-radius:5px;">เข้าสู่ระบบเพื่อโพสต์งาน</a>`
          : `<p style="color: red;">ขออภัย อาจารย์ไม่สามารถยืนยันตัวตนของคุณได้ โปรดติดต่อวิทยาลัยหากข้อมูลถูกต้องแต่ถูกปฏิเสธ</p>`
        }
      </div>
    </div>
  `;

  try {
    // แก้ไขจุดนี้: ต้องส่งเป็น Object ครบถ้วน
    await transporter.sendMail({
      from: `"COSCI HUB" <${process.env.EMAIL_SERVER_USER}>`,
      to: email,
      subject: subject,
      html: html,
    });
    console.log(`✅ Result email sent to ${email}`);
  } catch (error) {
    console.error('❌ Error sending result email:', error);
  }
}