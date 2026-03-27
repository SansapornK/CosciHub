// src/app/(pages)/manage-projects/page.tsx
"use client";

import React, { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import axios from "axios";
import Loading from "../../components/common/Loading";
import toast, { Toaster } from "react-hot-toast";
import { usePusher } from "../../../providers/PusherProvider";
import Link from "next/link";
import {
  Briefcase,
  Clock,
  CheckCircle,
  LayoutDashboard,
  Users,
  ArrowRight,
  DollarSign,
  Star,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

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

// ─── ใหม่: งานที่กำลังทำอยู่ (นิสิต) ──────────────
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

// ─── ใหม่: งานของเจ้าของที่กำลังดำเนินการ ─────────
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
}

interface CompletedOwnerJob {
  _id: string;
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

  // Project states (เดิม)
  const [error, setError] = useState("");

  // ✅ ใหม่: Job Application states
  const [jobApplications, setJobApplications] = useState<JobApplication[]>([]);
  const [ownerJobs, setOwnerJobs] = useState<OwnerJobWithApplicants[]>([]);
  const [jobAppLoading, setJobAppLoading] = useState(false);
  const [activeApplications, setActiveApplications] = useState<ActiveApplication[]>([]);
  const [activeOwnerJobs, setActiveOwnerJobs] = useState<ActiveOwnerJob[]>([]);
  const [completedApplications, setCompletedApplications] = useState<CompletedApplication[]>([]);
  const [completedOwnerJobs, setCompletedOwnerJobs] = useState<
    CompletedOwnerJob[]
  >([]);
  const [page1, setPage1] = useState(0); // Row 1: งานที่สมัครไว้ / ผู้สมัครงาน
  const [page2, setPage2] = useState(0); // Row 2: งานที่กำลังทำอยู่ / งานที่กำลังดำเนินการ
  const [page3, setPage3] = useState(0); //Row 3: งานที่เสร็จสิ้น
  const ITEMS_PER_PAGE = 3;

  const { subscribeToProjectList } = usePusher();

  // ─── Effects ────────────────────────────────────────────────────────────────

  useEffect(() => {
    if (status === "authenticated") {
      fetchJobApplications(); // ✅ เพิ่ม
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

  // ─── ✅ Fetch Job Applications  ────────────────────────────────────────

  const fetchJobApplications = async () => {
    setJobAppLoading(true);
    try {
      const isFreelancer = session?.user?.role === "student";

      if (isFreelancer) {
        const res = await axios.get("/api/applications", {
          params: { role: "student" },
        });
        setJobApplications(res.data.applications || []);
      } else {
        const res = await axios.get("/api/applications", {
          params: { role: "owner" },
        });
        setOwnerJobs(res.data.jobs || []);
      }
      const activeRes = await axios.get("/api/applications", {
        params: {
          role: isFreelancer ? "student" : "owner",
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
      (page + 1) * ITEMS_PER_PAGE
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
  const dashboardStats = {
    totalCompleted: 0,
    totalEarnings: 0,
    avgRating: 4.9, // ในอนาคตดึงจาก session.user.rating หรือ API profile
    reviewCount: 8, // ในอนาคตดึงจาก session.user.reviewCount
  };

  if (isFreelancer) {
    const completedApps = jobApplications.filter(
      (app) => app.status === "completed"
    );

    dashboardStats.totalCompleted = completedApps.length;

    // คำนวณรายได้สะสม (ใช้ค่า budgetMin เป็นเกณฑ์)
    dashboardStats.totalEarnings = completedApps.reduce(
      (sum, app) => sum + (app.jobBudgetMin || 0),
      0
    );
  }

  // Status badge config สำหรับ job application
  const appStatusConfig: Record<string, { label: string; className: string }> =
    {
      pending: {
        label: "รอการพิจารณา",
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
      <Toaster position="bottom-left" />

      {isFreelancer ? (
        <div className="flex justify-between items-center mt-8">
          <h2 className="text-3xl font-black text-[#0C5BEA] flex items-center gap-3">
            งานของฉัน
          </h2>
        </div>
      ) : (
        <div className="flex justify-between items-center mt-8">
          <h2 className="text-3xl font-black text-[#0C5BEA] flex items-center gap-3">
            {/* <div className="p-2.5 bg-indigo-500 rounded-xl text-white shadow-lg shadow-indigo-100">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div> */}
            ติดตามงาน
          </h2>
        </div>
      )}


      {/* --- Dashboard Summary Section --- */}
      {isFreelancer && (
        <div className="w-full max-w-7xl mx-auto mb-10">
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="grid grid-cols-1 md:grid-cols-3 gap-6"
          >
            {/* 1. */}
            <motion.div
              variants={fadeInUp}
              whileHover={{ y: -8, transition: { duration: 0.3 } }}
              className="rounded-[2.5rem] p-10 text-white shadow-2xl relative overflow-hidden group min-h-[200px] flex flex-col justify-between items-end"
              style={{
                background: "linear-gradient(135deg, #0C5BEA 0%, #6D91D3 100%)",
              }}
            >
              {/* Icon Bg */}
              <div className="absolute -left-6 -bottom-6 opacity-20 group-hover:scale-110 group-hover:rotate-12 transition-all duration-700">
                <Briefcase size={160} strokeWidth={1.5} />
              </div>

              <h3 className="text-sm font-bold text-white/80 tracking-wide z-10">
                งานทั้งหมดที่เคยทำ
              </h3>

              <div className="relative z-10">
                <div className="flex items-baseline gap-2">
                  <span className="text-6xl font-black tracking-tighter drop-shadow-lg">
                    {dashboardStats.totalCompleted}
                  </span>
                </div>
              </div>
            </motion.div>

            {/* 2. */}
            <motion.div
              variants={fadeInUp}
              whileHover={{ y: -8, transition: { duration: 0.3 } }}
              className="rounded-[2.5rem] p-10 text-white shadow-2xl relative overflow-hidden group min-h-[200px] flex flex-col justify-between items-end"
              style={{
                background:
                  "linear-gradient(135deg, #0C5BEA 10%, #6D91D3 100%)",
              }}
            >
              <div className="absolute -left-6 -bottom-6 opacity-20 group-hover:scale-110 group-hover:-rotate-12 transition-all duration-700">
                <DollarSign size={160} strokeWidth={1.5} />
              </div>

              <h3 className="text-sm font-bold text-white/80 tracking-wide z-10">
                รายได้รวม
              </h3>

              <div className="relative z-10">
                <div className="flex items-baseline gap-2">
                  <span className="text-5xl md:text-6xl font-black tracking-tighter drop-shadow-lg">
                    {dashboardStats.totalEarnings.toLocaleString()}
                  </span>
                  <span className="text-sm font-bold text-white/60">บาท</span>
                </div>
              </div>
            </motion.div>

            {/* 3. */}
            <motion.div
              variants={fadeInUp}
              whileHover={{ y: -8, transition: { duration: 0.3 } }}
              className="rounded-[2.5rem] p-10 text-white shadow-2xl relative overflow-hidden group min-h-[200px] flex flex-col justify-between items-end"
              style={{
                background: "linear-gradient(135deg, #0C5BEA 0%, #6D91D3 100%)",
              }}
            >
              <div className="absolute -left-6 -bottom-6 opacity-20 group-hover:scale-110 transition-all duration-700">
                <Star size={160} strokeWidth={1.5} />
              </div>

              <h3 className="text-sm font-bold text-white/80 tracking-wide z-10">
                รีวิวรวม
              </h3>

              <div className="relative z-10 flex flex-col items-end">
                <span className="text-6xl font-black tracking-tighter text-white drop-shadow-lg">
                  {dashboardStats.avgRating}
                </span>
                <div className="flex gap-0.5 mt-2">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      size={14}
                      fill={
                        i < Math.floor(dashboardStats.avgRating)
                          ? "#F4FE57"
                          : "none"
                      }
                      className={
                        i < Math.floor(dashboardStats.avgRating)
                          ? "text-[#F4FE57]"
                          : "text-white/20"
                      }
                    />
                  ))}
                </div>
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
                      a.status === "accepted"
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
                    a.status === "accepted"
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
                          <h3 className="font-black text-gray-900 leading-tight line-clamp-2">
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
                              "th-TH"
                            )}
                          </p>
                        </div>

                        {/* ปุ่ม */}
                        {app.status === "accepted" ? (
                          <button
                            onClick={async (e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              try {
                                await axios.patch(
                                  `/api/applications/${app._id}`,
                                  {
                                    action: "updateProgress",
                                    progress: 0,
                                  }
                                );
                                toast.success("เริ่มงานแล้ว!");
                                await fetchJobApplications();
                              } catch (err: any) {
                                toast.error(
                                  err.response?.data?.error || "เกิดข้อผิดพลาด"
                                );
                              }
                            }}
                            className="btn-primary block text-sm text-center py-2 rounded-full w-full"
                          >
                            เริ่มงาน
                          </button>
                        ) : (
                          <Link
                            href={`/find-job/${app.jobId}`}
                            className="text-xs text-primary-blue-500 font-medium text-right group-hover:underline"
                          >
                            ดูรายละเอียดงาน →
                          </Link>
                        )}
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
                        <h3 className="font-black text-gray-900 leading-tight line-clamp-2">
                          {job.title}
                        </h3>
                        <div className="flex flex-col items-end gap-1 flex-shrink-0">
                          {job.acceptedCount >= job.capacity ? (
                            <span className="text-xs px-2.5 py-1 rounded-lg border uppercase bg-green-50 text-green-600 border-green-100">
                              คัดเลือกครบแล้ว
                            </span>
                          ) : job.pendingCount > 0 ? (
                            <span className="text-xs px-2.5 py-1 rounded-lg border uppercase bg-purple-50 text-purple-600 border-purple-100">
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
                      color: "bg-yellow-50 text-yellow-600 border-yellow-100",
                    },
                    submitted: {
                      label: "ส่งงานแล้ว",
                      color: "bg-purple-50 text-purple-600 border-purple-100",
                    },
                    revision: {
                      label: "แก้ไขงาน",
                      color: "bg-orange-50 text-orange-600 border-orange-100",
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
                          <h3 className="font-black text-gray-900 leading-tight line-clamp-2">
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
                        {app.jobDeadline && (
                          <p className="text-xs text-gray-400">
                            กำหนดส่ง:{" "}
                            {new Date(app.jobDeadline).toLocaleDateString(
                              "th-TH"
                            )}
                          </p>
                        )}
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
                          <h3 className="font-black text-gray-900 leading-tight line-clamp-2">
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
                          {job.deliveryDate && (
                            <span className="text-xs text-gray-400">
                              กำหนดส่ง{" "}
                              {new Date(job.deliveryDate).toLocaleDateString(
                                "th-TH"
                              )}
                            </span>
                          )}
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
      {/* Row 3: งานที่เสร็จสิ้น */}
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
                renderItem={(app) => (
                  <div
                    key={app._id}
                    className="bg-white rounded-3xl border border-gray-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 overflow-hidden flex flex-col group"
                  >
                    <div className="p-6 flex-1 flex flex-col gap-3">
                      <div className="flex items-start justify-between gap-4">
                        <h3 className="font-black text-gray-900 leading-tight line-clamp-2">
                          {app.jobTitle}
                        </h3>
                        <span className="text-[10px] font-black px-2.5 py-1 rounded-lg border uppercase tracking-widest shrink-0 bg-green-50 text-green-600 border-green-100">
                          เสร็จสิ้น
                        </span>
                      </div>
                      {app.jobDeadline && (
                        <p className="text-xs text-gray-400">
                          กำหนดส่ง:{" "}
                          {new Date(app.jobDeadline).toLocaleDateString(
                            "th-TH"
                          )}
                        </p>
                      )}
                    </div>
                  </div>
                )}
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
                renderItem={(job) => (
                  <div
                    key={job._id}
                    className="bg-white rounded-3xl border border-gray-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 overflow-hidden flex flex-col"
                  >
                    <div className="p-6 flex-1 flex flex-col gap-3">
                      <div className="flex items-start justify-between gap-4">
                        <h3 className="font-black text-gray-900 leading-tight line-clamp-2">
                          {job.title}
                        </h3>
                        <span className="text-[10px] font-black px-2.5 py-1 rounded-lg border uppercase tracking-widest shrink-0 bg-green-50 text-green-600 border-green-100">
                          เสร็จสิ้น
                        </span>
                      </div>
                      <p className="text-xs text-gray-400">{job.category}</p>
                      <div className="flex items-center gap-1.5 mt-1">
                        {/* <div className="flex">
                    {job.workers.slice(0, 5).map((w, i) => (
                      <div
                        key={w._id}
                        title={w.applicantName}
                        className="w-6 h-6 rounded-full bg-gray-200 border-2 border-white overflow-hidden flex items-center justify-center text-[10px] font-medium text-gray-600 flex-shrink-0"
                        style={{ marginLeft: i > 0 ? "-6px" : "0", zIndex: 5 - i }}
                      >
                        {w.profileImageUrl ? (
                          <img src={w.profileImageUrl} alt={w.applicantName} className="w-full h-full object-cover" />
                        ) : (
                          w.applicantName?.charAt(0) || "?"
                        )}
                      </div>
                    ))}
                  </div> */}
                        {/* <span className="text-xs text-gray-500">{job.workers.length} คน</span> */}
                      </div>
                      <div className="flex items-center justify-between mt-auto pt-2">
                        <span className="text-xs text-gray-500">
                          {job.deliveryDate &&
                            new Date(job.deliveryDate).toLocaleDateString(
                              "th-TH"
                            )}
                        </span>
                        <Link
                          href={`/manage-projects/${job._id}/overview`}
                          className="text-xs text-primary-blue-500 font-medium hover:underline"
                        >
                          ดูรายละเอียด →
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
    </div>
  );
}
