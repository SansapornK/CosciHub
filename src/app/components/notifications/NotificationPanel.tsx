// src/app/components/notifications/NotificationPanel.tsx
"use client";

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import { formatDistanceToNow } from "date-fns";
import { th } from "date-fns/locale";
import Loading from "../common/Loading";
import { useNotifications, Notification } from "@/hooks/useNotifications";
import {
  UserPlus,
  Zap,
  BarChart3,
  FileCheck,
  CheckCircle2,
  XCircle,
  FileEdit,
  Info,
  Star,
  Bell,
  UserMinus,
  Ban,
  LucideIcon,
  ChevronLeft,
} from "lucide-react";

interface NotificationPanelProps {
  isOpen: boolean;
  onClose: () => void;
  // รับจาก Navbar แทน
  notifications: Notification[];
  unreadCount: number;
  loading: boolean;
  error: string | null;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  refreshNotifications: () => Promise<void>;
  hasMore: boolean;
  loadMore: () => void;
}

// ─── Icon ตาม type ────────────────────────────────────────────────────────────
const NotificationIcon: React.FC<{ type: string }> = ({ type }) => {
  const configs: Record<
    string,
    { bg: string; text: string; Icon: LucideIcon }
  > = {
    job_new_application: {
      bg: "bg-purple-100",
      text: "text-purple-600",
      Icon: UserPlus,
    },
    job_work_started: {
      bg: "bg-blue-100",
      text: "text-blue-600",
      Icon: Zap,
    },
    job_progress_updated: {
      bg: "bg-blue-100",
      text: "text-blue-600",
      Icon: BarChart3,
    },
    job_work_submitted: {
      bg: "bg-orange-100",
      text: "text-orange-600",
      Icon: FileCheck,
    },
    application_accepted: {
      bg: "bg-green-100",
      text: "text-green-600",
      Icon: CheckCircle2,
    },
    application_rejected: {
      bg: "bg-red-100",
      text: "text-red-500",
      Icon: XCircle,
    },
    work_revision_requested: {
      bg: "bg-yellow-100",
      text: "text-yellow-600",
      Icon: FileEdit,
    },
    work_approved: {
      bg: "bg-green-100",
      text: "text-green-600",
      Icon: FileCheck,
    },
    system_message: {
      bg: "bg-gray-100",
      text: "text-gray-500",
      Icon: Info,
    },
    review_received_by_student: {
      bg: "bg-yellow-100",
      text: "text-yellow-600",
      Icon: Star,
    },
    review_received_by_owner: {
      bg: "bg-yellow-100",
      text: "text-yellow-600",
      Icon: Star,
    },
    application_withdrawn_by_student: {
      bg: "bg-gray-100",
      text: "text-gray-600",
      Icon: UserMinus,
    },
    application_withdrawn_by_employer: {
      bg: "bg-red-100",
      text: "text-red-500",
      Icon: Ban,
    },
  };

  const config = configs[type] ?? configs.system_message;
  const { Icon } = config;

  return (
    <div
      className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${config.bg}`}
    >
      <Icon className={`w-[18px] h-[18px] ${config.text}`} strokeWidth={2} />
    </div>
  );
};

// ─── Notification Item ────────────────────────────────────────────────────────
const NotificationItem: React.FC<{
  notification: Notification;
  onClick: (n: Notification) => void;
}> = ({ notification, onClick }) => (
  <div
    onClick={() => onClick(notification)}
    className={`flex gap-3 p-3 border-b border-gray-100 cursor-pointer hover:bg-gray-50 transition-colors ${
      !notification.isRead ? "bg-blue-50" : ""
    }`}
  >
    <NotificationIcon type={notification.type} />

    <div className="flex-1 min-w-0">
      <p
        className={`text-sm leading-snug ${!notification.isRead ? "font-semibold text-gray-900" : "text-gray-700"}`}
      >
        {notification.title}
      </p>
      <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">
        {notification.message}
      </p>
      <p className="text-xs text-gray-400 mt-1">
        {formatDistanceToNow(new Date(notification.createdAt), {
          addSuffix: true,
          locale: th,
        })}
      </p>
    </div>

    {/* Unread dot */}
    {!notification.isRead && (
      <div className="w-2 h-2 bg-primary-blue-500 rounded-full self-start mt-1.5 flex-shrink-0" />
    )}
  </div>
);

// ─── Main Panel ───────────────────────────────────────────────────────────────
const NotificationPanel: React.FC<NotificationPanelProps> = ({
  isOpen,
  onClose,
  notifications,
  unreadCount,
  loading,
  error,
  markAsRead,
  markAllAsRead,
  refreshNotifications,
  hasMore,
  loadMore,
}) => {
  const router = useRouter();

  // โหลดใหม่เมื่อเปิด panel
  useEffect(() => {
    if (isOpen) {
      refreshNotifications();
      if (window.innerWidth < 640) {
        document.body.style.overflow = "hidden";
      }
    } else {
      document.body.style.overflow = "auto";
    }
    return () => {
      document.body.style.overflow = "auto";
    };
  }, [isOpen]);

  const handleClick = async (notification: Notification) => {
    if (!notification.isRead) {
      await markAsRead(notification.id);
    }
    if (notification.link) {
      router.push(notification.link);
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop: มีผลเฉพาะ Mobile เพื่อให้ปิดง่ายและโฟกัสที่เนื้อหา */}
      <div 
        className="fixed inset-0 bg-black/10 backdrop-blur-[1px] z-[60] sm:hidden" 
        onClick={onClose} 
      />

      <div className={`
        /* 📱 Mobile Layout: เต็มจอ */
        fixed inset-0 h-screen w-screen z-[70] flex flex-col bg-white
        
        /* 💻 Desktop Layout (sm:): กลับไปเป็น Dropdown เหมือนเดิม */
        sm:absolute sm:inset-auto sm:right-0 sm:top-full sm:mt-2 
        sm:w-96 sm:h-auto sm:max-h-[80vh] sm:rounded-xl 
        sm:border sm:border-gray-200 sm:shadow-2xl sm:z-50
      `}>

        {/* Header */}
        <div className="flex items-center justify-between px-4 py-4 sm:py-3 border-b border-gray-100 bg-white sticky top-0 z-10">
          <div className="flex items-center gap-2">
            {/* ปุ่มปิดเฉพาะบน Mobile */}
            <button onClick={onClose} className="sm:hidden p-1 -ml-1 text-gray-400 active:scale-90 transition-transform">
              <ChevronLeft size={24} />
            </button>
            <h3 className="font-bold sm:font-semibold text-gray-900 text-lg sm:text-base">
              การแจ้งเตือน
              {unreadCount > 0 && (
                <span className="ml-2 text-sm text-primary-blue-500 font-normal">
                  ({unreadCount})
                </span>
              )}
            </h3>
          </div>
          
          {unreadCount > 0 && (
            <button
              onClick={markAllAsRead}
              className="text-sm sm:text-xs text-primary-blue-500 font-medium hover:text-primary-blue-600"
            >
              อ่านทั้งหมด
            </button>
          )}
        </div>

        {/* List Content */}
        <div className="overflow-y-auto flex-1 overscroll-contain">
          {loading && notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3">
              <Loading size="medium" color="primary" />
              <p className="text-sm text-gray-400">กำลังโหลด...</p>
            </div>
          ) : error ? (
            <div className="p-10 text-center">
              <p className="text-sm text-red-500 mb-3">{error}</p>
              <button onClick={refreshNotifications} className="text-sm text-primary-blue-500">ลองใหม่</button>
            </div>
          ) : notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-32 gap-3">
              <Bell className="w-8 h-8 text-gray-200" />
              <p className="text-gray-400 text-sm">ไม่มีการแจ้งเตือน</p>
            </div>
          ) : (
            <>
              {notifications.map((n) => (
                <NotificationItem
                  key={n.id}
                  notification={n}
                  onClick={handleClick}
                />
              ))}

              {hasMore && (
                <div className="p-4 text-center border-t border-gray-50">
                  <button
                    onClick={loadMore}
                    disabled={loading}
                    className="text-sm text-primary-blue-500 disabled:opacity-50"
                  >
                    {loading ? 'กำลังโหลด...' : 'ดูเพิ่มเติม'}
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </>
  );
};

export default NotificationPanel;
