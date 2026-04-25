// src/models/AlumniVerification.ts
import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IAlumniVerification extends Document {
  alumniId:     mongoose.Types.ObjectId; // อ้างอิงไปยัง User
  alumniEmail:  string;
  alumniName:   string;
  teacherEmail: string;                  // อาจารย์ที่รับอีเมลนี้
  token:        string;                  // unique token สำหรับ approve/reject
  action?:      'approved' | 'rejected'; // ผลการตัดสินใจ
  expiresAt:    Date;                    // หมดอายุใน 7 วัน
  usedAt?:      Date;                    // วันที่อาจารย์กดปุ่ม
  invalidated?: boolean;                 // ถูกยกเลิกเพราะมีการส่งอีเมลใหม่
  createdAt:    Date;
}

const AlumniVerificationSchema: Schema = new Schema({
  alumniId: {
    type:     Schema.Types.ObjectId,
    ref:      'User',
    required: true,
  },
  alumniEmail: {
    type:     String,
    required: true,
  },
  alumniName: {
    type:     String,
    required: true,
  },
  teacherEmail: {
    type:     String,
    required: true,
  },
  token: {
    type:     String,
    required: true,
    unique:   true, // ห้ามซ้ำกัน
  },
  action: {
    type:    String,
    enum:    ['approved', 'rejected'],
    default: null,
  },
  expiresAt: {
    type:     Date,
    required: true,
  },
  usedAt: {
    type:    Date,
    default: null,
  },
  invalidated: {
    type:    Boolean,
    default: false,
  },
  createdAt: {
    type:    Date,
    default: Date.now,
  },
});

// ── Indexes ──────────────────────────────────────────
// ค้นหา token ได้เร็ว (ใช้ตอนอาจารย์กดลิงก์)
AlumniVerificationSchema.index({ token: 1 });

// ค้นหาตาม alumniId ได้เร็ว (ใช้ตอนเช็คสถานะ)
AlumniVerificationSchema.index({ alumniId: 1 });

// Auto-delete document เมื่อถึงเวลา expiresAt
AlumniVerificationSchema.index(
  { expiresAt: 1 },
  { expireAfterSeconds: 0 }
);

const AlumniVerificationModel: Model<IAlumniVerification> =
  mongoose.models.AlumniVerification ||
  mongoose.model<IAlumniVerification>('AlumniVerification', AlumniVerificationSchema);

export default AlumniVerificationModel;