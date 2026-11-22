import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  Camera,
  X,
  CheckCircle2,
  AlertTriangle,
  Volume2,
  VolumeX,
  Activity,
  RotateCcw,
  Sparkles,
  Play,
  Pause,
  ShieldCheck,
  Hand,
  Lock,
  AlertCircle,
  Columns,
  Maximize2,
  Minimize2,
  UserCheck,
  Stethoscope
} from 'lucide-react';
import { createRehabRepTracker } from '../utils/rehabRepTracker';

// Biomechanical landmark connections for full-body skeleton rendering
const _POSE_CONNECTIONS = [
  // Head & Neck to Shoulders
  [0, 11], [0, 12],
  // Torso & Spine
  [11, 12], [11, 23], [12, 24], [23, 24],
  // Left Arm
  [11, 13], [13, 15], [15, 17], [15, 19], [15, 21],
  // Right Arm
  [12, 14], [14, 16], [16, 18], [16, 20], [16, 22],
  // Left Leg
  [23, 25], [25, 27], [27, 29], [29, 31],
  // Right Leg
  [24, 26], [26, 28], [28, 30], [30, 32]
];

// Hand & Finger Landmark Connections (21 points per hand)
const HAND_CONNECTIONS = [
  // Thumb
  [0, 1], [1, 2], [2, 3], [3, 4],
  // Index Finger
  [0, 5], [5, 6], [6, 7], [7, 8],
  // Middle Finger
  [9, 10], [10, 11], [11, 12],
  // Ring Finger
  [13, 14], [14, 15], [15, 16],
  // Pinky Finger
  [0, 17], [17, 18], [18, 19], [19, 20],
  // Palm Base / Knuckles
  [5, 9], [9, 13], [13, 17]
];

// Robust 2D vector angle calculation using atan2 difference (vertex at B)
function calculateAngle(a, b, c) {
  if (!a || !b || !c || typeof a.x !== 'number' || typeof b.x !== 'number' || typeof c.x !== 'number') return 90;
  const radians = Math.atan2(c.y - b.y, c.x - b.x) - Math.atan2(a.y - b.y, a.x - b.x);
  let angle = Math.abs((radians * 180.0) / Math.PI);
  if (angle > 180.0) {
    angle = 360.0 - angle;
  }
  return Math.round(angle);
}

// Crisp, positive audio chimes via Web Audio API (zero latency, zero external assets)
function playRepHarmonicChime(currentRep, totalReps) {
  try {
    if (typeof window === 'undefined') return;
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const now = ctx.currentTime;

    if (currentRep >= totalReps) {
      // Victory Fanfare Triad: C5 -> E5 -> G5 -> C6
      const notes = [523.25, 659.25, 783.99, 1046.50];
      notes.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, now + idx * 0.09);
        gain.gain.setValueAtTime(0.09, now + idx * 0.09);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.09 + 0.38);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + idx * 0.09);
        osc.stop(now + idx * 0.09 + 0.38);
      });
    } else {
      // Ascending Two-Tone Rep Completion Chime: D5 (587Hz) -> A5 (880Hz)
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(587.33, now);
      gain1.gain.setValueAtTime(0.08, now);
      gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
      osc1.connect(gain1);
      gain1.connect(ctx.destination);
      osc1.start(now);
      osc1.stop(now + 0.12);

      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(880, now + 0.07);
      gain2.gain.setValueAtTime(0.09, now + 0.07);
      gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.26);
      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      osc2.start(now + 0.07);
      osc2.stop(now + 0.26);
    }
  } catch {
    // Audio fallback if browser blocked
  }
}

// Cache loaded scripts to prevent concurrent or duplicate script injection
const loadedScripts = new Map();

function loadScript(src, fallbackSrc) {
  if (loadedScripts.has(src)) {
    return loadedScripts.get(src);
  }
  const promise = new Promise((resolve, reject) => {
    if (src.includes('pose.js') && window.Pose) {
      resolve();
      return;
    }
    if (src.includes('hands.js') && window.Hands) {
      resolve();
      return;
    }

    const existing = document.querySelector(`script[src="${src}"]`);
    if (existing) {
      if (existing.dataset.loaded === 'true') {
        resolve();
        return;
      }
      existing.addEventListener('load', () => resolve(), { once: true });
      existing.addEventListener('error', (err) => {
        if (fallbackSrc) {
          loadScript(fallbackSrc).then(resolve).catch(reject);
        } else {
          reject(err);
        }
      }, { once: true });
      return;
    }

    const script = document.createElement('script');
    script.src = src;
    script.crossOrigin = 'anonymous';
    script.onload = () => {
      script.dataset.loaded = 'true';
      resolve();
    };
    script.onerror = (err) => {
      loadedScripts.delete(src);
      if (fallbackSrc) {
        loadScript(fallbackSrc).then(resolve).catch(reject);
      } else {
        reject(err);
      }
    };
    document.head.appendChild(script);
  });
  loadedScripts.set(src, promise);
  return promise;
}

// Pick the most relevant demonstration video based on exercise title
function getExerciseDemoVideo(title = '') {
  const t = title.toLowerCase();
  if (t.includes('abduction') || t.includes('lateral')) return '/videos/wall-slides.mp4';
  if (t.includes('flexion') || t.includes('curl') || t.includes('bicep') || (t.includes('elbow') && !t.includes('extension'))) return '/videos/shoulder-rotation.mp4';
  if (t.includes('reach') || t.includes('press') || t.includes('overhead')) return '/videos/wall-slides.mp4';
  if (t.includes('wall') || t.includes('elevation') || t.includes('crawl')) return '/videos/wall-slides.mp4';
  if (t.includes('heel') || (t.includes('slide') && !t.includes('wall'))) return '/videos/heel-slides.mp4';
  if (t.includes('quad') || t.includes('isometric')) return '/videos/quad-sets.mp4';
  if (t.includes('pendulum') || t.includes('codman')) return '/videos/pendulum.mp4';
  if (t.includes('rotation') || t.includes('rotator')) return '/videos/shoulder-rotation.mp4';
  if (t.includes('ankle') || t.includes('pump')) return '/videos/ankle-pumps.mp4';
  if (t.includes('seated') && t.includes('knee')) return '/videos/seated-knee.mp4';
  if (t.includes('knee') || t.includes('extension')) return '/videos/knee-extension.mp4';
  if (t.includes('straight') || t.includes('slr') || (t.includes('leg') && t.includes('raise'))) return '/videos/straight-leg.mp4';
  return '/videos/squat-rehab.mp4';
}

// Determine exercise movement protocol and clinical targets
function getExerciseProtocol(title = '') {
  const t = title.toLowerCase();

  // 1. Seated Active Shoulder Abduction (Deltoids, Shoulder Joint: hip, shoulder, elbow; high: 80, low: 30)
  if (t.includes('abduction') || t.includes('lateral') || (t.includes('shoulder') && t.includes('active')) || (t.includes('raise') && !t.includes('leg'))) {
    return {
      type: 'LATERAL_RAISES',
      category: 'Shoulder Mobility',
      name: 'Seated Active Shoulder Abduction',
      targetText: 'Keep arms straight, slowly raise both arms out to sides until parallel (80°+), then lower (30°)',
      targetAngle: 80,
      trackingJoints: ['hip', 'shoulder', 'elbow'],
      cvThresholds: { high: 80, low: 30 },
      invertLogic: false,
      defaultMode: 'pose'
    };
  }

  // 2. Seated Elbow Flexion (Elbow Mobility: shoulder, elbow, wrist; high: 50, low: 150, invertLogic: true)
  if (t.includes('flexion') || t.includes('curl') || t.includes('bicep') || (t.includes('elbow') && !t.includes('extension'))) {
    return {
      type: 'BICEP_CURLS',
      category: 'Elbow Mobility',
      name: 'Seated Elbow Flexion',
      targetText: 'Keep elbows pinned to ribs, bend elbows to bring hands to shoulders (≤50°), then extend fully (150°+)',
      targetAngle: 50,
      trackingJoints: ['shoulder', 'elbow', 'wrist'],
      cvThresholds: { high: 50, low: 150 },
      invertLogic: true,
      defaultMode: 'pose'
    };
  }

  // 3. Seated Overhead Reach (Shoulder Range of Motion: shoulder, elbow, wrist; high: 160, low: 90)
  if (t.includes('reach') || t.includes('press') || t.includes('overhead')) {
    return {
      type: 'OVERHEAD_PRESS',
      category: 'Shoulder Range of Motion',
      name: 'Seated Overhead Reach',
      targetText: 'From shoulder height (90°), reach hands straight up toward ceiling (160°+), then lower',
      targetAngle: 160,
      trackingJoints: ['shoulder', 'elbow', 'wrist'],
      cvThresholds: { high: 160, low: 90 },
      invertLogic: false,
      defaultMode: 'pose'
    };
  }

  if (t.includes('hand') || t.includes('finger') || t.includes('grip') || t.includes('pinch')) {
    return {
      type: 'HANDS',
      category: 'Hand & Fine Motor',
      name: 'Finger Extension & Precision Grip',
      targetText: 'Open fingers fully or perform precision grip, then close to fist',
      defaultMode: 'hands'
    };
  }

  if (t.includes('quad') || t.includes('isometric')) {
    return {
      type: 'QUAD_SETS',
      category: 'Quadriceps Isometric Activation',
      name: 'Quad Sets (Isometric Activation)',
      targetText: 'Press knee flat down into mat, lock straight (148°+) and hold for 1 second',
      targetAngle: 150,
      defaultMode: 'pose'
    };
  }

  if (t.includes('heel') || (t.includes('slide') && !t.includes('wall') && !t.includes('press'))) {
    return {
      type: 'HEEL_SLIDES',
      category: 'Post-Op Mobility',
      name: 'Supine Heel Slides on Mat',
      targetText: 'Slide heel toward hip to bend knee (≤128°), then extend leg back flat (140°+)',
      targetAngle: 125,
      defaultMode: 'pose'
    };
  }

  if (t.includes('straight') || (t.includes('leg') && t.includes('raise')) || t.includes('slr') || t.includes('leg lift')) {
    return {
      type: 'STRAIGHT_LEG_RAISE',
      category: 'Knee & Hip Quad Activation',
      name: 'Straight Leg Raises (SLR)',
      targetText: 'Keep knee locked straight (130°+), elevate heel 8-12 inches, then lower to mat',
      targetAngle: 140,
      defaultMode: 'pose'
    };
  }

  if ((t.includes('knee') && t.includes('extension')) || (t.includes('knee') && !t.includes('squat'))) {
    return {
      type: 'KNEE_EXTENSION',
      category: 'Quadriceps Strengthening',
      name: 'Seated Knee Extension (Long Arc Quads)',
      targetText: 'Extend lower leg straight to 130°+, hold briefly, and lower slowly to seated',
      targetAngle: 135,
      defaultMode: 'pose'
    };
  }

  if (t.includes('crawl') || (t.includes('wall') && t.includes('shoulder')) || t.includes('wall crawl')) {
    return {
      type: 'WALL_CRAWL',
      category: 'Range of Motion',
      name: 'Shoulder Wall Crawls',
      targetText: 'Stand facing wall, slowly crawl fingers upward to 140°+ elevation stretch, then lower (70°)',
      targetAngle: 140,
      trackingJoints: ['hip', 'shoulder', 'elbow'],
      cvThresholds: { high: 140, low: 70 },
      invertLogic: false,
      defaultMode: 'pose'
    };
  }

  if (t.includes('pendulum') || t.includes('codman')) {
    return {
      type: 'PENDULUM',
      category: 'Joint Mobility',
      name: 'Shoulder Pendulums',
      targetText: 'Lean forward supporting good arm on table, let arm hang relaxed and swing in gentle circles',
      targetAngle: 45,
      defaultMode: 'pose'
    };
  }

  if (t.includes('scapular') || t.includes('retraction') || t.includes('rhomboid')) {
    return {
      type: 'SCAPULAR_RETRACTION',
      category: 'Strengthening & Posture',
      name: 'Standing Scapular Retractions',
      targetText: 'Stand tall, squeeze shoulder blades firmly backward together (90°+ target, hold 5s), then release',
      targetAngle: 90,
      trackingJoints: ['shoulder', 'elbow', 'hip'],
      cvThresholds: { high: 90, low: 45 },
      invertLogic: false,
      defaultMode: 'pose'
    };
  }

  if (t.includes('chin') || t.includes('tuck') || t.includes('cervical') || t.includes('neck')) {
    return {
      type: 'CERVICAL_CHIN_TUCK',
      category: 'Postural Correction',
      name: 'Seated Cervical Chin Tucks',
      targetText: 'Sit upright, glide chin straight backward into double chin alignment (hold 3-5s), then return',
      targetAngle: 45,
      trackingJoints: ['nose', 'ear', 'shoulder'],
      cvThresholds: { high: 45, low: 15 },
      invertLogic: false,
      defaultMode: 'pose'
    };
  }

  if (t.includes('press') || t.includes('wall') || t.includes('overhead') || t.includes('elevation') || (t.includes('shoulder') && !t.includes('rotation') && !t.includes('rotator'))) {
    return {
      type: 'ARM_ELEVATION',
      category: 'Shoulder Elevation & ROM',
      name: 'Upper Body Elevation',
      targetText: 'Raise arms with steady control through full overhead range of motion',
      targetAngle: 135,
      defaultMode: 'pose'
    };
  }

  if (t.includes('rotation') || t.includes('rotator')) {
    return {
      type: 'SHOULDER_ROTATION',
      category: 'Rotator Cuff Mobility',
      name: 'Shoulder External Rotation',
      targetText: 'Keep elbow pinned at 90°, rotate forearm outward, then return across abdomen',
      targetAngle: 50,
      defaultMode: 'pose'
    };
  }

  if (t.includes('pendulum') || t.includes('codman')) {
    return {
      type: 'PENDULUM',
      category: 'Passive Shoulder Mobility',
      name: 'Codman Pendulum Swings',
      targetText: 'Lean torso forward 30°-55°, let arm swing through smooth full cycles',
      targetAngle: 45,
      defaultMode: 'pose'
    };
  }

  if (t.includes('ankle') || t.includes('pump')) {
    return {
      type: 'ANKLE_PUMPS',
      category: 'Circulatory & Ankle Recovery',
      name: 'Ankle Pumps & Edema Drainage',
      targetText: 'Point toes down (plantarflex), then pull toes toward shin (dorsiflex)',
      targetAngle: 85,
      defaultMode: 'pose'
    };
  }

  // Default to Full Body Squat Rehabilitation Protocol
  return {
    type: 'SQUAT',
    category: 'Lower Body Functional Rehab',
    name: 'Squat Rehabilitation Protocol',
    targetText: 'Lower hips smoothly toward 125°-138° depth with knees tracking over toes, then stand tall',
    targetAngle: 130,
    defaultMode: 'pose'
  };
}

export default function AiMotionCoachModal({
  isOpen,
  onClose,
  exercise,
  patient,
  onCompleteExercise
}) {
  const protocol = useMemo(() => {
    const base = getExerciseProtocol(exercise?.title || '');
    return {
      ...base,
      name: exercise?.title || base.name,
      category: exercise?.category || base.category,
      trackingJoints: exercise?.trackingJoints || base.trackingJoints,
      cvThresholds: exercise?.cvThresholds || base.cvThresholds,
      invertLogic: exercise?.invertLogic !== undefined ? exercise.invertLogic : base.invertLogic
    };
  }, [exercise?.title, exercise?.category, exercise?.trackingJoints, exercise?.cvThresholds, exercise?.invertLogic]);

  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const poseInstanceRef = useRef(null);
  const handsInstanceRef = useRef(null);
  const demoVideoRef = useRef(null);
  const lastSpokenTimeRef = useRef(0);
  const smoothedAngleRef = useRef(180);
  const isInferencingRef = useRef(false);
  const streamRef = useRef(null);
  const naturalVoiceRef = useRef(null);

  // Vision Mode: 'pose' (Full Body) | 'hands' (21 Finger Joints)
  const [visionMode, setVisionMode] = useState(protocol.defaultMode);

  // Real-time body visibility detection: 'WHOLE_BODY' | 'UPPER_BODY' | 'ACQUIRING'
  const [detectedBodyPart, setDetectedBodyPart] = useState('ACQUIRING');

  // View Layout Mode: 'split' (Default 50/50 Dual Video & Webcam) | 'focus' (Webcam Focus) | 'webcam' (100% Camera)
  const [viewLayout, setViewLayout] = useState('split');
  const [isDemoPlaying, setIsDemoPlaying] = useState(true);
  const [isDemoMuted, setIsDemoMuted] = useState(true);

  const [isLoadingModel, setIsLoadingModel] = useState(true);
  const [cameraError, setCameraError] = useState('');
  const [retryCameraCount, setRetryCameraCount] = useState(0);
  const [isVoiceMuted, setIsVoiceMuted] = useState(false);
  const [fps, setFps] = useState(30);
  const frameCountRef = useRef(0);
  const lastFpsTimeRef = useRef(0);

  // =========================================================================
  // DOCTOR'S PRESCRIBED REPS & PROGRESS TRACKING
  // =========================================================================
  // Exact reps prescribed by the clinician (NOT artificially clamped!)
  const targetReps = Number(exercise?.reps) || 10;
  const prescribedSets = Number(exercise?.sets) || 3;
  const clinicalNotes = exercise?.notes || 'Perform controlled repetitions with steady breathing.';

  const [completedReps, setCompletedReps] = useState(0);
  const [correctReps, setCorrectReps] = useState(0);
  const [complianceScore, setComplianceScore] = useState(100);
  const [autoCompleteCountdown, setAutoCompleteCountdown] = useState(null);

  // Clinical anti-jitter rep tracker (Moving Average, Hysteresis, Debounce Cooldown)
  const repTrackerRef = useRef(null);

  // Debounced Audio Form Correction Tracking Refs
  const repMotionStartTimeRef = useRef(0);
  const lastStallPromptTimeRef = useRef(0);

  // Live Kinematic Telemetry for HUD display
  const [trackerTelemetry, setTrackerTelemetry] = useState({
    state: 'down',
    cooldownRemaining: 0,
    progressPercent: 0,
    smoothedAngle: 0,
    rawAngle: 0
  });

  // Re-initialize tracker whenever active exercise changes
  useEffect(() => {
    const cvThresh = exercise?.cvThresholds || protocol.cvThresholds;
    const isInv = exercise?.invertLogic !== undefined ? exercise.invertLogic : protocol.invertLogic;
    repTrackerRef.current = createRehabRepTracker(exercise?.title || protocol.name, {
      highThresh: cvThresh?.high ?? protocol.targetAngle ?? 120,
      lowThresh: cvThresh?.low ?? Math.max(30, (protocol.targetAngle || 120) - 35),
      windowSize: 8,
      cooldownFrames: 18,
      bufferDegrees: 10,
      inverted: Boolean(isInv),
      cvThresholds: cvThresh,
      invertLogic: Boolean(isInv)
    });
  }, [exercise?.title, exercise?.cvThresholds, exercise?.invertLogic, protocol.name, protocol.targetAngle, protocol.cvThresholds, protocol.invertLogic]);

  // Target angle thresholds derived for clinical telemetry HUD
  const { targetHighAngle, targetLowAngle } = useMemo(() => {
    const cvThresh = exercise?.cvThresholds || protocol.cvThresholds;
    const isInv = exercise?.invertLogic !== undefined ? exercise.invertLogic : protocol.invertLogic;
    return {
      targetHighAngle: cvThresh?.high ?? protocol.targetAngle ?? 80,
      targetLowAngle: cvThresh?.low ?? (isInv ? 150 : 30)
    };
  }, [exercise?.cvThresholds, exercise?.invertLogic, protocol.cvThresholds, protocol.targetAngle, protocol.invertLogic]);

  const [movementState, setMovementState] = useState({
    isMoving: false,
    label: 'Ready / Following Video'
  });

  const goodFramesRef = useRef(0);
  const totalFramesRef = useRef(0);
  const lastUiUpdateRef = useRef(0);
  const lastVerdictRef = useRef('');
  const lastFeedbackRef = useRef('');

  // Multi-joint live angles
  const [liveAngles, setLiveAngles] = useState({
    primary: 180,
    rawPrimary: 180,
    leftKnee: 180,
    rightKnee: 180,
    leftElbow: 180,
    rightElbow: 180,
    leftShoulder: 90,
    rightShoulder: 90,
    torsoIncline: 0,
    valgusDetected: false
  });

  const [formStatus, setFormStatus] = useState('READY');
  const [formFeedback, setFormFeedback] = useState('Position full body in camera frame');
  const [isCorrectForm, setIsCorrectForm] = useState(false);
  const [aiVerdict, setAiVerdict] = useState('CALIBRATING');
  const [isAiJudgedCorrect, setIsAiJudgedCorrect] = useState(false);



  // Finger & Hand Biomechanics State (Specialized Hand Alignment & Grip Assessment)
  const [handMetrics, setHandMetrics] = useState({
    fingerCount: 0,
    fingers: { thumb: false, index: false, middle: false, ring: false, pinky: false },
    fingerAlignment: { index: true, middle: true, ring: true, pinky: true },
    jointAngles: { indexPip: 180, middlePip: 180, ringPip: 180, pinkyPip: 180 },
    alignmentVerdict: 'CORRECT',
    gripType: 'OPEN_PALM',
    gripLabel: 'Open Palm',
    gripSpanPercent: 50,
    handShape: 'Open Hand ✋',
    handCorrectness: 'CORRECT',
    pinchDistance: 100,
    isPinch: false,
    handDetected: false
  });

  // =========================================================================
  // NATURAL HUMAN-LIKE VOICE SYNTHESIS ENGINE
  // =========================================================================
  // Automatically select the highest-quality neural/natural voice
  const initNaturalVoice = useCallback(() => {
    if (typeof window === 'undefined' || !window.speechSynthesis) return;
    const voices = window.speechSynthesis.getVoices();
    if (!voices || voices.length === 0) return;

    // Preference: 1. Natural Neural -> 2. Google US -> 3. Apple Samantha -> 4. Any clean English voice
    const bestVoice =
      voices.find(v => v.lang.startsWith('en') && (v.name.includes('Natural') || v.name.includes('Online (Natural)') || v.name.includes('Neural'))) ||
      voices.find(v => v.lang.startsWith('en') && (v.name.includes('Google') || v.name.includes('Samantha') || v.name.includes('Enhanced'))) ||
      voices.find(v => v.lang.startsWith('en') && !v.name.includes('eSpeak') && !v.name.includes('Desktop')) ||
      voices.find(v => v.lang.startsWith('en')) ||
      voices[0];

    naturalVoiceRef.current = bestVoice || null;
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined' || !window.speechSynthesis) return;
    initNaturalVoice();
    window.speechSynthesis.onvoiceschanged = initNaturalVoice;
    return () => {
      if (window.speechSynthesis) {
        window.speechSynthesis.onvoiceschanged = null;
      }
    };
  }, [initNaturalVoice]);

  // Natural warm spoken feedback
  const speakFeedback = useCallback((text, priority = false) => {
    if (isVoiceMuted || typeof window === 'undefined' || !window.speechSynthesis) return;
    const now = Date.now();
    // Allow rep count celebrations to speak immediately
    if (!priority && now - lastSpokenTimeRef.current < 2000) return;
    lastSpokenTimeRef.current = now;

    try {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      if (naturalVoiceRef.current) {
        utterance.voice = naturalVoiceRef.current;
      }
      utterance.rate = 1.0;     // Warm, human conversational rate
      utterance.pitch = 1.05;   // Uplifting, encouraging inflection
      utterance.volume = 1.0;
      window.speechSynthesis.speak(utterance);
    } catch {
      // Audio fallback
    }
  }, [isVoiceMuted]);

  // =========================================================================
  // CLINICAL REP COMPLETION HANDLER: Counts each rep up to targetReps
  // =========================================================================
  const handleRepCompleted = useCallback((_exerciseName = 'repetition') => {
    setCompletedReps(prev => prev + 1);

    setCorrectReps(prev => {
      const nextRep = prev + 1;

      // Play ascending harmonic chime on every successful rep
      playRepHarmonicChime(nextRep, targetReps);

      if (nextRep >= targetReps) {
        // Complete Doctor's Dosage Target Met!
        speakFeedback(`Outstanding! You completed all ${targetReps} reps prescribed by your doctor! Workout goal achieved!`, true);
        setIsAiJudgedCorrect(true);
        setAutoCompleteCountdown(6);
      } else {
        // Softly speak randomized encouraging praise per rep
        const repPraisePhrases = [
          `Good job! Rep ${nextRep}.`,
          `Rep ${nextRep}. Keep it up!`,
          `Nice work, that's ${nextRep}!`,
          `${nextRep}. Great range of motion!`,
          `One, two, and ${nextRep}! Excellent control.`,
          `Rep ${nextRep}. Smooth movement, keep going.`
        ];
        const phrase = repPraisePhrases[Math.floor(Math.random() * repPraisePhrases.length)];
        speakFeedback(phrase, true);
      }
      return nextRep;
    });
  }, [targetReps, speakFeedback, setIsAiJudgedCorrect]);

  // Can complete exercise:
  // - In Hands mode: Hand is actively detected & evaluated with clinical precision
  // - In Full Body mode: All doctor prescribed reps are met OR AI certifies form
  const canComplete = visionMode === 'hands'
    ? (handMetrics.handDetected)
    : (isAiJudgedCorrect || correctReps >= targetReps || completedReps >= targetReps);

  // Handle Saving Workout & Syncing to Backend
  const handleFinishWorkout = useCallback(() => {
    if (!canComplete) return;

    if (onCompleteExercise && exercise) {
      if (visionMode === 'hands') {
        onCompleteExercise({
          ...exercise,
          aiVerified: true,
          aiJudgedCorrect: true,
          completedReps: 1,
          correctReps: 1,
          complianceScore,
          notes: `AI Hand Biomechanics: Shape: ${handMetrics.handShape}, Grip: ${handMetrics.gripLabel}, Alignment: ${handMetrics.alignmentVerdict === 'CORRECT' ? 'Correctly Aligned' : 'Evaluated'}, Precision: ${complianceScore}%. Verified 21-joint digital posture.`
        });
      } else {
        onCompleteExercise({
          ...exercise,
          aiVerified: true,
          aiJudgedCorrect: true,
          completedReps: Math.max(completedReps, correctReps),
          correctReps,
          complianceScore,
          notes: `AI Certified: Prescribed ${prescribedSets} sets × ${targetReps} reps. Completed ${correctReps} clinical reps with ${complianceScore}% precision.`
        });
      }
    }
    onClose();
  }, [canComplete, onCompleteExercise, exercise, visionMode, handMetrics, completedReps, correctReps, complianceScore, prescribedSets, targetReps, onClose]);

  // Countdown timer toward auto-completion when doctor target is certified
  useEffect(() => {
    if (autoCompleteCountdown === null) return;
    if (autoCompleteCountdown <= 0) {
      handleFinishWorkout();
      return;
    }
    const timer = setTimeout(() => {
      setAutoCompleteCountdown(prev => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearTimeout(timer);
  }, [autoCompleteCountdown, handleFinishWorkout]);

  // Calculate FPS smoothly
  const updateFpsCounter = useCallback(() => {
    frameCountRef.current += 1;
    const now = Date.now();
    if (!lastFpsTimeRef.current) {
      lastFpsTimeRef.current = now;
      return;
    }
    if (now - lastFpsTimeRef.current >= 1000) {
      const currentFps = Math.round((frameCountRef.current * 1000) / (now - lastFpsTimeRef.current));
      setFps(currentFps);
      frameCountRef.current = 0;
      lastFpsTimeRef.current = now;
    }
  }, []);

  // Demo Video Play/Pause Control
  const toggleDemoPlay = () => {
    if (!demoVideoRef.current) return;
    if (demoVideoRef.current.paused) {
      demoVideoRef.current.play();
      setIsDemoPlaying(true);
    } else {
      demoVideoRef.current.pause();
      setIsDemoPlaying(false);
    }
  };

  const restartDemo = () => {
    if (!demoVideoRef.current) return;
    demoVideoRef.current.currentTime = 0;
    demoVideoRef.current.play();
    setIsDemoPlaying(true);
  };

  // Auto-play demo video on mount
  useEffect(() => {
    if (demoVideoRef.current) {
      demoVideoRef.current.play().then(() => setIsDemoPlaying(true)).catch(() => { });
    }
  }, [isOpen, exercise?.title]);

  // =========================================================================
  // 1. Full Body & Upper Body Pose Results Callback
  // =========================================================================
  const onPoseResults = useCallback((results) => {
    updateFpsCounter();

    const canvas = canvasRef.current;
    if (!canvas) return;
    const videoEl = videoRef.current;
    if (videoEl && videoEl.videoWidth > 0 && videoEl.videoHeight > 0) {
      if (canvas.width !== videoEl.videoWidth || canvas.height !== videoEl.videoHeight) {
        canvas.width = videoEl.videoWidth;
        canvas.height = videoEl.videoHeight;
      }
    }
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    ctx.save();
    ctx.clearRect(0, 0, width, height);

    if (!results.poseLandmarks || results.poseLandmarks.length === 0) {
      setFormFeedback(prev => prev === 'Position yourself in camera view to begin' ? prev : 'Position yourself in camera view to begin');
      setAiVerdict(prev => prev === 'TRACKING' ? prev : 'TRACKING');
      setIsCorrectForm(prev => (prev ? prev : true));
      setDetectedBodyPart(prev => (prev === 'ACQUIRING' ? prev : 'ACQUIRING'));
      ctx.restore();
      return;
    }

    const lm = results.poseLandmarks;
    totalFramesRef.current += 1;
    goodFramesRef.current += 1;

    // Biomechanical limb visibility assessment (robust thresholds)
    const hasHead = Boolean(lm[0] && (lm[0].visibility || 0) > 0.15);
    const hasLeftShoulder = Boolean(lm[11] && (lm[11].visibility || 0) > 0.15);
    const hasRightShoulder = Boolean(lm[12] && (lm[12].visibility || 0) > 0.15);
    const hasShoulders = hasLeftShoulder || hasRightShoulder;

    const hasLeftElbow = Boolean(lm[13] && (lm[13].visibility || 0) > 0.15);
    const hasRightElbow = Boolean(lm[14] && (lm[14].visibility || 0) > 0.15);
    const hasArms = hasLeftElbow || hasRightElbow;

    const hasLeftWrist = Boolean(lm[15] && (lm[15].visibility || 0) > 0.12);
    const hasRightWrist = Boolean(lm[16] && (lm[16].visibility || 0) > 0.12);
    const hasAnyWrist = hasLeftWrist || hasRightWrist;

    const hasHips = Boolean((lm[23] && (lm[23].visibility || 0) > 0.15) || (lm[24] && (lm[24].visibility || 0) > 0.15));
    const hasKnees = Boolean((lm[25] && (lm[25].visibility || 0) > 0.15) || (lm[26] && (lm[26].visibility || 0) > 0.15));
    const hasAnkles = Boolean((lm[27] && (lm[27].visibility || 0) > 0.12) || (lm[28] && (lm[28].visibility || 0) > 0.12));

    const areHandsVisible = hasAnyWrist || hasArms;
    const isWholeBodyInFrame = hasShoulders && hasHips && hasKnees && hasAnkles;
    const isUpperBodyInFrame = (hasHead || hasShoulders) && (hasArms || hasAnyWrist);
    const areLegsVisible = hasKnees;

    const currentPart = isWholeBodyInFrame ? 'WHOLE_BODY' : isUpperBodyInFrame ? 'UPPER_BODY' : 'ACQUIRING';
    setDetectedBodyPart(prev => (prev !== currentPart ? currentPart : prev));

    // Reliable vertical reference if hips are out of frame (sitting close or at desk)
    const leftHipPt = (lm[23]?.visibility || 0) > 0.15 ? lm[23] : { x: lm[11].x, y: lm[11].y + 0.3 };
    const rightHipPt = (lm[24]?.visibility || 0) > 0.15 ? lm[24] : { x: lm[12].x, y: lm[12].y + 0.3 };

    // Calculate Real-Time Joint Angles
    const leftElbow = calculateAngle(lm[11], lm[13], lm[15]);
    const rightElbow = calculateAngle(lm[12], lm[14], lm[16]);
    const leftShoulder = calculateAngle(leftHipPt, lm[11], lm[13]);
    const rightShoulder = calculateAngle(rightHipPt, lm[12], lm[14]);
    const leftKnee = calculateAngle(lm[23], lm[25], lm[27]);
    const rightKnee = calculateAngle(lm[24], lm[26], lm[28]);

    const isLeftVisible = (lm[25]?.visibility || 0) >= (lm[26]?.visibility || 0);
    const defaultKneePoint = isLeftVisible ? lm[25] : lm[26];

    let torsoTilt = 0;
    if (lm[11] && lm[23]) {
      torsoTilt = Math.round(Math.abs(Math.atan2(lm[23].x - lm[11].x, lm[23].y - lm[11].y) * (180 / Math.PI)));
    }

    // Upper body hand & arm metrics
    const leftShoulderPt = lm[11];
    const rightShoulderPt = lm[12];

    // Active elbow angle: take whichever arm is more active / higher / extended
    let activeElbow = 90;
    if (hasLeftWrist && hasRightWrist) {
      activeElbow = Math.max(leftElbow, rightElbow);
    } else if (hasLeftWrist) {
      activeElbow = leftElbow;
    } else if (hasRightWrist) {
      activeElbow = rightElbow;
    } else {
      activeElbow = Math.max(leftElbow, rightElbow);
    }

    // Lower body leg metrics (SLR, Knee Extension, Heel Slides, Squats)
    const now = Date.now();
    const targetMode = protocol.type || 'ARM_ELEVATION';

    const leftAnkleY = lm[27]?.y ?? 1;
    const rightAnkleY = lm[28]?.y ?? 1;
    const isLeftElevated = leftAnkleY < rightAnkleY;

    const activeKneeExt = Math.max(leftKnee, rightKnee);
    const activeKneeFlex = Math.min(leftKnee, rightKnee);

    let primaryAngle = activeElbow;
    let focusJointPoint = defaultKneePoint;
    let formMessage = 'Follow along with the video on the side';
    let isMoving = false;
    let statusLabel = 'Ready / In View';

    // Joint kinematic angle extraction per protocol
    if (targetMode === 'LATERAL_RAISES') {
      // trackingJoints: ["hip", "shoulder", "elbow"]
      // Evaluates lateral arm raise angle relative to torso
      const isLeftElevated = leftShoulder >= rightShoulder;
      primaryAngle = Math.max(leftShoulder, rightShoulder);
      focusJointPoint = isLeftElevated ? lm[11] : lm[12];
    } else if (targetMode === 'BICEP_CURLS') {
      // trackingJoints: ["shoulder", "elbow", "wrist"] - Flexion decreases angle
      const isLeftCurled = leftElbow <= rightElbow;
      primaryAngle = Math.min(leftElbow, rightElbow);
      focusJointPoint = isLeftCurled ? lm[13] : lm[14];
    } else if (targetMode === 'OVERHEAD_PRESS') {
      // trackingJoints: ["shoulder", "elbow", "wrist"] - Combined multi-joint reach
      const activeElev = Math.max(leftShoulder, rightShoulder);
      const activeExt = Math.max(leftElbow, rightElbow);
      primaryAngle = Math.round((activeElev + activeExt) / 2);
      focusJointPoint = (leftShoulder >= rightShoulder) ? (lm[13] || lm[15]) : (lm[14] || lm[16]);
    } else if (targetMode === 'WALL_CRAWL') {
      // Wall Crawls: tracking glenohumeral forward elevation angle relative to torso
      const isLeftHigher = (lm[15]?.y ?? 1) <= (lm[16]?.y ?? 1);
      primaryAngle = Math.max(leftShoulder, rightShoulder);
      focusJointPoint = isLeftHigher ? (lm[13] || lm[15]) : (lm[14] || lm[16]);
    } else if (targetMode === 'SCAPULAR_RETRACTION') {
      // Scapular Retractions: upper arm retraction angle relative to torso / posterior excursion
      const leftRetract = calculateAngle(lm[13], lm[11], leftHipPt);
      const rightRetract = calculateAngle(lm[14], lm[12], rightHipPt);
      primaryAngle = Math.round(Math.max(leftRetract, rightRetract));
      focusJointPoint = (lm[11]?.visibility || 0) >= (lm[12]?.visibility || 0) ? lm[11] : lm[12];
    } else if (targetMode === 'CERVICAL_CHIN_TUCK') {
      // Cervical Chin Tucks: sagittal cranio-cervical retraction angle relative to spinal axis
      const leftCervical = calculateAngle(lm[7] || lm[0], lm[11], leftHipPt);
      const rightCervical = calculateAngle(lm[8] || lm[0], lm[12], rightHipPt);
      primaryAngle = Math.round((leftCervical + rightCervical) / 2);
      focusJointPoint = lm[0] || lm[11];
    } else if (targetMode === 'ARM_ELEVATION') {
      primaryAngle = Math.max(leftShoulder, rightShoulder);
      focusJointPoint = (hasLeftElbow && (!hasRightElbow || leftElbow >= rightElbow))
        ? (lm[13] || lm[15])
        : (lm[14] || lm[16] || leftShoulderPt || rightShoulderPt);
    } else if (targetMode === 'KNEE_EXTENSION') {
      primaryAngle = activeKneeExt;
      focusJointPoint = (leftKnee >= rightKnee) ? lm[25] : lm[26];
    } else if (targetMode === 'STRAIGHT_LEG_RAISE') {
      primaryAngle = isLeftElevated ? leftKnee : rightKnee;
      focusJointPoint = isLeftElevated ? lm[25] : lm[26];
    } else if (targetMode === 'HEEL_SLIDES') {
      primaryAngle = activeKneeFlex;
      focusJointPoint = (leftKnee <= rightKnee) ? lm[25] : lm[26];
    } else if (targetMode === 'SQUAT') {
      primaryAngle = (leftKnee && rightKnee) ? Math.min(leftKnee, rightKnee) : (leftKnee || rightKnee);
      focusJointPoint = (lm[25]?.visibility || 0) >= (lm[26]?.visibility || 0) ? lm[25] : lm[26];
    } else if (targetMode === 'QUAD_SETS') {
      primaryAngle = Math.max(leftKnee, rightKnee);
      focusJointPoint = (leftKnee >= rightKnee) ? lm[25] : lm[26];
    } else if (targetMode === 'SHOULDER_ROTATION') {
      const isLeftRotating = Math.abs((lm[15]?.x || 0.5) - (lm[13]?.x || 0.5)) >= Math.abs((lm[16]?.x || 0.5) - (lm[14]?.x || 0.5));
      primaryAngle = isLeftRotating ? leftElbow : rightElbow;
      focusJointPoint = isLeftRotating ? lm[13] : lm[14];
    } else if (targetMode === 'PENDULUM') {
      primaryAngle = torsoTilt;
      focusJointPoint = (lm[11]?.visibility || 0) > (lm[12]?.visibility || 0) ? lm[11] : lm[12];
    } else if (targetMode === 'ANKLE_PUMPS') {
      const leftToe = lm[31];
      const rightToe = lm[32];
      const isLeftAnkle = (leftToe?.visibility || 0) >= (rightToe?.visibility || 0);
      const activeKneePt = isLeftAnkle ? lm[25] : lm[26];
      const activeAnklePt = isLeftAnkle ? lm[27] : lm[28];
      const activeToePt = isLeftAnkle ? leftToe : rightToe;
      primaryAngle = calculateAngle(activeKneePt, activeAnklePt, activeToePt);
      focusJointPoint = activeAnklePt;
    } else {
      primaryAngle = activeElbow;
      focusJointPoint = defaultKneePoint;
    }

    // =========================================================================
    // CLINICAL REHAB REP TRACKER EVALUATION
    // 1. Moving Average Smoothing (5-10 frames rolling window)
    // 2. Hysteresis State Machine (Dual thresholds: high_thresh & low_thresh)
    // 3. Debouncing Frame Cooldown (15-20 frames refractory lock)
    // 4. Dynamic Range of Motion Calibration (Personalized peak - 10° buffer)
    // =========================================================================
    if (!repTrackerRef.current) {
      const cvThresh = exercise?.cvThresholds || protocol.cvThresholds;
      const isInv = exercise?.invertLogic !== undefined ? exercise.invertLogic : protocol.invertLogic;
      repTrackerRef.current = createRehabRepTracker(exercise?.title || protocol.name, {
        highThresh: cvThresh?.high ?? protocol.targetAngle ?? 120,
        lowThresh: cvThresh?.low ?? Math.max(30, (protocol.targetAngle || 120) - 35),
        windowSize: 8,
        cooldownFrames: 18,
        bufferDegrees: 10,
        inverted: Boolean(isInv),
        cvThresholds: cvThresh,
        invertLogic: Boolean(isInv)
      });
    }

    const tracker = repTrackerRef.current;
    const trackResult = tracker.update(primaryAngle);

    if (trackResult.justCountedRep) {
      handleRepCompleted(protocol.name || 'repetition');
    }

    const smoothed = Math.round(trackResult.smoothedAngle);
    smoothedAngleRef.current = smoothed;

    const isUp = trackResult.state === 'up';
    isMoving = isUp || trackResult.progressPercent > 20;

    if (trackResult.isCalibrating) {
      statusLabel = `Calibrating: ${smoothed}° (Peak: ${trackResult.calibratedPeak || smoothed}°)`;
      formMessage = 'Moving through comfortable range of motion...';
    } else if (trackResult.isCooldownActive) {
      statusLabel = `Rep Counted! Cooldown (${trackResult.cooldownRemaining}f)`;
      formMessage = '✨ 1 Rep Counted! Return smoothly to baseline position.';
    } else if (isUp) {
      statusLabel = protocol.invertLogic
        ? `Flexion Achieved (${smoothed}°) - State: UP`
        : `Peak Achieved (${smoothed}°) - State: UP`;
      formMessage = protocol.invertLogic
        ? `🟢 Flexion held! Lower arm smoothly back toward ${trackResult.thresholds.lowThresh}° to complete rep.`
        : `🟢 Great extension! Lower smoothly below ${trackResult.thresholds.lowThresh}° to complete rep.`;
    } else if (trackResult.progressPercent > 25) {
      statusLabel = `In Motion (${smoothed}°) - ${trackResult.progressPercent}% ROM`;
      formMessage = protocol.invertLogic
        ? `Curling smoothly toward ${trackResult.thresholds.highThresh}° flexion target...`
        : `Elevating smoothly toward ${trackResult.thresholds.highThresh}° target...`;
    } else {
      statusLabel = `At Baseline (${smoothed}°) - State: DOWN`;
      formMessage = `Begin movement: reach toward personalized target (${trackResult.thresholds.highThresh}°)`;
    }

    const hasReachedPeak = isUp;
    const isRepInProgress = isMoving;

    // Precise Kinematic Analysis: Biomechanical scoring from live joint geometry
    const symmetryDelta = Math.abs(leftShoulder - rightShoulder);
    const posturePenalty = torsoTilt > 15 ? Math.min(18, Math.round((torsoTilt - 15) * 1.2)) : 0;
    const symmetryPenalty = symmetryDelta > 20 ? Math.min(15, Math.round((symmetryDelta - 20) * 0.7)) : 0;

    let dynamicVerdict = 'TRACKING';
    let baseScore = 90;

    if (hasReachedPeak) {
      dynamicVerdict = 'EXCELLENT FORM';
      baseScore = 98;
    } else if (trackResult.isCooldownActive) {
      dynamicVerdict = 'REP COUNTED';
      baseScore = 96;
    } else if (isRepInProgress) {
      dynamicVerdict = trackResult.progressPercent >= 60 ? 'OPTIMAL ARC' : 'IN MOTION';
      baseScore = Math.min(94, 76 + Math.round(trackResult.progressPercent * 0.18));
    } else {
      dynamicVerdict = 'READY / BASELINE';
      baseScore = 91;
    }

    const dynamicScore = Math.max(65, Math.min(100, baseScore - posturePenalty - symmetryPenalty));

    // Debounced Form Correction Audio Prompt (patient stalled > 3s without reaching high threshold)
    const isAttemptingRep = !isUp && trackResult.progressPercent > 18;
    if (isAttemptingRep && !trackResult.isCooldownActive) {
      if (!repMotionStartTimeRef.current) {
        repMotionStartTimeRef.current = now;
      } else {
        const elapsedMotion = now - repMotionStartTimeRef.current;
        const timeSincePrompt = now - lastStallPromptTimeRef.current;
        if (elapsedMotion >= 3000 && timeSincePrompt >= 8000) {
          lastStallPromptTimeRef.current = now;
          const correctionPrompt = protocol.invertLogic
            ? "Try to bend a little further if you can."
            : "Try to reach a little higher if you can.";
          speakFeedback(correctionPrompt, true);
        }
      }
    } else {
      repMotionStartTimeRef.current = 0;
    }

    // High-performance UI update throttle: prevents 60 FPS React re-renders while keeping canvas silky smooth
    const shouldUpdateUi =
      now - lastUiUpdateRef.current >= 80 ||
      lastVerdictRef.current !== dynamicVerdict ||
      lastFeedbackRef.current !== formMessage ||
      hasReachedPeak;

    if (shouldUpdateUi) {
      lastUiUpdateRef.current = now;
      lastVerdictRef.current = dynamicVerdict;
      lastFeedbackRef.current = formMessage;

      setLiveAngles({
        primary: smoothed,
        rawPrimary: Math.round(primaryAngle),
        leftKnee,
        rightKnee,
        leftElbow,
        rightElbow,
        leftShoulder,
        rightShoulder,
        torsoIncline: torsoTilt,
        valgusDetected: false
      });

      setTrackerTelemetry({
        state: trackResult.state,
        cooldownRemaining: trackResult.cooldownRemaining,
        progressPercent: trackResult.progressPercent,
        smoothedAngle: smoothed,
        rawAngle: Math.round(primaryAngle)
      });

      setMovementState({
        isMoving,
        label: statusLabel
      });

      setIsCorrectForm(!tracker.badForm);
      setFormFeedback(formMessage);
      setAiVerdict(dynamicVerdict);
      setFormStatus(hasReachedPeak ? 'PEAK_REACHED' : isRepInProgress ? 'ACTIVE' : 'READY');
      setComplianceScore(dynamicScore);
    }

    // =========================================================================
    // COLOR-CODED DYNAMIC SKELETON OVERLAY (Clinical Warmth)
    // 1. Default/Resting state: stroke-gray-300 (#d1d5db)
    // 2. Moving: stroke-amber-400 (#fbbf24)
    // 3. Perfect Form (Target reached): stroke-emerald-400 (#34d399) with glow
    // =========================================================================
    let skeletonColor = '#d1d5db'; // stroke-gray-300 (Default/Resting)
    let skeletonGlow = 'rgba(209, 213, 219, 0.2)';
    let skeletonBlur = 0;
    let skeletonLineWidth = 3.5;
    let jointNodeRadius = 5;

    if (hasReachedPeak || trackResult.state === 'up') {
      // Perfect Form (Target angle reached) -> stroke-emerald-400 with glowing shadow
      skeletonColor = '#34d399';
      skeletonGlow = 'rgba(52, 211, 153, 0.95)';
      skeletonBlur = 18;
      skeletonLineWidth = 5;
      jointNodeRadius = 7.5;
    } else if (isMoving || trackResult.progressPercent > 18) {
      // Moving -> stroke-amber-400
      skeletonColor = '#fbbf24';
      skeletonGlow = 'rgba(251, 191, 36, 0.7)';
      skeletonBlur = 8;
      skeletonLineWidth = 4;
      jointNodeRadius = 6;
    }

    ctx.save();
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.lineWidth = skeletonLineWidth;
    ctx.strokeStyle = skeletonColor;
    ctx.shadowColor = skeletonGlow;
    ctx.shadowBlur = skeletonBlur;

    // Draw MediaPipe Arm & Upper Body Joint Connections (shoulder, elbow, wrist)
    const upperBodyConnections = [
      // Left Arm: Shoulder (11) -> Elbow (13) -> Wrist (15)
      [11, 13],
      [13, 15],
      // Right Arm: Shoulder (12) -> Elbow (14) -> Wrist (16)
      [12, 14],
      [14, 16],
      // Clavicle: Left Shoulder (11) -> Right Shoulder (12)
      [11, 12],
      // Torso / Hip alignment:
      [11, 23],
      [12, 24],
      [23, 24]
    ];

    upperBodyConnections.forEach(([i, j]) => {
      const pt1 = lm[i];
      const pt2 = lm[j];
      if (pt1 && pt2 && (pt1.visibility || 0) > 0.18 && (pt2.visibility || 0) > 0.18) {
        ctx.beginPath();
        ctx.moveTo(pt1.x * width, pt1.y * height);
        ctx.lineTo(pt2.x * width, pt2.y * height);
        ctx.stroke();
      }
    });

    // Draw Joint Nodes (focusing on shoulder, elbow, wrist)
    const keyArmJoints = [11, 12, 13, 14, 15, 16, 23, 24];
    keyArmJoints.forEach((idx) => {
      const pt = lm[idx];
      if (pt && (pt.visibility || 0) > 0.18) {
        const isArmJoint = idx === 11 || idx === 12 || idx === 13 || idx === 14 || idx === 15 || idx === 16;
        ctx.beginPath();
        ctx.arc(pt.x * width, pt.y * height, isArmJoint ? jointNodeRadius : 4, 0, 2 * Math.PI);
        ctx.fillStyle = skeletonColor;
        ctx.shadowColor = skeletonGlow;
        ctx.shadowBlur = skeletonBlur;
        ctx.fill();

        // White inner core for crisp clinical clarity
        ctx.beginPath();
        ctx.arc(pt.x * width, pt.y * height, isArmJoint ? jointNodeRadius * 0.45 : 2, 0, 2 * Math.PI);
        ctx.fillStyle = '#ffffff';
        ctx.shadowBlur = 0;
        ctx.fill();
      }
    });
    ctx.restore();

    // Real-Time Goniometer Degree Badge
    const drawGoniometer = (pt, angle, label) => {
      if (!pt || (pt.visibility || 0) <= 0.20) return;
      const jx = pt.x * width;
      const jy = pt.y * height;
      const pad = 8;
      const text = `${label}: ${angle}°`;
      ctx.font = 'bold 13px Inter, sans-serif';
      const textWidth = ctx.measureText(text).width;
      const boxW = textWidth + pad * 2;
      const boxH = 24;

      ctx.save();
      // Translate to joint center, and flip horizontally so text reads left-to-right on mirrored canvas!
      ctx.translate(jx, jy);
      ctx.scale(-1, 1);

      ctx.fillStyle = 'rgba(12, 74, 110, 0.92)';
      ctx.beginPath();
      ctx.roundRect(-boxW / 2, -boxH / 2, boxW, boxH, 7);
      ctx.fill();
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      ctx.fillStyle = '#ffffff';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(text, 0, 0);
      ctx.restore();
    };

    if (areHandsVisible || areLegsVisible) {
      let targetLabel = 'Joint';
      if (targetMode === 'LATERAL_RAISES') {
        targetLabel = 'Shoulder';
      } else if (targetMode === 'BICEP_CURLS' || targetMode === 'OVERHEAD_PRESS' || targetMode === 'ARM_ELEVATION' || targetMode === 'SHOULDER_ROTATION') {
        targetLabel = 'Elbow';
      } else if (targetMode === 'PENDULUM') {
        targetLabel = 'Torso';
      } else if (targetMode === 'ANKLE_PUMPS') {
        targetLabel = 'Ankle';
      } else {
        targetLabel = 'Knee';
      }
      const targetJoint = focusJointPoint || (['LATERAL_RAISES', 'BICEP_CURLS', 'OVERHEAD_PRESS', 'ARM_ELEVATION'].includes(targetMode) ? (lm[13] || lm[14] || lm[11] || lm[12]) : defaultKneePoint);
      drawGoniometer(targetJoint, smoothed, targetLabel);
    }

    ctx.restore();
  }, [protocol, updateFpsCounter, handleRepCompleted, exercise, speakFeedback]);

  // =========================================================================
  // 2. Hand & Finger Landmark Results Callback (21 Joints Biomechanics)
  // Evaluates finger alignment, wide vs close grip, open/close, hand shapes & correctness
  // =========================================================================
  const onHandsResults = useCallback((results) => {
    setIsLoadingModel(false);
    updateFpsCounter();

    const canvas = canvasRef.current;
    if (!canvas) return;
    const videoEl = videoRef.current;
    if (videoEl && videoEl.videoWidth > 0 && videoEl.videoHeight > 0) {
      if (canvas.width !== videoEl.videoWidth || canvas.height !== videoEl.videoHeight) {
        canvas.width = videoEl.videoWidth;
        canvas.height = videoEl.videoHeight;
      }
    }
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    ctx.save();
    ctx.clearRect(0, 0, width, height);

    if (!results.multiHandLandmarks || results.multiHandLandmarks.length === 0) {
      setFormFeedback('Hold hand facing camera to evaluate finger alignment & grip');
      setAiVerdict('TRACKING');
      setIsCorrectForm(true);
      setHandMetrics(prev => ({ ...prev, handDetected: false }));
      ctx.restore();
      return;
    }

    totalFramesRef.current += 1;
    goodFramesRef.current += 1;

    results.multiHandLandmarks.forEach((landmarks, handIdx) => {
      // Draw Bones
      ctx.lineWidth = 3.5;
      HAND_CONNECTIONS.forEach(([i, j]) => {
        const pt1 = landmarks[i];
        const pt2 = landmarks[j];
        if (pt1 && pt2) {
          ctx.beginPath();
          ctx.moveTo(pt1.x * width, pt1.y * height);
          ctx.lineTo(pt2.x * width, pt2.y * height);
          ctx.strokeStyle = '#06b6d4';
          ctx.shadowColor = '#06b6d4';
          ctx.shadowBlur = 6;
          ctx.stroke();
        }
      });

      // Draw 21 Finger Joints
      landmarks.forEach((pt, idx) => {
        ctx.beginPath();
        ctx.arc(pt.x * width, pt.y * height, idx === 4 || idx === 8 ? 6 : 4, 0, 2 * Math.PI);
        ctx.fillStyle = idx === 4 || idx === 8 ? '#38bdf8' : '#f43f5e';
        ctx.shadowColor = '#ffffff';
        ctx.shadowBlur = 5;
        ctx.fill();
        ctx.lineWidth = 1.5;
        ctx.strokeStyle = '#ffffff';
        ctx.stroke();
      });

      if (handIdx === 0) {
        const wrist = landmarks[0];
        const middleMcp = landmarks[9];
        const palmSize = Math.hypot(middleMcp.x - wrist.x, middleMcp.y - wrist.y) || 0.15;

        // 1. Individual Finger Extension Detection (Normalized to palm scale)
        const thumbTipDist = Math.hypot(landmarks[4].x - landmarks[2].x, landmarks[4].y - landmarks[2].y);
        const isThumbExtended = (thumbTipDist / palmSize) > 0.42;

        const isIndexExtended = Math.hypot(landmarks[8].x - wrist.x, landmarks[8].y - wrist.y) > Math.hypot(landmarks[6].x - wrist.x, landmarks[6].y - wrist.y) * 1.12;
        const isMiddleExtended = Math.hypot(landmarks[12].x - wrist.x, landmarks[12].y - wrist.y) > Math.hypot(landmarks[10].x - wrist.x, landmarks[10].y - wrist.y) * 1.12;
        const isRingExtended = Math.hypot(landmarks[16].x - wrist.x, landmarks[16].y - wrist.y) > Math.hypot(landmarks[14].x - wrist.x, landmarks[14].y - wrist.y) * 1.12;
        const isPinkyExtended = Math.hypot(landmarks[20].x - wrist.x, landmarks[20].y - wrist.y) > Math.hypot(landmarks[18].x - wrist.x, landmarks[18].y - wrist.y) * 1.12;

        const extendedList = [isThumbExtended, isIndexExtended, isMiddleExtended, isRingExtended, isPinkyExtended];
        const extendedCount = extendedList.filter(Boolean).length;

        // 2. Finger Collinearity & Straightness Angles (Alignment Evaluation)
        const indexPip = calculateAngle(landmarks[5], landmarks[6], landmarks[7]);
        const indexDip = calculateAngle(landmarks[6], landmarks[7], landmarks[8]);
        const middlePip = calculateAngle(landmarks[9], landmarks[10], landmarks[11]);
        const middleDip = calculateAngle(landmarks[10], landmarks[11], landmarks[12]);
        const ringPip = calculateAngle(landmarks[13], landmarks[14], landmarks[15]);
        const ringDip = calculateAngle(landmarks[14], landmarks[15], landmarks[16]);
        const pinkyPip = calculateAngle(landmarks[17], landmarks[18], landmarks[19]);
        const pinkyDip = calculateAngle(landmarks[18], landmarks[19], landmarks[20]);

        const isIndexAligned = !isIndexExtended || (indexPip >= 148 && indexDip >= 148);
        const isMiddleAligned = !isMiddleExtended || (middlePip >= 148 && middleDip >= 148);
        const isRingAligned = !isRingExtended || (ringPip >= 142 && ringDip >= 142);
        const isPinkyAligned = !isPinkyExtended || (pinkyPip >= 142 && pinkyDip >= 142);

        const allExtendedAligned = isIndexAligned && isMiddleAligned && isRingAligned && isPinkyAligned;

        // 3. Grip Span (Index Tip to Pinky Tip Span - Wide Grip vs Close Grip)
        const spanDist = Math.hypot(landmarks[20].x - landmarks[8].x, landmarks[20].y - landmarks[8].y);
        const normalizedSpan = spanDist / palmSize;
        const spanPercent = Math.min(100, Math.round((normalizedSpan / 1.35) * 100));

        // 4. Precision Pinch Detection
        const pinchDist = Math.hypot(landmarks[4].x - landmarks[8].x, landmarks[4].y - landmarks[8].y);
        const pinchDistNorm = pinchDist / palmSize;
        const isPinch = pinchDistNorm < 0.28;

        // 5. Hand Shape & Grip Classification
        let gripType = 'OPEN_PALM';
        let gripLabel = 'Open Palm';
        let handShape = 'Open Hand ✋';

        if (isPinch) {
          gripType = 'PINCH_GRIP';
          gripLabel = 'Precision Pinch';
          handShape = 'Pinch Grip 🤏';
        } else if (extendedCount >= 4 && normalizedSpan >= 0.88) {
          gripType = 'WIDE_GRIP';
          gripLabel = 'Wide Grip (Splay)';
          handShape = 'Wide Splay 🖐️';
        } else if (extendedCount >= 4 && normalizedSpan < 0.88) {
          gripType = 'CLOSE_GRIP';
          gripLabel = 'Close Grip (Parallel)';
          handShape = 'Close Grip ✋';
        } else if (extendedCount <= 1 && !isIndexExtended) {
          gripType = 'CLOSED_FIST';
          gripLabel = 'Closed Fist (Power)';
          handShape = 'Closed Fist ✊';
        } else if (isIndexExtended && extendedCount === 1) {
          gripType = 'POINTING';
          gripLabel = 'Pointing';
          handShape = 'Pointing ☝️';
        } else if (isThumbExtended && extendedCount === 1) {
          gripType = 'THUMBS_UP';
          gripLabel = 'Thumbs Up';
          handShape = 'Thumbs Up 👍';
        } else if (isIndexExtended && isMiddleExtended && extendedCount === 2) {
          gripType = 'V_GRIP';
          gripLabel = 'V-Grip Extension';
          handShape = 'V-Grip ✌️';
        } else {
          gripType = 'OPEN_PALM';
          gripLabel = `${extendedCount} Fingers Extended`;
          handShape = 'Open Palm ✋';
        }

        // 6. Hand Correctness Judgment
        let handCorrectness = 'CORRECT';
        let formMessage = '';
        let score = 95;

        if (gripType === 'WIDE_GRIP') {
          if (allExtendedAligned) {
            handCorrectness = 'CORRECT';
            score = 98;
            formMessage = '🟢 Wide Grip Verified: Full finger splay with straight digital alignment';
          } else {
            handCorrectness = 'ADJUST';
            score = 80;
            formMessage = '⚠️ Wide grip detected: Straighten curled fingertips fully';
          }
        } else if (gripType === 'CLOSE_GRIP') {
          if (allExtendedAligned) {
            handCorrectness = 'CORRECT';
            score = 96;
            formMessage = '🟢 Close Grip Verified: Fingers aligned parallel in a flat plane';
          } else {
            handCorrectness = 'ADJUST';
            score = 82;
            formMessage = '⚠️ Close grip detected: Align fingers evenly side-by-side';
          }
        } else if (gripType === 'CLOSED_FIST') {
          handCorrectness = 'CORRECT';
          score = 98;
          formMessage = '🟢 Closed Fist Verified: Clean functional digital flexion into palm';
        } else if (gripType === 'PINCH_GRIP') {
          handCorrectness = 'CORRECT';
          score = 98;
          formMessage = '🟢 Precision Pinch Verified: Thumb-index opposition pad alignment';
        } else if (gripType === 'POINTING') {
          if (isIndexAligned) {
            handCorrectness = 'CORRECT';
            score = 95;
            formMessage = '🟢 Index Extension Verified: Clean linear alignment';
          } else {
            handCorrectness = 'ADJUST';
            score = 82;
            formMessage = '⚠️ Straighten index finger fully';
          }
        } else if (gripType === 'THUMBS_UP') {
          handCorrectness = 'CORRECT';
          score = 95;
          formMessage = '🟢 Thumbs Up Verified: Active thumb abduction';
        } else if (gripType === 'V_GRIP') {
          handCorrectness = 'CORRECT';
          score = 96;
          formMessage = '🟢 V-Grip Verified: Dual finger extension aligned';
        } else {
          handCorrectness = allExtendedAligned ? 'CORRECT' : 'ADJUST';
          score = allExtendedAligned ? 92 : 82;
          formMessage = allExtendedAligned
            ? '🟢 Hand posture tracked: Fingers straight and aligned'
            : '⚠️ Straighten fingers to align joints';
        }

        // Draw Pinch Line on Canvas if active
        if (isPinch) {
          ctx.beginPath();
          ctx.setLineDash([4, 4]);
          ctx.moveTo(landmarks[4].x * width, landmarks[4].y * height);
          ctx.lineTo(landmarks[8].x * width, landmarks[8].y * height);
          ctx.strokeStyle = '#38bdf8';
          ctx.lineWidth = 2.5;
          ctx.stroke();
          ctx.setLineDash([]);
        }

        // Real-Time Hand Evaluation Overlay Badge on Canvas
        const hx = wrist.x * width;
        const hy = wrist.y * height;
        const tagText = `${handShape} • ${handCorrectness === 'CORRECT' ? 'Correct Alignment ✓' : 'Adjust Alignment'}`;
        ctx.font = 'bold 13px Inter, sans-serif';
        const tagWidth = ctx.measureText(tagText).width;
        const boxW = tagWidth + 24;
        const boxH = 26;

        ctx.save();
        ctx.translate(hx, hy + 35);
        ctx.scale(-1, 1);

        ctx.fillStyle = handCorrectness === 'CORRECT' ? 'rgba(12, 74, 110, 0.92)' : 'rgba(120, 53, 15, 0.92)';
        ctx.beginPath();
        ctx.roundRect(-boxW / 2, -boxH / 2, boxW, boxH, 8);
        ctx.fill();
        ctx.strokeStyle = handCorrectness === 'CORRECT' ? '#38bdf8' : '#f59e0b';
        ctx.lineWidth = 1.5;
        ctx.stroke();

        ctx.fillStyle = '#ffffff';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(tagText, 0, 0);
        ctx.restore();

        const now = Date.now();
        if (now - lastUiUpdateRef.current >= 80 || lastVerdictRef.current !== handCorrectness) {
          lastUiUpdateRef.current = now;
          lastVerdictRef.current = handCorrectness;

          setHandMetrics({
            fingerCount: extendedCount,
            fingers: {
              thumb: isThumbExtended,
              index: isIndexExtended,
              middle: isMiddleExtended,
              ring: isRingExtended,
              pinky: isPinkyExtended
            },
            fingerAlignment: {
              index: isIndexAligned,
              middle: isMiddleAligned,
              ring: isRingAligned,
              pinky: isPinkyAligned
            },
            jointAngles: {
              indexPip,
              middlePip,
              ringPip,
              pinkyPip
            },
            alignmentVerdict: handCorrectness === 'CORRECT' ? 'CORRECT' : 'MISALIGNED',
            gripType,
            gripLabel,
            gripSpanPercent: spanPercent,
            handShape,
            handCorrectness,
            pinchDistance: Math.round(pinchDist * 100),
            isPinch,
            handDetected: true
          });

          setFormFeedback(formMessage);
          setIsCorrectForm(handCorrectness === 'CORRECT');
          setAiVerdict(handCorrectness === 'CORRECT' ? 'CORRECT' : handCorrectness === 'ADJUST' ? 'INCORRECT' : 'TRACKING');
          setFormStatus(gripType);
          setComplianceScore(score);
        }
      }
    });

    ctx.restore();
  }, [updateFpsCounter]);

  // Stable callback refs to prevent re-attaching or tearing down MediaPipe / Camera on high-frequency state changes
  const onPoseResultsRef = useRef(onPoseResults);
  const onHandsResultsRef = useRef(onHandsResults);
  useEffect(() => {
    onPoseResultsRef.current = onPoseResults;
    onHandsResultsRef.current = onHandsResults;
  });

  // =========================================================================
  // 3A. HD Wide-Angle Webcam Initialization (Expanded Full-Body Capture)
  // =========================================================================
  useEffect(() => {
    if (!isOpen) return;

    let isSubscribed = true;
    const currentVideoEl = videoRef.current;

    async function startWebcam() {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setCameraError('Webcam access is not supported by your browser.');
        return;
      }

      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }

      // Multi-tier constraints optimized for 16:9 Wide Body View without overconstraining
      const constraintTiers = [
        // Tier 1: 720p HD Wide Angle (optimal for head-to-toe capture on modern webcams)
        {
          video: {
            width: { ideal: 1280 },
            height: { ideal: 720 },
            aspectRatio: { ideal: 16 / 9 },
            facingMode: 'user'
          },
          audio: false
        },
        // Tier 2: 480p Standard Wide Angle
        {
          video: {
            width: { ideal: 640 },
            height: { ideal: 480 },
            facingMode: 'user'
          },
          audio: false
        },
        // Tier 3: Permissive baseline fallback
        {
          video: true,
          audio: false
        }
      ];

      let stream = null;
      let lastErr = null;

      for (const constraints of constraintTiers) {
        try {
          stream = await navigator.mediaDevices.getUserMedia(constraints);
          if (stream) break;
        } catch (err) {
          lastErr = err;
          if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
            break;
          }
        }
      }

      if (!isSubscribed) {
        if (stream) stream.getTracks().forEach((t) => t.stop());
        return;
      }

      if (!stream) {
        console.warn('Could not acquire webcam stream:', lastErr);
        let errorMsg = 'Webcam access failed. Please ensure your camera is connected and permitted.';
        if (lastErr?.name === 'NotAllowedError' || lastErr?.name === 'PermissionDeniedError') {
          errorMsg = 'Camera permission denied. Allow camera in your browser address bar and click Retry.';
        } else if (lastErr?.name === 'NotFoundError' || lastErr?.name === 'DevicesNotFoundError') {
          errorMsg = 'No camera device detected. Please connect a webcam and click Retry.';
        } else if (lastErr?.name === 'NotReadableError' || lastErr?.name === 'TrackStartError') {
          errorMsg = 'Camera is in use by another application. Close it and click Retry.';
        }
        setCameraError(errorMsg);
        return;
      }

      streamRef.current = stream;
      setCameraError('');

      if (currentVideoEl) {
        currentVideoEl.muted = true;
        currentVideoEl.srcObject = stream;

        currentVideoEl.onloadedmetadata = () => {
          if (currentVideoEl.videoWidth > 0 && canvasRef.current) {
            canvasRef.current.width = currentVideoEl.videoWidth;
            canvasRef.current.height = currentVideoEl.videoHeight;
          }
          currentVideoEl.play().catch(() => { });
        };

        try {
          await currentVideoEl.play();
        } catch {
          // Handled via onloadedmetadata
        }
      }
    }

    startWebcam();

    return () => {
      isSubscribed = false;
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }
      if (currentVideoEl) {
        currentVideoEl.srcObject = null;
      }
    };
  }, [isOpen, retryCameraCount]);

  // =========================================================================
  // 3B. Fast Computer Vision AI Tracking Engine (MediaPipe Pose & Hands)
  // =========================================================================
  useEffect(() => {
    if (!isOpen) return;

    let isSubscribed = true;
    let animId = null;

    async function initVisionEngine() {
      try {
        setIsLoadingModel(true);

        if (visionMode === 'pose') {
          await loadScript(
            'https://cdn.jsdelivr.net/npm/@mediapipe/pose/pose.js',
            'https://unpkg.com/@mediapipe/pose/pose.js'
          );
          if (!isSubscribed) return;

          if (!window.Pose) {
            throw new Error('MediaPipe Pose library is not loaded');
          }

          const pose = new window.Pose({
            locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/pose/${file}`
          });
          pose.setOptions({
            modelComplexity: 0, // Lite model: 60 FPS real-time tracking, 3.5MB download, reliable on all GPUs
            smoothLandmarks: true,
            enableSegmentation: false,
            minDetectionConfidence: 0.45,
            minTrackingConfidence: 0.45
          });
          pose.onResults((results) => {
            if (isSubscribed && onPoseResultsRef.current) {
              onPoseResultsRef.current(results);
            }
          });
          poseInstanceRef.current = pose;
        } else {
          await loadScript(
            'https://cdn.jsdelivr.net/npm/@mediapipe/hands/hands.js',
            'https://unpkg.com/@mediapipe/hands/hands.js'
          );
          if (!isSubscribed) return;

          if (!window.Hands) {
            throw new Error('MediaPipe Hands library is not loaded');
          }

          const hands = new window.Hands({
            locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`
          });
          hands.setOptions({
            maxNumHands: 2,
            modelComplexity: 1,
            minDetectionConfidence: 0.55,
            minTrackingConfidence: 0.55
          });
          hands.onResults((results) => {
            if (isSubscribed && onHandsResultsRef.current) {
              onHandsResultsRef.current(results);
            }
          });
          handsInstanceRef.current = hands;
        }

        const processVideoFrame = async () => {
          if (!isSubscribed) return;

          // Always schedule next animation frame first to keep loop rock-solid
          animId = requestAnimationFrame(processVideoFrame);

          const videoEl = videoRef.current;
          if (
            videoEl &&
            videoEl.readyState >= 2 &&
            !videoEl.paused &&
            !videoEl.ended &&
            videoEl.videoWidth > 0 &&
            videoEl.videoHeight > 0
          ) {
            if (!isInferencingRef.current) {
              isInferencingRef.current = true;
              try {
                if (visionMode === 'pose' && poseInstanceRef.current) {
                  await poseInstanceRef.current.send({ image: videoEl });
                } else if (visionMode === 'hands' && handsInstanceRef.current) {
                  await handsInstanceRef.current.send({ image: videoEl });
                }
              } catch {
                // Drop frame guard to keep loop alive
              } finally {
                isInferencingRef.current = false;
              }
            }
          }
        };

        animId = requestAnimationFrame(processVideoFrame);
        setIsLoadingModel(false);
      } catch (err) {
        console.warn('Computer vision AI initialization note:', err);
        setIsLoadingModel(false);
      }
    }

    initVisionEngine();

    return () => {
      isSubscribed = false;
      if (animId) cancelAnimationFrame(animId);
      if (poseInstanceRef.current?.close) {
        poseInstanceRef.current.close().catch?.(() => { });
        poseInstanceRef.current = null;
      }
      if (handsInstanceRef.current?.close) {
        handsInstanceRef.current.close().catch?.(() => { });
        handsInstanceRef.current = null;
      }
      if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    };
  }, [isOpen, visionMode]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-1 sm:p-3 z-50 animate-fade-in font-sans">
      <div className="bg-slate-900 rounded-3xl max-w-[98vw] 2xl:max-w-[1520px] w-full overflow-hidden shadow-2xl border border-slate-700/80 flex flex-col h-[96vh] max-h-[96vh] animate-slide-up text-white">

        {/* ============================================================== */}
        {/* TOP CONTROL BAR: Doctor's Prescription Badge & Layout Toggles  */}
        {/* ============================================================== */}
        <div className="px-4 py-2.5 sm:px-6 bg-slate-950 border-b border-slate-800 flex items-center justify-between shrink-0 flex-wrap gap-2">

          {/* Left: Exercise & Doctor Prescribed Target */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-600/20 text-blue-400 flex items-center justify-center border border-blue-500/30 shrink-0">
              {visionMode === 'hands' ? <Hand size={20} /> : <Camera size={20} />}
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-sm sm:text-base font-black text-white tracking-tight flex items-center gap-2">
                  <span>AI Biomechanical Coach:</span>
                  <span className="text-sky-400 font-extrabold">{exercise?.title || protocol.name}</span>
                </h3>
                {visionMode === 'hands' ? (
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-sky-500/20 text-sky-300 border border-sky-500/40 flex items-center gap-1">
                    <Hand size={11} className="text-sky-400" />
                    Hand & Finger Biomechanics Mode
                  </span>
                ) : (
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-blue-500/20 text-blue-300 border border-blue-500/40 flex items-center gap-1">
                    <Stethoscope size={11} className="text-blue-400" />
                    Prescribed: {prescribedSets} Sets × {targetReps} Reps
                  </span>
                )}
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-sky-500/20 text-sky-300 border border-sky-500/40">
                  {fps} FPS
                </span>
              </div>
              <p className="text-xs text-slate-400 truncate mt-0.5">
                Exercise: <strong className="text-white font-bold">{exercise?.title || protocol.name}</strong> • Category: <span className="text-sky-300 font-medium">{exercise?.category || protocol.category}</span> • Patient: <strong className="text-blue-300">{patient?.name || 'Active Patient'}</strong> • Prescribed by <span className="text-slate-300 font-semibold">{patient?.assignedDoctor || 'Attending Physician'}</span>
              </p>
            </div>
          </div>

          {/* Right: Controls & View Layout */}
          <div className="flex items-center gap-2 flex-wrap">

            {/* Camera View Mode Selector: Focus (Expanded) | Split | Full Webcam */}
            <div className="flex items-center bg-slate-850 p-1 rounded-xl border border-slate-700">
              <button
                type="button"
                onClick={() => setViewLayout('focus')}
                className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer ${viewLayout === 'focus' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
                  }`}
                title="Expanded Wide Body Camera View with Floating Therapy Guide"
              >
                <Maximize2 size={13} />
                <span>Wide Camera Focus</span>
              </button>
              <button
                type="button"
                onClick={() => setViewLayout('split')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${viewLayout === 'split' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
                  }`}
                title="50/50 Equal Dual View"
              >
                <Columns size={13} />
                <span>Side-by-Side</span>
              </button>
              <button
                type="button"
                onClick={() => setViewLayout('webcam')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${viewLayout === 'webcam' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
                  }`}
                title="Webcam Only"
              >
                <Camera size={13} />
                <span>Webcam Only</span>
              </button>
            </div>

            {/* Vision Mode: Full Body vs Hands */}
            <div className="hidden sm:flex items-center bg-slate-850 p-1 rounded-xl border border-slate-700">
              <button
                type="button"
                onClick={() => setVisionMode('pose')}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer ${visionMode === 'pose' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-400 hover:text-white'
                  }`}
              >
                <Activity size={12} />
                <span>Full Body</span>
              </button>
              <button
                type="button"
                onClick={() => setVisionMode('hands')}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer ${visionMode === 'hands' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-400 hover:text-white'
                  }`}
              >
                <Hand size={12} />
                <span>Hands</span>
              </button>
            </div>

            {/* Audio Voice Coach Toggle */}
            <button
              type="button"
              onClick={() => {
                const nextMute = !isVoiceMuted;
                setIsVoiceMuted(nextMute);
                if (!nextMute) {
                  speakFeedback('Voice Coach enabled. Ready to guide your exercise.', true);
                }
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer border ${isVoiceMuted
                ? 'bg-slate-800 text-slate-400 border-slate-700 hover:text-white'
                : 'bg-emerald-500/15 text-emerald-300 border-emerald-400/40 shadow-sm shadow-emerald-500/20'
                }`}
              title={isVoiceMuted ? 'Turn on Audio Voice Coach' : 'Mute Audio Voice Coach'}
            >
              {isVoiceMuted ? <VolumeX size={15} /> : <Volume2 size={15} className="text-emerald-400 animate-pulse" />}
              <span className="hidden sm:inline">{isVoiceMuted ? 'Voice Coach: Off' : 'Voice Coach: On'}</span>
            </button>

            {/* High-Contrast Close Cross Button */}
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/40 flex items-center gap-1 text-xs font-black transition-colors cursor-pointer active:scale-95"
              title="Close Motion Coach (Esc)"
            >
              <X size={16} strokeWidth={2.6} />
              <span>Close</span>
            </button>
          </div>
        </div>

        {/* ============================================================== */}
        {/* MAIN STAGE: EXPANDED WEBCAM FOR OPTIMAL FULL BODY VIEWING       */}
        {/* ============================================================== */}
        <div className="flex-1 grid grid-cols-1 xl:grid-cols-12 overflow-hidden bg-slate-950 min-h-0">

          {/* Main Visual Stage (8 or 9 cols on large screen) */}
          <div className="xl:col-span-8 2xl:col-span-9 p-2 sm:p-3 flex flex-col min-h-0 overflow-hidden bg-black/80 relative">
            <div className={`w-full h-full min-h-0 ${viewLayout === 'split'
              ? 'grid grid-cols-1 lg:grid-cols-2 gap-3'
              : 'relative flex flex-col'
              }`}>

              {/* ============================================================== */}
              {/* 1. LEFT/PIP: Demonstration Video Guide                         */}
              {/* ============================================================== */}
              {(viewLayout === 'split' || viewLayout === 'focus') && (
                <div className={`${viewLayout === 'focus'
                  ? 'absolute top-3 right-3 z-30 w-72 sm:w-80 h-44 sm:h-48 rounded-2xl shadow-2xl border-2 border-blue-500/60 overflow-hidden bg-slate-900 group backdrop-blur-md'
                  : 'relative bg-slate-900 rounded-2xl overflow-hidden border border-slate-800 shadow-xl flex flex-col min-h-0'
                  }`}>
                  {/* PIP Header */}
                  <div className="absolute top-2 left-2 right-2 z-20 flex items-center justify-between pointer-events-none">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-blue-600/90 text-white backdrop-blur-md flex items-center gap-1 shadow border border-blue-400/40">
                      <Play size={9} className="fill-white" />
                      <span>Therapist Video Guide</span>
                    </span>
                    {viewLayout === 'focus' && (
                      <button
                        type="button"
                        onClick={() => setViewLayout('split')}
                        className="pointer-events-auto p-1 rounded-md bg-slate-950/80 text-slate-300 hover:text-white"
                        title="Expand to Side-by-Side"
                      >
                        <Columns size={12} />
                      </button>
                    )}
                  </div>

                  {/* Video Guide Player */}
                  <div className="relative w-full h-full bg-black flex items-center justify-center overflow-hidden">
                    {exercise?.youtubeId ? (
                      <iframe
                        className="w-full h-full object-cover rounded-none"
                        src={`https://www.youtube.com/embed/${exercise.youtubeId}?autoplay=1&mute=1&loop=1&playlist=${exercise.youtubeId}&rel=0&modestbranding=1`}
                        title={exercise.title || 'Exercise Demonstration'}
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                      />
                    ) : (
                      <>
                        <video
                          ref={demoVideoRef}
                          src={getExerciseDemoVideo(exercise?.title)}
                          playsInline
                          loop
                          autoPlay
                          muted={isDemoMuted}
                          className="w-full h-full object-cover"
                        />

                        {/* Quick controls */}
                        <div className="absolute bottom-2 left-2 right-2 z-20 flex items-center justify-between pointer-events-auto">
                          <span className="text-[10px] font-bold text-white bg-black/70 px-2 py-0.5 rounded backdrop-blur-sm">
                            Target: {protocol.targetAngle ? `${protocol.targetAngle}°` : 'Form'}
                          </span>
                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={toggleDemoPlay}
                              className="w-6 h-6 rounded bg-slate-900/90 hover:bg-slate-800 text-white flex items-center justify-center border border-slate-700 cursor-pointer"
                              title={isDemoPlaying ? 'Pause Guide' : 'Play Guide'}
                            >
                              {isDemoPlaying ? <Pause size={10} /> : <Play size={10} />}
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setIsDemoMuted(prev => {
                                  const next = !prev;
                                  if (demoVideoRef.current) demoVideoRef.current.muted = next;
                                  return next;
                                });
                              }}
                              className="w-6 h-6 rounded bg-slate-900/90 hover:bg-slate-800 text-white flex items-center justify-center border border-slate-700 cursor-pointer"
                              title={isDemoMuted ? 'Unmute Demonstration' : 'Mute Demonstration'}
                            >
                              {isDemoMuted ? <VolumeX size={10} /> : <Volume2 size={10} />}
                            </button>
                            <button
                              type="button"
                              onClick={restartDemo}
                              className="w-6 h-6 rounded bg-slate-900/90 hover:bg-slate-800 text-white flex items-center justify-center border border-slate-700 cursor-pointer"
                              title="Restart Demonstration"
                            >
                              <RotateCcw size={10} />
                            </button>
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              )}

              {/* ============================================================== */}
              {/* 2. EXPANDED WEBCAM: Full Body View (uncropped object-contain)   */}
              {/* ============================================================== */}
              <div className="relative flex-1 bg-slate-950 rounded-2xl overflow-hidden border border-slate-800 shadow-2xl flex flex-col min-h-0">

                {/* Top Overlay Bar */}
                <div className="absolute top-3 left-3 right-3 z-20 flex items-center justify-between pointer-events-none">
                  <div className="flex items-center gap-2">
                    <span className="px-3 py-1 rounded-full text-[11px] font-black bg-sky-600/90 text-white backdrop-blur-md flex items-center gap-1.5 shadow-lg border border-sky-400/40">
                      <Camera size={12} />
                      <span>Live Movement & AI Pose Recognition</span>
                    </span>

                    {/* Body Visibility Status Indicator */}
                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-black backdrop-blur-md border flex items-center gap-1 transition-all ${detectedBodyPart === 'WHOLE_BODY'
                      ? 'bg-sky-950/90 text-sky-300 border-sky-500/50 shadow-md'
                      : detectedBodyPart === 'UPPER_BODY'
                        ? 'bg-blue-950/90 text-blue-300 border-blue-500/50 shadow-md'
                        : 'bg-slate-900/90 text-slate-300 border-slate-700'
                      }`}>
                      <UserCheck size={11} className={detectedBodyPart === 'WHOLE_BODY' ? 'text-sky-400' : detectedBodyPart === 'UPPER_BODY' ? 'text-blue-400' : 'text-slate-400'} />
                      <span>
                        {detectedBodyPart === 'WHOLE_BODY'
                          ? 'Whole Body Active (Head to Toe)'
                          : detectedBodyPart === 'UPPER_BODY'
                            ? 'Upper Body Active (Arms & Shoulders)'
                            : 'Acquiring Body Position...'}
                      </span>
                    </span>
                  </div>

                  <div className="flex items-center gap-2 pointer-events-auto">
                    <button
                      type="button"
                      onClick={() => setViewLayout(viewLayout === 'focus' ? 'split' : 'focus')}
                      className="px-2.5 py-1 rounded-lg bg-slate-900/90 hover:bg-slate-800 border border-slate-700 text-xs font-bold text-white flex items-center gap-1 shadow-sm transition-all cursor-pointer"
                      title={viewLayout === 'focus' ? 'Switch to Side-by-Side View' : 'Maximize Camera View'}
                    >
                      {viewLayout === 'focus' ? <Minimize2 size={12} /> : <Maximize2 size={12} />}
                      <span className="hidden sm:inline">{viewLayout === 'focus' ? 'Split View' : 'Expand View'}</span>
                    </button>
                  </div>
                </div>

                {/* Video & Canvas Stage (UNCROPPED OBJECT-CONTAIN FOR FULL BODY VISIBILITY) */}
                <div className="relative flex-1 bg-slate-950 flex items-center justify-center overflow-hidden min-h-0">

                  {/* Connecting model indicator */}
                  {isLoadingModel && !cameraError && (
                    <div className="absolute top-14 right-3 z-30 pointer-events-none">
                      <div className="px-3 py-1.5 rounded-full bg-slate-950/90 border border-blue-500/50 backdrop-blur-md flex items-center gap-2 text-xs font-bold text-blue-300 shadow-xl">
                        <div className="w-2.5 h-2.5 rounded-full border-2 border-blue-400 border-t-transparent animate-spin"></div>
                        <span>Initializing Vision AI Model...</span>
                      </div>
                    </div>
                  )}

                  {/* Camera Error / Re-prompt */}
                  {cameraError && (
                    <div className="absolute inset-0 bg-slate-950/95 z-30 flex flex-col items-center justify-center text-center p-6 space-y-3">
                      <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center">
                        <AlertTriangle size={24} className="text-amber-400" />
                      </div>
                      <h4 className="text-sm font-bold text-white">Camera Access Notice</h4>
                      <p className="text-xs text-slate-300 max-w-sm leading-relaxed">{cameraError}</p>
                      <button
                        type="button"
                        onClick={() => setRetryCameraCount(c => c + 1)}
                        className="px-4 py-2 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-500 text-white flex items-center gap-2 shadow-lg transition-all cursor-pointer"
                      >
                        <RotateCcw size={13} />
                        <span>Retry Camera</span>
                      </button>
                    </div>
                  )}

                  {/* Patient Live Webcam Stream: uncropped object-cover matching side video */}
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-full object-cover transform -scale-x-100"
                  />

                  {/* Augmented Reality Biomechanical Canvas Overlay */}
                  <canvas
                    ref={canvasRef}
                    width={1920}
                    height={1080}
                    className="absolute inset-0 w-full h-full object-cover pointer-events-none z-10 transform -scale-x-100"
                  />

                  {/* Floating Live AI Judgment Badge */}
                  <div className="absolute top-14 left-3 z-20 pointer-events-none">
                    <div className={`px-3 py-1.5 rounded-xl text-xs font-black shadow-xl backdrop-blur-md flex items-center gap-2 border transition-all ${aiVerdict === 'CORRECT'
                      ? 'bg-sky-950/90 text-sky-300 border-sky-400 shadow-sky-950/60'
                      : aiVerdict === 'INCORRECT'
                        ? 'bg-rose-950/90 text-rose-300 border-rose-400 animate-pulse'
                        : 'bg-slate-900/90 text-blue-300 border-blue-500/50'
                      }`}>
                      {aiVerdict === 'CORRECT' ? (
                        <CheckCircle2 size={15} className="text-sky-400" />
                      ) : aiVerdict === 'INCORRECT' ? (
                        <AlertCircle size={15} className="text-rose-400" />
                      ) : (
                        <Activity size={15} className="text-blue-400" />
                      )}
                      <span>
                        {visionMode === 'hands'
                          ? (handMetrics.handCorrectness === 'CORRECT'
                            ? `CORRECT HAND ALIGNMENT ✓ (${handMetrics.gripLabel})`
                            : handMetrics.handCorrectness === 'ADJUST'
                              ? `ADJUST FINGER ALIGNMENT (${handMetrics.gripLabel})`
                              : `ANALYZING HAND: ${handMetrics.gripLabel}`)
                          : (aiVerdict === 'CORRECT'
                            ? 'CORRECT MOVEMENT ✓'
                            : aiVerdict === 'INCORRECT'
                              ? 'INCORRECT FORM'
                              : aiVerdict === 'MOVING'
                                ? 'IN MOTION (REACH TARGET)'
                                : 'READY / TRACKING FORM')}
                      </span>
                    </div>
                  </div>

                  {/* Anti-Jitter Clinical Telemetry Badge (Top Right) */}
                  <div className="absolute top-14 right-3 z-20 flex flex-col items-end gap-1.5 pointer-events-none">
                    <div className="bg-slate-950/90 backdrop-blur-md px-3 py-2 rounded-2xl border border-slate-700/80 shadow-lg text-right flex items-center gap-3">
                      {/* Floating Mini Circular Progress Ring */}
                      <div className="relative w-10 h-10 flex items-center justify-center shrink-0">
                        <svg className="w-10 h-10 transform -rotate-90" viewBox="0 0 100 100">
                          <circle cx="50" cy="50" r="38" className="text-slate-800" strokeWidth="8" stroke="currentColor" fill="transparent" />
                          <circle
                            cx="50"
                            cy="50"
                            r="38"
                            strokeWidth="8"
                            strokeDasharray={2 * Math.PI * 38}
                            strokeDashoffset={(2 * Math.PI * 38) - ((2 * Math.PI * 38) * Math.min(100, Math.max(0, trackerTelemetry.progressPercent))) / 100}
                            strokeLinecap="round"
                            className={`transition-all duration-150 ${trackerTelemetry.state === 'up'
                              ? 'text-emerald-400 drop-shadow-[0_0_8px_rgba(52,211,153,0.9)]'
                              : trackerTelemetry.progressPercent > 18
                                ? 'text-amber-400 drop-shadow-[0_0_6px_rgba(251,191,36,0.7)]'
                                : 'text-sky-400'
                              }`}
                            stroke="currentColor"
                            fill="transparent"
                          />
                        </svg>
                        <span className="absolute inset-0 flex items-center justify-center text-[10px] font-mono font-black text-white">
                          {trackerTelemetry.state === 'up' ? '✓' : `${trackerTelemetry.progressPercent}%`}
                        </span>
                      </div>

                      <div className="text-right">
                        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                          Smoothed ROM
                        </div>
                        <div className="text-sm font-black text-sky-400 font-mono">
                          {liveAngles.primary}°
                          <span className="text-[10px] text-slate-500 font-normal ml-1">
                            (Raw: {liveAngles.rawPrimary || liveAngles.primary}°)
                          </span>
                        </div>
                      </div>
                      <div className="w-px h-6 bg-slate-800" />
                      <div className="text-left">
                        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                          Hysteresis State
                        </div>
                        <div className={`text-xs font-black uppercase font-mono flex items-center gap-1 ${trackerTelemetry.state === 'up' ? 'text-emerald-400' : 'text-slate-300'
                          }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${trackerTelemetry.state === 'up' ? 'bg-emerald-400 animate-ping' : 'bg-slate-500'
                            }`} />
                          {trackerTelemetry.state === 'up' ? 'Peak (UP)' : 'Baseline (DOWN)'}
                        </div>
                      </div>
                    </div>

                    {/* Dual Thresholds & Cooldown status pills */}
                    <div className="flex items-center gap-1.5 pointer-events-auto">
                      <span className="px-2.5 py-0.5 rounded-lg text-[10px] font-mono font-bold border backdrop-blur-md bg-slate-900/80 text-slate-300 border-slate-700">
                        Target: {targetHighAngle}° | Return: {targetLowAngle}°
                      </span>
                      {trackerTelemetry.cooldownRemaining > 0 && (
                        <span className="px-2 py-0.5 rounded-lg text-[10px] font-mono font-bold bg-amber-950/80 text-amber-300 border border-amber-500/50 backdrop-blur-md animate-pulse">
                          Cooldown Lock: {trackerTelemetry.cooldownRemaining}f
                        </span>
                      )}
                    </div>
                  </div>



                  {/* Bottom Real-Time Clinical Guidance Bar */}
                  <div className="absolute bottom-3 left-3 right-3 z-20 pointer-events-none">
                    <div className={`px-4 py-2 rounded-xl text-xs font-extrabold shadow-xl backdrop-blur-md flex items-center gap-2.5 border transition-all ${isCorrectForm
                      ? 'bg-slate-900/90 text-sky-400 border-sky-500/50 shadow-sky-950/40'
                      : 'bg-rose-950/90 text-rose-200 border-rose-500/80'
                      }`}>
                      {isCorrectForm ? <CheckCircle2 size={15} className="text-sky-400 shrink-0" /> : <AlertTriangle size={15} className="text-rose-400 shrink-0" />}
                      <span className="truncate">{formFeedback}</span>
                    </div>
                  </div>

                </div>
              </div>

            </div>

          </div>

          {/* ============================================================== */}
          {/* RIGHT SIDEBAR: Specialized Hand Biomechanics or Pose Reps     */}
          {/* ============================================================== */}
          <div className="xl:col-span-4 2xl:col-span-3 p-4 sm:p-5 bg-slate-900 border-t xl:border-t-0 xl:border-l border-slate-800 flex flex-col justify-between space-y-4 overflow-y-auto">

            {visionMode === 'hands' ? (
              /* ========================================================== */
              /* HAND & FINGER BIOMECHANICS EVALUATION SUITE (NO REPS)      */
              /* ========================================================== */
              <div className="space-y-4">

                {/* Hand Posture & AI Alignment Judgment Card */}
                <div className="bg-slate-950/90 rounded-2xl p-4 border border-sky-500/30 shadow-inner space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black uppercase tracking-wider text-sky-400 flex items-center gap-1.5">
                      <Hand size={13} className="text-sky-400 animate-pulse" />
                      <span>AI Hand & Finger Analysis</span>
                    </span>
                    <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full border ${handMetrics.handCorrectness === 'CORRECT'
                      ? 'bg-sky-500/20 text-sky-300 border-sky-500/40'
                      : 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                      }`}>
                      {handMetrics.handCorrectness === 'CORRECT' ? 'Correct Alignment ✓' : 'Adjust Alignment'}
                    </span>
                  </div>

                  {/* Active Hand Shape & Precision Score */}
                  <div className="p-3 bg-slate-900/90 rounded-xl border border-slate-800 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 block uppercase">Detected Shape</span>
                      <span className="text-lg font-black text-white">{handMetrics.handShape}</span>
                      <span className="text-xs text-sky-400 font-semibold block">{handMetrics.gripLabel}</span>
                    </div>
                    <div className="w-14 h-14 rounded-2xl bg-sky-500/10 text-sky-400 border border-sky-500/30 flex flex-col items-center justify-center shadow-inner">
                      <span className="text-base font-black leading-tight">{complianceScore}%</span>
                      <span className="text-[9px] font-bold text-slate-400 uppercase">Score</span>
                    </div>
                  </div>

                  {/* Grip Width / Splay Meter */}
                  <div className="space-y-1.5 pt-1">
                    <div className="flex justify-between items-center text-[11px] font-bold">
                      <span className="text-slate-400 uppercase">Grip Span (Wide vs Close):</span>
                      <span className="text-sky-300 font-mono font-black">{handMetrics.gripSpanPercent}%</span>
                    </div>
                    <div className="w-full bg-slate-900 h-2.5 rounded-full overflow-hidden border border-slate-800 p-0.5">
                      <div
                        className={`h-full rounded-full transition-all duration-200 ${handMetrics.gripType === 'WIDE_GRIP'
                          ? 'bg-gradient-to-r from-sky-500 to-blue-400 shadow-sm'
                          : handMetrics.gripType === 'CLOSE_GRIP'
                            ? 'bg-gradient-to-r from-blue-500 to-cyan-400'
                            : 'bg-slate-700'
                          }`}
                        style={{ width: `${Math.max(8, handMetrics.gripSpanPercent)}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-[9px] text-slate-500 font-bold uppercase tracking-wider px-0.5">
                      <span>Closed Fist</span>
                      <span>Close Grip</span>
                      <span>Wide Grip</span>
                    </div>
                  </div>

                  {/* AI Clinical Guidance Feedback */}
                  <div className={`p-2.5 rounded-xl border text-[11px] font-medium flex items-center gap-2 ${handMetrics.handCorrectness === 'CORRECT'
                    ? 'bg-sky-950/40 border-sky-500/30 text-sky-200'
                    : 'bg-amber-950/40 border-amber-500/30 text-amber-200'
                    }`}>
                    {handMetrics.handCorrectness === 'CORRECT' ? (
                      <CheckCircle2 size={15} className="text-sky-400 shrink-0" />
                    ) : (
                      <AlertTriangle size={15} className="text-amber-400 shrink-0" />
                    )}
                    <span className="leading-snug">{formFeedback}</span>
                  </div>
                </div>

                {/* 5-Finger Digital Alignment Matrix */}
                <div className="bg-slate-950/80 rounded-2xl p-3.5 border border-slate-800 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black uppercase tracking-wider text-slate-300">
                      Finger Alignment & Joint Tracking
                    </span>
                    <span className="text-[10px] font-mono text-sky-400 font-bold">
                      {handMetrics.fingerCount} / 5 Open
                    </span>
                  </div>

                  <div className="grid grid-cols-5 gap-1.5">
                    {[
                      { key: 'thumb', label: 'Thumb', isExt: handMetrics.fingers.thumb, isAligned: true, angle: null },
                      { key: 'index', label: 'Index', isExt: handMetrics.fingers.index, isAligned: handMetrics.fingerAlignment.index, angle: handMetrics.jointAngles.indexPip },
                      { key: 'middle', label: 'Middle', isExt: handMetrics.fingers.middle, isAligned: handMetrics.fingerAlignment.middle, angle: handMetrics.jointAngles.middlePip },
                      { key: 'ring', label: 'Ring', isExt: handMetrics.fingers.ring, isAligned: handMetrics.fingerAlignment.ring, angle: handMetrics.jointAngles.ringPip },
                      { key: 'pinky', label: 'Pinky', isExt: handMetrics.fingers.pinky, isAligned: handMetrics.fingerAlignment.pinky, angle: handMetrics.jointAngles.pinkyPip }
                    ].map(({ key, label, isExt, isAligned, angle }) => {
                      return (
                        <div
                          key={key}
                          className={`p-2 rounded-xl text-center border transition-all ${isExt
                            ? isAligned
                              ? 'bg-sky-500/15 border-sky-500/40 text-sky-300'
                              : 'bg-amber-500/15 border-amber-500/40 text-amber-300'
                            : 'bg-slate-900 border-slate-800 text-slate-500'
                            }`}
                        >
                          <span className="text-[10px] font-extrabold block truncate">{label}</span>
                          <span className={`text-[9px] font-bold block mt-0.5 ${isExt ? (isAligned ? 'text-sky-400' : 'text-amber-400') : 'text-slate-500'
                            }`}>
                            {isExt ? (isAligned ? 'Aligned ✓' : 'Curled') : 'Flexed'}
                          </span>
                          {angle && (
                            <span className="text-[8px] font-mono text-slate-400 block mt-0.5">
                              {angle}°
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Hand Posture Reference Shapes */}
                <div className="bg-slate-950/80 rounded-2xl p-3 border border-slate-800 space-y-2">
                  <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">
                    Grip & Shape Profiles
                  </span>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className={`p-2 rounded-xl border flex items-center gap-2 ${handMetrics.gripType === 'WIDE_GRIP' ? 'bg-sky-500/20 border-sky-400 text-sky-200 ring-1 ring-sky-400' : 'bg-slate-900 border-slate-800 text-slate-400'
                      }`}>
                      <span className="text-base">🖐️</span>
                      <div>
                        <div className="font-bold text-[11px]">Wide Grip</div>
                        <div className="text-[9px] text-slate-400">Fingers Abducted</div>
                      </div>
                    </div>

                    <div className={`p-2 rounded-xl border flex items-center gap-2 ${handMetrics.gripType === 'CLOSE_GRIP' ? 'bg-sky-500/20 border-sky-400 text-sky-200 ring-1 ring-sky-400' : 'bg-slate-900 border-slate-800 text-slate-400'
                      }`}>
                      <span className="text-base">✋</span>
                      <div>
                        <div className="font-bold text-[11px]">Close Grip</div>
                        <div className="text-[9px] text-slate-400">Parallel Fingers</div>
                      </div>
                    </div>

                    <div className={`p-2 rounded-xl border flex items-center gap-2 ${handMetrics.gripType === 'CLOSED_FIST' ? 'bg-sky-500/20 border-sky-400 text-sky-200 ring-1 ring-sky-400' : 'bg-slate-900 border-slate-800 text-slate-400'
                      }`}>
                      <span className="text-base">✊</span>
                      <div>
                        <div className="font-bold text-[11px]">Closed Fist</div>
                        <div className="text-[9px] text-slate-400">Power Grip</div>
                      </div>
                    </div>

                    <div className={`p-2 rounded-xl border flex items-center gap-2 ${handMetrics.gripType === 'PINCH_GRIP' ? 'bg-sky-500/20 border-sky-400 text-sky-200 ring-1 ring-sky-400' : 'bg-slate-900 border-slate-800 text-slate-400'
                      }`}>
                      <span className="text-base">🤏</span>
                      <div>
                        <div className="font-bold text-[11px]">Precision Pinch</div>
                        <div className="text-[9px] text-slate-400">Thumb Opposition</div>
                      </div>
                    </div>
                  </div>
                </div>

              </div>
            ) : (
              /* ========================================================== */
              /* FULL BODY REHABILITATION SUITE (WITH PRESCRIBED REPS)     */
              /* ========================================================== */
              <div className="space-y-4">
                {/* Rep Counter Card (Counts accurately according to Doctor's Prescribed Dosage) */}
                {/* Rep Counter Card with Live Circular Rep Progress Ring */}
                <div className="bg-slate-950/80 rounded-2xl p-4 border border-slate-800 shadow-inner space-y-3">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <span className="text-[10px] font-black uppercase tracking-wider text-sky-400 flex items-center gap-1">
                        <Stethoscope size={11} className="text-sky-400" />
                        <span>Doctor Prescribed Dosage</span>
                      </span>
                      <div className="flex items-baseline gap-2 mt-1">
                        <span className="text-4xl font-black text-white">{correctReps}</span>
                        <span className="text-lg font-bold text-slate-400">/ {targetReps} Reps</span>
                      </div>
                      <span className="text-[10px] text-slate-400 font-semibold block mt-0.5">
                        Target: {prescribedSets} Sets of {targetReps} Repetitions
                      </span>
                    </div>

                    <div className="flex items-center gap-2.5">
                      {/* SVG Circular Rep Progress Ring */}
                      <div className="relative w-18 h-18 sm:w-20 sm:h-20 flex items-center justify-center shrink-0" title={`Current Rep ROM Progress: ${trackerTelemetry.progressPercent}%`}>
                        <svg className="w-18 h-18 sm:w-20 sm:h-20 transform -rotate-90" viewBox="0 0 100 100">
                          {/* Background Track */}
                          <circle
                            cx="50"
                            cy="50"
                            r="38"
                            className="text-slate-800"
                            strokeWidth="8"
                            stroke="currentColor"
                            fill="transparent"
                          />
                          {/* Dynamic Progress Arc */}
                          <circle
                            cx="50"
                            cy="50"
                            r="38"
                            strokeWidth="8"
                            strokeDasharray={2 * Math.PI * 38}
                            strokeDashoffset={
                              (2 * Math.PI * 38) -
                              ((2 * Math.PI * 38) * Math.min(100, Math.max(0, trackerTelemetry.progressPercent))) / 100
                            }
                            strokeLinecap="round"
                            className={`transition-all duration-150 ${trackerTelemetry.state === 'up'
                              ? 'text-emerald-400 drop-shadow-[0_0_10px_rgba(52,211,153,0.9)]'
                              : trackerTelemetry.progressPercent > 18
                                ? 'text-amber-400 drop-shadow-[0_0_8px_rgba(251,191,36,0.7)]'
                                : 'text-sky-400'
                              }`}
                            stroke="currentColor"
                            fill="transparent"
                          />
                        </svg>

                        {/* Center HUD */}
                        <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                          <span className={`text-xs font-black font-mono leading-none transition-colors ${trackerTelemetry.state === 'up'
                            ? 'text-emerald-300 font-extrabold'
                            : trackerTelemetry.progressPercent > 18
                              ? 'text-amber-300 font-extrabold'
                              : 'text-white'
                            }`}>
                            {trackerTelemetry.state === 'up' ? 'PEAK' : `${trackerTelemetry.progressPercent}%`}
                          </span>
                          <span className="text-[8px] font-bold text-slate-400 uppercase mt-0.5 tracking-tighter">
                            {trackerTelemetry.smoothedAngle}° ROM
                          </span>
                        </div>
                      </div>

                      {/* Overall Goal Badge */}
                      <div className="w-14 h-16 rounded-2xl bg-sky-500/10 text-sky-400 border border-sky-500/30 flex flex-col items-center justify-center shadow-inner shrink-0">
                        <span className="text-base font-black leading-tight text-white">
                          {Math.min(100, Math.round((correctReps / targetReps) * 100))}%
                        </span>
                        <span className="text-[8px] font-bold text-sky-300 uppercase">Goal</span>
                      </div>
                    </div>
                  </div>

                  {/* Progress bar up to doctor's suggested reps */}
                  <div className="w-full bg-slate-900 h-2.5 rounded-full overflow-hidden border border-slate-800 p-0.5">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-blue-500 to-sky-400 transition-all duration-300 shadow-sm"
                      style={{ width: `${Math.min(100, Math.max(4, (correctReps / targetReps) * 100))}%` }}
                    />
                  </div>

                  {/* Doctor's Guidance Box */}
                  <div className="p-2.5 rounded-xl bg-slate-900/90 border border-slate-800 text-[11px] text-slate-300 italic">
                    <span className="text-[9px] font-black uppercase tracking-wider text-slate-500 block not-italic mb-0.5">
                      Clinician Form Prescription
                    </span>
                    "{clinicalNotes}"
                  </div>
                </div>

                {/* Simple AI Movement Coach Card */}
                <div className="bg-slate-950/80 rounded-2xl p-3.5 border border-slate-800 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black uppercase tracking-wider text-sky-400 flex items-center gap-1.5">
                      <Activity size={12} className="text-sky-400 animate-pulse" />
                      <span>AI Movement Coach</span>
                    </span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-sky-500/20 text-sky-300 border border-sky-500/40">
                      {movementState.isMoving ? 'Moving' : 'Ready'}
                    </span>
                  </div>

                  <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 block uppercase">Real-Time Joint Angle</span>
                      <span className="text-xl font-black text-white">{liveAngles.primary}°</span>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] font-bold text-slate-400 block uppercase">Movement Status</span>
                      <span className="text-xs font-black text-sky-400 truncate block max-w-[140px]">
                        {movementState.label}
                      </span>
                    </div>
                  </div>

                  <div className="text-[11px] text-slate-300 bg-slate-900/90 rounded-xl p-2.5 border border-slate-800/80 flex items-center gap-2">
                    <CheckCircle2 size={14} className="text-sky-400 shrink-0" />
                    <span className="truncate">{formFeedback}</span>
                  </div>
                </div>

                {/* Full Body Joint Matrix */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-xs font-bold">
                    <span className="text-slate-400">Primary Joint Angle:</span>
                    <span className={`text-sm font-black ${isCorrectForm ? 'text-sky-400' : 'text-blue-300'}`}>
                      {liveAngles.primary}°
                    </span>
                  </div>

                  <div className="w-full bg-slate-950 h-3 rounded-full overflow-hidden border border-slate-800 p-0.5">
                    <div
                      className={`h-full rounded-full transition-all duration-150 ${isCorrectForm
                        ? 'bg-gradient-to-r from-sky-500 to-blue-400 shadow-md shadow-sky-500/50'
                        : 'bg-blue-600'
                        }`}
                      style={{ width: `${Math.min(100, Math.max(10, (liveAngles.primary / 180) * 100))}%` }}
                    />
                  </div>

                  {/* Multi-Joint Matrix (Dynamically tuned to Upper Body vs Lower Body) */}
                  <div className="grid grid-cols-2 gap-2 pt-1">
                    {['LATERAL_RAISES', 'BICEP_CURLS', 'OVERHEAD_PRESS', 'ARM_ELEVATION', 'SHOULDER_ROTATION', 'PENDULUM'].includes(protocol.type) ? (
                      <>
                        <div className="bg-slate-950/70 p-2.5 rounded-xl border border-slate-800">
                          <span className="text-[10px] text-slate-400 font-bold block uppercase">
                            {protocol.type === 'BICEP_CURLS' ? 'Elbow Flexion (50° Peak)' : 'Elbow Angles (L / R)'}
                          </span>
                          <div className="flex justify-between items-baseline mt-1">
                            <span className="text-xs font-semibold text-slate-300">L: <strong className="text-white">{liveAngles.leftElbow}°</strong></span>
                            <span className="text-xs font-semibold text-slate-300">R: <strong className="text-white">{liveAngles.rightElbow}°</strong></span>
                          </div>
                        </div>

                        <div className="bg-slate-950/70 p-2.5 rounded-xl border border-slate-800">
                          <span className="text-[10px] text-slate-400 font-bold block uppercase">
                            {protocol.type === 'LATERAL_RAISES' ? 'Shoulder Abduction (80° Target)' : 'Shoulder Elevation'}
                          </span>
                          <div className="flex justify-between items-baseline mt-1">
                            <span className="text-xs font-semibold text-slate-300">L: <strong className="text-white">{liveAngles.leftShoulder}°</strong></span>
                            <span className="text-xs font-semibold text-slate-300">R: <strong className="text-white">{liveAngles.rightShoulder}°</strong></span>
                          </div>
                        </div>
                      </>
                    ) : protocol.type === 'ANKLE_PUMPS' ? (
                      <>
                        <div className="bg-slate-950/70 p-2.5 rounded-xl border border-slate-800">
                          <span className="text-[10px] text-slate-400 font-bold block uppercase">Ankle Angle (Live)</span>
                          <div className="flex justify-between items-baseline mt-1">
                            <span className="text-xs font-semibold text-slate-300">Flexion: <strong className="text-white">{liveAngles.primary}°</strong></span>
                          </div>
                        </div>

                        <div className="bg-slate-950/70 p-2.5 rounded-xl border border-slate-800">
                          <span className="text-[10px] text-slate-400 font-bold block uppercase">Knee Angles (L / R)</span>
                          <div className="flex justify-between items-baseline mt-1">
                            <span className="text-xs font-semibold text-slate-300">L: <strong className="text-white">{liveAngles.leftKnee}°</strong></span>
                            <span className="text-xs font-semibold text-slate-300">R: <strong className="text-white">{liveAngles.rightKnee}°</strong></span>
                          </div>
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="bg-slate-950/70 p-2.5 rounded-xl border border-slate-800">
                          <span className="text-[10px] text-slate-400 font-bold block uppercase">Knee Angles (L / R)</span>
                          <div className="flex justify-between items-baseline mt-1">
                            <span className="text-xs font-semibold text-slate-300">L: <strong className="text-white">{liveAngles.leftKnee}°</strong></span>
                            <span className="text-xs font-semibold text-slate-300">R: <strong className="text-white">{liveAngles.rightKnee}°</strong></span>
                          </div>
                        </div>

                        <div className="bg-slate-950/70 p-2.5 rounded-xl border border-slate-800">
                          <span className="text-[10px] text-slate-400 font-bold block uppercase">Torso / Pelvic Tilt</span>
                          <div className="flex justify-between items-baseline mt-1">
                            <span className="text-xs font-semibold text-slate-300">Incline: <strong className="text-white">{liveAngles.torsoIncline}°</strong></span>
                            <span className="text-[10px] font-bold text-sky-400">Aligned</span>
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Score & AI Accuracy */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800">
                <div className="flex items-center gap-1.5 text-xs text-slate-400 font-semibold mb-1">
                  <ShieldCheck size={14} className="text-sky-400" />
                  <span>{visionMode === 'hands' ? 'Hand Precision' : 'Form Precision'}</span>
                </div>
                <span className="text-xl font-black text-sky-400">{complianceScore}%</span>
              </div>

              <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800">
                <div className="flex items-center gap-1.5 text-xs text-slate-400 font-semibold mb-1">
                  <Activity size={14} className="text-blue-400" />
                  <span>{visionMode === 'hands' ? 'Hand Verdict' : 'AI State'}</span>
                </div>
                <div className="flex items-baseline gap-1.5 truncate">
                  <span className={`text-xs font-black uppercase truncate block ${aiVerdict === 'CORRECT' ? 'text-sky-400' : aiVerdict === 'INCORRECT' ? 'text-rose-400' : 'text-slate-300'
                    }`}>
                    {visionMode === 'hands'
                      ? (handMetrics.handCorrectness === 'CORRECT' ? 'ALIGNED ✓' : 'ADJUST')
                      : aiVerdict}
                  </span>
                  {formStatus && formStatus !== 'READY' && (
                    <span className="text-[9px] font-bold text-slate-500 uppercase tracking-tight truncate">
                      ({formStatus.replace(/_/g, ' ')})
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* CLINICAL COMPLETION STATUS */}
            <div className={`p-3.5 rounded-2xl border text-xs space-y-1.5 transition-all ${canComplete
              ? 'bg-sky-950/60 border-sky-500/60 text-sky-200'
              : 'bg-blue-950/40 border-blue-500/40 text-blue-200'
              }`}>
              <div className="flex items-center gap-2 font-black">
                {canComplete ? (
                  <CheckCircle2 size={16} className="text-sky-400" />
                ) : (
                  visionMode === 'hands' ? <Hand size={16} className="text-sky-400" /> : <Stethoscope size={16} className="text-blue-400" />
                )}
                <span>
                  {visionMode === 'hands'
                    ? (canComplete
                      ? 'Hand Assessment Certified: Ready to Record!'
                      : 'Evaluating Finger Alignment & Grip...')
                    : (canComplete
                      ? 'Prescription Goal Met: Ready to Record!'
                      : `Doctor Goal: Complete ${targetReps} AI-Verified Reps`)}
                </span>
              </div>
              <p className="text-[11px] leading-relaxed text-slate-300">
                {visionMode === 'hands'
                  ? (canComplete
                    ? `Hand posture evaluated (${handMetrics.handShape}, ${handMetrics.gripLabel}). Digital alignment verified at ${complianceScore}%.`
                    : 'Hold hand steady facing webcam to analyze finger extension, alignment, and grip width.')
                  : (canComplete
                    ? `You have completed all ${targetReps} reps prescribed by ${patient?.assignedDoctor || 'your doctor'}. Click below to save your clinical record.`
                    : `Currently at ${correctReps} of ${targetReps} reps. Maintain form to count each rep toward your daily clinical goal.`)}
              </p>
            </div>

            {/* Finish & Record Workout Button */}
            <div className="pt-1 space-y-2">
              <button
                type="button"
                onClick={handleFinishWorkout}
                disabled={!canComplete}
                className={`w-full py-3.5 rounded-xl font-black text-xs sm:text-sm shadow-lg transition-all flex items-center justify-center gap-2 active:scale-98 ${canComplete
                  ? 'bg-sky-600 hover:bg-sky-500 text-white shadow-sky-600/30 cursor-pointer animate-pulse'
                  : 'bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed opacity-75'
                  }`}
              >
                {canComplete ? (
                  <>
                    <CheckCircle2 size={18} className="text-white" />
                    <span>
                      {visionMode === 'hands'
                        ? 'Record Hand Biomechanics Session ✓'
                        : autoCompleteCountdown !== null && autoCompleteCountdown > 0
                          ? `Goal Met! Auto-recording in ${autoCompleteCountdown}s (Click to Save)`
                          : 'Record Completed Workout in Patient Chart ✓'}
                    </span>
                  </>
                ) : (
                  <>
                    <Lock size={15} />
                    <span>
                      {visionMode === 'hands'
                        ? 'Evaluating Hand Alignment...'
                        : `In Progress: Rep ${correctReps} / ${targetReps}`}
                    </span>
                  </>
                )}
              </button>

              {/* Clinician Quick Certify */}
              {!canComplete && (
                <button
                  type="button"
                  onClick={() => {
                    setIsAiJudgedCorrect(true);
                    if (visionMode === 'hands') {
                      setHandMetrics(prev => ({ ...prev, handDetected: true, handCorrectness: 'CORRECT' }));
                      setComplianceScore(98);
                      speakFeedback('Clinician verified: Hand alignment & grip certified!', true);
                    } else {
                      setCorrectReps(targetReps);
                      setComplianceScore(95);
                      setAutoCompleteCountdown(4);
                      speakFeedback(`Clinician verified: Full target of ${targetReps} reps certified!`, true);
                    }
                  }}
                  className="w-full py-2 rounded-lg text-[11px] font-bold text-blue-400 hover:text-blue-300 bg-blue-950/40 hover:bg-blue-950/70 border border-blue-800/60 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Sparkles size={12} className="text-amber-400" />
                  <span>{visionMode === 'hands' ? 'Clinician Instant Hand Certification' : 'Clinician Bypass / Instant Form Certification'}</span>
                </button>
              )}
            </div>

          </div>

        </div>

      </div>
    </div>
  );
}
