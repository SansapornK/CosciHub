// src/models/Notification.ts
import mongoose, { Schema, Document, Model } from 'mongoose';

export interface INotification extends Document {
  recipientId: mongoose.Types.ObjectId;  // User ID of the recipient
  senderId?: mongoose.Types.ObjectId;    // User ID of the sender (optional)
  type: string;                          // Type of notification 
  title: string;                         // Title of the notification
  message: string;                       // Message content
  jobId?: mongoose.Types.ObjectId;   // Related job ID (if applicable)
  applicationId?: mongoose.Types.ObjectId; 
  isRead: boolean;                       // Whether the notification has been read
  link?: string;                         // URL to navigate to when clicked
  createdAt: Date;                       // When the notification was created
}

const NotificationSchema: Schema = new Schema(
  {
    recipientId: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'User', 
      required: true,
      index: true  // Add index for better query performance
    },
    senderId: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'User' 
    },
    type: { 
      type: String, 
      required: true,
      enum: [
        // ── ฝั่งเจ้าของงาน ──────────────────
        'job_new_application',      // มีนิสิตสมัครงานใหม่
        'job_work_started',  // นิสิตกดเริ่มงานแล้ว (action: "updateProgress" ครั้งแรก)
        'job_progress_updated',     // นิสิตอัพเดท progress
        'job_work_submitted',       // นิสิตส่งงานแล้ว

        // ── ฝั่งนิสิต ───────────────────────
        'application_accepted',     // ใบสมัครได้รับการยอมรับ
        'application_rejected',     // ใบสมัครถูกปฏิเสธ
        'work_revision_requested',  // เจ้าของขอแก้ไขงาน
        'work_approved',            // เจ้าของยืนยันงานเสร็จ
        
         // ── รีวิว ────────────────────────────────
        'review_received_by_student',   // นิสิตได้รับรีวิวจากผู้ว่าจ้าง
        'review_received_by_owner',     // ผู้ว่าจ้างได้รับรีวิวจากนิสิต

        // ── ระบบ ────────────────────────────
        'system_message'
      ]
    },
    title: { 
      type: String, 
      required: true 
    },
    message: { 
      type: String, 
      required: true 
    },
    jobId: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'Job' 
    },
    applicationId: {                   
      type: mongoose.Schema.Types.ObjectId,
      ref:  'Application',
    },
    isRead: { 
      type: Boolean, 
      default: false 
    },
    link: { 
      type: String 
    },
    createdAt: { 
      type: Date, 
      default: Date.now,
      index: true  // Add index for sorting by date
    }
  }
);

// Create indexes for better query performance
NotificationSchema.index({ recipientId: 1, isRead: 1 });
NotificationSchema.index({ recipientId: 1, createdAt: -1 });

// Fix for TypeScript to handle mongoose models with Next.js hot reloading
const NotificationModel: Model<INotification> = mongoose.models.Notification || 
  mongoose.model<INotification>('Notification', NotificationSchema);

export default NotificationModel;