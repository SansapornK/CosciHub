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

type JobStatus =
  | "draft"
  | "published"
  | "in_progress"
  | "awaiting"
  | "completed"
  | "closed";
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
// หมดอายุหลังเที่ยงคืนของวันปิดรับสมัคร (ไม่ใช่ทันทีที่เข้าสู่วันนั้น)
const isJobExpired = (deadline: string) => {
  const deadlineDate = new Date(deadline);
  deadlineDate.setHours(23, 59, 59, 999);
  return deadlineDate < new Date();
};

// Helper: ตรวจสอบว่าน่าจะลบงานได้หรือไม่ และ return เหตุผลถ้าลบไม่ได้
// Note: Server จะเป็นคนตัดสินใจจริง โดยเช็คว่ามี active applications หรือไม่
const getDeleteStatus = (job: JobItem): { canDelete: boolean; reason?: string } => {
  // draft และ completed ลบได้เสมอ
  if (job.status === "draft") return { canDelete: true };
  if (job.status === "completed") return { canDelete: true };

  // in_progress หรือ awaiting หรือมีคนทำงานอยู่ → ไม่ให้ลบ
  if (job.status === "in_progress" || job.status === "awaiting" || (job.assignedTo && job.assignedTo.length > 0)) {
    return { canDelete: false, reason: "ไม่สามารถลบงานนี้ได้ เนื่องจากมีนิสิตกำลังดำเนินการอยู่" };
  }

  // published ที่ยังไม่หมดอายุ → ไม่ให้ลบ (ต้องปิดรับสมัครก่อน)
  if (job.status === "published" && !isJobExpired(job.applicationDeadline)) {
    return { canDelete: false, reason: "งานยังเผยแพร่อยู่ หากต้องการลบงานกรุณาปิดรับสมัครก่อน" };
  }

  // published ที่หมดอายุแล้ว หรือ closed → ลบได้
  return { canDelete: true };
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

  // Filter สถานะงาน
  const [statusFilter, setStatusFilter] = useState<
    "all" | "draft" | "published" | "in_progress" | "completed" | "closed"
  >("all");

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

  // เปิด modal สำหรับลบงาน
  const openDeleteModal = (job: JobItem) => {
    const { canDelete, reason } = getDeleteStatus(job);
    if (!canDelete) {
      toast.error(reason);
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
        await axios.patch(`/api/jobs/${selectedJob._id}`, {
          ...selectedJob,
          status: "closed",
        });
        setJobs((prev) =>
          prev.map((j) =>
            j._id === selectedJob._id
              ? { ...j, status: "closed" as JobStatus }
              : j,
          ),
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
  const StatusBadge = ({
    status,
    isExpired,
  }: {
    status: JobStatus;
    isExpired?: boolean;
  }) => {
    const map: Record<string, { label: string; className: string }> = {
      draft: { label: "ฉบับร่าง", className: "bg-gray-100 text-gray-600" },
      published: {
        label: "เปิดรับสมัคร",
        className: "bg-green-100 text-green-700",
      },
      in_progress: {
        label: "กำลังดำเนินการ",
        className: "bg-blue-100 text-blue-600",
      },
      awaiting: {
        label: "กำลังดำเนินการ",
        className: "bg-blue-100 text-blue-600",
      },
      completed: {
        label: "งานเสร็จสิ้น",
        className: "bg-emerald-100 text-emerald-700",
      },
      closed: { label: "ปิดรับสมัคร", className: "bg-red-100 text-red-600" },
    };

    // กรณี published แต่หมดอายุ
    if (status === "published" && isExpired) {
      return (
        <span className="text-xs font-semibold px-3 py-1 rounded-full bg-red-100 text-red-600">
          ปิดรับสมัคร
        </span>
      );
    }

    const s = map[status] ?? {
      label: status,
      className: "bg-gray-100 text-gray-600",
    };
    return (
      <span
        className={`text-xs font-semibold px-3 py-1 rounded-full ${s.className}`}
      >
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
        <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-100">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.back()}
              className="p-2.5 hover:bg-white rounded-full transition-all text-gray-400 hover:text-gray-600 shadow-sm"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-3">
              <div>
                <h1 className="text-2xl font-extrabold text-[#0C5BEA] tracking-tight">
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
          </div>
        )}

        {/* Job Grid */}
        {jobs.length > 0 && (
          <>
            {/* Filter Buttons */}
            {(() => {
              const draftCount = jobs.filter((j) => j.status === "draft").length;
              const publishedCount = jobs.filter(
                (j) => j.status === "published" && !isJobExpired(j.applicationDeadline)
              ).length;
              const inProgressCount = jobs.filter(
                (j) => j.status === "in_progress" || j.status === "awaiting"
              ).length;
              const completedCount = jobs.filter((j) => j.status === "completed").length;
              const closedCount = jobs.filter(
                (j) =>
                  j.status === "closed" ||
                  (j.status === "published" && isJobExpired(j.applicationDeadline))
              ).length;

              const filters = [
                { key: "all", label: `ทั้งหมด (${jobs.length})` },
                { key: "draft", label: `ฉบับร่าง (${draftCount})` },
                { key: "published", label: `เปิดรับสมัคร (${publishedCount})` },
                { key: "in_progress", label: `กำลังดำเนินการ (${inProgressCount})` },
                { key: "completed", label: `เสร็จสิ้น (${completedCount})` },
                { key: "closed", label: `ปิดรับสมัคร (${closedCount})` },
              ] as const;

              return (
                <div className="flex gap-2 flex-wrap mb-6">
                  {filters.map((item) => (
                    <button
                      key={item.key}
                      onClick={() => setStatusFilter(item.key)}
                      className={`text-xs px-3 py-1.5 rounded-full border transition-all ${
                        statusFilter === item.key
                          ? "bg-primary-blue-400 text-white border-primary-blue-400"
                          : "bg-white text-primary-blue-400 border-primary-blue-400 hover:bg-primary-blue-50"
                      }`}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              );
            })()}

            {/* Filtered Jobs */}
            {(() => {
              const filteredJobs = jobs.filter((job) => {
                const expired = isJobExpired(job.applicationDeadline);

                if (statusFilter === "all") return true;
                if (statusFilter === "draft") return job.status === "draft";
                if (statusFilter === "published")
                  return job.status === "published" && !expired;
                if (statusFilter === "in_progress")
                  return job.status === "in_progress" || job.status === "awaiting";
                if (statusFilter === "completed") return job.status === "completed";
                if (statusFilter === "closed")
                  return (
                    job.status === "closed" ||
                    (job.status === "published" && expired)
                  );
                return true;
              });

              const filterLabels = {
                all: "ทั้งหมด",
                draft: "ฉบับร่าง",
                published: "เปิดรับสมัคร",
                in_progress: "กำลังดำเนินการ",
                completed: "เสร็จสิ้น",
                closed: "ปิดรับสมัคร",
              };

              if (filteredJobs.length === 0) {
                return (
                  <div className="flex flex-col items-center justify-center py-16 gap-4 text-center bg-gray-50 border border-dashed border-gray-200 rounded-xl">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center">
                      <BriefcaseBusiness className="w-8 h-8 text-gray-300" />
                    </div>
                    <div>
                      <p className="text-gray-500">
                        ไม่พบประกาศงานในสถานะ &ldquo;{filterLabels[statusFilter]}&rdquo;
                      </p>
                      <button
                        onClick={() => setStatusFilter("all")}
                        className="text-primary-blue-500 text-sm hover:underline mt-2 inline-block"
                      >
                        ดูประกาศงานทั้งหมด →
                      </button>
                    </div>
                  </div>
                );
              }

              return (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                  {filteredJobs.map((job) => {
                const expired = isJobExpired(job.applicationDeadline);

                // กำหนด CTA รองตามสถานะ
                const showEdit =
                  job.status === "draft" ||
                  (job.status === "published" && !expired);
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
                      onClick={() => openDeleteModal(job)}
                      className="absolute top-3 right-3 z-10 p-1.5 rounded-lg bg-white/80 text-gray-400 hover:text-red-500 hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-all shadow-sm"
                      title="ลบประกาศงาน"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>

                    <JobCard
                      // fromPageName="งานของฉัน"
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
                          <Link
                            href={`/find-job/${job._id}?fromName=${encodeURIComponent("งานของฉัน")}`}
                            className="flex-grow"
                          >
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
              );
            })()}
          </>
        )}
      </div>
    </div>
  );
}
