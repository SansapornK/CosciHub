"use client";

import { useState, useEffect } from "react";
import { Briefcase, Circle } from "lucide-react";
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
    <div className="fixed inset-0 z-[100] flex items-end md:items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />

      <div className="relative bg-white w-full md:max-w-2xl md:rounded-[3rem] rounded-t-[2rem] shadow-2xl max-h-[90vh] md:max-h-[85vh] flex flex-col overflow-hidden">
        {/* Gradient bar */}
        <div className="h-1 w-full bg-gradient-to-r from-blue-500 via-indigo-400 to-blue-300 shrink-0" />

        {/* Mobile handle */}
        <div className="md:hidden flex justify-center pt-3 pb-1 shrink-0">
          <div className="w-10 h-1 bg-gray-200 rounded-full" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-5 md:px-10 py-4 md:py-5 shrink-0">
          <div className="flex items-center gap-4">
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
          {selectedJobs.length > 0 && (
            <span className="text-xs font-bold bg-blue-600 text-white px-2.5 py-1 rounded-full shrink-0">
              {selectedJobs.length} ประเภท
            </span>
          )}
        </div>

        <div className="border-t border-gray-100 shrink-0" />

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto px-5 md:px-10 py-5 md:py-6">
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-2 gap-3 px-1">
            {allDisplayJobs.map((job) => {
              const isSelected = selectedJobs.includes(job);
              return (
                <button
                  key={job}
                  type="button"
                  onClick={() => toggleJob(job)}
                  className={`flex items-center justify-between px-4 py-3.5 rounded-2xl border transition-all text-left group min-h-[40px] ${
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

        {/* Footer */}
        <div className="border-t border-gray-100 px-6 md:px-10 py-5 flex gap-3 shrink-0">
          <button
            onClick={onClose}
            className="flex-1 py-3.5 bg-gray-100 hover:bg-gray-200 text-gray-600 font-semibold rounded-2xl text-sm transition-all active:scale-95"
          >
            ยกเลิก
          </button>
          <button
            onClick={handleSave}
            className="flex-[2] py-3.5 bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white font-bold rounded-2xl text-sm transition-all active:scale-95 shadow-lg shadow-blue-100"
          >
            บันทึก
          </button>
        </div>
      </div>
    </div>
  );
}