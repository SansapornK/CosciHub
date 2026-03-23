// src/app/(pages)/manage-projects/page.tsx
'use client';

import React, { useState, useEffect } from "react";
import ProjectManageList from "../../components/lists/ProjectManageList";
import { useSession } from "next-auth/react";
import axios from "axios";
import Loading from "../../components/common/Loading";
import toast, { Toaster } from 'react-hot-toast';
import { usePusher } from "../../../providers/PusherProvider";
import Link from "next/link";
import { 
  Briefcase, 
  Clock, 
  CheckCircle, 
  LayoutDashboard, 
  Users, 
  ArrowRight 
} from "lucide-react";

// ─── Interfaces ───────────────────────────────────────────────────────────────

interface Project {
  id: string;
  title: string;
  description: string;
  budget: number;
  deadline: string;
  requiredSkills: string[];
  owner: string;
  ownerName: string;
  status: string;
  progress: number;
  createdAt: string;
  assignedTo?: string;
  assignedFreelancerName?: string;
  requestToFreelancer?: string;
  requestToFreelancerName?: string;
  freelancersRequested: string[];
  requestingFreelancerId?: string;
  requestingFreelancerName?: string;
}

interface ProjectGroups {
  waitingResponse: Project[];
  requests: Project[];
  in_progress: Project[];
  revision: Project[];
  awaiting: Project[];
  completed: Project[];
}

// ✅ ใหม่: งานที่นิสิตสมัครไว้
interface JobApplication {
  _id: string;
  jobId: string;
  jobTitle: string;
  jobCategory: string;
  jobBudgetMin: number;
  jobBudgetMax: number;
  jobOwner: string;
  status: "pending" | "accepted" | "rejected";
  appliedDate: string;
}

// งานของเจ้าของที่มีคนมาสมัคร
interface OwnerJobWithApplicants {
  _id: string;
  title: string;
  category: string;
  budgetMin: number;
  budgetMax: number;
  pendingCount: number;
  acceptedCount: number; // ✅ เพิ่ม
  capacity: number;      // ✅ เพิ่ม
  totalCount: number;
  applications: {
    _id: string;
    applicantName: string;
    status: string;
    appliedDate: string;
  }[];
}

// ─── ใหม่: งานที่กำลังทำอยู่ (นิสิต) ──────────────
interface ActiveApplication {
  _id: string;
  jobId: string;
  jobTitle: string;
  jobCategory: string;
  jobOwner: string;
  jobDeadline: string | null;
  status: "accepted" | "in_progress" | "submitted" | "revision";
  progress: number;
}

// ─── ใหม่: งานของเจ้าของที่กำลังดำเนินการ ─────────
interface ActiveOwnerJob {
  _id: string;
  title: string;
  category: string;
  jobStatus: string;
  capacity: number;
  deliveryDate: string | null;
  workers: {
    _id: string;
    applicantName: string;
    profileImageUrl: string | null;
    status: string;
    progress: number;
  }[];
  statusCounts: {
    waitingToStart: number;
    inProgress: number;
    submitted: number;
    revision: number;
    completed: number;
  };
  aggregateBadge: { label: string; color: string };
  avgProgress: number;
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function ManageProjectsPage() {
  const { data: session, status } = useSession();

  // Project states (เดิม)
  const [projects, setProjects] = useState<ProjectGroups>({
    waitingResponse: [],
    requests: [],
    in_progress: [],
    revision: [],
    awaiting: [],
    completed: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // ✅ ใหม่: Job Application states
  const [jobApplications, setJobApplications] = useState<JobApplication[]>([]);
  const [ownerJobs, setOwnerJobs] = useState<OwnerJobWithApplicants[]>([]);
  const [jobAppLoading, setJobAppLoading] = useState(false);
  const [activeApplications, setActiveApplications] = useState<ActiveApplication[]>([]);
  const [activeOwnerJobs, setActiveOwnerJobs]         = useState<ActiveOwnerJob[]>([]);

  const { subscribeToUserEvents, subscribeToProjectList } = usePusher();

  // ─── Effects ────────────────────────────────────────────────────────────────

  useEffect(() => {
    if (status === 'authenticated') {
      fetchProjects();
      fetchJobApplications(); // ✅ เพิ่ม
    } else if (status === 'unauthenticated') {
      setLoading(false);
      setError("กรุณาเข้าสู่ระบบเพื่อจัดการโปรเจกต์");
    }
  }, [status]);

  useEffect(() => {
    if (status === 'authenticated' && session?.user?.id) {
      const unsubscribeUserEvents = subscribeToUserEvents(session.user.id, () => {
        fetchProjects();
      });
      const unsubscribeProjectList = subscribeToProjectList(() => {
        fetchProjects();
      });
      return () => {
        unsubscribeUserEvents();
        unsubscribeProjectList();
      };
    }
  }, [status, session?.user?.id, subscribeToUserEvents, subscribeToProjectList]);

  //─── Fetch Projects (เดิม) ──────────────────────────────────────────────────
  const fetchProjects = async () => {
    setLoading(true);
    setError("");
    try {
      const isFreelancer = session?.user?.role === 'student';
      const userId = session?.user?.id;
      let response;

      if (isFreelancer) {
        response = await axios.get('/api/projects', {
          params: {
            limit: 100,
            status: 'all',
            assignedTo: userId,
            requestToFreelancer: userId,
            freelancerRequested: userId,
            userRelatedOnly: 'true'
          }
        });
      } else {
        response = await axios.get('/api/projects', {
          params: { limit: 100, status: 'all', owner: userId }
        });
      }

      if (!isFreelancer) {
        const userIds = new Set<string>();
        response.data.projects.forEach((project: Project) => {
          if (project.requestToFreelancer) userIds.add(project.requestToFreelancer);
          if (project.freelancersRequested) project.freelancersRequested.forEach(id => userIds.add(id));
          if (project.assignedTo) userIds.add(project.assignedTo);
        });

        if (userIds.size > 0) {
          try {
            const freelancerMap: Record<string, { name: string; profileImageUrl: string | null }> = {};
            for (const freelancerId of Array.from(userIds)) {
              try {
                const res = await axios.get(`/api/freelancers/${freelancerId}`);
                freelancerMap[freelancerId] = {
                  name: res.data.name,
                  profileImageUrl: res.data.profileImageUrl
                };
              } catch {
                freelancerMap[freelancerId] = {
                  name: `ฟรีแลนซ์ ${freelancerId.substring(0, 5)}...`,
                  profileImageUrl: null
                };
              }
            }

            const projectsWithFreelancers: Project[] = [];
            response.data.projects.forEach((project: Project) => {
              if (project.requestToFreelancer) {
                const f = freelancerMap[project.requestToFreelancer];
                if (f) project.requestToFreelancerName = f.name;
              }
              if (project.assignedTo) {
                const f = freelancerMap[project.assignedTo];
                if (f) project.assignedFreelancerName = f.name;
              }
              projectsWithFreelancers.push(project);
            });

            response.data.projects = projectsWithFreelancers;
          } catch (err) {
            console.error("ไม่สามารถดึงข้อมูลฟรีแลนซ์ได้:", err);
          }
        }
      }

      groupProjects(response.data.projects, isFreelancer);
    } catch (err) {
      console.error("Error fetching projects:", err);
      setError("เกิดข้อผิดพลาดในการโหลดข้อมูลโปรเจกต์");
    } finally {
      setLoading(false);
    }
  };

  // ─── ✅ Fetch Job Applications (ใหม่) ────────────────────────────────────────

  const fetchJobApplications = async () => {
    setJobAppLoading(true);
    try {
      const isFreelancer = session?.user?.role === 'student';

      if (isFreelancer) {
        const res = await axios.get("/api/applications", { params: { role: "student" } });
        setJobApplications(res.data.applications || []);
      } else {
        const res = await axios.get("/api/applications", { params: { role: "owner" } });
        setOwnerJobs(res.data.jobs || []);
      }
      const activeRes = await axios.get("/api/applications", {
        params: {
          role: isFreelancer ? "student" : "owner",
          phase: "inProgress",
        },
      });
      if (isFreelancer) {
        setActiveApplications(activeRes.data.applications || []);
      } else {
        setActiveOwnerJobs(activeRes.data.jobs || []);
      }
    } catch (err) {
      console.error("Error fetching job applications:", err);
    } finally {
      setJobAppLoading(false);
    }
  };

  // ─── Group Projects ──────────────────────────────────────────────────────────

  const groupProjects = (projectList: Project[], isFreelancer: boolean) => {
    const userId = session?.user?.id;
    const grouped: ProjectGroups = {
      waitingResponse: [],
      requests: [],
      in_progress: [],
      revision: [],
      awaiting: [],
      completed: []
    };

    projectList.forEach(project => {
      if (isFreelancer) {
        if (project.freelancersRequested.includes(userId) && project.status === 'open') {
          grouped.waitingResponse.push(project);
        } else if (project.requestToFreelancer === userId && project.status === 'open') {
          grouped.requests.push(project);
        } else if (project.assignedTo === userId && project.status === 'in_progress') {
          grouped.in_progress.push(project);
        } else if (project.assignedTo === userId && project.status === 'revision') {
          grouped.revision.push(project);
        } else if (project.assignedTo === userId && project.status === 'awaiting') {
          grouped.awaiting.push(project);
        } else if (project.assignedTo === userId && project.status === 'completed') {
          grouped.completed.push(project);
        }
      } else {
        if (project.requestToFreelancer && project.status === 'open') {
          grouped.waitingResponse.push(project);
        } else if (
          project.freelancersRequested?.length > 0 &&
          project.status === 'open' &&
          !project.requestToFreelancer
        ) {
          grouped.requests.push(project);
        } else if (project.status === 'in_progress') {
          grouped.in_progress.push(project);
        } else if (project.status === 'revision') {
          grouped.revision.push(project);
        } else if (project.status === 'awaiting') {
          grouped.awaiting.push(project);
        } else if (project.status === 'completed') {
          grouped.completed.push(project);
        }
      }
    });

    setProjects(grouped);
  };

  // ─── Update Progress ─────────────────────────────────────────────────────────

  const updateProgress = async (projectId: string, newProgress: number) => {
    try {
      if (newProgress < 0) newProgress = 0;
      if (newProgress > 100) newProgress = 100;
      await axios.patch(`/api/projects/${projectId}`, { progress: newProgress });
    } catch (error) {
      console.error("Error updating progress:", error);
    }
  };

  // ─── Render ───────────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-10 h-screen">
        <Loading size="large" color="primary" />
        <p className="mt-4 text-gray-500">กำลังโหลดข้อมูลโปรเจกต์...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
        <p className="text-red-600">{error}</p>
        {status === 'unauthenticated' && (
          <button
            onClick={() => window.location.href = '/auth?state=login'}
            className="mt-4 px-4 py-2 bg-primary-blue-500 text-white rounded-lg hover:bg-primary-blue-600"
          >
            เข้าสู่ระบบ
          </button>
        )}
      </div>
    );
  }

  const isFreelancer = session?.user?.role === 'student';

  // Status badge config สำหรับ job application
  const appStatusConfig: Record<string, { label: string; className: string }> = {
    pending:  { label: "รอการพิจารณา",     className: "bg-yellow-100 text-yellow-700" },
    accepted: { label: "ผ่านการคัดเลือก",  className: "bg-green-100  text-green-700"  },
    rejected: { label: "ไม่ผ่านการคัดเลือก", className: "bg-red-100  text-red-600"    },
  };

  return (
    <div className="flex flex-col gap-6 pb-10 max-w-7xl mx-auto w-full">
      <Toaster position="bottom-left" />

      {/* ── Header ── */}
      <section className="mt-6 p-6 flex flex-col gap-2 bg-primary-blue-500 rounded-xl">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="font-medium text-xl text-white">จัดการโปรเจกต์</h1>
            <p className="text-white">
              จัดการทุกขั้นตอนในทุกโปรเจกต์ของคุณตั้งแต่รับงานจนถึงเสร็จงาน
            </p>
          </div>
          <Link href="/manage-projects/all-projects" className="btn-secondary flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
              <line x1="3" y1="9" x2="21" y2="9"></line>
              <line x1="9" y1="21" x2="9" y2="9"></line>
            </svg>
            ดูโปรเจกต์ทั้งหมด
          </Link>
        </div>
      </section>

      {/* ── Row 1: Waiting Response & Requests ── */}
      {/* <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <ProjectManageList
          title={isFreelancer ? "คำขอของฉัน" : "รอการตอบรับ"}
          status="waitingResponse"
          projects={projects.waitingResponse}
          emptyMessage={isFreelancer ? "คุณยังไม่ได้ส่งคำขอร่วมงานโปรเจกต์ใด" : "ไม่มีคำขอที่รอการตอบรับจากฟรีแลนซ์"}
          onUpdateProgress={updateProgress}
          isFreelancer={isFreelancer}
          userId={session?.user?.id}
        />
        <ProjectManageList
          title={isFreelancer ? "คำขอร่วมงาน" : "คำขอฟรีแลนซ์"}
          status="requests"
          projects={projects.requests}
          emptyMessage={isFreelancer ? "ไม่มีคำขอร่วมงานจากเจ้าของโปรเจกต์" : "ไม่มีฟรีแลนซ์ส่งคำขอร่วมงานกับคุณ"}
          onUpdateProgress={updateProgress}
          isFreelancer={isFreelancer}
          userId={session?.user?.id}
        />
      </div> */}

      {/* ── Row 2: In Progress, Revision, Awaiting ── */}
      {/* <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <ProjectManageList
          title="กำลังดำเนินการ"
          status="in_progress"
          projects={projects.in_progress}
          emptyMessage="ไม่มีโปรเจกต์ที่กำลังดำเนินการ"
          onUpdateProgress={updateProgress}
          isFreelancer={isFreelancer}
          userId={session?.user?.id}
        />
        <ProjectManageList
          title="กำลังแก้ไข"
          status="revision"
          projects={projects.revision}
          emptyMessage="ไม่มีโปรเจกต์ที่กำลังแก้ไข"
          onUpdateProgress={updateProgress}
          isFreelancer={isFreelancer}
          userId={session?.user?.id}
        />
        <ProjectManageList
          title="รอการยืนยัน"
          status="awaiting"
          projects={projects.awaiting}
          emptyMessage="ไม่มีโปรเจกต์ที่รอการยืนยัน"
          onUpdateProgress={updateProgress}
          isFreelancer={isFreelancer}
          userId={session?.user?.id}
        />
      </div> */}

      {/* ── Row 3: Completed ── */}
      {/* <div className="w-full">
        <ProjectManageList
          title="เสร็จสิ้น"
          status="completed"
          projects={projects.completed}
          emptyMessage="ไม่มีโปรเจกต์ที่เสร็จสิ้น"
          onUpdateProgress={updateProgress}
          isFreelancer={isFreelancer}
          userId={session?.user?.id}
        />
      </div> */}

      {/* ── Row 4: ✅ Job Applications Section ── */}
      <div className="w-full">
        {isFreelancer ? (
          // ── ฝั่งนิสิต: งานที่สมัครไว้ ──────────────────────────────────────
          <div className="bg-gray-50 rounded-xl p-4">
            <div className="flex justify-between items-center mb-4">
              <h2 className="font-medium text-gray-700 flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                งานพิเศษที่สมัครไว้
              </h2>
              <span className="bg-gray-200 text-gray-700 text-xs px-2 py-1 rounded-full">
                {jobApplications.filter(a => a.status === "pending" || a.status === "rejected").length} งาน
              </span>
            </div>

            {jobAppLoading ? (
              <div className="flex justify-center py-6">
                <Loading size="small" color="primary" />
              </div>
            ) : jobApplications.length === 0 ? (
              <div className="bg-white rounded-lg p-6 text-center text-gray-500 border border-dashed border-gray-300">
                <p>คุณยังไม่ได้สมัครงานพิเศษใดๆ</p>
                <Link href="/find-job" className="text-primary-blue-500 text-sm hover:underline mt-1 inline-block">
                  ค้นหางานพิเศษ →
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {jobApplications.filter(a => a.status === "pending" || a.status === "rejected" || a.status === "accepted").map((app) => {
                  const s = appStatusConfig[app.status] ?? appStatusConfig.pending;
                  return (
                    <Link href={`/find-job/${app.jobId}`} key={app.jobId}>
                    <div key={app._id} className="bg-white rounded-xl border border-gray-200 p-4 hover:shadow-md hover:border-primary-blue-200 transition-all flex flex-col gap-2">
                      {/* Header */}
                      <div className="flex items-start justify-between gap-2">
                        <p className="font-medium text-gray-800 line-clamp-2 text-sm flex-1">
                          {app.jobTitle}
                        </p>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium whitespace-nowrap ${s.className}`}>
                          {s.label}
                        </span>
                      </div>

                      {/* Category + Budget + Date */}
                      <p className="text-xs text-gray-400">{app.jobCategory}</p>
                      <div className="flex items-center justify-between">
                        <p className="text-xs text-gray-500">
                          {app.jobBudgetMin.toLocaleString()}
                          {app.jobBudgetMax ? ` – ${app.jobBudgetMax.toLocaleString()}` : ""} บาท
                        </p>
                        <p className="text-xs text-gray-400">
                          สมัครเมื่อ {new Date(app.appliedDate).toLocaleDateString("th-TH")}
                        </p>
                      </div>

                      {/* ปุ่ม "เริ่มงาน" — แสดงเฉพาะ accepted */}
                      {app.status === "accepted" && (
                        <button
                          onClick={async (e) => {
                            e.preventDefault();      
                            e.stopPropagation();
                            try {
                              await axios.patch(`/api/applications/${app._id}`, {
                                action: "updateProgress",
                                progress: 0,
                              });
                              toast.success("เริ่มงานแล้ว!");
                              await fetchJobApplications(); // รีโหลดทั้ง Row 4 และ Row 5
                            } catch (err: any) {
                              toast.error(err.response?.data?.error || "เกิดข้อผิดพลาด");
                            }
                          }}
                          className="btn-primary text-sm py-2 rounded-full w-full mt-1"
                        >
                          เริ่มงาน
                        </button>
                      )}
                    </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        ) : (
          // ── ฝั่งเจ้าของ: งานที่มีคนมาสมัคร ───────────────────────────────────
          <div className="bg-gray-50 rounded-xl p-4">
            <div className="flex justify-between items-center mb-4">
              <h2 className="font-medium text-gray-700 flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-purple-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                ผู้สมัครงานพิเศษของฉัน
              </h2>
              <span className="bg-gray-200 text-gray-700 text-xs px-2 py-1 rounded-full">
                {ownerJobs.length} งาน
              </span>
            </div>

            {jobAppLoading ? (
              <div className="flex justify-center py-6">
                <Loading size="small" color="primary" />
              </div>
            ) : ownerJobs.length === 0 ? (
              <div className="bg-white rounded-lg p-6 text-center text-gray-500 border border-dashed border-gray-300">
                <p>ยังไม่มีนิสิตสมัครงานพิเศษของคุณ</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {ownerJobs.map((job) => (
                  <Link href={`/manage-projects/${job._id}/applicants`} key={job._id}>
                    <div className="bg-white rounded-xl border border-gray-200 p-4 hover:shadow-md hover:border-primary-blue-200 transition-all group">
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <p className="font-medium text-gray-800 line-clamp-2 text-sm flex-1 group-hover:text-primary-blue-600 transition-colors">
                          {job.title}
                        </p>
                        {/* แสดง badge ตามสถานะ */}
                        <div className="flex flex-col items-end gap-1 flex-shrink-0">
                          {job.acceptedCount >= job.capacity ? (
                            // เต็มแล้ว — สีเขียว
                            <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium whitespace-nowrap">
                              คัดเลือกครบแล้ว
                            </span>
                          ) : job.pendingCount > 0 ? (
                            // ยังมีคนรอพิจารณา — สีม่วง
                            <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full font-medium whitespace-nowrap">
                              รอพิจารณา {job.pendingCount}
                            </span>
                          ) : job.acceptedCount >= job.capacity}
                        </div>
                      </div>
                      <p className="text-xs text-gray-400 mb-3">{job.category}</p>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-500">
                          ผู้สมัครทั้งหมด {job.totalCount} คน · รับแล้ว {job.acceptedCount}/{job.capacity}
                        </span>
                        <span className="text-xs text-primary-blue-500 font-medium group-hover:underline">
                          ดูผู้สมัคร →
                        </span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
              {/* ── Row 5: กำลังดำเนินการ ── */}
        <div className="w-full">
          {isFreelancer ? (
            // ── ฝั่งนิสิต ──────────────────────────────────────────────────────────
            <div className="bg-gray-50 rounded-xl p-4">
              <div className="flex justify-between items-center mb-4">
                <h2 className="font-medium text-gray-700 flex items-center gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  งานที่กำลังทำอยู่
                </h2>
                <span className="bg-gray-200 text-gray-700 text-xs px-2 py-1 rounded-full">
                  {activeApplications.length} งาน
                </span>
              </div>

              {activeApplications.length === 0 ? (
                <div className="bg-white rounded-lg p-6 text-center text-gray-500 border border-dashed border-gray-300">
                  <p>ยังไม่มีงานที่กำลังดำเนินการ</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {activeApplications.map((app) => {
                    const statusConfig: Record<string, { label: string; color: string }> = {
                      in_progress: { label: "กำลังทำงาน",  color: "bg-yellow-100 text-yellow-700" },
                      submitted:   { label: "ส่งงานแล้ว",  color: "bg-purple-100 text-purple-700" },
                      revision:    { label: "แก้ไขงาน",    color: "bg-orange-100 text-orange-700" },
                    };
                    const s = statusConfig[app.status] ?? statusConfig.in_progress;

                    return (
                      <div key={app._id} className="bg-white rounded-xl border border-gray-200 p-4 flex flex-col gap-3">
                        {/* Title + status */}
                        <div className="flex items-start justify-between gap-2">
                          <p className="font-medium text-gray-800 text-sm line-clamp-2 flex-1">
                            {app.jobTitle}
                          </p>
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium whitespace-nowrap ${s.color}`}>
                            {s.label}
                          </span>
                        </div>

                        <p className="text-xs text-gray-400">{app.jobCategory}</p>

                        {/* Progress bar */}
                        <div>
                          <div className="flex justify-between text-xs text-gray-500 mb-1">
                            <span>ความคืบหน้า</span>
                            <span className="font-medium">{app.progress}%</span>
                          </div>
                          <div className="w-full bg-gray-100 rounded-full h-2">
                            <div
                              className="bg-primary-blue-500 h-2 rounded-full transition-all"
                              style={{ width: `${app.progress}%` }}
                            />
                          </div>
                        </div>

                        {/* Deadline */}
                        {app.jobDeadline && (
                          <p className="text-xs text-gray-400">
                            กำหนดส่ง: {new Date(app.jobDeadline).toLocaleDateString("th-TH")}
                          </p>
                        )}

                        {/* Buttons */}
                        <Link
                          href={`/manage-projects/${app.jobId}/work/${app._id}`}
                          className="btn-primary text-sm text-center py-2 rounded-full"
                        >
                          {app.status === "submitted" ? "ดูสถานะ" : "จัดการงาน →"}
                        </Link>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          ) : (
            /* ฝั่งเจ้าของงาน */
            <div className="bg-gray-50/50 rounded-[2.5rem] p-8 border border-gray-100">
              <div className="flex justify-between items-center mb-8">
                <h2 className="text-xl font-black text-gray-900 flex items-center gap-3">
                  <div className="p-2.5 bg-blue-600 rounded-xl text-white shadow-lg shadow-blue-100">
                    <Clock size={20} />
                  </div>
                  งานที่กำลังดำเนินการ ({activeOwnerJobs.length})
                </h2>
              </div>

              {activeOwnerJobs.length === 0 ? (
                <div className="bg-white rounded-[2rem] p-12 text-center border border-dashed border-gray-200">
                  <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-300">
                    <Briefcase size={32} />
                  </div>
                  <p className="font-bold text-gray-400">ยังไม่มีงานที่กำลังดำเนินการในขณะนี้</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                  {activeOwnerJobs.map((job) => {
                    const badgeStyles: Record<string, string> = {
                      red: "bg-red-50 text-red-600 border-red-100",
                      orange: "bg-orange-50 text-orange-600 border-orange-100",
                      blue: "bg-blue-50 text-blue-600 border-blue-100",
                      green: "bg-green-50 text-green-600 border-green-100",
                    };
                    const currentStyle = badgeStyles[job.aggregateBadge.color] || badgeStyles.blue;

                    return (
                      <div key={job._id} className="bg-white rounded-3xl border border-gray-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 overflow-hidden flex flex-col group">
                        <div className="p-6 flex-1">
                          <div className="flex justify-between items-start gap-4 mb-5">
                            <h3 className="font-black text-gray-900 leading-tight line-clamp-2">{job.title}</h3>
                            <span className={`text-[10px] font-black px-2.5 py-1 rounded-lg border uppercase tracking-widest shrink-0 ${currentStyle}`}>
                              {job.aggregateBadge.label}
                            </span>
                          </div>

                          {/* รายชื่อนิสิตผู้ปฏิบัติงาน */}
                          <div className="space-y-3">
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                              <Users size={12} /> รายชื่อผู้ปฏิบัติงาน
                            </p>
                            
                            <div className="flex flex-col gap-2">
                              {job.workers.map((worker) => (
                                <div 
                                  key={worker._id} 
                                  className="flex items-center justify-between p-3 rounded-2xl bg-gray-50 border border-transparent hover:border-blue-200 hover:bg-blue-50 transition-all group/item"
                                >
                                  <div className="flex items-center gap-3 min-w-0">
                                    <div className="w-8 h-8 rounded-full bg-white border border-gray-200 flex items-center justify-center text-blue-600 font-bold text-xs shrink-0 overflow-hidden">
                                      {worker.profileImageUrl ? (
                                        <img src={worker.profileImageUrl} alt="" className="w-full h-full object-cover" />
                                      ) : (
                                        worker.applicantName?.charAt(0)
                                      )}
                                    </div>
                                    <div className="min-w-0">
                                      <p className="text-xs font-black text-gray-800 truncate">{worker.applicantName}</p>
                                      <div className="flex items-center gap-2 mt-0.5">
                                        <div className="w-16 bg-gray-200 h-1 rounded-full overflow-hidden">
                                          <div className="bg-blue-600 h-full" style={{ width: `${worker.progress}%` }} />
                                        </div>
                                        <span className="text-[9px] font-bold text-gray-400">{worker.progress}%</span>
                                      </div>
                                    </div>
                                  </div>

                                  <Link 
                                    href={`/manage-projects/${job._id}/work/${worker._id}`}
                                    className="ml-2 px-3 py-1.5 bg-white text-blue-600 text-[10px] font-black rounded-lg border border-blue-100 shadow-sm hover:bg-blue-600 hover:text-white transition-all whitespace-nowrap"
                                  >
                                    {worker.status === 'submitted' ? 'ตรวจงาน' : 'จัดการงาน'}
                                  </Link>
                                </div>
                              ))}
                            </div>
                            </div>
                          </div>

                          {/* Footer Card */}
                          <div className="px-6 py-4 bg-gray-50/50 border-t border-gray-50 flex items-center justify-between mt-auto">
                              <div className="flex items-center gap-2 text-gray-400">
                                  <Clock size={14} />
                                  <span className="text-[10px] font-black uppercase tracking-widest">
                                    {job.deliveryDate ? new Date(job.deliveryDate).toLocaleDateString('th-TH') : 'ไม่ระบุ'}
                                  </span>
                              </div>
                              <Link 
                                href={`/manage-projects/${job._id}/applicants`}
                                className="text-[10px] font-black text-blue-600 hover:underline uppercase tracking-widest"
                              >
                                ดูภาพรวมโปรเจกต์ →
                              </Link>
                            </div>
                          </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
  );
}