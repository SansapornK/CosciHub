// src/app/(pages)/manage-projects/[id]/overview/page.tsx
"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import axios from "axios";
import Link from "next/link";
import {
  ArrowLeft,
  Users,
  CalendarDays,
  Star,
  CheckCircle,
} from "lucide-react";
import Loading from "../../../../components/common/Loading";
import { Toaster, toast } from "react-hot-toast";
import { motion, AnimatePresence } from "framer-motion";

interface Worker {
  _id: string;
  applicantName: string;
  profileImageUrl: string | null;
  status: string;
  progress: number;
  ownerReview?: { rating: number; comment: string };
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

  // --- States สำหรับ Review Modal ---
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [selectedWorker, setSelectedWorker] = useState<Worker | null>(null);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);

  useEffect(() => {
    if (authStatus === "unauthenticated") router.push("/auth?state=login");
    if (authStatus === "authenticated" && session?.user?.role === "student")
      router.push("/");
  }, [authStatus, session]);

  useEffect(() => {
    if (authStatus === "authenticated" && jobId) fetchJobOverview();
  }, [authStatus, jobId]);

  const fetchJobOverview = async () => {
    setLoading(true);
    try {
      const [activeRes, completedRes] = await Promise.all([
        axios.get("/api/applications", {
          params: { role: "owner", phase: "inProgress" },
        }),
        axios.get("/api/applications", {
          params: { role: "owner", phase: "completed" },
        }),
      ]);

      // รวมงานจากทั้ง 2 phase
      const allJobs: JobOverview[] = [
        ...(activeRes.data.jobs || []),
        ...(completedRes.data.jobs || []),
      ];

      const found = allJobs.find((j) => j._id === jobId);

      if (!found) {
        setError("ไม่พบข้อมูลงานนี้");
      } else {
        // 💡 จุดสำคัญ: ตรวจสอบข้อมูล workers อีกครั้ง
        // ตรวจสอบใน Console ดูว่า API ส่ง ownerReview มาใน Object worker หรือยัง
        console.log("Found Job Workers:", found.workers);
        setJob(found);
      }
    } catch (error) {
      console.error("Fetch Overview Error:", error);
      setError("ไม่สามารถโหลดข้อมูลได้ กรุณาลองใหม่");
    } finally {
      setLoading(false);
    }
  };

  // --- Functions Review ---
  const openReviewModal = (worker: Worker) => {
    setSelectedWorker(worker);
    setRating(5);
    setComment("");
    setIsReviewModalOpen(true);
  };

  const handleSubmitReview = async () => {
    if (!selectedWorker) return;
    try {
      setIsSubmittingReview(true);
      await axios.patch(`/api/applications/${selectedWorker._id}`, {
        action: "submitReview",
        role: "owner",
        rating,
        comment,
        isAnonymous: isAnonymous,
      });

      toast.success(
        `บันทึกรีวิวให้คุณ ${selectedWorker.applicantName} เรียบร้อยแล้ว!`,
      );
      setIsReviewModalOpen(false);
      fetchJobOverview(); 
    } catch (err: any) {
      toast.error(err.response?.data?.error || "เกิดข้อผิดพลาดในการส่งรีวิว");
    } finally {
      setIsSubmittingReview(false);
    }
  };

  if (loading)
    return (
      <div className="h-screen flex flex-col items-center justify-center gap-4">
        <Loading size="large" color="primary" />
        <p className="text-gray-500 text-sm">กำลังโหลดข้อมูล...</p>
      </div>
    );

  if (error || !job)
    return (
      <div className="max-w-xl mx-auto mt-20 p-8 bg-red-50 border border-red-200 rounded-2xl text-center">
        <p className="text-red-600 font-medium mb-4">
          {error || "ไม่พบข้อมูล"}
        </p>
        <Link href="/manage-projects" className="btn-secondary inline-block">
          กลับหน้าจัดการโปรเจกต์
        </Link>
      </div>
    );

  const statusLabel: Record<string, { text: string; cls: string }> = {
    accepted: { text: "รอเริ่มงาน", cls: "bg-blue-100 text-blue-700" },
    in_progress: { text: "กำลังทำงาน", cls: "bg-yellow-100 text-yellow-700" },
    submitted: { text: "รอตรวจ", cls: "bg-purple-100 text-purple-700" },
    revision: { text: "แก้ไขงาน", cls: "bg-orange-100 text-orange-700" },
    completed: { text: "เสร็จสมบูรณ์", cls: "bg-green-100 text-green-700" },
  };

  //   const breakdownItems = [
  //     { count: job.statusCounts.submitted,      label: "รอตรวจ",  cls: "bg-red-50 text-red-700"       },
  //     { count: job.statusCounts.revision,       label: "แก้ไข",   cls: "bg-orange-50 text-orange-700" },
  //     { count: job.statusCounts.inProgress,     label: "กำลังทำ", cls: "bg-yellow-50 text-yellow-700" },
  //     { count: job.statusCounts.waitingToStart, label: "รอเริ่ม", cls: "bg-blue-50 text-blue-700"     },
  //     { count: job.statusCounts.completed,      label: "เสร็จ",   cls: "bg-green-50 text-green-700"   },
  //   ].filter((item) => item.count > 0);

  return (
    <div className="flex flex-col gap-6 pb-10 max-w-6xl mx-auto w-full">
      <Toaster position="bottom-left" />

      <div className="mt-6 mb-1">
        <Link
          href="/manage-projects"
          className="text-primary-blue-500 hover:text-primary-blue-600 flex items-center gap-1 w-fit"
        >
          <ArrowLeft size={18} /> กลับหน้าจัดการโปรเจกต์
        </Link>
      </div>

      {/* Header */}
      <section className="bg-primary-blue-500 rounded-2xl p-6 text-white">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <p className="text-white/60 text-s font-medium uppercase tracking-wide mb-1">
              ภาพรวมงาน
            </p>
            <h1 className="text-xl font-semibold leading-snug">{job.title}</h1>
          </div>
          {/* {breakdownItems.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-4">
                {breakdownItems.map((item) => (
                <span key={item.label} className={`text-xs px-2.5 py-1 rounded-full font-medium ${item.cls}`}>
                    {item.count} {item.label}
                </span>
                ))}
            </div>
            )} */}
        </div>
        <div className="flex flex-wrap gap-4 mt-5 pt-4 border-t border-white/20">
          <div className="flex items-center gap-2 text-white/80 text-sm">
            <Users size={14} />
            <span>{job.workers.length} คน</span>
          </div>
          {job.deliveryDate && (
            <div className="flex items-center gap-2 text-white/80 text-sm">
              <CalendarDays size={14} />
              <span>
                ส่งงาน{" "}
                {new Date(job.deliveryDate).toLocaleDateString("th-TH", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                })}
              </span>
            </div>
          )}
          <div className="flex items-center gap-2 ml-auto">
            <span className="text-white/80 text-sm">ความคืบหน้าเฉลี่ย</span>
            <div className="flex items-center gap-2 flex-1 justify-end">
              <div className="w-24 bg-white/20 rounded-full h-2 overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{ width: `${job.avgProgress}%`, background: "white" }}
                />
              </div>
              <span className="text-white/80 text-sm">{job.avgProgress}%</span>
            </div>
          </div>
        </div>
      </section>

      {/* Workers list */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
        <p className="text-s font-black text-gray-500 uppercase tracking-wide flex items-center gap-2 mb-4">
          <Users size={14} /> รายชื่อผู้ปฏิบัติงาน
        </p>
        <div className="flex flex-col gap-2">
          {job.workers.map((worker) => {
            const wStatus =
              statusLabel[worker.status] ?? statusLabel.in_progress;
            const isDone = worker.status === "completed";
            return (
              <div
                key={worker._id}
                className="flex items-center justify-between p-3 rounded-2xl bg-gray-50 border border-transparent hover:border-blue-200 hover:bg-blue-50 transition-all"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-12 h-12 rounded-full bg-white border border-gray-200 flex items-center justify-center text-primary-blue-500 font-bold text-sm shrink-0 overflow-hidden">
                    {worker.profileImageUrl ? (
                      <img
                        src={worker.profileImageUrl}
                        alt={worker.applicantName}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      worker.applicantName?.charAt(0) || "?"
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="text-[17px] font-medium text-black truncate">
                      {worker.applicantName}
                    </p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <div className="w-20 bg-gray-200 h-1.5 rounded-full overflow-hidden">
                        <div
                          className="bg-primary-blue-500 h-full rounded-full"
                          style={{ width: `${worker.progress}%` }}
                        />
                      </div>
                      <span className="text-sm text-gray-400">
                        {worker.progress}%
                      </span>
                      <span
                        className={`text-sm px-2 py-0.5 rounded-full ${wStatus.cls}`}
                      >
                        {wStatus.text}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {isDone ? (
                    worker.ownerReview ? (
                      <div className="flex items-center gap-1.5 px-4 py-2 bg-green-50 text-green-600 rounded-xl border border-green-100 text-xs font-bold">
                        <CheckCircle size={14} /> รีวิวเรียบร้อย
                      </div>
                    ) : (
                      <button
                        onClick={() => openReviewModal(worker)}
                        className="flex items-center gap-1.5 px-4 py-2 bg-yellow-400 text-white rounded-xl font-bold text-xs hover:bg-yellow-500 shadow-lg shadow-yellow-100 transition-all active:scale-95"
                      >
                        <Star size={14} fill="currentColor" /> ให้คะแนนนิสิต
                      </button>
                    )
                  ) : null}

                  <Link
                    href={`/manage-projects/${jobId}/work/${worker._id}`}
                    className="ml-2 px-3 py-1.5 bg-white text-primary-blue-500 text-s rounded-lg border border-gray-200 shadow-sm hover:bg-primary-blue-500 hover:text-white hover:border-primary-blue-500 transition-all whitespace-nowrap"
                  >
                    ติดตามงาน
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      </div>
      {/* --- Review Modal (AnimatePresence) --- */}
      <AnimatePresence>
        {isReviewModalOpen && selectedWorker && (
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
                ให้คะแนนนิสิต
              </h3>
              <p className="text-xs text-gray-400 mb-8 font-medium">
                คุณกำลังรีวิว:{" "}
                <span className="text-blue-600 font-bold">
                  {selectedWorker.applicantName}
                </span>
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
                placeholder="เขียนความประทับใจที่มีต่อนิสิตคนนี้..."
                className="w-full p-5 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none text-sm mb-6 transition-all"
              />

              {/* Anonymous Toggle */}
              <div className="flex items-center justify-between px-5 py-4 bg-gray-50 rounded-2xl mb-8 border border-gray-100">
                <div className="text-left">
                  <p className="text-xs font-bold text-gray-700">
                    ส่งแบบไม่ระบุตัวตน
                  </p>
                  <p className="text-[10px] text-gray-400">
                    ชื่อของคุณจะไม่ปรากฏในหน้าโปรไฟล์ของนิสิต
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
    </div>
  );
}
