"use client";

import React, { useEffect, useState, useMemo } from "react";
import axios from "axios";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Bookmark, ArrowLeft, ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";

import JobCard from "../../components/cards/JobCard";
import Loading from "../../components/common/Loading";
import {
  calculateTimeAgo,
  getCategoryIcon,
} from "@/app/components/utils/jobHelpers";

export default function BookmarksPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [savedJobs, setSavedJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [savedJobIds, setSavedJobIds] = useState<string[]>([]);
  const [isMobile, setIsMobile] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  const itemsPerPage = isMobile ? 6 : 12;

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  // reset page เมื่อ isMobile เปลี่ยน
  useEffect(() => {
    setCurrentPage(1);
  }, [isMobile]);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth?state=login&callbackUrl=/bookmarks");
    }
  }, [status, router]);

  const fetchBookmarks = async () => {
    try {
      setLoading(true);
      const res = await axios.get("/api/bookmarks");
      setSavedJobs(res.data.bookmarks || []);
      setSavedJobIds(res.data.bookmarks.map((b: any) => b._id));
    } catch (err) {
      console.error("Failed to fetch bookmarks", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (status === "authenticated") fetchBookmarks();
  }, [status]);

  const handleToggleBookmark = async (jobId: string) => {
    try {
      await axios.post("/api/bookmarks", { jobId });
      setSavedJobs((prev) => prev.filter((job: any) => job._id !== jobId));
      setSavedJobIds((prev) => prev.filter((id) => id !== jobId));
      // ถ้า page ปัจจุบันว่างหลังลบ ให้ถอยหน้า
      const newTotal = savedJobs.length - 1;
      const newTotalPages = Math.ceil(newTotal / itemsPerPage);
      if (currentPage > newTotalPages && newTotalPages > 0) {
        setCurrentPage(newTotalPages);
      }
    } catch {
      alert("ไม่สามารถลบรายการได้");
    }
  };

  const totalPages = Math.ceil(savedJobs.length / itemsPerPage);

  const paginatedJobs = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return savedJobs.slice(start, start + itemsPerPage);
  }, [savedJobs, currentPage, itemsPerPage]);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-blue-50 to-white">
        <Loading />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white pb-20">
      {/* Hero header */}
      <section className="relative overflow-hidden py-10 md:py-10 px-6 md:px-10 text-center">
        <div className="absolute top-[-5%] left-[-10%] md:top-[-10%] md:left-[-5%] w-[70%] md:w-[50%] h-[60%] md:h-[70%] bg-blue-400/10 rounded-full blur-[60px] md:blur-[100px]" />

        <div className="relative z-10 max-w-4xl mx-auto">
          <Link
            href="/find-job"
            className="inline-flex items-center text-blue-600 font-bold text-xs md:text-sm mb-4 md:mb-6 hover:gap-2 transition-all"
          >
            <ArrowLeft className="w-3.5 h-3.5 md:w-4 md:h-4 mr-2" />{" "}
            ค้นหางานใหม่ ๆ
          </Link>

          <h1 className="text-3xl md:text-5xl font-black text-gray-900 tracking-tight leading-tight px-2">
            งานที่{" "}
            <span className="inline-block text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-500 py-1 md:py-2">
              คุณบันทึกไว้
            </span>
          </h1>

          <p className="text-gray-500 mt-3 text-xs md:text-lg max-w-[280px] md:max-w-none mx-auto leading-relaxed">
            รวมโปรเจกต์ที่คุณสนใจและวางแผนจะสมัครในอนาคต
          </p>
        </div>
      </section>

      {/* Main content */}
      <main className="max-w-7xl mx-auto px-6 md:px-12">
        <AnimatePresence mode="popLayout">
          {paginatedJobs.length > 0 ? (
            <motion.div
              key="jobs-list"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <motion.div
                layout
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-8"
              >
                {paginatedJobs.map((job: any) => (
                  <motion.div
                    key={job._id}
                    layout
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8, filter: "blur(10px)" }}
                    transition={{ duration: 0.3 }}
                  >
                    <JobCard
                      fromPageName="งานที่บันทึกไว้"
                      isLoggedIn={true}
                      isStudent={true}
                      isBookmarked={savedJobIds.includes(job._id)}
                      onToggleBookmark={() => handleToggleBookmark(job._id)}
                      isMobile={isMobile}
                      data={{
                        id: job._id,
                        icon: getCategoryIcon(job.category),
                        title: job.title,
                        type: job.category,
                        postedBy: job.owner,
                        details: job.shortDescription,
                        minCompensation: job.budgetMin.toLocaleString(),
                        maxCompensation: job.budgetMax
                          ? job.budgetMax.toLocaleString()
                          : null,
                        currency: "บาท",
                        timeAgo: calculateTimeAgo(job.postedDate),
                        isVisible: true,
                      }}
                    />
                  </motion.div>
                ))}
              </motion.div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 mt-10">
                  {/* Prev */}
                  <button
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="p-2 rounded-xl border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>

                  {/* Page numbers */}
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                    (page) => {
                      // แสดง: หน้าแรก, หน้าสุดท้าย, หน้าปัจจุบัน ±1
                      const show =
                        page === 1 ||
                        page === totalPages ||
                        Math.abs(page - currentPage) <= 1;
                      const isEllipsis =
                        !show && (page === 2 || page === totalPages - 1);

                      if (!show && !isEllipsis) return null;
                      if (isEllipsis) {
                        return (
                          <span
                            key={page}
                            className="px-1 text-gray-400 text-sm"
                          >
                            ...
                          </span>
                        );
                      }
                      return (
                        <button
                          key={page}
                          onClick={() => handlePageChange(page)}
                          className={`w-9 h-9 rounded-xl text-sm font-semibold transition-all ${
                            page === currentPage
                              ? "bg-blue-500 text-white shadow-sm"
                              : "border border-gray-200 text-gray-600 hover:bg-gray-50"
                          }`}
                        >
                          {page}
                        </button>
                      );
                    },
                  )}

                  {/* Next */}
                  <button
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="p-2 rounded-xl border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              )}

              {/* Page info
              {totalPages > 1 && (
                <p className="text-center text-xs text-gray-400 mt-3">
                  หน้า {currentPage} จาก {totalPages} · ทั้งหมด {savedJobs.length} รายการ
                </p>
              )} */}
            </motion.div>
          ) : (
            <motion.div
              key="empty-state"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="flex flex-col items-center justify-center py-20 bg-white/40 backdrop-blur-md rounded-[3rem] border border-white/60 shadow-sm"
            >
              <div className="p-6 bg-blue-50 rounded-full mb-6">
                <Bookmark className="w-12 h-12 text-blue-300" />
              </div>
              <h3 className="text-2xl font-bold text-gray-800">
                ยังไม่มีงานที่บันทึกไว้
              </h3>
              <p className="text-gray-500 mt-2 mb-8 text-center max-w-xs">
                ลองไปสำรวจงานใหม่ๆ แล้วกดบันทึกงานที่สนใจไว้ที่นี่สิ
              </p>
              <Link href="/find-job">
                <button className="bg-blue-600 text-white font-bold py-4 px-10 rounded-2xl shadow-lg shadow-blue-200 hover:bg-blue-700 transition-all active:scale-95">
                  เริ่มต้นสำรวจงาน
                </button>
              </Link>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
