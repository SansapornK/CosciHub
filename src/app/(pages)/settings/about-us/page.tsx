// src/app/(pages)/settings/about-us/page.tsx
"use client";

import React from "react";
import Link from "next/link";
import { ArrowLeft, Info, Code, Heart } from "lucide-react";

export default function AboutUsPage() {
  // สร้าง Array ข้อมูลทีมเพื่อให้โค้ดสะอาดและจัดการง่าย
  const developers = [
    {
      name: "พรรณทิภา นุ้ยสาย (แตงกวา)",
      role: "Full-stack Developer",
      image: "/images/devProfile/dev-profile1.png",
      email: "panthipha.ns@gmail.com",
    },
    {
      name: "ศันสพร เกตุเจริญ (นาโน)",
      role: "Full-stack Developer",
      image: "/images/devProfile/dev-profile2.png",
      email: "sansaporn.k@gmail.com",
    },
    {
      name: "ชลดา พรไกรเลิศ (แบม)",
      role: "UX/UI Designer",
      image: "/images/devProfile/dev-profile3.png",
      email: "bamcldz@gmail.com",
    },
  ];

  const advisors = [
    {
      name: "อาจารย์สิทธิชัย วรโชติกำจร",
      role: "อาจารย์ที่ปรึกษา",
      image: "/images/advisor-profile/advisor-profile1.png",
      email: "sittichaiw@g.swu.ac.th",
    },
    {
      name: "อาจารย์พัชราภรณ์ วรโชติกำจร",
      role: "อาจารย์ที่ปรึกษา",
      image: "/images/advisor-profile/advisor-profile2.png",
      email: "wopatchar@hotmail.com",
    },
  ];

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-7 pt-6">
      {/* Header */}
      <div className="flex items-center mb-5">
        <Link
          href="/settings"
          className="p-2 hover:bg-gray-100 rounded-full transition-colors"
        >
          <ArrowLeft className="w-6 h-6 text-gray-600" />
        </Link>
        <h2 className="text-lg md:text-2xl font-bold text-gray-800">
          เกี่ยวกับเรา
        </h2>
      </div>

      {/* Content Area */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 md:p-10">
        <div className="flex flex-col gap-10">
          {/* Section 1: Introduction */}
          <div className="text-center max-w-3xl mx-auto">
            <div className="flex justify-center mb-4">
              <img
                src="/logo/cosci-hub-logo.png"
                alt="COSCI Hub"
                className="h-12 w-auto"
              />
            </div>
            <h3 className="text-sm md:text-xl font-bold text-[#0C5BEA] mb-3">
              แพลตฟอร์มหางานพิเศษสำหรับนิสิต COSCI
            </h3>
            <p className="text-xs md:text-lg text-gray-600 leading-relaxed">
              พื้นที่เชื่อมต่อระหว่างการเรียนรู้กับการทำงานจริงอย่างมีคุณภาพ
              เพื่อให้นิสิตวิทยาลัยนวัตกรรมสื่อสารสังคมได้มีโอกาสพัฒนาทักษะ
              สร้างประสบการณ์ และหารายได้เสริมในสายงานที่ตรงกับทักษะ
            </p>
          </div>

          <hr className="border-gray-100" />

          {/* Section 2: Mission & Vision */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="flex gap-4">
              <div className="bg-blue-50 p-3 rounded-2xl h-fit">
                <Info className="w-6 h-6 text-[#0C5BEA]" />
              </div>
              <div>
                <h4 className="text-sm md:text-lg font-bold text-gray-800 mb-1">
                  วิสัยทัศน์
                </h4>
                <p className="text-xs md:text-sm text-gray-500 leading-relaxed">
                  เป็นแพลตฟอร์มกลางในการรวมรวบงานพิเศษภายในวิทยาลัยฯ
                  ที่เชื่อมโยงนิสิต อาจารย์ และศิษย์เก่า
                  ให้สามารถแลกเปลี่ยนโอกาสทางการทำงานได้อย่างปลอดภัย
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="bg-yellow-50 p-3 rounded-2xl h-fit">
                <Heart className="w-6 h-6 text-yellow-600" />
              </div>
              <div>
                <h4 className="text-sm md:text-lg font-bold text-gray-800 mb-1">
                  เป้าหมาย
                </h4>
                <p className="text-xs md:text-sm text-gray-500 leading-relaxed">
                  ส่งเสริมให้นิสิตได้สะสมประสบการณ์จริง
                  สร้างพอร์ตโฟลิโอที่โดดเด่น และเติบโตพร้อมกับเครือข่ายชาวนวัตฯ
                </p>
              </div>
            </div>
          </div>

          <hr className="border-gray-100" />

          {/* Section 3: Developer Team */}
          <div>
            <div className="flex items-center gap-3 mb-6">
              <div className="bg-gray-50 p-2 rounded-xl">
                <Code className="w-5 h-5 text-gray-600" />
              </div>
              <h3 className="text-lg font-bold text-gray-800">
                ผู้พัฒนาแพลตฟอร์ม
              </h3>
            </div>

            {/* จัดเรียงการ์ดด้วย Grid */}
            <div className="grid grid-cols-1 gap-4">
              {developers.map((dev, index) => (
                <div
                  key={index}
                  className="flex flex-col sm:flex-row items-center gap-6 p-6 bg-gray-50/50 rounded-3xl border border-gray-100 transition-all hover:bg-white hover:shadow-md"
                >
                  {/* Container รูปภาพที่แก้ปัญหาการแสดงผล */}
                  <div className="w-24 h-24 rounded-full bg-[#0C5BEA] overflow-hidden shrink-0 border-2 border-white shadow-sm">
                    <img
                      src={dev.image}
                      alt={dev.name}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.currentTarget.src =
                          "https://ui-avatars.com/api/?name=P&background=0C5BEA&color=fff";
                      }}
                    />
                  </div>

                  <div className="text-center sm:text-left">
                    <h4 className="text-base sm:text-lg font-bold text-gray-800">
                      {dev.name}
                    </h4>
                    <p className="text-[#0C5BEA] text-xs sm:text-sm font-medium mb-1">
                      {dev.role}
                    </p>
                    <p className="text-gray-400 text-[10px] sm:text-xs mb-2">
                      Computer Innovation for Communication (Commu 15)
                    </p>
                    <p className="text-gray-500 text-xs sm:text-sm">
                      วิทยาลัยนวัตกรรมสื่อสารสังคม มหาวิทยาลัยศรีนครินทรวิโรฒ
                    </p>
                    <div className="flex items-center justify-center sm:justify-start gap-2 text-gray-400 group/email">
                      <div className="bg-gray-100 p-1.5 rounded-lg group-hover/email:bg-blue-50 transition-colors">
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
                          className="group-hover/email:text-[#0C5BEA]"
                        >
                          <rect width="20" height="16" x="2" y="4" rx="2" />
                          <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
                        </svg>
                      </div>
                      <a
                        href={`mailto:${dev.email}`}
                        className="text-[10px] sm:text-xs hover:text-[#0C5BEA] hover:underline transition-colors"
                      >
                        {dev.email}
                      </a>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Section 4: Advisors */}
          <div>
            <div className="flex items-center gap-3 mb-6">
              <div className="bg-gray-50 p-2 rounded-xl">
                <Code className="w-5 h-5 text-gray-600" />
              </div>
              <h3 className="text-lg font-bold text-gray-800">
                อาจารย์ที่ปรึกษา
              </h3>
            </div>

            {/* จัดเรียงการ์ดด้วย Grid */}
            <div className="grid grid-cols-1 gap-4">
              {advisors.map((advisor, index) => (
                <div
                  key={index}
                  className="flex flex-col sm:flex-row items-center gap-6 p-6 bg-gray-50/50 rounded-3xl border border-gray-100 transition-all hover:bg-white hover:shadow-md"
                >
                  {/* Container รูปภาพที่แก้ปัญหาการแสดงผล */}
                  <div className="w-24 h-24 rounded-full bg-white overflow-hidden shrink-0 border-2 border-white shadow-sm">
                    <img
                      src={advisor.image}
                      alt={advisor.name}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.currentTarget.src =
                          "https://ui-avatars.com/api/?name=P&background=0C5BEA&color=fff";
                      }}
                    />
                  </div>

                  <div className="text-center sm:text-left">
                    <h4 className="text-base sm:text-lg font-bold text-gray-800">
                      {advisor.name}
                    </h4>
                    <p className="text-[#0C5BEA] text-xs sm:text-sm font-medium mb-1">
                      {advisor.role}
                    </p>
                    <p className="text-gray-500 text-xs sm:text-sm">
                      วิชาเอกนวัตกรรมคอมพิวเตอร์เพื่อการสื่อสาร
                    </p>
                    <div className="flex items-center justify-center sm:justify-start gap-2 text-gray-400 group/email">
                      <div className="bg-gray-100 p-1.5 rounded-lg group-hover/email:bg-blue-50 transition-colors">
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
                          className="group-hover/email:text-[#0C5BEA]"
                        >
                          <rect width="20" height="16" x="2" y="4" rx="2" />
                          <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
                        </svg>
                      </div>
                      <a
                        href={`mailto:${advisor.email}`}
                        className="text-[10px] sm:text-xs hover:text-[#0C5BEA] hover:underline transition-colors"
                      >
                        {advisor.email}
                      </a>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Footer Text */}
      <div className="flex justify-center mt-8">
        <p className="text-xs text-gray-400 flex items-center gap-2">
          Made with <Heart className="w-3 h-3 text-red-400 fill-current" /> by
          COSCI Student
        </p>
      </div>
    </div>
  );
}
