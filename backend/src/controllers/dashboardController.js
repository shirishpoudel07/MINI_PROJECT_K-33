import prisma from '../prisma.js';

export const getDashboardSummary = async (req, res) => {
  try {
    const patients = await prisma.patient.findMany({
      include: {
        activeVideos: true,
        messages: true
      }
    });

    const totalPatients = patients.length;
    const avgAdherence = totalPatients > 0
      ? Math.round(patients.reduce((sum, p) => sum + p.adherenceScore, 0) / totalPatients)
      : 0;

    const highRiskPatients = patients.filter(p => p.adherenceScore < 60);

    const schedule = await prisma.scheduleItem.findMany({
      orderBy: { id: 'asc' }
    });

    const notifications = await prisma.notification.findMany({
      orderBy: { createdAt: 'desc' },
      take: 5
    });

    // Recent activity feed combining recent assignments and messages
    const recentAssignments = await prisma.assignment.findMany({
      take: 4,
      orderBy: { createdAt: 'desc' },
      include: { patient: true }
    });

    const activityFeed = recentAssignments.map((a, idx) => ({
      id: a.id || idx,
      text: `${a.patient?.name || 'Patient'} was prescribed "${a.title}"`,
      time: 'Recently',
      type: 'exercise'
    }));

    res.json({
      metrics: {
        activePatients: totalPatients,
        averageAdherence: avgAdherence,
        highRiskCount: highRiskPatients.length,
        completionRate: '92.4%'
      },
      needsAttention: notifications.map(n => ({
        id: n.patientId || n.id,
        name: n.patientName || 'Patient',
        reason: n.title,
        time: n.time,
        type: n.type
      })),
      todaySchedule: schedule,
      activityFeed
    });
  } catch (error) {
    console.error('Error fetching dashboard summary:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard summary' });
  }
};

export const getAnalyticsData = async (req, res) => {
  try {
    const patients = await prisma.patient.findMany({
      include: {
        progressData: {
          orderBy: { sortOrder: 'asc' }
        }
      }
    });

    const total = patients.length;
    const highAdherence = patients.filter(p => p.adherenceScore >= 80).length;
    const mediumAdherence = patients.filter(p => p.adherenceScore >= 60 && p.adherenceScore < 80).length;
    const lowAdherence = patients.filter(p => p.adherenceScore < 60).length;

    // Aggregate progress data by day (Mon..Sun)
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const weeklyAverages = days.map(day => {
      let daySum = 0;
      let count = 0;
      for (const p of patients) {
        const item = p.progressData.find(d => d.day === day);
        if (item) {
          daySum += item.score;
          count++;
        }
      }
      return {
        day,
        score: count > 0 ? Math.round(daySum / count) : 0
      };
    });

    // Condition breakdown
    const conditionsMap = {};
    for (const p of patients) {
      conditionsMap[p.condition] = (conditionsMap[p.condition] || 0) + 1;
    }
    const conditionBreakdown = Object.entries(conditionsMap).map(([condition, count]) => ({
      condition,
      count
    }));

    res.json({
      summary: {
        totalPatients: total,
        highAdherence,
        mediumAdherence,
        lowAdherence
      },
      weeklyTrend: weeklyAverages,
      conditionBreakdown
    });
  } catch (error) {
    console.error('Error fetching analytics data:', error);
    res.status(500).json({ error: 'Failed to fetch analytics' });
  }
};

