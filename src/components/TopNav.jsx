import React, { useState, useRef, useEffect } from 'react';
import {
  Bell,
  Settings,
  HelpCircle,
  ActivitySquare,
  AlertTriangle,
  CheckCircle2,
  MessageSquare,
  Calendar,
  Activity,
  Check,
  X,
  Clock,
  Stethoscope,
  LogOut,
  LayoutDashboard,
  Users,
  TrendingUp,
  Search,
  Flame,
  Volume2,
  VolumeX,
  Eye,
  Camera,
  ShieldCheck,
  ChevronRight,
  ChevronDown,
  Menu,
  Sliders,
  Command,
  Zap,
  Globe,
  GraduationCap,
  ExternalLink,
  FileText,
  Sparkles
} from 'lucide-react';
import DoctorProfileModal from './DoctorProfileModal';
import { fetchNotifications, markNotificationRead, markAllNotificationsRead, getSocket } from '../api/client';

const initialDemoNotifications = [
  {
    id: 'n1',
    patientId: 'p1',
    patientName: 'Shirish Poudel',
    patientCondition: 'ACL Reconstruction & Knee Recovery',
    title: 'Exercise Routine Completed',
    message: 'Completed 3 sets of Seated Knee Extensions with 95% form compliance.',
    time: '12 mins ago',
    type: 'exercise',
    isUnread: true
  },
  {
    id: 'n2',
    patientId: 'p1',
    patientName: 'Shirish Poudel',
    patientCondition: 'ACL Reconstruction & Knee Recovery',
    title: 'Recovery Milestone Achieved',
    message: 'Shirish reached a 14-day adherence streak under Dr. Alex Vance.',
    time: '45 mins ago',
    type: 'milestone',
    isUnread: true
  },
  {
    id: 'n3',
    patientId: 'p1',
    patientName: 'Shirish Poudel',
    patientCondition: 'ACL Reconstruction & Knee Recovery',
    title: 'Patient Message',
    message: '"Hi Dr. Alex, the swelling is reducing nicely after today\'s heel slides."',
    time: '1 hour ago',
    type: 'message',
    isUnread: false
  }
];

export default function TopNav({ 
  authRole = 'patient', // 'patient' | 'doctor'
  currentView = 'dashboard', 
  onViewChange, 
  patients = [],
  selectedPatientId,
  onSelectPatient,
  isBackendConnected = false,
  currentDoctor = null,
  onLogout = null,
  onNotificationAction = null,
  onOpenLanding = null,
  onNavigateEnvironment = null
}) {
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const [helpTab, setHelpTab] = useState('camera'); // 'camera' | 'goniometer' | 'shortcuts' | 'compliance'
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isDoctorMenuOpen, setIsDoctorMenuOpen] = useState(false);

  // Notifications State
  const [notifications, setNotifications] = useState(initialDemoNotifications);
  const [notificationFilter, setNotificationFilter] = useState('all'); // 'all' | 'unread' | 'alert'

  // Quick Preferences Settings
  const [audioFeedback, setAudioFeedback] = useState(() => {
    try {
      return localStorage.getItem('virtuheal_audio_cues') !== 'false';
    } catch {
      return true;
    }
  });
  const [showAngleOverlay, setShowAngleOverlay] = useState(() => {
    try {
      return localStorage.getItem('virtuheal_angle_overlay') !== 'false';
    } catch {
      return true;
    }
  });
  const [ultraPrecisionMode, setUltraPrecisionMode] = useState(() => {
    try {
      return localStorage.getItem('virtuheal_60fps_mode') !== 'false';
    } catch {
      return true;
    }
  });

  const notificationsRef = useRef(null);
  const settingsRef = useRef(null);
  const searchRef = useRef(null);
  const searchInputRef = useRef(null);
  const doctorMenuRef = useRef(null);

  // Logo click in doctor mode navigates to Dashboard
  const handleLogoClick = () => {
    if (authRole === 'doctor' && onViewChange) {
      onViewChange('dashboard');
    }
  };

  // Keyboard shortcut for quick search (Ctrl+K or Cmd+K) and Escape
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        if (authRole === 'doctor') {
          setIsSearchOpen(prev => {
            const next = !prev;
            if (next) {
              setTimeout(() => searchInputRef.current?.focus(), 50);
            }
            return next;
          });
        }
      } else if (e.key === 'Escape') {
        setIsSearchOpen(false);
        setIsNotificationsOpen(false);
        setIsSettingsOpen(false);
        setIsMobileMenuOpen(false);
        setIsDoctorMenuOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [authRole]);

  // Load real notifications from backend if available
  useEffect(() => {
    let isMounted = true;
    fetchNotifications()
      .then(data => {
        if (isMounted && Array.isArray(data) && data.length > 0) {
          setNotifications(data);
        }
      })
      .catch(() => { });
    return () => { isMounted = false; };
  }, [isBackendConnected]);

  // Real-time socket listener for new clinical notifications & triage alerts
  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    const handleNewNotification = (newNotif) => {
      setNotifications(prev => [newNotif, ...prev.filter(n => n.id !== newNotif.id)]);
    };

    socket.on('new_notification', handleNewNotification);
    return () => {
      socket.off('new_notification', handleNewNotification);
    };
  }, []);

  // Close popovers on outside click
  useEffect(() => {
    function handleClickOutside(event) {
      if (notificationsRef.current && !notificationsRef.current.contains(event.target)) {
        setIsNotificationsOpen(false);
      }
      if (settingsRef.current && !settingsRef.current.contains(event.target)) {
        setIsSettingsOpen(false);
      }
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setIsSearchOpen(false);
      }
      if (doctorMenuRef.current && !doctorMenuRef.current.contains(event.target)) {
        setIsDoctorMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Toggle handlers for Quick Settings
  const toggleAudio = () => {
    const next = !audioFeedback;
    setAudioFeedback(next);
    try { localStorage.setItem('virtuheal_audio_cues', String(next)); } catch { }
  };

  const toggleAngleOverlay = () => {
    const next = !showAngleOverlay;
    setShowAngleOverlay(next);
    try { localStorage.setItem('virtuheal_angle_overlay', String(next)); } catch { }
  };

  const toggleUltraPrecision = () => {
    const next = !ultraPrecisionMode;
    setUltraPrecisionMode(next);
    try { localStorage.setItem('virtuheal_60fps_mode', String(next)); } catch { }
  };

  const unreadCount = notifications.filter(n => n.isUnread).length;

  const markAllAsRead = async () => {
    setNotifications(prev => prev.map(n => ({ ...n, isUnread: false })));
    try {
      await markAllNotificationsRead();
    } catch {
      // Offline fallback: notifications state updated locally
    }
  };

  const markAsRead = async (id) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, isUnread: false } : n));
    try {
      await markNotificationRead(id);
    } catch {
      // Offline fallback: notification state updated locally
    }
  };

  const removeNotification = (e, id) => {
    e.stopPropagation();
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const handleNotificationClick = (notification) => {
    markAsRead(notification.id);
    if (notification.patientId && onSelectPatient) {
      onSelectPatient(notification.patientId);
    }
    if (onViewChange) {
      onViewChange('patients');
    }
    if (onNotificationAction) {
      onNotificationAction(notification);
    }
    setIsNotificationsOpen(false);
  };

  const filteredNotifications = notifications.filter(item => {
    if (notificationFilter === 'unread') return item.isUnread;
    if (notificationFilter === 'alert') return item.type === 'alert' || item.type === 'adherence';
    return true;
  });

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'alert':
        return <AlertTriangle size={15} className="text-rose-600" />;
      case 'exercise':
        return <CheckCircle2 size={15} className="text-sky-600" />;
      case 'message':
        return <MessageSquare size={15} className="text-blue-600" />;
      case 'adherence':
        return <Activity size={15} className="text-amber-600" />;
      case 'appointment':
        return <Calendar size={15} className="text-purple-600" />;
      default:
        return <Bell size={15} className="text-blue-600" />;
    }
  };

  const getIconContainerClass = (type) => {
    switch (type) {
      case 'alert':
        return 'bg-rose-50 border-rose-200 text-rose-600';
      case 'exercise':
        return 'bg-sky-50 border-sky-200 text-sky-600';
      case 'message':
        return 'bg-blue-50 border-blue-200 text-blue-600';
      case 'adherence':
        return 'bg-amber-50 border-amber-200 text-amber-600';
      case 'appointment':
        return 'bg-purple-50 border-purple-200 text-purple-600';
      default:
        return 'bg-blue-50 border-blue-200 text-blue-600';
    }
  };

  // Patients matching search query
  const filteredPatients = patients.filter(p => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      p.name?.toLowerCase().includes(q) ||
      p.id?.toLowerCase().includes(q) ||
      p.condition?.toLowerCase().includes(q)
    );
  });

  // Current active patient object
  const activePatient = patients.find(p => p.id === selectedPatientId) || patients[0];

  return (
    <>
      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-xl border-b border-slate-200/90 shadow-[0_4px_20px_-4px_rgba(15,23,42,0.05)] font-sans">
        {/* Top Accent Gradient Line */}
        <div className="h-[2px] w-full bg-gradient-to-r from-sky-500 via-blue-500 to-cyan-500" />

        <div className="h-16 px-4 sm:px-6 flex items-center justify-between gap-3">
          
          {/* ========================================================== */}
          {/* LEFT: BRAND LOGO & SYSTEM STATUS                           */}
          {/* ========================================================== */}
          <div className="flex items-center gap-4 lg:gap-6 shrink-0">
            <div
              onClick={handleLogoClick}
              className={`flex items-center gap-2.5 select-none transition-all group ${
                authRole === 'doctor' 
                  ? 'cursor-pointer hover:opacity-95 active:scale-98' 
                  : ''
              }`}
              title="VirtuHeal Clinical Telerehabilitation Platform"
            >
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-sky-500 to-blue-600 text-white flex items-center justify-center shadow-md shadow-sky-600/25 group-hover:scale-105 transition-transform duration-200">
                <ActivitySquare size={20} className="stroke-[2.5]" />
              </div>
              <div className="flex flex-col">
                <div className="flex items-center gap-1.5">
                  <span className="text-base font-extrabold text-slate-900 tracking-tight leading-tight">
                    VirtuHeal
                  </span>
                  <span className="px-1.5 py-0.2 rounded-md text-[9px] font-extrabold bg-sky-50 text-sky-800 border border-sky-200 shadow-2xs">
                    v2.0
                  </span>
                </div>
                <span className="text-[10px] font-semibold text-slate-500 hidden sm:block leading-none mt-0.5">
                  Clinical AI Rehabilitation
                </span>
              </div>
            </div>

            {/* Live Telemetry Status Pill with Pulse Ping */}
            <div 
              className={`hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold border transition-all cursor-default select-none ${
                isBackendConnected 
                  ? 'bg-emerald-500/10 text-emerald-800 border-emerald-500/30 shadow-2xs' 
                  : 'bg-amber-500/10 text-amber-800 border-amber-500/30 shadow-2xs'
              }`}
              title={isBackendConnected 
                ? 'Clinical WebSocket Online: 60 FPS Pose Sync Active' 
                : 'Edge Mode: Local Browser Computer Vision Engine Active'
              }
            >
              <span className="relative flex h-2 w-2">
                {isBackendConnected && (
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                )}
                <span className={`relative inline-flex rounded-full h-2 w-2 ${isBackendConnected ? 'bg-emerald-500' : 'bg-amber-500'}`} />
              </span>
              <span className="tracking-tight text-[10px] font-bold">
                {isBackendConnected ? 'Cloud Online' : 'Edge Mode'}
              </span>
            </div>

            {/* ======================================================== */}
            {/* IN DOCTOR MODE: CLEAN CLINICAL NAVIGATION TABS           */}
            {/* ======================================================== */}
            {authRole === 'doctor' && (
              <nav className="hidden md:flex items-center gap-1.5 bg-slate-100/90 p-1 rounded-2xl border border-slate-200/80 shadow-2xs">
                <button
                  type="button"
                  onClick={() => onViewChange && onViewChange('dashboard')}
                  className={`px-3.5 py-2 text-xs rounded-xl transition-all flex items-center gap-2 cursor-pointer select-none font-bold ${
                    currentView === 'dashboard'
                      ? 'bg-white text-blue-700 shadow-sm border border-blue-200/60 ring-2 ring-blue-500/10'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-white/70'
                  }`}
                  id="nav-dashboard-tab"
                >
                  <LayoutDashboard size={15} className={currentView === 'dashboard' ? 'text-blue-600' : 'text-slate-400'} />
                  <span>Dashboard</span>
                </button>

                <button
                  type="button"
                  onClick={() => onViewChange && onViewChange('patients')}
                  className={`px-3.5 py-2 text-xs rounded-xl transition-all flex items-center gap-2 cursor-pointer select-none font-bold ${
                    currentView === 'patients'
                      ? 'bg-white text-blue-700 shadow-sm border border-blue-200/60 ring-2 ring-blue-500/10'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-white/70'
                  }`}
                  id="nav-workspace-tab"
                >
                  <Users size={15} className={currentView === 'patients' ? 'text-blue-600' : 'text-slate-400'} />
                  <span>Patients & Workspace</span>
                  {patients.length > 0 && (
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                      currentView === 'patients'
                        ? 'bg-blue-100 text-blue-800 border border-blue-200'
                        : 'bg-slate-200/80 text-slate-600'
                    }`}>
                      {patients.length}
                    </span>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => onViewChange && onViewChange('analytics')}
                  className={`px-3.5 py-2 text-xs rounded-xl transition-all flex items-center gap-2 cursor-pointer select-none font-bold ${
                    currentView === 'analytics'
                      ? 'bg-white text-blue-700 shadow-sm border border-blue-200/60 ring-2 ring-blue-500/10'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-white/70'
                  }`}
                  id="nav-analytics-tab"
                >
                  <TrendingUp size={15} className={currentView === 'analytics' ? 'text-blue-600' : 'text-slate-400'} />
                  <span>Analytics</span>
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" title="Real-time Stream" />
                </button>
              </nav>
            )}
          </div>

          {/* ========================================================== */}
          {/* RIGHT: TOOLS, PATIENT SWITCHER, PROFILE, NOTIFICATIONS     */}
          {/* ========================================================== */}
          <div className="flex items-center gap-2 sm:gap-2.5">
            
            {/* -------------------------------------------------------- */}
            {/* DOCTOR VIEW CONTROLS                                     */}
            {/* -------------------------------------------------------- */}
            {authRole === 'doctor' ? (
              <>
                {/* Search Trigger for medium screens (< xl) */}
                <button
                  type="button"
                  onClick={() => {
                    setIsSearchOpen(true);
                    setTimeout(() => searchInputRef.current?.focus(), 50);
                  }}
                  className="hidden sm:flex xl:hidden p-2 rounded-xl text-slate-500 hover:text-sky-700 hover:bg-sky-50 border border-slate-200 transition-all cursor-pointer shadow-2xs"
                  title="Quick Search Patients (Ctrl+K)"
                  aria-label="Quick Search Patients"
                  id="doctor-search-btn-icon"
                >
                  <Search size={16} />
                </button>

                {/* Quick Patient Command Search (Doctor Mode, Desktop) */}
                <div className="relative hidden xl:block">
                  <button 
                    type="button"
                    onClick={() => {
                      setIsSearchOpen(true);
                      setTimeout(() => searchInputRef.current?.focus(), 50);
                    }}
                    className="flex items-center gap-2 px-3 py-1.5 bg-white/90 hover:bg-white border border-slate-200 hover:border-sky-400 rounded-xl cursor-pointer transition-all w-48 2xl:w-60 text-slate-500 shadow-2xs group select-none text-left"
                    title="Search cohort patients (Ctrl+K)"
                    id="doctor-search-btn-bar"
                  >
                    <Search size={14} className="text-slate-400 group-hover:text-sky-600 transition-colors shrink-0" />
                    <span className="text-xs truncate flex-1 font-medium text-slate-500 group-hover:text-slate-700">Quick search patient...</span>
                    <kbd className="inline-flex items-center gap-0.5 px-1.5 py-0.5 text-[9px] font-mono bg-slate-100 border border-slate-200 rounded text-slate-500 shadow-2xs">
                      Ctrl K
                    </kbd>
                  </button>
                </div>

                {/* Direct Landing Page Shortcut for Clinicians */}
                <button
                  type="button"
                  onClick={() => onOpenLanding ? onOpenLanding() : onNavigateEnvironment && onNavigateEnvironment('landing')}
                  className="hidden lg:flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-white hover:bg-sky-50 text-slate-700 hover:text-sky-700 border border-slate-200 hover:border-sky-300 text-xs font-bold transition-all shadow-2xs active:scale-95 cursor-pointer"
                  title="Preview Public Landing Page"
                  id="doctor-to-landing-btn"
                >
                  <Globe size={13} className="text-sky-600" />
                  <span>Landing Page</span>
                </button>

                {/* Mobile Navigation Menu Toggle (Doctor Mode) */}
                <button
                  type="button"
                  onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                  className="md:hidden p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-slate-200 transition-colors"
                  title="Toggle Doctor Navigation"
                  aria-label="Toggle navigation menu"
                >
                  {isMobileMenuOpen ? <X size={18} /> : <Menu size={18} />}
                </button>

                {/* Help & Guidelines Button */}
                <button
                  type="button"
                  onClick={() => setIsHelpOpen(true)}
                  className="p-2 text-slate-500 hover:text-blue-600 hover:bg-blue-50/80 rounded-xl border border-transparent hover:border-blue-200 transition-all cursor-pointer"
                  title="Clinical Setup & Biomechanical Guides"
                  id="doctor-help-btn"
                >
                  <HelpCircle size={18} />
                </button>

                {/* Quick Preferences Settings Popover */}
                <div ref={settingsRef} className="relative">
                  <button
                    type="button"
                    onClick={() => setIsSettingsOpen(!isSettingsOpen)}
                    className={`p-2 rounded-xl border transition-all cursor-pointer ${
                      isSettingsOpen
                        ? 'bg-blue-50 text-blue-600 border-blue-200 shadow-xs'
                        : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100 border-transparent hover:border-slate-200'
                    }`}
                    title="Camera & Telemetry Preferences"
                    id="doctor-settings-btn"
                  >
                    <Settings size={18} />
                  </button>

                  {isSettingsOpen && (
                    <div className="absolute right-0 top-full mt-2 w-72 bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden z-50 p-4 space-y-4 animate-scale-up">
                      <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                        <div className="flex items-center gap-1.5">
                          <Sliders size={15} className="text-blue-600" />
                          <span className="text-xs font-bold text-slate-900">System Preferences</span>
                        </div>
                        <span className="text-[10px] font-bold text-slate-400">VirtuHeal v2.0</span>
                      </div>

                      <div className="space-y-3 text-xs">
                        {/* Audio Toggle */}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            {audioFeedback ? <Volume2 size={15} className="text-blue-600" /> : <VolumeX size={15} className="text-slate-400" />}
                            <div>
                              <div className="font-semibold text-slate-800">Audio Feedback</div>
                              <div className="text-[10px] text-slate-400">Rep count audio chime</div>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={toggleAudio}
                            className={`w-10 h-5 rounded-full transition-colors relative cursor-pointer ${
                              audioFeedback ? 'bg-blue-600' : 'bg-slate-300'
                            }`}
                          >
                            <span className={`w-3.5 h-3.5 rounded-full bg-white absolute top-0.75 transition-transform ${
                              audioFeedback ? 'right-1' : 'left-1'
                            }`} />
                          </button>
                        </div>

                        {/* Angle Overlay Toggle */}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Eye size={15} className="text-sky-600" />
                            <div>
                              <div className="font-semibold text-slate-800">Goniometer Overlay</div>
                              <div className="text-[10px] text-slate-400">Show joint angles in AR</div>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={toggleAngleOverlay}
                            className={`w-10 h-5 rounded-full transition-colors relative cursor-pointer ${
                              showAngleOverlay ? 'bg-sky-600' : 'bg-slate-300'
                            }`}
                          >
                            <span className={`w-3.5 h-3.5 rounded-full bg-white absolute top-0.75 transition-transform ${
                              showAngleOverlay ? 'right-1' : 'left-1'
                            }`} />
                          </button>
                        </div>

                        {/* Ultra 60 FPS Mode */}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Zap size={15} className="text-amber-500" />
                            <div>
                              <div className="font-semibold text-slate-800">Ultra 60 FPS Tracking</div>
                              <div className="text-[10px] text-slate-400">High precision pose stream</div>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={toggleUltraPrecision}
                            className={`w-10 h-5 rounded-full transition-colors relative cursor-pointer ${
                              ultraPrecisionMode ? 'bg-amber-500' : 'bg-slate-300'
                            }`}
                          >
                            <span className={`w-3.5 h-3.5 rounded-full bg-white absolute top-0.75 transition-transform ${
                              ultraPrecisionMode ? 'right-1' : 'left-1'
                            }`} />
                          </button>
                        </div>
                      </div>

                      <div className="pt-2 border-t border-slate-100 text-[10px] text-slate-400 flex items-center justify-between">
                        <span>Settings auto-saved</span>
                        <span className="text-sky-600 font-bold flex items-center gap-0.5">
                          <Check size={11} /> Saved
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Notifications Flyout (Doctor Mode) */}
                <div ref={notificationsRef} className="relative">
                  <button
                    type="button"
                    onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
                    className={`p-2 rounded-xl border transition-all relative cursor-pointer ${
                      isNotificationsOpen
                        ? 'bg-blue-50 text-blue-600 border-blue-200 shadow-xs'
                        : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100 border-transparent hover:border-slate-200'
                    }`}
                    title="Clinical Notifications & Patient Triage"
                    id="notifications-bell-btn"
                  >
                    <Bell size={18} />
                    {unreadCount > 0 && (
                      <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] bg-rose-600 text-white text-[10px] font-black rounded-full border-2 border-white flex items-center justify-center px-1 shadow-sm animate-pulse">
                        {unreadCount}
                      </span>
                    )}
                  </button>

                  {/* Notification Dropdown Panel */}
                  {isNotificationsOpen && (
                    <div className="absolute right-0 top-full mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden z-50 animate-scale-up">
                      {/* Header */}
                      <div className="p-4 bg-slate-50/90 border-b border-slate-200 flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <span className="text-sm font-black text-slate-900">Clinical Alerts</span>
                          {unreadCount > 0 && (
                            <span className="bg-rose-100 text-rose-700 text-[10px] font-black px-2 py-0.5 rounded-full border border-rose-200">
                              {unreadCount} new
                            </span>
                          )}
                        </div>
                        {unreadCount > 0 && (
                          <button
                            type="button"
                            onClick={markAllAsRead}
                            className="text-xs text-blue-600 hover:text-blue-800 font-bold flex items-center space-x-1 transition-colors cursor-pointer"
                            title="Mark all notifications as read"
                          >
                            <Check size={13} />
                            <span>Mark all read</span>
                          </button>
                        )}
                      </div>

                      {/* Filter Tabs */}
                      <div className="flex border-b border-slate-100 bg-white px-3 py-1.5 gap-1.5 text-xs font-semibold">
                        <button
                          type="button"
                          onClick={() => setNotificationFilter('all')}
                          className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
                            notificationFilter === 'all'
                              ? 'bg-blue-50 text-blue-700 font-bold'
                              : 'text-slate-500 hover:bg-slate-100'
                          }`}
                        >
                          All ({notifications.length})
                        </button>
                        <button
                          type="button"
                          onClick={() => setNotificationFilter('unread')}
                          className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
                            notificationFilter === 'unread'
                              ? 'bg-blue-50 text-blue-700 font-bold'
                              : 'text-slate-500 hover:bg-slate-100'
                          }`}
                        >
                          Unread ({unreadCount})
                        </button>
                        <button
                          type="button"
                          onClick={() => setNotificationFilter('alert')}
                          className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
                            notificationFilter === 'alert'
                              ? 'bg-rose-50 text-rose-700 font-bold'
                              : 'text-slate-500 hover:bg-slate-100'
                          }`}
                        >
                          Urgent Triage
                        </button>
                      </div>

                      {/* Notification Items List */}
                      <div className="max-h-[380px] overflow-y-auto divide-y divide-slate-100">
                        {filteredNotifications.length === 0 ? (
                          <div className="py-12 px-4 text-center">
                            <div className="w-12 h-12 rounded-full bg-sky-50 text-sky-600 flex items-center justify-center mx-auto mb-2 border border-sky-200">
                              <CheckCircle2 size={24} />
                            </div>
                            <p className="text-sm font-bold text-slate-800">All caught up!</p>
                            <p className="text-xs text-slate-400 mt-0.5">No notifications in this filter.</p>
                          </div>
                        ) : (
                          filteredNotifications.map(notification => (
                            <div
                              key={notification.id}
                              onClick={() => handleNotificationClick(notification)}
                              className={`p-3.5 hover:bg-blue-50/60 cursor-pointer transition-all flex items-start space-x-3 group relative ${
                                notification.isUnread ? 'bg-blue-50/30' : 'bg-white'
                              }`}
                            >
                              {/* Type Icon Badge */}
                              <div className={`w-8 h-8 rounded-xl border flex items-center justify-center shrink-0 mt-0.5 ${getIconContainerClass(notification.type)}`}>
                                {getNotificationIcon(notification.type)}
                              </div>

                              {/* Text Content */}
                              <div className="flex-1 min-w-0 pr-4">
                                <div className="flex items-center justify-between gap-1 mb-0.5">
                                  <span className="text-[11px] font-bold text-slate-600 truncate">
                                    {notification.patientName} &bull; {notification.patientCondition}
                                  </span>
                                  <span className="text-[10px] text-slate-400 shrink-0 flex items-center">
                                    <Clock size={10} className="mr-1 opacity-70" />
                                    {notification.time}
                                  </span>
                                </div>

                                <h4 className={`text-xs font-bold leading-snug ${
                                  notification.isUnread ? 'text-slate-900' : 'text-slate-700'
                                }`}>
                                  {notification.title}
                                </h4>

                                <p className="text-xs text-slate-500 leading-relaxed mt-0.5 line-clamp-2">
                                  {notification.message}
                                </p>
                              </div>

                              {/* Unread indicator & Dismiss button */}
                              <div className="flex flex-col items-center justify-between self-stretch shrink-0">
                                {notification.isUnread && (
                                  <span className="w-2 h-2 rounded-full bg-blue-600 mt-1" title="Unread" />
                                )}
                                <button
                                  type="button"
                                  onClick={(e) => removeNotification(e, notification.id)}
                                  className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-all mt-auto cursor-pointer"
                                  title="Dismiss notification"
                                >
                                  <X size={12} />
                                </button>
                              </div>
                            </div>
                          ))
                        )}
                      </div>

                      {/* Footer */}
                      <div className="p-2.5 bg-slate-50 border-t border-slate-100 text-center">
                        <span className="text-[11px] font-bold text-slate-500">
                          Click any notification to open patient chart & telemetry
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                <div className="h-6 w-px bg-slate-200 mx-1 hidden sm:block" />

                {/* Doctor Profile Pill with Dropdown */}
                <div ref={doctorMenuRef} className="relative">
                  <button
                    type="button"
                    onClick={() => setIsDoctorMenuOpen(!isDoctorMenuOpen)}
                    className={`flex items-center gap-2 p-1 pl-1.5 pr-2.5 rounded-2xl border transition-all cursor-pointer group shadow-2xs ${
                      isDoctorMenuOpen
                        ? 'bg-sky-50 border-sky-300 ring-2 ring-sky-500/15'
                        : 'bg-white hover:bg-sky-50/70 border-slate-200 hover:border-sky-300'
                    }`}
                    id="doctor-profile-btn"
                    title="Clinician Account, Credentials & Settings"
                  >
                    <div className="w-7 h-7 rounded-xl bg-gradient-to-br from-sky-600 to-blue-700 text-white flex items-center justify-center shrink-0 shadow-xs relative">
                      <Stethoscope size={13} />
                      <span className="w-2 h-2 rounded-full bg-emerald-500 border border-white absolute -bottom-0.5 -right-0.5" title="On Duty" />
                    </div>
                    <div className="hidden sm:flex flex-col text-left">
                      <span className="text-xs font-bold text-slate-800 leading-tight group-hover:text-sky-700 transition-colors">
                        {currentDoctor?.shortName || currentDoctor?.name?.split(',')[0] || 'Dr. Alex Vance'}
                      </span>
                      <span className="text-[10px] text-slate-500 font-semibold leading-none truncate max-w-[120px]">
                        {currentDoctor?.clinic ? currentDoctor.clinic.split(' ')[0] : 'VirtuHeal'} &bull; <span className="text-emerald-600 font-bold">On Duty</span>
                      </span>
                    </div>
                    <ChevronDown size={12} className={`text-slate-400 group-hover:text-slate-600 transition-transform duration-200 ml-0.5 hidden sm:block ${isDoctorMenuOpen ? 'rotate-180 text-sky-600' : ''}`} />
                  </button>

                  {/* Clinician Popover Menu */}
                  {isDoctorMenuOpen && (
                    <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden z-50 animate-scale-up">
                      {/* Clinician Header */}
                      <div className="p-4 bg-gradient-to-br from-slate-900 via-slate-800 to-sky-950 text-white">
                        <div className="flex items-center gap-3 mb-2.5">
                          <div className="w-10 h-10 rounded-2xl bg-sky-500/20 border border-sky-400/30 text-sky-300 flex items-center justify-center shrink-0">
                            <Stethoscope size={20} />
                          </div>
                          <div className="min-w-0">
                            <h4 className="text-xs font-black truncate text-white">
                              {currentDoctor?.name || 'Dr. Alex Vance, PT, DPT, PhD'}
                            </h4>
                            <p className="text-[11px] text-sky-200 truncate">
                              {currentDoctor?.title || 'Chief of Physical Rehabilitation'}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center justify-between pt-2 border-t border-white/10 text-[10px] text-slate-300">
                          <span className="truncate max-w-[170px]">{currentDoctor?.clinic || 'VirtuHeal Clinical Center'}</span>
                          <span className="inline-flex items-center gap-1 font-bold text-emerald-400 bg-emerald-500/20 px-2 py-0.5 rounded-full border border-emerald-500/30">
                            <ShieldCheck size={11} />
                            Board Certified
                          </span>
                        </div>
                      </div>

                      {/* Menu Options */}
                      <div className="p-2 space-y-1 text-xs">
                        <button
                          type="button"
                          onClick={() => {
                            setIsDoctorMenuOpen(false);
                            setIsProfileOpen(true);
                          }}
                          className="w-full px-3 py-2.5 rounded-xl hover:bg-sky-50 text-slate-700 hover:text-sky-700 flex items-center justify-between font-bold transition-colors cursor-pointer group"
                        >
                          <div className="flex items-center gap-2.5">
                            <GraduationCap size={16} className="text-sky-600 group-hover:scale-110 transition-transform" />
                            <span>Clinical Credentials & Degrees</span>
                          </div>
                          <ChevronRight size={14} className="text-slate-400 group-hover:translate-x-0.5 transition-transform" />
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setIsDoctorMenuOpen(false);
                            if (onOpenLanding) onOpenLanding();
                            else if (onNavigateEnvironment) onNavigateEnvironment('landing');
                          }}
                          className="w-full px-3 py-2.5 rounded-xl hover:bg-slate-100 text-slate-700 hover:text-slate-900 flex items-center justify-between font-semibold transition-colors cursor-pointer"
                        >
                          <div className="flex items-center gap-2.5">
                            <Globe size={16} className="text-sky-600" />
                            <span>Preview Public Landing Page</span>
                          </div>
                          <ExternalLink size={13} className="text-slate-400" />
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setIsDoctorMenuOpen(false);
                            setIsHelpOpen(true);
                          }}
                          className="w-full px-3 py-2.5 rounded-xl hover:bg-slate-100 text-slate-700 hover:text-slate-900 flex items-center justify-between font-semibold transition-colors cursor-pointer"
                        >
                          <div className="flex items-center gap-2.5">
                            <HelpCircle size={16} className="text-slate-500" />
                            <span>Clinical Setup & AI Guide</span>
                          </div>
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setIsDoctorMenuOpen(false);
                            setIsSettingsOpen(true);
                          }}
                          className="w-full px-3 py-2.5 rounded-xl hover:bg-slate-100 text-slate-700 hover:text-slate-900 flex items-center justify-between font-semibold transition-colors cursor-pointer"
                        >
                          <div className="flex items-center gap-2.5">
                            <Sliders size={16} className="text-slate-500" />
                            <span>Telemetry & AR Preferences</span>
                          </div>
                        </button>
                      </div>

                      {/* Logout Row */}
                      {onLogout && (
                        <div className="p-2 border-t border-slate-100 bg-slate-50">
                          <button
                            type="button"
                            onClick={() => {
                              setIsDoctorMenuOpen(false);
                              onLogout();
                            }}
                            className="w-full px-3 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold flex items-center justify-center gap-2 transition-colors cursor-pointer border border-rose-200"
                          >
                            <LogOut size={14} />
                            <span>Sign Out of Doctor Session</span>
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <div className="h-6 w-px bg-slate-200 mx-0.5 hidden sm:block" />

                {/* Sign Out Button (Doctor Mode) */}
                {onLogout && (
                  <button
                    type="button"
                    onClick={onLogout}
                    className="px-3 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer active:scale-95 shadow-2xs"
                    title="Sign out of Doctor Portal"
                    id="doctor-logout-btn"
                  >
                    <LogOut size={13} />
                    <span>Sign Out</span>
                  </button>
                )}
              </>
            ) : (
              /* ------------------------------------------------------ */
              /* PATIENT VIEW CONTROLS                                  */
              /* ------------------------------------------------------ */
              <>
                {/* Patient Profile & Condition Badge */}
                {activePatient && (
                  <div className="flex items-center gap-2.5 px-3 py-1 bg-sky-50/90 border border-sky-200/80 rounded-full shadow-2xs">
                    <div className="w-7 h-7 rounded-full bg-sky-600 text-white flex items-center justify-center text-[10px] font-black shadow-xs">
                      {activePatient.name?.split(' ').map(n => n[0]).join('') || 'PT'}
                    </div>
                    <div className="flex flex-col text-left">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-black text-slate-900 leading-none">
                          {activePatient.name}
                        </span>
                        <span className="hidden md:inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded-full text-[9px] font-black bg-sky-100 text-sky-800">
                          <Flame size={10} className="text-sky-600" />
                          Active Plan
                        </span>
                      </div>
                      <span className="text-[10px] text-sky-800 font-semibold leading-none mt-0.5 truncate max-w-[150px] sm:max-w-[200px]">
                        {activePatient.condition || 'Physical Therapy Recovery'}
                      </span>
                    </div>
                  </div>
                )}

                {/* Return to Public Landing Page */}
                <button
                  type="button"
                  onClick={() => onOpenLanding ? onOpenLanding() : onNavigateEnvironment && onNavigateEnvironment('landing')}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-white/80 hover:bg-white text-slate-700 hover:text-slate-900 border border-sky-900/10 hover:border-sky-500/40 text-xs font-bold transition-all shadow-2xs active:scale-95 cursor-pointer"
                  title="Return to Public Landing Page"
                  id="patient-to-landing-btn"
                >
                  <Globe size={13} className="text-sky-600" />
                  <span className="hidden sm:inline">Landing Page</span>
                </button>

                {/* Patient Help & Camera Setup Button */}
                <button
                  type="button"
                  onClick={() => setIsHelpOpen(true)}
                  className="px-3 py-1.5 rounded-xl text-xs font-bold text-slate-600 hover:text-blue-600 hover:bg-blue-50 border border-slate-200 hover:border-blue-200 transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs"
                  title="Exercise Instructions & Camera Setup Guide"
                  id="patient-help-btn"
                >
                  <HelpCircle size={14} className="text-blue-600" />
                  <span className="hidden sm:inline">Exercise Guide</span>
                </button>

                {/* Quick Preferences Settings Popover (Patient Mode) */}
                <div ref={settingsRef} className="relative">
                  <button
                    type="button"
                    onClick={() => setIsSettingsOpen(!isSettingsOpen)}
                    className="p-2 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-xl border border-transparent hover:border-slate-200 transition-all cursor-pointer"
                    title="Camera Preferences"
                  >
                    <Settings size={18} />
                  </button>

                  {isSettingsOpen && (
                    <div className="absolute right-0 top-full mt-2 w-64 bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden z-50 p-4 space-y-3 animate-scale-up">
                      <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                        <span className="text-xs font-bold text-slate-900">Exercise Settings</span>
                      </div>
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                          <Volume2 size={15} className="text-blue-600" />
                          <span className="font-semibold text-slate-800">Rep Chimes</span>
                        </div>
                        <button
                          type="button"
                          onClick={toggleAudio}
                          className={`w-9 h-5 rounded-full transition-colors relative cursor-pointer ${
                            audioFeedback ? 'bg-blue-600' : 'bg-slate-300'
                          }`}
                        >
                          <span className={`w-3.5 h-3.5 rounded-full bg-white absolute top-0.75 transition-transform ${
                            audioFeedback ? 'right-1' : 'left-1'
                          }`} />
                        </button>
                      </div>
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                          <Eye size={15} className="text-sky-600" />
                          <span className="font-semibold text-slate-800">Angle Badges</span>
                        </div>
                        <button
                          type="button"
                          onClick={toggleAngleOverlay}
                          className={`w-9 h-5 rounded-full transition-colors relative cursor-pointer ${
                            showAngleOverlay ? 'bg-sky-600' : 'bg-slate-300'
                          }`}
                        >
                          <span className={`w-3.5 h-3.5 rounded-full bg-white absolute top-0.75 transition-transform ${
                            showAngleOverlay ? 'right-1' : 'left-1'
                          }`} />
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                <div className="h-6 w-px bg-slate-200 mx-0.5" />

                {/* Sign Out Button (Patient Mode) */}
                {onLogout && (
                  <button
                    type="button"
                    onClick={onLogout}
                    className="px-3 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer active:scale-95 shadow-2xs"
                    title="Sign out of Patient Portal"
                    id="patient-logout-btn"
                  >
                    <LogOut size={13} />
                    <span className="hidden sm:inline">Sign Out</span>
                  </button>
                )}
              </>
            )}

          </div>

        </div>

        {/* ============================================================ */}
        {/* MOBILE NAVIGATION DRAWER (FOR DOCTOR MODE ON SMALL SCREENS)  */}
        {/* ============================================================ */}
        {/* Mobile Navigation Menu (Doctor Mode Drawer) */}
        {authRole === 'doctor' && isMobileMenuOpen && (
          <div className="md:hidden border-t border-slate-200 bg-white/98 backdrop-blur-2xl px-4 py-4 space-y-3 animate-fade-in shadow-xl">
            {/* Clinician Identity Banner */}
            <div className="p-3 bg-gradient-to-r from-sky-50 to-blue-50/80 rounded-2xl border border-sky-100 flex items-center justify-between">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-sky-600 to-blue-700 text-white flex items-center justify-center shrink-0 shadow-xs">
                  <Stethoscope size={18} />
                </div>
                <div className="min-w-0">
                  <div className="text-xs font-black text-slate-900 truncate">
                    {currentDoctor?.shortName || currentDoctor?.name || 'Dr. Alex Vance'}
                  </div>
                  <div className="text-[10px] text-sky-700 font-semibold truncate">
                    {currentDoctor?.clinic || 'VirtuHeal Clinical Center'}
                  </div>
                </div>
              </div>
              <span className="inline-flex items-center gap-1 text-[9px] font-bold text-emerald-700 bg-emerald-100/90 border border-emerald-200 px-2 py-0.5 rounded-full shrink-0">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                On Duty
              </span>
            </div>

            {/* Quick Search Patient in Mobile */}
            <button
              type="button"
              onClick={() => {
                setIsMobileMenuOpen(false);
                setIsSearchOpen(true);
                setTimeout(() => searchInputRef.current?.focus(), 50);
              }}
              className="w-full p-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 flex items-center gap-2.5 text-xs font-semibold transition-all cursor-pointer"
            >
              <Search size={15} className="text-sky-600" />
              <span className="text-slate-500">Search patients by name or ID...</span>
              <kbd className="ml-auto text-[9px] font-mono bg-white border border-slate-200 px-1.5 py-0.5 rounded text-slate-400">
                Ctrl+K
              </kbd>
            </button>

            {/* Navigation Tab Links */}
            <div className="space-y-1.5">
              <button
                type="button"
                onClick={() => {
                  if (onViewChange) onViewChange('dashboard');
                  setIsMobileMenuOpen(false);
                }}
                className={`w-full p-3 rounded-xl text-xs font-bold flex items-center justify-between transition-all cursor-pointer ${
                  currentView === 'dashboard'
                    ? 'bg-sky-50 text-sky-700 border border-sky-200 shadow-2xs'
                    : 'bg-white text-slate-700 hover:bg-slate-50 border border-slate-200/80'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${
                    currentView === 'dashboard' ? 'bg-sky-600 text-white' : 'bg-slate-100 text-slate-500'
                  }`}>
                    <LayoutDashboard size={15} />
                  </div>
                  <div className="text-left">
                    <div>Dashboard</div>
                    <div className="text-[10px] font-normal text-slate-400">Daily triage, schedule & cohort adherence</div>
                  </div>
                </div>
                <ChevronRight size={14} className="text-slate-400" />
              </button>

              <button
                type="button"
                onClick={() => {
                  if (onViewChange) onViewChange('patients');
                  setIsMobileMenuOpen(false);
                }}
                className={`w-full p-3 rounded-xl text-xs font-bold flex items-center justify-between transition-all cursor-pointer ${
                  currentView === 'patients'
                    ? 'bg-sky-50 text-sky-700 border border-sky-200 shadow-2xs'
                    : 'bg-white text-slate-700 hover:bg-slate-50 border border-slate-200/80'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${
                    currentView === 'patients' ? 'bg-sky-600 text-white' : 'bg-slate-100 text-slate-500'
                  }`}>
                    <Users size={15} />
                  </div>
                  <div className="text-left">
                    <div className="flex items-center gap-1.5">
                      <span>Patients & Workspace</span>
                      {patients.length > 0 && (
                        <span className="px-1.5 py-0.2 rounded-full text-[9px] font-bold bg-sky-100 text-sky-800">
                          {patients.length} active
                        </span>
                      )}
                    </div>
                    <div className="text-[10px] font-normal text-slate-400">Live ROM telemetry, charts & video protocols</div>
                  </div>
                </div>
                <ChevronRight size={14} className="text-slate-400" />
              </button>

              <button
                type="button"
                onClick={() => {
                  if (onViewChange) onViewChange('analytics');
                  setIsMobileMenuOpen(false);
                }}
                className={`w-full p-3 rounded-xl text-xs font-bold flex items-center justify-between transition-all cursor-pointer ${
                  currentView === 'analytics'
                    ? 'bg-sky-50 text-sky-700 border border-sky-200 shadow-2xs'
                    : 'bg-white text-slate-700 hover:bg-slate-50 border border-slate-200/80'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${
                    currentView === 'analytics' ? 'bg-sky-600 text-white' : 'bg-slate-100 text-slate-500'
                  }`}>
                    <TrendingUp size={15} />
                  </div>
                  <div className="text-left">
                    <div className="flex items-center gap-1.5">
                      <span>Cohort Analytics</span>
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    </div>
                    <div className="text-[10px] font-normal text-slate-400">Recovery velocity & adherence reports</div>
                  </div>
                </div>
                <ChevronRight size={14} className="text-slate-400" />
              </button>
            </div>

            {/* Additional Actions */}
            <div className="pt-2 border-t border-slate-200 space-y-2 text-xs font-bold">
              <button
                type="button"
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  setIsProfileOpen(true);
                }}
                className="w-full p-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 flex items-center justify-center gap-1.5 cursor-pointer active:scale-95 transition-all"
              >
                <GraduationCap size={14} className="text-sky-600" />
                <span>Doctor Credentials & Degrees</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  if (onOpenLanding) onOpenLanding();
                  else if (onNavigateEnvironment) onNavigateEnvironment('landing');
                }}
                className="w-full p-2.5 rounded-xl bg-white text-slate-700 border border-slate-200 flex items-center justify-center gap-1.5 cursor-pointer active:scale-95 transition-all"
              >
                <Globe size={14} className="text-sky-600" />
                <span>Preview Public Landing Page</span>
              </button>

              {onLogout && (
                <button
                  type="button"
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    onLogout();
                  }}
                  className="w-full p-2.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 flex items-center justify-center gap-1.5 cursor-pointer active:scale-95 shadow-2xs transition-all"
                  id="mobile-doctor-logout-btn"
                >
                  <LogOut size={14} />
                  <span>Sign Out of Doctor Session</span>
                </button>
              )}
            </div>
          </div>
        )}
      </header>

      {/* ============================================================== */}
      {/* CLINICAL HELP & GUIDE MODAL                                    */}
      {/* ============================================================== */}
      {isHelpOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-2xl w-full overflow-hidden flex flex-col max-h-[90vh]">
            
            {/* Modal Header */}
            <div className="p-5 bg-gradient-to-r from-blue-600 to-indigo-700 text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-white/15 flex items-center justify-center backdrop-blur-md">
                  <HelpCircle size={22} />
                </div>
                <div>
                  <h3 className="text-base font-black">VirtuHeal Clinical & AI Guide</h3>
                  <p className="text-xs text-blue-100">Camera setup, 90° biomechanics, and keyboard controls</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsHelpOpen(false)}
                className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 text-white flex items-center justify-center transition-colors cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            {/* Modal Tabs */}
            <div className="flex border-b border-slate-200 bg-slate-50 px-5 pt-3 gap-2 text-xs font-bold">
              <button
                type="button"
                onClick={() => setHelpTab('camera')}
                className={`pb-2.5 px-3 border-b-2 transition-all cursor-pointer flex items-center gap-1.5 ${
                  helpTab === 'camera'
                    ? 'border-blue-600 text-blue-700'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                <Camera size={14} />
                <span>Webcam Setup</span>
              </button>
              <button
                type="button"
                onClick={() => setHelpTab('goniometer')}
                className={`pb-2.5 px-3 border-b-2 transition-all cursor-pointer flex items-center gap-1.5 ${
                  helpTab === 'goniometer'
                    ? 'border-blue-600 text-blue-700'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                <Activity size={14} />
                <span>90° Biomechanics Rule</span>
              </button>
              <button
                type="button"
                onClick={() => setHelpTab('shortcuts')}
                className={`pb-2.5 px-3 border-b-2 transition-all cursor-pointer flex items-center gap-1.5 ${
                  helpTab === 'shortcuts'
                    ? 'border-blue-600 text-blue-700'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                <Command size={14} />
                <span>Shortcuts</span>
              </button>
              <button
                type="button"
                onClick={() => setHelpTab('compliance')}
                className={`pb-2.5 px-3 border-b-2 transition-all cursor-pointer flex items-center gap-1.5 ${
                  helpTab === 'compliance'
                    ? 'border-blue-600 text-blue-700'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                <ShieldCheck size={14} />
                <span>HIPAA Privacy</span>
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-4 text-xs text-slate-600">
              {helpTab === 'camera' && (
                <div className="space-y-4">
                  <div className="p-4 rounded-2xl bg-blue-50/70 border border-blue-200 space-y-2">
                    <h4 className="font-black text-slate-900 text-sm flex items-center gap-2">
                      <Camera size={16} className="text-blue-600" />
                      Positioning for 60 FPS Pose Estimation
                    </h4>
                    <p className="text-slate-600 leading-relaxed">
                      For accurate repetition counting and joint range-of-motion measurements, ensure the following setup:
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                    <div className="p-3 rounded-xl border border-slate-200 bg-slate-50 space-y-1">
                      <div className="font-bold text-slate-900 flex items-center gap-1.5">
                        <CheckCircle2 size={14} className="text-sky-600" />
                        <span>Distance: 5 to 8 Feet</span>
                      </div>
                      <p className="text-slate-500">
                        For upper extremity exercises (shoulder press), the torso, elbows, and full arm reach must be clearly visible.
                      </p>
                    </div>

                    <div className="p-3 rounded-xl border border-slate-200 bg-slate-50 space-y-1">
                      <div className="font-bold text-slate-900 flex items-center gap-1.5">
                        <CheckCircle2 size={14} className="text-sky-600" />
                        <span>Even Front Lighting</span>
                      </div>
                      <p className="text-slate-500">
                        Avoid strong backlighting or windows directly behind you. Light facing your body ensures landmark contrast.
                      </p>
                    </div>

                    <div className="p-3 rounded-xl border border-slate-200 bg-slate-50 space-y-1">
                      <div className="font-bold text-slate-900 flex items-center gap-1.5">
                        <CheckCircle2 size={14} className="text-sky-600" />
                        <span>Stable Camera Angle</span>
                      </div>
                      <p className="text-slate-500">
                        Keep laptop or webcam at chest height without steep upward or downward angles.
                      </p>
                    </div>

                    <div className="p-3 rounded-xl border border-slate-200 bg-slate-50 space-y-1">
                      <div className="font-bold text-slate-900 flex items-center gap-1.5">
                        <CheckCircle2 size={14} className="text-sky-600" />
                        <span>Fitted Clothing</span>
                      </div>
                      <p className="text-slate-500">
                        Wear form-fitting gym attire so computer vision algorithms can identify shoulder, elbow, and wrist joints clearly.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {helpTab === 'goniometer' && (
                <div className="space-y-4">
                  <div className="p-4 rounded-2xl bg-sky-50/70 border border-sky-200 space-y-2">
                    <h4 className="font-black text-slate-900 text-sm flex items-center gap-2">
                      <Activity size={16} className="text-sky-600" />
                      Gym Standard 90° Repetition Rule
                    </h4>
                    <p className="text-slate-600 leading-relaxed">
                      VirtuHeal uses clinical mathematical trigonometry to eliminate "fake" rep counting and ensure only authentic physical therapy movements are recorded.
                    </p>
                  </div>

                  <div className="space-y-3">
                    <div className="p-3 rounded-xl border border-slate-200 space-y-1">
                      <div className="font-bold text-slate-900">1. Overhead Shoulder Press Protocol</div>
                      <p className="text-slate-500">
                        Arms must bend downward to at least 90° elbow inflection (eccentric phase) before extending upward above the shoulders (concentric phase). Waving hands or movements outside camera frame will NOT count as reps.
                      </p>
                    </div>

                    <div className="p-3 rounded-xl border border-slate-200 space-y-1">
                      <div className="font-bold text-slate-900">2. Seated Knee Extension & ACL Protocol</div>
                      <p className="text-slate-500">
                        Full knee extension requires reaching within 10° of terminal extension (0° straight) and holding for at least 0.5 seconds before returning to 90° flexion.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {helpTab === 'shortcuts' && (
                <div className="space-y-3">
                  <div className="font-bold text-slate-900 text-sm mb-2">Platform Hotkeys & Shortcuts</div>
                  <div className="divide-y divide-slate-100 border border-slate-200 rounded-2xl overflow-hidden">
                    <div className="p-3 flex items-center justify-between bg-slate-50/50">
                      <span className="font-medium text-slate-700">Quick Patient Search</span>
                      <kbd className="px-2 py-1 text-[11px] font-mono bg-white border border-slate-200 rounded text-slate-700 shadow-2xs font-bold">
                        Ctrl + K
                      </kbd>
                    </div>
                    <div className="p-3 flex items-center justify-between">
                      <span className="font-medium text-slate-700">Close Any Modal / Popover</span>
                      <kbd className="px-2 py-1 text-[11px] font-mono bg-white border border-slate-200 rounded text-slate-700 shadow-2xs font-bold">
                        Escape
                      </kbd>
                    </div>
                    <div className="p-3 flex items-center justify-between bg-slate-50/50">
                      <span className="font-medium text-slate-700">Camera Pose Tracking Toggle</span>
                      <kbd className="px-2 py-1 text-[11px] font-mono bg-white border border-slate-200 rounded text-slate-700 shadow-2xs font-bold">
                        Spacebar (during session)
                      </kbd>
                    </div>
                  </div>
                </div>
              )}

              {helpTab === 'compliance' && (
                <div className="space-y-4">
                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                    <div className="font-black text-slate-900 text-sm flex items-center gap-2">
                      <ShieldCheck size={18} className="text-sky-600" />
                      <span>Zero-Upload In-Browser Privacy Guarantee</span>
                    </div>
                    <p className="text-slate-600 leading-relaxed">
                      VirtuHeal runs MediaPipe BlazePose directly inside your browser's WebAssembly and WebGL sandbox. Your video camera stream is processed strictly in your local device memory and is <strong>never uploaded, recorded, or stored on external servers</strong>.
                    </p>
                  </div>
                  <div className="text-[11px] text-slate-500">
                    Compliant with HIPAA Privacy Rule (45 CFR § 164.530) and SOC-2 Type II telemetry standards.
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end">
              <button
                type="button"
                onClick={() => setIsHelpOpen(false)}
                className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-md shadow-blue-600/30 transition-all cursor-pointer"
              >
                Got It, Close Guide
              </button>
            </div>

          </div>
        </div>
      )}

      {/* Global Patient Command Palette Modal (Spotlight / Raycast style for all screen sizes) */}
      {isSearchOpen && (
        <div 
          className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-start justify-center pt-16 sm:pt-24 px-4 animate-fade-in"
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsSearchOpen(false);
          }}
        >
          <div 
            ref={searchRef}
            className="bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden w-full max-w-xl animate-scale-up"
          >
            {/* Search Input Bar */}
            <div className="p-4 bg-slate-50/90 border-b border-slate-200 flex items-center gap-3">
              <Search size={18} className="text-sky-600 shrink-0" />
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search patient by name, ID, or condition..."
                className="w-full bg-transparent text-sm text-slate-900 placeholder-slate-400 focus:outline-none font-semibold"
                autoFocus
              />
              {searchQuery ? (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="p-1 text-slate-400 hover:text-slate-600 cursor-pointer"
                  title="Clear search"
                >
                  <X size={16} />
                </button>
              ) : (
                <kbd className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-mono bg-white border border-slate-200 rounded text-slate-500 shadow-2xs">
                  ESC
                </kbd>
              )}
            </div>

            {/* Patients List Results */}
            <div className="max-h-80 overflow-y-auto divide-y divide-slate-100 p-2">
              {filteredPatients.length === 0 ? (
                <div className="py-12 text-center text-xs text-slate-400 space-y-1">
                  <Users size={28} className="mx-auto text-slate-300 mb-2" />
                  <p className="font-bold text-slate-700 text-sm">No patients found</p>
                  <p>No cohort records match "{searchQuery}"</p>
                </div>
              ) : (
                filteredPatients.map(patient => (
                  <div
                    key={patient.id}
                    onClick={() => {
                      if (onSelectPatient) onSelectPatient(patient.id);
                      if (onViewChange) onViewChange('patients');
                      setIsSearchOpen(false);
                      setSearchQuery('');
                    }}
                    className={`p-3 rounded-xl hover:bg-sky-50/80 cursor-pointer transition-all flex items-center justify-between gap-3 group ${
                      patient.id === selectedPatientId ? 'bg-sky-50/60 border border-sky-200/60' : ''
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-sky-500 to-blue-600 text-white font-bold text-xs flex items-center justify-center shrink-0 shadow-xs">
                        {patient.name?.split(' ').map(n => n[0]).join('') || 'PT'}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-slate-900 truncate group-hover:text-sky-700 transition-colors">
                            {patient.name}
                          </span>
                          <span className="text-[10px] font-mono text-slate-400 bg-slate-100 px-1.5 py-0.2 rounded">
                            #{patient.id}
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-500 truncate">
                          {patient.condition || 'General Rehabilitation'}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {typeof patient.adherenceScore === 'number' && (
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          patient.adherenceScore >= 80 
                            ? 'bg-emerald-100 text-emerald-800' 
                            : patient.adherenceScore >= 60 
                              ? 'bg-amber-100 text-amber-800' 
                              : 'bg-rose-100 text-rose-800'
                        }`}>
                          {patient.adherenceScore}% Adherence
                        </span>
                      )}
                      {patient.id === selectedPatientId && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-sky-100 text-sky-800 border border-sky-200">
                          Active Chart
                        </span>
                      )}
                      <ChevronRight size={15} className="text-slate-400 group-hover:text-sky-600 group-hover:translate-x-0.5 transition-all" />
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Palette Footer */}
            <div className="p-2.5 bg-slate-50 border-t border-slate-100 text-[11px] text-slate-500 flex items-center justify-between px-4">
              <span>Click or tap to open clinical chart</span>
              <span className="flex items-center gap-1">
                <kbd className="px-1.5 py-0.5 bg-white border border-slate-200 rounded font-mono text-[10px]">ESC</kbd> to close
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Doctor Profile Modal */}
      <DoctorProfileModal
        isOpen={isProfileOpen}
        onClose={() => setIsProfileOpen(false)}
        doctor={currentDoctor}
        onLogout={onLogout}
      />
    </>
  );
}
