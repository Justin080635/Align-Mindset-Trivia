import { HostPersona, Badge, PlayerProfile, LeaderboardEntry, CommunityGoal, DiscussionPost, NotificationItem } from '../types';
import { generateRealisticInitialHistory } from '../utils/userStats';

export const HOST_PERSONAS: Record<string, HostPersona> = {
  Nova: {
    id: 'Nova',
    name: 'Nova',
    tagLine: 'The Ultimate Hype Host',
    archetype: 'Hype Machine',
    avatar: '⚡',
    avatarBg: 'from-amber-500 to-orange-600',
    voiceName: 'Puck',
    accentColor: 'amber',
    badgeColor: 'bg-amber-500/10 text-amber-500 border-amber-500/30',
    bio: 'Super energetic and pure hype! Nova turns every trivia question into a stadium celebration and cheers loud for your winning streaks.',
    sampleQuote: "Lock in your answer, let's get this dub and light up the leaderboard!",
    traits: ['High Energy', 'Crowd Hype', 'Celebration', 'Fast Paced']
  },
  'Dr. Thaddeus': {
    id: 'Dr. Thaddeus',
    name: 'Dr. Thaddeus',
    tagLine: 'The Sarcastic Professor',
    archetype: 'Witty Academic',
    avatar: '🧐',
    avatarBg: 'from-indigo-600 to-violet-800',
    voiceName: 'Fenrir',
    accentColor: 'indigo',
    badgeColor: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/30',
    bio: 'Hilariously sarcastic with top-tier dry humor. He drops clever roasts when you miss, and gives you elite props when you nail hard questions.',
    sampleQuote: "A bold hypothesis. Let us see if facts agree with you, genius.",
    traits: ['Dry Wit', 'Playful Roasts', 'Elite Props', 'Sharp Mind']
  },
  Aria: {
    id: 'Aria',
    name: 'Aria',
    tagLine: 'The Chill Mindset Guru',
    archetype: 'Zen Coach',
    avatar: '🌸',
    avatarBg: 'from-emerald-500 to-teal-700',
    voiceName: 'Kore',
    accentColor: 'emerald',
    badgeColor: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
    bio: 'Calm, uplifting, and all about growth mindset. Aria reminds you that every wrong answer is just a quick lesson on the way to leveling up.',
    sampleQuote: "Take a deep breath. Win or learn—every question makes your brain sharper.",
    traits: ['Growth Mindset', 'Chill Vibes', 'Encouraging', 'Deep Insights']
  },
  'Cipher-9': {
    id: 'Cipher-9',
    name: 'Cipher-9',
    tagLine: 'The Rogue Cyber AI',
    archetype: 'Matrix Hacker',
    avatar: '🤖',
    avatarBg: 'from-cyan-500 to-blue-700',
    voiceName: 'Zephyr',
    accentColor: 'cyan',
    badgeColor: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30',
    bio: 'Futuristic AI bot that measures your reaction time in milliseconds and glitches with hype when you hit big multiplier combos.',
    sampleQuote: "CPU overclocked. Let's see how fast your brain can calculate.",
    traits: ['Cyber Slang', 'Speed Metrics', 'Glitch Flair', 'Fast Reflexes']
  },
  'Coach Marcus': {
    id: 'Coach Marcus',
    name: 'Coach Marcus',
    tagLine: 'The Beast Mode Coach',
    archetype: 'Locker Room Hype',
    avatar: '🔥',
    avatarBg: 'from-rose-500 to-red-700',
    voiceName: 'Charon',
    accentColor: 'rose',
    badgeColor: 'bg-rose-500/10 text-rose-400 border-rose-500/30',
    bio: 'Treats trivia like championship game day. All about relentless hustle, keeping your daily streak alive, and clutching under pressure.',
    sampleQuote: "Game on! Clutch this question right now and keep the streak alive!",
    traits: ['Relentless Grit', 'Hype Energy', 'Daily Hustle', 'Momentum']
  }
};

export const ALL_BADGES: Badge[] = [
  {
    id: 'growth-pioneer',
    title: 'Big Brain Energy',
    description: 'Score 100% on any Growth Mindset or Brain Science quiz.',
    iconName: 'BrainCircuit',
    category: 'mindset',
    rarity: 'Epic',
    progress: 1,
    maxProgress: 1,
    unlockedAt: '2026-08-10',
    perk: '+10% Bonus XP in Mindset Categories'
  },
  {
    id: 'speed-demon',
    title: 'Lightning Reflexes',
    description: 'Answer 5 questions in a row in under 3 seconds each.',
    iconName: 'Zap',
    category: 'streak',
    rarity: 'Rare',
    progress: 5,
    maxProgress: 5,
    unlockedAt: '2026-08-12',
    perk: '+15s Bonus on Freeze Time Lifeline'
  },
  {
    id: 'voice-virtuoso',
    title: 'Voice Boss',
    description: 'Play 3 full trivia matches using your microphone to answer.',
    iconName: 'Mic',
    category: 'voice',
    rarity: 'Rare',
    progress: 3,
    maxProgress: 3,
    unlockedAt: '2026-08-14',
    perk: 'Unlocks exclusive Host Voice banter modes'
  },
  {
    id: 'mindset-master',
    title: 'Mindset Master',
    description: 'Climb into the elite Mindset Master tier (Top 1% Worldwide).',
    iconName: 'Crown',
    category: 'mastery',
    rarity: 'Legendary',
    progress: 4420,
    maxProgress: 5000,
    perk: 'Golden Crown Profile Aura & VIP Host Commentary'
  },
  {
    id: 'flawless-streak',
    title: 'Flawless 10-Streak',
    description: 'Finish a 10-question round without missing a single answer.',
    iconName: 'Flame',
    category: 'streak',
    rarity: 'Epic',
    progress: 10,
    maxProgress: 10,
    unlockedAt: '2026-08-15',
    perk: '2.5x Score Multiplier Cap Unlocked'
  },
  {
    id: 'stoic-sage',
    title: 'Cool Under Pressure',
    description: 'Answer 10 Philosophy & Stoic Mindset questions correctly.',
    iconName: 'ShieldCheck',
    category: 'mindset',
    rarity: 'Rare',
    progress: 8,
    maxProgress: 10,
    perk: 'Unlocks Extra Hint in Zen Mode'
  },
  {
    id: 'community-beacon',
    title: 'Team Player',
    description: 'Contribute 2,500+ points to the Community Challenge.',
    iconName: 'Users',
    category: 'social',
    rarity: 'Epic',
    progress: 2150,
    maxProgress: 2500,
    perk: 'Featured Contributor Badge in Community Hub'
  },
  {
    id: 'daily-devotee',
    title: '7-Day Streak Club',
    description: 'Play at least one trivia round every day for 7 days straight.',
    iconName: 'CalendarCheck',
    category: 'streak',
    rarity: 'Common',
    progress: 5,
    maxProgress: 7,
    perk: 'Daily Login Reward 2x Boost'
  },
  {
    id: 'ai-collaborator',
    title: 'Host Whisperer',
    description: 'Play full matches with all 5 distinct AI Host personalities.',
    iconName: 'Sparkles',
    category: 'voice',
    rarity: 'Rare',
    progress: 5,
    maxProgress: 5,
    unlockedAt: '2026-08-16',
    perk: 'Custom Host Voice Greeting'
  },
  {
    id: 'grandmaster-polymath',
    title: 'Trivia Legend',
    description: 'Reach 90%+ accuracy across 5 different trivia categories.',
    iconName: 'Trophy',
    category: 'mastery',
    rarity: 'Legendary',
    progress: 4,
    maxProgress: 5,
    perk: 'Immunity from Weekly Rank Decay'
  }
];

const initialHistory = generateRealisticInitialHistory();

export const INITIAL_PROFILE: PlayerProfile = {
  id: 'player-align-001',
  username: 'Alex Rivera',
  handle: '@arivera_align',
  avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80',
  bannerGradient: 'from-emerald-900 via-zinc-900 to-neutral-950',
  bio: 'Brain hacks & tech nerd. Stacking daily 1% wins and keeping my streak alive.',
  mindsetMantra: '“You don’t lose when you fail, you lose when you don’t learn from it.”',
  leagueTier: 'Platinum',
  rankPoints: 4420,
  globalRank: 14,
  totalGames: initialHistory.length,
  accuracyRate: 91.2,
  highestStreak: 12,
  currentStreakDays: 5,
  showcaseBadgeIds: ['growth-pioneer', 'speed-demon', 'flawless-streak'],
  unlockedBadgeIds: ['growth-pioneer', 'speed-demon', 'voice-virtuoso', 'flawless-streak', 'ai-collaborator'],
  soundEnabled: true,
  voiceEnabled: true,
  hapticsEnabled: true,
  narrationSpeed: 1.0,
  theme: 'dark',
  memberSince: 'Aug 2026',
  accessibility: {
    highContrast: false,
    reducedMotion: false,
    autoSpeakQuestions: false,
    largeText: false,
    screenReaderOptimized: true
  },
  history: initialHistory
};

export const INITIAL_PLAYER_PROFILE = INITIAL_PROFILE;

export const FALLBACK_QUESTIONS = [
  {
    id: 'q-gm-1',
    category: 'Growth Mindset & Brain Hacks',
    difficulty: 'Pro' as const,
    question: 'According to Dr. Carol Dweck’s famous research on the brain, how does a "Growth Mindset" view making mistakes?',
    options: [
      'As proof that you just aren’t naturally smart enough',
      'As super valuable clues that show your brain where to grow',
      'As embarrassing moments you should try to hide',
      'As totally random bad luck with nothing to learn'
    ],
    correctIndex: 1,
    explanation: 'Science proves that when you tackle hard challenges and learn from your mistakes, your brain physically grows stronger neural pathways.',
    mindsetInsight: 'Mistakes are literally just free blueprints showing your brain where to level up next.',
    citations: [
      { title: 'Carol Dweck - Mindset: The New Psychology of Success', uri: 'https://mindsetonline.com' }
    ]
  },
  {
    id: 'q-gm-2',
    category: 'Growth Mindset & Brain Hacks',
    difficulty: 'Rookie' as const,
    question: 'Adding which magical one-syllable word to the end of "I can\'t do this..." instantly flips your mindset to growth mode?',
    options: [
      'YET',
      'NEVER',
      'QUIT',
      'WHY'
    ],
    correctIndex: 0,
    explanation: 'Saying "I can\'t do this YET" reminds your brain that mastery is just a matter of practice and time.',
    mindsetInsight: '"Yet" turns a closed door into a staircase.',
    citations: [{ title: 'The Power of Yet (TED Talk)', uri: 'https://www.ted.com' }]
  },
  {
    id: 'q-gm-3',
    category: 'Growth Mindset & Brain Hacks',
    difficulty: 'Legend' as const,
    question: 'What is "Neuroplasticity"—one of the most exciting neuroscience discoveries of modern times?',
    options: [
      'The brain\'s physical ability to rewire, reshape, and build new connections throughout your entire life',
      'The idea that your brain turns into plastic after age 25',
      'A permanent mental block that stops you from learning new languages',
      'The biological limit on how many memories one person can store'
    ],
    correctIndex: 0,
    explanation: 'Your brain is not a rigid computer—it is a living muscle that constantly reorganizes and adapts whenever you practice difficult tasks.',
    mindsetInsight: 'Your brain rewires itself around whatever you give your focused attention to.',
    citations: [{ title: 'Principles of Neural Science', uri: 'https://en.wikipedia.org/wiki/Neuroplasticity' }]
  },
  {
    id: 'q-nf-1',
    category: 'Neuroscience & Deep Focus',
    difficulty: 'Pro' as const,
    question: 'Which brain chemical is actually responsible for your drive, curiosity, and motivation to chase goals?',
    options: [
      'Serotonin',
      'Endorphins',
      'Dopamine',
      'Melatonin'
    ],
    correctIndex: 2,
    explanation: 'Dopamine isn’t just for when you win—it kicks in during the pursuit and anticipation of overcoming a fun challenge.',
    mindsetInsight: 'Learn to enjoy the grind of solving problems, and your brain will give you endless natural motivation.',
    citations: [
      { title: 'Huberman Lab - The Science of Dopamine & Drive', uri: 'https://hubermanlab.com' }
    ]
  },
  {
    id: 'q-nf-2',
    category: 'Neuroscience & Deep Focus',
    difficulty: 'Pro' as const,
    question: 'Psychologist Mihaly Csikszentmihalyi coined the term "Flow State". What is the sweet spot between challenge and skill that triggers it?',
    options: [
      'When the task is so easy you fall asleep doing it',
      'When the challenge is just roughly 4% above your current skill level—stretching you without panic',
      'When you are completely overwhelmed and panicked with zero preparation',
      'When you have 10 browser tabs open while watching videos'
    ],
    correctIndex: 1,
    explanation: 'Flow happens right on the edge between boredom and anxiety, where total focus and effortless execution meet.',
    mindsetInsight: 'Find the edge of your comfort zone—that is where flow state unlocks.',
    citations: [{ title: 'Flow: The Psychology of Optimal Experience', uri: 'https://en.wikipedia.org/wiki/Flow_(psychology)' }]
  },
  {
    id: 'q-sm-1',
    category: 'Stoic Mindset & Life Lessons',
    difficulty: 'Expert' as const,
    question: 'In ancient Stoic philosophy (like Marcus Aurelius and Epictetus), what is the "Dichotomy of Control"?',
    options: [
      'Trying to control what everyone else thinks about you',
      'Focusing 100% on your own choices and reactions, while letting go of what you can’t control',
      'Never feeling or expressing any emotions ever',
      'Planning out every second of your future without flexibility'
    ],
    correctIndex: 1,
    explanation: 'Stoics teach that real peace and power come from controlling your own actions, attitude, and effort, rather than stressing over external results.',
    mindsetInsight: 'Stop stressing about what you can’t control. Put all your energy into how you respond right now.',
    citations: [
      { title: 'Stanford Encyclopedia of Philosophy: Epictetus', uri: 'https://plato.stanford.edu/entries/epictetus/' }
    ]
  },
  {
    id: 'q-tech-1',
    category: 'Tech, AI & Future Trends',
    difficulty: 'Pro' as const,
    question: 'What revolutionary AI breakthrough in 2017 made modern AI models (like ChatGPT and Gemini) understand language so smoothly?',
    options: [
      'The Transformer architecture with Self-Attention',
      'Simple spell-checking algorithms',
      'Punch card computing systems',
      'Random guessing networks'
    ],
    correctIndex: 0,
    explanation: 'The Transformer architecture allowed computers to pay attention to all words in a sentence at once instead of one word at a time, changing AI forever.',
    mindsetInsight: 'Connecting different ideas all at once is what creates breakthrough thinking.',
    citations: [
      { title: 'Attention Is All You Need - Vaswani et al.', uri: 'https://arxiv.org/abs/1706.03762' }
    ]
  },
  {
    id: 'q-habits-1',
    category: 'Atomic Habits & Daily Routines',
    difficulty: 'Rookie' as const,
    question: 'In James Clear’s bestselling book "Atomic Habits", what is the secret to making good habits stick forever?',
    options: [
      'Relying purely on intense motivation that disappears in 3 days',
      'Trying to change your entire life overnight all at once',
      'Focusing on identity and stacking small 1% improvements every day',
      'Punishing yourself harshly whenever you take a rest day'
    ],
    correctIndex: 2,
    explanation: 'Tiny 1% daily upgrades compound like interest. When you build systems and see yourself as the type of person who shows up, success follows.',
    mindsetInsight: 'Small wins stacked daily beat occasional bursts of motivation every single time.',
    citations: [
      { title: 'James Clear - Atomic Habits', uri: 'https://jamesclear.com/atomic-habits' }
    ]
  }
];

export function getFallbackQuestionsByCategory(category: string, count = 6) {
  const normCategory = category.toLowerCase();
  let filtered = FALLBACK_QUESTIONS.filter(q => {
    const qCat = q.category.toLowerCase();
    if (normCategory.includes('growth') || normCategory.includes('brain')) return qCat.includes('growth') || qCat.includes('brain');
    if (normCategory.includes('neuro') || normCategory.includes('focus')) return qCat.includes('neuro') || qCat.includes('focus');
    if (normCategory.includes('stoic') || normCategory.includes('life')) return qCat.includes('stoic') || qCat.includes('life');
    if (normCategory.includes('tech') || normCategory.includes('ai')) return qCat.includes('tech') || qCat.includes('ai');
    if (normCategory.includes('habit') || normCategory.includes('routine')) return qCat.includes('habit') || qCat.includes('routine');
    return true;
  });

  if (filtered.length < count) {
    const rest = FALLBACK_QUESTIONS.filter(q => !filtered.some(f => f.id === q.id));
    filtered = [...filtered, ...rest];
  }

  return [...filtered].sort(() => 0.5 - Math.random()).slice(0, count);
}

export const BENCHMARK_TOP_BOSSES: LeaderboardEntry[] = [
  {
    rank: 1,
    username: 'Dr. Elena Rostova',
    handle: '@elena_mindset',
    avatarUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
    tier: 'Mindset Master',
    score: 8940,
    peakStreak: 32,
    accuracy: 97.2,
    trend: 'same',
    badgesCount: 14,
    isBenchmarkBoss: true,
    bossTitle: 'Mindset Grandmaster'
  },
  {
    rank: 2,
    username: 'Kai Takahashi',
    handle: '@kai_systems',
    avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    tier: 'Mindset Master',
    score: 8610,
    peakStreak: 28,
    accuracy: 95.8,
    trend: 'up',
    badgesCount: 12,
    isBenchmarkBoss: true,
    bossTitle: 'Focus Systems Champion'
  },
  {
    rank: 3,
    username: 'Amara Okafor',
    handle: '@amara_stoic',
    avatarUrl: 'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=150&auto=format&fit=crop&q=80',
    tier: 'Diamond',
    score: 7920,
    peakStreak: 24,
    accuracy: 94.1,
    trend: 'up',
    badgesCount: 11,
    isBenchmarkBoss: true,
    bossTitle: 'Stoic Resilience Master'
  }
];

export const MOCK_LEADERBOARD: LeaderboardEntry[] = [
  ...BENCHMARK_TOP_BOSSES,
  {
    rank: 4,
    username: 'Liam Sterling',
    handle: '@l_sterling',
    avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
    tier: 'Diamond',
    score: 7480,
    peakStreak: 21,
    accuracy: 92.5,
    trend: 'down',
    badgesCount: 10
  },
  {
    rank: 5,
    username: 'Seraphina Vance',
    handle: '@svance_quantum',
    avatarUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80',
    tier: 'Diamond',
    score: 6980,
    peakStreak: 19,
    accuracy: 91.2,
    trend: 'same',
    badgesCount: 9
  },
  {
    rank: 14,
    username: 'Alex Rivera (You)',
    handle: '@arivera_align',
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    tier: 'Platinum',
    score: 4420,
    peakStreak: 16,
    accuracy: 88.4,
    isCurrentUser: true,
    trend: 'up',
    badgesCount: 5
  },
  {
    rank: 15,
    username: 'Devon Miller',
    handle: '@devon_grit',
    avatarUrl: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=150&auto=format&fit=crop&q=80',
    tier: 'Platinum',
    score: 4380,
    peakStreak: 15,
    accuracy: 87.9,
    trend: 'down',
    badgesCount: 6
  },
  {
    rank: 16,
    username: 'Zoe Chen',
    handle: '@z_chen_mind',
    avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
    tier: 'Platinum',
    score: 4290,
    peakStreak: 14,
    accuracy: 86.8,
    trend: 'up',
    badgesCount: 7
  }
];

export const MOCK_COMMUNITY_GOAL: CommunityGoal = {
  id: 'goal-aug-2026',
  title: 'Community Quest: Hit 100,000 Total Points',
  description: 'Team up with players worldwide! When our community hits 100,000 points this week, everyone unlocks the animated "Big Brain Team" badge + a live community voice hangout with Aria.',
  targetPoints: 100000,
  currentPoints: 78450,
  deadline: '3 days left',
  participantsCount: 1428,
  rewardBadgeId: 'community-beacon',
  rewardBadgeName: 'Big Brain Team Medallion',
  rewardXp: 1000,
  unlocked: false
};

export const MOCK_DISCUSSION_POSTS: DiscussionPost[] = [
  {
    id: 'post-1',
    authorName: 'Dr. Elena Rostova',
    authorHandle: '@elena_mindset',
    authorAvatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
    authorTier: 'Mindset Master',
    timestamp: '2h ago',
    content: "Game-changing tip: Whenever I’m stressed about trying something new, instead of asking 'What if I fail?', I ask: 'What cool thing will I learn even if it goes wrong?' That one shift kills anxiety instantly.",
    upvotes: 42,
    hasUpvoted: true,
    repliesCount: 8,
    tags: ['Mindset Shift', 'Confidence', 'Brain Hacks']
  },
  {
    id: 'post-2',
    authorName: 'Kai Takahashi',
    authorHandle: '@kai_systems',
    authorAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    authorTier: 'Mindset Master',
    timestamp: '4h ago',
    content: "On our coding squad, whenever someone finds a bug or makes a mistake, we celebrate it out loud in Slack. Finding what doesn’t work gets you closer to what does!",
    upvotes: 29,
    hasUpvoted: false,
    repliesCount: 5,
    tags: ['Team Vibes', 'No Fear of Failure']
  },
  {
    id: 'post-3',
    authorName: 'Aria (AI Host Summary)',
    authorHandle: '@aria_host',
    authorAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    authorTier: 'Mindset Master',
    timestamp: 'Just now',
    isHostSynthesis: true,
    content: "Today's Community Takeaway: The vibe in the chat today is super clear—treating mistakes like data instead of Ls is the fastest way to get smarter and stay confident.",
    upvotes: 67,
    hasUpvoted: true,
    repliesCount: 14,
    tags: ['AI Host Summary', 'Key Takeaway']
  }
];

export const MOCK_NOTIFICATIONS: NotificationItem[] = [
  {
    id: 'n-1',
    title: 'Daily Streak on Fire!',
    message: 'Your 5-day streak is active! Play 1 quick round today so you don’t lose your streak bonus.',
    timestamp: '15m ago',
    type: 'streak',
    isRead: false,
    targetTab: 'play'
  },
  {
    id: 'n-2',
    title: 'Community Goal at 78%!',
    message: 'We only need 21,550 more points to hit the 100K reward goal. Let’s get it!',
    timestamp: '1h ago',
    type: 'challenge',
    isRead: false,
    targetTab: 'social'
  },
  {
    id: 'n-3',
    title: 'Leaderboard Update',
    message: 'Kai Takahashi just gained +120 LP in the Master Division.',
    timestamp: '3h ago',
    type: 'league',
    isRead: true,
    targetTab: 'leaderboard'
  },
  {
    id: 'n-4',
    title: 'New Daily Question Drop',
    message: 'Today’s hot topic: "How do you stay chill under pressure?" Share your take in the Hub!',
    timestamp: '5h ago',
    type: 'discussion',
    isRead: true,
    targetTab: 'social'
  }
];

export const TRIVIA_CATEGORIES = [
  { id: 'mixed', name: 'Mixed Bag (The All-Rounder)', icon: 'Sparkles', description: 'A fun mix of brain science, tech, life hacks, and cool trivia' },
  { id: 'mindset', name: 'Growth Mindset & Brain Hacks', icon: 'BrainCircuit', description: 'How your brain learns, builds habits, and bounces back stronger' },
  { id: 'neuroscience', name: 'Neuroscience & Deep Focus', icon: 'Activity', description: 'Dopamine, flow state, attention span, and how your brain actually works' },
  { id: 'stoic', name: 'Stoic Mindset & Life Lessons', icon: 'Shield', description: 'Marcus Aurelius, staying calm under pressure, and controlling the controllables' },
  { id: 'tech', name: 'Tech, AI & Future Trends', icon: 'Cpu', description: 'From ChatGPT and quantum computing to tech changing the world' },
  { id: 'habits', name: 'Atomic Habits & Daily Routines', icon: 'Flame', description: 'Habit loops, morning routines, focus hacks, and stacking daily wins' }
];
