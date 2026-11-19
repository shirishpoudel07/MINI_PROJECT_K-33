export const initialVerifiedDoctors = [
  {
    id: 'doc_1',
    name: 'Dr. Alex Vance, PT, DPT, PhD',
    shortName: 'Dr. Alex Vance',
    title: 'Chief of Physical Rehabilitation & Orthopedic Biomechanics',
    department: 'Department of Sports Medicine & Restorative Kinetics',
    clinic: 'VirtuHeal Center for Advanced Human Performance',
    location: 'New York, NY',
    email: 'dr.vance@virtuheal.med',
    phone: '+1 (555) 382-9012',
    license: 'NY-PT-049821',
    npi: '1982736450',
    status: 'Active • Board Certified Specialist',
    avatar: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80',
    pin: '1234',
    specialties: [
      'ACL & Complex Ligament Reconstruction',
      'Rotator Cuff & Shoulder Arthroscopy Rehab',
      'Spine Biomechanics & Lumbar Stabilization',
      'Total Knee & Hip Arthroplasty Post-Op Care'
    ],
    stats: [
      { label: 'Clinical Practice', value: '15+ Yrs' },
      { label: 'Patients Recovered', value: '4,500+' },
      { label: 'Peer-Reviewed Papers', value: '48 Pubs' },
      { label: 'Citations Index', value: '2,340' }
    ],
    degrees: [
      {
        degree: 'Doctor of Physical Therapy (DPT)',
        institution: 'Harvard Medical School / MGH Institute of Health Professions',
        year: '2011',
        honors: 'Summa Cum Laude • Valedictorian',
        description: 'Specialized in advanced neuromuscular facilitation, post-operative arthroplasty protocols, and kinetic chain rehabilitation.'
      },
      {
        degree: 'PhD in Biomechanical Engineering & Rehabilitation Science',
        institution: 'Columbia University (in collaboration with MIT Media Lab)',
        year: '2015',
        honors: 'Doctoral Excellence Fellowship Award',
        description: "Doctoral dissertation: 'Multi-Planar Kinematic Assessment of ACL Graft Integrity During Dynamic High-Velocity Deceleration'."
      },
      {
        degree: 'Bachelor of Science in Kinesiology & Exercise Physiology',
        institution: 'Johns Hopkins University',
        year: '2007',
        honors: "Dean's List of Academic Distinction",
        description: 'Pre-clinical foundation in skeletal muscle mechanics, joint arthrokinematics, and clinical cardiopulmonary stress testing.'
      }
    ],
    certifications: [
      { name: 'Board Certified Orthopaedic Clinical Specialist (OCS)', issuer: 'American Board of Physical Therapy Specialties', year: '2013 - Present' },
      { name: 'Fellow of the American Academy of Orthopaedic Manual Physical Therapists (FAAOMPT)', issuer: 'AAOMPT', year: '2016' },
      { name: 'Certified Strength and Conditioning Specialist (CSCS)', issuer: 'NSCA', year: '2008 - Present' },
      { name: 'Dry Needling & Advanced Joint Manipulation Certified', issuer: 'KinetaCore Physical Therapy', year: '2017' }
    ],
    research: [
      {
        title: 'Kinematic Modeling of Multi-Planar Joint Stress in Accelerated ACL Rehabilitation Protocols',
        journal: 'Journal of Orthopaedic & Sports Physical Therapy (JOSPT)',
        year: '2024',
        doi: '10.1016/j.jospt.2024.08.112',
        type: 'Lead Author • Randomized Clinical Trial',
        summary: 'Demonstrated a 34% reduction in graft reinjury rates through patient-specific biomechanical curve monitoring and closed-chain loading.'
      },
      {
        title: 'Neuromuscular Recalibration Patterns Following Arthroscopic Rotator Cuff Repair: A 24-Month Cohort',
        journal: 'American Journal of Sports Medicine (AJSM)',
        year: '2023',
        doi: '10.1177/0363546523118944',
        type: 'Co-Investigator • Multicenter Cohort Study',
        summary: 'Identified compensatory scapular dyskinesis biomarkers in early post-op phases using high-framerate motion capture analysis.'
      },
      {
        title: 'Efficacy of AI-Assisted Remote Range of Motion Feedback in Post-Total Knee Arthroplasty Recovery',
        journal: 'The Lancet Digital Health',
        year: '2022',
        doi: '10.1016/S2589-7500(22)00142-X',
        type: 'Principal Investigator • NIH Grant #R01-HD0921',
        summary: 'First clinical trial evaluating tele-rehabilitation computer vision algorithms against gold-standard goniometric clinical measurements.'
      }
    ]
  },
  {
    id: 'doc_2',
    name: 'Dr. Sarah Lin, MD',
    shortName: 'Dr. Sarah Lin',
    title: 'Orthopedic Surgeon & Sports Medicine Director',
    department: 'Department of Orthopedic Surgery & Joint Preservation',
    clinic: 'Metropolitan Orthopedic Institute',
    location: 'Boston, MA',
    email: 'dr.lin@metropolitanortho.med',
    phone: '+1 (555) 492-1044',
    license: 'MA-MD-088192',
    npi: '1472839102',
    status: 'Active • Board Certified Orthopedic Surgeon',
    avatar: 'https://images.unsplash.com/photo-1594824813511-6677f547c87c?auto=format&fit=crop&w=800&q=80',
    pin: '1234',
    specialties: [
      'Total Knee & Hip Replacement (Robotic-Assisted)',
      'Complex ACL & Multi-Ligament Knee Reconstruction',
      'Articular Cartilage Restoration & Meniscal Allografting',
      'Arthroscopic Shoulder Stabilization & Rotator Cuff Repair'
    ],
    stats: [
      { label: 'Surgical Practice', value: '16+ Yrs' },
      { label: 'Joint Surgeries', value: '3,800+' },
      { label: 'Peer-Reviewed Papers', value: '42 Pubs' },
      { label: 'Citations Index', value: '1,980' }
    ],
    degrees: [
      {
        degree: 'Doctor of Medicine (MD)',
        institution: 'Harvard Medical School',
        year: '2010',
        honors: 'Magna Cum Laude • Alpha Omega Alpha (AOA) Honor Medical Society',
        description: 'Comprehensive medical doctorate specializing in musculoskeletal pathology, surgical anatomy, and translational joint preservation.'
      },
      {
        degree: 'Orthopedic Surgery Residency',
        institution: 'Massachusetts General Hospital / Harvard Combined Orthopaedic Residency',
        year: '2015',
        honors: 'Chief Resident of Orthopaedic Surgery',
        description: 'Intensive operative residency training covering complex intra-articular trauma, joint replacement, and sports medicine surgery.'
      },
      {
        degree: 'Fellowship in Sports Medicine & Arthroscopic Surgery',
        institution: 'Hospital for Special Surgery (HSS), New York',
        year: '2016',
        honors: 'Clinical Surgical Fellow of the Year',
        description: 'Advanced subspecialty fellowship focused on open and arthroscopic reconstruction of high-demand athletic joints.'
      },
      {
        degree: 'Bachelor of Science in Cellular & Molecular Biology',
        institution: 'Yale University',
        year: '2006',
        honors: 'Summa Cum Laude • Phi Beta Kappa',
        description: 'Pre-medical training with an emphasis on connective tissue biology, cellular regeneration, and cartilage extracellular matrix.'
      }
    ],
    certifications: [
      { name: 'Diplomate, American Board of Orthopaedic Surgery (ABOS)', issuer: 'American Board of Orthopaedic Surgery', year: '2017 - Present' },
      { name: 'Fellow of the American Academy of Orthopaedic Surgeons (FAAOS)', issuer: 'AAOS', year: '2018' },
      { name: 'Subspecialty Certificate in Orthopaedic Sports Medicine', issuer: 'ABOS / AOSSM', year: '2019 - Present' },
      { name: 'Certified Robotic-Assisted Arthroplasty Specialist (Mako System)', issuer: 'Stryker Orthopaedics', year: '2018' },
      { name: 'Advanced Arthroscopic Joint Reconstruction Certified', issuer: 'Arthroscopy Association of North America (AANA)', year: '2016' }
    ],
    research: [
      {
        title: 'Ten-Year Comparative Outcomes of Bone-Patellar Tendon-Bone vs Quadriceps Tendon Autografts in Revision ACL Reconstruction',
        journal: 'American Journal of Sports Medicine (AJSM)',
        year: '2024',
        doi: '10.1177/0363546524128911',
        type: 'Lead Investigator • Prospective Multicenter Cohort',
        summary: 'Demonstrated superior rotational joint stability and significantly lower reinjury incidence using quadriceps tendon autografts in young athletes.'
      },
      {
        title: 'Biological Augmentation in Cartilage Restoration and Meniscal Repair: A Randomized Clinical Evaluation',
        journal: 'Journal of Bone & Joint Surgery (JBJS)',
        year: '2023',
        doi: '10.2106/JBJS.23.00412',
        type: 'Senior Author • Randomized Controlled Trial',
        summary: 'Demonstrated marked acceleration in chondrocyte integration and reduced post-op joint effusion with biologic scaffolds.'
      },
      {
        title: 'Computer-Navigated Minimally Invasive Total Knee Arthroplasty: Precision Alignment and Functional Kinematics',
        journal: 'The Bone & Joint Journal',
        year: '2022',
        doi: '10.1302/0301-620X.104B.BJJ-2022-0198',
        type: 'Co-Principal Investigator • Multicenter Clinical Trial',
        summary: 'Evaluated coronal alignment precision and accelerated recovery kinetics across 450 consecutive joint replacement patients.'
      }
    ]
  },
  {
    id: 'doc_3',
    name: 'Dr. David Miller, PT, OCS',
    shortName: 'Dr. David Miller',
    title: 'Senior Clinical Physical Therapist & Spine Specialist',
    department: 'Spine & Neuro-Muscular Rehabilitation',
    clinic: 'Spine & Joint Physical Therapy Group',
    location: 'Chicago, IL',
    email: 'dr.miller@spinejointpt.com',
    phone: '+1 (555) 612-8820',
    license: 'IL-PT-031940',
    npi: '1839201948',
    status: 'Active • Board Certified Specialist',
    avatar: 'https://images.unsplash.com/photo-1537368910025-700350fe46c7?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80',
    pin: '1234',
    specialties: [
      'Lumbar Stabilization & Disc Herniation Rehab',
      'Cervical Radiculopathy & Posture Correction',
      'Post-Op Spinal Fusion & Laminectomy Recovery',
      'Advanced Manual Mobilization & Ergonomic Optimization'
    ],
    stats: [
      { label: 'Clinical Practice', value: '18+ Yrs' },
      { label: 'Patients Treated', value: '5,200+' },
      { label: 'Clinical Protocols', value: '35 Guides' },
      { label: 'Patient Rating', value: '4.98 / 5.0' }
    ],
    degrees: [
      {
        degree: 'Doctor of Physical Therapy (DPT)',
        institution: 'Northwestern University Feinberg School of Medicine',
        year: '2008',
        honors: 'Distinguished Clinical Scholar Award',
        description: 'Advanced focus on spinal kinematics, central sensitization management, and progressive motor control restoration.'
      },
      {
        degree: 'Bachelor of Science in Physical Therapy',
        institution: 'University of Illinois at Urbana-Champaign',
        year: '2004',
        honors: 'Honors Scholar in Applied Health Sciences',
        description: 'Comprehensive study of human movement science, neuroanatomy, and functional rehabilitation.'
      }
    ],
    certifications: [
      { name: 'Board Certified Orthopaedic Clinical Specialist (OCS)', issuer: 'ABPTS', year: '2010 - Present' },
      { name: 'Certified McKenzie Mechanical Diagnosis & Therapy (Cert. MDT)', issuer: 'The McKenzie Institute USA', year: '2012' },
      { name: 'Certified Spinal Manual Therapist (CSMT)', issuer: 'International Spine & Pain Institute', year: '2015' }
    ],
    research: [
      {
        title: 'Directional Preference and Motor Control Exercises in Non-Specific Chronic Low Back Pain',
        journal: 'Physical Therapy Journal (PTJ)',
        year: '2023',
        doi: '10.1093/ptj/pzad084',
        type: 'Lead Clinical Author',
        summary: 'Showed significant functional recovery and reduction in narcotic usage with patient-specific mechanical direction therapy.'
      }
    ]
  }
];
