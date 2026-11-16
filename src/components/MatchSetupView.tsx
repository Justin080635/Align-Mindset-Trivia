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
  ArrowLeft,
  Target,
  Trophy,
  Coins,
  Compass,
  Lightbulb,
  Radio,
  BookOpen,
  Activity,
  Cpu,
  Smile,
  Sliders,
  Award,
  Star
} from 'lucide-react';
import {
  PersonalityType,
  GameDifficulty,
  GameMode,
  PlayerProfile,
  HostPersona
} from '../types';
import { HOST_PERSONAS } from '../data/mockData';
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

interface MatchSetupViewProps {
  onBackToLobby: () => void;
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

export const MatchSetupView: React.FC<MatchSetupViewProps> = ({
  onBackToLobby,
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
  const estimatedXP = questionCount * 50;

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
    <div id="trivia-match-setup-page" className="space-y-6 animate-in fade-in duration-200 pb-12">
      
      {/* TOP NAVIGATION & PAGE TITLE HEADER */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-[#0a0a0a] p-5 sm:p-6 rounded-3xl border border-neutral-800 shadow-xl">
        <div className="flex items-center gap-3.5">
          <button
            type="button"
            onClick={() => {
              playSoundEffect('click');
              onBackToLobby();
            }}
            className="p-3 rounded-2xl bg-neutral-950 hover:bg-neutral-900 text-neutral-300 hover:text-amber-300 border border-neutral-800 transition-all flex items-center gap-2 cursor-pointer shadow-md group"
            title="Back to Trivia Arena"
          >
            <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
            <span className="text-xs font-bold hidden sm:inline">Back to Arena</span>
          </button>

          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full bg-amber-400/20 text-amber-300 border border-amber-400/40 text-[10px] font-black uppercase tracking-wider">
                Step 2 of 2 • Game Setup
              </span>
              <span className="text-xs text-neutral-400 hidden sm:inline font-medium">
                Set topic, host & match parameters
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight mt-0.5">
              Customize Your Trivia Match
            </h1>
          </div>
        </div>

        {/* Quick Launch CTA in Top Bar - Brushed Gold */}
        <button
          type="button"
          onClick={onLaunchGame}
          disabled={isLoadingQuestions}
          className="w-full sm:w-auto px-7 py-3.5 rounded-2xl bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 hover:from-amber-300 hover:to-yellow-300 text-neutral-950 font-black text-sm uppercase tracking-wider shadow-lg shadow-amber-500/25 flex items-center justify-center gap-2 transition-all hover:scale-[1.03] active:scale-[0.97] cursor-pointer disabled:opacity-50 border border-amber-300/40"
        >
          {isLoadingQuestions ? (
            <>
              <div className="w-4 h-4 border-2 border-neutral-950 border-t-transparent rounded-full animate-spin" />
              <span>Preparing Questions...</span>
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4 fill-current" />
              <span>Let's Go! 🚀</span>
            </>
          )}
        </button>
      </div>

      {/* SECTION 1: TRIVIA TOPIC SELECTION (DROP-DOWN MENU + CUSTOM AI SEARCH) */}
      <div className="rounded-3xl p-6 sm:p-7 bg-[#0a0a0a] border border-neutral-800 shadow-xl space-y-4 relative">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-amber-400/20 text-amber-300 border border-amber-400/40 flex items-center justify-center text-xs font-black">1</span>
              <h2 className="text-base sm:text-lg font-black text-white uppercase tracking-wider flex items-center gap-2">
                <Brain className="w-4 h-4 text-amber-400" />
                <span>Choose Trivia Topic (Drop-Down Menu)</span>
              </h2>
            </div>
            <p className="text-xs text-neutral-400 mt-1 pl-8">
              Pick a specialized channel or enter any subject of your choice.
            </p>
          </div>

          {isCustomTopicActive && (
            <span className="text-[10px] font-bold px-3 py-1 rounded-full bg-amber-400/20 text-amber-300 border border-amber-400/40">
              Custom AI Topic Active
            </span>
          )}
        </div>

        {/* Main Topic Dropdown Selector Bar */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setIsCategoryDropdownOpen(!isCategoryDropdownOpen)}
            className="w-full p-4 sm:p-5 rounded-2xl bg-neutral-950 border border-neutral-800 hover:border-amber-400/60 transition-all flex items-center justify-between text-left group cursor-pointer shadow-inner focus:outline-none focus:ring-2 focus:ring-amber-400/30"
            aria-expanded={isCategoryDropdownOpen}
          >
            <div className="flex items-center gap-4 min-w-0">
              <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${currentCategoryObj.color} flex items-center justify-center text-white shrink-0 shadow-lg border border-white/10`}>
                <currentCategoryObj.icon className="w-6 h-6" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-base sm:text-lg font-extrabold text-white truncate block">
                    {selectedCategory}
                  </span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-neutral-900 text-amber-300 border border-neutral-800 shrink-0">
                    {currentCategoryObj.badge || 'Topic'}
                  </span>
                </div>
                <p className="text-xs text-neutral-400 truncate mt-0.5">
                  {currentCategoryObj.description}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0 ml-3">
              <span className="text-xs text-amber-400 font-bold hidden sm:inline group-hover:underline">
                {isCategoryDropdownOpen ? 'Close Menu' : 'Open Topic Menu'}
              </span>
              <div className={`p-2 rounded-xl bg-neutral-900 text-neutral-300 group-hover:text-white transition-transform ${isCategoryDropdownOpen ? 'rotate-180' : ''}`}>
                <ChevronDown className="w-4 h-4" />
              </div>
            </div>
          </button>

          {/* DROPDOWN MENU ACCORDION PANEL */}
          <AnimatePresence>
            {isCategoryDropdownOpen && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                className="absolute top-full left-0 right-0 mt-2 p-4 bg-[#0c0c0c] border border-amber-500/40 rounded-2xl shadow-2xl z-40 max-h-96 overflow-y-auto space-y-3 backdrop-blur-xl"
              >
                {/* Custom Topic Generator Search Bar */}
                <div className="p-3 bg-neutral-950 rounded-xl border border-neutral-800 space-y-2">
                  <span className="text-xs font-bold text-neutral-200 block flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                    <span>Have a specific topic in mind? Type any custom subject:</span>
                  </span>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={customTopicInput}
                      onChange={e => setCustomTopicInput(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && handleApplyCustomTopic()}
                      placeholder="e.g. Quantum Physics, Star Wars Lore, 90s Hip Hop, World Capitals..."
                      className="flex-1 px-3.5 py-2.5 rounded-xl bg-neutral-900 border border-neutral-800 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-amber-400"
                    />
                    <button
                      type="button"
                      onClick={handleApplyCustomTopic}
                      disabled={!customTopicInput.trim()}
                      className="px-4 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 disabled:opacity-40 text-neutral-950 font-black text-xs transition-all cursor-pointer shrink-0 shadow-md"
                    >
                      Set Topic
                    </button>
                  </div>
                </div>

                <div className="text-[10px] font-black uppercase text-amber-400/90 px-1 pt-1 tracking-wider">
                  Or select a curated topic channel:
                </div>

                {/* Curated List of Categories */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
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
                        className={`p-3 rounded-xl text-left border transition-all flex items-start gap-3 cursor-pointer ${
                          isSelected
                            ? 'bg-neutral-900 border-amber-400 ring-2 ring-amber-400/40 text-white shadow-md'
                            : 'bg-neutral-950/90 border-neutral-800 hover:border-neutral-700 text-neutral-300 hover:bg-neutral-900'
                        }`}
                      >
                        <div className={`p-2 rounded-xl bg-gradient-to-br ${cat.color} text-white shrink-0 shadow-sm mt-0.5`}>
                          <Icon className="w-4 h-4" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between gap-1">
                            <span className="font-bold text-xs text-white truncate block">
                              {cat.name}
                            </span>
                            {isSelected && <Check className="w-3.5 h-3.5 text-amber-400 shrink-0" />}
                          </div>
                          <span className="text-[10px] text-neutral-400 line-clamp-2 mt-0.5">
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

        {/* Quick Topic Switch Chips */}
        <div className="flex flex-wrap items-center gap-1.5 pt-1">
          <span className="text-[10px] text-neutral-400 font-bold uppercase tracking-wider mr-1">Quick Select:</span>
          {EXTENDED_TRIVIA_CATEGORIES.map(cat => (
            <button
              key={cat.id}
              type="button"
              onClick={() => {
                playSoundEffect('click');
                setSelectedCategory(cat.name);
                setIsCustomTopicActive(false);
              }}
              className={`px-3 py-1 rounded-xl text-xs font-semibold transition-all border cursor-pointer ${
                selectedCategory === cat.name
                  ? 'bg-amber-400/20 text-amber-300 border-amber-400/50 font-bold shadow-sm'
                  : 'bg-neutral-950 text-neutral-400 border-neutral-800 hover:border-neutral-700 hover:text-white'
              }`}
            >
              {cat.name.split(' ')[0]} {cat.name.includes('&') ? '& More' : ''}
            </button>
          ))}
        </div>
      </div>

      {/* SECTION 2: AI HOST SELECTION */}
      <div className="rounded-3xl p-6 sm:p-7 bg-[#0a0a0a] border border-neutral-800 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-amber-400/20 text-amber-300 border border-amber-400/40 flex items-center justify-center text-xs font-black">2</span>
              <h2 className="text-base sm:text-lg font-black text-white uppercase tracking-wider flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-400" />
                <span>Select Your AI Host</span>
              </h2>
            </div>
            <p className="text-xs text-neutral-400 mt-1 pl-8">
              Each host has a distinct voice tone, quip style, and cheering personality.
            </p>
          </div>

          <div className="text-xs text-neutral-400 pl-8 sm:pl-0">
            Selected: <strong className="text-white">{activeHost.name}</strong> • <span className="text-amber-400">{activeHost.archetype}</span>
          </div>
        </div>

        {/* 5 Hosts Card Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5 pt-1">
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
                className={`p-4 rounded-2xl border text-center transition-all flex flex-col justify-between cursor-pointer relative group ${
                  isSelected
                    ? 'bg-neutral-900 border-amber-400 ring-2 ring-amber-400/40 shadow-xl shadow-amber-500/10'
                    : 'bg-neutral-950/80 border-neutral-800 hover:border-neutral-700 hover:bg-neutral-900/90'
                }`}
              >
                {isSelected && (
                  <div className="absolute top-3 right-3 px-2 py-0.5 rounded-full bg-emerald-500 text-neutral-950 text-[9px] font-black uppercase tracking-wider flex items-center gap-1 shadow-md">
                    <Check className="w-2.5 h-2.5 stroke-[3]" />
                    <span>Active</span>
                  </div>
                )}

                <div className="flex flex-col items-center space-y-2 w-full">
                  <HostVectorGraphic hostId={h.id} size="md" />
                  <div>
                    <span className="text-sm font-extrabold text-white block">{h.name}</span>
                    <span className="text-xs text-emerald-400 font-semibold block">{h.archetype}</span>
                  </div>
                  <p className="text-[11px] text-neutral-400 line-clamp-2 leading-relaxed">
                    {h.bio}
                  </p>
                </div>

                {/* Voice Preview Button */}
                <button
                  type="button"
                  onClick={e => handleTestHostVoice(e, h)}
                  className={`mt-3 w-full py-2 rounded-xl text-xs font-bold transition-all border flex items-center justify-center gap-1.5 cursor-pointer ${
                    isVoicePlaying
                      ? 'bg-amber-500 text-neutral-950 border-amber-400 animate-pulse font-black shadow-md'
                      : 'bg-neutral-900 text-neutral-300 hover:text-white border-neutral-800 hover:border-neutral-700'
                  }`}
                  title={`Listen to ${h.name}'s voice`}
                >
                  {isVoicePlaying ? (
                    <>
                      <Square className="w-3 h-3 fill-current" />
                      <span>Stop Voice</span>
                    </>
                  ) : (
                    <>
                      <Volume2 className="w-3 h-3 text-amber-400" />
                      <span>Hear Voice</span>
                    </>
                  )}
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* SECTION 3: MATCH RULES (DIFFICULTY, GAME MODE, QUESTION COUNT) */}
      <div className="rounded-3xl p-6 sm:p-7 bg-[#0a0a0a] border border-neutral-800 shadow-xl space-y-4">
        <div className="flex items-center gap-2">
          <span className="w-6 h-6 rounded-lg bg-amber-400/20 text-amber-300 border border-amber-400/40 flex items-center justify-center text-xs font-black">3</span>
          <h2 className="text-base sm:text-lg font-black text-white uppercase tracking-wider flex items-center gap-2">
            <Sliders className="w-4 h-4 text-amber-400" />
            <span>Match Rules & Difficulty</span>
          </h2>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 pt-1">
          
          {/* Difficulty Level */}
          <div className="p-5 rounded-2xl bg-neutral-950/90 border border-neutral-800 space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-black text-neutral-300 uppercase tracking-wider">
                Difficulty Level
              </label>
              <span className="text-xs font-black text-amber-400">{estimatedLPReward}</span>
            </div>

            <div className="grid grid-cols-2 gap-2">
              {(['Rookie', 'Pro', 'Expert', 'Legend'] as GameDifficulty[]).map(diff => (
                <button
                  key={diff}
                  type="button"
                  onClick={() => {
                    playSoundEffect('click');
                    setSelectedDifficulty(diff);
                  }}
                  className={`py-3 rounded-xl text-xs font-bold transition-all border cursor-pointer flex flex-col items-center justify-center gap-0.5 ${
                    selectedDifficulty === diff
                      ? 'bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 text-neutral-950 border-amber-300 shadow-md font-black'
                      : 'bg-neutral-900 text-neutral-300 border-neutral-800 hover:border-neutral-700 hover:text-white'
                  }`}
                >
                  <span>{diff}</span>
                  <span className={`text-[9px] ${selectedDifficulty === diff ? 'text-neutral-950/80 font-bold' : 'text-neutral-500'}`}>
                    {diff === 'Rookie' ? 'Beginner' : diff === 'Pro' ? 'Standard' : diff === 'Expert' ? 'Advanced' : 'Mastery'}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Game Mode */}
          <div className="p-5 rounded-2xl bg-neutral-950/90 border border-neutral-800 space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-black text-neutral-300 uppercase tracking-wider">
                Game Mode
              </label>
              <span className="text-xs font-black text-amber-400">
                {gameMode === 'blitz' ? '10s Clock' : gameMode === 'mindset_reflection' ? 'Untimed' : '15s Clock'}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2">
              {[
                { id: 'standard', name: 'Classic', desc: '15s clock', icon: Clock },
                { id: 'blitz', name: 'Speed Blitz', desc: '10s clock', icon: Zap },
                { id: 'survival', name: 'Sudden Death', desc: '1 strike out', icon: Shield },
                { id: 'mindset_reflection', name: 'Zen Mode', desc: 'Untimed', icon: Brain }
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
                    className={`p-2.5 rounded-xl text-left border transition-all cursor-pointer flex flex-col justify-between ${
                      gameMode === m.id
                        ? 'bg-neutral-900 text-white border-amber-400 ring-1 ring-amber-400/50 shadow-md font-bold'
                        : 'bg-neutral-900 text-neutral-300 border-neutral-800 hover:border-neutral-700'
                    }`}
                  >
                    <div className="flex items-center gap-1.5">
                      <Icon className={`w-3.5 h-3.5 ${gameMode === m.id ? 'text-amber-400' : 'opacity-80'}`} />
                      <span className="text-xs font-bold">{m.name}</span>
                    </div>
                    <span className={`text-[10px] mt-1 ${gameMode === m.id ? 'text-amber-200/80' : 'text-neutral-500'}`}>
                      {m.desc}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Questions Count */}
          <div className="p-5 rounded-2xl bg-neutral-950/90 border border-neutral-800 space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-black text-neutral-300 uppercase tracking-wider">
                Question Count
              </label>
              <span className="text-xs font-black text-amber-400">~{questionCount * 15}s total</span>
            </div>

            <div className="grid grid-cols-3 gap-2">
              {[5, 8, 10].map(cnt => (
                <button
                  key={cnt}
                  type="button"
                  onClick={() => {
                    playSoundEffect('click');
                    setQuestionCount(cnt);
                  }}
                  className={`py-3 rounded-xl text-xs font-bold transition-all border cursor-pointer flex flex-col items-center justify-center ${
                    questionCount === cnt
                      ? 'bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 text-neutral-950 border-amber-300 shadow-md font-black'
                      : 'bg-neutral-900 text-neutral-300 border-neutral-800 hover:border-neutral-700 hover:text-white'
                  }`}
                >
                  <span className="text-sm font-black">{cnt}</span>
                  <span className={`text-[10px] ${questionCount === cnt ? 'text-neutral-950/80 font-bold' : 'text-neutral-500'}`}>
                    Questions
                  </span>
                </button>
              ))}
            </div>
          </div>

        </div>
      </div>

      {/* SECTION 4: POTENTIAL REWARDS & BIG "LET'S GO!" FINAL CTA BANNER */}
      <div className="rounded-3xl p-6 sm:p-8 bg-[#0a0a0a] border-2 border-amber-400/50 shadow-2xl flex flex-col md:flex-row items-center justify-between gap-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-amber-400/10 rounded-full blur-3xl pointer-events-none" />

        <div className="space-y-2 text-center md:text-left relative z-10">
          <div className="flex items-center justify-center md:justify-start gap-2">
            <span className="text-xs font-black uppercase text-amber-400 tracking-wider flex items-center gap-1">
              <Trophy className="w-4 h-4 text-amber-400" />
              <span>Estimated Match Payout</span>
            </span>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-400/20 text-amber-300 font-bold border border-amber-400/40">
              Active Streak Multiplier
            </span>
          </div>

          <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 pt-1">
            <div className="px-3.5 py-1.5 rounded-xl bg-neutral-950 border border-neutral-800 text-center">
              <span className="text-[9px] text-neutral-400 uppercase font-bold block">League Points</span>
              <span className="text-sm font-black text-amber-400">{estimatedLPReward}</span>
            </div>
            <div className="px-3.5 py-1.5 rounded-xl bg-neutral-950 border border-neutral-800 text-center">
              <span className="text-[9px] text-neutral-400 uppercase font-bold block">XP Gain</span>
              <span className="text-sm font-black text-white">+{estimatedXP} XP</span>
            </div>
            <div className="px-3.5 py-1.5 rounded-xl bg-neutral-950 border border-neutral-800 text-center">
              <span className="text-[9px] text-neutral-400 uppercase font-bold block">Bonus Coins</span>
              <span className="text-sm font-black text-amber-300">~{estimatedCoins} Coins</span>
            </div>
          </div>
        </div>

        {/* The Final Let's Go CTA Button */}
        <div className="relative z-10 shrink-0 w-full md:w-auto">
          <button
            id="lets-go-final-match-cta"
            type="button"
            onClick={onLaunchGame}
            disabled={isLoadingQuestions}
            className="w-full md:w-auto px-10 py-5 rounded-2xl bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 hover:from-amber-300 hover:to-yellow-300 text-neutral-950 font-black text-lg sm:text-xl uppercase tracking-wider shadow-2xl shadow-amber-500/25 flex items-center justify-center gap-3 transition-all hover:scale-[1.04] active:scale-[0.96] cursor-pointer disabled:opacity-50 border border-amber-300/40"
          >
            {isLoadingQuestions ? (
              <>
                <div className="w-6 h-6 border-3 border-neutral-950 border-t-transparent rounded-full animate-spin" />
                <span>Launching Match...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-6 h-6 fill-current" />
                <span>Let's Go! 🚀</span>
                <ArrowRight className="w-6 h-6 stroke-[3]" />
              </>
            )}
          </button>
        </div>
      </div>

    </div>
  );
};
