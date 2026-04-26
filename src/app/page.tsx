"use client";

import Link from "next/link";
import React, { useState, useEffect, JSX, useRef, useCallback } from "react";
import axios from "axios";
import { useSession } from "next-auth/react";
import JobCard from "./components/cards/JobCard";
import {
  calculateTimeAgo,
  getCategoryIcon,
} from "@/app/components/utils/jobHelpers";
import { Briefcase, ArrowRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { MAJOR } from "@/app/constants/Majors";
import { fadeInUp, staggerContainer } from "@/libs/animations";

interface Feature {
  title: string;
  description: string;
  icon: React.ReactNode;
}

// --- Animation Variants ---

const KEYWORDS_DESKTOP = [
  {
    text: "งานน่าเชื่อถือ",
    style: "border-2 border-dashed border-gray-400 text-gray-600 bg-white",
    x: "75%",
    y: "5%",
    rotate: 15,
    size: "text-base md:text-lg font-medium",
  },
  {
    text: "การพัฒนา",
    style: "bg-blue-100 text-gray-700 border border-blue-200",
    x: "58%",
    y: "25%",
    rotate: 0,
    size: "text-lg md:text-xl font-medium",
  },
  {
    text: "ประสบการณ์",
    style: "bg-[#F4FE57] text-gray-800 font-black",
    x: "15%",
    y: "35%",
    rotate: -3,
    size: "text-lg md:text-xl font-medium",
  },
  {
    text: "Experience",
    style: "bg-gray-100 text-gray-500 border border-gray-200",
    x: "45%",
    y: "52%",
    rotate: 10,
    size: "text-lg md:text-xl font-medium",
  },
  {
    text: "Project",
    style:
      "bg-[#F4FE57] text-gray-800 font-black border-2 border-dashed border-gray-500",
    x: "72%",
    y: "48%",
    rotate: -8,
    size: "text-lg md:text-xl font-medium",
  },
  {
    text: "โอกาส",
    style: "border-1 border-gray-400 text-gray-600 bg-white",
    x: "5%",
    y: "60%",
    rotate: 10,
    size: "text-lg md:text-xl font-medium",
  },
  {
    text: "Skill",
    style: "bg-[#0C5BEA]/10 text-[#0C5BEA] border border-[#0C5BEA]/30",
    x: "38%",
    y: "78%",
    rotate: -5,
    size: "text-lg md:text-xl font-medium",
  },
  {
    text: "COSCI Hub",
    style: "bg-white text-gray-700 border border-gray-200 shadow-sm",
    x: "78%",
    y: "78%",
    rotate: 0,
    size: "text-lg md:text-xl font-medium",
  },
];

const KEYWORDS_MOBILE = [
  {
    text: "งานน่าเชื่อถือ",
    style: "border-2 border-dashed border-gray-400 text-gray-600 bg-white",
    x: "65%",
    y: "5%",
    rotate: 10,
    size: "text-sm font-medium",
  },
  {
    text: "การพัฒนา",
    style: "bg-blue-100 text-gray-700 border border-blue-200",
    x: "40%",
    y: "18%",
    rotate: 0,
    size: "text-sm font-medium",
  },
  {
    text: "ประสบการณ์",
    style: "bg-[#F4FE57] text-gray-800 font-black",
    x: "3%",
    y: "10%",
    rotate: -8,
    size: "text-sm font-medium",
  },
  {
    text: "Experience",
    style: "bg-gray-100 text-gray-500 border border-gray-200",
    x: "25%",
    y: "35%",
    rotate: 8,
    size: "text-sm font-medium",
  },
  {
    text: "Project",
    style:
      "bg-[#F4FE57] text-gray-800 font-black border-2 border-dashed border-gray-500",
    x: "65%",
    y: "30%",
    rotate: -10,
    size: "text-sm font-medium",
  },
  {
    text: "โอกาส",
    style: "border border-gray-400 text-gray-600 bg-white",
    x: "2%",
    y: "50%",
    rotate: -6,
    size: "text-sm font-medium",
  },
  {
    text: "Skill",
    style: "bg-[#0C5BEA]/10 text-[#0C5BEA] border border-[#0C5BEA]/30",
    x: "20%",
    y: "65%",
    rotate: 10,
    size: "text-sm font-medium",
  },
  {
    text: "COSCI Hub",
    style: "bg-white text-gray-700 border border-gray-200 shadow-sm",
    x: "55%",
    y: "60%",
    rotate: 2,
    size: "text-sm font-medium",
  },
];

const ICON_BUBBLES_DESKTOP = [
  {
    emoji: "🎓",
    x: "48%",
    y: "28%",
    size: "w-10 h-10 md:w-12 md:h-12",
    border: "bg-white shadow-sm border border-gray-100",
    rotate: -10,
  },
  {
    emoji: "💼",
    x: "28%",
    y: "60%",
    size: "w-10 h-10 md:w-12 md:h-12",
    border: "border-1 border-dashed border-black-200 bg-white",
    rotate: 15,
  },
  {
    emoji: "⭐",
    x: "62%",
    y: "82%",
    size: "w-10 h-10 md:w-12 md:h-12",
    border: "bg-yellow-50 border border-yellow-200",
    rotate: 5,
  },
  {
    emoji: "❤️",
    x: "92%",
    y: "28%",
    size: "w-12 h-12 md:w-14 md:h-14",
    border: "border border-pink-200 bg-white shadow-sm",
    rotate: -10,
  },
];

const ICON_BUBBLES_MOBILE = [
  {
    emoji: "🎓",
    x: "10%",
    y: "30%",
    size: "w-9 h-9",
    border: "bg-white shadow-sm border border-gray-100",
    rotate: -8,
  },
  {
    emoji: "💼",
    x: "50%",
    y: "4%",
    size: "w-9 h-9",
    border: "border border-dashed border-gray-300 bg-white",
    rotate: 12,
  },
  {
    emoji: "⭐",
    x: "35%",
    y: "52%",
    size: "w-9 h-9",
    border: "bg-yellow-50 border border-yellow-200",
    rotate: 5,
  },
  {
    emoji: "❤️",
    x: "85%",
    y: "45%",
    size: "w-10 h-10",
    border: "border border-pink-200 bg-white shadow-sm",
    rotate: -8,
  },
];

// ── render helper ──────────────────────────────────────────────────────────────
const KeywordLayer = ({
  keywords,
  icons,
}: {
  keywords: typeof KEYWORDS_DESKTOP;
  icons: typeof ICON_BUBBLES_DESKTOP;
}) => (
  <>
    {keywords.map((kw, i) => (
      <motion.span
        key={i}
        initial={{ opacity: 0, scale: 0.7 }}
        whileInView={{ opacity: 1, scale: 1 }}
        viewport={{ once: true }}
        transition={{
          delay: i * 0.07,
          duration: 0.5,
          ease: [0.22, 1, 0.36, 1],
        }}
        whileHover={{ scale: 1.12, rotate: 0 }}
        // className={`absolute px-4 py-2 rounded-full cursor-default select-none ${kw.size} ${kw.style}`}
        className={`absolute px-5 py-2 rounded-full cursor-default select-none ${kw.size} ${kw.style}`}
        style={{ left: kw.x, top: kw.y, rotate: `${kw.rotate}deg` }}
      >
        {kw.text}
      </motion.span>
    ))}
    {icons.map((b, i) => (
      <motion.div
        key={i}
        initial={{ opacity: 0, scale: 0.5 }}
        whileInView={{ opacity: 1, scale: 1 }}
        viewport={{ once: true }}
        transition={{
          delay: 0.4 + i * 0.1,
          duration: 0.5,
          type: "spring",
          stiffness: 200,
        }}
        whileHover={{ scale: 1.15 }}
        // className={`absolute ${b.size} rounded-full flex items-center justify-center text-lg ${b.border}`}
        className={`absolute ${b.size} rounded-full flex items-center justify-center text-xl ${b.border}`}
        style={{ left: b.x, top: b.y, rotate: `${b.rotate}deg` }}
      >
        {b.emoji}
      </motion.div>
    ))}
  </>
);

const FloatingKeywords = () => (
  <>
    {/* Mobile */}
    <div className="relative w-full min-h-[360px] md:hidden">
      <KeywordLayer keywords={KEYWORDS_MOBILE} icons={ICON_BUBBLES_MOBILE} />
    </div>
    {/* Desktop */}
    <div className="relative w-full min-h-[480px] hidden md:block">
      <KeywordLayer keywords={KEYWORDS_DESKTOP} icons={ICON_BUBBLES_DESKTOP} />
    </div>
  </>
);

// --- Hero Slides ---
const HERO_SLIDES = [
  {
    image: "/images/heroImages/heroImage1.jpg",
    title: "COSCI Hub แพลตฟอร์มหางานพิเศษ",
    subtitle: "สำหรับนิสิต อาจารย์ และศิษย์เก่าชาวนวัต",
    highlight: "ชาวนวัต",
    description:
      "แพลตฟอร์มหางานพิเศษ สำหรับนิสิตวิทยาลัยนวัตกรรมสื่อสารสังคม เพื่อเป็นช่องทางในการหารายได้เสริมระหว่างศึกษา รวมถึงแสดงผลงานและทักษะความสามารถเพื่อใช้ในการหางานในอนาคต",
    secondaryButton: null,
  },
  {
    image: "/images/heroImages/heroImage2.jpg",
    title: "ค้นหางานพิเศษที่ตรงใจ",
    subtitle: "เติมเต็มทักษะ สร้างรายได้เสริม",
    highlight: "ตรงใจ",
    description:
      "สำรวจโอกาสงานพิเศษหลากหลายหมวดหมู่ ที่รอให้คุณมาโชว์ศักยภาพและเก็บประสบการณ์ก่อนก้าวสู่โลกการทำงานจริง",
    secondaryButton: null,
  },
  {
    image: "/images/heroImages/heroImage3.jpg",
    title: "โครงการพิเศษจากคณาจารย์",
    subtitle: "แหล่งรวมโปรเจกต์งานวิจัยและพัฒนา",
    highlight: "คณาจารย์",
    description:
      "โอกาสในการร่วมงานกับคณาจารย์ในโครงการที่น่าสนใจ เพื่อเพิ่มพูนความรู้เฉพาะทาง และสร้างพอร์ตโฟลิโอที่แข็งแกร่ง",
    secondaryButton: null,
  },
];

// ปุ่ม Hero ตาม Role
const getHeroPrimaryButton = (role: string | undefined) => {
  if (role === "alumni" || role === "teacher") {
    return {
      text: "เริ่มต้นลงประกาศงาน",
      link: "/manage-projects/create-jobs",
    };
  }
  // Default สำหรับ student หรือไม่ได้ login
  return { text: "เริ่มต้นค้นหางานพิเศษ", link: "/find-job" };
};

const HeroCarousel = ({ images, setCurrentSlide }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const totalImages = images.length;
  const slideDuration = 5000;

  useEffect(() => {
    setCurrentSlide(currentIndex);
  }, [currentIndex, setCurrentSlide]);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prevIndex) => (prevIndex + 1) % totalImages);
    }, slideDuration);
    return () => clearInterval(interval);
  }, [totalImages, slideDuration]);

  return (
    <div className="absolute inset-0 w-full h-full z-0">
      <AnimatePresence initial={false}>
        <motion.img
          key={currentIndex}
          src={images[currentIndex].image}
          alt="Hero background"
          initial={{ opacity: 0, scale: 1.1 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1.5, ease: "easeInOut" }}
          className="absolute inset-0 w-full h-full object-cover pointer-events-none"
          style={{ objectPosition: "center" }}
        />
      </AnimatePresence>

      {/* Overlay darkening for text readability */}
      <div className="absolute inset-0 bg-black/20 z-10 pointer-events-none" />

      {/* Indicator Dots */}
      <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 flex space-x-3 z-20 pointer-events-auto">
        {images.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrentIndex(index)}
            className={`w-3 h-3 rounded-full transition-all duration-300 ${index === currentIndex ? "bg-[#F4FE57] scale-125" : "bg-white/50 hover:bg-white"}`}
            aria-label={`Go to slide ${index + 1}`}
          />
        ))}
      </div>
    </div>
  );
};
// ---------------------------------------------

// --- Category Card ---
const CategoryCard = ({ title, icon, bgColor, path }) => (
  <motion.div variants={fadeInUp}>
    <Link
      href={path || "/find-job"}
      className="group flex flex-col items-center p-2 transition-all duration-300 w-full min-w-[100px] md:min-w-[120px]"
    >
      <div
        className={`
          ${bgColor} 
          rounded-full p-4 mb-3 flex items-center justify-center 
          size-14 md:size-16 
          transform transition-all duration-300 
          group-hover:scale-110
        `}
      >
        {icon}
      </div>
      <h4
        className="text-[10px] md:text-[11px] font-bold text-gray-700 text-center 
                   group-hover:text-[#0C5BEA] transition-colors 
                   leading-tight break-words px-1 h-auto"
      >
        {title}
      </h4>
    </Link>
  </motion.div>
);

const ABOUT_FEATURES = [
  {
    title: "เข้าถึงงานพิเศษได้ง่าย",
    description: "เลือกงานพิเศษที่ตรงกับสาขาวิชาและทักษะของคุณได้",
    icon: (
      <svg viewBox="0 0 24 24" className="h-16 w-16 text-white fill-current">
        <path d="M20,6h-3V4c0-1.1-0.9-2-2-2H9C7.9,2,7,2.9,7,4v2H4C2.9,6,2,6.9,2,8v11c0,1.1,0.9,2,2,2h16c1.1,0,2-0.9,2-2V8 C22,6.9,21.1,6,20,6z M12,15c-1.1,0-2-0.9-2-2s0.9-2,2-2s2,0.9,2,2S13.1,15,12,15z M9,4h6v2H9V4z" />
      </svg>
    ),
  },
  {
    title: "ติดตามความคืบหน้า",
    description: "ตรวจสอบสถานะการทำงานแบบเรียลไทม์",
    icon: (
      <svg viewBox="0 0 24 24" className="h-20 w-20 text-white fill-current">
        <path d="M19,3h-4.18C14.4,1.84,13.3,1,12,1S9.6,1.84,9.18,3H5C3.9,3,3,3.9,3,5v14c0,1.1,0.9,2,2,2h14c1.1,0,2-0.9,2-2V5 C21,3.9,20.1,3,19,3z M12,3c0.55,0,1,0.45,1,1s-0.45,1-1,1s-1-0.45-1-1S11.45,3,12,3z M17,17H7v-2h10V17z M17,13H7v-2h10V13z M15,9H7V7 h8V9z" />
      </svg>
    ),
  },
  {
    title: "ระบบรีวิวการทำงาน",
    description: "สร้างโปรไฟล์ให้น่าเชื่อถือด้วยคะแนนรีวิวจากผู้ใช้งานจริง",
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="currentColor"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="lucide lucide-star-icon lucide-star text-white"
      >
        <path d="M11.525 2.295a.53.53 0 0 1 .95 0l2.31 4.679a2.123 2.123 0 0 0 1.595 1.16l5.166.756a.53.53 0 0 1 .294.904l-3.736 3.638a2.123 2.123 0 0 0-.611 1.878l.882 5.14a.53.53 0 0 1-.771.56l-4.618-2.428a2.122 2.122 0 0 0-1.973 0L6.396 21.01a.53.53 0 0 1-.77-.56l.881-5.139a2.122 2.122 0 0 0-.611-1.879L2.16 9.795a.53.53 0 0 1 .294-.906l5.165-.755a2.122 2.122 0 0 0 1.597-1.16z" />
      </svg>
    ),
  },
  {
    title: "สะสมประสบการณ์จริง",
    description: "พัฒนาทักษะและต่อยอดสู่การทำงานจริงในอนาคต",
    icon: (
      <svg
        viewBox="0 0 24 24"
        className="h-20 w-20 text-white fill-current"
        stroke="currentColor"
        strokeWidth="1"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M12 3L1 9l11 6l9-4.91V17h2V9L12 3zM5 13.18v4L12 21l7-3.82v-4L12 17l-7-3.82z" />
      </svg>
    ),
  },
];

// ---------------------------------------------

export function MobileFeatureSlider({ features }: { features: Feature[] }) {
  const [current, setCurrent] = useState(0);
  const touchStartX = useRef(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const goTo = useCallback(
    (index: number) => {
      setCurrent((index + features.length) % features.length);
    },
    [features.length],
  );

  // Auto-play
  useEffect(() => {
    timerRef.current = setInterval(() => goTo(current + 1), 3500);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [current, goTo]);

  const stopPlay = () => {
    if (timerRef.current) clearInterval(timerRef.current);
  };

  return (
    <div className="relative w-full overflow-hidden">
      {/* Slide */}
      <AnimatePresence mode="wait">
        <motion.div
          key={current}
          initial={{ opacity: 0, x: 60 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -60 }}
          transition={{ duration: 0.35, ease: [0.4, 0, 0.2, 1] }}
          className="bg-gradient-to-b from-[#0C5BEA] to-[#3B76DE]/90 rounded-[2.5rem] p-8 flex flex-col items-center text-center gap-5 min-h-[320px]"
          onTouchStart={(e) => {
            touchStartX.current = e.touches[0].clientX;
            stopPlay();
          }}
          onTouchEnd={(e) => {
            const dx = e.changedTouches[0].clientX - touchStartX.current;
            if (Math.abs(dx) > 40) goTo(dx < 0 ? current + 1 : current - 1);
          }}
        >
          {/* Counter pill
          <span className="text-xs font-bold text-white/60 tracking-widest uppercase">
            {String(current + 1).padStart(2, "0")} /{" "}
            {String(features.length).padStart(2, "0")}
          </span> */}

          {/* Icon */}
          <div className="flex-1 flex items-center justify-center w-full py-2">
            <div className="[&>svg]:w-24 [&>svg]:h-24 text-white/90 filter drop-shadow-lg">
              {features[current].icon}
            </div>
          </div>

          {/* Text */}
          <h3 className="text-xl font-black text-white leading-snug">
            {features[current].title}
          </h3>
          <p className="text-[15px] text-white/80 leading-relaxed max-w-[85%]">
            {features[current].description}
          </p>
        </motion.div>
      </AnimatePresence>

      {/* Dots */}
      <div className="flex justify-center gap-2 mt-5">
        {features.map((_, i) => (
          <button
            key={i}
            onClick={() => {
              stopPlay();
              goTo(i);
            }}
            aria-label={`Go to slide ${i + 1}`}
            className={`rounded-full transition-all duration-300 ${
              i === current
                ? "w-6 h-2.5 bg-[#0C5BEA]"
                : "w-2.5 h-2.5 bg-gray-300"
            }`}
          />
        ))}
      </div>
    </div>
  );
}

// --- 4. Main Component ---
export default function Home() {
  const { data: session, status } = useSession();
  const isLoggedIn = status === "authenticated";
  const userRole = session?.user?.role;

  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const currentSlideData = HERO_SLIDES[currentSlideIndex];
  const heroPrimaryButton = getHeroPrimaryButton(userRole);

  const [activeIndex, setActiveIndex] = useState(0);
  const carouselRef = useRef<HTMLDivElement>(null);
  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const scrollPosition = e.currentTarget.scrollLeft;
    const cardWidth = e.currentTarget.offsetWidth;
    const index = Math.round(scrollPosition / cardWidth);
    setActiveIndex(index);
  };
  const scrollToIndex = (i: number) => {
    if (!carouselRef.current) return;
    const cardWidth = carouselRef.current.offsetWidth;
    carouselRef.current.scrollTo({ left: cardWidth * i, behavior: "smooth" });
    setActiveIndex(i);
  };
  const [recommendedJobs, setRecommendedJobs] = useState([]);
  const [loadingJobs, setLoadingJobs] = useState(true);
  const [savedJobIds, setSavedJobIds] = useState<string[]>([]);

  useEffect(() => {
    axios
      .get("/api/jobs", { params: { limit: 3, sort: "latest" } })
      .then((res) => setRecommendedJobs(res.data.jobs))
      .catch(console.error)
      .finally(() => setLoadingJobs(false));
  }, []);

  useEffect(() => {
    if (!isLoggedIn) return;
    axios
      .get("/api/bookmarks/ids")
      .then((res) => setSavedJobIds(res.data.ids || []))
      .catch(console.error);
  }, [isLoggedIn]);

  const handleToggleBookmark = async (jobId: string) => {
    if (!isLoggedIn) {
      window.location.href = "/auth?state=login";
      return;
    }
    try {
      const res = await axios.post("/api/bookmarks", { jobId });
      setSavedJobIds((prev) =>
        res.data.isBookmarked
          ? [...prev, jobId]
          : prev.filter((id) => id !== jobId),
      );
    } catch {
      alert("ไม่สามารถดำเนินการได้");
    }
  };

  return (
    <>
      <motion.div initial="hidden" animate="visible" className="bg-[#FFFFFF]">
        <div>
          {/* --- Hero section --- */}
          <section className="relative w-full h-[550px] md:h-[650px] overflow-hidden">
            <HeroCarousel
              images={HERO_SLIDES}
              setCurrentSlide={setCurrentSlideIndex}
            />
            <div className="absolute inset-0 z-30 pointer-events-none">
              <div className="max-w-7xl mx-auto h-full flex items-end px-6 md:px-16 lg:px-24 pb-12 md:pb-20">
                <div className="relative flex flex-col items-start text-start text-white max-w-2xl w-full">
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={currentSlideIndex}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                      className="pointer-events-none"
                    >
                      <h1 className="leading-tight tracking-tight drop-shadow-[0_2px_8px_rgba(0,0,0,0.5)]">
                        <span className="text-lg md:text-xl lg:text-2xl font-black inline-block">
                          {currentSlideData.title?.replace(
                            currentSlideData.highlight || "",
                            "",
                          )}
                        </span>
                        {currentSlideData.highlight && (
                          <span className="text-[#F4FE57] text-lg md:text-xl lg:text-2xl font-black relative inline-block ml-2">
                            {currentSlideData.highlight}
                            <motion.span
                              initial={{ width: 0 }}
                              animate={{ width: "100%" }}
                              transition={{ delay: 0.5, duration: 0.8 }}
                              className="absolute -bottom-1 left-0 h-1 bg-[#F4FE57] rounded-full"
                            />
                          </span>
                        )}
                        <br className="hidden md:block" />
                        <span className="text-base md:text-lg lg:text-xl font-bold opacity-90 block mt-1 tracking-normal">
                          {currentSlideData.subtitle}
                        </span>
                      </h1>
                      <p className="mt-4 text-sm md:text-base text-white/90 leading-relaxed max-w-xl font-medium drop-shadow-md">
                        {currentSlideData.description}
                      </p>
                    </motion.div>
                  </AnimatePresence>

                  <div className="flex gap-4 mt-8 pointer-events-auto">
                    <Link
                      href={heroPrimaryButton.link}
                      className="pointer-events-auto"
                    >
                      <motion.button
                        whileTap={{ scale: 0.97 }}
                        className="relative bg-[#0C5BEA] text-white text-sm md:text-base font-bold py-3 px-8 rounded-2xl overflow-hidden flex items-center gap-2 group transition-all duration-300 hover:shadow-[0_0_24px_rgba(12,91,234,0.45)]"
                      >
                        <span className="absolute inset-0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-500 bg-gradient-to-r from-transparent via-white/20 to-transparent pointer-events-none" />
                        {heroPrimaryButton.text}
                        <ArrowRight className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1" />
                      </motion.button>
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </section>
        </div>

        <section className="bg-blue-50 w-full flex flex-col gap-8 py-5 px-5 justify-center text-center rounded-b-3xl shadow-lg">
          {/* Mobile Major Section */}
          <div className="md:hidden overflow-x-auto flex gap-4 px-2 py-2 scrollbar-hide scroll-smooth snap-x snap-mandatory">
            {MAJOR.map((category) => (
              <Link
                key={category.id}
                href={`/find-job?major=${category.id}`}
                className="flex flex-col items-center gap-2.5 flex-shrink-0 snap-start group"
              >
                <div className="relative">
                  <div className="w-[40px] h-[40px] rounded-full bg-[#0C5BEA] flex items-center justify-center transition-all duration-300 group-active:scale-95 group-active:bg-blue-700 shadow-lg shadow-blue-200 relative overflow-hidden">
                    <div className="text-white transform transition-transform duration-300 group-hover:rotate-6 relative z-10">
                      {React.cloneElement(category.icon, {
                        className: "h-5 w-5",
                      })}
                    </div>
                    <div className="absolute inset-0 bg-black/0 group-active:bg-black/10 transition-colors duration-200" />
                  </div>
                </div>
                <span className="text-[10px] font-bold text-gray-500 text-center leading-tight w-[72px] opacity-90 line-clamp-2 min-h-[24px]">
                  {category.title}
                </span>
              </Link>
            ))}
          </div>

          {/* Desktop Major Section (เดิม) */}
          <div className="hidden md:grid grid-cols-5 lg:grid-cols-6 xl:grid-cols-11 gap-4 lg:gap-6 justify-center">
            {MAJOR.map((category) => (
              <CategoryCard
                key={category.id}
                {...category}
                path={`/find-job?major=${category.id}`}
              />
            ))}
          </div>
        </section>

        {/* --- Job Recommendation Section--- */}
        <section className="w-full flex flex-col gap-3 mt-5 mb-10 justify-center text-center py-10 px-6 md:px-12">
          <motion.div
            variants={fadeInUp}
            className="flex items-center justify-between mb-2 px-4 md:px-0"
          >
            <h2 className="text-2xl md:text-3xl font-extrabold text-gray-900 tracking-tight">
              งานแนะนำ<span className="text-[#0C5BEA]">สำหรับนิสิต</span>
            </h2>
          </motion.div>

          {/* --- Desktop: Grid / Mobile: Carousel --- */}
          <div
            ref={carouselRef}
            onScroll={handleScroll}
            className="flex md:grid md:grid-cols-2 xl:grid-cols-3 gap-6 mt-2 px-4 sm:px-0 
               overflow-x-auto md:overflow-x-visible snap-x snap-mandatory scrollbar-hide"
          >
            {loadingJobs ? (
              // Skeleton Loading...
              [1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="min-w-[85vw] md:min-w-full h-64 bg-gray-100 animate-pulse rounded-[2rem] shrink-0"
                />
              ))
            ) : recommendedJobs.length > 0 ? (
              recommendedJobs.map((job: any) => (
                <div
                  key={job._id}
                  className="min-w-[85vw] md:min-w-full snap-center shrink-0 pb-4"
                >
                  <JobCard
                    fromPageName="หน้าแรก"
                    isLoggedIn={isLoggedIn}
                    isStudent={userRole === "student"}
                    isBookmarked={savedJobIds.includes(job._id)}
                    onToggleBookmark={() => handleToggleBookmark(job._id)}
                    data={{
                      id: job._id,
                      icon: getCategoryIcon(job.category),
                      title: job.title,
                      type: job.category,
                      postedBy: job.owner,
                      details: job.shortDescription,
                      minCompensation: job.budgetMin.toLocaleString(),
                      maxCompensation: job.budgetMax
                        ? job.budgetMax.toLocaleString()
                        : null,
                      currency: "บาท",
                      timeAgo: calculateTimeAgo(job.postedDate),
                      isVisible: true,
                    }}
                  />
                </div>
              ))
            ) : (
              <p className="col-span-full text-gray-500">
                ยังไม่มีงานแนะนำในขณะนี้
              </p>
            )}
          </div>

          {/* --- Mobile Pagination Dots --- */}
          <div className="flex md:hidden justify-center gap-2 mt-2">
            {recommendedJobs.map((_, i) => (
              <button
                key={i}
                onClick={() => scrollToIndex(i)}
                className={`h-1.5 transition-all duration-300 rounded-full 
        ${activeIndex === i ? "w-6 bg-[#0C5BEA]" : "w-1.5 bg-gray-300"}`}
              />
            ))}
          </div>

          <Link href="/find-job" className="mt-8">
            <button className="bg-primary-blue-500 text-white font-medium text-base py-3 px-8 rounded-full shadow-md hover:bg-primary-blue-600 transition-colors hover:shadow-lg">
              ดูงานทั้งหมด <Briefcase className="w-5 h-5 ml-2 inline" />
            </button>
          </Link>
        </section>

        {/* --- About Section --- */}
        <motion.section
          variants={fadeInUp}
          viewport={{ once: true, amount: 0.3 }}
          initial="hidden"
          whileInView="visible"
          className="w-full flex flex-col gap-1 my-20 justify-center text-center px-6 md:px-12 max-w-7xl mx-auto"
        >
          {/* Header */}
          <div className="flex flex-col items-center justify-center mb-6">
            <motion.div
              variants={fadeInUp}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: false, amount: 0.5 }}
              className="flex items-center justify-center gap-4 mb-4"
            >
              <img
                src="/logo/cosci-hub-logo.png"
                alt="COSCI Hub Logo"
                className="h-12 md:h-14 w-auto"
              />
              <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900 tracking-tight">
                คืออะไร?
              </h2>
            </motion.div>
            <motion.p
              variants={fadeInUp}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: false, amount: 0.3 }}
              transition={{ delay: 0.1 }}
              className="text-base md:text-lg font-medium text-gray-500 mt-2 max-w-xl text-center"
            >
              แพลตฟอร์มเรียนรู้การทำงานผ่านประสบการณ์จริง
            </motion.p>
            <motion.div
              variants={fadeInUp}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: false, amount: 0.3 }}
              transition={{ delay: 0.2 }}
              className="mt-6 bg-[#F4FE57] text-gray-800 font-bold text-sm px-6 py-2.5 rounded-full shadow-sm"
            >
              รวมทุกขั้นตอนของการทำงานอยู่ที่เดียว
            </motion.div>
          </div>

          {/* ─── MOBILE: Hero Slides ─── */}
          <div className="block md:hidden mt-5">
            <MobileFeatureSlider features={ABOUT_FEATURES} />
          </div>

          {/* ─── DESKTOP: Staggered Grid (เหมือนเดิม) ─── */}
          <div className="relative mt-5 overflow-visible hidden md:block">
            {/* decorative circles */}
            <div className="absolute -top-10 -left-10 w-36 h-36 bg-[#F4FE57] rounded-full opacity-70 z-0 pointer-events-none" />
            <div className="absolute top-[70%] left-[20%] w-20 h-20 bg-transparent border-3 border-[#F4FE57] rounded-full z-0 pointer-events-none" />
            <div className="absolute top-[50%] left-[50%] -translate-x-1/2 -translate-y-1/2 w-20 h-20 bg-[#F4FE57] rounded-full opacity-60 z-0 pointer-events-none" />
            <div className="absolute top-[10%] right-[20%] w-20 h-20 bg-transparent border-3 border-[#F4FE57] rounded-full z-0 pointer-events-none" />
            <div className="absolute -bottom-10 -right-6 w-28 h-28 bg-[#F4FE57] rounded-full opacity-60 z-0 pointer-events-none" />

            <motion.div
              variants={staggerContainer}
              viewport={{ once: true }}
              initial="hidden"
              whileInView="visible"
              className="relative z-10 grid grid-cols-4 gap-4 items-start"
            >
              {ABOUT_FEATURES.map((feature, index) => (
                <motion.div
                  key={index}
                  variants={fadeInUp}
                  className="w-full"
                  style={{
                    marginTop: index % 2 === 1 ? "clamp(1rem, 4vw, 4rem)" : "0",
                  }}
                >
                  <div className="bg-gradient-to-b from-[#0C5BEA] to-[#3B76DE]/90 rounded-[3rem] p-8 flex flex-col items-center text-center gap-6 h-full min-h-[320px] hover:scale-105 transition-transform duration-300">
                    <h4 className="text-[16px] font-black text-white leading-snug">
                      {feature.title}
                    </h4>
                    <div className="flex-1 flex items-center justify-center w-full py-2">
                      <div className="[&>svg]:w-30 [&>svg]:h-30 text-white/90 filter drop-shadow-lg">
                        {feature.icon}
                      </div>
                    </div>
                    <p className="text-[15px] text-white/80 leading-relaxed max-w-[90%]">
                      {feature.description}
                    </p>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </motion.section>

        {/* --- New Connect Section (Floating Keywords) --- */}
        <motion.section
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.3 }}
          variants={fadeInUp}
          className="w-full py-8 px-6 md:px-16 max-w-7xl mx-auto"
        >
          {/* Mobile: stack vertical, Desktop: overlap layout */}
          <div className="flex flex-col md:relative md:min-h-[480px]">
            {/* Text — mobile: full width, desktop: absolute left */}
            <div className="relative z-10 max-w-2xl">
              <h2 className="text-lg md:text-2xl font-black text-gray-900 leading-tight mb-4">
                เชื่อมการเรียนรู้สู่{" "}
                <span className="text-[#0C5BEA] bg-[#F4FE57] px-2 rounded">
                  การทำงานจริง
                </span>{" "}
                อย่างมีคุณภาพ
              </h2>
              <p className="text-xs text-gray-500 leading-relaxed">
                แพลตฟอร์มที่เชื่อมต่อการเรียนรู้กับการทำงานจริง
                เปิดโอกาสให้เกิดการพัฒนาทักษะ และสร้างประสบการณ์ร่วมกัน
              </p>
            </div>

            {/* <div className="hidden md:block relative min-h-[380px] md:min-h-[480px] md:-mt-24">
              <FloatingKeywords />
            </div> */}
            <div className="relative min-h-[400px] md:min-h-[480px] md:-mt-24">
              <FloatingKeywords />
            </div>
          </div>
        </motion.section>
      </motion.div>
    </>
  );
}
