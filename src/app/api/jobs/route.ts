import { NextResponse } from "next/server";
import dbConnect from "@/libs/mongodb";
import Job from "@/models/Job";

export async function GET(req: Request) {
  await dbConnect();

  const { searchParams } = new URL(req.url);

  const q = searchParams.get("q");
  const jobTypes = searchParams.get("jobTypes");
  const minPrice = searchParams.get("minPrice");
  const maxPrice = searchParams.get("maxPrice");
  const sort = searchParams.get("sort");

  const filter: any = {};

  if (q) {
    filter.title = { $regex: q, $options: "i" };
  }

  if (jobTypes) {
    filter.category = { $in: jobTypes.split(",") };
  }

  if (minPrice || maxPrice) {
    filter.$and = [];
    if (minPrice) filter.$and.push({ budgetMin: { $gte: Number(minPrice) } });
    if (maxPrice) filter.$and.push({ budgetMax: { $lte: Number(maxPrice) } });
  }

  let query = Job.find(filter);

  if (sort === "price-asc") query = query.sort({ budgetMin: 1 });
  if (sort === "price-desc") query = query.sort({ budgetMax: -1 });
  if (sort === "latest") query = query.sort({ postedDate: -1 });

  const jobs = await query.exec();

  return NextResponse.json({
    jobs,
    total: jobs.length,
  });
}
