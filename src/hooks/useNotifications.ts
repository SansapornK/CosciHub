// src/hooks/useNotifications.ts
import { useEffect, useState, useCallback, useRef } from 'react';
import { useSession } from 'next-auth/react';
import axios from 'axios';
import { usePusher } from '@/providers/PusherProvider';

export interface Notification {
  id:            string;
  type:          string;
  title:         string;
  message:       string;
  sender?: {
    id:              string;
    name:            string;
    profileImageUrl?: string;
  };
  jobId?:        string;
  applicationId?: string;
  isRead:        boolean;
  link?:         string;
  createdAt:     string;
}

interface UseNotificationsReturn {
  notifications:        Notification[];
  unreadCount:          number;
  loading:              boolean;
  error:                string | null;
  markAsRead:           (notificationId: string) => Promise<void>;
  markAllAsRead:        () => Promise<void>;
  refreshNotifications: () => Promise<void>;
  hasMore:              boolean;
  loadMore:             () => void;
}

export function useNotifications(): UseNotificationsReturn {
  const { data: session, status } = useSession();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount]     = useState(0);
  const [loading, setLoading]             = useState(false);
  const [error, setError]                 = useState<string | null>(null);
  const [page, setPage]                   = useState(1);
  const [hasMore, setHasMore]             = useState(true);
  const { subscribeToUserNotifications }  = usePusher();

  // ใช้ ref ป้องกัน subscribe ซ้ำ
  const isSubscribed = useRef(false);

  // ─── Fetch ────────────────────────────────────────────────────────────────
  const fetchNotifications = useCallback(async (pageNum: number = 1) => {
    if (status !== 'authenticated') return;

    setLoading(true);
    setError(null);

    try {
      const response = await axios.get('/api/notifications', {
        params: { page: pageNum, limit: 10 },
      });

      const { notifications: newNotifs, pagination } = response.data;

      if (pageNum === 1) {
        setNotifications(newNotifs);
      } else {
        setNotifications((prev) => [...prev, ...newNotifs]);
      }

      setUnreadCount(pagination.unreadCount);
      setHasMore(pageNum < pagination.totalPages);
    } catch (err) {
      console.error('Error fetching notifications:', err);
      setError('ไม่สามารถโหลดการแจ้งเตือนได้');
    } finally {
      setLoading(false);
    }
  }, [status]);

  // ─── Refresh (reset กลับหน้า 1) ──────────────────────────────────────────
  const refreshNotifications = useCallback(async () => {
    setPage(1);
    await fetchNotifications(1);
  }, [fetchNotifications]);

  // ─── Load More ────────────────────────────────────────────────────────────
  const loadMore = useCallback(() => {
    if (!loading && hasMore) {
      const nextPage = page + 1;
      setPage(nextPage);
      fetchNotifications(nextPage);
    }
  }, [loading, hasMore, page, fetchNotifications]);

  // ─── Mark as Read ─────────────────────────────────────────────────────────
  const markAsRead = useCallback(async (notificationId: string) => {
    try {
      await axios.post(`/api/notifications/${notificationId}/read`);
      setNotifications((prev) =>
        prev.map((n) => (n.id === notificationId ? { ...n, isRead: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (err) {
      console.error('Error marking as read:', err);
    }
  }, []);

  // ─── Mark All as Read ─────────────────────────────────────────────────────
  const markAllAsRead = useCallback(async () => {
    try {
      await axios.patch('/api/notifications', { markAll: true });
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error('Error marking all as read:', err);
    }
  }, []);

  // ─── Real-time via Pusher ─────────────────────────────────────────────────
  useEffect(() => {
    if (status !== 'authenticated' || !session?.user?.id || isSubscribed.current) return;

    isSubscribed.current = true;

    const unsubscribe = subscribeToUserNotifications(
      session.user.id,
      (data: any) => {
        if (!data.notification) return;

        const newNotif: Notification = data.notification;

        // เพิ่มเข้า list และ +1 unread
        setNotifications((prev) => {
          // ป้องกัน duplicate
          const exists = prev.find((n) => n.id === newNotif.id);
          if (exists) return prev;
          return [newNotif, ...prev];
        });
        setUnreadCount((prev) => prev + 1);
      }
    );

    return () => {
      unsubscribe();
      isSubscribed.current = false;
    };
  }, [status, session?.user?.id, subscribeToUserNotifications]);

  // ─── Initial Fetch ────────────────────────────────────────────────────────
  useEffect(() => {
    if (status === 'authenticated') {
      fetchNotifications(1);
    } else if (status === 'unauthenticated') {
      setNotifications([]);
      setUnreadCount(0);
    }
  }, [status]);

  return {
    notifications,
    unreadCount,
    loading,
    error,
    markAsRead,
    markAllAsRead,
    refreshNotifications,
    hasMore,
    loadMore,
  };
}