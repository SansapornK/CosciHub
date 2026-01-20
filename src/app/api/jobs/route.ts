import { NextResponse } from "next/server";
import dbConnect from "@/libs/mongodb";
import Job from "@/models/Job";

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

  // ค้นหาด้วย keyword
  if (q) {
    filter.title = { $regex: q, $options: "i" };
  }

  // กรองประเภทงาน
  if (jobTypes) {
    filter.category = { $in: jobTypes.split(",") };
  }

  if (minPrice || maxPrice) {
    filter.budgetMin = {};

    if (minPrice) {
      filter.budgetMin.$gte = Number(minPrice);
    }

    if (maxPrice) {
      filter.budgetMin.$lte = Number(maxPrice);
    }
  }

  const total = await Job.countDocuments(filter);

  let query = Job.find(filter);

  // Sort
  if (sort === "price-asc") {
    query = query.sort({ budgetMin: 1 });
  } else if (sort === "price-desc") {
    query = query.sort({ budgetMin: -1 });
  } else {
    query = query.sort({ postedDate: -1 });
  }

  const jobs = await query.skip(skip).limit(limit).exec();

  return NextResponse.json({
    jobs,
    total,
  });
}
