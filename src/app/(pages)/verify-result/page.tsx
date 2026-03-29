// src/app/(pages)/verify-result/page.ts
'use client';

import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import Link from 'next/link';
import { CheckCircle, XCircle, Clock, AlertTriangle } from 'lucide-react';

function VerifyResultContent() {
  const searchParams = useSearchParams();
  const status = searchParams.get('status');
  const name = searchParams.get('name') || 'ผู้ใช้';

  // กำหนดข้อมูลการแสดงผลตามสถานะต่างๆ
  const statusConfig: any = {
    approved: {
      icon: <CheckCircle className="w-16 h-16 text-green-500" />,
      title: "ยืนยันตัวตนสำเร็จ",
      description: `ท่านได้รับรองสถานะศิษย์เก่าของคุณ ${name} เรียบร้อยแล้ว ระบบจะอนุญาตให้ผู้ใช้รายนี้เริ่มใช้งานและลงประกาศงานได้ทันที`,
      bgColor: "bg-green-50",
      borderColor: "border-green-200"
    },
    rejected: {
      icon: <XCircle className="w-16 h-16 text-red-500" />,
      title: "ปฏิเสธการยืนยัน",
      description: `ท่านเลือกไม่รับรองสถานะของ ${name} ข้อมูลนี้จะถูกบันทึกในระบบ และผู้ใช้รายนี้จะไม่สามารถเข้าถึงสิทธิ์ของศิษย์เก่าได้`,
      bgColor: "bg-red-50",
      borderColor: "border-red-200"
    },
    expired: {
      icon: <Clock className="w-16 h-16 text-amber-500" />,
      title: "ลิงก์หมดอายุ",
      description: "ลิงก์นี้มีอายุใช้งานเพียง 7 วันและขณะนี้ได้หมดอายุแล้ว กรุณาแจ้งให้ผู้ลงทะเบียนส่งคำขอใหม่อีกครั้ง",
      bgColor: "bg-amber-50",
      borderColor: "border-amber-200"
    },
    already_used: {
      icon: <AlertTriangle className="w-16 h-16 text-blue-500" />,
      title: "ทำรายการไปแล้ว",
      description: "คำขอนี้ได้รับการดำเนินการไปก่อนหน้านี้แล้ว ท่านไม่จำเป็นต้องดำเนินการซ้ำ",
      bgColor: "bg-blue-50",
      borderColor: "border-blue-200"
    },
    invalid: {
      icon: <XCircle className="w-16 h-16 text-gray-400" />,
      title: "ข้อมูลไม่ถูกต้อง",
      description: "ไม่พบข้อมูลที่ต้องการตรวจสอบ กรุณาติดต่อทีมงานหากคิดว่าเป็นข้อผิดพลาด",
      bgColor: "bg-gray-50",
      borderColor: "border-gray-200"
    }
  };

  const config = statusConfig[status as string] || statusConfig.invalid;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
      <div className={`max-w-md w-full bg-white rounded-2xl shadow-xl overflow-hidden border-1 ${config.borderColor} transition-all`}>
        <div className={`p-8 text-center ${config.bgColor}`}>
          <div className="flex justify-center mb-4">
            {config.icon}
          </div>
          <h1 className="text-2xl font-bold text-gray-800 mb-2">
            {config.title}
          </h1>
          <p className="text-gray-600 leading-relaxed">
            {config.description}
          </p>
        </div>
        
        <div className="p-6 bg-white flex flex-col gap-3">
          <p className="text-xs text-center text-gray-400">
            ขอขอบคุณอาจารย์ที่สละเวลาตรวจสอบข้อมูลในระบบ COSCI HUB
          </p>
          <Link 
            href="/"
            className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg text-center transition-colors"
          >
            กลับสู่หน้าหลัก
          </Link>
        </div>
      </div>
    </div>
  );
}

// ต้องใช้ Suspense เพราะมีการใช้ useSearchParams ใน Client Component
export default function VerifyResultPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    }>
      <VerifyResultContent />
    </Suspense>
  );
}