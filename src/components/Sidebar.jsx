import React, { useState } from 'react';
import { Search, Activity, ChevronRight, ChevronLeft, Users, X, FileCheck, Stethoscope, Lock, LogOut } from 'lucide-react';
import { isPatientAssignedToDoctor } from '../utils/doctorHelpers';

function HighlightText({ text, query }) {
  if (!query || !query.trim()) return <>{text}</>;
  const parts = text.split(new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi'));
  return (
    <>
      {parts.map((part, index) => 
        part.toLowerCase() === query.toLowerCase() ? (
          <mark key={index} className="bg-amber-200 text-amber-900 font-semibold px-0.5 rounded">
            {part}
          </mark>
        ) : (
          part
        )
      )}
    </>
  );
}

export default function Sidebar({ 
  patients = [], 
  selectedPatientId, 
  onSelectPatient,
  currentDoctor = null,
  _verifiedDoctors = [],
  _onSelectDoctor = null,
  _onOpenDoctorModal = null,
  onViewDoctorProfile = null,
  onLogout = null
}) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Calculate assigned patients strictly for the currently active doctor
  const assignedPatients = patients.filter(patient => isPatientAssignedToDoctor(patient, currentDoctor));

  // Scope filter: 'assigned' (My Patients strictly) | 'all' (All Patients - Names Only)
  const [filterScope, setFilterScope] = useState('assigned');

  // Filter patients dynamically based on doctor scope and search query
  const filteredPatients = patients.filter(patient => {
    // 1. Doctor Scope filter
    if (filterScope === 'assigned' && currentDoctor) {
      if (!isPatientAssignedToDoctor(patient, currentDoctor)) return false;
    }

    // 2. Search Query filter
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    if (filterScope === 'all') {
      // In all patients mode, only match names
      return patient.name.toLowerCase().includes(q);
    }
    return (
      patient.name.toLowerCase().includes(q) ||
      patient.condition.toLowerCase().includes(q) ||
      `${patient.adherenceScore}%`.includes(q) ||
      (patient.assignedDoctor || '').toLowerCase().includes(q)
    );
  });

  const handleKeyDown = (e) => {
    if (e.key === 'Escape') {
      setSearchQuery('');
    } else if (e.key === 'Enter' && filteredPatients.length > 0) {
      onSelectPatient(filteredPatients[0].id);
    }
  };

  if (isCollapsed) {
    return (
      <div className="w-16 bg-white border-r border-gray-200 h-full flex flex-col items-center py-3 z-20 shrink-0 transition-all">
        {/* Uncollapse Button */}
        <button 
          onClick={() => setIsCollapsed(false)}
          className="w-10 h-10 bg-slate-50 hover:bg-blue-50 text-slate-500 hover:text-blue-600 rounded-xl flex items-center justify-center transition-colors border border-slate-200 shadow-2xs mb-2 cursor-pointer"
          title="Expand Patients Sidebar"
        >
          <ChevronRight size={18} />
        </button>

        {/* Doctor Assigned Icon Badge */}
        <div 
          onClick={() => {
            if (onViewDoctorProfile) onViewDoctorProfile(currentDoctor);
            else if (onOpenDoctorModal) onOpenDoctorModal();
          }}
          className="relative mb-3 cursor-pointer group"
          title={`Click to view ${currentDoctor?.name || 'Attending'} clinical credentials`}
        >
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 border border-blue-200 flex items-center justify-center shadow-xs group-hover:bg-blue-600 group-hover:text-white transition-all">
            <Stethoscope size={18} />
          </div>
          <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-sky-500 border-2 border-white ring-1 ring-sky-300"></div>
        </div>

        {/* Collapsed Patient Quick Switcher Rail for this Doctor */}
        <div className="flex-1 w-full overflow-y-auto scrollbar-none flex flex-col items-center space-y-2.5 px-2">
          {assignedPatients.map(pt => {
            const isSelected = selectedPatientId === pt.id;
            const initials = pt.name?.split(' ').map(n => n[0]).join('') || 'PT';
            const adherenceColor = pt.adherenceScore >= 80 ? 'bg-sky-500' : pt.adherenceScore >= 60 ? 'bg-amber-500' : 'bg-rose-500';

            return (
              <button
                key={pt.id}
                type="button"
                onClick={() => onSelectPatient(pt.id)}
                className={`relative w-10 h-10 rounded-xl flex items-center justify-center font-extrabold text-xs transition-all cursor-pointer group ${
                  isSelected 
                    ? 'bg-blue-600 text-white shadow-md ring-2 ring-blue-500 ring-offset-2' 
                    : 'bg-slate-100 text-slate-700 hover:bg-blue-50 hover:text-blue-600 border border-slate-200'
                }`}
                title={`${pt.name} • ${pt.condition} (${pt.adherenceScore}% Adherence)`}
              >
                <span>{initials}</span>
                <span className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-white ${adherenceColor}`}></span>
              </button>
            );
          })}
        </div>

        {/* Bottom online indicator & Collapsed Sign Out */}
        <div className="pt-2 border-t border-slate-100 w-full flex flex-col items-center gap-2">
          {onLogout && (
            <button
              type="button"
              onClick={onLogout}
              className="w-9 h-9 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 flex items-center justify-center transition-all cursor-pointer shadow-2xs active:scale-95"
              title="Sign out of Doctor Portal"
              id="sidebar-collapsed-doctor-logout-btn"
            >
              <LogOut size={15} />
            </button>
          )}
          <div className="w-2 h-2 rounded-full bg-sky-500" title="Online Clinical Sync"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-72 bg-white/80 backdrop-blur-xl border-r border-sky-900/10 h-full flex flex-col z-20 shrink-0 transition-all font-sans">
      
      {/* 
        ===========================================================
        SECTION: DOCTOR ASSIGNED (LOGGED-IN CLINICIAN IDENTITY)
        Displays the authenticated doctor profile card and stats.
        ===========================================================
      */}
      <div className="p-3 border-b border-sky-900/10 bg-gradient-to-b from-sky-50/70 via-[#faf8f2]/50 to-white/70">
        <div className="flex items-center space-x-1.5 mb-2">
          <div className="w-5 h-5 rounded-md bg-sky-600 text-white flex items-center justify-center shadow-2xs">
            <Stethoscope size={12} />
          </div>
          <span className="text-[11px] font-black uppercase tracking-wider text-slate-800">
            Attending Clinician
          </span>
        </div>

        {/* Active Doctor Profile Card */}
        <div 
          onClick={() => onViewDoctorProfile && onViewDoctorProfile(currentDoctor)}
          className="bg-white/90 rounded-xl p-2.5 border border-sky-900/10 shadow-2xs hover:border-sky-500/40 hover:shadow-xs transition-all cursor-pointer group"
          title={`Click to view ${currentDoctor?.name} credentials & licensing`}
        >
          <div className="flex items-center space-x-2.5">
            <div className="w-9 h-9 rounded-xl bg-sky-50 text-sky-700 border border-sky-200 flex items-center justify-center shrink-0 group-hover:bg-sky-600 group-hover:text-white transition-colors">
              <Stethoscope size={18} />
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-1">
                <h3 className="text-xs font-black text-slate-900 group-hover:text-sky-700 transition-colors truncate">
                  {currentDoctor?.shortName || currentDoctor?.name || 'Attending Physician'}
                </h3>
                <span className="text-[9px] font-bold px-1.5 py-0.2 rounded-full bg-sky-50 text-sky-800 border border-sky-200 shrink-0">
                  Active
                </span>
              </div>
              <p className="text-[10px] text-slate-500 truncate mt-0.5">
                {currentDoctor?.title || currentDoctor?.department || 'Physical Rehabilitation'}
              </p>
              <div className="flex items-center justify-between text-[10px] mt-1 pt-1 border-t border-slate-100">
                <span className="text-sky-700 font-bold hover:underline flex items-center gap-0.5">
                  <span>Clinician Details</span>
                  <ChevronRight size={10} />
                </span>
                <span className="font-extrabold text-sky-800 bg-sky-50 px-1.5 py-0.2 rounded border border-sky-200">
                  {assignedPatients.length} {assignedPatients.length === 1 ? 'Patient' : 'Patients'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Scope Filter Tabs: My Patients vs All Hospital Patients */}
      <div className="p-3 border-b border-sky-900/10 bg-[#faf8f2]/60">
        <div className="grid grid-cols-2 gap-1.5 p-1 bg-slate-200/60 rounded-xl text-xs font-bold">
          <button
            type="button"
            onClick={() => setFilterScope('assigned')}
            className={`py-1.5 px-2 rounded-lg transition-all flex items-center justify-center gap-1 cursor-pointer ${
              filterScope === 'assigned'
                ? 'bg-white text-sky-800 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Stethoscope size={13} />
            <span>My Patients ({assignedPatients.length})</span>
          </button>
          <button
            type="button"
            onClick={() => setFilterScope('all')}
            className={`py-1.5 px-2 rounded-lg transition-all flex items-center justify-center gap-1 cursor-pointer ${
              filterScope === 'all'
                ? 'bg-white text-sky-800 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
            title="Hospital directory of all patient names"
          >
            <Users size={13} />
            <span>All Patients ({patients.length})</span>
          </button>
        </div>
      </div>

      <div className="p-3 border-b border-gray-100 flex items-center space-x-2">
        <div className="relative group flex-1">
          <Search className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 transition-colors ${
            searchQuery ? 'text-blue-600' : 'text-slate-400 group-focus-within:text-blue-600'
          }`} />
          <input 
            type="text" 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={filterScope === 'all' ? "Search patient names..." : "Search my patients..."} 
            className="w-full pl-9 pr-8 py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all placeholder:text-gray-400"
          />
          {searchQuery && (
            <button 
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-gray-200 hover:bg-gray-300 text-gray-600 flex items-center justify-center transition-colors"
              title="Clear search"
            >
              <X size={12} />
            </button>
          )}
        </div>
        <button 
          onClick={() => setIsCollapsed(true)}
          className="w-8 h-8 shrink-0 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-lg flex items-center justify-center text-gray-500 hover:text-blue-600 transition-colors"
          title="Hide Sidebar"
        >
          <ChevronLeft size={16} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto scrollbar-thin">
        <div className="px-4 py-3 flex items-center justify-between">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            {filterScope === 'assigned' ? 'Assigned to You' : 'Hospital Directory (Names Only)'}
          </span>
          <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-blue-50 text-blue-700 border border-blue-200">
            {filteredPatients.length} {filterScope === 'assigned' ? 'Assigned' : 'Names'}
          </span>
        </div>
        
        {filteredPatients.length === 0 ? (
          <div className="py-8 px-4 text-center">
            <div className="w-11 h-11 rounded-full bg-gray-100 text-gray-400 flex items-center justify-center mx-auto mb-2.5">
              <Users size={20} className="opacity-60" />
            </div>
            <p className="text-xs font-bold text-gray-800">
              {filterScope === 'assigned' ? 'No patients currently assigned' : 'No patient names found'}
            </p>
            <p className="text-[11px] text-gray-500 mt-1 max-w-[200px] mx-auto">
              {filterScope === 'assigned' 
                ? 'You currently have no patients assigned. Switch to "All Patients" to view patient names in the directory.' 
                : `No results matching "${searchQuery}"`}
            </p>
            {filterScope === 'assigned' ? (
              <button
                type="button"
                onClick={() => setFilterScope('all')}
                className="mt-3 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer"
              >
                View Patient Names
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="mt-3 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
              >
                Clear filter
              </button>
            )}
          </div>
        ) : (
          <ul className="space-y-1.5 px-3 pb-4">
            {filteredPatients.map((patient) => {
              const isSelected = selectedPatientId === patient.id;
              const isAssigned = isPatientAssignedToDoctor(patient, currentDoctor);
              const isNameOnly = filterScope === 'all' && !isAssigned;
              const hasReport = !isNameOnly && !!patient.medicalReport;

              return (
                <li key={patient.id}>
                  <button
                    onClick={() => onSelectPatient(patient.id)}
                    className={`w-full text-left p-3 rounded-xl transition-all duration-200 flex items-center justify-between gap-2.5 cursor-pointer ${
                      isSelected 
                        ? 'bg-sky-50 border border-sky-300 ring-2 ring-sky-500/15' 
                        : 'hover:bg-sky-50/50 border border-sky-900/5'
                    }`}
                  >
                    <div className="flex items-center space-x-2.5 min-w-0">
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 font-bold text-xs ${
                        isSelected 
                          ? 'bg-sky-600 text-white shadow-2xs' 
                          : isNameOnly
                            ? 'bg-slate-100 text-slate-500 border border-slate-200'
                            : 'bg-slate-100 text-slate-700 border border-slate-200'
                      }`}>
                        {patient.name?.split(' ').map(n => n[0]).join('') || 'PT'}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5">
                          <p className={`text-xs font-bold truncate ${isSelected ? 'text-sky-900' : 'text-slate-900'}`}>
                            <HighlightText text={patient.name} query={searchQuery} />
                          </p>
                          {isNameOnly && (
                            <span className="text-[9px] px-1.5 py-0.2 rounded bg-slate-100 text-slate-500 border border-slate-200 flex items-center gap-0.5 shrink-0">
                              <Lock size={9} />
                              <span>Name Only</span>
                            </span>
                          )}
                        </div>

                        {/* If NOT assigned to this doctor in All Patients, display Name Only and Attending Clinician */}
                        {isNameOnly ? (
                          <p className="text-[10px] text-slate-500 truncate mt-0.5">
                            Attending: {patient.assignedDoctor || 'Assigned Clinician'}
                          </p>
                        ) : (
                          <>
                            <p className="text-[11px] text-gray-500 truncate mt-0.5">
                              <HighlightText text={patient.condition} query={searchQuery} />
                            </p>
                            {hasReport && (
                              <span className="inline-flex items-center gap-1 text-[10px] text-sky-700 font-semibold bg-sky-50 px-1.5 py-0.2 rounded border border-sky-200 mt-1">
                                <FileCheck size={10} />
                                <span>Report Filed</span>
                              </span>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                      
                    <div className="flex flex-col items-end shrink-0">
                      {isNameOnly ? (
                        <div className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-500 text-[10px] font-semibold border border-slate-200">
                          Directory
                        </div>
                      ) : (
                        <div className={`flex items-center space-x-1 px-1.5 py-0.5 rounded-md ${
                            patient.adherenceScore >= 80 ? 'bg-sky-100 text-sky-700' : 
                            patient.adherenceScore >= 60 ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'
                        }`}>
                          <Activity size={10} />
                          <span className="text-[10px] font-bold">
                            {patient.adherenceScore}%
                          </span>
                        </div>
                      )}
                      {isSelected && (
                        <ChevronRight size={14} className="text-blue-600 mt-1.5" />
                      )}
                    </div>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>
      
      <div className="p-3 border-t border-gray-200 bg-gray-50 flex flex-col gap-2">
        <div className="text-xs font-medium text-gray-500 flex items-center justify-between">
          <span className="truncate text-[11px]">{currentDoctor?.clinic || 'VirtuHeal Hospital'}</span>
          <div className="flex items-center space-x-1 shrink-0">
            <div className="w-1.5 h-1.5 rounded-full bg-sky-500"></div>
            <span className="text-[10px] text-gray-600 font-bold uppercase">Staff</span>
          </div>
        </div>

        {onLogout && (
          <button
            type="button"
            onClick={onLogout}
            className="w-full py-2 px-3 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer active:scale-95 shadow-2xs"
            title="Sign out of Doctor Portal"
            id="sidebar-doctor-logout-btn"
          >
            <LogOut size={13} />
            <span>Sign Out</span>
          </button>
        )}
      </div>
    </div>
  );
}
