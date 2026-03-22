// src/app/api/applications/route.ts
import { NextResponse } from "next/server";
import dbConnect from "@/libs/mongodb";
import Application from "@/models/Application";
import Job from "@/models/Job";
import User from "@/models/User";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import mongoose, { Types } from "mongoose";

// ─── Helper: Sync รายชื่อ ────────────────────────────────
async function syncJobParticipants(jobId: string) {
  await dbConnect();

  const cleanId = jobId.trim();
  if (!mongoose.isValidObjectId(cleanId)) return;

  const allApplications = await Application.find({ jobId: cleanId }).lean();
  
  const allApplicantIds = [...new Set(allApplications.map((app: any) => app.applicantId))];
  
  const assignedWorkerIds = [...new Set(allApplications
    .filter((app: any) => 
      ["accepted", "in_progress", "submitted", "revision", "completed"].includes(app.status)
    )
    .map((app: any) => app.applicantId))];

  const JobModel = (mongoose.models.Job || Job) as any;
  await JobModel.findByIdAndUpdate(cleanId, {
    $set: {
      applicants: allApplicantIds,    
      assignedTo: assignedWorkerIds  
    }
  });
}

// ─── POST: นิสิตสมัครงาน ──────────────────────────────────────────────────────
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();

    const user = await User.findOne({ email: session.user.email });
    if (!user) {
      return NextResponse.json({ error: "ไม่พบข้อมูลผู้ใช้ในระบบ" }, { status: 404 });
    }

    const { jobId } = await req.json();
    const safeJobId = jobId?.toString().trim();

    if (!safeJobId || !mongoose.isValidObjectId(safeJobId)) {
      return NextResponse.json({ error: "รหัสงานไม่ถูกต้อง" }, { status: 400 });
    }

    const job = await (Job as any).findById(safeJobId).lean().exec();
    if (!job) {
      return NextResponse.json({ error: "ไม่พบข้อมูลงานนี้" }, { status: 404 });
    }

    if (job.owner === user.name) {
      return NextResponse.json(
        { error: "คุณไม่สามารถสมัครงานที่คุณเป็นเจ้าของได้" },
        { status: 400 }
      );
    }

    // สร้างใบสมัครใหม่
    const newApplication = await Application.create({
      jobId:          safeJobId,
      applicantId:    user._id,
      applicantEmail: user.email,
      applicantName:  user.name,
      status:         "pending",
      appliedDate:    new Date(),
    });

    try {
      await syncJobParticipants(safeJobId);
    } catch (syncError) {
      console.error("Sync Error:", syncError);
    }

    return NextResponse.json(
      { message: "ส่งใบสมัครเรียบร้อยแล้ว", application: newApplication },
      { status: 201 }
    );

  } catch (error: any) {
    console.error("[POST /api/applications] Error:", error);
    if (error.code === 11000) {
      return NextResponse.json({ error: "คุณได้ส่งใบสมัครงานนี้ไปแล้ว" }, { status: 400 });
    }
    return NextResponse.json({ error: "เกิดข้อผิดพลาดภายในเซิร์ฟเวอร์" }, { status: 500 });
  }
}

// ─── GET: ดึงข้อมูล applications ──────────────────────────────────────────────
// ?role=student  → นิสิตดูงานที่ตัวเองสมัคร
// ?role=owner    → เจ้าของดูงานที่มีคนสมัคร
export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();

    const { searchParams } = new URL(req.url);
    const role  = searchParams.get("role");
    const jobId = searchParams.get("jobId");
    const phase = searchParams.get("phase");

    // ══════════════════════════════════════════════════════
    // CASE 1: ?jobId=xxx → ดึง applications ของ job นั้น
    // ══════════════════════════════════════════════════════
    if (jobId) {
      const user = await User.findOne({ email: session.user.email });
      if (!user) return NextResponse.json({ error: "ไม่พบผู้ใช้" }, { status: 404 });

      const job = await (Job as any).findById(jobId).lean() as any;
      if (!job) return NextResponse.json({ error: "ไม่พบงาน" }, { status: 404 });
      if (job.owner !== user.name) return NextResponse.json({ error: "ไม่มีสิทธิ์" }, { status: 403 });

      const applications = await Application.find({ jobId })
        .sort({ appliedDate: -1 })
        .lean();

      const emails = applications.map((a: any) => a.applicantEmail);
      const users  = await User.find({ email: { $in: emails } })
        .select("name email skills bio profileImageUrl major basePrice")
        .lean();

      const userMap: Record<string, any> = {};
      users.forEach((u: any) => { userMap[u.email] = u; });

      const result = applications.map((a: any) => ({
        _id:             a._id.toString(),
        applicantEmail:  a.applicantEmail,
        applicantName:   a.applicantName,
        status:          a.status,
        appliedDate:     a.appliedDate,
        rejectionNote:   a.rejectionNote || null,
        skills:          userMap[a.applicantEmail]?.skills         || [],
        bio:             userMap[a.applicantEmail]?.bio             || "",
        profileImageUrl: userMap[a.applicantEmail]?.profileImageUrl || null,
        major:           userMap[a.applicantEmail]?.major           || "",
        basePrice:       userMap[a.applicantEmail]?.basePrice       || 0,
        userId:          userMap[a.applicantEmail]?._id?.toString() || null,
      }));

      return NextResponse.json({
        job: { _id: job._id.toString(), title: job.title, category: job.category, capacity: job.capacity || 1, status: job.status },
        applications: result,
        pendingCount:  result.filter(a => a.status === "pending").length,
        acceptedCount: result.filter(a => ["accepted", "in_progress", "submitted", "revision", "completed"].includes(a.status)).length,
      });
    }

    // ══════════════════════════════════════════════════════
    // CASE 2: ?role=student&phase=inProgress
    // ══════════════════════════════════════════════════════
    if (role === "student" && phase === "inProgress") {
      const ACTIVE = ["in_progress", "submitted", "revision"];

      const applications = await Application.find({
        applicantEmail: session.user.email,
        status: { $in: ACTIVE },
      }).sort({ updatedAt: -1 }).lean();

      const jobIds = applications.map((a: any) => a.jobId);
      const jobs   = await (Job as any)
        .find({ _id: { $in: jobIds } })
        .select("title category budgetMin budgetMax owner deliveryDate")
        .lean();

      const jobMap: Record<string, any> = {};
      jobs.forEach((j: any) => { jobMap[j._id.toString()] = j; });

      const result = applications.map((a: any) => ({
        _id:          a._id.toString(),
        jobId:        a.jobId.toString(),
        jobTitle:     jobMap[a.jobId.toString()]?.title    ?? "ไม่พบข้อมูล",
        jobCategory:  jobMap[a.jobId.toString()]?.category ?? "",
        jobOwner:     jobMap[a.jobId.toString()]?.owner    ?? "",
        jobDeadline:  jobMap[a.jobId.toString()]?.deliveryDate ?? null,
        status:       a.status,
        progress:     a.progress || 0,
        updatedAt:    a.updatedAt,
      }));

      return NextResponse.json({ applications: result });
    }

    // ══════════════════════════════════════════════════════
    // CASE 3: ?role=owner&phase=inProgress
    // ══════════════════════════════════════════════════════
    if (role === "owner" && phase === "inProgress") {
      const user = await User.findOne({ email: session.user.email });
      if (!user) return NextResponse.json({ error: "ไม่พบผู้ใช้" }, { status: 404 });

      const ACTIVE = ["accepted", "in_progress", "submitted", "revision"];

      // ดึงงานทั้งหมดของ owner ไม่กรอง status
      const allOwnedJobs = await (Job as any)
        .find({ owner: user.name })
        .select("_id title category budgetMin budgetMax deliveryDate status capacity")
        .lean();

      if (allOwnedJobs.length === 0) return NextResponse.json({ jobs: [] });

      const allJobIds = allOwnedJobs.map((j: any) => j._id);

      // ดึง applications ที่อยู่ใน ACTIVE status
      const applications = await Application.find({
        jobId: { $in: allJobIds },
        status: { $in: ACTIVE },
      }).sort({ updatedAt: -1 }).lean();

      if (applications.length === 0) return NextResponse.json({ jobs: [] });

      // ค้นหา jobIds ที่มี active applications
      const activeJobIdSet = new Set(applications.map((a: any) => a.jobId.toString()));

      const emails = applications.map((a: any) => a.applicantEmail);
      const userProfiles = await User.find({ email: { $in: emails } })
        .select("email profileImageUrl")
        .lean();

      const profileMap: Record<string, string | null> = {};
      userProfiles.forEach((u: any) => {
        profileMap[u.email] = u.profileImageUrl || null;
      });

      const appMap: Record<string, any[]> = {};
      applications.forEach((a: any) => {
        const key = a.jobId.toString();
        if (!appMap[key]) appMap[key] = [];
        appMap[key].push({
          _id:             a._id.toString(),
          applicantName:   a.applicantName,
          applicantEmail:  a.applicantEmail,
          profileImageUrl: profileMap[a.applicantEmail] || null,
          status:          a.status,
          progress:        a.progress || 0,
          updatedAt:       a.updatedAt,
        });
      });

      // กรองเฉพาะงานที่มี active worker
      const result = allOwnedJobs
        .filter((j: any) => activeJobIdSet.has(j._id.toString()))
        .map((j: any) => {
          const workers = appMap[j._id.toString()] ?? [];
          
          const statusCounts = {
            waitingToStart: workers.filter((w: any) => w.status === "accepted").length,
            inProgress:     workers.filter((w: any) => w.status === "in_progress").length,
            submitted:      workers.filter((w: any) => w.status === "submitted").length,
            revision:       workers.filter((w: any) => w.status === "revision").length,
            completed:      workers.filter((w: any) => w.status === "completed").length,
          };

          let aggregateBadge: { label: string; color: string };
          if (statusCounts.submitted > 0) {
            aggregateBadge = {
              label: `${statusCounts.submitted} รอตรวจ`,
              color: "red",
            };
          } else if (statusCounts.revision > 0) {
            aggregateBadge = {
              label: `${statusCounts.revision} แก้ไขงาน`,
              color: "orange",
            };
          } else if (statusCounts.inProgress > 0) {
            aggregateBadge = {
              label: `${statusCounts.inProgress} กำลังทำงาน`,
              color: "yellow",
            };
          } else if (statusCounts.waitingToStart > 0) {
            aggregateBadge = {
              label: `${statusCounts.waitingToStart} รอเริ่มงาน`,
              color: "blue",
            };
          } else {
            aggregateBadge = {
              label: `${statusCounts.completed} เสร็จสิ้น`,
              color: "green",
            };
          }

          const avgProgress =
            workers.length > 0
              ? Math.round(
                  workers.reduce((sum: number, w: any) => sum + (w.progress || 0), 0) /
                    workers.length
                )
              : 0;

          return {
            _id:            j._id.toString(),
            title:          j.title,
            category:       j.category,
            deliveryDate:   j.deliveryDate,
            jobStatus:      j.status,
            capacity:       j.capacity || 1,
            workers,
            statusCounts,
            aggregateBadge,
            avgProgress,
          };
        });

      return NextResponse.json({ jobs: result });
    }

    // ══════════════════════════════════════════════════════
    // CASE 4: ?role=student (งานที่สมัครทั้งหมด)
    // ══════════════════════════════════════════════════════
    if (role === "student") {
      const applications = await Application.find({
        applicantEmail: session.user.email,
      }).sort({ appliedDate: -1 }).lean();

      if (applications.length === 0) return NextResponse.json({ applications: [] });

      const jobIds = applications.map((a: any) => a.jobId);
      const jobs   = await (Job as any)
        .find({ _id: { $in: jobIds } })
        .select("title category budgetMin budgetMax owner applicationDeadline status")
        .lean();

      const jobMap: Record<string, any> = {};
      jobs.forEach((j: any) => { jobMap[j._id.toString()] = j; });

      const result = applications.map((a: any) => ({
        _id:           a._id.toString(),
        jobId:         a.jobId.toString(),
        jobTitle:      jobMap[a.jobId.toString()]?.title       ?? "ไม่พบข้อมูล",
        jobCategory:   jobMap[a.jobId.toString()]?.category    ?? "",
        jobBudgetMin:  jobMap[a.jobId.toString()]?.budgetMin   ?? 0,
        jobBudgetMax:  jobMap[a.jobId.toString()]?.budgetMax   ?? 0,
        jobOwner:      jobMap[a.jobId.toString()]?.owner       ?? "",
        jobDeadline:   jobMap[a.jobId.toString()]?.applicationDeadline ?? null,
        jobStatus:     jobMap[a.jobId.toString()]?.status      ?? "",
        status:        a.status,
        appliedDate:   a.appliedDate,
      }));

      return NextResponse.json({ applications: result });
    }

    // ══════════════════════════════════════════════════════
    // CASE 5: ?role=owner (งานของเจ้าของที่มีคนสมัคร)
    // ══════════════════════════════════════════════════════
    if (role === "owner") {
      const user = await User.findOne({ email: session.user.email });
      if (!user) return NextResponse.json({ error: "ไม่พบผู้ใช้" }, { status: 404 });

      const ownedJobs = await (Job as any)
        .find({ owner: user.name })
        .select("_id title category budgetMin budgetMax applicationDeadline status capacity")
        .lean();

      if (ownedJobs.length === 0) return NextResponse.json({ jobs: [] });

      const ownedJobIds = ownedJobs.map((j: any) => j._id);
      const applications = await Application.find({
        jobId: { $in: ownedJobIds },
      }).sort({ appliedDate: -1 }).lean();

      const appMap: Record<string, any[]> = {};
      applications.forEach((a: any) => {
        const key = a.jobId.toString();
        if (!appMap[key]) appMap[key] = [];
        appMap[key].push({
          _id:            a._id.toString(),
          applicantName:  a.applicantName,
          applicantEmail: a.applicantEmail,
          status:         a.status,
          appliedDate:    a.appliedDate,
        });
      });

      const result = ownedJobs
        .map((j: any) => ({
          _id:                 j._id.toString(),
          title:               j.title,
          category:            j.category,
          budgetMin:           j.budgetMin,
          budgetMax:           j.budgetMax,
          applicationDeadline: j.applicationDeadline,
          jobStatus:           j.status,
          capacity:     j.capacity || 1,         
          applications:        appMap[j._id.toString()] ?? [],
          pendingCount:        (appMap[j._id.toString()] ?? []).filter(a => a.status === "pending").length,
          acceptedCount:       (appMap[j._id.toString()] ?? []) 
                                .filter(a => ["accepted", "in_progress", "submitted", "revision", "completed"].includes(a.status)).length,
          totalCount:          (appMap[j._id.toString()] ?? []).length,
        }))
        .filter(j => j.totalCount > 0);

      return NextResponse.json({ jobs: result });
    }

    // ══════════════════════════════════════════════════════
    // ไม่ match case ไหนเลย
    // ══════════════════════════════════════════════════════
    return NextResponse.json(
      { error: "กรุณาระบุ jobId, role หรือ phase ให้ถูกต้อง" },
      { status: 400 }
    );

  } catch (error: any) {
    console.error("[GET /api/applications] Error:", error);
    return NextResponse.json({ error: "เกิดข้อผิดพลาด", details: error.message }, { status: 500 });
  }
}
