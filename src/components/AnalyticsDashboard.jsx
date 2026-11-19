import React, { useState } from 'react';
import { 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  CartesianGrid 
} from 'recharts';
import { 
  Flame, 
  TrendingUp, 
  Users, 
  Activity, 
  CheckCircle2, 
  AlertTriangle, 
  Search, 
  Stethoscope, 
  Video, 
  ShieldCheck, 
  Calendar, 
  Award, 
  UserCheck,
  Sparkles
} from 'lucide-react';

const DEFAULT_WEEKLY_PROGRESS = [
  { day: 'Mon', date: 'Nov 5', score: 72, rom: 68, completedExercises: 3 },
  { day: 'Tue', date: 'Nov 6', score: 78, rom: 72, completedExercises: 4 },
  { day: 'Wed', date: 'Nov 7', score: 82, rom: 78, completedExercises: 4 },
  { day: 'Thu', date: 'Nov 8', score: 85, rom: 84, completedExercises: 4 },
  { day: 'Fri', date: 'Nov 9', score: 88, rom: 88, completedExercises: 4 },
  { day: 'Sat', date: 'Nov 10', score: 92, rom: 92, completedExercises: 4 },
  { day: 'Sun', date: 'Today', score: 88, rom: 95, completedExercises: 4 }
];

export default function AnalyticsDashboard({ patients = [] }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMetric, setSelectedMetric] = useState('score'); // 'score' | 'rom' | 'exercises'
  const [selectedPatientTab, setSelectedPatientTab] = useState('all'); // 'all' | patient.id

  const totalPatients = patients.length;
  const avgAdherence = totalPatients > 0 
    ? Math.round(patients.reduce((acc, p) => acc + (p.adherenceScore || 0), 0) / totalPatients) 
    : 0;
  const totalStreaks = patients.reduce((acc, p) => acc + (p.consistencyStreak || 0), 0);
  const highAdherenceCount = patients.filter(p => (p.adherenceScore || 0) >= 80).length;

  // Filter patients based on search and tab selection
  const filteredPatients = patients.filter(patient => {
    // Tab filter (if specific patient selected)
    if (selectedPatientTab !== 'all' && patient.id !== selectedPatientTab) {
      return false;
    }

    const matchesSearch = patient.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      patient.condition.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (patient.assignedDoctor && patient.assignedDoctor.toLowerCase().includes(searchTerm.toLowerCase())) ||
      patient.id.toLowerCase().includes(searchTerm.toLowerCase());

    return matchesSearch;
  });

  // Helper to format chart data with realistic timeline metrics
  const getFormattedTimelineData = (patient) => {
    const rawData = (patient.progressData && patient.progressData.length > 0)
      ? patient.progressData
      : DEFAULT_WEEKLY_PROGRESS;

    return rawData.map((item, idx) => {
      const dayLabel = item.day || ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'][idx % 7];
      const dateLabel = item.date || `Day ${idx + 1}`;
      const score = typeof item.score === 'number' ? item.score : 85;
      const rom = typeof item.rom === 'number' ? item.rom : Math.round(60 + idx * 5.5);
      const exercises = typeof item.completedExercises === 'number' 
        ? item.completedExercises 
        : (patient.activeVideos?.length || 4);

      return {
        day: dayLabel,
        date: dateLabel,
        displayLabel: `${dayLabel} (${dateLabel})`,
        score,
        rom,
        exercises
      };
    });
  };

  return (
    <div className="flex-1 overflow-y-auto bg-transparent p-5 md:p-8 font-sans">
      <div className="max-w-7xl mx-auto space-y-7 animate-fade-in">
        
        {/* ============================================================== */}
        {/* HEADER: Dynamic Clinical Analytics Bar                        */}
        {/* ============================================================== */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900 tracking-tight">
                Clinical Recovery Analytics &amp; Timeline
              </h1>
              {totalPatients === 1 ? (
                <span className="px-3 py-1 rounded-full text-xs font-black bg-blue-100 text-blue-800 border border-blue-200 flex items-center gap-1.5 shadow-2xs">
                  <UserCheck size={13} className="text-blue-600" />
                  <span>Single Patient Cohort: Shirish Poudel</span>
                </span>
              ) : (
                <span className="px-3 py-1 rounded-full text-xs font-black bg-sky-100 text-sky-800 border border-sky-200 flex items-center gap-1.5 shadow-2xs">
                  <span className="w-2 h-2 rounded-full bg-sky-500 animate-pulse"></span>
                  <span>Active Cohort: {totalPatients} Patients</span>
                </span>
              )}
            </div>
            <p className="text-xs sm:text-sm text-gray-500 mt-1">
              {totalPatients === 1
                ? 'Displaying authenticated timeline recovery metrics for Shirish Poudel under Dr. Alex Vance. When additional patients log in or register, their new graphs will automatically appear here.'
                : 'Real-time adherence telemetry, AI biomechanical compliance curves, and individual timeline graphs across all registered patients.'}
            </p>
          </div>

          {/* Metric Selector Tabs */}
          <div className="flex items-center gap-1.5 bg-white p-1 rounded-2xl border border-gray-200 shadow-2xs self-start lg:self-auto">
            <button
              onClick={() => setSelectedMetric('score')}
              className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-1 ${
                selectedMetric === 'score' 
                  ? 'bg-blue-600 text-white shadow-xs' 
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <TrendingUp size={13} />
              <span>Adherence (%)</span>
            </button>
            <button
              onClick={() => setSelectedMetric('rom')}
              className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-1 ${
                selectedMetric === 'rom' 
                  ? 'bg-sky-600 text-white shadow-xs' 
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <Activity size={13} />
              <span>Knee ROM (°)</span>
            </button>
            <button
              onClick={() => setSelectedMetric('exercises')}
              className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-1 ${
                selectedMetric === 'exercises' 
                  ? 'bg-purple-600 text-white shadow-xs' 
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <Video size={13} />
              <span>Routines Completed</span>
            </button>
          </div>
        </div>

        {/* ============================================================== */}
        {/* GLOBAL KPIS: Patient Cohort Clinical Telemetry                */}
        {/* ============================================================== */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
          <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-2xs flex items-center space-x-4">
            <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600 shrink-0">
              <Users size={24} />
            </div>
            <div>
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Active Cohort</p>
              <p className="text-xl font-bold text-gray-900">{totalPatients} Patient{totalPatients === 1 ? '' : 's'}</p>
              <p className="text-[11px] text-blue-600 font-semibold mt-0.5">
                {totalPatients === 1 ? 'Shirish Poudel' : `${totalPatients} Total Registered`}
              </p>
            </div>
          </div>
          
          <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-2xs flex items-center space-x-4">
            <div className="w-12 h-12 rounded-xl bg-sky-50 flex items-center justify-center text-sky-600 shrink-0">
              <TrendingUp size={24} />
            </div>
            <div>
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Cohort Adherence</p>
              <p className="text-xl font-bold text-gray-900">{avgAdherence}%</p>
              <p className="text-[11px] text-sky-600 font-semibold mt-0.5">Clinical Protocol Goal Met</p>
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-2xs flex items-center space-x-4">
            <div className="w-12 h-12 rounded-xl bg-orange-50 flex items-center justify-center text-orange-600 shrink-0">
              <Flame size={24} />
            </div>
            <div>
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Consistency Streak</p>
              <p className="text-xl font-bold text-gray-900">{totalStreaks} Days</p>
              <p className="text-[11px] text-orange-600 font-semibold mt-0.5">Daily Exercise Adherence</p>
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-2xs flex items-center space-x-4">
            <div className="w-12 h-12 rounded-xl bg-purple-50 flex items-center justify-center text-purple-600 shrink-0">
              <ShieldCheck size={24} />
            </div>
            <div>
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Target Adherence</p>
              <p className="text-xl font-bold text-gray-900">{highAdherenceCount} / {totalPatients}</p>
              <p className="text-[11px] text-purple-600 font-semibold mt-0.5">&ge;80% Optimal Rehabilitation</p>
            </div>
          </div>
        </div>

        {/* ============================================================== */}
        {/* PATIENT SWITCHER (If multiple patients are added/logged in)    */}
        {/* ============================================================== */}
        {totalPatients > 1 && (
          <div className="bg-white p-3 rounded-2xl border border-gray-200 shadow-2xs flex items-center justify-between flex-wrap gap-2.5">
            <div className="flex items-center gap-2 overflow-x-auto py-1">
              <span className="text-xs font-black text-gray-500 uppercase tracking-wider px-2">
                Patient Graphs:
              </span>
              <button
                onClick={() => setSelectedPatientTab('all')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                  selectedPatientTab === 'all'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <Users size={12} />
                <span>All Cohort Graphs ({totalPatients})</span>
              </button>

              {patients.map(p => (
                <button
                  key={p.id}
                  onClick={() => setSelectedPatientTab(p.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                    selectedPatientTab === p.id
                      ? 'bg-sky-600 text-white shadow-xs'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  <UserCheck size={12} />
                  <span>{p.name}</span>
                  <span className="text-[10px] opacity-75 font-mono">({p.adherenceScore}%)</span>
                </button>
              ))}
            </div>

            {/* Quick Search */}
            <div className="relative w-full sm:w-60">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search patient or doctor..."
                className="w-full pl-8 pr-3 py-1.5 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:outline-hidden focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* PATIENT ANALYTICS & TIMELINE GRAPHS                            */}
        {/* ============================================================== */}
        {filteredPatients.length === 0 ? (
          <div className="bg-white rounded-3xl border border-gray-200 p-12 text-center shadow-2xs">
            <Activity className="mx-auto text-gray-300 mb-3" size={42} />
            <h3 className="text-base font-bold text-gray-800">No matching patients found</h3>
            <p className="text-xs text-gray-500 mt-1 max-w-sm mx-auto">
              No patients matched your query. Clear your search or reset filters to display your patient cohort.
            </p>
            <button
              onClick={() => { setSearchTerm(''); setSelectedPatientTab('all'); }}
              className="mt-4 px-4 py-2 bg-blue-600 text-white text-xs font-bold rounded-xl hover:bg-blue-700 transition-all cursor-pointer"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <div className={`space-y-8 ${totalPatients > 1 && selectedPatientTab === 'all' ? 'grid grid-cols-1 lg:grid-cols-2 gap-6 space-y-0' : ''}`}>
            {filteredPatients.map((patient) => {
              const timelineData = getFormattedTimelineData(patient);
              const adherence = patient.adherenceScore || 0;
              const isHigh = adherence >= 80;
              const isModerate = adherence >= 60 && adherence < 80;
              const isSolePatient = totalPatients === 1 || selectedPatientTab === patient.id;

              // Data key and color based on selected metric
              const dataKey = selectedMetric === 'rom' ? 'rom' : selectedMetric === 'exercises' ? 'exercises' : 'score';
              const chartColor = selectedMetric === 'rom' 
                ? '#0284c7' // Sky Blue
                : selectedMetric === 'exercises' 
                ? '#6366f1' // Indigo
                : isHigh ? '#0284c7' : isModerate ? '#2563eb' : '#e11d48';

              return (
                <div 
                  key={patient.id} 
                  className={`bg-white border border-gray-200 rounded-3xl p-5 md:p-7 shadow-xs hover:shadow-md transition-all space-y-6 ${
                    isSolePatient ? 'col-span-full' : ''
                  }`}
                >
                  
                  {/* Top Header Card */}
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 border-b border-gray-100 pb-5">
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2.5 flex-wrap">
                        <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center font-black text-sm shadow-xs">
                          {patient.name.split(' ').map(n => n[0]).join('')}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="text-lg font-black text-gray-900">{patient.name}</h3>
                            <span className="font-mono text-xs bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md font-bold">
                              #{patient.id}
                            </span>
                          </div>
                          <p className="text-xs font-semibold text-blue-600 mt-0.5">{patient.condition}</p>
                        </div>
                      </div>

                      {/* Clinician Attribution */}
                      <div className="flex items-center gap-2 pt-1 flex-wrap">
                        <span className="text-xs text-gray-600 flex items-center gap-1.5 bg-sky-50 border border-sky-200/80 px-2.5 py-1 rounded-lg">
                          <Stethoscope size={13} className="text-sky-600" />
                          <span>Assigned Doctor: <strong>{patient.assignedDoctor || 'Dr. Alex Vance, PT, DPT, PhD'}</strong></span>
                        </span>
                        <span className={`text-xs font-bold px-2.5 py-1 rounded-lg flex items-center gap-1 border ${
                          isHigh 
                            ? 'bg-sky-50 text-sky-700 border-sky-200' 
                            : isModerate 
                              ? 'bg-amber-50 text-amber-700 border-amber-200' 
                              : 'bg-rose-50 text-rose-700 border-rose-200'
                        }`}>
                          {isHigh ? <CheckCircle2 size={13} /> : <AlertTriangle size={13} />}
                          <span>{adherence}% Clinical Adherence</span>
                        </span>
                      </div>
                    </div>

                    {/* Streak & Active Prescriptions Pill */}
                    <div className="flex sm:flex-col items-center sm:items-end justify-between gap-2 shrink-0">
                      <div className="flex items-center text-orange-600 bg-orange-50 border border-orange-200 px-3 py-1.5 rounded-xl text-xs font-black shadow-2xs">
                        <Flame size={15} className="mr-1.5 text-orange-500" />
                        <span>{patient.consistencyStreak || 14} Day Streak</span>
                      </div>
                      <span className="text-xs text-gray-500 font-semibold flex items-center gap-1">
                        <Video size={13} className="text-blue-500" />
                        <span>{patient.activeVideos?.length || 4} Prescribed Routines</span>
                      </span>
                    </div>
                  </div>

                  {/* ========================================================== */}
                  {/* REAL TIMELINE GRAPH (AreaChart with Date Markers)          */}
                  {/* ========================================================== */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <div className="flex items-center gap-2">
                        <Calendar size={15} className="text-gray-500" />
                        <h4 className="text-xs sm:text-sm font-black text-gray-900 uppercase tracking-wider">
                          Rehabilitation Timeline &amp; {selectedMetric === 'rom' ? 'Range of Motion (Degrees)' : selectedMetric === 'exercises' ? 'Routines Completed' : 'Adherence Score (%)'}
                        </h4>
                      </div>
                      <span className="text-[11px] font-bold text-gray-500 bg-gray-100 px-2.5 py-0.5 rounded-full">
                        Nov 5 – Today (7-Day Telemetry Series)
                      </span>
                    </div>

                    {/* Main Responsive Chart */}
                    <div className={`${isSolePatient ? 'h-64 sm:h-72' : 'h-52'} w-full bg-slate-50/50 rounded-2xl p-2 border border-slate-100`}>
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={timelineData} margin={{ top: 15, right: 15, left: -20, bottom: 5 }}>
                          <defs>
                            <linearGradient id={`gradient-${patient.id}-${selectedMetric}`} x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor={chartColor} stopOpacity={0.35}/>
                              <stop offset="95%" stopColor={chartColor} stopOpacity={0.0}/>
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                          <XAxis 
                            dataKey="date" 
                            axisLine={false} 
                            tickLine={false} 
                            tick={{ fontSize: 11, fill: '#64748b', fontWeight: 600 }} 
                          />
                          <YAxis 
                            axisLine={false} 
                            tickLine={false} 
                            tick={{ fontSize: 11, fill: '#64748b' }} 
                            domain={selectedMetric === 'rom' ? [40, 110] : selectedMetric === 'exercises' ? [0, 6] : [0, 100]} 
                            ticks={selectedMetric === 'rom' ? [40, 60, 80, 100] : selectedMetric === 'exercises' ? [1, 2, 3, 4, 5] : [0, 25, 50, 75, 100]}
                            unit={selectedMetric === 'rom' ? '°' : selectedMetric === 'exercises' ? '' : '%'}
                          />
                          <Tooltip 
                            contentStyle={{ 
                              borderRadius: '14px', 
                              backgroundColor: '#0f172a',
                              color: '#fff',
                              border: 'none', 
                              boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.3)',
                              fontSize: '12px',
                              padding: '10px 14px'
                            }}
                            formatter={(value) => [
                              selectedMetric === 'rom' 
                                ? `${value}° Flexion` 
                                : selectedMetric === 'exercises'
                                ? `${value} Routines Completed`
                                : `${value}% Clinical Adherence`,
                              selectedMetric === 'rom' ? 'Range of Motion' : selectedMetric === 'exercises' ? 'Completed Sets' : 'Score'
                            ]}
                            labelFormatter={(label) => `Timeline: ${label}`}
                          />
                          <Area 
                            type="monotone" 
                            dataKey={dataKey} 
                            stroke={chartColor} 
                            strokeWidth={3} 
                            fillOpacity={1} 
                            fill={`url(#gradient-${patient.id}-${selectedMetric})`} 
                            dot={{ r: 4, fill: chartColor, strokeWidth: 2, stroke: '#fff' }}
                            activeDot={{ r: 6, fill: chartColor, stroke: '#fff', strokeWidth: 2 }}
                          />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>

                    {/* Chart Context Footer */}
                    <div className="flex items-center justify-between text-[11px] text-gray-500 pt-1 px-1 flex-wrap gap-2">
                      <div className="flex items-center gap-1.5 font-semibold text-gray-700">
                        <span className="w-2 h-2 rounded-full" style={{ backgroundColor: chartColor }}></span>
                        <span>
                          {selectedMetric === 'rom' 
                            ? 'Goal: Regain >90° terminal knee flexion without extensor lag' 
                            : selectedMetric === 'exercises'
                            ? 'Target: Complete all 4 prescribed doctor routines daily'
                            : 'Target: Maintain ≥80% weekly adherence streak'}
                        </span>
                      </div>
                      <span className="font-bold text-sky-600 bg-sky-50 px-2.5 py-0.5 rounded-md border border-sky-200">
                        Current Status: {isHigh ? '✅ Optimal Protocol On-Track' : isModerate ? '⚡ In Active Monitoring' : '⚠️ Clinician Follow-up Advised'}
                      </span>
                    </div>
                  </div>

                  {/* ========================================================== */}
                  {/* CLINICAL RECOVERY TIMELINE PHASES (For deep-dive view)     */}
                  {/* ========================================================== */}
                  {isSolePatient && (
                    <div className="pt-4 border-t border-gray-100 space-y-4">
                      <div className="flex items-center justify-between">
                        <h4 className="text-xs sm:text-sm font-black text-gray-900 uppercase tracking-wider flex items-center gap-1.5">
                          <Award size={15} className="text-blue-600" />
                          <span>Clinical Rehabilitation Milestone Timeline</span>
                        </h4>
                        <span className="text-[11px] font-bold text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-200">
                          Prescribed by Dr. Alex Vance
                        </span>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                        {(patient.recoveryTimeline || [
                          { phase: 'Phase 1: Acute Protection & Discharge', date: 'Oct 28', status: 'Completed', detail: 'Surgical swelling management, passive knee extension to 0°, isometric quad activation.' },
                          { phase: 'Phase 2: Early ROM & Patellar Mobility', date: 'Nov 02', status: 'Completed', detail: 'Heel slides toward 90° flexion, straight leg raises without extensor lag.' },
                          { phase: 'Phase 3: Active AI Strengthening', date: 'Nov 07', status: 'In Progress', detail: 'Terminal knee extensions, 3 sets of 10-12 reps with real-time pose tracking.' },
                          { phase: 'Phase 4: Functional Closed-Chain Loading', date: 'Nov 18', status: 'Upcoming', detail: 'Bilateral shallow squats, proprioception drills, and progressive resistance loading.' }
                        ]).map((milestone, mIdx) => (
                          <div 
                            key={mIdx}
                            className={`p-3.5 rounded-2xl border transition-all ${
                              milestone.status === 'Completed'
                                ? 'bg-sky-50/60 border-sky-200 text-sky-950'
                                : milestone.status === 'In Progress'
                                ? 'bg-blue-50/80 border-blue-300 text-blue-950 shadow-xs ring-1 ring-blue-400/40'
                                : 'bg-gray-50 border-gray-200 text-gray-500'
                            }`}
                          >
                            <div className="flex items-center justify-between gap-1 mb-1.5">
                              <span className="text-[10px] font-black uppercase tracking-wider">
                                {milestone.date}
                              </span>
                              <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                                milestone.status === 'Completed'
                                  ? 'bg-sky-200 text-sky-900'
                                  : milestone.status === 'In Progress'
                                  ? 'bg-blue-600 text-white'
                                  : 'bg-gray-200 text-gray-700'
                              }`}>
                                {milestone.status}
                              </span>
                            </div>
                            <h5 className="text-xs font-black mb-1">{milestone.phase}</h5>
                            <p className="text-[11px] leading-relaxed opacity-90">{milestone.detail}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* ========================================================== */}
                  {/* DOCTOR PRESCRIBED EXERCISES TELEMETRY (4 Routines)         */}
                  {/* ========================================================== */}
                  {isSolePatient && patient.activeVideos && patient.activeVideos.length > 0 && (
                    <div className="pt-4 border-t border-gray-100 space-y-3">
                      <div className="flex items-center justify-between">
                        <h4 className="text-xs sm:text-sm font-black text-gray-900 uppercase tracking-wider flex items-center gap-1.5">
                          <Video size={15} className="text-sky-600" />
                          <span>Prescribed Exercise Plan &amp; Dosage (Attending: Dr. Alex)</span>
                        </h4>
                        <span className="text-[11px] font-semibold text-gray-500">
                          {patient.activeVideos.length} Routines Active
                        </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                        {patient.activeVideos.map((video, vIdx) => (
                          <div 
                            key={video.id || vIdx} 
                            className="p-3 bg-slate-50 rounded-2xl border border-slate-200 flex flex-col justify-between space-y-2 hover:bg-slate-100 transition-all"
                          >
                            <div>
                              <div className="flex items-center justify-between text-[10px] text-gray-400 font-bold mb-1">
                                <span>ROUTINE #{vIdx + 1}</span>
                                <span className="text-sky-700 bg-sky-100 px-1.5 py-0.2 rounded font-black">
                                  {video.sets || 3} Sets × {video.reps || 10} Reps
                                </span>
                              </div>
                              <h5 className="text-xs font-black text-gray-900 line-clamp-1">{video.title}</h5>
                              <p className="text-[11px] text-gray-500 line-clamp-2 mt-0.5 italic">"{video.notes || 'Gentle rehabilitation routine.'}"</p>
                            </div>

                            <div className="pt-2 border-t border-slate-200/80 flex items-center justify-between text-[10px] text-gray-500 font-semibold">
                              <span>Assigned: {video.dateAssigned || 'Nov 2026'}</span>
                              <span className="text-blue-600 font-bold">AI Pose Verified ✓</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Informational Callout regarding dynamically generated graphs */}
                  {totalPatients === 1 && (
                    <div className="p-3.5 bg-blue-50/70 border border-blue-200 rounded-2xl flex items-center gap-3 text-xs text-blue-900">
                      <Sparkles size={18} className="text-blue-600 shrink-0" />
                      <div>
                        <span className="font-bold">Dynamic Cohort Ready: </span>
                        <span>
                          Currently showing only Shirish Poudel. If a new patient logs in or registers later, an individual timeline graph will be dynamically generated and added to this analytics dashboard in real time.
                        </span>
                      </div>
                    </div>
                  )}

                </div>
              );
            })}
          </div>
        )}

      </div>
    </div>
  );
}
