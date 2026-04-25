// src/app/(pages)/settings/page.tsx
"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Shield, UserPen, KeyRound, ChevronRight, Info, Clock, Mail, CheckCircle, AlertCircle, Plus, X } from "lucide-react";
import Loading from "@/app/components/common/Loading";
import LogOutButton from "../../components/buttons/LogOutButton";
import axios from "axios";


interface SettingsMenuItem {
  name: string;
  description: string;
  path: string;
  icon: React.ElementType;
}

const settingsMenuItems: SettingsMenuItem[] = [
  {
    name: "ข้อตกลงและเงื่อนไขการใช้งาน",
    description: "ดูข้อกำหนดและเงื่อนไขของเรา",
    path: "/settings/privacy-policy",
    icon: Shield,
  },
  {
    name: "แก้ไขข้อมูลส่วนตัว",
    description: "แก้ไขชื่อและช่องทางการติดต่อของคุณ",
    path: "/settings/edit-profile",
    icon: UserPen,
  },
  {
    name: "เปลี่ยนรหัสผ่าน",
    description: "อัปเดตรหัสผ่านเพื่อความปลอดภัยของบัญชี",
    path: "/settings/change-password",
    icon: KeyRound,
  },
  {
    name: "เกี่ยวกับเรา",
    description: "ทำความรู้จัก COSCI Hub และคณะผู้จัดทำ",
    path: "/settings/about-us",
    icon: Info,
  },
];

export default function SettingsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [resendLoading, setResendLoading] = useState(false);
  const [resendMessage, setResendMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [teacherEmails, setTeacherEmails] = useState<string[]>(["", ""]);

  const isAlumniPending =
    session?.user?.role === "alumni" &&
    session?.user?.verificationStatus === "pending";

  const handleEmailChange = (index: number, value: string) => {
    const newEmails = [...teacherEmails];
    newEmails[index] = value;
    setTeacherEmails(newEmails);
  };

  const addEmailField = () => {
    if (teacherEmails.length < 3) {
      setTeacherEmails([...teacherEmails, ""]);
    }
  };

  const removeEmailField = (index: number) => {
    if (teacherEmails.length > 2) {
      const newEmails = teacherEmails.filter((_, i) => i !== index);
      setTeacherEmails(newEmails);
    }
  };

  const isValidEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const validEmails = teacherEmails.filter((email) => isValidEmail(email.trim()));
  const canSubmit = validEmails.length >= 2;

  const handleResendVerification = async () => {
    if (!canSubmit) return;

    setResendLoading(true);
    setResendMessage(null);

    try {
      const res = await axios.post("/api/auth/resend-verification", {
        teacherEmails: validEmails,
      });
      setResendMessage({
        type: "success",
        text: `ส่งอีเมลยืนยันไปยังอาจารย์ ${res.data.teacherCount} ท่านเรียบร้อยแล้ว`,
      });
      // Clear email inputs after success
      setTeacherEmails(["", ""]);
    } catch (err: any) {
      setResendMessage({
        type: "error",
        text: err.response?.data?.error || "เกิดข้อผิดพลาด กรุณาลองใหม่",
      });
    } finally {
      setResendLoading(false);
    }
  };

  // Redirect to login if not authenticated
  React.useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth?state=login");
    }
  }, [status, router]);

  if (status === "loading") {
    return (
      <div className="flex flex-col items-center justify-center py-10 h-screen">
        <Loading size="large" color="primary" />
        <p className="mt-4 text-gray-500">กำลังโหลดข้อมูล...</p>
      </div>
    );
  }

  if (status === "unauthenticated") {
    return null;
  }

  return (
    <div className="flex flex-col gap-6 pb-10 max-w-7xl mx-auto w-full min-h-[calc(100vh-160px)]">
      {/* Header */}
      <div className="flex justify-between items-center mt-8">
        <h2 className="text-3xl font-black text-[#0C5BEA] flex items-center gap-3">
          ตั้งค่า
        </h2>
      </div>

      {/* Verification Banner for Pending Alumni */}
      {isAlumniPending && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center shrink-0">
              <Clock className="w-5 h-5 text-amber-600" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-amber-800 mb-1">
                บัญชีของคุณรอการยืนยันจากอาจารย์
              </h3>
              <p className="text-sm text-amber-700 mb-4">
                คุณจะสามารถโพสต์งานได้หลังจากอาจารย์ยืนยันตัวตนของคุณแล้ว
              </p>

              {/* Teacher Email Inputs */}
              <div className="space-y-3 mb-4">
                <p className="text-sm font-medium text-amber-800">
                  กรอกอีเมลอาจารย์ที่จะรับรอง (อย่างน้อย 2 ท่าน)
                </p>
                {teacherEmails.map((email, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => handleEmailChange(index, e.target.value)}
                      placeholder={`อีเมลอาจารย์ท่านที่ ${index + 1}`}
                      className={`flex-1 px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 ${
                        email && !isValidEmail(email.trim())
                          ? "border-red-300 bg-red-50"
                          : "border-amber-200 bg-white"
                      }`}
                    />
                    {teacherEmails.length > 2 && (
                      <button
                        type="button"
                        onClick={() => removeEmailField(index)}
                        className="p-2 text-amber-600 hover:text-red-600 transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}
                {teacherEmails.length < 3 && (
                  <button
                    type="button"
                    onClick={addEmailField}
                    className="inline-flex items-center gap-1 text-sm text-amber-700 hover:text-amber-800"
                  >
                    <Plus className="w-4 h-4" />
                    เพิ่มอีเมลอาจารย์
                  </button>
                )}
              </div>

              {resendMessage && (
                <div
                  className={`flex items-center gap-2 text-sm mb-3 ${
                    resendMessage.type === "success"
                      ? "text-green-700"
                      : "text-red-600"
                  }`}
                >
                  {resendMessage.type === "success" ? (
                    <CheckCircle className="w-4 h-4" />
                  ) : (
                    <AlertCircle className="w-4 h-4" />
                  )}
                  {resendMessage.text}
                </div>
              )}

              <button
                onClick={handleResendVerification}
                disabled={resendLoading || !canSubmit}
                className="inline-flex items-center gap-2 px-4 py-2 bg-amber-600 hover:bg-amber-700 disabled:bg-amber-400 disabled:cursor-not-allowed text-white text-sm font-medium rounded-lg transition-colors"
              >
                <Mail className="w-4 h-4" />
                {resendLoading ? "กำลังส่ง..." : "ส่งอีเมลยืนยัน"}
              </button>
              {!canSubmit && (
                <p className="text-xs text-amber-600 mt-2">
                  * กรุณากรอกอีเมลอาจารย์ที่ถูกต้องอย่างน้อย 2 ท่าน
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Settings Menu */}
      <div className="bg-white justify-center rounded-2xl shadow-sm border border-gray-100 w-full">
        {settingsMenuItems.map((item, index) => (
          <Link
            key={item.path}
            href={item.path}
            className={`flex items-center justify-between p-4 hover:bg-gray-50 transition-colors ${
              index !== settingsMenuItems.length - 1
                ? "border-b border-gray-100"
                : ""
            }`}
          >
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-primary-blue-50 flex items-center justify-center">
                <item.icon className="w-5 h-5 text-primary-blue-500" />
              </div>
              <div>
                <p className="text-s font-medium text-gray-800">{item.name}</p>
                <p className="text-xs text-gray-400">{item.description}</p>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-gray-300" />
          </Link>
        ))}
      </div>

      {/* Logout Button & User Info */}
      <div className="flex flex-col items-center mt-50 pt-10">
        <LogOutButton />
        <p className="text-[9px] font-medium text-gray-300 uppercase mt-4">
            COSCI HUB © 2026
          </p>        
      </div>
    </div>
  );
}
