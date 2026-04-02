// src/app/api/notifications/route.ts
import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/libs/mongodb';
import Notification from '@/models/Notification';
import User from '@/models/User';
import mongoose from 'mongoose';
import { markAllNotificationsAsRead } from '@/utils/notificationUtils';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

// ─── Helper: ดึง userId จาก session ──────────────────────────────────────────
async function getUserIdFromSession(session: any) {
  if (!session?.user?.email) return null;
  await connectToDatabase();
  const user = await User.findOne({ email: session.user.email }).exec();
  return user?._id ?? null;
}

// ─── GET: ดึงรายการ Notification ─────────────────────────────────────────────
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const userId = await getUserIdFromSession(session);
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const url = new URL(req.url);
    const limit     = parseInt(url.searchParams.get('limit') || '10');
    const page      = parseInt(url.searchParams.get('page')  || '1');
    const skip      = (page - 1) * limit;
    const unreadOnly = url.searchParams.get('unread') === 'true';

    const query: any = { recipientId: userId };
    if (unreadOnly) query.isRead = false;

    const [notifications, totalCount, unreadCount] = await Promise.all([
      Notification.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('senderId', 'name profileImageUrl')
        .lean(),
      Notification.countDocuments(query),
      Notification.countDocuments({ recipientId: userId, isRead: false }),
    ]);

    const formatted = notifications.map((n) => ({
      id:            n._id.toString(),
      type:          n.type,
      title:         n.title,
      message:       n.message,
      sender:        n.senderId && typeof n.senderId !== 'string' ? {
        id:              (n.senderId as any)._id.toString(),
        name:            (n.senderId as any).name,
        profileImageUrl: (n.senderId as any).profileImageUrl,
      } : null,
      jobId:         n.jobId?.toString()         ?? null,
      applicationId: n.applicationId?.toString() ?? null,
      isRead:        n.isRead,
      link:          n.link,
      createdAt:     n.createdAt,
    }));

    return NextResponse.json({
      notifications: formatted,
      pagination: {
        totalCount,
        unreadCount,
        page,
        limit,
        totalPages: Math.ceil(totalCount / limit),
      },
    });
  } catch (error) {
    console.error('GET /notifications error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// ─── PATCH: markAllAsRead ─────────────────────────────────────────────────────
export async function PATCH(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const userId = await getUserIdFromSession(session);
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const data = await req.json();

    // Mark ทีละรายการ
    if (data.notificationId) {
      if (!mongoose.Types.ObjectId.isValid(data.notificationId)) {
        return NextResponse.json({ error: 'Invalid notification ID' }, { status: 400 });
      }
      const notification = await Notification.findOne({
        _id:         new mongoose.Types.ObjectId(data.notificationId),
        recipientId: userId,
      });
      if (!notification) {
        return NextResponse.json({ error: 'Notification not found' }, { status: 404 });
      }
      notification.isRead = true;
      await notification.save();
      return NextResponse.json({ success: true, notificationId: data.notificationId });
    }

    // Mark ทั้งหมด
    if (data.markAll) {
      await markAllNotificationsAsRead(userId.toString());
      return NextResponse.json({ success: true, message: 'All notifications marked as read' });
    }

    return NextResponse.json({ error: 'Missing parameters' }, { status: 400 });
  } catch (error) {
    console.error('PATCH /notifications error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// ─── DELETE: ลบ Notification ─────────────────────────────────────────────────
export async function DELETE(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const userId = await getUserIdFromSession(session);
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const url = new URL(req.url);
    const notificationId = url.searchParams.get('id');

    if (!notificationId || !mongoose.Types.ObjectId.isValid(notificationId)) {
      return NextResponse.json({ error: 'Invalid notification ID' }, { status: 400 });
    }

    const notification = await Notification.findOne({
      _id:         new mongoose.Types.ObjectId(notificationId),
      recipientId: userId,
    });
    if (!notification) {
      return NextResponse.json({ error: 'Notification not found' }, { status: 404 });
    }

    await Notification.findByIdAndDelete(notificationId);
    return NextResponse.json({ success: true, notificationId });
  } catch (error) {
    console.error('DELETE /notifications error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}