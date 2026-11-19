/**
 * VirtuHeal Clinical Tele-Rehabilitation Kinematic Rep Tracker
 * 
 * Specifically designed for physical therapy patients with tremors, spasticity,
 * or limited range of motion (frozen shoulder, post-op ACL, cervical stiffness).
 * 
 * Incorporates 4 clinical anti-jitter mechanisms:
 * 1. Moving Average Smoothing (rolling window of 5-10 frames)
 * 2. Hysteresis State Machine (Dual thresholds: high_thresh & low_thresh)
 * 3. Frame-based Debouncing Cooldown (15-20 frames refractory period)
 * 4. Dynamic Range-of-Motion (ROM) Calibration (Peak - 10° buffer)
 */

export class RehabRepTracker {
  /**
   * @param {Object} options
   * @param {number} [options.windowSize=8] - Rolling window size for moving average (5-10 frames)
   * @param {number} [options.highThresh=120] - Upper angle threshold for concentric peak
   * @param {number} [options.lowThresh=85] - Lower angle threshold for eccentric baseline
   * @param {number} [options.cooldownFrames=18] - Refractory frame lock after a rep (15-20 frames)
   * @param {number} [options.bufferDegrees=10] - Safety margin subtracted from calibrated peak
   * @param {boolean} [options.inverted=false] - True if flexion decreases angle (e.g. Squat depth)
   */
  constructor(options = {}) {
    this.windowSize = Math.max(5, Math.min(10, options.windowSize || 8));
    const cvThresh = options.cvThresholds || {};
    this.defaultHighThresh = cvThresh.high ?? options.highThresh ?? 120;
    this.defaultLowThresh = cvThresh.low ?? options.lowThresh ?? 85;
    this.highThresh = this.defaultHighThresh;
    this.lowThresh = this.defaultLowThresh;
    this.cooldownFrames = Math.max(12, Math.min(30, options.cooldownFrames || 18));
    this.bufferDegrees = options.bufferDegrees ?? 10;
    this.inverted = Boolean(options.invertLogic || options.inverted);

    // State Machine
    this.state = 'down'; // 'down' (baseline) | 'up' (peak reached)
    this.repCount = 0;
    this.cooldownRemaining = 0;
    this.totalFramesProcessed = 0;

    // Moving average buffer
    this.angleBuffer = [];
    this.lastSmoothedAngle = this.lowThresh;

    // Calibration phase state
    this.isCalibrating = false;
    this.calibrationAngles = [];
    this.calibratedPeak = null;
    this.isCalibrated = false;

    // Metric telemetry
    this.peakAngleThisRep = 0;
    this.movementDurationFrames = 0;
  }

  /**
   * Reset tracking state while preserving calibration thresholds
   */
  reset() {
    this.state = 'down';
    this.repCount = 0;
    this.cooldownRemaining = 0;
    this.angleBuffer = [];
    this.peakAngleThisRep = 0;
    this.movementDurationFrames = 0;
  }

  /**
   * Reset everything back to factory defaults, clearing calibration
   */
  resetAll() {
    this.reset();
    this.highThresh = this.defaultHighThresh;
    this.lowThresh = this.defaultLowThresh;
    this.isCalibrated = false;
    this.calibratedPeak = null;
    this.isCalibrating = false;
    this.calibrationAngles = [];
  }

  /**
   * Mechanism 1: Moving Average (Smoothing)
   * Appends raw angle to rolling window of 5-10 frames and returns mathematical mean.
   * @param {number} rawAngle
   * @returns {number} smoothedAngle
   */
  computeMovingAverage(rawAngle) {
    if (typeof rawAngle !== 'number' || isNaN(rawAngle)) {
      return this.lastSmoothedAngle;
    }

    this.angleBuffer.push(rawAngle);
    if (this.angleBuffer.length > this.windowSize) {
      this.angleBuffer.shift();
    }

    const sum = this.angleBuffer.reduce((acc, val) => acc + val, 0);
    const mean = Math.round((sum / this.angleBuffer.length) * 10) / 10;
    this.lastSmoothedAngle = mean;
    return mean;
  }

  /**
   * Mechanism 4: Dynamic Calibration Phase
   * Begins recording user's comfortable active range of motion.
   */
  startCalibration() {
    this.isCalibrating = true;
    this.calibrationAngles = [];
    this.calibratedPeak = null;
  }

  /**
   * Mechanism 4: Record a frame during calibration phase
   * @param {number} rawAngle
   * @returns {number} current smoothed angle
   */
  recordCalibrationFrame(rawAngle) {
    const smoothed = this.computeMovingAverage(rawAngle);
    if (this.isCalibrating && typeof smoothed === 'number' && !isNaN(smoothed)) {
      this.calibrationAngles.push(smoothed);
    }
    return smoothed;
  }

  /**
   * Mechanism 4: Finalize Calibration
   * Captures the patient's maximum comfortable angle, subtracts buffer (10°),
   * and dynamically assigns personalized high_thresh & low_thresh.
   * 
   * @param {number} [buffer] - Override default buffer (default: 10°)
   * @returns {Object} Calibration summary
   */
  finishCalibration(buffer = this.bufferDegrees) {
    this.isCalibrating = false;
    this.bufferDegrees = buffer;

    if (this.calibrationAngles.length < 5) {
      // Not enough frames: use defaults
      return {
        success: false,
        message: 'Insufficient calibration frames. Please move through range of motion.',
        highThresh: this.highThresh,
        lowThresh: this.lowThresh
      };
    }

    if (this.inverted) {
      // For flexion (e.g. Bicep Curls) where lowest angle is peak flexion
      const minAngle = Math.min(...this.calibrationAngles);
      this.calibratedPeak = Math.round(minAngle);
      // For inverted, add buffer so target is comfortably achievable (e.g. 50° + 10° buffer = 60°)
      const personalizedPeak = Math.round(minAngle + buffer);
      const baseline = Math.max(...this.calibrationAngles);
      const personalizedBase = Math.round(Math.max(120, baseline - buffer));
      
      this.highThresh = personalizedPeak;
      this.lowThresh = personalizedBase;
    } else {
      // Standard extension/elevation (Shoulder press, wall crawl, lateral raise, knee extension)
      const maxAngle = Math.max(...this.calibrationAngles);
      this.calibratedPeak = Math.round(maxAngle);
      
      // Personalized high threshold = max angle - 10° buffer
      this.highThresh = Math.round(Math.max(45, maxAngle - buffer));
      
      // Calculate responsive low return threshold (30°-35° below high threshold or baseline)
      const baseline = Math.min(...this.calibrationAngles.slice(0, 10));
      const proportionalLow = Math.max(30, this.highThresh - 30);
      this.lowThresh = Math.round(Math.min(proportionalLow, Math.max(30, baseline + 10)));
    }

    this.isCalibrated = true;
    this.reset();

    return {
      success: true,
      calibratedPeak: this.calibratedPeak,
      bufferDegrees: this.bufferDegrees,
      highThresh: this.highThresh,
      lowThresh: this.lowThresh,
      totalFramesCaptured: this.calibrationAngles.length
    };
  }

  /**
   * Set personalized thresholds manually (e.g. from doctor prescription)
   */
  setPersonalizedThresholds(high, low) {
    if (typeof high === 'number' && !isNaN(high)) this.highThresh = Math.round(high);
    if (typeof low === 'number' && !isNaN(low)) this.lowThresh = Math.round(low);
    this.isCalibrated = true;
  }

  /**
   * Core Rep Counting Evaluation Engine
   * Evaluates smoothed angle through Hysteresis State Machine + Frame Cooldown.
   * 
   * @param {number} rawAngle - Current instant joint angle from MediaPipe / OpenCV
   * @returns {Object} Comprehensive telemetry for UI, rendering, and voice engine
   */
  update(rawAngle) {
    this.totalFramesProcessed += 1;

    // 1. Moving Average Smoothing
    const smoothedAngle = this.computeMovingAverage(rawAngle);

    // If currently calibrating, simply store and return calibration progress
    if (this.isCalibrating) {
      this.calibrationAngles.push(smoothedAngle);
      const currentPeak = this.inverted 
        ? (this.calibrationAngles.length ? Math.min(...this.calibrationAngles) : smoothedAngle)
        : (this.calibrationAngles.length ? Math.max(...this.calibrationAngles) : smoothedAngle);

      return {
        rawAngle,
        smoothedAngle,
        state: 'calibrating',
        repCount: this.repCount,
        cooldownRemaining: 0,
        isCooldownActive: false,
        justCountedRep: false,
        isCalibrating: true,
        calibratedPeak: currentPeak,
        suggestedHighThresh: this.inverted ? currentPeak + this.bufferDegrees : Math.max(45, currentPeak - this.bufferDegrees),
        formFeedback: 'Calibration in progress: perform 1 full comfortable repetition'
      };
    }

    // 3. Debouncing (Frame Cooldown countdown)
    let justCountedRep = false;
    if (this.cooldownRemaining > 0) {
      this.cooldownRemaining -= 1;
    }

    // 2. Hysteresis (Dual Threshold State Machine)
    let formFeedback = '';
    let progressPercent = 0;

    if (!this.inverted) {
      // Standard Elevation / Extension (e.g. Shoulder Wall Crawls, Press, Knee Ext, SLR)
      // Range: lowThresh -> highThresh
      const span = Math.max(1, this.highThresh - this.lowThresh);
      progressPercent = Math.min(100, Math.max(0, Math.round(((smoothedAngle - this.lowThresh) / span) * 100)));

      if (this.state === 'down') {
        // Patient is at baseline, moving upward
        this.movementDurationFrames += 1;
        if (smoothedAngle >= this.highThresh) {
          // Patient has cleanly crossed high_thresh -> State transitions to "up"
          this.state = 'up';
          this.peakAngleThisRep = smoothedAngle;
          formFeedback = `Target reached (${Math.round(smoothedAngle)}°)! Now lower smoothly to baseline.`;
        } else {
          this.peakAngleThisRep = Math.max(this.peakAngleThisRep, smoothedAngle);
          formFeedback = `Elevating: ${Math.round(smoothedAngle)}° / ${this.highThresh}° target`;
        }
      } else if (this.state === 'up') {
        // Patient has reached peak and is returning down to baseline
        this.movementDurationFrames += 1;
        this.peakAngleThisRep = Math.max(this.peakAngleThisRep, smoothedAngle);

        if (smoothedAngle <= this.lowThresh) {
          // Patient has cleanly crossed low_thresh -> 1 Rep officially verified!
          // Only increment if not currently blocked by debouncing cooldown
          if (this.cooldownRemaining === 0) {
            this.repCount += 1;
            justCountedRep = true;
            // Initiate 15-20 frames debouncing cooldown lock
            this.cooldownRemaining = this.cooldownFrames;
            formFeedback = `✨ Rep ${this.repCount} Counted! Perfect range of motion.`;
          }
          this.state = 'down';
          this.movementDurationFrames = 0;
          this.peakAngleThisRep = 0;
        } else {
          formFeedback = `Lowering arm: return below ${this.lowThresh}° (currently ${Math.round(smoothedAngle)}°)`;
        }
      }
    } else {
      // Inverted Mode (e.g. Bicep Curls where flexion reduces angle, or Squat depth)
      // Peak flexion target is the smaller angle; resting extension baseline is the larger angle.
      const peakThresh = Math.min(this.highThresh, this.lowThresh);
      const baseThresh = Math.max(this.highThresh, this.lowThresh);
      const span = Math.max(1, baseThresh - peakThresh);
      progressPercent = Math.min(100, Math.max(0, Math.round(((baseThresh - smoothedAngle) / span) * 100)));

      if (this.state === 'down') {
        // Patient is at baseline extension (e.g. 150°+), curling/flexing upward towards peak (≤50°)
        this.movementDurationFrames += 1;
        if (smoothedAngle <= peakThresh) {
          // Patient has cleanly reached peak contraction -> State transitions to "up"
          this.state = 'up';
          this.peakAngleThisRep = smoothedAngle;
          formFeedback = `Target flexion reached (${Math.round(smoothedAngle)}°)! Now lower smoothly with control.`;
        } else {
          this.peakAngleThisRep = Math.min(this.peakAngleThisRep || 180, smoothedAngle);
          formFeedback = `Curling: ${Math.round(smoothedAngle)}° / target ≤${peakThresh}°`;
        }
      } else if (this.state === 'up') {
        // Patient has reached peak and is lowering back to extended baseline (≥150°)
        this.movementDurationFrames += 1;
        if (smoothedAngle >= baseThresh) {
          // Patient has cleanly returned to baseline -> 1 Rep officially verified!
          if (this.cooldownRemaining === 0) {
            this.repCount += 1;
            justCountedRep = true;
            this.cooldownRemaining = this.cooldownFrames;
            formFeedback = `✨ Rep ${this.repCount} Counted! Full range of motion.`;
          }
          this.state = 'down';
          this.movementDurationFrames = 0;
          this.peakAngleThisRep = 0;
        } else {
          formFeedback = `Lowering: extend arm back toward ${baseThresh}° (currently ${Math.round(smoothedAngle)}°)`;
        }
      }
    }

    return {
      rawAngle: Math.round(rawAngle * 10) / 10,
      smoothedAngle,
      state: this.state, // 'up' | 'down'
      repCount: this.repCount,
      justCountedRep,
      cooldownRemaining: this.cooldownRemaining,
      isCooldownActive: this.cooldownRemaining > 0,
      progressPercent,
      formFeedback,
      thresholds: {
        highThresh: this.highThresh,
        lowThresh: this.lowThresh,
        bufferDegrees: this.bufferDegrees,
        isCalibrated: this.isCalibrated,
        calibratedPeak: this.calibratedPeak
      }
    };
  }
}

/**
 * Convenience factory to create a tuned tracker for a specific exercise protocol
 * @param {string} exerciseTitle
 * @param {Object} [customOptions]
 * @returns {RehabRepTracker}
 */
export function createRehabRepTracker(exerciseTitle = '', customOptions = {}) {
  const t = exerciseTitle.toLowerCase();

  // Explicit cvThresholds or invertLogic passed in
  if (customOptions.cvThresholds) {
    return new RehabRepTracker({
      windowSize: 8,
      highThresh: customOptions.cvThresholds.high,
      lowThresh: customOptions.cvThresholds.low,
      cooldownFrames: 18,
      bufferDegrees: 10,
      inverted: Boolean(customOptions.invertLogic || customOptions.inverted),
      ...customOptions
    });
  }

  // 1. Seated Active Shoulder Abduction / Lateral Raises (Shoulder Mobility: hip, shoulder, elbow; high: 80, low: 30)
  if (t.includes('abduction') || t.includes('lateral') || (t.includes('raise') && !t.includes('leg'))) {
    return new RehabRepTracker({
      windowSize: 8,
      highThresh: 80,
      lowThresh: 30,
      cooldownFrames: 18,
      bufferDegrees: 10,
      inverted: false,
      ...customOptions
    });
  }

  // 2. Seated Elbow Flexion / Bicep Curls (Elbow Mobility: shoulder, elbow, wrist; high: 50, low: 150, invertLogic: true)
  if (t.includes('flexion') || t.includes('curl') || t.includes('bicep') || (t.includes('elbow') && !t.includes('extension'))) {
    return new RehabRepTracker({
      windowSize: 8,
      highThresh: 50,
      lowThresh: 150,
      cooldownFrames: 18,
      bufferDegrees: 10,
      inverted: true,
      ...customOptions
    });
  }

  // 3. Seated Overhead Reach / Overhead Press (Shoulder ROM: shoulder, elbow, wrist; high: 160, low: 90)
  if (t.includes('reach') || t.includes('overhead') || t.includes('press')) {
    return new RehabRepTracker({
      windowSize: 8,
      highThresh: 160,
      lowThresh: 90,
      cooldownFrames: 18,
      bufferDegrees: 10,
      inverted: false,
      ...customOptions
    });
  }

  // Shoulder Wall Crawls / Arm Elevation
  if (t.includes('crawl') || t.includes('wall')) {
    return new RehabRepTracker({
      windowSize: 8,
      highThresh: 120, // default shoulder elevation
      lowThresh: 75,  // return to resting 90° or lap
      cooldownFrames: 18,
      bufferDegrees: 10,
      inverted: false,
      ...customOptions
    });
  }

  // Shoulder Pendulums
  if (t.includes('pendulum')) {
    return new RehabRepTracker({
      windowSize: 8,
      highThresh: 25, // sway angle in degrees
      lowThresh: 8,
      cooldownFrames: 20,
      bufferDegrees: 5,
      inverted: false,
      ...customOptions
    });
  }

  // Standing Scapular Retractions
  if (t.includes('scapular') || t.includes('retraction')) {
    return new RehabRepTracker({
      windowSize: 7,
      highThresh: 110, // squeeze back angle
      lowThresh: 80,
      cooldownFrames: 18,
      bufferDegrees: 8,
      inverted: false,
      ...customOptions
    });
  }

  // Seated Chin Tucks
  if (t.includes('chin') || t.includes('tuck') || t.includes('cervical')) {
    return new RehabRepTracker({
      windowSize: 6,
      highThresh: 22, // cervical retraction angle/displacement
      lowThresh: 8,
      cooldownFrames: 18,
      bufferDegrees: 4,
      inverted: false,
      ...customOptions
    });
  }

  // Knee Extension (Long Arc Quads)
  if (t.includes('extension') && t.includes('knee')) {
    return new RehabRepTracker({
      windowSize: 8,
      highThresh: 140, // straight kick
      lowThresh: 100, // 90° seated
      cooldownFrames: 18,
      bufferDegrees: 10,
      inverted: false,
      ...customOptions
    });
  }

  // Squats (Inverted: depth is lower angle)
  if (t.includes('squat')) {
    return new RehabRepTracker({
      windowSize: 8,
      highThresh: 155, // standing tall
      lowThresh: 125, // depth target
      cooldownFrames: 20,
      bufferDegrees: 10,
      inverted: true,
      ...customOptions
    });
  }

  // Generic Default
  return new RehabRepTracker({
    windowSize: 8,
    highThresh: 120,
    lowThresh: 80,
    cooldownFrames: 18,
    bufferDegrees: 10,
    inverted: false,
    ...customOptions
  });
}
