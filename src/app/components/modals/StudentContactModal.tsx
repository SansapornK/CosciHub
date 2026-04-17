"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";

interface StudentContact {
  applicantName: string;
  contactInfo?: string[];
}

interface StudentContactModalProps {
  isOpen: boolean;
  student: StudentContact | null;
  onClose: () => void;
}

export default function StudentContactModal({
  isOpen,
  student,
  onClose,
}: StudentContactModalProps) {
  return (
    <AnimatePresence>
      {isOpen && student && (
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
            <h3 className="text-xl font-black text-gray-900 mb-2">
              ข้อมูลการติดต่อ
            </h3>
            <p className="text-sm text-gray-400 mb-6 font-medium">
              {student.applicantName}
            </p>

            {/* ส่วนข้อมูลติดต่อ */}
            <div className="text-left p-5 bg-gray-50 border border-gray-100 rounded-2xl mb-6">
              <p className="text-[11px] font-medium text-blue-600 uppercase tracking-wider mb-2">
                ช่องทางการติดต่อ
              </p>
              {student.contactInfo && student.contactInfo.length > 0 ? (
                <div className="flex flex-col gap-1">
                  {student.contactInfo.map((contact, index) => (
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

            {/* Close Button */}
            <button
              onClick={onClose}
              className="text-xs font-bold text-gray-400 hover:text-gray-600 transition-all py-2"
            >
              ปิดหน้าต่างนี้
            </button>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
