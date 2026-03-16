// src/app/components/lists/ProjectManageList.tsx
'use client';

import React from "react";
import ProjectManageCard from "../cards/ProjectManageCard";
import Link from "next/link";

interface Project {
  id: string;
  title: string;
  owner: string;
  ownerName: string;
  status: string;
  progress: number;
  assignedTo?: string;
  assignedFreelancerName?: string;
  requestToFreelancer?: string;
  requestToFreelancerName?: string;
  freelancersRequested: string[];
  requestingFreelancerId?: string;
  requestingFreelancerName?: string;
}

interface ProjectManageListProps {
  title: string;
  status: string;
  projects: Project[];
  emptyMessage: string;
  onUpdateProgress: (id: string, progress: number) => void;
  isFreelancer: boolean;
  userId?: string;
}

function ProjectManageList({ 
  title, status, projects, emptyMessage, 
  onUpdateProgress, isFreelancer, userId 
}: ProjectManageListProps) {

  const getDisplayName = (project: Project) => {
    if (isFreelancer) return project.ownerName;
    
    // ✅ requests: แสดงจำนวนผู้สมัครแทนชื่อเดี่ยว
    if (status === "requests") {
      const count = project.freelancersRequested?.length || 0;
      return `${count} คนรอการพิจารณา`;
    }
    if (project.assignedTo && project.assignedFreelancerName) return project.assignedFreelancerName;
    if (project.assignedTo) return "ฟรีแลนซ์ที่รับงาน";
    if (status === "waitingResponse" && project.requestToFreelancer) {
      return project.requestToFreelancerName || "รอการตอบรับจากฟรีแลนซ์";
    }
    return "ไม่มีผู้รับผิดชอบ";
  };

  const getProfileLink = (project: Project) => {
    if (isFreelancer) return `/user/customer/${project.owner}`;
    if (status === "requests") return `/manage-projects/${project.id}/applicants`; // ✅ ลิงก์ไปหน้า applicants
    if (project.assignedTo) return `/user/freelance/${project.assignedTo}`;
    if (status === "waitingResponse" && project.requestToFreelancer) {
      return `/user/freelance/${project.requestToFreelancer}`;
    }
    return `/project/${project.id}`;
  };

  const getSectionIcon = () => {
    switch(status) {
      case 'in_progress': return (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
        </svg>
      );
      case 'revision': return (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-orange-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
        </svg>
      );
      case 'completed': return (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      );
      case 'waitingResponse': return (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-yellow-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
        </svg>
      );
      case 'requests': return (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-purple-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
        </svg>
      );
      default: return (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
        </svg>
      );
    }
  };

  return (
    <div className="bg-gray-50 rounded-xl p-4">
      <div className="flex justify-between items-center mb-4">
        <h2 className="font-medium text-gray-700 flex items-center">
          {getSectionIcon()}
          {title}
        </h2>
        <span className="bg-gray-200 text-gray-700 text-xs px-2 py-1 rounded-full">
          {projects.length}
        </span>
      </div>
      
      {projects.length > 0 ? (
        <div className={`${status === "completed" ? "grid grid-cols-1 sm:grid-cols-2 gap-4" : "space-y-4"}`}>
          {projects.map((project) => (
            // ✅ ใช้ div wrapper เพื่อให้เพิ่ม element ต่อท้ายได้
            <div key={`${project.id}${project.requestingFreelancerId || ''}`}>
              <ProjectManageCard 
                id={project.id}
                title={project.title}
                owner={getDisplayName(project)}
                status={project.status}
                progress={project.progress}
                onUpdateProgress={onUpdateProgress}
                isFreelancer={isFreelancer}
                profileLink={getProfileLink(project)}
                userId={userId}
                project={project}
              />

              {/* ✅ ปุ่ม "ดูผู้สมัครทั้งหมด" — แสดงเฉพาะ owner + column requests */}
              {!isFreelancer && status === 'requests' && (
                <Link
                  href={`/manage-projects/${project.id}/applicants`}
                  className="mt-2 w-full flex items-center justify-center gap-2 text-sm 
                             text-primary-blue-500 border border-primary-blue-200 
                             bg-primary-blue-50 hover:bg-primary-blue-100 
                             rounded-xl py-2 transition-colors"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                    <circle cx="9" cy="7" r="4"/>
                    <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
                    <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                  </svg>
                  ดูผู้สมัครทั้งหมด ({project.freelancersRequested?.length || 0} คน)
                </Link>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-lg p-6 text-center text-gray-500 border border-dashed border-gray-300">
          <p>{emptyMessage}</p>
        </div>
      )}
    </div>
  );
}

export default ProjectManageList;