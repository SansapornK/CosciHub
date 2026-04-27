// app/api/bookmarks/route.ts
import { NextResponse } from "next/server";
import dbConnect from "@/libs/mongodb"; 
import Bookmark from "@/models/Bookmark";
import { getServerSession } from "next-auth";
import { authOptions } from "@/libs/auth";
import Job from "@/models/Job";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ bookmarks: [] });
    }

    await dbConnect();

    const bookmarks = await Bookmark.find({ userEmail: session.user.email })
      .populate("jobId") 
      .sort({ createdAt: -1 }); 
    const savedJobs = bookmarks
      .filter((b) => b.jobId !== null)
      .map((b) => b.jobId);

    return NextResponse.json({ bookmarks: savedJobs });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();
    const { jobId } = await req.json();

    if (!jobId) {
      return NextResponse.json({ error: "Job ID is required" }, { status: 400 });
    }

    const existing = await Bookmark.findOne({ 
      jobId, 
      userEmail: session.user.email 
    });

    if (existing) {
      await Bookmark.findByIdAndDelete(existing._id);
      return NextResponse.json({ isBookmarked: false });
    } else {
      await Bookmark.create({ 
        jobId, 
        userEmail: session.user.email 
      });
      return NextResponse.json({ isBookmarked: true });
    }
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}