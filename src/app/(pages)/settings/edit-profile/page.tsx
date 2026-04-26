// src/app/(pages)/settings/edit-profile/page.tsx
"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Plus, Save, Trash2, Mail, Phone, MessageCircle } from "lucide-react";
import axios from "axios";
import toast from "react-hot-toast";
import Loading from "@/app/components/common/Loading";

// Contact type options
const contactTypes = [
  { value: "email", label: "อีเมล", icon: Mail, placeholder: "example@email.com" },
  { value: "line", label: "Line ID", icon: MessageCircle, placeholder: "@lineid หรือ 0812345678" },
  { value: "phone", label: "เบอร์โทรศัพท์", icon: Phone, placeholder: "081-234-5678" },
];

interface ContactItem {
  type: string;
  value: string;
}

interface ProfileData {
  firstName: string;
  lastName: string;
  contactInfo: ContactItem[];
}

// Convert ContactItem to string for saving
const contactItemToString = (item: ContactItem): string => {
  const typeLabel = contactTypes.find(t => t.value === item.type)?.label || item.type;
  return `${typeLabel}: ${item.value}`;
};

// Parse contact string from DB to ContactItem
// Expected formats: "อีเมล: value", "Line ID: value", "เบอร์โทรศัพท์: value"
const parseContactString = (contact: string): ContactItem => {
  if (contact.startsWith("อีเมล:")) {
    return { type: "email", value: contact.substring("อีเมล:".length).trim() };
  }
  if (contact.startsWith("Line ID:")) {
    return { type: "line", value: contact.substring("Line ID:".length).trim() };
  }
  if (contact.startsWith("เบอร์โทรศัพท์:")) {
    return { type: "phone", value: contact.substring("เบอร์โทรศัพท์:".length).trim() };
  }
  // Default: return as email type
  return { type: "email", value: contact };
};

export default function EditProfilePage() {
  const { status } = useSession();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [profileData, setProfileData] = useState<ProfileData>({
    firstName: "",
    lastName: "",
    contactInfo: [{ type: "email", value: "" }],
  });
  const [validation, setValidation] = useState({
    firstName: { error: "" },
    lastName: { error: "" },
  });

  // Fetch user data
  useEffect(() => {
    const fetchProfile = async () => {
      if (status !== "authenticated") return;

      try {
        const response = await axios.get("/api/user/profile");
        const data = response.data;

        // Parse existing contact info from DB
        const parsedContactInfo: ContactItem[] =
          data.contactInfo && data.contactInfo.length > 0
            ? data.contactInfo.map((contact: string) => parseContactString(contact))
            : [{ type: "email", value: "" }];

        setProfileData({
          firstName: data.firstName || "",
          lastName: data.lastName || "",
          contactInfo: parsedContactInfo,
        });
      } catch (error) {
        console.error("Error fetching profile:", error);
        toast.error("ไม่สามารถโหลดข้อมูลได้");
      } finally {
        setIsLoading(false);
      }
    };

    if (status === "authenticated") {
      fetchProfile();
    } else if (status === "unauthenticated") {
      router.push("/auth?state=login");
    }
  }, [status, router]);

  // Validate name (Thai and English letters only)
  const validateName = (value: string, field: "firstName" | "lastName") => {
    const letterRegex = /^[ก-๙a-zA-Z\s]*$/;

    if (!letterRegex.test(value)) {
      setValidation((prev) => ({
        ...prev,
        [field]: {
          error:
            field === "firstName"
              ? "ชื่อต้องเป็นตัวอักษรเท่านั้น"
              : "นามสกุลต้องเป็นตัวอักษรเท่านั้น",
        },
      }));
      return false;
    }

    setValidation((prev) => ({
      ...prev,
      [field]: { error: "" },
    }));
    return true;
  };

  // Handle name change
  const handleNameChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    field: "firstName" | "lastName"
  ) => {
    const { value } = e.target;
    if (validateName(value, field)) {
      setProfileData((prev) => ({ ...prev, [field]: value }));
    }
  };

  // Handle contact info type change
  const handleContactTypeChange = (index: number, type: string) => {
    const newContactInfo = [...profileData.contactInfo];
    newContactInfo[index] = { ...newContactInfo[index], type };
    setProfileData((prev) => ({ ...prev, contactInfo: newContactInfo }));
  };

  // Handle contact info value change
  const handleContactValueChange = (index: number, value: string) => {
    const newContactInfo = [...profileData.contactInfo];
    newContactInfo[index] = { ...newContactInfo[index], value };
    setProfileData((prev) => ({ ...prev, contactInfo: newContactInfo }));
  };

  // Add contact info field
  const addContactInfo = () => {
    setProfileData((prev) => ({
      ...prev,
      contactInfo: [...prev.contactInfo, { type: "email", value: "" }],
    }));
  };

  // Remove contact info field
  const removeContactInfo = (index: number) => {
    const newContactInfo = profileData.contactInfo.filter(
      (_, i) => i !== index
    );
    setProfileData((prev) => ({
      ...prev,
      contactInfo: newContactInfo.length > 0 ? newContactInfo : [{ type: "email", value: "" }],
    }));
  };

  // Check if form is valid
  const isFormValid = () => {
    if (!profileData.firstName.trim() || !profileData.lastName.trim())
      return false;
    if (validation.firstName.error || validation.lastName.error) return false;

    // At least one contact info with value required
    const validContactInfo = profileData.contactInfo.filter(
      (info) => info.value.trim() !== ""
    );
    if (validContactInfo.length === 0) return false;

    return true;
  };

  // Handle save
  const handleSave = async () => {
    if (!isFormValid()) {
      toast.error("กรุณากรอกข้อมูลให้ครบถ้วน");
      return;
    }

    setIsSaving(true);

    try {
      const formData = new FormData();
      formData.append("firstName", profileData.firstName);
      formData.append("lastName", profileData.lastName);

      // Convert ContactItem array to string array for saving
      const contactInfoStrings = profileData.contactInfo
        .filter((info) => info.value.trim() !== "")
        .map((info) => contactItemToString(info));

      formData.append("contactInfo", JSON.stringify(contactInfoStrings));

      await axios.patch("/api/user/profile", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      toast.success("บันทึกข้อมูลเรียบร้อยแล้ว");
      router.push("/settings");
    } catch (error) {
      console.error("Error saving profile:", error);
      toast.error("ไม่สามารถบันทึกข้อมูลได้");
    } finally {
      setIsSaving(false);
    }
  };

  if (status === "loading" || isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-10 h-screen">
        <Loading size="large" color="primary" />
        <p className="mt-4 text-gray-500">กำลังโหลดข้อมูล...</p>
      </div>
    );
  }

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
        <h2 className="text-2xl font-bold text-gray-800">แก้ไขข้อมูลส่วนตัว</h2>
      </div>

      {/* Form */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <div className="flex flex-col gap-6">
          {/* Name Section */}
          <div>
            <h3 className="text-lg font-medium text-gray-800 mb-1">
              ข้อมูลส่วนตัว
            </h3>
            <p className="text-gray-500 text-sm mb-4">แก้ไขชื่อและนามสกุล</p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="firstName"
                  className="block text-gray-700 text-sm mb-1"
                >
                  ชื่อ <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="firstName"
                  className={`input ${validation.firstName.error ? "border-red-500" : ""}`}
                  placeholder="ชื่อจริง"
                  value={profileData.firstName}
                  onChange={(e) => handleNameChange(e, "firstName")}
                />
                {validation.firstName.error && (
                  <p className="text-red-500 text-xs mt-1">
                    {validation.firstName.error}
                  </p>
                )}
              </div>

              <div>
                <label
                  htmlFor="lastName"
                  className="block text-gray-700 text-sm mb-1"
                >
                  นามสกุล <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="lastName"
                  className={`input ${validation.lastName.error ? "border-red-500" : ""}`}
                  placeholder="นามสกุล"
                  value={profileData.lastName}
                  onChange={(e) => handleNameChange(e, "lastName")}
                />
                {validation.lastName.error && (
                  <p className="text-red-500 text-xs mt-1">
                    {validation.lastName.error}
                  </p>
                )}
              </div>
            </div>
          </div>

          <hr className="border-gray-100" />

          {/* Contact Info Section */}
          <div>
            <h3 className="text-lg font-medium text-gray-800 mb-1">
              ช่องทางการติดต่อ
            </h3>
            <p className="text-gray-500 text-sm mb-4">
              ผู้ว่าจ้าง / นิสิตจะใช้ข้อมูลนี้เพื่อติดต่อคุณเกี่ยวกับงาน
            </p>

            <div className="flex flex-col gap-3">
              {profileData.contactInfo.map((contact, index) => {
                const selectedType = contactTypes.find(t => t.value === contact.type) || contactTypes[0];
                const IconComponent = selectedType.icon;

                return (
                  <div key={index} className="flex gap-2">
                    {/* Contact Type Dropdown */}
                    <div className="relative">
                      <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                        <IconComponent className="w-4 h-4" />
                      </div>
                      <select
                        value={contact.type}
                        onChange={(e) => handleContactTypeChange(index, e.target.value)}
                        className="appearance-none  bg-gray-50 border border-gray-200 rounded-lg px-10 py-2.5 pr-5 text-sm font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-primary-blue-200 focus:border-primary-blue-400 cursor-pointer min-w-[140px]"
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
                    {profileData.contactInfo.length > 1 && (
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
      </div>

      {/* Save Button */}
      <div className="flex justify-end gap-3 mt-5">
        <Link
          href="/settings"
          className="px-6 py-2.5 text-gray-600 hover:bg-gray-100 rounded-xl font-medium transition-colors"
        >
          ยกเลิก
        </Link>
        <button
          onClick={handleSave}
          disabled={!isFormValid() || isSaving}
          className="flex items-center gap-2 px-6 py-2.5 bg-primary-blue-500 hover:bg-primary-blue-600 disabled:bg-gray-300 text-white font-medium rounded-xl transition-colors"
        >
          {isSaving ? (
            <span className="inline-block h-5 w-5 border-2 border-white border-r-transparent rounded-full animate-spin"></span>
          ) : (
            <Save className="w-5 h-5" />
          )}
          บันทึก
        </button>
      </div>
    </div>
  );
}
