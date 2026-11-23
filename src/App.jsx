import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import PatientWorkspace from './components/PatientWorkspace';
import PatientPortal from './components/PatientPortal';
import { initialPatients, patientExercises } from './data/mockData';
import { fetchPatients, sendMessage, assignVideo, getSocket } from './api/client';
import { isPatientAssignedToDoctor } from './utils/doctorHelpers';

import TopNav from './components/TopNav';
import AnalyticsDashboard from './components/AnalyticsDashboard';
import Dashboard from './components/Dashboard';
import DoctorProfileModal from './components/DoctorProfileModal';
import LandingPage from './components/LandingPage';
import AuraBackground from './components/AuraBackground';
import { initialVerifiedDoctors } from './data/doctorData';

function App() {
  const [patients, setPatients] = useState(() => {
    try {
      const saved = localStorage.getItem('virtuheal_patients');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          // Filter out deprecated demo patients (Sarah Jenkins, Marcus Chen, Elena Rodriguez)
          const nonOldDemo = parsed.filter(p => !['Sarah Jenkins', 'Marcus Chen', 'Elena Rodriguez'].includes(p.name));
          
          // Ensure Shirish Poudel is the primary patient assigned to Dr. Alex
          const existingShirish = nonOldDemo.find(p => p.name === 'Shirish Poudel' || p.id === 'p1');

          const finalShirish = existingShirish 
            ? { 
                ...initialPatients[0], 
                ...existingShirish, 
                name: 'Shirish Poudel',
                condition: initialPatients[0].condition,
                activeVideos: (() => {
                  const existingList = Array.isArray(existingShirish?.activeVideos) ? existingShirish.activeVideos : [];
                  const updatedExisting = existingList.map(v => {
                    const fresh = patientExercises.find(e => e.id === v.id || e.id === v.videoId || e.title === v.title);
                    return fresh ? { ...v, ...fresh } : v;
                  });
                  const existingTitles = new Set(updatedExisting.map(v => v.title));
                  const additions = patientExercises.filter(e => !existingTitles.has(e.title));
                  const mergedVideos = [...updatedExisting, ...additions];
                  return mergedVideos.length >= 5 ? mergedVideos : [...patientExercises];
                })(),
                assignedDoctor: 'Dr. Alex Vance, PT, DPT, PhD', 
                assignedDoctorId: 'doc_1' 
              } 
            : initialPatients[0];
          
          const userAddedPatients = nonOldDemo.filter(p => p.name !== 'Shirish Poudel' && p.id !== 'p1');
          const merged = [finalShirish, ...userAddedPatients];
          try {
            localStorage.setItem('virtuheal_patients', JSON.stringify(merged));
          } catch { }
          return merged;
        }
      }
    } catch { }
    return initialPatients;
  });

  const [selectedPatientId, setSelectedPatientId] = useState(() => {
    try {
      const savedRole = sessionStorage.getItem('virtuheal_auth_role');
      const savedId = sessionStorage.getItem('virtuheal_selected_patient_id');
      if (savedId) return savedId;
      if (savedRole === 'doctor') return null;
      return initialPatients[0]?.id || null;
    } catch {
      return null;
    }
  });

  const [currentView, setCurrentView] = useState(() => {
    try {
      const savedRole = sessionStorage.getItem('virtuheal_auth_role');
      const savedView = sessionStorage.getItem('virtuheal_current_view');
      if (savedView) {
        if (savedRole === 'doctor' && savedView === 'portal') return 'dashboard';
        if (savedRole === 'patient' && savedView !== 'portal') return 'portal';
        return savedView;
      }
      return savedRole === 'doctor' ? 'dashboard' : 'portal';
    } catch {
      return 'portal';
    }
  }); // 'portal' for patient; 'dashboard' | 'patients' | 'analytics' for doctor
  const [isBackendConnected, setIsBackendConnected] = useState(false);
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);
  const [targetedNotification, setTargetedNotification] = useState(null);

  // Authentication & Active Role State
  // authRole: 'landing' (Default public experience) | 'patient' | 'doctor'
  const [authRole, setAuthRole] = useState(() => {
    try {
      const saved = sessionStorage.getItem('virtuheal_auth_role');
      if (saved && ['landing', 'patient', 'doctor'].includes(saved)) return saved;
      return 'landing';
    } catch {
      return 'landing';
    }
  });

  // Clinician & Doctor Profile State - persisted across sessions & reload
  const [verifiedDoctors, setVerifiedDoctors] = useState(() => {
    try {
      const saved = localStorage.getItem('virtuheal_doctors');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          // Merge with initialVerifiedDoctors to guarantee updated face profile and credentials for Dr. Sarah Lin, MD
          const merged = initialVerifiedDoctors.map(initDoc => {
            const savedDoc = parsed.find(d => d.id === initDoc.id || d.name === initDoc.name);
            return savedDoc 
              ? { ...initDoc, ...savedDoc, avatar: initDoc.avatar, degrees: initDoc.degrees, stats: initDoc.stats, certifications: initDoc.certifications, research: initDoc.research, specialties: initDoc.specialties } 
              : initDoc;
          });
          const customDocs = parsed.filter(d => !initialVerifiedDoctors.some(init => init.id === d.id || init.name === d.name));
          return [...merged, ...customDocs];
        }
      }
    } catch { }
    return initialVerifiedDoctors;
  });

  const [currentDoctor, setCurrentDoctor] = useState(() => {
    try {
      const savedDocId = sessionStorage.getItem('virtuheal_doctor_id');
      if (savedDocId) {
        const savedDocs = localStorage.getItem('virtuheal_doctors');
        const list = savedDocs ? JSON.parse(savedDocs) : initialVerifiedDoctors;
        const matched = list.find(d => d.id === savedDocId);
        if (matched) return matched;
      }
    } catch { }
    return initialVerifiedDoctors[0];
  });
  const [isDoctorProfileModalOpen, setIsDoctorProfileModalOpen] = useState(false);
  const [profileModalDoctor, setProfileModalDoctor] = useState(null);

  // Persist verifiedDoctors to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('virtuheal_doctors', JSON.stringify(verifiedDoctors));
    } catch { }
  }, [verifiedDoctors]);

  // Persist session role and active IDs across browser refreshes
  useEffect(() => {
    try {
      if (authRole) {
        sessionStorage.setItem('virtuheal_auth_role', authRole);
      } else {
        sessionStorage.removeItem('virtuheal_auth_role');
      }
    } catch { }
  }, [authRole]);

  useEffect(() => {
    try {
      if (selectedPatientId) {
        sessionStorage.setItem('virtuheal_selected_patient_id', selectedPatientId);
      }
    } catch { }
  }, [selectedPatientId]);

  useEffect(() => {
    try {
      if (currentDoctor?.id) {
        sessionStorage.setItem('virtuheal_doctor_id', currentDoctor.id);
      }
    } catch { }
  }, [currentDoctor]);

  useEffect(() => {
    try {
      if (currentView) {
        sessionStorage.setItem('virtuheal_current_view', currentView);
      }
    } catch { }
  }, [currentView]);

  // Always save patients and chat history to localStorage for instant reload
  useEffect(() => {
    try {
      localStorage.setItem('virtuheal_patients', JSON.stringify(patients));
    } catch { }
  }, [patients]);

  const handleLogout = () => {
    try {
      sessionStorage.removeItem('virtuheal_auth_role');
      sessionStorage.removeItem('virtuheal_selected_patient_id');
      sessionStorage.removeItem('virtuheal_doctor_id');
      sessionStorage.removeItem('virtuheal_current_view');
    } catch { }
    setAuthRole('landing');
  };

  // Sync initial patient data from backend SQLite API and merge messages
  useEffect(() => {
    let isMounted = true;
    fetchPatients()
      .then(data => {
        if (isMounted && Array.isArray(data) && data.length > 0) {
          setPatients(prev => {
            const validData = data.filter(p => !['Sarah Jenkins', 'Marcus Chen', 'Elena Rodriguez'].includes(p.name));
            if (validData.length === 0) return prev;
            return validData.map(serverPat => {
              const localPat = prev.find(p => p.id === serverPat.id || (p.name === serverPat.name && p.name === 'Shirish Poudel'));
              if (!localPat) return serverPat;

              const serverMsgIds = new Set((serverPat.messages || []).map(m => m.id));
              const localExtraMsgs = (localPat.messages || []).filter(m => !serverMsgIds.has(m.id));

              const normalizedServerVideos = (serverPat.activeVideos || []).map(v => {
                let youtubeId = v.youtubeId;
                if (!youtubeId && v.videoUrl) {
                  const match = v.videoUrl.match(/(?:embed\/|v=|vi\/|youtu\.be\/|\/v\/)([\w-]{11})/);
                  if (match) youtubeId = match[1];
                }
                return youtubeId ? { ...v, youtubeId } : v;
              });

              return {
                ...serverPat,
                condition: serverPat.condition || localPat.condition,
                activeVideos: normalizedServerVideos.length > 0 && normalizedServerVideos.some(v => v.youtubeId)
                  ? normalizedServerVideos
                  : localPat.activeVideos,
                messages: [...(serverPat.messages || []), ...localExtraMsgs],
                assignedDoctor: serverPat.assignedDoctor || localPat.assignedDoctor,
                medicalReport: serverPat.medicalReport || localPat.medicalReport
              };
            });
          });
          setIsBackendConnected(true);
        }
      })
      .catch(err => {
        console.warn('Backend not currently reachable, continuing with local data:', err.message);
      });
    return () => { isMounted = false; };
  }, []);

  // Socket.IO real-time listener for patient completions, updates, and messages
  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    // Join therapist room so doctor gets real-time telemetry across all patients
    socket.emit('joinTherapistRoom');

    const handlePatientUpdated = (updatedPatient) => {
      setPatients(prev => prev.map(p => p.id === updatedPatient.id ? updatedPatient : p));
    };

    const handleIncomingMessage = (payload) => {
      if (!payload) return;
      const message = payload.message || payload;
      const patientId = payload.patientId || message.patientId || message.patient_id;
      if (!patientId || !message) return;

      const incomingText = (message.text || message.message_text || '').trim();
      const incomingSender = message.sender || message.sender_id || '';
      const incomingVideo = message.videoUrl || '';

      setPatients(prev => prev.map(p => {
        if (p.id === patientId) {
          const existing = p.messages || [];
          // Deduplicate by ID or identical content/sender/attachment
          const isDuplicate = existing.some(m => {
            if (m.id && message.id && m.id === message.id) return true;
            const mText = (m.text || m.message_text || '').trim();
            const mSender = m.sender || m.sender_id || '';
            const mVideo = m.videoUrl || '';
            return mSender === incomingSender && mText === incomingText && mVideo === incomingVideo;
          });
          if (isDuplicate) return p;

          return {
            ...p,
            messages: [...existing, message]
          };
        }
        return p;
      }));
    };

    const handleVideoAssigned = ({ patientId, assignment, message }) => {
      setPatients(prev => prev.map(p => {
        if (p.id === patientId) {
          const hasAssignment = p.activeVideos?.some(v => v.id === assignment.id);
          const nextVideos = hasAssignment ? p.activeVideos : [assignment, ...(p.activeVideos || [])];
          const hasMessage = p.messages?.some(m => m.id === message.id);
          const nextMessages = hasMessage ? p.messages : [...(p.messages || []), message];
          return {
            ...p,
            activeVideos: nextVideos,
            messages: nextMessages
          };
        }
        return p;
      }));
    };

    const handlePatientCreated = (newPatient) => {
      setPatients(prev => {
        if (prev.some(p => p.id === newPatient.id)) return prev;
        return [newPatient, ...prev];
      });
    };

    const handlePlanAssignedNotification = (data) => {
      const notif = data?.notification;
      const pid = data?.patientId || notif?.patientId;
      if (!notif || !pid) return;

      setPatients(prev => prev.map(p => {
        if (p.id === pid) {
          const hasNotif = (p.notifications || []).some(n => n.id === notif.id);
          return {
            ...p,
            notifications: hasNotif ? p.notifications : [notif, ...(p.notifications || [])]
          };
        }
        return p;
      }));
    };

    socket.on('patient_created', handlePatientCreated);
    socket.on('patient_updated', handlePatientUpdated);
    socket.on('global_message', handleIncomingMessage);
    socket.on('new_message', handleIncomingMessage);
    socket.on('video_assigned', handleVideoAssigned);
    socket.on('plan_assigned_notification', handlePlanAssignedNotification);

    return () => {
      socket.off('patient_created', handlePatientCreated);
      socket.off('patient_updated', handlePatientUpdated);
      socket.off('global_message', handleIncomingMessage);
      socket.off('new_message', handleIncomingMessage);
      socket.off('video_assigned', handleVideoAssigned);
      socket.off('plan_assigned_notification', handlePlanAssignedNotification);
    };
  }, []);

  // Storage event listener for cross-tab synchronization (e.g. Patient Portal in Tab 1, Doctor Workspace in Tab 2)
  useEffect(() => {
    const handleStorageChange = (e) => {
      if (e.key === 'virtuheal_patients' && e.newValue) {
        try {
          const parsed = JSON.parse(e.newValue);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setPatients(parsed);
          }
        } catch { }
      }
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const activeDoctor = currentDoctor || verifiedDoctors[0] || initialVerifiedDoctors[0];
  const selectedPatient = selectedPatientId 
    ? (patients.find(p => p.id === selectedPatientId) || null)
    : (authRole === 'doctor' 
        ? (patients.find(p => isPatientAssignedToDoctor(p, activeDoctor)) || null) 
        : (patients[0] || initialPatients[0]));

  const handleAddPatient = (newPatient) => {
    setPatients(prev => {
      const exists = prev.some(p => p.id === newPatient.id);
      if (exists) {
        return prev.map(p => p.id === newPatient.id ? newPatient : p);
      }
      return [newPatient, ...prev];
    });

    // Check if new patient assigned doctor is in verifiedDoctors, if not add them
    if (newPatient.assignedDoctor) {
      const docName = newPatient.assignedDoctor;
      const alreadyListed = verifiedDoctors.some(d =>
        d.name.toLowerCase().includes(docName.toLowerCase()) || docName.toLowerCase().includes(d.name.toLowerCase())
      );
      if (!alreadyListed) {
        const short = docName.split(',')[0].trim();
        const autoDoctor = {
          id: `doc_${Date.now()}`,
          name: docName,
          shortName: short.startsWith('Dr.') ? short : `Dr. ${short}`,
          title: 'Attending Physical Therapist',
          department: 'Physical Medicine & Rehabilitation',
          clinic: 'VirtuHeal Center for Advanced Human Performance',
          location: 'New York, NY',
          email: `${short.toLowerCase().replace(/[^a-z]/g, '')}@virtuheal.med`,
          phone: '+1 (555) 382-9012',
          license: 'MD-PT-2026',
          npi: '1982736450',
          avatar: 'https://images.unsplash.com/photo-1594824813511-6677f547c87c?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80',
          pin: '1234',
          specialties: [newPatient.condition || 'Orthopedic Rehabilitation']
        };
        setVerifiedDoctors(prev => [autoDoctor, ...prev]);
      }
    }

    setSelectedPatientId(newPatient.id);
    setCurrentView('portal');
  };

  const handleSelectDoctor = (doctorProfile) => {
    setCurrentDoctor(doctorProfile);
    try {
      sessionStorage.setItem('virtuheal_doctor_id', doctorProfile.id);
    } catch { }

    // Automatically select a patient assigned to this specific doctor
    const assignedPatient = patients.find(p => isPatientAssignedToDoctor(p, doctorProfile));
    if (assignedPatient) {
      setSelectedPatientId(assignedPatient.id);
    } else {
      // If no patients are given, do NOT assign anything to that doctor!
      setSelectedPatientId(null);
    }
  };

  const handleDoctorLoginSuccess = (doctorProfile) => {
    handleSelectDoctor(doctorProfile);
  };

  const handleRegisterDoctor = (newDoctor) => {
    const doctorWithTime = {
      ...newDoctor,
      id: newDoctor.id || `doc_${Date.now()}`,
      createdAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    setVerifiedDoctors(prev => {
      const updated = [doctorWithTime, ...prev.filter(d => d.id !== doctorWithTime.id)];
      try {
        localStorage.setItem('virtuheal_doctors', JSON.stringify(updated));
      } catch { }
      return updated;
    });
    handleSelectDoctor(doctorWithTime);
  };

  const handleUpdatePatient = (updatedOrFn) => {
    setPatients(prev => {
      let updated;
      if (typeof updatedOrFn === 'function') {
        updated = prev.map(p => {
          const res = updatedOrFn(p);
          return res || p;
        });
      } else {
        updated = prev.map(p => p.id === updatedOrFn.id ? updatedOrFn : p);
      }
      try {
        localStorage.setItem('virtuheal_patients', JSON.stringify(updated));
      } catch { }
      return updated;
    });
  };

  const handleSendMessage = async (patientId, text, videoUrl = null, thumbnail = null, title = null, customId = null) => {
    const messageId = customId || `msg-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    const optimisticMessage = {
      id: messageId,
      patientId,
      sender: 'doctor',
      text,
      videoUrl,
      thumbnail,
      title,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    // Optimistic update
    setPatients(prevPatients => prevPatients.map(patient => {
      if (patient.id === patientId) {
        const existing = patient.messages || [];
        if (existing.some(m => m.id === messageId)) return patient;
        return {
          ...patient,
          messages: [...existing, optimisticMessage]
        };
      }
      return patient;
    }));

    // Persist to backend
    try {
      const serverMessage = await sendMessage(patientId, { id: messageId, text, videoUrl, thumbnail, title });
      if (serverMessage?.id) {
        setPatients(prevPatients => prevPatients.map(patient => {
          if (patient.id === patientId) {
            return {
              ...patient,
              messages: (patient.messages || []).map(m => m.id === messageId ? serverMessage : m)
            };
          }
          return patient;
        }));
      }
    } catch (err) {
      console.warn('Message saved locally, server offline:', err.message);
    }
  };

  const handleAssignVideo = async (patientId, videoObj) => {
    const todayDate = new Date().toISOString().split('T')[0];
    const sets = Number(videoObj.sets) || 3;
    const reps = Number(videoObj.reps) || 10;
    const notes = videoObj.notes || 'Perform controlled repetitions and maintain steady breathing.';

    const optimisticActiveVideo = {
      ...videoObj,
      id: `assign-${Date.now()}`,
      sets,
      reps,
      notes,
      dateAssigned: todayDate
    };

    const prescriptionText = `📋 Prescribed Exercise Plan: "${videoObj.title}" (${sets} sets × ${reps} reps).\nPrescribed Instruction: ${notes}`;

    const optimisticChatMessage = {
      id: `msg-${Date.now()}`,
      sender: 'doctor',
      sender_id: 'doctor',
      receiver_id: patientId,
      text: prescriptionText,
      message_text: prescriptionText,
      videoUrl: videoObj.videoUrl,
      thumbnail: videoObj.thumbnail,
      title: videoObj.title,
      sets,
      reps,
      notes,
      isPlan: true,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    const firstVideoThumbnail = videoObj.thumbnail || 
      (videoObj.youtubeId ? `https://img.youtube.com/vi/${videoObj.youtubeId}/hqdefault.jpg` : null) ||
      'https://img.youtube.com/vi/F_e3U4-Hbr8/hqdefault.jpg';

    const planNotification = {
      id: `plan-notif-${Date.now()}`,
      patientId,
      patientName: patients.find(p => p.id === patientId)?.name || 'Patient',
      patientCondition: patients.find(p => p.id === patientId)?.condition || 'Rehabilitation',
      title: `New Exercise Plan: ${videoObj.title}`,
      exerciseTitle: videoObj.title,
      message: `Dr. Alex Vance prescribed "${videoObj.title}" (${sets} sets × ${reps} reps).`,
      thumbnail: firstVideoThumbnail,
      videoUrl: videoObj.videoUrl,
      youtubeId: videoObj.youtubeId,
      videoId: videoObj.id || videoObj.videoId,
      sets,
      reps,
      notes,
      type: 'plan',
      time: 'Just now',
      isUnread: true,
      createdAt: new Date().toISOString()
    };

    // Optimistic update & persistence
    setPatients(prevPatients => {
      const updated = prevPatients.map(patient => {
        if (patient.id === patientId) {
          return {
            ...patient,
            activeVideos: [optimisticActiveVideo, ...(patient.activeVideos || [])],
            messages: [...(patient.messages || []), optimisticChatMessage],
            notifications: [planNotification, ...(patient.notifications || [])]
          };
        }
        return patient;
      });
      try {
        localStorage.setItem('virtuheal_patients', JSON.stringify(updated));
      } catch { }
      return updated;
    });

    // Real-time WebSocket transmission to patient portal
    const socket = getSocket();
    if (socket && socket.connected) {
      socket.emit('sendMessage', {
        patient_id: patientId,
        patientId: patientId,
        sender_id: 'doctor',
        receiver_id: patientId,
        sender: 'doctor',
        message_text: prescriptionText,
        text: prescriptionText,
        videoUrl: videoObj.videoUrl,
        thumbnail: firstVideoThumbnail,
        title: videoObj.title,
        sets,
        reps,
        notes,
        isPlan: true,
        timestamp: optimisticChatMessage.timestamp
      });
      socket.emit('plan_assigned_notification', {
        patientId,
        notification: planNotification,
        assignment: optimisticActiveVideo
      });
    }

    // Persist to backend
    try {
      const result = await assignVideo(patientId, {
        videoId: videoObj.id,
        title: videoObj.title,
        duration: videoObj.duration,
        thumbnail: videoObj.thumbnail,
        videoUrl: videoObj.videoUrl,
        sets,
        reps,
        notes
      });
      if (result?.assignment && result?.message) {
        setPatients(prevPatients => {
          const updated = prevPatients.map(patient => {
            if (patient.id === patientId) {
              return {
                ...patient,
                activeVideos: (patient.activeVideos || []).map(v => v.id === optimisticActiveVideo.id ? result.assignment : v),
                messages: (patient.messages || []).map(m => m.id === optimisticChatMessage.id ? { ...result.message, sets, reps, notes, isPlan: true } : m)
              };
            }
            return patient;
          });
          try {
            localStorage.setItem('virtuheal_patients', JSON.stringify(updated));
          } catch { }
          return updated;
        });
      }
    } catch (err) {
      console.warn('Assignment saved locally, server offline:', err.message);
    }
  };

  const handleNavigateEnvironment = (targetEnv, view = null) => {
    if (targetEnv === 'landing') {
      setAuthRole('landing');
    } else if (targetEnv === 'patient') {
      const patientId = patients[0]?.id || 'p1';
      setSelectedPatientId(patientId);
      setAuthRole('patient');
      setCurrentView('portal');
    } else if (targetEnv === 'doctor') {
      const doctor = verifiedDoctors[0] || initialVerifiedDoctors[0];
      handleDoctorLoginSuccess(doctor);
      setAuthRole('doctor');
      setCurrentView(view || 'patients');
    } else if (targetEnv === 'analytics') {
      const doctor = verifiedDoctors[0] || initialVerifiedDoctors[0];
      handleDoctorLoginSuccess(doctor);
      setAuthRole('doctor');
      setCurrentView('analytics');
    }
  };


  // ==============================================================
  // 1. PUBLIC LANDING PAGE (VIEWABLE VIA 'landing' TAB)
  // ==============================================================
  if (!authRole || authRole === 'landing') {
    return (
      <>
        <LandingPage
          patients={patients}
          verifiedDoctors={verifiedDoctors}
          onPatientLogin={(patientId) => {
            setSelectedPatientId(patientId || 'p1');
            setAuthRole('patient');
            setCurrentView('portal');
          }}
          onPatientRegister={(newPatient) => {
            handleAddPatient(newPatient);
            setAuthRole('patient');
            setCurrentView('portal');
          }}
          onDoctorLogin={(doctorProfile, targetView = 'patients') => {
            handleDoctorLoginSuccess(doctorProfile || verifiedDoctors[0]);
            setAuthRole('doctor');
            setCurrentView(targetView || 'patients');
          }}
          onDoctorRegister={(newDoctor) => {
            handleRegisterDoctor(newDoctor);
            handleDoctorLoginSuccess(newDoctor);
            setAuthRole('doctor');
            setCurrentView('dashboard');
          }}
          onNavigateEnvironment={handleNavigateEnvironment}
          isBackendConnected={isBackendConnected}
        />
      </>
    );
  }

  // ==============================================================
  // 2. PATIENT RECOVERY PORTAL (PURE PATIENT EXPERIENCE)
  // ==============================================================
  if (authRole === 'patient') {
    return (
      <div className="flex flex-col h-screen font-sans text-slate-900 overflow-hidden relative">
        <AuraBackground isFixed={true} />
        <div className="relative z-10 flex flex-col h-full w-full overflow-hidden">
          <TopNav
            authRole="patient"
            currentView="portal"
            isBackendConnected={isBackendConnected}
            patients={patients}
            selectedPatientId={selectedPatientId}
            onLogout={handleLogout}
            onOpenLanding={() => setAuthRole('landing')}
            onNavigateEnvironment={handleNavigateEnvironment}
          />
          <div className="flex flex-1 overflow-hidden">
            <PatientPortal
              patient={selectedPatient}
              patients={patients}
              verifiedDoctors={verifiedDoctors}
              onSelectPatient={(id) => setSelectedPatientId(id)}
              onUpdatePatient={handleUpdatePatient}
              onAddPatient={handleAddPatient}
              isRegisterModalOpen={isRegisterModalOpen}
              setIsRegisterModalOpen={setIsRegisterModalOpen}
            />
          </div>
        </div>
      </div>
    );
  }

  // ==============================================================
  // 3. DOCTOR & CLINICIAN WORKSPACE (PURE DOCTOR EXPERIENCE)
  // ==============================================================
  return (
    <div className="flex flex-col h-screen font-sans text-slate-900 overflow-hidden relative">
      <AuraBackground isFixed={true} />
      <div className="relative z-10 flex flex-col h-full w-full overflow-hidden">
        <TopNav
          authRole="doctor"
          currentView={currentView}
          onViewChange={setCurrentView}
          isBackendConnected={isBackendConnected}
          patients={patients}
          selectedPatientId={selectedPatientId}
          onSelectPatient={(id) => setSelectedPatientId(id)}
          onNotificationAction={(notif) => {
            setTargetedNotification(notif);
            if (notif?.patientId) {
              setSelectedPatientId(notif.patientId);
            }
            setCurrentView('patients');
          }}
          currentDoctor={activeDoctor}
          onLogout={handleLogout}
          onOpenLanding={() => setAuthRole('landing')}
          onNavigateEnvironment={handleNavigateEnvironment}
        />
        <div className="flex flex-1 overflow-hidden">
          {(currentView === 'dashboard' || currentView === 'portal' || !currentView) && (
            <Dashboard
              patients={patients}
              onNavigate={(view, patientId) => {
                if (patientId) setSelectedPatientId(patientId);
                setCurrentView(view);
              }}
              doctor={activeDoctor}
              onLogout={handleLogout}
            />
          )}

          {currentView === 'patients' && (
            <>
              <Sidebar
                patients={patients}
                selectedPatientId={selectedPatientId}
                onSelectPatient={setSelectedPatientId}
                currentDoctor={activeDoctor}
                onViewDoctorProfile={(doc) => {
                  setProfileModalDoctor(doc || activeDoctor);
                  setIsDoctorProfileModalOpen(true);
                }}
                onLogout={handleLogout}
              />
              <PatientWorkspace
                patient={selectedPatient}
                onSendMessage={handleSendMessage}
                onAssignVideo={handleAssignVideo}
                onUpdatePatient={handleUpdatePatient}
                targetedNotification={targetedNotification}
                onClearTargetedNotification={() => setTargetedNotification(null)}
                currentDoctor={activeDoctor}
              />
            </>
          )}

          {currentView === 'analytics' && (
            <AnalyticsDashboard patients={patients} />
          )}
        </div>

        {/* Doctor Face Profile & Credential Modal */}
        <DoctorProfileModal
          isOpen={isDoctorProfileModalOpen}
          onClose={() => setIsDoctorProfileModalOpen(false)}
          doctor={profileModalDoctor || activeDoctor}
          onLogout={handleLogout}
        />
      </div>
    </div>
  );
}

export default App;

