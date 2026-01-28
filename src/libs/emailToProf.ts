// src/libs/emailToProf.ts
import nodemailer from 'nodemailer';

const port = Number(process.env.EMAIL_SERVER_PORT);
    const isSecure = port === 465;

// 1. ตั้งค่า Transporter (ควรทำครั้งเดียว)
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_SERVER_HOST,
  port: port,
  secure: isSecure,
  service: 'gmail', // หรือ host อื่นตามที่ใช้งาน
  auth: {
    user: process.env.EMAIL_SERVER_USER,
    pass: process.env.EMAIL_SERVER_PASSWORD,
  },
});

interface TeacherVerificationParams {
  toEmails: string[];
  studentName: string;
  studentMajor: string;
  profileImageUrl: string;
}

// 2. ฟังก์ชันส่งอีเมลสำหรับยืนยันตัวตนศิษย์เก่า
export const sendTeacherVerificationEmails = async ({
  toEmails,
  studentName,
  studentMajor,
  profileImageUrl,
}: TeacherVerificationParams) => {
  if (!toEmails || toEmails.length === 0) return;

  // กรองอีเมลที่ซ้ำและไม่ถูกต้องออก
  const validEmails = [...new Set(toEmails)].filter((email) => 
    email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
  );

  if (validEmails.length === 0) return;

  // รูปภาพ Placeholder กรณีไม่มีรูป
  const displayImage = profileImageUrl || "https://via.placeholder.com/150";

  // HTML Template
  const emailContent = `
    <div style="font-family: 'Sarabun', sans-serif, Arial; max-width: 600px; margin: 0 auto; border: 1px solid #e0e0e0; border-radius: 12px; overflow: hidden; background-color: #ffffff; box-shadow: 0 4px 6px rgba(0,0,0,0.05);">
       <div style="background: linear-gradient(135deg, #0047BA 0%, #0066FF 100%); padding: 30px 20px; text-align: center;">
         <h2 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 600;">ข้อมูลศิษย์เก่า</h2>
         <p style="color: #e0e7ff; margin: 5px 0 0; font-size: 14px;">COSCI HUB SYSTEM</p>
       </div>
       
       <div style="padding: 30px; color: #333;">
         <p style="font-size: 16px; margin-bottom: 20px;">เรียน อาจารย์ที่เคารพ,</p>
         <p style="font-size: 16px; line-height: 1.6; color: #4b5563; margin-bottom: 30px;">
           ระบบได้รับข้อมูลการลงทะเบียนผู้ใช้ที่เป็นศิษย์เก่าวิทยาลัยนวัตกรรมสื่อสารสังคม ชื่อ <strong>${studentName}</strong> 
           และผู้ใช้นี้ได้ระบุชื่อท่านเป็นอาจารย์ที่ปรึกษาหรือผู้สอนเพื่อเป็นข้อมูลยืนยันตัวตน
         </p>
         
         <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 16px; padding: 25px; text-align: center; margin-bottom: 30px;">
            <div style="width: 120px; height: 120px; margin: 0 auto 15px; padding: 4px; background-color: #fff; border-radius: 50%; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
              <img src="${displayImage}" alt="Profile" style="width: 100%; height: 100%; border-radius: 50%; object-fit: cover;">
            </div>
            <h3 style="margin: 0 0 5px; color: #1e293b; font-size: 20px;">${studentName}</h3>
            <div style="display: inline-block; background-color: #e0f2fe; color: #0284c7; padding: 4px 12px; border-radius: 20px; font-size: 14px; font-weight: 500;">
              สาขา${studentMajor}
            </div>
         </div>

         <p style="font-size: 14px; color: #94a3b8; text-align: center; margin-top: 40px; border-top: 1px solid #f1f5f9; padding-top: 20px;">
           นี่เป็นอีเมลแจ้งเตือนอัตโนมัติจากระบบ COSCI HUB<br>
           หากท่านไม่รู้จักบุคคลนี้ สามารถเพิกเฉยต่ออีเมลฉบับนี้ได้
         </p>
       </div>
    </div>
  `;

  try {
    // ส่งอีเมลแบบ Parallel (ส่งพร้อมกันทุกฉบับ ไม่ต้องรอทีละคน)
    await Promise.all(
      validEmails.map((email) =>
        transporter.sendMail({
          from: `"COSCI HUB" <${process.env.EMAIL_SERVER_USER}>`,
          to: email,
          subject: `[ข้อมูลผู้ใช้] ศิษย์เก่า: ${studentName}`,
          html: emailContent,
        })
      )
    );
    console.log(`Verification emails sent to ${validEmails.length} recipients.`);
    return { success: true };
  } catch (error) {
    console.error('Error sending emails:', error);
    return { success: false, error };
  }
};