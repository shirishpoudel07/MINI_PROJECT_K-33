# VirtuHeal AI Motion Detection & Computer Vision Architecture (`CAMERA.MD`)

---

## 1. Executive Overview

The **VirtuHeal AI Motion Coach** transforms standard webcam feeds into a real-time clinical biomechanics laboratory. By applying advanced pose landmark estimation, computerized goniometry (joint angle calculation), and clinical heuristic state machines, VirtuHeal tracks, evaluates, and corrects patient rehabilitation exercises in real time.

```
       ┌────────────────┐
       │  Patient Cam   │ (Webcam 720p / 1080p @ 30-60 FPS)
       └───────┬────────┘
               │
               ▼
       ┌────────────────┐
       │ MediaPipe Pose │ (33 3D Biomechanical Skeletal Landmarks)
       └───────┬────────┘
               │
               ▼
       ┌────────────────┐
       │ Kinematic Math │ (Vector Joint Angle Trigonometry & Smoothing)
       └───────┬────────┘
               │
               ▼
       ┌────────────────┐
       │  Form Analyzer │ ───► 🟢 Correct Posture  (Green Overlay + Rep Counter ++)
       │ & Rule Engine  │ ───► 🟡 Form Warning     (Amber Arc + Voice: "Chest Up")
       └───────┬────────┘ ───► 🔴 Form Error       (Red Joint + "Knees Caving In")
               │
               ▼
       ┌────────────────┐
       │ Database Sync  │ (Prisma SQLite: Reps, Compliance %, Peak ROM, Alerts)
       └────────────────┘
```

---

## 2. Skeletal Landmark Topology (33 Keypoints)

The computer vision engine utilizes the standardized **33 3D Landmark Schema**:

| Keypoint Index | Biomechanical Landmark | Clinical Purpose |
| :--- | :--- | :--- |
| **11, 12** | Left / Right Shoulder | Trunk lean, shoulder symmetry, overhead elevation |
| **13, 14** | Left / Right Elbow | Elbow flexion/extension, press lockout |
| **15, 16** | Left / Right Wrist | Arm trajectory, kinetic chain alignment |
| **23, 24** | Left / Right Hip | Pelvic tilt, hip hinge, squat depth initiation |
| **25, 26** | Left / Right Knee | Knee flexion angle, valgus/varus collapse detection |
| **27, 28** | Left / Right Ankle | Ankle dorsiflexion, base of support tracking |
| **29, 30** | Left / Right Heel | Heel rise detection (weight distribution) |
| **31, 32** | Left / Right Foot Index | Foot flair angle and tracking |

---

## 3. Mathematical Kinematics Engine

### 3.1 3-Point Planar Joint Angle Calculation

For three connected landmark points $A(x_1, y_1)$, $B(x_2, y_2)$ (vertex/joint), and $C(x_3, y_3)$:

$$\vec{u} = \vec{BA} = (x_1 - x_2, y_1 - y_2)$$

$$\vec{v} = \vec{BC} = (x_3 - x_2, y_3 - y_2)$$

The angle $\theta$ at joint $B$ is computed using the 2-argument arctangent function for numeric stability:

$$\theta = \left| \operatorname{atan2}(y_3 - y_2, x_3 - x_2) - \operatorname{atan2}(y_1 - y_2, x_1 - x_2) \right| \times \frac{180}{\pi}$$

If $\theta > 180^\circ$, the interior reflex angle is normalized:

$$\theta = 360^\circ - \theta$$

### 3.2 Exponential Moving Average (EMA) Landmark Smoothing

To eliminate webcam jitter and sensor noise without introducing latency, landmark coordinates are filtered:

$$\hat{P}_t = \alpha \cdot P_t + (1 - \alpha) \cdot \hat{P}_{t-1}$$

*where $\alpha \approx 0.65$ provides optimal responsiveness for clinical range-of-motion tracking.*

### 3.3 Anti-Jitter Clinical Kinematic Pipeline (`RehabRepTracker`)

Physical therapy patients with tremors, neurological spasticity, or post-surgical pain cannot be evaluated with raw frame-by-frame angles or single thresholds. VirtuHeal enforces 4 anti-jitter mechanisms:

1. **Rolling Moving Average Window (5-10 Frames)**:
   $$\bar{\theta}_t = \frac{1}{W} \sum_{i=0}^{W-1} \theta_{t-i} \quad (W = 8)$$
   Filters isolated camera noise, sensor dropouts, and patient trembling before evaluating movement states.

2. **Hysteresis Dual Thresholds State Machine**:
   Replaces fragile single-angle boundary comparisons (`angle > 90`) with a deterministic state machine:
   - State `DOWN` (Baseline): Requires patient angle to rise above `high_thresh` to transition to `UP`.
   - State `UP` (Peak): Requires patient to lower smoothly below `low_thresh` to officially record 1 rep.

3. **Debouncing Frame Cooldown (15-20 Frames Refractory Lock)**:
   After rep increment, a hardware frame lock prevents duplicate counts from high-frequency post-peak oscillations.

4. **Dynamic Calibration Phase (Personalized Peak - 10° Buffer)**:
   Patients perform 1 comfortable repetition before the session begins:
   $$\text{high\_thresh}_{\text{personalized}} = \max(\theta_{\text{calibration}}) - 10^\circ$$
   Accommodates limited mobility (e.g. frozen shoulder, impingement) without artificial failure penalties.

---

## 4. Exercise Clinical Rule Sets & Heuristics

### 4.1 Squat Rehabilitation Protocol (Knee & Hip Rehab)
- **Primary Angle**: Hip ($23/24$) $\rightarrow$ Knee ($25/26$) $\rightarrow$ Ankle ($27/28$).
- **Standing Baseline**: Knee angle $\approx 170^\circ - 180^\circ$.
- **Target Inflexion (Depth)**: Knee angle $\le 95^\circ$ ($90^\circ$ target).
- **Valgus / Knee Collapse Check**:
  - Distance between knees ($|x_{25} - x_{26}|$) must stay $\ge 85\%$ of ankle distance ($|x_{27} - x_{28}|$).
  - If knee distance narrows significantly below ankle width $\rightarrow$ **"Valgus Alert: Keep knees over toes!"**
- **Trunk Angle**: Shoulder-to-hip vector vs. vertical plane $< 40^\circ$.

### 4.2 Straight Leg Raises (Quad & Post-Op ACL)
- **Primary Angle**: Shoulder ($11/12$) $\rightarrow$ Hip ($23/24$) $\rightarrow$ Knee ($25/26$).
- **Knee Lock Verification**: Hip-Knee-Ankle must remain straight ($\ge 165^\circ$).
- **Elevation Depth**: Hip flexion angle reaching $40^\circ - 50^\circ$ from floor.
- **Form Error**: Knee flexion $< 160^\circ$ triggers **"Keep knee straight throughout lift!"**

### 4.3 Shoulder Press Mobility & Overhead Reach
- **Primary Angle**: Shoulder ($11/12$) $\rightarrow$ Elbow ($13/14$) $\rightarrow$ Wrist ($15/16$).
- **Starting Position**: Elbows tucked at $90^\circ$.
- **Overhead Lockout**: Elbow extension reaches $\ge 165^\circ$.
- **Symmetry Check**: Bilateral wrist height variance $< 5\%$ screen height.

### 4.4 Hip Hinge & Deadlift Form
- **Primary Angle**: Shoulder $\rightarrow$ Hip $\rightarrow$ Knee.
- **Hip Hinge**: Hip angle flexes to $60^\circ - 75^\circ$ while knee remains soft ($140^\circ - 160^\circ$).
- **Spine Neutrality**: Torso vector collinearity maintained; rounding triggers **"Keep spine neutral!"**

---

## 5. Repetition State Machine

A deterministic finite state machine (FSM) prevents false rep counts:

```
               ┌──────────────────────────┐
               │          START           │
               └────────────┬─────────────┘
                            │
                            ▼
               ┌──────────────────────────┐
      ┌───────►│      STATE: READY        │◄───────────────────┐
      │        │  (Joint Angle > 160°)    │                    │
      │        └────────────┬─────────────┘                    │
      │                     │ Joint starts flexing (< 140°)    │
      │                     ▼                                  │
      │        ┌──────────────────────────┐                    │
      │        │    STATE: IN_PROGRESS    │                    │
      │        │  (Continuous Form Check) │                    │
      │        └────────────┬─────────────┘                    │
      │                     │ Reaches target depth (<= 95°)    │
      │                     ▼                                  │
      │        ┌──────────────────────────┐                    │
      │        │    STATE: TARGET_REACHED │                    │
      │        │ (Visual green checkmark) │                    │
      │        └────────────┬─────────────┘                    │
      │                     │ Returns to starting position     │
      │                     │ (Joint Angle > 160°)             │
      │                     ▼                                  │
      │        ┌──────────────────────────┐                    │
      │        │  STATE: REP_COMPLETED    │────────────────────┘
      │        │ (Count++, Compliance Log)│
      │        └──────────────────────────┘
```

---

## 6. Real-Time Feedback UI/UX

1. **Live Augmented Canvas Overlay**:
   - Connected skeletal bones in neon green (`#10b981`).
   - Active joint circular nodes with pulse glow on correct depth.
   - Live visual goniometer arc displaying degrees in real time ($88^\circ$).
2. **Form Guidance Banner**:
   - 🟢 `CORRECT POSTURE`: Perfect depth and knee alignment.
   - 🟡 `FORM WARNING`: Torso leaning; slow down repetition.
   - 🔴 `CRITICAL FAULT`: Knee valgus inward collapse.
3. **Voice Audio Coach (Web Speech API)**:
   - Hands-free audio coaching: *"Good depth!"*, *"Rep 3 Complete"*, *"Knees out"*.
4. **Rep Counter & Compliance Gauge**:
   - Large digital counter (`4 / 10 Reps`).
   - Average set form compliance percentage (`94% Form Score`).

---

## 7. Implementation Roadmap & Technical Choices

### Choice 1: Client-Side WebAssembly (Recommended & Implemented)
- **Tech**: `@mediapipe/pose` + `@mediapipe/camera_utils` loaded via optimized WebAssembly CDN.
- **Advantages**: Zero backend GPU cost, 60 FPS on any laptop/phone, absolute patient video privacy (video never leaves device).

### Choice 2: Python Backend Stream
- **Tech**: Python FastAPI / WebSocket + `cv2.VideoCapture` + `mediapipe.solutions.pose`.
- **Advantages**: Centralized Python server processing, compatible with offline batch analysis.

---

## 8. Live Implementation Status (`AiMotionCoachModal.jsx`)

The feature is fully built, integrated, and running live in VirtuHeal:

1. **Component**: [`src/components/AiMotionCoachModal.jsx`](file:///c:/Users/shiri/Open%20mini/src/components/AiMotionCoachModal.jsx).
2. **Trigger**: Added a prominent **"AI Camera Coach"** button on exercise cards in [`src/components/PatientPortal.jsx`](file:///c:/Users/shiri/Open%20mini/src/components/PatientPortal.jsx).
3. **Features Active**:
   - **60 FPS Biomechanical Vision**: 33 3D skeletal landmark tracking with neon green connective bones and red joint keypoints.
   - **Real-Time Knee Goniometer**: Live degree readout arc ($180^\circ \rightarrow 90^\circ$).
   - **Clinical Squat Posture Heuristic**: Evaluates $90^\circ$ depth and detects knee valgus inward collapse.
   - **Hands-Free Audio Voice Coach**: Synthesizes live voice cues (*"Good depth!"*, *"Rep 1 complete!"*, *"Push knees out"*).
   - **Dual Camera Mode**: Works with live webcam **or** pre-recorded clinical exercise video (`/videos/squats.webm`) for testing without camera.
   - **Clinical Session Logger**: "Finish & Record Clinical Session" button syncs completed reps and form compliance score directly to SQLite database.

---

## 9. MediaPipe 21-Finger Hand & Gesture Tracking Topology

The AI Vision Coach now supports dedicated **Hand & Finger Detection** with 21 landmarks per hand:

```
          (8) INDEX_TIP        (12) MID_TIP        (16) RING_TIP
              │                    │                   │
             (7) DIP              (11) DIP            (15) DIP       (20) PINKY_TIP
              │                    │                   │                 │
             (6) PIP              (10) PIP            (14) PIP          (19) DIP
              │                    │                   │                 │
   (4) THUMB  │                    │                   │                (18) PIP
        \    (5) MCP──────────────(9) MCP────────────(13) MCP            │
       (3) IP │                                         │              (17) MCP
         \   /                                          │             /
        (2) MCP                                         │            /
          \                                             │           /
         (1) CMC────────────────────────────────────────┴──────────/
            \                                                     /
             \──────────────────────(0) WRIST────────────────────/
```

### 9.1 Finger Topology Schema
- **Thumb**: Landmark 0 (Wrist) $\rightarrow$ 1 (CMC) $\rightarrow$ 2 (MCP) $\rightarrow$ 3 (IP) $\rightarrow$ 4 (Tip).
- **Index Finger**: Landmark 5 (MCP) $\rightarrow$ 6 (PIP) $\rightarrow$ 7 (DIP) $\rightarrow$ 8 (Tip).
- **Middle Finger**: Landmark 9 (MCP) $\rightarrow$ 10 (PIP) $\rightarrow$ 11 (DIP) $\rightarrow$ 12 (Tip).
- **Ring Finger**: Landmark 13 (MCP) $\rightarrow$ 14 (PIP) $\rightarrow$ 15 (DIP) $\rightarrow$ 16 (Tip).
- **Pinky Finger**: Landmark 17 (MCP) $\rightarrow$ 18 (PIP) $\rightarrow$ 19 (DIP) $\rightarrow$ 20 (Tip).

### 9.2 Kinematic Clinical Rules for Hand Rehabilitation
1. **Individual Finger Extension**:
   - For fingers 2–5, a finger is classified as **Extended** when Tip $y <$ PIP $y$ (in camera space).
   - For the Thumb, extension is computed using Euclidean displacement from the MCP base.
   - Live visual status badge renders on all 5 fingers (`Thumb`, `Index`, `Mid`, `Ring`, `Pinky`).
2. **Pinch Precision Grip Metric**:
   - Computes normalized Euclidean distance $d = \sqrt{(x_4 - x_8)^2 + (y_4 - y_8)^2}$ between Thumb Tip and Index Tip.
   - Threshold $d < 0.065$ triggers **Precision Pinch Detected** (vital for neurological stroke rehabilitation and fine motor recovery).
3. **Hand Opening / Grip Repetition Counter**:
   - State transition: `CLOSED_FIST` ($0$ fingers extended) $\rightarrow$ `FULL_EXTENSION` ($5 / 5$ fingers extended) counts valid clinical hand pump repetitions.

---

## 10. Heavy Model Architecture & Strict AI Completion Certification

### 10.1 MediaPipe Heavy Model v2 Integration
- **Model Complexity 2**: Upgraded pose inference to the **Heavy Tensor Model** (`modelComplexity: 2`), achieving the highest accuracy landmark localization and 3D z-axis spatial estimation.
- **Enhanced Thresholds**: Elevated `minDetectionConfidence: 0.65` and `minTrackingConfidence: 0.65` to eliminate hallucinated keypoints and maintain locked tracking across complex movement planes.
- **Exponential Moving Average (EMA) Angle Filtering**:
  $$\theta_t = 0.35 \cdot \theta_{\text{raw}} + 0.65 \cdot \theta_{t-1}$$
  Eliminates camera sensor flutter and rapid pixel noise for clean computerized goniometer degree tracking.
- **Dynamic 1:1 Aspect Ratio Scaling**: Canvas dimensions automatically conform to video stream dimensions (`1280x720` or input resolution) ensuring zero skeleton offset or parallax skew.

### 10.2 Strict Clinical Completion Gate: "Only When AI Says Correct"
- **Mandatory AI Certification**: The exercise completion button is **strictly locked** (`disabled`, padlock icon) until the AI vision engine explicitly evaluates the patient's biomechanics as **CORRECT**.
- **Real-Time AI Verdict HUD**:
  - 🟢 **AI VERDICT: CORRECT MOVEMENT ✓** (Held depth $\le 95^\circ$ without valgus collapse; or full overhead lockout $\ge 155^\circ$; or 5/5 finger extension).
  - 🔴 **AI VERDICT: INCORRECT FORM — ADJUST** (Knee valgus collapse inward, excessive trunk flexion, or partial finger reach).
  - 🔵 **AI VERDICT: TRACKING KINEMATICS** (Active eccentric/concentric phase).
- **Repetition Quality Gate**: Repetitions where knees cave inward or posture falls are automatically discounted. Only zero-violation reps increment `correctReps`.
- **Automatic Audio & UI Unlock**:
  - Voice synthesizer announces: *"Exercise verified correct! Great job, marked completed."*
  - Glowing unlocked button activates: **"AI Certified Correct: Complete Exercise & Save ✓"**.
  - Synchronizes verified status (`aiVerified: true`) to the patient's medical chart in SQLite.

---

*Document created for VirtuHeal Telerehabilitation Platform.*
