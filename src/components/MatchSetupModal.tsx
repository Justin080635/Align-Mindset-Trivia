import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Brain,
  Sparkles,
  Zap,
  Flame,
  Volume2,
  Square,
  Check,
  ChevronDown,
  Clock,
  Shield,
  Layers,
  ArrowRight,
  HelpCircle,
  X,
  Target,
  Trophy,
  Coins,
  Compass,
  Lightbulb,
  Radio,
  BookOpen,
  Activity,
  Cpu,
  Smile
} from 'lucide-react';
import {
  PersonalityType,
  GameDifficulty,
  GameMode,
  PlayerProfile,
  HostPersona
} from '../types';
import { HOST_PERSONAS, TRIVIA_CATEGORIES } from '../data/mockData';
import { HostVectorGraphic } from './HostVectorGraphic';
import { playSoundEffect, playHostTTS, stopAudioSpeech } from '../utils/audio';

// Custom / expanded category list with nice icons & badges
export const EXTENDED_TRIVIA_CATEGORIES = [
  {
    id: 'mixed',
    name: 'Mixed Bag (The All-Rounder)',
    icon: Sparkles,
    color: 'from-amber-500 to-orange-600',
    accent: 'amber',
    badge: 'Popular',
    description: 'A fun, high-energy mix of brain science, tech breakthroughs, life hacks, and general curiosity.'
  },
  {
    id: 'mindset',
    name: 'Growth Mindset & Brain Hacks',
    icon: Brain,
    color: 'from-emerald-500 to-teal-600',
    accent: 'emerald',
    badge: 'Core Focus',
    description: 'How your neuroplasticity works, reframing failure, resilient habits, and deliberate practice.'
  },
  {
    id: 'neuroscience',
    name: 'Neuroscience & Deep Focus',
    icon: Activity,
    color: 'from-cyan-500 to-blue-600',
    accent: 'cyan',
    badge: 'High Focus',
    description: 'Dopamine reward circuits, entering flow state, managing cognitive load, and deep work hacks.'
  },
  {
    id: 'stoic',
    name: 'Stoic Mindset & Life Lessons',
    icon: Shield,
    color: 'from-indigo-500 to-purple-600',
    accent: 'indigo',
    badge: 'Wisdom',
    description: 'Marcus Aurelius, dichotomy of control, emotional composure under pressure, and mental clarity.'
  },
  {
    id: 'tech',
    name: 'Tech, AI & Future Trends',
    icon: Cpu,
    color: 'from-purple-500 to-pink-600',
    accent: 'purple',
    badge: 'Trending',
    description: 'LLMs, AI agents, quantum breakthroughs, digital innovation, and future technology horizons.'
  },
  {
    id: 'habits',
    name: 'Atomic Habits & Daily Routines',
    icon: Flame,
    color: 'from-rose-500 to-red-600',
    accent: 'rose',
    badge: 'Daily Streak',
    description: 'Habit loops, friction design, cue-craving-response systems, and stacking 1% daily wins.'
  },
  {
    id: 'history_cultures',
    name: 'History & World Cultures',
    icon: Compass,
    color: 'from-amber-600 to-yellow-600',
    accent: 'yellow',
    badge: 'Trivia Classic',
    description: 'Fascinating global milestones, ancient wonders, cultural traditions, and historical pivots.'
  },
  {
    id: 'science_nature',
    name: 'Science, Space & Nature',
    icon: Sparkles,
    color: 'from-teal-500 to-emerald-700',
    accent: 'teal',
    badge: 'Discovery',
    description: 'Cosmic phenomena, physics mysteries, biodiversity, quantum mechanics, and planet earth wonders.'
  },
  {
    id: 'pop_culture',
    name: 'Pop Culture & Entertainment',
    icon: Radio,
    color: 'from-pink-500 to-rose-600',
    accent: 'pink',
    badge: 'Fun & Fast',
    description: 'Iconic movies, music history, gaming lore, viral internet moments, and TV legends.'
  }
];

export interface MatchSetupConfig {
  category: string;
  difficulty: GameDifficulty;
  gameMode: GameMode;
  questionCount: number;
  selectedHost: PersonalityType;
}

interface MatchSetupModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile: PlayerProfile;
  selectedCategory: string;
  setSelectedCategory: (cat: string) => void;
  selectedDifficulty: GameDifficulty;
  setSelectedDifficulty: (diff: GameDifficulty) => void;
  gameMode: GameMode;
  setGameMode: (mode: GameMode) => void;
  questionCount: number;
  setQuestionCount: (count: number) => void;
  selectedHost: PersonalityType;
  setSelectedHost: (host: PersonalityType) => void;
  onLaunchGame: () => void;
  isLoadingQuestions: boolean;
}

export const MatchSetupModal: React.FC<MatchSetupModalProps> = ({
  isOpen,
  onClose,
  profile,
  selectedCategory,
  setSelectedCategory,
  selectedDifficulty,
  setSelectedDifficulty,
  gameMode,
  setGameMode,
  questionCount,
  setQuestionCount,
  selectedHost,
  setSelectedHost,
  onLaunchGame,
  isLoadingQuestions
}) => {
  const [isCategoryDropdownOpen, setIsCategoryDropdownOpen] = useState(false);
  const [customTopicInput, setCustomTopicInput] = useState('');
  const [isCustomTopicActive, setIsCustomTopicActive] = useState(false);
  const [previewingVoiceHost, setPreviewingVoiceHost] = useState<string | null>(null);

  if (!isOpen) return null;

  const currentCategoryObj =
    EXTENDED_TRIVIA_CATEGORIES.find(c => c.name === selectedCategory) ||
    EXTENDED_TRIVIA_CATEGORIES[0];
  const activeHost = HOST_PERSONAS[selectedHost] || HOST_PERSONAS['Nova'];

  // Potential rewards estimate
  const estimatedLPReward =
    selectedDifficulty === 'Legend'
      ? '+65 LP'
      : selectedDifficulty === 'Expert'
      ? '+50 LP'
      : selectedDifficulty === 'Pro'
      ? '+35 LP'
      : '+20 LP';
  const estimatedCoins = questionCount * (selectedDifficulty === 'Legend' ? 25 : 15);

  const handleTestHostVoice = async (e: React.MouseEvent, h: HostPersona) => {
    e.stopPropagation();
    if (previewingVoiceHost === h.id) {
      stopAudioSpeech();
      setPreviewingVoiceHost(null);
      return;
    }

    setPreviewingVoiceHost(h.id);
    if (profile.soundEnabled) playSoundEffect('click');

    await playHostTTS(
      h.sampleQuote,
      h.id,
      h.voiceName,
      () => setPreviewingVoiceHost(h.id),
      () => setPreviewingVoiceHost(null)
    );
  };

  const handleApplyCustomTopic = () => {
    if (customTopicInput.trim()) {
      setSelectedCategory(customTopicInput.trim());
      setIsCustomTopicActive(true);
      setIsCategoryDropdownOpen(false);
      playSoundEffect('correct');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200 overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        transition={{ type: 'spring', damping: 25, stiffness: 350 }}
        className="w-full max-w-3xl rounded-3xl bg-gradient-to-b from-neutral-900 via-neutral-900 to-neutral-950 border border-neutral-800 shadow-2xl overflow-hidden my-auto max-h-[92vh] flex flex-col"
      >
        {/* MODAL HEADER */}
        <div className="p-5 sm:p-6 border-b border-neutral-800 flex items-center justify-between bg-neutral-950/70 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-emerald-500 to-cyan-600 flex items-center justify-center shadow-lg shadow-emerald-500/20 text-neutral-950">
              <Sparkles className="w-5 h-5 fill-current" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  Pre-Game Match Config
                </span>
                <span className="text-xs text-neutral-400 font-medium hidden sm:inline">
                  Configure rules, host & rewards
                </span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                Setup Your Trivia Match
              </h2>
            </div>
          </div>

          <button
            onClick={() => {
              playSoundEffect('click');
              onClose();
            }}
            className="p-2 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-neutral-400 hover:text-white transition-colors cursor-pointer border border-neutral-800"
            aria-label="Close Setup Modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* MODAL SCROLLABLE BODY */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-6 flex-1">
          
          {/* SECTION 1: TRIVIA TOPIC SELECTION (DROPDOWN + SEARCH + QUICK CHIPS) */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-wider text-neutral-300 flex items-center gap-1.5">
                <Brain className="w-4 h-4 text-emerald-400" />
                <span>1. Choose Trivia Topic (Dropdown & Quick Select)</span>
              </label>
              {isCustomTopicActive && (
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 font-bold">
                  Custom AI Topic
                </span>
              )}
            </div>

            {/* Main Topic Dropdown Selector Bar */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setIsCategoryDropdownOpen(!isCategoryDropdownOpen)}
                className="w-full p-4 rounded-2xl bg-neutral-950 border border-neutral-800 hover:border-emerald-500/50 transition-all flex items-center justify-between text-left group cursor-pointer shadow-inner focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
                aria-expanded={isCategoryDropdownOpen}
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${currentCategoryObj.color} flex items-center justify-center text-white shrink-0 shadow-md`}>
                    <currentCategoryObj.icon className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm sm:text-base font-extrabold text-white truncate block">
                        {selectedCategory}
                      </span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-neutral-900 text-neutral-300 border border-neutral-800 shrink-0">
                        {currentCategoryObj.badge || 'Topic'}
                      </span>
                    </div>
                    <p className="text-xs text-neutral-400 truncate mt-0.5">
                      {currentCategoryObj.description}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0 ml-2">
                  <span className="text-xs text-emerald-400 font-bold hidden sm:inline group-hover:underline">
                    Change Topic
                  </span>
                  <div className={`p-1.5 rounded-lg bg-neutral-900 text-neutral-300 group-hover:text-white transition-transform ${isCategoryDropdownOpen ? 'rotate-180' : ''}`}>
                    <ChevronDown className="w-4 h-4" />
                  </div>
                </div>
              </button>

              {/* DROPDOWN MENU PANEL */}
              <AnimatePresence>
                {isCategoryDropdownOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="absolute top-full left-0 right-0 mt-2 p-3 bg-neutral-900 border border-neutral-700/80 rounded-2xl shadow-2xl z-40 max-h-80 overflow-y-auto space-y-2 backdrop-blur-xl"
                  >
                    {/* Custom Topic Generator Search Bar */}
                    <div className="p-2 bg-neutral-950 rounded-xl border border-neutral-800 space-y-2">
                      <span className="text-[11px] font-bold text-neutral-300 block">
                        ✨ Have a specific topic in mind? Type any custom subject:
                      </span>
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          value={customTopicInput}
                          onChange={e => setCustomTopicInput(e.target.value)}
                          onKeyDown={e => e.key === 'Enter' && handleApplyCustomTopic()}
                          placeholder="e.g. Marvel Cinematic Universe, Space Telescopes, 90s Hip Hop..."
                          className="flex-1 px-3 py-2 rounded-lg bg-neutral-900 border border-neutral-800 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-emerald-500"
                        />
                        <button
                          type="button"
                          onClick={handleApplyCustomTopic}
                          disabled={!customTopicInput.trim()}
                          className="px-3 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 disabled:opacity-40 text-neutral-950 font-black text-xs transition-all cursor-pointer shrink-0"
                        >
                          Set Topic
                        </button>
                      </div>
                    </div>

                    <div className="text-[10px] font-black uppercase text-neutral-400 px-2 pt-1 tracking-wider">
                      Or pick from curated channels:
                    </div>

                    {/* Curated List of Categories */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                      {EXTENDED_TRIVIA_CATEGORIES.map(cat => {
                        const isSelected = selectedCategory === cat.name;
                        const Icon = cat.icon;
                        return (
                          <button
                            key={cat.id}
                            type="button"
                            onClick={() => {
                              playSoundEffect('click');
                              setSelectedCategory(cat.name);
                              setIsCustomTopicActive(false);
                              setIsCategoryDropdownOpen(false);
                            }}
                            className={`p-3 rounded-xl text-left border transition-all flex items-start gap-2.5 cursor-pointer ${
                              isSelected
                                ? 'bg-emerald-950/60 border-emerald-500 ring-1 ring-emerald-500 text-white'
                                : 'bg-neutral-950/80 border-neutral-800 hover:border-neutral-700 text-neutral-300 hover:bg-neutral-900'
                            }`}
                          >
                            <div className={`p-2 rounded-lg bg-gradient-to-br ${cat.color} text-white shrink-0 shadow-sm mt-0.5`}>
                              <Icon className="w-4 h-4" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center justify-between gap-1">
                                <span className="font-bold text-xs text-white truncate block">
                                  {cat.name}
                                </span>
                                {isSelected && <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />}
                              </div>
                              <span className="text-[10px] text-neutral-400 line-clamp-1 mt-0.5">
                                {cat.description}
                              </span>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Quick-Select Topic Chips */}
            <div className="flex flex-wrap items-center gap-1.5 pt-1">
              <span className="text-[10px] text-neutral-400 font-bold uppercase tracking-wider mr-1">Quick Switch:</span>
              {EXTENDED_TRIVIA_CATEGORIES.slice(0, 5).map(cat => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => {
                    playSoundEffect('click');
                    setSelectedCategory(cat.name);
                    setIsCustomTopicActive(false);
                  }}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all border cursor-pointer ${
                    selectedCategory === cat.name
                      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 shadow-sm font-bold'
                      : 'bg-neutral-950 text-neutral-400 border-neutral-800 hover:border-neutral-700 hover:text-neutral-200'
                  }`}
                >
                  {cat.name.split(' ')[0]} {cat.name.includes('&') ? '& More' : ''}
                </button>
              ))}
            </div>
          </div>

          {/* SECTION 2: AI HOST SELECTION (NOVA, ARIA, DR. THADDEUS, CIPHER-9, COACH MARCUS) */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-wider text-neutral-300 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-amber-400" />
                <span>2. Select Your AI Host</span>
              </label>
              <span className="text-[11px] text-neutral-400">
                Active: <strong className="text-white">{activeHost.name}</strong> ({activeHost.archetype})
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
              {Object.values(HOST_PERSONAS).map(h => {
                const isSelected = selectedHost === h.id;
                const isVoicePlaying = previewingVoiceHost === h.id;

                return (
                  <div
                    key={h.id}
                    onClick={() => {
                      playSoundEffect('click');
                      setSelectedHost(h.id);
                    }}
                    role="button"
                    tabIndex={0}
                    onKeyDown={e => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        setSelectedHost(h.id);
                      }
                    }}
                    className={`p-3 rounded-2xl border text-center transition-all flex flex-col items-center justify-between cursor-pointer relative group ${
                      isSelected
                        ? 'bg-neutral-800/90 border-emerald-500 ring-2 ring-emerald-500/30 shadow-lg'
                        : 'bg-neutral-950/70 border-neutral-800 hover:border-neutral-700 hover:bg-neutral-900/80'
                    }`}
                  >
                    {isSelected && (
                      <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-emerald-400 shadow-sm shadow-emerald-400" />
                    )}

                    <div className="flex flex-col items-center space-y-1.5 w-full">
                      <HostVectorGraphic hostId={h.id} size="sm" />
                      <span className="text-xs font-bold text-white block leading-tight">{h.name}</span>
                      <span className="text-[10px] text-emerald-400 font-semibold block leading-tight">
                        {h.archetype}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={e => handleTestHostVoice(e, h)}
                      className={`mt-2 w-full py-1 rounded-lg text-[10px] font-bold transition-all border flex items-center justify-center gap-1 cursor-pointer ${
                        isVoicePlaying
                          ? 'bg-amber-500 text-neutral-950 border-amber-400 animate-pulse'
                          : 'bg-neutral-900 text-neutral-400 hover:text-white border-neutral-800'
                      }`}
                      title={`Listen to ${h.name}'s voice`}
                    >
                      {isVoicePlaying ? (
                        <>
                          <Square className="w-2.5 h-2.5 fill-current" />
                          <span>Stop</span>
                        </>
                      ) : (
                        <>
                          <Volume2 className="w-2.5 h-2.5 text-amber-400" />
                          <span>Voice</span>
                        </>
                      )}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          {/* SECTION 3: MATCH RULES & GAME CONFIG (DIFFICULTY, MODE, ROUND COUNT) */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
            
            {/* Difficulty Selector */}
            <div className="p-4 rounded-2xl bg-neutral-950/80 border border-neutral-800 space-y-2.5">
              <label className="text-[11px] font-black text-neutral-300 uppercase tracking-wider flex items-center justify-between">
                <span>Difficulty</span>
                <span className="text-amber-400 text-[10px]">{estimatedLPReward}</span>
              </label>

              <div className="grid grid-cols-2 gap-1.5">
                {(['Rookie', 'Pro', 'Expert', 'Legend'] as GameDifficulty[]).map(diff => (
                  <button
                    key={diff}
                    type="button"
                    onClick={() => {
                      playSoundEffect('click');
                      setSelectedDifficulty(diff);
                    }}
                    className={`py-2 rounded-xl text-xs font-bold transition-all border cursor-pointer ${
                      selectedDifficulty === diff
                        ? 'bg-gradient-to-r from-amber-500 to-yellow-500 text-neutral-950 border-amber-400 shadow-md font-black'
                        : 'bg-neutral-900 text-neutral-300 border-neutral-800 hover:border-neutral-700'
                    }`}
                  >
                    {diff}
                  </button>
                ))}
              </div>
            </div>

            {/* Game Mode Selector */}
            <div className="p-4 rounded-2xl bg-neutral-950/80 border border-neutral-800 space-y-2.5">
              <label className="text-[11px] font-black text-neutral-300 uppercase tracking-wider flex items-center justify-between">
                <span>Game Mode</span>
                <span className="text-emerald-400 text-[10px]">
                  {gameMode === 'blitz' ? '10s Clock' : gameMode === 'mindset_reflection' ? 'Untimed' : '15s Clock'}
                </span>
              </label>

              <div className="grid grid-cols-2 gap-1.5">
                {[
                  { id: 'standard', name: 'Classic', icon: Clock },
                  { id: 'blitz', name: 'Speed Blitz', icon: Zap },
                  { id: 'survival', name: 'Sudden Death', icon: Shield },
                  { id: 'mindset_reflection', name: 'Zen Mode', icon: Brain }
                ].map(m => {
                  const Icon = m.icon;
                  return (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => {
                        playSoundEffect('click');
                        setGameMode(m.id as GameMode);
                      }}
                      className={`p-2 rounded-xl text-left border transition-all cursor-pointer flex items-center gap-1.5 ${
                        gameMode === m.id
                          ? 'bg-emerald-600 text-white border-emerald-500 shadow-md font-bold'
                          : 'bg-neutral-900 text-neutral-300 border-neutral-800 hover:border-neutral-700'
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5 shrink-0 opacity-80" />
                      <span className="text-xs truncate">{m.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Rounds Count Selector */}
            <div className="p-4 rounded-2xl bg-neutral-950/80 border border-neutral-800 space-y-2.5">
              <label className="text-[11px] font-black text-neutral-300 uppercase tracking-wider flex items-center justify-between">
                <span>Questions</span>
                <span className="text-cyan-400 text-[10px]">~{questionCount * 15}s total</span>
              </label>

              <div className="grid grid-cols-3 gap-1.5">
                {[5, 8, 10].map(cnt => (
                  <button
                    key={cnt}
                    type="button"
                    onClick={() => {
                      playSoundEffect('click');
                      setQuestionCount(cnt);
                    }}
                    className={`py-2 rounded-xl text-xs font-bold transition-all border cursor-pointer ${
                      questionCount === cnt
                        ? 'bg-cyan-600 text-white border-cyan-500 shadow-md font-black'
                        : 'bg-neutral-900 text-neutral-300 border-neutral-800 hover:border-neutral-700'
                    }`}
                  >
                    {cnt} Qs
                  </button>
                ))}
              </div>
            </div>

          </div>

          {/* SECTION 4: POTENTIAL MATCH REWARDS & PERKS SUMMARY */}
          <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-500/10 via-neutral-950 to-emerald-500/10 border border-amber-500/20 flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
            <div className="space-y-0.5">
              <div className="flex items-center justify-center sm:justify-start gap-2">
                <span className="text-xs font-black uppercase text-amber-400 tracking-wider">
                  🏆 Match Payout & Perks
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-bold">
                  Multiplier Eligible
                </span>
              </div>
              <p className="text-xs text-neutral-400">
                Correct streaks boost your League Points and build up your 10-day Daily Chest streak.
              </p>
            </div>

            <div className="flex items-center gap-3 shrink-0">
              <div className="px-3 py-1.5 rounded-xl bg-neutral-950 border border-neutral-800 text-center">
                <span className="text-[9px] text-neutral-400 uppercase font-bold block">XP Boost</span>
                <span className="text-xs font-black text-emerald-400">+{questionCount * 50} XP</span>
              </div>
              <div className="px-3 py-1.5 rounded-xl bg-neutral-950 border border-neutral-800 text-center">
                <span className="text-[9px] text-neutral-400 uppercase font-bold block">Coins</span>
                <span className="text-xs font-black text-amber-400">~{estimatedCoins} Coins</span>
              </div>
            </div>
          </div>

        </div>

        {/* MODAL BOTTOM CTA BAR ("LET'S PLAY THE GAME") */}
        <div className="p-5 sm:p-6 bg-neutral-950 border-t border-neutral-800 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
          <div className="text-xs text-neutral-400 text-center sm:text-left">
            <span>Ready with </span>
            <strong className="text-white">{selectedCategory}</strong>
            <span> • </span>
            <strong className="text-emerald-400">{activeHost.name}</strong>
            <span> ({selectedDifficulty})</span>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              type="button"
              onClick={() => {
                playSoundEffect('click');
                onClose();
              }}
              className="px-4 py-3 rounded-2xl bg-neutral-900 hover:bg-neutral-800 text-neutral-300 text-xs font-bold transition-all cursor-pointer border border-neutral-800"
            >
              Cancel
            </button>

            <button
              id="start-trivia-modal-cta"
              type="button"
              onClick={() => {
                onLaunchGame();
                onClose();
              }}
              disabled={isLoadingQuestions}
              className="flex-1 sm:flex-none px-8 py-3.5 rounded-2xl bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-400 hover:from-emerald-300 hover:to-cyan-300 text-neutral-950 font-black text-sm uppercase tracking-wider shadow-xl shadow-emerald-500/25 flex items-center justify-center gap-2 transition-all hover:scale-[1.03] active:scale-[0.97] cursor-pointer disabled:opacity-50"
            >
              {isLoadingQuestions ? (
                <>
                  <div className="w-4 h-4 border-2 border-neutral-950 border-t-transparent rounded-full animate-spin" />
                  <span>Preparing Match...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 fill-current" />
                  <span>Let's Play The Game!</span>
                  <ArrowRight className="w-4 h-4 stroke-[3]" />
                </>
              )}
            </button>
          </div>
        </div>

      </motion.div>
    </div>
  );
};
