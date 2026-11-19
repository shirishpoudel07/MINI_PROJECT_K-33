import prisma from '../prisma.js';

export const getPatients = async (req, res) => {
  try {
    const patients = await prisma.patient.findMany({
      include: {
        activeVideos: {
          orderBy: { createdAt: 'desc' }
        },
        messages: {
          orderBy: { createdAt: 'asc' }
        },
        progressData: {
          orderBy: { sortOrder: 'asc' }
        }
      },
      orderBy: { id: 'asc' }
    });

    const formatted = patients.map(p => {
      let medicalReport = p.medicalReport;
      if (typeof p.medicalReport === 'string') {
        try {
          medicalReport = JSON.parse(p.medicalReport);
        } catch {
          medicalReport = { notes: p.medicalReport, fileName: 'Medical_Intake.pdf' };
        }
      }
      return {
        ...p,
        medicalReport
      };
    });

    res.json(formatted);
  } catch (error) {
    console.error('Error fetching patients:', error);
    res.status(500).json({ error: 'Failed to fetch patients' });
  }
};

export const getPatientById = async (req, res) => {
  try {
    const { id } = req.params;
    const patient = await prisma.patient.findUnique({
      where: { id },
      include: {
        activeVideos: {
          orderBy: { createdAt: 'desc' }
        },
        messages: {
          orderBy: { createdAt: 'asc' }
        },
        progressData: {
          orderBy: { sortOrder: 'asc' }
        }
      }
    });

    if (!patient) {
      return res.status(404).json({ error: 'Patient not found' });
    }

    let medicalReport = patient.medicalReport;
    if (typeof patient.medicalReport === 'string') {
      try {
        medicalReport = JSON.parse(patient.medicalReport);
      } catch {
        medicalReport = { notes: patient.medicalReport, fileName: 'Medical_Intake.pdf' };
      }
    }

    res.json({
      ...patient,
      medicalReport
    });
  } catch (error) {
    console.error('Error fetching patient:', error);
    res.status(500).json({ error: 'Failed to fetch patient' });
  }
};

export const createPatient = async (req, res) => {
  try {
    const { 
      name, 
      condition, 
      adherenceScore = 100, 
      consistencyStreak = 1,
      assignedDoctor = 'Dr. Alex Vance, DPT, PhD',
      medicalReport = null,
      messages = [],
      activeVideos = [],
      id: customId 
    } = req.body;

    if (!name || !condition) {
      return res.status(400).json({ error: 'Name and condition are required' });
    }

    const id = customId || `p${Date.now()}`;
    const defaultProgress = [
      { day: 'Mon', score: 80, sortOrder: 0 },
      { day: 'Tue', score: 85, sortOrder: 1 },
      { day: 'Wed', score: 90, sortOrder: 2 },
      { day: 'Thu', score: 95, sortOrder: 3 },
      { day: 'Fri', score: 100, sortOrder: 4 },
      { day: 'Sat', score: 100, sortOrder: 5 },
      { day: 'Sun', score: 100, sortOrder: 6 }
    ];

    // Build initial intake conversation with the assigned doctor
    let initialMessages = [...messages];
    if (initialMessages.length === 0) {
      initialMessages.push({
        id: `m_welcome_${Date.now()}`,
        sender: 'doctor',
        sender_id: 'doctor',
        receiver_id: id,
        text: `Hello ${name}, welcome to VirtuHeal Rehabilitation. I am ${assignedDoctor}, your assigned physical therapy specialist. I have received and reviewed your hospital medical intake report regarding your ${condition}. Let's work together toward full recovery! How is your current pain and mobility feeling today?`,
        message_text: `Hello ${name}, welcome to VirtuHeal Rehabilitation. I am ${assignedDoctor}, your assigned physical therapy specialist. I have received and reviewed your hospital medical intake report regarding your ${condition}. Let's work together toward full recovery! How is your current pain and mobility feeling today?`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      });
      if (medicalReport) {
        initialMessages.push({
          id: `m_report_${Date.now() + 1}`,
          sender: 'patient',
          sender_id: id,
          receiver_id: 'doctor',
          text: `📄 Uploaded Hospital Medical Report: ${medicalReport.fileName || 'Discharge_Summary.pdf'}\nDiagnosis / Hospital Notes: ${medicalReport.notes || condition}`,
          message_text: `📄 Uploaded Hospital Medical Report: ${medicalReport.fileName || 'Discharge_Summary.pdf'}\nDiagnosis / Hospital Notes: ${medicalReport.notes || condition}`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        });
      }
    }

    // Default gentle recovery video assignments if none supplied
    let initialAssignments = [...activeVideos];
    if (initialAssignments.length === 0) {
      const cond = condition.toLowerCase();
      if (cond.includes('shoulder') || cond.includes('rotator') || cond.includes('arm')) {
        initialAssignments.push(
          { id: `v_init1_${Date.now()}`, videoId: 'vid_3', title: "Codman's Pendulum Exercises", duration: '1:45', thumbnail: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?auto=format&fit=crop&w=800&q=80', videoUrl: '/videos/pendulum.mp4', sets: 3, reps: 15, notes: 'Gentle passive shoulder mobilization.' },
          { id: `v_init2_${Date.now()}`, videoId: 'vid_8', title: 'Shoulder External Rotation Drill', duration: '1:50', thumbnail: 'https://images.unsplash.com/photo-1518611012118-696072aa579a?auto=format&fit=crop&w=800&q=80', videoUrl: '/videos/shoulder-rotation.mp4', sets: 3, reps: 10, notes: 'Keep elbow pinned at 90 degrees.' }
        );
      } else {
        initialAssignments.push(
          { id: `v_init1_${Date.now()}`, videoId: 'vid_4', title: 'Supine Heel Slides on Mat', duration: '2:00', thumbnail: 'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?auto=format&fit=crop&w=800&q=80', videoUrl: '/videos/heel-slides.mp4', sets: 3, reps: 10, notes: 'Slow, controlled knee flexion within pain-free limits.' },
          { id: `v_init2_${Date.now()}`, videoId: 'vid_1', title: 'Quad Sets (Isometric Activation)', duration: '2:15', thumbnail: 'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?auto=format&fit=crop&w=800&q=80', videoUrl: '/videos/quad-sets.mp4', sets: 3, reps: 10, notes: 'Contract quadriceps and hold for 5 seconds.' }
        );
      }
    }

    const newPatient = await prisma.patient.create({
      data: {
        id,
        name,
        condition,
        assignedDoctor,
        medicalReport: typeof medicalReport === 'object' && medicalReport !== null ? JSON.stringify(medicalReport) : (medicalReport || null),
        adherenceScore,
        consistencyStreak,
        progressData: {
          create: defaultProgress
        },
        messages: {
          create: initialMessages.map((m, idx) => ({
            id: m.id || `m_${Date.now()}_${idx}`,
            sender: m.sender || 'doctor',
            sender_id: m.sender_id || (m.sender === 'doctor' ? 'doctor' : id),
            receiver_id: m.receiver_id || (m.sender === 'doctor' ? id : 'doctor'),
            text: m.text || '',
            message_text: m.text || '',
            videoUrl: m.videoUrl || null,
            thumbnail: m.thumbnail || null,
            title: m.title || null,
            timestamp: m.timestamp || new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          }))
        },
        activeVideos: {
          create: initialAssignments.map((v, idx) => ({
            id: v.id || `v_${Date.now()}_${idx}`,
            videoId: v.videoId || null,
            title: v.title,
            duration: v.duration || '2:00',
            thumbnail: v.thumbnail || null,
            videoUrl: v.videoUrl,
            sets: v.sets || 3,
            reps: v.reps || 10,
            notes: v.notes || 'Gentle rehabilitation routine.',
            dateAssigned: v.dateAssigned || new Date().toISOString().split('T')[0]
          }))
        }
      },
      include: {
        activeVideos: true,
        messages: true,
        progressData: true
      }
    });

    let parsedReport = newPatient.medicalReport;
    if (typeof newPatient.medicalReport === 'string') {
      try {
        parsedReport = JSON.parse(newPatient.medicalReport);
      } catch {
        parsedReport = { notes: newPatient.medicalReport, fileName: 'Medical_Intake.pdf' };
      }
    }
    const formattedPatient = {
      ...newPatient,
      medicalReport: parsedReport
    };

    // Notify connected clinicians via Socket.IO
    const io = req.app.get('io');
    if (io) {
      io.emit('patient_created', formattedPatient);
      io.emit('new_notification', {
        id: `notif_${Date.now()}`,
        patientId: formattedPatient.id,
        patientName: formattedPatient.name,
        patientCondition: formattedPatient.condition,
        title: 'New Patient Registration',
        message: `${formattedPatient.name} completed intake for ${formattedPatient.condition} and uploaded medical reports. Assigned to ${assignedDoctor}.`,
        time: 'Just now',
        type: 'alert',
        isUnread: true
      });
    }

    res.status(201).json(formattedPatient);
  } catch (error) {
    console.error('Error creating patient:', error);
    res.status(500).json({ error: 'Failed to create patient' });
  }
};

export const updatePatient = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, condition, adherenceScore, consistencyStreak } = req.body;

    const updated = await prisma.patient.update({
      where: { id },
      data: {
        ...(name !== undefined && { name }),
        ...(condition !== undefined && { condition }),
        ...(adherenceScore !== undefined && { adherenceScore: Number(adherenceScore) }),
        ...(consistencyStreak !== undefined && { consistencyStreak: Number(consistencyStreak) })
      },
      include: {
        activeVideos: true,
        messages: true,
        progressData: true
      }
    });

    res.json(updated);
  } catch (error) {
    console.error('Error updating patient:', error);
    res.status(500).json({ error: 'Failed to update patient' });
  }
};

export const deletePatient = async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.patient.delete({
      where: { id }
    });
    res.json({ message: 'Patient removed successfully', id });
  } catch (error) {
    console.error('Error deleting patient:', error);
    res.status(500).json({ error: 'Failed to delete patient' });
  }
};

export const completeExercise = async (req, res) => {
  try {
    const { id: patientId } = req.params;
    const { assignmentId, painLevel = 0, sets = 3, reps = 10, notes = '' } = req.body;

    const patient = await prisma.patient.findUnique({
      where: { id: patientId },
      include: {
        activeVideos: true,
        progressData: { orderBy: { sortOrder: 'asc' } }
      }
    });

    if (!patient) {
      return res.status(404).json({ error: 'Patient not found' });
    }

    const assignment = patient.activeVideos.find(a => a.id === assignmentId);
    if (!assignment) {
      return res.status(404).json({ error: 'Prescribed routine not found for this patient' });
    }

    const todayDate = new Date().toISOString().split('T')[0];

    // 1. Create Exercise Log
    const logId = `log-${Date.now()}`;
    const log = await prisma.exerciseLog.create({
      data: {
        id: logId,
        patientId,
        assignmentId,
        title: assignment.title,
        painLevel: Number(painLevel),
        sets: Number(sets),
        reps: Number(reps),
        notes: notes || ''
      }
    });

    // 2. Update Assignment
    await prisma.assignment.update({
      where: { id: assignmentId },
      data: {
        lastCompletedDate: todayDate,
        completionCount: { increment: 1 }
      }
    });

    // 3. Calculate REAL updated consistency streak and weekly progress score
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const currentDayName = dayNames[new Date().getDay()];

    // Calculate updated score for today: e.g. base 85-100% when an exercise is logged
    const newDayScore = Math.min(100, Math.max(80, 70 + (assignment.completionCount + 1) * 10));

    // Update today's progress entry
    const progressEntry = patient.progressData.find(p => p.day === currentDayName);
    if (progressEntry) {
      await prisma.progress.update({
        where: { id: progressEntry.id },
        data: { score: newDayScore }
      });
    }

    // Refresh updated progress entries
    const allProgress = await prisma.progress.findMany({
      where: { patientId }
    });
    const avgScore = allProgress.length > 0 
      ? Math.round(allProgress.reduce((sum, p) => sum + p.score, 0) / allProgress.length)
      : newDayScore;

    const updatedStreak = patient.consistencyStreak + 1;

    const updatedPatient = await prisma.patient.update({
      where: { id: patientId },
      data: {
        consistencyStreak: updatedStreak,
        adherenceScore: avgScore
      },
      include: {
        activeVideos: true,
        messages: true,
        progressData: { orderBy: { sortOrder: 'asc' } },
        exerciseLogs: { orderBy: { completedAt: 'desc' }, take: 10 }
      }
    });

    // 4. Generate REAL clinical Notification for the Doctor
    const notifId = `n-${Date.now()}`;
    const isHighPain = Number(painLevel) >= 7;
    const readableTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    const notification = await prisma.notification.create({
      data: {
        id: notifId,
        patientId,
        patientName: patient.name,
        patientCondition: patient.condition,
        title: isHighPain ? 'High Pain Flare-up Alert' : 'Exercise Routine Completed',
        message: isHighPain 
          ? `Reported high pain (${painLevel}/10) during "${assignment.title}". Notes: ${notes || 'None'}`
          : `Successfully completed ${sets} sets of ${reps} for "${assignment.title}". Pain score: ${painLevel}/10.`,
        type: isHighPain ? 'alert' : 'exercise',
        time: `Today ${readableTime}`,
        isUnread: true
      }
    });

    // 5. Emit Real-time WebSocket events
    const io = req.app.get('io');
    if (io) {
      io.emit('new_notification', notification);
      io.emit('patient_updated', updatedPatient);
      io.to(`patient-${patientId}`).emit('exercise_logged', { log, patient: updatedPatient });
    }

    res.json({
      success: true,
      log,
      patient: updatedPatient,
      notification
    });
  } catch (error) {
    console.error('Error completing exercise:', error);
    res.status(500).json({ error: 'Failed to record exercise completion' });
  }
};


