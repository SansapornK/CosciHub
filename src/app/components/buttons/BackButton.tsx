// components/BackButton.tsx
"use client";
import { Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ChevronLeft } from "lucide-react";

function BackButtonContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const fromName = searchParams.get("fromName") || "ย้อนกลับ";

  return (
    <button
      onClick={() => router.back()}
      className="flex items-center gap-2.5 cursor-pointer active:scale-95 transition-transform duration-150 group/btn"
    >
      <div className="w-6 h-6 rounded-lg bg-[#0C5BEA]/10 flex items-center justify-center transition-all duration-200 group-hover:bg-[#0C5BEA] group-hover/btn:bg-[#0C5BEA]">
        <ChevronLeft className="w-3.5 h-3.5 text-[#0C5BEA] transition-colors duration-200 group-hover:text-white group-hover/btn:text-white" />
      </div>
      <span className="text-sm md:text-base font-semibold text-gray-600 group-hover/btn:text-gray-900 transition-colors duration-200 max-w-[160px] truncate">
        {fromName}
      </span>
    </button>
  );
}

export default function BackButton() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center gap-2.5">
          <div className="w-6 h-6 rounded-lg bg-[#0C5BEA]/10 flex items-center justify-center">
            <ChevronLeft className="w-3.5 h-3.5 text-[#0C5BEA]" />
          </div>
          <span className="text-sm md:text-base font-semibold text-gray-600 max-w-[160px] truncate">
            ย้อนกลับ
          </span>
        </div>
      }
    >
      <BackButtonContent />
    </Suspense>
  );
}
