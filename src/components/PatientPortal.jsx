import React, { useState, useEffect, useRef } from 'react';
import { 
  Check, 
  CheckCircle2, 
  CheckCheck,
  Play, 
  X, 
  Send, 
  Flame, 
  Activity, 
  FileText, 
  AlertCircle,
  UserCheck,
  Sparkles,
  Camera,
  Layers,
  Clock,
  Trophy,
  ChevronRight,
  HeartPulse,
  Phone,
  Video,
  Paperclip,
  Stethoscope,
  Bell,
  Film
} from 'lucide-react';
import { getSocket, completeExercise, sendMessage } from '../api/client';
import { sounds } from '../utils/soundEffects';
import { getAssignedDoctorForPatient } from '../utils/doctorHelpers';
import AiMotionCoachModal from './AiMotionCoachModal';
import PatientRegistrationModal from './PatientRegistrationModal';
import { patientExercises } from '../data/mockData';
import MedicalReportModal from './MedicalReportModal';

export default function PatientPortal({ 
  patient, 
  patients = [], 
  verifiedDoctors = [],
  onSelectPatient, 
  onUpdatePatient,
  onAddPatient,
  isRegisterModalOpen: controlledModalOpen,
  setIsRegisterModalOpen: setControlledModalOpen
}) {
  const currentPatient = patient || patients[0] || {
    id: 'p1',
    name: 'Shirish Poudel',
    condition: 'Upper Body & Cervical Physical Therapy Rehab',
    adherenceScore: 88,
    consistencyStreak: 14,
    activeVideos: [...patientExercises],
    messages: []
  };

  const [internalRegisterModalOpen, setInternalRegisterModalOpen] = useState(false);
  const [isPatientReportModalOpen, setIsPatientReportModalOpen] = useState(false);
  const isRegisterModalOpen = controlledModalOpen !== undefined ? controlledModalOpen : internalRegisterModalOpen;
  const setIsRegisterModalOpen = setControlledModalOpen || setInternalRegisterModalOpen;

  const assignedDoctorObj = getAssignedDoctorForPatient(currentPatient, verifiedDoctors);
  const doctorName = assignedDoctorObj?.name || currentPatient.assignedDoctor || 'Dr. Alex Vance, PT';
  const doctorShort = doctorName.split(',')[0] || doctorName;

  // Real-time Chat State per patient
  const [liveMessagesByPatient, setLiveMessagesByPatient] = useState({});
  const [chatInput, setChatInput] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [isDoctorTyping, setIsDoctorTyping] = useState(false);
  const [doctorTypingName, setDoctorTypingName] = useState('');
  const typingTimeoutRef = useRef(null);
  const messagesEndRef = useRef(null);

  // AI Motion Coach modal state
  const [activeAiCoachExercise, setActiveAiCoachExercise] = useState(null);
  const [switchToast, setSwitchToast] = useState('');

  // Patient Notifications State (with first video thumbnail of plan)
  const [dismissedNotificationIds, setDismissedNotificationIds] = useState(new Set());
  const [isPatientNotifOpen, setIsPatientNotifOpen] = useState(false);
  const [livePlanNotification, setLivePlanNotification] = useState(null);

  // Selected Active Exercise for the Clinical Stage
  const [selectedExerciseId, setSelectedExerciseId] = useState(null);

  const notificationsList = currentPatient?.notifications;
  const activeVideosList = currentPatient?.activeVideos;
  const currentPatientId = currentPatient?.id;
  const activePlanNotification = React.useMemo(() => {
    if (livePlanNotification && !dismissedNotificationIds.has(livePlanNotification.id)) {
      return livePlanNotification;
    }
    const notifs = notificationsList || [];
    const unread = notifs.find(n => n.type === 'plan' && !dismissedNotificationIds.has(n.id));
    if (unread) return unread;

    if (activeVideosList && activeVideosList.length > 0 && !dismissedNotificationIds.has('default-plan-' + currentPatientId)) {
      const firstVideo = activeVideosList[0];
      return {
        id: 'default-plan-' + currentPatientId,
        patientId: currentPatientId,
        title: `Rehabilitation Routine: ${firstVideo.title}`,
        exerciseTitle: firstVideo.title,
        message: `Dr. Alex Vance has prescribed your active recovery program with "${firstVideo.title}". Follow the video demonstration and AI biomechanics coach.`,
        thumbnail: firstVideo.thumbnail || (firstVideo.youtubeId ? `https://img.youtube.com/vi/${firstVideo.youtubeId}/hqdefault.jpg` : 'https://img.youtube.com/vi/F_e3U4-Hbr8/hqdefault.jpg'),
        videoUrl: firstVideo.videoUrl || firstVideo.localVideoUrl,
        youtubeId: firstVideo.youtubeId,
        videoId: firstVideo.id,
        sets: firstVideo.sets || 3,
        reps: firstVideo.reps || 10,
        notes: firstVideo.notes || firstVideo.instructions || 'Perform controlled repetitions with smooth breathing.',
        time: 'Active Today',
        isUnread: true
      };
    }
    return null;
  }, [livePlanNotification, notificationsList, activeVideosList, currentPatientId, dismissedNotificationIds]);

  // Combine initial database messages with live socket messages with deep deduplication
  const patientMessages = currentPatient?.messages;
  const allMessages = React.useMemo(() => {
    const base = patientMessages || [];
    const extra = liveMessagesByPatient[currentPatient.id] || [];
    const combined = [...base, ...extra];

    const result = [];
    const seenIds = new Set();
    for (const m of combined) {
      if (!m) continue;
      if (m.id && seenIds.has(m.id)) continue;

      const text = (m.text || m.message_text || '').trim();
      const sender = m.sender || m.sender_id || '';
      const video = m.videoUrl || '';

      const isDuplicate = result.some(prev => {
        if (m.id && prev.id && m.id === prev.id) return true;
        const prevText = (prev.text || prev.message_text || '').trim();
        const prevSender = prev.sender || prev.sender_id || '';
        const prevVideo = prev.videoUrl || '';
        return prevSender === sender && prevText === text && prevVideo === video;
      });

      if (!isDuplicate) {
        if (m.id) seenIds.add(m.id);
        result.push(m);
      }
    }
    return result;
  }, [patientMessages, liveMessagesByPatient, currentPatient.id]);

  // Video Demonstration Modal
  const [activeVideoModal, setActiveVideoModal] = useState(null);
  const modalVideoRef = useRef(null);

  // Pain Log Slider State (1 to 10)
  const [painValue, setPainValue] = useState(2);
  const [painLoggedSuccess, setPainLoggedSuccess] = useState(false);

  // Locally toggled exercise completions (overrides per patient)
  const [localCompletedOverrides, setLocalCompletedOverrides] = useState({});
  const [aiVerifiedIds, setAiVerifiedIds] = useState(new Set());

  // Compute completed exercises derived directly from patient data and overrides
  const completedExerciseIds = React.useMemo(() => {
    const ids = new Set();
    currentPatient?.activeVideos?.forEach(v => {
      if (v.completionCount > 0) {
        ids.add(v.id);
      }
    });
    const patientOverrides = localCompletedOverrides[currentPatient.id] || {};
    Object.entries(patientOverrides).forEach(([id, isDone]) => {
      if (isDone) ids.add(id);
      else ids.delete(id);
    });
    return ids;
  }, [currentPatient.id, currentPatient.activeVideos, localCompletedOverrides]);

  // Persistent Socket.IO Connection & Real-Time Event Handlers
  useEffect(() => {
    const socket = getSocket();
    if (!socket || !currentPatient?.id) return;

    // 1. Join patient's private room
    socket.emit('joinRoom', currentPatient.id);
    socket.emit('join_patient_room', currentPatient.id);

    // 2. Catch incoming broadcasted messages in real time with deduplication
    const handleReceiveMessage = (newMsg) => {
      setIsDoctorTyping(false);
      if (newMsg?.sender === 'doctor') {
        sounds.playReceive();
      }

      const newText = (newMsg.text || newMsg.message_text || '').trim();
      const newSender = newMsg.sender || newMsg.sender_id || '';

      setLiveMessagesByPatient((prev) => {
        const patientLive = prev[currentPatient.id] || [];
        if (patientLive.some((m) => m.id === newMsg.id || ((m.sender || m.sender_id) === newSender && (m.text || m.message_text || '').trim() === newText))) return prev;
        return {
          ...prev,
          [currentPatient.id]: [...patientLive, newMsg]
        };
      });

      // Update parent patient state
      if (onUpdatePatient) {
        onUpdatePatient((prev) => {
          if (!prev || prev.id !== currentPatient.id) return prev;
          if (prev.messages?.some((m) => m.id === newMsg.id || ((m.sender || m.sender_id) === newSender && (m.text || m.message_text || '').trim() === newText))) return prev;
          return {
            ...prev,
            messages: [...(prev.messages || []), newMsg]
          };
        });
      }
    };

    const handlePlanAssigned = (data) => {
      const notif = data?.notification;
      const pid = data?.patientId || notif?.patientId;
      if (pid && pid !== currentPatient.id) return;
      sounds.playSuccess();
      if (notif) {
        setLivePlanNotification(notif);
        setSwitchToast(`🔔 New Plan Notification: "${notif.exerciseTitle || notif.title}"!`);
        setTimeout(() => setSwitchToast(''), 5000);
      }
    };

    const handleVideoAssigned = ({ patientId, assignment, message }) => {
      if (patientId !== currentPatient.id) return;
      sounds.playSuccess();
      const firstThumbnail = assignment?.thumbnail || 
        (assignment?.youtubeId ? `https://img.youtube.com/vi/${assignment.youtubeId}/hqdefault.jpg` : null) ||
        'https://img.youtube.com/vi/F_e3U4-Hbr8/hqdefault.jpg';
      
      const newPlanNotif = {
        id: `plan-notif-${Date.now()}`,
        patientId,
        title: `New Exercise Plan: ${assignment?.title}`,
        exerciseTitle: assignment?.title,
        message: `Dr. Alex Vance assigned "${assignment?.title}" (${assignment?.sets || 3} sets × ${assignment?.reps || 10} reps).`,
        thumbnail: firstThumbnail,
        videoUrl: assignment?.videoUrl,
        youtubeId: assignment?.youtubeId,
        videoId: assignment?.id,
        sets: assignment?.sets || 3,
        reps: assignment?.reps || 10,
        notes: assignment?.notes || 'Perform steady repetitions in comfortable range.',
        time: 'Just now',
        isUnread: true
      };
      setLivePlanNotification(newPlanNotif);
      setSwitchToast(`🔔 New Plan Notification: "${assignment?.title}"!`);
      setTimeout(() => setSwitchToast(''), 5000);

      if (onUpdatePatient) {
        onUpdatePatient((prev) => {
          if (!prev || prev.id !== patientId) return prev;
          const hasAssignment = prev.activeVideos?.some(v => v.id === assignment.id);
          const nextVideos = hasAssignment ? prev.activeVideos : [assignment, ...(prev.activeVideos || [])];
          const nextMessages = message 
            ? (prev.messages?.some(m => m.id === message.id) ? prev.messages : [...(prev.messages || []), message]) 
            : prev.messages;
          const prevNotifs = prev.notifications || [];
          return {
            ...prev,
            activeVideos: nextVideos,
            messages: nextMessages,
            notifications: [newPlanNotif, ...prevNotifs]
          };
        });
      }
    };

    const handleUserTyping = ({ patientId, sender, name }) => {
      if (patientId === currentPatient.id && sender === 'doctor') {
        setIsDoctorTyping(true);
        setDoctorTypingName(name || doctorShort);
      }
    };

    const handleUserStopTyping = ({ patientId, sender }) => {
      if (patientId === currentPatient.id && sender === 'doctor') {
        setIsDoctorTyping(false);
      }
    };

    socket.on('new_message', handleReceiveMessage);
    socket.on('video_assigned', handleVideoAssigned);
    socket.on('plan_assigned_notification', handlePlanAssigned);
    socket.on('user_typing', handleUserTyping);
    socket.on('user_stop_typing', handleUserStopTyping);

    // 3. Cleanup on unmount or patient change
    return () => {
      socket.off('new_message', handleReceiveMessage);
      socket.off('video_assigned', handleVideoAssigned);
      socket.off('plan_assigned_notification', handlePlanAssigned);
      socket.off('user_typing', handleUserTyping);
      socket.off('user_stop_typing', handleUserStopTyping);
      socket.emit('leave_patient_room', currentPatient.id);
    };
  }, [currentPatient.id, onUpdatePatient, doctorShort]);

  // Auto-scroll chat to bottom on new message or typing state change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [allMessages.length, isDoctorTyping]);

  // Today's Plan Progress Calculations
  const rawVideos = (currentPatient?.activeVideos && currentPatient.activeVideos.length > 0)
    ? currentPatient.activeVideos
    : patientExercises;

  const exercises = React.useMemo(() => {
    const list = (rawVideos && rawVideos.length > 0) ? rawVideos : patientExercises;
    return list.map(v => {
      const cvDef = patientExercises.find(e => e.id === v.id || e.id === v.videoId || e.title === v.title);
      let youtubeId = v.youtubeId || cvDef?.youtubeId;
      if (!youtubeId && v.videoUrl) {
        const match = v.videoUrl.match(/(?:embed\/|v=|vi\/|youtu\.be\/|\/v\/)([\w-]{11})/);
        if (match) youtubeId = match[1];
      }
      return {
        ...v,
        ...(cvDef || {}),
        title: cvDef?.title || v.title,
        category: cvDef?.category || v.category,
        target: cvDef?.target || v.target,
        instructions: cvDef?.instructions || v.instructions,
        sets: cvDef?.sets || v.sets,
        reps: cvDef?.reps || v.reps,
        youtubeId: cvDef?.youtubeId || youtubeId || v.youtubeId,
        videoUrl: cvDef?.videoUrl || v.videoUrl,
        thumbnail: cvDef?.thumbnail || v.thumbnail,
        trackingJoints: cvDef?.trackingJoints || v.trackingJoints,
        cvThresholds: cvDef?.cvThresholds || v.cvThresholds,
        invertLogic: cvDef?.invertLogic !== undefined ? cvDef.invertLogic : v.invertLogic
      };
    });
  }, [rawVideos]);
  const totalExercises = exercises.length;
  const completedCount = completedExerciseIds.size;
  const progressPercent = totalExercises > 0 
    ? Math.round((completedCount / totalExercises) * 100) 
    : 0;

  // Active exercise selected for the stage
  const activeExercise = React.useMemo(() => {
    if (!exercises || exercises.length === 0) return null;
    if (selectedExerciseId) {
      const found = exercises.find(e => e.id === selectedExerciseId);
      if (found) return found;
    }
    const firstPending = exercises.find(e => !completedExerciseIds.has(e.id));
    return firstPending || exercises[0];
  }, [exercises, selectedExerciseId, completedExerciseIds]);

  const activeIndex = activeExercise ? exercises.findIndex(e => e.id === activeExercise.id) : 0;

  // Circular SVG Progress Bar calculation (enlarged for patient visibility)
  const circleRadius = 50;
  const circumference = 2 * Math.PI * circleRadius;
  const strokeOffset = circumference - (circumference * progressPercent) / 100;

  // Toggle "Mark Complete" on Exercise Card
  const handleToggleComplete = async (exercise) => {
    if (!exercise?.id) return;
    const isCurrentlyComplete = completedExerciseIds.has(exercise.id);
    const nextCompleted = !isCurrentlyComplete;

    setLocalCompletedOverrides(prev => ({
      ...prev,
      [currentPatient.id]: {
        ...(prev[currentPatient.id] || {}),
        [exercise.id]: nextCompleted
      }
    }));

    if (nextCompleted) {
      // Auto-advance to next incomplete exercise if available
      const nextPending = exercises.find(e => e.id !== exercise.id && !completedExerciseIds.has(e.id));
      if (nextPending) {
        setSelectedExerciseId(nextPending.id);
      }

      // Persist to backend database & calculate real adherence & streak
      try {
        const result = await completeExercise(currentPatient.id, {
          assignmentId: exercise.id,
          painLevel: Number(painValue),
          sets: exercise.sets || 3,
          reps: exercise.reps || 10,
          notes: `Completed daily routine step with pain score ${painValue}/10`
        });

        if (result?.patient && onUpdatePatient) {
          onUpdatePatient(result.patient);
        }
      } catch (err) {
        console.warn('Could not sync completion to backend:', err);
      }
    }
  };

  // Real-Time typing emission
  const handleChatInputChange = (e) => {
    const val = e.target.value;
    setChatInput(val);

    const socket = getSocket();
    if (socket && socket.connected) {
      socket.emit('typing', {
        patientId: currentPatient.id,
        sender: 'patient',
        name: currentPatient.name
      });

      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = setTimeout(() => {
        socket.emit('stop_typing', {
          patientId: currentPatient.id,
          sender: 'patient'
        });
      }, 1500);
    }
  };

  // Sending Real-Time Chat Message via Socket.io
  const handleSendMessage = (textToSend) => {
    const text = (textToSend || chatInput).trim();
    if (!text || isSending) return;

    sounds.playSend();

    const socket = getSocket();
    if (socket && socket.connected) {
      socket.emit('stop_typing', {
        patientId: currentPatient.id,
        sender: 'patient'
      });
    }
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);

    const readableTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    const optimisticId = `msg-${Date.now()}`;
    const optimisticMessage = {
      id: optimisticId,
      patientId: currentPatient.id,
      sender: 'patient',
      sender_id: currentPatient.id,
      receiver_id: 'doctor',
      text,
      message_text: text,
      timestamp: readableTime,
      createdAt: new Date().toISOString()
    };

    // Render immediately in chat
    setLiveMessagesByPatient((prev) => {
      const patientLive = prev[currentPatient.id] || [];
      return {
        ...prev,
        [currentPatient.id]: [...patientLive, optimisticMessage]
      };
    });

    if (onUpdatePatient) {
      onUpdatePatient(prev => {
        if (!prev || prev.id !== currentPatient.id) return prev;
        if (prev.messages?.some(m => m.id === optimisticId)) return prev;
        return {
          ...prev,
          messages: [...(prev.messages || []), optimisticMessage]
        };
      });
    }

    setChatInput('');
    setIsSending(true);

    // Persist to REST backend with optimistic ID (backend broadcasts to socket rooms cleanly)
    sendMessage(currentPatient.id, {
      id: optimisticId,
      text,
      message_text: text,
      sender: 'patient',
      sender_id: currentPatient.id,
      receiver_id: 'doctor',
      timestamp: readableTime
    })
      .then((serverMsg) => {
        if (serverMsg?.id) {
          setLiveMessagesByPatient((prev) => {
            const patientLive = prev[currentPatient.id] || [];
            return {
              ...prev,
              [currentPatient.id]: patientLive.map((m) => (m.id === optimisticId ? serverMsg : m))
            };
          });

          if (onUpdatePatient) {
            onUpdatePatient(prev => {
              if (!prev || prev.id !== currentPatient.id) return prev;
              return {
                ...prev,
                messages: (prev.messages || []).map(m => m.id === optimisticId ? serverMsg : m)
              };
            });
          }
        }
      })
      .catch((err) => {
        console.warn('Message saved locally (offline):', err.message);
      })
      .finally(() => {
        setIsSending(false);
      });
  };

  // Submit Pain Score Log
  const handleLogPainScore = () => {
    setPainLoggedSuccess(true);
    setTimeout(() => setPainLoggedSuccess(false), 3000);
    // Automatically send quick message to therapist if severe
    if (painValue >= 7) {
      handleSendMessage(`⚠️ High pain reported: ${painValue}/10 discomfort recorded during today's routine.`);
    }
  };

  // Dynamic Pain Slider styling
  const getPainColorClass = (val) => {
    if (val <= 3) return 'text-sky-700 bg-sky-50 border-sky-300';
    if (val <= 6) return 'text-amber-700 bg-amber-50 border-amber-300';
    return 'text-rose-700 bg-rose-50 border-rose-300';
  };

  const getPainTrackBackground = () => {
    return `linear-gradient(to right, #0ea5e9 0%, #f59e0b 50%, #ef4444 100%)`;
  };

  return (
    <div className="flex-1 bg-transparent overflow-y-auto p-4 sm:p-6 lg:p-8 font-sans text-slate-900">
      <div className="max-w-7xl mx-auto space-y-6">

        {/* ============================================================== */}
        {/* TOP PATIENT ACCOUNT BAR & NAVIGATION CONTROLS                  */}
        {/* ============================================================== */}
        <div className="bg-white/80 backdrop-blur-xl rounded-2xl border border-sky-900/10 p-4 sm:p-5 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
          
          {/* Active Patient Identity */}
          <div className="flex items-center gap-4 select-none">
            <div className="relative">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-sky-500 via-blue-600 to-sky-700 text-white flex items-center justify-center font-black text-lg shadow-sm ring-4 ring-sky-50 shrink-0">
                {currentPatient.name?.split(' ').map(n => n[0]).join('') || 'PT'}
              </div>
              <div className="absolute -bottom-1 -right-1 bg-sky-500 text-white p-1 rounded-full border-2 border-white shadow-xs" title="Online & Active Session">
                <UserCheck size={13} />
              </div>
            </div>

            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Patient Portal</span>
                <span className="text-lg sm:text-xl font-black text-slate-900 leading-tight">{currentPatient.name}</span>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-sky-50 text-sky-800 border border-sky-200 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-sky-500 animate-pulse"></span>
                  Active Session
                </span>
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-sky-50 text-sky-900 border border-sky-200 text-xs font-bold shadow-2xs">
                  {assignedDoctorObj?.avatar ? (
                    <img src={assignedDoctorObj.avatar} alt={doctorShort} className="w-4 h-4 rounded-full object-cover shrink-0" />
                  ) : (
                    <Stethoscope size={13} className="text-sky-600" />
                  )}
                  <span className="text-sky-700 font-medium">Doctor Assigned:</span>
                  <span className="font-extrabold text-sky-900">{doctorShort}</span>
                </div>
              </div>
              <p className="text-xs sm:text-sm text-slate-500 mt-1 flex items-center gap-2 flex-wrap">
                <span>Prescribed Care Plan: <strong className="text-sky-800">{currentPatient.condition}</strong></span>
                <span className="text-slate-300">•</span>
                <span className="text-slate-500 font-mono text-xs">Medical ID: #{currentPatient.id}</span>
                <span className="text-slate-300">•</span>
                <span className="text-slate-600 font-semibold text-xs">Attending: {doctorName}</span>
              </p>
            </div>
          </div>

          {/* Action buttons: Hospital Report & Clinical Status */}
          <div className="flex items-center gap-2.5 flex-wrap">
            <button
              type="button"
              onClick={() => setIsPatientReportModalOpen(true)}
              className="px-4 py-2.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 text-xs sm:text-sm font-bold shadow-xs transition-all flex items-center gap-2 cursor-pointer active:scale-95"
              id="patient-view-report-btn"
              title="Review uploaded hospital medical report, MRI scan and clinical notes"
            >
              <FileText size={16} />
              <span>Hospital Report</span>
            </button>

            {/* Patient Notifications Bell Popover */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setIsPatientNotifOpen(!isPatientNotifOpen)}
                className="px-3.5 py-2.5 rounded-xl bg-sky-50 hover:bg-sky-100 text-sky-800 border border-sky-200 text-xs sm:text-sm font-bold shadow-xs transition-all flex items-center gap-2 cursor-pointer active:scale-95 relative"
                title="View Exercise Plan Notifications"
              >
                <Bell size={16} className="text-sky-700" />
                <span className="hidden sm:inline">Plan Alerts</span>
                {activePlanNotification && (
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse border-2 border-white absolute -top-1 -right-1" />
                )}
              </button>

              {isPatientNotifOpen && (
                <div className="absolute right-0 top-full mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-2xl border border-sky-100 overflow-hidden z-50 p-4 space-y-3 animate-scale-up">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                    <div className="flex items-center gap-1.5 font-black text-xs text-slate-900">
                      <Bell size={14} className="text-sky-600" />
                      <span>Care Plan Notifications</span>
                    </div>
                    <span className="text-[10px] font-bold text-slate-400">Dr. Alex Vance</span>
                  </div>

                  {activePlanNotification ? (
                    <div className="p-3 bg-sky-50/70 border border-sky-200/80 rounded-xl space-y-2">
                      <div className="flex items-center gap-3">
                        <img 
                          src={activePlanNotification.thumbnail || 'https://img.youtube.com/vi/F_e3U4-Hbr8/hqdefault.jpg'} 
                          alt="First Video"
                          className="w-16 h-12 object-cover rounded-lg border border-sky-200 shrink-0" 
                        />
                        <div className="min-w-0">
                          <h4 className="text-xs font-bold text-slate-900 truncate">
                            {activePlanNotification.exerciseTitle || activePlanNotification.title}
                          </h4>
                          <p className="text-[11px] text-slate-500 mt-0.5">
                            {activePlanNotification.sets || 3} Sets × {activePlanNotification.reps || 10} Reps
                          </p>
                          <span className="text-[10px] text-sky-700 font-semibold">{activePlanNotification.time || 'Just now'}</span>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          const match = patientExercises.find(ex => ex.id === activePlanNotification.videoId || ex.title === activePlanNotification.exerciseTitle) || patientExercises[0];
                          setActiveAiCoachExercise(match);
                          setIsPatientNotifOpen(false);
                        }}
                        className="w-full py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-lg text-xs font-bold text-center transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                      >
                        <Play size={12} className="fill-current" />
                        <span>Open in AI Motion Coach</span>
                      </button>
                    </div>
                  ) : (
                    <div className="py-6 text-center text-xs text-slate-400">
                      No unread plan notifications. All routines up to date!
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="hidden sm:flex items-center gap-2 px-3 py-2 bg-sky-50/80 rounded-xl border border-sky-200 text-xs font-bold text-sky-800">
              <span className="w-2 h-2 rounded-full bg-sky-500"></span>
              <span>Rehab Program Active</span>
            </div>
          </div>
        </div>

        {/* Floating Toast Notification on Profile Switch */}
        {switchToast && (
          <div className="fixed bottom-6 right-6 bg-slate-900 text-white text-xs sm:text-sm font-bold px-5 py-3 rounded-2xl shadow-2xl z-50 flex items-center gap-2.5 border border-slate-700 animate-slide-up">
            <Sparkles size={16} className="text-amber-400" />
            <span>{switchToast}</span>
          </div>
        )}

        {/* Global Responsive Grid: 1 column on mobile, 4 columns on large screens */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
          
          {/* ============================================================== */}
          {/* LEFT 3 COLUMNS: Systematic Therapy Plan & Exercise Studio       */}
          {/* ============================================================== */}
          <div className="lg:col-span-3 space-y-6">
            
            {/* Real-time Care Plan Notification Banner with First Video Thumbnail */}
            {activePlanNotification && (
              <div className="bg-gradient-to-r from-slate-900 via-sky-950 to-blue-950 rounded-3xl p-4 sm:p-5 text-white shadow-xl shadow-sky-950/20 border border-sky-400/30 flex flex-col md:flex-row items-center justify-between gap-5 relative overflow-hidden animate-slide-up select-none">
                {/* Background glow & decorative accent line */}
                <div className="absolute -right-8 -bottom-8 w-48 h-48 bg-sky-500/15 rounded-full blur-2xl pointer-events-none" />
                <div className="absolute top-0 left-0 w-2 h-full bg-gradient-to-b from-sky-400 to-blue-600" />
                
                <div className="flex items-center gap-4 sm:gap-5 w-full md:w-auto min-w-0">
                  {/* First Video Thumbnail with Play Badge */}
                  <div 
                    onClick={() => {
                      if (activePlanNotification.youtubeId || activePlanNotification.videoUrl) {
                        setActiveVideoModal({
                          title: activePlanNotification.exerciseTitle || activePlanNotification.title,
                          youtubeId: activePlanNotification.youtubeId,
                          videoUrl: activePlanNotification.videoUrl,
                          thumbnail: activePlanNotification.thumbnail
                        });
                      }
                    }}
                    className="relative w-32 sm:w-40 aspect-video rounded-2xl overflow-hidden shadow-lg border border-sky-300/40 shrink-0 group cursor-pointer bg-slate-950 ring-2 ring-sky-500/20"
                    title="Click to watch first clinical video of this plan"
                  >
                    <img 
                      src={activePlanNotification.thumbnail || 'https://img.youtube.com/vi/F_e3U4-Hbr8/hqdefault.jpg'} 
                      alt={activePlanNotification.exerciseTitle || 'Exercise Video'} 
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" 
                    />
                    <div className="absolute inset-0 bg-black/40 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                      <div className="w-9 h-9 rounded-full bg-white text-sky-700 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                        <Play size={16} className="fill-current ml-0.5" />
                      </div>
                    </div>
                    <div className="absolute bottom-1.5 left-1.5 bg-black/80 backdrop-blur-xs px-2 py-0.5 rounded text-[10px] font-mono font-bold text-white flex items-center gap-1">
                      <Film size={10} className="text-sky-400" />
                      <span>Video 1 of Plan</span>
                    </div>
                  </div>

                  {/* Notification Text & Details */}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-sky-500/20 text-sky-200 border border-sky-400/30 flex items-center gap-1.5">
                        <Bell size={11} className="text-amber-300 animate-bounce" />
                        Plan Notification
                      </span>
                      <span className="text-[11px] text-slate-300 font-semibold">
                        {activePlanNotification.time || 'Just now'}
                      </span>
                    </div>

                    <h3 className="text-base sm:text-lg font-black text-white truncate leading-tight">
                      {activePlanNotification.exerciseTitle || activePlanNotification.title}
                    </h3>

                    <p className="text-xs text-slate-300 line-clamp-1 mt-0.5">
                      {activePlanNotification.message || `Dr. ${doctorShort} has assigned this routine.`}
                    </p>

                    <div className="flex items-center gap-2 mt-2 text-xs flex-wrap">
                      <span className="px-2.5 py-0.5 rounded-md bg-white/10 text-white font-bold text-[11px] border border-white/10">
                        {activePlanNotification.sets || 3} Sets × {activePlanNotification.reps || 10} Reps
                      </span>
                      <span className="text-sky-300 text-[11px] font-medium">
                        Prescribed by {doctorName}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center gap-2.5 w-full md:w-auto shrink-0 justify-end">
                  <button
                    type="button"
                    onClick={() => {
                      const matchExercise = patientExercises.find(ex => ex.id === activePlanNotification.videoId || ex.title === activePlanNotification.exerciseTitle) || patientExercises[0];
                      setActiveAiCoachExercise(matchExercise);
                    }}
                    className="flex-1 md:flex-initial px-4 py-2.5 rounded-xl bg-gradient-to-r from-sky-400 to-blue-500 hover:from-sky-500 hover:to-blue-600 text-white font-extrabold text-xs sm:text-sm shadow-md transition-all flex items-center justify-center gap-1.5 cursor-pointer active:scale-95"
                  >
                    <Sparkles size={15} />
                    <span>Start AI Motion Coach</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setDismissedNotificationIds(prev => new Set([...prev, activePlanNotification.id]));
                    }}
                    className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                    title="Dismiss Notification"
                  >
                    <X size={17} />
                  </button>
                </div>
              </div>
            )}

            {/* THE "TODAY'S PLAN" MODULE */}
            <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-sm border border-sky-900/10 p-6 sm:p-7 flex flex-col md:flex-row items-center justify-between gap-6 relative overflow-hidden">
              <div className="space-y-2.5 z-10 flex-1">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-sky-500 animate-pulse"></span>
                  <span className="text-xs sm:text-sm font-bold text-sky-800 uppercase tracking-wider">
                    Today's Rehabilitation Protocol
                  </span>
                </div>
                <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
                  Welcome back, {currentPatient.name}
                </h1>
                <p className="text-xs sm:text-sm text-slate-600 max-w-2xl leading-relaxed">
                  Prescribed for <strong className="text-slate-900">{currentPatient.condition}</strong> under the clinical supervision of <strong className="text-sky-800">{doctorName}</strong>. Follow each step sequentially using standard video guidance and the AI Camera Coach.
                </p>

                <div className="flex items-center gap-3 pt-2 flex-wrap">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-amber-50 text-amber-900 text-xs font-semibold border border-amber-200 shadow-2xs">
                    <Flame size={14} className="text-amber-500 fill-amber-500" />
                    {currentPatient.consistencyStreak || 0} Day Consistency Streak
                  </span>
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-sky-50 text-sky-900 text-xs font-semibold border border-sky-200 shadow-2xs">
                    <Activity size={14} className="text-sky-600" />
                    {currentPatient.adherenceScore || 0}% Program Compliance
                  </span>
                  {currentPatient.medicalReport && (
                    <button
                      type="button"
                      onClick={() => setIsPatientReportModalOpen(true)}
                      className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-white/80 hover:bg-white text-slate-800 text-xs font-semibold border border-sky-900/10 shadow-2xs transition-colors cursor-pointer"
                      title="Review your uploaded hospital medical records and notes"
                    >
                      <FileText size={14} className="text-sky-700" />
                      <span>Hospital Records on File: {currentPatient.medicalReport.fileName}</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Circular SVG Progress Bar (Enlarged and Clear) */}
              <div className="flex flex-col items-center justify-center shrink-0 z-10 bg-sky-50/50 p-4 rounded-2xl border border-sky-100/80">
                <div className="relative w-36 h-36 sm:w-40 sm:h-40 flex items-center justify-center">
                  <svg className="w-36 h-36 sm:w-40 sm:h-40 -rotate-90 transform" viewBox="0 0 120 120">
                    <defs>
                      <linearGradient id="patientProgressGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#0ea5e9" />
                        <stop offset="100%" stopColor="#2563eb" />
                      </linearGradient>
                    </defs>
                    {/* Background track circle */}
                    <circle
                      cx="60"
                      cy="60"
                      r={circleRadius}
                      stroke="#e2e8f0"
                      strokeWidth="10"
                      fill="transparent"
                    />
                    {/* Active progress circle */}
                    <circle
                      cx="60"
                      cy="60"
                      r={circleRadius}
                      stroke="url(#patientProgressGradient)"
                      strokeWidth="10"
                      strokeDasharray={circumference}
                      strokeDashoffset={strokeOffset}
                      strokeLinecap="round"
                      fill="transparent"
                      className="transition-all duration-700 ease-out"
                    />
                  </svg>

                  {/* Percentage in center */}
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                    <span className="text-2xl sm:text-3xl font-extrabold text-gray-900 leading-none">
                      {progressPercent}%
                    </span>
                    <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider mt-1.5">
                      {completedCount} / {totalExercises} Done
                    </span>
                  </div>
                </div>

                <span className="text-xs font-semibold text-gray-600 mt-1.5">
                  Daily Exercise Goal
                </span>
              </div>
            </div>

            {/* PROTOCOL COMPLETION CELEBRATION (Conditionally Shown) */}
            {progressPercent === 100 && totalExercises > 0 && (
              <div className="bg-gradient-to-r from-sky-500 via-blue-600 to-sky-600 rounded-2xl p-6 text-white shadow-lg shadow-sky-500/20 flex flex-col sm:flex-row items-center justify-between gap-4 animate-fade-in">
                <div className="flex items-center gap-4 text-center sm:text-left">
                  <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-xs flex items-center justify-center shrink-0 shadow-inner">
                    <Trophy size={30} className="text-amber-300" />
                  </div>
                  <div>
                    <h3 className="text-lg sm:text-xl font-black">Daily Rehabilitation Protocol Completed!</h3>
                    <p className="text-xs sm:text-sm text-sky-100 mt-0.5">
                      Exceptional work today! Your routine metrics and streak have been synced with Dr. Vance's clinical record.
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="px-3.5 py-1.5 rounded-xl bg-white text-sky-800 text-xs font-black shadow-xs">
                    Goal 100% Met
                  </span>
                </div>
              </div>
            )}

            {/* ============================================================== */}
            {/* SYSTEMATIC ACTIVE EXERCISE CLINICAL STAGE                     */}
            {/* ============================================================== */}
            {exercises.length === 0 ? (
              <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center text-gray-400">
                <FileText size={48} className="mx-auto mb-3 opacity-30 text-gray-400" />
                <h3 className="text-base font-bold text-gray-700">No Prescribed Exercises Today</h3>
                <p className="text-xs sm:text-sm text-gray-500 mt-1 max-w-md mx-auto">
                  Your physical therapist has not assigned any active routines for today. Check your chat with Dr. Vance or await your next clinical assessment.
                </p>
              </div>
            ) : activeExercise ? (
              <div className="bg-white rounded-2xl shadow-sm border border-blue-200/90 overflow-hidden">
                
                {/* Active Stage Header Bar */}
                <div className="bg-gradient-to-r from-blue-50/90 to-indigo-50/70 px-6 py-4 border-b border-blue-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <span className="px-3 py-1 rounded-full text-xs font-black bg-blue-600 text-white shadow-xs uppercase tracking-wider">
                      Step {activeIndex + 1} of {totalExercises}
                    </span>
                    <span className="text-xs sm:text-sm font-bold text-blue-900">
                      Active Rehabilitation Stage
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    {completedExerciseIds.has(activeExercise.id) ? (
                      <div className="flex items-center gap-2 flex-wrap">
                        {aiVerifiedIds.has(activeExercise.id) && (
                          <span className="px-3 py-1 rounded-full text-xs font-black bg-blue-100 text-blue-900 border border-blue-300 flex items-center gap-1.5 shadow-2xs">
                            <Sparkles size={13} className="text-amber-500 fill-amber-400" />
                            <span>AI Verified Correct</span>
                          </span>
                        )}
                        <span className="px-3 py-1 rounded-full text-xs font-black bg-sky-100 text-sky-800 border border-sky-200 flex items-center gap-1.5">
                          <CheckCircle2 size={14} className="text-sky-600" />
                          <span>Completed for Today</span>
                        </span>
                      </div>
                    ) : (
                      <span className="px-3 py-1 rounded-full text-xs font-black bg-amber-100 text-amber-800 border border-amber-200 flex items-center gap-1.5">
                        <Clock size={14} className="text-amber-600" />
                        <span>In Progress</span>
                      </span>
                    )}
                  </div>
                </div>

                {/* Active Stage Main Showcase */}
                <div className="p-6 sm:p-7 space-y-6">
                  
                  {/* Two-Column Showcase: Media Player on Left, Dosage Specs on Right */}
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                    
                    {/* Left: Video Demonstration Frame (lg:col-span-5) */}
                    <div className="lg:col-span-5 space-y-3">
                      {activeExercise.youtubeId ? (
                        <div className="w-full aspect-video rounded-xl shadow-sm overflow-hidden bg-slate-950 border border-slate-200/90 relative">
                          <iframe
                            className="w-full aspect-video rounded-xl shadow-sm"
                            src={`https://www.youtube.com/embed/${activeExercise.youtubeId}?rel=0&modestbranding=1`}
                            title={activeExercise.title}
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen
                          />
                        </div>
                      ) : (
                        <div 
                          onClick={() => setActiveVideoModal(activeExercise)}
                          className="relative w-full aspect-video rounded-xl overflow-hidden bg-slate-900 shadow-sm group cursor-pointer border border-slate-200/90 select-none"
                          title="Click to watch full clinical demonstration video"
                        >
                          <img
                            src={activeExercise.thumbnail || 'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?auto=format&fit=crop&w=600&q=80'}
                            alt={activeExercise.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 opacity-90 group-hover:opacity-100"
                          />
                          <div className="absolute inset-0 bg-slate-950/40 group-hover:bg-slate-950/20 flex flex-col items-center justify-center transition-colors p-4">
                            <div className="w-16 h-16 rounded-full bg-sky-600 text-white flex items-center justify-center shadow-xl group-hover:scale-110 transition-transform">
                              <Play size={24} className="ml-1 fill-white" />
                            </div>
                            <span className="mt-3 text-xs font-black text-white bg-black/60 backdrop-blur-xs px-3 py-1 rounded-full border border-white/20">
                              Watch Demonstration Video
                            </span>
                          </div>
                          <div className="absolute bottom-2.5 right-2.5 bg-black/80 backdrop-blur-xs text-white text-[11px] font-mono font-bold px-2 py-0.5 rounded-md">
                            {activeExercise.duration || '2:00'} min
                          </div>
                        </div>
                      )}

                      <div className="flex items-center justify-between text-xs text-slate-500 px-1">
                        <span className="flex items-center gap-1.5 font-bold text-sky-800">
                          <CheckCircle2 size={14} className="text-sky-600" />
                          <span>Clinical Demonstration</span>
                        </span>
                        <span className="font-semibold text-[11px] bg-slate-100 px-2 py-0.5 rounded text-slate-600">
                          {activeExercise.category || 'Range of Motion'}
                        </span>
                      </div>
                    </div>

                    {/* Right: Clinical Dosage & Prescription Details (lg:col-span-7) */}
                    <div className="lg:col-span-7 space-y-4">
                      <div>
                        <div className="flex items-center gap-2 text-xs font-bold text-sky-700 uppercase tracking-wider mb-1">
                          <HeartPulse size={15} />
                          <span>Prescribed Physical Therapy Exercise</span>
                          {activeExercise.category && (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-sky-100 text-sky-800 border border-sky-200">
                              {activeExercise.category}
                            </span>
                          )}
                        </div>
                        <h2 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight leading-snug">
                          {activeExercise.title}
                        </h2>
                        <p className="text-xs text-slate-500 mt-1">
                          Target: <strong className="text-slate-700">{activeExercise.target || 'Upper body rehabilitation'}</strong> • Supervised by {doctorName || 'Dr. Alex Vance'}
                        </p>
                      </div>

                      {/* Dosage Specs Grid (4 Modern Clinical Cards) */}
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                        <div className="bg-white/80 border border-slate-200/90 rounded-xl p-3 text-center shadow-2xs">
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Sets</span>
                          <span className="text-sm sm:text-base font-extrabold text-slate-900 mt-0.5 block">
                            {activeExercise.sets || 3} Sets
                          </span>
                        </div>

                        <div className="bg-white/80 border border-slate-200/90 rounded-xl p-3 text-center shadow-2xs">
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Reps</span>
                          <span className="text-sm sm:text-base font-extrabold text-sky-700 mt-0.5 block truncate" title={String(activeExercise.reps)}>
                            {typeof activeExercise.reps === 'number' ? `${activeExercise.reps} Reps` : activeExercise.reps}
                          </span>
                        </div>

                        <div className="bg-white/80 border border-slate-200/90 rounded-xl p-3 text-center shadow-2xs">
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Target Joint</span>
                          <span className="text-xs font-extrabold text-slate-900 mt-0.5 block truncate" title={activeExercise.target}>
                            {activeExercise.target ? activeExercise.target.split(',')[0] : 'Shoulder'}
                          </span>
                        </div>

                        <div className="bg-white/80 border border-slate-200/90 rounded-xl p-3 text-center shadow-2xs">
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Pacing</span>
                          <span className="text-sm sm:text-base font-extrabold text-slate-900 mt-0.5 block">
                            Controlled
                          </span>
                        </div>
                      </div>

                      {/* Doctor Vance's Clinical Prescription Notes */}
                      <div className="bg-sky-50/70 border border-sky-200/80 rounded-xl p-4 shadow-2xs">
                        <div className="flex items-center gap-2 mb-1.5">
                          <div className="w-5 h-5 rounded-full bg-sky-600 text-white flex items-center justify-center text-[10px] font-black">
                            PT
                          </div>
                          <span className="text-xs font-bold text-sky-950">
                            Clinical Technique & Form Instructions:
                          </span>
                        </div>
                        <p className="text-xs sm:text-sm text-slate-700 leading-relaxed">
                          {activeExercise.instructions || activeExercise.notes || 'Maintain strict joint alignment, move through full range without sudden jerks, and keep breathing steady.'}
                        </p>
                      </div>

                      {/* High-Visibility Action Buttons Bar */}
                      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-2">
                        {/* Primary Action: AI Camera Coach */}
                        <button
                          type="button"
                          onClick={() => setActiveAiCoachExercise(activeExercise)}
                          className="flex-1 py-3.5 px-5 rounded-xl font-extrabold text-xs sm:text-sm bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-white shadow-lg shadow-sky-600/25 transition-all flex items-center justify-center gap-2.5 cursor-pointer active:scale-95"
                          title="Open Real-Time AI Camera Posture & Finger Landmark Tracking"
                        >
                          <Camera size={18} className="text-white" />
                          <span>Start AI Camera Coach</span>
                          <span className="bg-white/25 text-[10px] uppercase font-mono px-2 py-0.5 rounded-full">
                            Pose & Fingers
                          </span>
                        </button>

                        {/* Secondary Action: Mark Complete Toggle */}
                        <button
                          type="button"
                          onClick={() => handleToggleComplete(activeExercise)}
                          className={`py-3.5 px-6 rounded-xl font-extrabold text-xs sm:text-sm transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95 ${
                            completedExerciseIds.has(activeExercise.id)
                              ? 'bg-sky-50 text-sky-800 border-2 border-sky-400 hover:bg-sky-100'
                              : 'bg-sky-600 hover:bg-sky-700 text-white shadow-md shadow-sky-600/20'
                          }`}
                        >
                          {completedExerciseIds.has(activeExercise.id) ? (
                            <>
                              <CheckCircle2 size={18} className="text-sky-600" />
                              <span>Step Completed ✓</span>
                            </>
                          ) : (
                            <>
                              <Check size={18} />
                              <span>Mark Step Complete</span>
                            </>
                          )}
                        </button>
                      </div>

                    </div>
                  </div>

                </div>

              </div>
            ) : null}

            {/* ============================================================== */}
            {/* SYSTEMATIC SEQUENTIAL EXERCISE PROTOCOL LIST                   */}
            {/* ============================================================== */}
            <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-sm border border-sky-900/10 p-6 sm:p-7 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-sky-900/10 pb-4">
                <div>
                  <h3 className="text-base sm:text-lg font-black text-slate-900 flex items-center gap-2">
                    <Layers size={18} className="text-sky-700" />
                    <span>Daily Protocol Sequence</span>
                    <span className="text-xs font-extrabold px-2.5 py-0.5 rounded-full bg-sky-50 text-sky-800 border border-sky-200">
                      {completedCount} of {totalExercises} Complete
                    </span>
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                    Execute each assigned therapy step in sequence. Click any exercise to inspect its clinical form or launch the AI coach.
                  </p>
                </div>
              </div>

              {/* Step Sequence Items */}
              <div className="space-y-3 pt-1">
                {exercises.map((exercise, index) => {
                  const isCompleted = completedExerciseIds.has(exercise.id);
                  const isCurrentActive = activeExercise?.id === exercise.id;
                  const stepNumber = String(index + 1).padStart(2, '0');

                  return (
                    <div
                      key={exercise.id}
                      className={`rounded-2xl border p-4 sm:p-5 transition-all flex flex-col md:flex-row items-start md:items-center justify-between gap-4 ${
                        isCurrentActive
                          ? 'border-sky-500 bg-sky-50/40 ring-2 ring-sky-500/20 shadow-2xs'
                          : isCompleted
                          ? 'border-sky-200 bg-sky-50/20'
                          : 'border-sky-900/10 hover:border-sky-500/30 bg-white/80'
                      }`}
                    >
                      {/* Left: Step Number, Thumbnail & Details */}
                      <div className="flex items-center gap-4 flex-1 min-w-0">
                        {/* Step Number Indicator */}
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-xs shrink-0 ${
                          isCompleted
                            ? 'bg-sky-600 text-white shadow-xs'
                            : isCurrentActive
                            ? 'bg-blue-600 text-white shadow-xs'
                            : 'bg-slate-100 text-slate-600 border border-slate-200'
                        }`}>
                          {isCompleted ? <Check size={18} /> : stepNumber}
                        </div>

                        {/* Thumbnail */}
                        <div
                          onClick={() => {
                            setSelectedExerciseId(exercise.id);
                            setActiveVideoModal(exercise);
                          }}
                          className="relative w-24 h-16 sm:w-28 sm:h-18 rounded-xl overflow-hidden bg-slate-900 shrink-0 cursor-pointer group shadow-xs select-none"
                          title="Watch demonstration"
                        >
                          <img
                            src={exercise.thumbnail || 'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?auto=format&fit=crop&w=400&q=80'}
                            alt={exercise.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                          />
                          <div className="absolute inset-0 bg-black/40 group-hover:bg-black/20 flex items-center justify-center transition-colors">
                            <div className="w-7 h-7 rounded-full bg-blue-600 text-white flex items-center justify-center shadow-xs">
                              <Play size={12} className="ml-0.5 fill-white" />
                            </div>
                          </div>
                          <span className="absolute bottom-1 right-1 bg-black/80 text-white text-[9px] font-mono px-1 rounded">
                            {exercise.duration || '2:00'}
                          </span>
                        </div>

                        {/* Exercise Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h4 className={`text-sm sm:text-base font-extrabold truncate ${isCompleted ? 'text-sky-950' : 'text-gray-900'}`}>
                              {exercise.title}
                            </h4>
                            {isCurrentActive && (
                              <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-blue-100 text-blue-800">
                                Active in Stage
                              </span>
                            )}
                            {isCompleted && (
                              <div className="flex items-center gap-1.5 flex-wrap">
                                {aiVerifiedIds.has(exercise.id) && (
                                  <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-blue-100 text-blue-900 border border-blue-200 flex items-center gap-1">
                                    <Sparkles size={10} className="text-amber-500 fill-amber-400" />
                                    AI Verified
                                  </span>
                                )}
                                <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-sky-100 text-sky-800">
                                  Completed ✓
                                </span>
                              </div>
                            )}
                          </div>

                          <div className="flex flex-wrap items-center gap-2 text-xs text-gray-500 mt-1">
                            <span className="font-bold text-sky-800 bg-sky-50 px-2 py-0.5 rounded-md border border-sky-100">
                              {exercise.sets || 3} sets × {typeof exercise.reps === 'number' ? `${exercise.reps} reps` : exercise.reps}
                            </span>
                            {exercise.category && (
                              <span className="font-semibold text-slate-500 text-[11px]">
                                • {exercise.category}
                              </span>
                            )}
                            {exercise.target && (
                              <span className="text-slate-400 text-[11px] truncate max-w-[200px]">
                                • {exercise.target}
                              </span>
                            )}
                          </div>
                          {(exercise.instructions || exercise.notes) && (
                            <p className="text-xs text-slate-600 line-clamp-1 mt-1">
                              {exercise.instructions || exercise.notes}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Right: Actions */}
                      <div className="flex items-center gap-2.5 w-full md:w-auto justify-end shrink-0 flex-wrap sm:flex-nowrap">
                        {!isCurrentActive && (
                          <button
                            type="button"
                            onClick={() => setSelectedExerciseId(exercise.id)}
                            className="px-3.5 py-2 rounded-xl font-bold text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 transition-all flex items-center gap-1.5 cursor-pointer"
                          >
                            <span>Open in Stage</span>
                            <ChevronRight size={13} />
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={() => setActiveAiCoachExercise(exercise)}
                          className="px-3.5 py-2 rounded-xl font-bold text-xs bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 transition-all flex items-center gap-1.5 cursor-pointer active:scale-95"
                          title="Open AI Camera Coach for this exercise"
                        >
                          <Camera size={14} />
                          <span>AI Coach</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleToggleComplete(exercise)}
                          className={`px-3.5 py-2 rounded-xl font-bold text-xs transition-all flex items-center gap-1.5 active:scale-95 cursor-pointer ${
                            isCompleted
                              ? 'bg-sky-50 text-sky-800 border border-sky-300 hover:bg-sky-100'
                              : 'bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-white shadow-xs'
                          }`}
                        >
                          {isCompleted ? (
                            <>
                              <CheckCircle2 size={14} className="text-sky-600" />
                              <span>Done</span>
                            </>
                          ) : (
                            <>
                              <Check size={14} />
                              <span>Mark Done</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* ============================================================== */}
            {/* THE PAIN LOG SLIDER & ACCESSIBLE TOUCH BUTTONS MODULE          */}
            {/* ============================================================== */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 sm:p-7 space-y-5">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div>
                  <h3 className="text-base sm:text-lg font-black text-gray-900 flex items-center gap-2">
                    <span>Daily Pain & Discomfort Assessment</span>
                    <span className={`text-xs sm:text-sm font-black px-3 py-1 rounded-full border ${getPainColorClass(painValue)}`}>
                      Score: {painValue} / 10
                    </span>
                  </h3>
                  <p className="text-xs sm:text-sm text-gray-500 mt-1">
                    Select or slide your discomfort level experienced during today's therapy exercises.
                  </p>
                </div>

                {painValue >= 7 && (
                  <span className="text-xs font-black text-rose-700 bg-rose-50 px-3 py-1.5 rounded-xl border border-rose-300 flex items-center gap-1.5 animate-pulse">
                    <AlertCircle size={15} />
                    Severe: Flags Dr. Alex Vance
                  </span>
                )}
              </div>

              {/* Accessible Touch Numerical Buttons (1 to 10) */}
              <div className="space-y-2">
                <span className="text-xs font-bold text-gray-400 uppercase tracking-wider block">
                  Quick Select (Tap your discomfort rating):
                </span>
                <div className="grid grid-cols-5 sm:grid-cols-10 gap-2">
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => {
                    const isSelected = painValue === num;
                    let btnBase = 'border-slate-200 text-slate-700 hover:bg-slate-50';
                    let selectedStyle = 'bg-blue-600 text-white border-blue-600 shadow-md ring-2 ring-blue-300 scale-105';

                    if (num <= 3) {
                      btnBase = 'border-sky-200 text-sky-800 hover:bg-sky-50';
                      selectedStyle = 'bg-sky-600 text-white border-sky-600 shadow-md ring-2 ring-sky-300 scale-105';
                    } else if (num <= 6) {
                      btnBase = 'border-amber-200 text-amber-800 hover:bg-amber-50';
                      selectedStyle = 'bg-amber-500 text-white border-amber-500 shadow-md ring-2 ring-amber-300 scale-105';
                    } else {
                      btnBase = 'border-rose-200 text-rose-800 hover:bg-rose-50';
                      selectedStyle = 'bg-rose-600 text-white border-rose-600 shadow-md ring-2 ring-rose-300 scale-105';
                    }

                    return (
                      <button
                        key={num}
                        type="button"
                        onClick={() => setPainValue(num)}
                        className={`h-12 rounded-xl text-base font-black border transition-all flex flex-col items-center justify-center cursor-pointer active:scale-95 ${
                          isSelected ? selectedStyle : `bg-white ${btnBase}`
                        }`}
                      >
                        <span>{num}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Continuous Slider Input (1 to 10) */}
              <div className="space-y-2 pt-1">
                <input
                  type="range"
                  min="1"
                  max="10"
                  step="1"
                  value={painValue}
                  onChange={(e) => setPainValue(Number(e.target.value))}
                  style={{
                    background: getPainTrackBackground()
                  }}
                  className="w-full h-3.5 rounded-lg appearance-none cursor-pointer accent-blue-700 transition-all shadow-inner"
                />

                <div className="flex justify-between text-xs font-bold text-gray-500 px-0.5">
                  <span className="text-sky-700">1 - Minimal / No Pain</span>
                  <span className="text-amber-700">5 - Moderate</span>
                  <span className="text-rose-700">10 - Severe Discomfort</span>
                </div>
              </div>

              {/* Clinical directive & Log Button */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pt-3 border-t border-gray-100">
                <div className="text-xs sm:text-sm text-gray-600">
                  <span>Clinical Assessment: </span>
                  <strong className="text-gray-900 font-bold">
                    {painValue <= 3
                      ? 'Mild & Tolerable (Light Blue) — Safe to continue prescribed exercise dosage.'
                      : painValue <= 6
                      ? 'Moderate Discomfort (Amber) — Consider adding rest pauses between sets.'
                      : 'Severe Discomfort (Red) — Notifying Dr. Vance to review recovery protocol.'}
                  </strong>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  {painLoggedSuccess && (
                    <span className="text-xs font-black text-sky-600 flex items-center gap-1.5 animate-fade-in">
                      <CheckCircle2 size={16} />
                      <span>Logged to Chart</span>
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={handleLogPainScore}
                    className="px-5 py-3 bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-white rounded-xl text-xs sm:text-sm font-black shadow-md shadow-sky-600/25 transition-all active:scale-95 cursor-pointer"
                  >
                    Save & Log Score
                  </button>
                </div>
              </div>
            </div>

          </div>

          {/* ============================================================== */}
          {/* RIGHT 1 COLUMN: Real-Time Messaging App Experience (Live Chat) */}
          {/* ============================================================== */}
          <div className="lg:col-span-1">
            <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-xl shadow-sky-950/5 border border-sky-900/10 flex flex-col h-[760px] overflow-hidden sticky top-6">
              
              {/* Modern App Chat Header */}
              <div className="p-3.5 sm:p-4 border-b border-sky-900/10 bg-white/90 backdrop-blur-md flex items-center justify-between shrink-0 z-10">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="relative shrink-0">
                    {assignedDoctorObj?.avatar ? (
                      <img 
                        src={assignedDoctorObj.avatar} 
                        alt={doctorName} 
                        className="w-10 h-10 rounded-2xl object-cover shadow-sm ring-2 ring-blue-100" 
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center font-black text-xs shadow-sm ring-2 ring-blue-100">
                        {doctorName.split(' ').map(n => n[0]).slice(0, 2).join('')}
                      </div>
                    )}
                    <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-sky-500 border-2 border-white ring-1 ring-sky-400/40 animate-pulse" title="Active now"></span>
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1">
                      <h3 className="font-extrabold text-gray-900 text-sm truncate">{doctorShort}</h3>
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-600 shrink-0"></span>
                    </div>
                    {isDoctorTyping ? (
                      <p className="text-xs font-bold text-blue-600 flex items-center gap-1.5 animate-pulse">
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-600"></span>
                        <span>typing...</span>
                      </p>
                    ) : (
                      <p className="text-[11px] font-semibold text-sky-600 flex items-center gap-1.5 truncate">
                        <span className="w-1.5 h-1.5 rounded-full bg-sky-500"></span>
                        <span>Active now • Instant reply</span>
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-1 text-gray-400">
                  <button
                    type="button"
                    onClick={() => {
                      setSwitchToast('Telehealth audio consultation active for ' + doctorShort);
                      setTimeout(() => setSwitchToast(''), 3000);
                    }}
                    className="p-2 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-colors cursor-pointer"
                    title="Start Voice Consultation"
                  >
                    <Phone size={16} />
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setSwitchToast('Telehealth video consultation line connected to Dr. Vance');
                      setTimeout(() => setSwitchToast(''), 3000);
                    }}
                    className="p-2 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-colors cursor-pointer"
                    title="Start Live Video Telehealth"
                  >
                    <Video size={17} />
                  </button>
                </div>
              </div>

              {/* Chat Messages Feed with WhatsApp-style Background Pattern */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50/70 scrollbar-thin">
                
                {/* Date separator */}
                <div className="flex justify-center my-1.5">
                  <span className="bg-slate-200/80 text-slate-600 text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider shadow-2xs">
                    Today
                  </span>
                </div>
                {allMessages.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-center text-gray-400 p-4">
                    <FileText size={36} className="opacity-30 mb-2" />
                    <p className="text-sm font-bold text-gray-600">No messages yet.</p>
                    <p className="text-xs text-gray-400 mt-0.5 max-w-[200px]">
                      Send a message to {doctorShort} to ask questions or discuss your recovery progress.
                    </p>
                  </div>
                ) : (
                  allMessages.map((msg, index) => {
                    const isDoctor = msg.sender === 'doctor' || msg.sender_id === 'doctor';
                    const messageContent = msg.message_text || msg.text || '';

                    return (
                      <div
                        key={msg.id ? `${msg.id}-${index}` : index}
                        className={`flex gap-2 items-end ${isDoctor ? 'justify-start' : 'justify-end'}`}
                      >
                        {/* Doctor Avatar on incoming bubbles */}
                        {isDoctor && (
                          assignedDoctorObj?.avatar ? (
                            <img 
                              src={assignedDoctorObj.avatar} 
                              alt={doctorShort} 
                              className="w-7 h-7 rounded-full object-cover shrink-0 mb-1 shadow-xs border border-blue-200" 
                            />
                          ) : (
                            <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center font-bold text-[10px] shrink-0 mb-1 shadow-xs">
                              {doctorShort.split(' ').map(n => n[0]).slice(0, 2).join('')}
                            </div>
                          )
                        )}

                        <div className={`flex flex-col ${isDoctor ? 'items-start' : 'items-end'} max-w-[85%]`}>
                          <div
                            className={`p-3.5 rounded-2xl shadow-xs text-xs sm:text-sm leading-relaxed transition-all ${
                              isDoctor
                                ? 'bg-white text-gray-900 border border-gray-200/80 rounded-tl-xs shadow-slate-100'
                                : 'bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 text-white rounded-tr-xs shadow-md shadow-blue-500/15'
                            }`}
                          >
                            {isDoctor && (
                              <div className="flex items-center gap-1.5 mb-1 pb-1 border-b border-gray-100">
                                <span className="text-[11px] font-black text-blue-700">{doctorShort}</span>
                                <span className="text-[9px] bg-blue-50 text-blue-600 px-1.5 py-0.2 rounded font-bold">Physical Therapist</span>
                              </div>
                            )}

                            {messageContent.includes('📄 Uploaded Medical Report:') ? (
                              <div className={`p-2.5 rounded-xl border text-xs leading-relaxed ${
                                isDoctor ? 'bg-blue-50 border-blue-200 text-blue-950' : 'bg-blue-700/60 border-blue-400 text-white'
                              }`}>
                                <span className="font-bold flex items-center gap-1 mb-1 text-[11px] uppercase tracking-wider">
                                  <FileText size={13} />
                                  Hospital Intake Document Attached
                                </span>
                                <p className="whitespace-pre-line">{messageContent}</p>
                              </div>
                            ) : (
                              <p className="whitespace-pre-line">{messageContent}</p>
                            )}

                            {/* Embedded Demonstration Video Card */}
                            {msg.videoUrl && (
                              <div
                                onClick={() => {
                                  setActiveVideoModal({
                                    title: msg.title || 'Therapist Attached Exercise Demonstration',
                                    videoUrl: msg.videoUrl,
                                    thumbnail: msg.thumbnail,
                                    youtubeId: msg.youtubeId
                                  });
                                }}
                                className="mt-2.5 rounded-xl overflow-hidden border border-gray-200 bg-black cursor-pointer group shadow-sm select-none"
                                title="Click to watch attached clinical video"
                              >
                                <div className="relative aspect-video flex items-center justify-center">
                                  {msg.thumbnail ? (
                                    <img
                                      src={msg.thumbnail}
                                      alt={msg.title || 'Exercise video'}
                                      className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                                    />
                                  ) : (
                                    <div className="w-full h-full bg-slate-900 flex items-center justify-center">
                                      <Play size={24} className="text-white opacity-70" />
                                    </div>
                                  )}
                                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                                    <div className="w-9 h-9 rounded-full bg-blue-600/90 text-white flex items-center justify-center group-hover:scale-110 transition-transform">
                                      <Play size={15} className="ml-0.5 fill-white" />
                                    </div>
                                  </div>
                                </div>
                                {msg.title && (
                                  <div className="p-2 bg-slate-900 text-white text-xs font-bold truncate">
                                    {msg.title}
                                  </div>
                                )}
                              </div>
                            )}

                            {/* Bubble Timestamp & Double Checkmark Footer */}
                            <div className={`flex items-center gap-1 mt-1 justify-end text-[10px] ${
                              isDoctor ? 'text-gray-400' : 'text-blue-200'
                            }`}>
                              <span>{msg.timestamp || 'Just now'}</span>
                              {!isDoctor && (
                                <span title="Delivered & Read">
                                  <CheckCheck size={13} className="text-sky-300 stroke-[2.5]" />
                                </span>
                              )}
                            </div>

                          </div>
                        </div>
                      </div>
                    );
                  })
                )}

                {/* Animated Typing Indicator Bubble */}
                {isDoctorTyping && (
                  <div className="flex items-end gap-2 text-xs text-gray-500 animate-fade-in pl-1">
                    <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center font-bold text-[10px] shrink-0 mb-1 shadow-xs">
                      {doctorShort.split(' ').map(n => n[0]).slice(0, 2).join('')}
                    </div>
                    <div className="bg-white border border-gray-200 px-4 py-3 rounded-2xl rounded-tl-xs shadow-xs flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-blue-600 animate-bounce [animation-delay:-0.3s]"></span>
                      <span className="w-2 h-2 rounded-full bg-blue-600 animate-bounce [animation-delay:-0.15s]"></span>
                      <span className="w-2 h-2 rounded-full bg-blue-600 animate-bounce"></span>
                      <span className="ml-1.5 text-[11px] font-bold text-slate-500">{doctorTypingName || doctorShort} is typing...</span>
                    </div>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>

              {/* Quick Reply Chips Strip */}
              <div className="px-3 py-2 bg-slate-100/90 border-t border-gray-100 flex items-center gap-1.5 overflow-x-auto scrollbar-none shrink-0">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider shrink-0 pl-1">
                  Quick:
                </span>
                {[
                  "💬 How is my form looking?",
                  "🧊 Should I ice after this routine?",
                  "⚠️ Experiencing some joint stiffness",
                  "✅ Completed all prescribed sets!"
                ].map((chip, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleSendMessage(chip)}
                    className="px-2.5 py-1 rounded-full bg-white hover:bg-blue-50 border border-gray-200 hover:border-blue-300 text-slate-700 hover:text-blue-700 text-[11px] font-semibold whitespace-nowrap transition-all shadow-2xs active:scale-95 cursor-pointer shrink-0"
                  >
                    {chip}
                  </button>
                ))}
              </div>

              {/* Chat Input Bar */}
              <div className="p-3 border-t border-gray-200/90 bg-white flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => handleSendMessage("📄 Attaching updated hospital progress report.")}
                  className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-colors cursor-pointer"
                  title="Attach Document"
                >
                  <Paperclip size={18} />
                </button>
                <input
                  type="text"
                  value={chatInput}
                  onChange={handleChatInputChange}
                  onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                  placeholder={`Message ${doctorShort}...`}
                  className="flex-1 px-4 py-2.5 bg-slate-100 focus:bg-white border border-gray-200 focus:border-blue-500 rounded-2xl text-xs sm:text-sm outline-hidden transition-all text-gray-900"
                />
                <button
                  type="button"
                  onClick={() => handleSendMessage()}
                  disabled={!chatInput.trim() || isSending}
                  className="p-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 disabled:opacity-40 text-white rounded-xl shadow-md shadow-blue-500/20 transition-all active:scale-95 flex items-center justify-center shrink-0 cursor-pointer"
                  title="Send Message"
                >
                  <Send size={16} />
                </button>
              </div>

            </div>
          </div>

        </div>

      </div>

      {/* ============================================================== */}
      {/* VIDEO DEMONSTRATION POPUP MODAL                                */}
      {/* ============================================================== */}
      {activeVideoModal && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-2xl max-w-2xl w-full overflow-hidden shadow-2xl border border-gray-200 animate-slide-up">
            
            {/* Modal Header */}
            <div className="px-5 py-4 border-b border-gray-200 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-gray-900">{activeVideoModal.title}</h3>
                <p className="text-xs text-gray-500">Clinical Demonstration Video</p>
              </div>
              <button
                onClick={() => {
                  setActiveVideoModal(null);
                }}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-gray-600 flex items-center justify-center transition-colors cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            {/* Video Player */}
            <div className="w-full aspect-video rounded-xl shadow-sm bg-black relative flex items-center justify-center overflow-hidden">
              {activeVideoModal.youtubeId ? (
                <iframe
                  className="w-full aspect-video rounded-xl shadow-sm"
                  src={`https://www.youtube.com/embed/${activeVideoModal.youtubeId}?autoplay=1&rel=0&modestbranding=1`}
                  title={activeVideoModal.title}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              ) : (
                <video
                  ref={modalVideoRef}
                  src={activeVideoModal.videoUrl}
                  poster={activeVideoModal.thumbnail}
                  autoPlay
                  controls
                  playsInline
                  className="w-full h-full object-contain"
                />
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-slate-50 flex items-center justify-between">
              <span className="text-xs text-gray-500">
                Form tip: Perform controlled repetitions and maintain steady breathing.
              </span>
              <button
                onClick={() => {
                  handleToggleComplete(activeVideoModal);
                  setActiveVideoModal(null);
                }}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <Check size={14} />
                <span>Mark Completed & Close</span>
              </button>
            </div>

          </div>
        </div>
      )}


      {/* AI Live Motion Coach Camera Modal */}
      {activeAiCoachExercise && (
        <AiMotionCoachModal
          key={activeAiCoachExercise.id || activeAiCoachExercise.title || 'coach-modal'}
          isOpen={!!activeAiCoachExercise}
          onClose={() => setActiveAiCoachExercise(null)}
          exercise={activeAiCoachExercise}
          patient={currentPatient}
          onCompleteExercise={(ex) => {
            if (ex?.id) {
              setAiVerifiedIds(prev => new Set(prev).add(ex.id));
            }
            handleToggleComplete(ex);
            setActiveAiCoachExercise(null);
          }}
        />
      )}

      {/* Patient Intake & Registration Modal */}
      <PatientRegistrationModal
        isOpen={isRegisterModalOpen}
        onClose={() => setIsRegisterModalOpen(false)}
        onRegisterSuccess={(newPatient) => {
          if (onAddPatient) {
            onAddPatient(newPatient);
          }
          if (onSelectPatient) {
            onSelectPatient(newPatient.id);
          }
          setSwitchToast(`Welcome, ${newPatient.name}! Profile registered & linked with ${newPatient.assignedDoctor || 'assigned specialist'}.`);
          setTimeout(() => setSwitchToast(''), 4500);
        }}
      />

      {/* Patient's Own Hospital Medical Report Modal */}
      <MedicalReportModal 
        isOpen={isPatientReportModalOpen}
        onClose={() => setIsPatientReportModalOpen(false)}
        patient={currentPatient}
      />

    </div>
  );
}
