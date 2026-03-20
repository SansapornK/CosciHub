// src/models/Job.ts
import mongoose from "mongoose";

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
      "awaiting",
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
});

JobSchema.index({ status: 1 });
JobSchema.index({ owner: 1 });
JobSchema.index({ applicants: 1 });
JobSchema.index({ assignedTo: 1 });
JobSchema.index({ category: 1 });
JobSchema.index({ postedDate: -1 });

export default mongoose.models.Job || mongoose.model("Job", JobSchema);