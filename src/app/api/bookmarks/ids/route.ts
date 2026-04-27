// bookmarks/ids/route.ts
import { NextResponse } from "next/server";
import dbConnect from "@/libs/mongodb"; 
import Bookmark from "@/models/Bookmark";
import { getServerSession } from "next-auth";
import { authOptions } from "@/libs/auth";


export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return NextResponse.json({ ids: [] });

  await dbConnect();
  // ดึงเฉพาะฟิลด์ jobId ของ User คนนี้ออกมา
  const bookmarks = await Bookmark.find({ userEmail: session.user.email }).select('jobId');
  const ids = bookmarks.map(b => b.jobId.toString());

  return NextResponse.json({ ids });
}