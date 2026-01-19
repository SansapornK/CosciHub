import { NextResponse } from "next/server";
import dbConnect from "@/libs/mongodb";
import Job from "@/models/Job";

export async function GET(req: Request) {
  await dbConnect();

  const { searchParams } = new URL(req.url);

  const q = searchParams.get("q") || "";
  const major = searchParams.get("major");
  const skills = searchParams.get("skills");
  const minPrice = Number(searchParams.get("minPrice"));
  const maxPrice = searchParams.get("maxPrice");
  const sort = searchParams.get("sort") || "default";
  const page = Number(searchParams.get("page") || 1);
  const limit = Number(searchParams.get("limit") || 12);

  const filter: any = {};

  /* ---------- Search (แก้ regex array) ---------- */
  if (q) {
    filter.$or = [
      { title: { $regex: q, $options: "i" } },
      { description: { $regex: q, $options: "i" } },
      {
        requiredSkills: {
          $elemMatch: { $regex: q, $options: "i" }
        }
      }
    ];
  }

  /* ---------- Major / Category ---------- */
  if (major) {
    filter.category = { $regex: major, $options: "i" };
  }

  /* ---------- Skills (array ถูกต้อง) ---------- */
  if (skills) {
    filter.requiredSkills = {
      $all: skills.split(",")
    };
  }

  /* ---------- Price Range ---------- */
  if (!isNaN(minPrice) && minPrice > 0) {
    filter.budgetMin = { $gte: minPrice };
  }

  if (maxPrice) {
    filter.budgetMin = {
      ...(filter.budgetMin || {}),
      $lte: Number(maxPrice),
    };
  }

  /* ---------- Sort ---------- */
  let sortOption: any = { postedDate: -1 };
  if (sort === "price_asc") sortOption = { budgetMin: 1 };
  if (sort === "price_desc") sortOption = { budgetMin: -1 };


  console.log("FILTER QUERY =", JSON.stringify(filter, null, 2));

  const total = await Job.countDocuments(filter);
  const jobs = await Job.find(filter)
    .sort(sortOption)
    .skip((page - 1) * limit)
    .limit(limit);

  return NextResponse.json({ jobs, total });
}
