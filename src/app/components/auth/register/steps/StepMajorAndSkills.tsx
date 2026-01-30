import React, { useRef, useState, useEffect } from "react";
import { RegisterData } from "../RegisterForm";
import MajorDropdown from "./MajorDropdown";

interface StepMajorAndSkillsProps {
  data: RegisterData;
  updateData: (data: Partial<RegisterData>) => void;
  skillOptions: string[];
  jobOptions: string[];
}

function StepMajorAndSkills({
  data,
  updateData,
  skillOptions,
  jobOptions,
}: StepMajorAndSkillsProps) {

  // Array of majors for dropdown
  const majors = [
    { value: "คอมพิวเตอร์เพื่อการสื่อสาร",label: "คอมพิวเตอร์เพื่อการสื่อสาร",},
    { value: "การจัดการธุรกิจไซเบอร์", label: "การจัดการธุรกิจไซเบอร์" },
    { value: "การออกแบบสื่อปฏิสัมพันธ์และมัลติมีเดีย", label: "การออกแบบสื่อปฏิสัมพันธ์และมัลติมีเดีย",},
    { value: "การสื่อสารเพื่อการท่องเที่ยว",label: "การสื่อสารเพื่อการท่องเที่ยว",},
    { value: "การสื่อสารเพื่อสุขภาพ", label: "การสื่อสารเพื่อสุขภาพ" },
  ];

  // --- State สำหรับแยกประเภทบุคลากร (เฉพาะ Role Teacher) ---
  const [teacherType, setTeacherType] = useState<'academic' | 'staff'>('academic');

  // Icon สำหรับฟิลด์เอก
  const IconMajor = () => (
    <svg className="text-gray-400" width="20" height="20" viewBox="0 0 16 16" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
      <g id="SVGRepo_bgCarrier" strokeWidth="0"></g><g id="SVGRepo_tracerCarrier" strokeLinecap="round" strokeLinejoin="round"></g><g id="SVGRepo_iconCarrier">
        <path d="M16 6.28a1.23 1.23 0 0 0-.62-1.07l-6.74-4a1.27 1.27 0 0 0-1.28 0l-6.75 4a1.25 1.25 0 0 0 0 2.15l1.92 1.12v2.81a1.28 1.28 0 0 0 .62 1.09l4.25 2.45a1.28 1.28 0 0 0 1.24 0l4.25-2.45a1.28 1.28 0 0 0 .62-1.09V8.45l1.24-.73v2.72H16V6.28zm-3.73 5L8 13.74l-4.22-2.45V9.22l3.58 2.13a1.29 1.29 0 0 0 1.28 0l3.62-2.16zM8 10.27l-6.75-4L8 2.26l6.75 4z"></path>
      </g>
    </svg>
  );
  const IconUpload = () => (
    <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
    </svg>
  );

  // จัดการค่า Major เมื่อเปลี่ยนประเภทบุคลากร ---
  useEffect(() => {
    if (data.role === 'teacher') {
      if (teacherType === 'staff') {
        // Auto-fill Major เป็น "สำนักงาน/เจ้าหน้าที่"
        updateData({ major: "สำนักงาน/เจ้าหน้าที่" });
      } else {
        // ถ้ากลับมาเป็นอาจารย์ ให้เคลียร์ค่าเพื่อให้เลือกใหม่
        if (data.major === "สำนักงาน/เจ้าหน้าที่") {
          updateData({ major: "" });
        }
      }
    }
  }, [teacherType, data.role]);


  const handleMajorChange = (value: string) => {
    updateData({ major: value });
  };

  const handleSkillToggle = (skill: string) => {
    const updatedSkills = [...data.skills];

    if (updatedSkills.includes(skill)) {
      // Remove skill if already selected
      const index = updatedSkills.indexOf(skill);
      updatedSkills.splice(index, 1);
    } else {
      // Add skill if not already selected
      updatedSkills.push(skill);
    }

    updateData({ skills: updatedSkills });
  };

  const handleJobToggle = (job: string) => {
    const current = data.interestedJobs || [];
    const updatedJobs = current.includes(job)
      ? current.filter((item) => item !== job)
      : [...current, job];
    updateData({ interestedJobs: updatedJobs });
  };

  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      updateData({ profileImage: file });
    }
    // Reset input value เพื่อให้เลือกไฟล์เดิมซ้ำได้ถ้าต้องการ
    e.target.value = '';
  };

  const removeImage = () => {
    updateData({ profileImage: null });
  };

  const handleEmailChange = (index: number, value: string) => {
    const newEmails = [...(data.teacherEmails || ['', ''])];
    newEmails[index] = value;
    updateData({ teacherEmails: newEmails });
  };

  const addEmailField = () => {
    const currentEmails = data.teacherEmails || ['', ''];
    if (currentEmails.length < 3) {
      updateData({ teacherEmails: [...currentEmails, ''] });
    }
  };

  const removeEmailField = (index: number) => {
    const currentEmails = data.teacherEmails || ['', ''];
    if (currentEmails.length > 2) {
      const newEmails = currentEmails.filter((_, i) => i !== index);
      updateData({ teacherEmails: newEmails });
    }
  };

  const getTitle = () => {
    if (data.role === 'alumni') return 'ข้อมูลการศึกษาและยืนยันตัวตน';
    if (data.role === 'teacher') return 'ข้อมูลบุคลากร';
    return 'วิชาเอกและทักษะ';
  };
  const getDescription = () => {
    if (data.role === 'student') return 'ระบุวิชาเอก ทักษะ และงานที่คุณสนใจ';
    if (data.role === 'alumni') return 'ระบุวิชาเอก อัปโหลดรูปภาพ และอีเมลอาจารย์์ที่ติดต่อได้';
    if (data.role === 'teacher') return 'ระบุประเภทบุคลากรและวิชาเอก';
    return '';
  };

  return (
    <div className="flex flex-col gap-4 w-full items-center">
      <div className="w-full">
        <h2 className="text-lg font-medium text-gray-800"> 
          {getTitle()}
        </h2>
        <p className="text-gray-500 text-sm">
          {getDescription()}
        </p>
      </div>

      {/*Teacher Type Selection*/}
      {data.role === 'teacher' && (
        <div className="w-full mb-2">
          <label className="block text-gray-700 text-sm mb-3 font-medium">ประเภทบุคลากร</label>
          
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Radio 1: Academic */}
            <label className="flex items-center gap-2 cursor-pointer group">
              <input
                type="radio"
                name="teacherType"
                value="academic"
                checked={teacherType === 'academic'}
                onChange={() => setTeacherType('academic')}
                className="w-4 h-4 text-primary-blue-600 border-gray-300 focus:ring-primary-blue-500 cursor-pointer"
              />
              <span className={`text-sm ${teacherType === 'academic' ? 'text-gray-900 font-medium' : 'text-gray-600'}`}>
                อาจารย์
              </span>
            </label>

            {/* Radio 2: Staff */}
            <label className="flex items-center gap-2 cursor-pointer group">
              <input
                type="radio"
                name="teacherType"
                value="staff"
                checked={teacherType === 'staff'}
                onChange={() => setTeacherType('staff')}
                className="w-4 h-4 text-primary-blue-600 border-gray-300 focus:ring-primary-blue-500 cursor-pointer"
              />
              <span className={`text-sm ${teacherType === 'staff' ? 'text-gray-900 font-medium' : 'text-gray-600'}`}>
                สำนักงาน/เจ้าหน้าที่
              </span>
            </label>
          </div>
        </div>
      )}

      {(data.role !== 'teacher' || teacherType === 'academic') && (
      <div className="w-full relative z-20">
        <label htmlFor="major" className="block text-gray-700 text-sm mb-1">
          วิชาเอก<span className="text-red-500">*</span>
        </label>

        <div className="relative">
          <div className="absolute top-0 bottom-0 left-3 flex items-center pointer-events-none z-10">
            <IconMajor/>
          </div>

          <MajorDropdown
            id="major"
            options={majors}
            value={data.major}
            onChange={handleMajorChange}
            placeholder="เลือกวิชาเอก"
            required
          />
        </div>
      </div>
      )}

      {data.role === 'teacher' && teacherType === 'staff' && (
        <div className="w-full p-4 bg-gray-50 rounded-lg border border-gray-200 text-center">
          <p className="text-gray-600 text-sm">
            คุณเลือก <strong>สำนักงาน/เจ้าหน้าที่</strong>
          </p>
          <p className="text-gray-400 text-xs mt-1">
            ระบบจะบันทึกสังกัดของคุณเป็น สำนักงาน/เจ้าหน้าที่ โดยอัตโนมัติ
          </p>
        </div>
      )}

      {data.role === "student" && (
        <div className="mt-2 w-full">
          <label className="block text-gray-700 text-sm mb-1">
            ทักษะ
            <span className="text-xs text-gray-500 ml-1">
              (เลือกอย่างน้อย 1 ทักษะ)
            </span>
          </label>

          {/* Skills selection as chips */}
          <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto pr-1 border border-gray-100 rounded-lg p-2">
            {skillOptions.map((skill) => {
              const selected = data.skills.includes(skill);
              return (
                <button
                  key={skill}
                  type="button"
                  onClick={() => handleSkillToggle(skill)}
                  className={`px-3 py-1 rounded-full text-sm border transition ${
                    selected
                      ? "bg-primary-blue-500 text-white border-primary-blue-500"
                      : "bg-gray-100 text-gray-700 border-gray-200 hover:bg-gray-200"
                  }`}
                >
                  {skill}
                </button>
              );
            })}
          </div>

          {/* Selected skills display */}
          <div className="mt-3">
            <p className="text-sm text-gray-500 mb-2">
              ทักษะที่เลือก ({data.skills.length})
            </p>
            <div className="flex flex-wrap gap-2">
              {data.skills.map((skill) => (
                <span
                  key={skill}
                  className="bg-primary-blue-100 text-primary-blue-600 text-xs px-2 py-1 rounded-lg flex items-center"
                >
                  {skill}
                  <button
                    type="button"
                    onClick={() => handleSkillToggle(skill)}
                    className="ml-1 text-primary-blue-600 hover:text-primary-blue-800 transition-colors"
                    aria-label={`ลบทักษะ ${skill}`}
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <line x1="18" y1="6" x2="6" y2="18"></line>
                      <line x1="6" y1="6" x2="18" y2="18"></line>
                    </svg>
                  </button>
                </span>
              ))}
            </div>
          </div>
          <div className="mt-4 w-full">
            <label className="block text-gray-700 text-sm mb-1">
              ประเภทงานที่สนใจ
            </label>
            <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto pr-1 border border-gray-100 rounded-lg p-2">
              {jobOptions.map((job) => {
                const selected = (data.interestedJobs || []).includes(job);
                return (
                  <button
                    key={job}
                    type="button"
                    onClick={() => handleJobToggle(job)}
                    className={`px-3 py-1 rounded-full text-sm border transition ${
                      selected
                        ? "bg-primary-blue-500 text-white border-primary-blue-500"
                        : "bg-gray-100 text-gray-700 border-gray-200 hover:bg-gray-200"
                    }`}
                  >
                    {job}
                  </button>
                );
              })}
            </div>
            <div className="mt-3">
              <p className="text-sm text-gray-500 mb-2">
                งานที่สนใจ ({(data.interestedJobs || []).length})
              </p>
              <div className="flex flex-wrap gap-2">
                {(data.interestedJobs || []).map((job) => (
                  <span
                    key={job}
                    className="bg-primary-blue-100 text-primary-blue-600 text-xs px-2 py-1 rounded-lg flex items-center"
                  >
                    {job}
                    <button
                      type="button"
                      onClick={() => handleJobToggle(job)}
                      className="ml-1 text-primary-blue-600 hover:text-primary-blue-800 transition-colors"
                      aria-label={`ลบประเภทงาน ${job}`}
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="14"
                        height="14"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <line x1="18" y1="6" x2="6" y2="18"></line>
                        <line x1="6" y1="6" x2="18" y2="18"></line>
                      </svg>
                    </button>
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
      {/* --- Section 2: Alumni Specific (Image & Emails) --- */}
      {data.role === 'alumni' && (
        <>
          <div className="w-full border-t border-gray-200 pt-2"></div>

          {/* 2.1 Teacher Emails */}
          <div className="w-full">
            <div className="flex justify-between items-end">
               <label className="block text-gray-700 text-sm mb-1">
                อีเมลอาจารย์ในมหาวิทยาลัยนวัตกรรมสื่อสารสังคม
                <span className="text-red-500">*</span>
                <span className="text-xs text-gray-500 font-normal ml-1 block sm:inline">
                  (อย่างน้อย 2 ท่าน)
                </span>
              </label>
              {(data.teacherEmails?.length || 0) < 3 && (
                <button 
                  type="button" 
                  onClick={addEmailField}
                  className="text-primary-blue-600 text-xs hover:underline flex items-center font-medium"
                >
                  + เพิ่มอีเมล
                </button>
              )}
            </div>
            <div>
              <p className="text-xs text-gray-400 mb-2">
                * โปรดกรอกอีเมลอาจารย์ที่สามารถติดต่อได้เพื่อยืนยันข้อมูลของคุณ
             </p>
            </div>
  

            <div className="flex flex-col gap-3">
              {(data.teacherEmails || ['', '']).map((email, index) => (
                <div key={index} className="relative">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => handleEmailChange(index, e.target.value)}
                    placeholder={`อีเมลอาจารย์ที่สามารถติดต่อได้ท่านที่ ${index + 1}`}
                    className={`input w-full ${
                      email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) 
                        ? 'border-red-300 focus:ring-red-200' 
                        : ''
                    }`}
                  />
                  
                  {/* ปุ่มลบอีเมล */}
                  {(data.teacherEmails?.length || 0) > 2 && index === (data.teacherEmails?.length || 0) - 1 && (
                    <button
                      type="button"
                      onClick={() => removeEmailField(index)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-red-500 transition"
                      title="ลบช่องนี้"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  )}
                </div>
              ))}
            </div>
            </div>

          {/* 2.2 Profile Image Upload (Button Style) */}
          <div className="w-full border-t border-gray-200 pt-2"></div>
          <div className="w-full">
            <label className="block text-gray-700 text-sm mb-1">
              อัปโหลดรูปโปรไฟล์ <span className="text-red-500">*</span>
            </label>
            
            <div className="flex items-center gap-3">
              <input 
                type="file" 
                ref={fileInputRef} 
                className="hidden" 
                accept="image/*"
                onChange={handleImageUpload}
                required
              />
              
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg border border-gray-300 text-sm font-medium transition-colors flex items-center"
              >
                <IconUpload />
                เลือกรูปภาพ
              </button>

              {data.profileImage ? (
                <div className="flex items-center bg-blue-50 text-blue-700 px-3 py-1.5 rounded-lg border border-blue-100 text-sm">
                  <span className="truncate max-w-[150px] sm:max-w-[200px]">
                    {data.profileImage.name}
                  </span>
                  <button 
                    type="button" 
                    onClick={removeImage}
                    className="ml-2 text-blue-400 hover:text-red-500 focus:outline-none"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              ) : (
                <span className="text-sm text-gray-400">ยังไม่ได้เลือกไฟล์</span>
              )}
            </div>
            <p className="text-xs text-gray-400 mt-1">รองรับไฟล์ .jpg, .png</p>
            <p className="text-xs text-gray-400 mt-1">* โปรดใช้รูปที่เห็นใบหน้าชัดเจน ไม่ใส่แว่นทึบ หมวก หรือวัตถุที่ปิดบังใบหน้า</p>
            <p className="text-xs text-gray-400 mt-1">* ระบบจะส่งข้อมูลของคุณไปยังอีเมลเหล่านี้เพื่อยืนยันตัวตน</p>
          </div>
          
        </>
      )}
    </div>
  );
}

export default StepMajorAndSkills;
