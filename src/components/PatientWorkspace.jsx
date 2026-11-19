import React, { useState } from 'react';
import ChatInterface from './ChatInterface';
import VideoAssignment from './VideoAssignment';
import MedicalReportModal from './MedicalReportModal';
import PlanOfVideosModal from './PlanOfVideosModal';
import { 
  Activity, 
  ChevronLeft, 
  HeartPulse, 
  FileCheck, 
  Columns, 
  MessageSquare, 
  Dumbbell, 
  Stethoscope,
  Lock,
  ShieldAlert,
  Users
} from 'lucide-react';
import { isPatientAssignedToDoctor } from '../utils/doctorHelpers';

export default function PatientWorkspace({ 
  patient, 
  onSendMessage, 
  onAssignVideo, 
  onUpdatePatient,
  targetedNotification = null,
  onClearTargetedNotification = null,
  currentDoctor = null
}) {
  // 'split' (Priority: Chat First on Left + Plan Studio Aside on Right - Default!) | 'chat' (Full Chat) | 'plan' (Full Plan)
  const [workspaceMode, setWorkspaceMode] = useState('split');
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [isPlanModalOpen, setIsPlanModalOpen] = useState(false);
  const [selectedPlanModalVideo, setSelectedPlanModalVideo] = useState(null);
  const [prevNotif, setPrevNotif] = useState(targetedNotification);

  // Auto-switch to chat when clicking a notification
  if (targetedNotification !== prevNotif) {
    setPrevNotif(targetedNotification);
    if (targetedNotification) {
      setWorkspaceMode('chat');
    }
  }

  const handleOpenPlanModal = (videoOrMsg) => {
    setSelectedPlanModalVideo(videoOrMsg);
    setIsPlanModalOpen(true);
  };

  if (!patient) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-gray-50/50 relative h-full p-8 text-center font-sans">
        <div className="w-16 h-16 rounded-2xl bg-sky-50 text-sky-600 flex items-center justify-center mb-4 border border-sky-200 shadow-xs">
          <Users size={30} />
        </div>
        <h2 className="text-base sm:text-lg font-black text-slate-900">No Patient Assigned</h2>
        <p className="text-xs text-slate-500 mt-1 max-w-sm leading-relaxed">
          There are currently no patients assigned to {currentDoctor?.shortName || currentDoctor?.name || 'your profile'}.
          When a patient registers and selects you, their active clinical chart will appear here. You can view all patient names in the sidebar under <strong>"All Patients"</strong>.
        </p>
      </div>
    );
  }

  const isAssigned = isPatientAssignedToDoctor(patient, currentDoctor);

  // If patient is NOT assigned to this doctor, display Directory Name Only View:
  if (!isAssigned) {
    return (
      <div className="flex-1 flex flex-col h-full bg-[#faf8f2]/40 relative overflow-hidden font-sans">
        {/* Name Only Header */}
        <div className="bg-white/90 backdrop-blur-xl px-6 py-4 border-b border-sky-900/10 flex items-center justify-between shrink-0 shadow-2xs z-20">
          <div className="flex items-center space-x-3.5 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center font-extrabold text-xs border border-slate-200 shrink-0">
              {patient.name?.split(' ').map(n => n[0]).join('') || 'PT'}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h1 className="text-base font-extrabold text-slate-900 truncate tracking-tight">
                  {patient.name}
                </h1>
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200 shrink-0">
                  <Lock size={10} className="text-amber-600" />
                  Directory View (Name Only)
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-1.5">
                <Stethoscope size={11} className="text-indigo-600 shrink-0" />
                <span>Attending Clinician: <strong className="text-slate-800 font-semibold">{patient.assignedDoctor || 'Another Attending Physician'}</strong></span>
              </p>
            </div>
          </div>
        </div>

        {/* Directory Access Restricted Body */}
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center z-10">
          <div className="max-w-md w-full bg-white rounded-3xl p-8 border border-amber-200/80 shadow-lg shadow-amber-950/5 flex flex-col items-center animate-scale-up">
            <div className="w-16 h-16 rounded-2xl bg-amber-50 border border-amber-200 text-amber-600 flex items-center justify-center mb-4 shadow-2xs">
              <ShieldAlert size={32} />
            </div>
            
            <h2 className="text-base sm:text-lg font-black text-slate-900">
              Clinical Records & Workspace Restricted
            </h2>
            
            <p className="text-xs text-slate-600 mt-2 leading-relaxed">
              In accordance with hospital clinical governance, only the attending physician (<strong className="text-slate-900">{patient.assignedDoctor || 'Assigned Doctor'}</strong>) has authorization to review medical charts, prescribe routines, and exchange messages with <strong className="text-slate-900">{patient.name}</strong>.
            </p>

            <div className="w-full mt-5 p-3.5 bg-amber-50/60 rounded-2xl border border-amber-200 text-left space-y-1.5 text-xs">
              <div className="flex items-center justify-between text-[11px] font-bold text-amber-900">
                <span>Access Level:</span>
                <span className="uppercase tracking-wider font-extrabold text-amber-800">Patient Name Only</span>
              </div>
              <div className="text-[11px] text-slate-600">
                Patient Name: <strong className="text-slate-800">{patient.name}</strong>
              </div>
              <div className="text-[11px] text-slate-600">
                Attending Staff: <strong className="text-slate-800">{patient.assignedDoctor || 'Designated Specialist'}</strong>
              </div>
            </div>

            <div className="mt-6 w-full py-2.5 px-4 bg-slate-100 rounded-xl text-xs font-bold text-slate-500 text-center border border-slate-200">
              🔒 Workspace, Chat & Plans Locked
            </div>
          </div>
        </div>
      </div>
    );
  }

  const patientInitials = patient.name?.split(' ').map(n => n[0]).join('') || 'PT';

  return (
    <div className="flex-1 flex flex-col h-full bg-transparent relative overflow-hidden font-sans">
      
      {/* Unified Sleek Clinical Command Header */}
      <div className="bg-white/80 backdrop-blur-xl px-4 lg:px-6 py-2 border-b border-sky-900/10 flex items-center justify-between shrink-0 shadow-2xs z-20">
        
        {/* Left: Patient Quick Identity & Vitals in a balanced two-row lockup */}
        <div className="flex items-center space-x-3 min-w-0">
          <div className="relative shrink-0">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-sky-500 to-blue-600 text-white flex items-center justify-center font-extrabold text-xs shadow-xs">
              {patientInitials}
            </div>
            <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-sky-500 border-2 border-white ring-1 ring-sky-300"></div>
          </div>

          <div className="min-w-0 flex flex-col justify-center">
            {/* Row 1: Patient Name & ID & Condition */}
            <div className="flex items-center gap-2">
              <h1 className="text-sm font-extrabold text-slate-900 truncate tracking-tight">
                {patient.name}
              </h1>
              <span className="text-[10px] font-mono text-slate-400 font-bold bg-slate-100 px-1.5 py-0.5 rounded">
                #{patient.id}
              </span>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-blue-50 text-blue-700 border border-blue-200/80 truncate max-w-[180px]">
                <HeartPulse size={11} className="text-blue-600 shrink-0" />
                <span className="truncate">{patient.condition}</span>
              </span>
            </div>

            {/* Row 2: Vitals & Clinician pill */}
            <div className="flex items-center gap-2 mt-0.5">
              <span className={`inline-flex items-center gap-1 px-1.5 py-0.2 rounded text-[10px] font-bold border ${
                patient.adherenceScore >= 80 
                  ? 'bg-sky-50 text-sky-700 border-sky-200' 
                  : patient.adherenceScore >= 60 
                    ? 'bg-amber-50 text-amber-700 border-amber-200' 
                    : 'bg-rose-50 text-rose-700 border-rose-200'
              }`}>
                <Activity size={10} className="shrink-0" />
                <span>{patient.adherenceScore}% Adherence</span>
              </span>

              <span className="text-slate-300">•</span>

              <div 
                className="inline-flex items-center gap-1 text-[10px] font-semibold text-slate-600"
                title={`Attending Clinician: ${patient.assignedDoctor || currentDoctor?.name || 'Dr. Alex Vance'}`}
              >
                <Stethoscope size={11} className="text-indigo-600 shrink-0" />
                <span>Doctor: <strong className="text-slate-800 font-bold">{patient.assignedDoctor || currentDoctor?.shortName || 'Dr. Alex Vance'}</strong></span>
              </div>
            </div>
          </div>
        </div>
        
        {/* Right: User-Friendly Workspace Tab Switcher & Clinical Actions */}
        <div className="flex items-center space-x-2.5 shrink-0 ml-2">
          
          {/* Hospital Intake Medical Report Button */}
          {patient.medicalReport && (
            <button 
              onClick={() => setIsReportModalOpen(true)}
              className="flex items-center space-x-1.5 px-2.5 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-lg text-xs font-bold shadow-2xs transition-all cursor-pointer"
              title={`Review intake report: ${patient.medicalReport.fileName || 'Intake Findings'}`}
            >
              <FileCheck size={13} className="text-blue-600" />
              <span className="hidden sm:inline">Intake Report</span>
            </button>
          )}

          {/* User-Friendly Mode Switcher: Chat First, Plan Aside, or Full Views */}
          <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs font-bold shadow-2xs">
            <button
              type="button"
              onClick={() => setWorkspaceMode('chat')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all cursor-pointer relative ${
                workspaceMode === 'chat'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
              title="Patient Messaging & Live Consultation (Chat Priority)"
            >
              <MessageSquare size={13} />
              <span>Patient Chat</span>
              {patient.messages?.length > 0 && (
                <span className={`w-2 h-2 rounded-full ${workspaceMode === 'chat' ? 'bg-white' : 'bg-blue-600 animate-pulse'}`}></span>
              )}
            </button>

            <button
              type="button"
              onClick={() => setWorkspaceMode('plan')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                workspaceMode === 'plan'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
              title="Exercise Plan & Routine Sequencing Studio"
            >
              <Dumbbell size={13} />
              <span>Exercise Plan ({patient.activeVideos?.length || 0})</span>
            </button>

            {/* Split View toggle: Chat First on Left, Plan Aside on Right */}
            <button
              type="button"
              onClick={() => setWorkspaceMode(prev => prev === 'split' ? 'chat' : 'split')}
              className={`hidden md:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg transition-all cursor-pointer ml-0.5 ${
                workspaceMode === 'split'
                  ? 'bg-blue-600 text-white shadow-xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
              title={workspaceMode === 'split' ? "Single Column Mode" : "Side-by-Side: Chat First + Plan Aside"}
            >
              <Columns size={13} />
              <span className="hidden xl:inline text-[11px]">Chat + Plan Aside</span>
            </button>
          </div>

        </div>
      </div>

      {/* 
        Main Dynamic Workspace Canvas
        Adaptive column configuration based on workspaceMode:
        - 'split': Chat First on Left (Primary), Exercise Plan Studio on Right (Aside!)
        - 'chat': Full-Width Chat Messenger
        - 'plan': Full-Width Care Plan & Video Studio
      */}
      <div className="flex-1 p-3.5 lg:p-4 z-10 overflow-y-auto lg:overflow-hidden scrollbar-thin flex flex-col relative min-h-0">
        <div className={`w-full flex-1 min-h-0 transition-all duration-300 ${
          workspaceMode === 'split'
            ? 'grid grid-cols-1 xl:grid-cols-12 gap-5 h-full'
            : 'flex flex-col h-full'
        }`}>
          
          {/* Column 1: PRIORITY CHAT INTERFACE (CHAT FIRST!) */}
          {workspaceMode !== 'plan' && (
            <div className={`min-h-[500px] lg:min-h-0 h-full flex flex-col transition-all duration-300 animate-fade-in ${
              workspaceMode === 'split' ? 'xl:col-span-6 w-full' : 'w-full'
            }`}>
              <ChatInterface 
                patient={patient} 
                onSendMessage={onSendMessage}
                onUpdatePatient={onUpdatePatient}
                targetedNotification={targetedNotification}
                onClearTargetedNotification={onClearTargetedNotification}
                isExpanded={workspaceMode === 'chat'}
                onToggleExpand={() => setWorkspaceMode(prev => prev === 'chat' ? 'split' : 'chat')}
                onOpenPlanContainer={handleOpenPlanModal}
                onOpenPlanAside={() => setWorkspaceMode('split')}
              />
            </div>
          )}

          {/* Column 2: ASIDE EXERCISE PLAN STUDIO (BUILD PLANS ASIDE!) */}
          {workspaceMode !== 'chat' && (
            <div className={`min-h-[500px] lg:min-h-0 h-full flex flex-col transition-all duration-300 animate-fade-in overflow-hidden ${
              workspaceMode === 'split' ? 'xl:col-span-6 w-full' : 'w-full'
            }`}>
              <VideoAssignment 
                patient={patient}
                onAssignVideo={onAssignVideo}
                onToggleCollapse={() => setWorkspaceMode('chat')}
                isExpanded={workspaceMode === 'plan'}
                onToggleExpand={() => setWorkspaceMode(prev => prev === 'plan' ? 'split' : 'plan')}
                onUpdatePatient={onUpdatePatient}
                onSwitchToChat={() => setWorkspaceMode('chat')}
              />
            </div>
          )}
          
        </div>

        {/* Floating Quick Action between Plan and Chat for seamless workflow */}
        {workspaceMode === 'chat' && (
          <button
            onClick={() => setWorkspaceMode('split')}
            className="hidden lg:flex fixed right-0 top-1/2 -translate-y-1/2 bg-white hover:bg-blue-50 border-l-2 border-y border-l-blue-600 border-gray-200 shadow-xl px-2.5 py-4 rounded-l-xl text-gray-700 hover:text-blue-600 flex-col items-center space-y-2 transition-all z-20 group cursor-pointer hover:shadow-2xl"
            title="Open Exercise Plan Builder Aside"
            id="floating-reopen-video-btn"
          >
            <div className="w-7 h-7 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-colors">
              <ChevronLeft size={16} className="group-hover:-translate-x-0.5 transition-transform" />
            </div>
            <span className="text-[11px] font-bold tracking-wider [writing-mode:vertical-lr] text-gray-600 group-hover:text-blue-600 uppercase select-none">
              Exercise Plan
            </span>
          </button>
        )}
      </div>

      {/* Hospital Intake Medical Report Modal */}
      <MedicalReportModal 
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
        patient={patient}
      />

      {/* Prescribed Plan of Videos Container Modal */}
      <PlanOfVideosModal 
        isOpen={isPlanModalOpen}
        onClose={() => setIsPlanModalOpen(false)}
        patient={patient}
        initialVideo={selectedPlanModalVideo}
        onOpenCarePlanStudio={() => {
          setIsPlanModalOpen(false);
          setWorkspaceMode('plan');
        }}
      />
      
    </div>
  );
}
