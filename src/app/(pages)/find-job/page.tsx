'use client';

import React, { Suspense, useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import axios from "axios";

import Loading from "../../components/common/Loading";
import JobList from "../../components/lists/JobList";
import JobFilter, { MAJOR_JOB_MAPPING } from "../../components/filters/JobFilter";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Sparkles } from "lucide-react";


// ================= SearchInput =================
const SearchInput = ({ searchQuery, onSearchChange, onApplyFilters }) => {
  const [isFocused, setIsFocused] = useState(false);

  return (
    <div className="w-full flex justify-center">
      <motion.div 
        initial={false}
        animate={{ 
          scale: isFocused ? 1.015 : 1, // ปรับ scale ลงนิดหน่อยให้ดูไม่กระโดด
        }}
        transition={{ type: "spring", stiffness: 300, damping: 20 }} // ใช้ Spring นุ่มๆ
        className="relative w-full md:w-3/5 lg:w-1/2 group"
      >
        <div 
          className={`absolute -inset-0.5 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full blur-md transition-all duration-700 
            ${isFocused ? 'opacity-20' : 'opacity-0 group-hover:opacity-10'}`} 
        />

        <input
          type="text"
          placeholder="ค้นหางานพิเศษที่นิสิตสนใจ..."
          value={searchQuery}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          onChange={(e) => onSearchChange(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && onApplyFilters()}
          className={`relative w-full p-4 pl-14 bg-white border rounded-full
                    focus:outline-none text-gray-700 placeholder:text-gray-400
                    transition-all duration-500 ease-out
                    ${isFocused ? 'border-blue-400 shadow-[0_0_20px_rgba(37,99,235,0.08)]' : 'border-gray-200 shadow-sm'}`}
        />

        <motion.div 
          animate={{ 
            x: isFocused ? 4 : 0,
            scale: isFocused ? 1.1 : 1,
            color: isFocused ? "#2563EB" : "#94A3B8" 
          }}
          transition={{ type: "spring", stiffness: 300, damping: 15 }}
          className="absolute inset-y-0 left-0 flex items-center pl-5 pointer-events-none"
        >
          <Search className={`w-5 h-5 transition-colors duration-300`} />
        </motion.div>

        <AnimatePresence>
          {searchQuery && (
            <motion.div 
              initial={{ opacity: 0, x: 15, scale: 0.9 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 10, scale: 0.9 }}
              transition={{ duration: 0.2 }}
              className="absolute inset-y-0 right-4 flex items-center"
            >
              <span className="text-[9px] tracking-widest font-bold text-blue-500 bg-blue-50 px-2.5 py-1 rounded-lg border border-blue-100 shadow-sm">
                ENTER
              </span>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
};
// ==============================================

const FindJobPage = () => {
  return (
    <Suspense fallback={<Loading size="large" color="primary" />}>
      <FindJobPageContent />
    </Suspense>
  );
};

function FindJobPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedJobTypes, setSelectedJobTypes] = useState<string[]>([]);
  const [selectedMajor, setSelectedMajor] = useState("");
  const [currentSort, setCurrentSort] = useState("default");

  const [priceRange, setPriceRange] = useState({
    min: 0,
    max: null as number | null,
  });

  // ===== ฟังก์ชันสำคัญ: คำนวณประเภทงานที่จะส่งไปกรองจริง =====
  const getEffectiveJobTypes = () => {
    // 1. ถ้าผู้ใช้มีการเลือกติ๊กประเภทงานเอง ให้ยึดตามที่ติ๊ก
    if (selectedJobTypes.length > 0) return selectedJobTypes;
    
    // 2. ถ้าไม่ได้ติ๊กประเภทงาน แต่เลือกวิชาเอก ให้เอางานที่ Mapping ไว้มาแสดง
    if (selectedMajor && MAJOR_JOB_MAPPING[selectedMajor]) {
      return MAJOR_JOB_MAPPING[selectedMajor];
    }
    
    return [];
  };

  // ===== init from URL (เหมือนเดิม) =====
  useEffect(() => {
    setSearchQuery(searchParams.get("q") || "");
    setSelectedMajor(searchParams.get("major") || "");
    const jobTypes = searchParams.get("jobTypes");
    if (jobTypes) setSelectedJobTypes(jobTypes.split(","));
    const minPrice = searchParams.get("minPrice");
    const maxPrice = searchParams.get("maxPrice");
    setPriceRange({
      min: minPrice ? parseInt(minPrice) : 0,
      max: maxPrice ? parseInt(maxPrice) : null,
    });
  }, [searchParams]);

  const applyFilters = () => {
    const params = new URLSearchParams();
    if (searchQuery) params.set("q", searchQuery);
    if (selectedJobTypes.length > 0) params.set("jobTypes", selectedJobTypes.join(","));
    if (selectedMajor) params.set("major", selectedMajor);
    if (priceRange.min > 0) params.set("minPrice", priceRange.min.toString());
    if (priceRange.max !== null) params.set("maxPrice", priceRange.max.toString());
    router.push(`/find-job?${params.toString()}`);
  };

  const resetFilters = () => {
    setSearchQuery("");
    setSelectedJobTypes([]);
    setSelectedMajor("");
    setPriceRange({ min: 0, max: null });
    router.push("/find-job");
  };

  const majors = Object.keys(MAJOR_JOB_MAPPING);
  const allJobTypes = [
    "งานด้านวิชาการ / วิจัย / ผู้ช่วยวิจัย",
    "งานพัฒนาเว็บไซต์ / แอปพลิเคชัน / ระบบต่าง ๆ",
    "งานกิจกรรม / อีเวนต์",
    "งานประชาสัมพันธ์ / สื่อสารองค์กร",
    "งานสื่อมัลติมีเดีย",
    "งานบริการ / ธุรการ",
    "งานสอนพิเศษ / ติวเตอร์",
    "งานกองถ่าย / Extra",
    "อื่น ๆ",
  ];

  return (
    <div className="flex flex-col gap-6 bg-gray-50/30 min-h-screen">
      <section className="relative overflow-hidden bg-blue-100 py-24 px-10 text-center rounded-b-[4rem] shadow-[0_20px_50px_rgba(0,0,0,0.02)]">
        <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[80%] bg-blue-200/20 rounded-full blur-[120px] animate-pulse" style={{ animationDuration: '8s' }} />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[70%] bg-indigo-200/20 rounded-full blur-[120px] animate-pulse" style={{ animationDuration: '10s' }} />
        <div className="absolute top-[10%] right-[10%] w-[30%] h-[40%] bg-purple-100/30 rounded-full blur-[100px]" />

        <div className="relative z-10 space-y-6">
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-primary-blue-500 font-bold tracking-[0.2em] text-xs uppercase mb-3">COSCI HUB</h2>
            <h1 className="text-3xl md:text-4xl font-extrabold text-black tracking-tight">
              ค้นหา <span className="pb-2 pt-1 px-1 text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-500"> โอกาสใหม่ ๆ </span> ในที่เดียว
            </h1>
          </motion.div>

          <SearchInput
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            onApplyFilters={applyFilters}
          />
        </div>
      </section>

      <section className="px-10">
        <JobFilter
          selectedJobTypes={selectedJobTypes}
          onJobTypesChange={setSelectedJobTypes}
          selectedMajor={selectedMajor}
          onMajorChange={setSelectedMajor}
          priceRange={priceRange}
          onPriceRangeChange={setPriceRange}
          availableJobTypes={allJobTypes}
          availableMajors={majors}
          currentSort={currentSort}
          onSortChange={setCurrentSort}
          onApplyFilters={applyFilters}
          onResetFilters={resetFilters}
        />

        <div className="mt-2">
            <JobList
              searchQuery={searchQuery}
              selectedJobTypes={getEffectiveJobTypes()}
              selectedMajor={selectedMajor}
              priceRange={priceRange}
              currentSort={currentSort}
              onResetFilters={resetFilters}
            />
        </div>
      </section>
    </div>
  );
}

export default FindJobPage;
