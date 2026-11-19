import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const initialPatients = [
  {
    id: 'p1',
    name: 'Shirish Poudel',
    condition: 'Upper Body & Cervical Physical Therapy Rehab',
    adherenceScore: 92,
    consistencyStreak: 14,
    activeVideos: [
      { id: 'ex-cv-001', videoId: 'ex-cv-001', title: 'Seated Active Shoulder Abduction', dateAssigned: '2026-11-16', thumbnail: 'https://img.youtube.com/vi/F_e3U4-Hbr8/hqdefault.jpg', videoUrl: 'https://www.youtube.com/embed/F_e3U4-Hbr8', duration: '2:00', category: 'Shoulder Mobility', target: 'Deltoids, Shoulder Joint', instructions: 'Sit up straight facing the camera. Keep your arms straight and slowly raise both arms out to your sides until they are parallel to the floor, then lower them.', sets: 2, reps: 10, trackingJoints: ['hip', 'shoulder', 'elbow'], cvThresholds: { high: 80, low: 30 } },
      { id: 'ex-cv-002', videoId: 'ex-cv-002', title: 'Seated Elbow Flexion', dateAssigned: '2026-11-17', thumbnail: 'https://img.youtube.com/vi/81kQy9L1W4s/hqdefault.jpg', videoUrl: 'https://www.youtube.com/embed/81kQy9L1W4s', duration: '1:45', category: 'Elbow Mobility', target: 'Biceps, Elbow Joint', instructions: 'Keep your elbows pinned to your ribs. Bend your elbows to bring your hands up toward your shoulders, then extend them fully downward.', sets: 3, reps: 12, trackingJoints: ['shoulder', 'elbow', 'wrist'], cvThresholds: { high: 50, low: 150 }, invertLogic: true },
      { id: 'ex-cv-003', videoId: 'ex-cv-003', title: 'Seated Overhead Reach', dateAssigned: '2026-11-18', thumbnail: 'https://img.youtube.com/vi/v8b9q4Z7X6A/hqdefault.jpg', videoUrl: 'https://www.youtube.com/embed/v8b9q4Z7X6A', duration: '2:00', category: 'Shoulder Range of Motion', target: 'Shoulders, Upper Back', instructions: 'Start with your hands near your shoulders. Press both hands straight up toward the ceiling as high as you comfortably can, then lower them.', sets: 2, reps: 10, trackingJoints: ['shoulder', 'elbow', 'wrist'], cvThresholds: { high: 160, low: 90 } }
    ],
    messages: [
      { id: 'm1', sender: 'doctor', text: 'Hi Shirish, welcome to your upper-body physical therapy program. How are your shoulders and neck feeling today?', timestamp: '09:00 AM' },
      { id: 'm2', sender: 'patient', text: 'Hi Dr. Vance, the neck stiffness is improving, and doing the upper body routines has been helping my posture a lot.', timestamp: '10:15 AM' },
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
    progressData: [
      { day: 'Mon', score: 72, sortOrder: 0 }, { day: 'Tue', score: 78, sortOrder: 1 }, { day: 'Wed', score: 82, sortOrder: 2 },
      { day: 'Thu', score: 85, sortOrder: 3 }, { day: 'Fri', score: 88, sortOrder: 4 }, { day: 'Sat', score: 92, sortOrder: 5 }, { day: 'Sun', score: 88, sortOrder: 6 }
    ]
  }
];

const availableVideos = [
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
  { id: 'ex-cv-001', title: 'Seated Active Shoulder Abduction', duration: '2:00', thumbnail: 'https://img.youtube.com/vi/F_e3U4-Hbr8/hqdefault.jpg', videoUrl: 'https://www.youtube.com/embed/F_e3U4-Hbr8', category: 'Shoulder Mobility' },
  { id: 'ex-cv-002', title: 'Seated Elbow Flexion', duration: '1:45', thumbnail: 'https://img.youtube.com/vi/81kQy9L1W4s/hqdefault.jpg', videoUrl: 'https://www.youtube.com/embed/81kQy9L1W4s', category: 'Elbow Mobility' },
  { id: 'ex-cv-003', title: 'Seated Overhead Reach', duration: '2:00', thumbnail: 'https://img.youtube.com/vi/v8b9q4Z7X6A/hqdefault.jpg', videoUrl: 'https://www.youtube.com/embed/v8b9q4Z7X6A', category: 'Shoulder Range of Motion' },
  { id: 'ex-001', title: 'Shoulder Wall Crawls', duration: '2:00', thumbnail: 'https://img.youtube.com/vi/kuJjYd-rdww/hqdefault.jpg', videoUrl: 'https://www.youtube.com/embed/kuJjYd-rdww', category: 'Range of Motion' },
  { id: 'ex-002', title: 'Shoulder Pendulums', duration: '1:45', thumbnail: 'https://img.youtube.com/vi/5qzbtlX_A4k/hqdefault.jpg', videoUrl: 'https://www.youtube.com/embed/5qzbtlX_A4k', category: 'Joint Mobility' },
  { id: 'ex-003', title: 'Standing Scapular Retractions', duration: '1:30', thumbnail: 'https://img.youtube.com/vi/UHlhyti-RBQ/hqdefault.jpg', videoUrl: 'https://www.youtube.com/embed/UHlhyti-RBQ', category: 'Strengthening' },
  { id: 'ex-004', title: 'Seated Chin Tucks', duration: '1:15', thumbnail: 'https://img.youtube.com/vi/7rnlAVhAK-8/hqdefault.jpg', videoUrl: 'https://www.youtube.com/embed/7rnlAVhAK-8', category: 'Postural Correction' }
];

const initialNotifications = [
  {
    id: 'n1',
    patientId: 'p1',
    patientName: 'Shirish Poudel',
    patientCondition: 'Upper Body & Cervical Physical Therapy Rehab',
    title: 'Exercise Routine Completed',
    message: 'Completed 2 sets of Seated Active Shoulder Abductions with 96% form compliance.',
    time: '12 mins ago',
    type: 'exercise',
    isUnread: true
  },
  {
    id: 'n2',
    patientId: 'p1',
    patientName: 'Shirish Poudel',
    patientCondition: 'Upper Body & Cervical Physical Therapy Rehab',
    title: 'Recovery Milestone Achieved',
    message: 'Shirish reached a 14-day adherence streak under Dr. Alex Vance.',
    time: '45 mins ago',
    type: 'milestone',
    isUnread: true
  },
  {
    id: 'n3',
    patientId: 'p1',
    patientName: 'Shirish Poudel',
    patientCondition: 'ACL Reconstruction & Knee Recovery',
    title: 'Patient Message',
    message: '"Hi Dr. Alex, the swelling is reducing nicely after today\'s heel slides."',
    time: '1 hour ago',
    type: 'message',
    isUnread: false
  }
];

const initialSchedule = [
  { patientId: 'p1', name: 'Shirish Poudel', type: 'Telehealth Evaluation & ROM Check', time: '10:00 AM', status: 'upcoming' }
];

async function seed() {
  console.log('🌱 Starting physical therapy database seed...');

  // Clean existing tables in reverse dependency order
  await prisma.notification.deleteMany();
  await prisma.scheduleItem.deleteMany();
  await prisma.progress.deleteMany();
  await prisma.message.deleteMany();
  await prisma.assignment.deleteMany();
  await prisma.exerciseVideo.deleteMany();
  await prisma.patient.deleteMany();
  await prisma.doctorProfile.deleteMany();

  // 1. Seed Doctor Profile
  await prisma.doctorProfile.create({
    data: {
      id: 'doc-1',
      name: 'Dr. Alex Mercer, PT, DPT',
      title: 'Chief Physical Therapist & Clinic Director',
      avatar: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&w=400&q=80',
      clinic: 'VirtuHeal Orthopedic & Sports Rehabilitation',
      email: 'alex.mercer@virtuheal.clinic',
      phone: '+1 (555) 349-8821',
      license: 'PT-CA-889421',
      specialties: 'Post-Surgical ACL, Total Joint Arthroplasty, Rotator Cuff Rehabilitation, Spinal Mechanics',
      workingHours: 'Monday - Friday: 08:00 AM - 05:30 PM',
      bio: 'Board-certified clinical specialist with over 12 years of sports orthopedic and complex post-operative physical rehabilitation experience.'
    }
  });

  // 2. Seed Real Physiotherapy Exercise Videos
  for (const video of availableVideos) {
    await prisma.exerciseVideo.create({
      data: video
    });
  }
  console.log(`✅ Seeded ${availableVideos.length} genuine physiotherapy videos.`);

  // 3. Seed Patients, Assignments, Messages, and Progress
  for (const patient of initialPatients) {
    const { activeVideos, messages, progressData, ...patientInfo } = patient;
    
    await prisma.patient.create({
      data: {
        ...patientInfo,
        activeVideos: {
          create: activeVideos.map(v => ({
            id: v.id,
            videoId: v.videoId || null,
            title: v.title,
            duration: v.duration,
            thumbnail: v.thumbnail,
            videoUrl: v.videoUrl,
            dateAssigned: v.dateAssigned,
            status: 'active'
          }))
        },
        messages: {
          create: messages.map(m => ({
            id: m.id,
            sender: m.sender,
            text: m.text,
            videoUrl: m.videoUrl || null,
            thumbnail: m.thumbnail || null,
            title: m.title || null,
            timestamp: m.timestamp
          }))
        },
        progressData: {
          create: progressData.map(p => ({
            day: p.day,
            score: p.score,
            sortOrder: p.sortOrder
          }))
        }
      }
    });
  }
  console.log(`✅ Seeded ${initialPatients.length} patients with authentic clinical recovery plans.`);

  // 4. Seed Notifications
  for (const notif of initialNotifications) {
    await prisma.notification.create({
      data: notif
    });
  }
  console.log(`✅ Seeded ${initialNotifications.length} clinical notifications.`);

  // 5. Seed Schedule
  for (const item of initialSchedule) {
    await prisma.scheduleItem.create({
      data: item
    });
  }
  console.log(`✅ Seeded ${initialSchedule.length} schedule items.`);

  console.log('🎉 Physical therapy database seeding completed successfully!');
}

seed()
  .catch((e) => {
    console.error('❌ Seeding error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
