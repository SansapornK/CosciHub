// src/app/(pages)/manage-projects/[id]/work/[applicationId]/page.tsx

'use client';

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
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
} from "lucide-react";
import toast, { Toaster } from 'react-hot-toast';

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
  };
  applicantId: {
    _id: string;
    name: string;
    email: string;
  };
  status: "accepted" | "in_progress" | "submitted" | "revision" | "completed";
  progress: number;
  workLink?: string;
  note?: string;
  feedback?: string;
  updatedAt: string;
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
  const [studentNote, setStudentNote] = useState("");
  const [ownerFeedback, setOwnerFeedback] = useState("");

  const [isEditingSubmission, setIsEditingSubmission] = useState(false);

  const isFreelancer = session?.user?.role === 'student';
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  useEffect(() => {
    if (authStatus === 'authenticated' && applicationId) {
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
        setStudentNote(data.note || "");
        setOwnerFeedback(data.feedback || "");
      }
    } catch (err) {
      toast.error("ไม่สามารถโหลดข้อมูลการทำงานได้");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateWork = async (action: "updateProgress" | "submit" | "approve" | "requestRevision") => {
  try {
    const payload: any = { action };
    if (action === "updateProgress") {
      payload.progress = newProgress;
    }
    
    if (action === "submit") {
      const isOnlineJob = (workData.jobId?.jobType?.toLowerCase().trim().includes("ออนไลน์") || workData.jobId?.jobType?.toLowerCase().trim().includes("online"));
      
      // if (!workLink.trim() && !selectedFile) {
      //   toast.error("กรุณาแนบลิงก์งานหรืออัปโหลดไฟล์อย่างน้อย 1 ช่องทาง");
      //   return;
      // }
      
      if (isOnlineJob && !workLink.trim() && !selectedFile) {
        toast.error("งานออนไลน์จำเป็นต้องแนบลิงก์งานหรือไฟล์อย่างน้อย 1 ช่องทาง");
        return;
      }

      if (selectedFile && selectedFile.size > 25 * 1024 * 1024) {
        toast.error("ขนาดไฟล์ห้ามเกิน 25MB");
        return;
      }

      payload.workLink = workLink;
      payload.note = studentNote;
    }

    await axios.patch(`/api/applications/${applicationId}`, payload);
    toast.success("ส่งงานเรียบร้อยแล้ว!");
    setIsEditingSubmission(false);
    fetchWorkDetail();
  } catch (err: any) {
    toast.error(err.response?.data?.error || "เกิดข้อผิดพลาด");
  }
};

  // 1. Loading State
  if (loading) return <div className="h-screen flex items-center justify-center bg-gray-50"><Loading /></div>;

  // 2. Error Guard Clause: ตรวจสอบข้อมูลสำคัญให้ครบก่อน Render
  if (!workData) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 text-center px-6">
        <div className="p-8 bg-white rounded-[2.5rem] shadow-sm max-w-sm border border-gray-100">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-gray-800">ไม่พบข้อมูลงาน</h3>
          <p className="text-sm text-gray-500 mt-2 mb-6">ขออภัย ไม่พบรายละเอียดของโปรเจกต์นี้ในระบบ</p>
          <button onClick={() => router.push('/manage-projects')} className="w-full py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-all">
            กลับสู่หน้าหลัก
          </button>
        </div>
      </div>
    );
  }

  const statusLabel: Record<string, { text: string; class: string }> = {
    accepted: { text: "รอเริ่มงาน", class: "bg-blue-100 text-blue-700" },
    in_progress: { text: "กำลังทำงาน", class: "bg-yellow-100 text-yellow-700" },
    submitted: { text: "ส่งงานแล้ว", class: "bg-purple-100 text-purple-700" },
    revision: { text: "แก้ไขงาน", class: "bg-orange-100 text-orange-700" },
    completed: { text: "เสร็จสมบูรณ์", class: "bg-green-100 text-green-700" },
  };

  const currentStatus = statusLabel[workData.status] || statusLabel.in_progress;

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 via-white to-white pb-20">
      <Toaster position="top-right" />
      
      {/* ── Header Area ── */}
      <section className="bg-white border-b border-gray-100 pt-10 pb-6 px-6 md:px-12">
        <div className="max-w-5xl mx-auto">
          <button 
            onClick={() => router.back()}
            className="flex items-center gap-2 text-gray-500 hover:text-blue-600 transition-colors mb-6 text-sm font-medium"
          >
            <ArrowLeft size={18} /> ย้อนกลับ
          </button>

          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div className="flex-1">
              <h1 className="text-2xl md:text-3xl font-black text-gray-900 mb-2">{workData.jobId?.title}</h1>
              <div className="flex items-center gap-3 mb-2">
                <span className="bg-gray-100 text-gray-600 text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider">
                  {workData.jobId?.category || "ทั่วไป"}
                </span>
                <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider ${statusLabel[workData.status]?.class}`}>
                  {statusLabel[workData.status]?.text}
                </span>
              </div>
            </div>
            
            <div className="text-left md:text-right">
              <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mb-1">ผู้ปฏิบัติงาน</p>
              <p className="text-lg font-bold text-gray-800">{workData.applicantId?.name}</p>
            </div>
          </div>
        </div>
      </section>

      <main className="max-w-5xl mx-auto p-6 md:p-12 grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        <div className="lg:col-span-2 space-y-8">
          {/* Progress Tracker */}
          <section className="bg-white rounded-[2rem] p-8 shadow-sm border border-gray-100">
            <div className="flex justify-between items-end mb-6">
              <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                <Clock className="text-blue-500" size={20} /> ความคืบหน้างาน
              </h2>
              <span className="text-3xl font-black text-blue-600">{workData.progress}%</span>
            </div>
            
            <div className="w-full bg-gray-100 rounded-full h-4 mb-8 overflow-hidden">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: `${workData.progress}%` }}
                className="h-full bg-blue-600 rounded-full shadow-[0_0_15px_rgba(37,99,235,0.3)]"
              />
            </div>

            {isFreelancer && workData.status !== "completed" && (
            <div className="space-y-6 bg-gray-50 p-8 rounded-[2rem] border border-gray-100 shadow-inner">
              <div className="flex justify-between items-center mb-2">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
                  <p className="text-sm font-bold text-gray-600">เลื่อนเพื่ออัปเดตความคืบหน้า</p>
                </div>
                <motion.div 
                  key={newProgress}
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="text-2xl font-black text-blue-600 tabular-nums"
                >
                  {newProgress}%
                </motion.div>
              </div>

              {/* Custom Range Slider Container */}
              <div className="relative flex items-center w-full h-6 group">
                <div className="absolute w-full h-2 bg-gray-200 rounded-full" />

                <div 
                  className="absolute left-0 h-2 bg-blue-600 rounded-full pointer-events-none transition-all duration-75 ease-out shadow-[0_0_12px_rgba(37,99,235,0.3)]"
                  style={{ width: `${newProgress}%` }} 
                />

                <input 
                  type="range" 
                  min="0" 
                  max="100" 
                  step="1"
                  value={newProgress}
                  onChange={(e) => setNewProgress(parseInt(e.target.value))}
                  className="absolute w-full h-6 bg-transparent appearance-none cursor-pointer z-20 
                            [&::-webkit-slider-thumb]:appearance-none 
                            [&::-webkit-slider-thumb]:w-6 
                            [&::-webkit-slider-thumb]:h-6 
                            [&::-webkit-slider-thumb]:rounded-full 
                            [&::-webkit-slider-thumb]:bg-white 
                            [&::-webkit-slider-thumb]:border-[3px] 
                            [&::-webkit-slider-thumb]:border-blue-600 
                            [&::-webkit-slider-thumb]:shadow-lg
                            [&::-webkit-slider-thumb]:transition-transform
                            [&::-webkit-slider-thumb]:active:scale-125
                            [&::-webkit-slider-thumb]:hover:scale-110"
                />
              </div>

              {/*ปุ่มบันทึกความคืบหน้า */}
              <button 
                onClick={() => handleUpdateWork("updateProgress")}
                className="w-full py-4 bg-white border-2 border-blue-100 text-blue-600 font-black rounded-2xl hover:bg-blue-600 hover:text-white hover:border-blue-600 transition-all shadow-sm active:scale-95 flex items-center justify-center gap-2 group"
              >
                <CheckCircle2 size={18} className="group-hover:scale-110 transition-transform" />
                บันทึกความคืบหน้าเป็น {newProgress}%
              </button>
            </div>
          )}
          </section>

          {/* ── Submission Form ── */}
          <section className="bg-white rounded-[2rem] p-8 shadow-sm border border-gray-100 text-left">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                <FileText className="text-purple-500" size={20} /> รายละเอียดการส่งงาน
              </h2>
              <div className="flex gap-2">
                {/* ✅ เพิ่ม Tag เงื่อนไขงาน */}
                {(workData.jobId?.jobType?.toLowerCase().trim().includes("ออนไลน์") || workData.jobId?.jobType?.toLowerCase().trim().includes("online")) ? (
                <span className="text-[10px] font-bold bg-red-50 text-red-500 px-2 py-1 rounded-md border border-red-100 uppercase tracking-wider">
                  Required
                </span>
                ) : (
                  <span className="text-[10px] font-bold bg-gray-50 text-gray-400 px-2 py-1 rounded-md border border-gray-100 uppercase">
                    Optional
                  </span>
                )}
                <span className="text-[10px] font-bold bg-blue-50 text-blue-600 px-2 py-1 rounded-md border border-blue-100 uppercase tracking-tighter">
                  Max 25MB
                </span>
              </div>
            </div>

            {isFreelancer && (["in_progress", "revision", "accepted"].includes(workData.status) || isEditingSubmission) ? (
              <div className="space-y-6">
                {/* Option 1: แนบลิงก์ */}
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">
                    1. แนบลิงก์ผลงาน (Drive, Figma, Github) 
                    {(workData.jobId?.jobType?.toLowerCase().trim().includes("ออนไลน์")) && (
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
                    <ExternalLink className="absolute left-4 top-4 text-gray-300 group-focus-within:text-blue-500 transition-colors" size={20} />
                  </div>
                </div>

                <div className="relative flex py-2 items-center">
                  <div className="flex-grow border-t border-gray-100"></div>
                  <span className="flex-shrink mx-4 text-xs font-bold text-gray-300 uppercase">หรือ</span>
                  <div className="flex-grow border-t border-gray-100"></div>
                </div>

                {/* Option 2: แนบไฟล์ */}
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">2. อัปโหลดไฟล์งาน (PDF, ZIP, JPG)</label>
                  <div className={`relative border-2 border-dashed rounded-2xl p-6 transition-all text-center
                    ${selectedFile ? 'border-blue-500 bg-blue-50/30' : 'border-gray-200 hover:border-blue-300'}`}>
                    <input 
                      type="file" 
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" 
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file && file.size > 25 * 1024 * 1024) {
                          toast.error("ไฟล์ใหญ่เกิน 25MB!");
                          e.target.value = ""; // reset
                        } else {
                          setSelectedFile(file || null);
                        }
                      }}
                    />
                    <div className="flex flex-col items-center gap-2">
                      {selectedFile ? (
                        <>
                          <CheckCircle2 className="text-blue-600" size={32} />
                          <p className="text-sm font-bold text-blue-700 truncate max-w-[200px]">{selectedFile.name}</p>
                          <p className="text-[10px] text-blue-500">{(selectedFile.size / (1024 * 1024)).toFixed(2)} MB</p>
                        </>
                      ) : (
                        <>
                          <div className="p-3 bg-gray-100 rounded-full text-gray-400"><Send size={24} /></div>
                          <p className="text-sm font-medium text-gray-500">คลิกหรือลากไฟล์มาวางที่นี่</p>
                          <p className="text-[10px] text-gray-400 font-bold uppercase">ไม่เกิน 25MB</p>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                <button 
                  onClick={() => handleUpdateWork("submit")}
                  className="w-full py-4 bg-blue-600 text-white font-black rounded-2xl shadow-lg shadow-blue-200 hover:bg-blue-700 transition-all flex items-center justify-center gap-2"
                >
                  <Send size={18} /> ยืนยันการส่งงาน
                </button>
              </div>
            ) : (
              /* ── ส่วนแสดงผล Read-only ── */
              <div className="space-y-4">
                {workData.workLink ? (
                  <a href={workData.workLink} target="_blank" className="flex items-center justify-between p-5 bg-blue-50 rounded-2xl border border-blue-100">
                      <span className="font-bold text-blue-700 truncate">{workData.workLink}</span>
                      <span className="text-xs font-black text-blue-600">เปิดลิงก์ →</span>
                  </a>
                ) : (
                  <div className="p-5 bg-gray-50 rounded-2xl border border-dashed border-gray-200 text-center text-gray-400 italic text-sm">
                      ไม่มีการแนบไฟล์/ลิงก์
                  </div>
                )}
              </div>
            )}
          </section>
        </div>

        <div className="space-y-8">
          {/* Owner Feedback Panel */}
          <section className="bg-white rounded-[2rem] p-8 shadow-sm border border-gray-100 text-left">
            <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2 mb-6">
              <MessageSquare className="text-indigo-500" size={20} /> การตรวจรับงาน
            </h2>

            {!isFreelancer && workData.status === "submitted" ? (
              <div className="space-y-4">
                <textarea 
                  rows={4}
                  placeholder="เขียนคำแนะนำหรือสิ่งที่ต้องแก้ไข..."
                  className="w-full p-4 bg-gray-100 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all"
                  value={ownerFeedback}
                  onChange={(e) => setOwnerFeedback(e.target.value)}
                />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <button 
                    onClick={() => handleUpdateWork("requestRevision")}
                    className="py-3 bg-white border border-orange-200 text-orange-600 font-bold rounded-xl hover:bg-orange-50 transition-all flex items-center justify-center gap-2"
                  >
                    <AlertCircle size={18} /> สั่งแก้ไข
                  </button>
                  <button 
                    onClick={() => handleUpdateWork("approve")}
                    className="py-3 bg-green-600 text-white font-bold rounded-xl hover:bg-green-700 transition-all shadow-lg shadow-green-100 flex items-center justify-center gap-2"
                  >
                    <CheckCircle2 size={18} /> อนุมัติงาน
                  </button>
                </div>
              </div>
            ) : (
              <div className="bg-indigo-50 p-6 rounded-2xl border border-indigo-100">
                <p className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest mb-2">Feedback จากเจ้าของงาน</p>
                <p className="text-gray-700 text-sm italic">
                  {workData.feedback || "ยังไม่มีข้อความตอบกลับ"}
                </p>
              </div>
            )}
          </section>

          {/* Job Info Summary */}
          <section 
            className="rounded-[2rem] p-8 text-white shadow-xl text-left relative overflow-hidden"
            style={{ 
              background: 'linear-gradient(135deg, #0C5BEA 0%, #6D91D3 100%)' 
            }}
          >
            {/* <div className="absolute top-0 right-0 p-4 opacity-20 transform translate-x-4 -translate-y-4">
              <Briefcase size={120} />
            </div> */}

            <h3 className="text-s font-bold text-white uppercase tracking-widest mb-4">
              ข้อมูลโปรเจกต์
            </h3>

            <div className="space-y-4 relative z-10">
              <div>
                <p className="text-[10px] text-blue-100/70 font-bold uppercase mb-1">งบประมาณที่ตกลง</p>
                <p className="text-2xl font-black tracking-tight">
                  {workData.jobId?.budgetMin?.toLocaleString()} - {workData.jobId?.budgetMax?.toLocaleString()} 
                  <span className="text-sm font-medium ml-1">บาท</span>
                </p>
              </div>

              <div className="pt-4 border-t border-white/20">
                <p className="text-[10px] text-blue-100/70 font-bold uppercase mb-2">
                  <Info className="text-indigo-500" size={20} /> คำอธิบายงาน
                </p>
                <p className="text-xs text-blue-50/90 leading-relaxed line-clamp-6 font-medium">
                  {workData.jobId?.description}
                </p>
              </div>
            </div>
          </section>

          <section className="bg-indigo-50 p-6 rounded-2xl text-black shadow-xl text-left relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-10">
              <Briefcase size={80} />
            </div>
            <h3 className="text-xs font-bold text-blue-400 uppercase tracking-widest mb-4">รูปแบบการทำงาน</h3>
            <div className="space-y-4 relative z-10">
              <div>
                <p className="text-[10px] text-gray-400 font-bold uppercase">งบประมาณที่ตกลง</p>
                <p className="text-xl font-black">
                  {workData.jobId?.jobType}
                </p>
              </div>
              <div className="pt-4 border-t border-gray-800">
                <p className="text-[10px] text-gray-400 font-bold uppercase mb-2">คำอธิบายงาน</p>
                <p className="text-xs text-gray-400 leading-relaxed line-clamp-6">
                  {workData.jobId?.description}
                </p>
              </div>
            </div>
          </section>
        </div>

      </main>
    </div>
  );
}