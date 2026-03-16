// models/Application.ts
import mongoose from "mongoose";

const ApplicationSchema = new mongoose.Schema({
  jobId: { type: mongoose.Schema.Types.ObjectId, ref: 'Job', required: true },
  applicantEmail: { type: String, required: true }, // อีเมลนิสิตที่สมัคร (จาก Session)
  applicantName: { type: String, required: true },
  status: { 
    type: String, 
    enum: ["pending", "accepted", "rejected"], 
    default: "pending" 
  },
  appliedDate: { type: Date, default: Date.now },
});

// ป้องกันการสมัครซ้ำ (1 คน สมัครงานเดิมได้ครั้งเดียว)
ApplicationSchema.index({ jobId: 1, applicantEmail: 1 }, { unique: true });

export default mongoose.models.Application || mongoose.model("Application", ApplicationSchema);