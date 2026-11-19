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
    localVideoUrl: "/videos/shoulder-abduction.mp4",
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
    youtubeId: "81kQy9L1W4s", // Standard PT Elbow Flexion AROM
    videoUrl: "https://www.youtube.com/embed/81kQy9L1W4s",
    localVideoUrl: "/videos/elbow-flexion.mp4",
    thumbnail: "https://img.youtube.com/vi/81kQy9L1W4s/hqdefault.jpg",
    duration: "1:45",
    completionCount: 0,
    trackingJoints: ["shoulder", "elbow", "wrist"],
    cvThresholds: { high: 50, low: 150 }, // Note: Flexion makes the angle smaller
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
    youtubeId: "v8b9q4Z7X6A", // Standard PT Overhead Reach AROM
    videoUrl: "https://www.youtube.com/embed/v8b9q4Z7X6A",
    localVideoUrl: "/videos/overhead-reach.mp4",
    thumbnail: "https://img.youtube.com/vi/v8b9q4Z7X6A/hqdefault.jpg",
    duration: "2:00",
    completionCount: 0,
    trackingJoints: ["shoulder", "elbow", "wrist"],
    cvThresholds: { high: 160, low: 90 }
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
      { day: 'Mon', score: 78, date: 'Nov 12', rom: 76, completedExercises: 4 },
      { day: 'Tue', score: 82, date: 'Nov 13', rom: 80, completedExercises: 4 },
      { day: 'Wed', score: 85, date: 'Nov 14', rom: 84, completedExercises: 4 },
      { day: 'Thu', score: 88, date: 'Nov 15', rom: 88, completedExercises: 4 },
      { day: 'Fri', score: 90, date: 'Nov 16', rom: 90, completedExercises: 4 },
      { day: 'Sat', score: 94, date: 'Nov 17', rom: 92, completedExercises: 4 },
      { day: 'Sun', score: 92, date: 'Nov 18 (Today)', rom: 94, completedExercises: 4 }
    ],
    recoveryTimeline: [
      { phase: 'Phase 1: Cervical & Scapular Acute Protection', date: 'Oct 28', status: 'Completed', detail: 'Gentle passive range of motion, posture alignment, and edema relief.' },
      { phase: 'Phase 2: Scapulothoracic & Glenohumeral Mobility', date: 'Nov 04', status: 'Completed', detail: 'Shoulder pendulums, wall crawls, and seated cervical retractions.' },
      { phase: 'Phase 3: Active AI-Monitored Strengthening', date: 'Nov 12', status: 'In Progress', detail: 'Scapular retractions and postural chin tucks with real-time pose tracking.' },
      { phase: 'Phase 4: Functional Postural Resilience', date: 'Nov 24', status: 'Upcoming', detail: 'Full multi-planar upper-body kinetic chain integration and work ergonomic loading.' }
    ]
  }
];

export const availableVideos = [
  ...patientExercises.map((e, idx) => ({
    id: `vid_tele_${idx + 1}`,
    ...e
  })),
  { id: 'vid_1', title: 'Quad Sets (Isometric Activation)', duration: '2:15', thumbnail: 'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?auto=format&fit=crop&w=800&q=80', videoUrl: '/videos/quad-sets.mp4', category: 'Knee & Quad Rehabilitation' },
  { id: 'vid_2', title: 'Straight Leg Raises (SLR)', duration: '2:30', thumbnail: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?auto=format&fit=crop&w=800&q=80', videoUrl: '/videos/straight-leg.mp4', category: 'Knee & Hip Strengthening' },
  { id: 'vid_3', title: "Codman's Pendulum Exercises", duration: '1:45', thumbnail: 'https://images.unsplash.com/photo-1518611012118-696072aa579a?auto=format&fit=crop&w=800&q=80', videoUrl: '/videos/pendulum.mp4', category: 'Shoulder & Rotator Cuff' },
  { id: 'vid_4', title: 'Supine Heel Slides on Mat', duration: '2:00', thumbnail: 'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?auto=format&fit=crop&w=800&q=80', videoUrl: '/videos/heel-slides.mp4', category: 'Post-Op Knee Flexion' },
  { id: 'vid_5', title: 'Seated Knee Extension (Long Arc Quads)', duration: '2:20', thumbnail: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?auto=format&fit=crop&w=800&q=80', videoUrl: '/videos/knee-extension.mp4', category: 'Lower Extremity Rehab' },
  { id: 'vid_6', title: 'Ankle Pumps & Edema Drainage', duration: '1:30', thumbnail: 'https://images.unsplash.com/photo-1518611012118-696072aa579a?auto=format&fit=crop&w=800&q=80', videoUrl: '/videos/ankle-pumps.mp4', category: 'Circulatory & Ankle Recovery' },
  { id: 'vid_7', title: 'Assisted Wall Slides (Shoulder Flexion)', duration: '2:10', thumbnail: 'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?auto=format&fit=crop&w=800&q=80', videoUrl: '/videos/wall-slides.mp4', category: 'Cervical & Scapular Rehab' },
  { id: 'vid_8', title: 'Shoulder External Rotation Drill', duration: '1:50', thumbnail: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?auto=format&fit=crop&w=800&q=80', videoUrl: '/videos/shoulder-rotation.mp4', category: 'Rotator Cuff Stabilization' },
  { id: 'vid_9', title: 'Rehabilitation Shallow Squats', duration: '2:00', thumbnail: 'https://images.unsplash.com/photo-1518611012118-696072aa579a?auto=format&fit=crop&w=800&q=80', videoUrl: '/videos/squat-rehab.mp4', category: 'Functional Joint Stability' },
  { id: 'vid_10', title: 'Seated Knee Flexion & Extension', duration: '1:40', thumbnail: 'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?auto=format&fit=crop&w=800&q=80', videoUrl: '/videos/seated-knee.mp4', category: 'Gentle Mobility' },
  { id: 'vid_12', title: 'Fine Motor Hand & Finger Biomechanics', duration: '1:50', thumbnail: 'https://images.unsplash.com/photo-1583454110551-21f2fa2afe61?auto=format&fit=crop&w=800&q=80', videoUrl: '/videos/wall-slides.mp4', category: 'Hand & Finger Biomechanics' }
];
