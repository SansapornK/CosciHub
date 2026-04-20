// src/app/(pages)/manage-projects/create-jobs/page.tsx
"use client";

import React, { useState, useEffect } from "react";
import axios from "axios";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "react-hot-toast";
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
  BriefcaseBusiness,
  HelpCircle,
} from "lucide-react";
import ConfirmationModal from "@/app/components/modals/ConfirmationModal";

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
const jobForms = [
  { value: "online", label: "ออนไลน์" },
  { value: "onsite", label: "ออนไซต์" },
  { value: "onsite-online", label: "ทั้งออนไซต์และออนไลน์" },
];

/* ---------- Helper: วันที่วันนี้ในรูปแบบ YYYY-MM-DD ---------- */
const getTodayDate = () => new Date().toISOString().split("T")[0];

/* ---------- Helper: InputField ---------- */
const InputField = ({
  label,
  id,
  required = false,
  error,
  children,
}: {
  label: string;
  id: string;
  required?: boolean;
  error?: string;
  children: React.ReactNode;
}) => (
  <div className="space-y-2">
    <label htmlFor={id} className="text-sm font-semibold text-gray-700 block">
      {label}
      {required && <span className="text-red-400 ml-1">*</span>}
    </label>
    {children}
    {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
  </div>
);

/* ===================== Page Component ===================== */
export default function CreateJobPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const duplicateId = searchParams.get("duplicate");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDrafting, setIsDrafting] = useState(false);
  const [isLoadingDuplicate, setIsLoadingDuplicate] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [activeCategory, setActiveCategory] = useState(
    Object.keys(skillCategories)[0]
  );

  // Modal state
  const [showPublishModal, setShowPublishModal] = useState(false);

  /* ---------- Form State — ชื่อ field ตรงกับ Job Model ทุก field ---------- */
  const [formData, setFormData] = useState({
    title: "",
    category: jobCategories[0], // ประเภทงาน → Job.category
    shortDescription: "", // คำอธิบายสั้น (ใหม่)
    description: "",
    qualifications: "",
    jobType: "online", // รูปแบบงาน → Job.jobType
    location: "", // สถานที่ (optional)
    deliveryDate: "", // วันครบกำหนดส่งงาน (optional)
    budgetMin: 100, // → Job.budgetMin
    budgetMax: 1000, // → Job.budgetMax
    capacity: 1, // → Job.capacity
    applicationDeadline: "", // วันสิ้นสุดรับสมัคร → Job.applicationDeadline
    requiredSkills: [] as string[],
  });

  // Prefill ข้อมูลถ้ามี ?duplicate= query param
  useEffect(() => {
    if (!duplicateId) return;

    const fetchJobToDuplicate = async () => {
      setIsLoadingDuplicate(true);
      try {
        const res = await axios.get(`/api/jobs/${duplicateId}`);
        const job = res.data;

        setFormData({
          title: job.title || "",
          category: job.category || jobCategories[0],
          shortDescription: job.shortDescription || "",
          description: job.description || "",
          qualifications: job.qualifications || "",
          jobType: job.jobType || "online",
          location: job.location || "",
          deliveryDate: "", // ให้เลือกใหม่
          budgetMin: job.budgetMin || "",
          budgetMax: job.budgetMax || "",
          capacity: job.capacity || "",
          applicationDeadline: "", // ให้เลือกใหม่
          requiredSkills: [],
        });

        toast.success("โหลดข้อมูลงานสำเร็จ กรุณาตั้งวันรับสมัครใหม่");
      } catch {
        toast.error("ไม่สามารถโหลดข้อมูลงานได้");
      } finally {
        setIsLoadingDuplicate(false);
      }
    };

    fetchJobToDuplicate();
  }, [duplicateId]);

  const requiresLocation =
    formData.jobType === "onsite" || formData.jobType === "onsite-online";

  /* ---------- Guard: Student ไม่มีสิทธิ์ ---------- */
  if (status === "authenticated" && session?.user?.role === "student") {
    router.push("/");
    return null;
  }

  /* ---------- Validation ---------- */
  const validateForm = (): boolean => {
    setErrors({});
    const today = getTodayDate();
    const newErrors: Record<string, string> = {};

    // ตรวจสอบข้อมูลที่จำเป็น
    if (!formData.title.trim()) {
      newErrors.title = "กรุณาระบุชื่องาน";
    }
    if (!formData.shortDescription.trim()) {
      newErrors.shortDescription = "กรุณาระบุคำอธิบายงานสั้น";
    }
    if (!formData.description.trim()) {
      newErrors.description = "กรุณาระบุรายละเอียดงาน";
    }
    if (!formData.qualifications.trim()) {
      newErrors.qualifications = "กรุณาระบุคุณสมบัติผู้สมัคร";
    }
    if (requiresLocation && !formData.location.trim()) {
      newErrors.location = "กรุณาระบุสถานที่ทำงาน";
    }

    // ตรวจสอบค่าตอบแทน
    if (!formData.budgetMin || formData.budgetMin < 0) {
      newErrors.budgetMin = "ค่าตอบแทนขั้นต่ำต้องไม่น้อยกว่า 0 บาท";
    }
    if (!formData.budgetMax || formData.budgetMax < 1) {
      newErrors.budgetMax = "ค่าตอบแทนสูงสุดต้องไม่น้อยกว่า 1 บาท";
    }
    if (formData.budgetMin > formData.budgetMax) {
      newErrors.budgetMax = "ค่าตอบแทนสูงสุดต้องไม่น้อยกว่าค่าตอบแทนเริ่มต้น";
    }

    // ตรวจสอบจำนวนรับ
    if (!formData.capacity || formData.capacity < 1) {
      newErrors.capacity = "จำนวนรับต้องมีอย่างน้อย 1 คน";
    }

    // ตรวจสอบวันสิ้นสุดรับสมัคร
    if (!formData.applicationDeadline) {
      newErrors.applicationDeadline = "กรุณาระบุวันสิ้นสุดรับสมัคร";
    } else if (formData.applicationDeadline < today) {
      newErrors.applicationDeadline = "วันสิ้นสุดรับสมัครต้องไม่เป็นวันในอดีต";
    }

    // ตรวจสอบวันครบกำหนดส่งงาน (ถ้ามี)
    if (formData.deliveryDate) {
      if (formData.deliveryDate < today) {
        newErrors.deliveryDate = "วันครบกำหนดส่งงานต้องไม่เป็นวันในอดีต";
      }
      if (
        formData.applicationDeadline &&
        formData.deliveryDate < formData.applicationDeadline
      ) {
        newErrors.deliveryDate = "วันครบกำหนดส่งงานต้องไม่ก่อนวันสิ้นสุดรับสมัคร";
      }
    }

    // ถ้ามี error ให้แสดงและหยุด
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      const firstError = Object.values(newErrors)[0];
      toast.error(firstError);
      return false;
    }

    return true;
  };

  /* ---------- เปิด modal ยืนยันก่อนลงประกาศ ---------- */
  const handlePublishClick = () => {
    if (validateForm()) {
      setShowPublishModal(true);
    }
  };

  /* ---------- Submit ---------- */
  const handleSubmit = async (submitStatus: "published" | "draft") => {
    // Validate สำหรับ draft ด้วย (แค่ต้องมีชื่องาน)
    if (submitStatus === "draft" && !formData.title.trim()) {
      toast.error("กรุณาระบุชื่องานก่อนบันทึกร่าง");
      return;
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
        applicationDeadline:
          formData.applicationDeadline || new Date().toISOString(),
        status: submitStatus,
      };

      // ส่งไปยัง /api/jobs
      await axios.post("/api/jobs", payload);

      if (submitStatus === "draft") {
        toast.success("บันทึกร่างเรียบร้อยแล้ว");
      } else {
        toast.success("ลงประกาศงานสำเร็จ!");
      }
      router.push("/manage-projects/my-jobs");
    } catch (error: any) {
      toast.error(
        error.response?.data?.error || "เกิดข้อผิดพลาดในการลงประกาศงาน"
      );
    } finally {
      setIsDrafting(false);
      setIsSubmitting(false);
      setShowPublishModal(false);
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

      {/* Confirmation Modal */}
      <ConfirmationModal
        isOpen={showPublishModal}
        title="ยืนยันการลงประกาศงาน"
        message="ต้องการลงประกาศงานนี้ใช่หรือไม่? เมื่อลงประกาศแล้วจะเปิดรับสมัครทันที"
        confirmText="ลงประกาศงาน"
        cancelText="ยกเลิก"
        variant="primary"
        onConfirm={() => handleSubmit("published")}
        onClose={() => setShowPublishModal(false)}
        isLoading={isSubmitting}
      />

      <div className="max-w-6xl mx-auto p-4 md:p-7 pt-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-10 pb-4 border-b border-gray-100">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.back()}
              className="p-2.5 hover:bg-white rounded-full transition-all text-gray-400 hover:text-gray-600 shadow-sm"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-3">
              <SquarePlus className="w-9 h-9 text-gray-800" strokeWidth={1.5} />
              <div>
                <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">
                  {duplicateId ? "ทำสำเนาประกาศงาน" : "ลงประกาศงาน"}
                </h1>
                {isLoadingDuplicate && (
                  <p className="text-sm text-gray-400">กำลังโหลดข้อมูล...</p>
                )}
              </div>
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
            <InputField
              label="ชื่องาน"
              id="title"
              required
              error={errors.title}
            >
              <input
                id="title"
                type="text"
                required
                maxLength={50}
                className={`w-full px-5 py-3.5 rounded-xl bg-gray-50 border focus:ring-2 focus:ring-blue-200 focus:border-blue-300 transition-all text-gray-800 ${
                  errors.title ? "border-red-300" : "border-gray-200"
                }`}
                placeholder="เช่น ผู้ช่วยวิจัยโปรเจกต์ AI ด้านภาษาไทย (ไม่เกิน 50 ตัวอักษร)"
                value={formData.title}
                onChange={(e) => {
                  setFormData({ ...formData, title: e.target.value });
                  if (errors.title)
                    setErrors((prev) => ({ ...prev, title: "" }));
                }}
              />
              <p className="text-xs text-gray-400 text-right">
                {formData.title.length}/50
              </p>
            </InputField>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-6">
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
                    <option key={f.value} value={f.value}>
                      {f.label}
                    </option>
                  ))}
                </select>
              </InputField>

              {/* สถานที่ → Job.location (conditional) */}
              <div className="md:col-span-2">
                {requiresLocation && (
                  <InputField
                    label="สถานที่ทำงาน"
                    id="location"
                    required
                    error={errors.location}
                  >
                    <div className="relative">
                      <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input
                        id="location"
                        type="text"
                        required
                        className={`w-full pl-11 pr-5 py-3.5 rounded-xl bg-gray-50 border focus:ring-2 focus:ring-blue-200 focus:border-blue-300 transition-all text-gray-800 ${
                          errors.location ? "border-red-300" : "border-gray-200"
                        }`}
                        placeholder="เช่น อาคาร XX ห้อง 301"
                        value={formData.location}
                        onChange={(e) => {
                          setFormData({
                            ...formData,
                            location: e.target.value,
                          });
                          if (errors.location)
                            setErrors((prev) => ({ ...prev, location: "" }));
                        }}
                      />
                    </div>
                  </InputField>
                )}
              </div>

              {/* คำอธิบายงานสั้น → Job.shortDescription */}
              <div className="md:col-span-2">
                <InputField
                  label="คำอธิบายงานสั้น (แสดงบนการ์ด)"
                  id="shortDescription"
                  required
                  error={errors.shortDescription}
                >
                  <input
                    id="shortDescription"
                    type="text"
                    required
                    maxLength={100}
                    className={`w-full px-5 py-3.5 rounded-xl bg-gray-50 border focus:ring-2 focus:ring-blue-200 focus:border-blue-300 transition-all text-gray-800 ${
                      errors.shortDescription
                        ? "border-red-300"
                        : "border-gray-200"
                    }`}
                    placeholder="สรุปงานใน 1-2 ประโยค (ไม่เกิน 100 ตัวอักษร)"
                    value={formData.shortDescription}
                    onChange={(e) => {
                      setFormData({
                        ...formData,
                        shortDescription: e.target.value,
                      });
                      if (errors.shortDescription)
                        setErrors((prev) => ({
                          ...prev,
                          shortDescription: "",
                        }));
                    }}
                  />
                  <p className="text-xs text-gray-400 mt-1 text-right">
                    {formData.shortDescription.length}/100
                  </p>
                </InputField>
              </div>

              {/* รายละเอียดงาน */}
              <div className="md:col-span-2">
                <InputField
                  label="รายละเอียดงาน"
                  id="description"
                  required
                  error={errors.description}
                >
                  <textarea
                    id="description"
                    rows={4}
                    required
                    className={`w-full px-5 py-4 rounded-xl bg-gray-50 border focus:ring-2 focus:ring-blue-200 focus:border-blue-300 transition-all text-gray-800 resize-none ${
                      errors.description ? "border-red-300" : "border-gray-200"
                    }`}
                    placeholder="อธิบายขอบเขตงาน ความต้องการ และผลลัพธ์ที่คาดหวัง..."
                    value={formData.description}
                    onChange={(e) => {
                      setFormData({ ...formData, description: e.target.value });
                      if (errors.description)
                        setErrors((prev) => ({ ...prev, description: "" }));
                    }}
                  />
                </InputField>
              </div>

              {/* คุณสมบัติผู้สมัคร */}
              <div className="md:col-span-2">
                <InputField
                  label="คุณสมบัติผู้สมัคร"
                  id="qualifications"
                  required
                  error={errors.qualifications}
                >
                  <textarea
                    id="qualifications"
                    rows={4}
                    required
                    className={`w-full px-5 py-4 rounded-xl bg-gray-50 border focus:ring-2 focus:ring-blue-200 focus:border-blue-300 transition-all text-gray-800 resize-none ${
                      errors.qualifications
                        ? "border-red-300"
                        : "border-gray-200"
                    }`}
                    placeholder="เช่น นักศึกษาชั้นปีที่ 2 ขึ้นไป, มีความรู้พื้นฐาน Python..."
                    value={formData.qualifications}
                    onChange={(e) => {
                      setFormData({
                        ...formData,
                        qualifications: e.target.value,
                      });
                      if (errors.qualifications)
                        setErrors((prev) => ({ ...prev, qualifications: "" }));
                    }}
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
                error={errors.budgetMin}
              >
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-medium">
                    ฿
                  </span>
                  <input
                    id="budgetMin"
                    type="number"
                    min={0}
                    required
                    className={`w-full pl-9 pr-5 py-3.5 rounded-xl bg-gray-50 border focus:ring-2 focus:ring-blue-200 focus:border-blue-300 transition-all text-gray-800 ${
                      errors.budgetMin ? "border-red-300" : "border-gray-200"
                    }`}
                    value={formData.budgetMin}
                    onChange={(e) => {
                      const value = Number(e.target.value);
                      setFormData({ ...formData, budgetMin: value });
                      if (errors.budgetMin)
                        setErrors((prev) => ({ ...prev, budgetMin: "" }));
                    }}
                  />
                </div>
              </InputField>

              {/* ค่าตอบแทน Max */}
              <InputField
                label="ค่าตอบแทนสูงสุด (บาท)"
                id="budgetMax"
                required
                error={errors.budgetMax}
              >
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-medium">
                    ฿
                  </span>
                  <input
                    id="budgetMax"
                    type="number"
                    min={1}
                    required
                    className={`w-full pl-9 pr-5 py-3.5 rounded-xl bg-gray-50 border focus:ring-2 focus:ring-blue-200 focus:border-blue-300 transition-all text-gray-800 ${
                      errors.budgetMax ? "border-red-300" : "border-gray-200"
                    }`}
                    value={formData.budgetMax}
                    onChange={(e) => {
                      setFormData({
                        ...formData,
                        budgetMax: Number(e.target.value),
                      });
                      if (errors.budgetMax)
                        setErrors((prev) => ({ ...prev, budgetMax: "" }));
                    }}
                  />
                </div>
              </InputField>
            </div>

            {/* จำนวนรับ */}
            <InputField
              label="จำนวนรับ (คน)"
              id="capacity"
              required
              error={errors.capacity}
            >
              <div className="relative">
                <Users className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  id="capacity"
                  type="number"
                  min={1}
                  required
                  className={`w-full pl-11 pr-5 py-3.5 rounded-xl bg-gray-50 border focus:ring-2 focus:ring-blue-200 focus:border-blue-300 transition-all text-gray-800 ${
                    errors.capacity ? "border-red-300" : "border-gray-200"
                  }`}
                  value={formData.capacity}
                  onChange={(e) => {
                    setFormData({
                      ...formData,
                      capacity: Number(e.target.value),
                    });
                    if (errors.capacity)
                      setErrors((prev) => ({ ...prev, capacity: "" }));
                  }}
                />
              </div>
            </InputField>

            {/* วันสิ้นสุดรับสมัคร → Job.applicationDeadline */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-8">
              <div className="space-y-2">
                <label
                  htmlFor="applicationDeadline"
                  className="text-sm font-semibold text-gray-700 flex items-center gap-1.5"
                >
                  วันสิ้นสุดการรับสมัคร
                  <span className="text-red-400">*</span>
                  <span className="relative group">
                    <HelpCircle className="w-4 h-4 text-gray-400 cursor-help" />
                    <span className="absolute  -translate-x-1/2 bottom-full mb-2 px-3 py-2 bg-gray-800 text-white text-xs text-center rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-20 pointer-events-none">
                      - คุณสามารถปิดรับสมัครก่อนกำหนดได้
                      <br />
                      - หากเลยวันสิ้นสุดการรับสมัคร งานของคุณจะถูกปิดรับสมัครโดยอัตโนมัติ
                    </span>
                  </span>
                </label>
                <div className="relative">
                  <CalendarDays className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    id="applicationDeadline"
                    type="date"
                    required
                    min={getTodayDate()}
                    className={`w-full pl-11 pr-5 py-3.5 rounded-xl bg-gray-50 border focus:ring-2 focus:ring-blue-200 focus:border-blue-300 transition-all text-gray-800 ${
                      errors.applicationDeadline
                        ? "border-red-300"
                        : "border-gray-200"
                    }`}
                    value={formData.applicationDeadline}
                    onChange={(e) => {
                      setFormData({
                        ...formData,
                        applicationDeadline: e.target.value,
                      });
                      if (errors.applicationDeadline)
                        setErrors((prev) => ({
                          ...prev,
                          applicationDeadline: "",
                        }));
                    }}
                  />
                </div>
                {errors.applicationDeadline && (
                  <p className="text-xs text-red-500 mt-1">
                    {errors.applicationDeadline}
                  </p>
                )}
              </div>

              {/* วันครบกำหนดส่งงาน → Job.deliveryDate (optional) */}
              <InputField
                label="วันครบกำหนดส่งงาน (ถ้ามี)"
                id="deliveryDate"
                error={errors.deliveryDate}
              >
                <div className="relative">
                  <CalendarDays className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    id="deliveryDate"
                    type="date"
                    min={formData.applicationDeadline || getTodayDate()}
                    className={`w-full pl-11 pr-5 py-3.5 rounded-xl bg-gray-50 border focus:ring-2 focus:ring-blue-200 focus:border-blue-300 transition-all text-gray-800 ${
                      errors.deliveryDate ? "border-red-300" : "border-gray-200"
                    }`}
                    value={formData.deliveryDate}
                    onChange={(e) => {
                      setFormData({
                        ...formData,
                        deliveryDate: e.target.value,
                      });
                      if (errors.deliveryDate)
                        setErrors((prev) => ({ ...prev, deliveryDate: "" }));
                    }}
                  />
                </div>
              </InputField>
            </div>
          </div>

          {/* ───── Submit/Draft Button ───── */}
          <div className="flex justify-end gap-3 pb-8">
            {/* ปุ่มบันทึกร่าง */}
            <button
              type="button"
              disabled={isDrafting || isSubmitting || !formData.title}
              onClick={() => handleSubmit("draft")}
              className="px-8 py-4 bg-white hover:bg-gray-50 disabled:opacity-50 text-gray-700 font-semibold rounded-2xl transition-all border-2 border-gray-200 hover:border-gray-300 flex items-center gap-3 text-base"
            >
              {isDrafting ? (
                <>
                  <svg
                    className="animate-spin h-5 w-5"
                    viewBox="0 0 24 24"
                    fill="none"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8v8H4z"
                    />
                  </svg>
                  กำลังบันทึก...
                </>
              ) : (
                <>
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={2}
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M17 3H5a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2V7l-4-4z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M17 3v4H8V3M12 12v6m-3-3h6"
                    />
                  </svg>
                  บันทึกร่าง
                </>
              )}
            </button>

            {/* ปุ่มลงประกาศงาน */}
            <button
              type="button"
              disabled={isSubmitting || isDrafting}
              onClick={handlePublishClick}
              className="px-10 py-4 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white font-bold rounded-2xl transition-all shadow-lg shadow-blue-100 active:scale-95 flex items-center gap-3 text-base"
            >
              {isSubmitting ? (
                <>
                  <svg
                    className="animate-spin h-5 w-5"
                    viewBox="0 0 24 24"
                    fill="none"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8v8H4z"
                    />
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
