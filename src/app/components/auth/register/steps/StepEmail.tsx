import React, { useState } from 'react';
import { RegisterData } from '../RegisterForm';

interface EmailValidation {
  isChecking: boolean;
  exists: boolean;
  error: string;
  touched: boolean;
}

interface StepEmailProps {
  data: RegisterData;
  // แก้ไข Interface ให้รับ validation ทั้งก้อน (Email + Password)
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

  return (
    <div className="flex flex-col gap-5 w-full items-center">
      <div className="w-full">
        <h2 className="text-lg font-medium text-gray-800">ตั้งค่าบัญชีของคุณ</h2>
        <p className="text-gray-500 text-sm">กรอกอีเมลและกำหนดรหัสผ่านสำหรับเข้าใช้งาน</p>
      </div>

      {/* --- ส่วนของ Email --- */}
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
          
          {/* Loading Indicator */}
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

      {/* --- ส่วนของ Password --- */}
      <div className="w-full">
        <label htmlFor="password" className="block text-gray-700 text-sm mb-1 font-medium">
          รหัสผ่าน
        </label>
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
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600 focus:outline-none"
          >
            {showPassword ? (
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line></svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
            )}
          </button>
        </div>
        {validation.password?.error && (
          <p className="text-red-500 text-xs mt-1">{validation.password.error}</p>
        )}
      </div>

      {/* --- ส่วนของ Confirm Password --- */}
      <div className="w-full">
        <label htmlFor="confirmPassword" className="block text-gray-700 text-sm mb-1 font-medium">
          ยืนยันรหัสผ่าน
        </label>
        <input
          type={showPassword ? "text" : "password"}
          id="confirmPassword"
          value={data.confirmPassword || ''}
          onChange={(e) => updateData({ confirmPassword: e.target.value })}
          className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 transition-all
            ${validation.confirmPassword?.error 
              ? 'border-red-400 focus:ring-red-200' 
              : 'border-gray-300 focus:ring-primary-blue-200 focus:border-primary-blue-400'
            }`}
          placeholder="กรอกรหัสผ่านอีกครั้ง"
        />
        {validation.confirmPassword?.error && (
          <p className="text-red-500 text-xs mt-1">{validation.confirmPassword.error}</p>
        )}
      </div>
    </div>
  );
}

export default StepEmail;