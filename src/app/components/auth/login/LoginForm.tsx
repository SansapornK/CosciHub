// src/app/components/auth/login/LoginForm.tsx
'use client';

import axios from "axios";
import Link from "next/link";
import { signIn } from "next-auth/react";
import React, { useState, useEffect } from "react";
import Image from "next/image";
import { ChevronLeft } from "lucide-react";


interface LoginFormProps {
  onRegisterClick: () => void;
  callbackUrl?: string;
}

function LoginForm({ onRegisterClick, callbackUrl }: LoginFormProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState(""); // เพิ่ม state สำหรับรหัสผ่าน
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); // ป้องกันการ reload หน้า
    setError(""); // เคลียร์ข้อความผิดพลาดเดิม
    setIsLoading(true); // แสดงสถานะกำลังโหลด

    if (!email.trim() || !password.trim()) {
      setError("กรุณากรอกอีเมลและรหัสผ่าน");
      setIsLoading(false);
      return;
    }

    try {
      // ใช้ NextAuth เพื่อล็อกอินด้วย credentials (email และ password)
      const result = await signIn("credentials", {
        email: email,
        password: password,
        redirect: false, // ไม่ redirect อัตโนมัติ
        callbackUrl: callbackUrl || "/", // หน้าที่ต้องการไปหลังจากล็อกอินสำเร็จ
      });

      if (!result?.error) {
        // ล็อกอินสำเร็จ
       window.location.href = result.url || callbackUrl || "/";
      } else {
        // ล็อกอินไม่สำเร็จ
        setError("อีเมลหรือรหัสผ่านไม่ถูกต้อง"); // ข้อความผิดพลาดทั่วไปเพื่อความปลอดภัย
        console.error("Login error:", result.error);
      }
    } catch (err) {
      console.error("An unexpected error occurred during login:", err);
      setError("เกิดข้อผิดพลาดไม่คาดคิด กรุณาลองใหม่ภายหลัง");
    } finally {
      setIsLoading(false); // ซ่อนสถานะกำลังโหลด
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen min-w-screen bg-white p-4 relative">
      
      <div className="absolute top-6 left-6">
        <Link 
          href="/" 
          className="flex items-center text-gray-400 hover:text-primary-blue-500 transition-colors text-sm font-medium group">
          <ChevronLeft className="w-5 h-5 mr-1 group-hover:-translate-x-1 transition-transform" />
            กลับหน้าหลัก
        </Link>
      </div>

      <div className="flex flex-col items-center mb-8">

        {/* โลโก้ COSCI Hub */}
        <Image src="/logo/favicon.ico" alt="cosci hub logo" width={50} height={50} className="h-[50px] w-auto mb-5" priority/>
        {/* <img src="/logo/favicon.ico" alt="cosci hub logo" className="h-[50px]" /> */}

        <h1 className="text-2xl font-semibold text-gray-800">
          ยินดีต้อนรับสู่ COSCI Hub
        </h1>
      </div>

      {/* <div className="w-full max-w-sm bg-white p-8 rounded-lg shadow-md"> */}
        <form className="flex flex-col gap-6" onSubmit={handleSubmit}>
          {/* Email Field */}
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
              อีเมล
            </label>
            <div className="relative">
              <input
                
                id="email"
                type="email"
                className="w-full pr-4 py-2 pl-10 bg-secondary-gray border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="กรอกอีเมลของคุณ"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
                <polyline points="22,6 12,13 2,6"></polyline>
              </svg>
            </div>
          </div>

          {/* Password Field */}
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
              รหัสผ่าน
            </label>
            <div className="relative">
              <input
                id="password"
                type="password"
                className="w-full pr-4 py-2 pl-10 bg-secondary-gray border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="กรอกรหัสผ่าน"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
              </svg>
            </div>
          </div>

          {/* Forgot Password Link */}
          <div className="text-right -mt-2">
            <Link href="/forgot-password">
              <span className="text-sm text-blue-600 hover:text-blue-500 hover:underline">
                ลืมรหัสผ่าน?
              </span>
            </Link>
          </div>

          {/* Error Message */}
          {error && (
            <p className="text-sm text-red-600 text-center">{error}</p>
          )}

          {/* Login Button */}
          <button
            type="submit"
            className={`w-full bg-blue-600 text-white py-2 px-50 rounded-md hover:bg-blue-700 transition duration-300 flex items-center justify-center ${
              isLoading ? 'opacity-70 cursor-not-allowed' : ''
            }`}
            disabled={isLoading}
          >
            {isLoading && (
              <span className="inline-block h-4 w-4 border-2 border-white border-r-transparent rounded-full animate-spin mr-2"></span>
            )}
            เข้าสู่ระบบ
          </button>

          {/* Register Link */}
          <div className="text-center text-sm mt-4">
            <p className="text-gray-600">
              ยังไม่มีบัญชีใช่ไหม?{" "}
              <button
                type="button"
                className="text-blue-600 hover:text-blue-500 hover:underline font-medium"
                onClick={onRegisterClick}
              >
                ลงทะเบียน
              </button>
            </p>
          </div>
        </form>
      {/* </div> */}
    </div>
  );
}

export default LoginForm;