'use client';

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import axios from "axios";
import { 
  User, MapPin, Clock, Wallet, Users, 
  Bookmark, AlertCircle, BriefcaseBusiness 
} from 'lucide-react';
import Link from 'next/link';
import Loading from "../../../components/common/Loading";
import { useSession } from "next-auth/react";
import { calculateTimeAgo } from "@/app/components/utils/jobHelpers";

interface JobDetail {
  _id: string;
  title: string;
  description: string;      
  qualifications?: string; 
  category: string;
  postedDate: string;
  owner: string;
  jobType?: string;   
  location?: string;       
  duration?: string;       
  budgetMin: number;
  budgetMax: number | null;
  capacity?: number;      
}

const DetailRow = ({ label, value }: { label: string; value: string }) => (
  <div className="flex gap-4 text-sm md:text-base mb-2">
    <span className="font-bold text-gray-800 w-24 shrink-0">{label}</span>
    <span className="text-gray-600">{value}</span>
  </div>
);

const JobDetailPage = () => {
    const params = useParams();
    const router = useRouter();
    const { data: session, status } = useSession();
    
    const [job, setJob] = useState<JobDetail | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [hasApplied, setHasApplied] = useState(false); // เช็คว่าสมัครไปหรือยัง
    const [applying, setApplying] = useState(false); // Loading 
    const [isBookmarked, setIsBookmarked] = useState(false);

    const isLoggedIn = status === "authenticated";

    useEffect(() => {
        const fetchJobData = async () => {
            try {
                setLoading(true);
                const res = await axios.get(`/api/jobs/${params.id}`);
                setJob(res.data);

                if (status === "authenticated") {
                    const checkRes = await axios.get(`/api/applications/check?jobId=${params.id}`);
                    setHasApplied(checkRes.data.hasApplied);
                }
            } catch (err) {
                console.error(err);
                setError("ไม่พบข้อมูลงานที่คุณกำลังเรียกดู");
            } finally {
                setLoading(false);
            }
        };

        if (params.id) fetchJobData();
    }, [params.id, status]);

    const handleApplyClick = () => {
        if (!isLoggedIn) {
            const loginUrl = `/auth?state=login&callbackUrl=/find-job/${params.id}`;
            router.push(loginUrl); 
            return; 
        }
        setIsModalOpen(true);
    };

    const confirmApplication = async () => {
        if (!job) return;
        try {
            setApplying(true);
            const response = await axios.post("/api/applications", {
                jobId: job._id
            });

            if (response.status === 201) {
                setHasApplied(true);
                setIsModalOpen(false);
                alert("ส่งใบสมัครเรียบร้อยแล้ว! ผู้ว่าจ้างจะได้รับการแจ้งเตือนของคุณ");
            }
        } catch (err: any) {
            const errorMsg = err.response?.data?.error || "เกิดข้อผิดพลาดในการส่งใบสมัคร";
            alert(errorMsg);
        } finally {
            setApplying(false);
        }
    };

    /* ---------- Logic: Bookmark ---------- */
    const toggleBookmark = async () => {
        if (!isLoggedIn) {
            router.push(`/auth?state=login&callbackUrl=/find-job/${params.id}`);
            return;
        }
        try {
            const res = await axios.post("/api/bookmarks", { jobId: job?._id });
            setIsBookmarked(res.data.isBookmarked);
        } catch (err) {
            alert("ไม่สามารถดำเนินการบันทึกงานได้");
        }
    };


    if (loading) return <div className="h-screen flex justify-center items-center"><Loading /></div>;
    
    if (error || !job) return (
        <div className="h-screen flex flex-col justify-center items-center gap-4">
            <AlertCircle className="w-12 h-12 text-red-500" />
            <p className="text-gray-600">{error}</p>
            <Link href="/find-job" className="text-primary-blue-500 underline">กลับไปหน้าหางาน</Link>
        </div>
    );

    return (
        <div className="min-h-screen">
            <nav className="max-w-6xl mx-auto px-6 py-6 flex items-center gap-2 text-sm md:text-base">
                <Link href="/find-job" className="flex items-center gap-2 text-gray-500 hover:text-primary-blue-500 transition-colors font-medium">
                    <BriefcaseBusiness className="w-5 h-5 text-primary-blue-500" />
                    <span>ค้นหางานพิเศษ</span>
                </Link>
                <span className="text-gray-300 font-light px-1">/</span>
                <span className="text-gray-400 truncate max-w-[500px]">{job.title}</span>
            </nav>

            <main className="max-w-6xl mx-auto px-4 pb-12">
                <div className="bg-white rounded-[2.5rem] shadow-sm border border-gray-100 overflow-hidden">
                    <div className="p-8 md:p-14">
                        <div className="flex flex-col lg:flex-row justify-between gap-12">
                            <div className="flex-1">
                                <h1 className="text-3xl font-bold text-gray-900 mb-3">{job.title}</h1>
                                <div className="inline-block px-4 py-2 bg-gray-100 rounded-full text-sm font-medium mb-4">{job.category}</div>
                                <p className="text-blue-400 text-sm mb-10">โพสต์เมื่อ {calculateTimeAgo(job.postedDate)}</p>

                                <section className="mb-10">
                                    <h2 className="text-xl font-bold text-gray-800 mb-4">รายละเอียดงาน</h2>
                                    <div className="text-gray-600 leading-relaxed whitespace-pre-line">{job.description}</div>
                                </section>

                                {job.qualifications && (
                                    <section>
                                        <h2 className="text-xl font-bold text-gray-800 mb-4">คุณสมบัติผู้สมัคร</h2>
                                        <div className="text-gray-600 leading-relaxed whitespace-pre-line">{job.qualifications}</div>
                                    </section>
                                )}
                            </div>

                            <div className="w-full lg:w-80 shrink-0">
                                <div className="space-y-6 bg-gray-50/50 p-6 rounded-3xl border border-gray-50 mb-8">
                                    <SidebarItem icon={<User />} label={job.owner}/>
                                    <SidebarItem icon={<MapPin />} label={`${job.jobType || "ออนไลน์"} / ${job.location || "ทำงานออนไลน์" }`} iconColor="text-red-400" />
                                    <SidebarItem icon={<Clock />} label={job.duration || "ตามตกลง"} iconColor="text-amber-500" />
                                    <SidebarItem icon={<Wallet />} label={`${job.budgetMin.toLocaleString()} ${job.budgetMax ? `- ${job.budgetMax.toLocaleString()}` : ""} บาท`} iconColor="text-emerald-500" />
                                    <SidebarItem icon={<Users />} label={`${job.capacity || 1} คน`} iconColor="text-indigo-500" />
                                </div>

                                <div className="flex items-center gap-3">
                                    <button 
                                        onClick={handleApplyClick}
                                        disabled={hasApplied || applying}
                                        className={`flex-grow py-4 px-6 rounded-2xl text-lg font-bold transition-all active:scale-95 shadow-lg 
                                            ${hasApplied 
                                                ? "bg-gray-200 text-gray-500 cursor-not-allowed shadow-none" 
                                                : "bg-blue-600 hover:bg-blue-700 text-white shadow-blue-100"}`}
                                    >
                                        {hasApplied ? "คุณสมัครงานนี้แล้ว" : (applying ? "กำลังสมัคร..." : "สมัครงานนี้")}
                                    </button>

                                    {isLoggedIn && (
                                        <button 
                                            onClick={toggleBookmark}
                                            className={`p-4 rounded-2xl border-2 transition-all ${
                                                isBookmarked 
                                                ? "bg-blue-50 border-blue-200 text-blue-500 shadow-sm" 
                                                : "border-gray-100 text-gray-400 hover:text-blue-500 hover:border-blue-100"
                                            }`}
                                        >
                                            <Bookmark className={`w-6 h-6 ${isBookmarked ? "fill-current" : ""}`} />
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </main>

            {/* Modal ยืนยัน */}
            {isModalOpen && job && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <div className="bg-white rounded-[3rem] shadow-2xl w-full max-w-2xl overflow-hidden p-8 md:p-12 text-center">
                        <h2 className="text-3xl font-bold text-gray-900 mb-4">ยืนยันการสมัครงาน</h2>
                        <div className="text-left bg-gray-50 rounded-[2rem] p-6 mb-8 border border-gray-100">
                            <DetailRow label="ชื่องาน" value={job.title} />
                            <DetailRow label="ผู้ว่าจ้าง" value={job.owner} />
                            <DetailRow label="ค่าตอบแทน" value={`${job.budgetMin.toLocaleString()} บาท`} />
                        </div>
                        <div className="flex gap-4 justify-center">
                            <button onClick={() => setIsModalOpen(false)} className="px-8 py-4 bg-gray-200 text-gray-600 font-bold rounded-2xl">ยกเลิก</button>
                            <button 
                                onClick={confirmApplication} 
                                disabled={applying}
                                className="px-8 py-4 bg-green-500 text-white font-bold rounded-2xl shadow-lg shadow-green-100"
                            >
                                {applying ? "กำลังส่งข้อมูล..." : "ยืนยันการสมัคร"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

const SidebarItem = ({ icon, label, iconColor = "text-blue-500" }: { icon: React.ReactNode; label: string; iconColor?: string }) => (
    <div className="flex items-center gap-4 text-gray-700">
        <div className={`${iconColor} shrink-0`}>{React.cloneElement(icon as React.ReactElement, { size: 20 })}</div>
        <span className="font-medium">{label}</span>
    </div>
);

export default JobDetailPage;