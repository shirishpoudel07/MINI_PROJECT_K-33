import React, { useState } from 'react';
import { 
  X, 
  GraduationCap, 
  BookOpen, 
  Award, 
  CheckCircle2, 
  MapPin, 
  Mail, 
  Phone, 
  Calendar, 
  ShieldCheck, 
  Stethoscope, 
  Sparkles,
  Activity,
  Users
} from 'lucide-react';

export default function DoctorProfileModal({ isOpen, onClose, doctor: customDoctor = null }) {
  const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'degrees' | 'research' | 'experience'

  if (!isOpen) return null;

  const defaultDoctor = {
    name: "Dr. Alex Vance, PT, DPT, PhD",
    title: "Chief of Physical Rehabilitation & Orthopedic Biomechanics",
    department: "Department of Sports Medicine & Restorative Kinetics",
    clinic: "VirtuHeal Center for Advanced Human Performance",
    location: "New York, NY",
    email: "dr.vance@virtuheal.med",
    phone: "+1 (555) 382-9012",
    npi: "1982736450",
    license: "NY-PT-049821",
    status: "Active • Board Certified",
    avatar: "https://images.unsplash.com/photo-1622253692010-333f2da6031d?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80",
    stats: [
      { label: "Clinical Practice", value: "15+ Yrs", icon: Calendar },
      { label: "Patients Recovered", value: "4,500+", icon: Users },
      { label: "Peer-Reviewed Papers", value: "48 Pubs", icon: BookOpen },
      { label: "Citations Index", value: "2,340", icon: Award }
    ],
    degrees: [
      {
        degree: "Doctor of Physical Therapy (DPT)",
        institution: "Harvard Medical School / MGH Institute of Health Professions",
        year: "2011",
        honors: "Summa Cum Laude • Valedictorian",
        description: "Specialized in advanced neuromuscular facilitation, post-operative arthroplasty protocols, and kinetic chain rehabilitation."
      },
      {
        degree: "PhD in Biomechanical Engineering & Rehabilitation Science",
        institution: "Columbia University (in collaboration with MIT Media Lab)",
        year: "2015",
        honors: "Doctoral Excellence Fellowship Award",
        description: "Doctoral dissertation: 'Multi-Planar Kinematic Assessment of ACL Graft Integrity During Dynamic High-Velocity Deceleration'."
      },
      {
        degree: "Bachelor of Science in Kinesiology & Exercise Physiology",
        institution: "Johns Hopkins University",
        year: "2007",
        honors: "Dean's List of Academic Distinction",
        description: "Pre-clinical foundation in skeletal muscle mechanics, joint arthrokinematics, and clinical cardiopulmonary stress testing."
      }
    ],
    certifications: [
      { name: "Board Certified Orthopaedic Clinical Specialist (OCS)", issuer: "American Board of Physical Therapy Specialties", year: "2013 - Present" },
      { name: "Fellow of the American Academy of Orthopaedic Manual Physical Therapists (FAAOMPT)", issuer: "AAOMPT", year: "2016" },
      { name: "Certified Strength and Conditioning Specialist (CSCS)", issuer: "NSCA", year: "2008 - Present" },
      { name: "Dry Needling & Advanced Joint Manipulation Certified", issuer: "KinetaCore Physical Therapy", year: "2017" }
    ],
    research: [
      {
        title: "Kinematic Modeling of Multi-Planar Joint Stress in Accelerated ACL Rehabilitation Protocols",
        journal: "Journal of Orthopaedic & Sports Physical Therapy (JOSPT)",
        year: "2024",
        doi: "10.1016/j.jospt.2024.08.112",
        type: "Lead Author • Randomized Clinical Trial",
        summary: "Demonstrated a 34% reduction in graft reinjury rates through patient-specific biomechanical curve monitoring and closed-chain loading."
      },
      {
        title: "Neuromuscular Recalibration Patterns Following Arthroscopic Rotator Cuff Repair: A 24-Month Cohort",
        journal: "American Journal of Sports Medicine (AJSM)",
        year: "2023",
        doi: "10.1177/0363546523118944",
        type: "Co-Investigator • Multicenter Cohort Study",
        summary: "Identified compensatory scapular dyskinesis biomarkers in early post-op phases using high-framerate motion capture analysis."
      },
      {
        title: "Efficacy of AI-Assisted Remote Range of Motion Feedback in Post-Total Knee Arthroplasty Recovery",
        journal: "The Lancet Digital Health",
        year: "2022",
        doi: "10.1016/S2589-7500(22)00142-X",
        type: "Principal Investigator • NIH Grant #R01-HD0921",
        summary: "First clinical trial evaluating tele-rehabilitation computer vision algorithms against gold-standard goniometric clinical measurements."
      }
    ],
    specialties: [
      "ACL & Complex Ligament Reconstruction",
      "Rotator Cuff & Shoulder Arthroscopy Rehab",
      "Spine Biomechanics & Lumbar Stabilization",
      "Total Knee & Hip Arthroplasty Post-Op Care"
    ]
  };

  const doctor = customDoctor ? { ...defaultDoctor, ...customDoctor } : defaultDoctor;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-md animate-fade-in overflow-y-auto font-sans">
      <div 
        className="bg-white/95 backdrop-blur-2xl w-full max-w-4xl rounded-2xl shadow-2xl border border-sky-900/15 overflow-hidden my-6 flex flex-col max-h-[90vh] animate-scale-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header Banner with Doctor Photo & Highlights */}
        <div className="relative bg-gradient-to-r from-sky-700 via-blue-600 to-cyan-700 p-6 sm:p-8 text-white shrink-0">
          <button 
            onClick={onClose}
            className="absolute top-5 right-5 w-9 h-9 rounded-full bg-white/15 hover:bg-white/25 text-white flex items-center justify-center transition-colors border border-white/20"
            title="Close Profile"
          >
            <X size={18} />
          </button>

          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
            <div className="relative shrink-0">
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-white/15 border-2 border-white/30 backdrop-blur-md flex items-center justify-center text-white shadow-lg">
                <Stethoscope size={36} className="text-white" />
              </div>
              <div className="absolute -bottom-1 -right-1 bg-sky-500 text-white p-1 rounded-full border-2 border-white shadow-md" title="Board Certified & Active">
                <ShieldCheck size={14} />
              </div>
            </div>

            <div className="flex-1 text-center sm:text-left">
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mb-1.5">
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-white/20 text-white border border-white/30 backdrop-blur-sm">
                  {doctor.status}
                </span>
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-400/20 text-amber-200 border border-amber-300/30">
                  NPI: {doctor.npi}
                </span>
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-300/20 text-blue-100 border border-blue-200/30">
                  Lic: {doctor.license}
                </span>
              </div>

              <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                {doctor.name}
              </h2>
              <p className="text-blue-100 font-medium text-sm sm:text-base mt-1">
                {doctor.title}
              </p>
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-y-1 gap-x-4 text-xs text-blue-200 mt-2.5">
                <span className="flex items-center">
                  <Stethoscope size={13} className="mr-1 opacity-80" />
                  {doctor.clinic}
                </span>
                <span className="flex items-center">
                  <MapPin size={13} className="mr-1 opacity-80" />
                  {doctor.location}
                </span>
              </div>
            </div>
          </div>

          {/* Quick Metrics Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-6 border-t border-white/15">
            {(doctor.stats || []).map((stat, i) => {
              const DEFAULT_ICONS = [Calendar, Users, BookOpen, Award];
              const Icon = (typeof stat.icon === 'function' ? stat.icon : null) || DEFAULT_ICONS[i % DEFAULT_ICONS.length] || Award;
              return (
                <div key={i} className="bg-white/10 backdrop-blur-sm rounded-xl p-2.5 sm:p-3 border border-white/15 text-center">
                  <div className="flex items-center justify-center gap-1.5 text-blue-200 text-xs font-medium mb-0.5">
                    <Icon size={13} />
                    <span>{stat.label}</span>
                  </div>
                  <div className="text-lg sm:text-xl font-extrabold text-white">
                    {stat.value}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center border-b border-gray-200 bg-gray-50/80 px-6 shrink-0 overflow-x-auto">
          {[
            { id: 'overview', label: 'Overview & Details', icon: Stethoscope },
            { id: 'degrees', label: 'Doctor Degrees & Credentials', icon: GraduationCap },
            { id: 'research', label: 'Research & PhD Publications', icon: BookOpen },
            { id: 'specialties', label: 'Clinical Specialties', icon: Activity }
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 py-3.5 px-4 text-xs sm:text-sm font-semibold border-b-2 whitespace-nowrap transition-colors ${
                  isActive 
                    ? 'border-blue-600 text-blue-600 bg-white' 
                    : 'border-transparent text-gray-500 hover:text-gray-900 hover:border-gray-300'
                }`}
              >
                <Icon size={16} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Tab Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-thin">
          {/* TAB 1: OVERVIEW */}
          {activeTab === 'overview' && (
            <div className="space-y-6 animate-fade-in">
              <div>
                <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-2 flex items-center gap-2">
                  <Sparkles size={16} className="text-blue-600" />
                  Doctor Bio &amp; Clinical Philosophy
                </h3>
                <p className="text-sm text-gray-600 leading-relaxed bg-blue-50/50 p-4 rounded-xl border border-blue-100">
                  {doctor.bio || (doctor.name.includes('Sarah Lin')
                    ? 'Dr. Sarah Lin, MD, is a board-certified orthopedic surgeon and Sports Medicine Director at the Metropolitan Orthopedic Institute in Boston. With over 16 years of operative clinical practice and more than 3,800 successful joint procedures, Dr. Lin specializes in complex ACL and multi-ligament knee reconstruction, robotic-assisted total knee arthroplasty, and articular cartilage preservation.'
                    : doctor.name.includes('Miller')
                    ? 'Dr. David Miller, PT, OCS, is a senior clinical physical therapist and spine specialist with 18+ years of clinical expertise in lumbar stabilization, cervical radiculopathy, and post-surgical spinal fusion rehabilitation.'
                    : 'Dr. Alex Vance is a nationally recognized physical therapist, clinical biomechanist, and clinical researcher specializing in post-surgical orthopedic rehabilitation and kinetic restoration. With over 15 years directing sports medicine rehabilitation, Dr. Vance integrates real-time biomechanical analysis with customized closed-chain therapeutic exercises to accelerate functional return to high-demand activities.')}
                </p>
              </div>

              {/* Contact & Practice Info */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 rounded-xl border border-gray-200 bg-white space-y-3">
                  <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Clinical Contact</h4>
                  <div className="space-y-2 text-sm text-gray-700">
                    <div className="flex items-center gap-2.5">
                      <Mail size={15} className="text-blue-600 shrink-0" />
                      <a href={`mailto:${doctor.email}`} className="text-blue-600 hover:underline">{doctor.email}</a>
                    </div>
                    <div className="flex items-center gap-2.5">
                      <Phone size={15} className="text-blue-600 shrink-0" />
                      <span>{doctor.phone}</span>
                    </div>
                    <div className="flex items-center gap-2.5">
                      <MapPin size={15} className="text-blue-600 shrink-0" />
                      <span>VirtuHeal Main Medical Wing, Suite 410</span>
                    </div>
                  </div>
                </div>

                <div className="p-4 rounded-xl border border-gray-200 bg-white space-y-3">
                  <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Clinical Practice Hours</h4>
                  <div className="space-y-1.5 text-xs text-gray-600">
                    <div className="flex justify-between py-1 border-b border-gray-100">
                      <span className="font-semibold text-gray-800">Monday – Thursday:</span>
                      <span>08:00 AM – 05:00 PM</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-gray-100">
                      <span className="font-semibold text-gray-800">Friday (Research & Tele-Eval):</span>
                      <span>09:00 AM – 02:00 PM</span>
                    </div>
                    <div className="flex justify-between py-1">
                      <span className="font-semibold text-gray-800">Saturday & Sunday:</span>
                      <span className="text-amber-600 font-semibold">On-Call Surgical Follow-up</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Board Certifications */}
              <div>
                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Board Certifications & Fellowships</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {doctor.certifications.map((cert, index) => (
                    <div key={index} className="p-3 rounded-lg border border-gray-200 bg-gray-50 flex items-start gap-3">
                      <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center shrink-0 mt-0.5">
                        <Award size={16} />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-gray-900">{cert.name}</p>
                        <p className="text-[11px] text-gray-500 mt-0.5">{cert.issuer} • <span className="font-medium text-blue-600">{cert.year}</span></p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: DEGREES */}
          {activeTab === 'degrees' && (
            <div className="space-y-4 animate-fade-in">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider flex items-center gap-2">
                  <GraduationCap size={18} className="text-blue-600" />
                  Academic Degrees & Medical Education
                </h3>
                <span className="text-xs text-blue-600 font-semibold bg-blue-50 px-2.5 py-1 rounded-full border border-blue-200">
                  Verified Academic Credentials
                </span>
              </div>

              <div className="space-y-4">
                {doctor.degrees.map((item, index) => (
                  <div key={index} className="p-5 rounded-xl border border-gray-200 bg-white hover:border-blue-300 transition-all shadow-sm">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 mb-2">
                      <div className="flex items-center gap-2.5">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center font-bold text-sm shrink-0 shadow-sm">
                          {item.year}
                        </div>
                        <div>
                          <h4 className="text-base font-bold text-gray-900">{item.degree}</h4>
                          <p className="text-xs text-blue-700 font-medium">{item.institution}</p>
                        </div>
                      </div>
                      <span className="self-start sm:self-center px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-200">
                        {item.honors}
                      </span>
                    </div>
                    <p className="text-xs text-gray-600 leading-relaxed mt-3 pl-12">
                      {item.description}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 3: RESEARCH & PHDS */}
          {activeTab === 'research' && (
            <div className="space-y-5 animate-fade-in">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider flex items-center gap-2">
                    <BookOpen size={18} className="text-blue-600" />
                    Doctoral Research & Peer-Reviewed Papers
                  </h3>
                  <p className="text-xs text-gray-500 mt-1">Principal Investigator for NIH & Biomechanical Rehabilitation Trials</p>
                </div>
                <div className="text-right">
                  <span className="text-lg font-black text-blue-600">{doctor.stats?.[2]?.value || '40+'}</span>
                  <span className="text-[11px] text-gray-400 block font-semibold uppercase">Publications</span>
                </div>
              </div>

              {/* Research & Clinical Highlight */}
              <div className="p-5 rounded-xl bg-gradient-to-br from-indigo-50 to-blue-50 border border-indigo-200">
                <div className="flex items-center gap-2 text-indigo-700 font-bold text-xs uppercase tracking-wider mb-1.5">
                  <GraduationCap size={16} />
                  {doctor.name.includes('Sarah Lin')
                    ? 'Surgical Fellowship Clinical Investigation • Hospital for Special Surgery & Harvard'
                    : 'PhD Dissertation • Columbia University & MIT Media Lab'}
                </div>
                <h4 className="text-base font-extrabold text-gray-900 mb-2">
                  {doctor.name.includes('Sarah Lin')
                    ? '"Ten-Year Comparative Outcomes of Bone-Patellar Tendon-Bone vs Quadriceps Tendon Autografts in Revision ACL Reconstruction"'
                    : '"Multi-Planar Kinematic Assessment of ACL Graft Integrity During Dynamic High-Velocity Deceleration"'}
                </h4>
                <p className="text-xs text-gray-600 leading-relaxed">
                  {doctor.name.includes('Sarah Lin')
                    ? 'Specialized operative clinical investigation evaluating graft maturation histology, rotational stability, and long-term joint survivorship following anatomic arthroscopic ligament reconstruction.'
                    : 'Focuses on computer-assisted 3D kinematic modeling, surface electromyography (sEMG) during single-leg landing, and mathematical models for safe progressive tissue remodeling post-ACL reconstruction.'}
                </p>
              </div>

              {/* Published Papers */}
              <div className="space-y-3.5">
                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Featured Peer-Reviewed Publications</h4>
                {doctor.research.map((paper, idx) => (
                  <div key={idx} className="p-4 rounded-xl border border-gray-200 bg-white hover:border-blue-300 transition-all shadow-sm">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-700 mb-1.5">
                          {paper.type}
                        </span>
                        <h5 className="text-sm font-bold text-gray-900 hover:text-blue-600 transition-colors">
                          {paper.title}
                        </h5>
                        <p className="text-xs text-gray-500 font-medium mt-1">
                          {paper.journal} • <span className="font-bold text-gray-700">{paper.year}</span> • DOI: {paper.doi}
                        </p>
                        <p className="text-xs text-gray-600 mt-2 bg-gray-50 p-2.5 rounded-lg border border-gray-100">
                          <strong className="text-gray-800">Clinical Finding:</strong> {paper.summary}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 4: CLINICAL SPECIALTIES */}
          {activeTab === 'specialties' && (
            <div className="space-y-5 animate-fade-in">
              <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider flex items-center gap-2">
                <Activity size={18} className="text-blue-600" />
                Clinical Practice Specialties & Expertise
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {doctor.specialties.map((spec, i) => (
                  <div key={i} className="p-4 rounded-xl border border-gray-200 bg-white flex items-center gap-3.5 shadow-sm hover:border-blue-300 transition-all">
                    <div className="w-9 h-9 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-xs shrink-0">
                      <CheckCircle2 size={18} />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-gray-900">{spec}</p>
                      <p className="text-[11px] text-gray-500">Evidence-based clinical protocol</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Patient Outcomes Overview */}
              <div className="p-5 rounded-xl border border-gray-200 bg-slate-900 text-white mt-4">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                    <ShieldCheck size={16} className="text-sky-400" />
                    VirtuHeal Clinical Excellence Standard
                  </h4>
                  <span className="text-xs font-bold text-sky-400 bg-sky-400/20 px-2 py-0.5 rounded-full">
                    Top 1% Nationwide
                  </span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  All active exercise video programs and automated rehab protocols deployed through the VirtuHeal clinical workspace are reviewed and calibrated in accordance with {doctor.shortName || 'clinical'}'s published orthopedic and kinetic restoration guidelines.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-gray-200 bg-gray-50 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <span className="w-2 h-2 rounded-full bg-sky-500"></span>
            <span>VirtuHeal Verified Practitioner Credentials</span>
          </div>
          <button
            onClick={onClose}
            className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg text-xs shadow-sm transition-colors"
          >
            Close Profile
          </button>
        </div>
      </div>
    </div>
  );
}
