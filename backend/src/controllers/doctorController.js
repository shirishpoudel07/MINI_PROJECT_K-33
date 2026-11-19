import prisma from '../prisma.js';

export const getDoctorProfile = async (req, res) => {
  try {
    let profile = await prisma.doctorProfile.findFirst();
    if (!profile) {
      profile = await prisma.doctorProfile.create({
        data: {
          id: 'doc-1',
          name: 'Dr. Alex Mercer, PT, DPT',
          title: 'Chief Physical Therapist & Clinic Director',
          avatar: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80',
          clinic: 'VirtuHeal Orthopedic & Sports Rehabilitation',
          email: 'alex.mercer@virtuheal.clinic',
          phone: '+1 (555) 349-8821',
          license: 'PT-CA-889421',
          specialties: 'Post-Surgical ACL, Total Joint Arthroplasty, Rotator Cuff Rehabilitation, Spinal Mechanics',
          workingHours: 'Monday - Friday: 08:00 AM - 05:30 PM',
          bio: 'Board-certified clinical specialist with over 12 years of sports orthopedic and complex post-operative physical rehabilitation experience.'
        }
      });
    }
    res.json(profile);
  } catch (error) {
    console.error('Error fetching doctor profile:', error);
    res.status(500).json({ error: 'Failed to fetch doctor profile' });
  }
};

export const updateDoctorProfile = async (req, res) => {
  try {
    let profile = await prisma.doctorProfile.findFirst();
    const data = req.body;

    if (!profile) {
      profile = await prisma.doctorProfile.create({
        data: {
          id: 'doc-1',
          ...data
        }
      });
    } else {
      profile = await prisma.doctorProfile.update({
        where: { id: profile.id },
        data
      });
    }

    res.json(profile);
  } catch (error) {
    console.error('Error updating doctor profile:', error);
    res.status(500).json({ error: 'Failed to update doctor profile' });
  }
};

