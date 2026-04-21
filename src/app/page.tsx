"use client";

import Link from "next/link";
import React, { useState, useEffect, JSX } from "react";
import axios from "axios";
import { useSession } from "next-auth/react";
import JobCard from "./components/cards/JobCard";
import {
  calculateTimeAgo,
  getCategoryIcon,
} from "@/app/components/utils/jobHelpers";
import { Briefcase, ArrowRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

// --- Animation Variants ---
const fadeInUp = {
  hidden: {
    opacity: 0,
    y: 60,
  },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 1.0,
      ease: [0.22, 1, 0.36, 1],
    },
  },
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.3,
    },
  },
};

const varFadeInUp = {
  hidden: { opacity: 0, y: 40, filter: "blur(4px)" },
  visible: {
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: { duration: 0.8, ease: [0.22, 1, 0.36, 1] },
  },
};

const varImageReveal = {
  hidden: { opacity: 0, scale: 1.1 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { duration: 1.2, ease: [0.22, 1, 0.36, 1] },
  },
};

const varStaggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.2 },
  },
};

const KEYWORDS = [
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

const ICON_BUBBLES = [
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

const FloatingKeywords = () => (
  <div className="relative w-full min-h-[420px]">
    {KEYWORDS.map((kw, i) => (
      <motion.span
        key={i}
        initial={{ opacity: 0, scale: 0.7, rotate: kw.rotate - 5 }}
        whileInView={{ opacity: 1, scale: 1, rotate: kw.rotate }}
        viewport={{ once: true }}
        transition={{
          delay: i * 0.07,
          duration: 0.5,
          ease: [0.22, 1, 0.36, 1],
        }}
        whileHover={{ scale: 1.12, rotate: 0 }}
        className={`absolute px-10 py-2 rounded-full cursor-default select-none ${kw.size} ${kw.style}`}
        style={{ left: kw.x, top: kw.y, rotate: `${kw.rotate}deg` }}
      >
        {kw.text}
      </motion.span>
    ))}

    {ICON_BUBBLES.map((b, i) => (
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
        whileHover={{ scale: 1.15, rotate: 0 }}
        className={`absolute ${b.size} rounded-full flex items-center justify-center text-xl ${b.border}`}
        style={{ left: b.x, top: b.y, rotate: `${b.rotate}deg` }}
      >
        {b.emoji}
      </motion.div>
    ))}
  </div>
);

// --- Hero Slides ---
const HERO_SLIDES = [
  {
    image: "/images/heroImage1.jpg",
    title: "COSCI Hub แพลตฟอร์มหางานพิเศษ",
    subtitle: "สำหรับนิสิต อาจารย์ และศิษย์เก่าชาวนวัต",
    highlight: "ชาวนวัต",
    description:
      "แพลตฟอร์มหางานพิเศษ สำหรับนิสิตวิทยาลัยนวัตกรรมสื่อสารสังคม เพื่อเป็นช่องทางในการหารายได้เสริมระหว่างศึกษา รวมถึงแสดงผลงานและทักษะความสามารถเพื่อใช้ในการหางานในอนาคต",
    primaryButton: { text: "เริ่มต้นหางานพิเศษ", link: "/find-job" },
    secondaryButton: null,
  },
  {
    image: "/images/heroImage2.jpg",
    title: "ค้นหางานพิเศษที่ตรงใจ",
    subtitle: "เติมเต็มทักษะ สร้างรายได้เสริม",
    highlight: "ตรงใจ",
    description:
      "สำรวจโอกาสงานพิเศษหลากหลายหมวดหมู่ ที่รอให้คุณมาโชว์ศักยภาพและเก็บประสบการณ์ก่อนก้าวสู่โลกการทำงานจริง",
    primaryButton: { text: "เริ่มต้นหางานพิเศษ", link: "/find-job" },
    secondaryButton: null,
  },
  {
    image: "/images/heroImage3.jpg",
    title: "โครงการพิเศษจากคณาจารย์",
    subtitle: "แหล่งรวมโปรเจกต์งานวิจัยและพัฒนา",
    highlight: "คณาจารย์",
    description:
      "โอกาสในการร่วมงานกับคณาจารย์ในโครงการที่น่าสนใจ เพื่อเพิ่มพูนความรู้เฉพาะทาง และสร้างพอร์ตโฟลิโอที่แข็งแกร่ง",
    primaryButton: { text: "เริ่มต้นหางานพิเศษ", link: "/find-job" },
    secondaryButton: null,
  },
];

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
          className="absolute inset-0 w-full h-full object-cover"
          style={{ objectPosition: "center" }}
        />
      </AnimatePresence>

      {/* Overlay darkening for text readability */}
      <div className="absolute inset-0 bg-black/20 z-10" />

      {/* Indicator Dots */}
      <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 flex space-x-3 z-30">
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
        group-hover:scale-110 group-hover:shadow-xl group-hover:shadow-blue-200
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

const MAJOR = [
  {
    id: "การออกแบบสื่อปฏิสัมพันธ์และมัลติมีเดีย",
    title: "การออกแบบสื่อปฏิสัมพันธ์และมัลติมีเดีย",
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="h-6 w-6 text-white group-hover:text-[#0C5BEA] transition-colors duration-300"
      >
        <rect width="18" height="18" x="3" y="3" rx="2" ry="2" />
        <circle cx="9" cy="9" r="2" />
        <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" />
      </svg>
    ),
    bgColor:
      "bg-[#0C5BEA] hover:bg-white border border-[#0C5BEA] transition-all duration-300 shadow-md",
  },
  {
    id: "การจัดการธุรกิจไซเบอร์",
    title: "การจัดการธุรกิจไซเบอร์",
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="h-6 w-6 text-white group-hover:text-[#0C5BEA] transition-colors duration-300"
      >
        <path d="M12 16v5" />
        <path d="M16 14v7" />
        <path d="M20 10v11" />
        <path d="m22 3-8.646 8.646a.5.5 0 0 1-.708 0L9.354 8.354a.5.5 0 0 0-.707 0L2 15" />
        <path d="M4 18v3" />
        <path d="M8 14v7" />
      </svg>
    ),
    bgColor:
      "bg-[#0C5BEA] hover:bg-white border border-[#0C5BEA] transition-all duration-300 shadow-md",
  },
  {
    id: "นวัตกรรมคอมพิวเตอร์เพื่อการสื่อสาร",
    title: "นวัตกรรมคอมพิวเตอร์เพื่อการสื่อสาร",
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="h-6 w-6 text-white group-hover:text-[#0C5BEA] transition-colors duration-300"
      >
        <path d="M18 5a2 2 0 0 1 2 2v8.526a2 2 0 0 0 .212.897l1.068 2.127a1 1 0 0 1-.9 1.45H3.62a1 1 0 0 1-.9-1.45l1.068-2.127A2 2 0 0 0 4 15.526V7a2 2 0 0 1 2-2z" />
        <path d="M20.054 15.987H3.946" />
      </svg>
    ),
    bgColor:
      "bg-[#0C5BEA] hover:bg-white border border-[#0C5BEA] transition-all duration-300 shadow-md",
  },
  {
    id: "การผลิตภาพยนตร์และสื่อดิจิทัล",
    title: "การผลิตภาพยนตร์และสื่อดิจิทัล",
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="h-6 w-6 text-white group-hover:text-[#0C5BEA] transition-colors duration-300"
      >
        <path d="m16 13 5.223 3.482a.5.5 0 0 0 .777-.416V7.87a.5.5 0 0 0-.752-.432L16 10.5" />
        <rect x="2" y="6" width="14" height="12" rx="2" />
      </svg>
    ),
    bgColor:
      "bg-[#0C5BEA] hover:bg-white border border-[#0C5BEA] transition-all duration-300 shadow-md",
  },
  {
    id: "การแสดงและกำกับการแสดงภาพยนตร์",
    title: "การแสดงและกำกับการแสดงภาพยนตร์",
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="h-6 w-6 text-white group-hover:text-[#0C5BEA] transition-colors duration-300"
      >
        <path d="M20.2 6 3 11l-.9-2.4c-.3-1.1.3-2.2 1.3-2.5l13.5-4c1.1-.3 2.2.3 2.5 1.3Z" />
        <path d="m6.2 5.3 3.1 3.9" />
        <path d="m12.4 3.4 3.1 4" />
        <path d="M3 11h18v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2Z" />
      </svg>
    ),
    bgColor:
      "bg-[#0C5BEA] hover:bg-white border border-[#0C5BEA] transition-all duration-300 shadow-md",
  },
  {
    id: "การออกแบบเพื่องานภาพยนตร์และสื่อดิจิทัล",
    title: "การออกแบบเพื่องานภาพยนตร์และสื่อดิจิทัล",
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="h-6 w-6 text-white group-hover:text-[#0C5BEA] transition-colors duration-300"
      >
        <path d="m11 10 3 3" />
        <path d="M6.5 21A3.5 3.5 0 1 0 3 17.5a2.62 2.62 0 0 1-.708 1.792A1 1 0 0 0 3 21z" />
        <path d="M9.969 17.031 21.378 5.624a1 1 0 0 0-3.002-3.002L6.967 14.031" />
      </svg>
    ),
    bgColor:
      "bg-[#0C5BEA] hover:bg-white border border-[#0C5BEA] transition-all duration-300 shadow-md",
  },
  {
    id: "การจัดการภาพยนตร์และสื่อดิจิทัล",
    title: "การจัดการภาพยนตร์และสื่อดิจิทัล",
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="h-6 w-6 text-white group-hover:text-[#0C5BEA] transition-colors duration-300"
      >
        <path d="M12.659 22H18a2 2 0 0 0 2-2V8a2.4 2.4 0 0 0-.706-1.706l-3.588-3.588A2.4 2.4 0 0 0 14 2H6a2 2 0 0 0-2 2v9.34" />
        <path d="M14 2v5a1 1 0 0 0 1 1h5" />
        <path d="M10.378 12.622a1 1 0 0 1 3 3.003L8.36 20.637a2 2 0 0 1-.854.506l-2.867.837a.5.5 0 0 1-.62-.62l.836-2.869a2 2 0 0 1 .506-.853z" />
      </svg>
    ),
    bgColor:
      "bg-[#0C5BEA] hover:bg-white border border-[#0C5BEA] transition-all duration-300 shadow-md",
  },
  {
    id: "การสื่อสารเพื่อการท่องเที่ยว",
    title: "การสื่อสารเพื่อการท่องเที่ยว",
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="h-6 w-6 text-white group-hover:text-[#0C5BEA] transition-colors duration-300"
      >
        <path d="M21.54 15H17a2 2 0 0 0-2 2v4.54" />
        <path d="M7 3.34V5a3 3 0 0 0 3 3a2 2 0 0 1 2 2c0 1.1.9 2 2 2a2 2 0 0 0 2-2c0-1.1.9-2 2-2h3.17" />
        <path d="M11 21.95V18a2 2 0 0 0-2-2a2 2 0 0 1-2-2v-1a2 2 0 0 0-2-2H2.05" />
        <circle cx="12" cy="12" r="10" />
      </svg>
    ),
    bgColor:
      "bg-[#0C5BEA] hover:bg-white border border-[#0C5BEA] transition-all duration-300 shadow-md",
  },
  {
    id: "การสื่อสารเพื่อสุขภาพ",
    title: "การสื่อสารเพื่อสุขภาพ",
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="h-6 w-6 text-white group-hover:text-[#0C5BEA] transition-colors duration-300"
      >
        <path d="M2 9.5a5.5 5.5 0 0 1 9.591-3.676.56.56 0 0 0 .818 0A5.49 5.49 0 0 1 22 9.5c0 2.29-1.5 4-3 5.5l-5.492 5.313a2 2 0 0 1-3 .019L5 15c-1.5-1.5-3-3.2-3-5.5" />
        <path d="M3.22 13H9.5l.5-1 2 4.5 2-7 1.5 3.5h5.27" />
      </svg>
    ),
    bgColor:
      "bg-[#0C5BEA] hover:bg-white border border-[#0C5BEA] transition-all duration-300 shadow-md",
  },
  {
    id: "การสื่อสารเพื่อการจัดการนวัตกรรม",
    title: "การสื่อสารเพื่อการจัดการนวัตกรรม",
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="h-6 w-6 text-white group-hover:text-[#0C5BEA] transition-colors duration-300"
      >
        <path d="M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1 .2 2.2 1.5 3.5.7.7 1.3 1.5 1.5 2.5" />
        <path d="M9 18h6" />
        <path d="M10 22h4" />
      </svg>
    ),
    bgColor:
      "bg-[#0C5BEA] hover:bg-white border border-[#0C5BEA] transition-all duration-300 shadow-md",
  },
  {
    id: "การสื่อสารเพื่อเศรษฐศาสตร์",
    title: "การสื่อสารเพื่อเศรษฐศาสตร์",
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="h-6 w-6 text-white group-hover:text-[#0C5BEA] transition-colors duration-300"
      >
        <path d="M3 3v16a2 2 0 0 0 2 2h16" />
        <path d="m19 9-5 5-4-4-3 3" />
      </svg>
    ),
    bgColor:
      "bg-[#0C5BEA] hover:bg-white border border-[#0C5BEA] transition-all duration-300 shadow-md",
  },
];
// ---------------------------------------------

// --- FEATURES ---

const ABOUT_FEATURES = [
  {
    title: "เข้าถึงงานพิเศษได้ง่าย",
    description: "เลือกงานพิเศษที่ตรงกับสาขาวิชาและความถนัดได้",
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
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
        className="lucide lucide-star-icon lucide-star text-white"
      >
        <path d="M11.525 2.295a.53.53 0 0 1 .95 0l2.31 4.679a2.123 2.123 0 0 0 1.595 1.16l5.166.756a.53.53 0 0 1 .294.904l-3.736 3.638a2.123 2.123 0 0 0-.611 1.878l.882 5.14a.53.53 0 0 1-.771.56l-4.618-2.428a2.122 2.122 0 0 0-1.973 0L6.396 21.01a.53.53 0 0 1-.77-.56l.881-5.139a2.122 2.122 0 0 0-.611-1.879L2.16 9.795a.53.53 0 0 1 .294-.906l5.165-.755a2.122 2.122 0 0 0 1.597-1.16z" />
      </svg>
    ),
  },
  {
    title: "สะสมประสบการณ์จริง",
    description: "พัฒนทักษะและต่อยอดสู่การทำงานจริงในอนาคต",
    icon: (
      <svg
        viewBox="0 0 24 24"
        className="h-20 w-20 text-white fill-current"
        stroke="currentColor"
        stroke-width="1"
        stroke-linecap="round"
        stroke-linejoin="round"
      >
        <path d="M12 3L1 9l11 6l9-4.91V17h2V9L12 3zM5 13.18v4L12 21l7-3.82v-4L12 17l-7-3.82z" />
      </svg>
    ),
  },
];

// ---------------------------------------------

// --- 4. Main Component ---
export default function Home() {
  const { data: session, status } = useSession();
  const isLoggedIn = status === "authenticated";

  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const currentSlideData = HERO_SLIDES[currentSlideIndex];

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

            <div className="absolute inset-0 flex justify-start items-end z-20 px-6 md:px-16 lg:px-24 pb-12 md:pb-20">
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentSlideIndex}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                  className="relative flex flex-col items-start text-start text-white max-w-2xl"
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
                          className="absolute -bottom-1 left-0 h-1 bg-[#F4FE57] rounded-full shadow-[0_0_10px_rgba(244,254,87,0.6)]"
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

                  <div className="flex gap-4 mt-8">
                    <Link href={currentSlideData.primaryButton.link}>
                      <motion.button
                        whileHover={{
                          scale: 1.05,
                          backgroundColor: "#FFFFFF",
                          color: "#0C5BEA",
                        }}
                        whileTap={{ scale: 0.95 }}
                        className="bg-[#0C5BEA] text-white text-sm md:text-base font-bold py-3 px-8 rounded-2xl shadow-lg border-2 border-transparent hover:border-[#0C5BEA] transition-all flex items-center gap-2 group"
                      >
                        {currentSlideData.primaryButton.text}
                        <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                      </motion.button>
                    </Link>
                  </div>
                </motion.div>
              </AnimatePresence>
            </div>
          </section>
        </div>

        <section className="bg-blue-50 w-full flex flex-col gap-8 py-5 px-5 justify-center text-center rounded-b-3xl shadow-lg">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-11 gap-4 lg:gap-6 justify-center">
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
        <section className="w-full flex flex-col gap-3 mt-5 mb-10 justify-center text-center py-10 px-12">
          <motion.div
            variants={fadeInUp}
            className="flex items-center justify-between mb-6"
          >
            <h2 className="text-2xl md:text-3xl font-extrabold text-gray-900 tracking-tight">
              งานแนะนำ<span className="text-[#0C5BEA]">สำหรับนิสิต</span>
            </h2>
            <Link
              href="/find-job"
              className="text-sm font-semibold text-[#0C5BEA] hover:text-[#6D91D3] flex items-center gap-1.5 transition-colors group"
            >
              ดูทั้งหมด{" "}
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 mt-4 px-4 sm:px-0">
            {loadingJobs ? (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 mt-4">
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="h-64 bg-gray-100 animate-pulse rounded-xl"
                  />
                ))}
              </div>
            ) : recommendedJobs.length > 0 ? (
              recommendedJobs.map((job: any) => (
                <JobCard
                  key={job._id}
                  isLoggedIn={isLoggedIn}
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
              ))
            ) : (
              <p className="col-span-full text-gray-500">
                ยังไม่มีงานแนะนำในขณะนี้
              </p>
            )}
          </div>

          <Link href="/find-job" className="mt-6">
            <button className="bg-primary-blue-500 text-white font-medium text-base py-3 px-6 rounded-full shadow-md hover:bg-primary-blue-600 transition-colors hover:shadow-lg">
              ดูงานทั้งหมด <Briefcase className="w-5 h-5 ml-2 inline" />
            </button>
          </Link>
        </section>

        {/* --- About Section (New Design) --- */}
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

            {/* Yellow pill */}
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

          {/* Staggered Feature Cards */}
          <div className="relative mt-5 overflow-visible">
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
              className="relative z-10 grid grid-cols-1 gap-5 md:grid-cols-4 md:items-start"
            >
              {ABOUT_FEATURES.map((feature, index) => (
                <motion.div
                  key={index}
                  variants={fadeInUp}
                  className="w-full"
                  style={{
                    marginTop: index % 2 === 1 ? "4rem" : "0",
                  }}
                >
                  <div
                    className="bg-gradient-to-b from-[#0C5BEA] to-[#3B76DE]/90  rounded-[3rem] p-8 flex flex-col items-center text-center gap-6 h-full min-h-[320px] shadow-2xl shadow-blue-200/60 hover:scale-105 transition-transform duration-300" // ปรับ min-h ให้สูงขึ้น, p และ rounded ใหัใหญ่ขึ้น
                  >
                    <h4 className="text-[16px] font-black text-white leading-snug">
                      {" "}
                      {feature.title}
                    </h4>
                    <div className="flex-1 flex items-center justify-center w-full py-2">
                      <div className="[&>svg]:w-30 [&>svg]:h-30 text-white/90 filter drop-shadow-lg">
                        {" "}
                        {feature.icon}
                      </div>
                    </div>
                    <p className="text-[15px] text-white/80 leading-relaxed max-w-[90%]">
                      {" "}
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
          className="w-full py-5 px-6 md:px-16 max-w-7xl mx-auto"
        >
          <div className="relative min-h-[480px]">
            <div className="relative z-10 max-w-2xl">
              <h2 className="text-xl md:text-2xl font-black text-gray-900 leading-tight mb-4">
                เชื่อมการเรียนรู้สู่{" "}
                <span className="text-[#0C5BEA] bg-[#F4FE57] px-2 rounded">
                  การทำงานจริง
                </span>{" "}
                อย่างมีคุณภาพ
              </h2>
              <p className="text-s text-gray-500 leading-relaxed">
                แพลตฟอร์มที่เชื่อมต่อการเรียนรู้กับการทำงานจริง
                เปิดโอกาสให้เกิดการพัฒนาทักษะ และสร้างประสบการณ์ร่วมกัน
              </p>
            </div>

            {/* Floating Keywords */}
            <div className="absolute inset-0 w-full h-full">
              <FloatingKeywords />
            </div>
          </div>
        </motion.section>
      </motion.div>
    </>
  );
}
