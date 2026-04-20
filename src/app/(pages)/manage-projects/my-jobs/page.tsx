'use client';

import React, { useEffect, useState } from "react";
import axios from "axios";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { BriefcaseBusiness, ChevronLeft, SquarePlus, Trash2, Clock, Users, CalendarDays, Pencil } from "lucide-react";
import Loading from "@/app/components/common/Loading";
import JobCard from "@/app/components/cards/JobCard";
import { getCategoryIcon, calculateTimeAgo } from "@/app/components/utils/jobHelpers";
import { toast, Toaster } from "react-hot-toast";

interface JobItem {
  _id: string;
  title: string;
  shortDescription: string;
  budgetMin: number;
  budgetMax: number | null;
  category: string;
  postedDate: string;
  owner: string;
  status: string;
  capacity: number;
  applicationDeadline: string;
}

export default function MyJobsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [jobs, setJobs]       = useState<JobItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState("");

  // Guard: student ไม่มีสิทธิ์
  useEffect(() => {
    if (status === "authenticated" && session?.user?.role === "student") {
      router.push("/");
    }
  }, [status, session]);

  // Fetch งานของฉัน โดยกรองจาก owner = ชื่อผู้ใช้
  useEffect(() => {
    if (status !== "authenticated" || !session?.user) return;

    const fetchMyJobs = async () => {
      setLoading(true);
      try {
        const res = await axios.get("/api/jobs", {
            params: { 
                ownerId: (session.user as any).id || (session.user as any)._id, 
                limit: 50,
                includeDraft: true, 
            },
        });
        setJobs(res.data.jobs);
      } catch {
        setError("ไม่สามารถโหลดข้อมูลงานได้");
      } finally {
        setLoading(false);
      }
    };

    fetchMyJobs();
  }, [status, session]);

  const handleDelete = async (id: string) => {
    if (!confirm("ยืนยันการลบประกาศงานนี้?")) return;
    try {
      await axios.delete(`/api/jobs/${id}`);
      setJobs((prev) => prev.filter((j) => j._id !== id));
      toast.success("ลบประกาศงานสำเร็จ");
    } catch {
      toast.error("ไม่สามารถลบงานได้");
    }
  };

  /* ---------- Status Badge ---------- */
  const StatusBadge = ({ status }: { status: string }) => {
    const map: Record<string, { label: string; className: string }> = {
      published: { label: "เปิดรับสมัคร", className: "bg-green-100 text-green-700" },
      draft:     { label: "ฉบับร่าง",     className: "bg-gray-100 text-gray-600"  },
      closed:    { label: "ปิดรับสมัคร",  className: "bg-red-100 text-red-600"    },
    };
    const s = map[status] ?? { label: status, className: "bg-gray-100 text-gray-600" };
    return (
      <span className={`text-xs font-semibold px-3 py-1 rounded-full ${s.className}`}>
        {s.label}
      </span>
    );
  };

  /* ---------- Render ---------- */
  if (status === "loading" || loading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <Loading />
      </div>
    );
  }

  return (
    <div className="bg-gray-50/50 min-h-screen">
      <Toaster position="top-center" />

      <div className="max-w-6xl mx-auto p-4 md:p-7 pt-6">

        {/* Header */}
        <div className="flex items-center justify-between mb-10 pb-4 border-b border-gray-100">
          <div className="flex items-center gap-4">
            <Link
              href="/manage-projects"
              className="p-2.5 hover:bg-white rounded-full transition-all text-gray-400 hover:text-gray-600 shadow-sm"
            >
              <ChevronLeft className="w-5 h-5" />
            </Link>
            <div className="flex items-center gap-3">
              <BriefcaseBusiness className="w-8 h-8 text-gray-800" strokeWidth={1.5} />
              <div>
                <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">
                  งานของฉัน
                </h1>
                <p className="text-sm text-gray-400 mt-0.5">
                  ประกาศงานทั้งหมดที่คุณลงไว้
                </p>
              </div>
            </div>
          </div>

          {/* ปุ่มลงประกาศงานใหม่ */}
          <Link
            href="/manage-projects/create-jobs"
            className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-full transition-all shadow-md shadow-blue-100"
          >
            <SquarePlus className="w-4 h-4" />
            ลงประกาศงานใหม่
          </Link>
        </div>

        {/* Error */}
        {error && (
          <div className="text-center py-20 text-red-500">{error}</div>
        )}

        {/* Empty State */}
        {!error && jobs.length === 0 && (
          <div className="flex flex-col items-center justify-center py-24 gap-5 text-center">
            <div className="w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center">
              <BriefcaseBusiness className="w-10 h-10 text-blue-300" />
            </div>
            <div>
              <p className="text-lg font-semibold text-gray-700">ยังไม่มีประกาศงาน</p>
              <p className="text-sm text-gray-400 mt-1">
                เริ่มลงประกาศงานแรกของคุณได้เลย
              </p>
            </div>
            <Link
              href="/manage-projects/create-jobs"
              className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-2xl transition-all"
            >
              <SquarePlus className="w-5 h-5" />
              ลงประกาศงาน
            </Link>
          </div>
        )}

        {/* Job Grid */}
        {jobs.length > 0 && (
          <>
            <p className="text-sm text-gray-400 mb-6">
              ทั้งหมด <span className="font-semibold text-gray-700">{jobs.length}</span> ประกาศ
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {jobs.map((job) => (
                <div key={job._id} className="relative group">

                  {/* Status + Delete overlay */}
                  <div className="absolute top-3 left-3 z-10 flex items-center gap-2">
                    <StatusBadge status={job.status} />
                  </div>
                  <button
                    onClick={() => handleDelete(job._id)}
                    className="absolute top-3 right-3 z-10 p-1.5 rounded-lg bg-white/80 text-gray-400 hover:text-red-500 hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-all shadow-sm"
                    title="ลบประกาศงาน"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>

                  {/* JobCard เดิม + เพิ่มปุ่มแก้ไขงาน */}
<JobCard
  isLoggedIn={true}
  data={{
    id: job._id,
    icon: getCategoryIcon(job.category),
    title: job.title,
    type: job.category,
    postedBy: job.owner,
    details: job.shortDescription,
    minCompensation: job.budgetMin.toLocaleString(),
    maxCompensation: job.budgetMax ? job.budgetMax.toLocaleString() : null,
    currency: "บาท",
    timeAgo: calculateTimeAgo(job.postedDate),
    isVisible: true,
  }}
  actionButton={
    <div className="flex gap-2 w-full">
      {/* ปุ่มดูรายละเอียดงาน */}
      <Link href={`/find-job/${job._id}`} className="flex-grow">
        <button className="bg-primary-blue-500 text-white text-base py-3 px-4 rounded-lg w-full hover:bg-primary-blue-600 transition-colors">
          ดูรายละเอียดงาน
        </button>
      </Link>

      {/* ปุ่มแก้ไข */}
      <Link href={`/manage-projects/edit-job/${job._id}`}>
        <button
          className="flex items-center gap-1.5 px-4 py-3 rounded-lg border-2 border-gray-200 text-gray-600 hover:border-blue-300 hover:text-blue-600 hover:bg-blue-50 transition-colors"
          title="แก้ไขประกาศงาน"
        >
          <Pencil className="w-4 h-4" />
          แก้ไข
        </button>
      </Link>
    </div>
  }
/>
                </div>
              ))}
            </div>
          </>
        )}

      </div>
    </div>
  );
}