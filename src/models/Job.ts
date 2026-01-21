// models/Job.ts
import mongoose from "mongoose";

const JobSchema = new mongoose.Schema({
  // --- ส่วนซ้ายของฟอร์ม ---
  title: { type: String, required: true },          // ชื่องาน *
  category: { type: String, required: true },       // ประเภทงาน *
  shortDescription: { type: String, required: true }, // คำอธิบายงาน (สรุปสั้น) *
  description: { type: String, required: true },      // รายละเอียดงาน (แบบละเอียด) *
  qualifications: { type: String, required: true },   // คุณสมบัติผู้สมัคร *
  attachments: { type: String },                    // ไฟล์แนบ (เก็บเป็น URL ของไฟล์)

  // --- ส่วนขวาของฟอร์ม ---
  jobType: { 
    type: String, 
    required: true,
    enum: ["ออนไซต์", "ออนไลน์", "ทั้งออนไซต์และออนไลน์"] // รูปแบบงาน *
  },
  location: { type: String },                        // สถานที่ (ไม่บังคับถ้าเป็นออนไลน์ 100%)
  duration: { type: String, required: true },        // ระยะเวลาการทำงาน *
  deliveryDate: { type: Date },                      // วันครบกำหนดส่งงาน
  budgetMin: { type: Number, required: true },       // ค่าตอบแทน (เริ่มต้น) *
  budgetMax: { type: Number, required: true },       // ค่าตอบแทน (สูงสุด) *
  capacity: { type: Number, required: true },        // จำนวนรับ *
  applicationDeadline: { type: Date, required: true }, // วันสิ้นสุดการรับสมัคร *

  // --- ข้อมูลระบบ ---
  owner: { type: String, required: true },           // ผู้ลงประกาศ (ดึงจาก Session)
  status: { 
    type: String, 
    enum: ["draft", "published", "closed"], 
    default: "published" 
  },
  postedDate: { type: Date, default: Date.now },
});

export default mongoose.models.Job || mongoose.model("Job", JobSchema);