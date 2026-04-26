"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MAJOR_JOB_MAPPING } from "@/app/constants/JobCategories";

const availableMajors = Object.keys(MAJOR_JOB_MAPPING);

interface PriceRange {
  min: number;
  max: number | null;
}

interface JobFilterProps {
  selectedJobTypes: string[];
  onJobTypesChange: (jobTypes: string[]) => void;
  selectedMajor: string;
  onMajorChange: (major: string) => void;
  priceRange: PriceRange;
  onPriceRangeChange: (range: PriceRange) => void;
  onApplyFilters: () => void;
  onResetFilters: () => void;
  availableJobTypes: string[];
  availableMajors: string[];
  currentSort: string;
  onSortChange: (sortOption: string) => void;
  isMobile?: boolean;
}

const priceSortOptions = [
  { value: "latest", label: "ล่าสุด" },
  { value: "price-desc", label: "ราคาสูงสุด" },
  { value: "price-asc", label: "ราคาต่ำสุด" },
];

const JobFilter: React.FC<JobFilterProps> = ({
  selectedJobTypes,
  onJobTypesChange,
  selectedMajor,
  onMajorChange,
  priceRange,
  onPriceRangeChange,
  onApplyFilters,
  onResetFilters,
  availableJobTypes,
  availableMajors,
  currentSort,
  onSortChange,
  isMobile = false,
}) => {
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [filteredJobTypes, setFilteredJobTypes] =
    useState<string[]>(availableJobTypes);
  const [jobTypeSearch, setJobTypeSearch] = useState("");
  const [isMajorDropdownOpen, setIsMajorDropdownOpen] = useState(false);
  const [isSortDropdownOpen, setIsSortDropdownOpen] = useState(false);

  useEffect(() => {
    if (jobTypeSearch) {
      setFilteredJobTypes(
        availableJobTypes.filter((type) =>
          type.toLowerCase().includes(jobTypeSearch.toLowerCase()),
        ),
      );
    } else {
      setFilteredJobTypes(availableJobTypes);
    }
  }, [jobTypeSearch, availableJobTypes]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (isMajorDropdownOpen && !target.closest(".custom-major-dropdown")) {
        setIsMajorDropdownOpen(false);
      }
      if (isSortDropdownOpen && !target.closest(".custom-sort-dropdown")) {
        setIsSortDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isMajorDropdownOpen, isSortDropdownOpen]);

  const toggleFilter = () => {
    setIsFilterOpen(!isFilterOpen);
    if (isSortDropdownOpen) setIsSortDropdownOpen(false);
  };

  const handleSortClick = (optionValue: string) => {
    onSortChange(optionValue);
    setIsSortDropdownOpen(false);
    onApplyFilters();
  };

  const currentSortLabel =
    priceSortOptions.find((opt) => opt.value === currentSort)?.label ||
    "จัดเรียง";

  const handleApplyAndClose = () => {
    onApplyFilters();
    setIsFilterOpen(false);
  };

  const handleJobTypeToggle = (jobType: string) => {
    if (selectedJobTypes.includes(jobType)) {
      onJobTypesChange(selectedJobTypes.filter((t) => t !== jobType));
    } else {
      onJobTypesChange([...selectedJobTypes, jobType]);
    }
  };

  const handleMinPriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // ป้องกันค่าติดลบ และใช้ 0 เป็นค่าเริ่มต้นหากช่องว่าง
    const value =
      e.target.value === ""
        ? 0
        : Math.max(0, parseInt(e.target.value, 10) || 0);
    onPriceRangeChange({ ...priceRange, min: value });
  };

  const handleMaxPriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value.trim();
    // ถ้าว่างให้เป็น null (ไม่จำกัด) ถ้ามีค่าให้เป็นตัวเลขที่ไม่ติดลบ
    const value =
      inputValue === "" ? null : Math.max(0, parseInt(inputValue, 10) || 0);
    onPriceRangeChange({ ...priceRange, max: value });
  };

  const hasActiveFilters =
    selectedJobTypes.length > 0 ||
    selectedMajor ||
    priceRange.min > 0 ||
    priceRange.max !== null;

  return (
    <div className="relative z-40">
      <div className="p-2 flex justify-between items-center gap-2 md:gap-3">
        <h2 className="text-base md:text-xl font-semibold text-gray-800 p-1 md:p-2 whitespace-nowrap truncate max-w-[160px] md:max-w-none">
          <AnimatePresence mode="wait">
            <motion.span
              key={selectedMajor}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              transition={{ duration: 0.2 }}
            >
              {selectedMajor ? (
                <>
                  งานใน{" "}
                  <span className="text-primary-blue-500">{selectedMajor}</span>
                </>
              ) : (
                "งานทั้งหมด"
              )}
            </motion.span>
          </AnimatePresence>
        </h2>

        <div className="flex gap-2 md:gap-3 relative shrink-0">
          <button
            className={`flex items-center gap-1.5 md:gap-2 px-3 md:px-5 py-2 rounded-full text-sm transition-all duration-300 ${
              isFilterOpen
                ? "bg-primary-blue-50 text-primary-blue-600 border border-primary-blue-300"
                : "border border-gray-300 text-gray-700 hover:text-primary-blue-600 hover:border-primary-blue-300 hover:bg-gray-50"
            }`}
            onClick={toggleFilter}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth="1.5"
              stroke="currentColor"
              className="w-4 h-4 md:w-5 md:h-5"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 3c2.755 0 5.455.232 8.083.678.533.09.917.556.917 1.096v1.044a2.25 2.25 0 0 1-.659 1.591l-5.432 5.432a2.25 2.25 0 0 0-.659 1.591v2.927a2.25 2.25 0 0 1-1.244 2.013L9.75 21v-6.568a2.25 2.25 0 0 0-.659-1.591L3.659 7.409A2.25 2.25 0 0 1 3 5.818V4.774c0-.54.384-1.006.917-1.096A48.32 48.32 0 0 1 12 3Z"
              />
            </svg>
            <span className="hidden sm:inline">ตัวกรอง</span>
            {hasActiveFilters && (
              <span className="flex items-center justify-center w-4 h-4 md:w-5 md:h-5 bg-primary-blue-500 text-white text-[10px] md:text-xs font-semibold rounded-full leading-none">
                {selectedJobTypes.length +
                  (selectedMajor ? 1 : 0) +
                  (priceRange.min > 0 || priceRange.max !== null ? 1 : 0)}
              </span>
            )}
          </button>

          <div className="relative custom-sort-dropdown">
            <button
              className={`flex items-center gap-2 px-4 py-2 rounded-full transition-all duration-300 ${
                isSortDropdownOpen
                  ? "bg-primary-blue-50 text-primary-blue-600 border border-primary-blue-300"
                  : "border border-gray-300 text-gray-700 hover:text-primary-blue-600 hover:border-primary-blue-300 hover:bg-gray-50"
              }`}
              onClick={() => {
                setIsSortDropdownOpen((prev) => !prev);
                if (isFilterOpen) setIsFilterOpen(false);
              }}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth="1.5"
                stroke="currentColor"
                className="size-5"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M3 7.5 7.5 3m0 0L12 7.5M7.5 3v13.5m13.5 0L16.5 21m0 0L12 16.5m4.5 4.5V7.5"
                />
              </svg>
              <span className="hidden md:inline">{currentSortLabel}</span>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className={`hidden md:block transition-transform duration-300 ${isSortDropdownOpen ? "rotate-180" : ""}`}
              >
                <polyline points="6 9 12 15 18 9"></polyline>
              </svg>
            </button>

            <AnimatePresence>
              {isSortDropdownOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  transition={{ duration: 0.2 }}
                  className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden z-50"
                >
                  {priceSortOptions.map((option) => (
                    <div
                      key={option.value}
                      className={`p-2 px-4 cursor-pointer text-sm ${
                        currentSort === option.value
                          ? "bg-primary-blue-50 text-primary-blue-600 font-semibold"
                          : "hover:bg-gray-50 text-gray-700"
                      }`}
                      onClick={() => handleSortClick(option.value)}
                    >
                      {option.label}
                    </div>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {isFilterOpen && (
          <>
            {/* Mobile: overlay + bottom sheet */}
            {isMobile ? (
              <>
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="fixed inset-0 bg-black/40 z-[200] backdrop-blur-sm"
                  onClick={() => setIsFilterOpen(false)}
                />
                <motion.div
                  initial={{ y: "100%" }}
                  animate={{ y: 0 }}
                  exit={{ y: "100%" }}
                  transition={{ type: "spring", damping: 30, stiffness: 300 }}
                  className="fixed bottom-0 left-0 right-0 z-201 bg-white rounded-t-3xl shadow-2xl max-h-[85vh] overflow-y-auto"
                >
                  {/* Handle bar */}
                  <div className="flex justify-center pt-3 pb-1">
                    <div className="w-10 h-1 bg-gray-300 rounded-full" />
                  </div>
                  <div className="px-5 pb-8 pt-2">
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="text-lg font-bold text-gray-900">
                        ตัวกรอง
                      </h3>
                      {hasActiveFilters && (
                        <button
                          onClick={onResetFilters}
                          className="text-sm text-red-500 font-medium"
                        >
                          ล้างทั้งหมด
                        </button>
                      )}
                    </div>

                    {/* Filter sections — stack vertical บน mobile */}
                    <div className="flex flex-col gap-5">
                      {/* Job Type */}
                      <div>
                        <h4 className="text-gray-700 font-semibold text-sm mb-2">
                          ประเภทงาน
                        </h4>
                        <div className="flex flex-wrap gap-2">
                          {availableJobTypes.map((type) => (
                            <button
                              key={type}
                              onClick={() => handleJobTypeToggle(type)}
                              className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                                selectedJobTypes.includes(type)
                                  ? "bg-primary-blue-500 text-white border-primary-blue-500"
                                  : "border-gray-200 text-gray-600 bg-white hover:border-primary-blue-300"
                              }`}
                            >
                              {type}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Major */}
                      <div>
                        <h4 className="text-gray-700 font-semibold text-sm mb-2">
                          วิชาเอก
                        </h4>
                        <div className="flex flex-wrap gap-2">
                          <button
                            onClick={() => onMajorChange("")}
                            className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                              !selectedMajor
                                ? "bg-primary-blue-500 text-white border-primary-blue-500"
                                : "border-gray-200 text-gray-600 bg-white"
                            }`}
                          >
                            ทั้งหมด
                          </button>
                          {availableMajors.map((major) => (
                            <button
                              key={major}
                              onClick={() => onMajorChange(major)}
                              className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                                selectedMajor === major
                                  ? "bg-primary-blue-500 text-white border-primary-blue-500"
                                  : "border-gray-200 text-gray-600 bg-white"
                              }`}
                            >
                              {major}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Price */}
                      <div>
                        <h4 className="text-gray-700 font-semibold text-sm mb-2">
                          ช่วงราคา (บาท)
                        </h4>
                        <div className="flex items-center gap-3">
                          <div className="relative flex-1">
                            <input
                              type="number"
                              min="0"
                              step="100"
                              className="w-full p-2.5 pl-7 border border-gray-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-primary-blue-300 text-sm"
                              placeholder="ต่ำสุด"
                              value={priceRange.min || ""}
                              onChange={handleMinPriceChange}
                            />
                            <div className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 text-sm">
                              ฿
                            </div>
                          </div>
                          <span className="text-gray-400">-</span>
                          <div className="relative flex-1">
                            <input
                              type="number"
                              min="0"
                              step="100"
                              className="w-full p-2.5 pl-7 border border-gray-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-primary-blue-300 text-sm"
                              placeholder="ไม่จำกัด"
                              value={
                                priceRange.max === null ? "" : priceRange.max
                              }
                              onChange={handleMaxPriceChange}
                            />
                            <div className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 text-sm">
                              ฿
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Apply button */}
                    <button
                      className="w-full mt-6 bg-primary-blue-500 hover:bg-primary-blue-600 text-white py-3.5 rounded-2xl font-bold text-sm transition-colors"
                      onClick={handleApplyAndClose}
                    >
                      ตกลง
                    </button>
                  </div>
                </motion.div>
              </>
            ) : (
              // Desktop: inline expand เดิม
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3 }}
                className="overflow-hidden"
              >
                <div className="p-5 bg-gray-50 border-t border-gray-100">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Job Type filter */}
                    <div>
                      <h3 className="text-gray-700 font-medium mb-3 flex items-center">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="16"
                          height="16"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          className="mr-2 text-primary-blue-500"
                        >
                          <rect
                            x="2"
                            y="7"
                            width="20"
                            height="14"
                            rx="2"
                            ry="2"
                          ></rect>
                          <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path>
                        </svg>
                        ประเภทงาน
                      </h3>
                      <div className="flex flex-col bg-white border border-gray-200 rounded-xl overflow-hidden">
                        <div className="p-1.5 border-b border-gray-100">
                          <input
                            type="text"
                            className="w-full p-2 pl-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-primary-blue-300 placeholder:text-gray-400 text-sm"
                            placeholder="ค้นหาประเภทงาน..."
                            value={jobTypeSearch}
                            onChange={(e) => setJobTypeSearch(e.target.value)}
                          />
                        </div>
                        <div className="p-1.5 h-40 overflow-y-auto">
                          {filteredJobTypes.length > 0 ? (
                            <div className="flex flex-col gap-1">
                              {filteredJobTypes.map((type) => (
                                <div
                                  key={type}
                                  className="flex items-center p-1 px-2 hover:bg-gray-50 rounded-lg transition-colors"
                                >
                                  <div className="relative flex items-center">
                                    <input
                                      type="checkbox"
                                      id={`type-${type}`}
                                      checked={selectedJobTypes.includes(type)}
                                      onChange={() => handleJobTypeToggle(type)}
                                      className="w-4 h-4 opacity-0 absolute"
                                    />
                                    <div
                                      className={`w-4 h-4 flex items-center justify-center mr-3 border rounded transition-all ${
                                        selectedJobTypes.includes(type)
                                          ? "bg-primary-blue-500 border-primary-blue-600"
                                          : "border-gray-300 bg-white"
                                      }`}
                                    >
                                      {selectedJobTypes.includes(type) && (
                                        <svg
                                          xmlns="http://www.w3.org/2000/svg"
                                          width="12"
                                          height="12"
                                          viewBox="0 0 24 24"
                                          fill="none"
                                          stroke="white"
                                          strokeWidth="3"
                                          strokeLinecap="round"
                                          strokeLinejoin="round"
                                        >
                                          <polyline points="20 6 9 17 4 12"></polyline>
                                        </svg>
                                      )}
                                    </div>
                                  </div>
                                  <label
                                    htmlFor={`type-${type}`}
                                    className="text-sm text-gray-700 cursor-pointer w-full"
                                  >
                                    {type}
                                  </label>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="flex items-center justify-center h-full text-gray-400 text-sm">
                              ไม่พบประเภทงานที่ค้นหา
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Major filter */}
                    <div>
                      <h3 className="text-gray-700 font-medium mb-3 flex items-center">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="16"
                          height="16"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          className="mr-2 text-primary-blue-500"
                        >
                          <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"></path>
                          <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"></path>
                        </svg>
                        วิชาเอก
                      </h3>
                      <div className="custom-major-dropdown relative">
                        <div
                          className="relative"
                          onClick={() =>
                            setIsMajorDropdownOpen(!isMajorDropdownOpen)
                          }
                        >
                          <div className="flex items-center justify-between w-full p-2 pl-4 border border-gray-200 rounded-xl bg-white cursor-pointer hover:border-primary-blue-300">
                            <span
                              className={
                                selectedMajor
                                  ? "text-gray-800"
                                  : "text-gray-500"
                              }
                            >
                              {selectedMajor || "ทั้งหมด"}
                            </span>
                            <div className="text-gray-500">
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                width="16"
                                height="16"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                className={`transition-transform duration-300 ${isMajorDropdownOpen ? "rotate-180" : ""}`}
                              >
                                <polyline points="6 9 12 15 18 9"></polyline>
                              </svg>
                            </div>
                          </div>
                        </div>
                        <AnimatePresence>
                          {isMajorDropdownOpen && (
                            <motion.div
                              initial={{ opacity: 0, y: -10 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, y: -10 }}
                              className="absolute z-[60] w-full mt-1 bg-white border border-gray-200 rounded-xl overflow-hidden max-h-60 overflow-y-auto shadow-md"
                            >
                              <div className="p-1">
                                <div
                                  className={`p-1.5 px-4 rounded-lg cursor-pointer ${selectedMajor === "" ? "bg-primary-blue-50 text-primary-blue-600" : "hover:bg-gray-50"}`}
                                  onClick={() => {
                                    onMajorChange("");
                                    setIsMajorDropdownOpen(false);
                                  }}
                                >
                                  ทั้งหมด
                                </div>
                                {availableMajors.map((major) => (
                                  <div
                                    key={major}
                                    className={`p-1.5 px-4 rounded-lg cursor-pointer ${selectedMajor === major ? "bg-primary-blue-50 text-primary-blue-600" : "hover:bg-gray-50"}`}
                                    onClick={() => {
                                      onMajorChange(major);
                                      setIsMajorDropdownOpen(false);
                                    }}
                                  >
                                    {major}
                                  </div>
                                ))}
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    </div>

                    {/* Price range filter */}
                    <div>
                      <h3 className="text-gray-700 font-medium mb-3 flex items-center">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="16"
                          height="16"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          className="mr-2 text-primary-blue-500"
                        >
                          <circle cx="12" cy="12" r="10"></circle>
                          <line x1="12" y1="8" x2="12" y2="12"></line>
                          <line x1="12" y1="16" x2="12.01" y2="16"></line>
                        </svg>
                        ช่วงราคา (บาท)
                      </h3>
                      <div className="flex items-center gap-3">
                        <div className="relative flex-1">
                          <input
                            type="number"
                            min="0"
                            step="100"
                            className="w-full p-2 pl-8 border border-gray-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-primary-blue-300"
                            placeholder="ต่ำสุด"
                            value={priceRange.min || ""}
                            onChange={handleMinPriceChange}
                          />
                          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                            ฿
                          </div>
                        </div>
                        <span className="text-gray-500">-</span>
                        <div className="relative flex-1">
                          <input
                            type="number"
                            min="0"
                            step="100"
                            className="w-full p-2 pl-8 border border-gray-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-primary-blue-300"
                            placeholder="ไม่จำกัด"
                            value={
                              priceRange.max === null ? "" : priceRange.max
                            }
                            onChange={handleMaxPriceChange}
                          />
                          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                            ฿
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mt-6 pt-4 border-t border-gray-200">
                    <div className="flex flex-wrap gap-2 mb-3 sm:mb-0">
                      {hasActiveFilters ? (
                        <>
                          <span className="text-sm text-gray-500 py-1">
                            ตัวกรองที่เลือก:
                          </span>
                          {selectedJobTypes.map((type) => (
                            <span
                              key={type}
                              className="bg-primary-blue-50 text-primary-blue-600 text-sm px-3 py-1 rounded-lg flex items-center group"
                            >
                              {type}
                              <button
                                onClick={() => handleJobTypeToggle(type)}
                                className="ml-2 text-primary-blue-400 group-hover:text-primary-blue-600"
                              >
                                <svg
                                  xmlns="http://www.w3.org/2000/svg"
                                  width="14"
                                  height="14"
                                  viewBox="0 0 24 24"
                                  fill="none"
                                  stroke="currentColor"
                                  strokeWidth="2"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                >
                                  <line x1="18" y1="6" x2="6" y2="18"></line>
                                  <line x1="6" y1="6" x2="18" y2="18"></line>
                                </svg>
                              </button>
                            </span>
                          ))}
                          {selectedMajor && (
                            <span className="bg-primary-blue-50 text-primary-blue-600 text-sm px-3 py-1 rounded-lg flex items-center group">
                              {selectedMajor}
                              <button
                                onClick={() => onMajorChange("")}
                                className="ml-2 text-primary-blue-400 group-hover:text-primary-blue-600"
                              >
                                <svg
                                  xmlns="http://www.w3.org/2000/svg"
                                  width="14"
                                  height="14"
                                  viewBox="0 0 24 24"
                                  fill="none"
                                  stroke="currentColor"
                                  strokeWidth="2"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                >
                                  <line x1="18" y1="6" x2="6" y2="18"></line>
                                  <line x1="6" y1="6" x2="18" y2="18"></line>
                                </svg>
                              </button>
                            </span>
                          )}
                        </>
                      ) : (
                        <span className="text-sm text-gray-500 py-1">
                          ไม่มีตัวกรองที่เลือก
                        </span>
                      )}
                    </div>

                    <div className="flex gap-3">
                      {hasActiveFilters && (
                        <button
                          className="text-red-500 hover:text-red-600 text-sm flex items-center gap-1 py-1 px-2 rounded-lg hover:bg-red-50"
                          onClick={onResetFilters}
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="14"
                            height="14"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <path d="M3 6h18"></path>
                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"></path>
                            <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                          </svg>
                          ล้างทั้งหมด
                        </button>
                      )}
                      <button
                        className="bg-primary-blue-500 hover:bg-primary-blue-600 text-white px-5 py-2 rounded-xl text-sm font-semibold transition-colors"
                        onClick={handleApplyAndClose}
                      >
                        ตกลง
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

export default JobFilter;
