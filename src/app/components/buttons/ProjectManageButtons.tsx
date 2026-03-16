'use client';
import React, { useState } from "react";
import axios from "axios";
import { useRouter } from "next/navigation";
import { toast } from 'react-hot-toast';
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
  freelancersRequested: string[];
  // เพิ่มฟิลด์ใหม่สำหรับระบุฟรีแลนซ์เฉพาะราย
  requestingFreelancerId?: string;
  requestingFreelancerName?: string;
}

interface ProjectManageButtonsProps {
  project: Project;
  isFreelancer: boolean;
  userId?: string;
}

function ProjectManageButtons({ project, isFreelancer, userId }: ProjectManageButtonsProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  // ==== Freelancer Actions ====
  
  // Freelancer accepts a project invitation
  const handleAcceptProject = async () => {
    if (!userId) return;
    setIsLoading(true);
    
    try {
      // ส่งคำขอเปลี่ยนสถานะเป็น in_progress
      const response = await axios.patch(`/api/projects/${project.id}`, {
        status: 'in_progress',
        assignedTo: userId
      });
      
      if (response.data.success) {
        toast.success('ยอมรับโปรเจกต์แล้ว');
        router.refresh();
      } else {
        toast.error('เกิดข้อผิดพลาด: ' + (response.data.error || 'กรุณาลองใหม่อีกครั้ง'));
      }
    } catch (error: any) {
      console.error('Error accepting project:', error);
      toast.error('เกิดข้อผิดพลาด: ' + (error.response?.data?.error || 'กรุณาลองใหม่อีกครั้ง'));
    } finally {
      setIsLoading(false);
    }
  };
  
  // Freelancer rejects a project invitation
  const handleRejectProject = async () => {
    if (!userId) return;
    setIsLoading(true);
    
    try {
      // For freelancer rejecting a direct request from project owner
      const response = await axios.patch(`/api/projects/${project.id}`, {
        action: 'rejectProject',
        requestToFreelancer: null
      });
      
      if (response.data.success) {
        toast.success('ปฏิเสธคำขอแล้ว');
        router.refresh();
      } else {
        toast.error('เกิดข้อผิดพลาด: ' + (response.data.error || 'กรุณาลองใหม่อีกครั้ง'));
      }
    } catch (error: any) {
      console.error('Error rejecting project:', error);
      toast.error('เกิดข้อผิดพลาด: ' + (error.response?.data?.error || 'กรุณาลองใหม่อีกครั้ง'));
    } finally {
      setIsLoading(false);
    }
  };
  
  // Freelancer cancels their application to a project
  const handleCancelApplication = async () => {
    if (!userId) return;
    setIsLoading(true);
    
    try {
      // We need to remove the freelancer's ID from the freelancersRequested array
      const response = await axios.patch(`/api/projects/${project.id}`, {
        action: 'removeFreelancerRequest',
        freelancerId: userId
      });
      
      if (response.data.success) {
        toast.success('ยกเลิกคำขอร่วมงานแล้ว');
        router.refresh();
      } else {
        toast.error('เกิดข้อผิดพลาด: ' + (response.data.error || 'กรุณาลองใหม่อีกครั้ง'));
      }
    } catch (error: any) {
      console.error('Error canceling application:', error);
      toast.error('เกิดข้อผิดพลาด: ' + (error.response?.data?.error || 'กรุณาลองใหม่อีกครั้ง'));
    } finally {
      setIsLoading(false);
    }
  };
  
  // Freelancer submits a completed project
  const handleSubmitProject = async () => {
    if (!userId) return;
    
    // Check if progress is 100%
    if (project.progress < 100) {
      toast.error('ความคืบหน้าต้องถึง 100% ก่อนส่งงาน');
      return;
    }
    
    setIsLoading(true);
    try {
      const response = await axios.patch(`/api/projects/${project.id}`, {
        status: 'awaiting'
      });
      
      if (response.data.success) {
        toast.success('ส่งมอบงานแล้ว');
        router.refresh();
      } else {
        toast.error('เกิดข้อผิดพลาด: ' + (response.data.error || 'กรุณาลองใหม่อีกครั้ง'));
      }
    } catch (error: any) {
      console.error('Error submitting project:', error);
      toast.error('เกิดข้อผิดพลาด: ' + (error.response?.data?.error || 'กรุณาลองใหม่อีกครั้ง'));
    } finally {
      setIsLoading(false);
    }
  };

  // Freelancer submits a revision
  const handleSubmitRevision = async () => {
    if (!userId) return;
    
    setIsLoading(true);
    try {
      const response = await axios.patch(`/api/projects/${project.id}`, {
        status: 'awaiting'
      });
      if (response.data.success) {
        toast.success('ส่งงานที่แก้ไขแล้ว');
        router.refresh();
      } else {
        toast.error('เกิดข้อผิดพลาด: ' + (response.data.error || 'กรุณาลองใหม่อีกครั้ง'));
      }
    } catch (error: any) {
      console.error('Error submitting revision:', error);
      toast.error('เกิดข้อผิดพลาด: ' + (error.response?.data?.error || 'กรุณาลองใหม่อีกครั้ง'));
    } finally {
      setIsLoading(false);
    }
  };
  
  // ==== Project Owner Actions ====
  
  // Owner cancels a request to a freelancer
  const handleCancelFreelancerRequest = async () => {
    if (!userId) return;
    setIsLoading(true);
    
    try {
      const response = await axios.patch(`/api/projects/${project.id}`, {
        requestToFreelancer: null
      });
      
      if (response.data.success) {
        toast.success('ยกเลิกคำขอแล้ว');
        router.refresh();
      } else {
        toast.error('เกิดข้อผิดพลาด: ' + (response.data.error || 'กรุณาลองใหม่อีกครั้ง'));
      }
    } catch (error: any) {
      console.error('Error canceling freelancer request:', error);
      toast.error('เกิดข้อผิดพลาด: ' + (error.response?.data?.error || 'กรุณาลองใหม่อีกครั้ง'));
    } finally {
      setIsLoading(false);
    }
  };
  
  // Owner accepts a specific freelancer's application
  const handleAcceptFreelancer = async (freelancerId: string) => {
    if (!userId) return;
    setIsLoading(true);
    
    try {
      // เปลี่ยนสถานะเป็น in_progress
      const response = await axios.patch(`/api/projects/${project.id}`, {
        status: 'in_progress',
        assignedTo: freelancerId
      });
      
      if (response.data.success) {
        toast.success('ยอมรับฟรีแลนซ์แล้ว');
        router.refresh();
      } else {
        toast.error('เกิดข้อผิดพลาด: ' + (response.data.error || 'กรุณาลองใหม่อีกครั้ง'));
      }
    } catch (error: any) {
      console.error('Error accepting freelancer:', error);
      toast.error('เกิดข้อผิดพลาด: ' + (error.response?.data?.error || 'กรุณาลองใหม่อีกครั้ง'));
    } finally {
      setIsLoading(false);
    }
  };
  
  // Owner rejects a specific freelancer's application
  const handleRejectFreelancer = async (freelancerId: string) => {
    if (!userId) return;
    setIsLoading(true);
    
    try {
      const response = await axios.patch(`/api/projects/${project.id}`, {
        action: 'removeFreelancerRequest',
        freelancerId: freelancerId
      });
      
      if (response.data.success) {
        toast.success('ปฏิเสธฟรีแลนซ์แล้ว');
        router.refresh();
      } else {
        toast.error('เกิดข้อผิดพลาด: ' + (response.data.error || 'กรุณาลองใหม่อีกครั้ง'));
      }
    } catch (error: any) {
      console.error('Error rejecting freelancer:', error);
      toast.error('เกิดข้อผิดพลาด: ' + (error.response?.data?.error || 'กรุณาลองใหม่อีกครั้ง'));
    } finally {
      setIsLoading(false);
    }
  };
  
  // Owner approves completed project
  const handleApproveProject = async () => {
    if (!userId) return;
    setIsLoading(true);
    
    try {
      const response = await axios.patch(`/api/projects/${project.id}`, {
        status: 'completed',
        completedAt: new Date().toISOString()
      });
      
      if (response.data.success) {
        toast.success('ยืนยันงานเสร็จสิ้นแล้ว');
        router.refresh();
      } else {
        toast.error('เกิดข้อผิดพลาด: ' + (response.data.error || 'กรุณาลองใหม่อีกครั้ง'));
      }
    } catch (error: any) {
      console.error('Error approving project:', error);
      toast.error('เกิดข้อผิดพลาด: ' + (error.response?.data?.error || 'กรุณาลองใหม่อีกครั้ง'));
    } finally {
      setIsLoading(false);
    }
  };
  
  // Owner requests revisions
  const handleRequestRevision = async () => {
    if (!userId) return;
    setIsLoading(true);
    
    try {
      const response = await axios.patch(`/api/projects/${project.id}`, {
        status: 'revision'
      });
      
      if (response.data.success) {
        toast.success('ส่งคำขอแก้ไขแล้ว');
        router.refresh();
      } else {
        toast.error('เกิดข้อผิดพลาด: ' + (response.data.error || 'กรุณาลองใหม่อีกครั้ง'));
      }
    } catch (error: any) {
      console.error('Error requesting revision:', error);
      toast.error('เกิดข้อผิดพลาด: ' + (error.response?.data?.error || 'กรุณาลองใหม่อีกครั้ง'));
    } finally {
      setIsLoading(false);
    }
  };
  
  // Helper function to determine which buttons to show based on project status and user role
  const renderButtons = () => {
    // If project is completed, don't show any action buttons
    if (project.status === 'completed') {
      return null;
    }
    
    // For Freelancer
    if (isFreelancer) {
      // Case 1: Freelancer has been requested by the project owner
      if (project.requestToFreelancer === userId && project.status === 'open') {
        return (
          <div className="flex gap-3">
            <button 
              className="btn-primary" 
              onClick={handleAcceptProject}
              disabled={isLoading}
            >
              {isLoading ? 'กำลังดำเนินการ...' : 'ยอมรับ'}
            </button>
            <button 
              className="btn-danger" 
              onClick={handleRejectProject}
              disabled={isLoading}
            >
              {isLoading ? 'กำลังดำเนินการ...' : 'ปฏิเสธ'}
            </button>
          </div>
        );
      }
      
      // Case 2: Freelancer has applied to the project
      if (project.freelancersRequested.includes(userId) && project.status === 'open') {
        return (
          <div className="flex gap-3">
            <button 
              className="btn-secondary" 
              onClick={handleCancelApplication}
              disabled={isLoading}
            >
              {isLoading ? 'กำลังดำเนินการ...' : 'ยกเลิกคำขอ'}
            </button>
          </div>
        );
      }
      
      // Case 3: Freelancer is working on the project
      if (project.assignedTo === userId && (project.status === 'in_progress' || project.status === 'revision')) {
        return (
          <div className="flex gap-3">
            <button 
              className={`btn-primary ${project.progress < 100 ? 'opacity-50 cursor-not-allowed' : ''}`} 
              onClick={project.status === 'revision' ? handleSubmitRevision : handleSubmitProject}
              disabled={project.progress < 100 || isLoading}
            >
              {isLoading ? 'กำลังส่ง...' : project.status === 'revision' ? 'แก้ไขเสร็จสิ้น' : 'เสร็จสิ้น'}
            </button>
          </div>
        );
      }
    } 
    // For Project Owner
    else {
      // Case 1: Owner is waiting for freelancer response
      if (project.requestToFreelancer && project.status === 'open') {
        return (
          <div className="flex gap-3">
            <button 
              className="btn-secondary" 
              onClick={handleCancelFreelancerRequest}
              disabled={isLoading}
            >
              {isLoading ? 'กำลังดำเนินการ...' : 'ยกเลิกคำขอ'}
            </button>
          </div>
        );
      }
      
      // Case 2: Owner has received freelancer applications
      if (project.status === 'open' && project.freelancersRequested?.length > 0 && !project.requestToFreelancer) {
  return (
    <Link
      href={`/manage-projects/${project.id}/applicants`}
      className="btn-primary text-sm flex items-center gap-1.5"
    >
      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
        <circle cx="9" cy="7" r="4"/>
        <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
        <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
      </svg>
      คัดเลือกผู้สมัคร
    </Link>
  );
}
      
      // Case 3: Project is in progress or revision, owner can message freelancer
      if (project.status === 'in_progress' || project.status === 'revision') {
        // ปุ่มส่งข้อความถูกเอาออกตามที่ร้องขอ
        return null;
      }
      
      // Case 4: Project is awaiting approval
      if (project.status === 'awaiting') {
        return (
          <div className="flex gap-3">
            <button 
              className="btn-primary" 
              onClick={handleApproveProject}
              disabled={isLoading}
            >
              {isLoading ? 'กำลังดำเนินการ...' : 'ยืนยันงานเสร็จ'}
            </button>
            <button 
              className="btn-danger" 
              onClick={handleRequestRevision}
              disabled={isLoading}
            >
              {isLoading ? 'กำลังดำเนินการ...' : 'ต้องแก้ไข'}
            </button>
          </div>
        );
      }
    }
    
    // Default: no buttons
    return null;
  };

  return (
    <>
      {renderButtons()}
    </>
  );
}

export default ProjectManageButtons;