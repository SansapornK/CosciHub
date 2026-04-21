// src/app/(pages)/settings/change-password/page.tsx
"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Eye, EyeOff, Save } from "lucide-react";
import axios from "axios";
import toast from "react-hot-toast";
import Loading from "@/app/components/common/Loading";

export default function ChangePasswordPage() {
  const { status } = useSession();
  const router = useRouter();
  const [isSaving, setIsSaving] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);

  const [formData, setFormData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const [validation, setValidation] = useState({
    currentPassword: { error: "" },
    newPassword: { error: "" },
    confirmPassword: { error: "" },
  });

  // Redirect to login if not authenticated
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth?state=login");
    }
  }, [status, router]);

  // Validate password
  useEffect(() => {
    const { newPassword, confirmPassword } = formData;

    // Reset errors
    setValidation((prev) => ({
      ...prev,
      newPassword: { error: "" },
      confirmPassword: { error: "" },
    }));

    if (newPassword && newPassword.length < 8) {
      setValidation((prev) => ({
        ...prev,
        newPassword: { error: "รหัสผ่านต้องมีความยาวอย่างน้อย 8 ตัวอักษร" },
      }));
    }

    if (confirmPassword && newPassword && newPassword !== confirmPassword) {
      setValidation((prev) => ({
        ...prev,
        confirmPassword: { error: "รหัสผ่านไม่ตรงกัน" },
      }));
    }
  }, [formData.newPassword, formData.confirmPassword]);

  // Check if form is valid
  const isFormValid = () => {
    if (
      !formData.currentPassword ||
      !formData.newPassword ||
      !formData.confirmPassword
    )
      return false;
    if (formData.newPassword.length < 8) return false;
    if (formData.newPassword !== formData.confirmPassword) return false;
    if (
      validation.newPassword.error ||
      validation.confirmPassword.error
    )
      return false;
    return true;
  };

  // Handle input change
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Handle save
  const handleSave = async () => {
    if (!isFormValid()) {
      toast.error("กรุณากรอกข้อมูลให้ครบถ้วน");
      return;
    }

    setIsSaving(true);

    try {
      await axios.post("/api/user/change-password", {
        currentPassword: formData.currentPassword,
        newPassword: formData.newPassword,
      });

      toast.success("เปลี่ยนรหัสผ่านเรียบร้อยแล้ว");
      router.push("/settings");
    } catch (error: any) {
      console.error("Error changing password:", error);
      const errorMessage =
        error.response?.data?.error || "ไม่สามารถเปลี่ยนรหัสผ่านได้";
      toast.error(errorMessage);

      // If current password is wrong, show error
      if (error.response?.status === 400) {
        setValidation((prev) => ({
          ...prev,
          currentPassword: { error: errorMessage },
        }));
      }
    } finally {
      setIsSaving(false);
    }
  };

  if (status === "loading") {
    return (
      <div className="flex flex-col items-center justify-center py-10 h-screen">
        <Loading size="large" color="primary" />
        <p className="mt-4 text-gray-500">กำลังโหลดข้อมูล...</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-7 pt-6">
      {/* Header */}
      <div className="flex items-center mb-5">
        <Link
          href="/settings"
          className="p-2 hover:bg-gray-100 rounded-full transition-colors"
        >
          <ArrowLeft className="w-6 h-6 text-gray-600" />
        </Link>
        <h2 className="text-2xl font-bold text-gray-800">เปลี่ยนรหัสผ่าน</h2>
      </div>

      {/* Form */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <div className="flex flex-col gap-5">
          {/* Current Password */}
          <div>
            <label
              htmlFor="currentPassword"
              className="block text-gray-700 text-sm mb-1 font-medium"
            >
              รหัสผ่านปัจจุบัน
            </label>
            <div className="relative">
              <input
                type={showCurrentPassword ? "text" : "password"}
                id="currentPassword"
                name="currentPassword"
                value={formData.currentPassword}
                onChange={handleChange}
                className={`input pr-10 ${validation.currentPassword.error ? "border-red-400" : ""}`}
                placeholder="กรอกรหัสผ่านปัจจุบัน"
              />
              <button
                type="button"
                onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showCurrentPassword ? (
                  <EyeOff className="w-5 h-5" />
                ) : (
                  <Eye className="w-5 h-5" />
                )}
              </button>
            </div>
            {validation.currentPassword.error && (
              <p className="text-red-500 text-xs mt-1">
                {validation.currentPassword.error}
              </p>
            )}
          </div>

          <hr className="border-gray-100" />

          {/* New Password */}
          <div>
            <label
              htmlFor="newPassword"
              className="block text-gray-700 text-sm mb-1 font-medium"
            >
              รหัสผ่านใหม่
            </label>
            <div className="relative">
              <input
                type={showNewPassword ? "text" : "password"}
                id="newPassword"
                name="newPassword"
                value={formData.newPassword}
                onChange={handleChange}
                className={`input pr-10 ${validation.newPassword.error ? "border-red-400" : ""}`}
                placeholder="กำหนดรหัสผ่านใหม่ (อย่างน้อย 8 ตัวอักษร)"
              />
              <button
                type="button"
                onClick={() => setShowNewPassword(!showNewPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showNewPassword ? (
                  <EyeOff className="w-5 h-5" />
                ) : (
                  <Eye className="w-5 h-5" />
                )}
              </button>
            </div>
            {validation.newPassword.error && (
              <p className="text-red-500 text-xs mt-1">
                {validation.newPassword.error}
              </p>
            )}
          </div>

          {/* Confirm Password */}
          <div>
            <label
              htmlFor="confirmPassword"
              className="block text-gray-700 text-sm mb-1 font-medium"
            >
              ยืนยันรหัสผ่านใหม่
            </label>
            <input
              type={showNewPassword ? "text" : "password"}
              id="confirmPassword"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              className={`input ${validation.confirmPassword.error ? "border-red-400" : ""}`}
              placeholder="กรอกรหัสผ่านใหม่อีกครั้ง"
            />
            {validation.confirmPassword.error && (
              <p className="text-red-500 text-xs mt-1">
                {validation.confirmPassword.error}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Save Button */}
      <div className="flex justify-end gap-3 mt-5">
        <Link
          href="/settings"
          className="px-6 py-2.5 text-gray-600 hover:bg-gray-100 rounded-xl font-medium transition-colors"
        >
          ยกเลิก
        </Link>
        <button
          onClick={handleSave}
          disabled={!isFormValid() || isSaving}
          className="flex items-center gap-2 px-6 py-2.5 bg-primary-blue-500 hover:bg-primary-blue-600 disabled:bg-gray-300 text-white font-medium rounded-xl transition-colors"
        >
          {isSaving ? (
            <span className="inline-block h-5 w-5 border-2 border-white border-r-transparent rounded-full animate-spin"></span>
          ) : (
            <Save className="w-5 h-5" />
          )}
          เปลี่ยนรหัสผ่าน
        </button>
      </div>
    </div>
  );
}
