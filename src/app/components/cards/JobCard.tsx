/* src/components/common/JobCard.tsx */
import React, { useRef, useState, useEffect } from "react";
import Link from "next/link";
import { Bookmark } from "lucide-react";
import { motion } from "framer-motion";

export interface JobCardData {
  id: string;
  icon: React.ReactNode;
  title: string;
  type: string;
  postedBy: string;
  minCompensation: string;
  maxCompensation: string | null;
  details: string;
  currency: string;
  timeAgo: string;
  isVisible: boolean;
}

interface JobCardProps {
  data: JobCardData;
  isLoggedIn: boolean;
  isStudent?: boolean;
  isBookmarked?: boolean;
  onToggleBookmark?: () => void;
  actionButton?: React.ReactNode;
  fromPageName?: string;
}

// ── Sub-component: tooltip only when overflowing ──────────────────────────────
const TruncatedWithTooltip = ({
  text,
  className,
}: {
  text: string;
  className?: string;
}) => {
  const ref = useRef<HTMLSpanElement>(null);
  const [isOverflowing, setIsOverflowing] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (el) {
      setIsOverflowing(el.scrollWidth > el.clientWidth);
    }
  }, [text]);

  return (
    <span
      ref={ref}
      title={isOverflowing ? text : undefined}
      className={`truncate ${className ?? ""}`}
    >
      {text}
    </span>
  );
};

// ── Main component ────────────────────────────────────────────────────────────
const JobCard: React.FC<JobCardProps> = ({
  data,
  isLoggedIn,
  isStudent = false,
  isBookmarked = false,
  onToggleBookmark,
  actionButton,
  fromPageName = "ย้อนกลับ",
}) => {
  const compensation = data.maxCompensation
    ? `${data.minCompensation} - ${data.maxCompensation}`
    : `${data.minCompensation}+`;

  const favBtnClass = isBookmarked
    ? "text-primary-blue-500 fill-current bg-blue-50 border-blue-200"
    : "text-gray-400 bg-gray-100 border-transparent";

  return (
    <motion.div
      whileHover={{ y: -8 }}
      // ปรับ padding จาก p-5 เหลือ p-4 บนมือถือ และโค้งมนน้อยลงหน่อยให้รับกับขนาดเล็ก
      className="bg-white/80 backdrop-blur-sm shadow-sm hover:shadow-2xl hover:shadow-gray-500/30 rounded-[1.5rem] md:rounded-[2rem] p-4 md:p-5 flex flex-col border border-white transition-all duration-500 relative h-full group"
    >
      {/* Time badge - ลดขนาด font บนมือถือ */}
      <div className="flex justify-end">
        <div className="text-[9px] md:text-[11px] font-medium text-blue-400 bg-blue-50/50 px-3 py-1 rounded-full">
          โพสต์เมื่อ {data.timeAgo}
        </div>
      </div>

      {/* Icon + Title - ปรับขนาดไอคอนและ font */}
      <div className="flex items-center gap-2 mb-2 mt-0 min-w-0">
        <div className="p-2.5 md:p-3 rounded-2xl bg-blue-50/50 group-hover:scale-110 transition-transform duration-500 shrink-0">
          <div className="scale-90 md:scale-100 flex items-center justify-center">
            {data.icon}
          </div>
        </div>
        <TruncatedWithTooltip
          text={data.title}
          className="text-base md:text-lg font-semibold text-gray-800 group-hover:text-blue-600 transition-colors flex-1"
        />
      </div>

      {/* Type + Posted by - ลดขนาด font และระยะห่าง */}
      <div className="space-y-1.5 md:space-y-2 mb-3 md:mb-4">
        <div className="flex flex-col items-start gap-1 md:gap-2">
          <span className="text-[10px] md:text-xs font-medium text-primary-blue-700 bg-gray-100 px-3 py-1 rounded-full">
            {data.type}
          </span>
          <TruncatedWithTooltip
            text={`โดย ${data.postedBy}`}
            className="text-[12px] md:text-sm text-blue-400 w-full"
          />
        </div>
      </div>

      {/* Description - ลดขนาด font และการแสดงผลเหลือ 2 บรรทัดบนมือถือเพื่อความกะทัดรัด */}
      <div className="mb-3 md:mb-4">
        <p className="text-[12px] md:text-sm font-medium text-gray-800 mb-0.5 md:mb-1 text-left">
          คำอธิบายงาน :
        </p>
        <p className="text-[12px] md:text-sm text-gray-500 line-clamp-2 md:line-clamp-3 text-left leading-relaxed">
          {data.details}
        </p>
      </div>

      {/* Compensation - ปรับ font size */}
      <div className="mt-auto mb-3 md:mb-4 flex justify-between items-center w-full">
        <p className="text-[12px] md:text-sm font-medium text-gray-800">ค่าตอบแทน</p>
        <p className="text-base md:text-lg font-bold text-gray-800">
          {compensation} <span className="text-[10px] md:text-xs font-normal">{data.currency}</span>
        </p>
      </div>

      {/* Actions - ปรับความสูงปุ่มและขนาด font */}
      <div className="flex justify-between items-center gap-2 md:gap-3">
        {actionButton ?? (
          <Link
            href={`/find-job/${data.id}?fromName=${encodeURIComponent(fromPageName)}`}
            className="flex-grow"
          >
            <button className="bg-primary-blue-500 text-white text-sm md:text-base py-2.5 md:py-3 px-4 rounded-lg w-full hover:bg-primary-blue-600 transition-colors">
              ดูรายละเอียดงาน
            </button>
          </Link>
        )}
        {isStudent && !actionButton && (
          <button
            onClick={(e) => {
              e.preventDefault();
              onToggleBookmark?.();
            }}
            className={`p-2.5 md:p-3 rounded-lg border transition-all duration-200 cursor-pointer ${favBtnClass} hover:opacity-80`}
          >
            <Bookmark className={`w-4 h-4 md:w-5 h-5 ${isBookmarked ? "fill-current" : ""}`} />
          </button>
        )}
      </div>
    </motion.div>
  );
};

export default JobCard;