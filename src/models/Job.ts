import mongoose from "mongoose";

const JobSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: String,
  budgetMin: Number,
  budgetMax: Number,
  requiredSkills: [String],
  category: String,
  postedDate: { type: Date, default: Date.now },
  owner: String,
});

export default mongoose.models.Job || mongoose.model("Job", JobSchema);
