// src/app/api/users/check-email/route.ts
import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/libs/mongodb';
import User from '@/models/User';
import AllowedEmail from '@/models/AllowedEmail';

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const email = url.searchParams.get('email');
    const role = url.searchParams.get('role');

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    // เชื่อมต่อกับฐานข้อมูล
    await connectToDatabase();

    // ตรวจสอบว่าอีเมลมีในระบบหรือไม่
    const user = await User.findOne({ email: email.toLowerCase() }).exec();

    // ถ้าเป็น role teacher ให้ตรวจสอบว่าอีเมลอยู่ใน allowedEmails หรือไม่
    let isAllowed = true;
    if (role === 'teacher') {
      const allowedEmail = await AllowedEmail.findOne({
        email: email.toLowerCase(),
        isActive: true
      }).exec();
      isAllowed = !!allowedEmail;
    }

    // ส่งผลลัพธ์การตรวจสอบ
    return NextResponse.json({
      exists: !!user,
      isAllowed: isAllowed
    });
  } catch (error) {
    console.error('Error checking email:', error);
    return NextResponse.json(
      { error: 'Something went wrong while checking email' },
      { status: 500 }
    );
  }
}