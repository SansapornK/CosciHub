'use client'; 

import Head from "next/head";
import Link from "next/link";
import React, { useState, useEffect } from "react"; 

// --- 1. Hero Slides Data ---
const HERO_SLIDES = [
  {
    image: "/images/heroImage1.png",
    title: "COSCI Hub แพลตฟอร์มหางานพิเศษ",
    subtitle: "สำหรับนิสิต อาจารย์ และศิษย์เก่าชาวนวัต",
    description: "แพลตฟอร์มหางานพิเศษ สำหรับนิสิตวิทยาลัยนวัตกรรมสื่อสารสังคม เพื่อเป็นช่องทางในการหารายได้เสริมระหว่างศึกษา รวมถึงแสดงผลงานและทักษะความสามารถเพื่อใช้ในการหางานในอนาคต",
    primaryButton: { text: "เริ่มต้นหางานพิเศษ", link: "/project-board" },
    secondaryButton: null, 
  },
  {
    image: "/images/heroImage2.png",
    title: "ค้นหางานพิเศษที่ตรงใจ",
    subtitle: "เติมเต็มทักษะ สร้างรายได้เสริม",
    description: "สำรวจโอกาสงานพิเศษหลากหลายหมวดหมู่ ที่รอให้คุณมาโชว์ศักยภาพและเก็บประสบการณ์ก่อนก้าวสู่โลกการทำงานจริง",
    primaryButton: { text: "เริ่มต้นหางานพิเศษ", link: "/project-board" },
    secondaryButton: null, 
  },
  {
    image: "/images/heroImage3.png",
    title: "โครงการพิเศษจากคณาจารย์",
    subtitle: "แหล่งรวมโปรเจกต์งานวิจัยและพัฒนา",
    description: "โอกาสในการร่วมงานกับคณาจารย์ในโครงการที่น่าสนใจ เพื่อเพิ่มพูนความรู้เฉพาะทาง และสร้างพอร์ตโฟลิโอที่แข็งแกร่ง",
    primaryButton: { text: "เริ่มต้นหางานพิเศษ", link: "/project-board" },
    secondaryButton: null, 
  },
];
// ---------------------------------------------

// --- 2. Constants Data ---
const FEATURES = [
  {
    id: "search",
    title: "ค้นหา",
    description: "ครอบคลุมทั้งฟรีแลนซ์และผู้ว่าจ้าง มีการกรองหมวดหมู่งานอย่างชัดเจน",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
      </svg>
    ),
    bgColor: "bg-blue-100",
  },
  {
    id: "project-board",
    title: "โปรเจกต์บอร์ด",
    description: "ผู้จ้างสามารถโพสต์ประกาศหางาน โดยกำหนดทักษะและงบประมาณ",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
      </svg>
    ),
    bgColor: "bg-indigo-100",
  },
  {
    id: "chat",
    title: "แชทในแพลตฟอร์ม",
    description: "ผู้ว่าจ้างและฟรีแลนซ์สามารถพูดคุยรายละเอียดงานได้โดยตรงผ่านแชทในตัว",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
      </svg>
    ),
    bgColor: "bg-purple-100",
  },
  {
    id: "dashboard",
    title: "แดชบอร์ด",
    description: "ผู้ว่าจ้างและฟรีแลนซ์สามารถดูสถานะงานรวมถึง คำขอร่วมงานได้ในแดชบอร์ด",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
      </svg>
    ),
    bgColor: "bg-green-100",
  },
];

const CATEGORIES = [
  {
    id: "multi",
    title: "การออกแบบสื่อปฏิสัมพันธ์และมัลติมีเดีย",
    icon: (
      // <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-pink-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      //   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
      // </svg>
      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6 text-pink-600"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/>
      </svg>
    ),
    bgColor: "bg-pink-100",
  },
  {
    id: "cyber",
    title: "การจัดการธุรกิจไซเบอร์",
    icon: (
      // <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      //   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
      // </svg>
      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6 text-blue-600"><path d="M12 16v5"/><path d="M16 14v7"/><path d="M20 10v11"/><path d="m22 3-8.646 8.646a.5.5 0 0 1-.708 0L9.354 8.354a.5.5 0 0 0-.707 0L2 15"/><path d="M4 18v3"/><path d="M8 14v7"/></svg>
    ),
    bgColor: "bg-blue-100",
  },
  {
    id: "commu",
    title: "นวัตกรรมคอมพิวเตอร์เพื่อการสื่อสาร",
    icon: (
      // <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      //   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
      // </svg>
      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6 text-red-600"><path d="M18 5a2 2 0 0 1 2 2v8.526a2 2 0 0 0 .212.897l1.068 2.127a1 1 0 0 1-.9 1.45H3.62a1 1 0 0 1-.9-1.45l1.068-2.127A2 2 0 0 0 4 15.526V7a2 2 0 0 1 2-2z"/><path d="M20.054 15.987H3.946"/></svg>
    ),
    bgColor: "bg-red-100",
  },
  {
    id: "produce",
    title: "การผลิตภาพยนตร์และสื่อดิจิทัล",
    icon: (
      // <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      //   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      // </svg>
      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6 text-yellow-600"><path d="m16 13 5.223 3.482a.5.5 0 0 0 .777-.416V7.87a.5.5 0 0 0-.752-.432L16 10.5"/><rect x="2" y="6" width="14" height="12" rx="2"/></svg>
    ),
    bgColor: "bg-yellow-100",
  },
  {
    id: "acting",
    title: "การแสดงและกำกับการแสดงภาพยนตร์",
    icon: (
      // <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      //   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
      // </svg>
      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6 text-green-600"><path d="M20.2 6 3 11l-.9-2.4c-.3-1.1.3-2.2 1.3-2.5l13.5-4c1.1-.3 2.2.3 2.5 1.3Z"/><path d="m6.2 5.3 3.1 3.9"/><path d="m12.4 3.4 3.1 4"/><path d="M3 11h18v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2Z"/></svg>
    ),
    bgColor: "bg-green-100",
  },
  {
    id: "design",
    title: "การออกแบบเพื่องานภาพยนตร์และสื่อดิจิทัล",
    icon: (
      // <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      //   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      // </svg>
      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6 text-purple-600"><path d="m11 10 3 3"/><path d="M6.5 21A3.5 3.5 0 1 0 3 17.5a2.62 2.62 0 0 1-.708 1.792A1 1 0 0 0 3 21z"/><path d="M9.969 17.031 21.378 5.624a1 1 0 0 0-3.002-3.002L6.967 14.031"/></svg>
    ),
    bgColor: "bg-purple-100",
  },
  {
    id: "management",
    title: "การจัดการภาพยนตร์และสื่อดิจิทัล",
    icon: (
      // <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      //   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
      // </svg>
      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6 text-indigo-600"><path d="M12.659 22H18a2 2 0 0 0 2-2V8a2.4 2.4 0 0 0-.706-1.706l-3.588-3.588A2.4 2.4 0 0 0 14 2H6a2 2 0 0 0-2 2v9.34"/><path d="M14 2v5a1 1 0 0 0 1 1h5"/><path d="M10.378 12.622a1 1 0 0 1 3 3.003L8.36 20.637a2 2 0 0 1-.854.506l-2.867.837a.5.5 0 0 1-.62-.62l.836-2.869a2 2 0 0 1 .506-.853z"/></svg>
    ),
    bgColor: "bg-indigo-100",
  },
  {
    id: "tourist",
    title: "การสื่อสารเพื่อการท่องเที่ยว",
    icon: (
      // <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      //   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
      // </svg>
      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6 text-yellow-600"><path d="M21.54 15H17a2 2 0 0 0-2 2v4.54"/><path d="M7 3.34V5a3 3 0 0 0 3 3a2 2 0 0 1 2 2c0 1.1.9 2 2 2a2 2 0 0 0 2-2c0-1.1.9-2 2-2h3.17"/><path d="M11 21.95V18a2 2 0 0 0-2-2a2 2 0 0 1-2-2v-1a2 2 0 0 0-2-2H2.05"/><circle cx="12" cy="12" r="10"/></svg>
    ),
    bgColor: "bg-yellow-100",
  },
  {
    id: "health",
    title: "การสื่อสารเพื่อสุขภาพ",
    icon: (
      // <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-teal-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      //   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m4 0h6m-6 0h-2M9 13V7a2 2 0 012-2h6a2 2 0 012 2v6a2 2 0 01-2 2h-6a2 2 0 01-2-2z" />
      // </svg>
      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6 text-teal-600"><path d="M2 9.5a5.5 5.5 0 0 1 9.591-3.676.56.56 0 0 0 .818 0A5.49 5.49 0 0 1 22 9.5c0 2.29-1.5 4-3 5.5l-5.492 5.313a2 2 0 0 1-3 .019L5 15c-1.5-1.5-3-3.2-3-5.5"/><path d="M3.22 13H9.5l.5-1 2 4.5 2-7 1.5 3.5h5.27"/></svg>
    ),
    bgColor: "bg-teal-100",
  },
  {
    id: "inno",
    title: "การสื่อสารเพื่อการจัดการนวัตกรรม",
    icon: (
      // <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      //   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M20.245 8.914L18.75 7.419M3.755 8.914L5.25 7.419M12 15a7 7 0 100-14 7 7 0 000 14z" />
      // </svg>
      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6 text-red-600"><path d="M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1 .2 2.2 1.5 3.5.7.7 1.3 1.5 1.5 2.5"/><path d="M9 18h6"/><path d="M10 22h4"/></svg>
    ),
    bgColor: "bg-red-100",
  },
  {
    id: "econ",
    title: "การสื่อสารเพื่อเศรษฐศาสตร์",
    icon: (
      // <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      //   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      // </svg>
      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6 text-blue-600"><path d="M3 3v16a2 2 0 0 0 2 2h16"/><path d="m19 9-5 5-4-4-3 3"/></svg>
    ),
    bgColor: "bg-blue-100",
  },
];

// --- Recommended Jobs Data ---
const RECOMMENDED_JOBS = [
  {
    id: 1,
    icon: ( // เพิ่ม prop สำหรับ icon
      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-primary-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
      </svg>
    ),
    title: 'ออกแบบ Mobile App',
    type: 'งานไอที/เทคโนโลยีสื่อสาร',
    postedBy: 'อาจารย์ โคซาย',
    details: 'ออกแบบ UI/UX ของฟอร์มใหม่ ภายในแอปพลิเคชันสำหรับเด็กเล็ก เพื่อเป็นสื่อการเรียนการสอน',
    compensation: '1200',
    currency: 'บาท',
    timeAgo: '1 วัน',
    isFavorite: false,
    isVisible: false, 
  },
  {
    id: 2,
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-primary-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
      </svg>
    ),
    title: 'พัฒนาเกม 3D',
    type: 'งานไอที/เทคโนโลยีสื่อสาร',
    postedBy: 'อาจารย์ โคซาย',
    details: 'พัฒนเกม 3D โดยใช้โปรแกรม Unity อยูเกม 3D โดยใช้ให้ได้กับคนคน Unity Unity',
    compensation: '1300',
    currency: 'บาท',
    timeAgo: '5 วัน',
    isFavorite: false,
    isVisible: false,
  },
  {
    id: 3,
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-primary-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
      </svg>
    ),
    title: 'ตัดต่อวิดีโอ',
    type: 'งานตัดต่อ',
    postedBy: 'อาจารย์ สาม',
    details: 'ตัดต่อวิดีโอโฆษณาเพื่อใช้โปรโมทวิทยาลัย นวัตกรรมสื่อสารสังคม ภายใน 3 นาที',
    compensation: '1000',
    currency: 'บาท',
    timeAgo: '1 สัปดาห์',
    isFavorite: false,
    isVisible: false,
  },
];

// --- New Component: Job Card ---
import { Bookmark, DollarSign, User, Tag, Briefcase } from 'lucide-react'; 

const JobCard = ({ data }) => {
  const isFav = data.isFavorite; 
  const favBtnClass = isFav ? 'text-primary-blue-500 fill-current' : 'text-gray-400';
  
  return (
    <div className="bg-white shadow-lg rounded-xl p-6 flex flex-col border border-gray-200 transition-shadow duration-300 relative hover:shadow-xl"> 
      
      {/* Time Ago (Top Right - absolute) */}
      <div className="absolute top-4 right-6 text-xs text-blue-400 text-center">
        โพสต์เมื่อ {data.timeAgo}ที่แล้ว
      </div>

      {/* Header (Icon + Title) */}
      <div className="flex items-center gap-3 mb-3 mt-4"> 
        {data.icon}
        <h3 className="text-l font-semibold text-gray-800">{data.title}</h3>
      </div>
      

      <div className="flex flex-col items-start mb-4">
        <span className="text-xs font-medium text-primary-blue-700 bg-gray-100 px-3 py-1 rounded-full mb-1">
          {data.type} 
        </span>
        
        <p className="text-sm text-blue-400 mt-1">
          โดย {data.postedBy}
        </p>
      </div>
      
      {/* Job Description */}
      <div className="mb-4">
        <p className="text-sm font-medium text-gray-800 mb-1 text-start">คำอธิบายงาน :</p>
        <p className="text-sm text-gray-500 line-clamp-3 text-start">
        {data.details}
        </p>
      </div>
      
      {/* Compensation */}
      <div className="mt-auto mb-4 flex justify-between items-center w-full">
        <p className="text-sm font-medium text-gray-800">ค่าตอบแทน</p>
        <p className="text-xl font-bold text-gray-800">
          {data.compensation} {data.currency}
        </p>
      </div>
      
      {/* Action Buttons */}
      <div className="flex justify-between items-center gap-3">
        <Link href={`/find-freelance/${data.id}`} className="flex-grow">
          <button className="bg-primary-blue-500 text-white text-base py-3 px-4 rounded-lg w-full hover:bg-primary-blue-600 transition-colors">
            ดูรายละเอียดงาน
          </button>
        </Link>
        
        {/* *** Conditional Rendering based on isVisible *** */}
        {data.isVisible && (
          <button 
            className={`p-3 rounded-lg bg-gray-100 ${favBtnClass} hover:bg-gray-200 transition-colors duration-200 cursor-pointer`}
            aria-label={isFav ? "Remove bookmark" : "Add bookmark"}
          >
            <Bookmark className="w-5 h-5 fill-current"/>
          </button>
        )}
      </div>
    </div>
  );
};

// --- New Constant: About Section Features Data ---
const ABOUT_FEATURES = [
  {
    title: 'เข้าถึงงานพิเศษได้ง่าย',
    description: 'เลือกงานพิเศษที่ตรงกับสาขาวิชาและความถนัดได้',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-10 w-10 text-primary-blue-500"><path d="M12 12h.01"/><path d="M16 6V4a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/><path d="M22 13a18.15 18.15 0 0 1-20 0"/><rect width="20" height="14" x="2" y="6" rx="2"/></svg>
    ), 
  },
  {
    title: 'ติดตามความคืบหน้า',
    description: 'ตรวจสอบสถานะการทำงานแบบเรียลไทม์',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-primary-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
      </svg>
    ), 
  },
  {
    title: 'พูดคุยสะดวก',
    description: 'สามารถสื่อสารกับผู้ว่าจ้างผ่านเว็บไซต์ได้โดยตรง',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-primary-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
        <path strokeLinecap="round" strokeLinejoin="round" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
      </svg>
    ), 
  },
  {
    title: 'สะสมประสบการณ์จริง',
    description: 'พัฒนทักษะและต่อยอดสู่การทำงานจริงในอนาคต',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-10 w-10 text-primary-blue-500"><path d="M21.42 10.922a1 1 0 0 0-.019-1.838L12.83 5.18a2 2 0 0 0-1.66 0L2.6 9.08a1 1 0 0 0 0 1.832l8.57 3.908a2 2 0 0 0 1.66 0z"/><path d="M22 10v6"/><path d="M6 12.5V16a6 3 0 0 0 12 0v-3.5"/></svg>
    ),
  },
];

const AboutFeatureCard = ({ title, description, icon }) => (
  <div className="bg-white shadow-md rounded-lg w-full flex flex-col items-center max-w-xs text-center p-4 py-10 px-10 border-[0.1px] border-gray-300 gap-3 hover:bg-gray-50 transition-colors duration-200">
    {/* เพิ่ม p-6 เพื่อขยายวงกลมพื้นหลังให้ใหญ่ขึ้นตามขนาดไอคอน h-12 w-12 */}
    <div className="flex items-center justify-center p-6 bg-primary-blue-100 rounded-full mb-4"> 
        {icon}
    </div>
    
    <h4 className="text-lg font-medium text-gray-800 mb-2">{title}</h4>
    <p className="text-sm text-gray-600">{description}</p>
  </div>
);

const CONNECT_SECTION_DATA = {
  header: "พื้นที่เชื่อมต่อระหว่างการเรียนรู้กับการทำงานจริงอย่างมีคุณภาพ",
  description: "ช่วยให้นิสิตสามารถหางานที่ตรงกับความสามารถ ขณะที่อาจารย์ ศิษย์เก่า และบุคลากรในมหาวิทยาลัยฯ สามารถตรวจสอบผลงานและให้คำแนะนำแก่นิสิต เพื่อเปิดโอกาสให้นิสิตได้ฝึกทักษะจากงานจริง",
  left: {
    text: "พัฒนาทักษะจาก การทำงานจริง กับผู้ว่าจ้างที่น่าเชื่อถือ สร้างประสบการณ์ และรายได้ระหว่างเรียน",
    image: "/images/female.png",
  },
  right: {
    text: "ส่งเสริม การเรียนรู้เชิงปฏิบัติ สร้างโอกาสและเสริมศักยภาพ ให้นิสิตในโลกการทำงานจริง",
    image: "/images/male.png",
  },
};

const HOW_TO_CLIENT = [
  { id: "client-1", title: "ค้นหาฟรีแลนซ์", description: "เลือกหมวดหมู่งานที่สนใจ ค้นหาฟรีแลนซ์ผ่านโปรไฟล์ฟรีแลนซ์ตามทักษะความสามารถและผลงานที่แสดง", image: "/images/howto/howto1.png" },
  { id: "client-2", title: "สร้างโปรเจกต์ในโปรเจกต์บอร์ด", description: "ระบุประเภทงาน งบประมาณประมาณค่าจ้าง ทักษะความสามารถที่ต้องการ รอคำขอจากฟรีแลนซ์", image: "/images/howto/howto2.png" },
  { id: "client-3", title: "ค้นหาฟรีแลนซ์", description: "พูดคุยกับฟรีแลนซ์ผ่านแชท ตรวจสอบสถานะงาน และกดยืนยันงานเสร็จสิ้นหลังได้รับงานที่พอใจ", image: "/images/howto/howto3.png" },
];

const HOW_TO_FREELANCER = [
  { id: "freelancer-1", title: "สร้างโปรไฟล์", description: "กรอกข้อมูล ชื่อ-สกุล ทักษะ ค่าจ้าง เพิ่มพอร์ตโฟลิโอและอัปโหลดผลงานที่เคยทำลงหน้าแก้ไขโปรไฟล์", image: "/images/howto/howto4.png" },
  { id: "freelancer-2", title: "วิธีหางาน", description: "โพสผลงานในหน้าโปรไฟล์เพื่อให้แสดงในหน้าค้นหาฟรีแลนซ์หรือค้นหางานจากโปรเจกต์บอร์ด", image: "/images/howto/howto5.png" },
  { id: "freelancer-3", title: "อัพเดทสถานะงาน", description: "อัพเดทสถานะงานให้ลูกค้าอย่างต่อเนื่องผ่านแดชบอร์ดพูดคุยรายละเอียดงานผ่านแชท และกดยืนยันเมื่องานเสร็จ", image: "/images/howto/howto6.png" },
];

// --- 3. Components ---

const FeatureCard = ({ title, description, icon, bgColor }) => (
  <div className="bg-white shadow-md text-start rounded-lg w-full p-6 flex flex-col border-[0.1px] border-gray-300 gap-3 hover:bg-gray-50 transition-colors duration-200">
    <div className="flex flex-col items-center mb-3">
      <div className={`${bgColor} rounded-full p-3 mb-2`}>
        {icon}
      </div>
      <h4 className="text-m font-medium text-primary-blue-500">{title}</h4>
    </div>
    <p className="text-gray-400 text-sm">{description}</p>
  </div>
);

const HowToCard = ({ title, description, image }) => (
  <div className="bg-white shadow-md text-start place-items-center rounded-lg w-full p-3 flex flex-col lg:flex-row border-[0.1px] border-gray-300 gap-3 hover:bg-gray-50 transition-colors duration-200">
    <img src={image} alt="cosci:connect" className="w-80"/>
    <div>
      <h4 className="text-m font-medium text-primary-blue-500">{title}</h4>
      <p className="text-gray-400 text-sm">{description}</p>
    </div>
  </div>
);

const CategoryCard = ({ title, icon, bgColor, path }) => (
  <Link 
    href={path || '/find-freelance'} 
    className="flex flex-col items-center p-2 transition-all duration-200" 
    // aria-label={`ค้นหางาน ${title}`}
  >
    <div className={`${bgColor} rounded-full p-4 mb-3 flex items-center justify-center size-16 transform transition-transform duration-200 hover:scale-105 shadow-md`}>
      {icon} 
    </div>
    <h4 className="text-xs font-medium text-gray-700 text-center">{title}</h4>
  </Link>
);

const HeroCarousel = ({ images, setCurrentSlide }) => { 
  const [currentIndex, setCurrentIndex] = useState(0);
  const totalImages = images.length;
  const slideDuration = 4000; 

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
    <div className="relative w-full h-full">
      {images.map((slide, index) => (
        <img
          key={index}
          src={slide.image} 
          alt={`Hero Slide ${index + 1}`}
          className={`
            absolute top-0 left-0 w-full h-full object-cover transition-opacity duration-1000
            ${index === currentIndex ? 'opacity-100' : 'opacity-0'}
          `}
        />
      ))}
      
      {/* Indicator Dots */}
      <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2 z-30">
        {images.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrentIndex(index)}
            className={`
              w-3 h-3 rounded-full transition-colors duration-300
              ${index === currentIndex ? 'bg-primary-blue-500' : 'bg-gray-400 hover:bg-gray-500'}
            `}
            aria-label={`Go to slide ${index + 1}`}
          />
        ))}
      </div>
    </div>
  );
};
// ------------------------------------------

// --- 4. Main Component ---
export default function Home() {
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const currentSlideData = HERO_SLIDES[currentSlideIndex];
  
  const primaryBtnClass = 'bg-primary-blue-500 text-white font-medium py-3 px-6 rounded-full shadow-lg transition-all hover:bg-primary-blue-600';
  const secondaryBtnClass = 'bg-transparent border border-gray-900 text-gray-900 font-medium py-3 px-6 rounded-full shadow-lg transition-all hover:bg-black/10';

  return (
    <>
      <div> 
        {/* Hero section: W-FULL, No Horizontal Padding */}
        <section 
            className="relative w-full h-[500px] md:h-[600px] border-b border-gray-200"
        >
          {/* 1. Hero Carousel */}
          <HeroCarousel images={HERO_SLIDES} setCurrentSlide={setCurrentSlideIndex} />

          {/* 2. Hero Content */}
          <div 
            className="absolute inset-0 flex justify-start items-end z-20" 
          > 
            
            <div 
                className={`relative flex flex-col items-start text-start text-gray-900 max-w-4xl pl-6 pb-6 md:pl-10 md:pb-10`}
            >
              <h1 className="text-l md:text-xl font-medium drop-shadow-md">
                <span className="text-primary-blue-500">
                  {currentSlideData.title}
                </span> 
                <br className="hidden md:block"/>
                {currentSlideData.subtitle}
              </h1>
              <p className="mt-4 text-s drop-shadow-md">
                {currentSlideData.description}
              </p>
              <div className="flex gap-4 mt-8">
                <Link href={currentSlideData.primaryButton.link}>
                  <button className={primaryBtnClass}>
                    {currentSlideData.primaryButton.text}
                  </button>
                </Link>
                
                {currentSlideData.secondaryButton && (
                    <Link href={currentSlideData.secondaryButton.link}>
                      <button className={secondaryBtnClass}>
                        {currentSlideData.secondaryButton.text}
                      </button>
                    </Link>
                )}
              </div>
            </div>
          </div>
        </section>
      </div>

      <section className="bg-blue-50 w-full flex flex-col gap-8 py-5 px-5 justify-center text-center rounded-b-3xl shadow-lg">
         <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-11 gap-4 lg:gap-6 justify-center">
            {CATEGORIES.map((category) => (
              <CategoryCard 
                key={category.id} 
                {...category} 
                path={`/find-freelance?category=${category.id}`} 
              />
            ))}
          </div>
      </section>

      {/* --- Job Recommendation Section--- */}
      <section className="w-full flex flex-col gap-3 mt-5 mb-10 justify-center text-center py-10">
        <h2 className="text-xl font-bold text-primary-gray-500 text-start">
          งานแนะนำสำหรับนิสิต
        </h2>
        {/* <p className="text-s text-gray-400 text-start">
          งานที่ถูกคัดสรรมาแล้วตามความสนใจและวิชาเอกของคุณ
        </p> */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 mt-4 px-4 sm:px-0">
          {RECOMMENDED_JOBS.map((job) => (
            <JobCard key={job.id} data={job} />
          ))}
        </div>
          
        {/* ปุ่มดูงานทั้งหมด */}
        <Link href="/find-freelance" className="mt-6">
          <button className="bg-primary-blue-500 text-white font-medium text-base py-3 px-6 rounded-full shadow-md hover:bg-primary-blue-600 transition-colors hover:shadow-lg">
            ดูงานทั้งหมด <Briefcase className="w-5 h-5 ml-2 inline"/>
          </button>
        </Link>
      </section>

      {/* --- About Section --- */}
        <section className="w-full flex flex-col gap-1 mt-5 mb-15 justify-center text-center">
          
          {/* Header Area */}
          <div className="flex flex-col items-start px-4 md:px-0 justify-end"> 
            
            <h2 className="text-xl md:text-2xl font-bold text-gray-800 flex items-center justify-start gap-3">
                <img 
                    src="/logo/cosci-hub-logo.png" 
                    alt="COSCI Hub Logo" 
                    className="h-10 md:h-12 w-auto" 
                />
                คืออะไร?
            </h2>
            
            <p className="text-lg md:text-xl font-normal text-gray-700 mt-2">
                แพลตฟอร์มเรียนรู้การทำงานผ่านประสบการณ์จริง
            </p>

            <div className="w-full text-center"> 
                <p className="text-base text-gray-600 mt-8 font-bold">
                    รวมทุกขั้นตอนของการทำงานอยู่ในที่เดียว
                </p>
            </div>

          </div>
          
          {/* Features Grid */}
          {/* <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {ABOUT_FEATURES.map((feature, index) => (
              <AboutFeatureCard 
                key={index}
                {...feature} 
              />
            ))}
          </div> */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mt-5">
            {ABOUT_FEATURES.map((feature, index) => (
              <AboutFeatureCard 
                key={index}
                {...feature} 
              />
            ))}
          </div>
        </section>

        {/* --- Connect Section --- */}
        <section className="w-full py-12 md:py-16"> 
          <div className="lg:px-10 text-start mb-8 px-6"> 
            <h2 className="text-xl md:text-2xl font-bold text-gray-800 mb-2">
              {CONNECT_SECTION_DATA.header}
            </h2>
            <p className="text-sm text-gray-600 max-w-3xl leading-relaxed"> 
              {CONNECT_SECTION_DATA.description}
            </p>
          </div>

          {/* Overlapping Bubbles Container */}
        <div className="relative flex flex-col md:flex-row justify-center items-center mx-auto md:px-0">

          {/* Left Bubble */}
          <div
            className="relative flex-1 flex items-center justify-start text-white p-6 md:p-8 z-20 w-full md:w-1/2 min-h-[300px] md:min-h-[350px]"
            style={{
              background: "linear-gradient(90deg, #1E3A8A 0%, #1D4ED8 70%, #2563EB 100%)",
              borderTopRightRadius: "9999px",
              borderBottomRightRadius: "9999px",
              marginRight: "-20px",
              boxShadow: "0 10px 20px rgba(30, 64, 175, 0.4)",
            }}
          >
            <div className="absolute inset-0 rounded-r-full bg-black/10"></div>

            {/* Content Area */}
            <div className="relative z-30 flex flex-col items-end justify-center w-full h-full pr-10">
              
              <img
                src="/images/female.png"
                alt="Female avatar"
                className="w-40 md:w-80 h-auto drop-shadow-2xl absolute bottom-0 left-0 z-10" 
                style={{ transform: 'translateX(-20%) translateY(35%)' }} 
              />

              <p className="text-xl md:text-xl text-right leading-snug tracking-wide max-w-[80%] z-10" 
                  style={{ 
                  textShadow: '2px 2px 4px rgba(0, 0, 0, 0.4)'
              }}>
                พัฒนาทักษะจาก <span className="font-bold">การทำงานจริง</span><br />
                กับ <span className="font-bold">ผู้ว่าจ้างที่น่าเชื่อถือ</span><br />
                สร้าง <span className="font-bold">ประสบการณ์</span> และ<br />
                <span className="font-bold">รายได้ระหว่างเรียน</span>
              </p>
            </div>
          </div>

          {/* Right Bubble */}
          <div
            className="relative flex-1 flex items-center justify-end text-gray-800 p-6 md:p-8 z-10 w-full md:w-1/2 mt-4 md:mt-0 min-h-[300px] md:min-h-[350px]"
            style={{
              background: "linear-gradient(90deg, #2563EB 20%, #BEE3FF 100%, #FFFFFF 100%)",
              borderTopLeftRadius: "9999px",
              borderBottomLeftRadius: "9999px",
              marginLeft: "-20px", 
              boxShadow: "0 10px 20px rgba(96,165,250,0.25)",
            }}
          >
            {/* Content Area */}
            <div className="relative z-30 flex flex-col items-start justify-center w-full h-full pl-10"> 
              
              <img
                src="/images/male.png"
                alt="Male avatar"
                className="w-40 md:w-80 h-auto drop-shadow-2xl absolute bottom-0 right-0 z-10" 
                style={{ transform: 'translateX(10%) translateY(40%)' }}
              />
              
              <p className="text-xl md:text-xl text-left leading-snug tracking-wide max-w-[80%] text-white z-10" 
                  style={{ 
                  textShadow: '2px 2px 4px rgba(0, 0, 0, 0.4)'
              }}> 
                ส่งเสริม <span className="font-bold">การเรียนรู้เชิงปฏิบัติ</span><br />
                สร้างโอกาสและเสริมศักยภาพ<br />
                ให้นิสิตในโลกการทำงานจริง
              </p>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}