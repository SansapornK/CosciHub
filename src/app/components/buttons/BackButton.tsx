// components/BackButton.tsx
"use client";
import { useRouter, useSearchParams } from "next/navigation";
import { ChevronLeft } from "lucide-react";

export default function BackButton() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const fromName = searchParams.get("fromName") || "ย้อนกลับ";

  return (
    <div className="sticky top-0 z-40 bg-white/80 backdrop-blur-xl border-b border-gray-100/60 md:bg-transparent md:border-none md:relative md:backdrop-blur-none">
      <div className="flex items-center px-4 h-14 md:h-auto md:py-6 max-w-7xl mx-auto w-full">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-1 pl-1 pr-3 py-1.5 text-gray-500 hover:text-primary-blue-500 font-medium active:scale-95 transition-all"
        >
          <ChevronLeft className="w-5 h-5 text-primary-blue-500" />
          <span>{fromName}</span>
        </button>
      </div>
    </div>
  );
}
