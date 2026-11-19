import React, { useState } from 'react';
import { 
  X, 
  Stethoscope, 
  ShieldCheck, 
  UserPlus, 
  CheckCircle2, 
  AlertCircle, 
  Lock, 
  ArrowRight, 
  KeyRound,
  Sparkles
} from 'lucide-react';
import { initialVerifiedDoctors } from '../data/doctorData';

export default function DoctorLoginModal({
  isOpen,
  onClose,
  onLoginSuccess,
  verifiedDoctors = initialVerifiedDoctors,
  onRegisterDoctor = null
}) {
  const [activeTab, setActiveTab] = useState('login'); // 'login' | 'register'
  
  // Login Tab State
  const [selectedDoctorId, setSelectedDoctorId] = useState(verifiedDoctors[0]?.id || 'doc_1');
  const [enteredPin, setEnteredPin] = useState('');
  const [loginError, setLoginError] = useState('');

  // Register Doctor Profile Tab State
  const [regName, setRegName] = useState('');
  const [regClinic, setRegClinic] = useState('VirtuHeal Center for Advanced Human Performance');
  const [regDepartment, setRegDepartment] = useState('Department of Physical Medicine & Rehabilitation');
  const [regSpecialty, setRegSpecialty] = useState('Orthopedic Physical Therapy & Joint Arthroplasty');
  const [regLicense, setRegLicense] = useState('MD-PT-94821');
  const [regEmail, setRegEmail] = useState('');
  const [regPin, setRegPin] = useState('1234');
  const [regError, setRegError] = useState('');

  if (!isOpen) return null;

  const selectedDoctor = verifiedDoctors.find(d => d.id === selectedDoctorId) || verifiedDoctors[0];

  const handleDoctorLogin = (e) => {
    e.preventDefault();
    setLoginError('');

    const targetPin = selectedDoctor.pin || '1234';
    if (enteredPin.trim() !== targetPin && enteredPin.trim() !== '1234') {
      setLoginError('Incorrect PIN code. Default clinical demo PIN is 1234.');
      return;
    }

    onLoginSuccess(selectedDoctor);
    onClose();
  };

  const handleRegisterDoctor = (e) => {
    e.preventDefault();
    setRegError('');

    if (!regName.trim()) {
      setRegError('Please enter your full legal clinician name and degree (e.g., Dr. Jane Foster, DPT).');
      return;
    }
    if (!regClinic.trim()) {
      setRegError('Please enter your hospital or clinic name.');
      return;
    }
    if (!regSpecialty.trim()) {
      setRegError('Please enter your primary medical specialty.');
      return;
    }

    const short = regName.split(',')[0].trim();
    const newDoctor = {
      id: `doc_${Date.now()}`,
      name: regName.trim(),
      shortName: short.startsWith('Dr.') ? short : `Dr. ${short}`,
      title: regSpecialty.trim(),
      department: regDepartment.trim() || 'Department of Physical Medicine & Rehabilitation',
      clinic: regClinic.trim(),
      location: 'New York, NY',
      email: regEmail.trim() || `${short.toLowerCase().replace(/[^a-z]/g, '')}@virtuheal.med`,
      phone: '+1 (555) 789-0123',
      license: regLicense.trim() || 'CLIN-LIC-2026',
      npi: `${Math.floor(1000000000 + Math.random() * 9000000000)}`,
      avatar: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80',
      pin: regPin.trim() || '1234',
      specialties: [regSpecialty.trim()]
    };

    if (onRegisterDoctor) {
      onRegisterDoctor(newDoctor);
    }
    onLoginSuccess(newDoctor);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-slate-900/75 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 z-50 animate-fade-in font-sans">
      <div className="bg-white rounded-3xl max-w-xl w-full p-6 shadow-2xl border border-gray-100 flex flex-col max-h-[92vh] animate-slide-up overflow-hidden">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-4 border-b border-gray-100 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-sky-50 text-sky-700 flex items-center justify-center border border-sky-100 shadow-xs">
              <Stethoscope size={22} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-black text-gray-900">Clinician & Doctor Portal</h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-sky-50 text-sky-700 border border-sky-200 flex items-center gap-1">
                  <ShieldCheck size={11} />
                  Staff Auth
                </span>
              </div>
              <p className="text-xs text-gray-500">
                Hospital attending physicians, orthopedic therapists & clinical staff access.
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

        {/* Tab Selection */}
        <div className="grid grid-cols-2 gap-2 p-1.5 bg-slate-100 rounded-2xl mt-4 mb-4 shrink-0">
          <button
            type="button"
            onClick={() => { setActiveTab('login'); setLoginError(''); }}
            className={`py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === 'login'
                ? 'bg-white text-gray-900 shadow-xs'
                : 'text-gray-500 hover:text-gray-900'
            }`}
          >
            <KeyRound size={14} className={activeTab === 'login' ? 'text-sky-600' : ''} />
            <span>Staff Sign In</span>
          </button>
          <button
            type="button"
            onClick={() => { setActiveTab('register'); setRegError(''); }}
            className={`py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === 'register'
                ? 'bg-white text-gray-900 shadow-xs'
                : 'text-gray-500 hover:text-gray-900'
            }`}
          >
            <UserPlus size={14} className={activeTab === 'register' ? 'text-sky-600' : ''} />
            <span>Register as Doctor</span>
          </button>
        </div>

        {/* Tab 1: Staff Sign In */}
        {activeTab === 'login' && (
          <form onSubmit={handleDoctorLogin} className="space-y-4 overflow-y-auto pr-1 flex-1">
            
            {/* Select Clinician from Roster */}
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                Select Attending Physician / Clinician
              </label>
              <div className="space-y-2">
                {verifiedDoctors.map((doc) => {
                  const isSelected = doc.id === selectedDoctorId;
                  return (
                    <div
                      key={doc.id}
                      onClick={() => setSelectedDoctorId(doc.id)}
                      className={`p-3 rounded-2xl border transition-all flex items-center justify-between gap-3 cursor-pointer ${
                        isSelected
                          ? 'border-sky-500 bg-sky-50/40 ring-2 ring-sky-500/20'
                          : 'border-gray-200 hover:border-sky-300 hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-10 h-10 rounded-xl bg-sky-50 text-sky-700 border border-sky-200 flex items-center justify-center shrink-0">
                          <Stethoscope size={18} />
                        </div>
                        <div className="min-w-0 flex-1">
                          <h4 className="text-xs sm:text-sm font-bold text-gray-900 truncate">{doc.name}</h4>
                          <p className="text-[11px] text-sky-700 font-semibold truncate">{doc.title}</p>
                          <p className="text-[10px] text-gray-400 truncate">{doc.clinic}</p>
                        </div>
                      </div>

                      <div className="shrink-0">
                        {isSelected ? (
                          <span className="w-6 h-6 rounded-full bg-sky-600 text-white flex items-center justify-center">
                            <CheckCircle2 size={14} />
                          </span>
                        ) : (
                          <div className="w-5 h-5 rounded-full border border-gray-300"></div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Selected Doctor Summary Card */}
            {selectedDoctor && (
              <div className="p-3 bg-slate-50 rounded-2xl border border-gray-200 text-xs space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-gray-500">Department:</span>
                  <span className="font-semibold text-gray-900">{selectedDoctor.department}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-500">Medical License:</span>
                  <span className="font-mono text-gray-700">{selectedDoctor.license}</span>
                </div>
              </div>
            )}

            {/* Security PIN Code Input */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-bold text-gray-700 uppercase tracking-wider">
                  Clinician Security PIN
                </label>
                <span className="text-[11px] text-sky-600 font-semibold bg-sky-50 px-2 py-0.5 rounded-full border border-sky-200">
                  Demo PIN: 1234
                </span>
              </div>
              <div className="relative">
                <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="password"
                  maxLength={6}
                  value={enteredPin}
                  onChange={(e) => setEnteredPin(e.target.value)}
                  placeholder="Enter 4-digit PIN..."
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 focus:bg-white border border-gray-200 focus:border-sky-500 rounded-xl text-sm font-mono tracking-widest outline-hidden transition-all text-gray-900"
                  autoFocus
                />
              </div>
            </div>

            {loginError && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-center gap-2">
                <AlertCircle size={15} className="shrink-0 text-red-500" />
                <span>{loginError}</span>
              </div>
            )}

            {/* Submit Button */}
            <div className="pt-2">
              <button
                type="submit"
                className="w-full py-3 px-4 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-xs sm:text-sm font-bold shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95"
              >
                <ShieldCheck size={16} />
                <span>Log In to Doctor Workspace</span>
                <ArrowRight size={14} />
              </button>
            </div>

          </form>
        )}

        {/* Tab 2: Register New Doctor Profile */}
        {activeTab === 'register' && (
          <form onSubmit={handleRegisterDoctor} className="space-y-3.5 overflow-y-auto pr-1 flex-1">
            
            <div className="p-3 bg-sky-50/70 border border-sky-200 rounded-2xl flex items-center gap-2.5 text-xs text-sky-800">
              <Sparkles size={16} className="shrink-0 text-amber-500" />
              <span>
                Register your clinician profile to manage assigned patient intake, review uploaded MRI reports, and prescribe therapy routines.
              </span>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                Full Legal Name & Degree *
              </label>
              <input
                type="text"
                value={regName}
                onChange={(e) => setRegName(e.target.value)}
                placeholder="e.g., Dr. Jane Foster, DPT, OCS"
                className="w-full px-3.5 py-2.5 bg-slate-50 focus:bg-white border border-gray-200 focus:border-sky-500 rounded-xl text-xs sm:text-sm outline-hidden transition-all text-gray-900"
                required
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                  Hospital / Clinical Org *
                </label>
                <input
                  type="text"
                  value={regClinic}
                  onChange={(e) => setRegClinic(e.target.value)}
                  placeholder="e.g., St. Jude Orthopedic Center"
                  className="w-full px-3 py-2 bg-slate-50 focus:bg-white border border-gray-200 focus:border-sky-500 rounded-xl text-xs outline-hidden transition-all text-gray-900"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                  Clinical Specialty *
                </label>
                <input
                  type="text"
                  value={regSpecialty}
                  onChange={(e) => setRegSpecialty(e.target.value)}
                  placeholder="e.g., Sports Medicine & Knee Rehab"
                  className="w-full px-3 py-2 bg-slate-50 focus:bg-white border border-gray-200 focus:border-sky-500 rounded-xl text-xs outline-hidden transition-all text-gray-900"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                  Department
                </label>
                <input
                  type="text"
                  value={regDepartment}
                  onChange={(e) => setRegDepartment(e.target.value)}
                  placeholder="e.g., Department of Orthopedics"
                  className="w-full px-3 py-2 bg-slate-50 focus:bg-white border border-gray-200 focus:border-sky-500 rounded-xl text-xs outline-hidden transition-all text-gray-900"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                  License Number / NPI
                </label>
                <input
                  type="text"
                  value={regLicense}
                  onChange={(e) => setRegLicense(e.target.value)}
                  placeholder="e.g., NY-PT-092812"
                  className="w-full px-3 py-2 bg-slate-50 focus:bg-white border border-gray-200 focus:border-sky-500 rounded-xl text-xs outline-hidden transition-all text-gray-900 font-mono"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                  Work Email (Optional)
                </label>
                <input
                  type="email"
                  value={regEmail}
                  onChange={(e) => setRegEmail(e.target.value)}
                  placeholder="e.g., dr.foster@hospital.med"
                  className="w-full px-3 py-2 bg-slate-50 focus:bg-white border border-gray-200 focus:border-sky-500 rounded-xl text-xs outline-hidden transition-all text-gray-900"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                  Set Security PIN
                </label>
                <input
                  type="password"
                  maxLength={6}
                  value={regPin}
                  onChange={(e) => setRegPin(e.target.value)}
                  placeholder="e.g., 1234"
                  className="w-full px-3 py-2 bg-slate-50 focus:bg-white border border-gray-200 focus:border-sky-500 rounded-xl text-xs outline-hidden transition-all text-gray-900 font-mono tracking-widest"
                />
              </div>
            </div>

            {regError && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-center gap-2">
                <AlertCircle size={15} className="shrink-0 text-red-500" />
                <span>{regError}</span>
              </div>
            )}

            {/* Submit Button */}
            <div className="pt-2">
              <button
                type="submit"
                className="w-full py-3 px-4 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-xs sm:text-sm font-bold shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95"
              >
                <UserPlus size={16} />
                <span>Create Doctor Profile & Enter Workspace</span>
              </button>
            </div>

          </form>
        )}

      </div>
    </div>
  );
}
