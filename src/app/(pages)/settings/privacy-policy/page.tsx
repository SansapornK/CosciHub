// src/app/(pages)/settings/privacy-policy/page.tsx
"use client";

import React from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function PrivacyPolicyPage() {
  return (
    <div className="flex flex-col gap-6 pb-10 max-w-4xl mx-auto w-full px-4 md:px-6">
      {/* Header */}
      <div className="flex items-center gap-3 mt-6 md:mt-8">
        <Link
          href="/settings"
          className="p-2 hover:bg-gray-100 active:bg-gray-100 rounded-full transition-colors shrink-0"
        >
          <ArrowLeft className="w-5 h-5 md:w-6 md:h-6 text-gray-600" />
        </Link>
        <h2 className="text-lg md:text-2xl font-bold text-gray-800">
          ข้อตกลงและเงื่อนไขการใช้งาน
        </h2>
      </div>

      {/* Content */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 md:p-8">
        <div className="prose prose-sm max-w-none text-gray-600 leading-relaxed space-y-6">
          <p>
            COSCI Hub (แพลตฟอร์ม)
            จัดทำขึ้นเพื่อเป็นพื้นที่กลางในการอำนวยความสะดวกและเชื่อมโยงนิสิต
            (ฟรีแลนซ์) กับคณาจารย์ ศิษย์เก่า
            และบุคลากรของวิทยาลัยนวัตกรรมสื่อสารสังคม (ผู้ว่าจ้าง)
            <br />
            <br />
            กรุณาอ่านข้อตกลงและเงื่อนไขเหล่านี้อย่างละเอียด
            การที่คุณลงทะเบียนและใช้งานแพลตฟอร์มนี้
            ถือว่าคุณได้ยอมรับและตกลงที่จะผูกพันตามข้อตกลงดังต่อไปนี้:
          </p>

          <div>
            <h3 className="text-lg font-semibold text-gray-800 mb-2">
              1. บทบาทของแพลตฟอร์ม (Platform Role)
            </h3>
            <p>
              COSCI Hub ทำหน้าที่เป็น <strong>ตัวกลาง (Intermediary)</strong>{" "}
              เท่านั้น เพื่อให้ผู้ว่าจ้างสามารถประกาศค้นหาฟรีแลนซ์
              และฟรีแลนซ์สามารถนำเสนอทักษะและผลงานของตน
              แพลตฟอร์มไม่มีส่วนในการตัดสินใจว่าจ้าง, กำหนดเงื่อนไข,
              หรือดำเนินการใดๆ
              ที่เกี่ยวข้องกับการจ้างงานระหว่างผู้ว่าจ้างและฟรีแลนซ์
            </p>
          </div>

          <div>
            <h3 className="text-lg font-semibold text-gray-800 mb-2">
              2. การว่าจ้างและค่าตอบแทน (Employment and Compensation)
            </h3>
            <p>
              การตกลงเรื่องขอบเขตของงาน, กำหนดเวลาส่งมอบงาน, อัตราค่าตอบแทน,
              วิธีการชำระเงิน, และเงื่อนไขการจ้างงานอื่นๆ ทั้งหมด ถือเป็น{" "}
              <strong>ข้อตกลงโดยตรง</strong> ระหว่างผู้ว่าจ้างและฟรีแลนซ์
              แพลตฟอร์ม <strong>ไม่มีส่วนเกี่ยวข้อง</strong>{" "}
              ในกระบวนการทางการเงิน การเจรจาต่อรอง หรือการชำระค่าตอบแทนใดๆ
              ทั้งสิ้น และจะไม่รับผิดชอบต่อข้อพิพาทใดๆ ที่เกี่ยวข้องกับค่าตอบแทน
            </p>
          </div>

          <div>
            <h3 className="text-lg font-semibold text-gray-800 mb-2">
              3. การจำกัดความรับผิดชอบ (Disclaimer of Liability)
            </h3>
            <p>
              ผู้ใช้งาน (ทั้งผู้ว่าจ้างและฟรีแลนซ์)
              ตกลงที่จะใช้งานแพลตฟอร์มนี้บนความเสี่ยงของตนเอง COSCI Hub{" "}
              <strong>ไม่รับประกัน</strong> ความถูกต้องของข้อมูลโปรไฟล์,
              คุณภาพของงาน, ความสามารถของฟรีแลนซ์,
              หรือความน่าเชื่อถือของผู้ว่าจ้าง แพลตฟอร์ม{" "}
              <strong>ไม่รับผิดชอบ</strong> ต่อความเสียหาย, ความสูญเสีย,
              ข้อพิพาท, หรือความเสี่ยงใดๆ ที่อาจเกิดขึ้นจากการตกลงว่าจ้าง,
              การดำเนินงาน,
              หรือผลลัพธ์ของงานที่เกิดขึ้นระหว่างผู้ว่าจ้างและฟรีแลนซ์
            </p>
          </div>

          <div>
            <h3 className="text-lg font-semibold text-gray-800 mb-2">
              4. หน้าที่ของผู้ใช้งาน (User Responsibilities)
            </h3>
            <p>
              ผู้ใช้งานมีหน้าที่ตรวจสอบและยืนยันข้อมูล (Due Diligence)
              ของอีกฝ่ายหนึ่งด้วยตนเองก่อนทำการตกลงว่าจ้าง
              และผู้ใช้งานตกลงที่จะให้ข้อมูลที่เป็นจริงและถูกต้องในโปรไฟล์และการประกาศงานของตน
            </p>
          </div>

          <div>
            <h3 className="text-lg font-semibold text-gray-800 mb-2">
              5. การยอมรับข้อตกลง (Acceptance)
            </h3>
            <p>
              หากท่านลงทะเบียนในฐานะศิษย์เก่า ท่านยินยอมให้ระบบส่งข้อมูลของท่าน
              (ชื่อ, สาขา, รูปโปรไฟล์)
              ไปยังอาจารย์ที่ปรึกษาที่ท่านระบุเพื่อทำการยืนยันตัวตน
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
