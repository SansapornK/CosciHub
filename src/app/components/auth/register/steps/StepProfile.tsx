import React, { useState, useEffect } from 'react';
import { Mail, Phone, MessageCircle, Plus, Trash2 } from 'lucide-react';
import { RegisterData } from '../RegisterForm';

// Contact type options
const contactTypes = [
  { value: "email", label: "อีเมล", icon: Mail, placeholder: "example@email.com" },
  { value: "line", label: "Line ID", icon: MessageCircle, placeholder: "@lineid หรือ 0812345678" },
  { value: "phone", label: "เบอร์โทรศัพท์", icon: Phone, placeholder: "081-234-5678" },
];

export interface ContactItem {
  type: string;
  value: string;
}

// Convert ContactItem to string for saving
export const contactItemToString = (item: ContactItem): string => {
  const typeLabel = contactTypes.find(t => t.value === item.type)?.label || item.type;
  return `${typeLabel}: ${item.value}`;
};

interface StepProfileProps {
  data: RegisterData;
  updateData: (data: Partial<RegisterData>) => void;
  onSelectImage: (imageUrl: string) => void;
}

function StepProfile({ data, updateData, onSelectImage }: StepProfileProps) {
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [portfolioError, setPortfolioError] = useState('');
  const [contactItems, setContactItems] = useState<ContactItem[]>([{ type: "email", value: "" }]);

  // Update preview when profileImage changes (after cropping)
  useEffect(() => {
    if (data.profileImage) {
      // Clear any previous preview URL to avoid memory leaks
      if (previewImage) {
        URL.revokeObjectURL(previewImage);
      }
      // Create a new preview from the cropped image
      const newPreviewUrl = URL.createObjectURL(data.profileImage);
      setPreviewImage(newPreviewUrl);
      
      // Clean up preview URL when component unmounts or preview changes
      return () => {
        URL.revokeObjectURL(newPreviewUrl);
      };
    }
  }, [data.profileImage]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      
      // Create a preview URL for the cropper
      const reader = new FileReader();
      reader.onload = () => {
        const imageUrl = reader.result as string;
        // Don't set the preview yet, wait until after cropping
        onSelectImage(imageUrl); // Open crop modal
      };
      reader.readAsDataURL(file);
      
      // Reset the input value to ensure change event fires even if the same file is selected again
      e.target.value = '';
    }
  };

  const handlePortfolioChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      
      // Check file size (5MB limit)
      if (file.size > 5 * 1024 * 1024) {
        setPortfolioError('ไฟล์ขนาดใหญ่เกินไป (จำกัด 5MB)');
        return;
      }
      
      // Check file type (PDF only)
      if (file.type !== 'application/pdf') {
        setPortfolioError('กรุณาอัปโหลดไฟล์ PDF เท่านั้น');
        return;
      }
      
      // Clear error and update data
      setPortfolioError('');
      updateData({ portfolioFile: file });
    }
  };

  const removePortfolio = () => {
    updateData({ portfolioFile: undefined });
  };

  const handleBioChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    updateData({ bio: e.target.value });
  };

  // Sync contactItems to data.contactInfo (as strings)
  useEffect(() => {
    const contactStrings = contactItems
      .filter(item => item.value.trim() !== '')
      .map(item => contactItemToString(item));
    updateData({ contactInfo: contactStrings.length > 0 ? contactStrings : [''] });
  }, [contactItems]);

  // Handle contact type change
  const handleContactTypeChange = (index: number, type: string) => {
    const newItems = [...contactItems];
    newItems[index] = { ...newItems[index], type };
    setContactItems(newItems);
  };

  // Handle contact value change
  const handleContactValueChange = (index: number, value: string) => {
    const newItems = [...contactItems];
    newItems[index] = { ...newItems[index], value };
    setContactItems(newItems);
  };

  const addContactInfo = () => {
    setContactItems([...contactItems, { type: "email", value: "" }]);
  };

  const removeContactInfo = (index: number) => {
    const newItems = contactItems.filter((_, i) => i !== index);
    setContactItems(newItems.length > 0 ? newItems : [{ type: "email", value: "" }]);
  };

  const removeProfileImage = () => {
    // Clear preview image
    if (previewImage) {
      URL.revokeObjectURL(previewImage);
      setPreviewImage(null);
    }
    // Reset profile image data
    updateData({ profileImage: undefined });
  };

  // Format file size in KB or MB
  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };
  

  return (
    <div className="flex flex-col gap-4 w-full items-center">
      <div className="w-full">
        <h2 className="text-lg font-medium text-gray-800">โปรไฟล์</h2>
        <p className="text-gray-500 text-sm">
          เพิ่มรูปโปรไฟล์และรายละเอียดเพิ่มเติม
        </p>
      </div>

      {/* Profile Image */}
      <div className="w-full">
        <div className="flex flex-col items-center gap-3">
          <div className="w-28 h-28 rounded-full overflow-hidden bg-gray-200 flex items-center justify-center">
            {previewImage ? (
              <img
                src={previewImage}
                alt="Preview"
                className="w-full h-full object-cover"
              />
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-400">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                <circle cx="12" cy="7" r="4"></circle>
              </svg>
            )}
          </div>

          <div className="flex gap-2 justify-center">
            <label
              htmlFor="profile-image"
              className="px-3 py-1 bg-white border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50 text-sm inline-block"
            >
              เลือกรูปภาพ{data.role === 'alumni' && <span className="text-red-500"> *</span>}
            </label>
            <input
              type="file"
              id="profile-image"
              accept="image/*"
              className="hidden"
              onChange={handleImageChange}
            />

            {previewImage && (
              <button
                type="button"
                onClick={removeProfileImage}
                className="px-3 py-1 bg-white border border-gray-300 rounded-lg text-red-500 hover:bg-gray-50 text-sm inline-block"
              >
                ลบรูปภาพ
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="w-full">
        <p className="text-gray-400 text-sm">
          แนะนำใช้รูปที่เห็นใบหน้าชัดเจน ไม่ใส่แว่นทึบ หมวก หรือวัตถุที่ปิดบังใบหน้า
        </p>
      </div>

      {/* Bio */}
      <div className="w-full">
        <label htmlFor="bio" className="block text-gray-700 text-sm mb-1">
          คำอธิบายตนเอง
        </label>
        <textarea
          id="bio"
          rows={2}
          className="input resize-none"
          placeholder="กรอกคำอธิบายตนเอง..."
          value={data.bio}
          onChange={handleBioChange}
        />
      </div>

      {/* Contact Info - Required */}
      <div className="w-full">
        <label className="block text-gray-700 text-sm mb-1">
          ช่องทางการติดต่อ <span className="text-red-500">*</span>
        </label>
        <p className="text-gray-400 text-sm mb-2">
          ผู้ว่าจ้าง / นิสิตจะใช้ข้อมูลนี้เพื่อติดต่อคุณเกี่ยวกับงาน
        </p>
        <div className="flex flex-col gap-2">
          {contactItems.map((contact, index) => {
            const selectedType = contactTypes.find(t => t.value === contact.type) || contactTypes[0];
            const IconComponent = selectedType.icon;

            return (
              <div key={index} className="flex gap-2">
                {/* Contact Type Dropdown */}
                <div className="relative">
                  <div className="absolute left-3 top-5 -translate-y-2 pointer-events-none text-gray-400">
                    <IconComponent className="w-4 h-4" />
                  </div>
                  <select
                    value={contact.type}
                    onChange={(e) => handleContactTypeChange(index, e.target.value)}
                    className="appearance-none bg-gray-50 border border-gray-200 rounded-lg pl-10 pr-4 py-2.5 text-sm font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-primary-blue-200 focus:border-primary-blue-400 cursor-pointer min-w-[130px]"
                  >
                    {contactTypes.map((type) => (
                      <option key={type.value} value={type.value}>
                        {type.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Contact Value Input */}
                <input
                  type={contact.type === "email" ? "email" : "text"}
                  className="input flex-1"
                  placeholder={selectedType.placeholder}
                  value={contact.value}
                  onChange={(e) => handleContactValueChange(index, e.target.value)}
                />

                {/* Remove Button */}
                {contactItems.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeContactInfo(index)}
                    className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                    title="ลบช่องทางนี้"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                )}
              </div>
            );
          })}
          <button
            type="button"
            onClick={addContactInfo}
            className="flex items-center gap-2 text-sm text-primary-blue-500 hover:text-primary-blue-600 font-medium w-fit"
          >
            <Plus className="w-4 h-4" />
            เพิ่มช่องทางการติดต่อ
          </button>
        </div>
      </div>
    </div>
  );
}

export default StepProfile;