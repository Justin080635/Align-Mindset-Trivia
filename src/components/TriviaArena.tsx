import React, { useState, useEffect, useRef, useCallback } from 'react';
import confetti from 'canvas-confetti';
import {
  Sparkles,
  Zap,
  Timer,
  Flame,
  HelpCircle,
  Scissors,
  Hourglass,
  Users,
  Mic,
  MicOff,
  Volume2,
  ExternalLink,
  ArrowRight,
  RotateCcw,
  CheckCircle2,
  XCircle,
  Brain,
  Share2,
  VolumeX,
  Radio,
  BookOpen,
  Award,
  ChevronLeft,
  ChevronRight,
  Check,
  Square,
  Music,
  Disc3,
  Sliders,
  Info,
  Trophy,
  Target,
  Copy,
  ChevronDown,
  ChevronUp,
  TrendingUp,
  Clock,
  ShieldCheck,
  Lightbulb,
  PartyPopper,
  Gift,
  Coins,
  Compass
} from 'lucide-react';
import {
  Question,
  PersonalityType,
  GameDifficulty,
  GameMode,
  PlayerProfile,
  HostPersona,
  MatchRecord
} from '../types';
import { HOST_PERSONAS, TRIVIA_CATEGORIES, FALLBACK_QUESTIONS, getFallbackQuestionsByCategory } from '../data/mockData';
import {
  playSoundEffect,
  playHostTTS,
  stopAudioSpeech,
  createSpeechRecognizer,
  playTriviaSoundtrack,
  stopTriviaSoundtrack,
  triggerHapticFeedback,
  SOUNDTRACK_TRACKS,
  SoundtrackTheme
} from '../utils/audio';
import { formatFriendlyMatchTime, computeProfileStats, computeConsecutiveStreakDays } from '../utils/userStats';
import { HostVectorGraphic } from './HostVectorGraphic';
import { MatchSetupView } from './MatchSetupView';
import { saveMatchToFirestore, saveUserProfileToFirestore } from '../lib/firebase';
import { useHaptics } from '../hooks/useHaptics';

interface TriviaArenaProps {
  profile: PlayerProfile;
  setProfile: React.Dispatch<React.SetStateAction<PlayerProfile>>;
  selectedHost: PersonalityType;
  setSelectedHost: (host: PersonalityType) => void;
  onOpenSocialHub: () => void;
  onOpenLeaderboard: () => void;
  onOpenVoiceModal: () => void;
  onOpenMultiplayer?: () => void;
  onOpenGameshowAuth?: () => void;
  onOpenFlywheelModal?: () => void;
}

export interface QuestionSummaryResult {
  question: Question;
  selectedOption: number;
  isCorrect: boolean;
  isTimedOut: boolean;
  timeSpentSeconds: number;
}

export const TriviaArena: React.FC<TriviaArenaProps> = ({
  profile,
  setProfile,
  selectedHost,
  setSelectedHost,
  onOpenSocialHub,
  onOpenLeaderboard,
  onOpenVoiceModal,
  onOpenMultiplayer,
  onOpenGameshowAuth,
  onOpenFlywheelModal
}) => {
  // Setup state
  const [gameState, setGameState] = useState<'lobby' | 'setup' | 'playing' | 'round_end'>('lobby');
  const [selectedCategory, setSelectedCategory] = useState<string>('Mixed Bag (The All-Rounder)');
  const [selectedDifficulty, setSelectedDifficulty] = useState<GameDifficulty>('Pro');
  const [gameMode, setGameMode] = useState<GameMode>('standard');
  const [questionCount, setQuestionCount] = useState<number>(6);
  const [isLoadingQuestions, setIsLoadingQuestions] = useState<boolean>(false);

  // Calibrated haptic feedback engine
  const haptics = useHaptics({ enabled: profile.hapticsEnabled ?? true });

  // Match state
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [score, setScore] = useState<number>(0);
  const [streak, setStreak] = useState<number>(0);
  const [peakStreak, setPeakStreak] = useState<number>(0);
  const [correctCount, setCorrectCount] = useState<number>(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [isAnswerRevealed, setIsAnswerRevealed] = useState<boolean>(false);
  const [timeLeft, setTimeLeft] = useState<number>(15);
  const [maxTime, setMaxTime] = useState<number>(15);
  const [isTimerPaused, setIsTimerPaused] = useState<boolean>(false);

  // Match Review & Summary State
  const [roundSummaryResults, setRoundSummaryResults] = useState<QuestionSummaryResult[]>([]);
  const [expandedQuestionIndex, setExpandedQuestionIndex] = useState<number | null>(null);
  const [scorecardCopiedToast, setScorecardCopiedToast] = useState<boolean>(false);
  const [reviewFilter, setReviewFilter] = useState<'all' | 'correct' | 'missed'>('all');

  // Lifelines
  const [used5050, setUsed5050] = useState<boolean>(false);
  const [eliminatedOptions, setEliminatedOptions] = useState<number[]>([]);
  const [usedFreeze, setUsedFreeze] = useState<boolean>(false);
  const [usedInsight, setUsedInsight] = useState<boolean>(false);
  const [insightText, setInsightText] = useState<string | null>(null);
  const [usedPoll, setUsedPoll] = useState<boolean>(false);
  const [pollResults, setPollResults] = useState<number[] | null>(null);

  // Host Dialogue and Voice
  const host = HOST_PERSONAS[selectedHost] || HOST_PERSONAS['Nova'];
  const [hostDialogue, setHostDialogue] = useState<string>(host.sampleQuote);
  const [isHostSpeaking, setIsHostSpeaking] = useState<boolean>(false);
  const [hostEmotion, setHostEmotion] = useState<'neutral' | 'happy' | 'thinking' | 'surprised'>('neutral');
  const [previewingVoiceHost, setPreviewingVoiceHost] = useState<string | null>(null);
  const hostScrollRef = useRef<HTMLDivElement>(null);

  // Soundtrack Jukebox State
  const [activeSoundtrack, setActiveSoundtrack] = useState<SoundtrackTheme | null>(null);
  const [isSoundtrackModalOpen, setIsSoundtrackModalOpen] = useState<boolean>(false);

  const toggleSoundtrack = (theme: SoundtrackTheme) => {
    if (activeSoundtrack === theme) {
      stopTriviaSoundtrack();
      setActiveSoundtrack(null);
      playSoundEffect('click');
    } else {
      playSoundEffect('click');
      playTriviaSoundtrack(theme, 0.08);
      setActiveSoundtrack(theme);
    }
  };

  const scrollHosts = (direction: 'left' | 'right') => {
    if (profile.soundEnabled) {
      playSoundEffect('click');
    }
    if (hostScrollRef.current) {
      const scrollAmount = direction === 'right' ? 320 : -320;
      hostScrollRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  const handleTestHostVoice = async (e: React.MouseEvent, h: HostPersona) => {
    e.stopPropagation();
    if (previewingVoiceHost === h.id) {
      stopAudioSpeech();
      setPreviewingVoiceHost(null);
      return;
    }

    setPreviewingVoiceHost(h.id);
    if (profile.soundEnabled) {
      playSoundEffect('click');
    }

    await playHostTTS(
      h.sampleQuote,
      h.id,
      h.voiceName,
      () => setPreviewingVoiceHost(h.id),
      () => setPreviewingVoiceHost(null)
    );
  };

  // Grounding sources modal
  const [showCitationModal, setShowCitationModal] = useState<boolean>(false);

  // Voice Answer Recognition
  const [isListeningVoice, setIsListeningVoice] = useState<boolean>(false);
  const [voiceTranscript, setVoiceTranscript] = useState<string>('');
  const speechRecognizerRef = useRef<any>(null);

  // Timer & match duration reference
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const matchStartTimeRef = useRef<number>(Date.now());

  // Background question prefetch cache to make match launch instantaneous
  const prefetchedQuestionsRef = useRef<{
    key: string;
    promise?: Promise<any[]>;
    questions?: any[];
    timestamp: number;
  } | null>(null);

  // Background Prefetching Effect: loads questions silently while in lobby/setup
  useEffect(() => {
    if (gameState !== 'setup' && gameState !== 'lobby') return;
    const key = `${selectedCategory}:${selectedDifficulty}:${questionCount}:${selectedHost}`;

    // If already prefetched and valid within last 10 minutes, do not re-fetch
    if (
      prefetchedQuestionsRef.current?.key === key &&
      prefetchedQuestionsRef.current.questions &&
      prefetchedQuestionsRef.current.questions.length >= questionCount &&
      Date.now() - prefetchedQuestionsRef.current.timestamp < 10 * 60 * 1000
    ) {
      return;
    }

    const fetchPromise = (async () => {
      try {
        const response = await fetch('/api/generate-questions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            category: selectedCategory,
            difficulty: selectedDifficulty,
            count: questionCount,
            personality: selectedHost
          })
        });
        const data = await response.json();
        const list = data.questions && data.questions.length > 0
          ? data.questions
          : getFallbackQuestionsByCategory(selectedCategory, questionCount);

        if (prefetchedQuestionsRef.current?.key === key) {
          prefetchedQuestionsRef.current.questions = list;
        }
        return list;
      } catch {
        return getFallbackQuestionsByCategory(selectedCategory, questionCount);
      }
    })();

    prefetchedQuestionsRef.current = {
      key,
      promise: fetchPromise,
      timestamp: Date.now()
    };
  }, [selectedCategory, selectedDifficulty, questionCount, selectedHost, gameState]);

  // Current active question
  const currentQ = questions[currentIndex];

  // Multiplier calculation based on streak
  const multiplier = streak >= 5 ? 3.0 : streak >= 3 ? 2.0 : streak >= 1 ? 1.5 : 1.0;

  // Speak host dialogue
  const speakDialogue = useCallback(
    async (text: string) => {
      if (!profile.soundEnabled || !profile.voiceEnabled) return;
      setIsHostSpeaking(true);
      await playHostTTS(
        text,
        selectedHost,
        host.voiceName,
        () => setIsHostSpeaking(true),
        () => setIsHostSpeaking(false)
      );
    },
    [profile.soundEnabled, profile.voiceEnabled, selectedHost, host.voiceName]
  );

  // Request in-character host commentary from backend
  const fetchHostCommentary = useCallback(
    async (
      eventType: 'intro' | 'correct' | 'incorrect' | 'streak' | 'lifeline' | 'gameover',
      extra?: { selected?: string; correct?: string; lifeline?: string; finalScore?: number }
    ) => {
      try {
        const res = await fetch('/api/host-commentary', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            personality: selectedHost,
            eventType,
            playerName: profile.username,
            score: extra?.finalScore ?? score,
            streak,
            currentQuestion: currentQ?.question || '',
            selectedAnswer: extra?.selected || '',
            correctAnswer: extra?.correct || '',
            lifelineUsed: extra?.lifeline || ''
          })
        });
        const data = await res.json();
        if (data.commentary) {
          setHostDialogue(data.commentary);
          if (profile.accessibility.autoSpeakQuestions || profile.voiceEnabled) {
            speakDialogue(data.commentary);
          }
        }
      } catch (e) {
        console.warn("Host commentary fetch error:", e);
      }
    },
    [selectedHost, profile.username, score, streak, currentQ, profile.accessibility.autoSpeakQuestions, profile.voiceEnabled, speakDialogue]
  );

  // Start a new game match (Instant or sub-second launch)
  const handleStartGame = async () => {
    playSoundEffect('click');
    const key = `${selectedCategory}:${selectedDifficulty}:${questionCount}:${selectedHost}`;

    let fetchedQuestions: any[] | null = null;

    // 1. Instant launch if questions already prefetched in background
    if (
      prefetchedQuestionsRef.current?.key === key &&
      prefetchedQuestionsRef.current.questions &&
      prefetchedQuestionsRef.current.questions.length >= questionCount
    ) {
      fetchedQuestions = prefetchedQuestionsRef.current.questions;
      // Invalidate so subsequent round fetches fresh variety
      prefetchedQuestionsRef.current = null;
    } else if (prefetchedQuestionsRef.current?.key === key && prefetchedQuestionsRef.current.promise) {
      // If background fetch is still in flight, quickly await it
      setIsLoadingQuestions(true);
      try {
        fetchedQuestions = await prefetchedQuestionsRef.current.promise;
      } catch {
        fetchedQuestions = getFallbackQuestionsByCategory(selectedCategory, questionCount);
      } finally {
        setIsLoadingQuestions(false);
        prefetchedQuestionsRef.current = null;
      }
    } else {
      // Direct fast network request
      setIsLoadingQuestions(true);
      try {
        const response = await fetch('/api/generate-questions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            category: selectedCategory,
            difficulty: selectedDifficulty,
            count: questionCount,
            personality: selectedHost
          })
        });

        const data = await response.json();
        fetchedQuestions = data.questions && data.questions.length > 0 
          ? data.questions 
          : getFallbackQuestionsByCategory(selectedCategory, questionCount);
      } catch (err) {
        console.warn("Failed to load questions from server, using categorized fallbacks:", err);
        fetchedQuestions = getFallbackQuestionsByCategory(selectedCategory, questionCount);
      } finally {
        setIsLoadingQuestions(false);
      }
    }

    if (!fetchedQuestions || fetchedQuestions.length === 0) {
      fetchedQuestions = getFallbackQuestionsByCategory(selectedCategory, questionCount);
    }

    setQuestions(fetchedQuestions);
    setCurrentIndex(0);
    setScore(0);
    setStreak(0);
    setPeakStreak(0);
    setCorrectCount(0);
    setSelectedOption(null);
    setIsAnswerRevealed(false);
    setUsed5050(false);
    setEliminatedOptions([]);
    setUsedFreeze(false);
    setUsedInsight(false);
    setInsightText(null);
    setUsedPoll(false);
    setPollResults(null);
    setGameState('playing');
    matchStartTimeRef.current = Date.now();
    setHostEmotion('happy');
    setRoundSummaryResults([]);
    setExpandedQuestionIndex(null);
    setScorecardCopiedToast(false);

    const initialTime = gameMode === 'blitz' ? 10 : gameMode === 'mindset_reflection' ? 999 : 15;
    setTimeLeft(initialTime);
    setMaxTime(initialTime);

    const introQuote = `Let's go, ${profile.username}! Show us what you got in ${selectedCategory}!`;
    setHostDialogue(introQuote);
    if (profile.voiceEnabled) {
      speakDialogue(introQuote);
    }
  };

  // Timer tick effect
  useEffect(() => {
    if (gameState !== 'playing' || isAnswerRevealed || isTimerPaused || gameMode === 'mindset_reflection') {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }

    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timerRef.current!);
          handleTimeOut();
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
  }, [gameState, isAnswerRevealed, isTimerPaused, gameMode, profile.soundEnabled]);

  // Handle timeout on a question
  const handleTimeOut = () => {
    if (isAnswerRevealed || !currentQ) return;
    playSoundEffect('incorrect');
    haptics.trigger('buzz');
    setSelectedOption(-1); // Timeout indicator
    setIsAnswerRevealed(true);
    setStreak(0);
    setHostEmotion('surprised');
    
    setRoundSummaryResults(prev => [
      ...prev,
      {
        question: currentQ,
        selectedOption: -1,
        isCorrect: false,
        isTimedOut: true,
        timeSpentSeconds: maxTime
      }
    ]);

    fetchHostCommentary('incorrect', {
      correct: currentQ?.options[currentQ.correctIndex]
    });
  };

  // Handle player answer selection
  const handleSelectOption = (idx: number) => {
    if (isAnswerRevealed || eliminatedOptions.includes(idx) || !currentQ) return;

    if (timerRef.current) clearInterval(timerRef.current);
    setSelectedOption(idx);
    setIsAnswerRevealed(true);

    const isCorrect = idx === currentQ.correctIndex;
    const timeSpent = Math.max(1, maxTime - timeLeft);

    setRoundSummaryResults(prev => [
      ...prev,
      {
        question: currentQ,
        selectedOption: idx,
        isCorrect,
        isTimedOut: false,
        timeSpentSeconds: timeSpent
      }
    ]);

    if (isCorrect) {
      playSoundEffect('correct');
      const timeBonus = Math.floor((timeLeft / maxTime) * 100);
      const pointsEarned = Math.round((200 + timeBonus) * multiplier);

      setScore(prev => prev + pointsEarned);
      setCorrectCount(prev => prev + 1);
      const newStreak = streak + 1;
      setStreak(newStreak);
      if (newStreak > peakStreak) {
        setPeakStreak(newStreak);
      }

      if (newStreak >= 3 && newStreak % 3 === 0) {
        playSoundEffect('streak');
        haptics.trigger('streak');
        setHostEmotion('happy');
        fetchHostCommentary('streak', { selected: currentQ.options[idx] });
      } else {
        haptics.trigger('success');
        setHostEmotion('happy');
        fetchHostCommentary('correct', { selected: currentQ.options[idx] });
      }
    } else {
      playSoundEffect('incorrect');
      // Trigger distinct, non-jarring 2-pulse haptic vibration on incorrect answer
      haptics.triggerIncorrect();
      setStreak(0);
      setHostEmotion('thinking');
      fetchHostCommentary('incorrect', {
        selected: currentQ.options[idx],
        correct: currentQ.options[currentQ.correctIndex]
      });
    }
  };

  // Next question or finish match
  const handleNextQuestion = () => {
    playSoundEffect('click');
    haptics.trigger('tap');
    stopAudioSpeech();

    if (currentIndex + 1 < questions.length) {
      setCurrentIndex(prev => prev + 1);
      setSelectedOption(null);
      setIsAnswerRevealed(false);
      setEliminatedOptions([]);
      setInsightText(null);
      setPollResults(null);
      const nextTime = gameMode === 'blitz' ? 10 : gameMode === 'mindset_reflection' ? 999 : 15;
      setTimeLeft(nextTime);
      setMaxTime(nextTime);
      setIsTimerPaused(false);
      setHostEmotion('neutral');
    } else {
      handleCompleteRound();
    }
  };

  // Round completion & stat persistence
  const handleCompleteRound = () => {
    setGameState('round_end');
    playSoundEffect('fanfare');
    haptics.trigger('jackpot');

    // Confetti effect
    try {
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 }
      });
    } catch {}

    const totalQ = questions.length;
    const accuracy = Math.round((correctCount / totalQ) * 100);
    const xpGained = score > 0 ? Math.round(score * 0.25) : 50;
    const lpDelta = accuracy >= 80 ? 45 : accuracy >= 50 ? 25 : 10;
    const durationSeconds = Math.max(20, Math.round((Date.now() - matchStartTimeRef.current) / 1000));
    const now = new Date();

    // Create Match Record with actual relative timestamp and ISO format
    const newRecord: MatchRecord = {
      id: `m-${Date.now()}`,
      timestamp: formatFriendlyMatchTime(now),
      isoDate: now.toISOString(),
      category: selectedCategory,
      score,
      correctAnswers: correctCount,
      totalQuestions: totalQ,
      accuracy,
      personality: selectedHost,
      mode: gameMode,
      xpEarned: xpGained,
      leaguePointsDelta: lpDelta,
      durationSeconds
    };

    // Update Profile state and sync to Firestore
    setProfile(prev => {
      const updatedHistory = [newRecord, ...prev.history].slice(0, 30);
      const computed = computeProfileStats({
        ...prev,
        history: updatedHistory,
        totalGames: prev.totalGames + 1
      });
      const newStreak = Math.max(prev.highestStreak, peakStreak);
      const newStreakDays = computeConsecutiveStreakDays(updatedHistory);
      const newRankPoints = prev.rankPoints + lpDelta;

      const updated: PlayerProfile = {
        ...prev,
        totalGames: computed.totalGames,
        rankPoints: newRankPoints,
        accuracyRate: computed.overallAccuracy,
        highestStreak: newStreak,
        currentStreakDays: newStreakDays,
        todayPlayTimeMinutes: computed.todayMinutes,
        weeklyPlayTimeMinutes: computed.weeklyMinutes,
        totalPlayTimeMinutes: computed.totalMinutesPlayed,
        lastActiveDate: now.toISOString().split('T')[0],
        history: updatedHistory
      };

      if (updated.googleConnected || updated.id) {
        saveMatchToFirestore(updated.id, newRecord).catch(console.error);
        saveUserProfileToFirestore(updated).catch(console.error);
      }

      return updated;
    });

    fetchHostCommentary('gameover', { finalScore: score });
  };

  // Lifeline: 50/50
  const handleUse5050 = () => {
    if (used5050 || isAnswerRevealed || !currentQ) return;
    playSoundEffect('lifeline');
    haptics.trigger('selection');
    setUsed5050(true);

    const wrongIndices = [0, 1, 2, 3].filter(idx => idx !== currentQ.correctIndex);
    const shuffledWrong = wrongIndices.sort(() => 0.5 - Math.random());
    const toEliminate = shuffledWrong.slice(0, 2);
    setEliminatedOptions(toEliminate);

    fetchHostCommentary('lifeline', { lifeline: '50/50' });
  };

  // Lifeline: Time Freeze
  const handleUseFreeze = () => {
    if (usedFreeze || isAnswerRevealed) return;
    playSoundEffect('lifeline');
    haptics.trigger('warning');
    setUsedFreeze(true);
    setTimeLeft(prev => prev + 15);
    setIsTimerPaused(true);
    setTimeout(() => {
      setIsTimerPaused(false);
    }, 5000);

    fetchHostCommentary('lifeline', { lifeline: 'Time Freeze' });
  };

  // Lifeline: Mindset Insight from Host
  const handleUseInsight = async () => {
    if (usedInsight || isAnswerRevealed || !currentQ) return;
    playSoundEffect('lifeline');
    haptics.trigger('selection');
    setUsedInsight(true);

    try {
      const res = await fetch('/api/host-hint', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          personality: selectedHost,
          question: currentQ.question,
          options: currentQ.options
        })
      });
      const data = await res.json();
      setInsightText(data.hint || currentQ.mindsetInsight);
      setHostDialogue(data.hint || currentQ.mindsetInsight);
      if (profile.voiceEnabled) {
        speakDialogue(data.hint || currentQ.mindsetInsight);
      }
    } catch {
      setInsightText(currentQ.mindsetInsight);
    }
  };

  // Lifeline: Community Consensus Poll
  const handleUsePoll = () => {
    if (usedPoll || isAnswerRevealed || !currentQ) return;
    playSoundEffect('lifeline');
    haptics.trigger('selection');
    setUsedPoll(true);

    const correct = currentQ.correctIndex;
    const results = [10, 10, 10, 10];
    results[correct] = 60 + Math.floor(Math.random() * 20);
    const remaining = 100 - results[correct];
    const others = [0, 1, 2, 3].filter(i => i !== correct);
    others.forEach((idx, i) => {
      results[idx] = i === 2 ? remaining - results[others[0]] - results[others[1]] : Math.floor(remaining / 3);
    });

    setPollResults(results);
    fetchHostCommentary('lifeline', { lifeline: 'Crowd Pick' });
  };

  // Voice speech answer trigger
  const toggleVoiceRecognition = () => {
    if (isListeningVoice) {
      speechRecognizerRef.current?.stop();
      setIsListeningVoice(false);
    } else {
      playSoundEffect('click');
      setIsListeningVoice(true);
      setVoiceTranscript('Listening for answer...');

      const recognizer = createSpeechRecognizer(
        (transcript, isFinal) => {
          setVoiceTranscript(transcript);
          if (isFinal) {
            handleVoiceCommand(transcript);
            setIsListeningVoice(false);
          }
        },
        err => {
          console.warn("Speech recognition error:", err);
          setIsListeningVoice(false);
        }
      );

      speechRecognizerRef.current = recognizer;
      recognizer.start();
    }
  };

  // Match voice transcript to answers or commands
  const handleVoiceCommand = (transcript: string) => {
    if (!currentQ || isAnswerRevealed) return;
    const lower = transcript.toLowerCase();

    if (lower.includes('option a') || lower.includes('option 1') || lower.includes('first')) {
      handleSelectOption(0);
    } else if (lower.includes('option b') || lower.includes('option 2') || lower.includes('second')) {
      handleSelectOption(1);
    } else if (lower.includes('option c') || lower.includes('option 3') || lower.includes('third')) {
      handleSelectOption(2);
    } else if (lower.includes('option d') || lower.includes('option 4') || lower.includes('fourth')) {
      handleSelectOption(3);
    } else if (lower.includes('hint') || lower.includes('insight') || lower.includes('clue')) {
      handleUseInsight();
    } else {
      // Fuzzy match against option text
      let matchedIdx = -1;
      currentQ.options.forEach((opt, idx) => {
        if (lower.includes(opt.toLowerCase()) || opt.toLowerCase().includes(lower)) {
          matchedIdx = idx;
        }
      });
      if (matchedIdx !== -1) {
        handleSelectOption(matchedIdx);
      }
    }
  };

  // Keyboard shortcut navigation (WCAG AA Accessibility)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (gameState !== 'playing') return;

      if (!isAnswerRevealed) {
        if (e.key === '1' || e.key === 'a' || e.key === 'A') handleSelectOption(0);
        if (e.key === '2' || e.key === 'b' || e.key === 'B') handleSelectOption(1);
        if (e.key === '3' || e.key === 'c' || e.key === 'C') handleSelectOption(2);
        if (e.key === '4' || e.key === 'd' || e.key === 'D') handleSelectOption(3);
        if (e.key === 'h' || e.key === 'H') handleUseInsight();
      } else {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handleNextQuestion();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [gameState, isAnswerRevealed, currentQ]);

  // Render LOBBY setup screen
  if (gameState === 'lobby') {
    return (
      <div id="trivia-lobby-view" className="space-y-6 animate-in fade-in duration-200">
        
        {/* Top Hero Banner with Primary "Let's Play" CTA */}
        <div className="rounded-3xl p-6 sm:p-8 bg-[#0a0a0a] border border-amber-500/30 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-96 h-96 bg-amber-400/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />

          <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="space-y-3 max-w-2xl">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold px-3 py-1 rounded-full bg-amber-400/20 text-amber-300 border border-amber-400/40">
                  Align Trivia Arena
                </span>
                <span className="text-xs text-neutral-400 font-medium">
                  Live AI Hosts & Banter
                </span>
              </div>
              <h1 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight">
                Play Live Trivia & Level Up Your Brain
              </h1>
              <p className="text-sm sm:text-base text-neutral-300 leading-relaxed">
                Test your smarts against AI hosts with real personalities. Keep your answer streak alive, unlock cool badges, and climb the global leaderboard!
              </p>

              {/* PRIMARY "LET'S PLAY" HERO BUTTON - Gold */}
              <div className="pt-2 flex flex-wrap items-center gap-3">
                <button
                  id="main-hero-lets-play-btn"
                  type="button"
                  onClick={() => {
                    playSoundEffect('click');
                    setGameState('setup');
                  }}
                  className="px-8 py-4 rounded-2xl bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 hover:from-amber-300 hover:to-yellow-300 text-neutral-950 font-black text-base uppercase tracking-wider shadow-2xl shadow-amber-500/25 flex items-center justify-center gap-2.5 transition-all hover:scale-[1.03] active:scale-[0.97] cursor-pointer border border-amber-300/40"
                >
                  <Sparkles className="w-5 h-5 fill-current" />
                  <span>Let's Play</span>
                  <ArrowRight className="w-5 h-5 stroke-[3]" />
                </button>

                <button
                  type="button"
                  onClick={() => {
                    playSoundEffect('click');
                    if (onOpenMultiplayer) onOpenMultiplayer();
                  }}
                  className="px-5 py-4 rounded-2xl bg-neutral-950 hover:bg-neutral-900 text-neutral-300 hover:text-amber-300 border border-neutral-800 text-xs font-bold transition-all flex items-center gap-2 cursor-pointer shadow-md"
                >
                  <Users className="w-4 h-4 text-amber-400" />
                  <span>1v1 Duel Arena</span>
                </button>
              </div>
            </div>

            {/* Quick Host Profile Card */}
            <div className="w-full md:w-auto shrink-0 bg-neutral-950/80 p-4 sm:p-5 rounded-2xl border border-neutral-800 flex items-center gap-4">
              <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${host.avatarBg} flex items-center justify-center text-3xl shadow-lg border border-amber-400/20`}>
                {host.avatar}
              </div>
              <div>
                <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">Active Host</span>
                <h2 className="text-base font-bold text-white">{host.name}</h2>
                <span className="text-xs text-amber-400 font-semibold">{host.archetype}</span>
                <div className="mt-1">
                  <button
                    type="button"
                    onClick={() => {
                      playSoundEffect('click');
                      setGameState('setup');
                    }}
                    className="text-[11px] text-amber-400 hover:underline font-bold"
                  >
                    Change Host & Rules →
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* HEAD-TO-HEAD MULTIPLAYER, WEEKLY CHALLENGE & FORTUNE WHEEL SHOWCASE */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          
          {/* Main Multiplayer Card */}
          <div className="md:col-span-2 p-6 rounded-3xl bg-[#0a0a0a] border border-neutral-800 shadow-xl relative overflow-hidden flex flex-col justify-between">
            <div className="space-y-2 relative z-10">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full bg-amber-400/20 text-amber-300 border border-amber-400/40 text-xs font-bold flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping" />
                  Live Feature
                </span>
                <span className="text-xs text-neutral-400">Invite Friends & Real-time Squad Battles</span>
              </div>
              
              <h2 className="text-xl sm:text-2xl font-extrabold text-white">
                1v1 Head-to-Head Trivia Duel
              </h2>
              <p className="text-xs sm:text-sm text-neutral-300 max-w-xl">
                Challenge friends to real-time speed duels or launch a private Squad Room with custom invite codes and live referee commentary!
              </p>
            </div>

            <div className="pt-4 flex flex-wrap items-center gap-3 relative z-10">
              <button
                onClick={() => {
                  playSoundEffect('click');
                  if (onOpenMultiplayer) onOpenMultiplayer();
                }}
                className="px-5 py-3 rounded-2xl bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 hover:from-amber-300 hover:to-yellow-300 text-neutral-950 font-black text-xs uppercase tracking-wider shadow-lg shadow-amber-500/20 flex items-center gap-2 cursor-pointer transition-all hover:scale-[1.02] active:scale-[0.98] border border-amber-300/40"
              >
                <Users className="w-4 h-4" />
                <span>Enter Multiplayer Arena</span>
              </button>

              <button
                onClick={() => {
                  playSoundEffect('click');
                  if (onOpenMultiplayer) onOpenMultiplayer();
                }}
                className="px-4 py-3 rounded-2xl bg-neutral-950 hover:bg-neutral-900 text-neutral-300 hover:text-white border border-neutral-800 text-xs font-bold transition-colors cursor-pointer"
              >
                Join with Invite Code →
              </button>
            </div>
          </div>

          {/* Daily Fortune Wheel & Rewards Card */}
          <div className="p-6 rounded-3xl bg-[#0a0a0a] border border-amber-500/30 shadow-xl flex flex-col justify-between relative overflow-hidden">
            <div className="absolute -top-10 -right-10 w-32 h-32 bg-amber-500/15 rounded-full blur-2xl pointer-events-none" />

            <div className="space-y-2 relative z-10">
              <div className="flex items-center justify-between">
                <span className="px-2.5 py-0.5 rounded-full bg-amber-400/20 text-amber-300 border border-amber-400/40 text-[10px] font-black uppercase tracking-wider">
                  Today's Gift & Wheel
                </span>
                <span className="text-xl">🎁</span>
              </div>
              <h3 className="text-base font-extrabold text-white">Daily Fortune Wheel</h3>
              <p className="text-xs text-neutral-300 leading-relaxed">
                Spin for free daily Mindset Gems, LP boosters, Streak Shields, and 10-day streak awards.
              </p>
            </div>

            <div className="pt-4 flex items-center gap-2 relative z-10">
              <button
                onClick={() => {
                  playSoundEffect('click');
                  if (onOpenFlywheelModal) onOpenFlywheelModal();
                }}
                className="flex-1 py-3 rounded-2xl bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 hover:from-amber-300 hover:to-yellow-300 text-neutral-950 text-xs font-black uppercase tracking-wider shadow-lg shadow-amber-500/20 transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer flex items-center justify-center gap-1.5 border border-amber-300/40"
              >
                <Sparkles className="w-4 h-4 fill-current" />
                <span>Spin Daily Wheel</span>
              </button>

              <button
                onClick={() => {
                  playSoundEffect('click');
                  setIsSoundtrackModalOpen(true);
                }}
                className={`p-3 rounded-2xl border text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                  activeSoundtrack
                    ? 'bg-amber-400/20 text-amber-300 border-amber-400/50 shadow-md shadow-amber-500/10 animate-pulse'
                    : 'bg-neutral-950 text-neutral-300 hover:text-white border-neutral-800 hover:border-neutral-700'
                }`}
                title="Trivia Soundtracks Jukebox"
              >
                <Music className="w-4 h-4 text-amber-400" />
              </button>
            </div>
          </div>

        </div>

        {/* WEEKLY CHALLENGE HOLOGRAPHIC BANNER & TODAY'S QUIZZES */}
        <div className="space-y-4">
          
          {/* Holographic Weekly Challenge Card */}
          <div className="relative rounded-3xl p-6 sm:p-7 bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 text-neutral-950 shadow-2xl overflow-hidden flex flex-col sm:flex-row items-center justify-between gap-4 border border-amber-300/50">
            <div className="absolute -right-10 -bottom-10 w-44 h-44 bg-white/30 rounded-full blur-2xl pointer-events-none" />
            
            <div className="space-y-2 text-center sm:text-left relative z-10">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-neutral-950/20 backdrop-blur-md text-neutral-950 text-xs font-black">
                <Clock className="w-3.5 h-3.5" />
                <span>12:45:03 REMAINING</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-neutral-950 uppercase flex items-center justify-center sm:justify-start gap-2">
                <span>✦ WEEKLY CHALLENGE ✦</span>
              </h2>
              <p className="text-xs sm:text-sm font-bold text-neutral-950/90 max-w-lg">
                Win 3 consecutive rounds today to unlock the exclusive Cognitive Prodigy Badge & 1,500 bonus League Points!
              </p>
            </div>

            <div className="relative z-10 shrink-0">
              <button
                onClick={() => {
                  playSoundEffect('click');
                  setSelectedCategory('Growth Mindset & Brain Hacks');
                  setGameState('setup');
                }}
                className="px-6 py-3.5 rounded-2xl bg-neutral-950 hover:bg-neutral-900 text-amber-300 font-black text-xs uppercase tracking-wider shadow-xl transition-all hover:scale-105 active:scale-95 cursor-pointer flex items-center gap-2 border border-amber-400/30"
              >
                <Zap className="w-4 h-4 text-amber-400 fill-amber-400" />
                <span>Play Challenge Round</span>
              </button>
            </div>
          </div>

          {/* Live Quiz + Today Quizzes Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            
            {/* Live Quiz Featured Card */}
            <div className="p-6 rounded-3xl bg-neutral-900/90 border border-neutral-800 flex flex-col justify-between space-y-4 shadow-xl">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
                    <span className="text-xs font-black uppercase tracking-wider text-emerald-400">Live Quiz</span>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    350 Playing
                  </span>
                </div>

                <div className="space-y-1">
                  <h3 className="text-lg font-extrabold text-white">Primetime Global Showdown</h3>
                  <p className="text-xs text-neutral-400">Synchronized speed round hosted by Nova with voice banter.</p>
                </div>

                <div className="grid grid-cols-3 gap-2 pt-1 text-center">
                  <div className="p-2.5 rounded-xl bg-neutral-950 border border-neutral-800">
                    <span className="text-[9px] font-bold text-neutral-400 uppercase block">Prize Pool</span>
                    <span className="text-xs font-black text-amber-400">$80.00 / 8K LP</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-neutral-950 border border-neutral-800">
                    <span className="text-[9px] font-bold text-neutral-400 uppercase block">Winners</span>
                    <span className="text-xs font-black text-emerald-400">Top 12</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-neutral-950 border border-neutral-800">
                    <span className="text-[9px] font-bold text-neutral-400 uppercase block">Entry Fee</span>
                    <span className="text-xs font-black text-cyan-400">Free</span>
                  </div>
                </div>
              </div>

              <button
                onClick={() => {
                  playSoundEffect('click');
                  setGameState('setup');
                }}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-pink-500 via-rose-500 to-amber-500 hover:from-pink-400 hover:to-amber-400 text-white font-black text-xs uppercase tracking-wider shadow-lg shadow-pink-500/20 transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer flex items-center justify-center gap-1.5"
              >
                <Sparkles className="w-3.5 h-3.5 fill-current" />
                <span>Start Now</span>
              </button>
            </div>

            {/* Today Quizzes (6 Mini Cards) */}
            <div className="lg:col-span-2 p-6 rounded-3xl bg-neutral-900/70 border border-neutral-800 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-extrabold text-white uppercase tracking-wider flex items-center gap-2">
                  <Brain className="w-4 h-4 text-emerald-400" />
                  <span>Today's Fast-Fire Quizzes</span>
                </h3>
                <span className="text-xs text-neutral-400">Quick 5-question sprints</span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                {[
                  { name: 'Quiz 1: Growth Mindset', reward: '$30.00 / 300 LP', category: 'Growth Mindset & Brain Hacks' },
                  { name: 'Quiz 2: Tech Disruptors', reward: '10 Boldcoin', category: 'Tech, AI & Future Trends' },
                  { name: 'Quiz 3: World Geography', reward: '$35.00 / 350 LP', category: 'History & World Cultures' },
                  { name: 'Quiz 4: Creative Arts', reward: '5 Boldcoin', category: 'Pop Culture & Entertainment' },
                  { name: 'Quiz 5: Neuroscience', reward: '$50.00 / 500 LP', category: 'Neuroscience & Deep Focus' },
                  { name: 'Quiz 6: Atomic Habits', reward: '15 Boldcoin', category: 'Atomic Habits & Daily Routines' },
                ].map((q, idx) => (
                  <div
                    key={idx}
                    className="p-3 rounded-2xl bg-neutral-950 border border-neutral-800 flex flex-col justify-between hover:border-emerald-500/40 transition-all group"
                  >
                    <div className="space-y-1">
                      <span className="text-xs font-bold text-white group-hover:text-emerald-300 transition-colors block truncate">
                        {q.name}
                      </span>
                      <span className="text-[10px] font-extrabold text-amber-400 block">
                        {q.reward}
                      </span>
                    </div>

                    <button
                      onClick={() => {
                        playSoundEffect('click');
                        setSelectedCategory(q.category);
                        setGameState('setup');
                      }}
                      className="mt-3 py-1.5 rounded-lg bg-neutral-900 hover:bg-emerald-600 text-neutral-300 hover:text-white text-[10px] font-bold transition-all text-center cursor-pointer"
                    >
                      Join Now →
                    </button>
                  </div>
                ))}
              </div>
            </div>

          </div>

        </div>

      </div>
    );
  }

  // Render DEDICATED PRE-GAME SETUP PAGE (Opened from "Let's Play")
  if (gameState === 'setup') {
    return (
      <MatchSetupView
        onBackToLobby={() => setGameState('lobby')}
        profile={profile}
        selectedCategory={selectedCategory}
        setSelectedCategory={setSelectedCategory}
        selectedDifficulty={selectedDifficulty}
        setSelectedDifficulty={setSelectedDifficulty}
        gameMode={gameMode}
        setGameMode={setGameMode}
        questionCount={questionCount}
        setQuestionCount={setQuestionCount}
        selectedHost={selectedHost}
        setSelectedHost={setSelectedHost}
        onLaunchGame={handleStartGame}
        isLoadingQuestions={isLoadingQuestions}
      />
    );
  }

  // Render ROUND END summary
  if (gameState === 'round_end') {
    const accuracy = Math.round((correctCount / Math.max(1, questions.length)) * 100);
    const totalLifelinesUsed = (used5050 ? 1 : 0) + (usedFreeze ? 1 : 0) + (usedInsight ? 1 : 0) + (usedPoll ? 1 : 0);
    const avgTimeSeconds = roundSummaryResults.length > 0
      ? Math.round((roundSummaryResults.reduce((acc, curr) => acc + curr.timeSpentSeconds, 0) / roundSummaryResults.length) * 10) / 10
      : Math.round(maxTime * 0.45 * 10) / 10;
    const lpDelta = accuracy >= 80 ? 45 : accuracy >= 50 ? 25 : 10;
    const xpGained = score > 0 ? Math.round(score * 0.25) : 50;

    // Determine performance tier & theme
    const getPerformanceDetails = () => {
      if (accuracy === 100) {
        return {
          grade: 'S+',
          title: 'Flawless Grandmaster',
          sub: 'Flawless 100% precision. Unstoppable cognitive mastery!',
          gradient: 'from-amber-400 via-emerald-400 to-teal-300',
          border: 'border-amber-400/40',
          bgBadge: 'bg-amber-400/10 text-amber-300 border-amber-400/30',
          glow: 'shadow-amber-500/20 ring-amber-400/30'
        };
      }
      if (accuracy >= 80) {
        return {
          grade: 'A',
          title: 'Mindset Master',
          sub: 'Exceptional focus, speed, and analytical recall.',
          gradient: 'from-emerald-400 via-teal-400 to-cyan-400',
          border: 'border-emerald-500/40',
          bgBadge: 'bg-emerald-400/10 text-emerald-300 border-emerald-500/30',
          glow: 'shadow-emerald-500/20 ring-emerald-400/30'
        };
      }
      if (accuracy >= 60) {
        return {
          grade: 'B',
          title: 'Stoic Strategist',
          sub: 'Strong performance with decisive instincts under pressure.',
          gradient: 'from-cyan-400 via-blue-500 to-indigo-400',
          border: 'border-cyan-500/40',
          bgBadge: 'bg-cyan-400/10 text-cyan-300 border-cyan-500/30',
          glow: 'shadow-cyan-500/20 ring-cyan-400/30'
        };
      }
      if (accuracy >= 40) {
        return {
          grade: 'C',
          title: 'Disciplined Seeker',
          sub: 'Solid foundation. Review the missed insights to level up.',
          gradient: 'from-indigo-400 via-purple-400 to-pink-400',
          border: 'border-indigo-500/40',
          bgBadge: 'bg-indigo-400/10 text-indigo-300 border-indigo-500/30',
          glow: 'shadow-indigo-500/20 ring-indigo-400/30'
        };
      }
      return {
        grade: 'D',
        title: 'Resilient Learner',
        sub: 'Every mistake is fuel for neuroplastic growth and mastery.',
        gradient: 'from-rose-400 via-amber-400 to-orange-400',
        border: 'border-rose-500/40',
        bgBadge: 'bg-rose-400/10 text-rose-300 border-rose-500/30',
        glow: 'shadow-rose-500/20 ring-rose-400/30'
      };
    };

    const perf = getPerformanceDetails();

    // Trigger Fanfare & Confetti Again
    const handleReplayCelebration = () => {
      playSoundEffect('fanfare');
      try {
        confetti({
          particleCount: 80,
          spread: 80,
          origin: { y: 0.55 }
        });
      } catch {}
    };

    // Copy scorecard to clipboard
    const handleCopyScorecard = () => {
      playSoundEffect('click');
      const text = [
        `🧠 Align Mindset Trivia — Match Scorecard`,
        `🏆 Grade: ${perf.grade} (${perf.title})`,
        `🎯 Topic: ${selectedCategory} (${selectedDifficulty} • ${gameMode})`,
        `⚡ Final Score: ${score.toLocaleString()} PTS`,
        `🎯 Accuracy: ${accuracy}% (${correctCount}/${questions.length} Correct)`,
        `🔥 Peak Streak: ${peakStreak}x Combo`,
        `⏱️ Avg Response: ${avgTimeSeconds}s / question`,
        `🎙️ AI Host: ${host.name} (${host.archetype})`,
        `📈 League Points: +${lpDelta} LP (${profile.rankPoints + lpDelta} Total LP)`,
        `\nTest your knowledge & mindset at Align Mindset Trivia!`
      ].join('\n');

      if (navigator.clipboard) {
        navigator.clipboard.writeText(text).then(() => {
          setScorecardCopiedToast(true);
          setTimeout(() => setScorecardCopiedToast(false), 2800);
        }).catch(() => {
          setScorecardCopiedToast(true);
          setTimeout(() => setScorecardCopiedToast(false), 2800);
        });
      }
    };

    // Filter results for review
    const filteredResults = roundSummaryResults.length > 0 
      ? roundSummaryResults.filter(r => {
          if (reviewFilter === 'correct') return r.isCorrect;
          if (reviewFilter === 'missed') return !r.isCorrect;
          return true;
        })
      : questions.map((q, idx) => ({
          question: q,
          selectedOption: idx < correctCount ? q.correctIndex : -1,
          isCorrect: idx < correctCount,
          isTimedOut: false,
          timeSpentSeconds: 4
        }));

    return (
      <div id="round-summary-view" className="max-w-4xl mx-auto space-y-6 pb-12 animate-in zoom-in-95 duration-200">
        
        {/* Top Floating Notification Toast */}
        {scorecardCopiedToast && (
          <div className="fixed top-6 right-6 z-50 p-4 rounded-2xl bg-neutral-900/95 border border-emerald-500/60 shadow-2xl text-emerald-300 font-bold text-xs flex items-center gap-2.5 animate-in fade-in slide-in-from-top-4 backdrop-blur-md">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>Scorecard copied to clipboard! Ready to share.</span>
          </div>
        )}

        {/* Grand Championship Stage Banner */}
        <div className={`relative overflow-hidden rounded-3xl p-6 sm:p-10 bg-gradient-to-b from-neutral-900 via-neutral-900/95 to-neutral-950 border ${perf.border} shadow-2xl space-y-8 text-center ring-1 ${perf.glow}`}>
          
          {/* Subtle Ambient Radial Glow */}
          <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-96 h-96 bg-gradient-to-b from-emerald-500/10 via-cyan-500/5 to-transparent rounded-full blur-3xl pointer-events-none" />

          {/* Match Context Header Badges */}
          <div className="flex items-center justify-between gap-2 flex-wrap text-[11px] font-bold text-neutral-400 border-b border-neutral-800/80 pb-4">
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-full bg-neutral-950 border border-neutral-800 text-neutral-300">
                {selectedCategory}
              </span>
              <span className="px-2.5 py-1 rounded-full bg-neutral-950 border border-neutral-800 text-amber-400">
                {selectedDifficulty}
              </span>
              <span className="px-2.5 py-1 rounded-full bg-neutral-950 border border-neutral-800 text-cyan-400 uppercase">
                {gameMode.replace('_', ' ')}
              </span>
            </div>

            <button
              onClick={handleReplayCelebration}
              className="px-3 py-1 rounded-full bg-neutral-950 hover:bg-neutral-800 text-neutral-300 hover:text-white border border-neutral-800 flex items-center gap-1.5 transition-all cursor-pointer active:scale-95"
              title="Re-trigger Confetti & Victory Fanfare"
            >
              <PartyPopper className="w-3.5 h-3.5 text-amber-400" />
              <span>Celebrate Again</span>
            </button>
          </div>

          {/* Grade Emblem & Headline Spotlight */}
          <div className="space-y-4 relative">
            <div className="inline-flex items-center justify-center relative">
              {/* Outer Metallic Ring */}
              <div className={`w-28 h-28 sm:w-32 sm:h-32 rounded-3xl bg-gradient-to-br ${perf.gradient} p-1 shadow-2xl flex items-center justify-center rotate-3 hover:rotate-0 transition-transform duration-300`}>
                <div className="w-full h-full rounded-[22px] bg-neutral-950 flex flex-col items-center justify-center p-2">
                  <span className={`text-4xl sm:text-5xl font-black bg-gradient-to-br ${perf.gradient} bg-clip-text text-transparent`}>
                    {perf.grade}
                  </span>
                  <span className="text-[10px] font-extrabold uppercase tracking-widest text-neutral-400 mt-0.5">
                    Tier Rank
                  </span>
                </div>
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border text-xs font-black uppercase tracking-wider mb-1 shadow-inner">
                <Trophy className="w-3.5 h-3.5 text-amber-400" />
                <span className={`bg-gradient-to-r ${perf.gradient} bg-clip-text text-transparent`}>
                  {perf.title}
                </span>
              </div>
              <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
                Match Summary & Evaluation
              </h2>
              <p className="text-xs sm:text-sm text-neutral-300 max-w-lg mx-auto font-medium">
                {perf.sub}
              </p>
            </div>
          </div>

          {/* AI Host Post-Match Spotlight Card */}
          <div className="rounded-3xl p-5 sm:p-6 bg-neutral-950/80 border border-neutral-800/90 flex flex-col sm:flex-row items-center sm:items-start gap-4 text-left shadow-lg">
            <div className="relative shrink-0">
              <HostVectorGraphic hostId={host.id} size="md" className="shrink-0 ring-2 ring-emerald-500/20" />
              {isHostSpeaking && (
                <span className="absolute -bottom-1 -right-1 flex h-4 w-4">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-4 w-4 bg-emerald-500" />
                </span>
              )}
            </div>

            <div className="flex-1 space-y-2 text-center sm:text-left">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center justify-center sm:justify-start gap-2">
                  <span className="font-extrabold text-sm text-white">{host.name}</span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-neutral-900 text-emerald-400 border border-neutral-800">
                    {host.archetype}
                  </span>
                  <span className="text-[10px] text-neutral-400 hidden sm:inline">
                    • Voice: {host.voiceName}
                  </span>
                </div>

                {/* Listen to Host Summary TTS Button */}
                <button
                  type="button"
                  onClick={() => speakDialogue(hostDialogue)}
                  className={`self-center sm:self-auto px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                    isHostSpeaking
                      ? 'bg-amber-500 text-neutral-950 font-black shadow-md animate-pulse'
                      : 'bg-neutral-900 hover:bg-neutral-800 text-neutral-200 border border-neutral-700'
                  }`}
                  aria-label={isHostSpeaking ? "Stop host audio speech" : "Listen to host voice commentary"}
                >
                  {isHostSpeaking ? (
                    <>
                      <VolumeX className="w-3.5 h-3.5" />
                      <span>Stop Voice</span>
                    </>
                  ) : (
                    <>
                      <Volume2 className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Hear Host Evaluation</span>
                    </>
                  )}
                </button>
              </div>

              <p className="text-xs sm:text-sm text-neutral-200 leading-relaxed font-medium italic">
                "{hostDialogue}"
              </p>

              {/* Cognitive Lesson Callout */}
              <div className="pt-2 border-t border-neutral-900 flex items-center gap-2 text-[11px] text-neutral-400">
                <Lightbulb className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <span>
                  <strong>Coach Insight:</strong> Maintaining deliberate focus on difficult questions accelerates pattern recognition by 2.4x.
                </span>
              </div>
            </div>
          </div>

          {/* 6-Card KPI Performance Bento Matrix */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 text-left">
            
            {/* 1. Final Score */}
            <div className="p-4 rounded-2xl bg-neutral-950/70 border border-neutral-800/90 shadow-sm flex flex-col justify-between space-y-2">
              <div className="flex items-center justify-between text-neutral-400">
                <span className="text-[10px] font-extrabold uppercase tracking-wider">Final Score</span>
                <Zap className="w-3.5 h-3.5 text-emerald-400" />
              </div>
              <div>
                <p className="text-2xl font-black text-emerald-400 tracking-tight">
                  {score.toLocaleString()}
                </p>
                <span className="text-[10px] text-neutral-500 font-semibold block mt-0.5">
                  +{Math.round(score * 0.15)} Speed Bonus
                </span>
              </div>
            </div>

            {/* 2. Accuracy */}
            <div className="p-4 rounded-2xl bg-neutral-950/70 border border-neutral-800/90 shadow-sm flex flex-col justify-between space-y-2">
              <div className="flex items-center justify-between text-neutral-400">
                <span className="text-[10px] font-extrabold uppercase tracking-wider">Accuracy</span>
                <Target className="w-3.5 h-3.5 text-cyan-400" />
              </div>
              <div>
                <p className="text-2xl font-black text-cyan-400 tracking-tight">
                  {accuracy}%
                </p>
                <div className="w-full h-1.5 rounded-full bg-neutral-800 mt-1.5 overflow-hidden">
                  <div
                    className="h-full bg-cyan-400 rounded-full transition-all duration-1000"
                    style={{ width: `${accuracy}%` }}
                  />
                </div>
                <span className="text-[10px] text-neutral-400 font-semibold block mt-1">
                  {correctCount} of {questions.length} Correct
                </span>
              </div>
            </div>

            {/* 3. Peak Streak */}
            <div className="p-4 rounded-2xl bg-neutral-950/70 border border-neutral-800/90 shadow-sm flex flex-col justify-between space-y-2">
              <div className="flex items-center justify-between text-neutral-400">
                <span className="text-[10px] font-extrabold uppercase tracking-wider">Peak Streak</span>
                <Flame className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
              </div>
              <div>
                <p className="text-2xl font-black text-amber-400 tracking-tight flex items-center gap-1">
                  <span>{peakStreak}x</span>
                  <span className="text-xs text-amber-300/80 font-bold">({multiplier}x)</span>
                </p>
                <span className="text-[10px] text-neutral-500 font-semibold block mt-0.5">
                  Max combo multiplier
                </span>
              </div>
            </div>

            {/* 4. League Rank Points */}
            <div className="p-4 rounded-2xl bg-neutral-950/70 border border-neutral-800/90 shadow-sm flex flex-col justify-between space-y-2">
              <div className="flex items-center justify-between text-neutral-400">
                <span className="text-[10px] font-extrabold uppercase tracking-wider">League Points</span>
                <TrendingUp className="w-3.5 h-3.5 text-indigo-400" />
              </div>
              <div>
                <p className="text-2xl font-black text-indigo-400 tracking-tight">
                  +{lpDelta} LP
                </p>
                <span className="text-[10px] text-neutral-400 font-semibold block mt-0.5">
                  {profile.rankPoints.toLocaleString()} Total LP
                </span>
              </div>
            </div>

            {/* 5. Avg Speed */}
            <div className="p-4 rounded-2xl bg-neutral-950/70 border border-neutral-800/90 shadow-sm flex flex-col justify-between space-y-2">
              <div className="flex items-center justify-between text-neutral-400">
                <span className="text-[10px] font-extrabold uppercase tracking-wider">Avg Speed</span>
                <Clock className="w-3.5 h-3.5 text-teal-400" />
              </div>
              <div>
                <p className="text-2xl font-black text-teal-400 tracking-tight">
                  {avgTimeSeconds}s
                </p>
                <span className="text-[10px] text-neutral-500 font-semibold block mt-0.5">
                  Per question
                </span>
              </div>
            </div>

            {/* 6. Lifelines Used */}
            <div className="p-4 rounded-2xl bg-neutral-950/70 border border-neutral-800/90 shadow-sm flex flex-col justify-between space-y-2">
              <div className="flex items-center justify-between text-neutral-400">
                <span className="text-[10px] font-extrabold uppercase tracking-wider">Lifelines</span>
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              </div>
              <div>
                <p className="text-2xl font-black text-emerald-400 tracking-tight">
                  {totalLifelinesUsed}/4
                </p>
                <span className="text-[10px] text-neutral-500 font-semibold block mt-0.5">
                  {totalLifelinesUsed === 0 ? 'Pure Grit (0 used)' : `${totalLifelinesUsed} used this run`}
                </span>
              </div>
            </div>

          </div>

          {/* Action Button Suite */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-6 border-t border-neutral-800/80">
            
            {/* Play Again (Primary CTA) */}
            <button
              onClick={handleStartGame}
              className="w-full sm:w-auto px-7 py-3.5 rounded-2xl bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 hover:from-amber-300 hover:to-yellow-300 text-neutral-950 font-black text-sm flex items-center justify-center gap-2 shadow-xl shadow-amber-500/25 transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer border border-amber-300/40"
            >
              <RotateCcw className="w-4 h-4 stroke-[2.5]" />
              <span>Play Rematch</span>
            </button>

            {/* Copy Scorecard */}
            <button
              onClick={handleCopyScorecard}
              className="w-full sm:w-auto px-5 py-3.5 rounded-2xl bg-neutral-900 hover:bg-neutral-800 text-neutral-200 hover:text-white font-bold text-sm flex items-center justify-center gap-2 border border-neutral-700/80 transition-all cursor-pointer"
            >
              <Copy className="w-4 h-4 text-cyan-400" />
              <span>Copy Scorecard</span>
            </button>

            {/* Share to Hub */}
            <button
              onClick={() => {
                playSoundEffect('click');
                onOpenSocialHub();
              }}
              className="w-full sm:w-auto px-5 py-3.5 rounded-2xl bg-neutral-900 hover:bg-neutral-800 text-neutral-200 hover:text-white font-bold text-sm flex items-center justify-center gap-2 border border-neutral-700/80 transition-all cursor-pointer"
            >
              <Share2 className="w-4 h-4 text-amber-400" />
              <span>Share to Feed</span>
            </button>

            {/* Back to Lobby */}
            <button
              onClick={() => {
                playSoundEffect('click');
                setGameState('lobby');
              }}
              className="w-full sm:w-auto px-5 py-3.5 rounded-2xl bg-neutral-950 hover:bg-neutral-900 text-neutral-400 hover:text-neutral-200 font-semibold text-sm border border-neutral-800 transition-all cursor-pointer"
            >
              <span>Back to Lobby</span>
            </button>

          </div>

        </div>

        {/* Interactive Question-by-Question Deep Dive Review Accordion */}
        <div className="rounded-3xl p-6 sm:p-8 bg-neutral-900/80 border border-neutral-800/90 shadow-xl space-y-5">
          
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-neutral-800">
            <div>
              <h3 className="font-extrabold text-lg text-white flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-emerald-400" />
                <span>Round Question Breakdown & Learning Takeaways</span>
              </h3>
              <p className="text-xs text-neutral-400 mt-0.5">
                Inspect your answers, verified source citations, and key mindset lessons from each question.
              </p>
            </div>

            {/* Filter Pills */}
            <div className="flex items-center gap-1.5 bg-neutral-950 p-1 rounded-xl border border-neutral-800 self-start sm:self-auto">
              <button
                onClick={() => setReviewFilter('all')}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  reviewFilter === 'all'
                    ? 'bg-neutral-800 text-white'
                    : 'text-neutral-400 hover:text-neutral-200'
                }`}
              >
                All ({questions.length})
              </button>
              <button
                onClick={() => setReviewFilter('correct')}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  reviewFilter === 'correct'
                    ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/30'
                    : 'text-neutral-400 hover:text-emerald-400'
                }`}
              >
                Correct ({correctCount})
              </button>
              <button
                onClick={() => setReviewFilter('missed')}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  reviewFilter === 'missed'
                    ? 'bg-rose-950 text-rose-300 border border-rose-500/30'
                    : 'text-neutral-400 hover:text-rose-400'
                }`}
              >
                Missed ({questions.length - correctCount})
              </button>
            </div>
          </div>

          {/* Question List Cards */}
          <div className="space-y-3">
            {filteredResults.map((item, idx) => {
              const q = item.question;
              const isExpanded = expandedQuestionIndex === idx;
              const isCorrect = item.isCorrect;
              const userPickedOptionText = item.selectedOption >= 0 ? q.options[item.selectedOption] : 'Time Expired';
              const correctOptionText = q.options[q.correctIndex];

              return (
                <div
                  key={idx}
                  className={`rounded-2xl border transition-all overflow-hidden ${
                    isCorrect
                      ? 'bg-neutral-950/60 border-neutral-800/80 hover:border-emerald-500/40'
                      : 'bg-neutral-950/80 border-rose-900/40 hover:border-rose-500/40'
                  }`}
                >
                  {/* Collapsed Header Bar */}
                  <button
                    onClick={() => setExpandedQuestionIndex(isExpanded ? null : idx)}
                    className="w-full p-4 sm:p-5 flex items-center justify-between gap-3 text-left focus:outline-none cursor-pointer"
                  >
                    <div className="flex items-center gap-3.5 min-w-0">
                      {/* Status Icon */}
                      <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                        isCorrect
                          ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                          : 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
                      }`}>
                        {isCorrect ? (
                          <CheckCircle2 className="w-4 h-4 stroke-[2.5]" />
                        ) : (
                          <XCircle className="w-4 h-4 stroke-[2.5]" />
                        )}
                      </div>

                      <div className="min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <span className="text-xs font-bold text-neutral-400">
                            Q{idx + 1}
                          </span>
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-neutral-900 text-neutral-300 border border-neutral-800">
                            {q.difficulty}
                          </span>
                          <span className="text-[10px] font-semibold text-neutral-500">
                            ⏱️ {item.timeSpentSeconds}s
                          </span>
                        </div>
                        <p className="text-xs sm:text-sm font-semibold text-white truncate max-w-xl">
                          {q.question}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <span className={`text-xs font-bold hidden sm:inline ${isCorrect ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {isCorrect ? '+Points Earned' : 'Missed'}
                      </span>
                      <div className="p-1 rounded-lg bg-neutral-900 text-neutral-400">
                        {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </div>
                    </div>
                  </button>

                  {/* Expanded Detail Panel */}
                  {isExpanded && (
                    <div className="p-5 pt-0 border-t border-neutral-800/80 space-y-4 animate-in fade-in duration-150">
                      
                      {/* Full Question Text */}
                      <p className="text-sm sm:text-base font-bold text-white pt-3 leading-relaxed">
                        {q.question}
                      </p>

                      {/* Answers Comparison Grid */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                        
                        {/* Your Choice */}
                        <div className={`p-3.5 rounded-xl border ${
                          isCorrect
                            ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-200'
                            : 'bg-rose-950/40 border-rose-500/40 text-rose-200'
                        }`}>
                          <span className="text-[10px] font-bold uppercase tracking-wider block mb-1 opacity-75">
                            Your Selection:
                          </span>
                          <div className="flex items-center gap-2 font-bold">
                            {isCorrect ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <XCircle className="w-4 h-4 text-rose-400" />}
                            <span>{userPickedOptionText}</span>
                          </div>
                        </div>

                        {/* Correct Solution */}
                        <div className="p-3.5 rounded-xl bg-emerald-950/30 border border-emerald-500/30 text-emerald-200">
                          <span className="text-[10px] font-bold uppercase tracking-wider block mb-1 text-emerald-400">
                            Correct Answer:
                          </span>
                          <div className="flex items-center gap-2 font-bold text-white">
                            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                            <span>{correctOptionText}</span>
                          </div>
                        </div>

                      </div>

                      {/* Explanation */}
                      <div className="p-4 rounded-xl bg-neutral-900/90 border border-neutral-800 space-y-2">
                        <span className="text-xs font-bold text-neutral-300 block">Explanation:</span>
                        <p className="text-xs sm:text-sm text-neutral-300 leading-relaxed font-normal">
                          {q.explanation}
                        </p>
                      </div>

                      {/* Mindset Takeaway Insight */}
                      {q.mindsetInsight && (
                        <div className="p-3.5 rounded-xl bg-emerald-950/20 border border-emerald-500/30 flex items-start gap-2.5">
                          <Brain className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                          <div className="text-xs text-emerald-200/90 leading-relaxed">
                            <strong className="text-emerald-300 font-bold block mb-0.5">Mindset Lesson:</strong>
                            <span>{q.mindsetInsight}</span>
                          </div>
                        </div>
                      )}

                      {/* Grounding Source Link */}
                      {q.citations && q.citations.length > 0 && (
                        <div className="flex items-center gap-2 pt-1">
                          <ExternalLink className="w-3.5 h-3.5 text-cyan-400" />
                          <span className="text-xs text-neutral-400">Verified Sources:</span>
                          <div className="flex flex-wrap gap-2">
                            {q.citations.map((c, i) => (
                              <a
                                key={i}
                                href={c.uri}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-xs text-cyan-300 hover:underline flex items-center gap-1 font-medium"
                              >
                                <span>{c.title || `Source ${i+1}`}</span>
                              </a>
                            ))}
                          </div>
                        </div>
                      )}

                    </div>
                  )}
                </div>
              );
            })}
          </div>

        </div>

      </div>
    );
  }

  // Active PLAYING view
  return (
    <div id="active-trivia-match-view" className="max-w-4xl mx-auto space-y-4 animate-in fade-in duration-150">
      
      {/* AI Host Live Stage Banner */}
      <div className="rounded-3xl p-4 sm:p-5 bg-gradient-to-r from-neutral-900 via-neutral-900 to-neutral-950 border border-neutral-800 shadow-xl flex flex-col sm:flex-row items-center gap-4">
        
        {/* Host Avatar with animated speaking aura */}
        <div className="relative shrink-0">
          <div
            className={`transition-transform ${
              isHostSpeaking ? 'scale-105 ring-4 ring-emerald-500/50 rounded-3xl animate-pulse' : ''
            }`}
          >
            <HostVectorGraphic hostId={host.id} size="md" className="shrink-0" />
          </div>
          {isHostSpeaking && (
            <span className="absolute -bottom-1 -right-1 flex h-4 w-4">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-4 w-4 bg-emerald-500" />
            </span>
          )}
        </div>

        {/* Host Dialogue Speech Bubble */}
        <div className="flex-1 text-center sm:text-left space-y-1">
          <div className="flex items-center justify-center sm:justify-start gap-2">
            <span className="text-xs font-bold text-white">{host.name}</span>
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-neutral-800 text-neutral-400 border border-neutral-700">
              {host.archetype}
            </span>
            {isHostSpeaking && (
              <span className="text-[10px] font-bold text-emerald-400 animate-pulse flex items-center gap-1">
                <Volume2 className="w-3 h-3" /> Speaking...
              </span>
            )}
          </div>
          <p className="text-xs sm:text-sm text-neutral-200 leading-relaxed font-medium">
            "{hostDialogue}"
          </p>
        </div>

        {/* Quick Voice / Live Actions */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => speakDialogue(hostDialogue)}
            className="p-2.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-300 transition-colors border border-neutral-700"
            title="Replay Host Audio"
            aria-label="Replay Host Audio"
          >
            <Volume2 className="w-4 h-4 text-emerald-400" />
          </button>
          <button
            onClick={onOpenVoiceModal}
            className="px-3 py-2 rounded-xl bg-cyan-950 border border-cyan-500/40 text-cyan-300 text-xs font-bold flex items-center gap-1.5 hover:bg-cyan-900/60"
            title="Open Interactive Live Voice Bridge"
          >
            <Radio className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
            <span className="hidden sm:inline">Voice Room</span>
          </button>
        </div>

      </div>

      {/* Match HUD & Timer */}
      <div className="flex items-center justify-between gap-3 px-2">
        <div className="flex items-center gap-3">
          <span className="text-xs font-bold px-3 py-1 rounded-full bg-neutral-800 text-neutral-300 border border-neutral-700">
            Question {currentIndex + 1} of {questions.length}
          </span>
          <span className="text-xs font-semibold text-neutral-400 hidden sm:inline-block">
            {currentQ?.category}
          </span>
        </div>

        {/* Score & Streak */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 px-3 py-1 rounded-full bg-neutral-900 border border-neutral-800 text-xs font-black text-emerald-400">
            <span>{score.toLocaleString()} PTS</span>
          </div>

          {streak > 0 && (
            <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-950/80 border border-amber-500/40 text-xs font-black text-amber-300 animate-bounce">
              <Flame className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
              <span>{streak}x Streak ({multiplier}x)</span>
            </div>
          )}
        </div>
      </div>

      {/* Timer Bar */}
      {gameMode !== 'mindset_reflection' && (
        <div className="w-full h-2 rounded-full bg-neutral-800 overflow-hidden relative">
          <div
            className={`h-full transition-all duration-1000 ${
              timeLeft <= 4 ? 'bg-rose-500' : timeLeft <= 8 ? 'bg-amber-400' : 'bg-emerald-500'
            }`}
            style={{ width: `${(timeLeft / maxTime) * 100}%` }}
          />
        </div>
      )}

      {/* Main Question Card */}
      <div className="rounded-3xl p-6 sm:p-8 bg-neutral-900/90 border border-neutral-800 shadow-2xl space-y-6">
        
        {/* Category & Grounding Pill */}
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <span className="text-xs font-bold px-2.5 py-1 rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            {currentQ?.difficulty}
          </span>

          {currentQ?.citations && currentQ.citations.length > 0 && (
            <button
              onClick={() => setShowCitationModal(true)}
              className="flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-md bg-cyan-950/70 text-cyan-300 border border-cyan-500/30 hover:bg-cyan-900 transition-colors"
            >
              <ExternalLink className="w-3 h-3 text-cyan-400" />
              <span>Google Verified</span>
            </button>
          )}
        </div>

        {/* Question Text */}
        <h2 className="text-lg sm:text-2xl font-bold text-white leading-relaxed">
          {currentQ?.question}
        </h2>

        {/* 4 Choices Grid (>=44px touch targets) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3" role="radiogroup" aria-label="Trivia choices">
          {currentQ?.options.map((opt, idx) => {
            const isSelected = selectedOption === idx;
            const isCorrect = idx === currentQ.correctIndex;
            const isEliminated = eliminatedOptions.includes(idx);

            let btnStyle = 'bg-neutral-950/70 border-neutral-800 hover:border-neutral-700 text-neutral-200';

            if (isEliminated) {
              btnStyle = 'opacity-25 pointer-events-none bg-neutral-950/30 border-neutral-900 text-neutral-600';
            } else if (isAnswerRevealed) {
              if (isCorrect) {
                btnStyle = 'bg-emerald-950/80 border-emerald-500 text-emerald-100 ring-2 ring-emerald-500';
              } else if (isSelected && !isCorrect) {
                btnStyle = 'bg-rose-950/80 border-rose-500 text-rose-100 ring-2 ring-rose-500';
              }
            } else if (isSelected) {
              btnStyle = 'bg-neutral-800 border-emerald-400 text-white';
            }

            const letterLabel = ['A', 'B', 'C', 'D'][idx];

            return (
              <button
                key={idx}
                onClick={() => handleSelectOption(idx)}
                disabled={isAnswerRevealed || isEliminated}
                className={`min-h-[56px] p-4 rounded-2xl text-left border font-semibold text-sm sm:text-base flex items-center gap-3.5 transition-all duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 ${btnStyle}`}
                aria-label={`Option ${letterLabel}: ${opt}`}
              >
                <div className={`w-8 h-8 rounded-xl font-bold flex items-center justify-center text-xs shrink-0 ${
                  isAnswerRevealed && isCorrect
                    ? 'bg-emerald-500 text-neutral-950'
                    : isAnswerRevealed && isSelected && !isCorrect
                    ? 'bg-rose-500 text-white'
                    : 'bg-neutral-800 text-neutral-300'
                }`}>
                  {letterLabel}
                </div>
                <span className="flex-1 leading-snug">{opt}</span>

                {/* Poll Results Indicator */}
                {pollResults && (
                  <span className="text-xs font-bold px-2 py-0.5 rounded bg-neutral-800 text-cyan-300">
                    {pollResults[idx]}%
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Revealed Explanation & Mindset Takeaway */}
        {isAnswerRevealed && (
          <div className="rounded-2xl p-5 bg-neutral-950/90 border border-neutral-800 space-y-3 animate-in fade-in duration-200">
            <div className="flex items-center gap-2">
              {selectedOption === currentQ.correctIndex ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
              ) : (
                <XCircle className="w-5 h-5 text-rose-400 shrink-0" />
              )}
              <span className="font-bold text-sm text-white">
                {selectedOption === currentQ.correctIndex ? 'Spot on! Correct answer.' : 'Learning Moment! Here is why:'}
              </span>
            </div>

            <p className="text-xs sm:text-sm text-neutral-300 leading-relaxed">
              {currentQ.explanation}
            </p>

            <div className="pt-2 border-t border-neutral-800/80 flex items-start gap-2">
              <Brain className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <span className="text-xs font-medium text-emerald-300/90 italic">
                Mindset Takeaway: {currentQ.mindsetInsight}
              </span>
            </div>
          </div>
        )}

        {/* Lifelines & Voice Answer Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-neutral-800">
          
          {/* Lifelines Buttons */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleUse5050}
              disabled={used5050 || isAnswerRevealed}
              className={`px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 border transition-all ${
                used5050
                  ? 'opacity-40 bg-neutral-950 border-neutral-800 text-neutral-500'
                  : 'bg-neutral-800 hover:bg-neutral-700 text-neutral-200 border-neutral-700'
              }`}
              title="50/50: Drop 2 wrong choices"
            >
              <Scissors className="w-3.5 h-3.5 text-amber-400" />
              <span>50/50</span>
            </button>

            <button
              onClick={handleUseInsight}
              disabled={usedInsight || isAnswerRevealed}
              className={`px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 border transition-all ${
                usedInsight
                  ? 'opacity-40 bg-neutral-950 border-neutral-800 text-neutral-500'
                  : 'bg-neutral-800 hover:bg-neutral-700 text-neutral-200 border-neutral-700'
              }`}
              title="Ask AI Host for a smart clue"
            >
              <HelpCircle className="w-3.5 h-3.5 text-emerald-400" />
              <span>Host Clue</span>
            </button>

            <button
              onClick={handleUseFreeze}
              disabled={usedFreeze || isAnswerRevealed || gameMode === 'mindset_reflection'}
              className={`px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 border transition-all ${
                usedFreeze
                  ? 'opacity-40 bg-neutral-950 border-neutral-800 text-neutral-500'
                  : 'bg-neutral-800 hover:bg-neutral-700 text-neutral-200 border-neutral-700'
              }`}
              title="Freeze Timer (+15s)"
            >
              <Hourglass className="w-3.5 h-3.5 text-cyan-400" />
              <span>+15s</span>
            </button>

            <button
              onClick={handleUsePoll}
              disabled={usedPoll || isAnswerRevealed}
              className={`px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 border transition-all ${
                usedPoll
                  ? 'opacity-40 bg-neutral-950 border-neutral-800 text-neutral-500'
                  : 'bg-neutral-800 hover:bg-neutral-700 text-neutral-200 border-neutral-700'
              }`}
              title="See what the crowd would guess"
            >
              <Users className="w-3.5 h-3.5 text-indigo-400" />
              <span>Crowd Pick</span>
            </button>
          </div>

          {/* Voice Input or Next Question */}
          <div className="flex items-center gap-2">
            {!isAnswerRevealed ? (
              <button
                onClick={toggleVoiceRecognition}
                className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all border ${
                  isListeningVoice
                    ? 'bg-rose-600 text-white border-rose-500 animate-pulse'
                    : 'bg-neutral-800 hover:bg-neutral-700 text-neutral-200 border-neutral-700'
                }`}
                aria-label="Speak answer verbally"
              >
                {isListeningVoice ? <Mic className="w-4 h-4" /> : <MicOff className="w-4 h-4 text-neutral-400" />}
                <span>{isListeningVoice ? 'Listening...' : 'Voice Answer'}</span>
              </button>
            ) : (
              <button
                id="next-question-btn"
                onClick={handleNextQuestion}
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 hover:from-amber-300 hover:to-yellow-300 text-neutral-950 font-black text-xs sm:text-sm flex items-center gap-2 shadow-lg shadow-amber-500/25 uppercase tracking-wide cursor-pointer border border-amber-300/40"
              >
                <span>{currentIndex + 1 < questions.length ? 'Next Question' : 'View Results'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            )}
          </div>

        </div>

      </div>

      {/* Citation Sources Modal */}
      {showCitationModal && currentQ?.citations && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-950/80 backdrop-blur-sm animate-in fade-in"
          role="dialog"
          aria-label="Search Grounding Sources"
        >
          <div className="w-full max-w-md rounded-3xl bg-neutral-900 border border-neutral-800 p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-800">
              <span className="font-bold text-sm text-white flex items-center gap-2">
                <ExternalLink className="w-4 h-4 text-cyan-400" />
                <span>Verified Source Citations</span>
              </span>
              <button
                onClick={() => setShowCitationModal(false)}
                className="p-1 rounded-lg text-neutral-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-neutral-300">
              This question was dynamically verified and grounded using Google Search data.
            </p>

            <div className="space-y-2">
              {currentQ.citations.map((c, i) => (
                <a
                  key={i}
                  href={c.uri}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-3 rounded-xl bg-neutral-950/70 border border-neutral-800 hover:border-cyan-500/50 flex items-center justify-between text-xs text-cyan-300 font-medium transition-colors"
                >
                  <span className="truncate max-w-[280px]">{c.title || c.uri}</span>
                  <ExternalLink className="w-3.5 h-3.5 shrink-0" />
                </a>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Funny Trivia Soundtracks Jukebox Modal */}
      {isSoundtrackModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-950/85 backdrop-blur-md animate-in fade-in"
          role="dialog"
          aria-label="Funny Trivia Soundtracks Jukebox"
        >
          <div className="w-full max-w-lg rounded-3xl bg-neutral-900 border border-neutral-800 p-6 space-y-5 shadow-2xl">
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-neutral-800">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400 text-lg">
                  🎵
                </div>
                <div>
                  <h3 className="font-extrabold text-base text-white">Funny Trivia Soundtrack Jukebox</h3>
                  <p className="text-[11px] text-neutral-400">Play real-time synthesized comedy & tension audio tracks</p>
                </div>
              </div>
              <button
                onClick={() => {
                  playSoundEffect('click');
                  setIsSoundtrackModalOpen(false);
                }}
                className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Tracks List */}
            <div className="space-y-2.5 max-h-[340px] overflow-y-auto pr-1">
              {SOUNDTRACK_TRACKS.map(track => {
                const isPlaying = activeSoundtrack === track.id;
                return (
                  <div
                    key={track.id}
                    className={`p-3.5 rounded-2xl border transition-all flex items-center justify-between gap-3 ${
                      isPlaying
                        ? 'bg-amber-950/40 border-amber-500 ring-1 ring-amber-500/30'
                        : 'bg-neutral-950/70 border-neutral-800/90 hover:border-neutral-700'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-2xl shrink-0">{track.emoji}</span>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-xs sm:text-sm text-white">{track.title}</span>
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-neutral-800 text-amber-400 border border-neutral-700">
                            {track.genre}
                          </span>
                        </div>
                        <p className="text-[11px] text-neutral-400 mt-0.5">{track.description}</p>
                      </div>
                    </div>

                    <button
                      onClick={() => toggleSoundtrack(track.id)}
                      className={`px-3.5 py-2 rounded-xl text-xs font-bold shrink-0 transition-all flex items-center gap-1.5 cursor-pointer ${
                        isPlaying
                          ? 'bg-amber-500 text-neutral-950 shadow-md shadow-amber-500/20'
                          : 'bg-neutral-800 hover:bg-neutral-700 text-neutral-200'
                      }`}
                    >
                      {isPlaying ? (
                        <>
                          <VolumeX className="w-3.5 h-3.5" />
                          <span>Stop</span>
                        </>
                      ) : (
                        <>
                          <Volume2 className="w-3.5 h-3.5" />
                          <span>Play</span>
                        </>
                      )}
                    </button>
                  </div>
                );
              })}
            </div>

            {/* Online Free Music Sources & Guide */}
            <div className="p-3.5 rounded-2xl bg-neutral-950 border border-neutral-800 space-y-1.5">
              <div className="flex items-center gap-1.5 text-xs font-bold text-neutral-300">
                <Info className="w-3.5 h-3.5 text-cyan-400" />
                <span>Recommended Online Royalty-Free Soundtracks:</span>
              </div>
              <p className="text-[11px] text-neutral-400 leading-relaxed">
                Need more funny tracks? Explore <strong>Incompetech (Kevin MacLeod)</strong> for iconic comedy/game show music, <strong>Freesound.org</strong> for funny buzzer/applause FX, and <strong>Pixabay Music</strong> for royalty-free gameshow loops!
              </p>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-between pt-2 border-t border-neutral-800">
              {activeSoundtrack ? (
                <span className="text-xs text-amber-400 font-bold flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
                  <span>Now Playing: {SOUNDTRACK_TRACKS.find(t => t.id === activeSoundtrack)?.title}</span>
                </span>
              ) : (
                <span className="text-xs text-neutral-500">No soundtrack currently playing</span>
              )}

              <button
                onClick={() => {
                  playSoundEffect('click');
                  setIsSoundtrackModalOpen(false);
                }}
                className="px-4 py-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs font-bold transition-colors cursor-pointer"
              >
                Close Jukebox
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
