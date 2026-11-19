import prisma from '../prisma.js';

export const assignVideoToPatient = async (req, res) => {
  try {
    const { id: patientId } = req.params;
    const { videoId, title, duration, thumbnail, videoUrl, sets, reps, notes } = req.body;

    if (!videoUrl || !title) {
      return res.status(400).json({ error: 'title and videoUrl are required' });
    }

    const patient = await prisma.patient.findUnique({ where: { id: patientId } });
    if (!patient) {
      return res.status(404).json({ error: 'Patient not found' });
    }

    const assignmentId = `assign-${Date.now()}`;
    const todayDate = new Date().toISOString().split('T')[0];

    // Create assignment record
    const assignment = await prisma.assignment.create({
      data: {
        id: assignmentId,
        patientId,
        videoId: videoId || null,
        title,
        duration: duration || null,
        thumbnail: thumbnail || null,
        videoUrl,
        sets: Number(sets) || 3,
        reps: Number(reps) || 10,
        notes: notes || null,
        dateAssigned: todayDate,
        status: 'active'
      }
    });

    // Automatically generate the doctor prescription chat message
    const messageId = `msg-${Date.now()}`;
    const readableTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    const prescriptionText = notes 
      ? `I've created and assigned "${title}" (${sets || 3} sets × ${reps || 10} reps) to your recovery routine. Prescribed instruction: ${notes}`
      : `I've created and assigned "${title}" (${sets || 3} sets × ${reps || 10} reps) to your active recovery routine. Please watch the demonstration video and follow the prescribed form carefully!`;

    const message = await prisma.message.create({
      data: {
        id: messageId,
        patientId,
        sender: 'doctor',
        sender_id: 'doctor',
        receiver_id: patientId,
        text: prescriptionText,
        message_text: prescriptionText,
        videoUrl,
        thumbnail,
        title,
        timestamp: readableTime
      }
    });

    // Create real-time clinical notification with first video thumbnail
    const notificationId = `notif-${Date.now()}`;
    const planNotification = await prisma.notification.create({
      data: {
        id: notificationId,
        patientId,
        patientName: patient.name,
        patientCondition: patient.condition,
        title: `New Exercise Plan: ${title}`,
        message: `Dr. assigned "${title}" (${sets || 3} sets × ${reps || 10} reps) to your recovery routine.`,
        type: 'plan',
        time: 'Just now',
        isUnread: true
      }
    });

    const notificationPayload = {
      ...planNotification,
      thumbnail: thumbnail || null,
      videoUrl: videoUrl,
      exerciseTitle: title,
      sets: Number(sets) || 3,
      reps: Number(reps) || 10,
      notes: notes || null
    };

    // If socket.io io instance is attached to req.app
    const io = req.app.get('io');
    if (io) {
      io.to(`patient-${patientId}`).emit('video_assigned', { patientId, assignment, message });
      io.to(`patient-${patientId}`).emit('plan_assigned_notification', { patientId, notification: notificationPayload, assignment });
      io.to('therapist-room').emit('video_assigned', { patientId, assignment, message });
      io.to('therapist-room').emit('plan_assigned_notification', { patientId, notification: notificationPayload, assignment });
      io.emit('activity_update', {
        type: 'exercise',
        text: `Dr. assigned "${title}" to ${patient.name}`,
        time: 'Just now'
      });
    }

    res.status(201).json({ assignment, message, notification: notificationPayload });
  } catch (error) {
    console.error('Error assigning video:', error);
    res.status(500).json({ error: 'Failed to assign video to patient' });
  }
};

export const deleteAssignment = async (req, res) => {
  try {
    const { assignmentId } = req.params;
    await prisma.assignment.delete({
      where: { id: assignmentId }
    });
    res.json({ message: 'Assignment removed', id: assignmentId });
  } catch (error) {
    console.error('Error removing assignment:', error);
    res.status(500).json({ error: 'Failed to remove assignment' });
  }
};

