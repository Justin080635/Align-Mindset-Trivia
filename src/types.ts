export type PersonalityType =
  | 'Nova'
  | 'Dr. Thaddeus'
  | 'Aria'
  | 'Cipher-9'
  | 'Coach Marcus';

export type LeagueTier =
  | 'Bronze'
  | 'Silver'
  | 'Gold'
  | 'Platinum'
  | 'Diamond'
  | 'Mindset Master';

export type GameDifficulty =
  | 'Rookie'
  | 'Pro'
  | 'Expert'
  | 'Legend'
  | 'Novice'
  | 'Adept'
  | 'Master'
  | 'Grandmaster';

export type GameMode = 'standard' | 'blitz' | 'survival' | 'mindset_reflection';

export interface GroundingCitation {
  title: string;
  uri: string;
}

export interface Question {
  id: string;
  category: string;
  difficulty: GameDifficulty;
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
  mindsetInsight: string;
  citations?: GroundingCitation[];
}

export interface HostPersona {
  id: PersonalityType;
  name: string;
  tagLine: string;
  archetype: string;
  avatar: string;
  avatarBg: string;
  voiceName: string;
  accentColor: string;
  badgeColor: string;
  bio: string;
  sampleQuote: string;
  traits: string[];
}

export interface Badge {
  id: string;
  title: string;
  description: string;
  iconName: string;
  category: 'mindset' | 'streak' | 'voice' | 'social' | 'mastery';
  rarity: 'Common' | 'Rare' | 'Epic' | 'Legendary';
  unlockedAt?: string;
  progress: number;
  maxProgress: number;
  perk?: string;
}

export interface MatchRecord {
  id: string;
  timestamp: string; // User readable: "Today, 10:15 AM" or "Aug 26, 4:20 PM"
  isoDate?: string; // ISO 8601 string for precise chronological sorting
  category: string;
  score: number;
  correctAnswers: number;
  totalQuestions: number;
  accuracy: number;
  personality: PersonalityType;
  mode: GameMode;
  xpEarned: number;
  leaguePointsDelta: number;
  durationSeconds?: number; // Actual match playtime in seconds
}

export interface DailyPlayRecord {
  date: string; // "YYYY-MM-DD"
  dayLabel: string; // "Today", "Yesterday", "Wed", "Tue", etc.
  formattedDate: string; // "Aug 27, 2026"
  matchesCount: number;
  minutesPlayed: number;
  questionsAnswered: number;
  questionsCorrect: number;
  accuracy: number;
  pointsEarned: number;
  lastActiveTime: string;
  isActive: boolean;
}

export interface CategoryStat {
  category: string;
  matchesPlayed: number;
  questionsAnswered: number;
  questionsCorrect: number;
  accuracy: number;
  bestScore: number;
  icon?: string;
}

export interface AccessibilitySettings {
  highContrast: boolean;
  reducedMotion: boolean;
  autoSpeakQuestions: boolean;
  largeText: boolean;
  screenReaderOptimized: boolean;
}

export interface PlayerProfile {
  id: string;
  username: string;
  handle: string;
  avatarUrl: string;
  bannerGradient: string;
  bio: string;
  mindsetMantra: string;
  leagueTier: LeagueTier;
  rankPoints: number;
  globalRank: number;
  totalGames: number;
  accuracyRate: number;
  highestStreak: number;
  currentStreakDays: number;
  showcaseBadgeIds: string[];
  unlockedBadgeIds: string[];
  history: MatchRecord[];
  soundEnabled: boolean;
  voiceEnabled: boolean;
  hapticsEnabled?: boolean;
  narrationSpeed: number; // 0.8 to 1.3
  theme: 'dark' | 'light';
  accessibility: AccessibilitySettings;
  googleConnected?: boolean;
  googleEmail?: string;
  googleName?: string;
  googlePhotoUrl?: string;
  
  // Real dynamic user daily tracking and playtime details
  memberSince?: string;
  lastActiveDate?: string;
  todayPlayTimeMinutes?: number;
  weeklyPlayTimeMinutes?: number;
  totalPlayTimeMinutes?: number;
  dailyHistory?: DailyPlayRecord[];
}

export interface LeaderboardEntry {
  rank: number;
  username: string;
  handle: string;
  avatarUrl: string;
  tier: LeagueTier;
  score: number;
  peakStreak: number;
  accuracy: number;
  isCurrentUser?: boolean;
  trend: 'up' | 'down' | 'same';
  badgesCount: number;
  isBenchmarkBoss?: boolean;
  bossTitle?: string;
}

export interface CommunityGoal {
  id: string;
  title: string;
  description: string;
  targetPoints: number;
  currentPoints: number;
  deadline: string;
  participantsCount: number;
  rewardBadgeId: string;
  rewardBadgeName: string;
  rewardXp: number;
  unlocked: boolean;
}

export interface DiscussionReply {
  id: string;
  authorName: string;
  authorHandle: string;
  authorAvatar: string;
  timestamp: string;
  content: string;
}

export interface DiscussionPost {
  id: string;
  authorName: string;
  authorHandle: string;
  authorAvatar: string;
  authorTier: LeagueTier;
  timestamp: string;
  content: string;
  upvotes: number;
  hasUpvoted: boolean;
  repliesCount: number;
  isHostSynthesis?: boolean;
  tags: string[];
  replies?: DiscussionReply[];
}

export type TabType = 'play' | 'ranks' | 'social' | 'profile' | 'leaderboard' | 'achievements' | 'multiplayer';

export interface RoomPlayer {
  id: string;
  username: string;
  handle: string;
  avatarUrl: string;
  isHost: boolean;
  isReady: boolean;
  isBot?: boolean;
  score: number;
  streak: number;
  lastAnswerIndex: number | null;
  lastAnswerCorrect: boolean | null;
  lastAnswerTimeMs: number;
  reactionSpeedLabel?: string;
  isFinished: boolean;
}

export interface MultiplayerRoom {
  id: string;
  code: string;
  name: string;
  mode: 'duel' | 'party';
  maxPlayers: number;
  category: string;
  difficulty: GameDifficulty;
  hostPersona: PersonalityType;
  questionCount: number;
  status: 'lobby' | 'countdown' | 'in_progress' | 'podium';
  currentQuestionIndex: number;
  players: RoomPlayer[];
  questions: Question[];
  createdAt: string;
}

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  timestamp: string;
  type: 'challenge' | 'league' | 'achievement' | 'discussion' | 'streak';
  isRead: boolean;
  targetTab?: TabType;
}
