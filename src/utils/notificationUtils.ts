// // src/utils/notificationUtils.ts
// import Notification from '@/models/Notification';
// import User from '@/models/User';
// import Project from '@/models/Project';
// import mongoose from 'mongoose';
// import pusherServer, { 
//   triggerUserNotification 
// } from '@/libs/pusher';

// /**
//  * Creates a new notification and sends a real-time update via Pusher
//  */
// export async function createNotification(data: {
//   recipientId: string;
//   senderId?: string;
//   type: string;
//   title: string;
//   message: string;
//   projectId?: string;
//   link?: string;
// }) {
//   try {
//     // Convert string IDs to ObjectIds
//     const notification = new Notification({
//       recipientId: new mongoose.Types.ObjectId(data.recipientId),
//       senderId: data.senderId ? new mongoose.Types.ObjectId(data.senderId) : undefined,
//       projectId: data.projectId ? new mongoose.Types.ObjectId(data.projectId) : undefined,
//       type: data.type,
//       title: data.title,
//       message: data.message,
//       isRead: false,
//       link: data.link,
//       createdAt: new Date()
//     });

//     // Save to database
//     await notification.save();

//     // Get sender information if provided
//     let senderInfo = null;
//     if (data.senderId) {
//       const sender = await User.findById(data.senderId).select('name profileImageUrl').lean();
//       if (sender) {
//         senderInfo = {
//           id: sender._id.toString(),
//           name: sender.name,
//           profileImageUrl: sender.profileImageUrl
//         };
//       }
//     }

//     // Trigger real-time notification via Pusher
//     await triggerUserNotification(data.recipientId, {
//       id: notification._id.toString(),
//       type: data.type,
//       title: data.title,
//       message: data.message,
//       sender: senderInfo,
//       link: data.link,
//       createdAt: notification.createdAt
//     });

//     return {
//       success: true,
//       notification: {
//         id: notification._id.toString(),
//         ...data,
//         createdAt: notification.createdAt
//       }
//     };
//   } catch (error) {
//     console.error('Error creating notification:', error);
//     return {
//       success: false,
//       error: 'Failed to create notification'
//     };
//   }
// }

// /**
//  * Creates project request notification (when freelancer requests to join a project)
//  */
// export async function createProjectRequestNotification(projectId: string, freelancerId: string) {
//   try {
//     // Get project and freelancer details
//     const [project, freelancer] = await Promise.all([
//       Project.findById(projectId).lean(),
//       User.findById(freelancerId).select('name').lean()
//     ]);

//     if (!project || !freelancer) {
//       return { success: false, error: 'Project or freelancer not found' };
//     }

//     // Notification to project owner
//     return await createNotification({
//       recipientId: project.owner.toString(),
//       senderId: freelancerId,
//       type: 'project_request',
//       title: 'คำขอร่วมงานใหม่',
//       message: `${freelancer.name} ส่งคำขอร่วมงานในโปรเจกต์ "${project.title}"`,
//       projectId: projectId,
//       link: `/project/${projectId}`
//     });
//   } catch (error) {
//     console.error('Error creating project request notification:', error);
//     return { success: false, error: 'Failed to create notification' };
//   }
// }

// /**
//  * Creates project invitation notification (when project owner invites a freelancer)
//  */
// export async function createProjectInvitationNotification(projectId: string, freelancerId: string) {
//   try {
//     // Get project and owner details
//     const project = await Project.findById(projectId).populate('owner', 'name').lean();

//     if (!project) {
//       return { success: false, error: 'Project not found' };
//     }

//     // Notification to freelancer
//     return await createNotification({
//       recipientId: freelancerId,
//       senderId: project.owner._id.toString(),
//       type: 'project_invitation',
//       title: 'คำเชิญร่วมงานใหม่',
//       message: `${project.ownerName} เชิญคุณร่วมงานในโปรเจกต์ "${project.title}"`,
//       projectId: projectId,
//       link: `/project/${projectId}`
//     });
//   } catch (error) {
//     console.error('Error creating project invitation notification:', error);
//     return { success: false, error: 'Failed to create notification' };
//   }
// }

// /**
//  * Creates notification when a project request is accepted/rejected
//  */
// export async function createProjectResponseNotification(
//   projectId: string, 
//   freelancerId: string, 
//   isAccepted: boolean
// ) {
//   try {
//     // Get project details
//     const project = await Project.findById(projectId).lean();

//     if (!project) {
//       return { success: false, error: 'Project not found' };
//     }

//     // Notification to freelancer
//     return await createNotification({
//       recipientId: freelancerId,
//       senderId: project.owner.toString(),
//       type: isAccepted ? 'project_accepted' : 'project_rejected',
//       title: isAccepted ? 'คำขอร่วมงานได้รับการยอมรับ' : 'คำขอร่วมงานถูกปฏิเสธ',
//       message: isAccepted 
//         ? `คำขอร่วมงานของคุณในโปรเจกต์ "${project.title}" ได้รับการยอมรับ`
//         : `คำขอร่วมงานของคุณในโปรเจกต์ "${project.title}" ถูกปฏิเสธ`,
//       projectId: projectId,
//       link: isAccepted ? `/project/${projectId}` : `/project-board`
//     });
//   } catch (error) {
//     console.error('Error creating project response notification:', error);
//     return { success: false, error: 'Failed to create notification' };
//   }
// }

// // สำหรับเมื่อฟรีแลนซ์ตอบรับโปรเจกต์
// export async function createFreelancerResponseNotification(
//   projectId: string, 
//   freelancerId: string, 
//   isAccepted: boolean
// ) {
//   try {
//     // Get project and freelancer details
//     const [project, freelancer] = await Promise.all([
//       Project.findById(projectId).lean(),
//       User.findById(freelancerId).select('name').lean()
//     ]);

//     if (!project || !freelancer) {
//       return { success: false, error: 'Project or freelancer not found' };
//     }

//     // Notification to project owner
//     return await createNotification({
//       recipientId: project.owner.toString(),
//       senderId: freelancerId,
//       type: isAccepted ? 'project_accepted' : 'project_rejected',
//       title: isAccepted ? 'คำขอร่วมงานได้รับการตอบรับ' : 'คำขอร่วมงานถูกปฏิเสธ',
//       message: isAccepted 
//         // ข้อความใหม่สำหรับการตอบรับโปรเจกต์
//         ? `${freelancer.name} ได้ตอบรับโปรเจกต์ "${project.title}" ของคุณแล้ว และพร้อมเริ่มทำงาน`
//         : `${freelancer.name} ได้ปฏิเสธคำขอร่วมงาน "${project.title}" ของคุณ กรุณาเลือกฟรีแลนซ์ท่านอื่น`,
//       projectId: projectId,
//       link: `/project/${projectId}`
//     });
//   } catch (error) {
//     console.error('Error creating freelancer response notification:', error);
//     return { success: false, error: 'Failed to create notification' };
//   }
// }

// // สำหรับการเปลี่ยนสถานะโปรเจกต์
// export async function createProjectStatusChangeNotification(
//   projectId: string, 
//   status: string, 
//   recipientId: string,
//   senderId: string
// ) {
//   try {
//     // Get project details and sender details (ซึ่งอาจจะเป็นฟรีแลนซ์หรือเจ้าของโปรเจกต์)
//     const [project, sender] = await Promise.all([
//       Project.findById(projectId).lean(),
//       User.findById(senderId).select('name').lean()
//     ]);

//     if (!project) {
//       return { success: false, error: 'Project not found' };
//     }
    
//     // ตรวจสอบว่าส่งจากเจ้าของโปรเจกต์หรือฟรีแลนซ์
//     const isSenderProjectOwner = project.owner.toString() === senderId;
//     const senderName = sender ? sender.name : (isSenderProjectOwner ? 'เจ้าของโปรเจกต์' : 'ฟรีแลนซ์');
    
//     // ถ้าสถานะเป็น 'awaiting' (ฟรีแลนซ์กดส่งงานเพื่อรอการตรวจสอบ)
//     if (status === 'awaiting') {
//       return await createNotification({
//         recipientId: recipientId,
//         senderId: senderId,
//         type: 'project_status_change',
//         title: 'โปรเจกต์เสร็จสิ้นรอการตรวจสอบ',
//         message: `${senderName} ได้ส่งมอบโปรเจกต์ "${project.title}" แล้ว กรุณาตรวจสอบและยืนยันความเรียบร้อย`,
//         projectId: projectId,
//         link: `/project/${projectId}`
//       });
//     }
    
//     // ถ้าสถานะเป็น 'revision' (เจ้าของโปรเจกต์ต้องการให้แก้ไข)
//     if (status === 'revision') {
//         return await createNotification({
//         recipientId: recipientId,
//         senderId: senderId,
//         type: 'project_revision',
//         title: 'โปรเจกต์ต้องการการแก้ไข',
//         message: `${senderName} ได้ตรวจสอบและพบว่าโปรเจกต์ "${project.title}" ยังมีส่วนที่ต้องแก้ไข กรุณาปรับปรุงและส่งงานอีกครั้ง (ความคืบหน้าการแก้ไขได้รีเซ็ตเป็น 0% แล้ว)`,
//         projectId: projectId,
//         link: `/project/${projectId}`
//         });
//     }
    
//     // ถ้าสถานะเป็น 'completed' (งานเสร็จสมบูรณ์แล้ว)
//     if (status === 'completed') {
//       return await createNotification({
//         recipientId: recipientId,
//         senderId: senderId,
//         type: 'project_completed',
//         title: 'โปรเจกต์เสร็จสมบูรณ์',
//         message: `โปรเจกต์ "${project.title}" ได้รับการยืนยันว่าเสร็จสมบูรณ์แล้ว ขอบคุณสำหรับการร่วมงาน`,
//         projectId: projectId,
//         link: `/project/${projectId}`
//       });
//     }
    
//     // กรณีอื่นๆ ใช้ข้อความทั่วไป
//     // Map status to human-readable text
//     const statusMap = {
//       'in_progress': 'กำลังดำเนินการ',
//       'revision': 'ต้องการการแก้ไข',
//       'awaiting': 'รอการตรวจสอบ',
//       'completed': 'เสร็จสิ้น'
//     };

//     const statusText = statusMap[status] || status;

//     return await createNotification({
//       recipientId: recipientId,
//       senderId: senderId,
//       type: 'project_status_change',
//       title: 'มีการเปลี่ยนสถานะโปรเจกต์',
//       message: `โปรเจกต์ "${project.title}" มีการเปลี่ยนสถานะเป็น "${statusText}"`,
//       projectId: projectId,
//       link: `/project/${projectId}`
//     });
//   } catch (error) {
//     console.error('Error creating project status change notification:', error);
//     return { success: false, error: 'Failed to create notification' };
//   }
// }

// // แก้ไขไฟล์ src/utils/notificationUtils.ts
// // ปรับฟังก์ชัน createProjectProgressUpdateNotification

// export async function createProjectProgressUpdateNotification(
//     projectId: string, 
//     progress: number, 
//     ownerId: string,
//     freelancerId: string
//   ) {
//     try {
//       // Get project details
//       const project = await Project.findById(projectId).lean();
  
//       if (!project) {
//         return { success: false, error: 'Project not found' };
//       }
  
//       // Get freelancer details
//       const freelancer = await User.findById(freelancerId).select('name').lean();
//       const freelancerName = freelancer ? freelancer.name : 'ฟรีแลนซ์';
  
//       // ตรวจสอบสถานะโปรเจกต์เพื่อปรับข้อความแจ้งเตือน
//       const isRevision = project.status === 'revision';
//       const statusPrefix = isRevision ? 'การแก้ไข' : '';
      
//       // กรณีความคืบหน้า 100%
//       if (progress === 100) {
//         return await createNotification({
//           recipientId: ownerId,
//           senderId: freelancerId,
//           type: 'project_progress_update',
//           title: `${statusPrefix}โปรเจกต์ดำเนินการครบ 100%`,
//           message: `${statusPrefix}โปรเจกต์ "${project.title}" เสร็จสมบูรณ์แล้ว ${freelancerName} กำลังตรวจสอบเพื่อยืนยันและส่งงาน`,
//           projectId: projectId,
//           link: `/project/${projectId}`
//         });
//       }
//       else if (progress > 0 && progress < 100) {
//         return await createNotification({
//           recipientId: ownerId,
//           senderId: freelancerId,
//           type: 'project_progress_update',
//           title: `${statusPrefix}โปรเจกต์มีการอัปเดตความคืบหน้า`,
//           message: `${statusPrefix}โปรเจกต์ "${project.title}" มีความคืบหน้า ${progress}% โดย ${freelancerName}`,
//           projectId: projectId,
//           link: `/project/${projectId}`
//         });
//       }
//     } catch (error) {
//       console.error('Error creating project progress update notification:', error);
//       return { success: false, error: 'Failed to create notification' };
//     }
//   }

// /**
//  * Mark a notification as read
//  */
// export async function markNotificationAsRead(notificationId: string) {
//   try {
//     await Notification.findByIdAndUpdate(notificationId, { isRead: true });
//     return { success: true };
//   } catch (error) {
//     console.error('Error marking notification as read:', error);
//     return { success: false, error: 'Failed to mark notification as read' };
//   }
// }

// /**
//  * Mark all notifications as read for a user
//  */
// export async function markAllNotificationsAsRead(userId: string) {
//   try {
//     await Notification.updateMany(
//       { recipientId: new mongoose.Types.ObjectId(userId), isRead: false },
//       { isRead: true }
//     );
//     return { success: true };
//   } catch (error) {
//     console.error('Error marking all notifications as read:', error);
//     return { success: false, error: 'Failed to mark all notifications as read' };
//   }
// }

// /**
//  * ส่งการแจ้งเตือนถึงฟรีแลนซ์ทุกคนที่ไม่ได้รับเลือก เมื่อเจ้าของโปรเจกต์เลือกฟรีแลนซ์แล้ว
//  */
// export async function notifyRejectedFreelancers(
//     projectId: string,
//     selectedFreelancerId: string,
//     otherFreelancerIds: string[]
//   ) {
//     try {
//       // ดึงข้อมูลโปรเจกต์
//       const project = await Project.findById(projectId).lean();
      
//       if (!project) {
//         return { success: false, error: 'ไม่พบข้อมูลโปรเจกต์' };
//       }
      
//       // กรองให้เหลือเฉพาะฟรีแลนซ์ที่ไม่ใช่คนที่ถูกเลือก
//       const rejectedFreelancerIds = otherFreelancerIds.filter(id => id !== selectedFreelancerId);
      
//       // ถ้าไม่มีฟรีแลนซ์ที่ถูกปฏิเสธ ไม่ต้องทำอะไร
//       if (rejectedFreelancerIds.length === 0) {
//         return { success: true, message: 'ไม่มีฟรีแลนซ์ที่ต้องแจ้งเตือน' };
//       }
      
//       // ดึงข้อมูลฟรีแลนซ์ที่ได้รับเลือก
//       const selectedFreelancer = await User.findById(selectedFreelancerId).select('name').lean();
//       const freelancerName = selectedFreelancer ? selectedFreelancer.name : 'ฟรีแลนซ์';
      
//       // สร้างการแจ้งเตือนสำหรับทุกฟรีแลนซ์ที่ถูกปฏิเสธ
//       const promises = rejectedFreelancerIds.map(freelancerId => 
//         createNotification({
//           recipientId: freelancerId,
//           senderId: project.owner.toString(),
//           type: 'project_rejected',
//           title: 'คำขอร่วมงานถูกปฏิเสธ',
//           message: `คำขอร่วมงานของคุณในโปรเจกต์ "${project.title}" ถูกปฏิเสธเนื่องจากเจ้าของโปรเจกต์ได้เลือกฟรีแลนซ์คนอื่นแล้ว`,
//           projectId: projectId,
//           link: '/project-board' // ลิงก์ไปที่หน้าโปรเจกต์บอร์ดแทนที่จะเป็นหน้าโปรเจกต์นั้นๆ
//         })
//       );
      
//       // รอให้ทุกการแจ้งเตือนถูกสร้างเสร็จสิ้น
//       await Promise.all(promises);
      
//       return { 
//         success: true, 
//         message: `ส่งการแจ้งเตือนไปยังฟรีแลนซ์ที่ถูกปฏิเสธจำนวน ${rejectedFreelancerIds.length} คน`
//       };
//     } catch (error) {
//       console.error('เกิดข้อผิดพลาดในการส่งการแจ้งเตือนถึงฟรีแลนซ์ที่ถูกปฏิเสธ:', error);
//       return { success: false, error: 'ไม่สามารถส่งการแจ้งเตือนได้' };
//     }
//   }

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