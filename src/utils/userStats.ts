import { MatchRecord, DailyPlayRecord, CategoryStat, PlayerProfile } from '../types';

/**
 * Format a Date object into human-friendly relative time:
 * "Today, 10:15 AM", "Yesterday, 4:20 PM", or "Aug 25, 6:30 PM"
 */
export function formatFriendlyMatchTime(date: Date = new Date()): string {
  const now = new Date();
  const isToday =
    date.getDate() === now.getDate() &&
    date.getMonth() === now.getMonth() &&
    date.getFullYear() === now.getFullYear();

  const yesterday = new Date();
  yesterday.setDate(now.getDate() - 1);
  const isYesterday =
    date.getDate() === yesterday.getDate() &&
    date.getMonth() === yesterday.getMonth() &&
    date.getFullYear() === yesterday.getFullYear();

  const timeStr = date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  });

  if (isToday) {
    return `Today, ${timeStr}`;
  }
  if (isYesterday) {
    return `Yesterday, ${timeStr}`;
  }

  const dateStr = date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric'
  });
  return `${dateStr}, ${timeStr}`;
}

/**
 * Format ISO date string YYYY-MM-DD
 */
export function getISODateKey(date: Date = new Date()): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/**
 * Generate realistic, time-anchored initial match history for the contestant
 */
export function generateRealisticInitialHistory(): MatchRecord[] {
  const now = new Date();

  // Match 1: Today morning (approx 1 hour ago)
  const t1 = new Date(now.getTime() - 45 * 60 * 1000);
  // Match 2: Today earlier
  const t2 = new Date(now.getTime() - 3.5 * 3600 * 1000);
  // Match 3: Yesterday evening
  const t3 = new Date(now.getTime() - 22 * 3600 * 1000);
  // Match 4: 2 days ago
  const t4 = new Date(now.getTime() - 48 * 3600 * 1000);
  // Match 5: 3 days ago
  const t5 = new Date(now.getTime() - 74 * 3600 * 1000);
  // Match 6: 4 days ago
  const t6 = new Date(now.getTime() - 98 * 3600 * 1000);
  // Match 7: 5 days ago
  const t7 = new Date(now.getTime() - 122 * 3600 * 1000);

  return [
    {
      id: `m-${t1.getTime()}`,
      timestamp: formatFriendlyMatchTime(t1),
      isoDate: t1.toISOString(),
      category: 'Growth Mindset & Brain Hacks',
      score: 2150,
      correctAnswers: 6,
      totalQuestions: 6,
      accuracy: 100,
      personality: 'Nova',
      mode: 'standard',
      xpEarned: 380,
      leaguePointsDelta: 45,
      durationSeconds: 145
    },
    {
      id: `m-${t2.getTime()}`,
      timestamp: formatFriendlyMatchTime(t2),
      isoDate: t2.toISOString(),
      category: 'Neuroscience & Deep Focus',
      score: 1820,
      correctAnswers: 5,
      totalQuestions: 6,
      accuracy: 83,
      personality: 'Dr. Thaddeus',
      mode: 'blitz',
      xpEarned: 310,
      leaguePointsDelta: 35,
      durationSeconds: 95
    },
    {
      id: `m-${t3.getTime()}`,
      timestamp: formatFriendlyMatchTime(t3),
      isoDate: t3.toISOString(),
      category: 'Tech, AI & Future Trends',
      score: 2400,
      correctAnswers: 6,
      totalQuestions: 6,
      accuracy: 100,
      personality: 'Cipher-9',
      mode: 'standard',
      xpEarned: 420,
      leaguePointsDelta: 50,
      durationSeconds: 160
    },
    {
      id: `m-${t4.getTime()}`,
      timestamp: formatFriendlyMatchTime(t4),
      isoDate: t4.toISOString(),
      category: 'Stoic Mindset & Life Lessons',
      score: 1650,
      correctAnswers: 5,
      totalQuestions: 6,
      accuracy: 83,
      personality: 'Aria',
      mode: 'mindset_reflection',
      xpEarned: 280,
      leaguePointsDelta: 30,
      durationSeconds: 210
    },
    {
      id: `m-${t5.getTime()}`,
      timestamp: formatFriendlyMatchTime(t5),
      isoDate: t5.toISOString(),
      category: 'Atomic Habits & Daily Routines',
      score: 1950,
      correctAnswers: 6,
      totalQuestions: 6,
      accuracy: 100,
      personality: 'Coach Marcus',
      mode: 'standard',
      xpEarned: 340,
      leaguePointsDelta: 40,
      durationSeconds: 130
    },
    {
      id: `m-${t6.getTime()}`,
      timestamp: formatFriendlyMatchTime(t6),
      isoDate: t6.toISOString(),
      category: 'Pop Culture & Entertainment',
      score: 1720,
      correctAnswers: 5,
      totalQuestions: 6,
      accuracy: 83,
      personality: 'Nova',
      mode: 'standard',
      xpEarned: 290,
      leaguePointsDelta: 30,
      durationSeconds: 120
    },
    {
      id: `m-${t7.getTime()}`,
      timestamp: formatFriendlyMatchTime(t7),
      isoDate: t7.toISOString(),
      category: 'Science, Nature & Space',
      score: 2050,
      correctAnswers: 6,
      totalQuestions: 6,
      accuracy: 100,
      personality: 'Dr. Thaddeus',
      mode: 'blitz',
      xpEarned: 360,
      leaguePointsDelta: 45,
      durationSeconds: 110
    }
  ];
}

/**
 * Computes complete dynamic statistics, daily activity calendar, category mastery,
 * and exact accuracy from the user's actual match history
 */
export function computeProfileStats(profile: PlayerProfile) {
  const history = Array.isArray(profile.history) ? profile.history : [];
  const now = new Date();
  const todayKey = getISODateKey(now);

  let totalQuestionsAnswered = 0;
  let totalQuestionsCorrect = 0;
  let totalMinutesPlayed = 0;
  let todayMinutes = 0;
  let todayMatches = 0;
  let todayCorrect = 0;
  let todayQuestions = 0;
  let todayPoints = 0;
  let weeklyMinutes = 0;
  let weeklyMatches = 0;

  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(now.getDate() - 6);
  sevenDaysAgo.setHours(0, 0, 0, 0);

  // Category tracking map
  const categoryMap = new Map<
    string,
    { matches: number; questions: number; correct: number; bestScore: number }
  >();

  // Daily map for the last 7 calendar days
  const dailyRecordsMap = new Map<string, DailyPlayRecord>();

  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(now.getDate() - i);
    const key = getISODateKey(d);
    const dayLabel =
      i === 0
        ? 'Today'
        : i === 1
        ? 'Yesterday'
        : d.toLocaleDateString('en-US', { weekday: 'short' });
    const formattedDate = d.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    });

    dailyRecordsMap.set(key, {
      date: key,
      dayLabel,
      formattedDate,
      matchesCount: 0,
      minutesPlayed: 0,
      questionsAnswered: 0,
      questionsCorrect: 0,
      accuracy: 0,
      pointsEarned: 0,
      lastActiveTime: '--',
      isActive: false
    });
  }

  // Iterate over all matches
  history.forEach(m => {
    const qCount = m.totalQuestions || 6;
    const cCount = typeof m.correctAnswers === 'number' ? m.correctAnswers : Math.round((m.accuracy / 100) * qCount);
    const durSeconds = m.durationSeconds || 135; // Default ~2.25 mins if not tracked
    const durMins = Math.round((durSeconds / 60) * 10) / 10;

    totalQuestionsAnswered += qCount;
    totalQuestionsCorrect += cCount;
    totalMinutesPlayed += durMins;

    // Parse match date
    let matchDate: Date;
    if (m.isoDate) {
      matchDate = new Date(m.isoDate);
    } else {
      // Fallback rough estimate
      matchDate = new Date();
    }
    const matchKey = getISODateKey(matchDate);

    // Check if match was today
    const isMatchToday = matchKey === todayKey || m.timestamp.includes('Today');
    if (isMatchToday) {
      todayMatches += 1;
      todayMinutes += durMins;
      todayCorrect += cCount;
      todayQuestions += qCount;
      todayPoints += m.score || 0;
    }

    // Check if within 7 days
    if (matchDate >= sevenDaysAgo || m.timestamp.includes('Today') || m.timestamp.includes('Yesterday')) {
      weeklyMinutes += durMins;
      weeklyMatches += 1;
    }

    // Update 7-day daily map
    if (dailyRecordsMap.has(matchKey)) {
      const rec = dailyRecordsMap.get(matchKey)!;
      rec.matchesCount += 1;
      rec.minutesPlayed = Math.round((rec.minutesPlayed + durMins) * 10) / 10;
      rec.questionsAnswered += qCount;
      rec.questionsCorrect += cCount;
      rec.pointsEarned += m.score || 0;
      rec.accuracy =
        rec.questionsAnswered > 0
          ? Math.round((rec.questionsCorrect / rec.questionsAnswered) * 100)
          : 0;
      rec.isActive = true;
      rec.lastActiveTime = m.timestamp.split(', ')[1] || 'Active';
    }

    // Category aggregation
    const cat = m.category || 'General Mindset';
    if (!categoryMap.has(cat)) {
      categoryMap.set(cat, {
        matches: 0,
        questions: 0,
        correct: 0,
        bestScore: 0
      });
    }
    const cStat = categoryMap.get(cat)!;
    cStat.matches += 1;
    cStat.questions += qCount;
    cStat.correct += cCount;
    cStat.bestScore = Math.max(cStat.bestScore, m.score || 0);
  });

  // Calculate true career accuracy
  const overallAccuracy =
    totalQuestionsAnswered > 0
      ? Math.round((totalQuestionsCorrect / totalQuestionsAnswered) * 1000) / 10
      : profile.accuracyRate || 91.5;

  const todayAccuracy =
    todayQuestions > 0
      ? Math.round((todayCorrect / todayQuestions) * 1000) / 10
      : overallAccuracy;

  // Convert categories map to sorted array
  const categoryStats: CategoryStat[] = Array.from(categoryMap.entries()).map(
    ([category, data]) => ({
      category,
      matchesPlayed: data.matches,
      questionsAnswered: data.questions,
      questionsCorrect: data.correct,
      accuracy:
        data.questions > 0
          ? Math.round((data.correct / data.questions) * 100)
          : 90,
      bestScore: data.bestScore
    })
  );

  // Sort categories by highest match count & accuracy
  categoryStats.sort((a, b) => b.matchesPlayed - a.matchesPlayed || b.accuracy - a.accuracy);

  // 7-day daily activity array
  const dailyHistory = Array.from(dailyRecordsMap.values());
  const activeDaysThisWeek = dailyHistory.filter(d => d.isActive).length;

  return {
    totalGames: Math.max(profile.totalGames || 0, history.length),
    totalQuestionsAnswered,
    totalQuestionsCorrect,
    overallAccuracy,
    todayMinutes: Math.round(todayMinutes),
    todayMatches,
    todayQuestions,
    todayAccuracy,
    todayPoints,
    weeklyMinutes: Math.round(weeklyMinutes),
    weeklyMatches,
    activeDaysThisWeek,
    totalMinutesPlayed: Math.round(totalMinutesPlayed),
    categoryStats,
    dailyHistory
  };
}

/**
 * Computes consecutive active streak days based on user's real daily activity
 */
export function computeConsecutiveStreakDays(history: MatchRecord[]): number {
  if (!history || history.length === 0) return 1;

  const datesWithActivity = new Set<string>();
  const now = new Date();

  history.forEach(m => {
    if (m.isoDate) {
      datesWithActivity.add(getISODateKey(new Date(m.isoDate)));
    } else if (m.timestamp.includes('Today')) {
      datesWithActivity.add(getISODateKey(now));
    } else if (m.timestamp.includes('Yesterday')) {
      const y = new Date();
      y.setDate(now.getDate() - 1);
      datesWithActivity.add(getISODateKey(y));
    }
  });

  let streak = 0;
  const checkDate = new Date();

  // If active today, start checking from today; if not active today, check from yesterday
  const todayKey = getISODateKey(checkDate);
  if (!datesWithActivity.has(todayKey)) {
    checkDate.setDate(checkDate.getDate() - 1);
  }

  while (datesWithActivity.has(getISODateKey(checkDate))) {
    streak += 1;
    checkDate.setDate(checkDate.getDate() - 1);
  }

  return Math.max(streak, 1);
}
