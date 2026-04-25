// src/app/api/user/profile/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import connectToDatabase from "@/libs/mongodb";
import User from "@/models/User";
import { uploadToCloudinary, deleteFromCloudinary } from "@/libs/cloudinary";

const slugify = (str: string) =>
  str
    .toLowerCase()
    .replace(/[^\x00-\x7F]/g, "")
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "") || "file";

const generateUniqueFileName = (originalName: string, existingFiles: any[]) => {
  const lastDotIndex = originalName.lastIndexOf(".");
  if (lastDotIndex === -1) return originalName;
  const nameOnly = originalName.substring(0, lastDotIndex);
  const extension = originalName.substring(lastDotIndex);
  let newName = originalName;
  let counter = 1;
  while (existingFiles.some((file) => file.name === newName)) {
    newName = `${nameOnly} (${counter})${extension}`;
    counter++;
  }
  return newName;
};

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session || !session.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    await connectToDatabase();
    const user = await User.findOne({ email: session.user.email }).exec();
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }
    return NextResponse.json({
      name: user.name,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      role: user.role,
      major: user.major,
      skills: user.skills,
      studentId: user.studentId,
      bio: user.bio,
      experiences: user.experiences || [],
      contactInfo: user.contactInfo || [],
      profileImageUrl: user.profileImageUrl,
      resumeFiles: user.resumeFiles || [],
      verificationStatus: user.verificationStatus,
      galleryImages: user.galleryImages || [],
    });
  } catch (error) {
    console.error("Error fetching user profile:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session || !session.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    await connectToDatabase();
    const user = await User.findOne({ email: session.user.email }).exec();
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const formData = await req.formData();
    const firstName = formData.get("firstName") as string;
    const lastName = formData.get("lastName") as string;
    const bio = formData.get("bio") as string;
    const contactInfoString = formData.get("contactInfo") as string;
    const skillsString = formData.get("skills") as string;
    const experiencesString = formData.get("experiences");
    const updateData: any = {};

    if (firstName !== null) updateData.firstName = firstName;
    if (lastName !== null) updateData.lastName = lastName;
    if (firstName !== null || lastName !== null) {
      const finalFirstName = firstName !== null ? firstName : user.firstName;
      const finalLastName = lastName !== null ? lastName : user.lastName;
      updateData.name = `${finalFirstName} ${finalLastName}`.trim();
    }
    if (bio !== null) updateData.bio = bio;

    if (contactInfoString !== null) {
      try {
        const parsed = JSON.parse(contactInfoString);
        if (Array.isArray(parsed)) {
          updateData.contactInfo = parsed.filter((s: string) => s.trim() !== "");
        }
      } catch {
        updateData.contactInfo = [contactInfoString].filter((s) => s.trim());
      }
    }

    if (skillsString !== null) {
      try {
        updateData.skills = JSON.parse(skillsString);
      } catch {
        updateData.skills = skillsString.split(",").filter((s) => s.trim());
      }
    }

    if (experiencesString !== null) {
      try {
        const parsed = JSON.parse(experiencesString as string);
        if (Array.isArray(parsed)) updateData.experiences = parsed;
      } catch {
        updateData.experiences = [experiencesString as string].filter((s) => s.trim());
      }
    }

    // --- Gallery ---
    const deletedImagesStr = formData.get("deletedGalleryImages") as string;
    let currentGallery = [...(user.galleryImages || [])];
    if (deletedImagesStr) {
      try {
        const deletedUrls = JSON.parse(deletedImagesStr);
        if (Array.isArray(deletedUrls)) {
          for (const url of deletedUrls) await deleteFromCloudinary(url);
          currentGallery = currentGallery.filter((url) => !deletedUrls.includes(url));
        }
      } catch (e) {
        console.error("Gallery delete error", e);
      }
    }
    const newGalleryLinks = [];
    for (let i = 0; i < 6; i++) {
      const file = formData.get(`galleryImage${i}`) as File | null;
      if (file) {
        const bytes = await file.arrayBuffer();
        const base64 = `data:${file.type};base64,${Buffer.from(bytes).toString("base64")}`;
        const url = await uploadToCloudinary(
          base64,
          user._id.toString(),
          "gallery",
          `gallery_${Date.now()}_${i}`,
        );
        newGalleryLinks.push(url);
      }
    }
    if (newGalleryLinks.length > 0 || deletedImagesStr) {
      updateData.galleryImages = [...currentGallery, ...newGalleryLinks].slice(0, 6);
    }

    // --- Profile Image ---
    const profileImage = formData.get("profileImage") as File | null;
    if (profileImage) {
      const bytes = await profileImage.arrayBuffer();
      const base64Image = `data:${profileImage.type};base64,${Buffer.from(bytes).toString("base64")}`;
      updateData.profileImageUrl = await uploadToCloudinary(
        base64Image,
        user._id.toString(),
        "profileImage",
      );
    }

    // --- Resume (students only) ---
    if (user.role === "student") {
      let currentResumes = [...(user.resumeFiles || [])];

      // ลบไฟล์
      const deleteIndexStr = formData.get("deleteResumeIndex");
      if (deleteIndexStr !== null) {
        const idx = parseInt(deleteIndexStr as string);
        if (currentResumes[idx]) {
          await deleteFromCloudinary(currentResumes[idx].url);
          currentResumes.splice(idx, 1);
        }
        updateData.resumeFiles = currentResumes;
      }

      // อัปโหลด / แทนที่
      const resumeFile = formData.get("resume") as File | null;
      const replaceIndexStr = formData.get("replaceIndex");
      if (resumeFile) {
        const finalName = generateUniqueFileName(resumeFile.name, currentResumes);
        const baseName = finalName.substring(0, finalName.lastIndexOf(".")) || finalName;
        const uniqueCloudinaryId = `${slugify(baseName)}_${Date.now()}`;

        const bytes = await resumeFile.arrayBuffer();
        const base64File = `data:${resumeFile.type};base64,${Buffer.from(bytes).toString("base64")}`;
        const uploadedUrl = await uploadToCloudinary(
          base64File,
          user._id.toString(),
          "resume",
          uniqueCloudinaryId,
        );

        const newFileData = {
          name: finalName,
          url: uploadedUrl,
          size: (resumeFile.size / (1024 * 1024)).toFixed(2) + " MB",
          uploadedAt: new Date(),
        };

        if (replaceIndexStr !== null) {
          const idx = parseInt(replaceIndexStr as string);
          if (currentResumes[idx]) {
            await deleteFromCloudinary(currentResumes[idx].url);
            currentResumes[idx] = newFileData;
          }
        } else {
          if (currentResumes.length < 3) currentResumes.push(newFileData);
        }
        updateData.resumeFiles = currentResumes;
      }
    }

    const updatedUser = await User.findOneAndUpdate(
      { email: session.user.email },
      { $set: updateData },
      { new: true },
    ).exec();

    return NextResponse.json({
      name: updatedUser.name,
      firstName: updatedUser.firstName,
      lastName: updatedUser.lastName,
      email: updatedUser.email,
      role: updatedUser.role,
      major: updatedUser.major,
      skills: updatedUser.skills,
      studentId: updatedUser.studentId,
      bio: updatedUser.bio,
      experiences: updatedUser.experiences || [],
      contactInfo: updatedUser.contactInfo || [],
      profileImageUrl: updatedUser.profileImageUrl,
      resumeFiles: updatedUser.resumeFiles || [],
      galleryImages: updatedUser.galleryImages || [],
    });
  } catch (error) {
    console.error("Error updating user profile:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export const config = {
  api: {
    bodyParser: { sizeLimit: "10mb" },
  },
};