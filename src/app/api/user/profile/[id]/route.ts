// src/app/api/user/profile/[id]/route.ts

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import User from "@/models/User";
import connectToDatabase from "@/libs/mongodb";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    await connectToDatabase();

    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await User.findById(params.id).select(
      "firstName lastName name profileImageUrl bio skills experiences galleryImages resumeFiles major role avgRating totalReviews",
    );

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({
      _id: user._id.toString(),
      firstName: user.firstName,
      lastName: user.lastName,
      name: user.name,
      profileImageUrl: user.profileImageUrl,
      bio: user.bio,
      skills: user.skills,
      experiences: user.experiences,
      galleryImages: user.galleryImages,
      resumeFiles: user.resumeFiles || [],
      major: user.major,
      role: user.role,
    });
  } catch (error: any) {
    console.error("Public profile error:", error.message);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
