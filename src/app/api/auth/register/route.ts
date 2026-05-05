// src/app/api/auth/register/route.ts
import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/libs/mongodb';
import User from '@/models/User';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { sendTeacherVerificationEmails } from '@/libs/emailToProf';
import { notifyWelcomeCompleteProfile, notifyAlumniPendingVerification } from '@/utils/notificationUtils';

export async function GET() {
  return NextResponse.json(
    { error: 'Method not allowed. Use POST to register.' },
    { status: 405 }
  );
}

export async function POST(req: NextRequest) {
  try {
    // Connect to the database
    await connectToDatabase();

    // Parse JSON body (files are already uploaded to Cloudinary from client)
    const body = await req.json();

    const {
      email,
      password,
      firstName,
      lastName,
      role,
      major,
      bio = '',
      contactInfo = [],
      profileImageUrl,
      studentId,
      skills = [],
      portfolioFileUrl,
      portfolioFileName,
      portfolioFileSize,
      galleryImageUrls = [],
      teacherEmails = [],
      interestedJobs = [],
    } = body;

    const name = `${firstName} ${lastName}`;

    if (!email || !password || !firstName || !lastName || !role || !major) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email }).exec();
    if (existingUser) {
      return NextResponse.json(
        { error: 'User with this email already exists' },
        { status: 400 }
      );
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    // สร้างอ็อบเจกต์ข้อมูลผู้ใช้พื้นฐาน
    const userData: Record<string, unknown> = {
      name,
      firstName,
      lastName,
      email,
      role,
      major,
      bio,
      contactInfo,
      emailVerified: true,
      password: hashedPassword,
      interestedJobs,
    };

    // Add profile image URL if provided (already uploaded from client)
    if (profileImageUrl) {
      userData.profileImageUrl = profileImageUrl;
    }

    // เพิ่มข้อมูลเฉพาะสำหรับนิสิตเท่านั้น
    if (role === 'student') {
      if (!studentId) {
        return NextResponse.json(
          { error: 'Student ID is required for students' },
          { status: 400 }
        );
      }

      // ตรวจสอบว่ารหัสนิสิตไม่ซ้ำ
      const existingStudentId = await User.findOne({ studentId }).exec();
      if (existingStudentId) {
        return NextResponse.json(
          { error: 'Student ID is already registered' },
          { status: 400 }
        );
      }

      userData.studentId = studentId;
      userData.skills = Array.isArray(skills) ? skills : [];

      // Add portfolio file if URL provided (already uploaded from client)
      if (portfolioFileUrl) {
        userData.resumeFiles = [{
          name: portfolioFileName || 'portfolio.pdf',
          url: portfolioFileUrl,
          size: portfolioFileSize ? `${(portfolioFileSize / 1024).toFixed(2)} KB` : '0 KB',
          uploadedAt: new Date(),
        }];
      }

      // Add gallery images if URLs provided (already uploaded from client)
      if (galleryImageUrls && galleryImageUrls.length > 0) {
        userData.galleryImages = galleryImageUrls;
      }
    }

    console.log("Creating user with data:", userData);

    // สร้างผู้ใช้ใหม่
    const user = new User(userData);
    await user.save();

    // Get the user ID from the saved user
    const userId = user._id.toString();

    // ส่ง notification ยินดีต้อนรับ & แนะนำให้อัปเดตโปรไฟล์ (เฉพาะนิสิต)
    if (role === 'student') {
      notifyWelcomeCompleteProfile(userId).catch(err =>
        console.error('Welcome notification failed:', err)
      );
    }

    // ส่ง notification แจ้งศิษย์เก่าว่าบัญชียังรอการยืนยัน
    if (role === 'alumni') {
      notifyAlumniPendingVerification(userId).catch(err =>
        console.error('Alumni pending verification notification failed:', err)
      );
    }

    // สร้างข้อมูลสำหรับการตอบกลับ
    const responseData: Record<string, unknown> = {
      success: true,
      user: {
        id: userId,
        name,
        email,
        role,
        profileImageUrl: user.profileImageUrl
      }
    };

    // เพิ่มข้อมูลสำหรับนิสิตเท่านั้น
    if (role === 'student') {
      (responseData.user as Record<string, unknown>).galleryImages = user.galleryImages;
    }

    // ส่งอีเมลยืนยันตัวตนให้อาจารย์ (สำหรับศิษย์เก่า)
    if (role === 'alumni' && teacherEmails && teacherEmails.length > 0) {
      sendTeacherVerificationEmails({
        toEmails: teacherEmails,
        studentName: name,
        studentMajor: major,
        profileImageUrl: user.profileImageUrl,
        alumniId: userId,
        alumniEmail: email
      }).catch(err => console.error('Background email sending failed:', err));
    }

    return NextResponse.json(responseData, { status: 201 });
  } catch (error) {
    console.error('Registration error:', error);

    // Check if it's a MongoDB duplicate key error
    if (error instanceof mongoose.Error.ValidationError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.message },
        { status: 400 }
      );
    }

    // ส่งข้อความผิดพลาดที่ชัดเจน
    const errorMessage = error instanceof Error ? error.message : 'Something went wrong during registration';

    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}
