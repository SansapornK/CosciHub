import React from 'react';
import { RegisterData } from '../RegisterForm';
import MajorDropdown from './MajorDropdown';

interface StepMajorAndSkillsProps {
  data: RegisterData;
  updateData: (data: Partial<RegisterData>) => void;
  skillOptions: string[];
  jobOptions: string[];
}

function StepMajorAndSkills({ data, updateData, skillOptions, jobOptions }: StepMajorAndSkillsProps) {
  // Array of majors for dropdown
  const majors = [
    { value: "คอมพิวเตอร์เพื่อการสื่อสาร", label: "คอมพิวเตอร์เพื่อการสื่อสาร" },
    { value: "การจัดการธุรกิจไซเบอร์", label: "การจัดการธุรกิจไซเบอร์" },
    { value: "การออกแบบส่ื่อปฏิสัมพันธ์และมัลติมีเดีย", label: "การออกแบบส่ื่อปฏิสัมพันธ์และมัลติมีเดีย" },
    { value: "การสื่อสารเพื่อการท่องเที่ยว", label: "การสื่อสารเพื่อการท่องเที่ยว" },
    { value: "การสื่อสารเพื่อสุขภาพ", label: "การสื่อสารเพื่อสุขภาพ" },
  ];

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
      ? current.filter(item => item !== job)
      : [...current, job];
    updateData({ interestedJobs: updatedJobs });
  };

  return (
    <div className="flex flex-col gap-4 w-full items-center">
      <div className="w-full">
        {/* <h2 className="text-lg font-medium text-gray-800">วิชาเอกและทักษะ</h2> */}
        <p className="text-gray-500 text-sm">
          {data.role === 'student' 
            ? 'ระบุวิชาเอกและทักษะที่คุณมี' 
            : 'ระบุวิชาเอกของคุณ'}
        </p>
      </div>

      <div className="w-full">
        <label htmlFor="major" className="block text-gray-700 text-sm mb-1">
          วิชาเอก
        </label>
        <MajorDropdown
          id="major"
          options={majors}
          value={data.major}
          onChange={handleMajorChange}
          placeholder="เลือกวิชาเอก"
          required
        />
      </div>

      {data.role === 'student' && (
        <div className="mt-2 w-full">
          <label className="block text-gray-700 text-sm mb-1">
            ทักษะ
            <span className="text-xs text-gray-500 ml-1">
              (เลือกอย่างน้อย 1 ทักษะ)
            </span>
          </label>
          
          {/* Skills selection as chips */}
          <div className="flex flex-wrap gap-2 max-h-48 overflow-y-auto pr-1">
            {skillOptions.map((skill) => {
              const selected = data.skills.includes(skill);
              return (
                <button
                  key={skill}
                  type="button"
                  onClick={() => handleSkillToggle(skill)}
                  className={`px-3 py-1 rounded-full text-sm border transition ${
                    selected
                      ? 'bg-primary-blue-500 text-white border-primary-blue-500'
                      : 'bg-gray-100 text-gray-700 border-gray-200 hover:bg-gray-200'
                  }`}
                >
                  {skill}
                </button>
              );
            })}
          </div>

          {/* Selected skills display */}
          <div className="mt-3">
                  <p className="text-sm text-gray-500 mb-2">ทักษะที่เลือก ({data.skills.length})</p>
                  <div className="flex flex-wrap gap-2">
                    {data.skills.map(skill => (
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
                          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <line x1="18" y1="6" x2="6" y2="18"></line>
                            <line x1="6" y1="6" x2="18" y2="18"></line>
                          </svg>
                        </button>
                      </span>
                    ))}
                  </div>
          </div>
        </div>
      )}

      <div className="mt-4 w-full">
        <label className="block text-gray-700 text-sm mb-1">
          ประเภทงานที่สนใจ
        </label>
        <div className="flex flex-wrap gap-2 max-h-48 overflow-y-auto pr-1">
          {jobOptions.map((job) => {
            const selected = (data.interestedJobs || []).includes(job);
            return (
              <button
                key={job}
                type="button"
                onClick={() => handleJobToggle(job)}
                className={`px-3 py-1 rounded-full text-sm border transition ${
                  selected
                    ? 'bg-primary-blue-500 text-white border-primary-blue-500'
                    : 'bg-gray-100 text-gray-700 border-gray-200 hover:bg-gray-200'
                }`}
              >
                {job}
              </button>
            );
          })}
        </div>
        <div className="mt-3">
          <p className="text-sm text-gray-500 mb-2">งานที่สนใจ ({(data.interestedJobs || []).length})</p>
          <div className="flex flex-wrap gap-2">
            {(data.interestedJobs || []).map(job => (
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
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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
  );
}

export default StepMajorAndSkills;