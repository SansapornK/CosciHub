"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import React, { useState, useRef, useEffect } from "react";
import axios from "axios";
import EditProfileForm from "../../components/account/EditProfileForm";
import SkillsModal from "../../components/modals/SkillsModal";
import ImageCropModal from "@/app/components/auth/register/steps/ImageCropModal";
import { convertToWebP } from "@/utils/imageUtils";
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
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

// ─── Mobile-aware PaginatedGrid (desktop: 3/page, mobile: stays as grid) ─────
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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
        {paginated.map((item: any, index: number) => renderItem(item, index))}
      </div>
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-3 mt-8">
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

// ─── Mobile Single Review Carousel (หน้าละ 1 รีวิว) ──────────────────────────
const MobileReviewCarousel = ({ reviews }: { reviews: any[] }) => {
  const [current, setCurrent] = useState(0);
  const [animating, setAnimating] = useState(false);
  const [direction, setDirection] = useState<"left" | "right">("right");

  const goTo = (idx: number, dir: "left" | "right") => {
    if (animating || idx < 0 || idx >= reviews.length) return;
    setDirection(dir);
    setAnimating(true);
    setTimeout(() => {
      setCurrent(idx);
      setAnimating(false);
    }, 220);
  };

  const review = reviews[current];

  const avatarColors = [
    "#7c3aed",
    "#0891b2",
    "#dc2626",
    "#059669",
    "#9333ea",
    "#0369a1",
    "#be185d",
    "#b45309",
  ];
  const color = avatarColors[current % avatarColors.length];

  return (
    <div className="flex flex-col gap-3">
      {/* Card */}
      <div
        className="relative rounded-[20px] border border-gray-100 bg-white p-5 overflow-hidden"
        style={{
          opacity: animating ? 0 : 1,
          transform: animating
            ? `translateX(${direction === "right" ? "-12px" : "12px"})`
            : "translateX(0)",
          transition: "opacity 0.2s ease, transform 0.2s ease",
        }}
      >
        {/* Reviewer row */}
        <div className="flex items-center gap-3 mb-4">
          <div className="w-11 h-11 rounded-full flex items-center justify-center shrink-0 overflow-hidden relative">
            {review.isAnonymous ? (
              <div className="w-full h-full bg-gray-400 flex items-center justify-center text-white">
                <User size={20} fill="currentColor" />
              </div>
            ) : review.ownerImage ? (
              <img
                src={review.ownerImage}
                alt={review.ownerName}
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
              />
            ) : (
              <div
                className="w-full h-full flex items-center justify-center text-white text-base font-black"
                style={{ background: color || "#0C5BEA" }}
              >
                {review.ownerName?.charAt(0) || "?"}
              </div>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[14px] font-bold text-gray-800 truncate">
              {review.isAnonymous ? "ไม่ระบุตัวตน" : review.ownerName}
            </p>
          </div>
          {/* Stars */}
          <div className="flex gap-0.5 shrink-0">
            {[...Array(5)].map((_, s) => (
              <Star
                key={s}
                size={14}
                className={
                  s < review.rating
                    ? "text-[#FBBF24] fill-current"
                    : "text-gray-200 fill-current"
                }
              />
            ))}
          </div>
        </div>

        {/* Comment */}
        <p className="text-[13px] text-gray-500 leading-relaxed pl-1 line-clamp-4">
          {review.comment || "ไม่มีความคิดเห็น"}
        </p>
      </div>

      {/* Pagination controls */}
      <div className="flex items-center justify-between px-1">
        <button
          onClick={() => goTo(current - 1, "left")}
          disabled={current === 0}
          className="w-9 h-9 rounded-full border border-gray-200 flex items-center justify-center text-gray-400 disabled:opacity-25 active:scale-95 transition-all"
        >
          <ChevronLeft size={17} />
        </button>

        {/* Dot indicators */}
        <div className="flex items-center gap-1.5">
          {reviews.map((_, i) => (
            <button
              key={i}
              onClick={() => goTo(i, i > current ? "right" : "left")}
              className="rounded-full transition-all duration-300"
              style={{
                width: i === current ? 24 : 6,
                height: 6,
                background: i === current ? "#0C5BEA" : "#e5e7eb",
              }}
            />
          ))}
        </div>

        <button
          onClick={() => goTo(current + 1, "right")}
          disabled={current === reviews.length - 1}
          className="w-9 h-9 rounded-full border border-gray-200 flex items-center justify-center text-gray-400 disabled:opacity-25 active:scale-95 transition-all"
        >
          <ChevronRight size={17} />
        </button>
      </div>
    </div>
  );
};

// ─── Props ────────────────────────────────────────────────────────────────────
interface AccountPageCoreProps {
  profileId?: string;
}

const getPreviewUrl = (file: { url: string; name: string }) =>
  `/api/user/profile/preview?url=${encodeURIComponent(file.url)}&name=${encodeURIComponent(file.name)}`;

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
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [reviews, setReviews] = useState<any[]>([]);
  const [page3, setPage3] = useState(0);

  const experienceScrollRef = useRef<HTMLDivElement>(null);
  const skillsRef = useRef<HTMLElement>(null);
  const expRef = useRef<HTMLElement>(null);
  const resumeRef = useRef<HTMLElement>(null);
  const bioRef = useRef<HTMLDivElement>(null);

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
              ownerId: userProfile._id,
              role: requestRole,
              phase: "completed",
            },
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
                ownerImage: isStudent
                  ? app.jobOwnerImage || null
                  : app.profileImageUrl || null,
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
        <div className="w-12 h-12 border-4 border-[#0C5BEA] border-t-transparent rounded-full animate-spin" />
        <p className="mt-4 text-gray-500 text-sm">กำลังโหลดข้อมูล...</p>
      </div>
    );
  }

  // ─── Edit Mode ─────────────────────────────────────────────────────────────
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

  // ─── handleUpdateField ────────────────────────────────────────────────────
  const handleUpdateField = async (field: string, value: any) => {
    if (!isOwnProfile) return;
    try {
      setIsLoading(true);
      let formDataToSend = new FormData();
      if (value instanceof FormData) {
        for (const [key, val] of value.entries()) {
          if (val instanceof File && val.type.startsWith("image/")) {
            try {
              const webpFile = await convertToWebP(val);
              formDataToSend.append(key, webpFile);
            } catch {
              formDataToSend.append(key, val);
            }
          } else {
            formDataToSend.append(key, val);
          }
        }
      } else if (field === "name" && typeof value === "string") {
        const nameParts = value.trim().split(/\s+/);
        formDataToSend.append("firstName", nameParts[0] || "");
        formDataToSend.append("lastName", nameParts.slice(1).join(" ") || "");
      } else if (Array.isArray(value)) {
        formDataToSend.append(field, JSON.stringify(value));
      } else if (value !== null && value !== undefined) {
        formDataToSend.append(field, value);
      }
      const response = await axios.patch("/api/user/profile", formDataToSend);
      if (response.data) setUserData(response.data);
    } catch (error: any) {
      const errorMsg = error.response?.data?.error || error.message;
      console.error("Update error:", errorMsg);
      alert(`บันทึกไม่สำเร็จ: ${errorMsg}`);
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
      {/* ══════════════════════════════════════════════
          HEADER SECTION
      ══════════════════════════════════════════════ */}
      <div className="w-full bg-white shadow-sm border-b border-gray-100 pb-6 md:pb-16 md:rounded-b-[4rem]">
        <div className="max-w-7xl mx-auto">
          {/* ── Cover Banner ── */}
          <div className="px-0 md:px-8 md:pt-6">
            <div className="relative h-36 md:h-72 bg-gradient-to-tr from-[#0C5BEA] via-[#3B82F6] to-[#60A5FA] md:bg-gradient-to-tr md:from-[#E0E7FF] md:to-[#F0F5FF] md:rounded-[3rem] overflow-visible">
              {/* Decorative circles — mobile only */}
              <div className="md:hidden absolute top-0 right-0 w-40 h-40 rounded-full bg-white/10 -translate-y-1/2 translate-x-1/4" />
              <div className="md:hidden absolute bottom-0 left-1/3 w-24 h-24 rounded-full bg-white/5" />

              {/* ── Profile Avatar ── */}
              {/* Mobile: centred above the white card */}
              <div className="md:hidden absolute -bottom-14 left-1/2 -translate-x-1/2 z-20">
                <div className="relative">
                  <div className="w-28 h-28 rounded-full border-4 border-white overflow-hidden bg-white shadow-xl">
                    {userData?.profileImageUrl ? (
                      <img
                        src={userData.profileImageUrl}
                        alt={userData.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-[#0C5BEA] text-white text-4xl font-black">
                        {userData?.name?.charAt(0) || "?"}
                      </div>
                    )}
                  </div>
                  {/* Edit photo button */}
                  {isOwnProfile && isEditingHeader && (
                    <label className="absolute bottom-1 right-1 z-30 cursor-pointer">
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
                      <div className="w-8 h-8 bg-white text-[#0C5BEA] rounded-full shadow-lg flex items-center justify-center border border-gray-100">
                        <Pencil size={14} />
                      </div>
                    </label>
                  )}
                </div>
              </div>

              {/* Desktop avatar (original position) */}
              <div className="hidden md:block absolute -bottom-34 left-12 md:left-24 z-20">
                <div className="w-44 h-44 md:w-52 md:h-52 rounded-full border-[6px] border-white overflow-hidden bg-white shadow-xl">
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
                      <Pencil size={20} />
                    </div>
                  </label>
                )}
              </div>

              {/* Edit profile button — top-right of banner */}
              {isOwnProfile && !isEditingHeader && (
                <div className="absolute top-4 right-4 z-10">
                  <button
                    onClick={() => {
                      setTempBio(userData?.bio || "");
                      setIsEditingHeader(true);
                    }}
                    disabled={isLoading}
                    className="p-3 rounded-full shadow-lg transition-all active:scale-95 border flex items-center gap-1.5 text-xs font-bold bg-white/90 backdrop-blur-xl text-[#0C5BEA] border-white hover:bg-white md:px-4"
                  >
                    <Pencil size={16} />
                    <span className="hidden md:inline">แก้ไขโปรไฟล์</span>
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* ── Mobile: Name block (centred, below avatar) ── */}
          <div className="md:hidden mt-16 px-5 flex flex-col items-center text-center gap-2">
            <h1 className="text-xl font-black text-gray-900 leading-tight">
              {userData?.name || "ไม่ระบุชื่อ"}
            </h1>
            <span className="px-3 py-1 bg-[#EDEDED] text-gray-600 rounded-full text-[11px] font-medium">
              {userData?.major || "ไม่ระบุสาขาวิชา"}
            </span>

            {/* Role + Rating badges */}
            <div className="flex items-center gap-2 mt-1">
              <span className="flex items-center gap-1.5 px-4 py-1.5 bg-[#0C5BEA] text-white rounded-full font-semibold text-[12px]">
                <User size={12} fill="currentColor" />
                {userData?.role === "student"
                  ? "นิสิต"
                  : userData?.role === "alumni"
                    ? "ศิษย์เก่า"
                    : "อาจารย์/บุคลากร"}
              </span>
              <div className="flex items-center gap-1.5 px-4 py-1.5 bg-[#FFD341] text-white rounded-full font-semibold text-[12px]">
                <Star size={12} className="fill-current" />
                <span className="tabular-nums">
                  {userData?.avgRating || "–"}
                </span>
              </div>
            </div>
          </div>

          {/* ── Desktop: Name block (original layout) ── */}
          <div className="hidden md:block mt-10 px-12 md:px-24 lg:px-32">
            <div className="flex flex-col md:flex-row justify-between items-start pl-42 md:pl-58">
              <div className="flex flex-col gap-1.5 w-full">
                <h1 className="text-xl md:text-3xl font-black text-gray-900 leading-tight">
                  {userData?.name || "ไม่ระบุชื่อ"}
                </h1>
                <div className="flex flex-wrap gap-2 mt-0.5">
                  <span className="px-4 py-1.5 bg-[#EDEDED] text-black rounded-full text-[12px]">
                    {userData?.major || "ไม่ระบุสาขาวิชา"}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-3 mt-6 md:mt-0 pt-1.5 md:pt-2">
                <span className="flex items-center gap-2 px-6 py-2 bg-[#0C5BEA] text-white rounded-full font-medium text-[13px] shadow-lg">
                  <User size={15} fill="currentColor" />
                  {userData?.role === "student"
                    ? "นิสิต"
                    : userData?.role === "alumni"
                      ? "ศิษย์เก่า"
                      : "อาจารย์/บุคลากร"}
                </span>
                <div className="flex items-center gap-2 px-5 py-2 bg-[#FFD341] text-white rounded-full font-medium text-[13px] shadow-lg hover:scale-105 transition-transform cursor-default whitespace-nowrap group relative">
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

          {/* ── Bio ── */}
          <div ref={bioRef} className="mt-5 md:mt-12 px-5 md:px-24 lg:px-32">
            <div className="max-w-full relative">
              {isOwnProfile && isEditingHeader ? (
                <div className="flex flex-col gap-3 animate-in fade-in slide-in-from-bottom-2 duration-300">
                  <div className="relative w-full">
                    <textarea
                      value={tempBio}
                      onChange={(e) => setTempBio(e.target.value)}
                      maxLength={200}
                      placeholder="แนะนำตัวสั้น ๆ ให้ผู้ว่าจ้างรู้จักคุณมากขึ้น..."
                      className="w-full p-4 pb-10 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none transition-all resize-none min-h-[100px] text-[14px]"
                    />
                    <div className="absolute bottom-3 right-4 pointer-events-none">
                      <span
                        className={`text-[10px] font-black tabular-nums px-2 py-1 rounded-lg ${
                          tempBio.length >= 200
                            ? "text-red-500"
                            : "text-gray-400"
                        }`}
                      >
                        {tempBio.length}/200
                      </span>
                    </div>
                  </div>
                  <div className="flex justify-end items-center gap-3">
                    <button
                      onClick={() => {
                        setTempBio(userData?.bio || "");
                        setIsEditingHeader(false);
                      }}
                      className="px-5 py-2.5 text-sm font-bold text-gray-400 hover:text-gray-600 transition-colors active:scale-95"
                    >
                      ยกเลิก
                    </button>
                    <button
                      onClick={async () => {
                        if (tempBio.trim() !== (userData?.bio || "")) {
                          try {
                            await handleUpdateField("bio", tempBio.trim());
                          } catch {
                            return;
                          }
                        }
                        setIsEditingHeader(false);
                      }}
                      disabled={isLoading}
                      className="flex items-center justify-center gap-2 px-6 py-2.5 bg-[#10B981] text-white rounded-full font-bold text-sm shadow-sm hover:bg-[#059669] active:scale-95 transition-all disabled:opacity-50"
                    >
                      {isLoading ? (
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <CheckCircle size={16} />
                      )}
                      <span>{isLoading ? "กำลังบันทึก..." : "บันทึก"}</span>
                    </button>
                  </div>
                </div>
              ) : (
                <p className="text-gray-600 leading-relaxed text-[13px] md:text-base break-words whitespace-pre-wrap w-full text-center md:text-left">
                  {userData?.bio || (
                    <span className="text-gray-300 italic">
                      แนะนำตัวเองสั้น ๆ เพื่อให้ผู้ว่าจ้างรู้จักคุณมากขึ้น...
                    </span>
                  )}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════════════
          INCOMPLETE PROFILE BANNER (เจ้าของ + student)
      ══════════════════════════════════════════════ */}
      {isOwnProfile &&
        userData?.role === "student" &&
        (() => {
          const missing = [
            !userData?.bio && {
              key: "bio",
              label: "คำอธิบายตนเอง",
              desc: "เพิ่มคำอธิบายตนเองสั้น ๆ",
              status: "ยังไม่ได้ระบุ",
              color: "danger",
              onClick: () => {
                setTempBio("");
                setIsEditingHeader(true);
                scrollTo(bioRef);
              },
            },
            (!userData?.skills || userData.skills.length < 5) && {
              key: "skills",
              label: "ทักษะของคุณ",
              desc: "ระบุทักษะอย่างน้อย 5 รายการ",
              status:
                userData?.skills?.length > 0
                  ? `เพิ่มแล้ว ${userData.skills.length} รายการ`
                  : "ยังไม่ได้ระบุ",
              color: userData?.skills?.length > 0 ? "warning" : "danger",
              onClick: () => {
                setSelectedSkills(userData?.skills || []);
                setIsSkillsModalOpen(true);
              },
            },
            (!userData?.experiences || userData.experiences.length === 0) && {
              key: "exp",
              label: "ประสบการณ์",
              desc: "เพิ่มประสบการณ์และผลงาน",
              status: "ยังไม่ได้ระบุ",
              color: "danger",
              onClick: () => {
                setIsEditingExps(true);
                scrollTo(expRef);
              },
            },
            !userData?.resumeFiles && {
              key: "resume",
              label: "Resume/CV",
              desc: "อัปโหลดเพื่อเพิ่มโอกาสได้งาน",
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
            <div className="max-w-7xl mx-auto px-4 md:px-12 mt-5 md:mt-8">
              <p className="text-[10px] font-bold text-gray-400 uppercase mb-2.5 flex items-center gap-1.5 px-1">
                <AlertCircle size={11} /> โปรไฟล์ยังไม่สมบูรณ์
              </p>
              {/* Mobile: horizontal scroll strip */}
              <div className="flex gap-2.5 overflow-x-auto pb-1 -mx-4 px-4 md:mx-0 md:px-0 md:grid md:grid-cols-4 scrollbar-hide snap-x snap-mandatory">
                {missing.map((item) => (
                  <button
                    key={item.key}
                    onClick={item.onClick}
                    className="flex-shrink-0 snap-start text-left bg-white border border-gray-100 rounded-[1.25rem] p-3.5 hover:border-[#0C5BEA]/40 hover:shadow-md transition-all active:scale-[0.97] group w-[160px] md:w-auto"
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span
                        className={`text-[9px] font-black px-2 py-0.5 rounded-full ${colorMap[item.color]}`}
                      >
                        {item.status}
                      </span>
                      <ArrowRight
                        size={11}
                        className="text-[#0C5BEA] opacity-0 group-hover:opacity-100 transition-all"
                      />
                    </div>
                    <p className="text-[12px] font-black text-gray-800 mb-0.5 leading-tight">
                      {item.label}
                    </p>
                    <p className="text-[10px] text-gray-400 leading-relaxed">
                      {item.desc}
                    </p>
                  </button>
                ))}
              </div>
            </div>
          );
        })()}

      {/* ══════════════════════════════════════════════
          BODY SECTIONS
      ══════════════════════════════════════════════ */}
      <div className="max-w-7xl mx-auto px-4 md:px-12 mt-5 md:mt-10 space-y-4 md:space-y-12">
        {userData?.role === "student" && (
          <>
            {/* ── Skills ── */}
            <section
              ref={skillsRef}
              className="bg-white rounded-[1.25rem] md:rounded-[1.5rem] p-5 md:p-10 shadow-sm md:shadow-lg md:shadow-gray-100/70"
            >
              <div className="flex items-center justify-between mb-3 md:mb-4">
                <h3 className="text-[15px] md:text-xl font-black text-gray-800">
                  ทักษะและความเชี่ยวชาญ
                </h3>
                {isOwnProfile && (
                  <button
                    onClick={() => {
                      setSelectedSkills(userData?.skills || []);
                      setIsSkillsModalOpen(true);
                    }}
                    className="flex items-center gap-1.5 text-[11px] font-black text-gray-500 bg-gray-100/80 px-4 py-2 rounded-full hover:bg-[#0C5BEA] hover:text-white transition-all active:scale-95"
                  >
                    <Pencil size={11} />
                    <span>แก้ไข</span>
                  </button>
                )}
              </div>
              <div className="flex flex-wrap gap-2">
                {userData?.skills?.length > 0 ? (
                  <>
                    {(isSkillsExpanded
                      ? userData.skills
                      : userData.skills.slice(0, 6)
                    ).map((skill: string) => (
                      <span
                        key={skill}
                        className="px-4 py-1.5 bg-white rounded-full text-[12px] font-bold text-[#0C5BEA] border border-[#0C5BEA] hover:bg-[#0C5BEA] hover:text-white transition-all cursor-default"
                      >
                        {skill}
                      </span>
                    ))}
                    {!isSkillsExpanded && userData.skills.length > 6 && (
                      <button
                        onClick={() => setIsSkillsExpanded(true)}
                        className="px-4 py-1.5 bg-gray-50 border border-gray-200 rounded-full text-[12px] font-bold text-gray-400 hover:text-[#0C5BEA] hover:border-[#0C5BEA] transition-all active:scale-95"
                      >
                        + {userData.skills.length - 6}
                      </button>
                    )}
                    {isSkillsExpanded && userData.skills.length > 6 && (
                      <button
                        onClick={() => setIsSkillsExpanded(false)}
                        className="px-4 py-1.5 text-[12px] font-medium text-gray-400 hover:text-gray-600 transition-colors flex items-center gap-1"
                      >
                        <span>แสดงน้อยลง</span>
                        <ArrowRight size={12} className="rotate-[-90deg]" />
                      </button>
                    )}
                  </>
                ) : (
                  <div className="flex items-center gap-2 text-gray-300 italic text-sm py-1">
                    <Sparkles size={13} className="opacity-50" />
                    <span>ยังไม่ได้ระบุทักษะ</span>
                  </div>
                )}
              </div>
            </section>

            {/* ── Experiences & Portfolio ── */}
            <section
              ref={expRef}
              className="bg-white rounded-[1.25rem] md:rounded-[1.5rem] p-5 md:p-10 shadow-sm md:shadow-lg md:shadow-gray-100/70"
            >
              <div className="flex items-center justify-between mb-4 md:mb-5">
                <h3 className="text-[15px] md:text-xl font-black text-gray-800 tracking-tight">
                  ประสบการณ์และผลงาน
                </h3>
                {isOwnProfile && (
                  <button
                    onClick={() => {
                      setIsEditingExps(!isEditingExps);
                      if (isEditingExps) setIsAddingExp(false);
                    }}
                    className={`flex items-center gap-1.5 text-[11px] font-black transition-all active:scale-95 ${
                      isEditingExps
                        ? "bg-[#10B981] text-white px-4 py-2 rounded-full shadow-md"
                        : "bg-gray-100/80 text-gray-500 px-4 py-2 rounded-full hover:bg-[#0C5BEA] hover:text-white"
                    }`}
                  >
                    {isEditingExps ? (
                      <CheckCircle size={13} />
                    ) : (
                      <Pencil size={11} />
                    )}
                    <span>{isEditingExps ? "เสร็จสิ้น" : "แก้ไข"}</span>
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 md:gap-12">
                {/* Experience list */}
                <div className="lg:col-span-5 flex flex-col">
                  <div
                    ref={experienceScrollRef}
                    className="flex-1 overflow-y-auto max-h-[280px] md:max-h-[400px] pr-1"
                  >
                    <div className="flex flex-col gap-1">
                      {userData?.experiences?.map(
                        (exp: string, idx: number) => (
                          <div
                            key={idx}
                            className="flex items-center justify-between group/item p-3 md:p-4 rounded-[1rem] transition-all hover:bg-gray-50/50"
                          >
                            <div className="flex items-center gap-3 flex-1 min-w-0">
                              <div className="shrink-0 text-[#0C5BEA]">
                                <Briefcase size={16} />
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
                                    className="w-full text-[13px] font-bold text-gray-700 outline-none bg-white px-3 py-1 rounded-lg border border-blue-100 shadow-sm"
                                  />
                                  <span className="text-[9px] font-bold text-gray-300 min-w-[30px]">
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
                                  className={`text-[13px] md:text-[15px] font-medium text-gray-700 leading-tight truncate ${isEditingExps ? "cursor-text hover:text-[#0C5BEA]" : ""}`}
                                >
                                  {exp}
                                </p>
                              )}
                            </div>
                            {isEditingExps &&
                              isOwnProfile &&
                              editingIdx !== idx && (
                                <div className="flex items-center gap-0.5">
                                  <button
                                    onClick={() => {
                                      if (!isAddingExp) {
                                        setEditingIdx(idx);
                                        setEditValue(exp);
                                      }
                                    }}
                                    disabled={isAddingExp}
                                    className="text-gray-300 hover:text-[#0C5BEA] transition-all p-1.5 hover:bg-blue-50 rounded-xl"
                                  >
                                    <Pencil size={14} />
                                  </button>
                                  <button
                                    onClick={async () => {
                                      if (isAddingExp) return;
                                      if (
                                        confirm(`ลบรายการ "${exp}" ใช่หรือไม่?`)
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
                                    className="text-red-200 hover:text-red-500 transition-all p-1.5 hover:bg-red-50 rounded-xl"
                                  >
                                    <Trash size={15} />
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
                        <div className="flex flex-col items-center justify-center py-10 border-2 border-dashed border-gray-100 rounded-[2rem] bg-white animate-in fade-in zoom-in-95">
                          <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center mb-3">
                            <Briefcase size={24} className="text-blue-300" />
                          </div>
                          <p className="text-[13px] font-medium text-gray-400 mb-5">
                            เริ่มต้นสร้างประวัติผลงาน
                          </p>
                          <button
                            onClick={() => setIsAddingExp(true)}
                            className="flex items-center gap-1.5 text-[12px] font-medium text-white bg-[#0C5BEA] px-4 py-2 rounded-full hover:bg-blue-700 transition-all active:scale-95"
                          >
                            <Plus size={15} strokeWidth={2.5} />
                            <span>เพิ่มผลงาน</span>
                          </button>
                        </div>
                      )}

                    {!isEditingExps &&
                      (!userData?.experiences ||
                        userData.experiences.length === 0) && (
                        <div className="flex flex-col items-center justify-center py-10 opacity-40">
                          <Briefcase size={28} className="text-gray-300 mb-2" />
                          <p className="text-[12px] font-bold text-gray-500">
                            ยังไม่มีข้อมูลผลงาน
                          </p>
                        </div>
                      )}
                  </div>

                  {isEditingExps && isOwnProfile && (
                    <div className="pt-2">
                      {!isAddingExp ? (
                        userData?.experiences?.length > 0 &&
                        userData?.experiences?.length < 10 ? (
                          <button
                            onClick={() => setIsAddingExp(true)}
                            className="flex items-center gap-1.5 text-[11px] font-medium text-gray-500 bg-gray-100/80 px-4 py-2 rounded-full hover:bg-[#0C5BEA] hover:text-white transition-all active:scale-95 mt-2 group"
                          >
                            <Plus
                              size={13}
                              className="group-hover:rotate-90 transition-transform"
                            />
                            <span>
                              เพิ่มผลงาน ({userData?.experiences?.length}/10)
                            </span>
                          </button>
                        ) : userData?.experiences?.length >= 10 ? (
                          <p className="text-[10px] font-medium text-amber-500 mt-2 flex items-center gap-1">
                            <AlertCircle size={11} /> เพิ่มได้สูงสุด 10
                            รายการแล้ว
                          </p>
                        ) : null
                      ) : (
                        <div className="bg-white p-4 rounded-[1.5rem] shadow-xl border border-gray-100 animate-in zoom-in-95 mt-2">
                          <div className="flex items-center gap-3">
                            <div className="shrink-0 w-9 h-9 bg-blue-50 text-[#0C5BEA] rounded-xl flex items-center justify-center">
                              <Briefcase size={16} />
                            </div>
                            <div className="flex flex-col gap-0.5 w-full">
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
                                className="w-full text-[13px] font-medium text-gray-700 outline-none bg-transparent py-1"
                              />
                              <div className="flex justify-end">
                                <span
                                  className={`text-[9px] font-medium ${newExp.length >= 30 ? "text-amber-500" : "text-gray-300"}`}
                                >
                                  {newExp.length}/30
                                </span>
                              </div>
                            </div>
                          </div>
                          <div className="flex justify-between items-center mt-3 pt-3 border-t border-gray-50">
                            <div className="flex items-center gap-1.5">
                              <span className="w-1.5 h-1.5 bg-[#0C5BEA] rounded-full animate-pulse" />
                              <span className="text-[9px] text-gray-400 font-medium uppercase">
                                กด Enter เพื่อบันทึก
                              </span>
                            </div>
                            <div className="flex gap-2">
                              <button
                                onClick={() => {
                                  setIsAddingExp(false);
                                  setNewExp("");
                                }}
                                className="px-3 py-1.5 text-[11px] font-medium text-gray-400 hover:text-gray-600"
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
                                className="px-5 py-1.5 text-[11px] font-medium text-white bg-[#0C5BEA] rounded-full shadow-md hover:bg-blue-700 transition-all active:scale-95"
                              >
                                บันทึก
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
                    {/* ปุ่มอัปโหลด — เฉพาะเจ้าของ */}
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
                        {/* ปุ่มลบรูป — เฉพาะเจ้าของ */}
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

            {/* ── Resume ── */}
            <section
              ref={resumeRef}
              className="bg-white rounded-[1.25rem] md:rounded-[1.5rem] p-5 md:p-10 shadow-sm md:shadow-lg md:shadow-gray-100/70"
            >
              <div className="flex items-center justify-between mb-4 md:mb-5">
                <h3 className="text-[15px] md:text-xl font-black text-gray-800 tracking-tight">
                  Resume / CV
                </h3>
                <div className="flex items-center gap-2">
                  {isOwnProfile && (userData?.resumeFiles?.length ?? 0) > 0 && (
                    <div className="flex items-center gap-1 bg-gray-100 px-2.5 py-1 rounded-full">
                      <FileText size={11} className="text-gray-400" />
                      <span className="text-[11px] font-semibold text-gray-500">
                        {userData?.resumeFiles?.length ?? 0}
                        <span className="font-normal text-gray-400">/3</span>
                      </span>
                    </div>
                  )}
                  {isOwnProfile && (userData?.resumeFiles?.length ?? 0) > 0 && (
                    <button
                      onClick={() => setIsEditingResume(!isEditingResume)}
                      className={`flex items-center gap-1.5 text-[11px] font-black transition-all active:scale-95 ${
                        isEditingResume
                          ? "bg-[#10B981] text-white px-4 py-2 rounded-full shadow-md"
                          : "bg-gray-100/80 text-gray-500 px-4 py-2 rounded-full hover:bg-[#0C5BEA] hover:text-white"
                      }`}
                    >
                      {isEditingResume ? (
                        <CheckCircle size={13} />
                      ) : (
                        <Pencil size={11} />
                      )}
                      <span>{isEditingResume ? "เสร็จสิ้น" : "แก้ไข"}</span>
                    </button>
                  )}
                </div>
              </div>

              {(userData?.resumeFiles?.length ?? 0) > 0 && (
                <div className="flex flex-col gap-2 mb-3">
                  {userData.resumeFiles.map((file: any, i: number) => (
                    <div key={i} className="relative group">
                      <a
                        href={getPreviewUrl(file)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-3 p-3 bg-gray-50 border border-gray-200 rounded-[0.875rem] hover:border-blue-300 transition-all no-underline"
                      >
                        <div className="w-9 h-9 rounded-[0.625rem] bg-red-50 flex items-center justify-center shrink-0">
                          <FileText size={16} className="text-red-400" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[13px] font-medium text-gray-800 truncate">
                            {file.name}
                          </p>
                          <p className="text-[10px] text-gray-400 mt-0.5">
                            {file.size} · คลิกเพื่อเปิด
                          </p>
                        </div>
                      </a>
                      {isOwnProfile && isEditingResume && (
                        <div className="absolute right-2.5 top-1/2 -translate-y-1/2 flex gap-1">
                          <label className="w-7 h-7 bg-blue-50 rounded-lg flex items-center justify-center cursor-pointer hover:bg-blue-100 transition-colors">
                            <input
                              type="file"
                              className="hidden"
                              accept=".pdf"
                              onChange={async (e) => {
                                const f = e.target.files?.[0];
                                if (f) {
                                  const formData = new FormData();
                                  formData.append("resume", f);
                                  formData.append("replaceIndex", String(i));
                                  await handleUpdateField("resume", formData);
                                }
                              }}
                            />
                            <Upload
                              size={12}
                              className="text-blue-500"
                              strokeWidth={2.5}
                            />
                          </label>
                          <button
                            onClick={async (e) => {
                              e.preventDefault();
                              if (confirm("ต้องการลบไฟล์นี้?")) {
                                const formData = new FormData();
                                formData.append("deleteResumeIndex", String(i));
                                await handleUpdateField("resume", formData);
                              }
                            }}
                            className="w-7 h-7 bg-red-50 rounded-lg flex items-center justify-center hover:bg-red-100 transition-colors active:scale-90"
                          >
                            <Trash
                              size={12}
                              className="text-red-400"
                              strokeWidth={2.5}
                            />
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {isOwnProfile && (userData?.resumeFiles?.length ?? 0) < 3 && (
                <div
                  className={`flex flex-col items-center gap-1.5 border-[1.5px] border-dashed rounded-[0.875rem] py-5 cursor-pointer transition-all group ${
                    isDragging
                      ? "border-[#0C5BEA] bg-[#EEF3FF]"
                      : "border-gray-200 hover:border-[#0C5BEA] hover:bg-[#FAFBFF]"
                  }`}
                  onClick={() => fileInputRef.current?.click()}
                  onDragOver={(e) => {
                    e.preventDefault();
                    setIsDragging(true);
                  }}
                  onDragLeave={(e) => {
                    e.preventDefault();
                    setIsDragging(false);
                  }}
                  onDrop={async (e) => {
                    e.preventDefault();
                    setIsDragging(false);
                    const picked = Array.from(e.dataTransfer.files).filter(
                      (f) => f.type === "application/pdf",
                    );
                    const remaining = 3 - (userData?.resumeFiles?.length ?? 0);
                    const toAdd = picked.slice(0, remaining);
                    for (const file of toAdd) {
                      if (file.size > 10 * 1024 * 1024) {
                        alert(`${file.name} มีขนาดเกิน 10MB`);
                        continue;
                      }
                      const formData = new FormData();
                      formData.append("resume", file);
                      await handleUpdateField("resume", formData);
                    }
                    if (picked.length > remaining)
                      alert(`เพิ่มได้อีกสูงสุด ${remaining} ไฟล์`);
                  }}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    className="hidden"
                    accept=".pdf"
                    multiple
                    onChange={async (e) => {
                      const picked = Array.from(e.target.files ?? []);
                      const remaining =
                        3 - (userData?.resumeFiles?.length ?? 0);
                      const toAdd = picked.slice(0, remaining);
                      for (const file of toAdd) {
                        if (file.size > 10 * 1024 * 1024) {
                          alert(`${file.name} มีขนาดเกิน 10MB`);
                          continue;
                        }
                        const formData = new FormData();
                        formData.append("resume", file);
                        await handleUpdateField("resume", formData);
                      }
                      if (picked.length > remaining)
                        alert(`เพิ่มได้อีกสูงสุด ${remaining} ไฟล์`);
                    }}
                  />
                  <div
                    className={`w-9 h-9 bg-white border border-gray-200 rounded-[0.625rem] flex items-center justify-center transition-all ${
                      isDragging
                        ? "-translate-y-0.5"
                        : "group-hover:-translate-y-0.5"
                    }`}
                  >
                    <Upload
                      size={16}
                      className="text-[#0C5BEA]"
                      strokeWidth={1.75}
                    />
                  </div>
                  <span className="text-[13px] font-medium text-gray-600">
                    {isDragging
                      ? "วางไฟล์ได้เลย!"
                      : "ลากมาวาง หรือคลิกเลือกไฟล์"}
                  </span>
                  <span className="text-[10px] text-gray-400">
                    PDF เท่านั้น · สูงสุด 3 ไฟล์ · ≤10MB
                  </span>
                </div>
              )}

              {!isOwnProfile && (userData?.resumeFiles?.length ?? 0) === 0 && (
                <div className="flex flex-col items-center justify-center py-8 opacity-40">
                  <FileText size={24} className="text-gray-300 mb-2" />
                  <p className="text-[12px] font-medium text-gray-500">
                    ยังไม่ได้อัปโหลด Resume
                  </p>
                </div>
              )}
            </section>
          </>
        )}

        {/* ── Reviews ── */}
        <section className="bg-white rounded-[1.25rem] md:rounded-[1.5rem] p-5 md:p-10 shadow-sm md:shadow-lg md:shadow-gray-100/70">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <h3 className="text-[15px] md:text-xl font-black text-gray-800">
                {userData?.role === "student"
                  ? "รีวิวจากผู้ว่าจ้าง"
                  : "รีวิวจากนิสิต"}
              </h3>
              {reviews.length > 0 && (
                <div className="flex items-center gap-1 px-2.5 py-1 bg-amber-50 text-amber-600 rounded-lg border border-amber-100">
                  <Star size={11} className="fill-current" />
                  <span className="text-[11px] font-black">
                    {userData?.avgRating}
                  </span>
                </div>
              )}
            </div>
          </div>

          {reviews.length > 0 ? (
            <>
              {/* Mobile: single-card carousel */}
              <div className="md:hidden">
                <MobileReviewCarousel reviews={reviews} />
              </div>

              {/* Desktop: paginated grid (3 per page) */}
              <div className="hidden md:block px-2 md:px-4">
                <PaginatedGrid
                  items={reviews}
                  page={page3}
                  setPage={setPage3}
                  renderItem={(review: any, i: number) => {
                    const avatarColors = [
                      "#7c3aed",
                      "#0891b2",
                      "#dc2626",
                      "#059669",
                      "#9333ea",
                      "#0369a1",
                      "#be185d",
                      "#b45309",
                    ];
                    const color = avatarColors[i % avatarColors.length];

                    return (
                      <div
                        key={review.id || i}
                        className="group relative bg-white shadow-sm hover:shadow-lg hover:shadow-blue-900/5 p-7 rounded-[1rem] border border-gray-100 transition-all duration-500 h-[210px] flex flex-col"
                      >
                        <div className="flex flex-col h-full">
                          <div className="flex justify-between items-start mb-5 shrink-0">
                            <div className="flex items-center gap-3 w-full min-w-0">
                              <div className="w-12 h-12 shrink-0 rounded-full overflow-hidden bg-gray-50 flex items-center justify-center border border-gray-100 relative">
                                {review.isAnonymous ? (
                                  <div className="w-full h-full bg-gray-400 flex items-center justify-center text-white">
                                    <User size={24} fill="currentColor" />
                                  </div>
                                ) : review.ownerImage ? (
                                  <img
                                    src={review.ownerImage}
                                    alt={review.ownerName}
                                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                                  />
                                ) : (
                                  <div
                                    className="w-full h-full flex items-center justify-center text-white text-base font-black"
                                    style={{ background: color }}
                                  >
                                    {review.ownerName?.charAt(0) || "?"}
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
                            <p className="text-[13px] md:text-[14px] text-gray-500 leading-relaxed line-clamp-4">
                              {review.comment}
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  }}
                />
              </div>
            </>
          ) : (
            <div className="border border-dashed border-gray-200 rounded-[1rem] py-10 flex flex-col items-center gap-3 text-center">
              <div className="w-10 h-10 bg-gray-50 rounded-[0.75rem] flex items-center justify-center">
                <Star size={18} className="text-gray-200" strokeWidth={1.5} />
              </div>
              <div>
                <p className="text-[14px] font-medium text-gray-400">
                  ยังไม่มีรีวิวจาก
                  {userData?.role === "student" ? "ผู้ว่าจ้าง" : "นิสิต"}
                </p>
                <p className="text-[11px] text-gray-300 mt-1">
                  {userData?.role === "student"
                    ? "ส่งงานให้สำเร็จเพื่อรับรีวิวแรกของคุณ"
                    : "นิสิตที่เคยร่วมงานยังไม่ได้ให้รีวิว"}
                </p>
              </div>
            </div>
          )}
        </section>

        {/* Modals */}
        {isOwnProfile && isSkillsModalOpen && (
          <SkillsModal
            isOpen={isOwnProfile && isSkillsModalOpen}
            initialSelected={selectedSkills}
            onClose={() => setIsSkillsModalOpen(false)}
            onSave={(skills) => handleUpdateField("skills", skills)}
          />
        )}
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
