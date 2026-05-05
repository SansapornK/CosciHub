// src/models/AllowedEmail.ts
import mongoose, { Schema, Document, Model } from "mongoose";

export interface IAllowedEmail extends Document {
  email: string;
  isActive: boolean;
}

const AllowedEmailSchema: Schema = new Schema(
  {
    email: { type: String, required: true, unique: true, lowercase: true },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

// Index สำหรับค้นหาอีเมลที่ active
AllowedEmailSchema.index({ email: 1, isActive: 1 });

const AllowedEmailModel: Model<IAllowedEmail> =
  mongoose.models.AllowedEmail ||
  mongoose.model<IAllowedEmail>("AllowedEmail", AllowedEmailSchema);

export default AllowedEmailModel;
