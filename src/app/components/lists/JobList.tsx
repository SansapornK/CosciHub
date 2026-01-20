'use client';

import React, { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import axios from "axios";
import { useSearchParams, useRouter } from "next/navigation";

import Pagination from "../common/Pagination";
import Loading from "../common/Loading";

/* ===================== Interfaces ===================== */

interface PriceRange {
  min: number;
  max: number | null;
}

interface JobItem {
  _id: string;
  title: string;
  description: string;
  budgetMin: number;
  budgetMax: number | null;
  category: string;
  postedDate: string;
  owner: string;
}

interface JobCardData {
  id: string;
  icon: JSX.Element;
  title: string;
  type: string;
  postedBy: string;
  minCompensation: string;
  maxCompensation: string | null;
  details: string;
  currency: string;
  timeAgo: string;
  isFavorite: boolean;
  isVisible: boolean;
}

interface JobListProps {
  initialItemsPerPage?: number;
  searchQuery?: string;
  selectedJobTypes?: string[];
  selectedMajor?: string;
  priceRange?: PriceRange;
  currentSort?: string;
}

/* ===================== Helpers ===================== */

const calculateTimeAgo = (dateString: string): string => {
  const diff = Date.now() - new Date(dateString).getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  if (days <= 0) return "วันนี้";
  if (days === 1) return "1 วันที่แล้ว";
  if (days < 7) return `${days} วันที่แล้ว`;
  return "มากกว่า 1 สัปดาห์";
};

const getCategoryIcon = (category: string) => {
  switch (category) {
    // งานด้านวิชาการ / วิจัย / ผู้ช่วยวิจัย
    case "งานด้านวิชาการ / วิจัย / ผู้ช่วยวิจัย":
      return (
        <svg className="h-6 w-6 text-primary-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 14l9-5-9-5-9 5 9 5z" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 14l6.16-3.422A12.083 12.083 0 0112 21.5a12.083 12.083 0 01-6.16-10.922L12 14z" />
        </svg>
      );

    // งานพัฒนาเว็บไซต์ / แอป / ระบบ
    case "งานพัฒนาเว็บไซต์ / แอปพลิเคชัน / ระบบต่าง ๆ":
      return (
        <svg className="h-6 w-6 text-primary-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M16 18l6-6-6-6M8 6l-6 6 6 6" />
        </svg>
      );

    // งานกิจกรรม / อีเวนต์
    case "งานกิจกรรม / อีเวนต์":
      return (
        <svg className="h-6 w-6 text-primary-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3M3 11h18M5 19h14a2 2 0 002-2v-8H3v8a2 2 0 002 2z" />
        </svg>
      );

    // งานประชาสัมพันธ์ / สื่อสารองค์กร
    case "งานประชาสัมพันธ์ / สื่อสารองค์กร":
      return (
        <svg className="h-6 w-6 text-primary-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M11 5l7 7-7 7M5 5v14" />
        </svg>
      );

    // งานสื่อมัลติมีเดีย
    case "งานสื่อมัลติมีเดีย":
      return (
        <svg className="h-6 w-6 text-primary-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14" />
          <rect x="3" y="6" width="12" height="12" rx="2" ry="2" />
        </svg>
      );

    // งานบริการ / ธุรการ
    case "งานบริการ / ธุรการ":
      return (
        <svg className="h-6 w-6 text-primary-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6M7 4h10a2 2 0 012 2v12a2 2 0 01-2 2H7a2 2 0 01-2-2V6a2 2 0 012-2z" />
        </svg>
      );

    // งานสอนพิเศษ / ติวเตอร์
    case "งานสอนพิเศษ / ติวเตอร์":
      return (
        <svg className="h-6 w-6 text-primary-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 6l8 4-8 4-8-4 8-4z" />
        </svg>
      );

    // งานกองถ่าย / Extra
    case "งานกองถ่าย / Extra":
      return (
        <svg className="h-6 w-6 text-primary-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M7 4h10l2 4H5l2-4zM5 8v12h14V8" />
        </svg>
      );

    // อื่น ๆ (ค่าเริ่มต้น)
    default:
      return (
        <svg className="h-6 w-6 text-primary-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2" />
        </svg>
      );
  }
};

/* ===================== JobCard ===================== */
import { Bookmark, DollarSign, User, Tag, Briefcase } from 'lucide-react'; 

const JobCard = ({ data, isLoggedIn }: { data: JobCardData, isLoggedIn: boolean }) => {
  const compensation = data.maxCompensation
    ? `${data.minCompensation} - ${data.maxCompensation}`
    : `${data.minCompensation}+`;

  const isFav = data.isFavorite; 
  const favBtnClass = isFav ? 'text-primary-blue-500 fill-current' : 'text-gray-400';

  return (
    <div className="bg-white shadow-lg rounded-xl p-6 flex flex-col border border-gray-200 transition-shadow duration-300 relative hover:shadow-xl">
      {/* <div className="text-xs text-blue-400 mb-2 text-right"> */}
      <div className="absolute top-4 right-6 text-xs text-blue-400 text-center">
        โพสต์เมื่อ {data.timeAgo}
      </div>

      <div className="flex items-center gap-3 mb-3 mt-4">
        {data.icon}
        <h3 className="text-lg font-semibold text-gray-800">{data.title}</h3>
      </div>

      <div className="flex flex-col items-start mb-4">
        <span className="text-xs font-medium text-primary-blue-700 bg-gray-100 px-3 py-1 rounded-full mb-1">
        {data.type}
        </span>

        <p className="text-sm text-blue-400 mt-1">โดย {data.postedBy}</p>
      </div>

      {/* Job Description */}
      <div className="mb-4">
        <p className="text-sm font-medium text-gray-800 mb-1 text-start">คำอธิบายงาน :</p>
        <p className="text-sm text-gray-500 line-clamp-3 text-start">
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
        <Link href={`/find-job/${data.id}`} className="flex-grow">
          <button className="bg-primary-blue-500 text-white text-base py-3 px-4 rounded-lg w-full hover:bg-primary-blue-600 transition-colors">
            ดูรายละเอียดงาน
          </button>
        </Link>

        {/* เพิ่มเงื่อนไขการเช็ค Login เข้าไปร่วมกับ isVisible */}
        {isLoggedIn && data.isVisible && (
          <button 
            className={`p-3 rounded-lg bg-gray-100 ${favBtnClass} hover:bg-gray-200 transition-colors duration-200 cursor-pointer`}
            aria-label={isFav ? "Remove bookmark" : "Add bookmark"}
          >
            <Bookmark className="w-5 h-5 fill-current"/>
          </button>
        )}
      </div>
    </div>
  );
};

/* ===================== Main Component ===================== */

function JobList({
  initialItemsPerPage = 12,
  searchQuery = "",
  selectedJobTypes = [],
  selectedMajor = "",
  priceRange = { min: 0, max: null },
  currentSort = "latest",
}: JobListProps) {
  const searchParams = useSearchParams();
  const router = useRouter();

  const pageFromUrl = useMemo(() => {
    return Number(searchParams.get("page") || 1);
  }, [searchParams]);

  const [jobItems, setJobItems] = useState<JobItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("token"); // หรือตรวจสอบตามระบบ Auth ของคุณ
    setIsLoggedIn(!!token);
  }, []);

  /* ---------- Fetch from API ---------- */
  const fetchJobs = async () => {
    setLoading(true);
    setError("");

    try {
      const params: any = {
        page: pageFromUrl,
        limit: initialItemsPerPage,
        sort: currentSort, // ✅ ส่งค่า Sort ไปที่ API
      };

      if (searchQuery) params.q = searchQuery;
      if (selectedJobTypes.length > 0)
        params.jobTypes = selectedJobTypes.join(",");
      if (selectedMajor) params.major = selectedMajor;
      if (priceRange.min > 0) params.minPrice = priceRange.min;
      if (priceRange.max !== null) params.maxPrice = priceRange.max;
      if (currentSort !== "default") params.sort = currentSort;

      const res = await axios.get("/api/jobs", { params });

      setJobItems(res.data.jobs);
      setTotalItems(res.data.total);
    } catch {
      setError("ไม่สามารถโหลดข้อมูลงานได้");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJobs();
  }, [
    pageFromUrl, 
    searchQuery,
    selectedJobTypes,
    selectedMajor,
    priceRange,
    currentSort
  ]);
  

  const totalPages = Math.ceil(totalItems / initialItemsPerPage);

  // useEffect(() => {
  //   const page = Number(searchParams.get("page") || 1);
  //   if (page > 0 && page <= totalPages) {
  //     setCurrentPage(page);
  //   }
  // }, [searchParams, totalPages]);
  const getPaginationBaseUrl = () => {
    const current = new URLSearchParams(Array.from(searchParams.entries()));
    current.delete("page"); // ลบ page ออกเพื่อให้ Pagination ใส่เอง
    const queryString = current.toString();
    return `/find-job${queryString ? `?${queryString}` : ""}`;
  };

  /* ---------- Render ---------- */
  if (loading) {
    return (
      <div className="py-10 text-center">
        <Loading />
        <p className="mt-3 text-gray-500">กำลังโหลดข้อมูลงาน...</p>
      </div>
    );
  }

  if (error) {
    return <div className="text-red-600 text-center">{error}</div>;
  }

  if (jobItems.length === 0) {
    return (
      <div className="text-center py-10 text-gray-500">
        ไม่พบงานที่ตรงตามเงื่อนไข
        <div>
          <button
            onClick={() => router.push("/find-job")}
            className="mt-4 bg-primary-blue-500 text-white px-4 py-2 rounded"
          >
            ล้างตัวกรอง
          </button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {jobItems.map((job) => (
          <JobCard
            key={job._id}
            isLoggedIn={isLoggedIn}
            data={{
              id: job._id,
              icon: getCategoryIcon(job.category),
              title: job.title,
              type: job.category,
              postedBy: job.owner,
              details: job.description,
              minCompensation: job.budgetMin.toLocaleString(),
              maxCompensation: job.budgetMax
                ? job.budgetMax.toLocaleString()
                : null,
              currency: "บาท",
              timeAgo: calculateTimeAgo(job.postedDate),
              isFavorite: false,
              isVisible: true,
            }}
          />
        ))}
      </section>

      <div className="mt-8">
        <Pagination
          currentPage={pageFromUrl}
          totalPages={totalPages}
          baseUrl="/find-job" 
        />
      </div>
    </div>
  );
}

export default JobList;
