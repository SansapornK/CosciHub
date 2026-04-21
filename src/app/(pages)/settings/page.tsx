// src/app/(pages)/settings/page.tsx
"use client";

import React from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Shield, UserPen, KeyRound, ChevronRight } from "lucide-react";
import Loading from "@/app/components/common/Loading";
import LogOutButton from "../../components/buttons/LogOutButton";


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
    description: "แก้ไขชื่อ อีเมล และช่องทางการติดต่อของคุณ",
    path: "/settings/edit-profile",
    icon: UserPen,
  },
  {
    name: "เปลี่ยนรหัสผ่าน",
    description: "อัปเดตรหัสผ่านเพื่อความปลอดภัยของบัญชี",
    path: "/settings/change-password",
    icon: KeyRound,
  },
];

export default function SettingsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

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
