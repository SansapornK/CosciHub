"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import {
  Shield,
  UserPen,
  KeyRound,
  ChevronRight,
  Info,
  Clock,
  Mail,
  CheckCircle,
  AlertCircle,
  Plus,
  X,
} from "lucide-react";
import Loading from "@/app/components/common/Loading";
import LogOutButton from "../../components/buttons/LogOutButton";
import axios from "axios";

interface SettingsMenuItem {
  name: string;
  description: string;
  path: string;
  icon: React.ElementType;
  color: string;
  bg: string;
}

const settingsMenuItems: SettingsMenuItem[] = [
  {
    name: "ข้อตกลงและเงื่อนไขการใช้งาน",
    description: "ดูข้อกำหนดและเงื่อนไขของเรา",
    path: "/settings/privacy-policy",
    icon: Shield,
    color: "text-violet-500",
    bg: "bg-violet-50",
  },
  {
    name: "แก้ไขข้อมูลส่วนตัว",
    description: "แก้ไขชื่อและช่องทางการติดต่อของคุณ",
    path: "/settings/edit-profile",
    icon: UserPen,
    color: "text-blue-500",
    bg: "bg-blue-50",
  },
  {
    name: "เปลี่ยนรหัสผ่าน",
    description: "อัปเดตรหัสผ่านเพื่อความปลอดภัยของบัญชี",
    path: "/settings/change-password",
    icon: KeyRound,
    color: "text-emerald-500",
    bg: "bg-emerald-50",
  },
  {
    name: "เกี่ยวกับเรา",
    description: "ทำความรู้จัก COSCI Hub และคณะผู้จัดทำ",
    path: "/settings/about-us",
    icon: Info,
    color: "text-orange-400",
    bg: "bg-orange-50",
  },
];

export default function SettingsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [resendLoading, setResendLoading] = useState(false);
  const [resendMessage, setResendMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);
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
    if (teacherEmails.length < 3) setTeacherEmails([...teacherEmails, ""]);
  };

  const removeEmailField = (index: number) => {
    if (teacherEmails.length > 2) {
      const newEmails = teacherEmails.filter((_, i) => i !== index);
      setTeacherEmails(newEmails);
    }
  };

  const isValidEmail = (email: string) =>
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const validEmails = teacherEmails.filter((email) =>
    isValidEmail(email.trim()),
  );
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

  React.useEffect(() => {
    if (status === "unauthenticated") router.push("/auth?state=login");
  }, [status, router]);

  if (status === "loading") {
    return (
      <div className="flex flex-col items-center justify-center h-screen">
        <Loading size="large" color="primary" />
        <p className="mt-4 text-gray-500 text-sm">กำลังโหลดข้อมูล...</p>
      </div>
    );
  }

  if (status === "unauthenticated") return null;

  return (
    <div className="min-h-screen bg-gray-50/50 pb-20">
      <div className="max-w-xl md:max-w-7xl mx-auto px-4 pt-10 pb-6 flex flex-col gap-2">
        {/* ── Header ── */}
        <div>
          <h2 className="text-3xl font-black text-[#0C5BEA]">ตั้งค่า</h2>
        </div>

        {/* ── Verification Banner ── */}
        {isAlumniPending && (
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-xl bg-amber-100 flex items-center justify-center shrink-0">
                <Clock className="w-4 h-4 text-amber-600" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-amber-800 text-sm mb-0.5">
                  รอการยืนยันจากอาจารย์
                </h3>
                <p className="text-xs text-amber-600 mb-4 leading-relaxed">
                  คุณจะโพสต์งานได้หลังจากอาจารย์ยืนยันตัวตนแล้ว
                </p>

                <p className="text-xs font-semibold text-amber-800 mb-2">
                  กรอกอีเมลอาจารย์ที่จะรับรอง (อย่างน้อย 2 ท่าน)
                </p>

                <div className="space-y-2 mb-3">
                  {teacherEmails.map((email, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <input
                        type="email"
                        value={email}
                        onChange={(e) =>
                          handleEmailChange(index, e.target.value)
                        }
                        placeholder={`อีเมลอาจารย์ท่านที่ ${index + 1}`}
                        className={`flex-1 px-3 py-2.5 text-sm border rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-400 ${
                          email && !isValidEmail(email.trim())
                            ? "border-red-300 bg-red-50"
                            : "border-amber-200 bg-white"
                        }`}
                      />
                      {teacherEmails.length > 2 && (
                        <button
                          type="button"
                          onClick={() => removeEmailField(index)}
                          className="p-2 text-amber-400 hover:text-red-500 transition-colors"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>

                {teacherEmails.length < 3 && (
                  <button
                    type="button"
                    onClick={addEmailField}
                    className="inline-flex items-center gap-1 text-xs text-amber-700 font-semibold mb-3"
                  >
                    <Plus className="w-3.5 h-3.5" /> เพิ่มอีเมลอาจารย์
                  </button>
                )}

                {resendMessage && (
                  <div
                    className={`flex items-start gap-2 text-xs mb-3 ${
                      resendMessage.type === "success"
                        ? "text-green-700"
                        : "text-red-600"
                    }`}
                  >
                    {resendMessage.type === "success" ? (
                      <CheckCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                    ) : (
                      <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                    )}
                    {resendMessage.text}
                  </div>
                )}

                <button
                  onClick={handleResendVerification}
                  disabled={resendLoading || !canSubmit}
                  className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-amber-500 hover:bg-amber-600 disabled:bg-amber-300 disabled:cursor-not-allowed text-white text-sm font-semibold rounded-xl transition-all active:scale-95"
                >
                  <Mail className="w-4 h-4" />
                  {resendLoading ? "กำลังส่ง..." : "ส่งอีเมลยืนยัน"}
                </button>

                {!canSubmit && (
                  <p className="text-[11px] text-amber-500 mt-2">
                    * กรุณากรอกอีเมลอาจารย์ที่ถูกต้องอย่างน้อย 2 ท่าน
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ── Settings Menu ── */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          {settingsMenuItems.map((item, index) => (
            <Link
              key={item.path}
              href={item.path}
              className={`flex items-center justify-between px-4 py-4 md:px-6 md:py-5 active:bg-gray-50 hover:bg-gray-50 transition-colors ${
                index !== settingsMenuItems.length - 1
                  ? "border-b border-gray-100"
                  : ""
              }`}
            >
              <div className="flex items-center gap-3.5 md:gap-4">
                <div
                  className={`w-9 h-9 md:w-12 md:h-12 rounded-xl ${item.bg} flex items-center justify-center shrink-0`}
                >
                  <item.icon
                    className={`w-4 h-4 md:w-5 md:h-5 ${item.color}`}
                  />
                </div>
                <div>
                  <p className="text-sm md:text-base font-semibold text-gray-800">
                    {item.name}
                  </p>
                  <p className="text-[11px] md:text-xs text-gray-400 mt-0.5">
                    {item.description}
                  </p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 md:w-5 md:h-5 text-gray-300 shrink-0 ml-2" />
            </Link>
          ))}
        </div>

        {/* ── Logout ── */}
        <div className="flex flex-col items-center pt-6 gap-3">
          <LogOutButton />
          <p className="text-[10px] font-medium text-gray-300 uppercase tracking-widest">
            COSCI HUB © 2026
          </p>
        </div>
      </div>
    </div>
  );
}
