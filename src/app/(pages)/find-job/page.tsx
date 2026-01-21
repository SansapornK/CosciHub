'use client';

import React, { Suspense, useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import axios from "axios";

import Loading from "../../components/common/Loading";
import JobList from "../../components/lists/JobList";
import JobFilter, { MAJOR_JOB_MAPPING } from "../../components/filters/JobFilter";

// ================= SearchInput =================
const SearchInput = ({ searchQuery, onSearchChange, onApplyFilters }) => (
  <div className="w-full flex justify-center">
    <div className="relative w-full md:w-1/2">
      <input
        type="text"
        placeholder="ค้นหางานพิเศษที่นิสิตสนใจ"
        value={searchQuery}
        onChange={(e) => onSearchChange(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && onApplyFilters()}
        className="w-full p-2 pl-12 bg-white border border-gray-200 rounded-full
                   focus:ring-2 focus:ring-primary-blue-300 focus:outline-none
                   placeholder:text-primary-blue-300"
      />

      <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="w-5 h-5 text-primary-blue-300"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth="2"
        >
          <circle cx="11" cy="11" r="8" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
      </div>
    </div>
  </div>
);
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
      <section className="bg-blue-50/50 py-16 px-10 text-center rounded-b-[4rem]">
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
