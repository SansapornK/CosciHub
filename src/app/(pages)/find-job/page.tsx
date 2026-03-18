'use client';

import React, { Suspense, useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import axios from "axios";

import Loading from "../../components/common/Loading";
import JobList from "../../components/lists/JobList";
import JobFilter, { MAJOR_JOB_MAPPING } from "../../components/filters/JobFilter";
import { motion } from "framer-motion";
import { Search, Sparkles } from "lucide-react";

// ================= SearchInput =================
const SearchInput = ({ searchQuery, onSearchChange, onApplyFilters }) => {
  const [isFocused, setIsFocused] = useState(false);

  return (
    <div className="w-full flex justify-center">
      <motion.div 
        initial={false}
        animate={{ 
          scale: isFocused ? 1.02 : 1,
          boxShadow: isFocused 
            ? "0 20px 25px -5px rgba(37, 99, 235, 0.1), 0 10px 10px -5px rgba(37, 99, 235, 0.04)" 
            : "0 4px 6px -1px rgba(0, 0, 0, 0.1)"
        }}
        className="relative w-full md:w-3/5 lg:w-1/2 group"
      >
        {/* Background Gradient Glow (ปรากฏเมื่อ focus) */}
        <div className={`absolute -inset-1 bg-gradient-to-r from-primary-blue-400 to-indigo-400 rounded-full blur opacity-0 transition duration-500 ${isFocused ? 'opacity-30' : 'group-hover:opacity-10'}`} />

        <input
          type="text"
          placeholder="ค้นหางานพิเศษที่นิสิตสนใจ..."
          value={searchQuery}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          onChange={(e) => onSearchChange(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && onApplyFilters()}
          className="relative w-full p-4 pl-14 bg-white border border-gray-100 rounded-full
                     focus:outline-none text-gray-700 placeholder:text-gray-400
                     transition-all duration-300"
        />

        {/* Search Icon Animation */}
        <motion.div 
          animate={{ 
            x: isFocused ? 5 : 0,
            color: isFocused ? "#2563EB" : "#94A3B8" 
          }}
          className="absolute inset-y-0 left-0 flex items-center pl-5 pointer-events-none"
        >
          <Search className="w-6 h-6" />
        </motion.div>

        {/* "Enter" Hint - จะค่อยๆ Fade in เมื่อมีการพิมพ์ */}
        {searchQuery && (
          <motion.div 
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            className="absolute inset-y-0 right-4 flex items-center"
          >
            <span className="text-[10px] font-bold text-gray-400 bg-gray-100 px-2 py-1 rounded-md border border-gray-200">
              ENTER
            </span>
          </motion.div>
        )}
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
      <section className="relative overflow-hidden bg-gradient-to-b from-blue-50 to-white py-20 px-10 text-center rounded-b-[4rem]">
        <div className="absolute top-0 left-1/4 w-64 h-64 bg-blue-200/30 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-64 h-64 bg-purple-100/30 rounded-full blur-3xl" />
        <SearchInput
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          onApplyFilters={applyFilters}
        />
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
