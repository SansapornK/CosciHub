"use client";

import React, {
  Suspense,
  useState,
  useCallback,
  useEffect,
  useRef,
} from "react";
import { useSearchParams, useRouter } from "next/navigation";

import Loading from "../../components/common/Loading";
import JobList from "../../components/lists/JobList";
import {
  MAJOR_JOB_MAPPING,
  jobCategories,
} from "@/app/constants/JobCategories";
import JobFilter from "../../components/filters/JobFilter";
import { motion, AnimatePresence } from "framer-motion";
import { Search,X } from "lucide-react";

// ================= SearchInput =================
const SearchInput = ({
  searchQuery,
  onSearchChange,
  onApplyFilters,
}: {
  searchQuery: string;
  onSearchChange: (v: string) => void;
  onApplyFilters: () => void;
}) => {
  const [isFocused, setIsFocused] = useState(false);

  return (
    <div className="w-full flex justify-center">
      <motion.div
        initial={false}
        animate={{ scale: isFocused ? 1.015 : 1 }}
        transition={{ type: "spring", stiffness: 300, damping: 20 }}
        className="relative w-full md:w-3/5 lg:w-1/2 group"
      >
        <div
          className={`absolute -inset-0.5 bg-gradient-to-r from-blue-500 to-blue-500 rounded-full blur-md transition-all duration-700
            ${isFocused ? "opacity-20" : "opacity-0 group-hover:opacity-10"}`}
        />
        <input
          type="text"
          placeholder="ค้นหางานพิเศษที่นิสิตสนใจ..."
          value={searchQuery}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          onChange={(e) => onSearchChange(e.target.value)}
          className={`relative w-full p-3.5 md:p-4 pl-12 md:pl-14 pr-10 bg-white border rounded-full
    focus:outline-none text-zinc-700 placeholder:text-zinc-400 text-sm md:text-base
    transition-all duration-500 ease-out
  ${
    isFocused
      ? "border-blue-400 shadow-[0_0_20px_rgba(99,102,241,0.10)]"
      : "border-zinc-200 shadow-sm"
  }`}
        />
        <motion.div
          animate={{ x: isFocused ? 4 : 0, scale: isFocused ? 1.1 : 1 }}
          transition={{ type: "spring", stiffness: 300, damping: 15 }}
          className="absolute inset-y-0 left-0 flex items-center pl-4 md:pl-5 pointer-events-none text-slate-400"
        >
          <Search className="w-4 h-4 md:w-5 md:h-5" />
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
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => onSearchChange("")}
                className="text-zinc-400 hover:text-zinc-600 bg-zinc-100 hover:bg-zinc-200 p-1.5 rounded-full transition-all"
              >
                <X size={14} />
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
};

// ================= AnimatedSearchWords =================
const ROTATING_WORDS = [
  "งานพิเศษ",
  "โอกาสใหม่ ๆ",
  "รายได้เสริม",
  "พื้นที่ปล่อยของ",
  "แรงบันดาลใจ",
];

const AnimatedWord = () => {
  const [index, setIndex] = useState(0);
  const [displayed, setDisplayed] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const word = ROTATING_WORDS[index];
    let timeout: NodeJS.Timeout;

    if (!isDeleting && displayed.length < word.length) {
      timeout = setTimeout(() => {
        setDisplayed(word.slice(0, displayed.length + 1));
      }, 80);
    } else if (!isDeleting && displayed.length === word.length) {
      timeout = setTimeout(() => setIsDeleting(true), 2500);
    } else if (isDeleting && displayed.length > 0) {
      timeout = setTimeout(() => {
        setDisplayed(word.slice(0, displayed.length - 1));
      }, 40);
    } else if (isDeleting && displayed.length === 0) {
      setIsDeleting(false);
      setIndex((prev) => (prev + 1) % ROTATING_WORDS.length);
    }

    return () => clearTimeout(timeout);
  }, [displayed, isDeleting, index]);

  return (
    <span className="inline-flex items-center">
      <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-500">
        {displayed}
      </span>
      <span className="ml-0.5 inline-block w-[2px] h-[1em] bg-blue-500 align-middle animate-pulse" />
    </span>
  );
};

// ================= Page Wrapper =================
const FindJobPage = () => (
  <Suspense fallback={<Loading size="large" color="primary" />}>
    <FindJobPageContent />
  </Suspense>
);

// ================= Main Content =================
function FindJobPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const searchDebounceRef = useRef<NodeJS.Timeout | null>(null);

  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  const searchQuery = searchParams.get("q") || "";
  const selectedMajor = searchParams.get("major") || "";
  const currentSort = searchParams.get("sort") || "latest";
  const priceMin = Number(searchParams.get("minPrice") || 0);
  const priceMax = searchParams.get("maxPrice")
    ? Number(searchParams.get("maxPrice"))
    : null;
  const selectedJobTypes = searchParams.get("jobTypes")
    ? searchParams.get("jobTypes")!.split(",").filter(Boolean)
    : [];

  const [searchInput, setSearchInput] = useState(searchQuery);
  useEffect(() => {
    setSearchInput(searchQuery);
  }, [searchQuery]);

  const updateParams = useCallback(
    (updates: Record<string, string | null>) => {
      const next = new URLSearchParams(Array.from(searchParams.entries()));
      Object.entries(updates).forEach(([k, v]) => {
        if (v === null || v === "") next.delete(k);
        else next.set(k, v);
      });
      next.set("page", "1");
      router.push(`/find-job?${next.toString()}`);
    },
    [searchParams, router],
  );

  const handleJobTypesChange = (types: string[]) =>
    updateParams({ jobTypes: types.length ? types.join(",") : null });
  const handleMajorChange = (major: string) =>
    updateParams({ major: major || null });
  const handlePriceRangeChange = (range: { min: number; max: number | null }) =>
    updateParams({
      minPrice: range.min > 0 ? String(range.min) : null,
      maxPrice: range.max !== null ? String(range.max) : null,
    });
  const handleSortChange = (sort: string) =>
    updateParams({ sort: sort !== "latest" ? sort : null });
  const handleApplySearch = () =>
    updateParams({ q: searchInput.trim() || null });

  const handleResetFilters = () => {
    setSearchInput("");
    router.push("/find-job");
  };

  const getEffectiveJobTypes = (): string[] => {
    const majorTypes =
      selectedMajor && MAJOR_JOB_MAPPING[selectedMajor]
        ? MAJOR_JOB_MAPPING[selectedMajor].map((t) => t.trim())
        : [];
    if (selectedMajor && selectedJobTypes.length > 0) {
      const intersect = selectedJobTypes.filter((t) =>
        majorTypes.includes(t.trim()),
      );
      return intersect.length > 0 ? intersect : ["EMPTY_RESULT"];
    }
    if (selectedMajor) return majorTypes;
    return selectedJobTypes.map((t) => t.trim());
  };

  const majors = Object.keys(MAJOR_JOB_MAPPING);

  return (
    <div className="flex flex-col gap-4 md:gap-6 bg-gray-50/30 min-h-screen">
      <section className="relative overflow-hidden bg-gradient-to-b from-blue-50 to-white py-10 md:py-20 px-5 md:px-10 text-center rounded-b-[2rem] md:rounded-b-[3rem]">
        <div className="absolute top-[-10%] left-[-5%] w-[50%] h-[80%] bg-blue-100/70 rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute bottom-[-10%] right-[-5%] w-[45%] h-[70%] bg-indigo-100/40 rounded-full blur-[100px] pointer-events-none" />

        <div className="relative z-10 space-y-5 md:space-y-7">
          <motion.div
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="space-y-2 md:space-y-3"
          >
            <p className="inline-flex items-center gap-2 text-[11px] md:text-xs font-bold text-blue-600 uppercase bg-blue-50 border border-blue-100 px-3 py-1 rounded-full">
              COSCI HUB
            </p>
            <h1 className="text-[26px] leading-tight md:text-4xl font-extrabold text-slate-900 tracking-tight">
              ค้นหา <AnimatedWord />
              <br className="md:hidden" /> ในที่เดียว
            </h1>
            <p className="text-[10px] md:text-base text-slate-400">
              แพลตฟอร์มรวมงานพิเศษภายในวิทยาลัยฯ · สำหรับนิสิต COSCI โดยเฉพาะ!
            </p>
          </motion.div>

          <SearchInput
            searchQuery={searchInput}
            onSearchChange={(v) => {
              setSearchInput(v);
              if (searchDebounceRef.current)
                clearTimeout(searchDebounceRef.current);
              searchDebounceRef.current = setTimeout(() => {
                updateParams({ q: v.trim() || null });
              }, 400);
            }}
            onApplyFilters={handleApplySearch}
          />
        </div>
      </section>

      <section className="px-4 md:px-10 pb-6">
        <JobFilter
          selectedJobTypes={selectedJobTypes}
          onJobTypesChange={handleJobTypesChange}
          selectedMajor={selectedMajor}
          onMajorChange={handleMajorChange}
          priceRange={{ min: priceMin, max: priceMax }}
          onPriceRangeChange={handlePriceRangeChange}
          availableJobTypes={jobCategories}
          availableMajors={majors}
          currentSort={currentSort}
          onSortChange={handleSortChange}
          onApplyFilters={() => {}}
          onResetFilters={handleResetFilters}
          isMobile={isMobile}
        />
        <div className="mt-2">
          <JobList
            initialItemsPerPage={isMobile ? 6 : 12}
            searchQuery={searchQuery}
            selectedJobTypes={getEffectiveJobTypes()}
            selectedMajor={selectedMajor}
            priceRange={{ min: priceMin, max: priceMax }}
            currentSort={currentSort}
            onResetFilters={handleResetFilters}
            isMobile={isMobile}
          />
        </div>
      </section>
    </div>
  );
}

export default FindJobPage;
