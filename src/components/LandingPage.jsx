import React, { useState, useRef, useEffect } from 'react';
import { 
  ActivitySquare, 
  Stethoscope, 
  User, 
  UserPlus, 
  KeyRound, 
  ShieldCheck, 
  ArrowRight, 
  Lock, 
  CheckCircle2, 
  Sparkles, 
  Camera, 
  Play, 
  Award, 
  Globe, 
  Mail, 
  Phone, 
  MapPin, 
  Menu, 
  X, 
  Send, 
  Activity, 
  Layers,
  Home
} from 'lucide-react';
import { createPatient } from '../api/client';

const CURRENT_YEAR = new Date().getFullYear();

export default function LandingPage({
  patients = [],
  verifiedDoctors = [],
  onPatientLogin,
  onPatientRegister,
  onDoctorLogin,
  onDoctorRegister,
  isBackendConnected = false
}) {
  // Mobile Navigation Drawer
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Dynamic Scroll & Section Spy (High-performance, zero-reflow IntersectionObserver)
  const [isScrolled, setIsScrolled] = useState(false);
  const [activeSection, setActiveSection] = useState('hero');

  useEffect(() => {
    // 1. Header scroll detector via sentinel: zero scroll events, fires only at 24px threshold
    const sentinel = document.getElementById('scroll-sentinel');
    let scrollObserver = null;
    if (sentinel && 'IntersectionObserver' in window) {
      scrollObserver = new IntersectionObserver(
        ([entry]) => {
          setIsScrolled(!entry.isIntersecting);
        },
        { threshold: 0 }
      );
      scrollObserver.observe(sentinel);
    } else {
      const handleScroll = () => {
        const scrolled = window.scrollY > 20;
        setIsScrolled(prev => (prev !== scrolled ? scrolled : prev));
      };
      window.addEventListener('scroll', handleScroll, { passive: true });
      return () => window.removeEventListener('scroll', handleScroll);
    }

    // 2. Section spy using IntersectionObserver (runs off-main-thread, zero offsetTop reflows)
    const sections = ['hero', 'about', 'mission', 'activities', 'contact'];
    const sectionElements = sections.map(id => document.getElementById(id)).filter(Boolean);
    let sectionObserver = null;

    if ('IntersectionObserver' in window && sectionElements.length > 0) {
      sectionObserver = new IntersectionObserver(
        (entries) => {
          const visible = entries.filter(e => e.isIntersecting);
          if (visible.length > 0) {
            visible.sort((a, b) => b.intersectionRatio - a.intersectionRatio);
            setActiveSection(visible[0].target.id);
          }
        },
        {
          rootMargin: '-20% 0px -60% 0px',
          threshold: [0, 0.25, 0.5, 0.75]
        }
      );
      sectionElements.forEach(el => sectionObserver.observe(el));
    }

    return () => {
      if (scrollObserver) scrollObserver.disconnect();
      if (sectionObserver) sectionObserver.disconnect();
    };
  }, []);

  // Active Role Tab in the Doctor & Patient Entry Hub: 'patient' | 'doctor'
  const [activePortalRole, setActivePortalRole] = useState('patient');

  // Sub-tabs for Patient: 'signin' | 'register'
  const [patientTab, setPatientTab] = useState('signin');
  // Sub-tabs for Doctor: 'signin' | 'register'
  const [doctorTab, setDoctorTab] = useState('signin');

  // Ref for smooth scrolling to Doctor & Patient Entry Hub
  const entryHubRef = useRef(null);

  // Patient Card: Sign In Form State
  const [patLoginId, setPatLoginId] = useState('');
  const [patLoginPin, setPatLoginPin] = useState('');
  const [patLoginError, setPatLoginError] = useState('');

  // Patient Card: Register Form State
  const [patName, setPatName] = useState('');
  const [patAge, setPatAge] = useState('28');
  const [patCondition, setPatCondition] = useState('ACL Reconstruction');
  const [patPain, setPatPain] = useState(4);
  const [patDoctor, setPatDoctor] = useState(verifiedDoctors[0]?.name || 'Dr. Alex Vance, PT, DPT, PhD');
  const [patUploadedFile, setPatUploadedFile] = useState(null);
  const [patNotes, setPatNotes] = useState('MRI Scan: Full thickness tear of anterior cruciate ligament with mild bone contusion. Cleared for Phase II active-assisted physical therapy.');
  const [patError, setPatError] = useState('');
  const [isPatSubmitting, setIsPatSubmitting] = useState(false);

  // Doctor Card: Sign In State
  const [selectedDoctorId, setSelectedDoctorId] = useState(verifiedDoctors[0]?.id || 'doc_1');
  const [doctorPin, setDoctorPin] = useState('');
  const [doctorError, setDoctorError] = useState('');

  // Doctor Card: Register Form State
  const [docName, setDocName] = useState('');
  const [docClinic, setDocClinic] = useState('VirtuHeal Center for Advanced Human Performance');
  const [docSpecialty, setDocSpecialty] = useState('Sports Medicine & Orthopedic Rehabilitation');
  const [docDepartment, setDocDepartment] = useState('Department of Physical Medicine');
  const [docLicense, setDocLicense] = useState('NY-PT-049821');
  const [docPin, setDocPin] = useState('1234');
  const [docRegError, setDocRegError] = useState('');

  // Contact Form State
  const [contactName, setContactName] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactRole, setContactRole] = useState('patient');
  const [contactMessage, setContactMessage] = useState('');
  const [contactSubmitted, setContactSubmitted] = useState(false);

  // Smooth scroll helper
  const scrollToSection = (id) => {
    setMobileMenuOpen(false);
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // Scroll to Entry Hub with specific portal pre-selected
  const navigateToPortal = (role, tab = 'signin') => {
    setActivePortalRole(role);
    if (role === 'patient') {
      setPatientTab(tab);
    } else {
      setDoctorTab(tab);
    }
    setMobileMenuOpen(false);
    if (entryHubRef.current) {
      entryHubRef.current.scrollIntoView({ behavior: 'smooth' });
    } else {
      const el = document.getElementById('portals');
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // Handle Patient Sign In Form Submit
  const handlePatientSignInSubmit = (e) => {
    e.preventDefault();
    setPatLoginError('');

    const query = patLoginId.trim().toLowerCase();
    if (!query) {
      setPatLoginError('Please enter your Patient ID or Full Name.');
      return;
    }

    const matched = patients.find(p => 
      p.id.toLowerCase() === query ||
      p.name.toLowerCase() === query ||
      p.name.toLowerCase().includes(query) ||
      query.includes(p.name.toLowerCase())
    );

    if (!matched) {
      setPatLoginError(`No registered patient found matching "${patLoginId}". Please check your Medical ID / Full Name or switch to "Register as Patient".`);
      return;
    }

    const enteredPin = patLoginPin.trim();
    if (enteredPin && enteredPin !== '1234' && enteredPin !== (matched.pin || '1234')) {
      setPatLoginError('Incorrect password or PIN code. Default clinical demo PIN is 1234.');
      return;
    }

    onPatientLogin(matched.id);
  };

  // Handle New Patient Registration
  const handleRegisterPatientSubmit = async (e) => {
    e.preventDefault();
    setPatError('');

    if (!patName.trim()) {
      setPatError('Please enter your full legal name.');
      return;
    }
    if (!patCondition.trim()) {
      setPatError('Please specify your physical injury or condition.');
      return;
    }

    setIsPatSubmitting(true);
    const patientId = `p${Date.now()}`;

    const welcomeDoctorMsg = {
      id: `m_welcome_${Date.now()}`,
      sender: 'doctor',
      sender_id: 'doctor',
      receiver_id: patientId,
      text: `Hello ${patName.trim()}, welcome to VirtuHeal Rehabilitation. I am ${patDoctor}, your assigned physical therapy specialist. I have received and reviewed your hospital medical intake report regarding your ${patCondition.trim()}. Let's work together toward a full recovery! How is your current pain and mobility feeling today?`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    const patientReportMsg = {
      id: `m_report_${Date.now() + 1}`,
      sender: 'patient',
      sender_id: patientId,
      receiver_id: 'doctor',
      text: `📄 Uploaded Medical Report: ${patUploadedFile?.name || 'Hospital_Intake_Report.pdf'}\nClinical Notes: ${patNotes.trim() || patCondition.trim()}\nInitial Pain Level: ${patPain}/10`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    // Pre-assign gentle routine matching injury
    const condLower = patCondition.toLowerCase();
    let initialVideos = [];
    if (condLower.includes('shoulder') || condLower.includes('rotator') || condLower.includes('arm')) {
      initialVideos = [
        { id: `v1_${Date.now()}`, videoId: 'vid_3', title: "Codman's Pendulum Exercises", duration: '1:45', thumbnail: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?auto=format&fit=crop&w=800&q=80', videoUrl: '/videos/pendulum.mp4', sets: 3, reps: 15, notes: 'Gentle passive shoulder mobilization. Let arm hang completely relaxed.' },
        { id: `v2_${Date.now()}`, videoId: 'vid_8', title: 'Shoulder External Rotation Drill', duration: '1:50', thumbnail: 'https://images.unsplash.com/photo-1518611012118-696072aa579a?auto=format&fit=crop&w=800&q=80', videoUrl: '/videos/shoulder-rotation.mp4', sets: 3, reps: 10, notes: 'Keep elbow pinned at 90 degrees against ribs.' }
      ];
    } else {
      initialVideos = [
        { id: `v1_${Date.now()}`, videoId: 'vid_4', title: 'Supine Heel Slides on Mat', duration: '2:00', thumbnail: 'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?auto=format&fit=crop&w=800&q=80', videoUrl: '/videos/heel-slides.mp4', sets: 3, reps: 10, notes: 'Controlled knee flexion. Slide heel backward smoothly without sharp pain.' },
        { id: `v2_${Date.now()}`, videoId: 'vid_1', title: 'Quad Sets (Isometric Activation)', duration: '2:15', thumbnail: 'https://images.unsplash.com/photo-1518611012118-696072aa579a?auto=format&fit=crop&w=800&q=80', videoUrl: '/videos/quad-sets.mp4', sets: 3, reps: 10, notes: 'Tighten thigh muscles, press knee flat into surface and hold 5 seconds.' }
      ];
    }

    const payload = {
      id: patientId,
      name: patName.trim(),
      condition: patCondition.trim(),
      assignedDoctor: patDoctor,
      adherenceScore: 100,
      consistencyStreak: 1,
      progressData: [
        { day: 'Mon', date: 'Nov 5', score: 75, rom: 65, completedExercises: 2 },
        { day: 'Tue', date: 'Nov 6', score: 80, rom: 70, completedExercises: 2 },
        { day: 'Wed', date: 'Nov 7', score: 85, rom: 76, completedExercises: 3 },
        { day: 'Thu', date: 'Nov 8', score: 90, rom: 82, completedExercises: 3 },
        { day: 'Fri', date: 'Nov 9', score: 95, rom: 88, completedExercises: 3 },
        { day: 'Sat', date: 'Nov 10', score: 100, rom: 92, completedExercises: 4 },
        { day: 'Sun', date: 'Nov 11 (Today)', score: 100, rom: 96, completedExercises: 4 }
      ],
      recoveryTimeline: [
        { phase: 'Phase 1: Initial Medical Intake & Clinical Evaluation', date: 'Nov 05', status: 'Completed', detail: 'Hospital report reviewed, baseline pain measured, safe range established.' },
        { phase: 'Phase 2: Active Home Exercise Rehabilitation', date: 'Nov 08', status: 'In Progress', detail: 'Consistent daily execution of prescribed routines under attending clinician.' },
        { phase: 'Phase 3: Functional Range of Motion & Load', date: 'Nov 18', status: 'Upcoming', detail: 'Progressive load strengthening and joint stability progression.' }
      ],
      medicalReport: {
        fileName: patUploadedFile?.name || 'Hospital_Discharge_Summary.pdf',
        fileSize: patUploadedFile?.size || '2.4 MB',
        notes: patNotes.trim()
      },
      messages: [welcomeDoctorMsg, patientReportMsg],
      activeVideos: initialVideos
    };

    try {
      const serverPatient = await createPatient(payload);
      const mergedPatient = {
        ...payload,
        ...(serverPatient?.id ? serverPatient : {}),
        assignedDoctor: serverPatient?.assignedDoctor || payload.assignedDoctor,
        medicalReport: (serverPatient?.medicalReport && typeof serverPatient.medicalReport === 'object')
          ? serverPatient.medicalReport
          : payload.medicalReport,
        progressData: (serverPatient?.progressData && serverPatient.progressData.length > 0)
          ? serverPatient.progressData
          : payload.progressData
      };
      onPatientRegister(mergedPatient);
    } catch {
      onPatientRegister(payload);
    } finally {
      setIsPatSubmitting(false);
    }
  };

  const loadSamplePatientReport = () => {
    setPatUploadedFile({
      name: 'Hospital_Discharge_Summary_MRI_Knee.pdf',
      size: '2.4 MB',
      type: 'application/pdf'
    });
    setPatNotes('Orthopedic Hospital Report: Patient cleared for formal outpatient physical therapy. Focus on terminal extension (0 deg), quad activation, and edema management.');
  };

  // Handle Doctor Sign In
  const handleDoctorSignInSubmit = (e) => {
    e.preventDefault();
    setDoctorError('');

    const doc = verifiedDoctors.find(d => d.id === selectedDoctorId) || verifiedDoctors[0];
    const targetPin = doc?.pin || '1234';

    if (doctorPin.trim() !== targetPin && doctorPin.trim() !== '1234') {
      setDoctorError('Incorrect clinician PIN. Default clinical demo PIN is 1234.');
      return;
    }

    onDoctorLogin(doc, 'patients');
  };

  // Handle Doctor Registration
  const handleDoctorRegisterSubmit = (e) => {
    e.preventDefault();
    setDocRegError('');

    if (!docName.trim()) {
      setDocRegError('Please enter your full legal clinician name & degree.');
      return;
    }
    if (!docClinic.trim()) {
      setDocRegError('Please enter your hospital or clinic name.');
      return;
    }

    const short = docName.split(',')[0].trim();
    const newDoc = {
      id: `doc_${Date.now()}`,
      name: docName.trim(),
      shortName: short.startsWith('Dr.') ? short : `Dr. ${short}`,
      title: docSpecialty.trim() || 'Attending Physical Therapist',
      department: docDepartment.trim() || 'Department of Physical Medicine',
      clinic: docClinic.trim(),
      location: 'New York, NY',
      email: `${short.toLowerCase().replace(/[^a-z]/g, '')}@virtuheal.med`,
      phone: '+1 (555) 382-9012',
      license: docLicense.trim() || 'NY-PT-049821',
      npi: `${Math.floor(1000000000 + Math.random() * 9000000000)}`,
      avatar: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80',
      pin: docPin.trim() || '1234',
      specialties: [docSpecialty.trim()]
    };

    onDoctorRegister(newDoc);
  };

  // Handle Contact Form Submission
  const handleContactSubmit = (e) => {
    e.preventDefault();
    setContactSubmitted(true);
    setTimeout(() => {
      setContactName('');
      setContactEmail('');
      setContactMessage('');
    }, 1500);
  };

  return (
    <div className="aura-bg min-h-screen text-slate-800 flex flex-col font-sans relative overflow-x-hidden selection:bg-sky-600 selection:text-white scroll-smooth">
      {/* Fixed GPU-accelerated background layers (stays pinned to viewport, eliminates 4500px scroll repainting) */}
      <div className="aura-fixed-backdrop" aria-hidden="true">
        <div className="aura-layer-1" aria-hidden="true" />
        <div className="aura-layer-2" aria-hidden="true" />
      </div>

      {/* Zero-reflow Sentinel for instant sticky header transition */}
      <div id="scroll-sentinel" className="absolute top-0 left-0 w-full h-[24px] pointer-events-none -z-50" aria-hidden="true" />

      {/* Main Content sits above decorative layers */}
      <div className="relative z-10 flex flex-col min-h-screen w-full">
        {/* ============================================================== */}
        {/* 1. PUBLIC NAVIGATION BAR                                       */}
        {/* ============================================================== */}
        <header className={`sticky top-0 z-50 px-4 sm:px-8 py-3 transition-all duration-300 flex items-center justify-between ${
          isScrolled 
            ? 'border-b border-sky-900/10 bg-[#faf8f2]/92 backdrop-blur-2xl shadow-lg shadow-sky-950/5' 
            : 'border-b border-sky-900/5 bg-[#faf8f2]/80 backdrop-blur-xl'
        }`}>
          {/* Subtle Top Accent Line */}
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-sky-500 via-blue-500 to-cyan-500" />

          {/* Brand Logo */}
          <div 
            onClick={() => scrollToSection('hero')} 
            className="flex items-center gap-3 cursor-pointer group select-none"
          >
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-sky-500 to-blue-600 text-white flex items-center justify-center shadow-md shadow-sky-600/25 group-hover:scale-105 transition-transform duration-200">
              <ActivitySquare size={20} className="stroke-[2.5]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-base font-extrabold text-slate-900 tracking-tight">VirtuHeal</span>
                <span className="px-1.5 py-0.2 rounded-md text-[9px] font-extrabold bg-sky-500/15 text-sky-800 border border-sky-500/30">
                  v2.0 Clinical
                </span>
                <span className="hidden md:inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold bg-white/80 border border-sky-900/10 text-slate-600">
                  <span className={`w-1.5 h-1.5 rounded-full ${isBackendConnected ? 'bg-sky-500 animate-pulse' : 'bg-amber-400'}`} />
                  {isBackendConnected ? 'Cloud Sync' : 'Edge Mode'}
                </span>
              </div>
              <p className="text-[10px] text-slate-500 hidden sm:block">AI Biomechanical Physical Telerehabilitation</p>
            </div>
          </div>

          {/* Desktop Nav Links (Active Section Segmented Control) */}
          <nav className="hidden lg:flex items-center gap-1 bg-slate-200/50 backdrop-blur-md p-1 rounded-xl border border-sky-900/10 shadow-inner">
            <button 
              type="button" 
              onClick={() => scrollToSection('hero')} 
              className={`px-3 py-1.5 rounded-lg text-xs transition-all cursor-pointer select-none ${
                activeSection === 'hero'
                  ? 'text-slate-900 bg-white font-extrabold shadow-xs border border-slate-200/70'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/60 font-semibold'
              }`}
            >
              Home
            </button>
            <button 
              type="button" 
              onClick={() => scrollToSection('about')} 
              className={`px-3 py-1.5 rounded-lg text-xs transition-all cursor-pointer select-none ${
                activeSection === 'about'
                  ? 'text-slate-900 bg-white font-extrabold shadow-xs border border-slate-200/70'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/60 font-semibold'
              }`}
            >
              About Us
            </button>
            <button 
              type="button" 
              onClick={() => scrollToSection('mission')} 
              className={`px-3 py-1.5 rounded-lg text-xs transition-all cursor-pointer select-none ${
                activeSection === 'mission'
                  ? 'text-slate-900 bg-white font-extrabold shadow-xs border border-slate-200/70'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/60 font-semibold'
              }`}
            >
              Our Mission
            </button>
            <button 
              type="button" 
              onClick={() => scrollToSection('activities')} 
              className={`px-3 py-1.5 rounded-lg text-xs transition-all cursor-pointer select-none ${
                activeSection === 'activities'
                  ? 'text-slate-900 bg-white font-extrabold shadow-xs border border-slate-200/70'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/60 font-semibold'
              }`}
            >
              Our Activities
            </button>
            <button 
              type="button" 
              onClick={() => scrollToSection('contact')} 
              className={`px-3 py-1.5 rounded-lg text-xs transition-all cursor-pointer select-none ${
                activeSection === 'contact'
                  ? 'text-slate-900 bg-white font-extrabold shadow-xs border border-slate-200/70'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/60 font-semibold'
              }`}
            >
              Contact
            </button>
          </nav>

          {/* Desktop Action CTAs (Doctor & Patient Direct Buttons) */}
          <div className="hidden sm:flex items-center gap-2">
            <button
              type="button"
              onClick={() => navigateToPortal('patient', 'signin')}
              className="px-3 py-1.5 rounded-xl text-xs font-bold text-slate-700 hover:text-slate-900 bg-white/90 hover:bg-white border border-slate-200 hover:border-sky-300 transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs active:scale-95"
              title="Patient Recovery Portal"
            >
              <User size={13} className="text-sky-600" />
              <span>Patient Portal</span>
            </button>
            
            <button
              type="button"
              onClick={() => navigateToPortal('doctor', 'signin')}
              className="px-3 py-1.5 rounded-xl text-xs font-bold text-slate-700 hover:text-slate-900 bg-white/90 hover:bg-white border border-slate-200 hover:border-sky-300 transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs active:scale-95"
              title="Doctor Clinical Workspace"
            >
              <Stethoscope size={13} className="text-sky-600" />
              <span>Doctor Workspace</span>
            </button>

            <button
              type="button"
              onClick={() => navigateToPortal(activePortalRole, 'signin')}
              className="px-3.5 py-1.5 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 shadow-md shadow-sky-600/25 transition-all flex items-center gap-1.5 cursor-pointer active:scale-95"
            >
              <span>Login / Register</span>
              <ArrowRight size={13} />
            </button>
          </div>

          {/* Mobile Hamburger Button */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden p-2 rounded-xl bg-white/80 border border-sky-900/10 text-slate-700 hover:text-slate-900 focus:outline-none cursor-pointer shadow-2xs"
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </header>

        {/* Mobile Drawer Menu */}
        {mobileMenuOpen && (
          <div className="lg:hidden fixed inset-x-0 top-[65px] bg-[#faf8f2]/98 border-b border-sky-900/10 backdrop-blur-2xl z-40 p-5 space-y-4 shadow-2xl animate-fade-in">
            <nav className="flex flex-col space-y-2 text-sm font-bold text-slate-700">
              <button 
                type="button" 
                onClick={() => scrollToSection('hero')} 
                className={`text-left p-2.5 rounded-xl transition-colors flex items-center gap-2.5 ${
                  activeSection === 'hero' ? 'bg-sky-500/15 text-sky-800 border border-sky-500/30' : 'hover:bg-sky-50/60'
                }`}
              >
                <Home size={16} className="text-sky-600" />
                <span>Home</span>
              </button>
              <button 
                type="button" 
                onClick={() => scrollToSection('about')} 
                className={`text-left p-2.5 rounded-xl transition-colors flex items-center gap-2.5 ${
                  activeSection === 'about' ? 'bg-sky-500/15 text-sky-800 border border-sky-500/30' : 'hover:bg-sky-50/60'
                }`}
              >
                <ShieldCheck size={16} className="text-sky-600" />
                <span>About Us</span>
              </button>
              <button 
                type="button" 
                onClick={() => scrollToSection('mission')} 
                className={`text-left p-2.5 rounded-xl transition-colors flex items-center gap-2.5 ${
                  activeSection === 'mission' ? 'bg-sky-500/15 text-sky-800 border border-sky-500/30' : 'hover:bg-sky-50/60'
                }`}
              >
                <Award size={16} className="text-sky-700" />
                <span>Our Mission</span>
              </button>
              <button 
                type="button" 
                onClick={() => scrollToSection('activities')} 
                className={`text-left p-2.5 rounded-xl transition-colors flex items-center gap-2.5 ${
                  activeSection === 'activities' ? 'bg-sky-500/15 text-sky-800 border border-sky-500/30' : 'hover:bg-sky-50/60'
                }`}
              >
                <Activity size={16} className="text-sky-700" />
                <span>Our Activities</span>
              </button>
              <button 
                type="button" 
                onClick={() => scrollToSection('contact')} 
                className={`text-left p-2.5 rounded-xl transition-colors flex items-center gap-2.5 ${
                  activeSection === 'contact' ? 'bg-sky-500/15 text-sky-800 border border-sky-500/30' : 'hover:bg-sky-50/60'
                }`}
              >
                <Mail size={16} className="text-cyan-700" />
                <span>Contact</span>
              </button>
            </nav>

            <div className="pt-3 border-t border-sky-900/10 grid grid-cols-2 gap-2 text-xs font-black">
              <button
                type="button"
                onClick={() => {
                  navigateToPortal('patient', 'signin');
                }}
                className="py-2.5 px-3 rounded-xl bg-sky-500/15 hover:bg-sky-500/25 text-sky-800 border border-sky-500/30 flex items-center justify-center gap-1.5 cursor-pointer active:scale-95"
              >
                <User size={13} />
                <span>Patient Portal</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  navigateToPortal('doctor', 'signin');
                }}
                className="py-2.5 px-3 rounded-xl bg-sky-500/15 hover:bg-sky-500/25 text-sky-800 border border-sky-500/30 flex items-center justify-center gap-1.5 cursor-pointer active:scale-95"
              >
                <Stethoscope size={13} />
                <span>Doctor Workspace</span>
              </button>
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* 2. HERO SECTION                                                */}
        {/* ============================================================== */}
        <section id="hero" className="relative pt-14 pb-20 md:pt-20 md:pb-28 px-4 sm:px-8 max-w-4xl mx-auto w-full text-center">
          {/* Subtle Ambient Gradient Glows */}
          <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-[720px] sm:w-[980px] h-[480px] bg-gradient-to-b from-sky-400/15 via-sky-300/10 to-transparent rounded-full blur-3xl pointer-events-none -z-10" />
          <div className="absolute top-12 -right-8 w-[420px] h-[420px] bg-gradient-to-bl from-blue-400/12 via-sky-300/8 to-transparent rounded-full blur-2xl pointer-events-none -z-10" />
          <div className="absolute top-20 -left-12 w-[380px] h-[380px] bg-gradient-to-tr from-cyan-400/12 via-sky-300/8 to-transparent rounded-full blur-2xl pointer-events-none -z-10" />

          <div className="space-y-6">
            
            {/* Clinical Trust Badge */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-gradient-to-r from-sky-500/15 via-blue-500/10 to-cyan-500/15 border border-sky-400/35 text-sky-900 text-[11px] font-bold tracking-wide shadow-2xs">
              <Sparkles size={13} className="text-sky-600" />
              <span>Next-Generation Orthopedic Tele-Rehabilitation</span>
            </div>

            {/* Main Headline */}
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-slate-900 tracking-tight leading-[1.15]">
              Clinical Physical Therapy,{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-sky-500 via-blue-600 to-cyan-500">
                Powered by Real-Time AI.
              </span>
            </h1>

            {/* Subtitle Description */}
            <p className="text-slate-600 text-sm sm:text-base leading-relaxed max-w-2xl mx-auto font-normal">
              VirtuHeal delivers precision hospital-grade recovery straight to your browser. Experience 60&nbsp;FPS computer vision motion tracking, doctor-prescribed exercise dosage, and unbroken continuity with your orthopedic specialist—all from home with zero wearables.
            </p>

            {/* Call To Actions */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => navigateToPortal('patient', 'signin')}
                className="w-full sm:w-auto px-6 py-3 rounded-xl bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-white font-bold text-xs sm:text-sm shadow-md shadow-sky-600/25 flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-98"
                id="hero-start-cta"
              >
                <span>Patient Portal</span>
                <ArrowRight size={15} />
              </button>

              <button
                type="button"
                onClick={() => navigateToPortal('doctor', 'signin')}
                className="w-full sm:w-auto px-5 py-3 rounded-xl bg-white/95 hover:bg-white text-slate-800 border border-sky-900/15 hover:border-sky-500/40 font-bold text-xs sm:text-sm shadow-sm flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-98"
                id="hero-doctor-cta"
              >
                <span>Doctor Workspace</span>
              </button>

              <button
                type="button"
                onClick={() => scrollToSection('about')}
                className="w-full sm:w-auto px-5 py-3 rounded-xl bg-transparent hover:bg-white/60 text-slate-600 hover:text-slate-900 font-semibold text-xs sm:text-sm transition-all cursor-pointer active:scale-98"
                id="hero-learn-cta"
              >
                <span>Learn More &darr;</span>
              </button>
            </div>

            {/* Feature Pills */}
            <div className="flex items-center justify-center gap-5 pt-2 flex-wrap text-xs text-slate-600 font-medium">
              <span className="flex items-center gap-1.5">
                <CheckCircle2 size={14} className="text-sky-600" />
                No Sensors or Wearables
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle2 size={14} className="text-sky-600" />
                HIPAA & SOC-2 Compliant
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle2 size={14} className="text-cyan-600" />
                100% In-Browser Privacy
              </span>
            </div>

          </div>
        </section>

        {/* ============================================================== */}
        {/* 3. DEDICATED DOCTOR & PATIENT ENTRY HUB (#portals / #login)     */}
        {/* ============================================================== */}
        <section 
          id="portals" 
          ref={entryHubRef}
          className="py-16 md:py-24 px-4 sm:px-8 bg-white/45 backdrop-blur-md border-y border-sky-900/10 relative"
        >
          <div className="max-w-6xl mx-auto w-full space-y-10">
            
            {/* Section Header */}
            <div className="text-center max-w-2xl mx-auto space-y-3">
              <span className="px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-sky-500/15 text-sky-800 border border-sky-500/30">
                Healthcare Access Hub
              </span>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                Select Your Role to Enter VirtuHeal
              </h2>
              <p className="text-slate-600 text-xs sm:text-sm leading-relaxed">
                Whether you are a patient working through recovery or an attending clinician supervising protocols, select your portal below to sign in or register.
              </p>

              {/* Portal Switcher Buttons */}
              <div className="flex items-center justify-center gap-2 p-1.5 bg-white/80 rounded-2xl border border-sky-900/10 max-w-md mx-auto mt-4 shadow-sm">
                <button
                  type="button"
                  onClick={() => setActivePortalRole('patient')}
                  className={`flex-1 py-2.5 px-4 rounded-xl text-xs sm:text-sm font-black transition-all flex items-center justify-center gap-2 cursor-pointer ${
                    activePortalRole === 'patient'
                      ? 'bg-gradient-to-r from-sky-500 to-blue-600 text-white shadow-lg shadow-sky-600/25'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <User size={15} />
                  <span>I am a Patient</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActivePortalRole('doctor')}
                  className={`flex-1 py-2.5 px-4 rounded-xl text-xs sm:text-sm font-black transition-all flex items-center justify-center gap-2 cursor-pointer ${
                    activePortalRole === 'doctor'
                      ? 'bg-gradient-to-r from-sky-500 to-blue-600 text-white shadow-lg shadow-sky-600/25'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Stethoscope size={15} />
                  <span>I am a Doctor</span>
                </button>
              </div>
            </div>

            {/* ROLE-ISOLATED CLINICAL ACCESS PORTALS */}
            <div className="max-w-2xl mx-auto w-full transition-all duration-300">
              
              {/* ========================================================= */}
              {/* PORTAL CARD 1: PATIENT PORTAL (Strictly for Patients)     */}
              {/* ========================================================= */}
              {activePortalRole === 'patient' && (
                <div className="relative rounded-3xl border transition-all duration-300 p-6 sm:p-8 flex flex-col shadow-2xl overflow-hidden bg-gradient-to-b from-white via-sky-50/30 to-white border-sky-500/80 ring-4 ring-sky-500/15 shadow-sky-950/10 animate-fade-in">
                {/* Subtle Ambient Glow */}
                <div className="absolute -top-16 -right-16 w-48 h-48 bg-sky-400/15 rounded-full blur-2xl pointer-events-none" />
                
                {/* Card Header */}
                <div className="flex items-center justify-between pb-4 border-b border-sky-900/10 relative z-10">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-sky-500/20 to-sky-600/10 text-sky-700 flex items-center justify-center border border-sky-500/30 shadow-2xs">
                      <User size={24} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-lg sm:text-xl font-bold text-slate-900">Patient Recovery Portal</h3>
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-sky-500/15 text-sky-800 border border-sky-500/30 shadow-2xs">
                          Recovery Suite
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">Are you a patient undergoing physical therapy?</p>
                    </div>
                  </div>
                </div>

                {/* Sub-tabs: Sign In vs Register */}
                <div className="grid grid-cols-2 gap-2 p-1 bg-sky-50/80 rounded-xl my-4 text-xs font-bold border border-sky-100">
                  <button
                    type="button"
                    onClick={() => setPatientTab('signin')}
                    className={`py-2 px-3 rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                      patientTab === 'signin'
                        ? 'bg-gradient-to-r from-sky-500 to-blue-600 text-white shadow-md'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <KeyRound size={13} />
                    <span>Patient Sign In</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setPatientTab('register')}
                    className={`py-2 px-3 rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                      patientTab === 'register'
                        ? 'bg-gradient-to-r from-sky-500 to-blue-600 text-white shadow-md'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <UserPlus size={13} />
                    <span>Register as Patient</span>
                  </button>
                </div>

                {/* TAB 1A: Patient Sign In */}
                {patientTab === 'signin' && (
                  <div className="space-y-4 pt-1">
                    {/* Top Instant 1-Click Demo Patient Button */}
                    <div className="p-3.5 rounded-2xl bg-sky-500/10 border border-sky-500/25 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-2xs">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-xl bg-sky-600 text-white font-black text-xs flex items-center justify-center shadow-xs">
                          SP
                        </div>
                        <div>
                          <div className="text-xs font-black text-slate-900">Instant Access: Shirish Poudel</div>
                          <div className="text-[11px] text-sky-800 font-medium">ACL Recovery &bull; Dr. Alex Vance</div>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => onPatientLogin(patients[0]?.id || 'p1')}
                        className="w-full sm:w-auto px-4 py-2 rounded-xl bg-gradient-to-r from-sky-500 to-blue-600 hover:brightness-105 text-white font-bold text-xs shadow-md shadow-sky-600/20 flex items-center justify-center gap-1.5 transition-all cursor-pointer active:scale-95"
                      >
                        <span>Launch Patient Portal</span>
                        <ArrowRight size={13} />
                      </button>
                    </div>

                    <div className="flex items-center gap-2 text-slate-400">
                      <div className="h-px bg-slate-200 flex-1" />
                      <span className="text-[10px] font-bold uppercase tracking-wider">or sign in with custom id</span>
                      <div className="h-px bg-slate-200 flex-1" />
                    </div>

                    <form onSubmit={handlePatientSignInSubmit} className="space-y-4">
                    {patLoginError && (
                      <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs">
                        {patLoginError}
                      </div>
                    )}

                    <div>
                      <label className="text-xs font-bold text-slate-700 block mb-1.5">
                        Medical ID or Full Legal Name:
                      </label>
                      <input
                        type="text"
                        value={patLoginId}
                        onChange={(e) => setPatLoginId(e.target.value)}
                        placeholder="e.g. Shirish Poudel or p1"
                        className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20"
                      />
                    </div>

                    <div>
                      <div className="flex justify-between items-center mb-1.5">
                        <label className="text-xs font-bold text-slate-700">
                          Patient Password or PIN Code:
                        </label>
                        <span className="text-[10px] text-sky-700 font-mono font-bold">Demo: 1234</span>
                      </div>
                      <input
                        type="password"
                        value={patLoginPin}
                        onChange={(e) => setPatLoginPin(e.target.value)}
                        placeholder="Enter 4-digit PIN (default 1234)"
                        className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 font-mono tracking-widest"
                      />
                    </div>

                    <button
                      type="submit"
                      className="w-full py-3 rounded-xl bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-white font-black text-xs shadow-lg shadow-sky-600/25 transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-98"
                    >
                      <span>Sign In to Patient Portal</span>
                      <ArrowRight size={14} />
                    </button>

                    {/* 1-Click Patient Demo Access */}
                    <div className="pt-2 border-t border-sky-900/10">
                      <span className="text-[11px] text-slate-500 block mb-2 font-semibold">
                        Or 1-Click Fast Patient Access:
                      </span>
                      <button
                        type="button"
                        onClick={() => onPatientLogin('p1')}
                        className="w-full py-2.5 px-3 rounded-xl bg-sky-50/60 hover:bg-sky-50 border border-sky-200/80 text-left flex items-center justify-between text-xs transition-colors cursor-pointer"
                      >
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-lg bg-sky-600 text-white flex items-center justify-center font-bold text-xs shadow-2xs">
                            SP
                          </div>
                          <div>
                            <div className="font-bold text-slate-900">Shirish Poudel (Demo Patient)</div>
                            <div className="text-[10px] text-slate-500">ACL Reconstruction • Dr. Alex Vance</div>
                          </div>
                        </div>
                        <span className="text-[10px] text-sky-700 font-bold">Access &rarr;</span>
                      </button>
                    </div>
                  </form>
                </div>
              )}

                {/* TAB 1B: Patient Register */}
                {patientTab === 'register' && (
                  <form onSubmit={handleRegisterPatientSubmit} className="space-y-3 pt-1">
                    {patError && (
                      <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs">
                        {patError}
                      </div>
                    )}

                    <div className="grid grid-cols-3 gap-2">
                      <div className="col-span-2">
                        <label className="text-[11px] font-bold text-slate-700 block mb-1">Full Legal Name</label>
                        <input
                          type="text"
                          value={patName}
                          onChange={(e) => setPatName(e.target.value)}
                          placeholder="e.g. John Doe"
                          className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20"
                          required
                        />
                      </div>
                      <div>
                        <label className="text-[11px] font-bold text-slate-700 block mb-1">Age</label>
                        <input
                          type="number"
                          value={patAge}
                          onChange={(e) => setPatAge(e.target.value)}
                          className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-[11px] font-bold text-slate-700 block mb-1">Physical Condition / Surgery</label>
                      <input
                        type="text"
                        value={patCondition}
                        onChange={(e) => setPatCondition(e.target.value)}
                        placeholder="e.g. Post-Op Knee Arthroscopy or Shoulder Impingement"
                        className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20"
                        required
                      />
                    </div>

                    <div>
                      <label className="text-[11px] font-bold text-slate-700 block mb-1">Select Attending Physical Therapist</label>
                      <select
                        value={patDoctor}
                        onChange={(e) => setPatDoctor(e.target.value)}
                        className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20"
                      >
                        {verifiedDoctors.map(doc => (
                          <option key={doc.id} value={doc.name}>{doc.name} — {doc.title}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <div className="flex justify-between items-center text-[11px] mb-1">
                        <span className="font-bold text-slate-700">Initial Pain Score (VAS):</span>
                        <span className="text-amber-600 font-bold">{patPain} / 10</span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="10"
                        value={patPain}
                        onChange={(e) => setPatPain(Number(e.target.value))}
                        className="w-full accent-sky-600 cursor-pointer h-1.5 bg-slate-200 rounded-lg"
                      />
                    </div>

                    {/* Sample Report Loader */}
                    <div className="flex items-center justify-between text-[11px] pt-1">
                      <span className="text-slate-500">Medical Report Upload:</span>
                      <button
                        type="button"
                        onClick={loadSamplePatientReport}
                        className="text-sky-700 hover:text-sky-800 underline font-bold cursor-pointer"
                      >
                        Load Sample Hospital Discharge PDF
                      </button>
                    </div>

                    <button
                      type="submit"
                      disabled={isPatSubmitting}
                      className="w-full py-3 rounded-xl bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-white font-black text-xs shadow-lg shadow-sky-600/25 transition-all flex items-center justify-center gap-2 cursor-pointer mt-2"
                    >
                      <span>{isPatSubmitting ? 'Registering...' : 'Complete Patient Registration & Start Recovery'}</span>
                      <ArrowRight size={14} />
                    </button>
                  </form>
                )}

                </div>
              )}

              {/* ========================================================= */}
              {/* PORTAL CARD 2: DOCTOR / CLINICIAN WORKSPACE (Strictly for Clinicians) */}
              {/* ========================================================= */}
              {activePortalRole === 'doctor' && (
                <div className="relative rounded-3xl border transition-all duration-300 p-6 sm:p-8 flex flex-col shadow-2xl overflow-hidden bg-gradient-to-b from-white via-blue-50/30 to-white border-blue-600/80 ring-4 ring-blue-600/15 shadow-blue-950/10 animate-fade-in">
                {/* Subtle Ambient Glow */}
                <div className="absolute -top-16 -right-16 w-48 h-48 bg-blue-500/15 rounded-full blur-2xl pointer-events-none" />
                
                {/* Card Header */}
                <div className="flex items-center justify-between pb-4 border-b border-sky-900/10 relative z-10">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-600/20 to-indigo-600/10 text-blue-700 flex items-center justify-center border border-blue-600/30 shadow-2xs">
                      <Stethoscope size={24} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-lg sm:text-xl font-bold text-slate-900">Doctor & Clinician Portal</h3>
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-blue-50 text-blue-800 border border-blue-200 shadow-2xs">
                          Physician Workspace
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">Are you an attending doctor or physical therapist?</p>
                    </div>
                  </div>
                </div>

                {/* Sub-tabs: Doctor Sign In vs Register */}
                <div className="grid grid-cols-2 gap-2 p-1 bg-sky-50/80 rounded-xl my-4 text-xs font-bold border border-sky-100">
                  <button
                    type="button"
                    onClick={() => setDoctorTab('signin')}
                    className={`py-2 px-3 rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                      doctorTab === 'signin'
                        ? 'bg-gradient-to-r from-sky-500 to-blue-600 text-white shadow-md'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <Lock size={13} />
                    <span>Clinician Sign In</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setDoctorTab('register')}
                    className={`py-2 px-3 rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                      doctorTab === 'register'
                        ? 'bg-gradient-to-r from-sky-500 to-blue-600 text-white shadow-md'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <ShieldCheck size={13} />
                    <span>Register as Doctor</span>
                  </button>
                </div>

                {/* TAB 2A: Doctor Sign In */}
                {doctorTab === 'signin' && (
                  <div className="space-y-4 pt-1">
                    {/* Top Instant 1-Click Demo Doctor Button */}
                    <div className="p-3.5 rounded-2xl bg-sky-500/10 border border-sky-500/25 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-2xs">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-xl bg-sky-700 text-white font-black text-xs flex items-center justify-center shadow-xs">
                          AV
                        </div>
                        <div>
                          <div className="text-xs font-black text-slate-900">Instant Access: Dr. Alex Vance, PT, DPT, PhD</div>
                          <div className="text-[11px] text-sky-800 font-medium">Attending Physical Therapist &bull; Orthopedics</div>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => onDoctorLogin(verifiedDoctors[0])}
                        className="w-full sm:w-auto px-4 py-2 rounded-xl bg-gradient-to-r from-blue-700 to-blue-700 hover:brightness-105 text-white font-bold text-xs shadow-md shadow-sky-700/20 flex items-center justify-center gap-1.5 transition-all cursor-pointer active:scale-95"
                      >
                        <span>Launch Doctor Dashboard</span>
                        <ArrowRight size={13} />
                      </button>
                    </div>

                    <div className="flex items-center gap-2 text-slate-400">
                      <div className="h-px bg-slate-200 flex-1" />
                      <span className="text-[10px] font-bold uppercase tracking-wider">or authenticate with PIN</span>
                      <div className="h-px bg-slate-200 flex-1" />
                    </div>

                    <form onSubmit={handleDoctorSignInSubmit} className="space-y-4">
                    {doctorError && (
                      <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs">
                        {doctorError}
                      </div>
                    )}

                    <div>
                      <label className="text-xs font-bold text-slate-700 block mb-1.5">
                        Select Verified Doctor Profile:
                      </label>
                      <select
                        value={selectedDoctorId}
                        onChange={(e) => setSelectedDoctorId(e.target.value)}
                        className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20"
                      >
                        {verifiedDoctors.map(doc => (
                          <option key={doc.id} value={doc.id}>
                            {doc.name} — {doc.clinic}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <div className="flex justify-between items-center mb-1.5">
                        <label className="text-xs font-bold text-slate-700">
                          Doctor Security PIN Code:
                        </label>
                        <span className="text-[10px] text-sky-700 font-mono font-bold">Default Demo: 1234</span>
                      </div>
                      <input
                        type="password"
                        value={doctorPin}
                        onChange={(e) => setDoctorPin(e.target.value)}
                        placeholder="Enter 4-digit PIN (1234)"
                        className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 font-mono tracking-widest"
                      />
                    </div>

                    <button
                      type="submit"
                      className="w-full py-3 rounded-xl bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-white font-black text-xs shadow-lg shadow-sky-600/25 transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-98"
                    >
                      <span>Authenticate Clinician Session</span>
                      <ArrowRight size={14} />
                    </button>

                    {/* Quick Clinician Profile Shortcuts */}
                    <div className="pt-2 border-t border-sky-900/10 space-y-2">
                      <span className="text-[11px] text-slate-500 block font-semibold">
                        1-Click Verified Clinician Access:
                      </span>
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={() => onDoctorLogin(verifiedDoctors[0], 'patients')}
                          className="p-2.5 rounded-xl bg-sky-50/60 hover:bg-sky-50 border border-sky-200/80 text-left transition-colors cursor-pointer"
                        >
                          <div className="font-bold text-xs text-slate-900 truncate">Dr. Alex Vance</div>
                          <div className="text-[10px] text-sky-700 font-semibold truncate">PT, DPT, PhD • Sports Med</div>
                        </button>
                        <button
                          type="button"
                          onClick={() => onDoctorLogin(verifiedDoctors[1] || verifiedDoctors[0], 'patients')}
                          className="p-2.5 rounded-xl bg-sky-50/60 hover:bg-sky-50 border border-sky-200/80 text-left transition-colors cursor-pointer"
                        >
                          <div className="font-bold text-xs text-slate-900 truncate">Dr. Sarah Lin</div>
                          <div className="text-[10px] text-sky-700 font-semibold truncate">MD • Orthopedic Surgery</div>
                        </button>
                      </div>
                    </div>
                  </form>
                </div>
              )}

                {/* TAB 2B: Doctor Register */}
                {doctorTab === 'register' && (
                  <form onSubmit={handleDoctorRegisterSubmit} className="space-y-3 pt-1">
                    {docRegError && (
                      <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs">
                        {docRegError}
                      </div>
                    )}

                    <div>
                      <label className="text-[11px] font-bold text-slate-700 block mb-1">Full Name & Degrees</label>
                      <input
                        type="text"
                        value={docName}
                        onChange={(e) => setDocName(e.target.value)}
                        placeholder="e.g. Dr. Robert Miller, PT, DPT, OCS"
                        className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20"
                        required
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-[11px] font-bold text-slate-700 block mb-1">Medical Specialty</label>
                        <input
                          type="text"
                          value={docSpecialty}
                          onChange={(e) => setDocSpecialty(e.target.value)}
                          className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20"
                        />
                      </div>
                      <div>
                        <label className="text-[11px] font-bold text-slate-700 block mb-1">Medical License / NPI</label>
                        <input
                          type="text"
                          value={docLicense}
                          onChange={(e) => setDocLicense(e.target.value)}
                          className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-[11px] font-bold text-slate-700 block mb-1">Hospital / Clinic Facility</label>
                      <input
                        type="text"
                        value={docClinic}
                        onChange={(e) => setDocClinic(e.target.value)}
                        className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20"
                        required
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-[11px] font-bold text-slate-700 block mb-1">Clinical Department</label>
                        <input
                          type="text"
                          value={docDepartment}
                          onChange={(e) => setDocDepartment(e.target.value)}
                          className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20"
                        />
                      </div>
                      <div>
                        <label className="text-[11px] font-bold text-slate-700 block mb-1">4-Digit Clinician PIN</label>
                        <input
                          type="password"
                          maxLength={6}
                          value={docPin}
                          onChange={(e) => setDocPin(e.target.value)}
                          placeholder="1234"
                          className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-sky-500 font-mono tracking-widest focus:ring-2 focus:ring-sky-500/20"
                        />
                      </div>
                    </div>

                    <button
                      type="submit"
                      className="w-full py-3 rounded-xl bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-white font-black text-xs shadow-lg shadow-sky-600/25 transition-all flex items-center justify-center gap-2 cursor-pointer mt-2"
                    >
                      <span>Register Clinician Credentials & Open Workspace</span>
                      <ArrowRight size={14} />
                    </button>
                  </form>
                )}

              </div>
            )}

          </div>

        </div>
        </section>

        {/* ============================================================== */}
        {/* 4. ABOUT US SECTION (#about)                                   */}
        {/* ============================================================== */}
        <section id="about" className="section-optimized py-20 px-4 sm:px-8 max-w-7xl mx-auto w-full">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            
            <div className="lg:col-span-6 space-y-5">
              <span className="px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-sky-500/15 text-sky-800 border border-sky-500/30">
                About VirtuHeal
              </span>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                Bridging the Critical Gap in Post-Operative Recovery
              </h2>
              <p className="text-slate-600 text-xs sm:text-sm leading-relaxed">
                Every year, millions of orthopedic and joint recovery patients face the <strong>"discharge cliff"</strong>—leaving the hospital with a paper exercise sheet and losing contact with their physical therapists until their next clinic visit. Studies show that over <strong>70% of home therapy patients drop out or perform exercises incorrectly</strong>, increasing re-injury risk and slowing recovery.
              </p>
              <p className="text-slate-500 text-xs sm:text-sm leading-relaxed">
                VirtuHeal was engineered by biomechanical researchers and physical medicine clinicians to solve this exact problem. By bringing sub-millimeter computer vision directly into the user’s web browser, patients receive real-time goniometric guidance, while attending doctors monitor clinical telemetry, range-of-motion velocity, and adherence in real-time.
              </p>

              {/* Metric Highlights */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-3">
                <div className="p-3.5 bg-gradient-to-br from-sky-50/90 via-white to-sky-50/40 rounded-2xl border border-sky-200/80 shadow-xs hover:border-sky-400/80 hover:shadow-md transition-all">
                  <div className="text-xl sm:text-2xl font-extrabold text-sky-800 tracking-tight">94.2%</div>
                  <div className="text-[11px] text-slate-600 font-bold mt-0.5">Protocol Adherence Rate</div>
                </div>
                <div className="p-3.5 bg-gradient-to-br from-blue-50/90 via-white to-blue-50/40 rounded-2xl border border-blue-200/80 shadow-xs hover:border-blue-400/80 hover:shadow-md transition-all">
                  <div className="text-xl sm:text-2xl font-extrabold text-blue-800 tracking-tight">3.4x</div>
                  <div className="text-[11px] text-slate-600 font-bold mt-0.5">Faster ROM Velocity</div>
                </div>
                <div className="p-3.5 bg-gradient-to-br from-cyan-50/90 via-white to-cyan-50/40 rounded-2xl border border-cyan-200/80 shadow-xs hover:border-cyan-400/80 hover:shadow-md transition-all col-span-2 sm:col-span-1">
                  <div className="text-xl sm:text-2xl font-extrabold text-cyan-800 tracking-tight">33 Points</div>
                  <div className="text-[11px] text-slate-600 font-bold mt-0.5">Sub-Pixel Pose Joints</div>
                </div>
              </div>
            </div>

            <div className="lg:col-span-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-5 rounded-3xl bg-white/85 backdrop-blur-xl border border-sky-200/70 shadow-md space-y-2.5 hover:border-sky-400 hover:shadow-lg hover:-translate-y-0.5 transition-all group">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-sky-500/20 to-sky-600/10 text-sky-700 flex items-center justify-center border border-sky-400/30 shadow-2xs group-hover:scale-105 transition-transform">
                  <Camera size={18} />
                </div>
                <h3 className="text-sm sm:text-base font-bold text-slate-900 group-hover:text-sky-800 transition-colors">Browser-Native Vision</h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Runs directly on edge devices with WebAssembly. No app installs, no external sensors, and zero video frames sent to servers.
                </p>
              </div>

              <div className="p-5 rounded-3xl bg-white/85 backdrop-blur-xl border border-blue-200/70 shadow-md space-y-2.5 hover:border-blue-400 hover:shadow-lg hover:-translate-y-0.5 transition-all group">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600/20 to-indigo-600/10 text-blue-700 flex items-center justify-center border border-blue-400/30 shadow-2xs group-hover:scale-105 transition-transform">
                  <Stethoscope size={18} />
                </div>
                <h3 className="text-sm sm:text-base font-bold text-slate-900 group-hover:text-blue-800 transition-colors">Clinician-Supervised</h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Doctors prescribe targeted sets, reps, and range-of-motion ceilings based on surgical discharge summaries.
                </p>
              </div>

              <div className="p-5 rounded-3xl bg-white/85 backdrop-blur-xl border border-indigo-200/70 shadow-md space-y-2.5 hover:border-indigo-400 hover:shadow-lg hover:-translate-y-0.5 transition-all group">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500/20 to-sky-600/10 text-indigo-700 flex items-center justify-center border border-indigo-400/30 shadow-2xs group-hover:scale-105 transition-transform">
                  <Activity size={18} />
                </div>
                <h3 className="text-sm sm:text-base font-bold text-slate-900 group-hover:text-indigo-800 transition-colors">Instant Harmonic Feedback</h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Ascending Web Audio synthesizers and warm voice coaches cheer patient milestones and guide correct alignment.
                </p>
              </div>

              <div className="p-5 rounded-3xl bg-white/85 backdrop-blur-xl border border-cyan-200/70 shadow-md space-y-2.5 hover:border-cyan-400 hover:shadow-lg hover:-translate-y-0.5 transition-all group">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500/20 to-sky-500/10 text-cyan-700 flex items-center justify-center border border-cyan-400/30 shadow-2xs group-hover:scale-105 transition-transform">
                  <ShieldCheck size={18} />
                </div>
                <h3 className="text-sm sm:text-base font-bold text-slate-900 group-hover:text-cyan-800 transition-colors">Hospital Data Security</h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Built to HIPAA standards with encrypted end-to-end messaging, surgical PDF intake, and audit-ready recovery logs.
                </p>
              </div>
            </div>

          </div>
        </section>

        {/* ============================================================== */}
        {/* 5. OUR MISSION SECTION (#mission)                              */}
        {/* ============================================================== */}
        <section id="mission" className="section-optimized py-20 px-4 sm:px-8 bg-white/40 backdrop-blur-md border-t border-sky-900/10 relative">
          <div className="max-w-6xl mx-auto w-full space-y-12">
            
            <div className="text-center max-w-3xl mx-auto space-y-3">
              <span className="px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-sky-500/15 text-sky-800 border border-sky-500/30">
                Our Mission & Vision
              </span>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                Democratizing Accessible, Clinical-Grade Physical Therapy
              </h2>
              <p className="text-slate-600 text-xs sm:text-sm leading-relaxed">
                We believe high-quality rehabilitation is a human right, not a luxury dictated by geographical proximity or expensive clinic equipment.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              
              <div className="p-5 rounded-3xl bg-white/85 backdrop-blur-xl border border-sky-200/70 shadow-md space-y-2.5 relative group hover:border-sky-400 hover:shadow-xl hover:-translate-y-1 transition-all">
                <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-sky-500 to-blue-600 text-white flex items-center justify-center font-bold text-base shadow-md shadow-sky-500/25 group-hover:scale-105 transition-transform">
                  01
                </div>
                <h3 className="text-sm sm:text-base font-bold text-slate-900 group-hover:text-sky-800 transition-colors">Eliminate Cost & Equipment Barriers</h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  By turning standard webcams into 3D biomechanical labs, we remove the financial burden of specialized wearable hardware.
                </p>
              </div>

              <div className="p-5 rounded-3xl bg-white/85 backdrop-blur-xl border border-blue-200/70 shadow-md space-y-2.5 relative group hover:border-blue-400 hover:shadow-xl hover:-translate-y-1 transition-all">
                <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center font-bold text-base shadow-md shadow-blue-500/25 group-hover:scale-105 transition-transform">
                  02
                </div>
                <h3 className="text-sm sm:text-base font-bold text-slate-900 group-hover:text-blue-800 transition-colors">Ensure True Biomechanical Form</h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Small twitches or incorrect kinematics do not count. We enforce true joint amplitude so patients recover safely and efficiently.
                </p>
              </div>

              <div className="p-5 rounded-3xl bg-white/85 backdrop-blur-xl border border-cyan-200/70 shadow-md space-y-2.5 relative group hover:border-cyan-400 hover:shadow-xl hover:-translate-y-1 transition-all">
                <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-cyan-500 to-blue-500 text-white flex items-center justify-center font-bold text-base shadow-md shadow-cyan-500/25 group-hover:scale-105 transition-transform">
                  03
                </div>
                <h3 className="text-sm sm:text-base font-bold text-slate-900 group-hover:text-cyan-800 transition-colors">Maintain the Human Doctor Connection</h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  AI assists and guides—it never replaces the clinician. We strengthen the doctor-patient relationship with continuous telemetry.
                </p>
              </div>

              <div className="p-5 rounded-3xl bg-white/85 backdrop-blur-xl border border-sky-200/70 shadow-md space-y-2.5 relative group hover:border-sky-400 hover:shadow-xl hover:-translate-y-1 transition-all">
                <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-sky-600 to-cyan-600 text-white flex items-center justify-center font-bold text-base shadow-md shadow-sky-500/25 group-hover:scale-105 transition-transform">
                  04
                </div>
                <h3 className="text-sm sm:text-base font-bold text-slate-900 group-hover:text-sky-800 transition-colors">Accelerate Clinical Evidence</h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Generating longitudinal recovery curves and joint ROM milestones to advance the global standard of sports and orthopedic medicine.
                </p>
              </div>

            </div>

          </div>
        </section>

        {/* ============================================================== */}
        {/* 6. OUR ACTIVITIES & INITIATIVES SECTION (#activities)          */}
        {/* ============================================================== */}
        <section id="activities" className="section-optimized py-20 px-4 sm:px-8 max-w-7xl mx-auto w-full">
          <div className="space-y-12">
            
            <div className="text-center max-w-3xl mx-auto space-y-3">
              <span className="px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-sky-500/15 text-sky-800 border border-sky-500/30">
                Our Ongoing Work
              </span>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                Clinical Activities, Services & Initiatives
              </h2>
              <p className="text-slate-600 text-xs sm:text-sm leading-relaxed">
                Explore how VirtuHeal is actively transforming physical therapy across specialized orthopedic disciplines.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              
              {/* Activity 1: Upper Extremity & Shoulder Press */}
              <div className="p-6 rounded-3xl bg-gradient-to-br from-white via-sky-50/30 to-white backdrop-blur-xl border border-sky-200/70 shadow-md hover:border-sky-400 hover:shadow-xl hover:-translate-y-1 transition-all space-y-4 flex flex-col justify-between group">
                <div className="space-y-3">
                  <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-sky-500/20 to-sky-600/10 text-sky-700 flex items-center justify-center border border-sky-400/30 shadow-2xs group-hover:scale-105 transition-transform">
                    <Play size={20} className="fill-sky-700" />
                  </div>
                  <h3 className="text-base font-bold text-slate-900 group-hover:text-sky-800 transition-colors">Full Upper Body & Gym Standard Press</h3>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    Precision calibration for overhead dumbbell press (90° ear baseline &rarr; lockout &rarr; 90° return), rotator cuff external rotations, and Codman pendulum swings.
                  </p>
                </div>
                <div className="pt-3 border-t border-sky-200/60 flex items-center justify-between text-xs text-sky-800 font-bold">
                  <span className="bg-sky-50 px-2 py-0.5 rounded-md border border-sky-200 text-[11px]">Active Kinematics</span>
                  <span className="group-hover:translate-x-1 transition-transform text-xs">3 Validated Protocols &rarr;</span>
                </div>
              </div>

              {/* Activity 2: Post-Op Knee & ACL Rehabilitation */}
              <div className="p-6 rounded-3xl bg-gradient-to-br from-white via-blue-50/30 to-white backdrop-blur-xl border border-blue-200/70 shadow-md hover:border-blue-400 hover:shadow-xl hover:-translate-y-1 transition-all space-y-4 flex flex-col justify-between group">
                <div className="space-y-3">
                  <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-blue-600/20 to-indigo-600/10 text-blue-700 flex items-center justify-center border border-blue-400/30 shadow-2xs group-hover:scale-105 transition-transform">
                    <Activity size={20} />
                  </div>
                  <h3 className="text-base font-bold text-slate-900 group-hover:text-blue-800 transition-colors">Knee & ACL Reconstruction Protocols</h3>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    Real-time tracking of supine heel slides, seated long-arc knee extensions, straight leg raises, and isometric quad sets with hold timers.
                  </p>
                </div>
                <div className="pt-3 border-t border-blue-200/60 flex items-center justify-between text-xs text-blue-800 font-bold">
                  <span className="bg-blue-50 px-2 py-0.5 rounded-md border border-blue-200 text-[11px]">Post-Surgical ROM</span>
                  <span className="group-hover:translate-x-1 transition-transform text-xs">4 Validated Protocols &rarr;</span>
                </div>
              </div>

              {/* Activity 3: Hand & Finger Biomechanics */}
              <div className="p-6 rounded-3xl bg-gradient-to-br from-white via-cyan-50/30 to-white backdrop-blur-xl border border-cyan-200/70 shadow-md hover:border-cyan-400 hover:shadow-xl hover:-translate-y-1 transition-all space-y-4 flex flex-col justify-between group">
                <div className="space-y-3">
                  <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-cyan-500/20 to-sky-500/10 text-cyan-700 flex items-center justify-center border border-cyan-400/30 shadow-2xs group-hover:scale-105 transition-transform">
                    <Layers size={20} />
                  </div>
                  <h3 className="text-base font-bold text-slate-900 group-hover:text-cyan-800 transition-colors">21-Joint Digital Hand Dexterity</h3>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    Fine motor hand evaluation tracking 5-finger alignment, wide vs close grip span, precision pinches, and stroke recovery postures.
                  </p>
                </div>
                <div className="pt-3 border-t border-cyan-200/60 flex items-center justify-between text-xs text-cyan-800 font-bold">
                  <span className="bg-cyan-50 px-2 py-0.5 rounded-md border border-cyan-200 text-[11px]">Neuromuscular Rehab</span>
                  <span className="group-hover:translate-x-1 transition-transform text-xs">6 Grip Profiles &rarr;</span>
                </div>
              </div>

              {/* Activity 4: Closed-Loop Clinician Telehealth */}
              <div className="p-6 rounded-3xl bg-gradient-to-br from-white via-indigo-50/30 to-white backdrop-blur-xl border border-indigo-200/70 shadow-md hover:border-indigo-400 hover:shadow-xl hover:-translate-y-1 transition-all space-y-4 flex flex-col justify-between group">
                <div className="space-y-3">
                  <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-indigo-500/20 to-sky-600/10 text-indigo-700 flex items-center justify-center border border-indigo-400/30 shadow-2xs group-hover:scale-105 transition-transform">
                    <Stethoscope size={20} />
                  </div>
                  <h3 className="text-base font-bold text-slate-900 group-hover:text-indigo-800 transition-colors">Bidirectional Tele-Rehab Messaging</h3>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    Encrypted doctor-patient messaging, surgical discharge summary PDF reviews, and immediate routine adjustment directly inside the workspace.
                  </p>
                </div>
                <div className="pt-3 border-t border-indigo-200/60 flex items-center justify-between text-xs text-indigo-800 font-bold">
                  <span className="bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-200 text-[11px]">Clinical Telehealth</span>
                  <span className="group-hover:translate-x-1 transition-transform text-xs">Active 24/7 &rarr;</span>
                </div>
              </div>

              {/* Activity 5: Longitudinal Recovery Analytics */}
              <div className="p-6 rounded-3xl bg-gradient-to-br from-white via-sky-50/40 to-white backdrop-blur-xl border border-sky-200/70 shadow-md hover:border-sky-400 hover:shadow-xl hover:-translate-y-1 transition-all space-y-4 flex flex-col justify-between group">
                <div className="space-y-3">
                  <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-amber-500/20 to-sky-600/10 text-amber-700 flex items-center justify-center border border-amber-400/30 shadow-2xs group-hover:scale-105 transition-transform">
                    <Award size={20} />
                  </div>
                  <h3 className="text-base font-bold text-slate-900 group-hover:text-sky-800 transition-colors">Adherence Scoring & Milestones</h3>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    Automatic compliance calculation, consistency streak badges, and multi-phase recovery timelines that keep patients motivated.
                  </p>
                </div>
                <div className="pt-3 border-t border-sky-200/60 flex items-center justify-between text-xs text-sky-800 font-bold">
                  <span className="bg-amber-50 text-amber-800 px-2 py-0.5 rounded-md border border-amber-200 text-[11px]">Outcome Telemetry</span>
                  <span className="group-hover:translate-x-1 transition-transform text-xs">Automated Scoring &rarr;</span>
                </div>
              </div>

              {/* Activity 6: Academic & Clinical Partnerships */}
              <div className="p-6 rounded-3xl bg-gradient-to-br from-white via-cyan-50/40 to-white backdrop-blur-xl border border-cyan-200/70 shadow-md hover:border-cyan-400 hover:shadow-xl hover:-translate-y-1 transition-all space-y-4 flex flex-col justify-between group">
                <div className="space-y-3">
                  <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-cyan-600/20 to-blue-600/10 text-cyan-800 flex items-center justify-center border border-cyan-400/30 shadow-2xs group-hover:scale-105 transition-transform">
                    <Globe size={20} />
                  </div>
                  <h3 className="text-base font-bold text-slate-900 group-hover:text-cyan-900 transition-colors">Clinical Research & Trials</h3>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    Partnering with orthopedic surgeons, athletic departments, and medical schools to validate edge computer vision in tele-rehabilitation.
                  </p>
                </div>
                <div className="pt-3 border-t border-cyan-200/60 flex items-center justify-between text-xs text-cyan-900 font-bold">
                  <span className="bg-cyan-50 px-2 py-0.5 rounded-md border border-cyan-200 text-[11px]">Evidence-Based</span>
                  <span className="group-hover:translate-x-1 transition-transform text-xs">Active Trials &rarr;</span>
                </div>
              </div>

            </div>

          </div>
        </section>

        {/* ============================================================== */}
        {/* 7. CONTACT SECTION (#contact)                                  */}
        {/* ============================================================== */}
        <section id="contact" className="section-optimized py-20 px-4 sm:px-8 bg-white/40 backdrop-blur-md border-t border-sky-900/10 relative">
          <div className="max-w-6xl mx-auto w-full space-y-12">
            
            <div className="text-center max-w-2xl mx-auto space-y-3">
              <span className="px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-sky-500/15 text-sky-800 border border-sky-500/30">
                Get In Touch
              </span>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                Connect with Our Clinical Team
              </h2>
              <p className="text-slate-600 text-xs sm:text-sm leading-relaxed">
                Have questions regarding physical therapy enrollment, clinic integration, or hospital partnerships? Reach out below.
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
              
              {/* Contact Details & Info */}
              <div className="lg:col-span-5 space-y-6">
                
                <div className="p-5 rounded-2xl bg-white/85 backdrop-blur-xl border border-sky-900/10 shadow-sm flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-sky-500/15 text-sky-700 flex items-center justify-center shrink-0">
                    <Mail size={18} />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">Clinical & Partner Inquiries</h3>
                    <p className="text-xs text-slate-600 mt-0.5">clinical-partners@virtuheal.med</p>
                    <p className="text-[11px] text-slate-400 mt-1">Average response time: &lt; 2 hours</p>
                  </div>
                </div>

                <div className="p-5 rounded-2xl bg-white/85 backdrop-blur-xl border border-sky-900/10 shadow-sm flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-sky-500/15 text-sky-700 flex items-center justify-center shrink-0">
                    <Phone size={18} />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">Patient Support Hotline</h3>
                    <p className="text-xs text-slate-600 mt-0.5">+1 (800) 847-8843 (VIRTU-HEAL)</p>
                    <p className="text-[11px] text-slate-400 mt-1">Mon - Fri: 8:00 AM - 8:00 PM EST</p>
                  </div>
                </div>

                <div className="p-5 rounded-2xl bg-white/85 backdrop-blur-xl border border-sky-900/10 shadow-sm flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-cyan-500/15 text-cyan-700 flex items-center justify-center shrink-0">
                    <MapPin size={18} />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">Clinical Innovation Center</h3>
                    <p className="text-xs text-slate-600 mt-0.5">450 Lexington Avenue, Suite 1800</p>
                    <p className="text-[11px] text-slate-400 mt-1">New York, NY 10017, USA</p>
                  </div>
                </div>

              </div>

              {/* Interactive Contact Form */}
              <div className="lg:col-span-7 bg-white/90 backdrop-blur-xl rounded-3xl border border-sky-900/10 p-6 sm:p-8 shadow-xl">
                {contactSubmitted ? (
                  <div className="py-12 text-center space-y-3">
                    <div className="w-14 h-14 rounded-2xl bg-sky-500/20 text-sky-700 flex items-center justify-center mx-auto border border-sky-500/30">
                      <CheckCircle2 size={28} />
                    </div>
                    <h3 className="text-xl font-black text-slate-900">Message Delivered</h3>
                    <p className="text-slate-600 text-xs max-w-sm mx-auto leading-relaxed">
                      Thank you for contacting VirtuHeal. Your inquiry has been routed to our attending physical medicine team. We will respond shortly.
                    </p>
                  </div>
                ) : (
                  <form onSubmit={handleContactSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="text-xs font-bold text-slate-700 block mb-1.5">Your Full Name</label>
                        <input
                          type="text"
                          value={contactName}
                          onChange={(e) => setContactName(e.target.value)}
                          placeholder="e.g. Dr. Emily Thorne"
                          className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20"
                          required
                        />
                      </div>
                      <div>
                        <label className="text-xs font-bold text-slate-700 block mb-1.5">Your Email Address</label>
                        <input
                          type="email"
                          value={contactEmail}
                          onChange={(e) => setContactEmail(e.target.value)}
                          placeholder="e.g. emily@hospital.org"
                          className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20"
                          required
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-xs font-bold text-slate-700 block mb-1.5">I am reaching out as a:</label>
                      <select
                        value={contactRole}
                        onChange={(e) => setContactRole(e.target.value)}
                        className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20"
                      >
                        <option value="patient">Patient Seeking Rehabilitation</option>
                        <option value="doctor">Physical Therapist / Physician</option>
                        <option value="clinic">Hospital / Clinical Director</option>
                        <option value="research">Academic / Research Partner</option>
                        <option value="other">General Inquiry</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-xs font-bold text-slate-700 block mb-1.5">Your Message</label>
                      <textarea
                        rows={4}
                        value={contactMessage}
                        onChange={(e) => setContactMessage(e.target.value)}
                        placeholder="How can VirtuHeal assist your rehabilitation or clinical workflow?"
                        className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 resize-none"
                        required
                      />
                    </div>

                    <button
                      type="submit"
                      className="w-full py-3 rounded-xl bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-white font-black text-xs shadow-lg shadow-sky-600/25 transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-98"
                    >
                      <Send size={14} />
                      <span>Send Message to Clinical Team</span>
                    </button>
                  </form>
                )}
              </div>

            </div>

          </div>
        </section>

        {/* ============================================================== */}
        {/* 8. FOOTER                                                      */}
        {/* ============================================================== */}
        <footer className="px-6 py-10 bg-[#faf8f2]/90 backdrop-blur-xl border-t border-sky-900/10 text-slate-600 text-xs">
          <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
            
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-sky-500 to-blue-600 text-white flex items-center justify-center shadow-xs">
                <ActivitySquare size={18} />
              </div>
              <div>
                <span className="font-black text-slate-900">VirtuHeal Clinical Telerehabilitation</span>
                <p className="text-[11px] text-slate-500">HIPAA Compliant &bull; FDA Digital Health Decision Support Guidelines</p>
              </div>
            </div>

            <div className="flex items-center gap-6 text-xs font-semibold">
              <button type="button" onClick={() => scrollToSection('hero')} className="hover:text-slate-900 transition-colors cursor-pointer">Home</button>
              <button type="button" onClick={() => scrollToSection('about')} className="hover:text-slate-900 transition-colors cursor-pointer">About</button>
              <button type="button" onClick={() => scrollToSection('mission')} className="hover:text-slate-900 transition-colors cursor-pointer">Mission</button>
              <button type="button" onClick={() => scrollToSection('activities')} className="hover:text-slate-900 transition-colors cursor-pointer">Activities</button>
              <button type="button" onClick={() => scrollToSection('contact')} className="hover:text-slate-900 transition-colors cursor-pointer">Contact</button>
              <button type="button" onClick={() => scrollToSection('portals')} className="text-sky-700 hover:text-sky-800 font-bold cursor-pointer">Portals</button>
            </div>

          </div>

          <div className="max-w-7xl mx-auto mt-6 pt-6 border-t border-sky-900/10 text-center text-[11px] text-slate-500 space-y-1">
            <p>&copy; {CURRENT_YEAR} VirtuHeal Rehabilitation Systems, Inc. All rights reserved.</p>
            <p className="max-w-2xl mx-auto text-[10px]">
              Disclaimer: VirtuHeal provides tele-rehabilitation tracking and biomechanical decision support. It is intended to be used under the supervision of a licensed physician or physical therapist.
            </p>
          </div>
        </footer>
      </div>
    </div>
  );
}
