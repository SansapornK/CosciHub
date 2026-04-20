// src/app/components/notifications/NotificationPanel.tsx
'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { formatDistanceToNow } from 'date-fns';
import { th } from 'date-fns/locale';
import Loading from '../common/Loading';
import { useNotifications, Notification } from '@/hooks/useNotifications';
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
} from 'lucide-react';

interface NotificationPanelProps {
  isOpen:               boolean;
  onClose:              () => void;
  // รับจาก Navbar แทน
  notifications:        Notification[];
  unreadCount:          number;
  loading:              boolean;
  error:                string | null;
  markAsRead:           (id: string) => Promise<void>;
  markAllAsRead:        () => Promise<void>;
  refreshNotifications: () => Promise<void>;
  hasMore:              boolean;
  loadMore:             () => void;
}

// ─── Icon ตาม type ────────────────────────────────────────────────────────────
const NotificationIcon: React.FC<{ type: string }> = ({ type }) => {
  const configs: Record<string, { bg: string; text: string; Icon: LucideIcon }> = {
    job_new_application: {
      bg: 'bg-purple-100', text: 'text-purple-600', Icon: UserPlus,
    },
    job_work_started: {
      bg: 'bg-blue-100', text: 'text-blue-600', Icon: Zap,
    },
    job_progress_updated: {
      bg: 'bg-blue-100', text: 'text-blue-600', Icon: BarChart3,
    },
    job_work_submitted: {
      bg: 'bg-orange-100', text: 'text-orange-600', Icon: FileCheck,
    },
    application_accepted: {
      bg: 'bg-green-100', text: 'text-green-600', Icon: CheckCircle2,
    },
    application_rejected: {
      bg: 'bg-red-100', text: 'text-red-500', Icon: XCircle,
    },
    work_revision_requested: {
      bg: 'bg-yellow-100', text: 'text-yellow-600', Icon: FileEdit,
    },
    work_approved: {
      bg: 'bg-green-100', text: 'text-green-600', Icon: FileCheck,
    },
    system_message: {
      bg: 'bg-gray-100', text: 'text-gray-500', Icon: Info,
    },
    review_received_by_student: {
      bg: 'bg-yellow-100', text: 'text-yellow-600', Icon: Star,
    },
    review_received_by_owner: {
      bg: 'bg-yellow-100', text: 'text-yellow-600', Icon: Star,
    },
    application_withdrawn_by_student: {
      bg: 'bg-gray-100', text: 'text-gray-600', Icon: UserMinus,
    },
    application_withdrawn_by_employer: {
      bg: 'bg-red-100', text: 'text-red-500', Icon: Ban,
    },
  };

  const config = configs[type] ?? configs.system_message;
  const { Icon } = config;

  return (
    <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${config.bg}`}>
      <Icon className={`w-[18px] h-[18px] ${config.text}`} strokeWidth={2} />
    </div>
  );
};

// ─── Notification Item ────────────────────────────────────────────────────────
const NotificationItem: React.FC<{
  notification: Notification;
  onClick:      (n: Notification) => void;
}> = ({ notification, onClick }) => (
  <div
    onClick={() => onClick(notification)}
    className={`flex gap-3 p-3 border-b border-gray-100 cursor-pointer hover:bg-gray-50 transition-colors ${
      !notification.isRead ? 'bg-blue-50' : ''
    }`}
  >
    <NotificationIcon type={notification.type} />

    <div className="flex-1 min-w-0">
      <p className={`text-sm leading-snug ${!notification.isRead ? 'font-semibold text-gray-900' : 'text-gray-700'}`}>
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
    if (isOpen) refreshNotifications();
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
    <div className="absolute right-0 top-full mt-2 w-96 max-h-[80vh] bg-white rounded-xl shadow-xl border border-gray-200 overflow-hidden z-50 flex flex-col">

      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 bg-white sticky top-0 z-10">
        <h3 className="font-semibold text-gray-900">
          การแจ้งเตือน
          {unreadCount > 0 && (
            <span className="ml-2 text-sm text-primary-blue-500 font-normal">
              ({unreadCount} ใหม่)
            </span>
          )}
        </h3>
        {unreadCount > 0 && (
          <button
            onClick={markAllAsRead}
            className="text-xs text-primary-blue-500 hover:text-primary-blue-600 hover:underline"
          >
            อ่านทั้งหมด
          </button>
        )}
      </div>

      {/* Content */}
      <div className="overflow-y-auto flex-1">
        {loading && notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 gap-3">
            <Loading size="medium" color="primary" />
            <p className="text-sm text-gray-400">กำลังโหลด...</p>
          </div>
        ) : error ? (
          <div className="p-6 text-center">
            <p className="text-sm text-red-500 mb-3">{error}</p>
            <button
              onClick={refreshNotifications}
              className="text-sm text-primary-blue-500 hover:underline"
            >
              ลองใหม่
            </button>
          </div>
        ) : notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 gap-3">
            <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center">
              <Bell className="w-6 h-6 text-gray-400" strokeWidth={1.8} />
            </div>
            <p className="text-sm text-gray-500">ไม่มีการแจ้งเตือน</p>
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

            {/* Load More */}
            {hasMore && (
              <div className="p-3 text-center border-t border-gray-100">
                <button
                  onClick={loadMore}
                  disabled={loading}
                  className="text-sm text-primary-blue-500 hover:underline disabled:opacity-50"
                >
                  {loading ? 'กำลังโหลด...' : 'โหลดเพิ่มเติม'}
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default NotificationPanel;