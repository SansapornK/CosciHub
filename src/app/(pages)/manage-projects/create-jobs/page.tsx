// // src/app/(pages)/manage-projects/create-jobs/page.tsx
// 'use client';

// import React, { useState } from "react";
// import axios from "axios";
// import { useRouter } from 'next/navigation';
// import { toast, Toaster } from 'react-hot-toast';
// import { useSession } from "next-auth/react";
// import Link from "next/link";

// // --- Icon Imports ---
// // กำหนดไอคอนตามรูปภาพ (SquarePlus และ Pencil)
// import { SquarePlus, Pencil, ChevronLeft, ArrowRight, DollarSign, CalendarDays,LayoutDashboard,Users } from 'lucide-react';

// // --- Data Structure (ดึงจากโค้ดเดิมของคุณ) ---
// export const skillCategories = {
//   "IT": ["พัฒนาเว็บไซต์", "พัฒนาแอปพลิเคชัน", "วิเคราะห์ข้อมูล", "ออกแบบ UX/UI"],
//   "Public": ["เชียร์ขายสินค้า", "การประสานงาน","การแสดง", "การพูดในที่สาธารณะ"],
//   "Business": ["การตลาด", "การเขียนคอนเทนต์", "PR"],
//   "Photo/Video": ["ถ่ายภาพ/วิดีโอ", "อนิเมชัน", "โมชันกราฟฟิก", "ตัดต่อ","กราฟฟิกดีไซน์"],
//   "อื่นๆ": ["วิชาการ", "วิจัย", "แปลบทความ"]
// };

// // ข้อมูลจำลองสำหรับตัวเลือกอื่นๆ
// const jobTypes = [  "งานด้านวิชาการ/วิจัย/ผู้ช่วย",
//   "งานกิจกรรม/อีเวนต์",
//   "งานพัฒนาออกแบบเว็บไซต์/แอปพลิเคชั่น/ระบบต่างๆ",
//   "งานสื่อมัลติมีเดีย",
//   "งานประชาสัมพันธ์/สื่อสาร",
//   "งานบริการ/ธุรการ",
//   "งานสอนพิเศษ",
//   "งานกองถ่าย/Extra"];
// const jobForms = [  "ออนไซต์","ออนไลน์","ทั้งออนไซต์และออนไลน์"];
// const toolsOptions = ["Adobe Suite", "Figma", "VS Code", "Microsoft Office", "Google Workspace", "Blender"];

// export default function CreateProjectPage() {
//   const { data: session, status } = useSession();
//   const router = useRouter();
//   const [isSubmitting, setIsSubmitting] = useState(false);
//   const [activeCategory, setActiveCategory] = useState(Object.keys(skillCategories)[0]);

//   // --- State Management ---
//   const [formData, setFormData] = useState({
//     title: '',
//     description: '',
//     qualification: '',
//     jobType: jobTypes[0], // เพิ่มประเภทงาน
//     jobForm: jobForms[0],
//     requiredSkills: [] as string[],
//     requiredTools: [] as string[], // เพิ่มเครื่องมือ
//     minBudget: 100, // งบประมาณเริ่มต้น
//     maxBudget: 1000, // งบประมาณสูงสุด
//     capacity: 1,
//     deadline: '', // วันส่งงาน
//     recruitmentDeadline: '', // เพิ่มวันสิ้นสุดรับสมัคร
//   });

//   // --- Logic Handling ---
//   // ป้องกัน Student เข้าถึงหน้านี้
//   if (status === "authenticated" && session?.user?.role === "student") {
//     router.push('/');
//     return null;
//   }

//   const handleSubmit = async (e: React.FormEvent) => {
//     e.preventDefault();
//     if (formData.requiredSkills.length === 0) {
//       toast.error("กรุณาเลือกอย่างน้อย 1 ทักษะ");
//       return;
//     }

//     setIsSubmitting(true);
//     try {
//       // ปรับปรุงการส่งข้อมูลให้ตรงกับ Model ใหม่หากจำเป็น
//       const payload = {
//         ...formData,
//         deadline: new Date(formData.deadline), // แปลงเป็น Date Object สำหรับ DB
//         recruitmentDeadline: new Date(formData.recruitmentDeadline),
//       };

//       const response = await axios.post('/api/projects', payload);
//       toast.success('โพสต์งานสำเร็จ');
//       router.push(`/manage-projects`); // หรือไปหน้าที่สร้างเสร็จ `/project/${response.data.project.id}`
//     } catch (error: any) {
//       toast.error(error.response?.data?.error || 'เกิดข้อผิดพลาดในการโพสต์งาน');
//     } finally {
//       setIsSubmitting(false);
//     }
//   };

//   const handleListToggle = (listName: 'requiredSkills' | 'requiredTools', item: string) => {
//     setFormData(prev => ({
//       ...prev,
//       [listName]: prev[listName].includes(item)
//         ? prev[listName].filter(s => s !== item)
//         : [...prev[listName], item]
//     }));
//   };

//   // --- Helper Component: InputField ---
//   // สร้างคอมโพเนนต์ย่อยเพื่อลดความซ้ำซ้อนของโค้ด Input
//   const InputField = ({ label, id, children }: { label: string, id: string, children: React.ReactNode }) => (
//     <div className="space-y-2">
//       <label htmlFor={id} className="text-sm font-semibold text-gray-700 block">
//         {label}
//       </label>
//       {children}
//     </div>
//   );

//   return (
//     <div className="bg-gray-50/50 min-h-screen">
//       <Toaster position="top-center" reverseOrder={false} />

//       <div className="max-w-7xl mx-auto p-4 md:p-8 pt-6">

//         {/* --- Header Section (ตามรูปภาพ) --- */}
//         <div className="flex items-center justify-between mb-10 pb-4 border-b border-gray-100">
//           <div className="flex items-center gap-4">
//             {/* ปุ่มย้อนกลับ */}
//             <Link href="/manage-projects" className="p-2.5 hover:bg-white rounded-full transition-all text-gray-400 hover:text-gray-600 shadow-sm">
//               <ChevronLeft className="w-5 h-5" />
//             </Link>
//             {/* ไอคอนและหัวข้อหลัก */}
//             <div className="flex items-center gap-3">
//               <SquarePlus className="w-9 h-9 text-gray-800" strokeWidth={1.5} />
//               <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">ลงประกาศงาน</h1>
//             </div>
//           </div>

//           {/* ปุ่มยกเลิก */}
//           <Link href="/manage-projects" className="px-6 py-2.5 rounded-full text-sm font-semibold text-gray-600 bg-white hover:bg-gray-100 transition-all shadow-sm border border-gray-100 flex items-center gap-2">
//             ยกเลิก
//           </Link>
//         </div>

//         {/* --- Main Form Section --- */}
//         <form onSubmit={handleSubmit} className="space-y-8">

//           {/* Section 1: ข้อมูลรายละเอียดงาน (Card สีขาว, ขอบมน, Grid) */}
//           <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-gray-100 space-y-8">
//             <div className="flex items-center gap-3 pb-4 border-b border-gray-50">
//               <Pencil className="w-6 h-6 text-primary-blue-500" />
//               <h2 className="text-xl font-bold text-gray-900">ข้อมูลรายละเอียดงาน</h2>
//             </div>

//               {/* ชื่อโปรเจกต์ */}
//               <InputField label="ชื่องาน" id="title">
//                 <input
//                   id="title"
//                   type="text"
//                   required
//                   className="w-full px-5 py-3.5 rounded-xl bg-gray-50 border border-gray-200 focus:ring-2 focus:ring-primary-blue-200 focus:border-primary-blue-300 transition-all text-gray-800"
//                   placeholder="เช่น พัฒนาเว็บไซต์ E-commerce ด้วย Next.js"
//                   value={formData.title}
//                   onChange={(e) => setFormData({...formData, title: e.target.value})}
//                 />
//               </InputField>

//             <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-8">
//               {/* ประเภทงาน (Job Type) */}
//               <InputField label="ประเภทงาน" id="jobType">
//                 <select
//                   id="jobType"
//                   className="w-full px-5 py-3.5 rounded-xl bg-gray-50 border border-gray-200 focus:ring-2 focus:ring-primary-blue-200 focus:border-primary-blue-300 transition-all text-gray-800 appearance-none"
//                   value={formData.jobType}
//                   onChange={(e) => setFormData({...formData, jobType: e.target.value})}
//                 >
//                   {jobTypes.map(type => (
//                     <option key={type} value={type}>{type}</option>
//                   ))}
//                 </select>
//               </InputField>

//               {/* รูปแบบงาน (Job form) */}
//               <InputField label="รูปแบบงาน" id="jobForm">
//                 <select
//                   id="jobForm"
//                   className="w-full px-5 py-4 rounded-xl bg-gray-50 border border-gray-200 focus:ring-2 focus:ring-primary-blue-200 focus:border-primary-blue-300 transition-all text-gray-800 appearance-none"
//                   value={formData.jobForm}
//                   onChange={(e) => setFormData({...formData, jobForm: e.target.value})}
//                 >
//                   {jobForms.map(type => (
//                     <option key={type} value={type}>{type}</option>
//                   ))}
//                 </select>
//               </InputField>

//               {/* รายละเอียด,คุณสมบัติ (Description, Qualification) - Full Width */}
//               <div className="md:col-span-2">
//                 <InputField label="รายละเอียดงาน" id="description">
//                   <textarea
//                     id="description"
//                     rows={5}
//                     required
//                     className="w-full px-5 py-4 rounded-xl bg-gray-50 border border-gray-200 focus:ring-2 focus:ring-primary-blue-200 focus:border-primary-blue-300 transition-all text-gray-800 resize-none"
//                     placeholder="อธิบายขอบเขตงาน ความต้องการ และผลลัพธ์ที่คาดหวัง..."
//                     value={formData.description}
//                     onChange={(e) => setFormData({...formData, description: e.target.value})}
//                   />
//                 </InputField>

//                  <InputField label="คุณสมบัติผู้สมัคร" id="qualification">
//                   <textarea
//                     id="qualification"
//                     rows={5}
//                     required
//                     className="w-full px-5 py-4 rounded-xl bg-gray-50 border border-gray-200 focus:ring-2 focus:ring-primary-blue-200 focus:border-primary-blue-300 transition-all text-gray-800 resize-none"
//                     placeholder="อธิบายคุณสมบัติพื้นฐานของผู้สมัครงานนี้"
//                     value={formData.qualification}
//                     onChange={(e) => setFormData({...formData, qualification: e.target.value})}
//                   />
//                 </InputField>
//               </div>
//             </div>
//           </div>

//           {/* Section 2: ข้อมูลทักษะและเครื่องมือ */}
//           <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-gray-100 space-y-8">
//             <div className="flex items-center gap-3 pb-4 border-b border-gray-50">
//               <LayoutDashboard className="w-6 h-6 text-primary-blue-500" />
//               <h2 className="text-xl font-bold text-gray-900">ทักษะและเครื่องมือที่ต้องการ</h2>
//             </div>

//             <div className="space-y-6">
//               {/* สายงาน (Categories) */}
//               <InputField label="สายงาน (Field)" id="category">
//                 <div className="flex gap-2 overflow-x-auto pb-2 -mb-2">
//                   {Object.keys(skillCategories).map((cat) => (
//                     <button
//                       key={cat}
//                       type="button"
//                       onClick={() => setActiveCategory(cat)}
//                       className={`px-5 py-2.5 rounded-full text-sm font-medium whitespace-nowrap transition-all flex items-center gap-2 ${
//                         activeCategory === cat
//                           ? 'bg-primary-blue-500 text-white shadow-md'
//                           : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
//                       }`}
//                     >
//                       {cat}
//                     </button>
//                   ))}
//                 </div>
//               </InputField>

//               {/* ทักษะที่ต้องการ (Skills) */}
//               <InputField label="ทักษะที่ต้องการ (Skills)" id="skills">
//                 <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 h-48 overflow-y-auto p-5 bg-gray-50 rounded-2xl border border-gray-100">
//                   {skillCategories[activeCategory as keyof typeof skillCategories].map((skill) => (
//                     <label key={skill} className={`flex items-center gap-3 p-3 bg-white rounded-xl border cursor-pointer hover:shadow-sm transition-all ${formData.requiredSkills.includes(skill) ? 'border-primary-blue-400 bg-primary-blue-50/50' : 'border-gray-200'}`}>
//                       <input
//                         type="checkbox"
//                         checked={formData.requiredSkills.includes(skill)}
//                         onChange={() => handleListToggle('requiredSkills', skill)}
//                         className="w-4.5 h-4.5 rounded text-primary-blue-500 border-gray-300 focus:ring-primary-blue-400"
//                       />
//                       <span className="text-sm text-gray-700 font-medium">{skill}</span>
//                     </label>
//                   ))}
//                 </div>
//               </InputField>

//               {/* เครื่องมือที่ต้องใช้ (Tools) */}
//               <InputField label="เครื่องมือที่ต้องใช้ (Tools/Software)" id="tools">
//                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 h-40 overflow-y-auto p-5 bg-gray-50 rounded-2xl border border-gray-100">
//                   {toolsOptions.map((tool) => (
//                     <label key={tool} className={`flex items-center gap-3 p-3 bg-white rounded-xl border cursor-pointer hover:shadow-sm transition-all ${formData.requiredTools.includes(tool) ? 'border-primary-blue-400 bg-primary-blue-50/50' : 'border-gray-200'}`}>
//                       <input
//                         type="checkbox"
//                         checked={formData.requiredTools.includes(tool)}
//                         onChange={() => handleListToggle('requiredTools', tool)}
//                         className="w-4.5 h-4.5 rounded text-primary-blue-500 border-gray-300 focus:ring-primary-blue-400"
//                       />
//                       <span className="text-sm text-gray-700 font-medium">{tool}</span>
//                     </label>
//                   ))}
//                 </div>
//               </InputField>
//             </div>
//           </div>

//           {/* Section 3: ข้อมูลค่าตอบแทนและระยะเวลา (Grid) */}
//           <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-gray-100 space-y-8">
//             <div className="flex items-center gap-3 pb-4 border-b border-gray-50">
//               <DollarSign className="w-6 h-6 text-primary-blue-500" />
//               <h2 className="text-xl font-bold text-gray-900">ค่าตอบแทนและระยะเวลา</h2>
//             </div>

// {/* งบประมาณ (Budget) */}
// <div className="space-y-2">
//   <label className="text-sm font-semibold text-gray-700 block">งบประมาณ (บาท)</label>
//   <div className="flex items-center gap-3">
//     <div className="relative flex-1">
//       <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
//       <input
//         id="minbudget"
//         type="number"
//         min="100"
//         required
//         placeholder="ต่ำสุด"
//         className="w-full pl-12 pr-5 py-3.5 rounded-xl bg-gray-50 border border-gray-200 focus:ring-2 focus:ring-primary-blue-200 focus:border-primary-blue-300 transition-all text-gray-800 font-semibold"
//         value={formData.minBudget}
//         onChange={(e) => setFormData({...formData, minBudget: parseInt(e.target.value)})}
//       />
//     </div>
//     <span className="text-gray-400 font-medium shrink-0">—</span>
//     <div className="relative flex-1">
//       <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
//       <input
//         id="maxbudget"
//         type="number"
//         min="1000"
//         required
//         placeholder="สูงสุด"
//         className="w-full pl-12 pr-5 py-3.5 rounded-xl bg-gray-50 border border-gray-200 focus:ring-2 focus:ring-primary-blue-200 focus:border-primary-blue-300 transition-all text-gray-800 font-semibold"
//         value={formData.maxBudget}
//         onChange={(e) => setFormData({...formData, maxBudget: parseInt(e.target.value)})}
//       />
//     </div>
//   </div>
// </div>

//             <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
//                  <InputField label="จำนวนรับ" id="capacity">
//                 <div className="relative">
//                   <Users className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
//                   <input
//                     id="capacity"
//                     type="number"
//                     min="1"
//                     required
//                     className="w-full pl-12 pr-5 py-3.5 rounded-xl bg-gray-50 border border-gray-200 focus:ring-2 focus:ring-primary-blue-200 focus:border-primary-blue-300 transition-all text-gray-800 font-semibold"
//                     value={formData.capacity}
//                     onChange={(e) => setFormData({...formData, capacity: parseInt(e.target.value)})}
//                   />
//                 </div>
//               </InputField>

//               {/* วันสิ้นสุดรับสมัคร (Recruitment Deadline) */}
//               <InputField label="วันสิ้นสุดรับสมัคร" id="recruitmentDeadline">
//                 <div className="relative">
//                   <CalendarDays className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
//                   <input
//                     id="recruitmentDeadline"
//                     type="date"
//                     required
//                     className="w-full pl-12 pr-5 py-3.5 rounded-xl bg-gray-50 border border-gray-200 focus:ring-2 focus:ring-primary-blue-200 focus:border-primary-blue-300 transition-all text-gray-800"
//                     value={formData.recruitmentDeadline}
//                     onChange={(e) => setFormData({...formData, recruitmentDeadline: e.target.value})}
//                   />
//                 </div>
//               </InputField>
//             </div>

//              {/* วันส่งงาน (Project Deadline) */}
//               <InputField label="วันส่งงาน (กำหนดส่ง)" id="deadline">
//                 <div className="relative">
//                   <CalendarDays className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
//                   <input
//                     id="deadline"
//                     type="date"
//                     required
//                     className="w-full pl-12 pr-5 py-3.5 rounded-xl bg-gray-50 border border-gray-200 focus:ring-2 focus:ring-primary-blue-200 focus:border-primary-blue-300 transition-all text-gray-800"
//                     value={formData.deadline}
//                     onChange={(e) => setFormData({...formData, deadline: e.target.value})}
//                   />
//                 </div>
//               </InputField>
//           </div>

//           {/* --- Footer / Submit Button --- */}
//           <div className="pt-6 flex justify-end">
//             <button
//               type="submit"
//               disabled={isSubmitting}
//               className="px-10 py-4 rounded-full text-white bg-primary-blue-500 hover:bg-primary-blue-600 transition-all shadow-md flex items-center gap-3 font-semibold text-lg disabled:opacity-60 group"
//             >
//               {isSubmitting ? 'กำลังโพสต์งาน...' : 'โพสต์งาน'}
//               <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
//             </button>
//           </div>
//         </form>
//       </div>
//     </div>
//   );
// }

// src/app/(pages)/manage-projects/create-jobs/page.tsx
"use client";

import React, { useState } from "react";
import axios from "axios";
import { useRouter } from "next/navigation";
import { toast, Toaster } from "react-hot-toast";
import { useSession } from "next-auth/react";
import Link from "next/link";
import {
  SquarePlus,
  Pencil,
  ChevronLeft,
  DollarSign,
  CalendarDays,
  LayoutDashboard,
  Users,
  MapPin,
  Clock,
  BriefcaseBusiness,
} from "lucide-react";

/* ===================== Static Data ===================== */
export const skillCategories = {
  IT: ["พัฒนาเว็บไซต์", "พัฒนาแอปพลิเคชัน", "วิเคราะห์ข้อมูล", "ออกแบบ UX/UI"],
  Public: ["เชียร์ขายสินค้า", "การประสานงาน", "การแสดง", "การพูดในที่สาธารณะ"],
  Business: ["การตลาด", "การเขียนคอนเทนต์", "PR"],
  "Photo/Video": [
    "ถ่ายภาพ/วิดีโอ",
    "อนิเมชัน",
    "โมชันกราฟฟิก",
    "ตัดต่อ",
    "กราฟฟิกดีไซน์",
  ],
  อื่นๆ: ["วิชาการ", "วิจัย", "แปลบทความ"],
};

// category = ประเภทงาน (เก็บใน Job.category)
const jobCategories = [
  "งานด้านวิชาการ/วิจัย/ผู้ช่วย",
  "งานกิจกรรม/อีเวนต์",
  "งานพัฒนาออกแบบเว็บไซต์/แอปพลิเคชั่น/ระบบต่างๆ",
  "งานสื่อมัลติมีเดีย",
  "งานประชาสัมพันธ์/สื่อสาร",
  "งานบริการ/ธุรการ",
  "งานสอนพิเศษ",
  "งานกองถ่าย/Extra",
];

// jobType = รูปแบบงาน (เก็บใน Job.jobType)
const jobForms = ["ออนไลน์", "ออนไซต์", "ทั้งออนไซต์และออนไลน์"];

/* ---------- Helper: InputField ---------- */
const InputField = ({
  label,
  id,
  required = false,
  children,
}: {
  label: string;
  id: string;
  required?: boolean;
  children: React.ReactNode;
}) => (
  <div className="space-y-2">
    <label htmlFor={id} className="text-sm font-semibold text-gray-700 block">
      {label}
      {required && <span className="text-red-400 ml-1">*</span>}
    </label>
    {children}
  </div>
);

/* ===================== Page Component ===================== */
export default function CreateJobPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDrafting, setIsDrafting] = useState(false);
  const [activeCategory, setActiveCategory] = useState(
    Object.keys(skillCategories)[0]
  );

  /* ---------- Form State — ชื่อ field ตรงกับ Job Model ทุก field ---------- */
  const [formData, setFormData] = useState({
    title: "",
    category: jobCategories[0], // ประเภทงาน → Job.category
    shortDescription: "", // คำอธิบายสั้น (ใหม่)
    description: "",
    qualifications: "",
    jobType: jobForms[0], // รูปแบบงาน → Job.jobType
    location: "", // สถานที่ (optional)
    deliveryDate: "", // วันครบกำหนดส่งงาน (optional)
    budgetMin: 100, // → Job.budgetMin
    budgetMax: 1000, // → Job.budgetMax
    capacity: 1, // → Job.capacity
    applicationDeadline: "", // วันสิ้นสุดรับสมัคร → Job.applicationDeadline
    requiredSkills: [] as string[],
  });

  const requiresLocation =
    formData.jobType === "ออนไซต์" ||
    formData.jobType === "ทั้งออนไซต์และออนไลน์";

  /* ---------- Guard: Student ไม่มีสิทธิ์ ---------- */
  if (status === "authenticated" && session?.user?.role === "student") {
    router.push("/");
    return null;
  }

  /* ---------- Submit ---------- */
  const handleSubmit = async (e: React.FormEvent, submitStatus: "published" | "draft") => {
    e.preventDefault();

    // Validation
    if (submitStatus === "published") {
        if (!formData.applicationDeadline) {
        toast.error("กรุณาระบุวันสิ้นสุดการรับสมัคร");
        return;
        }
        if (formData.budgetMin > formData.budgetMax) {
        toast.error("ค่าตอบแทนเริ่มต้นต้องไม่มากกว่าค่าตอบแทนสูงสุด");
        return;
        }
    }

     // ตั้ง loading state ให้ถูกปุ่ม
    submitStatus === "draft" ? setIsDrafting(true) : setIsSubmitting(true);
    try {
      // Payload ตรงกับ Job Model ทุก field
      const payload = {
        title: formData.title || "ร่างงาน",
        category: formData.category,
        shortDescription: formData.shortDescription || "-",
        description: formData.description || "-",
        qualifications: formData.qualifications || "-",
        jobType: formData.jobType,
        location: formData.location || null,
        deliveryDate: formData.deliveryDate || null,
        budgetMin: formData.budgetMin,
        budgetMax: formData.budgetMax,
        capacity: formData.capacity,
        applicationDeadline: formData.applicationDeadline|| new Date().toISOString(),
        status:   submitStatus,  
      };

      // ส่งไปยัง /api/jobs
      await axios.post("/api/jobs", payload);

      if (submitStatus === "draft") {
      toast.success("บันทึกร่างเรียบร้อยแล้ว");
        } else {
      toast.success("ลงประกาศงานสำเร็จ! 🎉");
        }
      router.push("/manage-projects/my-jobs");
    } catch (error: any) {
      toast.error(
        error.response?.data?.error || "เกิดข้อผิดพลาดในการลงประกาศงาน"
      );
    } finally {
        setIsDrafting(false);
        setIsSubmitting(false);
    }
  };

  /* ---------- Toggle Skill Chip ---------- */
  const handleSkillToggle = (skill: string) => {
    setFormData((prev) => ({
      ...prev,
      requiredSkills: prev.requiredSkills.includes(skill)
        ? prev.requiredSkills.filter((s) => s !== skill)
        : [...prev.requiredSkills, skill],
    }));
  };

  /* ===================== JSX ===================== */
  return (
    <div className="bg-gray-50/50 min-h-screen">
      <Toaster position="top-center" reverseOrder={false} />

      <div className="max-w-5xl mx-auto p-4 md:p-8 pt-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-10 pb-4 border-b border-gray-100">
          <div className="flex items-center gap-4">
            <Link
              href="/manage-projects"
              className="p-2.5 hover:bg-white rounded-full transition-all text-gray-400 hover:text-gray-600 shadow-sm"
            >
              <ChevronLeft className="w-5 h-5" />
            </Link>
            <div className="flex items-center gap-3">
              <SquarePlus className="w-9 h-9 text-gray-800" strokeWidth={1.5} />
              <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">
                ลงประกาศงาน
              </h1>
            </div>
          </div>
          <Link
  href="/manage-projects/my-jobs"
  className="px-6 py-2.5 rounded-full text-sm font-semibold text-gray-600 bg-white hover:bg-gray-100 transition-all shadow-sm border border-gray-100 flex items-center gap-2"
>
  <BriefcaseBusiness className="w-4 h-4" />
  งานของฉัน
</Link>
        </div>

        <form onSubmit={(e) => e.preventDefault()} className="space-y-8">
          {/* ───── Section 1: รายละเอียดงาน ───── */}
          <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-gray-100 space-y-8">
            <div className="flex items-center gap-3 pb-4 border-b border-gray-100">
              <Pencil className="w-6 h-6 text-blue-500" />
              <h2 className="text-xl font-bold text-gray-900">รายละเอียดงาน</h2>
            </div>

            {/* ชื่องาน */}
            <InputField label="ชื่องาน" id="title" required>
              <input
                id="title"
                type="text"
                required
                className="w-full px-5 py-3.5 rounded-xl bg-gray-50 border border-gray-200 focus:ring-2 focus:ring-blue-200 focus:border-blue-300 transition-all text-gray-800"
                placeholder="เช่น ผู้ช่วยวิจัยโปรเจกต์ AI ด้านภาษาไทย"
                value={formData.title}
                onChange={(e) =>
                  setFormData({ ...formData, title: e.target.value })
                }
              />
            </InputField>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-8">
              {/* ประเภทงาน → Job.category */}
              <InputField label="ประเภทงาน" id="category" required>
                <select
                  id="category"
                  required
                  className="w-full px-5 py-3.5 rounded-xl bg-gray-50 border border-gray-200 focus:ring-2 focus:ring-blue-200 focus:border-blue-300 transition-all text-gray-800 appearance-none"
                  value={formData.category}
                  onChange={(e) =>
                    setFormData({ ...formData, category: e.target.value })
                  }
                >
                  {jobCategories.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </InputField>

              {/* รูปแบบงาน → Job.jobType */}
              <InputField label="รูปแบบงาน" id="jobType" required>
                <select
                  id="jobType"
                  required
                  className="w-full px-5 py-3.5 rounded-xl bg-gray-50 border border-gray-200 focus:ring-2 focus:ring-blue-200 focus:border-blue-300 transition-all text-gray-800 appearance-none"
                  value={formData.jobType}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      jobType: e.target.value,
                      location: "",
                    })
                  }
                >
                  {jobForms.map((f) => (
                    <option key={f} value={f}>
                      {f}
                    </option>
                  ))}
                </select>
              </InputField>


              {/* สถานที่ → Job.location (conditional) */}
              {requiresLocation && (
                <InputField label="สถานที่ทำงาน" id="location" required>
                  <div className="relative">
                    <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      id="location"
                      type="text"
                      required
                      className="w-full pl-11 pr-5 py-3.5 rounded-xl bg-gray-50 border border-gray-200 focus:ring-2 focus:ring-blue-200 focus:border-blue-300 transition-all text-gray-800"
                      placeholder="เช่น อาคาร XX ห้อง 301"
                      value={formData.location}
                      onChange={(e) =>
                        setFormData({ ...formData, location: e.target.value })
                      }
                    />
                  </div>
                </InputField>
              )}

              {/* คำอธิบายงานสั้น → Job.shortDescription */}
              <div className="md:col-span-2">
                <InputField
                  label="คำอธิบายงานสั้น (แสดงบนการ์ด)"
                  id="shortDescription"
                  required
                >
                  <input
                    id="shortDescription"
                    type="text"
                    required
                    maxLength={100}
                    className="w-full px-5 py-3.5 rounded-xl bg-gray-50 border border-gray-200 focus:ring-2 focus:ring-blue-200 focus:border-blue-300 transition-all text-gray-800"
                    placeholder="สรุปงานใน 1-2 ประโยค (ไม่เกิน 100 ตัวอักษร)"
                    value={formData.shortDescription}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        shortDescription: e.target.value,
                      })
                    }
                  />
                  <p className="text-xs text-gray-400 mt-1 text-right">
                    {formData.shortDescription.length}/100
                  </p>
                </InputField>
              </div>

              {/* รายละเอียดงาน */}
              <div className="md:col-span-2">
                <InputField label="รายละเอียดงาน" id="description" required>
                  <textarea
                    id="description"
                    rows={5}
                    required
                    className="w-full px-5 py-4 rounded-xl bg-gray-50 border border-gray-200 focus:ring-2 focus:ring-blue-200 focus:border-blue-300 transition-all text-gray-800 resize-none"
                    placeholder="อธิบายขอบเขตงาน ความต้องการ และผลลัพธ์ที่คาดหวัง..."
                    value={formData.description}
                    onChange={(e) =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                  />
                </InputField>
              </div>

              {/* คุณสมบัติผู้สมัคร */}
              <div className="md:col-span-2">
                <InputField
                  label="คุณสมบัติผู้สมัคร"
                  id="qualifications"
                  required
                >
                  <textarea
                    id="qualifications"
                    rows={4}
                    required
                    className="w-full px-5 py-4 rounded-xl bg-gray-50 border border-gray-200 focus:ring-2 focus:ring-blue-200 focus:border-blue-300 transition-all text-gray-800 resize-none"
                    placeholder="เช่น นักศึกษาชั้นปีที่ 2 ขึ้นไป, มีความรู้พื้นฐาน Python..."
                    value={formData.qualifications}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        qualifications: e.target.value,
                      })
                    }
                  />
                </InputField>
              </div>
            </div>
          </div>

          {/* ───── Section 2: ค่าตอบแทนและกำหนดการ ───── */}
          <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-gray-100 space-y-8">
            <div className="flex items-center gap-3 pb-4 border-b border-gray-100">
              <DollarSign className="w-6 h-6 text-emerald-500" />
              <h2 className="text-xl font-bold text-gray-900">
                ค่าตอบแทน &amp; กำหนดการ
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-8">
              {/* ค่าตอบแทน Min */}
              <InputField
                label="ค่าตอบแทนเริ่มต้น (บาท)"
                id="budgetMin"
                required
              >
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-medium">
                    ฿
                  </span>
                  <input
                    id="budgetMin"
                    type="number"
                    min={100}
                    required
                    className="w-full pl-9 pr-5 py-3.5 rounded-xl bg-gray-50 border border-gray-200 focus:ring-2 focus:ring-blue-200 focus:border-blue-300 transition-all text-gray-800"
                    value={formData.budgetMin}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        budgetMin: Number(e.target.value),
                      })
                    }
                  />
                </div>
              </InputField>

              {/* ค่าตอบแทน Max */}
              <InputField label="ค่าตอบแทนสูงสุด (บาท)" id="budgetMax" required>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-medium">
                    ฿
                  </span>
                  <input
                    id="budgetMax"
                    type="number"
                    min={100}
                    required
                    className="w-full pl-9 pr-5 py-3.5 rounded-xl bg-gray-50 border border-gray-200 focus:ring-2 focus:ring-blue-200 focus:border-blue-300 transition-all text-gray-800"
                    value={formData.budgetMax}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        budgetMax: Number(e.target.value),
                      })
                    }
                  />
                </div>
              </InputField>

              {/* จำนวนรับ */}
              <InputField label="จำนวนรับ (คน)" id="capacity" required>
                <div className="relative">
                  <Users className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    id="capacity"
                    type="number"
                    min={1}
                    required
                    className="w-full pl-11 pr-5 py-3.5 rounded-xl bg-gray-50 border border-gray-200 focus:ring-2 focus:ring-blue-200 focus:border-blue-300 transition-all text-gray-800"
                    value={formData.capacity}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        capacity: Number(e.target.value),
                      })
                    }
                  />
                </div>
              </InputField>

              {/* วันสิ้นสุดรับสมัคร → Job.applicationDeadline */}
              <InputField
                label="วันสิ้นสุดรับสมัคร"
                id="applicationDeadline"
                required
              >
                <div className="relative">
                  <CalendarDays className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    id="applicationDeadline"
                    type="date"
                    required
                    className="w-full pl-11 pr-5 py-3.5 rounded-xl bg-gray-50 border border-gray-200 focus:ring-2 focus:ring-blue-200 focus:border-blue-300 transition-all text-gray-800"
                    value={formData.applicationDeadline}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        applicationDeadline: e.target.value,
                      })
                    }
                  />
                </div>
              </InputField>

              {/* วันครบกำหนดส่งงาน → Job.deliveryDate (optional) */}
              <InputField label="วันครบกำหนดส่งงาน (ถ้ามี)" id="deliveryDate">
                <div className="relative">
                  <CalendarDays className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    id="deliveryDate"
                    type="date"
                    className="w-full pl-11 pr-5 py-3.5 rounded-xl bg-gray-50 border border-gray-200 focus:ring-2 focus:ring-blue-200 focus:border-blue-300 transition-all text-gray-800"
                    value={formData.deliveryDate}
                    onChange={(e) =>
                      setFormData({ ...formData, deliveryDate: e.target.value })
                    }
                  />
                </div>
              </InputField>
            </div>
          </div>

          {/* ───── Section 3: ทักษะที่ต้องการ ───── */}
          <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-gray-100 space-y-6">
            <div className="flex items-center gap-3 pb-4 border-b border-gray-100">
              <LayoutDashboard className="w-6 h-6 text-purple-500" />
              <h2 className="text-xl font-bold text-gray-900">
                ทักษะที่ต้องการ
              </h2>
              {formData.requiredSkills.length > 0 && (
                <span className="ml-auto text-xs font-semibold bg-blue-50 text-blue-600 px-3 py-1 rounded-full">
                  เลือกแล้ว {formData.requiredSkills.length} ทักษะ
                </span>
              )}
            </div>

            {/* Category Tabs */}
            <div className="flex flex-wrap gap-2">
              {Object.keys(skillCategories).map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setActiveCategory(cat)}
                  className={`px-4 py-2 rounded-full text-sm font-semibold transition-all ${
                    activeCategory === cat
                      ? "bg-blue-600 text-white shadow-md shadow-blue-100"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Skill Chips */}
            <div className="flex flex-wrap gap-2.5">
              {skillCategories[
                activeCategory as keyof typeof skillCategories
              ].map((skill) => {
                const selected = formData.requiredSkills.includes(skill);
                return (
                  <button
                    key={skill}
                    type="button"
                    onClick={() => handleSkillToggle(skill)}
                    className={`px-4 py-2 rounded-xl text-sm font-medium border-2 transition-all ${
                      selected
                        ? "border-blue-400 bg-blue-50 text-blue-700"
                        : "border-gray-200 bg-white text-gray-600 hover:border-blue-200 hover:bg-blue-50/50"
                    }`}
                  >
                    {selected && <span className="mr-1.5">✓</span>}
                    {skill}
                  </button>
                );
              })}
            </div>

            {/* Selected Skills Preview */}
            {formData.requiredSkills.length > 0 && (
              <div className="bg-gray-50 rounded-2xl p-4">
                <p className="text-xs text-gray-500 font-semibold mb-2">
                  ทักษะที่เลือก:
                </p>
                <div className="flex flex-wrap gap-2">
                  {formData.requiredSkills.map((s) => (
                    <span
                      key={s}
                      className="inline-flex items-center gap-1.5 bg-blue-600 text-white text-xs font-medium px-3 py-1.5 rounded-lg"
                    >
                      {s}
                      <button
                        type="button"
                        onClick={() => handleSkillToggle(s)}
                        className="hover:text-blue-200"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* ───── Submit/Draft Button ───── */}
            <div className="flex justify-end gap-3 pb-8">

            {/* ปุ่มบันทึกร่าง */}
            <button
                type="button"
                disabled={isDrafting || isSubmitting || !formData.title}
                onClick={(e) => handleSubmit(e as any, "draft")}
                className="px-8 py-4 bg-white hover:bg-gray-50 disabled:opacity-50 text-gray-700 font-semibold rounded-2xl transition-all border-2 border-gray-200 hover:border-gray-300 flex items-center gap-3 text-base"
            >
                {isDrafting ? (
                <>
                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                    </svg>
                    กำลังบันทึก...
                </>
                ) : (
                <>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17 3H5a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2V7l-4-4z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17 3v4H8V3M12 12v6m-3-3h6" />
                    </svg>
                    บันทึกร่าง
                </>
                )}
            </button>

            {/* ปุ่มลงประกาศงาน */}
            <button
                type="button"
                disabled={isSubmitting || isDrafting}
                onClick={(e) => handleSubmit(e as any, "published")}
                className="px-10 py-4 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white font-bold rounded-2xl transition-all shadow-lg shadow-blue-100 active:scale-95 flex items-center gap-3 text-base"
            >
                {isSubmitting ? (
                <>
                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                    </svg>
                    กำลังลงประกาศ...
                </>
                ) : (
                <>
                    <SquarePlus className="w-5 h-5" />
                    ลงประกาศงาน
                </>
                )}
            </button>

            </div>
        </form>
      </div>
    </div>
  );
}
