"use client";

import { useState, useEffect } from "react";
import { Briefcase, Circle, Plus, X } from "lucide-react";
import { jobCategories } from "../../constants/JobCategories";

interface JobsModalProps {
  isOpen: boolean;
  initialSelected: string[];
  onClose: () => void;
  onSave: (jobs: string[]) => Promise<void>;
}

export default function JobsModal({
  isOpen,
  initialSelected,
  onClose,
  onSave,
}: JobsModalProps) {
  const [selectedJobs, setSelectedJobs] = useState<string[]>(initialSelected);
  const [customJobs, setCustomJobs] = useState<string[]>([]);
  const [customInput, setCustomInput] = useState("");

  useEffect(() => {
    if (isOpen) {
      setSelectedJobs(initialSelected);
      const userCustom = initialSelected.filter(
        (job) => !jobCategories.includes(job),
      );
      setCustomJobs(userCustom);
    }
  }, [isOpen, initialSelected]);

  if (!isOpen) return null;

  const toggleJob = (job: string) => {
    const isSelected = selectedJobs.includes(job);
    const isStandard = jobCategories.includes(job);

    if (isSelected) {
      setSelectedJobs((prev) => prev.filter((j) => j !== job));
      if (!isStandard) {
        setCustomJobs((prev) => prev.filter((j) => j !== job));
      }
    } else {
      setSelectedJobs((prev) => [...prev, job]);
    }
  };


  const handleSave = async () => {
    await onSave(selectedJobs);
    onClose();
  };

  const allDisplayJobs = Array.from(new Set([...jobCategories, ...customJobs]));

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-gray-900/60 backdrop-blur-md"
        onClick={onClose}
      />

      <div className="relative bg-white w-full max-w-2xl rounded-[3rem] p-10 shadow-2xl animate-in zoom-in-95 duration-300 max-h-[85vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8 shrink-0">
          <div className="p-3 bg-[#0C5BEA] text-white rounded-2xl shadow-lg shadow-blue-100">
            <Briefcase size={24} />
          </div>
          <div>
            <h3 className="text-xl font-black text-gray-900">
              เลือกประเภทงานที่สนใจ
            </h3>
            <p className="text-[12px] text-gray-400 mt-0.5">
              เลือกประเภทงานที่คุณต้องการรับ เพื่อให้ระบบแนะนำงานได้แม่นยำขึ้น
            </p>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto pr-4 custom-scrollbar">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 px-1">
            {allDisplayJobs.map((job) => {
              const isSelected = selectedJobs.includes(job);
              return (
                <button
                  key={job}
                  type="button"
                  onClick={() => toggleJob(job)}
                  className={`flex items-center justify-between px-5 py-4 rounded-2xl border transition-all text-left group min-h-[50px] ${
                    isSelected
                      ? "border-[#0C5BEA] bg-blue-50/50 text-[#0C5BEA] shadow-sm"
                      : "border-gray-100 bg-gray-50 text-gray-500 hover:border-gray-200 hover:bg-white"
                  }`}
                >
                  <span className="text-[12px] font-medium leading-snug break-words pr-2 line-clamp-2">
                    {job}
                  </span>
                  {isSelected && (
                    <Circle
                      size={14}
                      fill="currentColor"
                      className="text-[#0C5BEA] shrink-0 ml-auto"
                    />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="mt-8 pt-8 border-t border-gray-100 flex gap-4 shrink-0">
          <button
            onClick={onClose}
            className="flex-1 py-4 text-sm font-black text-gray-400 hover:text-gray-600 transition-colors"
          >
            ยกเลิก
          </button>
          <button
            onClick={handleSave}
            className="flex-[2] py-4 bg-[#0C5BEA] text-white font-black rounded-[1.5rem] shadow-xl hover:bg-blue-700 active:scale-95 transition-all"
          >
            บันทึก
          </button>
        </div>
      </div>
    </div>
  );
}
