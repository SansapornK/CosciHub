// import { NextResponse } from "next/server";
// import dbConnect from "@/libs/mongodb";
// import Job from "@/models/Job";
// import User from "@/models/User";

// export async function GET(req: Request) {
//   await dbConnect();

//   const { searchParams } = new URL(req.url);

//   const page = parseInt(searchParams.get("page") || "1");
//   const limit = parseInt(searchParams.get("limit") || "12");
//   const skip = (page - 1) * limit;

//   const q = searchParams.get("q");
//   const jobTypes = searchParams.get("jobTypes");
//   const minPrice = searchParams.get("minPrice");
//   const maxPrice = searchParams.get("maxPrice");
//   const sort = searchParams.get("sort");

//   const filter: any = {};

//   // ค้นหาด้วย keyword
//   if (q) {
//     filter.title = { $regex: q, $options: "i" };
//   }

//   // กรองประเภทงาน
//   if (jobTypes) {
//     filter.category = { $in: jobTypes.split(",") };
//   }

//   if (minPrice || maxPrice) {
//     filter.budgetMin = {};

//     if (minPrice) {
//       filter.budgetMin.$gte = Number(minPrice);
//     }

//     if (maxPrice) {
//       filter.budgetMin.$lte = Number(maxPrice);
//     }
//   }

//   const total = await Job.countDocuments(filter);

//   let query = Job.find(filter);

//   // Sort
//   if (sort === "price-asc") {
//     query = query.sort({ budgetMin: 1 });
//   } else if (sort === "price-desc") {
//     query = query.sort({ budgetMin: -1 });
//   } else {
//     query = query.sort({ postedDate: -1 });
//   }

//   const jobs = await query.skip(skip).limit(limit).exec();

//   return NextResponse.json({
//     jobs,
//     total,
//   });
// }

// src/app/api/jobs/route.ts
import { NextResponse, NextRequest } from "next/server";
import { getServerSession } from "next-auth/next";
import dbConnect from "@/libs/mongodb";
import Job from "@/models/Job";
import User from "@/models/User";
import { FilterQuery } from "mongoose"; 

interface IJobFilter {
  title?: { $regex: string; $options: string };
  category?: { $in: string[] };
  budgetMin?: { $gte?: number; $lte?: number };
  owner?:    string;                                 
  status?:   "draft" | "published" | "closed";   
}

/* ===================== GET — ดึงรายการงาน ===================== */
export async function GET(req: Request) {
  await dbConnect();

  const { searchParams } = new URL(req.url);

  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "12");
  const skip = (page - 1) * limit;

  const q         = searchParams.get("q");
  const jobTypes  = searchParams.get("jobTypes");
  const minPrice  = searchParams.get("minPrice");
  const maxPrice  = searchParams.get("maxPrice");
  const sort      = searchParams.get("sort");
  const owner     = searchParams.get("owner");
  const includeDraft = searchParams.get("includeDraft") === "true";

  const filter: IJobFilter = {};

  if (q)        filter.title    = { $regex: q, $options: "i" };
  if (jobTypes) filter.category = { $in: jobTypes.split(",") };
  if (owner) filter.owner = owner;
  // ถ้าไม่ได้ขอ draft ให้แสดงเฉพาะ published เท่านั้น
  if (!includeDraft) {
    filter.status = "published";
  }

  if (minPrice || maxPrice) {
    filter.budgetMin = {};
    if (minPrice) filter.budgetMin.$gte = Number(minPrice);
    if (maxPrice) filter.budgetMin.$lte = Number(maxPrice);
  }

  const total = await Job.countDocuments(filter as FilterQuery<typeof Job>);

const jobs = await (Job as any)
    .find(filter)
    .lean()
    .sort(
      sort === "price-asc"  ? { budgetMin: 1 } :
      sort === "price-desc" ? { budgetMin: -1 } :
                              { postedDate: -1 }
    )
    .skip(skip)
    .limit(limit)
    .exec();

  return NextResponse.json({ jobs, total });
}

/* ===================== POST — สร้างประกาศงานใหม่ ===================== */
export async function POST(req: Request) {
  try {
    // 1. ตรวจสอบ Session
    const session = await getServerSession();
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: "กรุณาเข้าสู่ระบบก่อนลงประกาศงาน" },
        { status: 401 }
      );
    }

    await dbConnect();

    // 2. ตรวจสอบ Role ว่าเป็น teacher หรือ alumni เท่านั้น
    const user = await User.findOne({ email: session.user.email });
    if (!user) {
      return NextResponse.json({ error: "ไม่พบข้อมูลผู้ใช้" }, { status: 404 });
    }
    if (user.role === "student") {
      return NextResponse.json(
        { error: "นักศึกษาไม่มีสิทธิ์ลงประกาศงาน" },
        { status: 403 }
      );
    }

    // 3. รับและตรวจสอบข้อมูลจาก Body
    const data = await req.json();

    if (data.status !== "draft") {
      const requiredFields = [
        "title", "category", "shortDescription", "description",
        "qualifications", "jobType", "duration",
        "budgetMin", "budgetMax", "capacity", "applicationDeadline",
      ];
      const missing = requiredFields.filter((f) => !data[f]);
      if (missing.length > 0) {
        return NextResponse.json(
          { error: `กรุณากรอกข้อมูลให้ครบ: ${missing.join(", ")}` },
          { status: 400 }
        );
      }
    }

    if (Number(data.budgetMin) < 100) {
      return NextResponse.json(
        { error: "ค่าตอบแทนขั้นต่ำต้องไม่น้อยกว่า 100 บาท" },
        { status: 400 }
      );
    }
    if (Number(data.budgetMin) > Number(data.budgetMax)) {
      return NextResponse.json(
        { error: "ค่าตอบแทนเริ่มต้นต้องไม่มากกว่าค่าตอบแทนสูงสุด" },
        { status: 400 }
      );
    }

    const allowedStatus = ["published", "draft"];
    const jobStatus = allowedStatus.includes(data.status) ? data.status : "published";

    // 4. สร้าง Job document
    const newJob = new Job({
      title:               data.title,
      category:            data.category,
      shortDescription:    data.shortDescription,
      description:         data.description,
      qualifications:      data.qualifications,
      attachments:         data.attachments || null,
      jobType:             data.jobType,
      location:            data.location || null,
      // duration:            data.duration,
      deliveryDate:        data.deliveryDate ? new Date(data.deliveryDate) : null,
      budgetMin:           Number(data.budgetMin),
      budgetMax:           Number(data.budgetMax),
      capacity:            Number(data.capacity),
      applicationDeadline: new Date(data.applicationDeadline),
      owner:               user.name,
      status:              jobStatus,
      postedDate:          new Date(),
    });
    await newJob.save();

    return NextResponse.json(
      { message: "ลงประกาศงานสำเร็จ", job: newJob },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("[POST /api/jobs] Error:", error);
    return NextResponse.json(
      { error: "เกิดข้อผิดพลาดภายในเซิร์ฟเวอร์" },
      { status: 500 }
    );
  }
}
