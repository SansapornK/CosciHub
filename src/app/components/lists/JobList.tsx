'use client';

import React, { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import axios from "axios";
import { useSearchParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
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
  shortDescription: string;
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
  limit?: number;
  searchQuery?: string;
  selectedJobTypes?: string[];
  selectedMajor?: string;
  priceRange?: PriceRange;
  currentSort?: string;
  onResetFilters?: () => void;
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
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" className="h-6 w-6 text-primary-blue-500">
          <path stroke-linecap="round" stroke-linejoin="round" d="M4.26 10.147a60.438 60.438 0 0 0-.491 6.347A48.62 48.62 0 0 1 12 20.904a48.62 48.62 0 0 1 8.232-4.41 60.46 60.46 0 0 0-.491-6.347m-15.482 0a50.636 50.636 0 0 0-2.658-.813A59.906 59.906 0 0 1 12 3.493a59.903 59.903 0 0 1 10.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.717 50.717 0 0 1 12 13.489a50.702 50.702 0 0 1 7.74-3.342M6.75 15a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5Zm0 0v-3.675A55.378 55.378 0 0 1 12 8.443m-7.007 11.55A5.981 5.981 0 0 0 6.75 15.75v-1.5" />
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
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" className="h-6 w-6 text-primary-blue-500">
          <path stroke-linecap="round" stroke-linejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5m-9-6h.008v.008H12v-.008ZM12 15h.008v.008H12V15Zm0 2.25h.008v.008H12v-.008ZM9.75 15h.008v.008H9.75V15Zm0 2.25h.008v.008H9.75v-.008ZM7.5 15h.008v.008H7.5V15Zm0 2.25h.008v.008H7.5v-.008Zm6.75-4.5h.008v.008h-.008v-.008Zm0 2.25h.008v.008h-.008V15Zm0 2.25h.008v.008h-.008v-.008Zm2.25-4.5h.008v.008H16.5v-.008Zm0 2.25h.008v.008H16.5V15Z" />
        </svg>
      );

    // งานประชาสัมพันธ์ / สื่อสารองค์กร
    case "งานประชาสัมพันธ์ / สื่อสารองค์กร":
      return (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" className="h-6 w-6 text-primary-blue-500">
          <path stroke-linecap="round" stroke-linejoin="round" d="M10.34 15.84c-.688-.06-1.386-.09-2.09-.09H7.5a4.5 4.5 0 1 1 0-9h.75c.704 0 1.402-.03 2.09-.09m0 9.18c.253.962.584 1.892.985 2.783.247.55.06 1.21-.463 1.511l-.657.38c-.551.318-1.26.117-1.527-.461a20.845 20.845 0 0 1-1.44-4.282m3.102.069a18.03 18.03 0 0 1-.59-4.59c0-1.586.205-3.124.59-4.59m0 9.18a23.848 23.848 0 0 1 8.835 2.535M10.34 6.66a23.847 23.847 0 0 0 8.835-2.535m0 0A23.74 23.74 0 0 0 18.795 3m.38 1.125a23.91 23.91 0 0 1 1.014 5.395m-1.014 8.855c-.118.38-.245.754-.38 1.125m.38-1.125a23.91 23.91 0 0 0 1.014-5.395m0-3.46c.495.413.811 1.035.811 1.73 0 .695-.316 1.317-.811 1.73m0-3.46a24.347 24.347 0 0 1 0 3.46" />
        </svg>
      );

    // งานสื่อมัลติมีเดีย
    case "งานสื่อมัลติมีเดีย":
      return (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" className="h-6 w-6 text-primary-blue-500">
          <path stroke-linecap="round" stroke-linejoin="round" d="M9.53 16.122a3 3 0 0 0-5.78 1.128 2.25 2.25 0 0 1-2.4 2.245 4.5 4.5 0 0 0 8.4-2.245c0-.399-.078-.78-.22-1.128Zm0 0a15.998 15.998 0 0 0 3.388-1.62m-5.043-.025a15.994 15.994 0 0 1 1.622-3.395m3.42 3.42a15.995 15.995 0 0 0 4.764-4.648l3.876-5.814a1.151 1.151 0 0 0-1.597-1.597L14.146 6.32a15.996 15.996 0 0 0-4.649 4.763m3.42 3.42a6.776 6.776 0 0 0-3.42-3.42" />
        </svg>
      );

    // งานบริการ / ธุรการ
    case "งานบริการ / ธุรการ":
      return (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" className="h-6 w-6 text-primary-blue-500">
          <path stroke-linecap="round" stroke-linejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
        </svg>
      );

    // งานสอนพิเศษ / ติวเตอร์
    case "งานสอนพิเศษ / ติวเตอร์":
      return (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" className="h-6 w-6 text-primary-blue-500">
          <path stroke-linecap="round" stroke-linejoin="round" d="M12 6.042A8.967 8.967 0 0 0 6 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 0 1 6 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 0 1 6-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0 0 18 18a8.967 8.967 0 0 0-6 2.292m0-14.25v14.25" />
        </svg>
      );

    // งานกองถ่าย / Extra
    case "งานกองถ่าย / Extra":
      return (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" className="h-6 w-6 text-primary-blue-500">
          <path stroke-linecap="round" stroke-linejoin="round" d="m15.75 10.5 4.72-4.72a.75.75 0 0 1 1.28.53v11.38a.75.75 0 0 1-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 0 0 2.25-2.25v-9a2.25 2.25 0 0 0-2.25-2.25h-9A2.25 2.25 0 0 0 2.25 7.5v9a2.25 2.25 0 0 0 2.25 2.25Z" />
        </svg>
      );

    // อื่น ๆ (ค่าเริ่มต้น)
    default:
      return (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" className="h-6 w-6 text-primary-blue-500">
          <path stroke-linecap="round" stroke-linejoin="round" d="M3.75 21h16.5M4.5 3h15M5.25 3v18m13.5-18v18M9 6.75h1.5m-1.5 3h1.5m-1.5 3h1.5m3-6H15m-1.5 3H15m-1.5 3H15M9 21v-3.375c0-.621.504-1.125 1.125-1.125h3.75c.621 0 1.125.504 1.125 1.125V21" />
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

        {isLoggedIn && (
          <button 
            onClick={(e) => {
              e.preventDefault();
              console.log("บันทึกงานไอดี:", data.id);
            }}
            className={`p-3 rounded-lg bg-gray-100 ${favBtnClass} hover:bg-gray-200 transition-colors duration-200 cursor-pointer shadow-sm`}
            aria-label={isFav ? "Remove bookmark" : "Add bookmark"}
          >
            <Bookmark className="w-5 h-5" />
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
  onResetFilters,
}: JobListProps) {
  const { status } = useSession();

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

  const isLoggedIn = status === "authenticated";

  /* ---------- Fetch from API ---------- */
  const fetchJobs = async () => {
    setLoading(true);
    setError("");

    try {
      const params: any = {
        page: pageFromUrl,
        limit: initialItemsPerPage,
        sort: currentSort, 
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
            onClick={() => onResetFilters?.()}
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
              details: job.shortDescription,
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
