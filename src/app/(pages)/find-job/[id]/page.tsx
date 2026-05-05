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
import { motion, AnimatePresence } from "framer-motion";
import BackButton from "@/app/components/buttons/BackButton";

interface JobDetail {
  _id: string;
  title: string;
  description: string;
  qualifications?: string;
  category: string;
  postedDate: string;
  applicationDeadline: string;
  deliveryDate: string;
  owner: string;
  ownerId: string;
  ownerImage: string | null;
  jobType?: string;
  location?: string;
  budget: number;
  capacity?: number;
  applicants: string[];
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

  const daysLeft = Math.ceil(
    (new Date(job.applicationDeadline).getTime() - Date.now()) /
      (1000 * 60 * 60 * 24),
  );

  return (
    <div className="min-h-screen">
      {/* ═══════════════════════════════════════
          MOBILE ONLY — Sticky top app bar
          (hidden on md and above)
      ═══════════════════════════════════════ */}
      <div
        className="md:hidden sticky z-40 backdrop-blur-xl"
        style={{ top: "75px" }}
      >
        <div className="flex items-center justify-between px-3 h-14">
          {/* Back button — pill style */}
          <BackButton />

          {/* Page title — center */}
          {/* <p className="absolute left-1/2 -translate-x-1/2 text-sm font-bold text-gray-800 max-w-[140px] truncate">
            {job.title}
          </p> */}
        </div>
      </div>
      {/* ═══════════════════════════════════════
          DESKTOP ONLY — Original breadcrumb nav
          (hidden on mobile)
      ═══════════════════════════════════════ */}
      <nav className="hidden md:flex bg-transparent max-w-6xl mx-auto px-6 py-6 items-center gap-2 text-sm md:text-base">
        <div className="flex items-center">
          <BackButton />
        </div>

        {/* รักษาระยะห่างและ Breadcrumb ส่วนหลังไว้เหมือนเดิม */}
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
            <div className="flex items-start justify-between gap-3 mb-1">
              {/* Title */}
              <h1 className="text-[1.2rem] font-extrabold text-gray-900 mt-2 leading-tight min-w-0">
                {job.title}
              </h1>

              {/* Actions - ดันมาอยู่ขวาสุด */}
              <div className="shrink-0">
                {isStudent && (
                  <button
                    onClick={toggleBookmark}
                    className={`w-8 h-8 rounded-xl flex items-center justify-center transition-all active:scale-90 ${
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

            {/* Category badge */}
            <span className="inline-flex items-center px-2.5 py-1 rounded-lg bg-gray-100 text-[10px] font-medium mb-3">
              {job.category}
            </span>

            {/* Posted time */}
            <p className="text-[11px] text-blue-500 font-medium mb-4 flex items-center gap-1.5">
              <Clock size={12} />{" "}
              <span>โพสต์เมื่อ {calculateTimeAgo(job.postedDate)}</span>
            </p>

            {/* Divider */}
            <div className="border-t border-dashed border-gray-100 mb-4" />

            {/* Owner row */}
            <Link
              href={`/account/${job.ownerId}?fromName=${encodeURIComponent(job.title)}`}
              className="block mb-4"
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                whileHover={{ y: -2 }}
                whileTap={{ scale: 0.98 }}
                className="bg-white p-3 md:p-4 rounded-[1.5rem] border border-gray-100 shadow-sm flex items-center gap-3 md:gap-4 transition-all hover:border-blue-200 hover:shadow-md group"
              >
                {/* Avatar */}
                <div className="shrink-0">
                  {job.ownerImage ? (
                    <img
                      src={job.ownerImage}
                      alt={job.owner}
                      className="w-10 h-10 md:w-12 md:h-12 rounded-full object-cover ring-2 ring-gray-50 group-hover:ring-blue-100 transition-all"
                    />
                  ) : (
                    <div className="w-10 h-10 md:w-12 md:h-12 bg-blue-50 rounded-full flex items-center justify-center text-blue-600 font-black text-lg md:text-xl group-hover:bg-blue-100 transition-colors">
                      {job.owner?.[0]?.toUpperCase()}
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="min-w-0 flex-1">
                  <p className="text-[10px] md:text-[12px] text-gray-400 font-medium mb-0.5">
                    ผู้ว่าจ้าง / เจ้าของงาน
                  </p>
                  <span className="text-xs md:text-sm font-black text-gray-800 truncate group-hover:text-[#0C5BEA] transition-colors block">
                    {job.owner}
                  </span>
                </div>

                {/* External Icon */}
                <ExternalLink
                  size={14}
                  className="text-gray-300 group-hover:text-blue-500 transition-colors ml-auto md:ml-2"
                />
              </motion.div>
            </Link>

            {/* Metadata grid — 2 columns */}
            <div className="grid grid-cols-2 gap-2.5">
              <MetaCard
                icon={<Wallet className="w-4 h-4" />}
                label="ค่าตอบแทน"
                value={`${job.budget?.toLocaleString()} ฿`}
                iconBg="bg-emerald-50"
                iconColor="text-emerald-500"
                valueColor="text-emerald-500"
              />

              <MetaCard
                icon={<Users className="w-4 h-4" />}
                label="จำนวนรับ"
                value={`${job.capacity || 1} คน`}
                iconBg="bg-indigo-50"
                iconColor="text-indigo-500"
              />
              <MetaCard
                icon={<MapPin className="w-4 h-4" />}
                label="รูปแบบ"
                value={`${jobTypeLabel[job.jobType ?? ""] ?? job.jobType}${job.location ? ` / ${job.location}` : ""}`}
                iconBg="bg-red-50"
                iconColor="text-red-400"
              />

              <MetaCard
                icon={<Clock className="w-4 h-4" />}
                label={
                  job.jobType === "onsite" ? "วันที่ปฏิบัติงาน" : "กำหนดส่งงาน"
                }
                value={
                  job.deliveryDate
                    ? new Date(job.deliveryDate).toLocaleDateString("th-TH", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })
                    : "ยังไม่มีกำหนด"
                }
                iconBg="bg-blue-50"
                iconColor="text-blue-400"
                valueColor="text-gray-800"
              />
              <MetaCard
                icon={<CalendarClock className="w-4 h-4" />}
                label="ปิดรับสมัคร"
                value={new Date(job.applicationDeadline).toLocaleDateString(
                  "th-TH",
                  { day: "numeric", month: "short", year: "numeric" },
                )}
                iconBg="bg-orange-50"
                iconColor="text-orange-400"
                className="col-span-2"
                badge={
                  daysLeft > 0 && daysLeft <= 7 ? (
                    <span className="text-[10px] font-bold text-white bg-gradient-to-r from-[#FF5900] to-[#EF4444] px-2.5 py-1 rounded-full flex items-center gap-1 shadow-sm">
                      <Clock size={10} />
                      เหลืออีก {daysLeft} วัน
                    </span>
                  ) : null
                }
              />
            </div>
          </div>
        </div>
      </div>
      {/* ═══════════════════════════════════════
          MAIN — Desktop uses original layout
                 Mobile uses tab-controlled view
      ═══════════════════════════════════════ */}
      <main className="max-w-6xl mx-auto pb-32 md:pb-12 pt-3 md:pt-0">
        {/* ── Desktop: original card ── */}
        <div className="hidden md:flex flex-col lg:flex-row gap-3 items-stretch">
          {/* ════ LEFT — Job Detail ════ */}
          <div className="flex-1 bg-white rounded-[2.5rem] shadow-sm border border-gray-100 overflow-hidden">
            <div className="h-1 w-full bg-gradient-to-r from-blue-500 via-indigo-400 to-blue-300" />
            <div className="p-8 md:p-14">
              <h1 className="text-3xl font-bold text-gray-900 mb-3 decoration-2">
                {job.title}
              </h1>
              <div className="inline-block px-4 py-2 bg-gray-100 rounded-full text-sm font-medium mb-4">
                {job.category}
              </div>
              <p className="text-blue-400 text-sm mb-10">
                โพสต์เมื่อ {calculateTimeAgo(job.postedDate)}
              </p>

              <section className="mb-10">
                <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                  <span className="w-1 h-6 bg-blue-500 rounded-full inline-block" />
                  รายละเอียดงาน
                </h2>
                <div className="text-gray-600 leading-relaxed whitespace-pre-line">
                  {job.description}
                </div>
              </section>

              {job.qualifications && (
                <section>
                  <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                    <span className="w-1 h-6 bg-indigo-400 rounded-full inline-block" />
                    คุณสมบัติผู้สมัคร
                  </h2>
                  <div className="text-gray-600 leading-relaxed whitespace-pre-line">
                    {job.qualifications}
                  </div>
                </section>
              )}
            </div>
          </div>

          {/* ════ RIGHT — Sidebar ════ */}
          <div className="w-100 shrink-0 bg-white rounded-[2.5rem] shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-6">
              <Link
                href={`/account/${job.ownerId}?fromName=${encodeURIComponent(job.title)}`}
                className="block mb-4"
              >
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  whileHover={{ y: -2 }}
                  whileTap={{ scale: 0.98 }}
                  className="bg-white p-3 md:p-4 rounded-[1.5rem] border border-gray-100 shadow-sm flex items-center gap-3 md:gap-4 transition-all hover:border-blue-200 hover:shadow-md group"
                >
                  {/* Avatar */}
                  <div className="shrink-0">
                    {job.ownerImage ? (
                      <img
                        src={job.ownerImage}
                        alt={job.owner}
                        className="w-10 h-10 md:w-12 md:h-12 rounded-full object-cover ring-2 ring-gray-50 group-hover:ring-blue-100 transition-all"
                      />
                    ) : (
                      <div className="w-10 h-10 md:w-12 md:h-12 bg-blue-50 rounded-full flex items-center justify-center text-blue-600 font-black text-lg md:text-xl group-hover:bg-blue-100 transition-colors">
                        {job.owner?.[0]?.toUpperCase()}
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="min-w-0 flex-1">
                    <p className="text-[10px] md:text-[12px] text-gray-400 font-medium mb-0.5">
                      ผู้ว่าจ้าง / เจ้าของงาน
                    </p>
                    <span className="text-xs md:text-sm font-black text-gray-800 truncate group-hover:text-[#0C5BEA] transition-colors block">
                      {job.owner}
                    </span>
                  </div>

                  {/* External Icon */}
                  <ExternalLink
                    size={14}
                    className="text-gray-300 group-hover:text-blue-500 transition-colors ml-auto md:ml-2"
                  />
                </motion.div>
              </Link>

              {/* Info Items */}
              <div className="space-y-3 mb-6">
                {/* ค่าตอบแทน */}
                <div className="flex items-center gap-4 bg-[#FDFDFD] border border-gray-100 rounded-2xl px-4 py-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-100/50 flex items-center justify-center shrink-0">
                    <Wallet size={20} className="text-emerald-500" />
                  </div>
                  <div>
                    <p className="text-[11px] text-gray-400 font-medium">
                      ค่าตอบแทน
                    </p>
                    <p className="text-sm font-bold text-emerald-500">
                      {job.budget?.toLocaleString()} บาท
                    </p>
                  </div>
                </div>

                {/* จำนวนรับ */}
                <div className="flex items-center gap-4 bg-[#FDFDFD] border border-gray-100 rounded-2xl px-4 py-3">
                  <div className="w-10 h-10 rounded-xl bg-purple-100/50 flex items-center justify-center shrink-0">
                    <Users size={20} className="text-purple-500" />
                  </div>
                  <div>
                    <p className="text-[11px] text-gray-400 font-medium">
                      จำนวนรับ
                    </p>
                    <p className="text-sm font-bold text-gray-800">
                      {job.capacity || 1} คน
                    </p>
                  </div>
                </div>

                {/* รูปแบบ */}
                <div className="flex items-center gap-4 bg-[#FDFDFD] border border-gray-100 rounded-2xl px-4 py-3">
                  <div className="w-10 h-10 rounded-xl bg-red-100/50 flex items-center justify-center shrink-0">
                    <MapPin size={20} className="text-red-400" />
                  </div>
                  <div>
                    <p className="text-[11px] text-gray-400 font-medium">
                      รูปแบบ
                    </p>
                    <p className="text-sm font-bold text-gray-800">
                      {jobTypeLabel[job.jobType] ?? job.jobType}

                      {job.jobType === "On-site" && job.location && (
                        <> / {job.location}</>
                      )}
                    </p>
                  </div>
                </div>

                {/* กำหนดส่งงาน */}
                <div className="flex items-center gap-4 bg-[#FDFDFD] border border-gray-100 rounded-2xl px-4 py-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-100/50 flex items-center justify-center shrink-0">
                    <CalendarClock size={20} className="text-blue-400" />
                  </div>
                  <div>
                    <p className="text-[11px] text-gray-400 font-medium">
                      {job.jobType === "onsite"
                        ? "วันที่ปฏิบัติงาน"
                        : "กำหนดส่งงาน"}
                    </p>
                    <p className="text-sm font-bold text-gray-800">
                      {job.deliveryDate
                        ? new Date(job.deliveryDate).toLocaleDateString(
                            "th-TH",
                            {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                            },
                          )
                        : "ยังไม่มีกำหนด"}
                    </p>
                  </div>
                </div>

                {/* ปิดรับสมัคร */}
                <div className="flex items-center gap-4 bg-[#FDFDFD] border border-gray-100 rounded-2xl px-4 py-3">
                  <div className="w-10 h-10 rounded-xl bg-orange-100 flex items-center justify-center shrink-0">
                    <svg
                      className="w-[18px] h-[18px] text-orange-400"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                      <line x1="16" y1="2" x2="16" y2="6" />
                      <line x1="8" y1="2" x2="8" y2="6" />
                      <line x1="3" y1="10" x2="21" y2="10" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <p className="text-[11px] text-gray-400 font-medium">
                      ปิดรับสมัคร
                    </p>
                    <p className="text-sm font-bold text-gray-800">
                      {new Date(job.applicationDeadline).toLocaleDateString(
                        "th-TH",
                        { day: "numeric", month: "short", year: "numeric" },
                      )}
                    </p>
                  </div>
                  {(() => {
                    const daysLeft = Math.ceil(
                      (new Date(job.applicationDeadline).getTime() -
                        Date.now()) /
                        (1000 * 60 * 60 * 24),
                    );
                    if (daysLeft > 0 && daysLeft <= 7) {
                      return (
                        <span className="text-[11px] font-medium text-white bg-gradient-to-r from-[#FF5900] to-[#EF4444] px-2.5 py-1 rounded-full flex items-center gap-1 shrink-0">
                          <svg
                            className="w-3 h-3"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <circle cx="12" cy="12" r="9" />
                            <path d="M12 8v4l3 3" />
                          </svg>
                          เหลืออีก {daysLeft} วัน
                        </span>
                      );
                    }
                    return null;
                  })()}
                </div>
              </div>

              {/* ปุ่มสมัคร + Bookmark */}
              {isStudent && (
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <button
                      onClick={handleApplyClick}
                      disabled={hasApplied || applying}
                      className={`flex-grow py-4 px-6 rounded-2xl text-base font-bold transition-all active:scale-95 shadow-lg
                ${
                  hasApplied
                    ? "bg-gray-200 text-gray-500 cursor-not-allowed"
                    : "bg-gradient-to-r from-[#0A5BE9] to-[#7170D8] text-white"
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
                          ? "bg-blue-50 border-blue-200 text-blue-500"
                          : "border-gray-100 text-gray-400 hover:text-blue-500 hover:border-blue-100"
                      }`}
                    >
                      <Bookmark
                        className={`w-5 h-5 ${isBookmarked ? "fill-current" : ""}`}
                      />
                    </button>
                  </div>
                  {job.applicants && job.applicants.length > 0 && (
                    <p className="text-center text-sm text-red-500 font-semibold flex items-center justify-center gap-1.5">
                      <Users fill="red" size={14} />
                      มีผู้สมัครแล้ว {job.applicants.length} คน
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ── Mobile: full scrollable content (mirrors desktop) ── */}
        <div className="md:hidden space-y-3 px-4 pb-2">
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
              {/* Salary Section */}
              <div className="flex-1 min-w-0">
                <p className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider">
                  ค่าตอบแทน
                </p>
                <p className="text-base font-extrabold text-gray-900 truncate leading-tight">
                  ฿{job.budget?.toLocaleString()}
                </p>
              </div>

              <div className="flex flex-col items-center gap-1.5 shrink-0">
                <button
                  onClick={handleApplyClick}
                  disabled={hasApplied || applying}
                  className={`relative px-7 py-3.5 rounded-2xl font-bold text-sm transition-all active:scale-95 overflow-hidden ${
                    hasApplied
                      ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                      : "text-white"
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

                {/* จำนวนผู้สมัคร: แสดงใต้ปุ่มสมัคร */}
                {job.applicants && job.applicants.length > 0 && (
                  <p className="text-[11px] text-red-500 font-bold flex items-center justify-center gap-1 animate-pulse">
                    <Users size={12} className="fill-red-500" />
                    สมัครแล้ว {job.applicants.length} คน
                  </p>
                )}
              </div>
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
          <div className="hidden md:block bg-white rounded-[2.5rem] shadow-2xl w-full max-w-lg overflow-hidden">
            {/* Header gradient bar */}
            <div className="h-1.5 w-full bg-gradient-to-r from-blue-500 via-indigo-400 to-blue-300" />

            <div className="p-10">
              {/* Icon + Title */}
              <div className="flex flex-col items-center text-center mb-8">
                <div className="w-14 h-14 rounded-2xl bg-blue-50 flex items-center justify-center mb-4">
                  <BriefcaseBusiness size={26} className="text-blue-500" />
                </div>
                <h2 className="text-2xl font-extrabold text-gray-900">
                  ยืนยันการสมัครงาน
                </h2>
                <p className="text-sm text-gray-400 mt-1">
                  ตรวจสอบข้อมูลก่อนส่งใบสมัคร
                </p>
              </div>

              {/* Job info card */}
              <div className="bg-gray-50 rounded-2xl p-5 mb-7 border border-gray-100 space-y-3">
                <div className="flex justify-between items-start gap-4">
                  <span className="text-xs text-gray-400 font-medium w-20 shrink-0 pt-0.5">
                    ชื่องาน
                  </span>
                  <span className="text-sm font-bold text-gray-800 text-right">
                    {job.title}
                  </span>
                </div>
                <div className="border-t border-gray-100" />
                <div className="flex justify-between items-center gap-4">
                  <span className="text-xs text-gray-400 font-medium w-20 shrink-0">
                    ผู้ว่าจ้าง
                  </span>
                  <span className="text-sm font-semibold text-gray-700">
                    {job.owner}
                  </span>
                </div>
                <div className="border-t border-gray-100" />
                <div className="flex justify-between items-center gap-4">
                  <span className="text-xs text-gray-400 font-medium w-20 shrink-0">
                    ค่าตอบแทน
                  </span>
                  <span className="text-sm font-extrabold text-emerald-500">
                    ฿{job.budget?.toLocaleString()}
                  </span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3">
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 py-3.5 bg-gray-100 hover:bg-gray-200 text-gray-600 font-semibold rounded-2xl text-sm transition-all active:scale-95"
                >
                  ยกเลิก
                </button>
                <button
                  onClick={confirmApplication}
                  disabled={applying}
                  className="flex-1 py-3.5 bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white font-bold rounded-2xl text-sm transition-all active:scale-95 disabled:opacity-60 shadow-lg shadow-blue-100"
                >
                  {applying ? "กำลังส่ง..." : "ยืนยันสมัคร"}
                </button>
              </div>
            </div>
          </div>

          {/* Mobile modal — bottom sheet */}
          <div className="md:hidden w-full bg-white rounded-t-3xl shadow-2xl">
            <div className="w-10 h-1 bg-gray-200 rounded-full mx-auto mt-3 mb-4" />
            {/* <div className="h-0.5 w-full bg-gradient-to-r from-blue-500 via-indigo-400 to-blue-300" /> */}

            <div className="px-5 pb-8 pt-5">
              <div className="flex items-center gap-3 mb-5">
                <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center shrink-0">
                  <BriefcaseBusiness size={20} className="text-blue-500" />
                </div>
                <div>
                  <h2 className="text-base font-extrabold text-gray-900">
                    ยืนยันการสมัครงาน
                  </h2>
                  <p className="text-xs text-gray-400">
                    ตรวจสอบข้อมูลก่อนส่งใบสมัคร
                  </p>
                </div>
              </div>

              <div className="bg-gray-50 rounded-2xl p-4 mb-5 border border-gray-100 space-y-2.5">
                <div className="flex justify-between items-start gap-4">
                  <span className="text-xs text-gray-400 font-medium shrink-0">
                    ชื่องาน
                  </span>
                  <span className="text-xs font-bold text-gray-800 text-right">
                    {job.title}
                  </span>
                </div>
                <div className="border-t border-gray-100" />
                <div className="flex justify-between items-center">
                  <span className="text-xs text-gray-400 font-medium">
                    ผู้ว่าจ้าง
                  </span>
                  <span className="text-xs font-semibold text-gray-700">
                    {job.owner}
                  </span>
                </div>
                <div className="border-t border-gray-100" />
                <div className="flex justify-between items-center">
                  <span className="text-xs text-gray-400 font-medium">
                    ค่าตอบแทน
                  </span>
                  <span className="text-xs font-extrabold text-emerald-500">
                    ฿{job.budget?.toLocaleString()}
                  </span>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 py-3.5 bg-gray-100 hover:bg-gray-200 text-gray-600 font-semibold rounded-2xl text-sm active:scale-95 transition-all"
                >
                  ยกเลิก
                </button>
                <button
                  onClick={confirmApplication}
                  disabled={applying}
                  className="flex-1 py-3.5 bg-gradient-to-r from-blue-500 to-indigo-500 text-white font-bold rounded-2xl text-sm active:scale-95 transition-all disabled:opacity-60 shadow-lg shadow-blue-100"
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
  valueColor = "text-gray-700",
  className = "",
  badge,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  iconBg: string;
  iconColor: string;
  valueColor?: string;
  className?: string;
  badge?: React.ReactNode;
}) => (
  <div
    className={`bg-[#FDFDFD] border border-gray-100 rounded-2xl p-3 flex items-center gap-2.5 ${className}`}
  >
    <div
      className={`${iconBg} ${iconColor} w-8 h-8 rounded-xl flex items-center justify-center shrink-0 mt-0.5`}
    >
      {icon}
    </div>
    <div className="min-w-0 flex-1 flex items-center justify-between gap-2">
      <div className="flex flex-col justify-center min-w-0">
        <p className="text-[10px] text-gray-400 font-medium uppercase tracking-wide leading-tight mb-0.5">
          {label}
        </p>
        <p
          className={`text-xs font-bold leading-tight break-words ${valueColor}`}
        >
          {value}
        </p>
      </div>
      {badge && <div className="shrink-0">{badge}</div>}
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
      {React.cloneElement(icon as React.ReactElement<{ size: number }>, {
        size: 20,
      })}
    </div>
    <span className="font-medium">{label}</span>
  </div>
);

export default JobDetailPage;
