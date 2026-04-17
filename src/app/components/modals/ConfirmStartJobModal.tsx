"use client";

import React from "react";
import axios from "axios";
import { toast } from "react-hot-toast";
import { motion, AnimatePresence } from "framer-motion";

interface JobApplication {
  _id: string;
  jobTitle: string;
  contactInfo?: string[];
}

interface ConfirmStartJobModalProps {
  isOpen: boolean;
  app: JobApplication | null;
  onClose: () => void;
  onSuccess: () => void;
}

export default function ConfirmStartJobModal({
  isOpen,
  app,
  onClose,
  onSuccess,
}: ConfirmStartJobModalProps) {
  const handleConfirm = async () => {
    if (!app) return;
    try {
      await axios.patch(`/api/applications/${app._id}`, {
        action: "updateProgress",
        progress: 0,
      });
      toast.success("เริ่มงานเรียบร้อยแล้ว!");
      onSuccess();
      onClose();
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
              ยืนยันการเริ่มงาน
            </h3>
            <p className="text-sm text-gray-400 mb-6 font-medium">
              งาน: {app.jobTitle}
            </p>

            {/* ส่วนข้อมูลติดต่อ (Contact Info) ในสไตล์เดียวกับ Textarea/Toggle ของ Review Modal */}
            <div className="text-left p-5 bg-gray-50 border border-gray-100 rounded-2xl mb-3">
              <p className="text-[11px] font-medium text-blue-600 uppercase tracking-wider mb-1">
                ช่องทางการติดต่อผู้ว่าจ้าง
              </p>
              {app.contactInfo && app.contactInfo.length > 0 ? (
                <div className="flex flex-col gap-1">
                  {app.contactInfo.map((contact, index) => (
                    <p key={index} className="text-sm font-medium text-gray-700 break-words">
                      • {contact}
                    </p>
                  ))}
                </div>
              ) : (
                <p className="text-sm font-medium text-gray-400">
                  ไม่ได้ระบุช่องทางการติดต่อ
                </p>
              )}
            </div>

            <p className="text-[12px] text-gray-600 leading-relaxed mb-3 ">
              กรุณาตรวจสอบให้แน่ใจว่าได้คุยรายละเอียดกับผู้ว่าจ้างผ่านช่องทางข้างต้นเรียบร้อยแล้ว
              หากไม่ลงตัวสามารถยกเลิกได้
            </p>

            {/* Warning Message */}
            <div className="px-5 py-3 bg-amber-50 rounded-2xl mb-3 border border-amber-100 text-left">
              <p className="text-sm text-amber-600 leading-tight">
                ⚠️ เมื่อกดเริ่มงานแล้ว จะไม่สามารถยกเลิกใบสมัครได้
              </p>
            </div>

            {/* Action Buttons - ตามแบบ Review Modal */}
            <div className="flex flex-col gap-3">
              <button
                onClick={handleConfirm}
                className="w-full py-4 bg-[#0C5BEA] text-white font-black rounded-2xl shadow-xl shadow-blue-100 hover:bg-blue-700 transition-all active:scale-95"
              >
                ยืนยันการเริ่มงาน
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
