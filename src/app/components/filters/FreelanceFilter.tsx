'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface PriceRange {
    min: number;
    max: number | null;
}

interface FreelanceFilterProps {
    selectedSkills: string[];
    onSkillsChange: (skills: string[]) => void;
    selectedMajor: string;
    onMajorChange: (major: string) => void;
    priceRange: PriceRange;
    onPriceRangeChange: (range: PriceRange) => void;
    onApplyFilters: () => void;
    onResetFilters: () => void;
    availableSkills: string[];
    availableMajors: string[];
    // *** NEW PROPS FOR SORTING ***
    currentSort: string; 
    onSortChange: (sortOption: string) => void;
}

// *** ตัวเลือกการเรียงลำดับตามราคาเท่านั้น ***
const priceSortOptions = [
    { value: 'price_desc', label: 'ราคาสูงสุด' },
    { value: 'price_asc', label: 'ราคาต่ำสุด' },
    { value: 'default', label: 'ค่าเริ่มต้น' }, // เพิ่มค่าเริ่มต้น
];

const FreelanceFilter: React.FC<FreelanceFilterProps> = ({
    selectedSkills,
    onSkillsChange,
    selectedMajor,
    onMajorChange,
    priceRange,
    onPriceRangeChange,
    onApplyFilters,
    onResetFilters,
    availableSkills,
    availableMajors,
    // *** NEW PROPS DESTRUCTURING ***
    currentSort,
    onSortChange,
}) => {
    const [isFilterOpen, setIsFilterOpen] = useState(false);
    const [filteredSkills, setFilteredSkills] = useState<string[]>(availableSkills);
    const [skillSearch, setSkillSearch] = useState('');
    const [isMajorDropdownOpen, setIsMajorDropdownOpen] = useState(false);
    // *** NEW STATE FOR SORT DROPDOWN ***
    const [isSortDropdownOpen, setIsSortDropdownOpen] = useState(false);
    
    useEffect(() => {
        if (skillSearch) {
            setFilteredSkills(availableSkills.filter(skill => 
                skill.toLowerCase().includes(skillSearch.toLowerCase())
            ));
        } else {
            setFilteredSkills(availableSkills);
        }
    }, [skillSearch, availableSkills]);
    
    // ปิด dropdown เมื่อคลิกนอกพื้นที่ (รวม Sort Dropdown)
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            const target = event.target as HTMLElement;
            // ใช้ custom class แยกสำหรับ Major/Sort
            if (isMajorDropdownOpen && !target.closest('.custom-major-dropdown')) {
                setIsMajorDropdownOpen(false);
            }
            if (isSortDropdownOpen && !target.closest('.custom-sort-dropdown')) {
                setIsSortDropdownOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isMajorDropdownOpen, isSortDropdownOpen]);
    
    const toggleFilter = () => {
        setIsFilterOpen(!isFilterOpen);
        if (isSortDropdownOpen) setIsSortDropdownOpen(false); // ปิด Sort เมื่อเปิด Filter
    };
    
    // **NEW**: Handle Sort Click and close dropdown
    const handleSortClick = (optionValue: string) => {
        onSortChange(optionValue);
        setIsSortDropdownOpen(false);
        onApplyFilters(); // เรียก apply filters เมื่อมีการจัดเรียง
    };
    
    const currentSortLabel = priceSortOptions.find(opt => opt.value === currentSort)?.label || 'จัดเรียง';

    const handleApplyAndClose = () => {
        onApplyFilters();
        setIsFilterOpen(false);
    };

    const handleSkillToggle = (skill: string) => {
        if (selectedSkills.includes(skill)) {
            onSkillsChange(selectedSkills.filter(s => s !== skill));
        } else {
            onSkillsChange([...selectedSkills, skill]);
        }
    };
    
    const handleMinPriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = parseInt(e.target.value, 10) || 0;
        onPriceRangeChange({ ...priceRange, min: value });
    };
    
    const handleMaxPriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const inputValue = e.target.value.trim();
        const value = inputValue === '' ? null : parseInt(inputValue, 10) || 0;
        onPriceRangeChange({ ...priceRange, max: value });
    };
    
    // ตรวจสอบว่ามีตัวกรองใด ๆ ถูกเลือกหรือไม่
    const hasActiveFilters = selectedSkills.length > 0 || selectedMajor || priceRange.min > 0 || priceRange.max !== null;
    
    return (
        <div className="overflow-hidden transition-all duration-300">
            
            {/* Filter controls - always visible */}
            <div className="p-2 flex justify-between items-center gap-3">
                <h2 className="text-xl font-semibold text-gray-800 p-2 whitespace-nowrap">
                    งานทั้งหมด
                </h2>
                
                <div className="flex gap-3 relative z-20"> {/* เพิ่ม z-index ให้ปุ่ม Dropdown อยู่ด้านบน */}
                    
                    {/* *** ปุ่ม ตัวกรอง/เปิด-ปิด *** */}
                    <button 
                        className={`flex items-center gap-2 px-5 py-2 rounded-full transition-all duration-300 ${ // ใช้ py-2 เพื่อให้เท่ากับ Sort
                            isFilterOpen 
                            ? 'bg-primary-blue-50 text-primary-blue-600 border border-primary-blue-300' 
                            : 'border border-gray-300 text-gray-700 hover:text-primary-blue-600 hover:border-primary-blue-300 hover:bg-gray-50'
                        }`}
                        onClick={toggleFilter}
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" className="size-5">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M12 3c2.755 0 5.455.232 8.083.678.533.09.917.556.917 1.096v1.044a2.25 2.25 0 0 1-.659 1.591l-5.432 5.432a2.25 2.25 0 0 0-.659 1.591v2.927a2.25 2.25 0 0 1-1.244 2.013L9.75 21v-6.568a2.25 2.25 0 0 0-.659-1.591L3.659 7.409A2.25 2.25 0 0 1 3 5.818V4.774c0-.54.384-1.006.917-1.096A48.32 48.32 0 0 1 12 3Z" />
                        </svg>
                        ตัวกรอง
                        {hasActiveFilters && (
                            <span className="flex items-center justify-center ml-1 w-5 h-5 bg-primary-blue-500 text-white text-xs font-semibold rounded-full">
                                {selectedSkills.length + (selectedMajor ? 1 : 0) + ((priceRange.min > 0 || priceRange.max !== null) ? 1 : 0)}
                            </span>
                        )}
                    </button>
                    
                    {/* *** ปุ่มจัดเรียง (Sort Button) *** */}
                    <div className="relative custom-sort-dropdown">
                        <button
                            className={`flex items-center gap-2 px-4 py-2 rounded-full transition-all duration-300 ${
                                isSortDropdownOpen
                                ? 'bg-primary-blue-50 text-primary-blue-600 border border-primary-blue-300'
                                : 'border border-gray-300 text-gray-700 hover:text-primary-blue-600 hover:border-primary-blue-300 hover:bg-gray-50'
                            }`}
                            onClick={() => {
                                // setIsSortDropdownOpen(!isSortDropdownOpen);
                                if (isFilterOpen) setIsFilterOpen(false); // ปิด Filter เมื่อเปิด Sort
                            }}
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="size-5">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M3 7.5 7.5 3m0 0L12 7.5M7.5 3v13.5m13.5 0L16.5 21m0 0L12 16.5m4.5 4.5V7.5" />
                            </svg>
                            {currentSortLabel}
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`transition-transform duration-300 ${isSortDropdownOpen ? 'rotate-180' : ''}`}>
                                <polyline points="6 9 12 15 18 9"></polyline>
                            </svg>
                        </button>
                        
                        <AnimatePresence>
                            {isSortDropdownOpen && (
                                <motion.div
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: 10 }}
                                    transition={{ duration: 0.2 }}
                                    className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden"
                                >
                                    {/*  priceSortOptions  */}
                                    {priceSortOptions.map((option) => (
                                        <div
                                            key={option.value}
                                            className={`p-2 px-4 cursor-pointer text-sm ${
                                                currentSort === option.value 
                                                ? 'bg-primary-blue-50 text-primary-blue-600 font-semibold' 
                                                : 'hover:bg-gray-50 text-gray-700'
                                            }`}
                                            onClick={() => handleSortClick(option.value)}
                                        >
                                            {option.label}
                                        </div>
                                    ))}
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                    
                </div>
            </div>
            
            {/* Advanced filters - collapsible */}
            <AnimatePresence>
                {isFilterOpen && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.3 }}
                        className="overflow-hidden"
                    >
                        <div className="p-5 bg-gray-50 border-t border-gray-100">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                {/* Skills filter */}
                                <div>
                                    <h3 className="text-gray-700 font-medium mb-3 flex items-center">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2 text-primary-blue-500">
                                            <polygon points="14 2 18 6 7 17 3 17 3 13 14 2"></polygon>
                                            <line x1="3" y1="22" x2="21" y2="22"></line>
                                        </svg>
                                        ทักษะ
                                    </h3>
                                    <div className="flex flex-col bg-white border border-gray-200 rounded-xl overflow-hidden">
                                        <div className="p-1.5 border-b border-gray-100">
                                            <input
                                                type="text"
                                                className="w-full p-2 pl-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-primary-blue-300 placeholder:text-gray-400 text-sm"
                                                placeholder="ค้นหาทักษะ..."
                                                value={skillSearch}
                                                onChange={(e) => setSkillSearch(e.target.value)}
                                            />
                                        </div>
                                        <div className="p-1.5 h-40 overflow-y-auto">
                                            {filteredSkills.length > 0 ? (
                                                <div className="grid grid-cols-2 gap-2">
                                                    {filteredSkills.map((skill) => (
                                                        <div key={skill} className="flex items-center">
                                                            <div className="relative flex items-center">
                                                                <input
                                                                    type="checkbox"
                                                                    id={`skill-${skill}`}
                                                                    checked={selectedSkills.includes(skill)}
                                                                    onChange={() => handleSkillToggle(skill)}
                                                                    className="w-4 h-4 opacity-0 absolute"
                                                                />
                                                                <div className={`w-4 h-4 flex items-center justify-center mr-2 border rounded transition-all ${
                                                                    selectedSkills.includes(skill) 
                                                                    ? 'bg-primary-blue-500 border-primary-blue-600' 
                                                                    : 'border-gray-300 bg-white'
                                                                }`}>
                                                                    {selectedSkills.includes(skill) && (
                                                                        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                                                                            <polyline points="20 6 9 17 4 12"></polyline>
                                                                        </svg>
                                                                    )}
                                                                </div>
                                                            </div>
                                                            <label
                                                                htmlFor={`skill-${skill}`}
                                                                className="text-sm text-gray-700 cursor-pointer hover:text-primary-blue-600"
                                                            >
                                                                {skill}
                                                            </label>
                                                        </div>
                                                    ))}
                                                </div>
                                            ) : (
                                                <div className="flex items-center justify-center h-full text-gray-400 text-sm">
                                                    ไม่พบทักษะที่ค้นหา
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                                
                                {/* Major filter */}
                                <div>
                                    <h3 className="text-gray-700 font-medium mb-3 flex items-center">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2 text-primary-blue-500">
                                            <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"></path>
                                            <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"></path>
                                        </svg>
                                        วิชาเอก
                                    </h3>
                                    <div className="custom-major-dropdown">
                                        <div 
                                            className="relative"
                                            onClick={() => setIsMajorDropdownOpen(!isMajorDropdownOpen)}
                                        >
                                            <div className="flex items-center justify-between w-full p-2 pl-4 border border-gray-200 rounded-xl bg-white cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary-blue-300 focus:border-primary-blue-500">
                                                <span className={selectedMajor ? "text-gray-800" : "text-gray-500"}>
                                                    {selectedMajor || 'ทั้งหมด'}
                                                </span>
                                                <div className="text-gray-500">
                                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`transition-transform duration-300 ${isMajorDropdownOpen ? 'rotate-180' : ''}`}>
                                                        <polyline points="6 9 12 15 18 9"></polyline>
                                                    </svg>
                                                </div>
                                            </div>
                                        </div>
                                        
                                        <AnimatePresence>
                                            {isMajorDropdownOpen && (
                                                <motion.div
                                                    initial={{ opacity: 0, y: -10 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    exit={{ opacity: 0, y: -10 }}
                                                    transition={{ duration: 0.2 }}
                                                    className="absolute z-10 w-full max-w-[400px] mt-1 bg-white border border-gray-200 rounded-xl overflow-hidden max-h-60 overflow-y-auto"
                                                >
                                                    <div className="p-1">
                                                        <div 
                                                            className={`p-1.5 px-4 rounded-lg cursor-pointer ${selectedMajor === '' ? 'bg-primary-blue-50 text-primary-blue-600' : 'hover:bg-gray-50'}`}
                                                            onClick={() => {
                                                                onMajorChange('');
                                                                setIsMajorDropdownOpen(false);
                                                            }}
                                                        >
                                                            ทั้งหมด
                                                        </div>
                                                        {availableMajors.map((major) => (
                                                            <div 
                                                                key={major} 
                                                                className={`p-1.5 px-4 rounded-lg cursor-pointer ${selectedMajor === major ? 'bg-primary-blue-50 text-primary-blue-600' : 'hover:bg-gray-50'}`}
                                                                onClick={() => {
                                                                    onMajorChange(major);
                                                                    setIsMajorDropdownOpen(false);
                                                                }}
                                                            >
                                                                {major}
                                                            </div>
                                                        ))}
                                                    </div>
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                    </div>
                                </div>
                                
                                {/* Price range filter */}
                                <div>
                                    <h3 className="text-gray-700 font-medium mb-3 flex items-center">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2 text-primary-blue-500">
                                            <circle cx="12" cy="12" r="10"></circle>
                                            <line x1="12" y1="8" x2="12" y2="12"></line>
                                            <line x1="12" y1="16" x2="12.01" y2="16"></line>
                                        </svg>
                                        ช่วงราคา (บาท)
                                    </h3>
                                    <div className="flex items-center gap-3">
                                        <div className="relative flex-1">
                                            <input
                                                type="number"
                                                min="0"
                                                step="100"
                                                className="w-full p-2 pl-8 border border-gray-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-primary-blue-300 focus:border-primary-blue-500"
                                                placeholder="ต่ำสุด"
                                                value={priceRange.min || ''}
                                                onChange={handleMinPriceChange}
                                            />
                                            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                                                ฿
                                            </div>
                                        </div>
                                        <span className="text-gray-500">-</span>
                                        <div className="relative flex-1">
                                            <input
                                                type="number"
                                                min="0"
                                                step="100"
                                                className="w-full p-2 pl-8 border border-gray-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-primary-blue-300 focus:border-primary-blue-500"
                                                placeholder="ไม่จำกัด"
                                                value={priceRange.max === null ? '' : priceRange.max}
                                                onChange={handleMaxPriceChange}
                                            />
                                            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                                                ฿
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            
                            {/* Selected filters & reset button + APPLY BUTTON (ด้านใน) */}
                            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mt-6 pt-4 border-t border-gray-200">
                                
                                {/* Selected filters display (โค้ดเดิม) */}
                                <div className="flex flex-wrap gap-2 mb-3 sm:mb-0">
                                    {hasActiveFilters ? (
                                        <>
                                            <span className="text-sm text-gray-500 py-1">ตัวกรองที่เลือก:</span>
                                            
                                            {/* ... (โค้ดแสดง/ลบตัวกรองที่เลือก) ... */}
                                            {selectedSkills.map((skill) => (
                                                <span 
                                                    key={skill}
                                                    className="bg-primary-blue-50 text-primary-blue-600 text-sm px-3 py-1 rounded-lg flex items-center group transition-all"
                                                >
                                                    {skill}
                                                    <button 
                                                        type="button"
                                                        onClick={() => handleSkillToggle(skill)}
                                                        className="ml-2 text-primary-blue-400 group-hover:text-primary-blue-600 transition-colors"
                                                        aria-label="ลบทักษะ"
                                                    >
                                                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                            <line x1="18" y1="6" x2="6" y2="18"></line>
                                                            <line x1="6" y1="6" x2="18" y2="18"></line>
                                                        </svg>
                                                    </button>
                                                </span>
                                            ))}
                                            
                                            {selectedMajor && (
                                                <span className="bg-primary-blue-50 text-primary-blue-600 text-sm px-3 py-1 rounded-lg flex items-center group transition-all">
                                                    {selectedMajor}
                                                    <button 
                                                        type="button"
                                                        onClick={() => onMajorChange('')}
                                                        className="ml-2 text-primary-blue-400 group-hover:text-primary-blue-600 transition-colors"
                                                        aria-label="ลบวิชาเอก"
                                                    >
                                                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                            <line x1="18" y1="6" x2="6" y2="18"></line>
                                                            <line x1="6" y1="6" x2="18" y2="18"></line>
                                                        </svg>
                                                    </button>
                                                </span>
                                            )}
                                            
                                            {(priceRange.min > 0 || priceRange.max !== null) && (
                                                <span className="bg-primary-blue-50 text-primary-blue-600 text-sm px-3 py-1 rounded-lg flex items-center group transition-all">
                                                    {priceRange.min} - {priceRange.max === null ? 'ไม่จำกัด' : `${priceRange.max}`} บาท
                                                    <button 
                                                        type="button"
                                                        onClick={() => onPriceRangeChange({ min: 0, max: null })}
                                                        className="ml-2 text-primary-blue-400 group-hover:text-primary-blue-600 transition-colors"
                                                        aria-label="ลบช่วงราคา"
                                                    >
                                                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                            <line x1="18" y1="6" x2="6" y2="18"></line>
                                                            <line x1="6" y1="6" x2="18" y2="18"></line>
                                                        </svg>
                                                    </button>
                                                </span>
                                            )}
                                        </>
                                    ) : (
                                        <span className="text-sm text-gray-500 py-1">ไม่มีตัวกรองที่เลือก</span>
                                    )}
                                </div>
                                
                                {/* Reset all filters + Apply Button */}
                                <div className="flex gap-3">
                                    {/* Reset Button */}
                                    {hasActiveFilters && ( 
                                        <button 
                                            className="text-red-500 hover:text-red-600 text-sm flex items-center gap-1 py-1 px-2 rounded-lg hover:bg-red-50 transition-colors"
                                            onClick={onResetFilters}
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                <path d="M3 6h18"></path>
                                                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"></path>
                                                <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                                            </svg>
                                            ล้างตัวกรอง
                                        </button>
                                    )}

                                    <button 
                                        className="btn-primary px-5 py-2 rounded-xl text-sm font-semibold"
                                        onClick={handleApplyAndClose} // เรียกใช้ฟังก์ชันที่ซ่อน Filter Panel ด้วย
                                    >
                                        ตกลง
                                    </button>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default FreelanceFilter;