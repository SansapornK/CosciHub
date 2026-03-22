// src/models/Application.ts
import mongoose, { Schema, Document, Model } from "mongoose";

export interface IApplication extends Document {
  jobId:          mongoose.Types.ObjectId;
  applicantId?:   mongoose.Types.ObjectId;   // optional — backward compat
  applicantEmail: string;
  applicantName:  string;
  status: "pending" | "accepted" | "in_progress" | "submitted" | "revision" | "completed" | "rejected";  rejectionNote?: string;
  progress:       number;
  appliedDate:    Date;
  updatedAt?:     Date;
  workLink?: string;
  attachments?: { fileName: string; fileUrl: string; fileSize: number }[];
  // note?: string;
}

const ApplicationSchema: Schema = new Schema({
  jobId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Job",
    required: true,
  },

  // optional ไม่ใส่ required (backward compat กับ doc เดิม)
  applicantId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    default: null,
  },
  applicantEmail: { type: String, required: true },
  applicantName:  { type: String, required: true },

  status: {
    type: String,
    enum: ["pending", "accepted", "in_progress", "submitted", "revision", "completed", "rejected"],
    default: "pending",
  },
  progress: {
    type: Number,
    min: 0,
    max: 100,
    default: 0,
  },
  rejectionNote: { type: String, default: null },
  appliedDate:   { type: Date, default: Date.now },
  updatedAt:     { type: Date, default: null },

  workLink: { type: String, default: "" },

  attachments: [{
    fileName: String,
    fileUrl:  String,
    fileSize: Number
  }],
  // note: { type: String, default: "" },

  feedback: { 
    type: String, 
    default: null 
  },
});

ApplicationSchema.index({ jobId: 1, applicantEmail: 1 }, { unique: true });
ApplicationSchema.index({ jobId: 1, status: 1 });
ApplicationSchema.index({ applicantEmail: 1, appliedDate: -1 });
ApplicationSchema.index({ applicantEmail: 1, status: 1 });

ApplicationSchema.index(
  { jobId: 1, applicantId: 1 },
  { sparse: true }
);

const ApplicationModel: Model<IApplication> =
  mongoose.models.Application ||
  mongoose.model<IApplication>("Application", ApplicationSchema);

export default ApplicationModel;