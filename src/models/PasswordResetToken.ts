// src/models/PasswordResetToken.ts
import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IPasswordResetToken extends Document {
  email: string;
  token: string;
  expiresAt: Date;
  usedAt?: Date;
  createdAt: Date;
}

const PasswordResetTokenSchema: Schema = new Schema({
  email: {
    type: String,
    required: true,
  },
  token: {
    type: String,
    required: true,
    unique: true,
  },
  expiresAt: {
    type: Date,
    required: true,
  },
  usedAt: {
    type: Date,
    default: null,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Index สำหรับค้นหา token ได้เร็ว
PasswordResetTokenSchema.index({ token: 1 });

// Index สำหรับค้นหาตาม email
PasswordResetTokenSchema.index({ email: 1 });

// TTL index - auto-delete หลังหมดอายุ 24 ชั่วโมง
PasswordResetTokenSchema.index(
  { expiresAt: 1 },
  { expireAfterSeconds: 86400 } // 24 hours after expiration
);

const PasswordResetTokenModel: Model<IPasswordResetToken> =
  mongoose.models.PasswordResetToken ||
  mongoose.model<IPasswordResetToken>('PasswordResetToken', PasswordResetTokenSchema);

export default PasswordResetTokenModel;
