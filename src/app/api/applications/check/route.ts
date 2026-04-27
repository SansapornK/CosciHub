// src/app/api/applications/check/route.ts
import { NextResponse } from "next/server";
import connectToDatabase from "@/libs/mongodb";
import Application from "@/models/Application";
import User from "@/models/User";
import { getServerSession } from "next-auth";
import { authOptions } from "@/libs/auth";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const jobId = searchParams.get("jobId");

    const session = await getServerSession(authOptions);

    if (!session?.user?.email || !jobId) {
      return NextResponse.json({ hasApplied: false });
    }

    await connectToDatabase();

    const alreadyApplied = await Application.findOne({
      jobId,
      applicantEmail: session.user.email,
    }).lean();

    return NextResponse.json({ hasApplied: !!alreadyApplied });

  } catch (error: any) {
    console.error("[GET /api/applications/check] Error:", error);
    return NextResponse.json({ hasApplied: false }); // fail gracefully
  }
}