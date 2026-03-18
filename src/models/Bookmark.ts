// models/Bookmark.ts
import mongoose from "mongoose";

const BookmarkSchema = new mongoose.Schema({
  jobId: { type: mongoose.Schema.Types.ObjectId, ref: 'Job', required: true },
  userEmail: { type: String, required: true },
  savedAt: { type: Date, default: Date.now },
});

// ป้องกันการบันทึกซ้ำ
BookmarkSchema.index({ jobId: 1, userEmail: 1 }, { unique: true });

export default mongoose.models.Bookmark || mongoose.model("Bookmark", BookmarkSchema);