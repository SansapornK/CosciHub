// app/api/bookmarks/check/route.ts
import { NextResponse } from "next/server";
import dbConnect from "@/libs/mongodb"; 
import Bookmark from "@/models/Bookmark";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const jobId = searchParams.get("jobId");
  const session = await getServerSession(authOptions);

  if (!session?.user?.email || !jobId) {
    return NextResponse.json({ isBookmarked: false });
  }

  await dbConnect();
  // ค้นหาใน Collection Bookmark
  const found = await Bookmark.findOne({ jobId, userEmail: session.user.email });
  return NextResponse.json({ isBookmarked: !!found });
}