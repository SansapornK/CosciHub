// import React from 'react';
// import { UserRole } from '../RegisterForm';

// interface StepRoleProps {
//   selectedRole: UserRole;
//   onRoleSelect: (role: UserRole) => void;
// }

// function StepRole({ selectedRole, onRoleSelect }: StepRoleProps) {
//   const roles: { id: UserRole; title: string; description: string; icon: React.ReactNode }[] = [
//     {
//       id: "student",
//       title: "นิสิต",
//       description: "นิสิตปัจจุบันของ COSCI",
//       icon: (
//         <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
//           <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
//           <path d="M6 12v5c0 2 2 3 6 3s6-1 6-3v-5" />
//         </svg>
//       )
//     },
//     {
//       id: "alumni",
//       title: "ศิษย์เก่า",
//       description: "ศิษย์เก่าของ COSCI",
//       icon: (
//         <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
//           <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
//           <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
//         </svg>
//       )
//     },
//     {
//       id: "teacher",
//       title: "อาจารย์",
//       description: "อาจารย์หรือบุคลากรของ COSCI",
//       icon: (
//         <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
//           <path d="M12 8a2 2 0 1 0 0-4 2 2 0 0 0 0 4z" />
//           <path d="M12 2v2" />
//           <path d="M12 6v2" />
//           <path d="M4 9h16" />
//           <path d="M12 12h.01" />
//           <path d="M12 16h.01" />
//           <path d="M4 21h16a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2z" />
//         </svg>
//       )
//     }
//   ];

//   return (
//     <div className="flex flex-col gap-4">
//       <div>
//         <h2 className="text-lg font-medium text-gray-800">เลือกบทบาทของคุณ</h2>
//         <p className="text-gray-500 text-sm">โปรดเลือกบทบาทที่ตรงกับสถานะของคุณ</p>
//       </div>

//       <div className="space-y-3">
//         {roles.map((role) => (
//           <div
//             key={role.id}
//             className={`p-4 border rounded-lg cursor-pointer transition-all ${
//               selectedRole === role.id
//                 ? 'border-primary-blue-500 bg-primary-blue-50'
//                 : 'border-gray-200 hover:border-gray-300'
//             }`}
//             onClick={() => onRoleSelect(role.id)}
//           >
//             <div className="flex items-center gap-3">
//               <div 
//                 className={`p-2 rounded-full ${
//                   selectedRole === role.id
//                     ? 'bg-primary-blue-500 text-white'
//                     : 'bg-gray-100 text-gray-500'
//                 }`}
//               >
//                 {role.icon}
//               </div>
//               <div>
//                 <h3 className="font-medium">{role.title}</h3>
//                 <p className="text-sm text-gray-500">{role.description}</p>
//               </div>
//               <div className="ml-auto">
//                 <div 
//                   className={`w-5 h-5 rounded-full border ${
//                     selectedRole === role.id
//                       ? 'border-primary-blue-500 bg-primary-blue-500'
//                       : 'border-gray-300'
//                   } flex items-center justify-center`}
//                 >
//                   {selectedRole === role.id && (
//                     <div className="w-2 h-2 rounded-full bg-white"></div>
//                   )}
//                 </div>
//               </div>
//             </div>
//           </div>
//         ))}
//       </div>
//     </div>
//   );
// }

// export default StepRole;

 // src/app/components/auth/register/steps/Step1NameAndRole.tsx
import React from 'react';
import { RegisterData, UserRole } from '../RegisterForm';
import MajorDropdown from './MajorDropdown'; //  reusing existing component

// Define validation state for props
// interface ValidationState {
//   firstName: { error: string };
//   lastName: { error: string };
// }

interface Step1_UserInfoProps {
  data: RegisterData;
  // validation: ValidationState;
  updateData: (data: Partial<RegisterData>) => void;
  // onValidateName: (value: string, field: 'firstName' | 'lastName') => boolean;
}

// Options for the Role dropdown
const roleOptions = [
  { value: 'student', label: 'นิสิต' },
  { value: 'alumni', label: 'ศิษย์เก่า' },
  { value: 'teacher', label: 'อาจารย์' },
];
// Icon สำหรับฟิลด์บทบาท
const RoleIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-400">
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
        <circle cx="12" cy="7" r="4"></circle>
    </svg>
);


function Step1_UserInfo({
  data,
  // validation,
  updateData,
  // onValidateName,
}: Step1_UserInfoProps) {
  
  // Handle name input changes
  // const handleNameChange = (
  //   e: React.ChangeEvent<HTMLInputElement>,
  //   field: 'firstName' | 'lastName'
  // ) => {
  //   const { value } = e.target;
  //   // Validate and update
  //   if (onValidateName(value, field)) {
  //     updateData({ [field]: value });
  //   }
  // };

  return (
    <div className="flex flex-col gap-6 w-full h-full">
      {/* ปรับ UI ให้ตรงกับภาพ: 
        เราสามารถลบ icon ใน input ออกได้หากต้องการให้เหมือนในภาพเป๊ะๆ 
        หรือปรับสไตล์ .input ใน globals.css ให้มี padding-left เพิ่มขึ้น
      */}
      
      {/* <div>
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
      </div> */}

      {/* <div>
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
      </div> */}

      <div>
        <label htmlFor="role" className="block text-gray-700 text-sm mb-1">
          บทบาท <span className="text-red-500">*</span>
        </label>
        
        {/* Wrapper สำหรับ Icon */}
            <div className="relative">
                {/* Icon จะอยู่ด้านซ้ายของ Dropdown */}
                <div className="absolute left-3 top-1/2 transform -translate-y-1/2 pointer-events-none z-10">
                    <RoleIcon />
                </div>

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
    </div>
  );
}

export default Step1_UserInfo;