import React, { useState, useEffect, useRef } from 'react';
import { Lock, X, AlertCircle, ShieldCheck, UserCheck, KeyRound } from 'lucide-react';

const defaultDoctor = {
  name: "Dr. Alex Vance, PT, DPT, PhD",
  title: "Chief of Physical Rehabilitation & Orthopedic Biomechanics",
  clinic: "VirtuHeal Center for Advanced Human Performance",
  avatar: "https://images.unsplash.com/photo-1622253692010-333f2da6031d?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80",
  status: "Board Certified Clinician",
  license: "NY-PT-049821"
};

export default function PinModal({ 
  isOpen, 
  onClose, 
  onSuccess, 
  targetView = 'doctor',
  correctPin = '1234',
  patient = null,
  doctor = null,
  onViewDoctorProfile = null
}) {
  const [pin, setPin] = useState(['', '', '', '']);
  const [error, setError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const box0Ref = useRef(null);
  const box1Ref = useRef(null);
  const box2Ref = useRef(null);
  const box3Ref = useRef(null);
  const inputRefs = [box0Ref, box1Ref, box2Ref, box3Ref];

  const isDoctorTarget = targetView === 'doctor';
  const currentDoctor = doctor || defaultDoctor;
  const activePatient = patient || {
    name: "Shirish Poudel",
    condition: "ACL Reconstruction & Knee Recovery"
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      box0Ref.current?.focus();
    }, 60);
    return () => clearTimeout(timer);
  }, []);

  if (!isOpen) return null;

  const validatePin = (code) => {
    if (code === correctPin) {
      setError(false);
      onSuccess();
    } else {
      setError(true);
      setErrorMessage('Incorrect PIN. Please try again.');
      setTimeout(() => {
        setPin(['', '', '', '']);
        inputRefs[0].current?.focus();
      }, 400);
    }
  };

  const handleChange = (index, value) => {
    // Only accept numbers
    const cleanVal = value.replace(/[^0-9]/g, '');
    if (!cleanVal) {
      const nextPin = [...pin];
      nextPin[index] = '';
      setPin(nextPin);
      return;
    }

    const lastDigit = cleanVal.slice(-1);
    const nextPin = [...pin];
    nextPin[index] = lastDigit;
    setPin(nextPin);
    setError(false);
    setErrorMessage('');

    // Auto-advance to next input
    if (index < 3) {
      inputRefs[index + 1].current?.focus();
    } else {
      // All 4 digits entered, auto-validate
      const enteredPin = nextPin.join('');
      validatePin(enteredPin);
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !pin[index] && index > 0) {
      inputRefs[index - 1].current?.focus();
    } else if (e.key === 'Escape') {
      onClose();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/[^0-9]/g, '').slice(0, 4);
    if (!pasted) return;

    const nextPin = ['', '', '', ''];
    for (let i = 0; i < pasted.length; i++) {
      nextPin[i] = pasted[i];
    }
    setPin(nextPin);

    if (pasted.length === 4) {
      validatePin(pasted);
    } else {
      inputRefs[Math.min(3, pasted.length)].current?.focus();
    }
  };

  const handleKeypadPress = (digit) => {
    const firstEmptyIndex = pin.findIndex(d => d === '');
    if (firstEmptyIndex !== -1) {
      handleChange(firstEmptyIndex, digit.toString());
    }
  };

  const handleKeypadBackspace = () => {
    const lastFilledIndex = [...pin].reverse().findIndex(d => d !== '');
    if (lastFilledIndex !== -1) {
      const actualIndex = 3 - lastFilledIndex;
      const nextPin = [...pin];
      nextPin[actualIndex] = '';
      setPin(nextPin);
      inputRefs[actualIndex].current?.focus();
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/65 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in font-sans">
      <div className={`bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-gray-100 transition-all transform ${error ? 'animate-shake' : 'animate-slide-up'}`}>
        
        {/* Top Control Bar */}
        <div className="flex items-center justify-between pb-2 border-b border-gray-100">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-blue-50 text-blue-700 border border-blue-200/60 shadow-2xs">
            <KeyRound size={12} className="text-blue-600" />
            <span>{isDoctorTarget ? 'Clinician Security Gate' : 'Patient Recovery Portal'}</span>
          </div>
          <button 
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-500 hover:text-gray-800 flex items-center justify-center transition-colors cursor-pointer"
            title="Cancel & Close"
          >
            <X size={16} />
          </button>
        </div>

        {/* Profile Card Section */}
        <div className="flex flex-col items-center text-center mt-3 mb-2">
          <div className="relative mb-2.5">
            {isDoctorTarget ? (
              <div className="relative">
                <img 
                  src={currentDoctor.avatar} 
                  alt={currentDoctor.name} 
                  className="w-20 h-20 rounded-2xl object-cover ring-4 ring-blue-100 shadow-md"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                    if (e.currentTarget.nextElementSibling) {
                      e.currentTarget.nextElementSibling.style.display = 'flex';
                    }
                  }}
                />
                <div 
                  style={{ display: 'none' }}
                  className="w-20 h-20 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white items-center justify-center text-xl font-extrabold ring-4 ring-blue-100 shadow-md"
                >
                  AV
                </div>
                <div 
                  className="absolute -bottom-1 -right-1 bg-sky-500 text-white p-1 rounded-full border-2 border-white shadow-sm flex items-center justify-center"
                  title="Board Certified Clinician"
                >
                  <ShieldCheck size={14} />
                </div>
              </div>
            ) : (
              <div className="relative">
                <div className="w-20 h-20 rounded-2xl bg-gradient-to-tr from-sky-500 to-blue-600 text-white flex items-center justify-center text-2xl font-extrabold ring-4 ring-sky-100 shadow-md">
                  {activePatient.name?.split(' ').map(n => n[0]).join('') || 'PT'}
                </div>
                <div 
                  className="absolute -bottom-1 -right-1 bg-blue-600 text-white p-1 rounded-full border-2 border-white shadow-sm flex items-center justify-center"
                  title="Verified Patient"
                >
                  <UserCheck size={14} />
                </div>
              </div>
            )}
          </div>

          <h3 className="text-lg font-extrabold text-gray-900 tracking-tight leading-tight">
            {isDoctorTarget ? currentDoctor.name : activePatient.name}
          </h3>
          <p className="text-xs font-semibold text-blue-600 mt-0.5">
            {isDoctorTarget ? currentDoctor.title : `Care Plan: ${activePatient.condition}`}
          </p>

          <div className="flex items-center gap-2 mt-2 flex-wrap justify-center">
            {isDoctorTarget ? (
              <>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                  {currentDoctor.status}
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono text-slate-500 bg-slate-50 border border-slate-200">
                  Lic: {currentDoctor.license}
                </span>
              </>
            ) : (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-sky-50 text-sky-700 border border-sky-200">
                Active Rehabilitation Patient
              </span>
            )}
          </div>

          {isDoctorTarget && onViewDoctorProfile && (
            <button
              type="button"
              onClick={onViewDoctorProfile}
              className="mt-1 text-[11px] font-semibold text-blue-600 hover:text-blue-800 hover:underline cursor-pointer"
            >
              View Full Clinician Credentials & PhD Research →
            </button>
          )}

          <div className="flex items-center gap-1.5 text-[11px] text-gray-400 mt-2">
            <Lock size={12} className="text-gray-400 shrink-0" />
            <span>
              {isDoctorTarget 
                ? 'Enter 4-digit PIN to authenticate Clinician Workspace' 
                : 'Enter 4-digit PIN to return to Patient Dashboard'}
            </span>
          </div>
        </div>

        {/* 4-Digit Input Boxes */}
        <div className="flex items-center justify-center gap-3 my-4" onPaste={handlePaste}>
          {pin.map((digit, idx) => (
            <input
              key={idx}
              ref={inputRefs[idx]}
              type="password"
              inputMode="numeric"
              maxLength={1}
              value={digit}
              onChange={(e) => handleChange(idx, e.target.value)}
              onKeyDown={(e) => handleKeyDown(idx, e)}
              className={`w-13 h-14 text-center text-2xl font-bold rounded-2xl border-2 transition-all outline-hidden ${
                error 
                  ? 'border-red-400 bg-red-50/50 text-red-600' 
                  : digit 
                    ? 'border-blue-600 bg-blue-50/30 text-gray-900 shadow-sm' 
                    : 'border-gray-200 bg-gray-50 focus:border-blue-500 focus:bg-white'
              }`}
            />
          ))}
        </div>

        {/* Error / Hint text */}
        <div className="min-h-[22px] flex items-center justify-center text-center">
          {error ? (
            <p className="text-xs font-semibold text-red-600 flex items-center gap-1">
              <AlertCircle size={13} />
              <span>{errorMessage}</span>
            </p>
          ) : (
            <p className="text-[11px] font-medium text-slate-400">
              Default Security PIN: <strong className="text-slate-600 font-mono">1234</strong>
            </p>
          )}
        </div>

        {/* On-screen Keypad */}
        <div className="grid grid-cols-3 gap-2 mt-3 pt-3 border-t border-gray-100">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
            <button
              key={num}
              type="button"
              onClick={() => handleKeypadPress(num)}
              className="py-2.5 text-base font-bold text-gray-800 bg-gray-50 hover:bg-gray-100 active:bg-blue-50 active:text-blue-600 rounded-xl transition-all cursor-pointer"
            >
              {num}
            </button>
          ))}
          <button
            type="button"
            onClick={() => setPin(['', '', '', ''])}
            className="py-2.5 text-xs font-semibold text-gray-400 hover:text-gray-600 rounded-xl cursor-pointer"
          >
            Clear
          </button>
          <button
            type="button"
            onClick={() => handleKeypadPress(0)}
            className="py-2.5 text-base font-bold text-gray-800 bg-gray-50 hover:bg-gray-100 active:bg-blue-50 active:text-blue-600 rounded-xl transition-all cursor-pointer"
          >
            0
          </button>
          <button
            type="button"
            onClick={handleKeypadBackspace}
            className="py-2.5 text-xs font-semibold text-gray-600 hover:bg-gray-100 rounded-xl cursor-pointer"
          >
            ⌫
          </button>
        </div>

      </div>
    </div>
  );
}
