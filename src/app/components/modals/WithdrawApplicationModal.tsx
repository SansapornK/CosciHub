"use client";

import React from "react";
import axios from "axios";
import { toast } from "react-hot-toast";
import { motion, AnimatePresence } from "framer-motion";

interface JobApplication {
  _id: string;
  jobTitle: string;
}

interface WithdrawApplicationModalProps {
  isOpen: boolean;
  app: JobApplication | null;
  onClose: () => void;
  onSuccess: () => void;
}

export default function WithdrawApplicationModal({
  isOpen,
  app,
  onClose,
  onSuccess,
}: WithdrawApplicationModalProps) {
  const handleWithdraw = async () => {
    if (!app) return null;
    try {
      await axios.patch(`/api/applications/${app._id}`, {
        action: "withdraw",
      });
      toast.success("ยกเลิกการสมัครแล้ว");
      onClose();
      onSuccess();
    } catch (err: any) {
      toast.error(err.response?.data?.error || "เกิดข้อผิดพลาด");
    }
  };

  return (
    <AnimatePresence>
      {isOpen && app && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
          {/* Backdrop - ตามแบบ Review Modal */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-gray-900/40 backdrop-blur-sm"
          />
          {/* Modal Content - ตามแบบ Review Modal */}
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            className="relative bg-white w-full max-w-md rounded-[2.5rem] p-10 shadow-2xl text-center"
          >
            <h3 className="text-xl font-black text-gray-900 mb-2">
              ยกเลิกใบสมัคร ?
            </h3>
            <p className="text-sm text-gray-400 mb-3 font-medium">
              งาน: {app.jobTitle}
            </p>

            <div className="px-5 py-3 bg-amber-50 rounded-2xl mb-3 border border-amber-100 text-center">
              <p className="text-sm text-amber-600 leading-relaxed">
                คุณสามารถกลับมาสมัครใหม่ได้ภายหลัง <br /> หากผู้สมัครยังไม่ครบตามจำนวนที่กำหนด
              </p>
            </div>

            <div className="flex flex-col gap-3">
              <button
                onClick={handleWithdraw}
                className="flex-1 py-2.5 rounded-full bg-red-500 text-white text-sm font-semibold hover:bg-red-600 transition-colors"
              >
                ยืนยันการยกเลิก
              </button>
              <button
                onClick={onClose}
                className="text-xs font-bold text-gray-400 hover:text-gray-600 transition-all py-2"
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
