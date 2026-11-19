import React, { useState } from 'react';
import { 
  ActivitySquare, 
  Stethoscope, 
  User, 
  UserPlus, 
  KeyRound, 
  ShieldCheck, 
  ArrowRight, 
  Lock, 
  Paperclip,
  Check
} from 'lucide-react';
import { createPatient } from '../api/client';

export default function AuthLandingPage({
  patients = [],
  verifiedDoctors = [],
  onPatientLogin,
  onPatientRegister,
  onDoctorLogin,
  onDoctorRegister,
  isBackendConnected = false
}) {
  // Active Tab per Portal Card: 'signin' | 'register'
  const [patientTab, setPatientTab] = useState('signin');
  const [doctorTab, setDoctorTab] = useState('signin');

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

    onDoctorLogin(doc);
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

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col justify-between font-sans relative overflow-x-hidden selection:bg-blue-600 selection:text-white">
      
      {/* Soft Background Glow Effects */}
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-blue-600/10 rounded-full blur-3xl pointer-events-none -z-0"></div>
      <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-sky-500/10 rounded-full blur-3xl pointer-events-none -z-0"></div>

      {/* Top Header */}
      <header className="px-6 py-5 border-b border-slate-800/80 bg-slate-950/60 backdrop-blur-md flex items-center justify-between shrink-0 relative z-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-lg shadow-blue-500/20">
            <ActivitySquare size={24} className="stroke-[2.5]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xl font-black text-white tracking-tight">VirtuHeal</span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/15 text-blue-400 border border-blue-500/30">
                v2.0 Clinical
              </span>
            </div>
            <p className="text-xs text-slate-400">AI-Powered Physical Telerehabilitation Platform</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {isBackendConnected ? (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-sky-500/10 text-sky-400 border border-sky-500/20">
              <span className="w-2 h-2 rounded-full bg-sky-400 animate-pulse"></span>
              Live Backend Connected
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-slate-800 text-slate-400 border border-slate-700">
              <span className="w-2 h-2 rounded-full bg-slate-500"></span>
              Local Database Mode
            </span>
          )}
        </div>
      </header>

      {/* Main Dual-Portal Login Hero */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 py-8 md:py-12 flex flex-col justify-center relative z-10">
        
        {/* Title & Introduction */}
        <div className="text-center max-w-2xl mx-auto mb-10 space-y-2">
          <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
            Healthcare Access Portal
          </h1>
          <p className="text-slate-400 text-sm sm:text-base leading-relaxed">
            Select your dedicated portal to sign in or register. Patient routines and clinician workspaces operate in isolated, secure clinical environments.
          </p>
        </div>

        {/* The Two Distinct Portal Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
          
          {/* ========================================================= */}
          {/* PORTAL CARD 1: PATIENT PORTAL                             */}
          {/* ========================================================= */}
          <div className="bg-slate-950/80 rounded-3xl border border-blue-500/30 shadow-2xl p-6 sm:p-7 flex flex-col transition-all hover:border-blue-500/50">
            
            {/* Card Header */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-blue-600/20 text-blue-400 flex items-center justify-center border border-blue-500/30">
                  <User size={24} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-xl font-black text-white">Patient Portal</h2>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/20 text-blue-300 border border-blue-500/30">
                      Recovery Suite
                    </span>
                  </div>
                  <p className="text-xs text-slate-400">For patients undergoing rehabilitation</p>
                </div>
              </div>
            </div>

            {/* Tab Switcher */}
            <div className="grid grid-cols-2 gap-2 p-1 bg-slate-900 rounded-xl my-4 text-xs font-bold">
              <button
                type="button"
                onClick={() => setPatientTab('signin')}
                className={`py-2 px-3 rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  patientTab === 'signin'
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-white'
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
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
                id="patient-tab-register-btn"
              >
                <UserPlus size={13} />
                <span>I am a Patient</span>
              </button>
            </div>

            {/* Sub-view A: Authentic Patient Sign In Form */}
            {patientTab === 'signin' && (
              <form onSubmit={handlePatientSignInSubmit} className="space-y-4">
                <p className="text-xs text-slate-400">
                  Enter your Patient Medical ID or Full Name to access your personalized rehabilitation dashboard:
                </p>

                {/* Patient ID / Name Input */}
                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                    Patient Medical ID or Full Name *
                  </label>
                  <div className="relative">
                    <User size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      value={patLoginId}
                      onChange={(e) => {
                        setPatLoginId(e.target.value);
                        setPatLoginError('');
                      }}
                      placeholder="e.g., Shirish Poudel or p1"
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-900 border border-slate-700 focus:border-blue-500 rounded-xl text-white text-sm outline-hidden transition-all placeholder:text-slate-500"
                      required
                    />
                  </div>
                </div>

                {/* Password / PIN Input */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                      Patient Password / PIN *
                    </label>
                    <span className="text-[11px] text-blue-400 bg-blue-950/80 px-2 py-0.5 rounded-full border border-blue-800">
                      Demo PIN: 1234
                    </span>
                  </div>
                  <div className="relative">
                    <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="password"
                      maxLength={6}
                      value={patLoginPin}
                      onChange={(e) => {
                        setPatLoginPin(e.target.value);
                        setPatLoginError('');
                      }}
                      placeholder="Enter 4-digit PIN..."
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-900 border border-slate-700 focus:border-blue-500 rounded-xl text-white font-mono tracking-widest text-sm outline-hidden transition-all placeholder:text-slate-500"
                    />
                  </div>
                </div>

                {/* Quick 1-Click Demo Accounts */}
                <div className="p-3 bg-slate-900/80 rounded-2xl border border-slate-800 space-y-2">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                    Quick Clinical Demo Logins:
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {patients.slice(0, 3).map((pat) => (
                      <button
                        key={pat.id}
                        type="button"
                        onClick={() => {
                          setPatLoginId(pat.name);
                          setPatLoginPin('1234');
                          setPatLoginError('');
                        }}
                        className={`px-2.5 py-1.5 rounded-xl border text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                          patLoginId.toLowerCase() === pat.name.toLowerCase() || patLoginId.toLowerCase() === pat.id.toLowerCase()
                            ? 'bg-blue-600/30 border-blue-500 text-blue-200'
                            : 'bg-slate-800/80 hover:bg-slate-800 border-slate-700 text-slate-300'
                        }`}
                      >
                        <User size={12} className="text-blue-400" />
                        <span>{pat.name}</span>
                        <span className="text-[10px] text-slate-400 font-mono">({pat.id})</span>
                      </button>
                    ))}
                  </div>
                </div>

                {patLoginError && (
                  <div className="p-3 bg-red-950/60 border border-red-800 rounded-xl text-xs text-red-300">
                    {patLoginError}
                  </div>
                )}

                <button
                  type="submit"
                  className="w-full py-3.5 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-bold transition-all shadow-lg shadow-blue-600/20 flex items-center justify-center gap-2 cursor-pointer active:scale-95 mt-4"
                >
                  <Lock size={15} />
                  <span>Sign In to Patient Portal</span>
                  <ArrowRight size={15} />
                </button>
              </form>
            )}

            {/* Sub-view B: Register as New Patient */}
            {patientTab === 'register' && (
              <form onSubmit={handleRegisterPatientSubmit} className="space-y-3.5 text-xs max-h-[460px] overflow-y-auto pr-1">
                
                <div className="p-2.5 bg-blue-900/30 border border-blue-500/30 rounded-xl text-blue-200">
                  <p>Fill your details, upload your medical report, and choose your doctor to create your recovery profile.</p>
                </div>

                <div>
                  <label className="block font-bold text-slate-300 uppercase tracking-wider mb-1">
                    Full Legal Name *
                  </label>
                  <input
                    type="text"
                    value={patName}
                    onChange={(e) => setPatName(e.target.value)}
                    placeholder="e.g., Shirish Poudel"
                    className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 focus:border-blue-500 rounded-xl text-white outline-hidden text-xs"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-300 uppercase tracking-wider mb-1">Age</label>
                    <input
                      type="number"
                      value={patAge}
                      onChange={(e) => setPatAge(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-700 focus:border-blue-500 rounded-xl text-white outline-hidden text-xs"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-300 uppercase tracking-wider mb-1">Initial Pain (1-10)</label>
                    <input
                      type="number"
                      min={1}
                      max={10}
                      value={patPain}
                      onChange={(e) => setPatPain(Number(e.target.value))}
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-700 focus:border-blue-500 rounded-xl text-white outline-hidden text-xs"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-slate-300 uppercase tracking-wider mb-1">
                    Injury / Clinical Condition *
                  </label>
                  <input
                    type="text"
                    value={patCondition}
                    onChange={(e) => setPatCondition(e.target.value)}
                    placeholder="e.g., ACL Reconstruction, Rotator Cuff Repair"
                    className="w-full px-3.5 py-2 bg-slate-900 border border-slate-700 focus:border-blue-500 rounded-xl text-white outline-hidden text-xs"
                    required
                  />
                </div>

                {/* Assigned Doctor Selection */}
                <div>
                  <label className="block font-bold text-slate-300 uppercase tracking-wider mb-1">
                    Choose Assigned Doctor *
                  </label>
                  <select
                    value={patDoctor}
                    onChange={(e) => setPatDoctor(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 focus:border-blue-500 rounded-xl text-white outline-hidden text-xs"
                  >
                    {verifiedDoctors.map((doc) => (
                      <option key={doc.id} value={doc.name}>
                        {doc.name} ({doc.clinic?.split(' ')[0] || 'Clinician'})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Upload Hospital Document / Report */}
                <div className="p-3 bg-slate-900 rounded-xl border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-300 uppercase tracking-wider">Hospital Medical Report</span>
                    <button
                      type="button"
                      onClick={loadSamplePatientReport}
                      className="text-[11px] text-blue-400 hover:text-blue-300 underline cursor-pointer"
                    >
                      Load Sample MRI Report
                    </button>
                  </div>
                  
                  {patUploadedFile ? (
                    <div className="flex items-center justify-between p-2 bg-blue-950/60 rounded-lg border border-blue-500/30">
                      <span className="font-mono text-xs text-blue-200 truncate">{patUploadedFile.name}</span>
                      <span className="text-[10px] text-slate-400">{patUploadedFile.size}</span>
                    </div>
                  ) : (
                    <label className="flex items-center justify-center gap-2 p-3 border-2 border-dashed border-slate-700 hover:border-blue-500 rounded-xl cursor-pointer text-slate-400 hover:text-white transition-colors">
                      <Paperclip size={14} />
                      <span>Attach PDF or Medical Report</span>
                      <input
                        type="file"
                        accept=".pdf,.png,.jpg,.jpeg,.docx"
                        onChange={(e) => {
                          const f = e.target.files?.[0];
                          if (f) {
                            setPatUploadedFile({ name: f.name, size: `${(f.size / 1024 / 1024).toFixed(1)} MB` });
                          }
                        }}
                        className="hidden"
                      />
                    </label>
                  )}

                  <textarea
                    rows={2}
                    value={patNotes}
                    onChange={(e) => setPatNotes(e.target.value)}
                    placeholder="Clinical report summary..."
                    className="w-full p-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-200 text-[11px] outline-hidden"
                  />
                </div>

                {patError && (
                  <p className="text-red-400 text-xs font-semibold">{patError}</p>
                )}

                <button
                  type="submit"
                  disabled={isPatSubmitting}
                  className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer active:scale-95"
                >
                  <UserPlus size={15} />
                  <span>{isPatSubmitting ? 'Creating Profile...' : 'Create Profile & Enter Patient Portal'}</span>
                </button>
              </form>
            )}

          </div>


          {/* ========================================================= */}
          {/* PORTAL CARD 2: DOCTOR / CLINICIAN PORTAL                  */}
          {/* ========================================================= */}
          <div className="bg-slate-950/80 rounded-3xl border border-sky-500/30 shadow-2xl p-6 sm:p-7 flex flex-col transition-all hover:border-sky-500/50">
            
            {/* Card Header */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-sky-500/20 text-sky-400 flex items-center justify-center border border-sky-500/30">
                  <Stethoscope size={24} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-xl font-black text-white">Doctor Portal</h2>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-sky-500/20 text-sky-300 border border-sky-500/30">
                      Clinician Suite
                    </span>
                  </div>
                  <p className="text-xs text-slate-400">For attending physicians & physical therapists</p>
                </div>
              </div>
            </div>

            {/* Tab Switcher */}
            <div className="grid grid-cols-2 gap-2 p-1 bg-slate-900 rounded-xl my-4 text-xs font-bold">
              <button
                type="button"
                onClick={() => setDoctorTab('signin')}
                className={`py-2 px-3 rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  doctorTab === 'signin'
                    ? 'bg-sky-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <KeyRound size={13} />
                <span>Staff Sign In</span>
              </button>
              <button
                type="button"
                onClick={() => setDoctorTab('register')}
                className={`py-2 px-3 rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  doctorTab === 'register'
                    ? 'bg-sky-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <UserPlus size={13} />
                <span>Register as Doctor</span>
              </button>
            </div>

            {/* Sub-view A: Doctor Sign In */}
            {doctorTab === 'signin' && (
              <form onSubmit={handleDoctorSignInSubmit} className="space-y-4">
                <p className="text-xs text-slate-400">
                  Select your attending physician profile and enter your 4-digit PIN:
                </p>

                <div className="space-y-2.5 max-h-[220px] overflow-y-auto pr-1">
                  {verifiedDoctors.map((doc) => {
                    const isSelected = selectedDoctorId === doc.id;
                    return (
                      <div
                        key={doc.id}
                        onClick={() => setSelectedDoctorId(doc.id)}
                        className={`p-3 rounded-2xl border transition-all flex items-center justify-between gap-3 cursor-pointer ${
                          isSelected
                            ? 'bg-sky-600/15 border-sky-500 ring-2 ring-sky-500/30'
                            : 'bg-slate-900/60 border-slate-800 hover:border-slate-700 hover:bg-slate-900'
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-10 h-10 rounded-xl bg-sky-500/20 text-sky-400 border border-sky-500/30 flex items-center justify-center shrink-0">
                            <Stethoscope size={18} />
                          </div>
                          <div className="min-w-0">
                            <h4 className="text-sm font-bold text-white truncate">{doc.name}</h4>
                            <p className="text-xs text-sky-400 font-semibold truncate">{doc.title}</p>
                            <p className="text-[11px] text-slate-500 truncate">{doc.clinic}</p>
                          </div>
                        </div>

                        <div className="shrink-0">
                          {isSelected ? (
                            <span className="w-6 h-6 rounded-full bg-sky-600 text-white flex items-center justify-center">
                              <Check size={14} />
                            </span>
                          ) : (
                            <div className="w-5 h-5 rounded-full border border-slate-700"></div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* PIN Input */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                      Clinician PIN
                    </label>
                    <span className="text-[11px] text-sky-400 bg-sky-950/80 px-2 py-0.5 rounded-full border border-sky-800">
                      Demo PIN: 1234
                    </span>
                  </div>
                  <div className="relative">
                    <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="password"
                      maxLength={6}
                      value={doctorPin}
                      onChange={(e) => setDoctorPin(e.target.value)}
                      placeholder="Enter 4-digit PIN..."
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-900 border border-slate-700 focus:border-sky-500 rounded-xl text-white font-mono tracking-widest text-sm outline-hidden"
                    />
                  </div>
                </div>

                {doctorError && (
                  <p className="text-red-400 text-xs font-semibold">{doctorError}</p>
                )}

                <button
                  type="submit"
                  className="w-full py-3.5 px-4 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-sm font-bold transition-all shadow-lg shadow-sky-600/20 flex items-center justify-center gap-2 cursor-pointer active:scale-95"
                >
                  <ShieldCheck size={16} />
                  <span>Log In to Doctor Portal</span>
                  <ArrowRight size={15} />
                </button>
              </form>
            )}

            {/* Sub-view B: Doctor Registration */}
            {doctorTab === 'register' && (
              <form onSubmit={handleDoctorRegisterSubmit} className="space-y-3.5 text-xs max-h-[460px] overflow-y-auto pr-1">
                
                <div className="p-2.5 bg-sky-900/30 border border-sky-500/30 rounded-xl text-sky-200">
                  <p>Register your clinician credentials to review assigned hospital reports and manage therapy protocols.</p>
                </div>

                <div>
                  <label className="block font-bold text-slate-300 uppercase tracking-wider mb-1">
                    Full Legal Name & Degree *
                  </label>
                  <input
                    type="text"
                    value={docName}
                    onChange={(e) => setDocName(e.target.value)}
                    placeholder="e.g., Dr. Jane Foster, DPT, OCS"
                    className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 focus:border-sky-500 rounded-xl text-white outline-hidden text-xs"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-300 uppercase tracking-wider mb-1">
                      Hospital / Clinic *
                    </label>
                    <input
                      type="text"
                      value={docClinic}
                      onChange={(e) => setDocClinic(e.target.value)}
                      placeholder="e.g., St. Jude Orthopedic Center"
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-700 focus:border-sky-500 rounded-xl text-white outline-hidden text-xs"
                      required
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-300 uppercase tracking-wider mb-1">
                      Specialty *
                    </label>
                    <input
                      type="text"
                      value={docSpecialty}
                      onChange={(e) => setDocSpecialty(e.target.value)}
                      placeholder="e.g., Sports Medicine"
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-700 focus:border-sky-500 rounded-xl text-white outline-hidden text-xs"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-300 uppercase tracking-wider mb-1">Department</label>
                    <input
                      type="text"
                      value={docDepartment}
                      onChange={(e) => setDocDepartment(e.target.value)}
                      placeholder="e.g., Orthopedic PT"
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-700 focus:border-sky-500 rounded-xl text-white outline-hidden text-xs"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-300 uppercase tracking-wider mb-1">License / NPI</label>
                    <input
                      type="text"
                      value={docLicense}
                      onChange={(e) => setDocLicense(e.target.value)}
                      placeholder="e.g., NY-PT-049821"
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-700 focus:border-sky-500 rounded-xl text-white outline-hidden text-xs font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-slate-300 uppercase tracking-wider mb-1">
                    Set Security PIN
                  </label>
                  <input
                    type="password"
                    maxLength={6}
                    value={docPin}
                    onChange={(e) => setDocPin(e.target.value)}
                    placeholder="e.g., 1234"
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 focus:border-sky-500 rounded-xl text-white outline-hidden text-xs font-mono tracking-widest"
                  />
                </div>

                {docRegError && (
                  <p className="text-red-400 text-xs font-semibold">{docRegError}</p>
                )}

                <button
                  type="submit"
                  className="w-full py-3 px-4 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-xs font-bold transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer active:scale-95"
                >
                  <UserPlus size={15} />
                  <span>Create Doctor Profile & Enter Portal</span>
                </button>
              </form>
            )}

          </div>

        </div>

      </main>

      {/* Footer */}
      <footer className="px-6 py-4 border-t border-slate-800 text-center text-xs text-slate-500 relative z-10">
        VirtuHeal Clinical Tele-Rehabilitation System • HIPAA-Compliant Architecture • Real-Time WebSockets
      </footer>

    </div>
  );
}
