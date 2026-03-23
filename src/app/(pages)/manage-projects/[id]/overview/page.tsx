// src/app/(pages)/manage-projects/[id]/overview/page.tsx
'use client';

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import axios from "axios";
import Link from "next/link";
import { ArrowLeft, Users, CalendarDays } from "lucide-react";
import Loading from "../../../../components/common/Loading";
import { Toaster } from "react-hot-toast";

interface Worker {
  _id: string;
  applicantName: string;
  profileImageUrl: string | null;
  status: string;
  progress: number;
}

interface JobOverview {
  _id: string;
  title: string;
  category: string;
  deliveryDate: string | null;
  jobStatus: string;
  capacity: number;
  workers: Worker[];
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

export default function JobOverviewPage() {
  const { id } = useParams();
  const jobId = Array.isArray(id) ? id[0] : id;
  const router = useRouter();
  const { data: session, status: authStatus } = useSession();

  const [job, setJob] = useState<JobOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (authStatus === "unauthenticated") router.push("/auth?state=login");
    if (authStatus === "authenticated" && session?.user?.role === "student") router.push("/");
  }, [authStatus, session]);

  useEffect(() => {
    if (authStatus === "authenticated" && jobId) fetchJobOverview();
  }, [authStatus, jobId]);

  const fetchJobOverview = async () => {
    setLoading(true);
    try {
      const res = await axios.get("/api/applications", {
        params: { role: "owner", phase: "inProgress" },
      });
      const jobs: JobOverview[] = res.data.jobs || [];
      const found = jobs.find((j) => j._id === jobId);
      if (!found) setError("ไม่พบข้อมูลงานนี้");
      else setJob(found);
    } catch {
      setError("ไม่สามารถโหลดข้อมูลได้ กรุณาลองใหม่");
    } finally {
      setLoading(false);
    }
  };

  if (loading) return (
    <div className="h-screen flex flex-col items-center justify-center gap-4">
      <Loading size="large" color="primary" />
      <p className="text-gray-500 text-sm">กำลังโหลดข้อมูล...</p>
    </div>
  );

  if (error || !job) return (
    <div className="max-w-xl mx-auto mt-20 p-8 bg-red-50 border border-red-200 rounded-2xl text-center">
      <p className="text-red-600 font-medium mb-4">{error || "ไม่พบข้อมูล"}</p>
      <Link href="/manage-projects" className="btn-secondary inline-block">กลับหน้าจัดการโปรเจกต์</Link>
    </div>
  );

  const badgeStyles: Record<string, { badge: string; bar: string }> = {
    red:    { badge: "bg-red-50 text-red-600 border-red-100",          bar: "#E24B4A" },
    orange: { badge: "bg-orange-50 text-orange-600 border-orange-100", bar: "#EF9F27" },
    blue:   { badge: "bg-blue-50 text-blue-600 border-blue-100",       bar: "#378ADD" },
    green:  { badge: "bg-green-50 text-green-600 border-green-100",    bar: "#639922" },
  };
  const currentStyle = badgeStyles[job.aggregateBadge.color] ?? badgeStyles.blue;

  const statusLabel: Record<string, { text: string; cls: string }> = {
    accepted:    { text: "รอเริ่มงาน",    cls: "bg-blue-100 text-blue-700"    },
    in_progress: { text: "กำลังทำงาน",   cls: "bg-yellow-100 text-yellow-700" },
    submitted:   { text: "ส่งงานแล้ว",   cls: "bg-purple-100 text-purple-700" },
    revision:    { text: "แก้ไขงาน",     cls: "bg-orange-100 text-orange-700" },
    completed:   { text: "เสร็จสมบูรณ์", cls: "bg-green-100 text-green-700"   },
  };

  const breakdownItems = [
    { count: job.statusCounts.submitted,      label: "รอตรวจ",  cls: "bg-red-50 text-red-700"       },
    { count: job.statusCounts.revision,       label: "แก้ไข",   cls: "bg-orange-50 text-orange-700" },
    { count: job.statusCounts.inProgress,     label: "กำลังทำ", cls: "bg-yellow-50 text-yellow-700" },
    { count: job.statusCounts.waitingToStart, label: "รอเริ่ม", cls: "bg-blue-50 text-blue-700"     },
    { count: job.statusCounts.completed,      label: "เสร็จ",   cls: "bg-green-50 text-green-700"   },
  ].filter((item) => item.count > 0);

  return (
    <div className="max-w-4xl mx-auto pb-16">
      <Toaster position="bottom-left" />

      <div className="mt-6 mb-6">
        <Link href="/manage-projects" className="text-primary-blue-500 hover:text-primary-blue-600 flex items-center gap-1 w-fit">
          <ArrowLeft size={18} /> กลับหน้าจัดการโปรเจกต์
        </Link>
      </div>

      {/* Header */}
      <section className="bg-primary-blue-500 rounded-2xl p-6 mb-6 text-white">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <p className="text-white/60 text-xs font-medium uppercase tracking-widest mb-1">ภาพรวมงาน</p>
            <h1 className="text-xl font-semibold leading-snug">{job.title}</h1>
            <p className="text-white/70 text-sm mt-1">{job.category}</p>
          </div>
          <span className={`text-[10px] font-black px-3 py-1.5 rounded-lg border uppercase tracking-widest shrink-0 ${currentStyle.badge}`}>
            {job.aggregateBadge.label}
          </span>
        </div>
        <div className="flex flex-wrap gap-4 mt-5 pt-4 border-t border-white/20">
          <div className="flex items-center gap-2 text-white/80 text-sm">
            <Users size={14} />
            <span>{job.workers.length}/{job.capacity} คน</span>
          </div>
          {job.deliveryDate && (
            <div className="flex items-center gap-2 text-white/80 text-sm">
              <CalendarDays size={14} />
              <span>ส่งงาน {new Date(job.deliveryDate).toLocaleDateString("th-TH", { day: "numeric", month: "short", year: "numeric" })}</span>
            </div>
          )}
        </div>
      </section>

      {/* Progress summary */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5 mb-6 shadow-sm">
        <div className="flex justify-between text-sm text-gray-600 mb-2">
          <span className="font-medium">ความคืบหน้าเฉลี่ย</span>
          <span className="font-bold text-gray-800">{job.avgProgress}%</span>
        </div>
        <div className="w-full bg-gray-100 rounded-full h-2.5 overflow-hidden">
          <div className="h-2.5 rounded-full transition-all duration-500" style={{ width: `${job.avgProgress}%`, background: currentStyle.bar }} />
        </div>
        {breakdownItems.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-4">
            {breakdownItems.map((item) => (
              <span key={item.label} className={`text-xs px-2.5 py-1 rounded-full font-medium ${item.cls}`}>
                {item.count} {item.label}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Workers list */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2 mb-4">
          <Users size={12} /> รายชื่อผู้ปฏิบัติงาน
        </p>
        <div className="flex flex-col gap-2">
          {job.workers.map((worker) => {
            const wStatus = statusLabel[worker.status] ?? statusLabel.in_progress;
            return (
              <div key={worker._id} className="flex items-center justify-between p-3 rounded-2xl bg-gray-50 border border-transparent hover:border-blue-200 hover:bg-blue-50 transition-all">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-full bg-white border border-gray-200 flex items-center justify-center text-primary-blue-500 font-bold text-sm shrink-0 overflow-hidden">
                    {worker.profileImageUrl
                      ? <img src={worker.profileImageUrl} alt={worker.applicantName} className="w-full h-full object-cover" />
                      : worker.applicantName?.charAt(0) || "?"}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-gray-800 truncate">{worker.applicantName}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <div className="w-20 bg-gray-200 h-1.5 rounded-full overflow-hidden">
                        <div className="bg-primary-blue-500 h-full rounded-full" style={{ width: `${worker.progress}%` }} />
                      </div>
                      <span className="text-[10px] font-bold text-gray-400">{worker.progress}%</span>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${wStatus.cls}`}>{wStatus.text}</span>
                    </div>
                  </div>
                </div>
                <Link
                  href={`/manage-projects/${jobId}/work/${worker._id}`}
                  className="ml-2 px-3 py-1.5 bg-white text-primary-blue-500 text-xs font-semibold rounded-lg border border-gray-200 shadow-sm hover:bg-primary-blue-500 hover:text-white hover:border-primary-blue-500 transition-all whitespace-nowrap"
                >
                  {worker.status === "submitted" ? "ตรวจงาน" : "จัดการงาน"}
                </Link>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}