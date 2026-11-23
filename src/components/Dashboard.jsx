import React, { useState, useRef, useEffect } from 'react';
import { AlertCircle, Clock, CheckCircle2, MessageSquare, Video, Calendar, ArrowRight, Activity, Users, TrendingUp, PlayCircle, Stethoscope, LogOut } from 'lucide-react';
import { fetchDashboardSummary } from '../api/client';
import { isPatientAssignedToDoctor } from '../utils/doctorHelpers';

export default function Dashboard({ 
  patients = [], 
  onNavigate, 
  doctor = null,
  _verifiedDoctors = [],
  _onSelectDoctor = null,
  onLogout = null
}) {
  const [isPlayingVideo, setIsPlayingVideo] = useState(false);
  const [dbSummary, setDbSummary] = useState(null);
  const dashboardVideoRef = useRef(null);

  useEffect(() => {
    fetchDashboardSummary()
      .then(data => setDbSummary(data))
      .catch(() => {});
  }, []);

  // Filter patients assigned strictly to the currently active doctor
  const myAssignedPatients = patients.filter(p => isPatientAssignedToDoctor(p, doctor));
  const activeCohort = myAssignedPatients;
  const totalPatients = activeCohort.length;
  const avgAdherence = totalPatients > 0 
    ? Math.round(activeCohort.reduce((sum, p) => sum + (p.adherenceScore || 0), 0) / totalPatients) 
    : 0;

  // Real items needing clinician attention for this specific doctor's cohort
  const realAttentionItems = [];
  activeCohort.forEach(p => {
    if (p.adherenceScore < 60) {
      realAttentionItems.push({
        id: p.id,
        name: p.name,
        reason: `Low Adherence (${p.adherenceScore}%) - Missed protocol`,
        time: 'Needs Follow-up',
        type: 'alert'
      });
    }
    const lastMsg = p.messages?.[p.messages.length - 1];
    if (lastMsg && lastMsg.sender === 'patient') {
      realAttentionItems.push({
        id: p.id,
        name: p.name,
        reason: `Patient Message: "${lastMsg.text?.slice(0, 45) || 'Question'}..."`,
        time: lastMsg.timestamp || 'Today',
        type: 'message'
      });
    }
  });

  const primaryPatient = activeCohort[0] || null;
  const primaryName = primaryPatient?.name || (totalPatients === 0 ? 'No Assigned Patients' : 'Cohort');

  const needsAttention = realAttentionItems.slice(0, 5);

  const todaySchedule = dbSummary?.todaySchedule?.length > 0 ? dbSummary.todaySchedule : [
    { id: 1, name: primaryName, type: 'Telehealth Evaluation & ROM Check', time: '10:00 AM', status: 'upcoming' },
    ...(patients.length > 1 ? [
      { id: 2, name: patients[1].name, type: 'Progress Review', time: '1:30 PM', status: 'upcoming' }
    ] : [])
  ];

  const totalExercisesAssigned = patients.reduce((sum, p) => sum + (p.activeVideos?.length || 0), 0);

  const activityFeed = dbSummary?.activityFeed?.length > 0 
    ? dbSummary.activityFeed 
    : [
        { id: 1, text: `${primaryName} completed Supine Heel Slides with 95% AI form accuracy`, time: '15 mins ago', type: 'exercise' },
        { id: 2, text: `${primaryName} reached a ${primaryPatient?.consistencyStreak || 14}-day streak under Dr. Alex`, time: 'Today', type: 'milestone' }
      ];

  return (
    <div className="flex-1 overflow-y-auto bg-transparent p-6 md:p-8 animate-fade-in relative">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Welcome Header */}
        <div className="relative overflow-hidden bg-gradient-to-r from-sky-600 via-blue-600 to-cyan-600 rounded-3xl p-6 sm:p-7 text-white shadow-xl shadow-sky-500/20 flex flex-col md:flex-row items-start md:items-center justify-between gap-5 animate-slide-up border border-white/20">
          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3"></div>
          
          <div className="relative z-10">
            <h1 className="text-xl sm:text-2xl font-bold mb-1.5 tracking-tight">
              Welcome back, {doctor?.shortName || doctor?.name?.split(',')[0] || 'Dr. Alex Vance'}
            </h1>
            <p className="text-sky-100 text-xs font-semibold mb-1.5">
              Attending at {doctor?.clinic || 'VirtuHeal Center for Advanced Human Performance'}
            </p>
            <p className="text-sky-50 text-xs sm:text-sm max-w-xl leading-relaxed">
              You have <span className="font-bold text-white bg-white/20 px-2 py-0.5 rounded-md mx-1">{needsAttention.length} patients</span> requiring follow-up or attention today. Average cohort adherence is <span className="font-bold text-white bg-white/20 px-2 py-0.5 rounded-md mx-1">{avgAdherence}%</span>.
            </p>
          </div>
          
          <div className="relative z-10 flex items-center gap-2.5">
            {onLogout && (
              <button 
                type="button"
                onClick={onLogout}
                className="px-3.5 py-2.5 bg-white/15 hover:bg-rose-600/90 text-white font-bold rounded-xl text-xs border border-white/25 hover:border-rose-400 transition-all flex items-center gap-1.5 active:scale-95 cursor-pointer shadow-sm backdrop-blur-xs"
                title="Sign out of Doctor Portal"
                id="dashboard-doctor-logout-btn"
              >
                <LogOut size={14} />
                <span>Sign Out</span>
              </button>
            )}
            <button 
              onClick={() => onNavigate('patients')}
              className="px-5 py-2.5 bg-white text-sky-800 font-bold rounded-xl text-xs hover:bg-sky-50 hover:scale-105 transition-all shadow-lg hover:shadow-xl flex items-center group active:scale-95 cursor-pointer"
            >
              Go to Workspace
              <ArrowRight size={15} className="ml-1.5 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        </div>

        {/* Section: Doctor Assigned Overview */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4 animate-slide-up" style={{ animationDelay: '50ms' }}>
          <div className="flex items-center space-x-3.5 min-w-0">
            <div className="w-11 h-11 rounded-2xl bg-sky-50 border border-sky-200 text-sky-700 flex items-center justify-center shrink-0 shadow-xs">
              <Stethoscope size={22} />
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase tracking-wider bg-sky-50 text-sky-700 px-2 py-0.5 rounded-md border border-sky-200 flex items-center gap-1">
                  <Stethoscope size={11} />
                  <span>Doctor Assigned</span>
                </span>
                <span className="text-xs text-slate-400 font-mono">
                  {doctor?.license || 'Verified Staff'}
                </span>
              </div>
              <h2 className="text-base sm:text-lg font-black text-slate-900 truncate mt-0.5">
                {doctor?.name || 'Dr. Alex Vance, PT, DPT, PhD'}
              </h2>
              <p className="text-xs text-slate-500 truncate">
                {doctor?.title || 'Chief of Physical Rehabilitation'} • {doctor?.clinic || 'VirtuHeal Hospital'}
              </p>
            </div>
          </div>
        </div>

        {/* Key Metrics Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-slide-up" style={{ animationDelay: '100ms' }}>
          {[
            { label: 'Active Cohort Patients', value: totalPatients.toString(), icon: Users, color: 'text-white', bg: 'bg-gradient-to-tr from-blue-600 to-indigo-600 shadow-md shadow-blue-500/25', trend: 'Live from SQLite DB' },
            { label: 'Cohort Adherence Rate', value: `${avgAdherence}%`, icon: Activity, color: 'text-white', bg: 'bg-gradient-to-tr from-sky-500 to-blue-600 shadow-md shadow-sky-500/25', trend: 'Calculated dynamically' },
            { label: 'Active Routines Prescribed', value: totalExercisesAssigned.toString(), icon: TrendingUp, color: 'text-white', bg: 'bg-gradient-to-tr from-cyan-500 to-sky-600 shadow-md shadow-cyan-500/25', trend: 'Prescription catalog' }
          ].map((stat, i) => (
            <div key={i} className="glass-panel p-5 rounded-2xl flex items-start justify-between group hover:-translate-y-1 hover:border-sky-300 transition-all duration-300">
              <div>
                <p className="text-xs font-semibold text-slate-500 mb-1">{stat.label}</p>
                <h3 className="text-2xl font-bold text-slate-800">{stat.value}</h3>
                <p className="text-[11px] font-medium text-sky-600 mt-1.5 flex items-center">
                  <TrendingUp size={11} className="mr-1" /> {stat.trend}
                </p>
              </div>
              <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${stat.bg} ${stat.color} group-hover:scale-110 transition-transform duration-300`}>
                <stat.icon size={20} />
              </div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Main Content Column */}
          <div className="lg:col-span-2 space-y-8 animate-slide-up" style={{ animationDelay: '200ms' }}>
            
            {/* Needs Attention */}
            <div className="glass-panel rounded-2xl overflow-hidden">
              <div className="px-5 py-4 border-b border-slate-200/60 bg-white/40 flex items-center justify-between">
                <div className="flex items-center space-x-2.5">
                  <div className="relative flex items-center justify-center">
                    <AlertCircle className="text-rose-500 w-4 h-4 relative z-10" />
                    <span className="absolute inset-0 bg-rose-400 rounded-full blur-md opacity-40 animate-pulse"></span>
                  </div>
                  <h2 className="text-base font-bold text-slate-800 tracking-tight">Needs Attention</h2>
                </div>
                <span className="bg-rose-100 text-rose-700 text-[11px] font-bold px-2.5 py-0.5 rounded-full shadow-2xs">
                  {needsAttention.length} Items
                </span>
              </div>
              
              <ul className="divide-y divide-slate-100">
                {needsAttention.length === 0 ? (
                  <li className="p-8 text-center text-xs text-slate-400">
                    {totalPatients === 0 
                      ? "No patients assigned to your care yet. Hospital cohort directory is available in Patients & Workspace."
                      : "All assigned patients are currently on schedule with their recovery protocols."}
                  </li>
                ) : (
                  needsAttention.map((item, idx) => (
                  <li key={idx} 
                      className="p-4 hover:bg-white/60 transition-all flex items-center justify-between group cursor-pointer" 
                      onClick={() => onNavigate('patients', item.id)}>
                    <div className="flex items-center space-x-3.5">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-2xs transition-transform group-hover:scale-105 group-hover:-rotate-3 ${item.type === 'message' ? 'bg-gradient-to-br from-blue-100 to-blue-200 text-blue-600 border border-blue-200' : 'bg-gradient-to-br from-rose-100 to-rose-200 text-rose-600 border border-rose-200'}`}>
                        {item.type === 'message' ? <MessageSquare size={17} /> : <AlertCircle size={17} />}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-slate-800 group-hover:text-sky-600 transition-colors">{item.name}</p>
                        <p className="text-xs font-medium text-slate-500 mt-0.5">{item.reason}</p>
                      </div>
                    </div>
                    <div className="text-right flex flex-col items-end">
                      <span className="text-[11px] text-slate-400 font-semibold bg-slate-100/80 px-2 py-0.5 rounded-md">{item.time}</span>
                      <div className="mt-1.5 opacity-0 translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300">
                        <span className="text-xs text-sky-600 font-bold flex items-center bg-sky-50 px-2.5 py-0.5 rounded-full">
                          Review <ArrowRight size={12} className="ml-1" />
                        </span>
                      </div>
                    </div>
                  </li>
                )))}
              </ul>
            </div>

            {/* Today's Schedule */}
            <div className="glass-panel rounded-2xl overflow-hidden">
              <div className="px-5 py-4 border-b border-slate-200/60 bg-white/40 flex items-center justify-between">
                <div className="flex items-center space-x-2.5">
                  <div className="bg-blue-100 p-1.5 rounded-lg text-blue-600">
                    <Calendar className="w-4 h-4" />
                  </div>
                  <h2 className="text-base font-bold text-slate-800 tracking-tight">Today's Schedule</h2>
                </div>
                <button className="text-xs font-bold text-sky-600 hover:text-sky-700 bg-sky-50 hover:bg-sky-100 px-3 py-1 rounded-full transition-colors cursor-pointer">
                  View Full
                </button>
              </div>
              <ul className="divide-y divide-slate-100 p-2">
                {todaySchedule.map((apt) => (
                  <li key={apt.id} className="p-4 flex items-center space-x-5 hover:bg-slate-50/80 rounded-xl transition-colors group cursor-pointer">
                    <div className="w-20 text-center shrink-0 bg-white shadow-sm border border-slate-100 rounded-xl py-2 group-hover:border-sky-200 transition-colors">
                      <p className="text-sm font-extrabold text-slate-800">{apt.time.split(' ')[0]}</p>
                      <p className="text-[10px] uppercase text-sky-600 font-bold">{apt.time.split(' ')[1]}</p>
                    </div>
                    <div className="flex-1">
                      <p className="text-base font-bold text-slate-800 group-hover:text-sky-600 transition-colors">{apt.name}</p>
                      <div className="flex items-center text-sm text-slate-500 mt-1.5 font-medium">
                        {apt.type.includes('Telehealth') ? (
                          <span className="flex items-center bg-blue-50 text-blue-600 px-2 py-0.5 rounded-md text-xs">
                            <Video size={14} className="mr-1.5" /> {apt.type}
                          </span>
                        ) : (
                          <span className="flex items-center bg-purple-50 text-purple-600 px-2 py-0.5 rounded-md text-xs">
                            <Clock size={14} className="mr-1.5" /> {apt.type}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="w-10 h-10 rounded-full border-2 border-slate-200 flex items-center justify-center text-slate-300 group-hover:border-sky-500 group-hover:text-sky-500 transition-all bg-white">
                      <CheckCircle2 size={20} />
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Activity Feed Column */}
          <div className="space-y-6 animate-slide-up" style={{ animationDelay: '300ms' }}>
            <div className="glass-panel rounded-2xl overflow-hidden h-full flex flex-col">
              <div className="px-5 py-4 border-b border-slate-200/60 bg-white/40">
                <h2 className="text-base font-bold text-slate-800 tracking-tight flex items-center">
                  <Activity size={18} className="text-sky-500 mr-2" /> Live Activity Feed
                </h2>
              </div>
              <div className="p-6 relative flex-1 flex flex-col">
                {/* Timeline line */}
                <div className="absolute top-8 bottom-24 left-8 w-[2px] bg-gradient-to-b from-sky-200 to-slate-200 rounded-full"></div>
                
                <ul className="space-y-8 relative flex-1">
                  {activityFeed.map((activity, index) => (
                    <li key={activity.id} className="flex items-start group">
                      <div className={`w-4 h-4 rounded-full border-4 shrink-0 mt-1 z-10 transition-transform group-hover:scale-125 duration-300 ${index === 0 ? 'bg-sky-500 border-sky-100 shadow-[0_0_10px_rgba(14,165,233,0.5)]' : 'bg-white border-slate-300 group-hover:border-sky-400'}`}>
                      </div>
                      <div className="ml-5 bg-white/60 p-3 rounded-xl border border-slate-100 shadow-sm group-hover:shadow-md group-hover:border-sky-100 transition-all flex-1">
                        <p className="text-sm font-semibold text-slate-700 leading-tight group-hover:text-slate-900 transition-colors">{activity.text}</p>
                        <p className="text-xs text-slate-400 font-semibold mt-2 flex items-center">
                          <Clock size={10} className="mr-1" /> {activity.time}
                        </p>
                      </div>
                    </li>
                  ))}
                </ul>
                
                <button className="w-full mt-8 py-3 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-600 hover:bg-slate-50 hover:border-slate-300 hover:text-slate-800 transition-all shadow-sm">
                  Load More Activity
                </button>
              </div>
            </div>

            {/* Featured Live Exercise Video Box */}
            <div className="glass-panel rounded-2xl overflow-hidden shadow-lg border border-slate-200/80">
              <div className="px-5 py-4 border-b border-slate-200/60 bg-white/60 flex items-center justify-between">
                <div className="flex items-center space-x-2.5">
                  <div className="bg-blue-100 p-1.5 rounded-lg text-blue-600">
                    <Video size={16} />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-800">Squat Rehabilitation Protocol</h3>
                    <p className="text-[11px] text-slate-500">Real clinical exercise demonstration</p>
                  </div>
                </div>
                {isPlayingVideo ? (
                  <span className="flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-sky-50 text-sky-700 border border-sky-200">
                    <span className="w-1.5 h-1.5 rounded-full bg-sky-500 mr-1.5 animate-pulse"></span>
                    RUNNING
                  </span>
                ) : (
                  <span className="flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-500 mr-1.5"></span>
                    CLICK TO RUN
                  </span>
                )}
              </div>
              
              <div className="relative bg-slate-950 aspect-video w-full overflow-hidden flex items-center justify-center group">
                {isPlayingVideo ? (
                  <video
                    ref={dashboardVideoRef}
                    src="/videos/shoulder-abduction.mp4"
                    autoPlay
                    loop
                    playsInline
                    controls
                    onEnded={() => setIsPlayingVideo(false)}
                    className="w-full h-full object-cover animate-fade-in"
                  />
                ) : (
                  <div 
                    onClick={() => setIsPlayingVideo(true)}
                    className="relative w-full h-full cursor-pointer group/thumb select-none overflow-hidden"
                  >
                    <img 
                      src="https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80"
                      alt="Squat Rehabilitation Protocol"
                      className="w-full h-full object-cover group-hover/thumb:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/35 to-black/40 group-hover/thumb:via-black/25 flex flex-col items-center justify-center transition-all">
                      <div className="w-16 h-16 rounded-full bg-blue-600 text-white flex items-center justify-center shadow-xl group-hover/thumb:scale-110 group-hover/thumb:bg-blue-500 transition-all border-2 border-white/50">
                        <PlayCircle size={38} className="text-white fill-white/20 ml-0.5" />
                      </div>
                      <span className="mt-3 text-xs font-bold text-white tracking-wide uppercase bg-black/80 px-3.5 py-1 rounded-full border border-white/20 shadow-md">
                        Click to Run Exercise Video
                      </span>
                      <span className="text-[11px] text-slate-200 font-medium mt-1 drop-shadow">
                        Squat Rehabilitation Protocol
                      </span>
                    </div>
                  </div>
                )}

                <div className="absolute top-2.5 left-2.5 bg-black/75 backdrop-blur-md px-2 py-0.5 rounded text-[10px] font-semibold text-white pointer-events-none flex items-center shadow z-10">
                  <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${isPlayingVideo ? 'bg-sky-400 animate-pulse' : 'bg-blue-400'}`}></span>
                  Squat Rehab Protocol • 1:45
                </div>
              </div>
              
              <div className="p-4 bg-white/60 flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-slate-800">{primaryName} • {primaryPatient?.condition || 'ACL Rehab Routine'}</h4>
                  <p className="text-[10px] text-slate-500">Click video to watch form demonstration</p>
                </div>
                <button
                  onClick={() => onNavigate('patients')}
                  className="px-3 py-1.5 bg-sky-600 hover:bg-sky-700 text-white rounded-lg text-xs font-bold flex items-center transition-all shadow-sm hover:scale-105 active:scale-95"
                >
                  Go to Plan <ArrowRight size={12} className="ml-1" />
                </button>
              </div>
            </div>

          </div>

        </div>
      </div>
    </div>
  );
}

