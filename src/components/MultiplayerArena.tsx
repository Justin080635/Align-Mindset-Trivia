import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import confetti from 'canvas-confetti';
import {
  Users,
  Swords,
  Radio,
  Copy,
  Check,
  Share2,
  Trophy,
  Zap,
  Flame,
  Crown,
  Play,
  ArrowRight,
  RotateCcw,
  Sparkles,
  Shield,
  Clock,
  CheckCircle2,
  XCircle,
  Plus,
  MessageSquare,
  Volume2,
  VolumeX,
  Award,
  ChevronRight,
  ChevronLeft,
  Hash,
  BrainCircuit,
  Target
} from 'lucide-react';
import {
  PlayerProfile,
  PersonalityType,
  GameDifficulty,
  Question,
  MultiplayerRoom,
  RoomPlayer
} from '../types';
import { HOST_PERSONAS, TRIVIA_CATEGORIES, getFallbackQuestionsByCategory } from '../data/mockData';
import { HostVectorGraphic } from './HostVectorGraphic';
import { playSoundEffect, playHostTTS, stopAudioSpeech } from '../utils/audio';

interface MultiplayerArenaProps {
  profile: PlayerProfile;
  setProfile: React.Dispatch<React.SetStateAction<PlayerProfile>>;
  onOpenSocialHub: () => void;
  onBackToSolo: () => void;
}

const BOT_CHALLENGERS: Omit<RoomPlayer, 'isHost' | 'isReady' | 'score' | 'streak' | 'lastAnswerIndex' | 'lastAnswerCorrect' | 'lastAnswerTimeMs' | 'isFinished'>[] = [
  {
    id: 'bot-maya',
    username: 'Maya Vance',
    handle: '@maya_neuro',
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    isBot: true,
    reactionSpeedLabel: 'Fast Reflexes (1.2s)'
  },
  {
    id: 'bot-alex',
    username: 'Alex Rivera',
    handle: '@alex_speed',
    avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    isBot: true,
    reactionSpeedLabel: 'Lightning (0.9s)'
  },
  {
    id: 'bot-jordan',
    username: 'Jordan Lee',
    handle: '@jordan_grit',
    avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
    isBot: true,
    reactionSpeedLabel: 'Mindset Master (1.5s)'
  },
  {
    id: 'bot-chloe',
    username: 'Chloe Bennett',
    handle: '@chloe_zen',
    avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
    isBot: true,
    reactionSpeedLabel: 'High Accuracy (1.8s)'
  }
];

const PRESET_PUBLIC_ROOMS = [
  {
    code: 'MIND-77',
    name: 'Neuroscience Speed Clash',
    host: 'Maya Vance',
    players: 3,
    maxPlayers: 4,
    category: 'Brain Science & Neuroplasticity',
    difficulty: 'Pro'
  },
  {
    code: 'DUEL-42',
    name: '1v1 Stoic Grit Showdown',
    host: 'Coach Marcus AI',
    players: 1,
    maxPlayers: 2,
    category: 'Mindset Philosophy & Stoicism',
    difficulty: 'Expert'
  },
  {
    code: 'SQUAD-99',
    name: 'Friday Squad Trivia Party',
    host: 'Alex Rivera',
    players: 5,
    maxPlayers: 8,
    category: 'Mixed Bag (The All-Rounder)',
    difficulty: 'Pro'
  }
];

const TAUNT_ITEMS = [
  { id: 'brain', icon: BrainCircuit, color: 'text-cyan-400', text: 'Big Brain Time!' },
  { id: 'speed', icon: Zap, color: 'text-amber-400', text: 'Too Fast!' },
  { id: 'streak', icon: Flame, color: 'text-rose-400', text: 'Unstoppable Streak!' },
  { id: 'focus', icon: Sparkles, color: 'text-teal-400', text: 'Pure Flow State!' },
  { id: 'target', icon: Target, color: 'text-emerald-400', text: 'Bullseye accuracy!' }
];

export const MultiplayerArena: React.FC<MultiplayerArenaProps> = ({
  profile,
  setProfile,
  onOpenSocialHub,
  onBackToSolo
}) => {
  // Navigation & Room state
  const [viewState, setViewState] = useState<'hub' | 'lobby' | 'countdown' | 'match' | 'podium'>('hub');
  const [activeTab, setActiveTab] = useState<'create' | 'join'>('create');
  
  // Create room options
  const [roomMode, setRoomMode] = useState<'duel' | 'party'>('duel');
  const [roomName, setRoomName] = useState<string>('Mindset Head-to-Head Duel');
  const [selectedCategory, setSelectedCategory] = useState<string>('Brain Science & Neuroplasticity');
  const [selectedDifficulty, setSelectedDifficulty] = useState<GameDifficulty>('Pro');
  const [selectedHost, setSelectedHost] = useState<PersonalityType>('Nova');
  const [questionCount, setQuestionCount] = useState<number>(5);

  // Join room input
  const [joinCodeInput, setJoinCodeInput] = useState<string>('');
  const [copiedCode, setCopiedCode] = useState<boolean>(false);
  const [copiedLink, setCopiedLink] = useState<boolean>(false);
  
  // Live Room state
  const [activeRoom, setActiveRoom] = useState<MultiplayerRoom | null>(null);
  const [isUserReady, setIsUserReady] = useState<boolean>(false);
  const [countdownSeconds, setCountdownSeconds] = useState<number>(3);
  
  // Match gameplay state
  const [currentQIndex, setCurrentQIndex] = useState<number>(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [hasAnswered, setHasAnswered] = useState<boolean>(false);
  const [isRoundFinished, setIsRoundFinished] = useState<boolean>(false);
  const [timeLeft, setTimeLeft] = useState<number>(15);
  const [hostDialogue, setHostDialogue] = useState<string>('');
  const [liveTaunts, setLiveTaunts] = useState<{ id: string; player: string; emoji: string; text: string }[]>([]);
  const questionStartTimeRef = useRef<number>(Date.now());
  const timerRef = useRef<any>(null);

  // Host configuration
  const host = HOST_PERSONAS[activeRoom?.hostPersona || selectedHost] || HOST_PERSONAS['Nova'];

  // Helper: Speak Dialogue
  const speak = useCallback((text: string) => {
    if (profile.voiceEnabled) {
      playHostTTS(text, host.voiceName, profile.narrationSpeed);
    }
  }, [profile.voiceEnabled, host.voiceName, profile.narrationSpeed]);

  // Create a new multiplayer room
  const handleCreateRoom = () => {
    playSoundEffect('click');
    const randomCode = `${roomMode === 'duel' ? 'DUEL' : 'SQUAD'}-${Math.floor(10 + Math.random() * 90)}`;
    const questions = getFallbackQuestionsByCategory(selectedCategory, questionCount);

    const currentUserPlayer: RoomPlayer = {
      id: profile.id || 'user-1',
      username: profile.username,
      handle: profile.handle,
      avatarUrl: profile.avatarUrl,
      isHost: true,
      isReady: true,
      score: 0,
      streak: 0,
      lastAnswerIndex: null,
      lastAnswerCorrect: null,
      lastAnswerTimeMs: 0,
      isFinished: false
    };

    // Add a default challenger for 1v1 duel or squad
    const initialOpponents: RoomPlayer[] = roomMode === 'duel'
      ? [
          {
            ...BOT_CHALLENGERS[0],
            isHost: false,
            isReady: true,
            score: 0,
            streak: 0,
            lastAnswerIndex: null,
            lastAnswerCorrect: null,
            lastAnswerTimeMs: 0,
            isFinished: false
          }
        ]
      : [
          {
            ...BOT_CHALLENGERS[0],
            isHost: false,
            isReady: true,
            score: 0,
            streak: 0,
            lastAnswerIndex: null,
            lastAnswerCorrect: null,
            lastAnswerTimeMs: 0,
            isFinished: false
          },
          {
            ...BOT_CHALLENGERS[1],
            isHost: false,
            isReady: true,
            score: 0,
            streak: 0,
            lastAnswerIndex: null,
            lastAnswerCorrect: null,
            lastAnswerTimeMs: 0,
            isFinished: false
          }
        ];

    const newRoom: MultiplayerRoom = {
      id: `room-${Date.now()}`,
      code: randomCode,
      name: roomName || `${selectedCategory} Clash`,
      mode: roomMode,
      maxPlayers: roomMode === 'duel' ? 2 : 8,
      category: selectedCategory,
      difficulty: selectedDifficulty,
      hostPersona: selectedHost,
      questionCount,
      status: 'lobby',
      currentQuestionIndex: 0,
      players: [currentUserPlayer, ...initialOpponents],
      questions,
      createdAt: new Date().toISOString()
    };

    setActiveRoom(newRoom);
    setIsUserReady(true);
    setViewState('lobby');

    const welcome = `Welcome to the Multiplayer Stage! Room ${randomCode} is live. Contestants, prepare for ${selectedCategory}!`;
    setHostDialogue(welcome);
    speak(welcome);
  };

  // Join room with code
  const handleJoinWithCode = (codeToJoin?: string) => {
    const code = (codeToJoin || joinCodeInput).trim().toUpperCase();
    if (!code) return;
    playSoundEffect('click');

    const questions = getFallbackQuestionsByCategory('Brain Science & Neuroplasticity', 5);
    const currentUserPlayer: RoomPlayer = {
      id: profile.id || 'user-1',
      username: profile.username,
      handle: profile.handle,
      avatarUrl: profile.avatarUrl,
      isHost: false,
      isReady: true,
      score: 0,
      streak: 0,
      lastAnswerIndex: null,
      lastAnswerCorrect: null,
      lastAnswerTimeMs: 0,
      isFinished: false
    };

    const hostOpponent: RoomPlayer = {
      ...BOT_CHALLENGERS[1],
      isHost: true,
      isReady: true,
      score: 0,
      streak: 0,
      lastAnswerIndex: null,
      lastAnswerCorrect: null,
      lastAnswerTimeMs: 0,
      isFinished: false
    };

    const joinedRoom: MultiplayerRoom = {
      id: `room-${Date.now()}`,
      code,
      name: `${code} Live Arena Showdown`,
      mode: code.startsWith('DUEL') ? 'duel' : 'party',
      maxPlayers: 4,
      category: 'Brain Science & Neuroplasticity',
      difficulty: 'Pro',
      hostPersona: 'Nova',
      questionCount: 5,
      status: 'lobby',
      currentQuestionIndex: 0,
      players: [hostOpponent, currentUserPlayer],
      questions,
      createdAt: new Date().toISOString()
    };

    setActiveRoom(joinedRoom);
    setIsUserReady(true);
    setViewState('lobby');
  };

  // Add another Challenger Bot to Room
  const handleAddChallenger = () => {
    if (!activeRoom || activeRoom.players.length >= activeRoom.maxPlayers) return;
    playSoundEffect('click');

    const availableBots = BOT_CHALLENGERS.filter(
      b => !activeRoom.players.some(p => p.id === b.id)
    );

    if (availableBots.length === 0) return;
    const nextBot = availableBots[0];

    const newPlayer: RoomPlayer = {
      ...nextBot,
      isHost: false,
      isReady: true,
      score: 0,
      streak: 0,
      lastAnswerIndex: null,
      lastAnswerCorrect: null,
      lastAnswerTimeMs: 0,
      isFinished: false
    };

    setActiveRoom(prev => prev ? {
      ...prev,
      players: [...prev.players, newPlayer]
    } : null);

    playSoundEffect('lifeline');
  };

  // Copy Room Code
  const handleCopyCode = () => {
    if (!activeRoom) return;
    navigator.clipboard.writeText(activeRoom.code);
    setCopiedCode(true);
    playSoundEffect('click');
    setTimeout(() => setCopiedCode(false), 2000);
  };

  // Copy Invite Link
  const handleCopyLink = () => {
    if (!activeRoom) return;
    const shareUrl = `${window.location.origin}?room=${activeRoom.code}`;
    navigator.clipboard.writeText(shareUrl);
    setCopiedLink(true);
    playSoundEffect('click');
    setTimeout(() => setCopiedLink(false), 2000);
  };

  // Trigger Send Live Taunt
  const handleSendTaunt = (tauntId: string, text: string) => {
    if (!activeRoom) return;
    playSoundEffect('click');
    const newTaunt = {
      id: `taunt-${Date.now()}`,
      player: profile.username,
      tauntId,
      text
    };
    setLiveTaunts(prev => [newTaunt, ...prev.slice(0, 4)]);
    setTimeout(() => {
      setLiveTaunts(prev => prev.filter(t => t.id !== newTaunt.id));
    }, 3500);
  };

  // Start Countdown to Match
  const handleStartMatch = () => {
    if (!activeRoom) return;
    playSoundEffect('fanfare');
    setViewState('countdown');
    setCountdownSeconds(3);

    const countdownInterval = setInterval(() => {
      setCountdownSeconds(prev => {
        if (prev <= 1) {
          clearInterval(countdownInterval);
          startRoundQuestion(0);
          return 0;
        }
        playSoundEffect('tick');
        return prev - 1;
      });
    }, 1000);
  };

  // Start question round
  const startRoundQuestion = (qIndex: number) => {
    if (!activeRoom) return;
    setCurrentQIndex(qIndex);
    setSelectedOption(null);
    setHasAnswered(false);
    setIsRoundFinished(false);
    setTimeLeft(15);
    setViewState('match');
    questionStartTimeRef.current = Date.now();

    // Reset bot states for new question
    setActiveRoom(prev => {
      if (!prev) return null;
      return {
        ...prev,
        currentQuestionIndex: qIndex,
        players: prev.players.map(p => ({
          ...p,
          lastAnswerIndex: null,
          lastAnswerCorrect: null,
          lastAnswerTimeMs: 0
        }))
      };
    });

    const currentQ = activeRoom.questions[qIndex];
    if (currentQ) {
      const qCommentary = `Question ${qIndex + 1}: ${currentQ.question}`;
      setHostDialogue(qCommentary);
      speak(qCommentary);
    }
  };

  // Question Timer Effect
  useEffect(() => {
    if (viewState !== 'match' || isRoundFinished) {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }

    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timerRef.current!);
          handleFinishRound();
          return 0;
        }
        if (prev <= 4 && profile.soundEnabled) {
          playSoundEffect('tick');
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [viewState, isRoundFinished, profile.soundEnabled]);

  // Simulate Opponents Answering
  useEffect(() => {
    if (viewState !== 'match' || isRoundFinished || !activeRoom) return;

    const currentQ = activeRoom.questions[currentQIndex];
    if (!currentQ) return;

    const timeoutIds: any[] = [];

    // Schedule bots answering with random speed and accuracy
    activeRoom.players.forEach(p => {
      if (!p.isBot) return;

      const answerDelay = 1200 + Math.random() * 5000;
      const isCorrect = Math.random() < 0.8; // 80% accuracy for bots
      const answerIndex = isCorrect ? currentQ.correctIndex : (currentQ.correctIndex + 1) % 4;

      const tId = setTimeout(() => {
        setActiveRoom(prev => {
          if (!prev || isRoundFinished) return prev;
          const pointsEarned = isCorrect ? Math.round(150 + (15 - answerDelay / 1000) * 10) : 0;

          return {
            ...prev,
            players: prev.players.map(pl => {
              if (pl.id !== p.id) return pl;
              return {
                ...pl,
                score: pl.score + pointsEarned,
                streak: isCorrect ? pl.streak + 1 : 0,
                lastAnswerIndex: answerIndex,
                lastAnswerCorrect: isCorrect,
                lastAnswerTimeMs: Math.round(answerDelay)
              };
            })
          };
        });
      }, answerDelay);

      timeoutIds.push(tId);
    });

    return () => {
      timeoutIds.forEach(id => clearTimeout(id));
    };
  }, [viewState, currentQIndex, isRoundFinished]);

  // User Submits Answer
  const handleAnswerOption = (index: number) => {
    if (hasAnswered || isRoundFinished || !activeRoom) return;
    const currentQ = activeRoom.questions[currentQIndex];
    if (!currentQ) return;

    setSelectedOption(index);
    setHasAnswered(true);

    const elapsedMs = Date.now() - questionStartTimeRef.current;
    const isCorrect = index === currentQ.correctIndex;
    const basePoints = isCorrect ? 200 : 0;
    const speedBonus = isCorrect ? Math.max(0, Math.round((15 - elapsedMs / 1000) * 15)) : 0;
    const totalPoints = basePoints + speedBonus;

    if (isCorrect) {
      playSoundEffect('correct');
    } else {
      playSoundEffect('incorrect');
    }

    // Update active player state
    setActiveRoom(prev => {
      if (!prev) return null;
      return {
        ...prev,
        players: prev.players.map(pl => {
          if (pl.id !== (profile.id || 'user-1')) return pl;
          return {
            ...pl,
            score: pl.score + totalPoints,
            streak: isCorrect ? pl.streak + 1 : 0,
            lastAnswerIndex: index,
            lastAnswerCorrect: isCorrect,
            lastAnswerTimeMs: elapsedMs
          };
        })
      };
    });

    // Host reaction
    const reaction = isCorrect
      ? `Boom! ${profile.username} locked in with speed (+${totalPoints} pts)!`
      : `Tough miss, ${profile.username}! Regroup on the next question!`;
    setHostDialogue(reaction);
  };

  // Round Finished & Transition
  const handleFinishRound = () => {
    setIsRoundFinished(true);
    if (!activeRoom) return;

    setTimeout(() => {
      const nextIndex = currentQIndex + 1;
      if (nextIndex < activeRoom.questions.length) {
        startRoundQuestion(nextIndex);
      } else {
        // Match Over -> Go to Podium
        handleGameOver();
      }
    }, 3000);
  };

  // Game Over: Celebrate Podium
  const handleGameOver = () => {
    setViewState('podium');
    playSoundEffect('fanfare');

    // Confetti shower
    try {
      confetti({
        particleCount: 120,
        spread: 80,
        origin: { y: 0.6 }
      });
    } catch {}

    // Award LP to profile
    const sortedPlayers = [...(activeRoom?.players || [])].sort((a, b) => b.score - a.score);
    const userRank = sortedPlayers.findIndex(p => p.id === (profile.id || 'user-1')) + 1;
    const pointsDelta = userRank === 1 ? 75 : userRank === 2 ? 35 : 15;

    setProfile(prev => ({
      ...prev,
      rankPoints: prev.rankPoints + pointsDelta,
      totalGames: prev.totalGames + 1,
      highestStreak: Math.max(prev.highestStreak, sortedPlayers.find(p => p.id === (profile.id || 'user-1'))?.streak || 0)
    }));
  };

  // Current Question Object
  const currentQuestion = activeRoom?.questions[currentQIndex];

  // Ranked Players for Live Display
  const rankedPlayers = [...(activeRoom?.players || [])].sort((a, b) => b.score - a.score);

  return (
    <div id="multiplayer-arena-view" className="space-y-6 animate-in fade-in duration-200">
      
      {/* TOP HEADER & BREADCRUMB */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-neutral-900 via-neutral-900 to-neutral-950 p-6 rounded-3xl border border-neutral-800 shadow-xl">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-cyan-500 via-teal-500 to-emerald-500 flex items-center justify-center text-neutral-950 font-black shadow-lg shadow-cyan-500/20">
            <Swords className="w-6 h-6 stroke-[2.5]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
                Live Multiplayer Arena
              </span>
              <span className="text-xs text-neutral-400 font-medium">
                1v1 Duels & Squad Party Rooms
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
              Head-to-Head Trivia Arena
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              playSoundEffect('click');
              onBackToSolo();
            }}
            className="px-4 py-2 rounded-xl text-xs font-bold text-neutral-300 hover:text-white bg-neutral-950 hover:bg-neutral-800 border border-neutral-800 transition-colors"
          >
            ← Back to Solo Arena
          </button>
        </div>
      </div>

      {/* VIEW 1: HUB / CREATE & JOIN SELECTION */}
      {viewState === 'hub' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* LEFT: CREATE / JOIN PANEL */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Tabs (Create Room vs Join with Code) */}
            <div className="bg-neutral-900/80 p-6 rounded-3xl border border-neutral-800 space-y-5">
              <div className="grid grid-cols-2 gap-2 bg-neutral-950 p-1 rounded-2xl border border-neutral-800">
                <button
                  onClick={() => {
                    playSoundEffect('click');
                    setActiveTab('create');
                  }}
                  className={`py-3 rounded-xl text-xs font-extrabold transition-all flex items-center justify-center gap-2 ${
                    activeTab === 'create'
                      ? 'bg-neutral-800 text-white shadow-md border border-neutral-700'
                      : 'text-neutral-400 hover:text-neutral-200'
                  }`}
                >
                  <Plus className="w-4 h-4 text-emerald-400" />
                  <span>Host New Room</span>
                </button>

                <button
                  onClick={() => {
                    playSoundEffect('click');
                    setActiveTab('join');
                  }}
                  className={`py-3 rounded-xl text-xs font-extrabold transition-all flex items-center justify-center gap-2 ${
                    activeTab === 'join'
                      ? 'bg-neutral-800 text-white shadow-md border border-neutral-700'
                      : 'text-neutral-400 hover:text-neutral-200'
                  }`}
                >
                  <Hash className="w-4 h-4 text-cyan-400" />
                  <span>Join with Invite Code</span>
                </button>
              </div>

              {/* CREATE ROOM FORM */}
              {activeTab === 'create' && (
                <div className="space-y-4">
                  {/* Mode Toggle (1v1 vs Squad) */}
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={() => {
                        playSoundEffect('click');
                        setRoomMode('duel');
                      }}
                      className={`p-4 rounded-2xl border text-left transition-all ${
                        roomMode === 'duel'
                          ? 'bg-emerald-950/40 border-emerald-500 ring-2 ring-emerald-500/20'
                          : 'bg-neutral-950/60 border-neutral-800 hover:border-neutral-700'
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <Swords className="w-5 h-5 text-emerald-400" />
                        <span className="font-extrabold text-sm text-white">1v1 Speed Duel</span>
                      </div>
                      <p className="text-xs text-neutral-400">Two players, maximum intensity speed battle.</p>
                    </button>

                    <button
                      onClick={() => {
                        playSoundEffect('click');
                        setRoomMode('party');
                      }}
                      className={`p-4 rounded-2xl border text-left transition-all ${
                        roomMode === 'party'
                          ? 'bg-cyan-950/40 border-cyan-500 ring-2 ring-cyan-500/20'
                          : 'bg-neutral-950/60 border-neutral-800 hover:border-neutral-700'
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <Users className="w-5 h-5 text-cyan-400" />
                        <span className="font-extrabold text-sm text-white">Squad Party (Up to 8)</span>
                      </div>
                      <p className="text-xs text-neutral-400">Invite friends, team members, or community rivals.</p>
                    </button>
                  </div>

                  {/* Room Name */}
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-neutral-300">Room Name</label>
                    <input
                      type="text"
                      value={roomName}
                      onChange={e => setRoomName(e.target.value)}
                      placeholder="e.g. Brainiacs Friday Clash"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-neutral-950 border border-neutral-800 text-white text-sm focus:border-emerald-500 focus:outline-none"
                    />
                  </div>

                  {/* Category Selection */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-neutral-300">Trivia Topic</label>
                    <select
                      value={selectedCategory}
                      onChange={e => setSelectedCategory(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-neutral-950 border border-neutral-800 text-white text-xs focus:border-emerald-500 focus:outline-none"
                    >
                      {TRIVIA_CATEGORIES.map(c => (
                        <option key={c.id} value={c.name}>{c.name}</option>
                      ))}
                    </select>
                  </div>

                  {/* Difficulty & Rounds */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-neutral-300">Difficulty</label>
                      <select
                        value={selectedDifficulty}
                        onChange={e => setSelectedDifficulty(e.target.value as GameDifficulty)}
                        className="w-full px-3 py-2 rounded-xl bg-neutral-950 border border-neutral-800 text-white text-xs focus:border-emerald-500 focus:outline-none"
                      >
                        {(['Rookie', 'Pro', 'Expert', 'Legend'] as GameDifficulty[]).map(d => (
                          <option key={d} value={d}>{d}</option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-bold text-neutral-300">Questions Count</label>
                      <select
                        value={questionCount}
                        onChange={e => setQuestionCount(Number(e.target.value))}
                        className="w-full px-3 py-2 rounded-xl bg-neutral-950 border border-neutral-800 text-white text-xs focus:border-emerald-500 focus:outline-none"
                      >
                        <option value={5}>5 Questions (Rapid)</option>
                        <option value={8}>8 Questions (Standard)</option>
                        <option value={10}>10 Questions (Championship)</option>
                      </select>
                    </div>
                  </div>

                  {/* AI Referee / Host Selector (Horizontal Scrolling Right) */}
                  <div className="space-y-2 pt-2">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-neutral-300 flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Match Referee & Host</span>
                      </label>
                      <span className="text-[10px] text-neutral-400 flex items-center gap-1">
                        <span>Scroll right</span>
                        <ChevronRight className="w-3 h-3 text-emerald-400" />
                      </span>
                    </div>

                    <div
                      className="flex items-center gap-2.5 overflow-x-auto pb-2 scroll-smooth snap-x snap-mandatory focus:outline-none"
                      style={{ scrollbarWidth: 'thin', scrollbarColor: '#334155 transparent' }}
                    >
                      {Object.values(HOST_PERSONAS).map(h => {
                        const isSel = selectedHost === h.id;
                        return (
                          <button
                            key={h.id}
                            type="button"
                            onClick={() => {
                              playSoundEffect('click');
                              setSelectedHost(h.id);
                            }}
                            className={`p-3 rounded-2xl border text-left transition-all flex items-center gap-3 w-[220px] shrink-0 snap-start cursor-pointer ${
                              isSel
                                ? 'bg-emerald-950/60 border-emerald-500 ring-1 ring-emerald-500 text-white'
                                : 'bg-neutral-950/70 border-neutral-800 hover:border-neutral-700 text-neutral-300'
                            }`}
                          >
                            <HostVectorGraphic hostId={h.id} size="sm" className="shrink-0" />
                            <div className="overflow-hidden">
                              <div className="flex items-center gap-1">
                                <span className="font-bold text-xs text-white truncate">{h.name}</span>
                                {isSel && <Check className="w-3 h-3 text-emerald-400 shrink-0" />}
                              </div>
                              <span className="text-[10px] text-neutral-400 block truncate">{h.archetype}</span>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Launch Room Button */}
                  <button
                    onClick={handleCreateRoom}
                    className="w-full py-4 rounded-2xl bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 text-neutral-950 font-black text-sm uppercase tracking-wider shadow-xl shadow-emerald-500/20 hover:scale-[1.01] active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer mt-4"
                  >
                    <Play className="w-5 h-5 fill-neutral-950" />
                    <span>Create & Launch Live Lobby</span>
                  </button>
                </div>
              )}

              {/* JOIN ROOM WITH CODE */}
              {activeTab === 'join' && (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-neutral-300">Enter 6-Character Room Code</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={joinCodeInput}
                        onChange={e => setJoinCodeInput(e.target.value.toUpperCase())}
                        placeholder="e.g. MIND-77"
                        maxLength={8}
                        className="flex-1 px-4 py-3 rounded-xl bg-neutral-950 border border-neutral-800 text-white text-base font-mono uppercase tracking-widest focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
                      />
                      <button
                        onClick={() => handleJoinWithCode()}
                        disabled={!joinCodeInput.trim()}
                        className="px-6 py-3 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-neutral-950 font-black text-xs uppercase tracking-wider disabled:opacity-50 transition-all cursor-pointer"
                      >
                        Join Room
                      </button>
                    </div>
                  </div>

                  <p className="text-xs text-neutral-400">
                    Ask your friend for their 6-character room invite code or paste the full share link.
                  </p>
                </div>
              )}
            </div>

          </div>

          {/* RIGHT: LIVE COMMUNITY ROOMS TO INSTANTLY JUMP IN */}
          <div className="space-y-4">
            <div className="bg-neutral-900/80 p-6 rounded-3xl border border-neutral-800 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-extrabold text-white flex items-center gap-2">
                  <Radio className="w-4 h-4 text-rose-400 animate-pulse" />
                  <span>Public Arena Rooms</span>
                </h3>
                <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                  Live Now
                </span>
              </div>

              <div className="space-y-2.5">
                {PRESET_PUBLIC_ROOMS.map(room => (
                  <div
                    key={room.code}
                    className="p-3.5 rounded-2xl bg-neutral-950 border border-neutral-800 hover:border-neutral-700 transition-all space-y-2"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <span className="font-mono text-[10px] font-black text-cyan-400 bg-cyan-500/10 px-1.5 py-0.5 rounded border border-cyan-500/20">
                          {room.code}
                        </span>
                        <h4 className="text-xs font-bold text-white mt-1">{room.name}</h4>
                      </div>
                      <span className="text-[10px] font-semibold text-neutral-400 shrink-0">
                        {room.players}/{room.maxPlayers} Players
                      </span>
                    </div>

                    <div className="flex items-center justify-between pt-1">
                      <span className="text-[10px] text-neutral-400">Host: {room.host}</span>
                      <button
                        onClick={() => handleJoinWithCode(room.code)}
                        className="px-3 py-1 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-neutral-950 font-bold text-[11px] transition-all cursor-pointer"
                      >
                        Quick Join →
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

        </div>
      )}

      {/* VIEW 2: ACTIVE ROOM LOBBY */}
      {viewState === 'lobby' && activeRoom && (
        <div className="space-y-6">
          
          {/* LOBBY HEADER WITH SHARE & INVITE CODE */}
          <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-br from-neutral-900 via-neutral-900 to-neutral-950 border border-neutral-800 shadow-2xl relative overflow-hidden">
            <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
              
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs font-extrabold uppercase">
                    {activeRoom.mode === 'duel' ? '1v1 Duel Lobby' : 'Squad Party Lobby'}
                  </span>
                  <span className="text-xs text-neutral-400">
                    {activeRoom.category} • {activeRoom.difficulty}
                  </span>
                </div>

                <h2 className="text-2xl sm:text-3xl font-extrabold text-white">
                  {activeRoom.name}
                </h2>

                {/* AI Host Referee Quote */}
                <div className="flex items-center gap-2 text-xs text-neutral-300 pt-1">
                  <span className="font-bold text-emerald-400">{host.name} (Referee):</span>
                  <span>"{hostDialogue}"</span>
                </div>
              </div>

              {/* INVITE CODE & SHARE BUTTONS */}
              <div className="bg-neutral-950 p-4 rounded-2xl border border-neutral-800 space-y-2 shrink-0 w-full md:w-auto">
                <div className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">
                  Invite Code (Share with Friends)
                </div>
                
                <div className="flex items-center gap-2">
                  <div className="px-3 py-2 rounded-xl bg-neutral-900 border border-neutral-700 font-mono text-base font-black text-cyan-400 tracking-widest">
                    {activeRoom.code}
                  </div>

                  <button
                    onClick={handleCopyCode}
                    className="p-2.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-200 hover:text-white border border-neutral-700 transition-colors"
                    title="Copy Code"
                  >
                    {copiedCode ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                  </button>

                  <button
                    onClick={handleCopyLink}
                    className="p-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-neutral-950 font-bold transition-colors flex items-center gap-1 text-xs"
                    title="Copy Full Invite Link"
                  >
                    {copiedLink ? <Check className="w-4 h-4" /> : <Share2 className="w-4 h-4" />}
                    <span className="hidden sm:inline">Share Link</span>
                  </button>
                </div>
              </div>

            </div>
          </div>

          {/* PARTICIPANTS PODIUM GRID */}
          <div className="bg-neutral-900/80 p-6 rounded-3xl border border-neutral-800 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Users className="w-5 h-5 text-cyan-400" />
                <span>Contestants in Lobby ({activeRoom.players.length}/{activeRoom.maxPlayers})</span>
              </h3>

              {activeRoom.players.length < activeRoom.maxPlayers && (
                <button
                  onClick={handleAddChallenger}
                  className="px-3 py-1.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs font-bold transition-colors flex items-center gap-1 border border-neutral-700 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Add Friend / AI Challenger</span>
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {activeRoom.players.map((p, idx) => (
                <div
                  key={p.id}
                  className="p-4 rounded-2xl bg-neutral-950 border border-neutral-800 relative overflow-hidden flex flex-col justify-between"
                >
                  <div className="flex items-center gap-3 mb-3">
                    <div className="relative">
                      <img
                        src={p.avatarUrl}
                        alt={p.username}
                        className="w-12 h-12 rounded-full object-cover border-2 border-emerald-500/50"
                      />
                      {p.isHost && (
                        <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-amber-500 text-neutral-950 flex items-center justify-center shadow-md">
                          <Crown className="w-3 h-3 stroke-[2.5]" />
                        </span>
                      )}
                    </div>

                    <div>
                      <div className="flex items-center gap-1">
                        <span className="font-extrabold text-sm text-white">{p.username}</span>
                      </div>
                      <span className="text-xs text-neutral-400">{p.handle}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-neutral-900">
                    <span className="text-[11px] font-bold text-emerald-400 flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Ready to Clash
                    </span>
                    {p.isBot && (
                      <span className="text-[10px] text-neutral-500 uppercase font-semibold">
                        AI Rival
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* TAUNT WHEEL & QUICK BANTER */}
            <div className="pt-4 border-t border-neutral-800/80 space-y-2">
              <span className="text-xs font-bold text-neutral-400 uppercase tracking-wider block">
                Lobby Hype & Banter
              </span>
              <div className="flex flex-wrap items-center gap-2">
                {TAUNT_ITEMS.map(t => {
                  const Icon = t.icon;
                  return (
                    <button
                      key={t.id}
                      onClick={() => handleSendTaunt(t.id, t.text)}
                      className="px-3 py-1.5 rounded-xl bg-neutral-950 hover:bg-neutral-800 border border-neutral-800 text-xs font-bold text-neutral-300 hover:text-white transition-all flex items-center gap-2 cursor-pointer active:scale-95"
                    >
                      <Icon className={`w-3.5 h-3.5 ${t.color}`} />
                      <span>{t.text}</span>
                    </button>
                  );
                })}
              </div>

              {/* Floating Taunts Stream */}
              <div className="flex flex-wrap gap-2 pt-1">
                {liveTaunts.map(t => {
                  const matchedItem = TAUNT_ITEMS.find(item => item.id === t.tauntId) || TAUNT_ITEMS[0];
                  const Icon = matchedItem.icon;
                  return (
                    <span
                      key={t.id}
                      className="animate-in fade-in slide-in-from-bottom-2 px-3 py-1 rounded-full bg-emerald-950/60 border border-emerald-500/30 text-xs font-bold text-emerald-300 flex items-center gap-2 shadow-md"
                    >
                      <Icon className={`w-3.5 h-3.5 ${matchedItem.color}`} />
                      <span>{t.player}: "{t.text}"</span>
                    </span>
                  );
                })}
              </div>
            </div>

            {/* HOST CONTROLS / START MATCH BUTTON */}
            <div className="pt-4">
              <button
                onClick={handleStartMatch}
                className="w-full py-4 rounded-2xl bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 text-neutral-950 font-black text-base uppercase tracking-wider shadow-xl shadow-emerald-500/25 hover:scale-[1.01] active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <Play className="w-5 h-5 fill-neutral-950" />
                <span>Start Multiplayer Match ({activeRoom.players.length} Contestants Ready)</span>
              </button>
            </div>

          </div>

        </div>
      )}

      {/* VIEW 3: MATCH COUNTDOWN */}
      {viewState === 'countdown' && (
        <div className="py-24 text-center space-y-4">
          <span className="text-xs font-bold uppercase tracking-widest text-emerald-400">
            Get Ready Contestants
          </span>
          <motion.div
            key={countdownSeconds}
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1.2, opacity: 1 }}
            exit={{ scale: 1.5, opacity: 0 }}
            className="text-7xl sm:text-9xl font-black text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400 font-mono"
          >
            {countdownSeconds}
          </motion.div>
          <p className="text-sm font-bold text-neutral-300">
            {host.name}: "Hands on buzzers! Fastest and most accurate mind takes the lead!"
          </p>
        </div>
      )}

      {/* VIEW 4: LIVE SYNCHRONOUS MULTIPLAYER MATCH */}
      {viewState === 'match' && currentQuestion && (
        <div className="space-y-6">
          
          {/* LIVE RACE / SCOREBOARD BAR */}
          <div className="bg-neutral-900/90 p-4 sm:p-5 rounded-3xl border border-neutral-800 space-y-3 shadow-xl">
            <div className="flex items-center justify-between text-xs text-neutral-400">
              <span className="font-bold flex items-center gap-1.5 text-white">
                <Trophy className="w-4 h-4 text-amber-400" />
                Live Standings (Round {currentQIndex + 1} of {activeRoom?.questionCount})
              </span>
              <span className="font-mono font-bold text-cyan-400">
                Clock: {timeLeft}s
              </span>
            </div>

            {/* Race track progress */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {rankedPlayers.map((p, rIdx) => {
                const isUser = p.id === (profile.id || 'user-1');
                return (
                  <div
                    key={p.id}
                    className={`p-3 rounded-2xl border transition-all flex items-center justify-between ${
                      isUser
                        ? 'bg-emerald-950/40 border-emerald-500 shadow-md ring-1 ring-emerald-500/30'
                        : 'bg-neutral-950/80 border-neutral-800'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black ${
                        rIdx === 0 ? 'bg-amber-500 text-neutral-950' : 'bg-neutral-800 text-neutral-300'
                      }`}>
                        #{rIdx + 1}
                      </span>
                      <img
                        src={p.avatarUrl}
                        alt={p.username}
                        className="w-8 h-8 rounded-full object-cover"
                      />
                      <div>
                        <span className="font-bold text-xs text-white block">{p.username}</span>
                        {p.lastAnswerIndex !== null && (
                          <span className={`text-[10px] font-bold ${
                            p.lastAnswerCorrect ? 'text-emerald-400' : 'text-rose-400'
                          }`}>
                            {p.lastAnswerCorrect ? '✓ Locked In' : '✗ Missed'} ({(p.lastAnswerTimeMs / 1000).toFixed(1)}s)
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="text-xs font-mono font-black text-amber-400">
                        {p.score} pts
                      </span>
                      {p.streak > 1 && (
                        <span className="text-[10px] text-amber-300 block font-bold">
                          🔥 {p.streak}x
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* QUESTION CARD */}
          <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-b from-neutral-900 to-neutral-950 border border-neutral-800 space-y-6 shadow-2xl">
            
            {/* Host Banner */}
            <div className="flex items-center justify-between border-b border-neutral-800/80 pb-4">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${host.avatarBg} flex items-center justify-center text-xl shadow-md`}>
                  {host.avatar}
                </div>
                <div>
                  <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider">{host.name} Live</span>
                  <p className="text-xs text-neutral-200 font-medium">{hostDialogue}</p>
                </div>
              </div>

              {/* Timer Pill */}
              <div className={`px-4 py-2 rounded-2xl font-mono text-sm font-black flex items-center gap-1.5 ${
                timeLeft <= 4 ? 'bg-rose-500 text-neutral-950 animate-pulse' : 'bg-neutral-800 text-white'
              }`}>
                <Clock className="w-4 h-4" />
                <span>{timeLeft}s</span>
              </div>
            </div>

            {/* Question Text */}
            <h3 className="text-lg sm:text-2xl font-bold text-white leading-relaxed">
              {currentQuestion.question}
            </h3>

            {/* Multiple Choice Options */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {currentQuestion.options.map((opt, oIdx) => {
                const isSelected = selectedOption === oIdx;
                const isCorrect = oIdx === currentQuestion.correctIndex;
                const showResult = hasAnswered || isRoundFinished;

                let btnStyle = 'bg-neutral-950/70 border-neutral-800 text-neutral-200 hover:border-neutral-700 hover:bg-neutral-900';
                if (showResult) {
                  if (isCorrect) {
                    btnStyle = 'bg-emerald-950/70 border-emerald-500 text-emerald-100 ring-2 ring-emerald-500/30';
                  } else if (isSelected && !isCorrect) {
                    btnStyle = 'bg-rose-950/70 border-rose-500 text-rose-100 ring-2 ring-rose-500/30';
                  }
                }

                return (
                  <button
                    key={oIdx}
                    onClick={() => handleAnswerOption(oIdx)}
                    disabled={hasAnswered || isRoundFinished}
                    className={`p-4 rounded-2xl border text-left font-semibold text-sm transition-all flex items-center justify-between cursor-pointer disabled:cursor-default ${btnStyle}`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="w-7 h-7 rounded-xl bg-neutral-900 text-neutral-300 flex items-center justify-center font-bold text-xs shrink-0">
                        {String.fromCharCode(65 + oIdx)}
                      </span>
                      <span>{opt}</span>
                    </div>

                    {showResult && isCorrect && (
                      <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                    )}
                    {showResult && isSelected && !isCorrect && (
                      <XCircle className="w-5 h-5 text-rose-400 shrink-0" />
                    )}
                  </button>
                );
              })}
            </div>

            {/* Next Round Progression */}
            {hasAnswered && !isRoundFinished && (
              <div className="pt-2 text-center text-xs text-neutral-400 animate-pulse">
                Answer locked in! Waiting for round transition...
              </div>
            )}
          </div>

        </div>
      )}

      {/* VIEW 5: PODIUM & GRAND FINALE REWARDS */}
      {viewState === 'podium' && (
        <div className="p-6 sm:p-10 rounded-3xl bg-gradient-to-b from-neutral-900 via-neutral-900 to-neutral-950 border border-neutral-800 text-center space-y-8 shadow-2xl">
          
          <div className="space-y-2">
            <span className="text-xs font-bold uppercase tracking-widest text-emerald-400">
              Match Completed
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white">
              Multiplayer Arena Victory Podium!
            </h2>
            <p className="text-sm text-neutral-300">
              {host.name}: "What an incredible match! Exceptional cognitive stamina from all contestants!"
            </p>
          </div>

          {/* 3D-STYLED PODIUM */}
          <div className="flex items-end justify-center gap-3 sm:gap-6 pt-8 pb-4 max-w-lg mx-auto">
            
            {/* 2nd Place */}
            {rankedPlayers[1] && (
              <div className="flex flex-col items-center space-y-2">
                <img
                  src={rankedPlayers[1].avatarUrl}
                  alt={rankedPlayers[1].username}
                  className="w-14 h-14 rounded-full object-cover border-2 border-slate-400 shadow-md"
                />
                <span className="text-xs font-bold text-white">{rankedPlayers[1].username}</span>
                <span className="text-[10px] text-neutral-400">{rankedPlayers[1].score} pts</span>
                <div className="w-20 sm:w-24 h-24 bg-gradient-to-t from-neutral-950 to-slate-800 rounded-t-2xl border-t-2 border-slate-400 flex items-center justify-center text-xl font-black text-slate-300 shadow-lg">
                  #2
                </div>
              </div>
            )}

            {/* 1st Place */}
            {rankedPlayers[0] && (
              <div className="flex flex-col items-center space-y-2 -translate-y-4">
                <div className="relative">
                  <img
                    src={rankedPlayers[0].avatarUrl}
                    alt={rankedPlayers[0].username}
                    className="w-18 h-18 rounded-full object-cover border-3 border-amber-400 shadow-xl ring-4 ring-amber-500/20"
                  />
                  <Crown className="w-6 h-6 text-amber-400 absolute -top-4 left-1/2 -translate-x-1/2 fill-amber-400" />
                </div>
                <span className="text-sm font-extrabold text-white">{rankedPlayers[0].username}</span>
                <span className="text-xs font-mono font-black text-amber-400">{rankedPlayers[0].score} pts</span>
                <div className="w-24 sm:w-28 h-36 bg-gradient-to-t from-neutral-950 to-amber-900/60 rounded-t-2xl border-t-4 border-amber-400 flex flex-col items-center justify-center text-2xl font-black text-amber-300 shadow-2xl">
                  <span>#1</span>
                  <Trophy className="w-5 h-5 text-amber-400 mt-1" />
                </div>
              </div>
            )}

            {/* 3rd Place */}
            {rankedPlayers[2] && (
              <div className="flex flex-col items-center space-y-2">
                <img
                  src={rankedPlayers[2].avatarUrl}
                  alt={rankedPlayers[2].username}
                  className="w-14 h-14 rounded-full object-cover border-2 border-amber-700 shadow-md"
                />
                <span className="text-xs font-bold text-white">{rankedPlayers[2].username}</span>
                <span className="text-[10px] text-neutral-400">{rankedPlayers[2].score} pts</span>
                <div className="w-20 sm:w-24 h-16 bg-gradient-to-t from-neutral-950 to-amber-950/60 rounded-t-2xl border-t-2 border-amber-700 flex items-center justify-center text-xl font-black text-amber-600 shadow-lg">
                  #3
                </div>
              </div>
            )}

          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-4">
            <button
              onClick={handleCreateRoom}
              className="w-full sm:w-auto px-6 py-3.5 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 text-neutral-950 font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 hover:opacity-95 transition-all cursor-pointer shadow-lg shadow-emerald-500/20"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Play Rematch</span>
            </button>

            <button
              onClick={onOpenSocialHub}
              className="w-full sm:w-auto px-6 py-3.5 rounded-2xl bg-neutral-800 hover:bg-neutral-700 text-white font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 border border-neutral-700 transition-colors cursor-pointer"
            >
              <Share2 className="w-4 h-4 text-cyan-400" />
              <span>Share Result to Social Hub</span>
            </button>

            <button
              onClick={onBackToSolo}
              className="w-full sm:w-auto px-6 py-3.5 rounded-2xl bg-neutral-950 hover:bg-neutral-900 text-neutral-300 font-bold text-xs uppercase tracking-wider border border-neutral-800 transition-colors cursor-pointer"
            >
              <span>Solo Arena</span>
            </button>
          </div>

        </div>
      )}

    </div>
  );
};
