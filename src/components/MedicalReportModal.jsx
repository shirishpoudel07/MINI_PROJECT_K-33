import React from 'react';
import { X, FileText, ShieldCheck, Activity } from 'lucide-react';

export default function MedicalReportModal({ isOpen, onClose, patient }) {
  if (!isOpen || !patient) return null;

  const report = patient.medicalReport || {
    fileName: 'Hospital_Discharge_Summary.pdf',
    fileSize: '2.4 MB',
    notes: 'Clinical intake records from hospital orthopedic department. Cleared for physical therapy rehabilitation.'
  };

  return (
    <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-md flex items-center justify-center p-3 sm:p-5 z-50 animate-fade-in font-sans">
      <div className="bg-white/95 backdrop-blur-2xl rounded-3xl max-w-2xl w-full p-6 shadow-2xl border border-sky-900/15 flex flex-col max-h-[90vh] animate-slide-up overflow-hidden">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-4 border-b border-sky-900/10 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-sky-50 text-sky-700 flex items-center justify-center border border-sky-200 shadow-2xs">
              <FileText size={22} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-black text-gray-900">Hospital Medical Report & Intake</h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-sky-50 text-sky-700 border border-sky-200">
                  Verified Clinical Record
                </span>
              </div>
              <p className="text-xs text-gray-500">
                Uploaded hospital documentation and physician clinical notes.
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-500 flex items-center justify-center transition-colors cursor-pointer"
          >
            <X size={16} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="py-4 space-y-4 overflow-y-auto pr-1 flex-1">
          
          {/* Patient & Doctor Snapshot */}
          <div className="grid grid-cols-2 gap-3 p-3.5 bg-slate-50 rounded-2xl border border-gray-200 text-xs">
            <div>
              <span className="text-gray-400 block text-[10px] uppercase font-bold tracking-wider">Patient Name</span>
              <span className="font-bold text-gray-900 text-sm">{patient.name}</span>
              <span className="text-gray-500 block text-[11px] mt-0.5 font-mono">ID: #{patient.id}</span>
            </div>
            <div>
              <span className="text-gray-400 block text-[10px] uppercase font-bold tracking-wider">Assigned Clinician</span>
              <span className="font-bold text-blue-700 text-sm">{patient.assignedDoctor || 'Dr. Alex Vance, PT'}</span>
              <span className="text-gray-500 block text-[11px] mt-0.5">Attending Physical Therapist</span>
            </div>
          </div>

          {/* Primary Diagnosis & Injury Details */}
          <div className="p-4 bg-blue-50/50 rounded-2xl border border-blue-100">
            <span className="text-blue-900 text-[11px] uppercase font-bold tracking-wider flex items-center gap-1.5">
              <Activity size={13} className="text-blue-600" />
              Primary Diagnosis / Physical Injury
            </span>
            <h4 className="text-base font-black text-gray-900 mt-1">{patient.condition}</h4>
            <p className="text-xs text-gray-600 mt-1">
              Initial clinical intake record filed upon patient onboarding. Assigned to targeted active rehabilitation protocol.
            </p>
          </div>

          {/* Document File Container */}
          <div className="p-4 bg-slate-900 text-white rounded-2xl border border-slate-800 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-xl bg-red-500/20 text-red-400 flex items-center justify-center shrink-0 border border-red-500/30 font-bold text-xs">
                PDF
              </div>
              <div className="min-w-0">
                <h5 className="text-xs sm:text-sm font-bold truncate">{report.fileName || 'Hospital_Discharge_Summary.pdf'}</h5>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  {report.fileSize || '2.4 MB'} • Orthopedic Imaging & Discharge Record
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <span className="px-2.5 py-1 bg-sky-500/20 text-sky-300 rounded-lg text-[10px] font-bold border border-sky-500/30 flex items-center gap-1">
                <ShieldCheck size={12} />
                <span>Encrypted</span>
              </span>
            </div>
          </div>

          {/* Clinical Discharge Notes / MRI Summary */}
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
              Clinical Findings & Physician Recommendations
            </label>
            <div className="p-4 bg-amber-50/60 border border-amber-200/80 rounded-2xl text-xs sm:text-sm text-gray-800 leading-relaxed font-sans whitespace-pre-line">
              {report.notes || 'No detailed clinical notes attached.'}
            </div>
          </div>

        </div>

        {/* Modal Footer */}
        <div className="pt-3 border-t border-gray-100 flex items-center justify-between shrink-0 text-xs">
          <span className="text-gray-400 flex items-center gap-1">
            <ShieldCheck size={14} className="text-sky-500" />
            HIPAA-Compliant Health Record
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold cursor-pointer transition-all"
          >
            Close Document
          </button>
        </div>

      </div>
    </div>
  );
}
