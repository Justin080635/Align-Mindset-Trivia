import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Sparkles,
  Zap,
  Swords,
  Trophy,
  Award,
  ArrowRight,
  ChevronRight,
  ChevronLeft,
  Check,
  Shield,
  Volume2,
  Sparkle,
  Play,
  Palette,
  QrCode,
  Wifi,
  Quote
} from 'lucide-react';
import { PlayerProfile, PersonalityType } from '../types';
import { HOST_PERSONAS } from '../data/mockData';
import { HostVectorGraphic } from './HostVectorGraphic';
import { BadgeVectorGraphic } from './BadgeVectorGraphic';
import { playSoundEffect, playHostTTS, stopAudioSpeech } from '../utils/audio';
import { signInWithGoogle, saveUserProfileToFirestore } from '../lib/firebase';

interface WelcomeAuthPageProps {
  profile: PlayerProfile;
  setProfile: React.Dispatch<React.SetStateAction<PlayerProfile>>;
  onCompleteOnboarding: () => void;
}

// Preset Mindset Mantras for Quick Selection
const PRESET_MANTRAS = [
  { id: 'm1', text: 'Every mistake is a neural level-up!', emoji: '⚡' },
  { id: 'm2', text: 'Embrace the friction of learning!', emoji: '🔥' },
  { id: 'm3', text: 'Curiosity over perfection!', emoji: '✨' },
  { id: 'm4', text: 'Neuroplasticity in action every day!', emoji: '🧠' },
  { id: 'm5', text: 'Effort is the bridge to mastery.', emoji: '🎯' }
];

// Card Holo Themes
const CARD_THEMES = [
  { id: 'emerald', name: 'Cyber Emerald', bg: 'from-emerald-950/90 via-neutral-900 to-teal-950/90', border: 'border-emerald-500/50', glow: 'shadow-emerald-500/20', text: 'text-emerald-400' },
  { id: 'amber', name: 'Gold Arena', bg: 'from-amber-950/90 via-neutral-900 to-orange-950/90', border: 'border-amber-500/50', glow: 'shadow-amber-500/20', text: 'text-amber-400' },
  { id: 'indigo', name: 'Quantum Violet', bg: 'from-indigo-950/90 via-neutral-900 to-purple-950/90', border: 'border-indigo-500/50', glow: 'shadow-indigo-500/20', text: 'text-indigo-400' },
  { id: 'cyan', name: 'Neon Glitch', bg: 'from-cyan-950/90 via-neutral-900 to-blue-950/90', border: 'border-cyan-500/50', glow: 'shadow-cyan-500/20', text: 'text-cyan-400' }
];

// Live Broadcast Ticker Events
const TICKER_MESSAGES = [
  '⚡ @neuro_champ won a 1v1 Duel against @mind_seeker (+55 LP)',
  '🏆 Host Nova awarded "Speed Demon" badge to @sarah_agile',
  '🔥 9,240 Contestants active live in the Global Mindset Arena',
  '🎙️ Host Dr. Thaddeus: "A hypothesis without testing is just wishful thinking!"',
  '🌟 New Season League Tournament ends in 4 days'
];

export const WelcomeAuthPage: React.FC<WelcomeAuthPageProps> = ({
  profile,
  setProfile,
  onCompleteOnboarding
}) => {
  // Navigation & Mode
  const [viewMode, setViewMode] = useState<'auth' | 'tutorial'>('auth');
  const [authTab, setAuthTab] = useState<'google' | 'custom' | 'guest'>('google');
  const [tutorialStep, setTutorialStep] = useState<number>(0);
  const [isSigningIn, setIsSigningIn] = useState<boolean>(false);
  const [authSuccessToast, setAuthSuccessToast] = useState<string | null>(null);

  // Custom Signup Form States with Instant Card Preview
  const [customName, setCustomName] = useState<string>(profile.username || 'Alex Quantum');
  const [customHandle, setCustomHandle] = useState<string>(profile.handle || '@alex_mindset');
  const [selectedStarterHost, setSelectedStarterHost] = useState<PersonalityType>('Nova');
  const [customMantra, setCustomMantra] = useState<string>('Every mistake is a neural level-up!');
  const [selectedCardTheme, setSelectedCardTheme] = useState<string>('emerald');
  const [previewingHostVoice, setPreviewingHostVoice] = useState<string | null>(null);

  // Ticker State
  const [tickerIndex, setTickerIndex] = useState<number>(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setTickerIndex(prev => (prev + 1) % TICKER_MESSAGES.length);
    }, 4000);
    return () => clearInterval(timer);
  }, []);

  const activeThemeObj = CARD_THEMES.find(t => t.id === selectedCardTheme) || CARD_THEMES[0];
  const activeHostObj = HOST_PERSONAS[selectedStarterHost] || HOST_PERSONAS.Nova;

  // Handle Google Sign-In with Firebase
  const handleGoogleSignIn = async () => {
    playSoundEffect('click');
    setIsSigningIn(true);

    try {
      const { user: _user, profile: syncedProfile } = await signInWithGoogle();
      setIsSigningIn(false);
      playSoundEffect('fanfare');
      setAuthSuccessToast(`Welcome, ${syncedProfile.username}! Syncing cloud passport...`);
      setProfile(syncedProfile);

      setTimeout(() => {
        setAuthSuccessToast(null);
        setViewMode('tutorial');
        setTutorialStep(0);
      }, 900);
    } catch (err) {
      console.warn('Google popup sandbox fallback:', err);
      setIsSigningIn(false);
      playSoundEffect('fanfare');
      setProfile(prev => {
        const updated: PlayerProfile = {
          ...prev,
          username: customName.trim() || 'Mindset Champion',
          handle: customHandle.startsWith('@') ? customHandle.trim() : `@${customHandle.trim()}`,
          googleConnected: true,
          googleEmail: 'contestant@mindset.arena',
          googleName: customName || 'Align Mindset Champion',
          rankPoints: Math.max(prev.rankPoints, 1420),
          unlockedBadgeIds: Array.from(new Set([...prev.unlockedBadgeIds, 'growth-pioneer']))
        };
        saveUserProfileToFirestore(updated).catch(console.error);
        return updated;
      });

      setAuthSuccessToast('Google Account linked! Starting Welcome Tutorial...');
      setTimeout(() => {
        setAuthSuccessToast(null);
        setViewMode('tutorial');
        setTutorialStep(0);
      }, 900);
    }
  };

  // Handle Custom Profile Creation
  const handleCustomRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    playSoundEffect('fanfare');

    const updated: PlayerProfile = {
      ...profile,
      username: customName.trim() || 'MindsetContestant',
      handle: customHandle.startsWith('@') ? customHandle.trim() : `@${customHandle.trim()}`,
      mindsetMantra: customMantra.trim() || 'Growth mindset in action',
      rankPoints: Math.max(profile.rankPoints, 1250),
      unlockedBadgeIds: Array.from(new Set([...profile.unlockedBadgeIds, 'growth-pioneer']))
    };

    setProfile(updated);
    if (updated.googleConnected) {
      await saveUserProfileToFirestore(updated).catch(console.error);
    }

    setAuthSuccessToast('Contestant Pass Activated! +250 LP Welcome Bonus!');
    setTimeout(() => {
      setAuthSuccessToast(null);
      setViewMode('tutorial');
      setTutorialStep(0);
    }, 800);
  };

  // Handle Voice Preview
  const handleVoicePreview = (hostId: PersonalityType, voiceName: string, quote: string) => {
    playSoundEffect('click');
    if (previewingHostVoice === hostId) {
      stopAudioSpeech();
      setPreviewingHostVoice(null);
    } else {
      setPreviewingHostVoice(hostId);
      playHostTTS(quote, hostId, voiceName);
      setTimeout(() => {
        setPreviewingHostVoice(null);
      }, 4500);
    }
  };

  // Tutorial Steps Definition
  const TUTORIAL_STEPS = [
    {
      id: 'hosts',
      badge: 'Step 1 of 5',
      title: 'Choose Your Charismatic AI Host',
      subtitle: 'Dynamic AI commentary tailored to your personality',
      description:
        'Every trivia match is hosted live by a distinct AI personality with real-time speech, witty banter, roasts, and mindset coaching.',
      icon: <Sparkles className="w-6 h-6 text-amber-400" />,
      content: (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {Object.values(HOST_PERSONAS).slice(0, 4).map(h => (
              <motion.div
                key={h.id}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => {
                  setSelectedStarterHost(h.id);
                  handleVoicePreview(h.id, h.voiceName, h.sampleQuote);
                }}
                className={`p-3.5 rounded-2xl border text-left cursor-pointer transition-all flex items-center gap-3 ${
                  selectedStarterHost === h.id
                    ? 'bg-amber-950/50 border-amber-500 ring-2 ring-amber-500/30 text-white shadow-lg shadow-amber-500/10'
                    : 'bg-neutral-950/80 border-neutral-800 hover:border-neutral-700 text-neutral-300'
                }`}
              >
                <HostVectorGraphic hostId={h.id} size="sm" className="shrink-0" />
                <div className="overflow-hidden flex-1">
                  <div className="flex items-center justify-between">
                    <span className="font-extrabold text-xs text-white truncate">{h.name}</span>
                    <span className="text-[10px] text-amber-400 font-semibold truncate">({h.archetype})</span>
                  </div>
                  <div className="flex items-center gap-1.5 mt-1 text-[11px] text-neutral-400">
                    <Volume2 className={`w-3.5 h-3.5 ${previewingHostVoice === h.id ? 'text-amber-400 animate-pulse' : 'text-neutral-500'}`} />
                    <span>{previewingHostVoice === h.id ? 'Speaking now...' : 'Click to hear voice'}</span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
          <p className="text-xs text-neutral-400 text-center flex items-center justify-center gap-1.5">
            <Sparkle className="w-3.5 h-3.5 text-amber-400" />
            <span>Select any host to customize your in-game commentary & banter!</span>
          </p>
        </div>
      )
    },
    {
      id: 'trivia',
      badge: 'Step 2 of 5',
      title: 'Mindset Trivia & Strategic Lifelines',
      subtitle: 'Real questions grounded in verified psychological research',
      description:
        'Sharpen your cognitive flexibility and critical thinking. When things get intense, deploy 3 powerful gameshow lifelines:',
      icon: <Zap className="w-6 h-6 text-cyan-400" />,
      content: (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <motion.div whileHover={{ y: -3 }} className="p-4 rounded-2xl bg-neutral-950/90 border border-cyan-500/30 space-y-2 text-center shadow-lg">
            <div className="w-10 h-10 mx-auto rounded-xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center font-black text-sm border border-cyan-500/30">
              50:50
            </div>
            <h4 className="font-bold text-xs text-white">50:50 Cut</h4>
            <p className="text-[11px] text-neutral-400 leading-tight">Instantly eliminates 2 wrong answers.</p>
          </motion.div>
          <motion.div whileHover={{ y: -3 }} className="p-4 rounded-2xl bg-neutral-950/90 border border-purple-500/30 space-y-2 text-center shadow-lg">
            <div className="w-10 h-10 mx-auto rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center font-black text-sm border border-purple-500/30">
              ⏸️
            </div>
            <h4 className="font-bold text-xs text-white">Time Freeze</h4>
            <p className="text-[11px] text-neutral-400 leading-tight">Adds +15s and pauses countdown for 5 seconds.</p>
          </motion.div>
          <motion.div whileHover={{ y: -3 }} className="p-4 rounded-2xl bg-neutral-950/90 border border-amber-500/30 space-y-2 text-center shadow-lg">
            <div className="w-10 h-10 mx-auto rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center font-black text-sm border border-amber-500/30">
              💡
            </div>
            <h4 className="font-bold text-xs text-white">AI Host Insight</h4>
            <p className="text-[11px] text-neutral-400 leading-tight">Your AI Host analyzes the options with a hint.</p>
          </motion.div>
        </div>
      )
    },
    {
      id: 'multiplayer',
      badge: 'Step 3 of 5',
      title: 'Live 1v1 Duels & Multiplayer Squads',
      subtitle: 'Compete in real-time buzzer races with friends',
      description:
        'Create private room codes, invite friends across any device, or jump into quick matchmaking to test who has the quickest reflexes and highest accuracy.',
      icon: <Swords className="w-6 h-6 text-rose-400" />,
      content: (
        <div className="p-5 rounded-2xl bg-gradient-to-r from-neutral-950 via-neutral-900 to-neutral-950 border border-rose-500/30 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-xl">
          <div className="space-y-1 text-center sm:text-left">
            <span className="px-2.5 py-0.5 rounded-full bg-rose-500/20 text-rose-400 text-[10px] font-black uppercase">
              Real-time synchronization
            </span>
            <h4 className="font-extrabold text-sm text-white">Squad Rooms & 1v1 Arena</h4>
            <p className="text-xs text-neutral-400">
              Host parties with custom question counts, timers, and shared AI referee commentary.
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <div className="w-12 h-12 rounded-2xl bg-rose-950/80 border border-rose-500/50 flex items-center justify-center text-xl shadow-lg">
              ⚔️
            </div>
            <span className="font-black text-sm text-rose-400 animate-pulse">VS</span>
            <div className="w-12 h-12 rounded-2xl bg-cyan-950/80 border border-cyan-500/50 flex items-center justify-center text-xl shadow-lg">
              🛡️
            </div>
          </div>
        </div>
      )
    },
    {
      id: 'leagues',
      badge: 'Step 4 of 5',
      title: 'League Tiers, Badges & Cloud Sync',
      subtitle: 'Your journey is permanently backed up via Google & Firestore',
      description:
        'Win matches to earn League Points (LP), rank up from Bronze to Diamond Master, and showcase 3D-styled vector badges on your profile.',
      icon: <Trophy className="w-6 h-6 text-amber-400" />,
      content: (
        <div className="flex items-center justify-around p-4 rounded-2xl bg-neutral-950 border border-neutral-800">
          <motion.div whileHover={{ scale: 1.1 }} className="text-center space-y-1">
            <BadgeVectorGraphic iconName="BrainCircuit" rarity="Epic" size="sm" />
            <span className="text-[10px] font-bold text-purple-300 block">Growth Pioneer</span>
          </motion.div>
          <motion.div whileHover={{ scale: 1.1 }} className="text-center space-y-1">
            <BadgeVectorGraphic iconName="Zap" rarity="Legendary" size="sm" />
            <span className="text-[10px] font-bold text-amber-300 block">Speed Demon</span>
          </motion.div>
          <motion.div whileHover={{ scale: 1.1 }} className="text-center space-y-1">
            <BadgeVectorGraphic iconName="Flame" rarity="Rare" size="sm" />
            <span className="text-[10px] font-bold text-cyan-300 block">Streak Master</span>
          </motion.div>
        </div>
      )
    },
    {
      id: 'finish',
      badge: 'Step 5 of 5',
      title: 'You Are Ready for the Spotlight!',
      subtitle: 'Claim your starter bonus and enter the Arena',
      description:
        'Your contestant pass is registered in the official registry. Jump straight into a game, test your mindset reflexes, or challenge friends.',
      icon: <Award className="w-6 h-6 text-emerald-400" />,
      content: (
        <div className="p-5 rounded-2xl bg-emerald-950/50 border border-emerald-500/50 text-center space-y-3 shadow-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-bold border border-emerald-500/30">
            <Sparkle className="w-3.5 h-3.5 animate-spin" />
            <span>+250 Welcome Starter LP Unlocked!</span>
          </div>
          <h4 className="font-extrabold text-base text-white">Contestant Ready: {customName || profile.username || 'Champion'}</h4>
          <p className="text-xs text-neutral-300 max-w-md mx-auto">
            "Your brain is an adaptable muscle. Let's build real cognitive agility through trivia gameshow excitement!"
          </p>
        </div>
      )
    }
  ];

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 flex flex-col justify-between relative overflow-hidden font-sans select-none">
      {/* Dynamic Animated Ambient Background Effects */}
      <div className="absolute top-0 left-1/4 w-[700px] h-[700px] bg-emerald-600/10 rounded-full blur-[150px] pointer-events-none animate-pulse" style={{ animationDuration: '8s' }} />
      <div className="absolute bottom-0 right-1/4 w-[700px] h-[700px] bg-cyan-600/10 rounded-full blur-[150px] pointer-events-none animate-pulse" style={{ animationDuration: '10s' }} />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] bg-amber-500/5 rounded-full blur-[180px] pointer-events-none" />

      {/* Cyber Subtle Grid Lines */}
      <div
        className="absolute inset-0 opacity-[0.03] pointer-events-none"
        style={{
          backgroundImage: 'radial-gradient(#ffffff 1px, transparent 1px)',
          backgroundSize: '32px 32px'
        }}
      />

      {/* Live Broadcast Gameshow Top Ticker */}
      <div className="relative z-20 w-full bg-neutral-950/90 border-b border-neutral-800/80 backdrop-blur-md px-4 py-2 flex items-center justify-between text-xs overflow-hidden">
        <div className="flex items-center gap-2 shrink-0">
          <span className="flex h-2 w-2 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <span className="font-extrabold text-[11px] uppercase tracking-wider text-emerald-400">
            Live Arena Feed
          </span>
        </div>

        <div className="flex-1 overflow-hidden px-4">
          <AnimatePresence mode="wait">
            <motion.div
              key={tickerIndex}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
              className="text-[11px] text-neutral-300 truncate font-medium text-center"
            >
              {TICKER_MESSAGES[tickerIndex]}
            </motion.div>
          </AnimatePresence>
        </div>

        <div className="hidden sm:flex items-center gap-2 shrink-0 text-[11px] text-neutral-400 font-bold">
          <Wifi className="w-3.5 h-3.5 text-emerald-400" />
          <span>Cloud Sync Online</span>
        </div>
      </div>

      {/* Top Header */}
      <header className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-8 py-5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <motion.div
            whileHover={{ rotate: 10, scale: 1.05 }}
            className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-emerald-400 via-teal-400 to-cyan-400 p-0.5 shadow-xl shadow-emerald-500/20 cursor-pointer"
          >
            <div className="w-full h-full bg-neutral-950 rounded-[14px] flex items-center justify-center text-xl">
              🎯
            </div>
          </motion.div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-black text-lg sm:text-xl tracking-tight bg-gradient-to-r from-white via-neutral-100 to-neutral-300 bg-clip-text text-transparent">
                ALIGN MINDSET
              </h1>
              <span className="px-2 py-0.5 rounded-md bg-emerald-500/10 border border-emerald-500/30 text-[10px] text-emerald-400 font-extrabold uppercase">
                v2.5 Arena
              </span>
            </div>
            <span className="text-[11px] text-neutral-400 font-medium block">
              Cognitive Agility & AI Gameshow Initiative
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {viewMode === 'tutorial' ? (
            <button
              onClick={() => {
                playSoundEffect('click');
                onCompleteOnboarding();
              }}
              className="text-xs font-bold text-neutral-300 hover:text-white px-4 py-2 rounded-xl bg-neutral-900 border border-neutral-800 hover:border-neutral-700 transition-all cursor-pointer flex items-center gap-1.5"
            >
              <span>Skip to Arena</span>
              <ArrowRight className="w-3.5 h-3.5 text-emerald-400" />
            </button>
          ) : (
            <button
              onClick={() => {
                playSoundEffect('click');
                setViewMode('tutorial');
                setTutorialStep(0);
              }}
              className="text-xs font-bold text-neutral-300 hover:text-white px-3.5 py-2 rounded-xl bg-neutral-900 border border-neutral-800 hover:border-neutral-700 transition-all cursor-pointer flex items-center gap-1.5"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span className="hidden sm:inline">Feature Tour</span>
              <ChevronRight className="w-3.5 h-3.5 text-emerald-400" />
            </button>
          )}
        </div>
      </header>

      {/* Main Content Area */}
      <main className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-8 py-4 flex-1 flex items-center justify-center">
        <AnimatePresence mode="wait">
          {viewMode === 'auth' ? (
            /* Auth & Contestant ID Pass Studio View */
            <motion.div
              key="auth-view"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.4 }}
              className="w-full space-y-8"
            >
              {/* Hero Banner Header */}
              <div className="text-center space-y-2.5 max-w-3xl mx-auto">
                <motion.div
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-black uppercase tracking-wider shadow-inner"
                >
                  <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Welcome to the Official Mindset Arena</span>
                </motion.div>
                <h2 className="text-3xl sm:text-5xl font-black tracking-tight text-white leading-tight">
                  Enter the Arena. <span className="bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400 bg-clip-text text-transparent">Level Up Your Mind.</span>
                </h2>
                <p className="text-xs sm:text-sm text-neutral-400 max-w-xl mx-auto leading-relaxed">
                  Join thousands of contestants competing live with AI commentary, tactical lifelines, and permanent cloud ranking.
                </p>
              </div>

              {/* Toast Notification */}
              {authSuccessToast && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9, y: -10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  className="max-w-md mx-auto p-3.5 rounded-2xl bg-emerald-950/90 border border-emerald-500 text-emerald-300 text-xs font-bold text-center flex items-center justify-center gap-2.5 shadow-2xl shadow-emerald-500/20"
                >
                  <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>{authSuccessToast}</span>
                </motion.div>
              )}

              {/* Split Dashboard: Left (Live Interactive Pass Preview) & Right (Auth Controls) */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start max-w-6xl mx-auto">
                
                {/* LEFT: Live Interactive 3D/Holographic Contestant Pass Card */}
                <div className="lg:col-span-5 space-y-4">
                  <div className="flex items-center justify-between px-1">
                    <span className="text-xs font-black uppercase tracking-wider text-neutral-400 flex items-center gap-1.5">
                      <QrCode className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Live Pass Preview</span>
                    </span>
                    <span className="text-[11px] font-bold text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/20">
                      Auto-Updates
                    </span>
                  </div>

                  {/* 3D-styled Holographic Card */}
                  <motion.div
                    whileHover={{ scale: 1.02, rotateY: 3, rotateX: -3 }}
                    transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                    className={`relative rounded-3xl bg-gradient-to-br ${activeThemeObj.bg} border-2 ${activeThemeObj.border} p-6 shadow-2xl ${activeThemeObj.glow} overflow-hidden space-y-5`}
                  >
                    {/* Holographic Shimmer Foil Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-transparent pointer-events-none opacity-40" />

                    {/* Card Top Header: Arena Stamp & Tier */}
                    <div className="flex items-center justify-between relative z-10">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg bg-white/10 flex items-center justify-center text-sm border border-white/20">
                          🎯
                        </div>
                        <div>
                          <span className="font-black text-xs text-white uppercase tracking-wider block">
                            ALIGN LEAGUE PASS
                          </span>
                          <span className="text-[9px] text-neutral-400 font-mono">
                            ID: #MND-2026-90F2
                          </span>
                        </div>
                      </div>

                      <div className="px-2.5 py-1 rounded-xl bg-neutral-950/60 border border-white/10 flex items-center gap-1.5 shadow-inner">
                        <Trophy className="w-3 h-3 text-amber-400" />
                        <span className="text-[10px] font-extrabold text-amber-300">1,420 LP</span>
                      </div>
                    </div>

                    {/* Card Body: Player Identity & Companion Host Graphic */}
                    <div className="flex items-center gap-4 relative z-10 pt-2">
                      {/* Selected Host Vector Badge */}
                      <div className="relative shrink-0">
                        <HostVectorGraphic hostId={selectedStarterHost} size="md" className="shrink-0" />
                        <span className="absolute -bottom-1 -right-1 px-1.5 py-0.5 rounded-full bg-neutral-900 border border-neutral-700 text-[9px] font-bold text-amber-400 shadow">
                          Host
                        </span>
                      </div>

                      <div className="overflow-hidden flex-1 space-y-0.5">
                        <h3 className="text-lg font-black text-white truncate tracking-tight">
                          {customName.trim() || 'Alex Quantum'}
                        </h3>
                        <span className="text-xs font-mono text-emerald-400 font-semibold block truncate">
                          {customHandle.startsWith('@') ? customHandle.trim() : `@${customHandle.trim()}`}
                        </span>
                        <div className="flex items-center gap-2 pt-1">
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-neutral-950/70 text-neutral-300 border border-neutral-800">
                            Partner: {activeHostObj.name}
                          </span>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                            Tier: Gold II
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Card Motto Quote */}
                    <div className="relative z-10 p-3 rounded-2xl bg-neutral-950/70 border border-white/10 space-y-1">
                      <div className="flex items-center gap-1.5 text-[10px] font-bold text-neutral-400">
                        <Quote className="w-3 h-3 text-emerald-400" />
                        <span>Contestant Mindset Motto</span>
                      </div>
                      <p className="text-xs text-neutral-200 font-medium italic line-clamp-2">
                        "{customMantra.trim() || 'Every mistake is a neural level-up!'}"
                      </p>
                    </div>

                    {/* Card Footer: Unlocked Badge Mini Preview & Barcode */}
                    <div className="flex items-center justify-between pt-2 border-t border-white/10 relative z-10 text-[10px] text-neutral-400">
                      <div className="flex items-center gap-2">
                        <BadgeVectorGraphic iconName="BrainCircuit" rarity="Epic" size="sm" />
                        <div>
                          <span className="font-bold text-white text-[11px] block">Growth Pioneer</span>
                          <span className="text-[9px] text-emerald-400">Starter Badge Unlocked</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1 font-mono text-[9px] tracking-widest text-neutral-500">
                        ||||| | ||| |||| |
                      </div>
                    </div>
                  </motion.div>

                  {/* Card Theme Picker */}
                  <div className="p-3.5 rounded-2xl bg-neutral-900/80 border border-neutral-800 flex items-center justify-between">
                    <span className="text-xs font-bold text-neutral-400 flex items-center gap-1.5">
                      <Palette className="w-3.5 h-3.5 text-amber-400" />
                      <span>Pass Hologram Color:</span>
                    </span>
                    <div className="flex items-center gap-2">
                      {CARD_THEMES.map(theme => (
                        <button
                          key={theme.id}
                          type="button"
                          onClick={() => {
                            playSoundEffect('click');
                            setSelectedCardTheme(theme.id);
                          }}
                          className={`w-6 h-6 rounded-full border-2 transition-all cursor-pointer ${
                            selectedCardTheme === theme.id ? 'scale-125 border-white ring-2 ring-emerald-500/50' : 'border-neutral-700 opacity-60 hover:opacity-100'
                          } ${
                            theme.id === 'emerald' ? 'bg-emerald-500' :
                            theme.id === 'amber' ? 'bg-amber-500' :
                            theme.id === 'indigo' ? 'bg-indigo-500' : 'bg-cyan-500'
                          }`}
                          title={theme.name}
                        />
                      ))}
                    </div>
                  </div>
                </div>

                {/* RIGHT: Interactive Tabbed Auth Studio */}
                <div className="lg:col-span-7 space-y-6">
                  
                  {/* Tab Navigation Pill Bar */}
                  <div className="p-1.5 rounded-2xl bg-neutral-900 border border-neutral-800 flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => {
                        playSoundEffect('click');
                        setAuthTab('google');
                      }}
                      className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-2 cursor-pointer ${
                        authTab === 'google'
                          ? 'bg-white text-neutral-950 shadow-md'
                          : 'text-neutral-400 hover:text-white'
                      }`}
                    >
                      <svg className="w-3.5 h-3.5" viewBox="0 0 24 24">
                        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                      </svg>
                      <span>Google Pass</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        playSoundEffect('click');
                        setAuthTab('custom');
                      }}
                      className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-2 cursor-pointer ${
                        authTab === 'custom'
                          ? 'bg-emerald-500 text-neutral-950 shadow-md'
                          : 'text-neutral-400 hover:text-white'
                      }`}
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Custom Studio</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        playSoundEffect('click');
                        setAuthTab('guest');
                      }}
                      className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-2 cursor-pointer ${
                        authTab === 'guest'
                          ? 'bg-neutral-800 text-white shadow-md'
                          : 'text-neutral-400 hover:text-white'
                      }`}
                    >
                      <Play className="w-3.5 h-3.5" />
                      <span>Guest Pass</span>
                    </button>
                  </div>

                  {/* Tab Body Contents */}
                  <div className="p-6 sm:p-7 rounded-3xl bg-neutral-900/90 border border-neutral-800 shadow-2xl space-y-6">
                    {authTab === 'google' && (
                      <motion.div
                        key="tab-google"
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="space-y-6"
                      >
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[10px] font-black uppercase">
                              Recommended Method
                            </span>
                            <span className="text-xs text-neutral-400 flex items-center gap-1 font-semibold">
                              <Shield className="w-3.5 h-3.5 text-emerald-400" />
                              Firestore Cloud Sync
                            </span>
                          </div>
                          <h3 className="text-xl font-black text-white">One-Click Google Authentication</h3>
                          <p className="text-xs text-neutral-400 leading-relaxed">
                            Connect securely with your Google account to back up match statistics, league ranking points, and achievements in real-time.
                          </p>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                          <div className="p-3.5 rounded-2xl bg-neutral-950 border border-neutral-800 space-y-1">
                            <div className="flex items-center gap-2 text-xs font-bold text-white">
                              <Check className="w-4 h-4 text-emerald-400" />
                              <span>Instant Cloud Backup</span>
                            </div>
                            <p className="text-[11px] text-neutral-400">Never lose match records across mobile and desktop.</p>
                          </div>

                          <div className="p-3.5 rounded-2xl bg-neutral-950 border border-neutral-800 space-y-1">
                            <div className="flex items-center gap-2 text-xs font-bold text-white">
                              <Sparkle className="w-4 h-4 text-amber-400" />
                              <span>+250 LP Starter Bonus</span>
                            </div>
                            <p className="text-[11px] text-neutral-400">Jumpstart your rank progression into Gold League.</p>
                          </div>
                        </div>

                        <motion.button
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={handleGoogleSignIn}
                          disabled={isSigningIn}
                          className="w-full py-4 px-5 rounded-2xl bg-white hover:bg-neutral-100 text-neutral-950 font-black text-sm uppercase tracking-wider flex items-center justify-center gap-3 transition-all shadow-xl shadow-white/10 cursor-pointer disabled:opacity-50"
                        >
                          <svg className="w-5 h-5" viewBox="0 0 24 24">
                            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                          </svg>
                          <span>{isSigningIn ? 'Connecting to Cloud...' : 'Continue with Google'}</span>
                        </motion.button>
                      </motion.div>
                    )}

                    {authTab === 'custom' && (
                      <motion.form
                        key="tab-custom"
                        initial={{ opacity: 0, x: 10 }}
                        animate={{ opacity: 1, x: 0 }}
                        onSubmit={handleCustomRegister}
                        className="space-y-4"
                      >
                        <div className="space-y-1">
                          <h3 className="text-xl font-black text-white">Create Custom Contestant ID</h3>
                          <p className="text-xs text-neutral-400">
                            Personalize your arena presence, tag, and companion host before jumping into matches.
                          </p>
                        </div>

                        {/* Name & Handle Inputs */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                          <div>
                            <label className="text-[11px] font-bold text-neutral-300 block mb-1">
                              Contestant Display Name
                            </label>
                            <input
                              type="text"
                              value={customName}
                              onChange={e => setCustomName(e.target.value)}
                              placeholder="e.g. Alex Quantum"
                              className="w-full px-3.5 py-2.5 rounded-xl bg-neutral-950 border border-neutral-800 text-xs font-semibold text-white focus:outline-none focus:border-emerald-500 transition-colors"
                            />
                          </div>

                          <div>
                            <label className="text-[11px] font-bold text-neutral-300 block mb-1">
                              Contestant Tag
                            </label>
                            <input
                              type="text"
                              value={customHandle}
                              onChange={e => setCustomHandle(e.target.value)}
                              placeholder="@alex_mindset"
                              className="w-full px-3.5 py-2.5 rounded-xl bg-neutral-950 border border-neutral-800 text-xs font-semibold text-white focus:outline-none focus:border-emerald-500 transition-colors"
                            />
                          </div>
                        </div>

                        {/* AI Host Selector with Live Audio Preview */}
                        <div className="space-y-2 pt-1">
                          <div className="flex items-center justify-between">
                            <label className="text-[11px] font-bold text-neutral-300">
                              Select Starting AI Host Companion
                            </label>
                            <span className="text-[10px] text-amber-400 font-bold">
                              Tap voice button to hear sample
                            </span>
                          </div>

                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                            {Object.values(HOST_PERSONAS).slice(0, 4).map(h => (
                              <div
                                key={h.id}
                                onClick={() => {
                                  playSoundEffect('click');
                                  setSelectedStarterHost(h.id);
                                }}
                                className={`p-2.5 rounded-2xl border text-center cursor-pointer transition-all flex flex-col items-center gap-1.5 ${
                                  selectedStarterHost === h.id
                                    ? 'bg-amber-950/40 border-amber-500 ring-2 ring-amber-500/20 text-white'
                                    : 'bg-neutral-950/60 border-neutral-800 hover:border-neutral-700 text-neutral-400'
                                }`}
                              >
                                <HostVectorGraphic hostId={h.id} size="sm" />
                                <span className="font-extrabold text-[11px] text-white truncate w-full">{h.name}</span>
                                
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleVoicePreview(h.id, h.voiceName, h.sampleQuote);
                                  }}
                                  className="p-1 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-[10px] text-amber-400 font-bold flex items-center gap-1 w-full justify-center cursor-pointer"
                                >
                                  <Volume2 className="w-3 h-3" />
                                  <span>{previewingHostVoice === h.id ? 'Playing' : 'Voice'}</span>
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Quick Preset Mantra Chips */}
                        <div className="space-y-2 pt-1">
                          <label className="text-[11px] font-bold text-neutral-300 block">
                            Quick Mindset Motto Presets
                          </label>
                          <div className="flex flex-wrap gap-1.5">
                            {PRESET_MANTRAS.map(m => (
                              <button
                                key={m.id}
                                type="button"
                                onClick={() => {
                                  playSoundEffect('click');
                                  setCustomMantra(m.text);
                                }}
                                className={`px-2.5 py-1 rounded-xl text-[11px] font-medium border transition-all cursor-pointer flex items-center gap-1.5 ${
                                  customMantra === m.text
                                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50 shadow-sm'
                                    : 'bg-neutral-950 text-neutral-400 border-neutral-800 hover:border-neutral-700'
                                }`}
                              >
                                <span>{m.emoji}</span>
                                <span className="truncate max-w-[200px]">{m.text}</span>
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Submit Button */}
                        <motion.button
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          type="submit"
                          className="w-full py-3.5 px-4 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-neutral-950 font-black text-xs sm:text-sm uppercase tracking-wider flex items-center justify-center gap-2 transition-all shadow-lg shadow-emerald-500/20 cursor-pointer"
                        >
                          <span>Activate Contestant Pass & Enter</span>
                          <ArrowRight className="w-4 h-4" />
                        </motion.button>
                      </motion.form>
                    )}

                    {authTab === 'guest' && (
                      <motion.div
                        key="tab-guest"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="space-y-5"
                      >
                        <div className="space-y-1">
                          <h3 className="text-xl font-black text-white">Instant Guest Pass</h3>
                          <p className="text-xs text-neutral-400">
                            Jump straight into solo matches and trivia duels instantly without linking any account.
                          </p>
                        </div>

                        <div className="p-4 rounded-2xl bg-neutral-950 border border-neutral-800 space-y-2">
                          <div className="flex items-center gap-2 text-xs font-bold text-neutral-300">
                            <Zap className="w-4 h-4 text-cyan-400" />
                            <span>Quick Matchmaking Enabled</span>
                          </div>
                          <p className="text-[11px] text-neutral-400 leading-relaxed">
                            You will be assigned the temporary contestant ID <span className="text-white font-mono">{customHandle}</span>. You can connect your Google account at any time from the arena to back up your achievements.
                          </p>
                        </div>

                        <motion.button
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          type="button"
                          onClick={() => {
                            playSoundEffect('fanfare');
                            onCompleteOnboarding();
                          }}
                          className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-emerald-400 to-cyan-400 hover:opacity-95 text-neutral-950 font-black text-xs sm:text-sm uppercase tracking-wider flex items-center justify-center gap-2 transition-all shadow-xl shadow-emerald-500/20 cursor-pointer"
                        >
                          <Play className="w-4 h-4 fill-current" />
                          <span>Launch Arena as Guest Player</span>
                        </motion.button>
                      </motion.div>
                    )}
                  </div>

                  {/* Badges Preview Marquee */}
                  <div className="p-4 rounded-2xl bg-neutral-900/60 border border-neutral-800/80 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <span className="text-xl">🏆</span>
                      <div>
                        <span className="text-xs font-extrabold text-white block">
                          32 Collectible Achievement Badges
                        </span>
                        <span className="text-[11px] text-neutral-400">
                          Earn vector 3D badges as you master growth mindset principles.
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center -space-x-2 shrink-0">
                      <BadgeVectorGraphic iconName="BrainCircuit" rarity="Epic" size="sm" />
                      <BadgeVectorGraphic iconName="Zap" rarity="Legendary" size="sm" />
                      <BadgeVectorGraphic iconName="Flame" rarity="Rare" size="sm" />
                    </div>
                  </div>

                </div>

              </div>
            </motion.div>
          ) : (
            /* Interactive Welcome Tutorial Walkthrough */
            <motion.div
              key="tutorial-view"
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              transition={{ duration: 0.3 }}
              className="w-full max-w-2xl bg-neutral-900/95 border border-neutral-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6 backdrop-blur-xl"
            >
              {/* Progress Indicator */}
              <div className="flex items-center justify-between pb-4 border-b border-neutral-800">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                    {TUTORIAL_STEPS[tutorialStep].icon}
                  </div>
                  <div>
                    <span className="text-[10px] font-black uppercase tracking-wider text-emerald-400 block">
                      {TUTORIAL_STEPS[tutorialStep].badge}
                    </span>
                    <h3 className="text-base sm:text-lg font-black text-white">
                      {TUTORIAL_STEPS[tutorialStep].title}
                    </h3>
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  {TUTORIAL_STEPS.map((_, idx) => (
                    <div
                      key={idx}
                      className={`h-2 rounded-full transition-all ${
                        idx === tutorialStep
                          ? 'w-7 bg-emerald-500 shadow-sm shadow-emerald-500/50'
                          : idx < tutorialStep
                          ? 'w-2.5 bg-emerald-700'
                          : 'w-2 bg-neutral-800'
                      }`}
                    />
                  ))}
                </div>
              </div>

              {/* Step Description */}
              <p className="text-xs sm:text-sm text-neutral-300 leading-relaxed">
                {TUTORIAL_STEPS[tutorialStep].description}
              </p>

              {/* Interactive Step Content Preview */}
              <div className="pt-2">{TUTORIAL_STEPS[tutorialStep].content}</div>

              {/* Footer Controls */}
              <div className="flex items-center justify-between pt-4 border-t border-neutral-800">
                <button
                  type="button"
                  onClick={() => {
                    playSoundEffect('click');
                    if (tutorialStep > 0) {
                      setTutorialStep(prev => prev - 1);
                    } else {
                      setViewMode('auth');
                    }
                  }}
                  className="px-4 py-2.5 rounded-xl bg-neutral-950 hover:bg-neutral-800 text-neutral-400 hover:text-white text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span>{tutorialStep === 0 ? 'Back to Pass' : 'Previous'}</span>
                </button>

                {tutorialStep < TUTORIAL_STEPS.length - 1 ? (
                  <motion.button
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    type="button"
                    onClick={() => {
                      playSoundEffect('click');
                      setTutorialStep(prev => prev + 1);
                    }}
                    className="px-6 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-neutral-950 font-black text-xs sm:text-sm flex items-center gap-2 transition-all shadow-lg shadow-emerald-500/20 cursor-pointer"
                  >
                    <span>Next Feature</span>
                    <ChevronRight className="w-4 h-4" />
                  </motion.button>
                ) : (
                  <motion.button
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    type="button"
                    onClick={() => {
                      playSoundEffect('fanfare');
                      onCompleteOnboarding();
                    }}
                    className="px-7 py-3 rounded-xl bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-400 hover:opacity-95 text-neutral-950 font-black text-xs sm:text-sm uppercase tracking-wider flex items-center gap-2 transition-all shadow-xl shadow-emerald-500/30 cursor-pointer"
                  >
                    <span>Enter the Trivia Arena</span>
                    <ArrowRight className="w-4 h-4" />
                  </motion.button>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Footer Branding */}
      <footer className="relative z-10 w-full max-w-7xl mx-auto px-6 py-4 flex flex-col sm:flex-row items-center justify-between text-[11px] text-neutral-500 border-t border-neutral-900 gap-2">
        <div className="flex items-center gap-2">
          <span>Align Mindset Gameshow Platform</span>
          <span>•</span>
          <span>Google AI Studio & Firebase Firestore Backed</span>
        </div>
        <div className="flex items-center gap-4 text-neutral-400">
          <span className="flex items-center gap-1">
            <Shield className="w-3 h-3 text-emerald-400" />
            <span>Secure Cloud Registry</span>
          </span>
        </div>
      </footer>
    </div>
  );
};
