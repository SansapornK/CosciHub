// src/models/Job.ts
import mongoose, { Schema, Document, Model } from "mongoose";

export interface IJob extends Document {
  title: string;
  category: string;
  shortDescription: string;
  description: string;
  qualifications: string;
  jobType: "online" | "onsite" | "onsite-online";
  location?: string;
  deliveryDate?: Date;
  budgetMin: number;
  budgetMax: number;
  capacity: number;
  applicationDeadline: Date;
  owner: string;
  ownerName?: string;
  status: "draft" | "published" | "in_progress" | "revision" | "completed" | "closed";
  applicants: mongoose.Types.ObjectId[];
  assignedTo: mongoose.Types.ObjectId[];
  progress: number;
  postedDate: Date;
  updatedAt?: Date;
  completedAt?: Date;
  allSubmissions: any[]; // สามารถสร้าง Interface แยกสำหรับ Submission ได้ถ้าต้องการความละเอียด
}

const JobSchema = new mongoose.Schema({
  // ─── ข้อมูลงาน ────────────────────────────────
  title:            { type: String, required: true },
  category:         { type: String, required: true },
  shortDescription: { type: String, required: true },
  description:      { type: String, required: true },
  qualifications:   { type: String, required: true },
  jobType: {
    type: String,
    required: true,
    enum: ["online", "onsite", "onsite-online"],
  },
  location:            { type: String },
  deliveryDate:        { type: Date },
  budgetMin:           { type: Number, required: true },
  budgetMax:           { type: Number, required: true },
  capacity:            { type: Number, required: true, default: 1 },
  applicationDeadline: { type: Date, required: true },

  // ─── เจ้าของงาน ─────────────────────────────────
  // ✅ ใช้ String ต่อไป (backward compat กับ data เดิม)
  owner:     { type: String, required: true },
  ownerName: { type: String },

  status: {
    type: String,
    enum: [
      "draft",
      "published", 
      "in_progress",
      "revision",
      "completed",
      "closed",
    ],
    default: "published",
  },

  // ─── ผู้สมัครและการมอบหมาย ───────────────────────
  applicants: {
    type: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    default: [],
  },
  assignedTo: {
    type: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    default: [],
  },

  // ─── ความคืบหน้า ─────────────────────────────────
  progress: { type: Number, min: 0, max: 100, default: 0 },

  // ─── Timestamps ───────────────────────────────────
  postedDate:  { type: Date, default: Date.now },
  updatedAt:   { type: Date },
  completedAt: { type: Date },

  allSubmissions: [{
    applicationId:   { type: mongoose.Schema.Types.ObjectId, ref: "Application" },
    applicantName:   String,
    status:          String,
    hasLink:         { type: Boolean, default: false },
    hasFiles:        { type: Boolean, default: false },
    lastSubmittedAt: { type: Date }
  }],
});

JobSchema.index({ status: 1 });
JobSchema.index({ owner: 1 });
JobSchema.index({ applicants: 1 });
JobSchema.index({ assignedTo: 1 });
JobSchema.index({ category: 1 });
JobSchema.index({ postedDate: -1 });

const Job: Model<IJob> = mongoose.models.Job || mongoose.model<IJob>("Job", JobSchema);

export default Job;