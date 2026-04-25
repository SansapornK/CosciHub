// src/models/Application.ts
import mongoose, { Schema, Document, Model } from "mongoose";

export interface IProgressLog {
  progress: number;
  note?: string;
  createdAt: Date;
}

export interface IApplication extends Document {
  jobId: mongoose.Types.ObjectId;
  applicantId?: mongoose.Types.ObjectId;
  applicantEmail: string;
  applicantName: string;
  status:
    | "pending"
    | "accepted"
    | "in_progress"
    | "submitted"
    | "revision"
    | "completed"
    | "rejected";
  rejectionNote?: string;
  progress: number;
  progressNote?: string;          // ← โน้ตล่าสุด
  progressLogs?: IProgressLog[];  // ← ประวัติทุก update
  appliedDate: Date;
  updatedAt?: Date;
  workLink?: string;
  attachments?: { fileName: string; fileUrl: string; fileSize: number }[];
  feedback?: string;
  ownerReview?: {
    rating: number;
    comment: string;
    isAnonymous: boolean;
    createdAt: Date;
  };
  studentReview?: {
    rating: number;
    comment: string;
    isAnonymous: boolean;
    createdAt: Date;
  };
}

const ProgressLogSchema = new Schema<IProgressLog>(
  {
    progress: { type: Number, required: true, min: 0, max: 100 },
    note: { type: String, default: null },
    createdAt: { type: Date, default: Date.now },
  },
  { _id: false }, // ไม่ต้องการ _id ต่อ log
);

const ApplicationSchema: Schema = new Schema({
  jobId: { type: mongoose.Schema.Types.ObjectId, ref: "Job", required: true },
  applicantId: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
  applicantEmail: { type: String, required: true },
  applicantName: { type: String, required: true },

  status: {
    type: String,
    enum: ["pending", "accepted", "in_progress", "submitted", "revision", "completed", "rejected"],
    default: "pending",
  },

  progress: { type: Number, min: 0, max: 100, default: 0 },
  progressNote: { type: String, default: null },   // ← โน้ตล่าสุด
  progressLogs: { type: [ProgressLogSchema], default: [] }, // ← ประวัติ

  rejectionNote: { type: String, default: null },
  appliedDate: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: null },

  workLink: { type: String, default: "" },
  attachments: [{ fileName: String, fileUrl: String, fileSize: Number }],

  feedback: { type: String, default: null },

  studentReview: {
    rating: { type: Number, min: 1, max: 5 },
    comment: String,
    isAnonymous: Boolean,
    createdAt: Date,
  },
  ownerReview: {
    rating: { type: Number, min: 1, max: 5 },
    comment: String,
    isAnonymous: Boolean,
    createdAt: Date,
  },
});

ApplicationSchema.index({ jobId: 1, applicantEmail: 1 }, { unique: true });
ApplicationSchema.index({ jobId: 1, status: 1 });
ApplicationSchema.index({ applicantEmail: 1, appliedDate: -1 });
ApplicationSchema.index({ applicantEmail: 1, status: 1 });
ApplicationSchema.index({ jobId: 1, applicantId: 1 }, { sparse: true });

const ApplicationModel: Model<IApplication> =
  mongoose.models.Application ||
  mongoose.model<IApplication>("Application", ApplicationSchema);

export default ApplicationModel;