"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { HelpCircle } from "lucide-react";

interface InfoModalProps {
  isOpen: boolean;
  title: string;
  children: React.ReactNode;
  buttonText?: string;
  onClose: () => void;
  onConfirm?: () => void;
  confirmText?: string;
  maxWidth?: string;
}

export default function InfoModal({
  isOpen,
  title,
  children,
  buttonText = "เข้าใจแล้ว",
  onClose,
  onConfirm,
  confirmText = "ยืนยัน",
  maxWidth = "max-w-sm",
}: InfoModalProps) {
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
            className={`relative bg-white w-full ${maxWidth} rounded-3xl p-6 shadow-2xl max-h-[85vh] flex flex-col`}
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-blue-100 rounded-xl">
                <HelpCircle className="w-5 h-5 text-blue-600" />
              </div>
              <h3 className="text-lg font-bold text-gray-900">{title}</h3>
            </div>

            <div className="text-sm text-gray-600 space-y-2 mb-6 overflow-y-auto flex-1">
              {children}
            </div>

            {onConfirm ? (
              <div className="flex gap-3">
                <button
                  onClick={onClose}
                  className="flex-1 py-3 rounded-xl border border-gray-200 text-gray-600 text-sm font-semibold hover:bg-gray-50 transition-colors"
                >
                  {buttonText}
                </button>
                <button
                  onClick={onConfirm}
                  className="flex-1 py-3 rounded-xl bg-[#0C5BEA] hover:bg-blue-700 text-white text-sm font-semibold shadow-lg shadow-blue-100 transition-all active:scale-95"
                >
                  {confirmText}
                </button>
              </div>
            ) : (
              <button
                onClick={onClose}
                className="w-full py-3 rounded-xl bg-[#0C5BEA] hover:bg-blue-700 text-white text-sm font-semibold shadow-lg shadow-blue-100 transition-all active:scale-95"
              >
                {buttonText}
              </button>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
