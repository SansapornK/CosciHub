'use client'
import { useRouter, useSearchParams } from "next/navigation";
import React, { useEffect, useState } from "react";
import ProjectBoardCard from "../cards/ProjectBoardCard";
import Link from "next/link";
import Pagination from "../common/Pagination";
import Loading from "../common/Loading";

// ************ Mock Data (ข้อมูลจำลอง) ************
interface Project {
  id: string;
  title: string;
  description: string;
  budget: number;
  deadline: string;
  requiredSkills: string[];
  ownerName: string;
  status: string; // open, ongoing, completed, closed
  createdAt: string;
}

const mockProjects: Project[] = [
    { id: "P001", title: "สร้างเว็บไซต์ Portfolio ส่วนตัว", description: "ต้องการนิสิตมาช่วยสร้างเว็บไซต์ Portfolio ด้วย React และ Tailwind CSS", budget: 8000, deadline: "2025-12-31", requiredSkills: ["React", "Tailwind CSS"], ownerName: "คุณสมศรี", status: "open", createdAt: "2025-11-20" },
    { id: "P002", title: "ออกแบบ Mobile App UI/UX", description: "ออกแบบหน้าจอ Mobile Application สำหรับระบบจัดการคลังสินค้า", budget: 15000, deadline: "2026-01-15", requiredSkills: ["Figma", "UX/UI"], ownerName: "บ.เทคโนโลยี จำกัด", status: "open", createdAt: "2025-11-21" },
    { id: "P003", title: "เขียนบทความ SEO (10 บทความ)", description: "เขียนบทความเชิงสุขภาพเกี่ยวกับอาหารเสริม จำนวน 10 บทความ", budget: 5000, deadline: "2025-12-25", requiredSkills: ["Content Writing", "SEO"], ownerName: "ร้าน Healthy Shop", status: "ongoing", createdAt: "2025-11-18" },
    { id: "P004", title: "สร้างวิดีโอโปรโมทคอร์สเรียน", description: "ตัดต่อและ Motion Graphic วิดีโอสั้นสำหรับโฆษณาบน Facebook", budget: 10000, deadline: "2026-01-05", requiredSkills: ["Video Editing", "Motion Graphics"], ownerName: "สถาบัน A", status: "open", createdAt: "2025-11-22" },
    { id: "P005", title: "วิเคราะห์ข้อมูลการขายด้วย Python", description: "ต้องการนักวิเคราะห์ข้อมูลมาช่วยจัดการและวิเคราะห์ข้อมูลการขายรายเดือน", budget: 12000, deadline: "2026-01-10", requiredSkills: ["Python", "Data Analysis"], ownerName: "คุณธนา", status: "completed", createdAt: "2025-11-15" },
    { id: "P006", title: "ทำโลโก้และ Brand Guideline ใหม่", description: "ออกแบบโลโก้ที่ทันสมัยและกำหนดคู่มือการใช้งานแบรนด์", budget: 7000, deadline: "2025-12-30", requiredSkills: ["Illustrator", "Branding"], ownerName: "Startup B", status: "open", createdAt: "2025-11-23" },
    { id: "P007", title: "แปลเอกสารจากไทยเป็นอังกฤษ", description: "แปลเอกสารทางธุรกิจจำนวน 50 หน้า", budget: 4500, deadline: "2025-12-20", requiredSkills: ["Translation", "English"], ownerName: "บ.ส่งออก", status: "open", createdAt: "2025-11-24" },
    { id: "P008", title: "สร้างฐานข้อมูล MongoDB", description: "ตั้งค่าและออกแบบ Schema สำหรับฐานข้อมูล NoSQL", budget: 9000, deadline: "2026-01-01", requiredSkills: ["MongoDB", "Database"], ownerName: "นักพัฒนาอิสระ", status: "closed", createdAt: "2025-11-10" },
    { id: "P009", title: "ทดสอบการใช้งานเว็บไซต์ (Tester)", description: "ทดสอบ Usability ของเว็บไซต์ e-commerce ก่อนเปิดตัว", budget: 3000, deadline: "2025-12-15", requiredSkills: ["QA", "Testing"], ownerName: "คุณปรีชา", status: "open", createdAt: "2025-11-25" },
    { id: "P010", title: "งาน Graphic Design รายเดือน", description: "จ้าง Graphic Designer รายเดือนสำหรับทำสื่อโซเชียล 30 โพสต์", budget: 20000, deadline: "2026-02-01", requiredSkills: ["Photoshop", "Social Media"], ownerName: "Agency C", status: "open", createdAt: "2025-11-25" },
    { id: "P011", title: "สร้าง Chatbot ด้วย Dialogflow", description: "ต้องการผู้พัฒนา Chatbot สำหรับตอบคำถามลูกค้าเบื้องต้น", budget: 18000, deadline: "2026-01-20", requiredSkills: ["Chatbot", "NLP"], ownerName: "บ.โทรคมนาคม", status: "ongoing", createdAt: "2025-11-19" },
    { id: "P012", title: "ช่วยสอน Flutter พื้นฐาน", description: "ติวเตอร์สำหรับสอนการพัฒนา Mobile App ด้วย Flutter 5 ครั้ง", budget: 6000, deadline: "2025-12-31", requiredSkills: ["Flutter", "Dart"], ownerName: "นักศึกษา D", status: "open", createdAt: "2025-11-24" },
    { id: "P013", title: "งานเขียน Content Marketing", description: "เขียน Content เกี่ยวกับผลิตภัณฑ์ IT สำหรับ Blog", budget: 5500, deadline: "2026-01-05", requiredSkills: ["Content Writing", "IT"], ownerName: "บ.ไอที", status: "open", createdAt: "2025-11-23" },
    { id: "P014", title: "ทำสไลด์นำเสนอภาษาอังกฤษ", description: "ออกแบบสไลด์ Presentation ให้สวยงามและตรวจภาษาอังกฤษ", budget: 3500, deadline: "2025-12-28", requiredSkills: ["PowerPoint", "English"], ownerName: "คุณวิภา", status: "open", createdAt: "2025-11-22" },
    { id: "P015", title: "แปลงไฟล์ CAD เป็น 3D Model", description: "แปลงแบบ 2D เป็น 3D Model สำหรับงานพิมพ์", budget: 11000, deadline: "2026-01-15", requiredSkills: ["AutoCAD", "3D Modeling"], ownerName: "โรงงาน E", status: "ongoing", createdAt: "2025-11-17" },
];
// ********************************************************************************

interface ProjectBoardListProps {
  initialItemsPerPage?: number;
  filter?: string; // default filter (e.g., 'open')
}

// ************ ฟังก์ชันจำลองการกรองข้อมูล ************
const filterMockProjects = (
  data: Project[],
  params: URLSearchParams
): Project[] => {
  // ดึงค่าจาก URLSearchParams
  const q = params.get('q')?.toLowerCase() || '';
  const skillsParam = params.get('skills')?.split(',') || [];
  const statusParam = params.get('status')?.toLowerCase() || 'open'; // ใช้ 'open' เป็นค่า default ถ้า filter ไม่ได้กำหนด
  const minPrice = parseInt(params.get('minPrice') || '0', 10);
  const maxPrice = params.get('maxPrice') ? parseInt(params.get('maxPrice')!, 10) : null;

  return data.filter(p => {
    // 1. กรองด้วย Status (สำคัญที่สุด เพราะกำหนดโดย filter prop หรือ URL)
    const matchesStatus = p.status === statusParam;

    // 2. กรองด้วย Search Query (ค้นหาในชื่อ, คำอธิบาย)
    const matchesQuery = !q || 
                         p.title.toLowerCase().includes(q) || 
                         p.description.toLowerCase().includes(q);

    // 3. กรองด้วย Skills (ต้องมีทักษะทุกอย่างที่เลือก)
    const matchesSkills = skillsParam.length === 0 || 
                          skillsParam.every(skill => p.requiredSkills.includes(skill)); 

    // 4. กรองด้วย Price Range
    const matchesPrice = (minPrice === 0 || p.budget >= minPrice) &&
                         (maxPrice === null || p.budget <= maxPrice);
    
    return matchesStatus && matchesQuery && matchesSkills && matchesPrice;
  });
};
// ********************************************************************************


function ProjectBoardList({ initialItemsPerPage = 12, filter = 'open' }: ProjectBoardListProps) {
    const searchParams = useSearchParams();
    const router = useRouter();
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(initialItemsPerPage);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [projects, setProjects] = useState<Project[]>([]);
    const [totalItems, setTotalItems] = useState(0);

    // ************ ฟังก์ชันจำลองการดึงข้อมูล (แทน axios.get) ************
    const fetchMockData = async () => {
      setLoading(true);
      setError("");

      try {
        // จำลองการหน่วงเวลาของ API call (เพื่อแสดง Loading component)
        await new Promise(resolve => setTimeout(resolve, 500)); 

        // สร้าง URLSearchParams เพื่อรวม filter prop กับ URL params
        const currentParams = new URLSearchParams(searchParams.toString());
        
        // กำหนด status จาก filter prop ถ้าไม่มีใน URL (หรือใช้ filter ที่ถูก override ใน URL)
        if (!currentParams.get('status')) {
            currentParams.set('status', filter);
        }

        // 1. กรองข้อมูลทั้งหมดตามเงื่อนไข
        const filteredData = filterMockProjects(mockProjects, currentParams);
        
        // 2. จัดการ Pagination ในฝั่ง Client
        const startIndex = (currentPage - 1) * itemsPerPage;
        const endIndex = startIndex + itemsPerPage;
        const paginatedData = filteredData.slice(startIndex, endIndex);

        // 3. ตั้งค่า State
        setProjects(paginatedData);
        setTotalItems(filteredData.length); // อัปเดต Total Items ที่ได้จากการกรอง
        setLoading(false);
      } catch (err) {
        console.error("Error simulating fetching projects:", err);
        setError("เกิดข้อผิดพลาดในการโหลดข้อมูลโปรเจกต์จำลอง");
        setLoading(false);
      }
    };

    // ดึงข้อมูลเมื่อหน้าเปลี่ยนหรือมีการอัพเดท searchParams/filter
    useEffect(() => {
      fetchMockData();
    }, [currentPage, itemsPerPage, searchParams, filter]); // ใช้ searchParams เป็น dependency เพราะเงื่อนไขการกรองมาจาก URL

    // Handle responsive itemsPerPage based on screen size (โค้ดเดิม)
    useEffect(() => {
        const handleResize = () => {
          const width = window.innerWidth;
          
          if (width >= 1536) { 
            setItemsPerPage(16); 
          } else if (width >= 1280) { 
            setItemsPerPage(12); 
          } else if (width >= 1024) { 
            setItemsPerPage(12); 
          } else if (width >= 640) { 
            setItemsPerPage(10); 
          } else { 
            setItemsPerPage(6); 
          }
        };
        
        handleResize();
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // Calculate total pages
    const totalPages = Math.ceil(totalItems / itemsPerPage);

    // Update current page when URL changes
    useEffect(() => {
        const page = parseInt(searchParams.get('page') || '1', 10);
        
        // ตรวจสอบความถูกต้องของหน้า
        if (!isNaN(page) && page > 0 && page <= totalPages) {
          setCurrentPage(page);
        } else if (!isNaN(page) && page > 0 && totalPages === 0) {
            // กรณี totalPages เป็น 0 แต่ page ใน URL ไม่ใช่ 1
            setCurrentPage(1); 
        } else {
          setCurrentPage(1);
        }
    }, [searchParams, totalPages]);

    // แสดง loading state
    if (loading) {
      return (
        <div className="flex flex-col items-center justify-center py-10">
          <Loading size="large" color="primary" />
          <p className="mt-4 text-gray-500">กำลังโหลดข้อมูลโปรเจกต์...</p>
        </div>
      );
    }

    // แสดงข้อความเมื่อเกิด error
    if (error) {
      return (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
          <p className="text-red-600">{error}</p>
          <button 
            onClick={() => fetchMockData()}
            className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
          >
            ลองใหม่
          </button>
        </div>
      );
    }

    // ถ้าไม่มีโปรเจกต์ให้แสดง
    if (projects.length === 0) {
      // ตรวจสอบว่ามีการใช้ตัวกรองอื่น ๆ นอกเหนือจาก status หรือไม่
      const hasOtherFilters = searchParams.get('q') || searchParams.get('skills') || searchParams.get('minPrice') || searchParams.get('maxPrice');
      
      return (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 text-center">
          <p className="text-gray-500">
            {hasOtherFilters ? 
            'ไม่พบโปรเจกต์ที่ตรงตามเงื่อนไขการค้นหา' : 
            `ไม่พบโปรเจกต์สถานะ ${filter} ในระบบ`}
          </p>
          
          {(searchParams.size > 0 || hasOtherFilters) && (
            <button 
              onClick={() => router.push('/project-board')}
              className="mt-4 px-4 py-2 bg-primary-blue-500 text-white rounded-lg hover:bg-primary-blue-600"
            >
              ล้างตัวกรอง
            </button>
          )}
        </div>
      );
    }

    // แสดงรายการโปรเจกต์
    return (
        <div>
          {/* Page indicator at top right */}
          <div className="flex justify-end mb-6">
              <p className="text-gray-500 text-sm">
                  พบโปรเจกต์ทั้งหมด {totalItems} รายการ | หน้า {currentPage} จาก {totalPages}
              </p>
          </div>
          
          <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 2xl:grid-cols-4 gap-4">
              {/* Project cards */}
              {projects.map((project) => (
              <Link key={project.id} href={`/project/${project.id}`}>
                  <ProjectBoardCard 
                    title={project.title}
                    ownerName={project.ownerName}
                    description={project.description}
                    budget={project.budget}
                    requiredSkills={project.requiredSkills}
                    createdAt={project.createdAt}
                  />
              </Link>
              ))}
          </section>
          
          {/* Pagination component */}
          <Pagination 
              currentPage={currentPage}
              totalPages={totalPages}
              baseUrl="/project-board"
              queryParams={{
                // Add all existing filter query params,รวมถึง status ที่มาจาก URL (ถ้ามี)
                ...(searchParams.get('q') && { q: searchParams.get('q')! }),
                ...(searchParams.get('skills') && { skills: searchParams.get('skills')! }),
                ...(searchParams.get('status') && { status: searchParams.get('status')! }),
                // ใช้ filter prop เป็น default ถ้าไม่มี status ใน URL (แต่จะไม่แสดงใน URL ถ้าไม่มีการคลิก filter)
                ...(!searchParams.get('status') && { status: filter }), 
                ...(searchParams.get('minPrice') && { minPrice: searchParams.get('minPrice')! }),
                ...(searchParams.get('maxPrice') && { maxPrice: searchParams.get('maxPrice')! })
              }}
          />
        </div>
    )
}

export default ProjectBoardList