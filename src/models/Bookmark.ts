// models/Bookmark.ts
import mongoose, { Document, Model } from "mongoose";

export interface IBookmark extends Document {
  jobId: mongoose.Types.ObjectId;
  userEmail: string;
  savedAt: Date;
}

const BookmarkSchema = new mongoose.Schema({
  jobId: { type: mongoose.Schema.Types.ObjectId, ref: 'Job', required: true },
  userEmail: { type: String, required: true },
  savedAt: { type: Date, default: Date.now },
});

// ป้องกันการบันทึกซ้ำ
BookmarkSchema.index({ jobId: 1, userEmail: 1 }, { unique: true });

const Bookmark: Model<IBookmark> = mongoose.models.Bookmark || mongoose.model<IBookmark>("Bookmark", BookmarkSchema);

export default Bookmark;