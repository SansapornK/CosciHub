// find-job/page.tsx
'use client';

import React, { Suspense } from "react";
import Loading from "../../components/common/Loading";

// ************ SearchInput ************
const SearchInput = ({ searchQuery, onSearchChange, onApplyFilters }) => (
   <div className="relative flex items-center w-full">
    <input
        type="text"
        placeholder="ค้นหางานพิเศษที่นิสิตสนใจ"
        value={searchQuery}
        onChange={(e) => onSearchChange(e.target.value)}
        onKeyDown={(e) => {
            if (e.key === 'Enter') {
                onApplyFilters();
            }
        }}
        className="w-full p-1.5 pl-12 bg-white border border-gray-200 rounded-full bg-gray-50 focus:bg-white transition-all duration-300 focus:ring-2 focus:ring-primary-blue-300 focus:border-primary-blue-500 focus:outline-none placeholder:text-primary-blue-300"
    />
    
        <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
            <svg 
                xmlns="http://www.w3.org/2000/svg" 
                className="w-5 h-5 text-primary-blue-300"
                viewBox="0 0 24 24" 
                fill="none" 
                stroke="currentColor" 
                strokeWidth="2" 
                strokeLinecap="round" 
                strokeLinejoin="round"
            >
                <circle cx="11" cy="11" r="8"></circle>
                <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
            </svg>
        </div>
    </div>
);
// ********************************************************************************

// แยก Component หลักไปอยู่ด้านล่าง
const FindFreelancePage = () => {
  return (
    <Suspense fallback={
      <div className="flex justify-center my-12">
        <Loading size="large" color="primary" />
      </div>
    }>
      <FreelancePageContent />
    </Suspense>
  );
};

// สร้าง Component ย่อยที่มีโค้ดหลักทั้งหมด
import { useState, useEffect } from "react";
import JobList from "../../components/lists/JobList";
import FreelanceFilter from "../../components/filters/FreelanceFilter";
import { useSearchParams, useRouter } from "next/navigation";
import axios from "axios";
import { skillCategories } from "../../components/auth/register/RegisterForm";
import { usePusher } from "../../../providers/PusherProvider";

function FreelancePageContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const [totalFreelancers, setTotalFreelancers] = useState(0);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '');
    const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
    const [selectedMajor, setSelectedMajor] = useState(searchParams.get('major') || '');
    const [priceRange, setPriceRange] = useState({
        min: parseInt(searchParams.get('minPrice') || '0', 10),
        max: searchParams.get('maxPrice') ? parseInt(searchParams.get('maxPrice')!, 10) : null
    });
    
    // เพิ่ม usePusher hook เพื่อใช้งาน Pusher
    const { subscribeToFreelancerList } = usePusher();
    
    // Get all available skills from skill categories for the filter
    const allSkills: string[] = Object.values(skillCategories).flat();
    
    // Initialize selected skills from URL parameters
    useEffect(() => {
        const skills = searchParams.get('skills');
        if (skills) {
            setSelectedSkills(skills.split(','));
        }
        
        const query = searchParams.get('q');
        if (query) {
            setSearchQuery(query);
        }
        
        const major = searchParams.get('major');
        if (major) {
            setSelectedMajor(major);
        }
        
        const minPrice = searchParams.get('minPrice');
        const maxPrice = searchParams.get('maxPrice');
        
        if (minPrice || maxPrice) {
            setPriceRange({
                min: minPrice ? parseInt(minPrice, 10) : 0,
                max: maxPrice ? parseInt(maxPrice, 10) : null
            });
        }
    }, [searchParams]);
    
    // เพิ่ม Effect สำหรับการลงทะเบียนรับการอัปเดตรายการฟรีแลนซ์แบบ realtime
    useEffect(() => {
        // ฟังก์ชัน callback สำหรับเมื่อได้รับการอัปเดตรายการฟรีแลนซ์
        const handleFreelancerListUpdate = (data: any) => {
            console.log('ได้รับการอัปเดตรายการฟรีแลนซ์:', data);
            
            // รีโหลดข้อมูลจำนวนฟรีแลนซ์
            fetchTotalCount();
        };
        
        // ลงทะเบียนรับการอัปเดตรายการฟรีแลนซ์
        const unsubscribe = subscribeToFreelancerList(handleFreelancerListUpdate);
        
        // ยกเลิกการลงทะเบียนเมื่อ component unmount
        return () => {
            unsubscribe();
        };
    }, [subscribeToFreelancerList]);
    
    // Fetch total count of available freelancers (students with isOpen=true)
    const fetchTotalCount = async () => {
        try {
            // Build params object for API call
            const params: Record<string, string | number> = {};
            
            // Add filters if they exist
            if (searchQuery) params.q = searchQuery;
            if (selectedSkills.length > 0) params.skills = selectedSkills.join(',');
            if (selectedMajor) params.major = selectedMajor;
            if (priceRange.min > 0) params.minPrice = priceRange.min;
            if (priceRange.max !== null) params.maxPrice = priceRange.max;
            
            // Make HEAD request to get count
            const response = await axios.head('/api/freelancers', { params });
            const totalCount = parseInt(response.headers['x-total-count'], 10);
            
            if (!isNaN(totalCount)) {
                setTotalFreelancers(totalCount);
            }
            
            setIsLoading(false);
        } catch (error) {
            console.error('Error fetching total freelancers count:', error);
            setIsLoading(false);
        }
    };

    // เรียก fetchTotalCount เมื่อ component โหลดครั้งแรกหรือเมื่อตัวกรองเปลี่ยน
    useEffect(() => {
        // เพิ่ม Debounce หรือจัดการการเรียก API ให้เหมาะสมหากมีการพิมพ์เร็ว
        const handler = setTimeout(() => {
            fetchTotalCount();
        }, 300); // 300ms delay

        return () => {
            clearTimeout(handler);
        };
    }, [searchQuery, selectedSkills, selectedMajor, priceRange]);
    
    // Handle filter changes and update URL
    const applyFilters = () => {
        const params = new URLSearchParams();
        
        if (searchQuery) params.set('q', searchQuery);
        if (selectedSkills.length > 0) params.set('skills', selectedSkills.join(','));
        if (selectedMajor) params.set('major', selectedMajor);
        if (priceRange.min > 0) params.set('minPrice', priceRange.min.toString());
        if (priceRange.max !== null) params.set('maxPrice', priceRange.max.toString());
        
        // Reset to page 1
        params.set('page', '1');
        
        router.push(`/find-job?${params.toString()}`);
    };
    
    const resetFilters = () => {
        setSearchQuery('');
        setSelectedSkills([]);
        setSelectedMajor('');
        setPriceRange({ min: 0, max: null });
        router.push('/find-job');
    };
    
    const majors = [
        "คอมพิวเตอร์เพื่อการสื่อสาร",
        "การจัดการธุรกิจไซเบอร์",
        "การออกแบบส่ื่อปฏิสัมพันธ์และมัลติมีเดีย",
        "การสื่อสารเพื่อการท่องเที่ยว",
        "การสื่อสารเพื่อสุขภาพ"
    ];
    
    return (
        <div className="flex flex-col gap-3">
            <section className="bg-blue-50 w-full flex flex-col gap-8 py-15 px-10 justify-center text-center rounded-b-3xl shadow-lg">
                <div className="flex flex-col items-center gap-6 w-full">
                    <div className="w-full max-w-2xl">
                        <SearchInput
                            searchQuery={searchQuery}
                            onSearchChange={setSearchQuery}
                            onApplyFilters={applyFilters}
                        />
                    </div>
                </div>
            </section>

            {/* page title */}
            <section className="mt-6 mb-4 flex flex-col gap-2 px-12">
                {/* Filters section */}
                <FreelanceFilter
                selectedSkills={selectedSkills}
                onSkillsChange={setSelectedSkills}
                selectedMajor={selectedMajor}
                onMajorChange={setSelectedMajor}
                priceRange={priceRange}
                onPriceRangeChange={setPriceRange}
                onApplyFilters={applyFilters}
                onResetFilters={resetFilters}
                availableSkills={allSkills}
                availableMajors={majors}
                />
                {/* freelance list with pagination */}
                {isLoading ? (
                    <div className="flex justify-center my-12">
                        <Loading size="large" color="primary" />
                    </div>
                ) : (
                    <JobList 
                        searchQuery={searchQuery}
                        selectedSkills={selectedSkills} 
                        selectedMajor={selectedMajor}
                        priceRange={priceRange}
                    />
                )}
            </section>

            

            {/* <hr className="text-gray-300"/> */}

            {/* freelance list with pagination */}
            {/* {isLoading ? (
                <div className="flex justify-center my-12">
                    <Loading size="large" color="primary" />
                </div>
            ) : (
                <JobList 
                    totalItems={totalFreelancers}
                    searchQuery={searchQuery}
                    selectedSkills={selectedSkills} 
                    selectedMajor={selectedMajor}
                    priceRange={priceRange}
                />
            )} */}
        </div>
    );
}

export default FindFreelancePage;