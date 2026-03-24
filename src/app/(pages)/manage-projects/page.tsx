// src/app/(pages)/manage-projects/page.tsx
'use client';

import React, { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import axios from "axios";
import Loading from "../../components/common/Loading";
import toast, { Toaster } from 'react-hot-toast';
import { usePusher } from "../../../providers/PusherProvider";
import Link from "next/link";
import { 
  Briefcase, 
  Clock, 
  CheckCircle, 
  LayoutDashboard, 
  Users, 
  ArrowRight 
} from "lucide-react";

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
  const [activeOwnerJobs, setActiveOwnerJobs]         = useState<ActiveOwnerJob[]>([]);
  const [page1, setPage1] = useState(0); // Row 1: งานที่สมัครไว้ / ผู้สมัครงาน
  const [page2, setPage2] = useState(0); // Row 2: งานที่กำลังทำอยู่ / งานที่กำลังดำเนินการ
  const ITEMS_PER_PAGE = 3;

  const { subscribeToProjectList } = usePusher();

  // ─── Effects ────────────────────────────────────────────────────────────────

  useEffect(() => {
    if (status === 'authenticated') {
      fetchJobApplications(); // ✅ เพิ่ม
    } else if (status === 'unauthenticated') {
      setJobAppLoading(false);
      setError("กรุณาเข้าสู่ระบบเพื่อจัดการโปรเจกต์");
    }
  }, [status]);

  useEffect(() => {
  if (status === 'authenticated' && session?.user?.id) {
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
      const isFreelancer = session?.user?.role === 'student';

      if (isFreelancer) {
        const res = await axios.get("/api/applications", { params: { role: "student" } });
        setJobApplications(res.data.applications || []);
      } else {
        const res = await axios.get("/api/applications", { params: { role: "owner" } });
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
        {status === 'unauthenticated' && (
          <button
            onClick={() => window.location.href = '/auth?state=login'}
            className="mt-4 px-4 py-2 bg-primary-blue-500 text-white rounded-lg hover:bg-primary-blue-600"
          >
            เข้าสู่ระบบ
          </button>
        )}
      </div>
    );
  }

    // Helper component — วางก่อน return(...)
  const PaginatedGrid = ({ items, page, setPage, renderItem }) => {
    const total = items.length;
    const totalPages = Math.ceil(total / ITEMS_PER_PAGE);
    const paginated = items.slice(page * ITEMS_PER_PAGE, (page + 1) * ITEMS_PER_PAGE);

    return (
      <div>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {paginated.map(renderItem)}
        </div>

        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-3 mt-6">
            <button
              onClick={() => setPage(p => Math.max(0, p - 1))}
              disabled={page === 0}
              className="p-2 rounded-full border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="15 18 9 12 15 6"/>
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
              onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
              disabled={page === totalPages - 1}
              className="p-2 rounded-full border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="9 18 15 12 9 6"/>
              </svg>
            </button>
          </div>
        )}
      </div>
    );
  };

  const isFreelancer = session?.user?.role === 'student';

  // Status badge config สำหรับ job application
  const appStatusConfig: Record<string, { label: string; className: string }> = {
    pending:  { label: "รอการพิจารณา",     className: "bg-yellow-100 text-yellow-700" },
    accepted: { label: "ผ่านการคัดเลือก",  className: "bg-green-100  text-green-700"  },
    rejected: { label: "ไม่ผ่านการคัดเลือก", className: "bg-red-100  text-red-600"    },
  };

  return (
    <div className="flex flex-col gap-6 pb-10 max-w-7xl mx-auto w-full">
      <Toaster position="bottom-left" />

      {/* ── Header ── */}
      {/* <section className="mt-6 p-6 flex flex-col gap-2 bg-primary-blue-500 rounded-xl">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="font-medium text-xl text-white">จัดการโปรเจกต์</h1>
            <p className="text-white">
              จัดการทุกขั้นตอนในทุกโปรเจกต์ของคุณตั้งแต่รับงานจนถึงเสร็จงาน
            </p>
          </div>
          <Link href="/manage-projects/all-projects" className="btn-secondary flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
              <line x1="3" y1="9" x2="21" y2="9"></line>
              <line x1="9" y1="21" x2="9" y2="9"></line>
            </svg>
            ดูโปรเจกต์ทั้งหมด
          </Link>
        </div>
      </section> */}


      {/* ── Row 4: ✅ Job Applications Section ── */}
      <div className="w-full">
        {isFreelancer ? (
      // ── ฝั่งนิสิต: งานที่สมัครไว้ ──────────────────────────────────────
      <div className="bg-gray-50/50 rounded-[2.5rem] p-8 border border-gray-100">
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-xl font-black text-gray-900 flex items-center gap-3">
            <div className="p-2.5 bg-indigo-500 rounded-xl text-white shadow-lg shadow-indigo-100">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            งานพิเศษที่สมัครไว้ ({jobApplications.filter(a => a.status === "pending" || a.status === "rejected" || a.status === "accepted").length})
          </h2>
        </div>

        {jobAppLoading ? (
          <div className="flex justify-center py-6"><Loading size="small" color="primary" /></div>
        ) : jobApplications.length === 0 ? (
          <div className="bg-white rounded-[2rem] p-12 text-center border border-dashed border-gray-200">
            <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-300">
              <Briefcase size={32} />
            </div>
            <p className="font-bold text-gray-400">คุณยังไม่ได้สมัครงานพิเศษใดๆ</p>
            <Link href="/find-job" className="text-primary-blue-500 text-sm hover:underline mt-2 inline-block">
              ค้นหางานพิเศษ →
            </Link>
          </div>
        ) : (
        <PaginatedGrid
          items={jobApplications.filter(a => a.status === "pending" || a.status === "rejected" || a.status === "accepted")}
          page={page1}
          setPage={setPage1}
          renderItem={(app) => {
            const s = appStatusConfig[app.status] ?? appStatusConfig.pending;
            return (
              <div key={app._id} className="bg-white rounded-3xl border border-gray-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 overflow-hidden flex flex-col group">
                <div className="p-6 flex-1 flex flex-col gap-3">
                  {/* Title + badge */}
                  <div className="flex items-start justify-between gap-4">
                    <h3 className="font-black text-gray-900 leading-tight line-clamp-2">{app.jobTitle}</h3>
                    <span className={`text-xs px-2.5 py-1 rounded-lg uppercase shrink-0 ${s.className}`}>
                      {s.label}
                    </span>
                  </div>

                  {/* Budget + Date */}
                  <div className="flex items-center justify-between mt-auto pt-2">
                    <p className="text-xs text-gray-500">
                      {app.jobBudgetMin.toLocaleString()}
                      {app.jobBudgetMax ? ` – ${app.jobBudgetMax.toLocaleString()}` : ""} บาท
                    </p>
                    <p className="text-xs text-gray-400">
                      สมัครเมื่อ {new Date(app.appliedDate).toLocaleDateString("th-TH")}
                    </p>
                  </div>

                  {/* ปุ่ม */}
                  {app.status === "accepted" ? (
                    <button
                      onClick={async (e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        try {
                          await axios.patch(`/api/applications/${app._id}`, {
                            action: "updateProgress",
                            progress: 0,
                          });
                          toast.success("เริ่มงานแล้ว!");
                          await fetchJobApplications();
                        } catch (err: any) {
                          toast.error(err.response?.data?.error || "เกิดข้อผิดพลาด");
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
        <div className="bg-gray-50/50 rounded-[2.5rem] p-8 border border-gray-100">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-xl font-black text-gray-900 flex items-center gap-3">
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
              <p className="font-bold text-gray-400">ยังไม่มีนิสิตสมัครงานพิเศษของคุณ</p>
            </div>
          ) : (
          <PaginatedGrid
            items={ownerJobs}
            page={page1}
            setPage={setPage1}
            renderItem={(job) => (
              <div key={job._id} className="bg-white rounded-3xl border border-gray-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 overflow-hidden flex flex-col group">
                <div className="p-6 flex-1 flex flex-col gap-3">
                  {/* Title + badge */}
                  <div className="flex items-start justify-between gap-4">
                    <h3 className="font-black text-gray-900 leading-tight line-clamp-2">{job.title}</h3>
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
                      ผู้สมัครทั้งหมด {job.totalCount} คน · รับแล้ว {job.acceptedCount}/{job.capacity}
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
      {/* ── Row 5: กำลังดำเนินการ ── */}
        <div className="w-full">
          {isFreelancer ? (
          // ── ฝั่งนิสิต ──────────────────────────────────────────────────────────
          <div className="bg-gray-50/50 rounded-[2.5rem] p-8 border border-gray-100">
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-xl font-black text-gray-900 flex items-center gap-3">
                <div className="p-2.5 bg-blue-600 rounded-xl text-white shadow-lg shadow-blue-100">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
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
                <p className="font-bold text-gray-400">ยังไม่มีงานที่กำลังดำเนินการ</p>
              </div>
            ) : (
              <PaginatedGrid
                items={activeApplications}
                page={page2}
                setPage={setPage2}
                renderItem={(app) => {
                  const statusConfig: Record<string, { label: string; color: string }> = {
                    in_progress: { label: "กำลังทำงาน", color: "bg-yellow-50 text-yellow-600 border-yellow-100" },
                    submitted:   { label: "ส่งงานแล้ว", color: "bg-purple-50 text-purple-600 border-purple-100" },
                    revision:    { label: "แก้ไขงาน",   color: "bg-orange-50 text-orange-600 border-orange-100" },
                  };
                  const s = statusConfig[app.status] ?? statusConfig.in_progress;
                  return (
                    <div key={app._id} className="bg-white rounded-3xl border border-gray-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 overflow-hidden flex flex-col group">
                      <div className="p-6 flex-1 flex flex-col gap-3">
                        <div className="flex items-start justify-between gap-4">
                          <h3 className="font-black text-gray-900 leading-tight line-clamp-2">{app.jobTitle}</h3>
                          <span className={`text-xs px-2.5 py-1 rounded-lg border uppercase shrink-0 ${s.color}`}>
                            {s.label}
                          </span>
                        </div>
                        <div>
                          <div className="flex justify-between text-xs text-gray-500 mb-1.5">
                            <span>ความคืบหน้า</span>
                            <span className="font-medium text-gray-700">{app.progress}%</span>
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
                            กำหนดส่ง: {new Date(app.jobDeadline).toLocaleDateString("th-TH")}
                          </p>
                        )}
                        <Link
                          href={`/manage-projects/${app.jobId}/work/${app._id}`}
                          className="btn-primary block text-sm text-center py-2 rounded-full w-full mt-auto"
                        >
                          {app.status === "submitted" ? "ดูรายละเอียดงาน" : "ส่งงาน →"}
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
            <div className="bg-gray-50/50 rounded-[2.5rem] p-8 border border-gray-100">
              <div className="flex justify-between items-center mb-8">
                <h2 className="text-xl font-black text-gray-900 flex items-center gap-3">
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
                  <p className="font-bold text-gray-400">ยังไม่มีงานที่กำลังดำเนินการในขณะนี้</p>
                </div>
              ) : (
                <PaginatedGrid
                  items={activeOwnerJobs}
                  page={page2}
                  setPage={setPage2}
                  renderItem={(job) => {
                    const badgeStyles: Record<string, string> = {
                      red:    "bg-red-50 text-red-600 border-red-100",
                      orange: "bg-orange-50 text-orange-600 border-orange-100",
                      blue:   "bg-blue-50 text-blue-600 border-blue-100",
                      green:  "bg-green-50 text-green-600 border-green-100",
                    };
                    const currentStyle = badgeStyles[job.aggregateBadge.color] || badgeStyles.blue;
                    const breakdownItems = [
                      { count: job.statusCounts.submitted,      label: "รอตรวจ",  cls: "bg-red-50 text-red-700"       },
                      { count: job.statusCounts.revision,       label: "แก้ไข",   cls: "bg-orange-50 text-orange-700" },
                      { count: job.statusCounts.inProgress,     label: "กำลังทำ", cls: "bg-yellow-50 text-yellow-700" },
                      { count: job.statusCounts.waitingToStart, label: "รอเริ่ม", cls: "bg-blue-50 text-blue-700"     },
                      { count: job.statusCounts.completed,      label: "เสร็จ",   cls: "bg-green-50 text-green-700"   },
                    ].filter((item) => item.count > 0);
                    return (
                      <div key={job._id} className="bg-white rounded-3xl border border-gray-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 overflow-hidden flex flex-col group">
                        <div className="p-6 flex-1">
                          <div className="flex justify-between items-start gap-4 mb-5">
                            <h3 className="font-black text-gray-900 leading-tight line-clamp-2">{job.title}</h3>
                            <span className={`text-xs px-2.5 py-1 rounded-lg border uppercase shrink-0 ${currentStyle}`}>
                              {job.aggregateBadge.label}
                            </span>
                          </div>
                          <div className="flex justify-between text-xs text-gray-500 mb-2">
                            <span>ความคืบหน้าเฉลี่ย</span>
                            <span className="font-medium text-gray-700">{job.avgProgress}%</span>
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
                                    style={{ marginLeft: i > 0 ? "-6px" : "0", zIndex: 5 - i }}
                                  >
                                    {w.profileImageUrl ? (
                                      <img src={w.profileImageUrl} alt={w.applicantName} className="w-full h-full object-cover" />
                                    ) : (
                                      w.applicantName?.charAt(0) || "?"
                                    )}
                                  </div>
                                ))}
                              </div>
                              <span className="text-xs text-gray-500">{job.workers.length} คน</span>
                            </div>
                            {job.deliveryDate && (
                              <span className="text-xs text-gray-400">
                                กำหนดส่ง {new Date(job.deliveryDate).toLocaleDateString("th-TH")}
                              </span>
                            )}
                          </div>
                          {breakdownItems.length > 0 && (
                            <div className="flex flex-wrap gap-1 pt-2 border-t border-gray-100">
                              {breakdownItems.map((item) => (
                                <span key={item.label} className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${item.cls}`}>
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
    </div>
  );
}