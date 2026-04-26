"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import axios from "axios";
import {
  User,
  MapPin,
  Wallet,
  Users,
  Bookmark,
  AlertCircle,
  BriefcaseBusiness,
  CalendarClock,
  ChevronLeft,
  Share2,
  CheckCircle2,
  Clock,
  ExternalLink,
} from "lucide-react";
import Link from "next/link";
import Loading from "../../../components/common/Loading";
import { useSession } from "next-auth/react";
import { calculateTimeAgo } from "@/app/components/utils/jobHelpers";
import toast, { Toaster } from "react-hot-toast";

interface JobDetail {
  _id: string;
  title: string;
  description: string;
  qualifications?: string;
  category: string;
  postedDate: string;
  applicationDeadline: string;
  owner: string;
  ownerId: string;
  jobType?: string;
  location?: string;
  budgetMin: number;
  budgetMax: number | null;
  capacity?: number;
}

const DetailRow = ({ label, value }: { label: string; value: string }) => (
  <div className="flex gap-4 text-sm md:text-base mb-2">
    <span className="font-bold text-gray-800 w-24 shrink-0">{label}</span>
    <span className="text-gray-600">{value}</span>
  </div>
);

const JobDetailPage = () => {
  const params = useParams();
  const router = useRouter();
  const { data: session, status } = useSession();
  const searchParams = useSearchParams();

  const [job, setJob] = useState<JobDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [hasApplied, setHasApplied] = useState(false);
  const [applying, setApplying] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(false);

  const jobTypeLabel: Record<string, string> = {
    online: "ออนไลน์",
    onsite: "ออนไซต์",
    "onsite-online": "ทั้งออนไซต์และออนไลน์",
  };

  const isLoggedIn = status === "authenticated";
  const isStudent = isLoggedIn && session?.user?.role === "student";

  useEffect(() => {
    const fetchJobData = async () => {
      if (!params?.id) return;
      try {
        setLoading(true);
        const res = await axios.get(`/api/jobs/${params.id}`);
        setJob(res.data);
        if (status === "authenticated") {
          const checkRes = await axios.get(
            `/api/applications/check?jobId=${params.id}`,
          );
          setHasApplied(checkRes.data.hasApplied);
        }
      } catch (err) {
        console.error(err);
        setError("ไม่พบข้อมูลงานที่คุณกำลังเรียกดู");
      } finally {
        setLoading(false);
      }
    };
    fetchJobData();
  }, [params.id, status]);

  const fromPageName = searchParams.get("fromName") || "ย้อนกลับ";

  const handleGoBack = (e: React.MouseEvent) => {
    e.preventDefault();
    router.back();
  };

  const handleApplyClick = () => {
    if (!isLoggedIn) {
      const loginUrl = `/auth?state=login&callbackUrl=/find-job/${params.id}`;
      router.push(loginUrl);
      return;
    }
    setIsModalOpen(true);
  };

  const confirmApplication = async () => {
    if (!job) return;
    try {
      setApplying(true);
      const response = await axios.post("/api/applications", {
        jobId: job._id,
      });
      if (response.status === 201) {
        setHasApplied(true);
        setIsModalOpen(false);
        toast(
          (t) => (
            <div className="flex items-start gap-3 w-full">
              <div className="shrink-0 w-9 h-9 rounded-full bg-green-100 flex items-center justify-center mt-0.5">
                <svg
                  className="w-5 h-5 text-green-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2.5}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-gray-900 leading-snug">
                  ส่งใบสมัครเรียบร้อยแล้ว! 🎉
                </p>
                <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">
                  ติดตามสถานะได้ที่เมนู{" "}
                  <span className="font-semibold text-gray-700">งานของฉัน</span>
                </p>
                <div className="flex gap-2 mt-3">
                  <button
                    onClick={() => {
                      router.push("/manage-projects");
                      toast.dismiss(t.id);
                    }}
                    className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white px-3 py-1.5 rounded-lg text-xs font-bold transition-all duration-150"
                  >
                    <svg
                      className="w-3.5 h-3.5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                      />
                    </svg>
                    งานของฉัน
                  </button>
                  <button
                    onClick={() => {
                      router.push("/find-job");
                      toast.dismiss(t.id);
                    }}
                    className="flex items-center gap-1.5 bg-gray-100 hover:bg-gray-200 active:scale-95 text-gray-600 px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-150"
                  >
                    หางานต่อ
                  </button>
                </div>
              </div>
              <button
                onClick={() => toast.dismiss(t.id)}
                className="shrink-0 text-gray-300 hover:text-gray-500 transition-colors mt-0.5"
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
          ),
          {
            duration: 6000,
            style: {
              padding: "16px",
              borderRadius: "16px",
              boxShadow: "0 8px 30px rgba(0,0,0,0.10)",
              border: "1px solid #f0fdf4",
              background: "#ffffff",
              maxWidth: "360px",
            },
          },
        );
      }
    } catch (err: any) {
      const errorMsg =
        err.response?.data?.error || "เกิดข้อผิดพลาดในการส่งใบสมัคร";
      toast.error(errorMsg);
    } finally {
      setApplying(false);
    }
  };

  /* ---------- Logic: Bookmark ---------- */
  useEffect(() => {
    const checkBookmarkStatus = async () => {
      if (status === "authenticated" && params.id) {
        try {
          const res = await axios.get(
            `/api/bookmarks/check?jobId=${params.id}`,
          );
          setIsBookmarked(res.data.isBookmarked);
        } catch (err) {
          console.error("Error checking bookmark:", err);
        }
      }
    };
    checkBookmarkStatus();
  }, [params.id, status]);

  const toggleBookmark = async () => {
    if (!isLoggedIn) {
      router.push(`/auth?state=login&callbackUrl=/find-job/${params.id}`);
      return;
    }
    try {
      const res = await axios.post("/api/bookmarks", { jobId: job?._id });
      setIsBookmarked(res.data.isBookmarked);
    } catch (err) {
      alert("ไม่สามารถดำเนินการบันทึกงานได้");
      console.error(err);
    }
  };

  if (loading)
    return (
      <div className="h-screen flex justify-center items-center">
        <Loading />
      </div>
    );

  if (error || !job)
    return (
      <div className="h-screen flex flex-col justify-center items-center gap-4">
        <AlertCircle className="w-12 h-12 text-red-500" />
        <p className="text-gray-600">{error}</p>
        <Link href="/find-job" className="text-primary-blue-500 underline">
          กลับไปหน้าหางาน
        </Link>
      </div>
    );

  return (
    <div className="min-h-screen">
      {/* ═══════════════════════════════════════
          MOBILE ONLY — Sticky top app bar
          (hidden on md and above)
      ═══════════════════════════════════════ */}
      <div className="md:hidden sticky top-0 z-40 bg-white/80 backdrop-blur-xl border-b border-gray-100/60">
        <div className="flex items-center justify-between px-3 h-14">
          {/* Back button — pill style */}
          <button
            onClick={handleGoBack}
            className="flex items-center gap-1 pl-1 pr-3 py-1.5 text-gray-500 hover:text-primary-blue-500 font-medium active:scale-95 transition-all"
          >
            <ChevronLeft className="w-5 h-5 text-primary-blue-500" />
            <span>{fromPageName}</span>
          </button>

          {/* Page title — center */}
          {/* <p className="absolute left-1/2 -translate-x-1/2 text-sm font-bold text-gray-800 max-w-[140px] truncate">
            {job.title}
          </p> */}

          {/* Actions */}
          <div className="flex items-center gap-1">
            {isStudent && (
              <button
                onClick={toggleBookmark}
                className={`w-8 h-8 rounded-full flex items-center justify-center transition-all active:scale-90 ${
                  isBookmarked
                    ? "bg-blue-50 text-blue-500"
                    : "bg-gray-100/80 text-gray-400"
                }`}
              >
                <Bookmark
                  className={`w-4 h-4 ${isBookmarked ? "fill-current" : ""}`}
                />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════
          DESKTOP ONLY — Original breadcrumb nav
          (hidden on mobile)
      ═══════════════════════════════════════ */}
      <nav className="hidden md:flex max-w-6xl mx-auto px-6 py-6 items-center gap-2 text-sm md:text-base">
        <button
          onClick={handleGoBack}
          className="flex items-center gap-2 text-gray-500 hover:text-primary-blue-500 transition-colors font-medium cursor-pointer"
        >
          <ChevronLeft className="w-5 h-5 text-primary-blue-500" />
          <span>{fromPageName}</span>
        </button>
        <span className="text-gray-300 font-light px-1">/</span>
        <span className="text-gray-400 truncate max-w-[500px]">
          {job?.title}
        </span>
      </nav>

      {/* ═══════════════════════════════════════
          MOBILE ONLY — Hero card (all job info)
          (hidden on md and above)
      ═══════════════════════════════════════ */}
      <div className="md:hidden px-4 pt-4 pb-2">
        <div className="bg-white rounded-[1.75rem] shadow-[0_2px_20px_rgba(0,0,0,0.06)] border border-gray-100 overflow-hidden">
          {/* Accent stripe */}
          <div className="h-1 w-full bg-gradient-to-r from-blue-500 via-indigo-400 to-blue-300" />

          <div className="p-5">
            {/* Title */}
            <h1 className="text-[1.2rem] font-extrabold text-gray-900 leading-tight mb-1">
              {job.title}
            </h1>

            {/* Category badge */}
            <span className="inline-flex items-center px-2.5 py-1 rounded-lg bg-gray-100 text-[10px] font-medium mb-3">
              {job.category}
            </span>

            {/* Posted time */}
            <p className="text-[11px] text-blue-400 font-medium mb-4 flex items-center gap-1.5">
              <Clock size={12} />{" "}
              <span>โพสต์เมื่อ {calculateTimeAgo(job.postedDate)}</span>
            </p>

            {/* Divider */}
            <div className="border-t border-dashed border-gray-100 mb-4" />

            {/* Owner row */}
            <Link
              href={`/account/${job.ownerId}?fromName=${encodeURIComponent(job.title)}`}
              className="flex items-center gap-2.5 mb-4 group"
            >
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center shrink-0 shadow-sm">
                <User className="w-4 h-4 text-white" />
              </div>
              <div>
                <p className="text-[11px] text-gray-400 font-medium">
                  ผู้ว่าจ้าง
                </p>
                <p className="text-sm font-semibold text-gray-800 group-hover:text-blue-600 transition-colors leading-tight flex items-center gap-1">
                  {job.owner}
                  <ExternalLink size={12} className="opacity-70" />
                </p>
              </div>
            </Link>

            {/* Metadata grid — 2 columns */}
            <div className="grid grid-cols-2 gap-2.5">
              <MetaCard
                icon={<MapPin className="w-3.5 h-3.5" />}
                label="รูปแบบ"
                value={`${jobTypeLabel[job.jobType ?? ""] ?? job.jobType}${job.location ? ` · ${job.location}` : ""}`}
                iconBg="bg-red-50"
                iconColor="text-red-400"
              />
              <MetaCard
                icon={<Wallet className="w-3.5 h-3.5" />}
                label="ค่าตอบแทน"
                value={`${job.budgetMin.toLocaleString()}${job.budgetMax ? `–${job.budgetMax.toLocaleString()}` : "+"} ฿`}
                iconBg="bg-emerald-50"
                iconColor="text-emerald-500"
              />
              <MetaCard
                icon={<Users className="w-3.5 h-3.5" />}
                label="จำนวนรับ"
                value={`${job.capacity || 1} คน`}
                iconBg="bg-indigo-50"
                iconColor="text-indigo-500"
              />
              <MetaCard
                icon={<CalendarClock className="w-3.5 h-3.5" />}
                label="ปิดรับสมัคร"
                value={new Date(job.applicationDeadline).toLocaleDateString(
                  "th-TH",
                  { day: "numeric", month: "short", year: "numeric" },
                )}
                iconBg="bg-orange-50"
                iconColor="text-orange-400"
              />
            </div>
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════
          MAIN — Desktop uses original layout
                 Mobile uses tab-controlled view
      ═══════════════════════════════════════ */}
      <main className="max-w-6xl mx-auto px-4 pb-32 md:pb-12 pt-3 md:pt-0">
        {/* ── Desktop: original card (100% unchanged) ── */}
        <div className="hidden md:block bg-white rounded-[2.5rem] shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-8 md:p-14">
            <div className="flex flex-col lg:flex-row justify-between gap-12">
              <div className="flex-1">
                <h1 className="text-3xl font-bold text-gray-900 mb-3">
                  {job.title}
                </h1>
                <div className="inline-block px-4 py-2 bg-gray-100 rounded-full text-sm font-medium mb-4">
                  {job.category}
                </div>
                <p className="text-blue-400 text-sm mb-10">
                  โพสต์เมื่อ {calculateTimeAgo(job.postedDate)}
                </p>

                <section className="mb-10">
                  <h2 className="text-xl font-bold text-gray-800 mb-4">
                    รายละเอียดงาน
                  </h2>
                  <div className="text-gray-600 leading-relaxed whitespace-pre-line">
                    {job.description}
                  </div>
                </section>

                {job.qualifications && (
                  <section>
                    <h2 className="text-xl font-bold text-gray-800 mb-4">
                      คุณสมบัติผู้สมัคร
                    </h2>
                    <div className="text-gray-600 leading-relaxed whitespace-pre-line">
                      {job.qualifications}
                    </div>
                  </section>
                )}
              </div>

              <div className="w-full lg:w-80 shrink-0">
                <div className="space-y-6 bg-gray-50/50 p-6 rounded-3xl border border-gray-50 mb-8">
                  <div className="flex items-center gap-4 text-gray-700">
                    <div className="text-blue-500 shrink-0">
                      <User size={20} />
                    </div>
                    <Link
                      href={`/account/${job.ownerId}?fromName=${encodeURIComponent(job.title)}`}
                      className="font-medium hover:text-blue-500 underline decoration-dotted transition-colors"
                    >
                      {job.owner}
                    </Link>
                  </div>
                  <SidebarItem
                    icon={<MapPin />}
                    label={`${jobTypeLabel[job.jobType] ?? job.jobType} / ${job.location || "ทำงานออนไลน์"}`}
                    iconColor="text-red-400"
                  />
                  <SidebarItem
                    icon={<Wallet />}
                    label={`${job.budgetMin.toLocaleString()} ${job.budgetMax ? `- ${job.budgetMax.toLocaleString()}` : ""} บาท`}
                    iconColor="text-emerald-500"
                  />
                  <SidebarItem
                    icon={<Users />}
                    label={`จำนวนรับ ${job.capacity || 1} คน`}
                    iconColor="text-indigo-500"
                  />
                  <SidebarItem
                    icon={<CalendarClock />}
                    label={`ปิดรับสมัคร ${new Date(job.applicationDeadline).toLocaleDateString("th-TH", { day: "numeric", month: "numeric", year: "numeric" })}`}
                    iconColor="text-orange-500"
                  />
                </div>

                {isStudent && (
                  <div className="flex items-center gap-3">
                    <button
                      onClick={handleApplyClick}
                      disabled={hasApplied || applying}
                      className={`flex-grow py-4 px-6 rounded-2xl text-lg font-bold transition-all active:scale-95 shadow-lg
                        ${
                          hasApplied
                            ? "bg-gray-200 text-gray-500 cursor-not-allowed shadow-none"
                            : "bg-blue-600 hover:bg-blue-700 text-white shadow-blue-100"
                        }`}
                    >
                      {hasApplied
                        ? "คุณสมัครงานนี้แล้ว"
                        : applying
                          ? "กำลังสมัคร..."
                          : "สมัครงานนี้"}
                    </button>
                    <button
                      onClick={toggleBookmark}
                      className={`p-4 rounded-2xl border-2 transition-all ${
                        isBookmarked
                          ? "bg-blue-50 border-blue-200 text-blue-500 shadow-sm"
                          : "border-gray-100 text-gray-400 hover:text-blue-500 hover:border-blue-100"
                      }`}
                    >
                      <Bookmark
                        className={`w-6 h-6 ${isBookmarked ? "fill-current" : ""}`}
                      />
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* ── Mobile: full scrollable content (mirrors desktop) ── */}
        <div className="md:hidden space-y-3">
          <div className="bg-white rounded-[1.75rem] shadow-[0_2px_20px_rgba(0,0,0,0.06)] border border-gray-100 p-5">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-1 h-5 rounded-full bg-blue-500" />
              <h2 className="text-sm font-bold text-gray-800">รายละเอียดงาน</h2>
            </div>
            <div className="text-gray-500 leading-relaxed whitespace-pre-line text-sm">
              {job.description}
            </div>
          </div>

          {/* Qualifications */}
          {job.qualifications && (
            <div className="bg-white rounded-[1.75rem] shadow-[0_2px_20px_rgba(0,0,0,0.06)] border border-gray-100 p-5">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-1 h-5 rounded-full bg-indigo-400" />
                <h2 className="text-sm font-bold text-gray-800">
                  คุณสมบัติผู้สมัคร
                </h2>
              </div>
              <div className="text-gray-500 leading-relaxed whitespace-pre-line text-sm">
                {job.qualifications}
              </div>
            </div>
          )}
        </div>
      </main>

      {/* ═══════════════════════════════════════
          MOBILE ONLY — Sticky bottom action bar
      ═══════════════════════════════════════ */}
      {isStudent && (
        <div className="md:hidden fixed bottom-0 left-0 right-0 z-40">
          <div className="bg-white/95 backdrop-blur-xl border-t border-gray-100/80 px-4 pt-3 pb-7">
            <div className="flex items-center gap-3 max-w-sm mx-auto">
              {/* Salary */}
              <div className="flex-1 min-w-0">
                <p className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider">
                  ค่าตอบแทน
                </p>
                <p className="text-base font-extrabold text-gray-900 truncate leading-tight">
                  ฿{job.budgetMin.toLocaleString()}
                  {job.budgetMax ? (
                    <span className="text-gray-400 font-semibold">
                      –{job.budgetMax.toLocaleString()}
                    </span>
                  ) : (
                    <span className="text-gray-400 font-semibold">+</span>
                  )}
                </p>
              </div>

              {/* Apply button */}
              <button
                onClick={handleApplyClick}
                disabled={hasApplied || applying}
                className={`relative px-7 py-3.5 rounded-2xl font-bold text-sm transition-all active:scale-95 shrink-0 overflow-hidden ${
                  hasApplied
                    ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                    : "text-white shadow-lg shadow-blue-200/60"
                }`}
                style={
                  !hasApplied
                    ? {
                        background:
                          "linear-gradient(135deg, #3b82f6 0%, #6366f1 100%)",
                      }
                    : {}
                }
              >
                {!hasApplied && (
                  <span className="absolute inset-0 bg-white/10 opacity-0 hover:opacity-100 transition-opacity" />
                )}
                {hasApplied ? (
                  <span className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4" /> สมัครแล้ว
                  </span>
                ) : applying ? (
                  "กำลังสมัคร..."
                ) : (
                  "สมัครเลย"
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════
          MODAL
          Desktop → original centered rounded-[3rem]
          Mobile  → bottom sheet
      ═══════════════════════════════════════ */}
      {isModalOpen && job && (
        <div className="fixed inset-0 z-[100] flex items-end md:items-center justify-center md:p-4 bg-black/50 backdrop-blur-sm">
          {/* Desktop modal — 100% original */}
          <div className="hidden md:block bg-white rounded-[3rem] shadow-2xl w-full max-w-2xl overflow-hidden p-8 md:p-12 text-center">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              ยืนยันการสมัครงาน
            </h2>
            <div className="text-left bg-gray-50 rounded-[2rem] p-6 mb-8 border border-gray-100">
              <DetailRow label="ชื่องาน" value={job.title} />
              <DetailRow label="ผู้ว่าจ้าง" value={job.owner} />
              <DetailRow
                label="ค่าตอบแทน"
                value={`${job.budgetMin.toLocaleString()} บาท`}
              />
            </div>
            <div className="flex gap-4 justify-center">
              <button
                onClick={() => setIsModalOpen(false)}
                className="px-8 py-4 bg-gray-200 text-gray-600 font-bold rounded-2xl"
              >
                ยกเลิก
              </button>
              <button
                onClick={confirmApplication}
                disabled={applying}
                className="px-8 py-4 bg-green-500 text-white font-bold rounded-2xl shadow-lg shadow-green-100"
              >
                {applying ? "กำลังส่งข้อมูล..." : "ยืนยันการสมัคร"}
              </button>
            </div>
          </div>

          {/* Mobile modal — bottom sheet */}
          <div className="md:hidden w-full bg-white rounded-t-3xl shadow-2xl">
            <div className="w-10 h-1 bg-gray-200 rounded-full mx-auto mt-3 mb-2" />
            <div className="px-5 pb-8 pt-2">
              <h2 className="text-lg font-bold text-gray-900 mb-1">
                ยืนยันการสมัครงาน
              </h2>
              <p className="text-xs text-gray-400 mb-4">
                ตรวจสอบข้อมูลก่อนส่งใบสมัคร
              </p>
              <div className="bg-gray-50 rounded-2xl p-4 mb-5 border border-gray-100">
                <DetailRow label="ชื่องาน" value={job.title} />
                <DetailRow label="ผู้ว่าจ้าง" value={job.owner} />
                <DetailRow
                  label="ค่าตอบแทน"
                  value={`${job.budgetMin.toLocaleString()} บาท`}
                />
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 py-3.5 bg-gray-100 text-gray-600 font-semibold rounded-2xl text-sm active:scale-95 transition-all"
                >
                  ยกเลิก
                </button>
                <button
                  onClick={confirmApplication}
                  disabled={applying}
                  className="flex-1 py-3.5 bg-green-500 text-white font-bold rounded-2xl text-sm shadow-lg shadow-green-100 active:scale-95 transition-all disabled:opacity-60"
                >
                  {applying ? "กำลังส่ง..." : "ยืนยันสมัคร"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <Toaster position="top-center" reverseOrder={false} />
    </div>
  );
};

/* ── Mobile-only: 2-col metadata card ── */
const MetaCard = ({
  icon,
  label,
  value,
  iconBg,
  iconColor,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  iconBg: string;
  iconColor: string;
}) => (
  <div className="bg-gray-50 rounded-2xl p-3 flex items-start gap-2.5">
    <div
      className={`${iconBg} ${iconColor} w-7 h-7 rounded-xl flex items-center justify-center shrink-0 mt-0.5`}
    >
      {icon}
    </div>
    <div className="min-w-0">
      <p className="text-[10px] text-gray-400 font-semibold uppercase tracking-wide leading-none mb-0.5">
        {label}
      </p>
      <p className="text-xs font-bold text-gray-700 leading-snug break-words">
        {value}
      </p>
    </div>
  </div>
);

/* ── Desktop-only: SidebarItem (original, unchanged) ── */
const SidebarItem = ({
  icon,
  label,
  iconColor = "text-blue-500",
}: {
  icon: React.ReactNode;
  label: string;
  iconColor?: string;
}) => (
  <div className="flex items-center gap-4 text-gray-700">
    <div className={`${iconColor} shrink-0`}>
      {React.cloneElement(icon as React.ReactElement, { size: 20 })}
    </div>
    <span className="font-medium">{label}</span>
  </div>
);

export default JobDetailPage;
