import React, { useState, useRef, useEffect } from 'react';
import { Send, UserCheck, Paperclip, FileVideo, PlayCircle, CheckCheck, Maximize2, Minimize2, Sparkles, Dumbbell, Layers, ChevronRight } from 'lucide-react';
import { getSocket } from '../api/client';
import { sounds } from '../utils/soundEffects';

function ChatMessageVideo({ videoUrl, thumbnail, title, sets, reps, notes, onOpenPlan }) {
  const displayThumbnail = thumbnail ||
    (videoUrl?.includes('heel-slides') ? 'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?auto=format&fit=crop&w=800&q=80' :
      videoUrl?.includes('quad-sets') ? 'https://images.unsplash.com/photo-1518611012118-696072aa579a?auto=format&fit=crop&w=800&q=80' :
        videoUrl?.includes('pendulum') ? 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?auto=format&fit=crop&w=800&q=80' :
          videoUrl?.includes('ankle-pumps') ? 'https://images.unsplash.com/photo-1518611012118-696072aa579a?auto=format&fit=crop&w=800&q=80' :
            videoUrl?.includes('knee-extension') ? 'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?auto=format&fit=crop&w=800&q=80' :
              'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?auto=format&fit=crop&w=800&q=80');

  const displayTitle = title ||
    (videoUrl?.includes('heel-slides') ? 'Supine Heel Slides on Mat' :
      videoUrl?.includes('quad-sets') ? 'Quad Sets (Isometric Activation)' :
        videoUrl?.includes('straight-leg') ? 'Straight Leg Raises (SLR)' :
          videoUrl?.includes('pendulum') ? "Codman's Pendulum Exercises" :
            videoUrl?.includes('ankle-pumps') ? 'Ankle Pumps & Edema Drainage' :
              videoUrl?.includes('knee-extension') ? 'Seated Knee Extension (Long Arc Quads)' :
                videoUrl?.includes('wall-slides') ? 'Assisted Wall Slides' :
                  videoUrl?.includes('shoulder-rotation') ? 'Shoulder External Rotation Drill' :
                    videoUrl?.includes('squat-rehab') ? 'Rehabilitation Shallow Squats' :
                      'Physical Therapy Protocol');

  return (
    <div className="mb-2.5 max-w-sm w-full rounded-2xl overflow-hidden shadow-sm border border-slate-700 bg-slate-900 text-white select-none group">
      {/* Plan Header Banner */}
      <div className="px-3 py-1.5 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-xs font-bold text-sky-300">
          <Dumbbell size={13} className="text-sky-400" />
          <span>Prescribed Exercise</span>
        </div>
        {sets && reps ? (
          <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-blue-600 text-white">
            {sets} Sets × {reps} Reps
          </span>
        ) : (
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-800 text-slate-300">
            Routine
          </span>
        )}
      </div>

      {/* Video Preview with Click to Open Container Overlay */}
      <div
        onClick={() => {
          if (onOpenPlan) {
            onOpenPlan();
          }
        }}
        className="relative w-full h-32 sm:h-36 cursor-pointer group/chatthumb select-none overflow-hidden"
        title="Click to open exercise plan and videos in doctor workspace"
      >
        <img
          src={displayThumbnail}
          alt={displayTitle}
          className="w-full h-full object-cover group-hover/chatthumb:scale-105 transition-transform duration-500"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-black/25 group-hover/chatthumb:via-black/15 flex flex-col items-center justify-center transition-all">
          <div className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center shadow-lg group-hover/chatthumb:scale-110 transition-transform border border-white/50">
            <PlayCircle size={22} className="text-white fill-white/20 ml-0.5" />
          </div>
          <span className="mt-1 text-[10px] font-bold text-white bg-blue-600/90 hover:bg-blue-600 px-2.5 py-0.5 rounded-full border border-white/30 shadow flex items-center gap-1">
            <Layers size={11} />
            <span>Open Exercise Studio</span>
          </span>
        </div>

        <div className="absolute top-2 left-2 bg-black/80 backdrop-blur-md px-2 py-0.5 rounded text-[10px] font-semibold text-white flex items-center pointer-events-none shadow z-10 max-w-[90%]">
          <span className="w-1.5 h-1.5 rounded-full mr-1.5 bg-sky-400 shrink-0"></span>
          <span className="truncate">{displayTitle}</span>
        </div>
      </div>

      {/* Clinical Notes (if prescribed) */}
      {notes && (
        <div className="px-3 py-1.5 bg-slate-950/80 border-t border-slate-800 text-xs text-slate-300 italic">
          "{notes}"
        </div>
      )}

      {/* Clickable Action Button */}
      <div className="p-2 bg-slate-900 border-t border-slate-800">
        <button
          type="button"
          onClick={() => {
            if (onOpenPlan) {
              onOpenPlan();
            }
          }}
          className="w-full py-1.5 px-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-all shadow-xs cursor-pointer active:scale-98"
        >
          <Dumbbell size={12} />
          <span>Open in Exercise Studio</span>
          <ChevronRight size={12} />
        </button>
      </div>
    </div>
  );
}

export default function ChatInterface({ 
  patient, 
  onSendMessage, 
  onUpdatePatient,
  targetedNotification = null,
  onClearTargetedNotification = null,
  isExpanded = false,
  onToggleExpand = null,
  onOpenPlanContainer = null,
  onOpenPlanAside = null
}) {
  const [inputValue, setInputValue] = useState('');
  const [showAttachmentMenu, setShowAttachmentMenu] = useState(false);
  const [isPatientTyping, setIsPatientTyping] = useState(false);
  const [liveMessagesByPatient, setLiveMessagesByPatient] = useState({});
  const [highlightedMessageId, setHighlightedMessageId] = useState(null);
  const typingTimeoutRef = useRef(null);
  const messagesEndRef = useRef(null);
  const messageRefs = useRef({});
  const inputRef = useRef(null);

  // Merge parent patient.messages with live incoming socket messages with deep deduplication
  const displayMessages = React.useMemo(() => {
    const base = patient?.messages || [];
    const patientId = patient?.id;
    const liveList = (patientId ? liveMessagesByPatient[patientId] : null) || [];
    const combined = [...base, ...liveList];

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
  }, [patient, liveMessagesByPatient]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Socket listener for patient typing & live incoming messages and sounds
  useEffect(() => {
    const socket = getSocket();
    if (!socket || !patient?.id) return;

    socket.emit('joinRoom', patient.id);
    socket.emit('join_patient_room', patient.id);
    socket.emit('joinTherapistRoom');

    const handleUserTyping = ({ patientId, sender }) => {
      if (patientId === patient.id && sender === 'patient') {
        setIsPatientTyping(true);
      }
    };
    const handleUserStopTyping = ({ patientId, sender }) => {
      if (patientId === patient.id && sender === 'patient') {
        setIsPatientTyping(false);
      }
    };

    const handleIncoming = (newMsg) => {
      if (!newMsg) return;
      setIsPatientTyping(false);

      const belongsToThisPatient = 
        newMsg.patientId === patient.id || 
        newMsg.patient_id === patient.id || 
        newMsg.sender_id === patient.id ||
        (newMsg.receiver_id === 'doctor' && (newMsg.sender === 'patient' || newMsg.sender_id === patient.id)) ||
        (newMsg.receiver_id === patient.id);

      if (belongsToThisPatient) {
        if (newMsg.sender === 'patient' || newMsg.sender_id === patient.id) {
          sounds.playReceive();
        }

        const newText = (newMsg.text || newMsg.message_text || '').trim();
        const newSender = newMsg.sender || newMsg.sender_id || '';

        setLiveMessagesByPatient(prev => {
          const list = prev[patient.id] || [];
          if (list.some(m => m.id === newMsg.id || ((m.sender || m.sender_id) === newSender && (m.text || m.message_text || '').trim() === newText))) return prev;
          return {
            ...prev,
            [patient.id]: [...list, newMsg]
          };
        });

        if (onUpdatePatient) {
          onUpdatePatient(p => {
            if (p.id !== patient.id) return p;
            if (p.messages?.some(m => m.id === newMsg.id || ((m.sender || m.sender_id) === newSender && (m.text || m.message_text || '').trim() === newText))) return p;
            return {
              ...p,
              messages: [...(p.messages || []), newMsg]
            };
          });
        }
      }
    };

    const handleGlobal = (payload) => {
      const msg = payload?.message || payload;
      const pid = payload?.patientId || msg?.patientId || msg?.patient_id;
      if (pid === patient.id && msg) {
        handleIncoming(msg);
      }
    };

    const handleVideoAssigned = (payload) => {
      if (!payload) return;
      const pid = payload.patientId || payload.patient_id;
      if (pid === patient.id) {
        if (payload.message) {
          handleIncoming(payload.message);
        }
      }
    };

    socket.on('user_typing', handleUserTyping);
    socket.on('user_stop_typing', handleUserStopTyping);
    socket.on('new_message', handleIncoming);
    socket.on('global_message', handleGlobal);
    socket.on('video_assigned', handleVideoAssigned);

    return () => {
      socket.off('user_typing', handleUserTyping);
      socket.off('user_stop_typing', handleUserStopTyping);
      socket.off('new_message', handleIncoming);
      socket.off('global_message', handleGlobal);
      socket.off('video_assigned', handleVideoAssigned);
    };
  }, [patient?.id, onUpdatePatient]);

  // Scroll to bottom on new message or typing state change (unless focusing a notification message)
  useEffect(() => {
    if (!highlightedMessageId) {
      scrollToBottom();
    }
  }, [displayMessages, isPatientTyping, highlightedMessageId]);

  // Target and highlight specific notification message when navigated from TopNav
  useEffect(() => {
    if (!targetedNotification || !patient?.id) return;

    // Check if notification matches this patient
    if (targetedNotification.patientId && targetedNotification.patientId !== patient.id) {
      return;
    }

    const rawSnippet = (targetedNotification.message || '')
      .replace(/^["'“”]|["'“”]$/g, '')
      .trim()
      .toLowerCase();

    // 1. Try to find message by snippet content
    let targetMsg = displayMessages.find(m => {
      const text = (m.text || m.message_text || '').toLowerCase();
      return rawSnippet && (text.includes(rawSnippet) || rawSnippet.includes(text));
    });

    // 2. If not found by snippet, pick the most recent patient message
    if (!targetMsg) {
      const patientMsgs = displayMessages.filter(m => m.sender === 'patient' || m.sender_id === patient.id);
      targetMsg = patientMsgs[patientMsgs.length - 1];
    }

    if (targetMsg?.id) {
      const scrollTimer = setTimeout(() => {
        setHighlightedMessageId(targetMsg.id);
        const el = messageRefs.current[targetMsg.id];
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
        inputRef.current?.focus();
      }, 80);

      const fadeTimer = setTimeout(() => {
        setHighlightedMessageId(null);
        if (onClearTargetedNotification) {
          onClearTargetedNotification();
        }
      }, 4500);

      return () => {
        clearTimeout(scrollTimer);
        clearTimeout(fadeTimer);
      };
    }
  }, [targetedNotification, patient?.id, displayMessages, onClearTargetedNotification]);

  const handleInputChange = (e) => {
    const val = e.target.value;
    setInputValue(val);

    const socket = getSocket();
    if (socket && socket.connected) {
      socket.emit('typing', {
        patientId: patient.id,
        sender: 'doctor',
        name: patient.assignedDoctor || 'Attending Physician'
      });

      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = setTimeout(() => {
        socket.emit('stop_typing', {
          patientId: patient.id,
          sender: 'doctor'
        });
      }, 1500);
    }
  };

  const handleSendMessageText = (textToSend) => {
    const text = (textToSend || '').trim();
    if (!text || !patient?.id) return;

    sounds.playSend();
    // oxlint-disable-next-line react/purity
    const now = new Date();
    const readableTime = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const optimisticMessage = {
      id: `msg-${now.getTime()}`,
      patientId: patient.id,
      sender: 'doctor',
      sender_id: 'doctor',
      receiver_id: patient.id,
      text,
      message_text: text,
      timestamp: readableTime,
      createdAt: now.toISOString()
    };

    // Render immediately in doctor's conversation view
    setLiveMessagesByPatient(prev => {
      const list = prev[patient.id] || [];
      return {
        ...prev,
        [patient.id]: [...list, optimisticMessage]
      };
    });

    // Forward to parent handler (REST API + global state update) with exact optimistic ID
    onSendMessage(patient.id, text, null, null, null, optimisticMessage.id);

    // Stop typing indicator on socket
    const socket = getSocket();
    if (socket && socket.connected) {
      socket.emit('stop_typing', {
        patientId: patient.id,
        sender: 'doctor'
      });
    }
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);

    setInputValue('');
    setShowAttachmentMenu(false);
  };

  const handleFormSubmit = (e) => {
    e.preventDefault();
    handleSendMessageText(inputValue);
  };

  const handleAttachVideo = () => {
    if (!patient?.id) return;
    const firstVideo = patient?.activeVideos?.[0] || {
      videoUrl: '/videos/squats.webm',
      thumbnail: 'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
      title: 'Squat Rehabilitation Protocol'
    };
    sounds.playSend();
    // oxlint-disable-next-line react/purity
    const now = new Date();
    const readableTime = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const attachmentText = `I've attached the clinical demonstration video for "${firstVideo.title}". Please watch the form and complete your routine!`;

    const optimisticMessage = {
      id: `msg-${now.getTime()}`,
      patientId: patient.id,
      sender: 'doctor',
      sender_id: 'doctor',
      receiver_id: patient.id,
      text: attachmentText,
      message_text: attachmentText,
      videoUrl: firstVideo.videoUrl,
      thumbnail: firstVideo.thumbnail,
      title: firstVideo.title,
      timestamp: readableTime,
      createdAt: now.toISOString()
    };

    setLiveMessagesByPatient(prev => {
      const list = prev[patient.id] || [];
      return {
        ...prev,
        [patient.id]: [...list, optimisticMessage]
      };
    });

    onSendMessage(
      patient.id,
      attachmentText,
      firstVideo.videoUrl,
      firstVideo.thumbnail,
      firstVideo.title,
      optimisticMessage.id
    );

    const socket = getSocket();
    if (socket && socket.connected) {
      socket.emit('stop_typing', {
        patientId: patient.id,
        sender: 'doctor'
      });
    }

    setShowAttachmentMenu(false);
  };

  return (
    <div className="flex flex-col h-full bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
      
      {/* Header */}
      <div className="px-4 sm:px-5 py-3 border-b border-gray-200 bg-slate-50/70 flex items-center justify-between shrink-0">
        <div className="flex items-center space-x-3 min-w-0">
          <div className="relative shrink-0">
            <div className="w-9 h-9 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center font-black text-xs shadow-2xs">
              {patient?.name?.split(' ').map(n => n[0]).join('') || 'PT'}
            </div>
            <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-sky-500 border-2 border-white ring-1 ring-sky-300"></div>
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-extrabold text-gray-900 truncate">{patient.name}</h2>
              <span className="text-[10px] font-bold text-blue-700 bg-blue-50 px-2 py-0.2 rounded-full border border-blue-200 truncate hidden sm:inline">
                {patient.condition}
              </span>
            </div>
            {isPatientTyping ? (
              <p className="text-xs font-bold text-blue-600 flex items-center gap-1.5 animate-pulse">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-600"></span>
                <span>{patient.name} is typing...</span>
              </p>
            ) : (
              <p className="text-[11px] font-semibold text-sky-600 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-sky-500"></span>
                <span className="truncate">Patient Online • Real-time WebSocket</span>
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center space-x-2 shrink-0 ml-2">
          {onOpenPlanAside && (
            <button
              type="button"
              onClick={onOpenPlanAside}
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-xl text-xs font-bold transition-all shadow-2xs cursor-pointer active:scale-95"
              title="Build or customize exercise plans beside this chat"
            >
              <Dumbbell size={13} className="text-blue-600" />
              <span>Build Plan Aside</span>
            </button>
          )}

          {onToggleExpand && (
            <button
              type="button"
              onClick={onToggleExpand}
              className="w-8 h-8 rounded-lg bg-white hover:bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-600 hover:text-blue-600 transition-colors shadow-2xs cursor-pointer"
              title={isExpanded ? "Restore Side-by-Side (Chat + Plan Aside)" : "Maximize Chat (Full Screen)"}
            >
              {isExpanded ? <Minimize2 size={15} /> : <Maximize2 size={15} />}
            </button>
          )}
        </div>
      </div>

      {/* Message Feed */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4 scrollbar-thin bg-slate-50/50">
        
        {/* Date separator */}
        <div className="flex justify-center my-1">
          <span className="bg-slate-200/80 text-slate-600 text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider">
            Today
          </span>
        </div>

        {displayMessages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-400">
            <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-4">
              <Send size={24} className="text-gray-300 ml-1" />
            </div>
            <p className="text-sm font-medium">No messages yet.</p>
            <p className="text-xs mt-1 text-gray-500">Send a message to start the conversation.</p>
          </div>
        ) : (
          displayMessages.map((msg, index) => {
            const isDoctor = msg.sender === 'doctor';
            const isHighlighted = Boolean(msg.id && msg.id === highlightedMessageId);
            return (
              <div 
                key={msg.id ? `${msg.id}-${index}` : index}
                ref={el => { if (msg.id) messageRefs.current[msg.id] = el; }}
                className={`flex flex-col transition-all duration-300 ${isDoctor ? 'items-end' : 'items-start'} ${
                  isHighlighted ? 'scale-[1.01] my-1' : ''
                }`}
              >
                {isHighlighted && (
                  <div className={`flex items-center gap-1.5 text-[10px] font-bold text-blue-700 mb-1 px-2.5 py-0.5 bg-blue-100 rounded-full border border-blue-300 shadow-xs animate-bounce ${
                    isDoctor ? 'mr-1' : 'ml-1'
                  }`}>
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-ping"></span>
                    <span>📍 Focused from Notification</span>
                  </div>
                )}
                <div className="flex items-end space-x-2 max-w-[85%] group">
                  {!isDoctor && (
                    <div className="w-7 h-7 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-[10px] shrink-0 mb-1">
                      {patient?.name?.split(' ').map(n => n[0]).join('') || 'PT'}
                    </div>
                  )}

                  <div className={`px-4 py-3 rounded-2xl relative shadow-xs leading-relaxed text-xs sm:text-sm transition-all duration-300 ${
                    isHighlighted
                      ? 'ring-3 ring-blue-500 ring-offset-2 bg-blue-50/95 text-gray-900 border border-blue-300 shadow-md'
                      : isDoctor
                        ? 'bg-blue-600 text-white rounded-br-xs shadow-blue-500/10'
                        : 'bg-white border border-gray-200/90 text-gray-800 rounded-bl-xs'
                  }`}>
                    {(msg.videoUrl || msg.text?.includes('demonstration video') || msg.text?.includes('recovery video') || msg.text?.includes('recovery routine') || msg.text?.includes('exercise plan') || msg.isPlan) && (
                      <ChatMessageVideo
                        videoUrl={msg.videoUrl}
                        thumbnail={msg.thumbnail}
                        title={msg.title}
                        sets={msg.sets}
                        reps={msg.reps}
                        notes={msg.notes}
                        onOpenPlan={() => onOpenPlanContainer?.(msg)}
                      />
                    )}
                    {msg.text?.includes('📄 Uploaded Medical Report:') ? (
                      <div className="p-2.5 bg-blue-50/90 rounded-xl border border-blue-200 text-blue-950 my-1">
                        <div className="flex items-center gap-1.5 font-bold text-xs text-blue-800 mb-1">
                          <Paperclip size={13} />
                          <span>Hospital Intake Document Attached</span>
                        </div>
                        <p className="text-[12px] leading-relaxed whitespace-pre-line font-sans text-gray-800">{msg.text}</p>
                      </div>
                    ) : (
                      <p className="whitespace-pre-line">{msg.text}</p>
                    )}

                    {/* Timestamp & double tick */}
                    <div className={`flex items-center gap-1 mt-1 justify-end text-[10px] ${
                      isDoctor ? 'text-blue-200' : 'text-gray-400'
                    }`}>
                      <span>{msg.timestamp || 'Just now'}</span>
                      {isDoctor && (
                        <span title="Delivered & Read">
                          <CheckCheck size={13} className="text-sky-300 stroke-[2.5]" />
                        </span>
                      )}
                    </div>
                  </div>

                  {isDoctor && (
                    <div className="w-7 h-7 rounded-full bg-blue-50 flex items-center justify-center shrink-0 mb-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <UserCheck size={13} className="text-blue-600" />
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}

        {/* Patient Typing Bubble */}
        {isPatientTyping && (
          <div className="flex items-end gap-2 text-xs text-gray-500 animate-fade-in pl-1">
            <div className="w-7 h-7 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-[10px] shrink-0 mb-1">
              {patient?.name?.split(' ').map(n => n[0]).join('') || 'PT'}
            </div>
            <div className="bg-white border border-gray-200 px-4 py-2.5 rounded-2xl rounded-bl-xs shadow-xs flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-blue-600 animate-bounce [animation-delay:-0.3s]"></span>
              <span className="w-2 h-2 rounded-full bg-blue-600 animate-bounce [animation-delay:-0.15s]"></span>
              <span className="w-2 h-2 rounded-full bg-blue-600 animate-bounce"></span>
              <span className="ml-1.5 text-[11px] font-bold text-slate-500">{patient.name} is typing...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Quick Clinician Prescription Templates */}
      <div className="px-3.5 py-1.5 bg-slate-50 border-t border-gray-100 flex items-center gap-1.5 overflow-x-auto scrollbar-none shrink-0">
        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider shrink-0 pl-1 flex items-center gap-1">
          <Sparkles size={11} className="text-amber-500" />
          <span>Presets:</span>
        </span>
        {[
          "🧊 Please apply an ice pack for 15 minutes.",
          "💪 Outstanding form compliance on today's drill!",
          "⚠️ Pause any movement that causes pain above 4/10.",
          "📋 Prescribed routine updated in your recovery chart."
        ].map((template, idx) => (
          <button
            key={idx}
            type="button"
            onClick={() => handleSendMessageText(template)}
            className="px-2.5 py-1 rounded-full bg-white hover:bg-blue-50 border border-gray-200 hover:border-blue-300 text-slate-700 hover:text-blue-700 text-[11px] font-semibold whitespace-nowrap transition-all shadow-2xs active:scale-95 cursor-pointer shrink-0"
          >
            {template}
          </button>
        ))}
      </div>

      {/* Chat Input */}
      <div className="p-3 bg-white border-t border-gray-200 relative">
        {showAttachmentMenu && (
          <div className="absolute bottom-[65px] left-4 bg-white rounded-xl shadow-xl border border-gray-200 p-2 z-50">
            <button onClick={handleAttachVideo} className="flex items-center space-x-3 w-full px-3 py-2 hover:bg-gray-50 rounded-lg transition-colors text-left group cursor-pointer">
              <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600">
                <FileVideo size={16} />
              </div>
              <div>
                <p className="text-xs font-bold text-gray-800">Attach Exercise Video</p>
                <p className="text-[10px] text-gray-500">Send clinical demonstration clip</p>
              </div>
            </button>
          </div>
        )}

        <form onSubmit={handleFormSubmit} className="relative flex items-center">
          <button
            type="button"
            onClick={() => setShowAttachmentMenu(!showAttachmentMenu)}
            className="absolute left-2 p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all z-10 cursor-pointer"
            title="Attach exercise video"
          >
            <Paperclip size={17} />
          </button>
          <input
            ref={inputRef}
            type="text"
            value={inputValue}
            onChange={handleInputChange}
            placeholder={`Message ${patient.name}...`}
            className="w-full pl-10 pr-12 py-2.5 bg-slate-100 focus:bg-white border border-gray-200 focus:border-blue-500 rounded-xl text-xs sm:text-sm outline-hidden transition-all text-gray-900"
          />
          <button
            type="submit"
            disabled={!inputValue.trim()}
            className="absolute right-1.5 p-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white rounded-lg shadow-xs transition-all active:scale-95 flex items-center justify-center cursor-pointer"
          >
            <Send size={15} />
          </button>
        </form>
      </div>

    </div>
  );
}
