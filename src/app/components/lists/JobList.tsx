'use client';

import React, { useState, useEffect } from "react";
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
  requiredSkills: string[];
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
  selectedSkills?: string[];
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

const JobCard = ({ data }: { data: JobCardData }) => {
  const compensation = data.maxCompensation
    ? `${data.minCompensation} - ${data.maxCompensation}`
    : `${data.minCompensation}+`;

  return (
    <div className="bg-white shadow rounded-xl p-6 flex flex-col h-full border">
      <div className="text-xs text-blue-400 mb-2 text-right">
        โพสต์เมื่อ {data.timeAgo}
      </div>

      <div className="flex items-center gap-3 mb-3">
        {data.icon}
        <h3 className="font-semibold text-lg">{data.title}</h3>
      </div>

      <span className="text-xs bg-gray-100 px-3 py-1 rounded-full w-fit mb-1">
        {data.type}
      </span>

      <p className="text-sm text-blue-400 mb-3">โดย {data.postedBy}</p>

      <p className="text-sm text-gray-500 line-clamp-3 mb-4">
        {data.details}
      </p>

      <div className="mt-auto flex justify-between items-center">
        <span className="text-sm">งบประมาณ</span>
        <span className="text-lg font-bold">
          {compensation} {data.currency}
        </span>
      </div>

      <Link
        href={`/project/${data.id}`}
        className="mt-4 bg-primary-blue-500 text-white text-center py-2 rounded-lg hover:bg-primary-blue-600"
      >
        ดูรายละเอียดงาน
      </Link>
    </div>
  );
};

/* ===================== Main Component ===================== */

function JobList({
  initialItemsPerPage = 12,
  searchQuery = "",
  selectedSkills = [],
  selectedMajor = "",
  priceRange = { min: 0, max: null },
  currentSort = "default",
}: JobListProps) {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [jobItems, setJobItems] = useState<JobItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(initialItemsPerPage);
  const [totalItems, setTotalItems] = useState(0);

  /* ---------- Fetch from API ---------- */
  const fetchJobs = async () => {
    setLoading(true);
    setError("");

    try {
      const params: any = {
        page: currentPage,
        limit: itemsPerPage,
        sort: currentSort,
      };

      if (searchQuery) params.q = searchQuery;
      if (selectedMajor) params.major = selectedMajor;
      if (selectedSkills.length > 0)
        params.skills = selectedSkills.join(",");
      if (priceRange.min > 0) params.minPrice = priceRange.min;
      if (priceRange.max !== null) params.maxPrice = priceRange.max;

      const res = await axios.get("/api/jobs", { params });

      setJobItems(res.data.jobs);
      setTotalItems(res.data.total);
    } catch (err) {
      setError("ไม่สามารถโหลดข้อมูลงานได้");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJobs();
  }, [
    currentPage,
    searchQuery,
    selectedSkills,
    selectedMajor,
    priceRange,
    currentSort,
  ]);

  /* ---------- Pagination from URL ---------- */
  const totalPages = Math.ceil(totalItems / itemsPerPage);

  useEffect(() => {
    const page = Number(searchParams.get("page") || 1);
    if (page > 0 && page <= totalPages) {
      setCurrentPage(page);
    }
  }, [searchParams, totalPages]);

  /* ---------- Map Data ---------- */
  const mapToCard = (job: JobItem): JobCardData => ({
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
  });

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
          <JobCard key={job._id} data={mapToCard(job)} />
        ))}
      </section>

      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        baseUrl="/find-job"
      />
    </div>
  );
}

export default JobList;
