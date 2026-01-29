'use client';

import React, { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import axios from "axios";
import { useSearchParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Pagination from "../common/Pagination";
import Loading from "../common/Loading";
import JobCard from "../cards/JobCard";
import { calculateTimeAgo, getCategoryIcon } from "@/app/components/utils/jobHelpers";

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
