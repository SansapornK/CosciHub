// src/utils/jobHelpers.tsx
import React from "react";

export const calculateTimeAgo = (dateString: string): string => {
  const diff = Date.now() - new Date(dateString).getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  if (days <= 0) return "วันนี้";
  if (days === 1) return "1 วันที่แล้ว";
  if (days < 7) return `${days} วันที่แล้ว`;
  return "มากกว่า 1 สัปดาห์";
};

export const getCategoryIcon = (category: string) => {
  switch (category) {
    case "งานด้านวิชาการ/วิจัย/ผู้ช่วย":
      return (
        <svg
          className="h-6 w-6"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path d="M21.42 10.922a1 1 0 0 0-.019-1.838L12.83 5.18a2 2 0 0 0-1.66 0L2.6 9.08a1 1 0 0 0 0 1.832l8.57 3.908a2 2 0 0 0 1.66 0z" />
          <path d="M22 10v6" />
          <path d="M6 12.5V16a6 3 0 0 0 12 0v-3.5" />
        </svg>
      );

    case "งานพัฒนาออกแบบเว็บไซต์/แอปพลิเคชั่น/ระบบต่าง ๆ":
      return (
        <svg
          className="h-6 w-6"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path d="m16 18 6-6-6-6" />
          <path d="m8 6-6 6 6 6" />
        </svg>
      );

    case "งานกิจกรรม/อีเวนต์":
      return (
        <svg
          className="h-6 w-6"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path d="M8 2v4" />
          <path d="M16 2v4" />
          <rect width="18" height="18" x="3" y="4" rx="2" />
          <path d="M3 10h18" />
          <path d="M8 14h.01" />
          <path d="M12 14h.01" />
          <path d="M16 14h.01" />
          <path d="M8 18h.01" />
          <path d="M12 18h.01" />
          <path d="M16 18h.01" />
        </svg>
      );

    case "งานประชาสัมพันธ์/สื่อสาร":
      return (
        <svg
          className="h-6 w-6"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path d="M11 6a13 13 0 0 0 8.4-2.8A1 1 0 0 1 21 4v12a1 1 0 0 1-1.6.8A13 13 0 0 0 11 14H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2z" />
          <path d="M6 14a12 12 0 0 0 2.4 7.2 2 2 0 0 0 3.2-2.4A8 8 0 0 1 10 14" />
          <path d="M8 6v8" />
        </svg>
      );

    case "งานสื่อมัลติมีเดีย":
      return (
        <svg
          className="h-6 w-6"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path d="M12 22a1 1 0 0 1 0-20 10 9 0 0 1 10 9 5 5 0 0 1-5 5h-2.25a1.75 1.75 0 0 0-1.4 2.8l.3.4a1.75 1.75 0 0 1-1.4 2.8z" />
          <circle cx="13.5" cy="6.5" r=".5" fill="currentColor" />
          <circle cx="17.5" cy="10.5" r=".5" fill="currentColor" />
          <circle cx="6.5" cy="12.5" r=".5" fill="currentColor" />
          <circle cx="8.5" cy="7.5" r=".5" fill="currentColor" />
        </svg>
      );

    case "งานบริการ/ธุรการ":
      return (
        <svg
          className="h-6 w-6"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path d="M19.414 14.414C21 12.828 22 11.5 22 9.5a5.5 5.5 0 0 0-9.591-3.676.6.6 0 0 1-.818.001A5.5 5.5 0 0 0 2 9.5c0 2.3 1.5 4 3 5.5l5.535 5.362a2 2 0 0 0 2.879.052 2.12 2.12 0 0 0-.004-3 2.124 2.124 0 1 0 3-3 2.124 2.124 0 0 0 3.004 0 2 2 0 0 0 0-2.828l-1.881-1.882a2.41 2.41 0 0 0-3.409 0l-1.71 1.71a2 2 0 0 1-2.828 0 2 2 0 0 1 0-2.828l2.823-2.762" />
        </svg>
      );

    case "งานสอนพิเศษ":
      return (
        <svg
          className="h-6 w-6"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path d="M12 7v14" />
          <path d="M16 12h2" />
          <path d="M16 8h2" />
          <path d="M3 18a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h5a4 4 0 0 1 4 4 4 4 0 0 1 4-4h5a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1h-6a3 3 0 0 0-3 3 3 3 0 0 0-3-3z" />
          <path d="M6 12h2" />
          <path d="M6 8h2" />
        </svg>
      );

    case "งานกองถ่าย/Extra":
      return (
        <svg
          className="h-6 w-6"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path d="m12.296 3.464 3.02 3.956" />
          <path d="M20.2 6 3 11l-.9-2.4c-.3-1.1.3-2.2 1.3-2.5l13.5-4c1.1-.3 2.2.3 2.5 1.3z" />
          <path d="M3 11h18v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
          <path d="m6.18 5.276 3.1 3.899" />
        </svg>
      );

    default:
      return (
        <svg
          className="h-6 w-6"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth="2"
        >
          <circle cx="12" cy="12" r="1" />
          <circle cx="19" cy="12" r="1" />
          <circle cx="5" cy="12" r="1" />
        </svg>
      );
  }
};

export const getCategoryColor = (category: string) => {
  switch (category) {
    case "งานด้านวิชาการ/วิจัย/ผู้ช่วย":
      return { bg: "bg-indigo-50", text: "text-indigo-500" };
    case "งานพัฒนาออกแบบเว็บไซต์/แอปพลิเคชั่น/ระบบต่าง ๆ":
      return { bg: "bg-blue-50", text: "text-blue-500" };
    case "งานกิจกรรม/อีเวนต์":
      return { bg: "bg-orange-50", text: "text-orange-500" };
    case "งานประชาสัมพันธ์/สื่อสาร":
      return { bg: "bg-purple-50", text: "text-purple-500" };
    case "งานสื่อมัลติมีเดีย":
      return { bg: "bg-pink-50", text: "text-pink-500" };
    case "งานบริการ/ธุรการ":
      return { bg: "bg-emerald-100", text: "text-emerald-600" };
    case "งานสอนพิเศษ":
      return { bg: "bg-amber-50", text: "text-amber-700" };
    case "งานกองถ่าย/Extra":
      return { bg: "bg-yellow-50", text: "text-yellow-400" };
    default:
      return { bg: "bg-gray-50", text: "text-gray-500" };
  }
};
