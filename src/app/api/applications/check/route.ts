// src/app/api/applications/check/route.ts
import { NextResponse } from "next/server";
import connectToDatabase from "@/libs/mongodb";
import Application from "@/models/Application";
import User from "@/models/User";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const jobId = searchParams.get("jobId");

    const session = await getServerSession(authOptions);

    // ถ้าไม่ได้ login หรือไม่มี jobId → ตอบ false เฉยๆ ไม่ error
    if (!session?.user?.email || !jobId) {
      return NextResponse.json({ hasApplied: false });
    }

    await connectToDatabase();

    // ✅ ค้นหาด้วย email (รองรับทั้ง doc เก่าและใหม่)
    const alreadyApplied = await Application.findOne({
      jobId,
      applicantEmail: session.user.email,
    }).lean();

    return NextResponse.json({ hasApplied: !!alreadyApplied });

  } catch (error: any) {
    // ✅ มี try/catch ป้องกัน 500
    console.error("[GET /api/applications/check] Error:", error);
    return NextResponse.json({ hasApplied: false }); // fail gracefully
  }
}