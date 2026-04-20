"use client";

import React from "react";
import axios from "axios";
import { toast } from "react-hot-toast";
import { motion, AnimatePresence } from "framer-motion";

interface Applicant {
  _id: string;
  applicantName: string;
  jobTitle?: string;
}

interface EmployerWithdrawModalProps {
  isOpen: boolean;
  applicant: Applicant | null;
  onClose: () => void;
  onSuccess: () => void;
}

export default function EmployerWithdrawModal({
  isOpen,
  applicant,
  onClose,
  onSuccess,
}: EmployerWithdrawModalProps) {
  const [isLoading, setIsLoading] = React.useState(false);

  const handleWithdraw = async () => {
    if (!applicant) return;
    setIsLoading(true);
    try {
      await axios.patch(`/api/applications/${applicant._id}`, {
        action: "employerWithdraw",
      });
      toast.success(`ยกเลิกการจ้าง ${applicant.applicantName} แล้ว`);
      onClose();
      onSuccess();
    } catch (err: any) {
      toast.error(err.response?.data?.error || "เกิดข้อผิดพลาด");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && applicant && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-gray-900/40 backdrop-blur-sm"
          />
          {/* Modal Content */}
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            className="relative bg-white w-full max-w-md rounded-[2.5rem] p-10 shadow-2xl text-center"
          >
            <div className="w-16 h-16 bg-red-50 text-red-500 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-8 w-8"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
            </div>

            <h3 className="text-xl font-black text-gray-900 mb-2">
              ยกเลิกการจ้างนิสิต?
            </h3>
            <p className="text-sm text-gray-600 mb-1 font-medium">
              {applicant.applicantName}
            </p>
            {applicant.jobTitle && (
              <p className="text-xs text-gray-400 mb-6">งาน: {applicant.jobTitle}</p>
            )}

            <div className="px-5 py-4 bg-amber-50 rounded-2xl mb-6 border border-amber-100">
              <p className="text-sm text-amber-700 leading-relaxed">
                การยกเลิกนี้จะทำให้จำนวนคนที่รับลดลง<br />
                และอาจทำให้งานกลับไปประกาศที่หน้าค้นหางาน
              </p>
            </div>

            <div className="flex flex-col gap-3">
              <button
                onClick={handleWithdraw}
                disabled={isLoading}
                className="w-full py-4 bg-red-500 text-white font-black rounded-2xl shadow-xl shadow-red-100 hover:bg-red-600 transition-all active:scale-95 disabled:opacity-50"
              >
                {isLoading ? "กำลังยกเลิก..." : "ยืนยันการยกเลิก"}
              </button>
              <button
                onClick={onClose}
                disabled={isLoading}
                className="text-xs font-bold text-gray-400 hover:text-gray-600 transition-all py-2 disabled:opacity-50"
              >
                ปิดหน้าต่างนี้
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
