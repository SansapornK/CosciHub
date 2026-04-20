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
} from "lucide-react";
import toast from "react-hot-toast";

import Loading from "../../../../../components/common/Loading";

// ─── Interfaces ───────────────────────────────────────────────────────────────

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
    deliveryDate: string;
  };
  applicantId: {
    _id: string;
    name: string;
    email: string;
  };
  status: "accepted" | "in_progress" | "submitted" | "revision" | "completed";
  progress: number;
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
  const [workLink, setWorkLink] = useState("");
  // const [studentNote, setStudentNote] = useState("");
  const [ownerFeedback, setOwnerFeedback] = useState("");

  const [isEditingSubmission, setIsEditingSubmission] = useState(false);

  const isFreelancer = session?.user?.role === "student";
  // const [selectedFile, setSelectedFile] = useState<File | null>(null);
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

      if (action === "updateProgress") {
        payload.progress = newProgress;
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

                <span
                  className={`text-[12px] text-xs px-2.5 py-1 rounded-lg border uppercase shrink-0  ${statusLabel[workData.status]?.class}`}
                >
                  {statusLabel[workData.status]?.text}
                </span>

                {workData.jobId?.deliveryDate && (
                  // <span className="flex items-center gap-1.5 bg-red-50 text-red-600 text-[10px] font-black px-3 py-1.5 rounded-lg border border-red-100 uppercase tracking-widest">
                  //   <Clock size={14} />
                  //   Deadline: {new Date(workData.jobId.deliveryDate).toLocaleDateString('th-TH')}
                  // </span>
                  <span className="flex items-center gap-1.5 bg-red-50 text-red-600 text-[12px] px-2.5 py-1 rounded-full border border-red-100 uppercase">
                    <Clock size={12} />
                    ส่งงานภายใน:{" "}
                    {new Date(workData.jobId.deliveryDate).toLocaleDateString(
                      "th-TH",
                      { day: "2-digit", month: "short", year: "2-digit" },
                    )}
                  </span>
                )}
              </div>
            </div>

            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white p-3 md:p-4 rounded-[1.5rem] border border-gray-100 shadow-sm flex items-center gap-3 md:gap-4 w-full md:w-auto"
            >
              <div className="w-10 h-10 md:w-12 md:h-12 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-black text-lg md:text-xl shrink-0">
                {isFreelancer
                  ? workData.jobId?.owner?.[0]
                  : workData.applicantId?.name?.[0]}
              </div>

              <div className="min-w-0 flex-1 md:flex-none">
                <p className="text-[9px] md:text-[10px] text-gray-400 font-black uppercase mb-0.5 truncate">
                  {isFreelancer
                    ? "ผู้ว่าจ้าง / เจ้าของงาน"
                    : "นิสิตผู้ปฏิบัติงาน"}
                </p>
                <Link
                  href={`/account/${isFreelancer ? workData.jobId?.ownerId : workData.applicantId?._id}`}
                  target="_blank"
                  className="text-xs md:text-sm font-black text-gray-800 truncate max-w-[150px] md:max-w-none hover:text-[#0C5BEA] transition-colors"
                >
                  {isFreelancer
                    ? workData.jobId?.owner
                    : workData.applicantId?.name}
                </Link>
              </div>
            </motion.div>
          </div>
        </div>
      </motion.section>

      <main className="max-w-6xl mx-auto p-6 md:p-12 grid grid-cols-1 lg:grid-cols-3 gap-10">
        {/* ── Left Column ── */}
        <div className="lg:col-span-2 space-y-10">
          {/* ── Progress Tracker Card ── */}
          <section className="bg-white rounded-[2.5rem] p-10 shadow-sm border border-gray-100 relative overflow-hidden">
            <div className="relative z-10">
              <div className="flex justify-between items-center mb-10">
                <h2 className="text-xl font-black text-gray-900 flex items-center gap-3">
                  <div className="p-2 bg-blue-600 rounded-xl text-white shadow-lg shadow-blue-100">
                    <Clock size={20} />
                  </div>
                  ความคืบหน้างาน
                </h2>

                <div className="relative">
                  <motion.span
                    key={newProgress}
                    animate={{ scale: newProgress === 100 ? [1, 1.2, 1] : 1 }}
                    className="text-5xl font-black text-blue-600 tabular-nums block relative z-10"
                  >
                    {newProgress}
                    <span className="text-xl ml-1">%</span>
                  </motion.span>

                  <AnimatePresence>
                    {newProgress === 100 && (
                      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        {confetti.map((_, i) => (
                          <motion.div
                            key={i}
                            initial={{ scale: 0, x: 0, y: 0 }}
                            animate={{
                              scale: [0, 1, 0],
                              x: Math.cos(i * 30 * (Math.PI / 180)) * 65,
                              y: Math.sin(i * 30 * (Math.PI / 180)) * 65,
                            }}
                            transition={{ duration: 0.8, ease: "easeOut" }}
                            className="absolute w-2 h-2 bg-blue-500 rounded-full"
                          />
                        ))}
                      </div>
                    )}
                  </AnimatePresence>
                </div>
              </div>

              {isFreelancer && workData.status !== "completed" && (
                <div className="space-y-6 bg-gray-50 p-8 rounded-[2rem] border border-gray-100 shadow-inner">
                  <div className="flex justify-between items-center px-1">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
                      <p className="text-xs font-black text-gray-400">
                        เลื่อนเพื่ออัปเดตสถานะ
                      </p>
                    </div>
                    <div className="px-3 py-1 bg-blue-100 text-blue-700 rounded-lg text-xs font-black">
                      {newProgress}%
                    </div>
                  </div>

                  <div className="relative flex items-center w-full h-12 group px-2">
                    <div className="absolute left-2 right-2 h-2 bg-gray-100 rounded-full" />

                    <div className="absolute left-2 right-2 flex justify-between px-1">
                      {[0, 25, 50, 75, 100].map((tick) => (
                        <div
                          key={tick}
                          className={`w-1.5 h-1.5 rounded-full transition-colors duration-300 ${
                            newProgress >= tick
                              ? "bg-blue-600/40"
                              : "bg-gray-300"
                          }`}
                        />
                      ))}
                    </div>

                    {/* ── Active Progress Fill ── */}
                    <motion.div
                      className="absolute left-2 h-2 bg-blue-600 rounded-full pointer-events-none z-10 shadow-[0_0_15px_rgba(37,99,235,0.4)]"
                      initial={false}
                      animate={{
                        width: `calc(${newProgress}% - ${(newProgress / 100) * 8}px)`,
                      }}
                      transition={{
                        type: "spring",
                        stiffness: 400,
                        damping: 40,
                      }}
                    />

                    {/* ── Range Input ── */}
                    <input
                      type="range"
                      min="0"
                      max="100"
                      step="25"
                      value={newProgress}
                      onChange={(e) => {
                        const newValue = parseInt(e.target.value);

                        if (newValue >= (workData?.progress || 0)) {
                          setNewProgress(newValue);
                        } else {
                          toast.error("ไม่สามารถลดความคืบหน้างานลงได้", {
                            id: "progress-error",
                          });
                        }
                      }}
                      className="absolute left-0 w-full h-10 bg-transparent appearance-none cursor-pointer z-20 
                        [&::-webkit-slider-thumb]:appearance-none 
                        [&::-webkit-slider-thumb]:w-6 
                        [&::-webkit-slider-thumb]:h-6 
                        [&::-webkit-slider-thumb]:rounded-full 
                        [&::-webkit-slider-thumb]:bg-white 
                        [&::-webkit-slider-thumb]:border-[4px] 
                        [&::-webkit-slider-thumb]:border-blue-600 
                        [&::-webkit-slider-thumb]:shadow-xl 
                        [&::-webkit-slider-thumb]:transition-transform
                        [&::-webkit-slider-thumb]:active:scale-125
                        [&::-webkit-slider-thumb]:hover:scale-110"
                    />
                  </div>

                  <div className="flex justify-between px-2 mt-2">
                    {[0, 25, 50, 75, 100].map((val) => (
                      <span
                        key={val}
                        className={`text-[9px] font-black tracking-tighter transition-colors ${
                          newProgress === val
                            ? "text-blue-600"
                            : "text-gray-300"
                        }`}
                      >
                        {val}%
                      </span>
                    ))}
                  </div>
                  <button
                    onClick={() => handleUpdateWork("updateProgress")}
                    className="w-full py-4 bg-white border-2 border-blue-600 text-blue-600 font-black rounded-2xl hover:bg-blue-600 hover:text-white transition-all active:scale-[0.98] flex items-center justify-center gap-2 shadow-sm shadow-blue-50"
                  >
                    <CheckCircle2 size={20} />
                    บันทึกความคืบหน้าเป็น {newProgress}%
                  </button>
                </div>
              )}
            </div>
          </section>

          {/* ── Submission Form ── */}
          <section className="bg-white rounded-[2rem] p-8 shadow-sm border border-gray-100 text-left">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-purple-600 rounded-xl text-white shadow-lg shadow-purple-100 shrink-0">
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
                    <span className="text-[10px] font-black bg-red-500 text-white px-2.5 py-1 rounded-lg  shadow-sm shadow-red-100">
                      Required
                    </span>
                  ) : (
                    <span className="text-[10px] font-black bg-gray-100 text-gray-400 px-2.5 py-1 rounded-lg ">
                      Optional
                    </span>
                  )}
                  <span className="text-[10px] font-black bg-gray-50 text-black px-2.5 py-1 rounded-lg border border-gray-100 ">
                    Max 10MB
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

                {/* ปุ่มยกเลิกการแก้ไข */}
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
                      className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none transition-all pl-12"
                      value={workLink}
                      onChange={(e) => setWorkLink(e.target.value)}
                    />
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
                  onClick={() => handleUpdateWork("submit")}
                  className="w-full py-4 bg-blue-600 text-white font-black rounded-2xl shadow-lg shadow-blue-200 hover:bg-blue-700 transition-all flex items-center justify-center gap-2"
                >
                  <Send size={18} />{" "}
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
          <section className="bg-white rounded-[2rem] p-8 shadow-sm border border-gray-100 text-left overflow-hidden relative">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-indigo-50 rounded-xl text-indigo-600">
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
              <div className="relative p-6 bg-gray-50 rounded-2xl border border-gray-100">
                <div className="absolute top-0 right-6 -translate-y-1/2 bg-white px-3 py-1 border border-gray-100 rounded-full">
                  <span className="text-[10px] font-black text-indigo-500">
                    Client Feedback
                  </span>
                </div>
                <p className="text-gray-600 text-sm leading-relaxed font-medium italic">
                  "{workData.feedback || "ยังไม่มีข้อความตอบกลับจากผู้ว่าจ้าง"}"
                </p>
              </div>
            )}
          </section>

          {/* ── Info Card: ปรับให้ดูพรีเมียมแบบ Wallet/Glassmorphism ── */}
          <motion.section
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.6 }}
            className="rounded-[2.5rem] p-8 text-white shadow-2xl relative overflow-hidden flex flex-col min-h-[400px]"
            style={{
              background: "linear-gradient(135deg, #0C5BEA 0%, #1D4ED8 100%)",
            }}
          >
            {/* Decorative Background Icon */}
            <div className="absolute -bottom-10 -right-10 opacity-[0.1] rotate-12 transition-transform hover:scale-110">
              <Briefcase size={220} />
            </div>

            <div className="relative z-10 flex flex-col h-full">
              <h3 className="text-sm font-black text-white/60 uppercase mb-6">
                รายละเอียดงาน
              </h3>

              <div className="space-y-8">
                <div>
                  <p className="text-[10px] font-bold uppercase text-white/50 mb-1">
                    งบประมาณโครงการ
                  </p>
                  <div className="flex items-baseline gap-2">
                    <span className="text-4xl font-black tracking-tighter">
                      ฿{workData.jobId?.budgetMin?.toLocaleString()}
                    </span>
                    <span className="text-4xl font-black tracking-tighter">
                      - {workData.jobId?.budgetMax?.toLocaleString()}
                    </span>
                  </div>
                </div>

                <div className="space-y-5 pt-8 border-t border-white/10">
                  <div className="flex items-center gap-4 group">
                    <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center transition-colors group-hover:bg-white/20">
                      <MapPin size={18} />
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-white/50 uppercase">
                        สถานที่ปฏิบัติงาน
                      </p>
                      <p className="text-sm font-bold">
                        {workData.jobId?.location || "ออนไลน์"}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4 group">
                    <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center shrink-0 transition-colors group-hover:bg-white/20">
                      <Info size={18} />
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-white/50 mb-1">
                        คำอธิบายงาน
                      </p>
                      <p className="text-xs font-medium leading-relaxed opacity-80 line-clamp-6">
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
