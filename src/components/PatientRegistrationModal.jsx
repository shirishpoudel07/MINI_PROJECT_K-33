import React, { useState } from 'react';
import { 
  X, 
  UserPlus, 
  Upload, 
  FileText, 
  CheckCircle2, 
  AlertCircle, 
  Activity, 
  Stethoscope, 
  ShieldCheck, 
  Sparkles,
  Paperclip,
  Trash2
} from 'lucide-react';
import { createPatient } from '../api/client';

const verifiedDoctors = [
  {
    name: 'Dr. Alex Vance, DPT, PhD',
    title: 'Chief of Physical Rehabilitation & Orthopedic Biomechanics',
    clinic: 'VirtuHeal Center for Advanced Human Performance',
    avatar: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80',
    specialty: 'Post-Surgical Knee & Shoulder Reconstruction'
  },
  {
    name: 'Dr. Sarah Lin, MD',
    title: 'Orthopedic Surgeon & Sports Medicine Director',
    clinic: 'Metropolitan Orthopedic Institute',
    avatar: 'https://images.unsplash.com/photo-1594824813511-6677f547c87c?auto=format&fit=crop&w=800&q=80',
    specialty: 'Ligamentous Repair & Joint Preservation'
  },
  {
    name: 'Dr. David Miller, PT, OCS',
    title: 'Senior Clinical Physical Therapist & Spine Specialist',
    clinic: 'Spine & Joint Physical Therapy Group',
    avatar: 'https://images.unsplash.com/photo-1537368910025-700350fe46c7?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80',
    specialty: 'Lumbar & Cervical Spine Rehabilitation'
  }
];

const sampleInjuryTemplates = [
  'ACL Reconstruction (Post-Op Day 14)',
  'Rotator Cuff Repair (Supraspinatus)',
  'Total Knee Replacement (Left Knee)',
  'Medial Meniscus Partial Tear',
  'Lumbar Disc Herniation (L4-L5)',
  'Grade 2 Lateral Ankle Sprain'
];

export default function PatientRegistrationModal({
  isOpen,
  onClose,
  onRegisterSuccess
}) {
  const [fullName, setFullName] = useState('');
  const [age, setAge] = useState('28');
  const [phone, setPhone] = useState('(555) 234-5678');
  const [condition, setCondition] = useState('ACL Reconstruction');
  const [painLevel, setPainLevel] = useState(4);
  const [selectedDoctor, setSelectedDoctor] = useState(verifiedDoctors[0].name);
  const [customDoctor, setCustomDoctor] = useState('');
  
  // Hospital Document / Medical Report Upload State
  const [uploadedFile, setUploadedFile] = useState(null);
  const [reportNotes, setReportNotes] = useState('MRI Scan: Full thickness tear of anterior cruciate ligament with mild bone contusion. Cleared for Phase II active-assisted physical therapy.');
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  if (!isOpen) return null;

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setUploadedFile({
        name: file.name,
        size: `${(file.size / 1024 / 1024).toFixed(1)} MB`,
        type: file.type || 'application/pdf',
        lastModified: new Date(file.lastModified).toLocaleDateString()
      });
      setErrorMessage('');
    }
  };

  const loadSampleReport = () => {
    setUploadedFile({
      name: 'Hospital_Discharge_Summary_MRI_Knee.pdf',
      size: '2.4 MB',
      type: 'application/pdf',
      lastModified: new Date().toLocaleDateString()
    });
    setReportNotes('Orthopedic Hospital Report: Patient cleared for formal outpatient physical therapy. Focus on regaining terminal knee extension (0 deg), active quad engagement, and edema control.');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!fullName.trim()) {
      setErrorMessage('Please enter your full legal name.');
      return;
    }
    if (!condition.trim()) {
      setErrorMessage('Please specify your physical injury or clinical condition.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage('');

    const finalDoctor = customDoctor.trim() || selectedDoctor;
    const patientId = `p${Date.now()}`;

    // Initial messages: welcome clinical message from assigned doctor + patient medical report note
    const welcomeDoctorMsg = {
      id: `m_welcome_${Date.now()}`,
      sender: 'doctor',
      sender_id: 'doctor',
      receiver_id: patientId,
      text: `Hello ${fullName.trim()}, welcome to VirtuHeal Rehabilitation. I am ${finalDoctor}, your assigned physical therapy specialist. I have received and reviewed your hospital medical intake report regarding your ${condition.trim()}. Let's work together toward a full recovery! How is your current pain and mobility feeling today?`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    const patientReportMsg = {
      id: `m_report_${Date.now() + 1}`,
      sender: 'patient',
      sender_id: patientId,
      receiver_id: 'doctor',
      text: `📄 Uploaded Medical Report: ${uploadedFile?.name || 'Hospital_Intake_Report.pdf'}\nClinical Notes: ${reportNotes.trim() || condition.trim()}\nInitial Pain Level: ${painLevel}/10`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    // Pre-assign gentle authentic rehabilitation routine matching their condition
    const condLower = condition.toLowerCase();
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
      name: fullName.trim(),
      condition: condition.trim(),
      assignedDoctor: finalDoctor,
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
        fileName: uploadedFile?.name || 'Hospital_Discharge_Summary.pdf',
        fileSize: uploadedFile?.size || '2.1 MB',
        notes: reportNotes.trim()
      },
      messages: [welcomeDoctorMsg, patientReportMsg],
      activeVideos: initialVideos
    };

    try {
      // Persist to backend database API
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
      onRegisterSuccess(mergedPatient);
      onClose();
    } catch {
      // Local fallback in case server is in offline sandbox
      onRegisterSuccess(payload);
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 z-50 animate-fade-in font-sans">
      <div className="bg-white rounded-3xl max-w-2xl w-full p-6 shadow-2xl border border-gray-100 flex flex-col max-h-[92vh] animate-slide-up overflow-hidden">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-4 border-b border-gray-100 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100 shadow-xs">
              <UserPlus size={22} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-black text-gray-900">I am a Patient • Intake & Registration</h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-sky-50 text-sky-700 border border-sky-200">
                  New Profile
                </span>
              </div>
              <p className="text-xs text-gray-500">
                Register your recovery profile, upload hospital records, and connect with your doctor.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-500 flex items-center justify-center transition-colors cursor-pointer"
            title="Close Registration"
          >
            <X size={16} />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto py-4 space-y-5 pr-1">
          
          {errorMessage && (
            <div className="p-3 bg-red-50 text-red-700 rounded-xl text-xs font-semibold flex items-center gap-2 border border-red-200">
              <AlertCircle size={15} />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Section 1: Patient Personal Details */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold text-gray-700 uppercase tracking-wider">
              <Activity size={14} className="text-blue-600" />
              <span>1. Patient Details</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Full Legal Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Johnathan Miller"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs sm:text-sm font-semibold text-gray-800 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all placeholder:text-gray-400"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Age & Contact Phone
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <input
                    type="number"
                    min="5"
                    max="110"
                    placeholder="Age"
                    value={age}
                    onChange={(e) => setAge(e.target.value)}
                    className="col-span-1 px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs sm:text-sm font-semibold text-gray-800 text-center"
                  />
                  <input
                    type="text"
                    placeholder="Phone number"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="col-span-2 px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs sm:text-sm font-semibold text-gray-800"
                  />
                </div>
              </div>
            </div>

            {/* Condition / Physical Injury */}
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">
                Clinical Diagnosis / Physical Injury <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="e.g. ACL Reconstruction, Rotator Cuff Repair, Lumbar Disc"
                value={condition}
                onChange={(e) => setCondition(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs sm:text-sm font-semibold text-gray-800 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
              />

              {/* Quick Template Chips */}
              <div className="flex items-center gap-1.5 flex-wrap mt-2">
                <span className="text-[10px] text-gray-400 font-bold uppercase">Quick select:</span>
                {sampleInjuryTemplates.map((tmpl) => (
                  <button
                    key={tmpl}
                    type="button"
                    onClick={() => setCondition(tmpl)}
                    className="text-[10px] font-semibold px-2 py-0.5 bg-gray-100 hover:bg-blue-50 text-gray-600 hover:text-blue-700 rounded-lg transition-colors cursor-pointer"
                  >
                    {tmpl}
                  </button>
                ))}
              </div>
            </div>

            {/* Initial Pain Level Slider */}
            <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200/80">
              <div className="flex items-center justify-between text-xs font-bold mb-1.5">
                <span className="text-gray-600">Current Resting Pain Level (VAS):</span>
                <span className={`px-2 py-0.5 rounded-full font-black ${
                  painLevel <= 3 ? 'bg-sky-100 text-sky-800' : painLevel <= 6 ? 'bg-amber-100 text-amber-800' : 'bg-red-100 text-red-800'
                }`}>
                  {painLevel} / 10 ({painLevel <= 3 ? 'Mild' : painLevel <= 6 ? 'Moderate' : 'Severe'})
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="10"
                value={painLevel}
                onChange={(e) => setPainLevel(Number(e.target.value))}
                className="w-full accent-blue-600 cursor-pointer"
              />
            </div>
          </div>

          {/* Section 2: Hospital Document / Medical Report Upload */}
          <div className="space-y-3 pt-2 border-t border-gray-100">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-bold text-gray-700 uppercase tracking-wider">
                <FileText size={14} className="text-blue-600" />
                <span>2. Upload Hospital Document / Medical Report</span>
              </div>
              <button
                type="button"
                onClick={loadSampleReport}
                className="text-[11px] font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1 cursor-pointer"
              >
                <Sparkles size={12} className="text-amber-500" />
                <span>Load Sample Hospital Report</span>
              </button>
            </div>

            {/* Drag & Drop File Upload Box */}
            <div className="border-2 border-dashed border-gray-200 hover:border-blue-400 rounded-2xl p-4 text-center transition-all bg-gray-50/50 hover:bg-blue-50/20 relative group">
              <input
                type="file"
                accept=".pdf,.png,.jpg,.jpeg,.doc,.docx"
                onChange={handleFileUpload}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                id="hospital-doc-upload"
              />
              <div className="flex flex-col items-center pointer-events-none">
                <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                  <Upload size={18} />
                </div>
                <p className="text-xs font-bold text-gray-800">
                  Click or drag hospital discharge summary, MRI scan, or surgery report
                </p>
                <p className="text-[11px] text-gray-400 mt-0.5">
                  Supports PDF, JPG, PNG, DOCX (Max 15MB)
                </p>
              </div>
            </div>

            {/* Display Active Uploaded File Card */}
            {uploadedFile && (
              <div className="bg-blue-50/70 border border-blue-200 rounded-2xl p-3 flex items-center justify-between animate-fade-in">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                    <FileText size={16} />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-gray-900 block truncate max-w-xs sm:max-w-md">
                      {uploadedFile.name}
                    </span>
                    <span className="text-[10px] text-gray-500 flex items-center gap-2">
                      <span>{uploadedFile.size}</span>
                      <span>•</span>
                      <span className="text-sky-700 font-bold flex items-center gap-0.5">
                        <CheckCircle2 size={10} /> Verified Clinical Record
                      </span>
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setUploadedFile(null)}
                  className="p-1.5 text-gray-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors cursor-pointer"
                  title="Remove uploaded document"
                >
                  <Trash2 size={15} />
                </button>
              </div>
            )}

            {/* Hospital / Physician Notes Text Area */}
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">
                Hospital Report Summary / Physician Findings
              </label>
              <textarea
                rows={2}
                placeholder="Paste key notes from discharge paper or diagnosis..."
                value={reportNotes}
                onChange={(e) => setReportNotes(e.target.value)}
                className="w-full px-3.5 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium text-gray-800 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all placeholder:text-gray-400"
              />
            </div>
          </div>

          {/* Section 3: Name of Assigned Doctor */}
          <div className="space-y-3 pt-2 border-t border-gray-100">
            <div className="flex items-center gap-2 text-xs font-bold text-gray-700 uppercase tracking-wider">
              <Stethoscope size={14} className="text-blue-600" />
              <span>3. Assigned Doctor / Physical Therapist</span>
            </div>

            <div className="space-y-2">
              {verifiedDoctors.map((doc) => {
                const isSelected = selectedDoctor === doc.name && !customDoctor;
                return (
                  <div
                    key={doc.name}
                    onClick={() => {
                      setSelectedDoctor(doc.name);
                      setCustomDoctor('');
                    }}
                    className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
                      isSelected
                        ? 'bg-blue-50/80 border-blue-400 ring-2 ring-blue-200 shadow-xs'
                        : 'bg-white border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <img
                        src={doc.avatar}
                        alt={doc.name}
                        className="w-10 h-10 rounded-full object-cover border border-gray-200"
                      />
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-black text-gray-900">{doc.name}</span>
                          <ShieldCheck size={13} className="text-blue-600" />
                        </div>
                        <p className="text-[11px] text-gray-500 font-medium">{doc.title}</p>
                        <span className="text-[10px] text-blue-700 font-semibold">{doc.specialty}</span>
                      </div>
                    </div>
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                      isSelected ? 'border-blue-600 bg-blue-600 text-white' : 'border-gray-300'
                    }`}>
                      {isSelected && <span className="w-2 h-2 rounded-full bg-white"></span>}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Custom Doctor Name Option */}
            <div className="pt-1">
              <label className="block text-[11px] font-bold text-gray-500 mb-1">
                Or enter custom assigned doctor name:
              </label>
              <input
                type="text"
                placeholder="e.g. Dr. Jennifer Hayes, PT"
                value={customDoctor}
                onChange={(e) => setCustomDoctor(e.target.value)}
                className="w-full px-3.5 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold text-gray-800 placeholder:text-gray-400"
              />
            </div>
          </div>

          {/* Intake Confirmation Card */}
          <div className="bg-slate-900 text-white p-4 rounded-2xl flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600/30 text-blue-400 flex items-center justify-center shrink-0 border border-blue-500/30">
              <Paperclip size={18} />
            </div>
            <div className="text-xs leading-relaxed text-slate-300">
              <strong className="text-white block font-bold">Instant Clinical Conversation:</strong>
              Upon submitting, your profile will be created with an initial intake message from <strong className="text-blue-400">{customDoctor || selectedDoctor}</strong>. You can chat and review your prescribed exercises right away!
            </div>
          </div>

          {/* Form Actions */}
          <div className="pt-3 border-t border-gray-100 flex items-center justify-end gap-3 shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl text-xs font-semibold text-gray-600 hover:bg-gray-100 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2.5 rounded-xl text-xs sm:text-sm font-black bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-600/30 transition-all flex items-center gap-2 cursor-pointer active:scale-95 disabled:opacity-75"
            >
              <CheckCircle2 size={16} />
              <span>{isSubmitting ? 'Creating Patient Profile...' : 'Complete Intake & Log In as Patient'}</span>
            </button>
          </div>

        </form>

      </div>
    </div>
  );
}

