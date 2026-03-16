// src/app/(pages)/manage-projects/[id]/applicants/page.tsx
'use client';

import React, { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useParams } from "next/navigation";
import axios from "axios";
import Link from "next/link";
import Loading from "../../../../components/common/Loading";
import { toast, Toaster } from "react-hot-toast";

// ─── Interfaces ───────────────────────────────────
interface Applicant {
  _id: string;           // application ID
  userId: string | null;
  applicantName: string;
  applicantEmail: string;
  status: "pending" | "accepted" | "rejected";
  appliedDate: string;
  skills: string[];
  bio: string;
  profileImageUrl: string | null;
  major: string;
  basePrice: number;
}

interface JobInfo {
  _id: string;
  title: string;
  category: string;
  capacity: number;
  status: string;
}

// ─── Helper ───────────────────────────────────────
function getMatchScore(skills: string[], required: string[]): number {
  if (!required.length) return 0;
  return Math.round(
    (skills.filter(s => required.includes(s)).length / required.length) * 100
  );
}

// ─── SkillBadge ───────────────────────────────────
function SkillBadge({ skill }: { skill: string }) {
  return (
    <span className="text-xs px-2.5 py-1 rounded-full font-medium bg-gray-100 text-gray-500">
      {skill}
    </span>
  );
}

// ─── ApplicantCard ────────────────────────────────
function ApplicantCard({
  applicant,
  onAccept,
  onReject,
  isLoading,
}: {
  applicant: Applicant;
  onAccept: (appId: string) => void;
  onReject: (appId: string) => void;
  isLoading: boolean;
}) {
  const statusConfig = {
    pending:  { label: "รอพิจารณา",          className: "bg-yellow-100 text-yellow-700" },
    accepted: { label: "ผ่านการคัดเลือก",    className: "bg-green-100  text-green-700"  },
    rejected: { label: "ไม่ผ่านการคัดเลือก", className: "bg-red-100    text-red-600"    },
  };
  const s = statusConfig[applicant.status];

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 flex flex-col gap-4 hover:shadow-md transition-shadow">

      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-primary-blue-500 flex items-center justify-center text-white font-semibold text-lg flex-shrink-0 overflow-hidden">
            {applicant.profileImageUrl ? (
              <img src={applicant.profileImageUrl} alt={applicant.applicantName} className="w-full h-full object-cover" />
            ) : (
              applicant.applicantName?.charAt(0) || '?'
            )}
          </div>
          <div>
            <p className="font-semibold text-gray-800">{applicant.applicantName}</p>
            {applicant.major && <p className="text-xs text-gray-400">{applicant.major}</p>}
            <p className="text-xs text-gray-400">
              สมัครเมื่อ {new Date(applicant.appliedDate).toLocaleDateString("th-TH")}
            </p>
          </div>
        </div>
        <span className={`text-xs px-2.5 py-1 rounded-full font-medium flex-shrink-0 ${s.className}`}>
          {s.label}
        </span>
      </div>

      {/* Bio */}
      {applicant.bio && (
        <p className="text-sm text-gray-500 line-clamp-2">{applicant.bio}</p>
      )}

      {/* Base Price */}
      {applicant.basePrice > 0 && (
        <p className="text-sm font-medium text-gray-700">
          ราคาเริ่มต้น:{' '}
          <span className="text-primary-blue-600">
            {applicant.basePrice.toLocaleString()} บาท
          </span>
        </p>
      )}

      {/* Skills */}
      {applicant.skills.length > 0 && (
        <div>
          <p className="text-xs text-gray-400 mb-1.5 font-medium">ทักษะ</p>
          <div className="flex flex-wrap gap-1.5">
            {applicant.skills.map(skill => (
              <SkillBadge key={skill} skill={skill} />
            ))}
          </div>
        </div>
      )}

      {/* Action Buttons — แสดงเฉพาะ pending */}
      {applicant.status === "pending" ? (
        <div className="flex gap-2 pt-1">
          {applicant.userId && (
            <Link
              href={`/user/freelancer/${applicant.userId}`}
              target="_blank"
              className="flex-1 text-center text-sm border border-gray-300 text-gray-600 rounded-lg py-2 hover:bg-gray-50 transition-colors"
            >
              ดูโปรไฟล์
            </Link>
          )}
          <button
            className="flex-1 btn-danger text-sm py-2 rounded-lg disabled:opacity-50"
            onClick={() => onReject(applicant._id)}
            disabled={isLoading}
          >
            ปฏิเสธ
          </button>
          <button
            className="flex-1 btn-primary text-sm py-2 rounded-full disabled:opacity-50"
            onClick={() => onAccept(applicant._id)}
            disabled={isLoading}
          >
            รับเข้าทำงาน
          </button>
        </div>
      ) : (
        applicant.userId && (
          <Link
            href={`/user/freelancer/${applicant.userId}`}
            target="_blank"
            className="text-center text-sm border border-gray-300 text-gray-600 rounded-lg py-2 hover:bg-gray-50 transition-colors"
          >
            ดูโปรไฟล์
          </Link>
        )
      )}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────
export default function ApplicantsPage() {
  const { data: session, status: authStatus } = useSession();
  const router = useRouter();
  const params = useParams();
  const jobId = params.id as string; // ← ใช้เป็น jobId

  const [job, setJob]               = useState<JobInfo | null>(null);
  const [applicants, setApplicants] = useState<Applicant[]>([]);
  const [loading, setLoading]       = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError]           = useState<string | null>(null);
  const [pendingCount, setPendingCount]   = useState(0);
  const [acceptedCount, setAcceptedCount] = useState(0);

  // ─── Redirect ─────────────────────────────────
  useEffect(() => {
    if (authStatus === 'unauthenticated') router.push('/auth?state=login');
    if (authStatus === 'authenticated' && session?.user?.role === 'student') router.push('/');
  }, [authStatus, session]);

  // ─── Fetch ────────────────────────────────────
  useEffect(() => {
    if (authStatus === 'authenticated') fetchData();
  }, [authStatus, jobId]);

  const fetchData = async () => {
    setLoading(true);
    try {
      // ✅ ดึงจาก Application collection ผ่าน ?jobId=
      const res = await axios.get(`/api/applications`, {
        params: { jobId },
      });

      setJob(res.data.job);
      setApplicants(res.data.applications || []);
      setPendingCount(res.data.pendingCount || 0);
      setAcceptedCount(res.data.acceptedCount || 0);
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.error || 'ไม่สามารถโหลดข้อมูลได้ กรุณาลองใหม่');
    } finally {
      setLoading(false);
    }
  };

  // ─── Accept ───────────────────────────────────
  const handleAccept = async (appId: string) => {
    setActionLoading(true);
    try {
      const res = await axios.patch(`/api/applications/${appId}`, {
        action: "accept",
      });

      if (res.data.success) {
        toast.success(res.data.message);
        if (res.data.isFull) {
          setTimeout(() => router.push('/manage-projects'), 1200);
        } else {
          await fetchData();
        }
      } else {
        toast.error(res.data.error || 'เกิดข้อผิดพลาด');
      }
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'เกิดข้อผิดพลาด');
    } finally {
      setActionLoading(false);
    }
  };

  // ─── Reject ───────────────────────────────────
  const handleReject = async (appId: string) => {
    setActionLoading(true);
    try {
      const res = await axios.patch(`/api/applications/${appId}`, {
        action: "reject",
      });

      if (res.data.success) {
        toast.success('ปฏิเสธใบสมัครแล้ว');
        setApplicants(prev =>
          prev.map(a => a._id === appId ? { ...a, status: "rejected" } : a)
        );
        setPendingCount(prev => Math.max(0, prev - 1));
      } else {
        toast.error(res.data.error || 'เกิดข้อผิดพลาด');
      }
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'เกิดข้อผิดพลาด');
    } finally {
      setActionLoading(false);
    }
  };

  // ─── Render ───────────────────────────────────
  if (loading) return (
    <div className="flex flex-col items-center justify-center h-screen">
      <Loading size="large" color="primary" />
      <p className="mt-4 text-gray-500">กำลังโหลดข้อมูล...</p>
    </div>
  );

  if (error) return (
    <div className="bg-red-50 border border-red-200 rounded-xl p-8 text-center mt-10">
      <p className="text-red-600 font-medium">{error}</p>
      <Link href="/manage-projects" className="mt-4 inline-block btn-secondary">
        กลับหน้าจัดการโปรเจกต์
      </Link>
    </div>
  );

  const capacity  = job?.capacity || 1;
  const remaining = capacity - acceptedCount;

  return (
    <div className="flex flex-col gap-6 pb-10 max-w-7xl mx-auto w-full">
      <Toaster position="bottom-left" />

      {/* Header */}
      <section className="mt-6 p-6 bg-primary-blue-500 rounded-xl">
        <Link
          href="/manage-projects"
          className="text-white/70 hover:text-white text-sm flex items-center gap-1 mb-3 w-fit"
        >
          ← กลับหน้าจัดการโปรเจกต์
        </Link>
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="font-semibold text-xl text-white">ผู้สมัครงาน</h1>
            <p className="text-white/80 text-sm mt-1 line-clamp-1">{job?.title}</p>
            <p className="text-white/60 text-xs mt-0.5">{job?.category}</p>
          </div>
          <div className="bg-white/20 rounded-xl px-4 py-2 text-white text-center flex-shrink-0">
            <p className="text-2xl font-bold">{applicants.length}</p>
            <p className="text-xs text-white/70">ผู้สมัคร</p>
          </div>
        </div>
      </section>

      {/* Quota Progress */}
      <div className="bg-white border border-gray-200 rounded-xl p-4 flex items-center gap-4">
        <div className="flex-1">
          <div className="flex justify-between text-sm mb-1.5">
            <span className="font-medium text-gray-700">รับแล้ว / รับทั้งหมด</span>
            <span className={`font-bold ${remaining <= 0 ? 'text-green-600' : 'text-primary-blue-600'}`}>
              {acceptedCount} / {capacity} คน
            </span>
          </div>
          <div className="w-full bg-gray-100 rounded-full h-2.5">
            <div
              className={`h-2.5 rounded-full transition-all ${remaining <= 0 ? 'bg-green-500' : 'bg-primary-blue-500'}`}
              style={{ width: `${Math.min((acceptedCount / capacity) * 100, 100)}%` }}
            />
          </div>
        </div>
        {remaining <= 0 ? (
          <span className="text-xs bg-green-100 text-green-700 px-3 py-1 rounded-full font-medium whitespace-nowrap">
            รับครบแล้ว ✓
          </span>
        ) : (
          <span className="text-xs bg-blue-100 text-blue-700 px-3 py-1 rounded-full font-medium whitespace-nowrap">
            รับได้อีก {remaining} คน
          </span>
        )}
      </div>

      {/* Stats row */}
      <div className="flex gap-2 flex-wrap">
        <span className="text-xs bg-gray-100 text-gray-600 px-3 py-1.5 rounded-full">
          ทั้งหมด {applicants.length} คน
        </span>
        <span className="text-xs bg-yellow-100 text-yellow-700 px-3 py-1.5 rounded-full">
          รอพิจารณา {pendingCount} คน
        </span>
        <span className="text-xs bg-green-100 text-green-700 px-3 py-1.5 rounded-full">
          ผ่านการคัดเลือก {acceptedCount} คน
        </span>
        <span className="text-xs bg-red-100 text-red-600 px-3 py-1.5 rounded-full">
          ไม่ผ่าน {applicants.length - pendingCount - acceptedCount} คน
        </span>
      </div>

      {/* Applicant List */}
      {applicants.length === 0 ? (
        <div className="bg-gray-50 border border-dashed border-gray-300 rounded-xl p-10 text-center">
          <p className="text-gray-500">ยังไม่มีผู้สมัครในขณะนี้</p>
          <Link href="/manage-projects" className="mt-4 inline-block btn-secondary text-sm">
            กลับหน้าจัดการโปรเจกต์
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {/* เรียง pending ก่อน → accepted → rejected */}
          {[...applicants]
            .sort((a, b) => {
              const order = { pending: 0, accepted: 1, rejected: 2 };
              return order[a.status] - order[b.status];
            })
            .map(applicant => (
              <ApplicantCard
                key={applicant._id}
                applicant={applicant}
                onAccept={handleAccept}
                onReject={handleReject}
                isLoading={actionLoading}
              />
            ))}
        </div>
      )}
    </div>
  );
}
