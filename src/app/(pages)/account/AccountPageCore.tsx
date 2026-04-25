// src/app/(pages)/account/AccountPageCore.tsx

"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import React, { useState, useRef, useEffect } from "react";
import axios from "axios";
import EditProfileForm from "../../components/account/EditProfileForm";
import SkillsModal from "../../components/modals/SkillsModal";
import ImageCropModal from "@/app/components/auth/register/steps/ImageCropModal";
import {
  Star,
  Briefcase,
  User,
  Pencil,
  CheckCircle,
  Sparkles,
  ArrowRight,
  Plus,
  Trash,
  Images,
  ImagePlus,
  FileText,
  AlertCircle,
  Upload,
} from "lucide-react";

// ─── PaginatedGrid (เหมือนเดิม) ───────────────────────────────────────────────
const PaginatedGrid = ({ items, page, setPage, renderItem }: any) => {
  const ITEMS_PER_PAGE = 3;
  const total = items.length;
  const totalPages = Math.ceil(total / ITEMS_PER_PAGE);
  const paginated = items.slice(
    page * ITEMS_PER_PAGE,
    (page + 1) * ITEMS_PER_PAGE,
  );

  return (
    <div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {paginated.map((item: any, index: number) => renderItem(item, index))}
      </div>
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-3 mt-10">
          <button
            onClick={() => setPage(Math.max(0, page - 1))}
            disabled={page === 0}
            className="p-2 rounded-full border border-gray-200 text-gray-400 hover:bg-gray-50 disabled:opacity-20 transition-all"
          >
            <ArrowRight className="rotate-180" size={16} />
          </button>
          <div className="flex gap-1.5">
            {Array.from({ length: totalPages }).map((_, i) => (
              <button
                key={i}
                onClick={() => setPage(i)}
                className={`h-1.5 rounded-full transition-all ${i === page ? "w-6 bg-[#0C5BEA]" : "w-1.5 bg-gray-200"}`}
              />
            ))}
          </div>
          <button
            onClick={() => setPage(Math.min(totalPages - 1, page + 1))}
            disabled={page === totalPages - 1}
            className="p-2 rounded-full border border-gray-200 text-gray-400 hover:bg-gray-50 disabled:opacity-20 transition-all"
          >
            <ArrowRight size={16} />
          </button>
        </div>
      )}
    </div>
  );
};

// ─── Props ────────────────────────────────────────────────────────────────────
interface AccountPageCoreProps {
  profileId?: string; // ไม่ส่ง = โปรไฟล์ตัวเอง
}

// ─── Main Component ───────────────────────────────────────────────────────────
function AccountPageCore({ profileId }: AccountPageCoreProps) {
  const { data: session, status } = useSession();
  const router = useRouter();

  const isOwnProfile = !profileId || profileId === session?.user?.id;

  const [userData, setUserData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [isEditingHeader, setIsEditingHeader] = useState(false);
  const [cropImage, setCropImage] = useState<string | null>(null);
  const [tempBio, setTempBio] = useState("");
  const [isSkillsModalOpen, setIsSkillsModalOpen] = useState(false);
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  const [isSkillsExpanded, setIsSkillsExpanded] = useState(false);
  const [isAddingExp, setIsAddingExp] = useState(false);
  const [newExp, setNewExp] = useState("");
  const [isEditingExps, setIsEditingExps] = useState(false);
  const [editingIdx, setEditingIdx] = useState<number | null>(null);
  const [editValue, setEditValue] = useState("");
  const [isEditingResume, setIsEditingResume] = useState(false);
  const [reviews, setReviews] = useState<any[]>([]);
  const [page3, setPage3] = useState(0);

  const experienceScrollRef = useRef<HTMLDivElement>(null);

  const skillsRef = useRef<HTMLElement>(null);
  const expRef = useRef<HTMLElement>(null);
  const resumeRef = useRef<HTMLElement>(null);
  const bioRef = useRef<HTMLDivElement>(null);

  // scroll helper
  const scrollTo = (ref: React.RefObject<HTMLElement | HTMLDivElement>) => {
    ref.current?.scrollIntoView({ behavior: "smooth", block: "center" });
  };

  useEffect(() => {
    if (experienceScrollRef.current) {
      experienceScrollRef.current.scrollTo({
        top: experienceScrollRef.current.scrollHeight,
        behavior: "smooth",
      });
    }
  }, [userData?.experiences?.length]);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth?state=login");
    }
  }, [status, router]);

  useEffect(() => {
    const fetchUserData = async () => {
      if (status !== "authenticated" || !session) return;

      try {
        setIsLoading(true);

        // ✅ เลือก endpoint ตามว่าดูของตัวเองหรือคนอื่น
        const endpoint = isOwnProfile
          ? "/api/user/profile"
          : `/api/user/profile/${profileId}`;

        const profileResponse = await axios.get(endpoint);
        const userProfile = profileResponse.data;
        setUserData(userProfile);

        if (userProfile?.role) {
          const requestRole =
            userProfile.role === "student" ? "student" : "owner";
          const appsResponse = await axios.get("/api/applications", {
            params: {
              ownerId: userProfile._id, // ✅ ส่ง ownerId เสมอ
              role: requestRole,
              phase: "completed",
            },
            // params: {
            //   ownerId: userProfile._id,
            //   role: requestRole,
            //   phase: "completed",
            // },
          });

          const rawJobs = appsResponse.data.jobs || [];
          const rawApps = appsResponse.data.applications || [];
          let allHiredApps: any[] =
            rawJobs.length > 0
              ? rawJobs.flatMap((j: any) => j.workers || [])
              : rawApps;

          const actualReviews = allHiredApps
            .filter((app: any) =>
              userProfile.role === "student"
                ? !!app.ownerReview?.rating
                : !!app.studentReview?.rating,
            )
            .map((app: any) => {
              const isStudent = userProfile.role === "student";
              const reviewData = isStudent
                ? app.ownerReview
                : app.studentReview;
              return {
                id: app._id,
                rating: reviewData?.rating || 0,
                comment: reviewData?.comment || "",
                isAnonymous: reviewData?.isAnonymous || false,
                ownerName: isStudent
                  ? app.jobOwner || "ผู้ว่าจ้าง"
                  : app.applicantName || "นิสิต",
                ownerImage: isStudent ? app.jobOwnerImage : app.profileImageUrl,
                jobTitle: app.jobTitle || "งานที่เสร็จสิ้น",
                date: app.updatedAt,
              };
            });

          setReviews(actualReviews);

          if (actualReviews.length > 0) {
            const sum = actualReviews.reduce(
              (acc: number, item: any) => acc + item.rating,
              0,
            );
            const avg = (sum / actualReviews.length).toFixed(1);
            setUserData((prev: any) => ({
              ...prev,
              avgRating: avg,
              totalReviews: actualReviews.length,
            }));
          }
        }
      } catch (error: any) {
        console.error("Fetch Data Error:", error.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserData();
  }, [session, status, profileId, isOwnProfile]);

  // ─── Loading ───────────────────────────────────────────────────────────────
  if (status === "loading" || isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <div className="w-12 h-12 border-4 border-primary-blue-400 border-t-transparent rounded-full animate-spin" />
        <p className="mt-4 text-gray-500">กำลังโหลดข้อมูล...</p>
      </div>
    );
  }

  // ─── Edit Mode (เฉพาะเจ้าของ) ─────────────────────────────────────────────
  if (isEditing && userData && isOwnProfile) {
    return (
      <div className="w-full mx-auto">
        <EditProfileForm
          userData={userData}
          onUpdateSuccess={(data) => {
            setUserData(data);
            setIsEditing(false);
          }}
          onCancel={() => setIsEditing(false)}
        />
      </div>
    );
  }

  // ─── handleUpdateField (เฉพาะเจ้าของ) ────────────────────────────────────
  const handleUpdateField = async (field: string, value: any) => {
    if (!isOwnProfile) return; // guard เผื่อถูกเรียกผิดที่
    try {
      setIsLoading(true);
      let formData = new FormData();

      if (value instanceof FormData) {
        formData = value;
      } else if (field === "name") {
        const nameParts = value.trim().split(/\s+/);
        formData.append("firstName", nameParts[0] || "");
        formData.append("lastName", nameParts.slice(1).join(" ") || "");
      } else if (Array.isArray(value)) {
        formData.append(field, JSON.stringify(value));
      } else {
        formData.append(field, value);
      }

      const response = await axios.patch("/api/user/profile", formData);
      setUserData((prevData: any) => ({ ...prevData, ...response.data }));
    } catch (error: any) {
      console.error("Update error:", error.response?.data || error.message);
      alert(
        "บันทึกไม่สำเร็จ: " +
          (error.response?.data?.error || "เซิร์ฟเวอร์ขัดข้อง"),
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleCroppedImage = async (file: File) => {
    const formData = new FormData();
    formData.append("profileImage", file);
    await handleUpdateField("profileImage", formData);
    setCropImage(null);
  };

  // ─── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="w-full bg-[#F8FAFC] min-h-screen pb-20">
      <div className="w-full bg-white rounded-b-[4rem] shadow-sm border-b border-gray-100 pb-16">
        <div className="max-w-7xl mx-auto">
          {/* Cover Photo */}
          <div className="px-4 md:px-8 pt-6">
            <div className="relative h-56 md:h-72 bg-gradient-to-tr from-[#E0E7FF] to-[#F0F5FF] rounded-[3rem] overflow-visible shadow-inner">
              {/* Profile Image */}
              <div className="absolute -bottom-34 left-12 md:left-24 z-20">
                <div className="w-44 h-44 md:w-52 md:h-52 rounded-full border-[6px] border-white overflow-hidden bg-white">
                  {userData?.profileImageUrl ? (
                    <img
                      src={userData.profileImageUrl}
                      alt={userData.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-[#0C5BEA] text-white text-6xl font-black">
                      {userData?.name?.charAt(0) || "?"}
                    </div>
                  )}
                </div>

                {/* ✅ ปุ่มเปลี่ยนรูป — เฉพาะเจ้าของ */}
                {isOwnProfile && isEditingHeader && (
                  <label className="absolute bottom-4 right-4 z-30 group cursor-pointer animate-in zoom-in-50 duration-300">
                    <input
                      type="file"
                      className="hidden"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const reader = new FileReader();
                          reader.onload = () =>
                            setCropImage(reader.result as string);
                          reader.readAsDataURL(file);
                          e.target.value = "";
                        }
                      }}
                    />
                    <div className="w-12 h-12 bg-[#F6F6F6] text-[#0C5BEA] rounded-full shadow-xl flex items-center justify-center hover:scale-110 active:scale-95 transition-all">
                      <Pencil size={20} className="text-[#0C5BEA]" />
                    </div>
                    <div className="absolute -bottom-10 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-y-2 group-hover:translate-y-0 pointer-events-none z-50">
                      <div className="relative bg-[#F6F6F6] text-[#0C5BEA] text-[10px] font-medium px-5 py-1.5 rounded-lg whitespace-nowrap shadow-xl">
                        อัปโหลดรูปโปรไฟล์ใหม่
                        <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-[#F6F6F6] rotate-45" />
                      </div>
                    </div>
                  </label>
                )}
              </div>

              {isOwnProfile && (
                <div className="absolute top-8 right-8 z-10">
                  {/* แสดงเฉพาะตอนที่ยังไม่ได้กดแก้ไข (ถ้ากดแล้วให้ปุ่มนี้หายไป) */}
                  {!isEditingHeader && (
                    <button
                      onClick={() => {
                        setTempBio(userData?.bio || "");
                        setIsEditingHeader(true);
                      }}
                      disabled={isLoading}
                      className="p-3.5 rounded-full shadow-xl transition-all active:scale-95 border flex items-center font-black text-sm bg-white/90 backdrop-blur-xl text-[#0C5BEA] border-white px-4 hover:bg-white"
                    >
                      <Pencil size={22} />
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Name & Info */}
          <div className="mt-10 px-12 md:px-24 lg:px-32">
            <div className="flex flex-col md:flex-row justify-between items-start pl-42 md:pl-58">
              <div className="flex flex-col gap-1.5 w-full">
                <h1 className="text-xl md:text-3xl font-black text-gray-900 leading-tight">
                  {userData?.name || "ไม่ระบุชื่อ"}
                </h1>
                <div className="flex flex-wrap gap-2 mt-0.5">
                  <span className="px-3.5 py-1 bg-gray-50/50 text-gray-400 rounded-full text-[11px] font-bold border border-gray-100">
                    {userData?.major || "ไม่ระบุสาขาวิชา"}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-3 mt-6 md:mt-0 pt-1.5 md:pt-2">
                <span className="flex items-center gap-2 px-6 py-2 bg-[#0C5BEA] text-white rounded-full font-black text-[13px] shadow-lg hover:scale-105 transition-transform cursor-default whitespace-nowrap">
                  <User size={15} fill="currentColor" />
                  {userData?.role === "student"
                    ? "นิสิต"
                    : userData?.role === "alumni"
                      ? "ศิษย์เก่า"
                      : "อาจารย์/บุคลากร"}
                </span>
                <div className="flex items-center gap-2 px-5 py-2 bg-[#FFD341] text-white rounded-full font-black text-[13px] shadow-lg hover:scale-105 transition-transform cursor-default whitespace-nowrap group relative">
                  <Star size={15} className="fill-current" />
                  <span className="tabular-nums">
                    {userData?.avgRating || "ยังไม่มีรีวิว"}
                  </span>
                  <div className="absolute -bottom-10 left-1/2 -translate-x-1/2 bg-gray-800 text-white text-[10px] px-3 py-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                    เรตติ้งเฉลี่ยจากผู้ว่าจ้าง
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Bio Section */}
          <div ref={bioRef} className="mt-12 px-12 md:px-24 lg:px-32">
            <div className="max-w-full relative">
              {isOwnProfile && isEditingHeader ? (
                <div className="flex flex-col gap-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
                  <div className="relative w-full">
                    <textarea
                      value={tempBio}
                      onChange={(e) => setTempBio(e.target.value)}
                      maxLength={200}
                      placeholder="แนะนำตัวสั้น ๆ ให้ผู้ว่าจ้างรู้จักคุณมากขึ้น..."
                      className="w-full p-4 pb-10 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none transition-all resize-none min-h-[120px]"
                    />

                    {/* ตัวนับจำนวนตัวอักษรที่วางไว้ใน input */}
                    <div className="absolute bottom-3 right-4 pointer-events-none">
                      <span
                        className={`text-[10px] font-black tabular-nums px-2 py-1 rounded-lg backdrop-blur-sm ${
                          tempBio.length >= 200
                            ? "text-red-500"
                            : "text-gray-400"
                        }`}
                      >
                        {tempBio.length}/200
                      </span>
                    </div>
                  </div>

                  <div className="flex justify-end items-center gap-3 px-2">
                    <button
                      onClick={() => {
                        setTempBio(userData?.bio || "");
                        setIsEditingHeader(false);
                      }}
                      className="px-6 py-3 text-sm font-bold text-gray-400 hover:text-gray-600 transition-colors active:scale-95"
                    >
                      ยกเลิก
                    </button>
                    <button
                      onClick={async () => {
                        const isBioChanged =
                          tempBio.trim() !== (userData?.bio || "");
                        if (isBioChanged) {
                          try {
                            await handleUpdateField("bio", tempBio.trim());
                          } catch {
                            return;
                          }
                        }
                        setIsEditingHeader(false);
                      }}
                      disabled={isLoading}
                      className="flex items-center justify-center gap-2 px-8 py-3 bg-[#10B981] text-white rounded-full font-black text-sm shadow-sm hover:bg-[#059669] active:scale-95 transition-all disabled:opacity-50"
                    >
                      {isLoading ? (
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <CheckCircle size={18} />
                      )}
                      <span>
                        {isLoading ? "กำลังบันทึก..." : "เสร็จสิ้นการแก้ไข"}
                      </span>
                    </button>
                  </div>
                </div>
              ) : (
                /* ส่วนแสดงผล Bio ปกติ (คงเดิม) */
                <div className="flex flex-col items-start gap-3">
                  <p className="text-gray-700 leading-relaxed text-[15px] md:text-base font-medium break-words whitespace-pre-wrap w-full">
                    "
                    {userData?.bio ||
                      "แนะนำตัวเองสั้น ๆ เพื่อให้ผู้ว่าจ้างรู้จักคุณมากขึ้น..."}
                    "
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {isOwnProfile &&
        userData?.role === "student" &&
        (() => {
          const missing = [
            !userData?.bio && {
              key: "bio",
              label: "แนะนำตัว (Bio)",
              desc: "เพิ่มคำแนะนำตัวสั้นๆ ให้ผู้ว่าจ้างรู้จักคุณ",
              status: "ยังไม่กรอก",
              color: "danger",
              onClick: () => {
                setTempBio("");
                setIsEditingHeader(true);
                scrollTo(bioRef);
              },
            },
            (!userData?.skills || userData.skills.length < 5) && {
              key: "skills",
              label: "ความถนัด",
              desc: `มี ${userData?.skills?.length || 0} ทักษะ — แนะนำอย่างน้อย 5`,
              status:
                userData?.skills?.length > 0
                  ? `มี ${userData.skills.length} รายการ`
                  : "ยังไม่กรอก",
              color: userData?.skills?.length > 0 ? "warning" : "danger",
              onClick: () => {
                setSelectedSkills(userData?.skills || []);
                setIsSkillsModalOpen(true);
              },
            },
            (!userData?.experiences || userData.experiences.length === 0) && {
              key: "exp",
              label: "ประสบการณ์",
              desc: "เพิ่มผลงานและประสบการณ์ที่เคยทำ",
              status: "ยังไม่กรอก",
              color: "danger",
              onClick: () => {
                setIsEditingExps(true);
                scrollTo(expRef);
              },
            },
            !userData?.resumeUrl && {
              key: "resume",
              label: "Resume",
              desc: "อัปโหลด Resume เพื่อช่วยให้ผู้ว่าจ้างตัดสินใจเลือกคุณ",
              status: "ยังไม่อัปโหลด",
              color: "danger",
              onClick: () => scrollTo(resumeRef),
            },
          ].filter(Boolean) as any[];

          if (missing.length === 0) return null;

          const colorMap: Record<string, string> = {
            danger: "text-red-500 bg-red-50",
            warning: "text-amber-600 bg-amber-50",
            info: "text-blue-600 bg-blue-50",
          };

          return (
            <div className="max-w-7xl mx-auto px-6 md:px-12 mt-8">
              <p className="text-xs font-bold text-gray-400 uppercase mb-3 flex items-center gap-2">
                <AlertCircle size={13} /> โปรไฟล์ยังไม่สมบูรณ์
              </p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {missing.map((item) => (
                  <button
                    key={item.key}
                    onClick={item.onClick}
                    className="text-left bg-white border border-gray-100 rounded-[1.5rem] p-4 hover:border-[#0C5BEA]/40 hover:shadow-md transition-all active:scale-[0.98] group"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span
                        className={`text-[10px] font-black px-2.5 py-1 rounded-full ${colorMap[item.color]}`}
                      >
                        {item.status}
                      </span>
                      <ArrowRight
                        size={13}
                        className="text-[#0C5BEA] opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all"
                      />
                    </div>
                    <p className="text-[13px] font-black text-gray-800 mb-1">
                      {item.label}
                    </p>
                    <p className="text-[11px] text-gray-400 leading-relaxed">
                      {item.desc}
                    </p>
                  </button>
                ))}
              </div>
            </div>
          );
        })()}

      <div className="max-w-7xl mx-auto px-6 md:px-12 mt-16 space-y-12">
        {userData?.role === "student" && (
          <>
            {/* Skills */}
            <section
              ref={skillsRef}
              className="bg-white rounded-[2.5rem] p-8 md:p-10 shadow-lg shadow-gray-100/50 border border-gray-50/50"
            >
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-xl font-black text-gray-800">ความถนัด</h3>
                {/* ✅ เฉพาะเจ้าของ */}
                {isOwnProfile && (
                  <button
                    onClick={() => {
                      setSelectedSkills(userData?.skills || []);
                      setIsSkillsModalOpen(true);
                    }}
                    className="flex items-center gap-2 text-xs font-black text-gray-500 bg-gray-100/80 px-5 py-2.5 rounded-full hover:bg-gray-800 hover:text-white transition-all active:scale-95"
                  >
                    <Pencil size={12} />
                    <span>แก้ไข</span>
                  </button>
                )}
              </div>
              <div className="flex flex-wrap gap-2.5">
                {userData?.skills?.length > 0 ? (
                  <>
                    {(isSkillsExpanded
                      ? userData.skills
                      : userData.skills.slice(0, 6)
                    ).map((skill: string) => (
                      <span
                        key={skill}
                        className="px-5 py-2 bg-white rounded-full text-[13px] font-bold text-[#0C5BEA] border border-blue-100 shadow-sm hover:shadow-md hover:border-[#0C5BEA] transition-all cursor-default"
                      >
                        {skill}
                      </span>
                    ))}
                    {!isSkillsExpanded && userData.skills.length > 6 && (
                      <button
                        onClick={() => setIsSkillsExpanded(true)}
                        className="px-5 py-2 bg-gray-50/50 border border-gray-200 rounded-full text-[13px] font-bold text-gray-400 hover:text-[#0C5BEA] hover:border-[#0C5BEA] transition-all active:scale-95"
                      >
                        + {userData.skills.length - 6}
                      </button>
                    )}
                    {isSkillsExpanded && userData.skills.length > 6 && (
                      <button
                        onClick={() => setIsSkillsExpanded(false)}
                        className="px-5 py-2 text-[13px] font-bold text-gray-400 hover:text-gray-600 transition-colors flex items-center gap-1 group"
                      >
                        <span>แสดงน้อยลง</span>
                        <ArrowRight
                          size={14}
                          className="rotate-[-90deg] group-hover:translate-y-[-2px] transition-transform"
                        />
                      </button>
                    )}
                  </>
                ) : (
                  <div className="flex items-center gap-2 text-gray-300 italic text-sm py-2">
                    <Sparkles size={14} className="opacity-50" />
                    <span>ยังไม่ได้ระบุความถนัด</span>
                  </div>
                )}
              </div>
            </section>

            {/* Experiences & Portfolio */}
            <section
              ref={expRef}
              className="bg-white rounded-[2.5rem] p-8 md:p-10 shadow-lg shadow-gray-100/50 border border-gray-50/50"
            >
              <div className="flex items-center justify-between mb-5">
                <h3 className="text-xl font-black text-gray-800 tracking-tight">
                  ประสบการณ์และผลงาน
                </h3>
                {/* ✅ เฉพาะเจ้าของ */}
                {isOwnProfile && (
                  <button
                    onClick={() => {
                      setIsEditingExps(!isEditingExps);
                      if (isEditingExps) setIsAddingExp(false);
                    }}
                    className={`flex items-center gap-2 text-xs font-black transition-all active:scale-95 ${
                      isEditingExps
                        ? "bg-[#10B981] text-white px-5 py-2.5 rounded-full shadow-md"
                        : "bg-gray-100/80 text-gray-500 px-5 py-2.5 rounded-full hover:bg-gray-800 hover:text-white"
                    }`}
                  >
                    {isEditingExps ? (
                      <CheckCircle size={16} />
                    ) : (
                      <Pencil size={12} />
                    )}
                    <span>{isEditingExps ? "เสร็จสิ้น" : "แก้ไข"}</span>
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
                <div className="lg:col-span-5 flex flex-col h-[400px]">
                  <div
                    ref={experienceScrollRef}
                    className="flex-1 overflow-y-auto custom-scrollbar pr-2 relative"
                  >
                    <div className="flex flex-col gap-2">
                      {userData?.experiences?.map(
                        (exp: string, idx: number) => (
                          <div
                            key={idx}
                            className="flex items-center justify-between group/item p-4 bg-transparent rounded-[1.5rem] transition-all hover:bg-gray-50/50"
                          >
                            <div className="flex items-center gap-4 flex-1 min-w-0">
                              <div className="shrink-0 text-[#0C5BEA] opacity-30">
                                <Briefcase size={18} />
                              </div>
                              {isEditingExps && editingIdx === idx ? (
                                <div className="flex-1 flex items-center gap-2">
                                  <input
                                    autoFocus
                                    value={editValue}
                                    maxLength={30}
                                    onChange={(e) =>
                                      setEditValue(e.target.value)
                                    }
                                    onBlur={async () => {
                                      if (
                                        editValue.trim() &&
                                        editValue !== exp
                                      ) {
                                        const updated = [
                                          ...userData.experiences,
                                        ];
                                        updated[idx] = editValue.trim();
                                        await handleUpdateField(
                                          "experiences",
                                          updated,
                                        );
                                      }
                                      setEditingIdx(null);
                                    }}
                                    onKeyDown={async (e) => {
                                      if (
                                        e.key === "Enter" &&
                                        editValue.trim()
                                      ) {
                                        const updated = [
                                          ...userData.experiences,
                                        ];
                                        updated[idx] = editValue.trim();
                                        await handleUpdateField(
                                          "experiences",
                                          updated,
                                        );
                                        setEditingIdx(null);
                                      }
                                      if (e.key === "Escape") {
                                        setIsAddingExp(false);
                                        setNewExp("");
                                      }
                                    }}
                                    className="w-full text-[15px] font-bold text-gray-700 outline-none bg-white px-3 py-1 rounded-lg border border-blue-100 shadow-sm"
                                  />
                                  <span className="text-[10px] font-bold text-gray-300 min-w-[35px]">
                                    {editValue.length}/30
                                  </span>
                                </div>
                              ) : (
                                <p
                                  onClick={() => {
                                    if (isEditingExps) {
                                      setEditingIdx(idx);
                                      setEditValue(exp);
                                    }
                                  }}
                                  className={`text-[15px] font-medium text-gray-700 leading-tight truncate ${isEditingExps ? "cursor-text hover:text-[#0C5BEA]" : ""}`}
                                >
                                  {exp}
                                </p>
                              )}
                            </div>
                            {isEditingExps &&
                              isOwnProfile &&
                              editingIdx !== idx && (
                                <div className="flex items-center gap-1">
                                  <button
                                    onClick={() => {
                                      if (!isAddingExp) {
                                        setEditingIdx(idx);
                                        setEditValue(exp);
                                      }
                                    }}
                                    disabled={isAddingExp}
                                    className="shrink-0 text-gray-300 hover:text-[#0C5BEA] transition-all p-2 hover:bg-blue-50 rounded-xl"
                                  >
                                    <Pencil size={16} />
                                  </button>
                                  <button
                                    onClick={async () => {
                                      if (isAddingExp) return;
                                      if (
                                        confirm(
                                          `คุณต้องการลบรายการ "${exp}" ใช่หรือไม่?`,
                                        )
                                      ) {
                                        await handleUpdateField(
                                          "experiences",
                                          userData.experiences.filter(
                                            (_: any, i: number) => i !== idx,
                                          ),
                                        );
                                      }
                                    }}
                                    disabled={isAddingExp}
                                    className="shrink-0 text-red-200 hover:text-red-500 transition-all p-2 hover:bg-red-50 rounded-xl"
                                  >
                                    <Trash size={18} />
                                  </button>
                                </div>
                              )}
                          </div>
                        ),
                      )}
                    </div>

                    {isEditingExps &&
                      (!userData?.experiences ||
                        userData.experiences.length === 0) &&
                      !isAddingExp && (
                        <div className="flex flex-col items-center justify-center py-12 border-2 border-dashed border-gray-100 rounded-[2.5rem] bg-white group animate-in fade-in zoom-in-95">
                          <div className="w-16 h-16 bg-blue-50 rounded-3xl flex items-center justify-center mb-4">
                            <Briefcase size={32} className="text-blue-300" />
                          </div>
                          <h4 className="text-[15px] font-medium text-gray-400 mb-8">
                            เริ่มต้นสร้างประวัติผลงานของคุณ
                          </h4>
                          <button
                            onClick={() => setIsAddingExp(true)}
                            className="flex items-center gap-2 text-[13px] font-medium text-white bg-[#0C5BEA] px-5 py-2.5 rounded-full hover:bg-blue-700 transition-all active:scale-95"
                          >
                            <Plus size={18} strokeWidth={2.5} />
                            <span>เพิ่มผลงาน</span>
                          </button>
                        </div>
                      )}

                    {userData?.experiences?.length > 4 && (
                      <div className="sticky bottom-0 h-10 w-full bg-gradient-to-t from-white via-white/80 to-transparent pointer-events-none" />
                    )}

                    {!isEditingExps &&
                      (!userData?.experiences ||
                        userData.experiences.length === 0) && (
                        <div className="h-full flex flex-col items-center justify-center py-16 opacity-40">
                          <div className="w-16 h-16 bg-gray-50 rounded-3xl flex items-center justify-center mb-4">
                            <Briefcase size={32} className="text-gray-300" />
                          </div>
                          <p className="text-[13px] font-bold text-gray-500">
                            ยังไม่มีข้อมูลผลงานในขณะนี้
                          </p>
                        </div>
                      )}
                  </div>

                  {isEditingExps && isOwnProfile && (
                    <div className="pt-2 sticky bottom-0 bg-white/80 backdrop-blur-md pb-2">
                      {!isAddingExp ? (
                        userData?.experiences?.length > 0 &&
                        userData?.experiences?.length < 10 ? (
                          <button
                            onClick={() => setIsAddingExp(true)}
                            className="flex items-center gap-2 text-xs font-medium text-gray-500 bg-gray-100/80 px-5 py-2.5 rounded-full hover:bg-[#0C5BEA] hover:text-white transition-all active:scale-95 ml-4 mt-2 group"
                          >
                            <Plus
                              size={14}
                              className="group-hover:rotate-90 transition-transform"
                            />
                            <span>
                              เพิ่มผลงาน ({userData?.experiences?.length}/10)
                            </span>
                          </button>
                        ) : userData?.experiences?.length >= 10 ? (
                          <p className="text-[11px] font-medium text-amber-500 ml-6 mt-3 flex items-center gap-1">
                            <AlertCircle size={12} /> เพิ่มได้สูงสุด 10
                            รายการแล้ว
                          </p>
                        ) : null
                      ) : (
                        <div className="bg-white p-6 rounded-[2rem] shadow-2xl shadow-gray-200/50 border border-gray-100 animate-in zoom-in-95 mt-2 mx-2">
                          <div className="flex items-center gap-4 px-1">
                            <div className="shrink-0 w-10 h-10 bg-blue-50 text-[#0C5BEA] rounded-2xl flex items-center justify-center">
                              <Briefcase size={18} />
                            </div>
                            <div className="flex flex-col gap-1 w-full">
                              <input
                                autoFocus
                                value={newExp}
                                maxLength={30}
                                onChange={(e) => setNewExp(e.target.value)}
                                onKeyDown={async (e) => {
                                  if (e.key === "Enter" && newExp.trim()) {
                                    if (userData?.experiences?.length >= 10) {
                                      alert("เพิ่มได้สูงสุด 10 รายการ");
                                      setIsAddingExp(false);
                                      return;
                                    }
                                    const updated = [
                                      ...(userData?.experiences || []),
                                      newExp.trim(),
                                    ];
                                    await handleUpdateField(
                                      "experiences",
                                      updated,
                                    );
                                    setNewExp("");
                                    if (updated.length >= 10)
                                      setIsAddingExp(false);
                                  }
                                  if (e.key === "Escape") setIsAddingExp(false);
                                }}
                                placeholder="ระบุผลงานของคุณ..."
                                className="w-full text-[15px] font-medium text-gray-700 outline-none bg-transparent py-1"
                              />
                              <div className="flex justify-end">
                                <span
                                  className={`text-[10px] font-medium ${newExp.length >= 30 ? "text-amber-500" : "text-gray-300"}`}
                                >
                                  {newExp.length}/30
                                </span>
                              </div>
                            </div>
                          </div>
                          <div className="flex justify-between items-center mt-5 pt-4 border-t border-gray-50 px-1">
                            <div className="flex items-center gap-2">
                              <span className="w-1.5 h-1.5 bg-[#0C5BEA] rounded-full animate-pulse" />
                              <span className="text-[10px] text-gray-400 font-medium uppercase">
                                Enter to Save
                              </span>
                            </div>
                            <div className="flex gap-3">
                              <button
                                onClick={() => {
                                  setIsAddingExp(false);
                                  setNewExp("");
                                }}
                                className="px-4 py-2 text-xs font-medium text-gray-400 hover:text-gray-600"
                              >
                                ยกเลิก
                              </button>
                              <button
                                onClick={async () => {
                                  if (!newExp.trim()) return;
                                  if (userData?.experiences?.length >= 10) {
                                    alert("เพิ่มได้สูงสุด 10 รายการ");
                                    setIsAddingExp(false);
                                    return;
                                  }
                                  const updated = [
                                    ...(userData?.experiences || []),
                                    newExp.trim(),
                                  ];
                                  await handleUpdateField(
                                    "experiences",
                                    updated,
                                  );
                                  setNewExp("");
                                  if (updated.length >= 10)
                                    setIsAddingExp(false);
                                }}
                                className="px-6 py-2 text-xs font-medium text-white bg-[#0C5BEA] rounded-full shadow-lg hover:bg-blue-700 transition-all active:scale-95"
                              >
                                บันทึกรายการ
                              </button>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Gallery */}
                <div className="lg:col-span-7 flex flex-col">
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-5">
                    {/* ✅ ปุ่มอัปโหลด — เฉพาะเจ้าของ */}
                    {isOwnProfile &&
                      isEditingExps &&
                      (userData?.galleryImages?.length || 0) < 6 && (
                        <label className="aspect-square bg-blue-50/50 border-2 border-dashed border-[#0C5BEA]/20 rounded-[2rem] flex flex-col items-center justify-center text-[#0C5BEA] cursor-pointer hover:bg-white transition-all group shadow-sm">
                          <input
                            type="file"
                            className="hidden"
                            accept="image/*"
                            onChange={async (e) => {
                              const file = e.target.files?.[0];
                              if (!file) return;
                              if (file.size > 2 * 1024 * 1024) {
                                alert("ไฟล์รูปภาพมีขนาดใหญ่เกิน 2MB");
                                return;
                              }
                              const f = new FormData();
                              f.append("galleryImage0", file);
                              await handleUpdateField("galleryImage", f);
                              e.target.value = "";
                            }}
                          />
                          <div className="p-4 group-hover:scale-110 transition-all">
                            <Plus size={50} />
                          </div>
                        </label>
                      )}

                    {userData?.galleryImages?.map((img: string, i: number) => (
                      <div
                        key={i}
                        className="relative aspect-square rounded-[2rem] overflow-hidden border-4 border-white shadow-md hover:shadow-xl transition-all group/img"
                      >
                        <img
                          src={img}
                          className="w-full h-full object-cover"
                          alt={`Portfolio ${i}`}
                        />
                        {/* ✅ ปุ่มลบรูป — เฉพาะเจ้าของ */}
                        {isOwnProfile && isEditingExps && (
                          <button
                            onClick={async () => {
                              if (confirm("คุณต้องการลบรูปภาพนี้ใช่หรือไม่?")) {
                                const f = new FormData();
                                f.append(
                                  "deletedGalleryImages",
                                  JSON.stringify([img]),
                                );
                                await handleUpdateField("deleteImage", f);
                              }
                            }}
                            className="absolute top-3 right-3 bg-red-500 text-white rounded-xl p-1.5 shadow-lg active:scale-90 hover:bg-red-600 transition-all opacity-0 group-hover/img:opacity-100"
                          >
                            <Trash size={18} />
                          </button>
                        )}
                      </div>
                    ))}

                    {!isEditingExps &&
                      (!userData?.galleryImages ||
                        userData.galleryImages.length === 0) &&
                      [...Array(6)].map((_, i) => (
                        <div
                          key={i}
                          className="aspect-square bg-gray-50/50 border-2 border-dashed border-gray-100 rounded-[2rem] flex items-center justify-center text-gray-200"
                        >
                          <Images size={40} className="opacity-50" />
                        </div>
                      ))}

                    {isOwnProfile &&
                      isEditingExps &&
                      (userData?.galleryImages?.length || 0) < 6 &&
                      [
                        ...Array(
                          Math.max(
                            0,
                            5 - (userData?.galleryImages?.length || 0),
                          ),
                        ),
                      ].map((_, i) => (
                        <div
                          key={i}
                          className="aspect-square bg-gray-50/50 border-2 border-dotted border-gray-100 rounded-[2rem] flex items-center justify-center text-gray-200"
                        >
                          <ImagePlus size={40} className="opacity-50" />
                        </div>
                      ))}
                  </div>

                  {isOwnProfile && isEditingExps && (
                    <div className="mt-6 animate-in fade-in slide-in-from-top-2 duration-300">
                      <div className="flex items-center gap-2 mb-1">
                        {userData?.galleryImages?.length >= 6 ? (
                          <CheckCircle size={14} className="text-green-500" />
                        ) : (
                          <Sparkles size={14} className="text-gray-400" />
                        )}
                        <p className="text-[12px] font-medium">
                          {userData?.galleryImages?.length >= 6 ? (
                            <span className="text-green-600">
                              อัปโหลดรูปภาพผลงานครบแล้ว (6/6)
                            </span>
                          ) : (
                            <span className="text-gray-400">
                              อัปโหลดรูปภาพตัวอย่างผลงาน{" "}
                              <span className="text-[#0C5BEA]">
                                (สูงสุด 6 รูป, ≤2MB)
                              </span>
                            </span>
                          )}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </section>

            {/* Resume */}
            <section
              ref={resumeRef}
              className="bg-white rounded-[2.5rem] p-8 md:p-10 shadow-lg shadow-gray-100/50 border border-gray-50/50 mt-12"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-black text-gray-800 tracking-tight">
                  Resume
                </h3>
                {/* ✅ ปุ่มแก้ไข Resume — เฉพาะเจ้าของ */}
                {isOwnProfile && userData?.resumeUrl && (
                  <button
                    onClick={() => setIsEditingResume(!isEditingResume)}
                    className={`flex items-center gap-2 text-xs font-black transition-all active:scale-95 ${
                      isEditingResume
                        ? "bg-[#10B981] text-white px-8 py-3 rounded-full shadow-md"
                        : "bg-gray-100/80 text-gray-500 px-5 py-2.5 rounded-full hover:bg-gray-800 hover:text-white"
                    }`}
                  >
                    {isEditingResume ? (
                      <CheckCircle size={16} />
                    ) : (
                      <Pencil size={12} />
                    )}
                    <span>{isEditingResume ? "เสร็จสิ้น" : "แก้ไข"}</span>
                  </button>
                )}
              </div>

              <div className="bg-gray-50/50 p-6 rounded-[2.5rem] border-2 border-dashed border-gray-100">
                {userData?.resumeUrl ? (
                  <div className="relative group animate-in slide-in-from-bottom-2">
                    <a
                      href={userData.resumeUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-4 p-4 bg-white rounded-3xl shadow-sm border border-gray-50 hover:border-[#0C5BEA]/30 hover:shadow-md transition-all group/resume cursor-pointer"
                    >
                      <div className="w-12 h-12 bg-red-50 rounded-2xl flex items-center justify-center text-red-500 shrink-0 group-hover/resume:scale-105 transition-transform">
                        <FileText size={24} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[15px] font-bold text-gray-700 truncate group-hover/resume:text-[#0C5BEA] transition-colors">
                          {userData.resumeUrl.split("/").pop()}
                        </p>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span className="text-[10px] text-gray-400 font-medium">
                            คลิกเพื่อเปิดไฟล์พรีวิว
                          </span>
                          <ArrowRight
                            size={10}
                            className="text-[#0C5BEA] opacity-0 group-hover/resume:translate-x-1 group-hover/resume:opacity-100 transition-all"
                          />
                        </div>
                      </div>
                    </a>

                    {isOwnProfile && isEditingResume && (
                      <>
                        <div className="absolute -top-2 -right-2 animate-in zoom-in-95">
                          <button
                            onClick={async (e) => {
                              e.preventDefault();
                              if (
                                confirm(
                                  "คุณต้องการลบไฟล์ Resume นี้ใช่หรือไม่?",
                                )
                              ) {
                                const formData = new FormData();
                                formData.append("deleteResume", "true");
                                await handleUpdateField("resume", formData);
                                setIsEditingResume(false);
                              }
                            }}
                            className="w-9 h-9 bg-red-500 text-white rounded-full flex items-center justify-center shadow-lg hover:bg-red-600 transition-all active:scale-90"
                          >
                            <Trash size={16} />
                          </button>
                        </div>
                        <div className="flex justify-center mt-6">
                          <label className="cursor-pointer">
                            <input
                              type="file"
                              className="hidden"
                              accept=".pdf"
                              onChange={async (e) => {
                                const file = e.target.files?.[0];
                                if (file) {
                                  const formData = new FormData();
                                  formData.append("resume", file);
                                  await handleUpdateField("resume", formData);
                                  setIsEditingResume(false);
                                }
                              }}
                            />
                            <div className="flex items-center gap-2 px-6 py-2 bg-white border-2 border-[#0C5BEA] text-[#0C5BEA] rounded-xl font-bold text-xs hover:bg-[#0C5BEA] hover:text-white transition-all">
                              <Upload size={14} strokeWidth={3} />
                              <span>เปลี่ยนไฟล์ใหม่</span>
                            </div>
                          </label>
                        </div>
                      </>
                    )}
                  </div>
                ) : // ✅ Upload area — เฉพาะเจ้าของ, คนอื่นเห็น placeholder
                isOwnProfile ? (
                  <div className="flex flex-col items-center justify-center py-10 group">
                    <label className="cursor-pointer">
                      <input
                        type="file"
                        className="hidden"
                        accept=".pdf"
                        onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            if (file.size > 10 * 1024 * 1024) {
                              alert("ไฟล์ขนาดใหญ่เกิน 10MB");
                              return;
                            }
                            const formData = new FormData();
                            formData.append("resume", file);
                            formData.append(
                              "fileName",
                              `resume_${(userData.name || "user").replace(/\s+/g, "_")}`,
                            );
                            await handleUpdateField("resume", formData);
                          }
                        }}
                      />
                      <div className="flex flex-col items-center gap-4">
                        <div className="w-16 h-16 bg-white rounded-[2rem] flex items-center justify-center text-[#0C5BEA]/30 group-hover:text-[#0C5BEA] group-hover:shadow-lg transition-all duration-500">
                          <Upload size={32} strokeWidth={1.5} />
                        </div>
                        <div className="text-center">
                          <h4 className="text-[15px] font-medium text-gray-400 group-hover:text-gray-600">
                            เริ่มต้นอัปโหลด Resume ของคุณ
                          </h4>
                          <p className="text-[10px] font-medium text-gray-300 uppercase mt-1">
                            PDF Only • Max 10MB
                          </p>
                        </div>
                      </div>
                    </label>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-10 opacity-40">
                    <FileText size={32} className="text-gray-300 mb-3" />
                    <p className="text-[13px] font-bold text-gray-500">
                      ยังไม่ได้อัปโหลด Resume
                    </p>
                  </div>
                )}
              </div>
            </section>
          </>
        )}

        {/* Reviews */}
        <section className="bg-white rounded-[2.5rem] p-8 md:p-10 shadow-lg shadow-gray-100/50 border border-gray-50/50 mt-12">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              <h3 className="text-xl font-black text-gray-800">
                {userData?.role === "student"
                  ? "รีวิวจากผู้ว่าจ้าง"
                  : "รีวิวจากนิสิต"}
              </h3>
              {reviews.length > 0 && (
                <div className="flex items-center gap-1.5 px-3 py-1 bg-amber-50 text-amber-600 rounded-lg border border-amber-100 animate-in fade-in">
                  <Star size={12} className="fill-current" />
                  <span className="text-[12px] font-black">
                    {userData?.avgRating}
                  </span>
                </div>
              )}
            </div>
          </div>

          <div className="px-2 md:px-4">
            {reviews.length > 0 ? (
              <PaginatedGrid
                items={reviews}
                page={page3}
                setPage={setPage3}
                renderItem={(review: any, i: number) => (
                  <div
                    key={review.id || i}
                    className="group relative bg-white shadow-sm hover:shadow-xl hover:shadow-blue-900/5 p-7 rounded-[2rem] border border-gray-100 transition-all duration-500 h-[210px] flex flex-col"
                  >
                    <div className="flex flex-col h-full">
                      <div className="flex justify-between items-start mb-5 shrink-0">
                        <div className="flex items-center gap-3 w-full min-w-0">
                          <div className="w-12 h-12 shrink-0 rounded-2xl overflow-hidden bg-gray-50 flex items-center justify-center border border-gray-100">
                            {!review.isAnonymous && review.ownerImage ? (
                              <img
                                src={review.ownerImage}
                                alt={review.ownerName}
                                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                              />
                            ) : (
                              <div className="text-gray-300">
                                <User size={24} fill="currentColor" />
                              </div>
                            )}
                          </div>
                          <div className="flex flex-1 min-w-0 items-center justify-between gap-2">
                            <span className="text-base font-bold text-gray-800 truncate">
                              {review.isAnonymous
                                ? "ไม่ระบุตัวตน"
                                : review.ownerName}
                            </span>
                            <div className="flex shrink-0 gap-0.5">
                              {[...Array(5)].map((_, s) => (
                                <Star
                                  key={s}
                                  size={15}
                                  className={
                                    s < review.rating
                                      ? "text-[#FCD34D] fill-current"
                                      : "text-gray-100 fill-current"
                                  }
                                />
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="flex-1 overflow-hidden">
                        <p className="text-[13px] md:text-[14px] text-gray-500 leading-relaxed font-medium line-clamp-4">
                          {review.comment}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              />
            ) : (
              <div className="py-20 bg-gray-50/50 rounded-[2.5rem] border-2 border-dashed border-gray-100 flex flex-col items-center justify-center gap-4 group">
                <div className="w-16 h-16 bg-white rounded-[2rem] shadow-sm flex items-center justify-center text-gray-200 group-hover:scale-110 group-hover:text-blue-200 transition-all duration-500">
                  <Sparkles size={32} strokeWidth={1.5} />
                </div>
                <div className="text-center">
                  <p className="text-sm font-black text-gray-400 uppercase">
                    ยังไม่มีรีวิวจาก
                    {userData?.role === "student" ? "ผู้ว่าจ้าง" : "นิสิต"}
                  </p>
                  <p className="text-xs text-gray-300 mt-1 font-medium italic">
                    {userData?.role === "student"
                      ? "ส่งงานให้สำเร็จเพื่อรับรีวิวแรกของคุณ!"
                      : "นิสิตที่เคยร่วมงานกับคุณยังไม่ได้ให้รีวิวในขณะนี้"}
                  </p>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* ✅ Logout — เฉพาะเจ้าของ */}
        {/* <div className="mt-24 flex flex-col items-center gap-6">
          {isOwnProfile && <LogOutButton />}
          <p className="text-[9px] font-medium text-gray-300 uppercase">
            COSCI HUB © 2026
          </p>
        </div> */}

        {/* Skills Modal — เฉพาะเจ้าของ */}
        {isOwnProfile && isSkillsModalOpen && (
          <SkillsModal
            isOpen={isOwnProfile && isSkillsModalOpen}
            initialSelected={selectedSkills}
            onClose={() => setIsSkillsModalOpen(false)}
            onSave={(skills) => handleUpdateField("skills", skills)}
          />
        )}

        {/* Crop Modal — เฉพาะเจ้าของ */}
        {isOwnProfile && cropImage && (
          <ImageCropModal
            imageSrc={cropImage}
            onClose={() => setCropImage(null)}
            onSave={handleCroppedImage}
          />
        )}
      </div>
    </div>
  );
}

export default AccountPageCore;
