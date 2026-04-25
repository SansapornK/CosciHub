/* src/components/common/JobCard.tsx */
import React from "react";
import Link from "next/link";
import { Bookmark, DollarSign, User, Tag, Briefcase } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";


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

const JobCard: React.FC<JobCardProps> = ({
  data,
  isLoggedIn,
  isStudent = false,
  isBookmarked = false,
  onToggleBookmark,
  actionButton,
  fromPageName = "ย้อนกลับ"
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
      {/* <div className="absolute -top-3 left-8 z-10">
        <div className="bg-blue-600 text-white text-[10px] font-bold px-4 py-1.5 rounded-full shadow-lg shadow-blue-200 flex items-center gap-2">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-100 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-white"></span>
          </span>
          งานแนะนำ
        </div>
      </div> */}

      <div className="flex justify-end items-end">
        <div className="text-[11px] font-medium text-blue-400 bg-blue-50/50 px-3 py-1 rounded-full">
          โพสต์เมื่อ {data.timeAgo}
        </div>
      </div>

      <div className="flex justify-start items-center gap-2 mb-2 mt-0">
        <div className="p-3 rounded-2xl bg-blue-50/50 group-hover:scale-110 transition-transform duration-500">
           {data.icon}
        </div>
        <h3 className="text-lg font-semibold text-gray-800 group-hover:text-blue-600 transition-colors">
          {data.title}
        </h3>
      </div>

      <div className="space-y-2 mb-4">
        <div className="flex flex-col items-start gap-2">
          <span className="text-xs font-medium text-primary-blue-700 bg-gray-100 px-3 py-1 rounded-full mb-1">
            {data.type}
          </span>
          <span className="text-sm text-blue-400 mt-1">โดย {data.postedBy}</span>
        </div>
      </div>

      <div className="mb-4">
        <p className="text-sm font-medium text-gray-800 mb-1 text-left">
          คำอธิบายงาน :
        </p>
        <p className="text-sm text-gray-500 line-clamp-3 text-left">
          {data.details}
        </p>
      </div>

      <div className="mt-auto mb-4 flex justify-between items-center w-full">
        <p className="text-sm font-medium text-gray-800">ค่าตอบแทน</p>
        <p className="text-lg font-bold text-gray-800">
          {compensation} {data.currency}
        </p>
      </div>

      <div className="flex justify-between items-center gap-3">
        {actionButton ?? (
          <Link href={`/find-job/${data.id}?fromName=${encodeURIComponent(fromPageName)}`} className="flex-grow">
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
            <Bookmark className={`w-5 h-5 ${isBookmarked ? "fill-current" : ""}`} />
          </button>
        )}
      </div>
    </motion.div>
  );
};

export default JobCard;
