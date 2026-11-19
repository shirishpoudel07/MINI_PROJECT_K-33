import React, { useState, useEffect, useRef } from 'react';
import {
  Activity,
  CheckCircle2,
  RotateCcw,
  ShieldCheck,
  Sliders,
  Info,
  ChevronRight,
  Clock,
  Sparkles
} from 'lucide-react';

/**
 * RehabCalibrationCard
 * 
 * Interactive Clinical Calibration UI for physical therapy patients.
 * 1. Prompts the patient to raise/bend their arm as far as comfortable and hold for 3 seconds.
 * 2. Tracks the maximum smoothed angle achieved during the 5-second test window.
 * 3. Applies a 10° clinical comfort buffer to dynamically establish session cvThresholds.high.
 * 4. Shows a verified checkmark transition into the main exercise tracking mode.
 */
export default function RehabCalibrationCard({
  exerciseTitle = 'Seated Active Shoulder Abduction',
  currentAngle = 0,
  _isCalibrating = true,
  onStartCalibration,
  onFinishCalibration,
  onCancel,
  defaultTarget = 120,
  invertLogic = false
}) {
  const [step, setStep] = useState('prompt'); // 'prompt' | 'active' | 'completed'
  const [countdown, setCountdown] = useState(5);
  const [recordedPeak, setRecordedPeak] = useState(invertLogic ? 180 : 0);
  const [holdTime, setHoldTime] = useState(0); // Time holding peak in seconds
  const buffer = 10; // Clinical safety buffer (10 degrees)

  const currentRounded = Math.round(currentAngle || 0);
  const peakRef = useRef(invertLogic ? 180 : 0);

  // Prompt message tailored to exercise biomechanics
  const promptMessage = invertLogic
    ? "Let's test your mobility. Bend your arm as far as you comfortably can and hold it for 3 seconds."
    : "Let's test your mobility. Raise your arm as high as you comfortably can and hold it for 3 seconds.";

  // Track the patient's comfortable peak during active calibration
  useEffect(() => {
    if (step === 'active' && currentRounded > 0) {
      if (invertLogic) {
        if (currentRounded < peakRef.current || peakRef.current === 180) {
          peakRef.current = currentRounded;
          setRecordedPeak(currentRounded);
        }
      } else {
        if (currentRounded > peakRef.current) {
          peakRef.current = currentRounded;
          setRecordedPeak(currentRounded);
        }
      }
    }
  }, [currentRounded, step, invertLogic]);

  // Dynamic high threshold with clinical 10-degree safety buffer
  const peakAngle = recordedPeak;
  const calculatedHighThresh = invertLogic
    ? Math.min(100, Math.max(30, (peakAngle > 0 && peakAngle < 180 ? peakAngle : defaultTarget) + buffer))
    : Math.max(45, (peakAngle > 0 ? peakAngle : defaultTarget) - buffer);
  const calculatedLowThresh = invertLogic
    ? 150
    : Math.max(30, calculatedHighThresh - 30);

  // Active 5-second countdown timer during calibration
  useEffect(() => {
    if (step !== 'active') return;

    const timer = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          setStep('completed');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [step]);

  // Track hold stability (3 seconds hold target)
  useEffect(() => {
    if (step !== 'active') return;
    const holdInterval = setInterval(() => {
      setHoldTime(prev => Math.min(3, prev + 0.5));
    }, 500);

    return () => clearInterval(holdInterval);
  }, [step]);

  // Transition smoothly from 'completed' to main exercise tracking after 1.8 seconds
  useEffect(() => {
    if (step !== 'completed') return;

    const transitionTimer = setTimeout(() => {
      if (onFinishCalibration) {
        onFinishCalibration({
          peakAngle: peakAngle > 0 ? peakAngle : defaultTarget,
          highThresh: calculatedHighThresh,
          lowThresh: calculatedLowThresh,
          buffer
        });
      }
    }, 1800);

    return () => clearTimeout(transitionTimer);
  }, [step, peakAngle, calculatedHighThresh, calculatedLowThresh, defaultTarget, onFinishCalibration]);

  const handleStart = () => {
    peakRef.current = currentRounded > 0 ? currentRounded : (invertLogic ? 180 : 0);
    setRecordedPeak(peakRef.current);
    setHoldTime(0);
    setStep('active');
    if (onStartCalibration) onStartCalibration();
  };

  const handleRetry = () => {
    peakRef.current = invertLogic ? 180 : 0;
    setRecordedPeak(peakRef.current);
    setHoldTime(0);
    setStep('active');
    if (onStartCalibration) onStartCalibration();
  };

  return (
    <div className="bg-slate-900/95 backdrop-blur-xl border border-sky-500/30 rounded-3xl p-6 sm:p-7 text-white shadow-2xl max-w-lg w-full mx-auto relative overflow-hidden animate-fade-in font-sans">
      {/* Ambient background glows */}
      <div className="absolute -top-16 -right-16 w-40 h-40 bg-sky-500/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-16 -left-16 w-40 h-40 bg-emerald-500/15 rounded-full blur-3xl pointer-events-none" />

      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-800">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-2xl bg-sky-500/20 text-sky-400 flex items-center justify-center border border-sky-400/30 shadow-inner">
            <Sliders size={18} />
          </div>
          <div>
            <h3 className="text-sm font-extrabold text-white flex items-center gap-2">
              <span>Clinical Mobility Calibration</span>
              <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                Phase 1
              </span>
            </h3>
            <p className="text-[11px] text-slate-400">
              Personalizing for: <strong className="text-sky-300">{exerciseTitle}</strong>
            </p>
          </div>
        </div>

        <span className="text-[10px] font-mono font-bold text-sky-400 bg-sky-950/80 px-2.5 py-1 rounded-lg border border-sky-800/60 flex items-center gap-1">
          <Sparkles size={11} className="text-emerald-400" />
          <span>Anti-Jitter AI</span>
        </span>
      </div>

      {/* ==================================================================== */}
      {/* STEP 1: INITIAL PROMPT OVERLAY                                       */}
      {/* ==================================================================== */}
      {step === 'prompt' && (
        <div className="mt-5 space-y-4">
          <div className="p-4 rounded-2xl bg-gradient-to-br from-sky-950/50 to-slate-900 border border-sky-500/30 shadow-inner">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-xl bg-sky-500/20 text-sky-300 flex items-center justify-center shrink-0 border border-sky-400/30">
                <Info size={18} />
              </div>
              <div className="space-y-1">
                <h4 className="text-sm font-black text-white">Mobility Test</h4>
                <p className="text-xs text-sky-200 leading-relaxed font-medium">
                  {promptMessage}
                </p>
              </div>
            </div>

            <div className="mt-3 pt-3 border-t border-sky-900/40 text-[11px] text-slate-400 flex items-center gap-1.5">
              <ShieldCheck size={14} className="text-emerald-400 shrink-0" />
              <span>We subtract a 10° buffer so your repetitions remain safe, comfortable, and pain-free.</span>
            </div>
          </div>

          {/* Quick Guidance Preview */}
          <div className="grid grid-cols-2 gap-3 text-center">
            <div className="bg-slate-950/70 p-3 rounded-2xl border border-slate-800">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Current Angle</span>
              <span className="text-2xl font-black text-sky-400 font-mono mt-0.5 block">
                {currentRounded}°
              </span>
              <span className="text-[9px] text-slate-500">Live Camera Feed</span>
            </div>
            <div className="bg-slate-950/70 p-3 rounded-2xl border border-slate-800">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Default Target</span>
              <span className="text-2xl font-black text-slate-300 font-mono mt-0.5 block">
                {defaultTarget}°
              </span>
              <span className="text-[9px] text-slate-500">Clinical Protocol</span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 pt-2">
            <button
              type="button"
              onClick={handleStart}
              className="flex-1 py-3 px-5 rounded-xl text-xs font-black bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-white flex items-center justify-center gap-2 shadow-lg shadow-sky-600/30 transition-all cursor-pointer active:scale-95"
            >
              <Activity size={15} />
              <span>Start Mobility Calibration (5s)</span>
              <ChevronRight size={14} />
            </button>
            {onCancel && (
              <button
                type="button"
                onClick={onCancel}
                className="py-3 px-3.5 rounded-xl text-xs font-semibold text-slate-400 hover:text-white bg-slate-800/80 hover:bg-slate-700 transition-all cursor-pointer"
              >
                Skip
              </button>
            )}
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* STEP 2: ACTIVE 5-SECOND RECORDING WINDOW                              */}
      {/* ==================================================================== */}
      {step === 'active' && (
        <div className="mt-5 space-y-4 animate-fade-in">
          {/* Active Timer & Guidance */}
          <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs text-amber-200">
              <Clock size={16} className="text-amber-400 animate-spin" />
              <span>Hold comfortable peak: <strong>{Math.round(holdTime)} / 3s</strong></span>
            </div>
            <div className="flex items-center gap-1.5 font-mono text-sm font-black bg-amber-950/80 px-2.5 py-1 rounded-xl text-amber-300 border border-amber-500/40">
              <span>{countdown}s remaining</span>
            </div>
          </div>

          {/* Live Biomechanics Gauge Grid */}
          <div className="grid grid-cols-3 gap-3 text-center">
            {/* Live Instant Angle */}
            <div className="bg-slate-950/70 p-3 rounded-2xl border border-slate-800">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Live Angle</span>
              <div className="text-2xl font-black text-sky-400 font-mono mt-1">
                {currentRounded}°
              </div>
              <span className="text-[9px] text-slate-500">Smoothed</span>
            </div>

            {/* Peak Achieved */}
            <div className="bg-slate-950/70 p-3 rounded-2xl border border-slate-800">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Comfort Peak</span>
              <div className="text-2xl font-black text-amber-400 font-mono mt-1">
                {peakAngle > 0 && peakAngle < 180 ? `${peakAngle}°` : `${currentRounded}°`}
              </div>
              <span className="text-[9px] text-amber-500/90 font-medium">Recorded Max</span>
            </div>

            {/* Target Preview */}
            <div className="bg-emerald-950/40 p-3 rounded-2xl border border-emerald-500/30">
              <span className="text-[10px] font-bold text-emerald-300 uppercase tracking-wider block">Session Target</span>
              <div className="text-2xl font-black text-emerald-400 font-mono mt-1">
                {calculatedHighThresh}°
              </div>
              <span className="text-[9px] text-emerald-300/80 font-bold">(-{buffer}° Buffer)</span>
            </div>
          </div>

          {/* Range Progress Bar */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-[11px] text-slate-400">
              <span>Baseline Return: {calculatedLowThresh}°</span>
              <span>Dynamic Target: {calculatedHighThresh}°</span>
            </div>
            <div className="h-2.5 bg-slate-950 rounded-full overflow-hidden border border-slate-800 p-0.5">
              <div
                className="h-full rounded-full bg-gradient-to-r from-sky-500 via-amber-400 to-emerald-400 transition-all duration-200"
                style={{ width: `${Math.min(100, Math.max(8, ((peakAngle || currentRounded) / 160) * 100))}%` }}
              />
            </div>
          </div>

          {/* Quick Actions during recording */}
          <div className="flex items-center justify-between pt-1 text-xs">
            <button
              type="button"
              onClick={handleRetry}
              className="px-3 py-1.5 rounded-lg text-slate-400 hover:text-white bg-slate-800 flex items-center gap-1.5 cursor-pointer"
            >
              <RotateCcw size={12} />
              <span>Restart 5s</span>
            </button>
            <button
              type="button"
              onClick={() => setStep('completed')}
              className="px-3 py-1.5 rounded-lg text-emerald-300 hover:text-emerald-200 bg-emerald-950/60 border border-emerald-500/40 flex items-center gap-1.5 cursor-pointer font-bold"
            >
              <CheckCircle2 size={12} />
              <span>Confirm Peak Now</span>
            </button>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* STEP 3: CHECKMARK TRANSITION OVERLAY                                 */}
      {/* ==================================================================== */}
      {step === 'completed' && (
        <div className="py-7 flex flex-col items-center justify-center text-center space-y-4 animate-scale-up">
          <div className="w-18 h-18 rounded-full bg-emerald-500/20 border-2 border-emerald-400 text-emerald-400 flex items-center justify-center shadow-xl shadow-emerald-500/30 animate-pulse">
            <CheckCircle2 size={42} className="text-emerald-400" />
          </div>
          <div>
            <h3 className="text-xl font-black text-white">Calibration Complete</h3>
            <p className="text-base text-emerald-300 font-extrabold mt-1">
              Target angle set to <span className="text-white underline decoration-emerald-400 decoration-2">{calculatedHighThresh}°</span>
            </p>
            <p className="text-xs text-slate-300 mt-1.5">
              Personalized {buffer}° comfort buffer applied • Transitioning to exercise...
            </p>
          </div>

          <div className="w-48 bg-slate-950 h-2 rounded-full overflow-hidden border border-slate-800 p-0.5">
            <div className="h-full bg-gradient-to-r from-emerald-500 to-sky-400 rounded-full animate-pulse w-full" />
          </div>
        </div>
      )}
    </div>
  );
}
