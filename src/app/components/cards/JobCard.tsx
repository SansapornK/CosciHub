/* src/components/common/JobCard.tsx */
import React, { useRef, useState, useEffect } from "react";
import Link from "next/link";
import { Bookmark, ChevronRight } from "lucide-react";
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
  isMobile?: boolean;
}

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
    if (el) setIsOverflowing(el.scrollWidth > el.clientWidth);
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

// ── Mobile card (style inspired by job board UI) ──────────────────────────────
const JobCardMobile: React.FC<JobCardProps> = ({
  data,
  isStudent,
  isBookmarked,
  onToggleBookmark,
  fromPageName = "ย้อนกลับ",
}) => {
  const compensation = data.maxCompensation
    ? `฿${data.minCompensation} – ${data.maxCompensation}`
    : `฿${data.minCompensation}+`;

  return (
    <motion.div
      whileTap={{ scale: 0.98 }}
      className="bg-white/80 backdrop-blur-sm shadow-sm border border-white rounded-[20px] overflow-hidden"
    >
      <div className="flex flex-col p-4 gap-2.5">
        {/* ── Row 1: Icon + Title + Bookmark ── */}
        <div className="flex items-start gap-3">
          <div className="w-[46px] h-[46px] rounded-[14px] bg-indigo-50 flex items-center justify-center shrink-0 text-indigo-500">
            {data.icon}
          </div>

          <div className="flex-1 min-w-0">
            <p className="text-[15px] font-bold text-zinc-900 leading-snug line-clamp-1 mb-0.5">
              {data.title}
            </p>
            <div className="flex items-center gap-1">
              <svg
                className="w-[11px] h-[11px] text-blue-400 shrink-0"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              >
                <circle cx="12" cy="8" r="4" />
                <path d="M20 21a8 8 0 0 0-16 0" />
              </svg>
              <span className="text-[12px] text-blue-400 truncate">
                {data.postedBy}
              </span>
            </div>
          </div>

          {isStudent && (
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onToggleBookmark?.();
              }}
              className={`w-8 h-8 rounded-[10px] flex items-center justify-center shrink-0 transition-all border-0 ${
                isBookmarked
                  ? "bg-blue-50 text-blue-500"
                  : "bg-zinc-100 text-zinc-300"
              }`}
            >
              <Bookmark
                className={`w-3.5 h-3.5 ${isBookmarked ? "fill-current" : ""}`}
              />
            </button>
          )}
        </div>

        {/* ── Row 2: Description ── */}
        <p className="text-[13px] text-zinc-500 leading-relaxed line-clamp-2">
          {data.details}
        </p>

        {/* ── Row 3: Badges ── */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="inline-flex items-center gap-1 bg-blue-50 text-blue-500 text-[11px] font-semibold px-2.5 py-1 rounded-full">
            {data.type}
          </span>
          <span className="inline-flex items-center gap-1 bg-zinc-100 text-zinc-500 text-[11px] font-medium px-2.5 py-1 rounded-full">
            <svg
              className="w-[11px] h-[11px]"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            >
              <circle cx="12" cy="12" r="9" />
              <path d="M12 8v4l3 3" />
            </svg>
            โพสต์เมื่อ {data.timeAgo}
          </span>
        </div>

        {/* ── Divider ── */}
        <div className="h-px bg-zinc-100" />

        {/* ── Row 4: Price + CTA ── */}
        <div className="flex items-center justify-between">
          <div className="leading-none">
            <span className="text-[20px] font-extrabold text-zinc-900">
              {compensation}
            </span>
            <span className="text-[12px] text-zinc-400 ml-1">
              {data.currency}
            </span>
          </div>

          <Link
            href={`/find-job/${data.id}?fromName=${encodeURIComponent(fromPageName)}`}
          >
            <button className="bg-gradient-to-br from-blue-500 to-blue-400 active:scale-95 text-white text-[13px] font-semibold px-4 py-2 rounded-xl transition-all">
              ดูรายละเอียด
            </button>
          </Link>
        </div>
      </div>
    </motion.div>
  );
};

// ── Desktop full card (เดิม) ──────────────────────────────────────────────────
const JobCardDesktop: React.FC<JobCardProps> = ({
  data,
  isStudent,
  isBookmarked,
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
      className="bg-white/80 backdrop-blur-sm shadow-sm hover:shadow-2xl hover:shadow-gray-500/30 rounded-[2rem] p-5 flex flex-col border border-white transition-all duration-500 relative h-full group"
    >
      <div className="flex justify-end">
        <div className="text-[11px] font-medium text-blue-400 bg-blue-50/50 px-3 py-1 rounded-full">
          โพสต์เมื่อ {data.timeAgo}
        </div>
      </div>

      <div className="flex items-center gap-2 mb-2 mt-0 min-w-0">
        <div className="p-3 rounded-2xl bg-blue-50/50 group-hover:scale-110 transition-transform duration-500 shrink-0">
          {data.icon}
        </div>
        <TruncatedWithTooltip
          text={data.title}
          className="text-lg font-semibold text-gray-800 group-hover:text-blue-600 transition-colors flex-1 text-left"
        />
      </div>

      <div className="space-y-2 mb-4">
        <div className="flex flex-col items-start gap-2">
          <span className="text-xs font-medium text-primary-blue-700 bg-gray-100 px-3 py-1 rounded-full">
            {data.type}
          </span>
          <TruncatedWithTooltip
            text={`โดย ${data.postedBy}`}
            className="text-sm text-blue-400 w-full text-left"
          />
        </div>
      </div>

      <div className="mb-4">
        <p className="text-sm font-medium text-gray-800 mb-1 text-left">
          คำอธิบายงาน :
        </p>
        <p className="text-sm text-gray-500 line-clamp-3 text-left leading-relaxed">
          {data.details}
        </p>
      </div>

      <div className="mt-auto mb-4 flex justify-between items-center w-full">
        <p className="text-sm font-medium text-gray-800">ค่าตอบแทน</p>
        <p className="text-lg font-bold text-gray-800">
          {compensation}{" "}
          <span className="text-xs font-normal">{data.currency}</span>
        </p>
      </div>

      <div className="flex justify-between items-center gap-3">
        {actionButton ?? (
          <Link
            href={`/find-job/${data.id}?fromName=${encodeURIComponent(fromPageName)}`}
            className="flex-grow"
          >
            <button className="bg-primary-blue-500 text-white text-base py-3 px-4 rounded-lg w-full hover:bg-primary-blue-600 transition-colors">
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
            className={`p-3 rounded-lg border transition-all duration-200 cursor-pointer ${favBtnClass} hover:opacity-80`}
          >
            <Bookmark
              className={`w-5 h-5 ${isBookmarked ? "fill-current" : ""}`}
            />
          </button>
        )}
      </div>
    </motion.div>
  );
};

// ── Switcher ──────────────────────────────────────────────────────────────────
const JobCard: React.FC<JobCardProps> = (props) => {
  if (props.isMobile) return <JobCardMobile {...props} />;
  return <JobCardDesktop {...props} />;
};

export default JobCard;
