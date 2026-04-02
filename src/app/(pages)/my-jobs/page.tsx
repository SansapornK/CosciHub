'use client';

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Code, 
  Image as ImageIcon, 
  Video, 
  Users,
  Star
} from "lucide-react";

// --- SVG Icons สำหรับ StatCard (แกะแบบจากรูปภาพ) ---
const BriefcaseIconSVG = () => (
  <svg width="162" height="127" viewBox="0 0 162 127" fill="none" className="w-full h-full opacity-80">
    <rect width="162" height="127" rx="12" fill="#CFD8F2" />
    <path d="M43 43C43 31.9543 51.9543 23 63 23H99C110.046 23 119 31.9543 119 43V53H43V43Z" fill="#CFD8F2" />
  </svg>
);

const WalletIconSVG = () => (
  <svg width="137" height="127" viewBox="0 0 137 127" fill="none" className="w-full h-full opacity-80">
    <rect width="137" height="127" rx="12" fill="#C4E1D4" />
    <circle cx="111.5" cy="85.5" r="7.5" fill="white" />
  </svg>
);

const StarIconSVG = () => (
  <div className="w-full h-full opacity-80 flex items-center justify-center bg-[#F4E9BF] rounded-xl">
    <Star className="w-16 h-16 text-yellow-500" fill="#F4E9BF" />
  </div>
);

// ข้อมูลจำลอง (Mock Data)
const INITIAL_JOBS = [
  { id: 1, title: "ออกแบบแอปพลิเคชัน", type: "design", status: "pending", icon: <Code className="w-5 h-5" /> },
  { id: 2, title: "พัฒนาเกม 3D", type: "dev", status: "pending", icon: <Code className="w-5 h-5" /> },
  { id: 3, title: "ตัดต่อหนังสั้น", type: "media", status: "confirmed", icon: <Video className="w-5 h-5" /> },
  { id: 4, title: "Staff งานกิจกรรม", type: "event", status: "rejected", icon: <Users className="w-5 h-5" /> },
  { id: 5, title: "พัฒนาแอปพลิเคชันด้วย Xcode", type: "dev", status: "confirmed", icon: <Code className="w-5 h-5" /> },
  { id: 6, title: "ออกแบบภาพกราฟิก", type: "design", status: "confirmed", icon: <ImageIcon className="w-5 h-5" /> },
];

const MyJobsPage = () => {
  const [filter, setFilter] = useState("all");

  const filteredJobs = INITIAL_JOBS.filter(job => 
    filter === "all" ? true : job.status === filter
  );

  return (
    <div className="min-h-screen bg-gray-50/50 p-6 md:p-10 font-kanit">
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-blue-700 mb-2">แดชบอร์ด</h1>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
        <StatCard title="งานทั้งหมดที่เคยทำ" value="5" svgIcon={<BriefcaseIconSVG />} />
        <StatCard title="รายได้รวม" value="5,100" unit="บาท" svgIcon={<WalletIconSVG />} />
        <StatCard title="รีวิวรวม" value="5" svgIcon={<StarIconSVG />} />
      </div>

      <h2 className="text-2xl font-bold text-blue-600 mb-6">สถานะใบสมัคร</h2>

      {/* Filter Tabs - เพิ่มความลื่นไหล */}
      <div className="flex gap-4 mb-6 overflow-x-auto pb-2 scrollbar-hide">
        {['all', 'pending', 'confirmed', 'rejected'].map((status) => (
          <button
            key={status}
            onClick={() => setFilter(status)}
            className={`px-6 py-2 rounded-full text-sm font-medium transition-all duration-300 ${
              filter === status 
              ? "bg-blue-600 text-white shadow-md" 
              : "bg-white text-gray-400 hover:bg-gray-100 border border-gray-100"
            }`}
          >
            {status === 'all' && "ทั้งหมด"}
            {status === 'pending' && "รอพิจารณา"}
            {status === 'confirmed' && "ยืนยันแล้ว"}
            {status === 'rejected' && "ไม่ผ่าน"}
          </button>
        ))}
      </div>

      {/* รายการงาน (Job List) */}
      <div className="bg-white rounded-[2rem] shadow-sm border border-gray-50 overflow-hidden">
        <div className="divide-y divide-gray-50">
          <AnimatePresence mode="popLayout">
            {filteredJobs.map((job, index) => (
              <JobRow key={job.id} job={job} index={index} />
            ))}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

// --- Component ย่อย: Card รายการงาน ---
const JobRow = ({ job, index }) => {
  const statusStyles = {
    pending: { bg: "bg-orange-400", text: "text-white", label: "รอพิจารณา" },
    confirmed: { bg: "bg-transparent", text: "text-green-400", label: "ได้รับการยืนยัน" },
    rejected: { bg: "bg-transparent", text: "text-red-300", label: "ถูกปฏิเสธงาน" },
  };

  const style = statusStyles[job.status];

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, scale: 0.98 }}
      transition={{ delay: index * 0.05 }}
      whileHover={{ backgroundColor: "#fcfdfe" }}
      className="flex items-center justify-between p-6 transition-colors"
    >
      <div className="flex items-center gap-4">
        <div className="p-3 bg-gray-50 rounded-xl text-gray-500 border border-gray-100">
          {job.icon}
        </div>
        <span className="font-medium text-gray-700 text-lg">{job.title}</span>
      </div>

      <div className={`px-6 py-2 rounded-full text-sm font-semibold ${style.bg} ${style.text} ${job.status === 'pending' ? 'shadow-sm shadow-orange-200' : ''}`}>
        {job.status === 'pending' ? (
          <motion.span animate={{ opacity: [1, 0.6, 1] }} transition={{ repeat: Infinity, duration: 1.5 }}>
            {style.label}
          </motion.span>
        ) : style.label}
      </div>
    </motion.div>
  );
};

// --- Component ย่อย: StatCard ที่มีไอคอนพื้นหลัง ---
const StatCard = ({ title, value, unit = "", svgIcon }) => (
  <motion.div 
    whileHover={{ y: -5, boxShadow: "0 10px 20px -5px rgba(0, 0, 0, 0.05)" }}
    className="bg-[#EDEDED]/50 p-6 rounded-[1.5rem] flex flex-col justify-between h-44 relative overflow-hidden border border-gray-100"
  >
    {/* ไอคอน SVG วางตำแหน่งด้านซ้ายล่าง */}
    <div className="absolute -bottom-6 -left-6 w-36 h-36 z-0">
      {svgIcon}
    </div>

    {/* เนื้อหาข้อความและตัวเลข */}
    <div className="flex flex-col items-end w-full z-10 text-right">
      <span className="text-gray-800 text-lg font-medium mb-4">{title}</span>
      <div className="flex items-baseline gap-2">
        <span className="text-5xl font-bold text-black">{value}</span>
        {unit && <span className="text-xl font-medium text-gray-600">{unit}</span>}
      </div>
    </div>
  </motion.div>
);

export default MyJobsPage;