// src/app/(pages)/manage-projects/page.tsx
"use client";

import React, { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import axios from "axios";
import Loading from "../../components/common/Loading";
import toast from "react-hot-toast";
import { usePusher } from "../../../providers/PusherProvider";
import Link from "next/link";
import {
  Briefcase,
  Clock,
  CheckCircle,
  Users,
  DollarSign,
  Star,
  BriefcaseBusiness,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import ConfirmStartJobModal from "../../components/modals/ConfirmStartJobModal";
import WithdrawApplicationModal from "../../components/modals/WithdrawApplicationModal";

const fadeInUp = {
  hidden: { opacity: 0, y: 40, filter: "blur(4px)" },
  visible: {
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: { duration: 0.8, ease: [0.22, 1, 0.36, 1] },
  },
};

const imageReveal = {
  hidden: { opacity: 0, scale: 1.1 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { duration: 1.2, ease: [0.22, 1, 0.36, 1] },
  },
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.2 },
  },
};
// ─── Interfaces ───────────────────────────────────────────────────────────────

//  งานที่นิสิตสมัครไว้
interface JobApplication {
  _id: string;
  jobId: string;
  jobTitle: string;
  jobCategory: string;
  jobBudgetMin: number;
  jobBudgetMax: number;
  jobOwner: string;
  status: "pending" | "accepted" | "rejected";
  appliedDate: string;
  ownerReview?: { rating: number; comment: string; isAnonymous: boolean }; // รีวิวที่อาจารย์ให้นิสิต
  studentReview?: { rating: number; comment: string; isAnonymous: boolean }; // รีวิวที่นิสิตให้อาจารย์
}

// งานของเจ้าของที่มีคนมาสมัคร
interface OwnerJobWithApplicants {
  _id: string;
  title: string;
  category: string;
  budgetMin: number;
  budgetMax: number;
  pendingCount: number;
  acceptedCount: number;
  capacity: number;
  totalCount: number;
  applications: {
    _id: string;
    applicantName: string;
    status: string;
    appliedDate: string;
  }[];
}

// ─── งานที่กำลังทำอยู่ (นิสิต) ──────────────
interface ActiveApplication {
  _id: string;
  jobId: string;
  jobTitle: string;
  jobCategory: string;
  jobOwner: string;
  jobDeadline: string | null;
  status: "accepted" | "in_progress" | "submitted" | "revision";
  progress: number;
}

// ─── งานของเจ้าของที่กำลังดำเนินการ ─────────
interface ActiveOwnerJob {
  _id: string;
  title: string;
  category: string;
  jobStatus: string;
  capacity: number;
  deliveryDate: string | null;
  workers: {
    _id: string;
    applicantName: string;
    profileImageUrl: string | null;
    status: string;
    progress: number;
  }[];
  statusCounts: {
    waitingToStart: number;
    inProgress: number;
    submitted: number;
    revision: number;
    completed: number;
  };
  aggregateBadge: { label: string; color: string };
  avgProgress: number;
}

interface CompletedApplication {
  _id: string;
  jobId: string;
  jobTitle: string;
  jobCategory: string;
  jobOwner: string;
  jobDeadline: string | null;
  status: "completed";
  appliedDate: string;
  updatedAt: string;
  ownerReview?: { rating: number; comment: string; isAnonymous: boolean };
  studentReview?: { rating: number; comment: string; isAnonymous: boolean };
}

interface CompletedOwnerJob {
  _id: string;
  jobId: string;
  title: string;
  category: string;
  deliveryDate: string | null;
  jobStatus: string;
  capacity: number;
  workers: {
    _id: string;
    applicantName: string;
    profileImageUrl: string | null;
    status: string;
    progress: number;
  }[];
  avgProgress: number;
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function ManageProjectsPage() {
  const { data: session, status } = useSession();

  const [error, setError] = useState("");

  const [jobApplications, setJobApplications] = useState<JobApplication[]>([]);
  const [ownerJobs, setOwnerJobs] = useState<OwnerJobWithApplicants[]>([]);
  const [jobAppLoading, setJobAppLoading] = useState(false);
  const [activeApplications, setActiveApplications] = useState<
    ActiveApplication[]
  >([]);
  const [activeOwnerJobs, setActiveOwnerJobs] = useState<ActiveOwnerJob[]>([]);
  const [completedApplications, setCompletedApplications] = useState<
    CompletedApplication[]
  >([]);
  const [completedOwnerJobs, setCompletedOwnerJobs] = useState<
    CompletedOwnerJob[]
  >([]);
  const [page1, setPage1] = useState(0); // Row 1
  const [page2, setPage2] = useState(0); // Row 2
  const [page3, setPage3] = useState(0); //Row 3
  const ITEMS_PER_PAGE = 3;

  const { subscribeToProjectList } = usePusher();

  // --- States สำหรับ Review Modal ---
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [selectedApp, setSelectedApp] = useState<any>(null);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [isAnonymous, setIsAnonymous] = useState(true);
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);

  // --- States สำหรับ Modal เริ่มงาน และ ยกเลิกใบสมัคร ---
  const [confirmApp, setConfirmApp] = useState<JobApplication | null>(null);
  const [withdrawApp, setWithdrawApp] = useState<JobApplication | null>(null);

  // ─── Effects ────────────────────────────────────────────────────────────────

  useEffect(() => {
    if (status === "authenticated") {
      fetchJobApplications();
    } else if (status === "unauthenticated") {
      setJobAppLoading(false);
      setError("กรุณาเข้าสู่ระบบเพื่อจัดการโปรเจกต์");
    }
  }, [status]);

  useEffect(() => {
    if (status === "authenticated" && session?.user?.id) {
      const unsubscribeProjectList = subscribeToProjectList(() => {
        fetchJobApplications(); // รีเฟรชเมื่อมี realtime update
      });
      return () => {
        unsubscribeProjectList();
      };
    }
  }, [status, session?.user?.id, subscribeToProjectList]);

  // ─── Fetch Job Applications  ────────────────────────────────────────

  const fetchJobApplications = async () => {
    setJobAppLoading(true);
    try {
      const isFreelancer = session?.user?.role === "student";
      // ✅ เพิ่มบรรทัดนี้
      const userId = (session?.user as any)?.id || (session?.user as any)?._id;

      if (isFreelancer) {
        const res = await axios.get("/api/applications", {
          params: { role: "student" },
        });
        setJobApplications(res.data.applications || []);
      } else {
        const res = await axios.get("/api/applications", {
          // ✅ เพิ่ม ownerId
          params: { role: "owner", ownerId: userId },
        });
        setOwnerJobs(res.data.jobs || []);
      }

      const activeRes = await axios.get("/api/applications", {
        params: {
          role: isFreelancer ? "student" : "owner",
          // ✅ เพิ่ม ownerId เฉพาะฝั่ง owner
          ...(!isFreelancer && { ownerId: userId }),
          phase: "inProgress",
        },
      });
      if (isFreelancer) {
        setActiveApplications(activeRes.data.applications || []);
      } else {
        setActiveOwnerJobs(activeRes.data.jobs || []);
      }

      const completedRes = await axios.get("/api/applications", {
        params: {
          role: isFreelancer ? "student" : "owner",
          // ✅ เพิ่ม ownerId เฉพาะฝั่ง owner
          ...(!isFreelancer && { ownerId: userId }),
          phase: "completed",
        },
      });
      if (isFreelancer) {
        setCompletedApplications(completedRes.data.applications || []);
      } else {
        setCompletedOwnerJobs(completedRes.data.jobs || []);
      }
    } catch (err) {
      console.error("Error fetching job applications:", err);
    } finally {
      setJobAppLoading(false);
    }
  };

  // ─── Render ───────────────────────────────────────────────────────────────────

  if (jobAppLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-10 h-screen">
        <Loading size="large" color="primary" />
        <p className="mt-4 text-gray-500">กำลังโหลดข้อมูลโปรเจกต์...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
        <p className="text-red-600">{error}</p>
        {status === "unauthenticated" && (
          <button
            onClick={() => (window.location.href = "/auth?state=login")}
            className="mt-4 px-4 py-2 bg-primary-blue-500 text-white rounded-lg hover:bg-primary-blue-600"
          >
            เข้าสู่ระบบ
          </button>
        )}
      </div>
    );
  }

  // Helper component
  const PaginatedGrid = ({ items, page, setPage, renderItem }) => {
    const total = items.length;
    const totalPages = Math.ceil(total / ITEMS_PER_PAGE);
    const paginated = items.slice(
      page * ITEMS_PER_PAGE,
      (page + 1) * ITEMS_PER_PAGE,
    );

    return (
      <div>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {paginated.map(renderItem)}
        </div>

        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-3 mt-6">
            <button
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              disabled={page === 0}
              className="p-2 rounded-full border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polyline points="15 18 9 12 15 6" />
              </svg>
            </button>

            <div className="flex gap-1.5">
              {Array.from({ length: totalPages }).map((_, i) => (
                <button
                  key={i}
                  onClick={() => setPage(i)}
                  className={`w-2 h-2 rounded-full transition-all ${
                    i === page ? "bg-primary-blue-500 w-4" : "bg-gray-300"
                  }`}
                />
              ))}
            </div>

            <button
              onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
              disabled={page === totalPages - 1}
              className="p-2 rounded-full border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </button>
          </div>
        )}
      </div>
    );
  };

  const isFreelancer = session?.user?.role === "student";

  // --- Logic Dashboard ---
  const allCompletedList = [
    ...jobApplications.filter((app) => app.status === "completed"),
    ...completedApplications,
  ];

  const uniqueCompletedApps = Array.from(
    new Map(allCompletedList.map((app) => [app._id, app])).values(),
  );

  const reviewedApps = uniqueCompletedApps.filter((app) => app.ownerReview);

  const totalRatingScore = reviewedApps.reduce(
    (sum, app) => sum + (app.ownerReview?.rating || 0),
    0,
  );
  const avgRatingValue =
    reviewedApps.length > 0
      ? (totalRatingScore / reviewedApps.length).toFixed(1)
      : "0.0";

  const dashboardStats = {
    totalCompleted: uniqueCompletedApps.length,
    totalEarnings: jobApplications
      .filter((app) => app.status === "completed")
      .reduce((sum, app) => sum + (app.jobBudgetMin || 0), 0),
    avgRating: avgRatingValue,
    reviewCount: reviewedApps.length,
  };

  // ฟังก์ชันเปิด Modal
  const openReviewModal = (app: any) => {
    setSelectedApp(app);
    setRating(5);
    setComment("");
    setIsReviewModalOpen(true);
  };

  // ฟังก์ชันส่งรีวิวไปยัง API
  const handleSubmitReview = async () => {
    if (!selectedApp) return;

    try {
      setIsSubmittingReview(true);
      await axios.patch(`/api/applications/${selectedApp._id}`, {
        action: "submitReview",
        role: session?.user?.role,
        rating,
        comment,
        isAnonymous: isAnonymous,
      });

      toast.success("บันทึกรีวิวเรียบร้อยแล้ว!");
      setIsReviewModalOpen(false);
      fetchJobApplications();
    } catch (err) {
      toast.error("เกิดข้อผิดพลาดในการส่งรีวิว");

      console.error("Submit Review Error:", err);
      console.error("Response Data:", err.response?.data);

      const errorMessage =
        err.response?.data?.error || "เกิดข้อผิดพลาดในการส่งรีวิว";
      toast.error(errorMessage);
    } finally {
      setIsSubmittingReview(false);
    }
  };

  const appStatusConfig: Record<string, { label: string; className: string }> =
    {
      pending: {
        label: "รอพิจารณา",
        className: "bg-yellow-100 text-yellow-700",
      },
      accepted: {
        label: "ผ่านการคัดเลือก",
        className: "bg-green-100  text-green-700",
      },
      rejected: {
        label: "ไม่ผ่านการคัดเลือก",
        className: "bg-red-100  text-red-600",
      },
    };

  return (
    <div className="flex flex-col gap-6 pb-10 max-w-7xl mx-auto w-full">
      {isFreelancer ? (
        <div className="flex justify-between items-center mt-8">
          <h2 className="text-3xl font-black text-[#0C5BEA] flex items-center gap-3">
            งานของฉัน
          </h2>
        </div>
      ) : (
        <div className="flex justify-between items-center mt-8">
          <h2 className="text-3xl font-black text-[#0C5BEA] flex items-center gap-3">
            ติดตามงาน
          </h2>
          <Link
            href="/manage-projects/my-jobs"
            className="px-6 py-2.5 rounded-full text-sm font-semibold text-gray-600 bg-white hover:bg-gray-100 transition-all shadow-sm border border-gray-100 flex items-center gap-2"
          >
            <BriefcaseBusiness className="w-4 h-4" />
            งานของฉัน
          </Link>
        </div>
      )}

      {/* --- Dashboard Summary Section --- */}
      {isFreelancer && (
        <div className="w-full max-w-7xl mx-auto mb-10 px-4 md:px-0">
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6"
          >
            {/* 1. งานทั้งหมด */}
            <motion.div
              variants={fadeInUp}
              whileHover={{ y: -8, transition: { duration: 0.3 } }}
              className="rounded-[2rem] md:rounded-[2.5rem] p-6 md:p-10 text-white shadow-2xl relative overflow-hidden group min-h-[160px] md:min-h-[200px] flex flex-col justify-between items-end"
              style={{
                background: "linear-gradient(135deg, #0C5BEA 0%, #6D91D3 100%)",
              }}
            >
              <div className="absolute -left-6 -bottom-6 opacity-20 group-hover:scale-110 group-hover:rotate-12 transition-all duration-700">
                <Briefcase
                  className="w-32 h-32 md:w-40 md:h-40"
                  strokeWidth={1.5}
                />
              </div>

              <h3 className="text-xs md:text-sm font-bold text-white/80 tracking-wide z-10">
                งานทั้งหมดที่เคยทำ
              </h3>

              <div className="relative z-10 flex flex-col items-end">
                <div className="flex items-baseline gap-2">
                  <span className="text-4xl md:text-6xl font-black tracking-tighter drop-shadow-lg">
                    {dashboardStats.totalCompleted}
                  </span>
                  <span className="text-xs md:text-sm font-bold text-white/60">
                    งาน
                  </span>
                </div>
                <p className="mt-1 md:mt-2 text-[9px] md:text-[10px] font-bold text-white/60 uppercase">
                  สำเร็จการทำงานแล้ว
                </p>
              </div>
            </motion.div>

            {/* 2. รายได้รวม */}
            <motion.div
              variants={fadeInUp}
              whileHover={{ y: -8, transition: { duration: 0.3 } }}
              className="rounded-[2rem] md:rounded-[2.5rem] p-6 md:p-10 text-white shadow-2xl relative overflow-hidden group min-h-[160px] md:min-h-[200px] flex flex-col justify-between items-end"
              style={{
                background:
                  "linear-gradient(135deg, #0C5BEA 10%, #6D91D3 100%)",
              }}
            >
              <div className="absolute -left-6 -bottom-6 opacity-20 group-hover:scale-110 group-hover:-rotate-12 transition-all duration-700">
                <DollarSign
                  className="w-32 h-32 md:w-40 md:h-40"
                  strokeWidth={1.5}
                />
              </div>

              <h3 className="text-xs md:text-sm font-bold text-white/80 tracking-wide z-10">
                รายได้รวม
              </h3>

              <div className="relative z-10 flex flex-col items-end">
                <div className="flex items-baseline gap-1 md:gap-2">
                  <span className="text-4xl md:text-5xl lg:text-6xl font-black tracking-tighter drop-shadow-lg">
                    {dashboardStats.totalEarnings.toLocaleString()}
                  </span>
                  <span className="text-xs md:text-sm font-bold text-white/60">
                    บาท
                  </span>
                </div>
                <p className="mt-1 md:mt-2 text-[9px] md:text-[10px] font-bold text-white/40 uppercase text-right">
                  * คำนวณจากค่าตอบแทนเบื้องต้น
                </p>
              </div>
            </motion.div>

            {/* 3. รีวิวรวม */}
            <motion.div
              variants={fadeInUp}
              whileHover={{ y: -8, transition: { duration: 0.3 } }}
              className="rounded-[2rem] md:rounded-[2.5rem] p-6 md:p-10 text-white shadow-2xl relative overflow-hidden group min-h-[160px] md:min-h-[200px] flex flex-col justify-between items-end"
              style={{
                background: "linear-gradient(135deg, #0C5BEA 0%, #6D91D3 100%)",
              }}
            >
              <div className="absolute -left-6 -bottom-6 opacity-20 group-hover:scale-110 transition-all duration-700">
                <Star className="w-32 h-32 md:w-40 md:h-40" strokeWidth={1.5} />
              </div>

              <h3 className="text-xs md:text-sm font-bold text-white/80 tracking-wide z-10">
                รีวิวรวม
              </h3>

              <div className="relative z-10 flex flex-col items-end">
                <span className="text-4xl md:text-6xl font-black tracking-tighter text-white drop-shadow-lg">
                  {dashboardStats.avgRating}
                </span>
                <div className="flex gap-0.5 mt-1 md:mt-2">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      size={window?.innerWidth < 768 ? 12 : 14}
                      fill={
                        i < Math.floor(Number(dashboardStats.avgRating))
                          ? "#F4FE57"
                          : "none"
                      }
                      className={
                        i < Math.floor(Number(dashboardStats.avgRating))
                          ? "text-[#F4FE57]"
                          : "text-white/20"
                      }
                    />
                  ))}
                </div>
                <p className="mt-1 md:mt-2 text-[9px] md:text-[10px] font-bold text-white/60 uppercase">
                  จากทั้งหมด {dashboardStats.reviewCount} รีวิว
                </p>
              </div>
            </motion.div>
          </motion.div>
        </div>
      )}

      {/* ── Row 1: ✅ Job Applications Section ── */}
      <div className="w-full">
        {isFreelancer ? (
          // ── ฝั่งนิสิต: งานที่สมัครไว้ ──────────────────────────────────────
          <div className="bg-white rounded-[2.5rem] p-8 border border-gray-100">
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-l font-black text-gray-900 flex items-center gap-3">
                <div className="p-2.5 bg-indigo-500 rounded-xl text-white shadow-lg shadow-indigo-100">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                    />
                  </svg>
                </div>
                งานพิเศษที่สมัครไว้ (
                {
                  jobApplications.filter(
                    (a) =>
                      a.status === "pending" ||
                      a.status === "rejected" ||
                      a.status === "accepted",
                  ).length
                }
                )
              </h2>
            </div>

            {jobAppLoading ? (
              <div className="flex justify-center py-6">
                <Loading size="small" color="primary" />
              </div>
            ) : jobApplications.length === 0 ? (
              <div className="bg-white rounded-[2rem] p-12 text-center border border-dashed border-gray-200">
                <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-300">
                  <Briefcase size={32} />
                </div>
                <p className="font-bold text-gray-400">
                  คุณยังไม่ได้สมัครงานพิเศษใดๆ
                </p>
                <Link
                  href="/find-job"
                  className="text-primary-blue-500 text-sm hover:underline mt-2 inline-block"
                >
                  ค้นหางานพิเศษ →
                </Link>
              </div>
            ) : (
              <PaginatedGrid
                items={jobApplications.filter(
                  (a) =>
                    a.status === "pending" ||
                    a.status === "rejected" ||
                    a.status === "accepted",
                )}
                page={page1}
                setPage={setPage1}
                renderItem={(app) => {
                  const s =
                    appStatusConfig[app.status] ?? appStatusConfig.pending;
                  return (
                    <div
                      key={app._id}
                      className="bg-white rounded-3xl border border-gray-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 overflow-hidden flex flex-col group"
                    >
                      <div className="p-6 flex-1 flex flex-col gap-3">
                        {/* Title + badge */}
                        <div className="flex items-start justify-between gap-4">
                          <h3 className="font-black text-gray-900 leading-tight line-clamp-1">
                            {app.jobTitle}
                          </h3>
                          <span
                            className={`text-xs px-2.5 py-1 rounded-lg uppercase shrink-0 ${s.className}`}
                          >
                            {s.label}
                          </span>
                        </div>

                        {/* Budget + Date */}
                        <div className="flex items-center justify-between mt-auto pt-2">
                          <p className="text-xs text-gray-500">
                            {app.jobBudgetMin.toLocaleString()}
                            {app.jobBudgetMax
                              ? ` – ${app.jobBudgetMax.toLocaleString()}`
                              : ""}{" "}
                            บาท
                          </p>
                          <p className="text-xs text-gray-400">
                            สมัครเมื่อ{" "}
                            {new Date(app.appliedDate).toLocaleDateString(
                              "th-TH",
                            )}
                          </p>
                        </div>

                        {/* ปุ่ม */}
                        {/* ปุ่ม — กำหนด min-h ให้คงที่ทุก status */}
                        <div className="min-h-[40px] flex flex-col justify-end mt-auto">
                          {app.status === "accepted" ? (
                            <div className="flex gap-2 items-center">
                              <button
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  setConfirmApp(app);
                                }}
                                className="flex-[2] btn-primary text-sm text-center rounded-full"
                              >
                                เริ่มงาน
                              </button>
                              <button
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  setWithdrawApp(app);
                                }}
                                className="flex-1 bg-white text-red-500 text-xs border border-red-400 hover:bg-red-50 px-2 py-2 rounded-full transition-colors"
                              >
                                ยกเลิกใบสมัคร
                              </button>
                            </div>
                          ) : app.status === "pending" ? (
                            <div className="flex items-center justify-between pb-2">
                              <Link
                                href={`/find-job/${app.jobId}`}
                                className="text-xs text-primary-blue-500 font-medium hover:underline"
                              >
                                ดูรายละเอียดงาน →
                              </Link>
                              <button
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  setWithdrawApp(app);
                                }}
                                className="text-xs text-red-400 hover:underline transition-colors"
                              >
                                ยกเลิกใบสมัคร
                              </button>
                            </div>
                          ) : (
                            <Link
                              href={`/find-job/${app.jobId}`}
                              className="text-xs text-primary-blue-500 font-medium text-right hover:underline"
                            >
                              ดูรายละเอียดงาน →
                            </Link>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                }}
              />
            )}
          </div>
        ) : (
          // ── ฝั่งเจ้าของ: งานที่มีคนมาสมัคร ───────────────────────────────────
          <div className="bg-white rounded-[2.5rem] p-8 border border-gray-100">
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-l font-black text-gray-900 flex items-center gap-3">
                <div className="p-2.5 bg-purple-500 rounded-xl text-white shadow-lg shadow-purple-100">
                  <Users size={20} />
                </div>
                ผู้สมัครงานพิเศษของฉัน ({ownerJobs.length})
              </h2>
            </div>

            {jobAppLoading ? (
              <div className="flex justify-center py-6">
                <Loading size="small" color="primary" />
              </div>
            ) : ownerJobs.length === 0 ? (
              <div className="bg-white rounded-[2rem] p-12 text-center border border-dashed border-gray-200">
                <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-300">
                  <Users size={32} />
                </div>
                <p className="font-bold text-gray-400">
                  ยังไม่มีนิสิตสมัครงานพิเศษของคุณ
                </p>
              </div>
            ) : (
              <PaginatedGrid
                items={ownerJobs}
                page={page1}
                setPage={setPage1}
                renderItem={(job) => (
                  <div
                    key={job._id}
                    className="bg-white rounded-3xl border border-gray-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 overflow-hidden flex flex-col group"
                  >
                    <div className="p-6 flex-1 flex flex-col gap-3">
                      {/* Title + badge */}
                      <div className="flex items-start justify-between gap-4">
                        <h3 className="font-black text-gray-900 leading-tight line-clamp-1">
                          {job.title}
                        </h3>
                        <div className="flex flex-col items-end gap-1 flex-shrink-0">
                          {job.acceptedCount >= job.capacity ? (
                            <span className="text-xs px-2.5 py-1 rounded-lg border uppercase bg-green-50 text-green-700 border-green-100">
                              คัดเลือกครบแล้ว
                            </span>
                          ) : job.pendingCount > 0 ? (
                            <span className="text-xs px-2.5 py-1 rounded-lg border uppercase bg-yellow-50 text-yellow-700 border-yellow-100">
                              รอพิจารณา {job.pendingCount}
                            </span>
                          ) : null}
                        </div>
                      </div>

                      <div className="flex items-center justify-between mt-auto pt-2">
                        <span className="text-xs text-gray-500">
                          ผู้สมัครทั้งหมด {job.totalCount} คน · รับแล้ว{" "}
                          {job.acceptedCount}/{job.capacity}
                        </span>
                        <Link
                          href={`/manage-projects/${job._id}/applicants`}
                          className="text-xs text-primary-blue-500 font-medium group-hover:underline"
                        >
                          ดูผู้สมัคร →
                        </Link>
                      </div>
                    </div>
                  </div>
                )}
              />
            )}
          </div>
        )}
      </div>
      {/* ── Row 2: กำลังดำเนินการ ── */}
      <div className="w-full">
        {isFreelancer ? (
          // ── ฝั่งนิสิต ──────────────────────────────────────────────────────────
          <div className="bg-white rounded-[2.5rem] p-8 border border-gray-100">
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-l font-black text-gray-900 flex items-center gap-3">
                <div className="p-2.5 bg-blue-600 rounded-xl text-white shadow-lg shadow-blue-100">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13 10V3L4 14h7v7l9-11h-7z"
                    />
                  </svg>
                </div>
                งานที่กำลังทำอยู่ ({activeApplications.length})
              </h2>
            </div>

            {activeApplications.length === 0 ? (
              <div className="bg-white rounded-[2rem] p-12 text-center border border-dashed border-gray-200">
                <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-300">
                  <Briefcase size={32} />
                </div>
                <p className="font-bold text-gray-400">
                  ยังไม่มีงานที่กำลังดำเนินการ
                </p>
              </div>
            ) : (
              <PaginatedGrid
                items={activeApplications}
                page={page2}
                setPage={setPage2}
                renderItem={(app) => {
                  const statusConfig: Record<
                    string,
                    { label: string; color: string }
                  > = {
                    in_progress: {
                      label: "กำลังทำงาน",
                      color: "bg-yellow-50 text-yellow-700 border-yellow-100",
                    },
                    submitted: {
                      label: "ส่งงานแล้ว",
                      color: "bg-purple-50 text-purple-700 border-purple-100",
                    },
                    revision: {
                      label: "แก้ไขงาน",
                      color: "bg-orange-50 text-orange-700 border-orange-100",
                    },
                  };
                  const s =
                    statusConfig[app.status] ?? statusConfig.in_progress;
                  return (
                    <div
                      key={app._id}
                      className="bg-white rounded-3xl border border-gray-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 overflow-hidden flex flex-col group"
                    >
                      <div className="p-6 flex-1 flex flex-col gap-3">
                        <div className="flex items-start justify-between gap-4">
                          <h3 className="font-black text-gray-900 leading-tight line-clamp-1">
                            {app.jobTitle}
                          </h3>
                          <span
                            className={`text-xs px-2.5 py-1 rounded-lg border uppercase shrink-0 ${s.color}`}
                          >
                            {s.label}
                          </span>
                        </div>
                        <div>
                          <div className="flex justify-between text-xs text-gray-500 mb-1.5">
                            <span>ความคืบหน้า</span>
                            <span className="font-medium text-gray-700">
                              {app.progress}%
                            </span>
                          </div>
                          <div className="w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
                            <div
                              className="bg-primary-blue-500 h-1.5 rounded-full transition-all duration-500"
                              style={{ width: `${app.progress}%` }}
                            />
                          </div>
                        </div>
                        <p className="text-xs text-gray-400">
                          กำหนดส่ง:{" "}
                          {app.jobDeadline
                            ? new Date(app.jobDeadline).toLocaleDateString("th-TH")
                            : "-"}
                        </p>
                        <Link
                          href={`/manage-projects/${app.jobId}/work/${app._id}`}
                          className="btn-primary block text-sm text-center py-2 rounded-full w-full mt-auto"
                        >
                          {app.status === "submitted"
                            ? "ดูรายละเอียดงาน"
                            : "ส่งงาน →"}
                        </Link>
                      </div>
                    </div>
                  );
                }}
              />
            )}
          </div>
        ) : (
          /* ฝั่งเจ้าของงาน */
          <div className="bg-white rounded-[2.5rem] p-8 border border-gray-100">
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-l font-black text-gray-900 flex items-center gap-3">
                <div className="p-2.5 bg-blue-600 rounded-xl text-white shadow-lg shadow-blue-100">
                  <Clock size={20} />
                </div>
                งานที่กำลังดำเนินการ ({activeOwnerJobs.length})
              </h2>
            </div>

            {activeOwnerJobs.length === 0 ? (
              <div className="bg-white rounded-[2rem] p-12 text-center border border-dashed border-gray-200">
                <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-300">
                  <Briefcase size={32} />
                </div>
                <p className="font-bold text-gray-400">
                  ยังไม่มีงานที่กำลังดำเนินการในขณะนี้
                </p>
              </div>
            ) : (
              <PaginatedGrid
                items={activeOwnerJobs}
                page={page2}
                setPage={setPage2}
                renderItem={(job) => {
                  const badgeStyles: Record<string, string> = {
                    red: "bg-red-50 text-red-600 border-red-100",
                    orange: "bg-orange-50 text-orange-600 border-orange-100",
                    blue: "bg-blue-50 text-blue-600 border-blue-100",
                    green: "bg-green-50 text-green-600 border-green-100",
                  };
                  const currentStyle =
                    badgeStyles[job.aggregateBadge.color] || badgeStyles.blue;
                  const breakdownItems = [
                    {
                      count: job.statusCounts.submitted,
                      label: "รอตรวจ",
                      cls: "bg-red-50 text-red-700",
                    },
                    {
                      count: job.statusCounts.revision,
                      label: "แก้ไข",
                      cls: "bg-orange-50 text-orange-700",
                    },
                    {
                      count: job.statusCounts.inProgress,
                      label: "กำลังทำ",
                      cls: "bg-yellow-50 text-yellow-700",
                    },
                    {
                      count: job.statusCounts.waitingToStart,
                      label: "รอเริ่ม",
                      cls: "bg-blue-50 text-blue-700",
                    },
                    {
                      count: job.statusCounts.completed,
                      label: "เสร็จ",
                      cls: "bg-green-50 text-green-700",
                    },
                  ].filter((item) => item.count > 0);
                  return (
                    <div
                      key={job._id}
                      className="bg-white rounded-3xl border border-gray-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 overflow-hidden flex flex-col group"
                    >
                      <div className="p-6 flex-1">
                        <div className="flex justify-between items-start gap-4 mb-5">
                          <h3 className="font-black text-gray-900 leading-tight line-clamp-1">
                            {job.title}
                          </h3>
                          <span
                            className={`text-xs px-2.5 py-1 rounded-lg border uppercase shrink-0 ${currentStyle}`}
                          >
                            {job.aggregateBadge.label}
                          </span>
                        </div>
                        <div className="flex justify-between text-xs text-gray-500 mb-2">
                          <span>ความคืบหน้าเฉลี่ย</span>
                          <span className="font-medium text-gray-700">
                            {job.avgProgress}%
                          </span>
                        </div>
                        <div className="w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
                          <div
                            className="bg-primary-blue-500 h-1.5 rounded-full transition-all duration-500"
                            style={{ width: `${job.avgProgress}%` }}
                          />
                        </div>
                        <div className="flex items-center justify-between py-2">
                          <div className="flex items-center gap-1.5">
                            <div className="flex">
                              {job.workers.slice(0, 5).map((w, i) => (
                                <div
                                  key={w._id}
                                  title={w.applicantName}
                                  className="w-6 h-6 rounded-full bg-gray-200 border-2 border-white overflow-hidden flex items-center justify-center text-[10px] font-medium text-gray-600 flex-shrink-0"
                                  style={{
                                    marginLeft: i > 0 ? "-6px" : "0",
                                    zIndex: 5 - i,
                                  }}
                                >
                                  {w.profileImageUrl ? (
                                    <img
                                      src={w.profileImageUrl}
                                      alt={w.applicantName}
                                      className="w-full h-full object-cover"
                                    />
                                  ) : (
                                    w.applicantName?.charAt(0) || "?"
                                  )}
                                </div>
                              ))}
                            </div>
                            <span className="text-xs text-gray-500">
                              {job.workers.length} คน
                            </span>
                          </div>
                          <span className="text-xs text-gray-400">
                            กำหนดส่ง{" "}
                            {job.deliveryDate
                              ? new Date(job.deliveryDate).toLocaleDateString("th-TH")
                              : "-"}
                          </span>
                        </div>
                        {breakdownItems.length > 0 && (
                          <div className="flex flex-wrap gap-1 pt-2 border-t border-gray-100">
                            {breakdownItems.map((item) => (
                              <span
                                key={item.label}
                                className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${item.cls}`}
                              >
                                {item.count} {item.label}
                              </span>
                            ))}
                          </div>
                        )}
                        <Link
                          href={`/manage-projects/${job._id}/overview`}
                          className="btn-primary block text-sm text-center py-2 rounded-full w-full mt-3"
                        >
                          ดูรายละเอียดงาน
                        </Link>
                      </div>
                    </div>
                  );
                }}
              />
            )}
          </div>
        )}
      </div>
      {/* ── Row 3: งานที่เสร็จสิ้น ── */}
      <div className="w-full">
        {isFreelancer ? (
          // ── ฝั่งนิสิต (Student) ──────────────────────────────────────────────────────────
          <div className="bg-white rounded-[2.5rem] p-8 border border-gray-100">
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-l font-black text-gray-900 flex items-center gap-3">
                <div className="p-2.5 bg-green-500 rounded-xl text-white shadow-lg shadow-green-100">
                  <CheckCircle size={20} />
                </div>
                งานที่เสร็จสิ้น ({completedApplications.length})
              </h2>
            </div>

            {completedApplications.length === 0 ? (
              <div className="bg-white rounded-[2rem] p-12 text-center border border-dashed border-gray-200">
                <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-300">
                  <Briefcase size={32} />
                </div>
                <p className="font-bold text-gray-400">
                  ยังไม่มีงานที่เสร็จสิ้น
                </p>
              </div>
            ) : (
              <PaginatedGrid
                items={completedApplications}
                page={page3}
                setPage={setPage3}
                renderItem={(app) => {
                  const hasStudentReviewed = !!app.studentReview;
                  const hasOwnerReviewed = !!app.ownerReview;

                  return (
                    <div
                      key={app._id}
                      className="bg-white rounded-3xl border border-gray-100 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col group"
                    >
                      <div className="p-6 flex-1 flex flex-col gap-3">
                        <div className="flex items-start justify-between gap-4">
                          <h3 className="font-black text-gray-900 leading-tight line-clamp-2">
                            {app.jobTitle}
                          </h3>
                          <span className="text-xs px-2.5 py-1 rounded-lg border uppercase bg-green-50 text-green-600 border-green-100 shrink-0">
                            เสร็จสิ้น
                          </span>
                        </div>

                        <p className="text-xs text-gray-400">
                          {app.jobCategory || "งานพิเศษ"}
                        </p>

                        <div className="flex items-center justify-between mt-auto pt-4 border-t border-gray-50 w-full">
                          <span className="text-[10px] text-gray-400 font-medium">
                            กำหนดส่ง{" "}
                            {app.deliveryDate
                              ? new Date(app.deliveryDate).toLocaleDateString(
                                  "th-TH",
                                )
                              : "-"}
                          </span>

                          <Link
                            href={`/manage-projects/${app.jobId}/work/${app._id}`}
                            className={`text-xs font-bold transition-all hover:underline flex items-center gap-1 ${
                              hasStudentReviewed
                                ? "text-primary-blue-500"
                                : "text-orange-500 animate-pulse"
                            }`}
                          >
                            {hasStudentReviewed ? (
                              "ดูรายละเอียด →"
                            ) : (
                              <span className="flex items-center gap-1">
                                <Star size={12} fill="currentColor" />{" "}
                                รีวิวผู้ว่าจ้างเลย! →
                              </span>
                            )}
                          </Link>
                        </div>
                      </div>
                    </div>
                  );
                }}
              />
            )}
          </div>
        ) : (
          // ── ฝั่งเจ้าของงาน (Owner) ──────────────────────────────────────────────────────────
          <div className="bg-white rounded-[2.5rem] p-8 border border-gray-100">
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-l font-black text-gray-900 flex items-center gap-3">
                <div className="p-2.5 bg-blue-600 rounded-xl text-white shadow-lg shadow-blue-100">
                  <CheckCircle size={20} />
                </div>
                งานที่เสร็จสิ้น ({completedOwnerJobs.length})
              </h2>
            </div>

            {completedOwnerJobs.length === 0 ? (
              <div className="bg-white rounded-[2rem] p-12 text-center border border-dashed border-gray-200">
                <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-300">
                  <Briefcase size={32} />
                </div>
                <p className="font-bold text-gray-400">
                  ยังไม่มีงานที่เสร็จสิ้น
                </p>
              </div>
            ) : (
              <PaginatedGrid
                items={completedOwnerJobs}
                page={page3}
                setPage={setPage3}
                renderItem={(job: any) => {
                  const hiredWorkers = job.workers || [];
                  const isAllReviewed =
                    hiredWorkers.length > 0 &&
                    hiredWorkers.every((w: any) => !!w.ownerReview?.rating);

                  return (
                    <div
                      key={job._id}
                      className="bg-white rounded-3xl border border-gray-100 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col group"
                    >
                      <div className="p-6 flex-1 flex flex-col gap-3">
                        <div className="flex items-start justify-between gap-4">
                          <h3 className="font-black text-gray-900 leading-tight line-clamp-1">
                            {job.title}
                          </h3>
                          <span className="text-xs px-2.5 py-1 rounded-lg border uppercase bg-green-50 text-green-600 border-green-100 shrink-0">
                            เสร็จสิ้น
                          </span>
                        </div>

                        <p className="text-xs text-gray-400">
                          {job.category || "งานพิเศษ"}
                        </p>

                        <div className="flex items-center justify-between mt-auto pt-4 border-t border-gray-50 w-full">
                          <span className="text-[10px] text-gray-400 font-medium">
                            กำหนดส่ง{" "}
                            {job.deliveryDate
                              ? new Date(job.deliveryDate).toLocaleDateString(
                                  "th-TH",
                                )
                              : "-"}
                          </span>

                          <Link
                            href={`/manage-projects/${job.jobId || job._id}/overview`}
                            className={`text-xs font-bold transition-all hover:underline flex items-center gap-1 ${
                              isAllReviewed
                                ? "text-primary-blue-500"
                                : "text-orange-500 animate-pulse"
                            }`}
                          >
                            {isAllReviewed ? (
                              "ดูรายละเอียด →"
                            ) : (
                              <span className="flex items-center gap-1">
                                <Star size={12} fill="currentColor" />{" "}
                                รีวิวนิสิตเลย! →
                              </span>
                            )}
                          </Link>
                        </div>
                      </div>
                    </div>
                  );
                }}
              />
            )}
          </div>
        )}
      </div>

      <AnimatePresence>
        {isReviewModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsReviewModalOpen(false)}
              className="absolute inset-0 bg-gray-900/40 backdrop-blur-sm"
            />

            {/* Modal Content */}
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="relative bg-white w-full max-w-md rounded-[2.5rem] p-10 shadow-2xl text-center"
            >
              <div className="w-16 h-16 bg-yellow-50 text-yellow-500 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <Star size={32} fill="currentColor" />
              </div>

              <h3 className="text-xl font-black text-gray-900 mb-2">
                ให้คะแนนความประทับใจ
              </h3>
              <p className="text-xs text-gray-400 mb-8 font-medium">
                โปรเจกต์: {selectedApp?.jobTitle || selectedApp?.title}
              </p>

              {/* Star Rating */}
              <div className="flex justify-center gap-3 mb-8">
                {[1, 2, 3, 4, 5].map((num) => (
                  <button
                    key={num}
                    onClick={() => setRating(num)}
                    className={`transition-all duration-200 ${rating >= num ? "text-yellow-400 scale-110" : "text-gray-200"}`}
                  >
                    <Star
                      size={36}
                      fill={rating >= num ? "currentColor" : "none"}
                      strokeWidth={2.5}
                    />
                  </button>
                ))}
              </div>

              <textarea
                rows={3}
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="เขียนความประทับใจ หรือข้อเสนอแนะ..."
                className="w-full p-5 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none text-sm mb-6 transition-all"
              />

              {/* Anonymous Toggle */}
              <div className="flex items-center justify-between px-5 py-4 bg-gray-50 rounded-2xl mb-8 border border-gray-100">
                <div className="text-left">
                  <p className="text-xs font-bold text-gray-700">
                    ส่งแบบไม่ระบุตัวตน
                  </p>
                  <p className="text-[10px] text-gray-400">
                    ตัวตนของคุณจะไม่ปรากฏในหน้าโปรไฟล์ของอีกฝ่าย
                  </p>
                </div>
                <button
                  onClick={() => setIsAnonymous(!isAnonymous)}
                  className={`w-11 h-6 rounded-full transition-colors relative ${isAnonymous ? "bg-blue-600" : "bg-gray-300"}`}
                >
                  <motion.div
                    animate={{ x: isAnonymous ? 22 : 2 }}
                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
                    className="absolute top-1 w-4 h-4 bg-white rounded-full shadow-sm"
                  />
                </button>
              </div>

              <div className="flex flex-col gap-3">
                <button
                  onClick={handleSubmitReview}
                  disabled={isSubmittingReview}
                  className="w-full py-4 bg-[#0C5BEA] text-white font-black rounded-2xl shadow-xl shadow-blue-100 hover:bg-blue-700 transition-all active:scale-95 disabled:opacity-50"
                >
                  {isSubmittingReview ? "กำลังบันทึก..." : "ส่งรีวิวและบันทึก"}
                </button>
                <button
                  onClick={() => setIsReviewModalOpen(false)}
                  className="text-xs font-bold text-gray-400 hover:text-gray-600 transition-all py-2"
                >
                  ปิดหน้าต่างนี้
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      <ConfirmStartJobModal
        app={confirmApp}
        onClose={() => setConfirmApp(null)}
        onSuccess={fetchJobApplications}
        isOpen
      />
      <WithdrawApplicationModal
        app={withdrawApp}
        onClose={() => setWithdrawApp(null)}
        onSuccess={fetchJobApplications}
        isOpen
      />
    </div>
  );
}
