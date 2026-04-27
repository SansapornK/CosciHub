// src/app/(pages)/forgot-password/page.tsx
"use client";

import React, { useState } from "react";
import Link from "next/link";
import axios from "axios";
import { Mail, ArrowLeft, CheckCircle } from "lucide-react";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState("");

  const isValidEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isValidEmail) return;

    setIsLoading(true);
    setError("");

    try {
      await axios.post("/api/auth/forgot-password", { email });
      setIsSuccess(true);
    } catch (err: any) {
      setError(err.response?.data?.error || "เกิดข้อผิดพลาด กรุณาลองใหม่");
    } finally {
      setIsLoading(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="fixed inset-0 z-[200] bg-gray-50 flex items-center justify-center px-4 overflow-y-auto">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-lg p-8 text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-8 h-8 text-green-500" />
          </div>
          <h1 className="text-2xl font-bold text-gray-800 mb-2">
            ส่งลิงก์รีเซ็ตรหัสผ่านแล้ว
          </h1>
          <p className="text-gray-600 mb-6">
            หากอีเมล <span className="font-medium text-gray-800">{email}</span> มีอยู่ในระบบ
            คุณจะได้รับลิงก์สำหรับตั้งรหัสผ่านใหม่ภายในไม่กี่นาที
          </p>
          <p className="text-sm text-gray-500 mb-6">
            กรุณาตรวจสอบกล่องข้อความและโฟลเดอร์สแปม
          </p>
          <Link
            href="/auth?state=login"
            className="inline-flex items-center gap-2 text-primary-blue-500 hover:text-primary-blue-600 font-medium"
          >
            <ArrowLeft className="w-4 h-4" />
            กลับไปหน้าเข้าสู่ระบบ
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[200] bg-gray-50 flex items-center justify-center px-4 overflow-y-auto">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-lg p-8">
        <div className="text-center mb-4">
{/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/logo/cosci-hub-favicon.png"
            alt="COSCI Hub Logo"
            className="h-[40px] w-auto mx-auto mb-4"
          />
          <h1 className="text-2xl font-bold text-gray-800 mb-1">
            ลืมรหัสผ่าน?
          </h1>
          <p className="text-gray-600">
            กรอกอีเมลที่ใช้ลงทะเบียน <br/>เราจะส่งลิงก์สำหรับตั้งรหัสผ่านใหม่ให้คุณ
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              อีเมล
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="example@email.com"
                className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-xl text-sm">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={!isValidEmail || isLoading}
            className="w-full py-3 bg-primary-blue-500 hover:bg-primary-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-medium rounded-xl transition-colors flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <>
                <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                กำลังส่ง...
              </>
            ) : (
              "ส่งลิงก์รีเซ็ตรหัสผ่าน"
            )}
          </button>
        </form>

        <div className="mt-6 text-center">
          <Link
            href="/auth?state=login"
            className="inline-flex items-center gap-2 text-gray-500 hover:text-primary-blue-500 text-sm"
          >
            <ArrowLeft className="w-4 h-4" />
            กลับไปหน้าเข้าสู่ระบบ
          </Link>
        </div>
      </div>
    </div>
  );
}
