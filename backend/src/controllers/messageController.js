import prisma from '../prisma.js';

export function generateDoctorReply(patientText, patientCondition = 'Rehabilitation') {
  const text = (patientText || '').toLowerCase();

  if (text.includes('pain') || text.includes('hurt') || text.includes('ache') || text.includes('sore') || text.includes('sharp')) {
    return `Thank you for reporting this. If you are experiencing sharp pain or anything above 5/10, please pause that drill immediately. Apply an ice pack wrapped in a cloth for 15 minutes, keep the joint elevated, and let me know if it eases while resting.`;
  }
  if (text.includes('ice') || text.includes('heat') || text.includes('cold') || text.includes('swelling') || text.includes('swollen')) {
    return `Great question. For post-rehabilitation recovery, ice is preferred for 15–20 minutes to minimize joint swelling. Avoid heat immediately after exercise as it dilates vessels and can increase localized inflammation.`;
  }
  if (text.includes('done') || text.includes('finish') || text.includes('completed') || text.includes('did my') || text.includes('all sets')) {
    return `Outstanding work! Consistently completing your prescribed routine is the single most important factor for full recovery. Please record your pain score below so we can track your progress curve.`;
  }
  if (text.includes('form') || text.includes('camera') || text.includes('angle') || text.includes('coach') || text.includes('doing it right')) {
    return `Your AI Motion Coach metrics show solid joint positioning. Remember to move in a slow, controlled tempo and avoid locking out your joints at the end of the range. Focus on muscle engagement over speed!`;
  }
  if (text.includes('rep') || text.includes('set') || text.includes('how many') || text.includes('count') || text.includes('dosage')) {
    return `Follow our prescribed protocol: 3 sets of 10–12 controlled repetitions, taking a 45-to-60 second rest between sets. If fatigue begins to compromise your form, stop the set early.`;
  }
  if (text.includes('hello') || text.includes('hi') || text.includes('hey') || text.includes('morning') || text.includes('afternoon')) {
    return `Hello! I am monitoring your recovery chart today. How is your joint mobility and comfort level feeling right now?`;
  }
  return `I have reviewed your message regarding your ${patientCondition}. I've logged this in your clinical progress chart. Please continue with your gentle mobility exercises, listen to your body, and text me right away if you notice any sudden tightness or pain flare-up.`;
}

const activeAutoReplyTimers = new Map();

export async function scheduleDoctorAutoReply(io, patientId, patientText, patientCondition) {
  if (!io || !patientId) return;

  // Debounce per patient: prevent rapid-fire multiple auto-replies
  const existingTimer = activeAutoReplyTimers.get(patientId);
  if (existingTimer) {
    clearTimeout(existingTimer.typingTimer);
    clearTimeout(existingTimer.replyTimer);
  }

  // 1. Show typing indicator after 700ms
  const typingTimer = setTimeout(() => {
    io.to(`patient-${patientId}`).emit('user_typing', {
      patientId,
      sender: 'doctor',
      name: 'Dr. Alex Vance, PT, DPT'
    });
  }, 700);

  // 2. Deliver actual clinical reply after 2200ms
  const replyTimer = setTimeout(async () => {
    activeAutoReplyTimers.delete(patientId);
    try {
      io.to(`patient-${patientId}`).emit('user_stop_typing', {
        patientId,
        sender: 'doctor'
      });

      const replyText = generateDoctorReply(patientText, patientCondition);

      // Deduplication guard: do not create duplicate auto-replies within 6 seconds
      const recentAutoReply = await prisma.message.findFirst({
        where: {
          patientId,
          sender: 'doctor',
          text: replyText,
          createdAt: { gte: new Date(Date.now() - 6000) }
        }
      });
      if (recentAutoReply) return;

      const doctorMessage = await prisma.message.create({
        data: {
          id: `msg-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          patientId,
          sender: 'doctor',
          sender_id: 'doctor',
          receiver_id: patientId,
          text: replyText,
          message_text: replyText,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      });

      io.to(`patient-${patientId}`).emit('new_message', doctorMessage);
      io.to('therapist-room').emit('new_message', doctorMessage);
      io.emit('global_message', { patientId, message: doctorMessage });
    } catch (err) {
      console.error('Error generating auto doctor reply:', err);
    }
  }, 2200);

  activeAutoReplyTimers.set(patientId, { typingTimer, replyTimer });
}

export const getPatientMessages = async (req, res) => {
  try {
    const { id: patientId } = req.params;
    const messages = await prisma.message.findMany({
      where: { patientId },
      orderBy: { createdAt: 'asc' }
    });
    res.json(messages);
  } catch (error) {
    console.error('Error fetching messages:', error);
    res.status(500).json({ error: 'Failed to fetch messages' });
  }
};

export const sendMessage = async (req, res) => {
  try {
    const { id: patientId } = req.params;
    const { sender = 'doctor', text, videoUrl = null, thumbnail = null, title = null } = req.body;

    if (!text && !videoUrl) {
      return res.status(400).json({ error: 'Message text or video is required' });
    }

    const messageId = req.body.id || `msg-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    const readableTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const trimmedText = (text || '').trim();

    // Deduplication guard 1: Check by ID
    const existingById = await prisma.message.findUnique({ where: { id: messageId } });
    if (existingById) {
      return res.status(200).json(existingById);
    }

    // Deduplication guard 2: Check by content, sender, and recency (within 4 seconds)
    const existingContent = await prisma.message.findFirst({
      where: {
        patientId,
        sender,
        text: trimmedText,
        videoUrl: videoUrl || null,
        createdAt: { gte: new Date(Date.now() - 4000) }
      }
    });
    if (existingContent) {
      return res.status(200).json(existingContent);
    }

    const message = await prisma.message.create({
      data: {
        id: messageId,
        patientId,
        sender,
        text: trimmedText,
        videoUrl,
        thumbnail,
        title,
        timestamp: readableTime
      }
    });

    let notification = null;
    let patientObj = null;
    if (sender === 'patient') {
      patientObj = await prisma.patient.findUnique({ where: { id: patientId } });
      if (patientObj) {
        notification = await prisma.notification.create({
          data: {
            id: `n-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
            patientId,
            patientName: patientObj.name,
            patientCondition: patientObj.condition,
            title: 'New Patient Question',
            message: `"${trimmedText ? trimmedText.slice(0, 90) : 'Sent an attachment'}"`,
            type: 'message',
            time: 'Just now',
            isUnread: true
          }
        });
      }
    }

    const io = req.app.get('io');
    if (io) {
      io.to(`patient-${patientId}`).emit('new_message', message);
      io.to('therapist-room').emit('new_message', message);
      io.emit('global_message', { patientId, message });
      if (notification) {
        io.emit('new_notification', notification);
      }

      // Automatically trigger real-time doctor response if sent by patient
      if (sender === 'patient') {
        scheduleDoctorAutoReply(io, patientId, trimmedText, patientObj?.condition || 'Rehabilitation');
      }
    }

    res.status(201).json(message);
  } catch (error) {
    console.error('Error sending message:', error);
    res.status(500).json({ error: 'Failed to send message' });
  }
};

