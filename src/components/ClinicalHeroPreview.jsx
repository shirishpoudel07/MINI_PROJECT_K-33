import React from 'react';
import { CheckCircle2, ChevronRight, Activity, Flame } from 'lucide-react';

export default function ClinicalHeroPreview({
  onPatientLogin,
  onDoctorLogin
}) {
  return (
    <div className="bg-white/95 backdrop-blur-xl rounded-3xl p-6 sm:p-7 border border-slate-200/80 shadow-[0_20px_50px_rgba(0,0,0,0.04)] hover:shadow-[0_25px_60px_rgba(0,0,0,0.07)] transition-all duration-300 max-w-md mx-auto w-full space-y-6">
      
      {/* Top Bar: Active Patient Identity & Status */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-100">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-sky-50 text-sky-700 flex items-center justify-center font-black text-xs border border-sky-100/80 shadow-2xs">
            SP
          </div>
          <div>
            <div className="text-sm font-extrabold text-slate-900 tracking-tight">Shirish Poudel</div>
            <div className="text-xs text-slate-500">ACL Reconstruction Recovery</div>
          </div>
        </div>

        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-sky-50 text-sky-800 border border-sky-200/60">
          <span className="w-1.5 h-1.5 rounded-full bg-sky-500 animate-pulse" />
          Live Plan
        </span>
      </div>

      {/* Primary Clinical Metric: Range of Motion Focus */}
      <div 
        onClick={() => onPatientLogin && onPatientLogin('p1')}
        className="p-5 rounded-2xl bg-slate-50/70 border border-slate-100 space-y-3 cursor-pointer group hover:bg-slate-50 transition-colors"
        title="Click to launch exercise session"
      >
        <div className="flex items-center justify-between text-xs text-slate-500 font-semibold">
          <span className="flex items-center gap-1.5">
            <Activity size={13} className="text-sky-600" />
            Terminal Knee Extension
          </span>
          <span className="font-bold text-sky-700">Target: 140°+</span>
        </div>
        
        <div className="flex items-baseline justify-between pt-1">
          <div className="text-4xl sm:text-5xl font-black text-slate-900 tracking-tight">
            142°
          </div>
          <div className="text-right">
            <span className="inline-block px-2.5 py-0.5 rounded-full text-[11px] font-black bg-sky-100/80 text-sky-800 border border-sky-200/60">
              Target Reached
            </span>
            <div className="text-[11px] text-slate-400 font-mono mt-1">Rep 7 of 10 &bull; 60 FPS</div>
          </div>
        </div>

        {/* Minimal Smooth Progress Bar */}
        <div className="w-full bg-slate-200/70 h-2 rounded-full overflow-hidden mt-2">
          <div className="bg-gradient-to-r from-sky-500 to-blue-600 h-full rounded-full w-[95%] transition-all duration-500" />
        </div>
      </div>

      {/* 3 Clean, Understated Stats */}
      <div className="grid grid-cols-3 gap-2 py-1 text-center">
        <div>
          <div className="text-xl font-black text-slate-900">98%</div>
          <div className="text-[11px] text-slate-500 font-medium mt-0.5">Form Score</div>
        </div>
        <div className="border-x border-slate-100">
          <div className="text-xl font-black text-slate-900">3 × 10</div>
          <div className="text-[11px] text-slate-500 font-medium mt-0.5">Dosage</div>
        </div>
        <div>
          <div className="text-xl font-black text-slate-900 flex items-center justify-center gap-1">
            <Flame size={14} className="text-amber-500 fill-amber-500" />
            14d
          </div>
          <div className="text-[11px] text-slate-500 font-medium mt-0.5">Streak</div>
        </div>
      </div>

      {/* Bottom: Attending Clinician Verification Strip */}
      <div className="pt-4 border-t border-slate-100 flex items-center justify-between gap-3">
        <div 
          onClick={() => onDoctorLogin && onDoctorLogin()}
          className="flex items-center gap-2.5 min-w-0 cursor-pointer group"
          title="View Dr. Alex Vance credentials"
        >
          <img
            src="https://images.unsplash.com/photo-1622253692010-333f2da6031d?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80"
            alt="Dr. Alex Vance"
            className="w-9 h-9 rounded-full object-cover shrink-0 ring-2 ring-white shadow-2xs"
          />
          <div className="min-w-0">
            <div className="text-xs font-bold text-slate-900 truncate flex items-center gap-1.5 group-hover:text-sky-700 transition-colors">
              <span>Dr. Alex Vance, PT, DPT</span>
              <CheckCircle2 size={12} className="text-sky-600 shrink-0" />
            </div>
            <p className="text-[11px] text-slate-500 truncate">
              Phase II Verified &bull; Prescribed protocol
            </p>
          </div>
        </div>
        
        <button
          type="button"
          onClick={() => onPatientLogin && onPatientLogin('p1')}
          className="w-8 h-8 rounded-xl bg-slate-900 hover:bg-slate-800 text-white flex items-center justify-center shrink-0 transition-colors shadow-2xs cursor-pointer active:scale-95"
          title="Open Shirish Poudel's Recovery Session"
        >
          <ChevronRight size={16} />
        </button>
      </div>

    </div>
  );
}
