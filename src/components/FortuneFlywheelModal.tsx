import React, { useState, useEffect, useRef } from 'react';
import {
  Sparkles,
  Gift,
  Trophy,
  Flame,
  CheckCircle2,
  X,
  Zap,
  Shield,
  Coins,
  Crown,
  Star,
  RotateCw,
  Award,
  ChevronRight,
  Clock,
  Compass,
  ArrowRight,
  Layers,
  HeartHandshake
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import confetti from 'canvas-confetti';
import { PlayerProfile, LeagueTier } from '../types';
import { playSoundEffect } from '../utils/audio';

interface WheelSector {
  id: string;
  label: string;
  sub: string;
  color: string;
  textColor: string;
  icon: string;
  type: 'gem' | 'xp' | 'shield' | 'lp' | 'coins' | 'badge' | 'multiplier' | 'box';
  amount: number;
}

const SECTORS: WheelSector[] = [
  { id: 'gem_blue', label: 'Mindset Gem', sub: '+100 LP & Boost', color: '#06b6d4', textColor: '#ffffff', icon: '💎', type: 'gem', amount: 100 },
  { id: 'xp_500', label: '500 XP', sub: 'Cognitive Surge', color: '#10b981', textColor: '#ffffff', icon: '⚡', type: 'xp', amount: 500 },
  { id: 'shield_freeze', label: 'Streak Shield', sub: 'Streak Protection', color: '#8b5cf6', textColor: '#ffffff', icon: '🛡️', type: 'shield', amount: 1 },
  { id: 'lp_250', label: '250 LP', sub: 'League Climb', color: '#f59e0b', textColor: '#000000', icon: '🏆', type: 'lp', amount: 250 },
  { id: 'box_mystery', label: 'Mystery Box', sub: 'Host Secret Gift', color: '#ec4899', textColor: '#ffffff', icon: '🎁', type: 'box', amount: 1 },
  { id: 'coins_1000', label: '1,000 Coins', sub: 'Alignment Vault', color: '#eab308', textColor: '#000000', icon: '🪙', type: 'coins', amount: 1000 },
  { id: 'mult_2x', label: '2x Multiplier', sub: 'Next Match Boost', color: '#14b8a6', textColor: '#ffffff', icon: '🔥', type: 'multiplier', amount: 2 },
  { id: 'shard_rare', label: 'Rare Shard', sub: 'Badge Crafting', color: '#6366f1', textColor: '#ffffff', icon: '✨', type: 'badge', amount: 1 },
];

const DAILY_REWARDS_CALENDAR = [
  { day: 1, label: 'Day 1', reward: '500 XP', icon: '⚡', type: 'xp', value: 500 },
  { day: 2, label: 'Day 2', reward: '750 XP', icon: '⚡', type: 'xp', value: 750 },
  { day: 3, label: 'Day 3', reward: '1,000 Coins', icon: '🪙', type: 'coins', value: 1000 },
  { day: 4, label: 'Day 4', reward: 'Streak Shield', icon: '🛡️', type: 'shield', value: 1, isSpecial: true },
  { day: 5, label: 'Day 5', reward: '2,000 Coins', icon: '🪙', type: 'coins', value: 2000 },
  { day: 6, label: 'Day 6', reward: '3,000 XP', icon: '⚡', type: 'xp', value: 3000 },
  { day: 7, label: 'Day 7', reward: 'Mindset Gem', icon: '💎', type: 'gem', value: 1, isSpecial: true },
  { day: 8, label: 'Day 8', reward: '100 LP', icon: '🏆', type: 'lp', value: 100 },
  { day: 9, label: 'Day 9', reward: '200 LP', icon: '🏆', type: 'lp', value: 200 },
  { day: 10, label: 'Day 10', reward: 'Grandmaster Box', icon: '👑', type: 'box', value: 1, isSpecial: true, isGrand: true },
];

const DAILY_MISSIONS = [
  { id: 'm1', title: 'Play 2 Trivia Matches', desc: 'Engage with AI Host in any topic', progress: 1, max: 2, reward: '350 XP', icon: '🧠', completed: false },
  { id: 'm2', title: 'Achieve 5x Speed Streak', desc: 'Answer 5 questions right in a row', progress: 5, max: 5, reward: '500 Coins', icon: '🔥', completed: true, claimed: false },
  { id: 'm3', title: 'Spin the Fortune Wheel', desc: 'Claim your daily lucky spin', progress: 1, max: 1, reward: '50 LP', icon: '🎡', completed: true, claimed: true },
  { id: 'm4', title: 'Voice Dialogue with Host', desc: 'Interact in the Live Voice Room', progress: 0, max: 1, reward: '1 Mindset Gem', icon: '🎙️', completed: false },
];

interface FortuneFlywheelModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile: PlayerProfile;
  setProfile: React.Dispatch<React.SetStateAction<PlayerProfile>>;
}

export const FortuneFlywheelModal: React.FC<FortuneFlywheelModalProps> = ({
  isOpen,
  onClose,
  profile,
  setProfile
}) => {
  const [activeTab, setActiveTab] = useState<'wheel' | 'calendar' | 'missions' | 'trophy'>('wheel');
  
  // Wheel State
  const [isSpinning, setIsSpinning] = useState<boolean>(false);
  const [wheelRotation, setWheelRotation] = useState<number>(0);
  const [wonSector, setWonSector] = useState<WheelSector | null>(null);
  const [showPrizePopup, setShowPrizePopup] = useState<boolean>(false);
  const [spinsRemaining, setSpinsRemaining] = useState<number>(1);
  const [lastSpinDate, setLastSpinDate] = useState<string>('');

  // Daily Streak Calendar State
  const [claimedDays, setClaimedDays] = useState<number[]>([1, 2, 3]);
  const currentStreakDay = Math.min(10, (profile?.currentStreakDays || 1) % 10 || 4);
  const [claimedMissions, setClaimedMissions] = useState<string[]>(['m3']);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Check spin availability
  useEffect(() => {
    try {
      const storedDate = localStorage.getItem('align_trivia_last_spin_date');
      const today = new Date().toDateString();
      if (storedDate === today) {
        setSpinsRemaining(0);
      } else {
        setSpinsRemaining(1);
      }
      setLastSpinDate(storedDate || '');
    } catch {}
  }, [isOpen]);

  // Render Canvas Wheel
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const numSectors = SECTORS.length;
    const arc = (2 * Math.PI) / numSectors;
    const radius = canvas.width / 2;
    const centerX = radius;
    const centerY = radius;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw Wheel Sectors
    SECTORS.forEach((sector, i) => {
      const angle = i * arc;
      
      // Sector Path
      ctx.beginPath();
      ctx.fillStyle = sector.color;
      ctx.moveTo(centerX, centerY);
      ctx.arc(centerX, centerY, radius - 8, angle, angle + arc);
      ctx.lineTo(centerX, centerY);
      ctx.fill();

      // Outer rim stroke
      ctx.lineWidth = 2;
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
      ctx.stroke();

      // Subtle sector divider
      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.lineTo(
        centerX + Math.cos(angle) * (radius - 8),
        centerY + Math.sin(angle) * (radius - 8)
      );
      ctx.lineWidth = 2;
      ctx.strokeStyle = 'rgba(15, 23, 42, 0.9)';
      ctx.stroke();

      // Draw Label & Icon
      ctx.save();
      ctx.translate(centerX, centerY);
      ctx.rotate(angle + arc / 2);

      // Icon & Label Text
      ctx.textAlign = 'right';
      ctx.fillStyle = sector.textColor;
      ctx.font = 'bold 13px system-ui, -apple-system, sans-serif';
      ctx.shadowColor = 'rgba(0,0,0,0.5)';
      ctx.shadowBlur = 4;
      ctx.fillText(`${sector.icon} ${sector.label}`, radius - 24, 5);

      ctx.restore();
    });

    // Outer Decorative Ring with Light Bulbs
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius - 4, 0, 2 * Math.PI);
    ctx.lineWidth = 8;
    ctx.strokeStyle = '#0f172a';
    ctx.stroke();

    // Bulb Dots around rim
    const totalBulbs = 24;
    for (let b = 0; b < totalBulbs; b++) {
      const bulbAngle = (b / totalBulbs) * (2 * Math.PI);
      const bx = centerX + Math.cos(bulbAngle) * (radius - 4);
      const by = centerY + Math.sin(bulbAngle) * (radius - 4);
      ctx.beginPath();
      ctx.arc(bx, by, 3, 0, 2 * Math.PI);
      ctx.fillStyle = b % 2 === 0 ? '#fbbf24' : '#38bdf8';
      ctx.shadowColor = b % 2 === 0 ? '#f59e0b' : '#0284c7';
      ctx.shadowBlur = 6;
      ctx.fill();
    }
  }, []);

  // Spin the Wheel Action with realistic Physics
  const handleSpin = () => {
    if (isSpinning) return;
    playSoundEffect('click');

    setIsSpinning(true);
    setShowPrizePopup(false);

    // Pick random winning index
    const winningIndex = Math.floor(Math.random() * SECTORS.length);
    const sectorArc = 360 / SECTORS.length;
    
    // Pointer is at the top (270 degrees in standard math or 0 deg top pointer)
    // Target sector center: winningIndex * sectorArc + sectorArc / 2
    // We want the wheel rotation so that sector lands under top pointer (270 deg offset)
    const extraSpins = (5 + Math.floor(Math.random() * 3)) * 360; // 5 to 7 full rotations
    // The top pointer points at angle 270 (or -90 deg).
    const targetAngle = 270 - (winningIndex * sectorArc + sectorArc / 2);
    const finalRotation = wheelRotation + extraSpins + (targetAngle - (wheelRotation % 360) + 360) % 360;

    setWheelRotation(finalRotation);

    // Deceleration sound ticks
    let tickCount = 0;
    const tickInterval = setInterval(() => {
      if (tickCount < 20) {
        playSoundEffect('click');
        tickCount++;
      } else {
        clearInterval(tickInterval);
      }
    }, 180);

    // Conclude spin after 4.5 seconds
    setTimeout(() => {
      const prize = SECTORS[winningIndex];
      setWonSector(prize);
      setIsSpinning(false);
      setShowPrizePopup(true);
      setSpinsRemaining(0);
      try {
        localStorage.setItem('align_trivia_last_spin_date', new Date().toDateString());
      } catch {}

      playSoundEffect('fanfare');
      confetti({
        particleCount: 100,
        spread: 90,
        origin: { y: 0.5 }
      });

      // Apply prize to profile
      setProfile(prev => {
        let updatedLP = prev.rankPoints;
        if (prize.type === 'lp' || prize.type === 'gem') {
          updatedLP += prize.amount;
        }
        return {
          ...prev,
          rankPoints: updatedLP
        };
      });
    }, 4500);
  };

  // Claim Daily Calendar Day
  const handleClaimCalendarDay = (day: number, item: typeof DAILY_REWARDS_CALENDAR[0]) => {
    if (claimedDays.includes(day)) return;
    playSoundEffect('fanfare');
    setClaimedDays(prev => [...prev, day]);
    
    confetti({
      particleCount: 60,
      spread: 70,
      origin: { y: 0.6 }
    });

    setProfile(prev => ({
      ...prev,
      rankPoints: item.type === 'lp' ? prev.rankPoints + item.value : prev.rankPoints
    }));
  };

  // Claim Mission
  const handleClaimMission = (id: string, reward: string) => {
    playSoundEffect('fanfare');
    setClaimedMissions(prev => [...prev, id]);
    confetti({
      particleCount: 50,
      spread: 60,
      origin: { y: 0.6 }
    });
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto bg-neutral-950/80 backdrop-blur-md">
        
        {/* Animated Modal Container */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          className="relative w-full max-w-2xl rounded-3xl bg-gradient-to-b from-neutral-900 via-neutral-900 to-neutral-950 border border-neutral-800 shadow-2xl overflow-hidden flex flex-col my-auto max-h-[92vh]"
        >
          {/* Top Decorative Ambient Glow */}
          <div className="absolute -top-20 left-1/2 -translate-x-1/2 w-80 h-80 bg-emerald-500/15 rounded-full blur-3xl pointer-events-none" />

          {/* Modal Header */}
          <div className="relative z-10 px-6 pt-6 pb-4 border-b border-neutral-800/80 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-amber-400 to-emerald-400 p-0.5 shadow-lg shadow-amber-500/20 flex items-center justify-center">
                <div className="w-full h-full rounded-[14px] bg-neutral-950 flex items-center justify-center text-lg">
                  🎁
                </div>
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-lg sm:text-xl font-black text-white">Daily Rewards & Fortune Wheel</h2>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-400/10 text-amber-400 border border-amber-400/30">
                    Live Prizes
                  </span>
                </div>
                <p className="text-xs text-neutral-400">Spin the daily flywheel, claim streak awards, and unlock trophy bonuses</p>
              </div>
            </div>

            <button
              onClick={() => {
                playSoundEffect('click');
                onClose();
              }}
              className="p-2 rounded-xl bg-neutral-800/80 hover:bg-neutral-700 text-neutral-400 hover:text-white transition-colors cursor-pointer"
              aria-label="Close Rewards Modal"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Segmented Sub-Tab Switcher */}
          <div className="px-6 pt-4 pb-2">
            <div className="grid grid-cols-4 gap-1 p-1 bg-neutral-950 rounded-2xl border border-neutral-800">
              {[
                { id: 'wheel', label: 'Lucky Wheel', icon: RotateCw },
                { id: 'calendar', label: '10-Day Streak', icon: Gift },
                { id: 'missions', label: 'Missions', icon: Zap },
                { id: 'trophy', label: 'Showcase', icon: Trophy },
              ].map(t => {
                const Icon = t.icon;
                const isActive = activeTab === t.id;
                return (
                  <button
                    key={t.id}
                    onClick={() => {
                      playSoundEffect('click');
                      setActiveTab(t.id as any);
                    }}
                    className={`py-2 px-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                      isActive
                        ? 'bg-neutral-800 text-white shadow-md border border-neutral-700/60'
                        : 'text-neutral-400 hover:text-neutral-200'
                    }`}
                  >
                    <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-emerald-400' : ''}`} />
                    <span className="hidden sm:inline">{t.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Modal Body with scroll */}
          <div className="p-6 overflow-y-auto space-y-6 flex-1">
            
            {/* TAB 1: FORTUNE FLYWHEEL (Spin the Wheel) */}
            {activeTab === 'wheel' && (
              <div className="space-y-6 text-center">
                
                {/* Wheel & Pointer Container */}
                <div className="relative inline-flex items-center justify-center p-4">
                  
                  {/* Glowing Spotlight Behind Wheel */}
                  <div className="absolute inset-0 bg-gradient-to-tr from-emerald-500/20 via-cyan-500/10 to-amber-500/20 rounded-full blur-2xl pointer-events-none" />

                  {/* Top Pointer Needle Indicator */}
                  <div className="absolute -top-1 left-1/2 -translate-x-1/2 z-30 flex flex-col items-center">
                    <div className="w-6 h-7 bg-gradient-to-b from-white via-amber-300 to-amber-500 rounded-b-full shadow-xl shadow-amber-500/50 border border-white" />
                    <div className="w-2 h-2 rounded-full bg-neutral-950 -mt-3 z-10" />
                  </div>

                  {/* Rotating Wheel Canvas Container */}
                  <div
                    className="relative w-64 h-64 sm:w-80 sm:h-80 rounded-full shadow-2xl border-4 border-neutral-800/80 overflow-hidden"
                    style={{
                      transform: `rotate(${wheelRotation}deg)`,
                      transition: isSpinning ? 'transform 4.5s cubic-bezier(0.15, 0.9, 0.25, 1)' : 'none'
                    }}
                  >
                    <canvas
                      ref={canvasRef}
                      width={320}
                      height={320}
                      className="w-full h-full object-cover"
                    />
                  </div>

                  {/* Center Hub Spin Button */}
                  <button
                    onClick={handleSpin}
                    disabled={isSpinning || spinsRemaining <= 0}
                    className={`absolute z-20 w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-gradient-to-br from-amber-400 via-emerald-400 to-teal-500 p-1 shadow-2xl flex items-center justify-center transition-all cursor-pointer ${
                      isSpinning
                        ? 'opacity-80 scale-95 animate-pulse cursor-not-allowed'
                        : spinsRemaining > 0
                        ? 'hover:scale-105 active:scale-95 shadow-emerald-500/40 ring-4 ring-neutral-950'
                        : 'opacity-60 cursor-not-allowed'
                    }`}
                    aria-label="Spin the fortune wheel"
                  >
                    <div className="w-full h-full rounded-full bg-neutral-950 flex flex-col items-center justify-center text-white">
                      <RotateCw className={`w-5 h-5 text-amber-400 mb-0.5 ${isSpinning ? 'animate-spin' : ''}`} />
                      <span className="text-[11px] sm:text-xs font-black uppercase tracking-wider">
                        {isSpinning ? 'Spinning...' : spinsRemaining > 0 ? 'SPIN' : 'Claimed'}
                      </span>
                    </div>
                  </button>

                </div>

                {/* Status & Spin Counter */}
                <div className="flex items-center justify-center gap-3 text-xs">
                  <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-neutral-950 border border-neutral-800 text-neutral-300 font-bold">
                    <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                    <span>Daily Free Spins: <strong>{spinsRemaining}/1</strong></span>
                  </div>
                  {spinsRemaining === 0 && (
                    <span className="text-neutral-400 text-xs flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-neutral-500" /> Next spin in <strong className="text-neutral-300">Tonight at 00:00</strong>
                    </span>
                  )}
                </div>

                {/* Prize Details Card */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-left pt-2">
                  {SECTORS.slice(0, 4).map(s => (
                    <div key={s.id} className="p-3 rounded-2xl bg-neutral-950/60 border border-neutral-800/80">
                      <div className="text-lg mb-1">{s.icon}</div>
                      <span className="text-xs font-bold text-white block truncate">{s.label}</span>
                      <span className="text-[10px] text-neutral-400 block">{s.sub}</span>
                    </div>
                  ))}
                </div>

              </div>
            )}

            {/* TAB 2: 10-DAY DAILY STREAK REWARDS CALENDAR (Matching Reference Image 2) */}
            {activeTab === 'calendar' && (
              <div className="space-y-5">
                
                {/* 3D-styled Daily Chest Hero Banner */}
                <div className="relative rounded-3xl p-5 bg-gradient-to-r from-neutral-950 via-neutral-900 to-neutral-950 border border-neutral-800 overflow-hidden flex flex-col sm:flex-row items-center gap-4 text-center sm:text-left">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-400 via-pink-500 to-purple-600 p-0.5 shrink-0 shadow-xl shadow-pink-500/20 flex items-center justify-center">
                    <div className="w-full h-full rounded-[14px] bg-neutral-950 flex items-center justify-center text-3xl">
                      🎁
                    </div>
                  </div>
                  <div className="space-y-1 flex-1">
                    <div className="flex items-center justify-center sm:justify-start gap-2">
                      <span className="text-xs font-black uppercase tracking-wider text-amber-400">Daily Login Reward</span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 font-bold">
                        Streak: {profile.currentStreakDays} Days 🔥
                      </span>
                    </div>
                    <p className="text-xs text-neutral-300 leading-relaxed">
                      Claim bonus Coins, LP and Mindset Gems without missing consecutive days. Day 10 unlocks the Grandmaster Prize Box!
                    </p>
                  </div>
                </div>

                {/* 10-Day Cards Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
                  {DAILY_REWARDS_CALENDAR.map(item => {
                    const isClaimed = claimedDays.includes(item.day);
                    const isCurrent = item.day === currentStreakDay && !isClaimed;
                    const isLocked = item.day > currentStreakDay && !isClaimed;

                    return (
                      <div
                        key={item.day}
                        className={`relative rounded-2xl p-3.5 text-center flex flex-col justify-between border transition-all ${
                          isClaimed
                            ? 'bg-neutral-950/60 border-neutral-800/80 text-neutral-500'
                            : isCurrent
                            ? 'bg-gradient-to-b from-amber-500/10 via-neutral-900 to-neutral-950 border-amber-400 ring-2 ring-amber-400/30 shadow-lg shadow-amber-500/10'
                            : 'bg-neutral-950/80 border-neutral-800 text-neutral-400'
                        }`}
                      >
                        {/* Day Number */}
                        <div className="flex items-center justify-between text-[10px] font-bold text-neutral-400 mb-1">
                          <span>{item.label}</span>
                          {isClaimed && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />}
                        </div>

                        {/* Reward Icon & Value */}
                        <div className="my-2">
                          <div className="text-2xl mb-0.5">{item.icon}</div>
                          <span className={`text-xs font-black block ${isCurrent ? 'text-amber-300' : isClaimed ? 'text-neutral-500' : 'text-white'}`}>
                            {item.reward}
                          </span>
                        </div>

                        {/* Claim / Status CTA */}
                        {isCurrent ? (
                          <button
                            onClick={() => handleClaimCalendarDay(item.day, item)}
                            className="w-full py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-emerald-500 hover:from-amber-400 hover:to-emerald-400 text-neutral-950 font-black text-[10px] uppercase tracking-wider shadow-md cursor-pointer transition-all active:scale-95"
                          >
                            Claim
                          </button>
                        ) : isClaimed ? (
                          <span className="text-[10px] font-bold text-emerald-400 py-1">Claimed ✓</span>
                        ) : (
                          <span className="text-[10px] text-neutral-500 py-1">Locked 🔒</span>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Big Bottom Action Button */}
                <button
                  onClick={() => {
                    const todayItem = DAILY_REWARDS_CALENDAR.find(i => i.day === currentStreakDay);
                    if (todayItem && !claimedDays.includes(currentStreakDay)) {
                      handleClaimCalendarDay(currentStreakDay, todayItem);
                    }
                  }}
                  disabled={claimedDays.includes(currentStreakDay)}
                  className={`w-full py-3.5 rounded-2xl font-black text-sm flex items-center justify-center gap-2 shadow-xl transition-all ${
                    !claimedDays.includes(currentStreakDay)
                      ? 'bg-gradient-to-r from-pink-500 via-amber-500 to-emerald-500 text-neutral-950 shadow-amber-500/20 hover:scale-[1.01] active:scale-[0.99] cursor-pointer'
                      : 'bg-neutral-900 border border-neutral-800 text-neutral-500 cursor-not-allowed'
                  }`}
                >
                  <Gift className="w-4 h-4" />
                  <span>{!claimedDays.includes(currentStreakDay) ? `Claim Day ${currentStreakDay} Gift Now` : "Today's Reward Already Claimed"}</span>
                </button>

              </div>
            )}

            {/* TAB 3: DAILY MISSIONS & QUESTS (Matching Reference Image 2 Right Screen) */}
            {activeTab === 'missions' && (
              <div className="space-y-4">
                
                {/* Referrals & Community Spotlight */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="p-4 rounded-2xl bg-gradient-to-br from-cyan-950/60 to-neutral-950 border border-cyan-500/30 flex items-center justify-between">
                    <div className="space-y-0.5">
                      <span className="text-[10px] font-bold text-cyan-400 uppercase tracking-wider">Multiplayer Quests</span>
                      <h4 className="text-sm font-extrabold text-white">Challenge Friends</h4>
                      <p className="text-[11px] text-neutral-400">Earn +500 LP in speed duels</p>
                    </div>
                    <span className="text-2xl">⚔️</span>
                  </div>

                  <div className="p-4 rounded-2xl bg-gradient-to-br from-amber-950/60 to-neutral-950 border border-amber-500/30 flex items-center justify-between">
                    <div className="space-y-0.5">
                      <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider">Community Initiative</span>
                      <h4 className="text-sm font-extrabold text-white">Join Global Goals</h4>
                      <p className="text-[11px] text-neutral-400">Earn exclusive group badges</p>
                    </div>
                    <span className="text-2xl">🌐</span>
                  </div>
                </div>

                {/* Missions List */}
                <div className="space-y-2.5">
                  {DAILY_MISSIONS.map(m => {
                    const isClaimed = claimedMissions.includes(m.id);
                    const isCompleted = m.progress >= m.max;

                    return (
                      <div
                        key={m.id}
                        className="p-4 rounded-2xl bg-neutral-950/80 border border-neutral-800/90 flex items-center justify-between gap-3"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-10 h-10 rounded-xl bg-neutral-900 border border-neutral-800 flex items-center justify-center text-xl shrink-0">
                            {m.icon}
                          </div>
                          <div className="min-w-0 space-y-0.5">
                            <div className="flex items-center gap-2">
                              <h4 className="text-xs sm:text-sm font-bold text-white truncate">{m.title}</h4>
                              <span className="text-[10px] font-extrabold px-2 py-0.2 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                                {m.reward}
                              </span>
                            </div>
                            <p className="text-[11px] text-neutral-400 truncate">{m.desc}</p>
                            
                            {/* Progress bar */}
                            <div className="flex items-center gap-2 pt-1">
                              <div className="w-24 h-1.5 rounded-full bg-neutral-800 overflow-hidden">
                                <div
                                  className="h-full bg-emerald-400 rounded-full"
                                  style={{ width: `${(m.progress / m.max) * 100}%` }}
                                />
                              </div>
                              <span className="text-[10px] text-neutral-400 font-semibold">{m.progress}/{m.max}</span>
                            </div>
                          </div>
                        </div>

                        {/* CTA */}
                        {isClaimed ? (
                          <span className="text-xs font-bold text-neutral-500 shrink-0">Claimed ✓</span>
                        ) : isCompleted ? (
                          <button
                            onClick={() => handleClaimMission(m.id, m.reward)}
                            className="px-3.5 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-neutral-950 font-black text-xs shrink-0 cursor-pointer shadow-md transition-all active:scale-95"
                          >
                            Claim
                          </button>
                        ) : (
                          <span className="text-xs font-semibold text-neutral-500 shrink-0">In Progress</span>
                        )}
                      </div>
                    );
                  })}
                </div>

              </div>
            )}

            {/* TAB 4: TROPHY CUP & GRANDMASTER SHOWCASE (Matching Reference Image 2 Left Screen) */}
            {activeTab === 'trophy' && (
              <div className="space-y-6 text-center py-2">
                
                {/* 3D-styled Trophy on Pedestal */}
                <div className="relative inline-flex items-center justify-center p-6">
                  <div className="absolute inset-0 bg-gradient-to-b from-amber-400/20 via-pink-500/10 to-transparent rounded-full blur-3xl pointer-events-none" />

                  <div className="relative flex flex-col items-center">
                    {/* Glowing Floating Star Award */}
                    <motion.div
                      animate={{ y: [0, -6, 0] }}
                      transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
                      className="w-24 h-24 sm:w-28 sm:h-28 rounded-3xl bg-gradient-to-br from-amber-400 via-orange-500 to-yellow-300 p-1 shadow-2xl shadow-amber-500/30 flex items-center justify-center rotate-3"
                    >
                      <div className="w-full h-full rounded-[22px] bg-neutral-950 flex flex-col items-center justify-center text-4xl">
                        🏆
                      </div>
                    </motion.div>

                    {/* Tier Pedestal */}
                    <div className="w-44 h-8 bg-gradient-to-r from-neutral-800 via-neutral-700 to-neutral-800 rounded-2xl shadow-xl border border-neutral-600 -mt-2 z-10 flex items-center justify-center">
                      <span className="text-[10px] font-black uppercase tracking-widest text-amber-300">
                        Season Championship Cup
                      </span>
                    </div>
                  </div>
                </div>

                <div className="space-y-1 max-w-md mx-auto">
                  <span className="text-xs font-bold uppercase tracking-widest text-emerald-400">Mastery Showcase</span>
                  <h3 className="text-2xl font-black text-white">Align Mindset Grand Prix</h3>
                  <p className="text-xs text-neutral-300 leading-relaxed">
                    Compete in daily trivia rounds, accumulate League Points, and win rare physical & digital contestant honors at the end of the season.
                  </p>
                </div>

                <div className="grid grid-cols-3 gap-2.5 max-w-md mx-auto pt-2 text-left">
                  <div className="p-3 rounded-2xl bg-neutral-950 border border-neutral-800">
                    <span className="text-[10px] font-bold text-neutral-400 uppercase">Season Pool</span>
                    <p className="text-lg font-black text-amber-400">100K PTS</p>
                  </div>
                  <div className="p-3 rounded-2xl bg-neutral-950 border border-neutral-800">
                    <span className="text-[10px] font-bold text-neutral-400 uppercase">Your Tier</span>
                    <p className="text-lg font-black text-emerald-400">{profile.leagueTier}</p>
                  </div>
                  <div className="p-3 rounded-2xl bg-neutral-950 border border-neutral-800">
                    <span className="text-[10px] font-bold text-neutral-400 uppercase">LP Rank</span>
                    <p className="text-lg font-black text-cyan-400">#{profile.globalRank || 14}</p>
                  </div>
                </div>

              </div>
            )}

          </div>

          {/* Winning Prize Modal Overlay ("You won a Blue Gem!" - Image 1 Center Screen) */}
          {showPrizePopup && wonSector && (
            <div className="absolute inset-0 z-40 bg-neutral-950/95 backdrop-blur-md p-6 flex flex-col items-center justify-center text-center space-y-6 animate-in zoom-in-95 duration-200">
              
              <div className="relative">
                {/* Radial Ray Beams */}
                <div className="absolute inset-0 bg-gradient-to-br from-cyan-400/30 via-emerald-400/20 to-amber-400/30 rounded-full blur-3xl animate-pulse" />

                <motion.div
                  initial={{ scale: 0, rotate: -20 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ type: 'spring', damping: 15 }}
                  className="w-28 h-28 sm:w-32 sm:h-32 rounded-3xl bg-gradient-to-br from-cyan-400 via-emerald-400 to-teal-300 p-1 shadow-2xl flex items-center justify-center"
                >
                  <div className="w-full h-full rounded-[22px] bg-neutral-950 flex items-center justify-center text-5xl">
                    {wonSector.icon}
                  </div>
                </motion.div>
              </div>

              <div className="space-y-1.5 max-w-sm">
                <span className="text-xs font-black uppercase tracking-widest text-amber-400">
                  🎉 Fortune Wheel Award!
                </span>
                <h3 className="text-2xl sm:text-3xl font-black text-white">
                  You won a {wonSector.label}!
                </h3>
                <p className="text-xs text-neutral-300 font-medium">
                  {wonSector.sub}. Your account balance and mastery progress have been updated.
                </p>
              </div>

              <button
                onClick={() => {
                  playSoundEffect('click');
                  setShowPrizePopup(false);
                }}
                className="px-8 py-3.5 rounded-2xl bg-gradient-to-r from-emerald-400 to-teal-400 hover:from-emerald-300 hover:to-teal-300 text-neutral-950 font-black text-sm uppercase tracking-wider shadow-xl shadow-emerald-500/25 transition-all hover:scale-105 active:scale-95 cursor-pointer"
              >
                Collect & Continue
              </button>
            </div>
          )}

        </motion.div>

      </div>
    </AnimatePresence>
  );
};
