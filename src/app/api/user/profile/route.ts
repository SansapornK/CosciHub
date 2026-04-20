// src/app/api/user/profile/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import connectToDatabase from "@/libs/mongodb";
import User from "@/models/User";
import { uploadToCloudinary, deleteFromCloudinary } from "@/libs/cloudinary";

// Get the user profile
export async function GET(req: NextRequest) {
  try {
    // Get the authenticated user
    const session = await getServerSession();

    if (!session || !session.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Connect to the database
    await connectToDatabase();

    // Get the user from the database
    const user = await User.findOne({ email: session.user.email }).exec();

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Return the user data (exclude sensitive information)
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
      profileImageUrl: user.profileImageUrl,
      resumeUrl: user.resumeUrl,
      verificationStatus: user.verificationStatus,
      galleryImages: user.galleryImages || [],
    });
  } catch (error) {
    console.error("Error fetching user profile:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

// Update the user profile
export async function PATCH(req: NextRequest) {
  try {
    // Get the authenticated user
    const session = await getServerSession();

    if (!session || !session.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Connect to the database
    await connectToDatabase();

    // Get the user from the database
    const user = await User.findOne({ email: session.user.email }).exec();

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Parse the request body
    const formData = await req.formData();

    // Extract the data to update
    const firstName = formData.get("firstName") as string;
    const lastName = formData.get("lastName") as string;
    const bio = formData.get("bio") as string;

    // Update skills if provided
    const skillsString = formData.get("skills") as string;
    const skills = skillsString ? JSON.parse(skillsString) : undefined;

    const experiencesString = formData.get("experiences");

    // Create update object with only the fields that were provided
    const updateData: any = {};

    if (firstName !== null) updateData.firstName = firstName as string;
    if (lastName !== null) updateData.lastName = lastName as string;

    // อัปเดต Full Name เฉพาะเมื่อมีการเปลี่ยนชื่อหรือนามสกุลจริง ๆ
    if (firstName !== null || lastName !== null) {
      const finalFirstName = firstName !== null ? firstName : user.firstName;
      const finalLastName = lastName !== null ? lastName : user.lastName;
      updateData.name = `${finalFirstName} ${finalLastName}`.trim();
    }

    if (bio !== null) {
      updateData.bio = bio as string;
    }

    if (skillsString !== null) {
      try {
        updateData.skills = JSON.parse(skillsString as string);
      } catch (e) {
        // ถ้าไม่ใช่ JSON ให้ fallback เป็น split comma
        updateData.skills = (skillsString as string)
          .split(",")
          .filter((s) => s.trim());
      }
    }

    // เพิ่มส่วนนี้ก่อนการ findOneAndUpdate
    if (experiencesString !== null) {
      try {
        // ✅ แปลง JSON string (เช่น '["งาน A", "งาน B"]') กลับเป็น Array จริงๆ
        const parsedExperiences = JSON.parse(experiencesString as string);

        if (Array.isArray(parsedExperiences)) {
          updateData.experiences = parsedExperiences;
        }
      } catch (e) {
        // Fallback กรณีข้อมูลไม่ได้มาเป็น JSON
        updateData.experiences = [experiencesString as string].filter((s) =>
          s.trim(),
        );
      }
    }

    // Handle profile image update if provided
    const profileImage = formData.get("profileImage") as File | null;

    if (profileImage) {
      // Convert the file to a buffer and then to base64
      const bytes = await profileImage.arrayBuffer();
      const buffer = Buffer.from(bytes);
      const base64Image = `data:${profileImage.type};base64,${buffer.toString("base64")}`;

      // Upload to Cloudinary
      const profileImageUrl = await uploadToCloudinary(
        base64Image,
        user._id.toString(),
        "profileImage",
      );
      updateData.profileImageUrl = profileImageUrl;
    }

    // Handle resume file for students
    if (user.role === "student") {
      // Check if resume should be deleted
      const deleteResume = formData.get("deleteResume") === "true";

      if (deleteResume) {
        if (user.resumeUrl) {
          const success = await deleteFromCloudinary(user.resumeUrl);
          if (success) {
            console.log("ลบไฟล์จริงจาก Cloudinary สำเร็จ");
          } else {
            console.log(
              "⚠️ สั่งลบสำเร็จแต่ Cloudinary หาไฟล์ไม่เจอ (อาจลบไปแล้วหรือ path ผิด)",
            );
          }
        }
        updateData.resumeUrl = null;
      } else {
        // Upload new resume if provided
        const resume = formData.get("resume") as File | null;

        if (resume) {
          // Convert the file to a buffer and then to base64
          const bytes = await resume.arrayBuffer();
          const buffer = Buffer.from(bytes);
          const base64File = `data:${resume.type};base64,${buffer.toString("base64")}`;

          const fileName = `resume_${user.studentId || user._id}`;
          // Upload to Cloudinary
          const resumeUrl = await uploadToCloudinary(
            base64File,
            user._id.toString(),
            "resume",
            fileName,
          );
          updateData.resumeUrl = resumeUrl;
        }
      }

      // Handle gallery images
      // Initialize gallery images if they don't exist
      if (!user.galleryImages) {
        user.galleryImages = [];
      }

      // Handle deleted gallery images
      const deletedGalleryImagesStr = formData.get(
        "deletedGalleryImages",
      ) as string;
      if (deletedGalleryImagesStr) {
        console.log("Processing deleted gallery images");
        try {
          const deletedGalleryImages = JSON.parse(deletedGalleryImagesStr);
          console.log("Parsed deletedGalleryImages:", deletedGalleryImages);

          if (
            Array.isArray(deletedGalleryImages) &&
            deletedGalleryImages.length > 0
          ) {
            // Remove deleted images from the array
            updateData.galleryImages = user.galleryImages.filter(
              (url: string) => !deletedGalleryImages.includes(url),
            );

            console.log(
              `Will remove ${deletedGalleryImages.length} images from user gallery`,
            );

            // Delete each image from Cloudinary
            for (const imageUrl of deletedGalleryImages) {
              console.log("Attempting to delete from Cloudinary:", imageUrl);
              const deleted = await deleteFromCloudinary(imageUrl);
              console.log(
                "Image delete result:",
                deleted ? "Success" : "Failed",
              );
            }
          } else {
            console.log("No valid image URLs to delete");
          }
        } catch (error) {
          console.error("Error processing or deleting gallery images:", error);
          // Even if delete fails, continue with DB update
          updateData.galleryImages = [...user.galleryImages];
        }
      } else {
        // If no deleted images were specified, keep the existing ones
        updateData.galleryImages = [...user.galleryImages];
      }

      // Handle new gallery images
      const newGalleryImages: string[] = [];

      // Process up to 6 new gallery images
      for (let i = 0; i < 6; i++) {
        const galleryImage = formData.get(`galleryImage${i}`) as File | null;

        if (galleryImage) {
          // Convert the file to a buffer and then to base64
          const bytes = await galleryImage.arrayBuffer();
          const buffer = Buffer.from(bytes);
          const base64Image = `data:${galleryImage.type};base64,${buffer.toString("base64")}`;

          // Generate a unique ID for the gallery image
          const uniqueId = `gallery_${Date.now()}_${i}`;

          // Upload to Cloudinary with a unique ID for each gallery image
          const galleryImageUrl = await uploadToCloudinary(
            base64Image,
            user._id.toString(),
            "gallery", // Use specific gallery type
            uniqueId, // Create a unique ID for each image
          );

          newGalleryImages.push(galleryImageUrl);
        }
      }

      // Combine existing (minus deleted) and new gallery images, up to max of 6
      if (newGalleryImages.length > 0) {
        const currentGalleryImages =
          updateData.galleryImages || user.galleryImages || [];
        updateData.galleryImages = [
          ...currentGalleryImages,
          ...newGalleryImages,
        ].slice(0, 6);
      }
    }

    // Update the user
    const updatedUser = await User.findOneAndUpdate(
      { email: session.user.email },
      { $set: updateData },
      { new: true },
    ).exec();

    // Return the updated user data
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
      profileImageUrl: updatedUser.profileImageUrl,
      resumeUrl: updatedUser.resumeUrl,
      galleryImages: updatedUser.galleryImages || [],
    });
  } catch (error) {
    console.error("Error updating user profile:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

// API Route
export const config = {
  api: {
    bodyParser: {
      sizeLimit: '10mb', 
    },
  },
};
