"use client";

import React, { useEffect, useState } from "react";
import axios from "axios";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import {
  BriefcaseBusiness,
  ChevronLeft,
  SquarePlus,
  Trash2,
  Pencil,
  Copy,
  XCircle,
} from "lucide-react";
import Loading from "@/app/components/common/Loading";
import JobCard from "@/app/components/cards/JobCard";
import {
  getCategoryIcon,
  calculateTimeAgo,
} from "@/app/components/utils/jobHelpers";
import { toast } from "react-hot-toast";
import ConfirmationModal from "@/app/components/modals/ConfirmationModal";

type JobStatus = "draft" | "published" | "in_progress" | "awaiting" | "completed" | "closed";
type ModalAction = "delete" | "close" | null;

interface JobItem {
  _id: string;
  title: string;
  shortDescription: string;
  budgetMin: number;
  budgetMax: number | null;
  category: string;
  postedDate: string;
  owner: string;
  status: JobStatus;
  capacity: number;
  applicationDeadline: string;
  assignedTo?: string[];
}

// Helper: ตรวจสอบว่างานหมดอายุหรือไม่
const isJobExpired = (deadline: string) => new Date(deadline) < new Date();

// Helper: ตรวจสอบว่าน่าจะลบงานได้หรือไม่ (client-side estimate)
// Note: Server จะเป็นคนตัดสินใจจริง โดยเช็คว่ามี active applications หรือไม่
const canDeleteJob = (job: JobItem) => {
  // draft และ completed ลบได้เสมอ
  if (job.status === "draft") return true;
  if (job.status === "completed") return true;

  // published ที่หมดอายุแล้ว หรือ closed → ให้ลองลบได้ (server จะเช็คอีกที)
  if (job.status === "published" && isJobExpired(job.applicationDeadline)) return true;
  if (job.status === "closed") return true;

  // in_progress หรือ awaiting → มีงานกำลังดำเนินการ ไม่ให้ลบ
  if (job.status === "in_progress" || job.status === "awaiting") return false;

  // published ที่ยังไม่หมดอายุ → ไม่ให้ลบ (ยังเปิดรับสมัครอยู่)
  return false;
};

export default function MyJobsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [jobs, setJobs] = useState<JobItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [modalAction, setModalAction] = useState<ModalAction>(null);
  const [selectedJob, setSelectedJob] = useState<JobItem | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // Guard: student ไม่มีสิทธิ์
  useEffect(() => {
    if (status === "authenticated" && session?.user?.role === "student") {
      router.push("/");
    }
  }, [status, session]);

  // Fetch งานของฉัน โดยกรองจาก owner = ชื่อผู้ใช้
  useEffect(() => {
    if (status !== "authenticated" || !session?.user?.name) return;

    const fetchMyJobs = async () => {
      setLoading(true);
      try {
        const res = await axios.get("/api/jobs", {
          params: {
            owner: session.user.name,
            limit: 50,
            includeDraft: true, // ✅ ดึง draft ด้วย
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

  // เปิด modal สำหรับลบงาน
  const openDeleteModal = (job: JobItem, canDelete: boolean) => {
    if (!canDelete) {
      toast.error("ไม่สามารถลบงานนี้ได้ เนื่องจากมีนิสิตกำลังดำเนินการอยู่งานนี้");
      return;
    }
    setSelectedJob(job);
    setModalAction("delete");
    setModalOpen(true);
  };

  // เปิด modal สำหรับปิดรับสมัคร
  const openCloseJobModal = (job: JobItem) => {
    setSelectedJob(job);
    setModalAction("close");
    setModalOpen(true);
  };

  // ปิด modal
  const closeModal = () => {
    setModalOpen(false);
    setSelectedJob(null);
    setModalAction(null);
  };

  // ยืนยันการกระทำใน modal
  const handleConfirmAction = async () => {
    if (!selectedJob) return;

    setIsProcessing(true);
    try {
      if (modalAction === "delete") {
        await axios.delete(`/api/jobs/${selectedJob._id}`);
        setJobs((prev) => prev.filter((j) => j._id !== selectedJob._id));
        toast.success("ลบประกาศงานสำเร็จ");
      } else if (modalAction === "close") {
        await axios.patch(`/api/jobs/${selectedJob._id}`, { ...selectedJob, status: "closed" });
        setJobs((prev) =>
          prev.map((j) => (j._id === selectedJob._id ? { ...j, status: "closed" as JobStatus } : j))
        );
        toast.success("ปิดรับสมัครสำเร็จ");
      }
      closeModal();
    } catch (err: any) {
      toast.error(err.response?.data?.error || "เกิดข้อผิดพลาด");
    } finally {
      setIsProcessing(false);
    }
  };

  // Duplicate งาน (ไปหน้า create พร้อม prefill ข้อมูล)
  const handleDuplicate = (id: string) => {
    router.push(`/manage-projects/create-jobs?duplicate=${id}`);
  };

  /* ---------- Status Badge ---------- */
  const StatusBadge = ({ status, isExpired }: { status: JobStatus; isExpired?: boolean }) => {
    const map: Record<string, { label: string; className: string }> = {
      draft:       { label: "ฉบับร่าง",      className: "bg-gray-100 text-gray-600" },
      published:   { label: "เปิดรับสมัคร",  className: "bg-green-100 text-green-700" },
      in_progress: { label: "กำลังดำเนินการ", className: "bg-blue-100 text-blue-600" },
      awaiting:    { label: "กำลังดำเนินการ", className: "bg-blue-100 text-blue-600" },
      completed:   { label: "งานเสร็จสิ้น",     className: "bg-emerald-100 text-emerald-700" },
      closed:      { label: "ปิดรับสมัคร",   className: "bg-red-100 text-red-600" },
    };

    // กรณี published แต่หมดอายุ
    if (status === "published" && isExpired) {
      return (
        <span className="text-xs font-semibold px-3 py-1 rounded-full bg-red-100 text-red-600">
          ปิดรับสมัคร
        </span>
      );
    }

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

      {/* Confirmation Modal */}
      <ConfirmationModal
        isOpen={modalOpen}
        title={
          modalAction === "delete"
            ? "ยืนยันการลบประกาศงาน"
            : "ยืนยันการปิดรับสมัคร"
        }
        message={
          modalAction === "delete"
            ? `ต้องการลบประกาศงาน "${selectedJob?.title}" ใช่หรือไม่? การดำเนินการนี้ไม่สามารถย้อนกลับได้`
            : `ต้องการปิดรับสมัครงาน "${selectedJob?.title}" ก่อนกำหนดใช่หรือไม่?`
        }
        confirmText={modalAction === "delete" ? "ลบประกาศงาน" : "ปิดรับสมัคร"}
        cancelText="ยกเลิก"
        variant={modalAction === "delete" ? "danger" : "danger"}
        onConfirm={handleConfirmAction}
        onClose={closeModal}
        isLoading={isProcessing}
      />

      <div className="max-w-6xl mx-auto p-4 md:p-7 pt-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-10 pb-4 border-b border-gray-100">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.back()}
              className="p-2.5 hover:bg-white rounded-full transition-all text-gray-400 hover:text-gray-600 shadow-sm"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-3">
              <BriefcaseBusiness
                className="w-8 h-8 text-gray-800"
                strokeWidth={1.5}
              />
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
        {error && <div className="text-center py-20 text-red-500">{error}</div>}

        {/* Empty State */}
        {!error && jobs.length === 0 && (
          <div className="flex flex-col items-center justify-center py-24 gap-5 text-center">
            <div className="w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center">
              <BriefcaseBusiness className="w-10 h-10 text-blue-300" />
            </div>
            <div>
              <p className="text-lg font-semibold text-gray-700">
                ยังไม่มีประกาศงาน
              </p>
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
              ทั้งหมด{" "}
              <span className="font-semibold text-gray-700">{jobs.length}</span>{" "}
              ประกาศ
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {jobs.map((job) => {
                const expired = isJobExpired(job.applicationDeadline);
                const canDelete = canDeleteJob(job);

                // กำหนด CTA รองตามสถานะ
                const showEdit = job.status === "draft" || (job.status === "published" && !expired);
                const showCloseJob = job.status === "published" && !expired;
                const showDuplicate =
                  (job.status === "published" && expired) ||
                  job.status === "in_progress" ||
                  job.status === "awaiting" ||
                  job.status === "completed" ||
                  job.status === "closed";

                return (
                  <div key={job._id} className="relative group">
                    {/* Status Badge */}
                    <div className="absolute top-3 left-3 z-10 flex items-center gap-2">
                      <StatusBadge status={job.status} isExpired={expired} />
                    </div>

                    {/* ปุ่มลบ (แสดงทุกงาน) */}
                    <button
                      onClick={() => openDeleteModal(job, canDelete)}
                      className="absolute top-3 right-3 z-10 p-1.5 rounded-lg bg-white/80 text-gray-400 hover:text-red-500 hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-all shadow-sm"
                      title="ลบประกาศงาน"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>

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
                        maxCompensation: job.budgetMax
                          ? job.budgetMax.toLocaleString()
                          : null,
                        currency: "บาท",
                        timeAgo: calculateTimeAgo(job.postedDate),
                        isVisible: true,
                      }}
                      actionButton={
                        <div className="flex gap-2 w-full">
                          {/* CTA หลัก: ดูรายละเอียดงาน */}
                          <Link href={`/find-job/${job._id}`} className="flex-grow">
                            <button className="bg-primary-blue-500 text-white text-base py-3 px-4 rounded-lg w-full hover:bg-primary-blue-600 transition-colors">
                              ดูรายละเอียดงาน
                            </button>
                          </Link>

                          {/* CTA รอง: แก้ไข */}
                          {showEdit && (
                            <Link href={`/manage-projects/edit-job/${job._id}`}>
                              <button
                                className="flex items-center gap-1.5 px-4 py-3 rounded-lg border-2 border-gray-200 text-gray-600 hover:border-blue-300 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                                title="แก้ไขประกาศงาน"
                              >
                                <Pencil className="w-4 h-5" />
                              </button>
                            </Link>
                          )}

                          {/* CTA รอง: ปิดรับสมัคร */}
                          {showCloseJob && (
                            <button
                              onClick={() => openCloseJobModal(job)}
                              className="flex items-center gap-1.5 px-4 py-3 rounded-lg border-2 border-gray-200 text-gray-600 hover:border-red-300 hover:text-red-600 hover:bg-red-50 transition-colors"
                              title="ปิดรับสมัคร"
                            >
                              <XCircle className="w-4 h-4" />
                            </button>
                          )}

                          {/* CTA รอง: Duplicate */}
                          {showDuplicate && (
                            <button
                              onClick={() => handleDuplicate(job._id)}
                              className="flex items-center gap-1.5 px-4 py-3 rounded-lg border-2 border-gray-200 text-gray-600 hover:border-blue-300 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                              title="ทำสำเนาประกาศงาน"
                            >
                              <Copy className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      }
                    />
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
