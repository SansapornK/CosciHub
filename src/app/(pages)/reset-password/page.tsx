// src/app/(pages)/reset-password/page.tsx
"use client";

import React, { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import Image from "next/image";
import { useSearchParams, useRouter } from "next/navigation";
import axios from "axios";
import { Lock, Eye, EyeOff, CheckCircle, XCircle, AlertTriangle } from "lucide-react";

function ResetPasswordContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token");

  const [isValidating, setIsValidating] = useState(true);
  const [tokenStatus, setTokenStatus] = useState<"valid" | "invalid" | "expired" | "used" | null>(null);
  const [email, setEmail] = useState("");

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState("");

  // Validate token on mount
  useEffect(() => {
    const validateToken = async () => {
      if (!token) {
        setTokenStatus("invalid");
        setIsValidating(false);
        return;
      }

      try {
        const res = await axios.get(`/api/auth/reset-password?token=${token}`);
        if (res.data.valid) {
          setTokenStatus("valid");
          setEmail(res.data.email);
        }
      } catch (err: any) {
        const code = err.response?.data?.code;
        if (code === "expired") {
          setTokenStatus("expired");
        } else if (code === "used") {
          setTokenStatus("used");
        } else {
          setTokenStatus("invalid");
        }
      } finally {
        setIsValidating(false);
      }
    };

    validateToken();
  }, [token]);

  const isPasswordValid = newPassword.length >= 8;
  const isPasswordMatch = newPassword === confirmPassword && confirmPassword.length > 0;
  const canSubmit = isPasswordValid && isPasswordMatch;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!canSubmit) return;

    setIsLoading(true);
    setError("");

    try {
      await axios.post("/api/auth/reset-password", {
        token,
        newPassword,
      });
      setIsSuccess(true);

      // Redirect to login after 3 seconds
      setTimeout(() => {
        router.push("/auth?state=login");
      }, 3000);
    } catch (err: any) {
      setError(err.response?.data?.error || "เกิดข้อผิดพลาด กรุณาลองใหม่");
    } finally {
      setIsLoading(false);
    }
  };

  // Loading state
  if (isValidating) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-primary-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600">กำลังตรวจสอบลิงก์...</p>
        </div>
      </div>
    );
  }

  // Invalid token states
  if (tokenStatus !== "valid") {
    const statusConfig = {
      invalid: {
        icon: <XCircle className="w-16 h-16 text-red-500" />,
        title: "ลิงก์ไม่ถูกต้อง",
        description: "ลิงก์รีเซ็ตรหัสผ่านนี้ไม่ถูกต้อง กรุณาขอลิงก์ใหม่",
        bgColor: "bg-red-50",
      },
      expired: {
        icon: <AlertTriangle className="w-16 h-16 text-amber-500" />,
        title: "ลิงก์หมดอายุ",
        description: "ลิงก์รีเซ็ตรหัสผ่านนี้หมดอายุแล้ว กรุณาขอลิงก์ใหม่",
        bgColor: "bg-amber-50",
      },
      used: {
        icon: <AlertTriangle className="w-16 h-16 text-blue-500" />,
        title: "ลิงก์ถูกใช้งานแล้ว",
        description: "ลิงก์นี้ถูกใช้รีเซ็ตรหัสผ่านไปแล้ว หากต้องการเปลี่ยนรหัสผ่านอีกครั้ง กรุณาขอลิงก์ใหม่",
        bgColor: "bg-blue-50",
      },
    };

    const config = statusConfig[tokenStatus || "invalid"];

    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-lg overflow-hidden">
          <div className={`p-8 text-center ${config.bgColor}`}>
            <div className="flex justify-center mb-4">{config.icon}</div>
            <h1 className="text-2xl font-bold text-gray-800 mb-2">{config.title}</h1>
            <p className="text-gray-600">{config.description}</p>
          </div>
          <div className="p-6 bg-white text-center">
            <Link
              href="/forgot-password"
              className="inline-block w-full py-3 bg-primary-blue-500 hover:bg-primary-blue-600 text-white font-medium rounded-xl transition-colors text-center"
            >
              ขอลิงก์รีเซ็ตรหัสผ่านใหม่
            </Link>
            <Link
              href="/auth?state=login"
              className="block mt-4 text-gray-500 hover:text-primary-blue-500 text-sm"
            >
              กลับไปหน้าเข้าสู่ระบบ
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Success state
  if (isSuccess) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-lg p-8 text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-8 h-8 text-green-500" />
          </div>
          <h1 className="text-2xl font-bold text-gray-800 mb-2">
            รีเซ็ตรหัสผ่านสำเร็จ
          </h1>
          <p className="text-gray-600 mb-6">
            รหัสผ่านของคุณได้รับการเปลี่ยนแปลงเรียบร้อยแล้ว
          </p>
          <p className="text-sm text-gray-500 mb-4">
            กำลังนำคุณไปยังหน้าเข้าสู่ระบบ...
          </p>
          <div className="w-8 h-8 border-4 border-primary-blue-500 border-t-transparent rounded-full animate-spin mx-auto" />
        </div>
      </div>
    );
  }

  // Reset password form
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-lg p-8">
        <div className="text-center mb-8">
          <Image
            src="/logo/favicon.ico"
            alt="COSCI Hub Logo"
            width={50}
            height={50}
            className="mx-auto mb-4"
          />
          <h1 className="text-2xl font-bold text-gray-800 mb-2">
            ตั้งรหัสผ่านใหม่
          </h1>
          <p className="text-gray-600">
            สำหรับบัญชี <span className="font-medium text-gray-800">{email}</span>
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* New Password */}
          <div>
            <label
              htmlFor="newPassword"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              รหัสผ่านใหม่
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type={showPassword ? "text" : "password"}
                id="newPassword"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="อย่างน้อย 8 ตัวอักษร"
                className="w-full pl-10 pr-12 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-blue-500 focus:border-transparent"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
            {newPassword && !isPasswordValid && (
              <p className="text-xs text-red-500 mt-1">
                รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร
              </p>
            )}
          </div>

          {/* Confirm Password */}
          <div>
            <label
              htmlFor="confirmPassword"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              ยืนยันรหัสผ่านใหม่
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type={showConfirmPassword ? "text" : "password"}
                id="confirmPassword"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="กรอกรหัสผ่านอีกครั้ง"
                className="w-full pl-10 pr-12 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-blue-500 focus:border-transparent"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
            {confirmPassword && !isPasswordMatch && (
              <p className="text-xs text-red-500 mt-1">รหัสผ่านไม่ตรงกัน</p>
            )}
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-xl text-sm">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={!canSubmit || isLoading}
            className="w-full py-3 bg-primary-blue-500 hover:bg-primary-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-medium rounded-xl transition-colors flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <>
                <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                กำลังดำเนินการ...
              </>
            ) : (
              "ตั้งรหัสผ่านใหม่"
            )}
          </button>
        </form>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="w-12 h-12 border-4 border-primary-blue-500 border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <ResetPasswordContent />
    </Suspense>
  );
}
