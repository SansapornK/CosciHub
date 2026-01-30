'use client';

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import axios from "axios";
import { 
  User, MapPin, Clock, Wallet, Users, 
  Bookmark, ChevronLeft, AlertCircle, BriefcaseBusiness 
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
    const [job, setJob] = useState<JobDetail | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const { status } = useSession();
    const router = useRouter();

    const isLoggedIn = status === "authenticated";
  
    const [isModalOpen, setIsModalOpen] = useState(false);
  
    const handleApplyClick = () => {
    if (!isLoggedIn) {
        // ✅ ระบุ URL ตามที่คุณแจ้งมา พร้อมส่ง callbackUrl เพื่อให้ login เสร็จแล้วกลับมาหน้าเดิม
        const loginUrl = `/auth?state=login&callbackUrl=/find-job/${params.id}`;
        router.push(loginUrl); 
        
        // ✅ สำคัญมาก: ต้องใส่ return เพื่อไม่ให้ setIsModalOpen(true) ทำงานต่อ
        return; 
        }

        // จะทำงานเมื่อ isLoggedIn เป็น true เท่านั้น
        setIsModalOpen(true);
    };

    const confirmApplication = async () => {
        try {
        console.log("กำลังส่งใบสมัครสำหรับงานไอดี:", job?._id);
        // ตรงนี้คือจุดที่ต้องเชื่อมต่อ API ในอนาคต
        
        setIsModalOpen(false); // ปิด Popup
        alert("ส่งใบสมัครเรียบร้อยแล้ว!"); // แจ้งเตือนผู้ใช้
        } catch (err) {
        console.error("สมัครงานไม่สำเร็จ", err);
        }
    };

  useEffect(() => {
    const fetchJobDetail = async () => {
      try {
        setLoading(true);
        const res = await axios.get(`/api/jobs/${params.id}`);
        setJob(res.data);
      } catch (err) {
        console.error(err);
        setError("ไม่พบข้อมูลงานที่คุณกำลังเรียกดู");
      } finally {
        setLoading(false);
      }
    };

    if (params.id) fetchJobDetail();
  }, [params.id]);

  if (loading) return <div className="h-screen flex justify-center items-center"><Loading /></div>;
  if (error || !job) return (
    <div className="h-screen flex flex-col justify-center items-center gap-4">
      <AlertCircle className="w-12 h-12 text-red-500" />
      <p className="text-gray-600">{error}</p>
      <Link href="/find-job" className="text-primary-blue-500 underline">กลับไปหน้าหางาน</Link>
    </div>
  );

  return (
    <div className="min-h-scree">
      {/* Navigation */}
        <nav className="max-w-6xl mx-auto px-6 py-6 flex items-center gap-2 text-sm md:text-base">
            <Link 
                href="/find-job" 
                className="flex items-center gap-2 text-gray-500 hover:text-primary-blue-500 transition-colors font-medium group"
            >
                <BriefcaseBusiness className="w-4 h-4 md:w-5 md:h-5 text-primary-blue-500" />
                <span>ค้นหางานพิเศษ</span>
            </Link>
            <span className="text-gray-300 font-light px-1">/</span>

            <span className="text-gray-400 truncate max-w-[180px] md:max-w-[500px]">
                {job?.title || "รายละเอียดงาน"}
            </span>
        </nav>

      <main className="max-w-6xl mx-auto px-4">
        <div className="bg-white rounded-[2.5rem] shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-8 md:p-14">
            <div className="flex flex-col lg:flex-row justify-between gap-12">
              
              <div className="flex-1">
                <h1 className="text-3xl font-bold text-gray-900 mb-3">{job.title}</h1>
                
                <div className="inline-block px-4 py-2 bg-gray-100 rounded-full text-sm font-medium mb-4">
                  {job.category}
                </div>
                
                <p className="text-blue-400 text-sm mb-10">
                    โพสต์เมื่อ {calculateTimeAgo(job.postedDate)}
                </p>

                {/* รายละเอียดงาน */}
                <section className="mb-10">
                  <h2 className="text-l font-bold text-gray-800 mb-4">รายละเอียดงาน</h2>
                  <div className="text-gray-600 leading-relaxed whitespace-pre-line">
                    {job.description}
                  </div>
                </section>

                {/* คุณสมบัติ */}
                {job.qualifications && (
                  <section>
                    <h2 className="text-l font-bold text-gray-800 mb-4">คุณสมบัติผู้สมัคร</h2>
                    <div className="text-gray-600 leading-relaxed whitespace-pre-line">
                      {job.qualifications}
                    </div>
                  </section>
                )}
              </div>

              <div className="w-full lg:w-80 shrink-0">
                <div className="space-y-6 bg-gray-50/50 p-6 rounded-3xl border border-gray-50">
                  <SidebarItem icon={<User />} label={job.owner}/>
                  <SidebarItem 
                        icon={<MapPin />} 
                        label={`${job.jobType || "ออนไลน์"} / ${job.location || "ทำงานออนไลน์" }`} 
                        iconColor="text-red-400"
                    />
                  <SidebarItem icon={<Clock />} label={job.duration || "ตามระยะเวลาที่ตกลง"} iconColor="text-amber-500" />
                  <SidebarItem icon={<Wallet />} label={`${job.budgetMin.toLocaleString()} ${job.budgetMax ? `- ${job.budgetMax.toLocaleString()}` : ""} บาท`} iconColor="text-emerald-500" />
                  <SidebarItem icon={<Users />} label={`${job.capacity || 1} คน`} iconColor="text-indigo-500" />
                </div>

                <div className="flex items-center gap-3">
                    <button 
                        onClick={handleApplyClick}
                        className="flex-grow bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 px-6 rounded-2xl text-lg transition-all active:scale-95 shadow-lg shadow-blue-100"
                        >
                        สมัครงานนี้
                    </button>

                  {isLoggedIn && (
                    <button 
                      onClick={() => console.log("บันทึกงานไอดี:", job._id)}
                      className="p-4 rounded-2xl border-2 border-gray-100 text-gray-400 hover:text-blue-500 hover:border-blue-100 hover:bg-blue-50 transition-all"
                    >
                      <Bookmark className="w-6 h-6" />
                    </button>
                  )}
                </div>
                <>
                {/* Job Application Confirmation Modal */}
                {isModalOpen && job && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white rounded-[3rem] shadow-2xl w-full max-w-5xl overflow-hidden animate-in zoom-in duration-300">
                    <div className="p-8 md:p-12 text-center">
                        <h2 className="text-3xl font-bold text-gray-900 mb-2">ยืนยันการสมัครงาน</h2>
                        <p className="text-gray-500 mb-8 leading-relaxed">
                        กรุณาตรวจสอบรายละเอียดงานให้ถูกต้องก่อนยืนยันการสมัคร<br />
                        เมื่อยืนยันการสมัครแล้ว ระบบจะส่งข้อมูลของคุณไปยังผู้ว่าจ้างเพื่อพิจารณา
                        </p>

                        <div className="text-left bg-gray-50/80 rounded-[2rem] p-6 md:p-8 mb-8 border border-gray-100">
                        <p className="text-lg mb-6">คุณกำลังสมัครงาน <span className="font-bold text-primary-blue-500">{job.title}</span></p>
                        
                        <div className="space-y-1">
                            <DetailRow label="ชื่องาน" value={job.title} />
                            <DetailRow label="ผู้ว่าจ้าง" value={job.owner} />
                            <DetailRow label="รูปแบบงาน" value={`${job.jobType || "ออนไลน์"} / ${job.location || "ทำงานออนไลน์"}`} />
                            <DetailRow label="ระยะเวลา" value={job.duration || "ตามตกลง"} />
                            <DetailRow label="ค่าตอบแทน" value={`${job.budgetMin.toLocaleString()} บาท`} />
                            <DetailRow label="จำนวนรับ" value={`${job.capacity || 1} คน`} />
                            
                            <div className="flex gap-4 mt-4">
                            <span className="font-bold text-gray-800 w-24 shrink-0">คำอธิบายงาน</span>
                            <span className="text-gray-600 line-clamp-2">{job.description}</span>
                            </div>
                        </div>
                        </div>

                        <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <button 
                            onClick={() => setIsModalOpen(false)}
                            className="px-12 py-4 bg-gray-400 hover:bg-gray-500 text-white font-bold rounded-2xl transition-all active:scale-95 min-w-[160px]"
                        >
                            ยกเลิก
                        </button>
                        <button 
                            onClick={confirmApplication}
                            className="px-12 py-4 bg-[#5CB88A] hover:bg-[#4ea579] text-white font-bold rounded-2xl transition-all active:scale-95 shadow-lg shadow-green-100 min-w-[160px]"
                        >
                            ยืนยันการสมัคร
                        </button>
                        </div>
                    </div>
                    </div>
                </div>
                )}
                </>

              </div>

            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

const SidebarItem = ({ 
    icon, 
    label, 
    iconColor = "text-blue-500" 
}: { 
    icon: React.ReactNode; 
    label: string; 
    iconColor?: string 
}) => (

    <div className="flex items-center gap-4 text-gray-700">
        <div className={`${iconColor} shrink-0`}>
            {React.cloneElement(icon as React.ReactElement, { size: 20 })}
        </div>
        <span className="font-medium">{label}</span>
    </div>
);

export default JobDetailPage;