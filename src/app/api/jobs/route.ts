import { NextResponse } from "next/server";
import dbConnect from "@/libs/mongodb";
import Job from "@/models/Job";

// api/jobs/route.ts

export async function GET(req: Request) {
  await dbConnect();

  const { searchParams } = new URL(req.url);

  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "12");
  const skip = (page - 1) * limit;

  const q = searchParams.get("q");
  const jobTypes = searchParams.get("jobTypes");
  const minPrice = searchParams.get("minPrice");
  const maxPrice = searchParams.get("maxPrice");
  const sort = searchParams.get("sort");

  const filter: any = {};
  if (q) filter.title = { $regex: q, $options: "i" };
  if (jobTypes) filter.category = { $in: jobTypes.split(",") };

  if (minPrice || maxPrice) {
    filter.$and = [];
    if (minPrice) filter.$and.push({ budgetMin: { $gte: Number(minPrice) } });
    if (maxPrice) filter.$and.push({ budgetMax: { $lte: Number(maxPrice) } });
  }

  const total = await Job.countDocuments(filter);

  let query = Job.find(filter);

  if (sort === "price-asc") {
  // เรียงจากน้อยไปมาก
  query = query.sort({ budgetMin: 1 }); 
} else if (sort === "price-desc") {
  // ✅ เรียงจากมากไปน้อย
  query = query.sort({ budgetMin: -1 }); 
} else {
  // ค่าเริ่มต้น: เรียงตามวันที่ลงประกาศล่าสุด
  query = query.sort({ postedDate: -1 });
}

const jobs = await query.skip(skip).limit(limit).exec();

  return NextResponse.json({
    jobs,
    total, 
  });
}