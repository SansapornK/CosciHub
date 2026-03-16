// app/api/applications/check/route.ts
import { NextResponse } from "next/server";
import connectToDatabase from '@/libs/mongodb';
import Application from "@/models/Application";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const jobId = searchParams.get("jobId");
  const session = await getServerSession(authOptions);

  if (!session?.user?.email || !jobId) {
    return NextResponse.json({ hasApplied: false });
  }

  await connectToDatabase();
  const alreadyApplied = await Application.findOne({
    jobId,
    applicantEmail: session.user.email
  });

  return NextResponse.json({ hasApplied: !!alreadyApplied });
}