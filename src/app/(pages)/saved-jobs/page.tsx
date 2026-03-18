'use client';

import React, { useEffect, useState } from "react";
import axios from "axios";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Bookmark, Briefcase, ArrowLeft } from "lucide-react";
import Link from "next/link";

// Import Components & Helpers
import JobCard from "../../components/cards/JobCard";
import Loading from "../../components/common/Loading";
import { calculateTimeAgo, getCategoryIcon } from "@/app/components/utils/jobHelpers";

export default function BookmarksPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  
  const [savedJobs, setSavedJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [savedJobIds, setSavedJobIds] = useState<string[]>([]);

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
    if (status === "authenticated") {
      fetchBookmarks();
    }
  }, [status]);

  const handleToggleBookmark = async (jobId: string) => {
    try {
      await axios.post("/api/bookmarks", { jobId });
      setSavedJobs((prev) => prev.filter((job: any) => job._id !== jobId));
      setSavedJobIds((prev) => prev.filter((id) => id !== jobId));
    } catch (err) {
      alert("ไม่สามารถลบรายการได้");
    }
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
      <section className="relative overflow-hidden py-20 px-10 text-center">
        <div className="absolute top-[-10%] left-[-5%] w-[50%] h-[70%] bg-blue-400/10 rounded-full blur-[100px]" />
        
        <div className="relative z-10 max-w-4xl mx-auto">
          <Link href="/find-job" className="inline-flex items-center text-blue-600 font-bold text-sm mb-6 hover:gap-2 transition-all">
            <ArrowLeft className="w-4 h-4 mr-2" /> ค้นหางานใหม่ ๆ
          </Link>
          
          <h1 className="text-4xl md:text-5xl font-black text-gray-900 tracking-tight leading-tight">
            งานที่ <span className="inline-block text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-500 py-2">คุณบันทึกไว้</span>
          </h1>
          <p className="text-gray-500 mt-3 text-lg">รวมโปรเจกต์ที่คุณสนใจและวางแผนจะสมัครในอนาคต</p>
        </div>
      </section>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 md:px-12">
        <AnimatePresence mode="popLayout">
          {savedJobs.length > 0 ? (
            <motion.div 
              layout
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
            >
              {savedJobs.map((job: any) => (
                <motion.div
                  key={job._id}
                  layout
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8, filter: "blur(10px)" }}
                  transition={{ duration: 0.4 }}
                >
                  <JobCard 
                    isLoggedIn={true}
                    isBookmarked={savedJobIds.includes(job._id)}
                    onToggleBookmark={() => handleToggleBookmark(job._id)}
                    data={{
                      id: job._id,
                      icon: getCategoryIcon(job.category),
                      title: job.title,
                      type: job.category,
                      postedBy: job.owner,
                      details: job.shortDescription,
                      minCompensation: job.budgetMin.toLocaleString(), 
                      maxCompensation: job.budgetMax ? job.budgetMax.toLocaleString() : null,
                      currency: "บาท",
                      timeAgo: calculateTimeAgo(job.postedDate),
                      isVisible: true,
                    }} 
                  />
                </motion.div>
              ))}
            </motion.div>
          ) : (
            /* Empty State */
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col items-center justify-center py-20 bg-white/40 backdrop-blur-md rounded-[3rem] border border-white/60 shadow-sm"
            >
              <div className="p-6 bg-blue-50 rounded-full mb-6">
                <Bookmark className="w-12 h-12 text-blue-300" />
              </div>
              <h3 className="text-2xl font-bold text-gray-800">ยังไม่มีงานที่บันทึกไว้</h3>
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