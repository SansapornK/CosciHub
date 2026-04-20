"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";

interface ConfirmationModalProps {
  isOpen: boolean;
  title: string;
  message?: string;
  confirmText?: string;
  cancelText?: string;
  variant?: "primary" | "danger";
  onConfirm: () => void;
  onClose: () => void;
  isLoading?: boolean;
}

export default function ConfirmationModal({
  isOpen,
  title,
  message,
  confirmText = "ยืนยัน",
  cancelText = "ยกเลิก",
  variant = "primary",
  onConfirm,
  onClose,
  isLoading = false,
}: ConfirmationModalProps) {
  const buttonStyles = {
    primary: "bg-[#0C5BEA] hover:bg-blue-700 text-white shadow-blue-100",
    danger: "bg-red-500 hover:bg-red-600 text-white shadow-red-100",
  };

  return (
    <AnimatePresence>
      {isOpen && (
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
            className="relative bg-white w-full max-w-sm rounded-3xl p-8 shadow-2xl text-center"
          >
            <h3 className="text-lg font-bold text-gray-900 mb-2">
              {title}
            </h3>
            {message && (
              <p className="text-sm text-gray-500 mb-6">
                {message}
              </p>
            )}

            <div className="flex gap-3">
              <button
                onClick={onClose}
                disabled={isLoading}
                className="flex-1 py-3 rounded-xl border border-gray-200 text-gray-600 text-sm font-semibold hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                {cancelText}
              </button>
              <button
                onClick={onConfirm}
                disabled={isLoading}
                className={`flex-1 py-3 rounded-xl text-sm font-semibold shadow-lg transition-all active:scale-95 disabled:opacity-50 ${buttonStyles[variant]}`}
              >
                {isLoading ? "กำลังดำเนินการ..." : confirmText}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
