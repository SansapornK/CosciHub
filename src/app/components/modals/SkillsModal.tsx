"use client";

import { useState, useEffect } from "react";
import { Sparkles, Circle, Plus, X } from "lucide-react";
import { skillCategories } from "../../constants/SkillCategories";

interface SkillsModalProps {
  isOpen: boolean;
  initialSelected: string[];
  onClose: () => void;
  onSave: (skills: string[]) => Promise<void>;
}

export default function SkillsModal({
  isOpen,
  initialSelected,
  onClose,
  onSave,
}: SkillsModalProps) {
  const [selectedSkills, setSelectedSkills] =
    useState<string[]>(initialSelected);
  const [customSkills, setCustomSkills] = useState<string[]>([]);
  const [isAddingCustomSkill, setIsAddingCustomSkill] = useState(false);
  const [customSkillInput, setCustomSkillInput] = useState("");

  const allStandardSkills = Object.values(skillCategories).flat();

  useEffect(() => {
    if (isOpen) {
      setSelectedSkills(initialSelected);
      const userCustomSkills = initialSelected.filter(
        (skill) => !allStandardSkills.includes(skill),
      );
      setCustomSkills(userCustomSkills);
    }
  }, [isOpen, initialSelected]);

  if (!isOpen) return null;

  const toggleSkill = (skill: string) => {
    const isSelected = selectedSkills.includes(skill);
    const isStandard = allStandardSkills.includes(skill);
    if (isSelected) {
      setSelectedSkills((prev) => prev.filter((s) => s !== skill));
      if (!isStandard)
        setCustomSkills((prev) => prev.filter((s) => s !== skill));
    } else {
      setSelectedSkills((prev) => [...prev, skill]);
    }
  };

  const handleAddCustomSkill = () => {
    const trimmed = customSkillInput.trim();
    if (!trimmed) return;
    if (!customSkills.includes(trimmed))
      setCustomSkills((prev) => [...prev, trimmed]);
    if (!selectedSkills.includes(trimmed))
      setSelectedSkills((prev) => [...prev, trimmed]);
    setCustomSkillInput("");
    setIsAddingCustomSkill(false);
  };

  const handleSave = async () => {
    await onSave(selectedSkills);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-end md:items-center justify-center">
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
              <Sparkles size={24} />
            </div>
            <div>
              <h3 className="text-xl font-black text-gray-900">
                เลือกทักษะของคุณ
              </h3>
              <p className="text-[12px] text-gray-400 mt-0.5">
                เลือกทักษะและความเชี่ยวชาญของคุณ (แนะนำอย่างน้อย 5 ทักษะ)
              </p>
            </div>
          </div>
          {selectedSkills.length > 0 && (
            <span className="text-xs font-bold bg-blue-600 text-white px-2.5 py-1 rounded-full shrink-0">
              {selectedSkills.length} ทักษะ
            </span>
          )}
        </div>

        <div className="border-t border-gray-100 shrink-0" />

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto px-5 md:px-10 py-5 md:py-6 space-y-8">
          {Object.entries(skillCategories).map(([category, skills]) => {
            const isOther = category === "อื่น ๆ";
            const displaySkills = isOther
              ? Array.from(new Set([...skills, ...customSkills]))
              : skills;

            return (
              <div key={category} className="space-y-4">
                <h4 className="text-[15px] font-black text-[#0C5BEA] px-1">
                  {category}
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-3 px-1">
                  {displaySkills.map((skill) => {
                    const isSelected = selectedSkills.includes(skill);
                    return (
                      <button
                        key={skill}
                        type="button"
                        onClick={() => toggleSkill(skill)}
                        className={`flex items-center justify-between px-4 py-3.5 rounded-2xl border transition-all text-left group min-h-[40px] ${
                          isSelected
                            ? "border-[#0C5BEA] bg-blue-50/50 text-[#0C5BEA] shadow-sm"
                            : "border-gray-100 bg-gray-50 text-gray-500 hover:border-gray-200 hover:bg-white"
                        }`}
                      >
                        <span className="text-[12px] font-medium leading-snug break-words pr-2 line-clamp-2">
                          {skill}
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

                  {isOther && !isAddingCustomSkill && (
                    <button
                      type="button"
                      onClick={() => setIsAddingCustomSkill(true)}
                      className="flex items-center gap-2 px-4 py-1 rounded-2xl border border-dashed border-gray-200 bg-white text-gray-400 hover:border-[#0C5BEA] hover:text-[#0C5BEA] transition-all min-h-[40px]"
                    >
                      <Plus size={14} className="shrink-0" />
                      <span className="text-[12px] font-medium">
                        เพิ่มทักษะของคุณ
                      </span>
                    </button>
                  )}
                </div>

                {isOther && isAddingCustomSkill && (
                  <div className="flex gap-2 mt-2 items-center animate-in slide-in-from-top-1 duration-200">
                    <div className="relative flex-1">
                      <input
                        autoFocus
                        type="text"
                        value={customSkillInput}
                        onChange={(e) =>
                          setCustomSkillInput(e.target.value.slice(0, 20))
                        }
                        maxLength={20}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") handleAddCustomSkill();
                          if (e.key === "Escape") {
                            setIsAddingCustomSkill(false);
                            setCustomSkillInput("");
                          }
                        }}
                        placeholder="เพิ่มทักษะของคุณเอง เช่น ดนตรี พูดภาษาจีน"
                        className="w-full px-4 py-2 pr-12 rounded-xl border border-gray-100 bg-gray-50 text-gray-500 text-sm outline-none transition-all"
                      />
                      <span
                        className={`absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-medium ${customSkillInput.length >= 20 ? "text-red-500" : "text-gray-300"}`}
                      >
                        {customSkillInput.length}/20
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={handleAddCustomSkill}
                      disabled={!customSkillInput.trim()}
                      className="px-6 py-2 bg-transparent border border-gray-300 text-gray-500 hover:border-[#0C5BEA] hover:text-[#0C5BEA] rounded-full text-sm font-medium transition-colors active:scale-95 disabled:opacity-30 disabled:pointer-events-none flex items-center gap-1.5 shrink-0"
                    >
                      <Plus size={14} strokeWidth={3} />
                      <span>เพิ่ม</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setIsAddingCustomSkill(false);
                        setCustomSkillInput("");
                      }}
                      className="p-2 text-gray-400 hover:text-red-500 transition-colors shrink-0"
                    >
                      <X size={20} />
                    </button>
                  </div>
                )}
              </div>
            );
          })}
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
