"use client";

import { useState, useEffect } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import { readFileAsBase64 } from "@/utils/fileHelpers";
import { isValidUrl } from "@/utils/validation";

// ─── Interfaces ───────────────────────────────────────────────────────────────
export interface IProgressLog {
  progress: number;
  note?: string | null;
  createdAt: string;
}

export interface ApplicationDetail {
  _id: string;
  jobId: {
    _id: string;
    title: string;
    description: string;
    category: string;
    budget: number;
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

interface UseWorkDetailProps {
  applicationId: string | string[] | undefined;
  authStatus: "authenticated" | "loading" | "unauthenticated";
}

export function useWorkDetail({ applicationId, authStatus }: UseWorkDetailProps) {
  const [workData, setWorkData] = useState<ApplicationDetail | null>(null);
  const [loading, setLoading] = useState(true);

  const [newProgress, setNewProgress] = useState(0);
  const [progressNote, setProgressNote] = useState("");
  const [workLink, setWorkLink] = useState("");
  const [ownerFeedback, setOwnerFeedback] = useState("");

  const [isEditingSubmission, setIsEditingSubmission] = useState(false);
  const [isEditingProgress, setIsEditingProgress] = useState(false);
  const [confirmCancel, setConfirmCancel] = useState(false);

  const [linkError, setLinkError] = useState("");
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);

  const [existingFiles, setExistingFiles] = useState<
    { fileName: string; fileUrl: string; fileSize: number }[]
  >([]);

  const [isJobDetailsOpen, setIsJobDetailsOpen] = useState(false);

  const [uploadProgress, setUploadProgress] = useState<Record<string, number>>(
    {}
  );

  const hasProgressChanges =
    newProgress !== (workData?.progress || 0) || progressNote.trim() !== "";

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
        setIsEditingProgress(false);
        setProgressNote("");
      }
    } catch (err) {
      toast.error("ไม่สามารถโหลดข้อมูลการทำงานได้");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateWork = async (
    action: "updateProgress" | "submit" | "approve" | "requestRevision"
  ) => {
    try {
      const payload: any = { action };

      if (action === "updateProgress") {
        payload.progress = newProgress;
        payload.progressNote = progressNote.trim() || null;
      }

      if (action === "submit") {
        const isOnlineJob =
          workData?.jobId?.jobType?.toLowerCase().trim().includes("ออนไลน์") ||
          workData?.jobId?.jobType?.toLowerCase().trim().includes("online");

        if (isOnlineJob && !workLink.trim() && selectedFiles.length === 0) {
          toast.error("กรุณาแนบลิงก์งานหรือไฟล์อย่างน้อย 1 ช่องทาง");
          return;
        }

        if (existingFiles.length + selectedFiles.length > 3) {
          toast.error("จำนวนไฟล์รวมต้องไม่เกิน 3 ไฟล์");
          return;
        }

        const duplicateFile = selectedFiles.find((newFile) =>
          existingFiles.some((oldFile) => oldFile.fileName === newFile.name)
        );
        if (duplicateFile) {
          toast.error(
            `ไฟล์ "${duplicateFile.name}" มีอยู่ในระบบแล้ว ไม่ต้องอัปโหลดซ้ำ`
          );
          return;
        }

        const MAX_FILE_SIZE = 10 * 1024 * 1024;
        const oversizedFile = selectedFiles.find(
          (file) => file.size > MAX_FILE_SIZE
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
                  jobId: workData?.jobId._id,
                },
                {
                  onUploadProgress: (progressEvent) => {
                    const percentCompleted = Math.round(
                      (progressEvent.loaded * 100) / (progressEvent.total || 1)
                    );
                    setUploadProgress((prev) => ({
                      ...prev,
                      [file.name]: percentCompleted,
                    }));
                  },
                }
              );
              return {
                fileName: file.name,
                fileUrl: res.data.url,
                fileSize: file.size,
              };
            })
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
        action === "submit" ? "ส่งงานเรียบร้อยแล้ว!" : "บันทึกข้อมูลสำเร็จ"
      );
      setIsEditingSubmission(false);
      setSelectedFiles([]);
      setUploadProgress({});
      if (action === "updateProgress") setProgressNote("");
      fetchWorkDetail();
    } catch (err: any) {
      toast.error(err.response?.data?.error || "เกิดข้อผิดพลาด");
    } finally {
      setLoading(false);
    }
  };

  const validateAndSetWorkLink = (val: string) => {
    setWorkLink(val);
    if (val && !isValidUrl(val)) {
      setLinkError("กรุณาใส่ลิงก์ที่ถูกต้อง");
    } else {
      setLinkError("");
    }
  };

  return {
    // Data
    workData,
    loading,

    // Progress state
    newProgress,
    setNewProgress,
    progressNote,
    setProgressNote,
    hasProgressChanges,
    isEditingProgress,
    setIsEditingProgress,

    // Submission state
    workLink,
    setWorkLink: validateAndSetWorkLink,
    linkError,
    setLinkError,
    selectedFiles,
    setSelectedFiles,
    existingFiles,
    setExistingFiles,
    isEditingSubmission,
    setIsEditingSubmission,
    uploadProgress,

    // Feedback state
    ownerFeedback,
    setOwnerFeedback,

    // UI state
    isJobDetailsOpen,
    setIsJobDetailsOpen,
    confirmCancel,
    setConfirmCancel,

    // Actions
    fetchWorkDetail,
    handleUpdateWork,
  };
}
