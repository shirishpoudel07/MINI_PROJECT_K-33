export const patientExercises = [
  {
    id: "ex-cv-001",
    title: "Seated Active Shoulder Abduction",
    category: "Shoulder Mobility",
    target: "Deltoids, Shoulder Joint",
    instructions: "Sit up straight facing the camera. Keep your arms straight and slowly raise both arms out to your sides until they are parallel to the floor, then lower them.",
    sets: 2,
    reps: 10,
    youtubeId: "F_e3U4-Hbr8", // Anticipate Wellness PT (Active Shoulder Abduction)
    videoUrl: "https://www.youtube.com/embed/F_e3U4-Hbr8",
    thumbnail: "https://img.youtube.com/vi/F_e3U4-Hbr8/hqdefault.jpg",
    duration: "2:00",
    completionCount: 0,
    trackingJoints: ["hip", "shoulder", "elbow"],
    cvThresholds: { high: 80, low: 30 }
  },
  {
    id: "ex-cv-002",
    title: "Seated Elbow Flexion",
    category: "Elbow Mobility",
    target: "Biceps, Elbow Joint",
    instructions: "Keep your elbows pinned to your ribs. Bend your elbows to bring your hands up toward your shoulders, then extend them fully downward.",
    sets: 3,
    reps: 12,
    youtubeId: "20xvAsCfuW8", // Verified Nemours KidsHealth PT AROM demonstration
    videoUrl: "https://www.youtube.com/embed/20xvAsCfuW8",
    thumbnail: "https://img.youtube.com/vi/20xvAsCfuW8/hqdefault.jpg",
    duration: "1:45",
    completionCount: 0,
    trackingJoints: ["shoulder", "elbow", "wrist"],
    cvThresholds: { high: 50, low: 150 }, // Flexion makes the angle smaller
    invertLogic: true
  },
  {
    id: "ex-cv-003",
    title: "Seated Overhead Reach",
    category: "Shoulder Range of Motion",
    target: "Shoulders, Upper Back",
    instructions: "Start with your hands near your shoulders. Press both hands straight up toward the ceiling as high as you comfortably can, then lower them.",
    sets: 2,
    reps: 10,
    youtubeId: "zyS6eK6J_Hc", // Verified Ask Doctor Jo Shoulder Range of Motion & Overhead Reach
    videoUrl: "https://www.youtube.com/embed/zyS6eK6J_Hc",
    thumbnail: "https://img.youtube.com/vi/zyS6eK6J_Hc/hqdefault.jpg",
    duration: "2:00",
    completionCount: 0,
    trackingJoints: ["shoulder", "elbow", "wrist"],
    cvThresholds: { high: 160, low: 90 }
  },
  {
    id: "ex-cv-004",
    title: "Shoulder Wall Crawls",
    category: "Range of Motion",
    target: "Shoulder Joint, Rotator Cuff",
    instructions: "Stand facing a wall. Use your fingers to slowly crawl your hand up the wall into a mild stretch, then slowly crawl back down.",
    sets: 3,
    reps: 8,
    youtubeId: "kuJjYd-rdww", // Verified TSAOG Orthopaedics Wall Crawl
    videoUrl: "https://www.youtube.com/embed/kuJjYd-rdww",
    thumbnail: "https://img.youtube.com/vi/kuJjYd-rdww/hqdefault.jpg",
    duration: "2:10",
    completionCount: 0,
    trackingJoints: ["shoulder", "elbow", "wrist"],
    cvThresholds: { high: 140, low: 70 }
  },
  {
    id: "ex-cv-005",
    title: "Standing Scapular Retractions",
    category: "Strengthening & Posture",
    target: "Rhomboids, Middle Trapezius",
    instructions: "Stand tall and squeeze your shoulder blades firmly together as if holding a pencil between them. Hold for 5 seconds.",
    sets: 3,
    reps: 10,
    youtubeId: "UHlhyti-RBQ", // Verified Wellen Scapular Retraction Drill
    videoUrl: "https://www.youtube.com/embed/UHlhyti-RBQ",
    thumbnail: "https://img.youtube.com/vi/UHlhyti-RBQ/hqdefault.jpg",
    duration: "2:15",
    completionCount: 0,
    trackingJoints: ["shoulder", "elbow", "hip"],
    cvThresholds: { high: 90, low: 45 }
  },
  {
    id: "ex-cv-006",
    title: "Seated Cervical Chin Tucks",
    category: "Postural Correction",
    target: "Cervical Spine, Neck Stabilizers",
    instructions: "Sit upright with shoulders relaxed. Glide your chin straight back making a double chin without tilting head down. Hold 3-5 seconds.",
    sets: 2,
    reps: 10,
    youtubeId: "7rnlAVhAK-8", // Verified Ask Doctor Jo Sitting Chin Tucks
    videoUrl: "https://www.youtube.com/embed/7rnlAVhAK-8",
    thumbnail: "https://img.youtube.com/vi/7rnlAVhAK-8/hqdefault.jpg",
    duration: "1:40",
    completionCount: 0,
    trackingJoints: ["shoulder", "elbow", "hip"],
    cvThresholds: { high: 45, low: 15 }
  }
];

export const initialPatients = [
  {
    id: 'p1',
    name: 'Shirish Poudel',
    condition: 'Upper Body & Cervical Physical Therapy Rehab',
    adherenceScore: 92,
    assignedDoctor: 'Dr. Alex Vance, PT, DPT, PhD',
    assignedDoctorId: 'doc_1',
    medicalReport: {
      fileName: 'Clinical_Prescription_Summary_Poudel_Shirish.pdf',
      fileSize: '2.8 MB',
      notes: 'Post-acute cervical and glenohumeral rehabilitation protocol. Prescribed gentle range of motion, scapular stabilization, and postural correction under Dr. Alex Vance.'
    },
    activeVideos: [...patientExercises],
    messages: [
      { id: 'm1', sender: 'doctor', text: 'Hi Shirish, welcome to your upper-body physical therapy program. How are your shoulders and neck feeling today?', timestamp: '09:00 AM' },
      { id: 'm2', sender: 'patient', text: 'Hi Dr. Vance, the neck stiffness is improving, and doing the chin tucks and scapular retractions has been helping my posture a lot.', timestamp: '10:15 AM' },
      { 
        id: 'm3', 
        sender: 'doctor', 
        text: "Excellent progress Shirish! I've assigned your seated upper-body routine: Seated Active Shoulder Abduction, Elbow Flexion, and Overhead Reach. Follow the real-time AI biomechanics coach for rep tracking.", 
        youtubeId: 'F_e3U4-Hbr8',
        videoUrl: 'https://www.youtube.com/embed/F_e3U4-Hbr8',
        thumbnail: 'https://img.youtube.com/vi/F_e3U4-Hbr8/hqdefault.jpg',
        title: 'Seated Active Shoulder Abduction',
        timestamp: '10:30 AM' 
      }
    ],
    consistencyStreak: 14,
    progressData: [
      { day: 'Mon', score: 78, date: 'Nov 12', completedExercises: 5 },
      { day: 'Tue', score: 82, date: 'Nov 13', completedExercises: 5 },
      { day: 'Wed', score: 85, date: 'Nov 14', completedExercises: 5 },
      { day: 'Thu', score: 88, date: 'Nov 15', completedExercises: 6 },
      { day: 'Fri', score: 90, date: 'Nov 16', completedExercises: 6 },
      { day: 'Sat', score: 94, date: 'Nov 17', completedExercises: 6 },
      { day: 'Sun', score: 92, date: 'Nov 18 (Today)', completedExercises: 6 }
    ],
    recoveryTimeline: [
      { phase: 'Phase 1: Cervical & Scapular Acute Protection', date: 'Oct 28', status: 'Completed', detail: 'Gentle passive range of motion, posture alignment, and edema relief.' },
      { phase: 'Phase 2: Scapulothoracic & Glenohumeral Mobility', date: 'Nov 04', status: 'Completed', detail: 'Shoulder wall crawls, active elevation, and seated cervical retractions.' },
      { phase: 'Phase 3: Active AI-Monitored Strengthening', date: 'Nov 12', status: 'In Progress', detail: 'Scapular retractions and postural chin tucks with real-time pose tracking.' },
      { phase: 'Phase 4: Functional Postural Resilience', date: 'Nov 24', status: 'Upcoming', detail: 'Full multi-planar upper-body kinetic chain integration and work ergonomic loading.' }
    ]
  }
];

export const availableVideos = [
  ...patientExercises.map((e) => ({
    ...e
  })),
  { id: 'vid_1', title: 'Quad Sets (Isometric Activation)', duration: '2:15', thumbnail: 'https://img.youtube.com/vi/au62CidApd0/hqdefault.jpg', youtubeId: 'au62CidApd0', videoUrl: 'https://www.youtube.com/embed/au62CidApd0', category: 'Knee & Quad Rehabilitation', sets: 3, reps: 10, instructions: 'Tighten thigh muscles, press knee flat into surface and hold 5 seconds.' },
  { id: 'vid_2', title: 'Straight Leg Raises (SLR)', duration: '2:30', thumbnail: 'https://img.youtube.com/vi/Ka19yzAlIGY/hqdefault.jpg', youtubeId: 'Ka19yzAlIGY', videoUrl: 'https://www.youtube.com/embed/Ka19yzAlIGY', category: 'Knee & Hip Strengthening', sets: 3, reps: 10, instructions: 'Keep knee locked straight, lift leg 8-12 inches off floor, hold briefly, and lower slowly.' },
  { id: 'vid_4', title: 'Supine Heel Slides on Mat', duration: '2:00', thumbnail: 'https://img.youtube.com/vi/iMdH_G4N9nY/hqdefault.jpg', youtubeId: 'iMdH_G4N9nY', videoUrl: 'https://www.youtube.com/embed/iMdH_G4N9nY', category: 'Post-Op Knee Flexion', sets: 3, reps: 10, instructions: 'Controlled knee flexion. Slide heel backward smoothly toward hip without sharp pain.' },
  { id: 'vid_5', title: 'Seated Knee Extension (Long Arc Quads)', duration: '2:20', thumbnail: 'https://img.youtube.com/vi/pOrc3zADC7k/hqdefault.jpg', youtubeId: 'pOrc3zADC7k', videoUrl: 'https://www.youtube.com/embed/pOrc3zADC7k', category: 'Lower Extremity Rehab', sets: 3, reps: 12, instructions: 'Straighten knee fully while seated, hold for 2 seconds at the top, then lower.' },
  { id: 'vid_6', title: 'Ankle Pumps & Edema Drainage', duration: '1:30', thumbnail: 'https://img.youtube.com/vi/-twMbBmHwso/hqdefault.jpg', youtubeId: '-twMbBmHwso', videoUrl: 'https://www.youtube.com/embed/-twMbBmHwso', category: 'Circulatory & Ankle Recovery', sets: 3, reps: 20, instructions: 'Point toes down away from you, then pull toes upward toward shin rhythmically.' },
  { id: 'vid_8', title: 'Shoulder External Rotation Drill', duration: '1:50', thumbnail: 'https://img.youtube.com/vi/MD-ddObx9QA/hqdefault.jpg', youtubeId: 'MD-ddObx9QA', videoUrl: 'https://www.youtube.com/embed/MD-ddObx9QA', category: 'Rotator Cuff Stabilization', sets: 3, reps: 10, instructions: 'Keep elbow pinned at 90 degrees against ribs, rotate forearm outward smoothly.' }
];
