// src/app/components/notifications/NotificationPanel.tsx
'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { formatDistanceToNow } from 'date-fns';
import { th } from 'date-fns/locale';
import Loading from '../common/Loading';
import { useNotifications, Notification } from '@/hooks/useNotifications';

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
  const configs: Record<string, { bg: string; text: string; icon: React.ReactNode }> = {
    job_new_application: {
      bg: 'bg-purple-100', text: 'text-purple-600',
      icon: <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/>,
    },
    job_work_started: {
      bg: 'bg-blue-100', text: 'text-blue-600',
      icon: <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z"/>,
    },
    job_progress_updated: {
      bg: 'bg-blue-100', text: 'text-blue-600',
      icon: <><path d="M18 20V10"/><path d="M12 20V4"/><path d="M6 20v-6"/></>,
    },
    job_work_submitted: {
      bg: 'bg-orange-100', text: 'text-orange-600',
      icon: <><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M9 15l3 3 5-5"/></>,
    },
    application_accepted: {
      bg: 'bg-green-100', text: 'text-green-600',
      icon: <><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></>,
    },
    application_rejected: {
      bg: 'bg-red-100', text: 'text-red-500',
      icon: <><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></>,
    },
    work_revision_requested: {
      bg: 'bg-yellow-100', text: 'text-yellow-600',
      icon: <><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></>,
    },
    work_approved: {
      bg: 'bg-green-100', text: 'text-green-600',
      icon: <><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M9 15l3 3 5-5"/></>,
    },
    system_message: {
      bg: 'bg-gray-100', text: 'text-gray-500',
      icon: <><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></>,
    },
    review_received_by_student: {
      bg: 'bg-yellow-100', text: 'text-yellow-600',
      icon: (
        <>
          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
        </>
      ),
    },
    review_received_by_owner: {
      bg: 'bg-yellow-100', text: 'text-yellow-600',
      icon: (
        <>
          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
        </>
      ),
    },
  };

  const config = configs[type] ?? configs.system_message;

  return (
    <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${config.bg}`}>
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width={18}
        height={18}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
        className={config.text}
      >
        {config.icon}
      </svg>
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
              <svg xmlns="http://www.w3.org/2000/svg" width={24} height={24} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="text-gray-400">
                <path d="M18 8C18 6.4087 17.3679 4.88258 16.2426 3.75736C15.1174 2.63214 13.5913 2 12 2C10.4087 2 8.88258 2.63214 7.75736 3.75736C6.63214 4.88258 6 6.4087 6 8C6 15 3 17 3 17H21C21 17 18 15 18 8Z"/>
                <path d="M13.73 21C13.5542 21.3031 13.3019 21.5547 12.9982 21.7295C12.6946 21.9044 12.3504 21.9965 12 21.9965C11.6496 21.9965 11.3054 21.9044 11.0018 21.7295C10.6982 21.5547 10.4458 21.3031 10.27 21"/>
              </svg>
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