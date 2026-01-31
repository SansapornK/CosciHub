import React, { useState } from 'react';
import { RegisterData } from '../RegisterForm';


interface StepEmailProps {
  data: RegisterData;
  validation: {
    email: { 
      error: string; 
      exists: boolean; 
      isChecking: boolean;
      touched: boolean; 
    };
    password: { error: string };
    confirmPassword: { error: string };
  };
  updateData: (data: Partial<RegisterData>) => void;
  onEmailTouched: () => void;
}

function StepEmail({ data, validation, updateData, onEmailTouched }: StepEmailProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);

  // ฟังก์ชันเมื่อกด Checkbox -> เปิด Popup
  const handleCheckboxClick = (e: React.MouseEvent) => {
    if (data.acceptedTerms) {
      // 1. ถ้าติ๊กถูกอยู่แล้ว -> ให้ติ๊กออกได้ (Update เป็น false)
      updateData({ acceptedTerms: false });
    } else {
      // 2. ถ้ายังไม่ติ๊ก -> ให้เปิด Popup และห้ามติ๊กเอง (Prevent Default)
      e.preventDefault();
      setShowTermsModal(true);
    }
  };

  // ฟังก์ชันเมื่อกด "ยอมรับ" ใน Popup
  const handleAcceptTerms = () => {
    updateData({ acceptedTerms: true });
    setShowTermsModal(false);
  };

  return (
    <>
      <div className="flex flex-col gap-5 w-full items-center">
        <div className="w-full">
          <h2 className="text-lg font-medium text-gray-800">ตั้งค่าบัญชีของคุณ</h2>
          <p className="text-gray-500 text-sm">กรอกอีเมลและกำหนดรหัสผ่านสำหรับเข้าใช้งาน</p>
        </div>

        {/* ส่วน Input Email  */}
        <div className="w-full">
            <label htmlFor="email" className="block text-gray-700 text-sm mb-1 font-medium">
              อีเมล
              {data.isEmailVerified && (
                <span className="text-green-500 text-xs ml-2 flex-inline items-center">
                  (ยืนยันแล้ว <span className="inline-block">✓</span>)
                </span>
              )}
            </label>
            <div className="relative">
              <input
                type="email"
                id="email"
                value={data.email}
                onChange={(e) => updateData({ email: e.target.value })}
                onBlur={onEmailTouched}
                disabled={data.isEmailVerified}
                className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 transition-all
                  ${validation.email.error 
                    ? 'border-red-400 focus:ring-red-200 bg-red-50' 
                    : data.isEmailVerified
                      ? 'border-green-400 bg-green-50 text-gray-600'
                      : 'border-gray-300 focus:ring-primary-blue-200 focus:border-primary-blue-400'
                  }`}
                placeholder="กรอกอีเมลของคุณ"
              />
              {validation.email.isChecking && (
                <div className="absolute right-3 top-2.5">
                  <div className="animate-spin h-5 w-5 border-2 border-primary-blue-500 rounded-full border-t-transparent"></div>
                </div>
              )}
            </div>
            {validation.email.error && (
              <p className="text-red-500 text-xs mt-1">{validation.email.error}</p>
            )}
        </div>

        {/* ส่วน Input Password และ Confirm Password */}
        <div className="w-full">
             <label htmlFor="password" className="block text-gray-700 text-sm mb-1 font-medium">รหัสผ่าน</label>
             <div className="relative">
                <input
                    type={showPassword ? "text" : "password"}
                    id="password"
                    value={data.password || ''}
                    onChange={(e) => updateData({ password: e.target.value })}
                    className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 transition-all
                      ${validation.password?.error 
                        ? 'border-red-400 focus:ring-red-200' 
                        : 'border-gray-300 focus:ring-primary-blue-200 focus:border-primary-blue-400'
                      }`}
                    placeholder="กำหนดรหัสผ่าน (อย่างน้อย 8 ตัวอักษร)"
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600 focus:outline-none">
                    {showPassword ? (
                      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line></svg>
                    ) : (
                      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                    )}
                </button>
             </div>
             {validation.password?.error && <p className="text-red-500 text-xs mt-1">{validation.password.error}</p>}
        </div>

        <div className="w-full">
            <label htmlFor="confirmPassword" className="block text-gray-700 text-sm mb-1 font-medium">ยืนยันรหัสผ่าน</label>
            <input
                type={showPassword ? "text" : "password"}
                id="confirmPassword"
                value={data.confirmPassword || ''}
                onChange={(e) => updateData({ confirmPassword: e.target.value })}
                className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 transition-all ${validation.confirmPassword?.error ? 'border-red-400 focus:ring-red-200' : 'border-gray-300 focus:ring-primary-blue-200 focus:border-primary-blue-400'}`}
                placeholder="กรอกรหัสผ่านอีกครั้ง"
            />
            {validation.confirmPassword?.error && <p className="text-red-500 text-xs mt-1">{validation.confirmPassword.error}</p>}
        </div>

        {/* --- ส่วน Checkbox Terms & Conditions (ใหม่) --- */}
        <div className="w-full mt-2">
          <div className="flex items-start">
            <div className="flex items-center h-5">
              <input
                id="terms"
                type="checkbox"
                checked={data.acceptedTerms}
                onClick={handleCheckboxClick} // กดแล้วเปิด Popup
                readOnly // ป้องกันการเปลี่ยนค่าเอง
                className="w-4 h-4 border border-gray-300 rounded bg-gray-50 focus:ring-3 focus:ring-primary-blue-300 cursor-pointer"
              />
            </div>
            <label htmlFor="terms" className="ml-2 text-sm font-medium text-gray-900 cursor-pointer select-none" onClick={handleCheckboxClick}>
              <span className="text-primary-blue-600 hover:underline">ข้อตกลงและเงื่อนไขการใช้งาน</span>
            </label>
          </div>
          {!data.acceptedTerms && (
             <p className="text-xs text-gray-400 mt-1 ml-6">กรุณาอ่านและยอมรับข้อตกลงก่อนดำเนินการต่อ</p>
          )}
        </div>

      </div>

      {/* --- Terms & Conditions Modal --- */}
      {showTermsModal && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-gray bg-opacity-30 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg flex flex-col max-h-[80vh] animate-fadeIn">
            
            {/* Modal Header */}
            <div className="p-4 border-b flex justify-between items-center bg-gray-50 rounded-t-xl">
              <h3 className="text-lg font-semibold text-gray-800">ข้อตกลงและเงื่อนไขการใช้งาน</h3>
            </div>

            {/* Modal Body (Scrollable) */}
            <div className="p-6 overflow-y-auto custom-scrollbar text-sm text-gray-600 leading-relaxed space-y-4">
              <p>Cosci Hub (แพลตฟอร์ม) จัดทำขึ้นเพื่อเป็นพื้นที่กลางในการอำนวยความสะดวกและเชื่อมโยงนิสิต (ฟรีแลนซ์) กับคณาจารย์ ศิษย์เก่า และบุคลากรของวิทยาลัยนวัตกรรมสื่อสารสังคม (ผู้ว่าจ้าง) ก่อนเข้าใช้งานแพลตฟอร์ม 
              <br/>กรุณาอ่านข้อตกลงและเงื่อนไขเหล่านี้อย่างละเอียด การที่คุณลงทะเบียนและใช้งานแพลตฟอร์มนี้ ถือว่าคุณได้ยอมรับและตกลงที่จะผูกพันตามข้อตกลงดังต่อไปนี้:</p>
              
              <p><strong>1. บทบาทของแพลตฟอร์ม (Platform Role)</strong><br/>
              Cosci Hub ทำหน้าที่เป็น ตัวกลาง (Intermediary) เท่านั้น เพื่อให้ผู้ว่าจ้างสามารถประกาศค้นหาฟรีแลนซ์ และฟรีแลนซ์สามารถนำเสนอทักษะและผลงานของตน แพลตฟอร์มไม่มีส่วนในการตัดสินใจว่าจ้าง, กำหนดเงื่อนไข, หรือดำเนินการใดๆ ที่เกี่ยวข้องกับการจ้างงานระหว่างผู้ว่าจ้างและฟรีแลนซ์</p>

              <p><strong>2. การว่าจ้างและค่าตอบแทน (Employment and Compensation)</strong><br/>
              การตกลงเรื่องขอบเขตของงาน, กำหนดเวลาส่งมอบงาน, อัตราค่าตอบแทน, วิธีการชำระเงิน, และเงื่อนไขการจ้างงานอื่นๆ ทั้งหมด ถือเป็น ข้อตกลงโดยตรง ระหว่างผู้ว่าจ้างและฟรีแลนซ์ แพลตฟอร์มไม่มีส่วนเกี่ยวข้อง ในกระบวนการทางการเงิน การเจรจาต่อรอง หรือการชำระค่าตอบแทนใดๆ ทั้งสิ้น และจะไม่รับผิดชอบต่อข้อพิพาทใดๆ ที่เกี่ยวข้องกับค่าตอบแทน</p>

              <p><strong>3. การจำกัดความรับผิดชอบ (Disclaimer of Liability)</strong><br/>
              ผู้ใช้งาน (ทั้งผู้ว่าจ้างและฟรีแลนซ์) ตกลงที่จะใช้งานแพลตฟอร์มนี้บนความเสี่ยงของตนเอง Cosci Hub ไม่รับประกัน ความถูกต้องของข้อมูลโปรไฟล์, คุณภาพของงาน, ความสามารถของฟรีแลนซ์, หรือความน่าเชื่อถือของผู้ว่าจ้าง แพลตฟอร์ม ไม่รับผิดชอบ ต่อความเสียหาย, ความสูญเสีย, ข้อพิพาท, หรือความเสี่ยงใด ๆ ที่อาจเกิดขึ้นจากการตกลงว่าจ้าง, การดำเนินงาน, หรือผลลัพธ์ของงานที่เกิดขึ้นระหว่างผู้ว่าจ้างและฟรีแลนซ์</p>
              
              <p><strong>4. หน้าที่ของผู้ใช้งาน (User Responsibilities)</strong><br/>
              ผู้ใช้งานมีหน้าที่ตรวจสอบและยืนยันข้อมูล (Due Diligence) ของอีกฝ่ายหนึ่งด้วยตนเองก่อนทำการตกลงว่าจ้าง และผู้ใช้งานตกลงที่จะให้ข้อมูลที่เป็นจริงและถูกต้องในโปรไฟล์และการประกาศงานของตน</p>

              <p><strong>5. การยอมรับข้อตกลง (Acceptance)</strong><br/>
              หากท่านลงทะเบียนในฐานะศิษย์เก่า ท่านยินยอมให้ระบบส่งข้อมูลของท่าน (ชื่อ, สาขา, รูปโปรไฟล์) ไปยังอาจารย์ที่ปรึกษาที่ท่านระบุเพื่อทำการยืนยันตัวตน</p>

              <p>การคลิก ยอมรับ และการดำเนินการลงทะเบียนต่อ ถือว่าคุณได้อ่าน, เข้าใจ, และยอมรับข้อตกลงและเงื่อนไขทั้งหมดนี้แล้ว</p>

            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t bg-gray-50 rounded-b-xl flex justify-end gap-3">
              <button
                onClick={() => setShowTermsModal(false)}
                className="px-4 py-2 text-gray-600 hover:bg-gray-200 rounded-lg text-sm font-medium transition-colors"
              >
                ปิดหน้าต่าง
              </button>
              <button
                onClick={handleAcceptTerms}
                className="px-6 py-2 bg-primary-blue-600 hover:bg-primary-blue-700 text-white rounded-lg text-sm font-medium shadow-md transition-transform active:scale-95"
              >
                ยอมรับเงื่อนไข
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default StepEmail;