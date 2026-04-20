// src/utils/notificationUtils.ts
import Notification from '@/models/Notification';
import User from '@/models/User';
import Job from '@/models/Job';
import Application from '@/models/Application';
import mongoose from 'mongoose';
import { triggerUserNotification } from '@/libs/pusher';

// ─── Base Function ────────────────────────────────────────────────────────────
export async function createNotification(data: {
  recipientId: string;
  senderId?: string;
  type: string;
  title: string;
  message: string;
  jobId?: string;
  applicationId?: string;
  link?: string;
}) {
  try {
    const notification = new Notification({
      recipientId:   new mongoose.Types.ObjectId(data.recipientId),
      senderId:      data.senderId ? new mongoose.Types.ObjectId(data.senderId) : undefined,
      jobId:         data.jobId ? new mongoose.Types.ObjectId(data.jobId) : undefined,
      applicationId: data.applicationId ? new mongoose.Types.ObjectId(data.applicationId) : undefined,
      type:          data.type,
      title:         data.title,
      message:       data.message,
      isRead:        false,
      link:          data.link,
      createdAt:     new Date(),
    });

    await notification.save();

    // ดึงข้อมูล sender สำหรับส่งไปกับ Pusher
    let senderInfo = null;
    if (data.senderId) {
      const sender = await User.findById(data.senderId)
        .select('name profileImageUrl')
        .lean();
      if (sender) {
        senderInfo = {
          id:              sender._id.toString(),
          name:            sender.name,
          profileImageUrl: sender.profileImageUrl,
        };
      }
    }

    // ส่ง Real-time via Pusher
    await triggerUserNotification(data.recipientId, {
      id:            notification._id.toString(),
      type:          data.type,
      title:         data.title,
      message:       data.message,
      sender:        senderInfo,
      link:          data.link,
      applicationId: data.applicationId,
      jobId:         data.jobId,
      isRead:        false,
      createdAt:     notification.createdAt,
    });

    return { success: true, notificationId: notification._id.toString() };
  } catch (error) {
    console.error('Error creating notification:', error);
    return { success: false, error: 'Failed to create notification' };
  }
}

// ─── Helper: ดึงข้อมูลที่ใช้บ่อย ─────────────────────────────────────────────
async function getJobAndUsers(jobId: string, applicantId: string) {
  const [job, applicant] = await Promise.all([
    Job.findById(jobId).lean(),
    User.findById(applicantId).select('name').lean(),
  ]);
  
  if (!job || !applicant) return null;

  // ดึงข้อมูล owner จาก User collection (job.owner เป็น String ชื่อ)
  const owner = await User.findOne({ name: job.owner }).select('_id name').lean();

  if (!owner) return null;

  return { job, applicant, owner };
}

// ─── 1. แจ้งเจ้าของ: มีนิสิตสมัครงานใหม่ ─────────────────────────────────────
export async function notifyNewApplication(
  jobId: string,
  applicantId: string,
  applicationId: string
) {
  try {
    const data = await getJobAndUsers(jobId, applicantId);
    if (!data) return { success: false, error: 'Data not found' };
    const { job, applicant, owner } = data;

    return await createNotification({
      recipientId:   owner._id.toString(),
      senderId:      applicantId,
      type:          'job_new_application',
      title:         'มีนิสิตสมัครงานใหม่',
      message:       `${applicant.name} สมัครงาน "${job.title}"`,
      jobId,
      applicationId,
      link:          `/manage-projects/${jobId}/applicants`,
    });
  } catch (error) {
    console.error('notifyNewApplication error:', error);
    return { success: false };
  }
}

// ─── 2. แจ้งนิสิต: ใบสมัครได้รับการยอมรับ ────────────────────────────────────
export async function notifyApplicationAccepted(
  jobId: string,
  applicantId: string,
  applicationId: string
) {
  try {
    const data = await getJobAndUsers(jobId, applicantId);
    if (!data) return { success: false, error: 'Data not found' };
    const { job, owner } = data;

    return await createNotification({
      recipientId:   applicantId,
      senderId:      owner._id.toString(),
      type:          'application_accepted',
      title:         'ใบสมัครได้รับการยอมรับ',
      message:       `คุณผ่านการคัดเลือกงาน "${job.title}" แล้ว กดเริ่มงานได้เลย!`,
      jobId,
      applicationId,
      link:          `/manage-projects`,
    });
  } catch (error) {
    console.error('notifyApplicationAccepted error:', error);
    return { success: false };
  }
}

// ─── 3. แจ้งนิสิต: ใบสมัครถูกปฏิเสธ ─────────────────────────────────────────
export async function notifyApplicationRejected(
  jobId: string,
  applicantId: string,
  applicationId: string
) {
  try {
    const data = await getJobAndUsers(jobId, applicantId);
    if (!data) return { success: false, error: 'Data not found' };
    const { job, owner } = data;

    return await createNotification({
      recipientId:   applicantId,
      senderId:      owner._id.toString(),
      type:          'application_rejected',
      title:         'ใบสมัครถูกปฏิเสธ',
      message:       `ขออภัย ใบสมัครงาน "${job.title}" ของคุณไม่ผ่านการคัดเลือก`,
      jobId,
      applicationId,
      link:          `/find-job`,
    });
  } catch (error) {
    console.error('notifyApplicationRejected error:', error);
    return { success: false };
  }
}

// ─── 4. แจ้งเจ้าของ: นิสิตกดเริ่มงานแล้ว ────────────────────────────────────
export async function notifyWorkStarted(
  jobId: string,
  applicantId: string,
  applicationId: string
) {
  try {
    const data = await getJobAndUsers(jobId, applicantId);
    if (!data) return { success: false, error: 'Data not found' };
    const { job, applicant, owner } = data;

    return await createNotification({
      recipientId:   owner._id.toString(),
      senderId:      applicantId,
      type:          'job_work_started',
      title:         'นิสิตเริ่มทำงานแล้ว',
      message:       `${applicant.name} เริ่มทำงาน "${job.title}" แล้ว`,
      jobId,
      applicationId,
      link:          `/manage-projects/${jobId}/work/${applicationId}`,
    });
  } catch (error) {
    console.error('notifyWorkStarted error:', error);
    return { success: false };
  }
}

// ─── 5. แจ้งเจ้าของ: นิสิตส่งงานแล้ว ────────────────────────────────────────
export async function notifyWorkSubmitted(
  jobId: string,
  applicantId: string,
  applicationId: string
) {
  try {
    const data = await getJobAndUsers(jobId, applicantId);
    if (!data) return { success: false, error: 'Data not found' };
    const { job, applicant, owner } = data;

    return await createNotification({
      recipientId:   owner._id.toString(),
      senderId:      applicantId,
      type:          'job_work_submitted',
      title:         'นิสิตส่งงานแล้ว รอตรวจสอบ',
      message:       `${applicant.name} ส่งงาน "${job.title}" แล้ว กรุณาตรวจสอบและให้ feedback`,
      jobId,
      applicationId,
      link:          `/manage-projects/${jobId}/work/${applicationId}`,
    });
  } catch (error) {
    console.error('notifyWorkSubmitted error:', error);
    return { success: false };
  }
}

// ─── 6. แจ้งนิสิต: เจ้าของขอแก้ไขงาน ───────────────────────────────────────
export async function notifyRevisionRequested(
  jobId: string,
  applicantId: string,
  applicationId: string
) {
  try {
    const data = await getJobAndUsers(jobId, applicantId);
    if (!data) return { success: false, error: 'Data not found' };
    const { job, owner } = data;

    return await createNotification({
      recipientId:   applicantId,
      senderId:      owner._id.toString(),
      type:          'work_revision_requested',
      title:         'มีการขอแก้ไขงาน',
      message:       `${owner.name} ขอให้แก้ไขงาน "${job.title}" กรุณาตรวจสอบ feedback`,
      jobId,
      applicationId,
      link:          `/manage-projects/${jobId}/work/${applicationId}`,
    });
  } catch (error) {
    console.error('notifyRevisionRequested error:', error);
    return { success: false };
  }
}

// ─── 7. แจ้งนิสิต: งานได้รับการอนุมัติ ──────────────────────────────────────
export async function notifyWorkApproved(
  jobId: string,
  applicantId: string,
  applicationId: string
) {
  try {
    const data = await getJobAndUsers(jobId, applicantId);
    if (!data) return { success: false, error: 'Data not found' };
    const { job, owner } = data;

    return await createNotification({
      recipientId:   applicantId,
      senderId:      owner._id.toString(),
      type:          'work_approved',
      title:         'งานของคุณผ่านการตรวจสอบแล้ว! 🎉',
      message:       `${owner.name} ยืนยันว่างาน "${job.title}" เสร็จสมบูรณ์แล้ว ขอบคุณสำหรับการทำงาน`,
      jobId,
      applicationId,
      link:          `/manage-projects`,
    });
  } catch (error) {
    console.error('notifyWorkApproved error:', error);
    return { success: false };
  }
}

// ─── 8. แจ้งเจ้าของ: นิสิตอัพเดท progress ───────────────────────────────────
export async function notifyProgressUpdated(
  jobId: string,
  applicantId: string,
  applicationId: string,
  progress: number
) {
  try {
    // ไม่แจ้งทุก % — แจ้งเฉพาะ milestone สำคัญ
    const milestones = [25, 50, 75, 100];
    if (!milestones.includes(progress)) return { success: true, skipped: true };
    console.log('[notifyProgressUpdated] called with:', {
      jobId,
      applicantId,
      applicationId,
      progress,
    });

    const data = await getJobAndUsers(jobId, applicantId);
    console.log('[notifyProgressUpdated] getJobAndUsers result:', data);

    if (!data) return { success: false, error: 'Data not found' };
    const { job, applicant, owner } = data;

    return await createNotification({
      recipientId:   owner._id.toString(),
      senderId:      applicantId,
      type:          'job_progress_updated',
      title:         `ความคืบหน้างานอยู่ที่ ${progress}%`,
      message:       `${applicant.name} อัพเดทความคืบหน้างาน "${job.title}" เป็น ${progress}%`,
      jobId,
      applicationId,
      link:          `/manage-projects/${jobId}/work/${applicationId}`,
    });
  } catch (error) {
    console.error('notifyProgressUpdated error:', error);
    return { success: false };
  }
}

// ─── 9. แจ้งนิสิต: ผู้ว่าจ้างให้รีวิวแล้ว ──────────────────────────────────
export async function notifyStudentReviewReceived(
  jobId: string,
  applicantId: string,
  applicationId: string,
) {
  try {
    const data = await getJobAndUsers(jobId, applicantId);
    if (!data) return { success: false, error: 'Data not found' };
    const { job, owner } = data;

    return await createNotification({
      recipientId:   applicantId,
      senderId:      owner._id.toString(),
      type:          'review_received_by_student',
      title:         'คุณได้รับรีวิวจากผู้ว่าจ้าง! 🎉',
      message:       `งาน "${job.title} ผู้ว่าจ้างรีวิวให้คุณเรียบร้อยแล้ว"`,
      jobId,
      applicationId,
      link:          `/manage-projects/${jobId}/work/${applicationId}`,
    });
  } catch (error) {
    console.error('notifyStudentReviewReceived error:', error);
    return { success: false };
  }
}

// ─── 10. แจ้งผู้ว่าจ้าง: นิสิตให้รีวิวแล้ว ──────────────────────────────────
export async function notifyOwnerReviewReceived(
  jobId: string,
  applicantId: string,
  applicationId: string,
) {
  try {
    const data = await getJobAndUsers(jobId, applicantId);
    if (!data) return { success: false, error: 'Data not found' };
    const { job, applicant, owner } = data;

    return await createNotification({
      recipientId:   owner._id.toString(),
      senderId:      applicantId,
      type:          'review_received_by_owner',
      title:         'คุณได้รับรีวิวจากนิสิต! 🎉',
      message:       `งาน "${job.title}" นิสิตรีวิวให้คุณเรียบร้อยแล้ว`,
      jobId,
      applicationId,
      link:          `/manage-projects/${jobId}/overview`,
    });
  } catch (error) {
    console.error('notifyOwnerReviewReceived error:', error);
    return { success: false };
  }
}

// ─── 11. แจ้งเจ้าของ: นิสิตยกเลิกใบสมัคร ─────────────────────────────────────
export async function notifyApplicationWithdrawnByStudent(
  jobId: string,
  applicantId: string,
  applicationId: string
) {
  console.log('[notifyApplicationWithdrawnByStudent] called with:', { jobId, applicantId, applicationId });
  try {
    const data = await getJobAndUsers(jobId, applicantId);
    console.log('[notifyApplicationWithdrawnByStudent] getJobAndUsers result:', data ? 'found' : 'null');
    if (!data) return { success: false, error: 'Data not found' };
    const { job, applicant, owner } = data;

    console.log('[notifyApplicationWithdrawnByStudent] Creating notification for owner:', owner._id.toString());
    const result = await createNotification({
      recipientId:   owner._id.toString(),
      senderId:      applicantId,
      type:          'application_withdrawn_by_student',
      title:         'นิสิตยกเลิกใบสมัคร',
      message:       `${applicant.name} ยกเลิกใบสมัครงาน "${job.title}"`,
      jobId,
      applicationId,
      link:          `/manage-projects/${jobId}/applicants`,
    });
    console.log('[notifyApplicationWithdrawnByStudent] result:', result);
    return result;
  } catch (error) {
    console.error('notifyApplicationWithdrawnByStudent error:', error);
    return { success: false };
  }
}

// ─── 12. แจ้งนิสิต: เจ้าของยกเลิกใบสมัคร ─────────────────────────────────────
export async function notifyApplicationWithdrawnByEmployer(
  jobId: string,
  applicantId: string,
  applicationId: string
) {
  console.log('[notifyApplicationWithdrawnByEmployer] called with:', { jobId, applicantId, applicationId });
  try {
    const data = await getJobAndUsers(jobId, applicantId);
    console.log('[notifyApplicationWithdrawnByEmployer] getJobAndUsers result:', data ? 'found' : 'null');
    if (!data) return { success: false, error: 'Data not found' };
    const { job, owner } = data;

    console.log('[notifyApplicationWithdrawnByEmployer] Creating notification for applicant:', applicantId);
    const result = await createNotification({
      recipientId:   applicantId,
      senderId:      owner._id.toString(),
      type:          'application_withdrawn_by_employer',
      title:         'ใบสมัครถูกยกเลิก',
      message:       `${owner.name} ยกเลิกใบสมัครของคุณสำหรับงาน "${job.title}"`,
      jobId,
      applicationId,
      link:          `/find-job`,
    });
    console.log('[notifyApplicationWithdrawnByEmployer] result:', result);
    return result;
  } catch (error) {
    console.error('notifyApplicationWithdrawnByEmployer error:', error);
    return { success: false };
  }
}

// ─── Mark as Read ─────────────────────────────────────────────────────────────
export async function markNotificationAsRead(notificationId: string) {
  try {
    await Notification.findByIdAndUpdate(notificationId, { isRead: true });
    return { success: true };
  } catch (error) {
    return { success: false };
  }
}

export async function markAllNotificationsAsRead(userId: string) {
  try {
    await Notification.updateMany(
      { recipientId: new mongoose.Types.ObjectId(userId), isRead: false },
      { isRead: true }
    );
    return { success: true };
  } catch (error) {
    return { success: false };
  }
}