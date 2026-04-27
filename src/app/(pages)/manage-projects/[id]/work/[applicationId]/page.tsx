// src/app/(pages)/manage-projects/[id]/work/[applicationId]/page.tsx

"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  Send,
  CheckCircle2,
  AlertCircle,
  Clock,
  FileText,
  ExternalLink,
  MessageSquare,
  Briefcase,
  History,
  Info,
  MapPin,
  X,
  Pencil,
  ChartPie,
  Trash,
  Wallet,
} from "lucide-react";
import toast from "react-hot-toast";

import Loading from "../../../../../components/common/Loading";

// ─── Interfaces ───────────────────────────────────────────────────────────────
interface IProgressLog {
  progress: number;
  note?: string | null;
  createdAt: string;
}

interface ApplicationDetail {
  _id: string;
  jobId: {
    _id: string;
    title: string;
    description: string;
    category: string;
    budgetMin: number;
    budgetMax: number;
    deadline: string;
    jobType: string;
    location: string;
    owner: string;
    ownerId: string;
    ownerImage: string | null;
    deliveryDate: string;
  };
  applicantId: {
    _id: string;
    name: string;
    email: string;
    profileImageUrl: string | null;
  };
  status: "accepted" | "in_progress" | "submitted" | "revision" | "completed";
  progress: number;
  progressNote?: string | null;
  progressLogs?: IProgressLog[];
  workLink?: string;
  feedback?: string;
  updatedAt: string;
  attachments?: { fileName: string; fileUrl: string; fileSize: number }[];
}

export default function WorkManagementPage() {
  const params = useParams();
  const applicationId = params?.applicationId;
  const { data: session, status: authStatus } = useSession();
  const router = useRouter();

  const [workData, setWorkData] = useState<ApplicationDetail | null>(null);
  const [loading, setLoading] = useState(true);

  const [newProgress, setNewProgress] = useState(0);
  const [progressNote, setProgressNote] = useState("");
  const [workLink, setWorkLink] = useState("");
  // const [studentNote, setStudentNote] = useState("");
  const [ownerFeedback, setOwnerFeedback] = useState("");

  const [isEditingSubmission, setIsEditingSubmission] = useState(false);
  const [isEditingProgress, setIsEditingProgress] = useState(false);
  const [confirmCancel, setConfirmCancel] = useState(false);

  const isFreelancer = session?.user?.role === "student";
  // const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [linkError, setLinkError] = useState("");
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);

  const [existingFiles, setExistingFiles] = useState<
    { fileName: string; fileUrl: string; fileSize: number }[]
  >([]);

  useEffect(() => {
    if (authStatus === "authenticated" && applicationId) {
      fetchWorkDetail();
    }
  }, [authStatus, applicationId]);

  const fetchWorkDetail = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`/api/applications/${applicationId}`);
      const data = res.data.application;

      setWorkData(data);
      if (data) {
        setNewProgress(data.progress || 0);
        setWorkLink(data.workLink || "");
        setOwnerFeedback(data.feedback || "");
        setExistingFiles(data.attachments || []);
        setIsEditingProgress(false); // ← reset mode หลัง fetch
        setProgressNote("");
      }
    } catch (err) {
      toast.error("ไม่สามารถโหลดข้อมูลการทำงานได้");
    } finally {
      setLoading(false);
    }
  };

  const [uploadProgress, setUploadProgress] = useState<Record<string, number>>(
    {},
  );

  const hasProgressChanges =
    newProgress !== (workData?.progress || 0) || progressNote.trim() !== "";

  const isValidUrl = (url: string) => {
    if (!url) return true; // ถ้าไม่กรอกก็ผ่าน (optional field)
    try {
      const parsed = new URL(url);
      return ["http:", "https:"].includes(parsed.protocol);
    } catch {
      return false;
    }
  };

  const handleUpdateWork = async (
    action: "updateProgress" | "submit" | "approve" | "requestRevision",
  ) => {
    try {
      const payload: any = { action };

      const readFileAsBase64 = (file: File): Promise<string> => {
        return new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });
      };

      // ✅ แก้ตรงนี้ — ส่งแค่ payload ไป API ไม่ต้องเรียก Mongoose โดยตรง
      if (action === "updateProgress") {
        payload.progress = newProgress;
        payload.progressNote = progressNote.trim() || null;
      }

      if (action === "submit") {
        const isOnlineJob =
          workData.jobId?.jobType?.toLowerCase().trim().includes("ออนไลน์") ||
          workData.jobId?.jobType?.toLowerCase().trim().includes("online");

        if (isOnlineJob && !workLink.trim() && selectedFiles.length === 0) {
          toast.error("กรุณาแนบลิงก์งานหรือไฟล์อย่างน้อย 1 ช่องทาง");
          return;
        }

        if (existingFiles.length + selectedFiles.length > 3) {
          toast.error("จำนวนไฟล์รวมต้องไม่เกิน 3 ไฟล์");
          return;
        }

        const duplicateFile = selectedFiles.find((newFile) =>
          existingFiles.some((oldFile) => oldFile.fileName === newFile.name),
        );
        if (duplicateFile) {
          toast.error(
            `ไฟล์ "${duplicateFile.name}" มีอยู่ในระบบแล้ว ไม่ต้องอัปโหลดซ้ำ`,
          );
          return;
        }

        const MAX_FILE_SIZE = 10 * 1024 * 1024;
        const oversizedFile = selectedFiles.find(
          (file) => file.size > MAX_FILE_SIZE,
        );
        if (oversizedFile) {
          toast.error(`ไฟล์ "${oversizedFile.name}" ใหญ่เกิน 10MB`);
          return;
        }

        setLoading(true);
        const uploadToast = toast.loading("กำลังอัปโหลดไฟล์...");
        setUploadProgress({});

        try {
          const uploadedAttachments = await Promise.all(
            selectedFiles.map(async (file) => {
              const base64 = await readFileAsBase64(file);
              const res = await axios.post(
                "/api/upload",
                {
                  fileStr: base64,
                  fileName: file.name,
                  jobId: workData.jobId._id,
                },
                {
                  onUploadProgress: (progressEvent) => {
                    const percentCompleted = Math.round(
                      (progressEvent.loaded * 100) / (progressEvent.total || 1),
                    );
                    setUploadProgress((prev) => ({
                      ...prev,
                      [file.name]: percentCompleted,
                    }));
                  },
                },
              );
              return {
                fileName: file.name,
                fileUrl: res.data.url,
                fileSize: file.size,
              };
            }),
          );

          payload.workLink = workLink;
          payload.attachments = [...existingFiles, ...uploadedAttachments];
          toast.dismiss(uploadToast);
        } catch (uploadError) {
          toast.dismiss(uploadToast);
          toast.error("อัปโหลดไฟล์ล้มเหลว กรุณาลองใหม่อีกครั้ง");
          setLoading(false);
          return;
        }
      }

      if (action === "approve" || action === "requestRevision") {
        payload.feedback = ownerFeedback;
      }

      await axios.patch(`/api/applications/${applicationId}`, payload);

      toast.success(
        action === "submit" ? "ส่งงานเรียบร้อยแล้ว!" : "บันทึกข้อมูลสำเร็จ",
      );
      setIsEditingSubmission(false);
      setSelectedFiles([]);
      setUploadProgress({});
      if (action === "updateProgress") setProgressNote(""); // ✅ reset โน้ตหลังบันทึก
      fetchWorkDetail();
    } catch (err: any) {
      toast.error(err.response?.data?.error || "เกิดข้อผิดพลาด");
    } finally {
      setLoading(false);
    }
  };

  // Loading State
  if (loading)
    return (
      <div className="h-screen flex items-center justify-center bg-gray-50">
        <Loading />
      </div>
    );

  // Error Guard Clause
  if (!workData) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 text-center px-6">
        <div className="p-8 bg-white rounded-[2.5rem] shadow-sm max-w-sm border border-gray-100">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-gray-800">ไม่พบข้อมูลงาน</h3>
          <p className="text-sm text-gray-500 mt-2 mb-6">
            ขออภัย ไม่พบรายละเอียดของโปรเจกต์นี้ในระบบ
          </p>
          <button
            onClick={() => router.push("/manage-projects")}
            className="w-full py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-all"
          >
            กลับสู่หน้าหลัก
          </button>
        </div>
      </div>
    );
  }

  const statusLabel: Record<string, { text: string; class: string }> = {
    accepted: { text: "รอเริ่มงาน", class: "bg-blue-100 text-blue-700" },
    in_progress: {
      text: "กำลังทำงาน",
      class: "bg-yellow-50 text-yellow-600 border-yellow-100",
    },
    submitted: {
      text: "ส่งงานแล้ว",
      class: "bg-purple-50 text-purple-600 border-purple-100",
    },
    revision: {
      text: "แก้ไขงาน",
      class: "bg-orange-50 text-orange-600 border-orange-100",
    },
    completed: { text: "เสร็จสมบูรณ์", class: "bg-green-100 text-green-700" },
  };

  const currentStatus = statusLabel[workData.status] || statusLabel.in_progress;

  const confetti = [...Array(12)];

  return (
    <div className="min-h-screen bg-gray-50/30 pb-20 selection:bg-blue-100 selection:text-blue-600">
      {/* ── Header Area ── */}
      <motion.section
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white border-b border-gray-100 pt-12 pb-8 px-6 md:px-12 sticky top-0 z-30 backdrop-blur-md bg-white/80"
      >
        <div className="max-w-6xl mx-auto">
          <button
            onClick={() => router.back()}
            className="group flex items-center gap-2 text-gray-400 hover:text-blue-600 transition-all mb-6 text-sm font-bold"
          >
            <ArrowLeft
              size={18}
              className="group-hover:-translate-x-1 transition-transform"
            />
            ย้อนกลับ
          </button>

          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <div className="flex-1">
              <motion.h1
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
                className="text-3xl md:text-4xl font-black text-gray-900 mb-4 tracking-tight"
              >
                {workData.jobId?.title}
              </motion.h1>
              <div className="flex flex-wrap items-center gap-3">
                {/* <span className="bg-gray-900 text-white text-[10px] font-black px-3 py-1.5 rounded-lg uppercase tracking-widest shadow-lg shadow-gray-200">
                  {workData.jobId?.category || "ทั่วไป"}
                </span> */}
                <span className="bg-gray-100 text-gray-600 text-[12px] px-2.5 py-1 font-medium rounded-full uppercase">
                  {workData.jobId?.category || "ทั่วไป"}
                </span>

                {/* <span className={`text-[10px] font-black px-3 py-1.5 rounded-lg uppercase tracking-widest border-2 ${statusLabel[workData.status]?.class.replace('bg-', 'border-').replace('text-', 'text-')}`}>
                  {statusLabel[workData.status]?.text}
                </span> */}
              </div>
            </div>

            <Link
              href={`/account/${isFreelancer ? workData.jobId?.ownerId : workData.applicantId?._id}`}
              target="_blank"
              className="block w-full md:w-auto"
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                whileHover={{ y: -2 }}
                whileTap={{ scale: 0.98 }}
                className="bg-white p-3 md:p-4 rounded-[1.5rem] border border-gray-100 shadow-sm flex items-center gap-3 md:gap-4 transition-all hover:border-blue-200 hover:shadow-md group"
              >
                {/* Avatar */}
                {(() => {
                  const imgSrc = isFreelancer
                    ? workData.jobId?.ownerImage
                    : workData.applicantId?.profileImageUrl;

                  const fallbackName = isFreelancer
                    ? workData.jobId?.owner
                    : workData.applicantId?.name;

                  return imgSrc ? (
                    <img
                      src={imgSrc}
                      alt={fallbackName}
                      className="w-10 h-10 md:w-12 md:h-12 rounded-full object-cover shrink-0 ring-2 ring-gray-50 group-hover:ring-blue-100 transition-all"
                    />
                  ) : (
                    <div className="w-10 h-10 md:w-12 md:h-12 bg-blue-50 rounded-full flex items-center justify-center text-blue-600 font-black text-lg md:text-xl shrink-0 group-hover:bg-blue-100 transition-colors">
                      {fallbackName?.[0]?.toUpperCase()}
                    </div>
                  );
                })()}

                <div className="min-w-0 flex-1 md:flex-none">
                  <p className="text-[10px] md:text-[12px] text-gray-400 font-medium mb-0.5">
                    {isFreelancer ? "ผู้ว่าจ้าง" : "นิสิตผู้ปฏิบัติงาน"}
                  </p>
                  <span className="text-xs md:text-sm font-black text-gray-800 truncate max-w-[150px] md:max-w-none group-hover:text-[#0C5BEA] transition-colors block">
                    {isFreelancer
                      ? workData.jobId?.owner
                      : workData.applicantId?.name}
                  </span>
                </div>

                <ExternalLink
                  size={14}
                  className="text-gray-300 group-hover:text-blue-500 transition-colors ml-auto md:ml-2"
                />
              </motion.div>
            </Link>
          </div>
        </div>
      </motion.section>

      <main className="max-w-6xl mx-auto p-6 md:p-12 grid grid-cols-1 lg:grid-cols-3 gap-10">
        {/* ── Left Column ── */}
        <div className="lg:col-span-2 space-y-10">
          <section className="bg-white rounded-[2.5rem] p-8 md:p-10 shadow-sm border border-gray-100 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-50/50 rounded-full -mr-16 -mt-16 blur-3xl pointer-events-none" />
            <div className="relative z-10">
              <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-black text-gray-900 flex items-center gap-3">
                    <div className="p-2.5 bg-blue-50 rounded-xl text-[#0A5BE9] shadow-sm">
                      <FileText size={22} />
                    </div>
                    รายละเอียดงาน
                  </h2>
                </div>

                <div className="p-3">
                  <p className="text-[#707070] text-sm md:text-base whitespace-pre-wrap">
                    {workData.jobId?.description || "ไม่มีรายละเอียดเพิ่มเติม"}
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* ── Progress Tracker Card ── */}
          <section className="bg-white rounded-3xl overflow-hidden shadow-sm border border-gray-100">
            {/* Header */}
            <div className="flex justify-between items-center px-8 pt-8 pb-5">
              <h2 className="text-xl font-black text-gray-900 flex items-center gap-2">
                <div className="p-2 rounded-xl text-[#0A5BE9]">
                  <Clock size={20} />
                </div>
                ความคืบหน้างาน
              </h2>

              <div className="relative inline-block">
                <motion.span
                  key={newProgress}
                  animate={{ scale: newProgress === 100 ? [1, 1.15, 1] : 1 }}
                  className="text-4xl font-black tabular-nums block relative z-10"
                  style={{ color: newProgress === 100 ? "#16a34a" : "#2563eb" }}
                >
                  {newProgress}
                  <span className="text-lg font-black text-gray-300 ml-0.5">
                    %
                  </span>
                </motion.span>

                <AnimatePresence>
                  {newProgress === 100 && (
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-0">
                      {confetti.map((_, i) => (
                        <motion.div
                          key={i}
                          initial={{ scale: 0, x: 0, y: 0, opacity: 1 }}
                          animate={{
                            scale: [0, 1, 0],
                            x: Math.cos(i * 30 * (Math.PI / 180)) * 60,
                            y: Math.sin(i * 30 * (Math.PI / 180)) * 60,
                            opacity: [1, 1, 0],
                          }}
                          transition={{ duration: 0.9, ease: "easeOut" }}
                          className="absolute w-2 h-2 bg-green-500 rounded-full left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
                        />
                      ))}
                    </div>
                  )}
                </AnimatePresence>
              </div>
            </div>

            {!isEditingProgress ? (
              <div className="relative h-2 bg-gray-100 mx-8 rounded-full overflow-hidden mb-6">
                <motion.div
                  className="absolute inset-y-0 left-0 rounded-full"
                  style={{
                    background:
                      newProgress === 100
                        ? "linear-gradient(90deg, #16a34a, #4ade80)"
                        : "linear-gradient(90deg, #2563eb, #60a5fa)",
                  }}
                  animate={{ width: `${newProgress}%` }}
                  transition={{ type: "spring", stiffness: 300, damping: 35 }}
                />
              </div>
            ) : (
              // Edit mode: slider แทน bar
              <div className="mx-8 mb-4 space-y-2">
                <div className="relative h-2.5 flex items-center">
                  <motion.div
                    className="absolute inset-y-0 left-0 rounded-full"
                    style={{
                      background:
                        newProgress === 100
                          ? "linear-gradient(90deg, #16a34a, #4ade80)"
                          : "linear-gradient(90deg, #2563eb, #60a5fa)",
                    }}
                    animate={{ width: `${newProgress}%` }}
                    transition={{ type: "spring", stiffness: 400, damping: 40 }}
                  />
                  <input
                    type="range"
                    min="0"
                    max="100"
                    step="25"
                    value={newProgress}
                    onChange={(e) => {
                      const val = parseInt(e.target.value);
                      if (val >= (workData?.progress || 0)) setNewProgress(val);
                      else
                        toast.error("ไม่สามารถลดความคืบหน้างานลงได้", {
                          id: "progress-error",
                        });
                    }}
                    className="absolute inset-0 w-full opacity-0 cursor-pointer z-10 h-full"
                  />
                  <motion.div
                    className="absolute top-1/2 -translate-y-1/2 w-5 h-5 bg-white border-[4px] border-blue-600 rounded-full shadow-lg pointer-events-none"
                    animate={{ left: `calc(${newProgress}% - 10px)` }}
                    transition={{ type: "spring", stiffness: 400, damping: 40 }}
                  />
                </div>
                <div className="flex justify-between text-[10px] font-medium text-gray-300 px-0.5">
                  {[0, 25, 50, 75, 100].map((v) => (
                    <span
                      key={v}
                      className={newProgress >= v ? "text-blue-500" : ""}
                    >
                      {v}%
                    </span>
                  ))}
                </div>
              </div>
            )}

            {isFreelancer && workData.status !== "completed" && (
              <div className="px-8 pb-8 space-y-4">
                {/* Read mode content */}
                {!isEditingProgress && (
                  <>
                    {workData.progressNote && (
                      <div className="flex gap-3 p-4 rounded-2xl bg-gray-50 border border-gray-100">
                        <div className="w-1 self-stretch bg-blue-500 rounded-full shrink-0" />
                        <div className="flex-1 min-w-0 overflow-hidden">
                          <p className="text-[12px] font-black text-blue-500 uppercase mb-1">
                            รายละเอียดการอัปเดตล่าสุด
                          </p>
                          <p className="text-sm text-gray-700 font-medium leading-relaxed break-words whitespace-pre-wrap">
                            {workData.progressNote}
                          </p>
                        </div>
                      </div>
                    )}

                    {workData.progressLogs &&
                      workData.progressLogs.length > 1 && (
                        <details className="group">
                          <summary className="cursor-pointer flex items-center gap-2 text-[11px] font-black text-gray-400 select-none list-none py-1">
                            <History size={12} />
                            ประวัติการอัปเดต ({
                              workData.progressLogs.length
                            }{" "}
                            ครั้ง)
                          </summary>
                          <div className="mt-3 space-y-2 max-h-52 overflow-y-auto">
                            {[...workData.progressLogs]
                              .reverse()
                              .map((log, idx) => (
                                <div
                                  key={idx}
                                  className="flex items-start gap-3 py-3 border-b border-gray-50 last:border-0"
                                >
                                  <span className="text-[11px] font-black text-blue-600 bg-blue-50 px-2 py-1 rounded-lg shrink-0 tabular-nums">
                                    {log.progress}%
                                  </span>
                                  <div className="flex-1 min-w-0 overflow-hidden">
                                    <p className="text-xs text-gray-600 break-words whitespace-pre-wrap leading-relaxed">
                                      {log.note || (
                                        <span className="text-gray-300 italic">
                                          ไม่มีรายละเอียดเพิ่มเติม
                                        </span>
                                      )}
                                    </p>
                                    <p className="text-[10px] text-gray-300 mt-0.5">
                                      {new Date(
                                        log.createdAt,
                                      ).toLocaleDateString("th-TH", {
                                        day: "2-digit",
                                        month: "short",
                                        year: "2-digit",
                                        hour: "2-digit",
                                        minute: "2-digit",
                                      })}
                                    </p>
                                  </div>
                                </div>
                              ))}
                          </div>
                        </details>
                      )}

                    <button
                      onClick={() => setIsEditingProgress(true)}
                      className="w-full py-3 bg-gray-50 border border-gray-200 text-gray-500 font-medium rounded-2xl hover:border-blue-400 hover:text-blue-600 hover:bg-blue-50 transition-all flex items-center justify-center gap-2 text-sm"
                    >
                      <Pencil size={15} />
                      อัปเดตความคืบหน้า
                    </button>
                  </>
                )}

                {/* Edit mode content — ไม่มี slider แล้ว อยู่ข้างบนแล้ว */}
                {isEditingProgress && (
                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-5"
                  >
                    {/* Edit header */}
                    <div className="flex items-center justify-between">
                      <span className="inline-flex items-center gap-2 text-[11px] font-black text-blue-600 bg-blue-50 px-3 py-1.5 rounded-xl">
                        <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse shrink-0" />
                        เลื่อนเพื่ออัปเดตสถานะ
                      </span>
                      <div className="flex items-center gap-2">
                        {!confirmCancel ? (
                          <button
                            onClick={() => {
                              if (hasProgressChanges) setConfirmCancel(true);
                              else setIsEditingProgress(false);
                            }}
                            className="flex items-center gap-1 text-[11px] font-black text-gray-400 hover:text-red-500 transition-colors px-3 py-1.5"
                          >
                            <X size={10} /> ยกเลิก
                          </button>
                        ) : (
                          <div className="flex items-center gap-2 animate-in fade-in slide-in-from-right-1 duration-300">
                            {/* ปุ่มยืนยันการละทิ้ง */}
                            <button
                              onClick={() => {
                                setIsEditingProgress(false);
                                setNewProgress(workData?.progress || 0);
                                setProgressNote("");
                                setConfirmCancel(false);
                              }}
                              className="inline-flex items-center gap-1.5 text-[11px] font-black text-white bg-red-500 px-4 py-1.5 rounded-xl hover:bg-red-600 transition-all active:scale-95 shadow-sm shadow-red-100"
                            >
                              <Trash size={13} />
                              ละทิ้ง
                            </button>

                            {/* ปุ่มย้อนกลับ (กากบาท) */}
                            <button
                              onClick={() => setConfirmCancel(false)}
                              className="p-1.5 text-gray-400 hover:text-gray-600 bg-gray-100 rounded-xl transition-all active:scale-90"
                              title="กลับไปแก้ไข"
                            >
                              <X size={14} />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Note */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <label className="text-[11px] font-black text-gray-400 flex items-center gap-1.5">
                          <MessageSquare size={11} /> รายละเอียดการอัปเดต
                        </label>
                        <span className="text-[10px] font-black text-gray-300 tabular-nums">
                          {progressNote.length}/200
                        </span>
                      </div>
                      <textarea
                        rows={3}
                        placeholder="สถานะงานปัจจุบัน เช่น ทำส่วน UI เสร็จแล้ว กำลังต่อ API..."
                        value={progressNote}
                        onChange={(e) => setProgressNote(e.target.value)}
                        maxLength={200}
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl text-sm text-gray-700 placeholder-gray-300 resize-none outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
                      />
                    </div>

                    {/* Save */}
                    <button
                      onClick={() => handleUpdateWork("updateProgress")}
                      className="w-full py-4 bg-blue-600 text-white font-black rounded-2xl shadow-lg shadow-blue-200 
                  hover:bg-blue-700 transition-all active:scale-[0.98] flex items-center justify-center gap-2 text-sm uppercase tracking-wider"
                    >
                      <CheckCircle2 size={16} />
                      บันทึกความคืบหน้า {newProgress}%
                    </button>
                  </motion.div>
                )}
              </div>
            )}
          </section>

          {/* ── Submission Form ── */}
          <section className="bg-white rounded-[2rem] p-8 shadow-sm border border-gray-100 text-left">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
              <div className="flex items-center gap-2">
                <div className="p-2.5  rounded-xl text-purple-600">
                  <FileText size={20} />
                </div>
                <h2 className="text-xl font-black text-gray-900 tracking-tight">
                  รายละเอียดการส่งงาน
                </h2>
              </div>

              <div className="flex items-center flex-wrap gap-2 sm:justify-end">
                <div className="flex gap-2">
                  {workData.jobId?.jobType
                    ?.toLowerCase()
                    .trim()
                    .includes("ออนไลน์") ||
                  workData.jobId?.jobType
                    ?.toLowerCase()
                    .trim()
                    .includes("online") ? (
                    <span className="text-[12px] font-medium bg-red-500 text-white px-2.5 py-1 rounded-lg border border-gray-100 ">
                      จำเป็น
                    </span>
                  ) : (
                    <span className="text-[12px] font-medium bg-gray-50 text-gray-400/80 px-2 py-1 rounded-md border border-gray-100 align-middle">
                      ถ้ามี
                    </span>
                  )}
                  <span className="text-[12px] font-medium bg-gray-50 text-gray-500 px-2.5 py-1 rounded-lg border border-gray-200 ">
                    สูงสุด 10MB
                  </span>
                </div>

                {/* ปุ่มแก้ไข */}
                {isFreelancer &&
                  workData.status === "submitted" &&
                  !isEditingSubmission && (
                    <button
                      onClick={() => setIsEditingSubmission(true)}
                      className="group flex items-center gap-2 bg-blue-50 text-blue-600 px-3 py-1.5 rounded-xl border border-blue-100 transition-all hover:bg-blue-600 hover:text-white active:scale-95 shadow-sm"
                    >
                      <Pencil size={14} />
                      <span className="text-[10px] font-black uppercase hidden xs:block">
                        แก้ไขงาน
                      </span>
                    </button>
                  )}

                {isEditingSubmission && (
                  <button
                    onClick={() => setIsEditingSubmission(false)}
                    className="group flex items-center gap-1.5 px-3 py-1.5 text-gray-400 hover:text-red-500 transition-all active:scale-95"
                  >
                    <X
                      size={14}
                      className="group-hover:rotate-90 transition-transform"
                    />
                    <span className="text-[10px] font-black">ยกเลิก</span>
                  </button>
                )}
              </div>
            </div>

            {isFreelancer &&
            (["in_progress", "revision", "accepted"].includes(
              workData.status,
            ) ||
              isEditingSubmission) ? (
              <div className="space-y-6">
                {/* Option 1: แนบลิงก์ */}
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">
                    1. แนบลิงก์ผลงาน (Drive, Figma, Github)
                    {workData.jobId?.jobType
                      ?.toLowerCase()
                      .trim()
                      .includes("ออนไลน์") && (
                      <span className="text-red-500 ml-1">*</span>
                    )}
                  </label>
                  <div className="relative group">
                    <input
                      type="url"
                      placeholder="https://..."
                      className={`w-full p-4 bg-gray-50 border rounded-2xl focus:ring-2 outline-none transition-all pl-12
    ${
      linkError
        ? "border-red-300 focus:ring-red-500 bg-red-50/30"
        : "border-gray-100 focus:ring-blue-500"
    }`}
                      value={workLink}
                      onChange={(e) => {
                        const val = e.target.value;
                        setWorkLink(val);
                        if (val && !isValidUrl(val)) {
                          setLinkError(
                            "กรุณาใส่ลิงก์ที่ถูกต้อง เช่น https://drive.google.com/...",
                          );
                        } else {
                          setLinkError("");
                        }
                      }}
                    />
                    {linkError && (
                      <p className="mt-1.5 text-xs text-red-500 font-medium flex items-center gap-1 pl-1">
                        <AlertCircle size={12} /> {linkError}
                      </p>
                    )}
                    <ExternalLink
                      className="absolute left-4 top-4 text-gray-300 group-focus-within:text-blue-500 transition-colors"
                      size={20}
                    />
                  </div>
                </div>

                <div className="relative flex py-2 items-center">
                  <div className="flex-grow border-t border-gray-100"></div>
                  <span className="flex-shrink mx-4 text-xs font-bold text-gray-300 uppercase">
                    หรือ
                  </span>
                  <div className="flex-grow border-t border-gray-100"></div>
                </div>

                {/* Option 2: แนบไฟล์ (แทนที่ก้อนเดิมในโค้ดคุณ) */}
                <div className="space-y-4">
                  {/* <label className="block text-sm font-bold text-gray-700 mb-2">2. อัปโหลดไฟล์งาน (PDF, ZIP, JPG)</label> */}
                  <label className="block text-sm font-bold text-gray-700 mb-2">
                    ไฟล์งานของคุณ
                  </label>

                  {/* ส่วนที่ 1: แสดงไฟล์เดิมจาก Database */}
                  <AnimatePresence>
                    {existingFiles.length > 0 && (
                      <div className="space-y-2 mb-4">
                        <p className="text-[10px] font-black text-gray-400">
                          ไฟล์ที่ส่งแล้ว
                        </p>
                        {existingFiles.map((file, idx) => (
                          <motion.div
                            key={`existing-${idx}`}
                            className="p-3 bg-blue-50/50 border border-blue-100 rounded-xl flex items-center justify-between"
                          >
                            <div className="flex items-center gap-3 overflow-hidden">
                              <FileText
                                className="text-blue-500 shrink-0"
                                size={18}
                              />
                              <div className="truncate">
                                <p className="text-xs font-bold text-blue-700 truncate">
                                  {file.fileName}
                                </p>
                                <p className="text-[10px] text-blue-400">
                                  {(file.fileSize / (1024 * 1024)).toFixed(2)}{" "}
                                  MB
                                </p>
                              </div>
                            </div>
                            <button
                              onClick={() =>
                                setExistingFiles((prev) =>
                                  prev.filter((_, i) => i !== idx),
                                )
                              }
                              className="p-1.5 text-blue-300 hover:text-red-500 transition-colors"
                            >
                              <X size={16} />
                            </button>
                          </motion.div>
                        ))}
                      </div>
                    )}
                  </AnimatePresence>
                  <div
                    className={`relative border-2 border-dashed rounded-2xl p-6 transition-all text-center
                    ${selectedFiles.length > 0 ? "border-blue-500 bg-blue-50/30" : "border-gray-200 hover:border-blue-300"}`}
                  >
                    <input
                      id="file-upload"
                      type="file"
                      multiple
                      disabled={
                        loading ||
                        existingFiles.length + selectedFiles.length >= 3
                      }
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10 disabled:cursor-not-allowed"
                      onChange={(e) => {
                        const files = Array.from(e.target.files || []);
                        const MAX_SIZE = 10 * 1024 * 1024; // 10MB

                        const currentTotal =
                          existingFiles.length + selectedFiles.length;
                        if (currentTotal + files.length > 3) {
                          toast.error(
                            "คุณสามารถอัปโหลดไฟล์ได้สูงสุด 3 ไฟล์เท่านั้น",
                          );
                          e.target.value = "";
                          return;
                        }

                        const validFiles = files.filter((file) => {
                          if (file.size > MAX_SIZE) {
                            toast.error(`ไฟล์ ${file.name} ใหญ่เกิน 10MB`);
                            return false;
                          }
                          return true;
                        });

                        setSelectedFiles((prev) => [...prev, ...validFiles]);
                        e.target.value = "";
                      }}
                    />
                    <div className="flex flex-col items-center gap-2">
                      <div
                        className={`p-3 rounded-full ${existingFiles.length + selectedFiles.length >= 3 ? "bg-gray-50 text-gray-300" : "bg-gray-100 text-gray-400"}`}
                      >
                        <Send size={24} />
                      </div>
                      <p className="text-sm font-medium text-gray-500">
                        {existingFiles.length + selectedFiles.length >= 3
                          ? "คุณอัปโหลดไฟล์ครบจำนวนจำกัดแล้ว (3 ไฟล์)"
                          : "คลิกเพื่อเพิ่มไฟล์งาน"}
                      </p>
                      <p className="text-[10px] text-gray-400 uppercase font-bold tracking-tighter">
                        {existingFiles.length + selectedFiles.length} / 3 ไฟล์
                      </p>
                    </div>
                  </div>

                  <AnimatePresence>
                    {selectedFiles.length > 0 && (
                      <motion.div layout className="space-y-2">
                        {selectedFiles.map((file, idx) => (
                          <motion.div
                            key={`${file.name}-${idx}`}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="p-4 bg-white border border-gray-100 rounded-2xl shadow-sm"
                          >
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center gap-3 overflow-hidden">
                                <FileText
                                  className="text-blue-500 shrink-0"
                                  size={18}
                                />
                                <div className="truncate">
                                  <p className="text-xs font-bold text-gray-700 truncate">
                                    {file.name}
                                  </p>
                                  <p className="text-[10px] text-gray-400">
                                    {(file.size / (1024 * 1024)).toFixed(2)} MB
                                  </p>
                                </div>
                              </div>
                              {!loading && (
                                <button
                                  onClick={() =>
                                    setSelectedFiles((prev) =>
                                      prev.filter((_, i) => i !== idx),
                                    )
                                  }
                                  className="p-1 hover:bg-red-50 text-red-500 rounded-full transition-colors"
                                >
                                  <X size={16} />
                                </button>
                              )}
                            </div>

                            {/* Progress Bar */}
                            {loading &&
                              uploadProgress[file.name] !== undefined && (
                                <div className="space-y-1">
                                  <div className="flex justify-between text-[10px] font-black text-blue-600 uppercase">
                                    <span>
                                      {uploadProgress[file.name] === 100
                                        ? "เสร็จสมบูรณ์"
                                        : "กำลังอัปโหลด..."}
                                    </span>
                                    <span>{uploadProgress[file.name]}%</span>
                                  </div>
                                  <div className="w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
                                    <motion.div
                                      initial={{ width: 0 }}
                                      animate={{
                                        width: `${uploadProgress[file.name]}%`,
                                      }}
                                      className="h-full bg-blue-600 rounded-full"
                                    />
                                  </div>
                                </div>
                              )}
                          </motion.div>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                <button
                  onClick={() => {
                    if (workLink && !isValidUrl(workLink)) {
                      setLinkError(
                        "กรุณาใส่ลิงก์ที่ถูกต้อง เช่น https://drive.google.com/...",
                      );
                      return;
                    }
                    handleUpdateWork("submit");
                  }}
                  disabled={!!linkError}
                  className="w-full py-4 bg-blue-600 text-white font-black rounded-2xl shadow-lg shadow-blue-200 
                  hover:bg-blue-700 transition-all flex items-center justify-center gap-2
                  disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none"
                >
                  <Send size={18} />
                  {isEditingSubmission ? "บันทึกการแก้ไข" : "ยืนยันการส่งงาน"}
                </button>
              </div>
            ) : (
              /* ── ส่วนแสดงผล ── */
              <div className="space-y-4">
                {/* ส่วน Link */}
                {workData.workLink && (
                  <a
                    href={workData.workLink}
                    target="_blank"
                    className="flex items-center justify-between p-5 bg-blue-50 rounded-2xl border border-blue-100 hover:bg-blue-100 transition-all"
                  >
                    <span className="font-bold text-blue-700 truncate mr-4">
                      {workData.workLink}
                    </span>
                    <span className="text-xs font-black text-blue-600 shrink-0">
                      เปิดลิงก์ →
                    </span>
                  </a>
                )}

                {/* Attachments */}
                {workData.attachments && workData.attachments.length > 0 && (
                  <div className="grid grid-cols-1 gap-2">
                    {workData.attachments.map((file, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl border border-gray-100"
                      >
                        <div className="flex items-center gap-3 overflow-hidden">
                          <FileText className="text-purple-500" size={20} />
                          <div className="truncate">
                            <p className="text-sm font-bold text-gray-800 truncate">
                              {file.fileName}
                            </p>
                            <p className="text-[10px] text-gray-400">
                              {(file.fileSize / (1024 * 1024)).toFixed(2)} MB
                            </p>
                          </div>
                        </div>
                        {/* <a href={file.fileUrl} target="_blank" className="text-xs font-bold text-purple-600 hover:underline">ดาวน์โหลด</a> */}
                        <a
                          href={file.fileUrl.replace(
                            "/upload/",
                            "/upload/fl_attachment/",
                          )}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs font-bold text-purple-600 hover:underline"
                        >
                          ดาวน์โหลด
                        </a>
                      </div>
                    ))}
                  </div>
                )}

                {!workData.workLink &&
                  (!workData.attachments ||
                    workData.attachments.length === 0) && (
                    <div className="p-5 bg-gray-50 rounded-2xl border border-dashed border-gray-200 text-center text-gray-400 italic text-sm">
                      ไม่มีการแนบไฟล์/ลิงก์
                    </div>
                  )}
              </div>
            )}
          </section>
        </div>

        <div className="space-y-6">
          <section className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 overflow-hidden">
            {/* Status row */}
            <div className="flex items-center justify-between gap-3 mb-4">
              <div className="p-2 rounded-xl text-[#9747FF]">
                <ChartPie size={20} />
              </div>
              <h2 className="text-lg font-black text-gray-900 tracking-tight">
                สถานะการทำงาน
              </h2>
              <span
                className={`text-xs px-2.5 py-1 rounded-lg border ${statusLabel[workData.status]?.class}`}
              >
                {statusLabel[workData.status]?.text}
              </span>
            </div>

            {/* Divider */}
            {workData.jobId?.deliveryDate && (
              <div className="h-px bg-gray-50 mb-4" />
            )}

            {/* Deadline */}
            {workData.jobId?.deliveryDate &&
              (() => {
                const deadline = new Date(workData.jobId.deliveryDate);
                const today = new Date();
                const daysLeft = Math.ceil(
                  (deadline.getTime() - today.getTime()) /
                    (1000 * 60 * 60 * 24),
                );
                const isUrgent = daysLeft <= 3;
                const isPast = daysLeft < 0;

                return (
                  <div
                    className={`rounded-2xl p-4 flex items-center justify-between gap-3 ${
                      isPast
                        ? "bg-red-50 border border-red-100"
                        : isUrgent
                          ? "bg-orange-50 border border-orange-100"
                          : "bg-gray-50 border border-gray-100"
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <div
                        className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                          isPast
                            ? "bg-red-100"
                            : isUrgent
                              ? "bg-orange-100"
                              : "bg-gray-100"
                        }`}
                      >
                        <Clock
                          size={14}
                          className={
                            isPast
                              ? "text-red-500"
                              : isUrgent
                                ? "text-orange-500"
                                : "text-gray-400"
                          }
                        />
                      </div>
                      <div>
                        <p className="text-[10px] font-medium text-gray-400 leading-none mb-0.5">
                          ส่งงานภายใน:
                        </p>
                        <p
                          className={`text-sm font-bold ${
                            isPast
                              ? "text-red-600"
                              : isUrgent
                                ? "text-orange-600"
                                : "text-gray-700"
                          }`}
                        >
                          {deadline.toLocaleDateString("th-TH", {
                            day: "2-digit",
                            month: "short",
                            year: "2-digit",
                          })}
                        </p>
                      </div>
                    </div>

                    {/* Days left pill */}
                    <span
                      className={`text-[11px] font-black px-2.5 py-1 rounded-xl tabular-nums ${
                        isPast
                          ? "bg-red-100 text-red-600"
                          : isUrgent
                            ? "bg-orange-100 text-orange-600"
                            : "bg-gray-100 text-gray-500"
                      }`}
                    >
                      {isPast
                        ? `เลยกำหนด ${Math.abs(daysLeft)} วัน`
                        : daysLeft === 0
                          ? "ครบกำหนดวันนี้"
                          : `อีก ${daysLeft} วัน`}
                    </span>
                  </div>
                );
              })()}
          </section>

          <section className="bg-white rounded-[2rem] p-8 shadow-sm border border-gray-100 text-left overflow-hidden relative">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 rounded-xl text-indigo-600">
                <MessageSquare size={20} />
              </div>
              <h2 className="text-lg font-black text-gray-900 tracking-tight">
                การตรวจรับงาน
              </h2>
            </div>

            {!isFreelancer && workData.status === "submitted" ? (
              <div className="space-y-4">
                <textarea
                  rows={4}
                  placeholder="ระบุข้อความถึงนิสิต เช่น สิ่งที่ต้องแก้ไข"
                  className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all text-sm"
                  value={ownerFeedback}
                  onChange={(e) => setOwnerFeedback(e.target.value)}
                />
                <div className="grid grid-cols-1 gap-3">
                  <button
                    onClick={() => handleUpdateWork("approve")}
                    className="w-full py-3.5 bg-green-600 text-white font-black rounded-xl hover:bg-green-700 transition-all shadow-lg shadow-green-100 flex items-center justify-center gap-2 active:scale-95"
                  >
                    <CheckCircle2 size={18} /> อนุมัติและจบงาน
                  </button>
                  <button
                    onClick={() => handleUpdateWork("requestRevision")}
                    className="w-full py-3.5 bg-white border-2 border-orange-100 text-orange-600 font-bold rounded-xl hover:bg-orange-50 transition-all flex items-center justify-center gap-2 active:scale-95"
                  >
                    <AlertCircle size={18} /> สั่งแก้ไขงาน
                  </button>
                </div>
              </div>
            ) : (
              <div
                className={`relative p-6 rounded-2xl transition-all duration-300 ${
                  workData.feedback
                    ? "bg-indigo-50/40 border-1 border-indigo-100/70"
                    : "bg-gray-50/50 border border-gray-200"
                }`}
              >
                <div className="absolute top-0 right-6 -translate-y-1/2 bg-white px-3 py-1 border border-gray-100 rounded-full">
                  <span className="text-[10px] font-black text-indigo-500">
                    ข้อความจากผู้ว่าจ้าง
                  </span>
                </div>
                <p
                  className={`text-sm leading-relaxed font-medium break-words whitespace-pre-wrap ${
                    workData.feedback
                      ? "text-indigo-900"
                      : "text-gray-400 italic"
                  }`}
                >
                  {workData.feedback || "ยังไม่มีข้อความตอบกลับจากผู้ว่าจ้าง"}
                </p>
              </div>
            )}
          </section>

          {/* ── Info Card: ปรับให้ดูพรีเมียมแบบ Wallet/Glassmorphism ── */}
          <motion.section
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.6 }}
            className="rounded-[2rem] p-6 md:p-8 text-white shadow-2xl relative overflow-hidden flex flex-col min-h-[400px]"
            style={{
              background: "linear-gradient(135deg, #0C5BEA 0%, #1D4ED8 100%)",
            }}
          >
            {/* Decorative Background Icon */}
            <div className="absolute -bottom-10 -right-10 opacity-[0.1] rotate-12 transition-transform hover:scale-110">
              <Briefcase size={220} />
            </div>

            <div className="relative z-10 flex flex-col h-full">
              {/* Header: ปรับให้เหมือน Card บน (Status / การตรวจรับงาน) */}
              <div className="flex items-center gap-3">
                <div className="p-2 text-white">
                  <Wallet size={20} />
                </div>
                <h2 className="text-lg font-black text-white tracking-tight">
                  งบประมาณ
                </h2>
              </div>

              <div className="flex-grow">
                {/* --- Budget Section --- */}
                <div className="px-2 pb-7">
                  <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
                    <span className="text-[40px] font-black text-white">
                      ฿{workData.jobId?.budgetMin?.toLocaleString()}
                    </span>
                    {workData.jobId?.budgetMax && (
                      <span className="text-xl font-bold text-white/40 whitespace-nowrap">
                        - ฿{workData.jobId?.budgetMax?.toLocaleString()}
                      </span>
                    )}
                  </div>
                </div>

                {/* --- Details Section --- */}
                <div className="space-y-6 pt-8 border-t border-white/10">
                  {/* Location */}
                  <div className="flex items-center gap-4 group">
                    <div className="w-11 h-11 bg-white/10 rounded-[1.2rem] flex items-center justify-center transition-all duration-300 group-hover:bg-white/20 group-hover:scale-110 shadow-inner">
                      <MapPin size={20} className="text-white/80" />
                    </div>
                    <div>
                      <p className="text-[12px] font-black text-white/40 mb-0.5">
                        สถานที่ทำงาน
                      </p>
                      <p className="text-[13px] font-bold text-white leading-tight">
                        {workData.jobId?.location || "ออนไลน์ / Remote"}
                      </p>
                    </div>
                  </div>

                  {/* Description */}
                  <div className="flex items-start gap-4 group">
                    <div className="w-11 h-11 bg-white/10 rounded-[1.2rem] flex items-center justify-center shrink-0 transition-all duration-300 group-hover:bg-white/20 group-hover:scale-110 shadow-inner">
                      <Info size={20} className="text-white/80" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[12px] font-black text-white/40 mb-1">
                        คำอธิบายงาน
                      </p>
                      <p className="text-[12px] font-medium leading-relaxed text-white/80 line-clamp-5">
                        {workData.jobId?.description}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.section>
        </div>
      </main>
      {workData.status === "completed" && (
        <motion.div
          initial={{ x: 100, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          className="fixed bottom-6 left-6 z-50 bg-white border-2 border-green-500 p-4 rounded-2xl shadow-2xl flex items-center gap-4 max-w-[280px]"
        >
          <div className="bg-green-500 p-2 rounded-lg text-white shrink-0">
            <CheckCircle2 size={20} />
          </div>
          <div>
            <p className="text-[10px] text-green-600 font-black">สถานะงาน</p>
            <p className="text-xs font-bold text-gray-800">
              งานนี้เสร็จสมบูรณ์แล้ว
            </p>
          </div>
        </motion.div>
      )}
    </div>
  );
}
