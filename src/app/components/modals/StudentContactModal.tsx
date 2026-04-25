"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Mail, Phone, MessageCircle } from "lucide-react";

// Helper function to get icon based on contact type
const getContactIcon = (contact: string) => {
  const lowerContact = contact.toLowerCase();
  if (lowerContact.includes("อีเมล") || lowerContact.includes("email")) {
    return <Mail className="w-4 h-4 text-primary-blue-500 flex-shrink-0" />;
  }
  if (lowerContact.includes("line") || lowerContact.includes("ไลน์")) {
    return <MessageCircle className="w-4 h-4 text-green-500 flex-shrink-0" />;
  }
  if (lowerContact.includes("โทร") || lowerContact.includes("phone") || lowerContact.includes("เบอร์")) {
    return <Phone className="w-4 h-4 text-orange-500 flex-shrink-0" />;
  }
  return <Mail className="w-4 h-4 text-gray-400 flex-shrink-0" />;
};

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
                <div className="flex flex-col gap-2">
                  {student.contactInfo.map((contact, index) => (
                    <div key={index} className="flex items-center gap-2">
                      {getContactIcon(contact)}
                      <p className="text-sm font-medium text-gray-700 break-words">
                        {contact}
                      </p>
                    </div>
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
