 // src/app/components/auth/register/steps/Step1NameAndRole.tsx
import React from 'react';
import { RegisterData, UserRole } from '../RegisterForm';
import MajorDropdown from './MajorDropdown'; //  reusing existing component

// Define validation state for props
interface ValidationState {
  firstName: { error: string };
  lastName: { error: string };
}

interface Step1_UserInfoProps {
  data: RegisterData;
  validation: ValidationState;
  updateData: (data: Partial<RegisterData>) => void;
  onValidateName: (value: string, field: 'firstName' | 'lastName') => boolean;
}

// Options for the Role dropdown
const roleOptions = [
  { value: 'student', label: 'นิสิต' },
  { value: 'alumni', label: 'ศิษย์เก่า' },
  { value: 'teacher', label: 'อาจารย์' },
];

function Step1_UserInfo({
  data,
  validation,
  updateData,
  onValidateName,
}: Step1_UserInfoProps) {
  
  // Handle name input changes
  const handleNameChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    field: 'firstName' | 'lastName'
  ) => {
    const { value } = e.target;
    // Validate and update
    if (onValidateName(value, field)) {
      updateData({ [field]: value });
    }
  };

  return (
    <div className="flex flex-col gap-4">
      {/* ปรับ UI ให้ตรงกับภาพ: 
        เราสามารถลบ icon ใน input ออกได้หากต้องการให้เหมือนในภาพเป๊ะๆ 
        หรือปรับสไตล์ .input ใน globals.css ให้มี padding-left เพิ่มขึ้น
      */}
      
      <div>
        <label htmlFor="firstName" className="block text-gray-700 text-sm mb-1">
          ชื่อจริง <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          id="firstName"
          className={`input ${validation.firstName.error ? 'border-red-500' : ''}`}
          placeholder="กรอกชื่อจริงของคุณ"
          value={data.firstName}
          onChange={(e) => handleNameChange(e, 'firstName')}
          required
        />
        <div className="relative py-2 h-6">
          {validation.firstName.error && (
            <p className="text-red-500 text-xs absolute">
              {validation.firstName.error}
            </p>
          )}
        </div>
      </div>

      <div>
        <label htmlFor="lastName" className="block text-gray-700 text-sm mb-1">
          นามสกุล <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          id="lastName"
          className={`input ${validation.lastName.error ? 'border-red-500' : ''}`}
          placeholder="กรอกนามสกุลของคุณ"
          value={data.lastName}
          onChange={(e) => handleNameChange(e, 'lastName')}
          required
        />
        <div className="relative py-2 h-6">
          {validation.lastName.error && (
            <p className="text-red-500 text-xs absolute">
              {validation.lastName.error}
            </p>
          )}
        </div>
      </div>

      <div>
        <label htmlFor="role" className="block text-gray-700 text-sm mb-1">
          บทบาท <span className="text-red-500">*</span>
        </label>
        <MajorDropdown
          id="role"
          options={roleOptions}
          value={data.role}
          onChange={(value) => updateData({ role: value as UserRole })}
          placeholder="เลือกบทบาทของคุณ"
          required
        />
      </div>
    </div>
  );
}

export default Step1_UserInfo;