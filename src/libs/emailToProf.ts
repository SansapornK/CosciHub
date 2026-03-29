// src/libs/emailToProf.ts
import nodemailer from 'nodemailer';
import crypto from 'crypto';
import AlumniVerification from '@/models/AlumniVerification';

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

interface TeacherVerificationParams {
  toEmails: string[];
  studentName: string;
  studentMajor: string;
  profileImageUrl?: string;
  alumniId: string;    // เพิ่มเพื่อให้สร้าง Token ได้
  alumniEmail: string; // เพิ่มเพื่อให้สร้าง Token ได้
}

// ย้ายฟังก์ชันสร้าง HTML ออกมาด้านนอกเพื่อให้โค้ดอ่านง่ายขึ้น
const generateEmailHTML = (
  studentName: string,
  studentMajor: string,
  displayImage: string,
  approveUrl: string,
  rejectUrl: string
) => `
  <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e0e0e0; border-radius: 12px; overflow: hidden;">
    <div style="background: linear-gradient(135deg, #0047BA, #0066FF); padding: 30px 20px; text-align: center;">
      <h2 style="color: #fff; margin: 0; font-size: 22px;">COSCI HUB</h2>
      <p style="color: #e0e7ff; margin: 5px 0 0; font-size: 13px;">ระบบขอการยืนยันตัวตนศิษย์เก่า</p>
    </div>
    <div style="padding: 30px; color: #333;">
      <p style="font-size: 16px;">เรียน อาจารย์ที่เคารพ,</p>
      <p style="line-height: 1.7; color: #555;">มีผู้ใช้ลงทะเบียนในฐานะ <strong>ศิษย์เก่า</strong> และระบุชื่อท่านเป็นอาจารย์ผู้รับรอง</p>
      <div style="background: #f8fafc; border-radius: 12px; padding: 20px; text-align: center; margin: 20px 0;">
        <img src="${displayImage}" style="width: 80px; height: 80px; border-radius: 50%; object-fit: cover; border: 3px solid #fff; box-shadow: 0 2px 8px rgba(0,0,0,0.1);" alt="Profile"/>
        <h3 style="margin: 12px 0 4px; color: #1e293b;">${studentName}</h3>
        <span style="background: #e0f2fe; color: #0284c7; padding: 4px 14px; border-radius: 20px; font-size: 13px;">สาขา${studentMajor}</span>
      </div>
      <div style="text-align: center; margin: 30px 0;">
        <a href="${approveUrl}" style="display: inline-block; background: #16a34a; color: #fff; padding: 14px 24px; border-radius: 8px; text-decoration: none; font-weight: bold; margin: 5px;">✓ รับรอง / Approve</a>
        <a href="${rejectUrl}" style="display: inline-block; background: #dc2626; color: #fff; padding: 14px 24px; border-radius: 8px; text-decoration: none; font-weight: bold; margin: 5px;">✗ ไม่รับรอง / Reject</a>
      </div>
    </div>
  </div>
`;

export const sendTeacherVerificationEmails = async ({
  toEmails,
  studentName,
  studentMajor,
  profileImageUrl,
  alumniId,
  alumniEmail
}: TeacherVerificationParams) => {
  if (!toEmails || toEmails.length === 0) return;

  const validEmails = [...new Set(toEmails)].filter((email) => 
    email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
  );

  const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
  const displayImage = profileImageUrl || "https://via.placeholder.com/150";

  try {
    await Promise.all(
      validEmails.map(async (teacherEmail) => {
        // --- 1. สร้าง Token และบันทึกลง DB ที่นี่เลย ---
        const token = crypto.randomBytes(32).toString('hex');
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 7); // 7 วัน

        await AlumniVerification.create({
          alumniId,
          alumniEmail,
          alumniName: studentName,
          teacherEmail,
          token,
          expiresAt,
        });

        // --- 2. สร้างลิงก์ ---
        const approveUrl = `${baseUrl}/api/auth/verify-alumni?token=${token}&action=approve`;
        const rejectUrl = `${baseUrl}/api/auth/verify-alumni?token=${token}&action=reject`;

        // --- 3. ส่งเมล ---
        return transporter.sendMail({
          from: `"COSCI HUB" <${process.env.EMAIL_SERVER_USER}>`,
          to: teacherEmail,
          subject: `[ยืนยันตัวตน] ศิษย์เก่า: ${studentName}`,
          html: generateEmailHTML(studentName, studentMajor, displayImage, approveUrl, rejectUrl),
        });
      })
    );
    console.log(`✅ Tokens created and emails sent.`);
    return { success: true };
  } catch (error) {
    console.error('Error in sendTeacherVerificationEmails:', error);
    throw error;
  }
};

