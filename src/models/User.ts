// src/models/User.ts
import mongoose, { Schema, Document, Model } from "mongoose";

export interface IResumeFile {
  name: string;
  url: string;
  size: string;
  uploadedAt: Date;
}

export interface IUser extends Document {
  name: string;
  firstName: string;
  lastName: string;
  email: string;
  password?: string;
  role: "student" | "alumni" | "teacher";
  studentId?: string;
  major: string;
  skills?: string[]; // ทำให้เป็น optional
  profileImageUrl?: string;
  resumeFiles: IResumeFile[];
  bio?: string;
  contactInfo?: string[]; // ช่องทางการติดต่อ (array)
  experiences?: string[];
  emailVerified: boolean;
  verificationStatus?: "pending" | "approved" | "rejected" | "not_required";
  verifiedBy?: string; // อีเมลอาจารย์ที่ approve/reject
  verifiedAt?: Date;
  galleryImages?: string[]; // ทำให้เป็น optional
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema: Schema = new Schema(
  {
    name: { type: String, required: true },
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true, select: false },
    role: {
      type: String,
      required: true,
      enum: ["student", "alumni", "teacher"],
    },
    studentId: {
      type: String,
      required: function () {
        return this.role === "student";
      },
      sparse: true,
    },
    major: { type: String, required: true },
    skills: {
      type: [String],
      required: function () {
        return this.role === "student";
      },
      default: undefined,
    },
    profileImageUrl: { type: String },
    resumeFiles: {
      type: [
        {
          name: { type: String, required: true },
          url: { type: String, required: true },
          size: { type: String },
          uploadedAt: { type: Date, default: Date.now },
        },
      ],
      default: [],
    },
    bio: { type: String },
    contactInfo: { type: [String], default: [] }, // ช่องทางการติดต่อ (array)
    experiences: {
      type: [String],
      default: [],
    },
    emailVerified: { type: Boolean, default: false },
    galleryImages: {
      type: [String],
      required: function () {
        return this.role === "student";
      },
      default: [],
    },
    verificationStatus: {
      type: String,
      enum: ["pending", "approved", "rejected", "not_required"],
      default: function (this: IUser) {
        // alumni ต้องรอการยืนยัน, role อื่นไม่ต้อง
        return this.role === "alumni" ? "pending" : "not_required";
      },
    },
    verifiedBy: {
      type: String,
      default: null, // อีเมลอาจารย์ที่ตัดสินใจ
    },
    verifiedAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true },
);

// Create a unique index for studentId only for students
UserSchema.index(
  { studentId: 1 },
  {
    unique: true,
    partialFilterExpression: { role: "student" },
  },
);

// New Index : ช่วยให้ query alumni ที่รอยืนยันได้เร็วขึ้น
UserSchema.index(
  { verificationStatus: 1 },
  { partialFilterExpression: { role: "alumni" } },
);

// Fix for TypeScript to handle mongoose models with Next.js hot reloading
const UserModel: Model<IUser> =
  mongoose.models.User || mongoose.model<IUser>("User", UserSchema);

export default UserModel;
