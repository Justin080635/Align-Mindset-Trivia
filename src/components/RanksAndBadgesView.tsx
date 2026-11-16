import React, { useState, useEffect } from 'react';
import {
  Trophy,
  Award,
  Crown,
  Medal,
  Flame,
  Search,
  Filter,
  Users,
  Shield,
  TrendingUp,
  Sparkles,
  ChevronRight,
  Zap,
  Target,
  X,
  Check,
  Lock,
  Star,
  BrainCircuit,
  Mic,
  ShieldCheck,
  CalendarCheck,
  ArrowUpRight,
  Swords,
  Layers,
  Share2,
  Radio
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { LeaderboardEntry, LeagueTier, PlayerProfile, Badge } from '../types';
import { ALL_BADGES, BENCHMARK_TOP_BOSSES } from '../data/mockData';
import { playSoundEffect } from '../utils/audio';
import { BadgeVectorGraphic } from './BadgeVectorGraphic';
import { BadgeShareCardModal } from './BadgeShareCardModal';
import { subscribeToGlobalLeaderboard, buildUnifiedLeaderboard } from '../lib/firebase';

interface RanksAndBadgesViewProps {
  profile: PlayerProfile;
  setProfile: React.Dispatch<React.SetStateAction<PlayerProfile>>;
  initialSubTab?: 'standings' | 'badges';
  onOpenSocialHub?: () => void;
}

export const RanksAndBadgesView: React.FC<RanksAndBadgesViewProps> = ({
  profile,
  setProfile,
  initialSubTab = 'standings',
  onOpenSocialHub
}) => {
  // Sub-tab switcher: 'standings' (League Rankings) vs 'badges' (Trophy Room)
  const [subTab, setSubTab] = useState<'standings' | 'badges'>(initialSubTab);

  // Leaderboard state
  const [timeframe, setTimeframe] = useState<'all_time' | 'weekly' | 'daily'>('weekly');
  const [selectedTierFilter, setSelectedTierFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [comparedUser, setComparedUser] = useState<LeaderboardEntry | null>(null);

  // Real-time Firestore entries
  const [entries, setEntries] = useState<LeaderboardEntry[]>(() =>
    buildUnifiedLeaderboard([], profile)
  );

  // Subscribe to live Firestore leaderboard
  useEffect(() => {
    const unsubscribe = subscribeToGlobalLeaderboard(updatedList => {
      setEntries(updatedList);
    }, profile);

    return () => unsubscribe();
  }, [profile.rankPoints, profile.highestStreak, profile.accuracyRate, profile.id, profile.username]);

  // Badges state
  const [badgeCategory, setBadgeCategory] = useState<string>('all');
  const [selectedBadge, setSelectedBadge] = useState<Badge | null>(null);
  const [sharingBadge, setSharingBadge] = useState<Badge | null>(null);

  // Filter leaderboard
  const filteredLeaderboard = entries.filter(entry => {
    if (selectedTierFilter !== 'all' && entry.tier !== selectedTierFilter) {
      return false;
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return entry.username.toLowerCase().includes(q) || entry.handle.toLowerCase().includes(q);
    }
    return true;
  });

  // Filter badges
  const filteredBadges = (ALL_BADGES || []).filter(b => {
    if (badgeCategory === 'all') return true;
    return b.category === badgeCategory;
  });

  const unlockedIds = profile?.unlockedBadgeIds || [];
  const totalBadgesUnlocked = (ALL_BADGES || []).filter(b => unlockedIds.includes(b.id)).length;
  const badgeCompletionPercent = Math.round((totalBadgesUnlocked / (ALL_BADGES.length || 1)) * 100);

  // Toggle Showcase Badge
  const toggleShowcase = (badgeId: string) => {
    playSoundEffect('click');
    setProfile(prev => {
      const currentShowcase = prev.showcaseBadgeIds || [];
      const isShowcased = currentShowcase.includes(badgeId);
      let updated: string[];
      if (isShowcased) {
        updated = currentShowcase.filter(id => id !== badgeId);
      } else {
        if (currentShowcase.length >= 3) {
          updated = [...currentShowcase.slice(1), badgeId];
        } else {
          updated = [...currentShowcase, badgeId];
        }
      }
      return { ...prev, showcaseBadgeIds: updated };
    });
  };

  const getTierColor = (tier: LeagueTier) => {
    switch (tier) {
      case 'Mindset Master':
        return 'text-rose-400 bg-rose-500/10 border-rose-500/30';
      case 'Diamond':
        return 'text-cyan-400 bg-cyan-500/10 border-cyan-500/30';
      case 'Platinum':
        return 'text-teal-400 bg-teal-500/10 border-teal-500/30';
      case 'Gold':
        return 'text-amber-400 bg-amber-500/10 border-amber-500/30';
      case 'Silver':
        return 'text-slate-300 bg-slate-500/10 border-slate-500/30';
      case 'Bronze':
      default:
        return 'text-amber-600 bg-amber-700/10 border-amber-700/30';
    }
  };

  const getBadgeIcon = (iconName: string) => {
    switch (iconName) {
      case 'BrainCircuit':
        return <BrainCircuit className="w-6 h-6 text-emerald-400" />;
      case 'Zap':
        return <Zap className="w-6 h-6 text-amber-400" />;
      case 'Mic':
        return <Mic className="w-6 h-6 text-cyan-400" />;
      case 'Crown':
        return <Crown className="w-6 h-6 text-yellow-400" />;
      case 'Flame':
        return <Flame className="w-6 h-6 text-orange-400" />;
      case 'ShieldCheck':
        return <ShieldCheck className="w-6 h-6 text-indigo-400" />;
      case 'Users':
        return <Users className="w-6 h-6 text-teal-400" />;
      case 'CalendarCheck':
        return <CalendarCheck className="w-6 h-6 text-rose-400" />;
      case 'Sparkles':
        return <Sparkles className="w-6 h-6 text-purple-400" />;
      case 'Trophy':
      default:
        return <Trophy className="w-6 h-6 text-amber-400" />;
    }
  };

  const getRarityBadge = (rarity: Badge['rarity']) => {
    switch (rarity) {
      case 'Legendary':
        return 'bg-gradient-to-r from-amber-500 to-yellow-300 text-neutral-950 font-black border-amber-300 shadow-md';
      case 'Epic':
        return 'bg-purple-500/20 text-purple-300 border-purple-500/40';
      case 'Rare':
        return 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40';
      case 'Common':
      default:
        return 'bg-neutral-800 text-neutral-300 border-neutral-700';
    }
  };

  return (
    <motion.div
      id="ranks-and-badges-view"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className="space-y-6"
    >
      
      {/* COMPREHENSIVE MASTERY HUB HEADER BANNER */}
      <div className="rounded-3xl p-6 sm:p-8 bg-gradient-to-br from-neutral-900 via-neutral-900 to-neutral-950 border border-neutral-800 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 -ml-16 -mb-16 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          
          {/* Main Title & Status */}
          <div className="space-y-2 max-w-xl">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-bold px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center gap-1.5">
                <Trophy className="w-3.5 h-3.5" />
                <span>Competitive Mastery</span>
              </span>
              <span className={`text-xs font-bold px-3 py-1 rounded-full border ${getTierColor(profile?.leagueTier || 'Diamond')}`}>
                {profile?.leagueTier || 'Diamond'} Division
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              Ranks & Achievements
            </h1>
            <p className="text-xs sm:text-sm text-neutral-300 leading-relaxed">
              Ascend the weekly league standings, compete with players worldwide, and earn prestigious badges by unlocking mindset milestones.
            </p>
          </div>

          {/* Quick Composite Stats Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 bg-neutral-950/80 p-4 rounded-2xl border border-neutral-800/90 shadow-inner">
            
            {/* Rank Standing */}
            <div className="space-y-0.5">
              <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">League Standing</span>
              <div className="flex items-center gap-1.5">
                <span className="text-base sm:text-lg font-black text-white">#14</span>
                <span className="text-[10px] font-bold text-emerald-400 flex items-center">
                  <TrendingUp className="w-3 h-3 mr-0.5" /> +3
                </span>
              </div>
              <span className="text-[10px] text-neutral-400 font-semibold">{profile?.rankPoints || 0} LP</span>
            </div>

            {/* Badges Progress */}
            <div className="space-y-0.5">
              <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">Badges Trophy Room</span>
              <div className="flex items-center gap-1.5">
                <span className="text-base sm:text-lg font-black text-amber-400">{totalBadgesUnlocked}</span>
                <span className="text-[10px] text-neutral-400">/ {ALL_BADGES.length}</span>
              </div>
              <div className="w-20 sm:w-24 h-1.5 bg-neutral-800 rounded-full overflow-hidden mt-1">
                <div
                  className="h-full bg-gradient-to-r from-amber-500 to-emerald-400 rounded-full"
                  style={{ width: `${badgeCompletionPercent}%` }}
                />
              </div>
            </div>

            {/* Neuroplasticity & Streak */}
            <div className="col-span-2 sm:col-span-1 space-y-0.5 pt-1 sm:pt-0 border-t sm:border-t-0 border-neutral-800">
              <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">Accuracy & Streak</span>
              <div className="flex items-center gap-2">
                <span className="text-base sm:text-lg font-black text-emerald-400">{profile?.accuracyRate || 0}%</span>
                <span className="text-xs font-bold text-amber-400 flex items-center gap-0.5">
                  <Flame className="w-3.5 h-3.5 fill-amber-400" /> {profile?.currentStreakDays || 0}d
                </span>
              </div>
              <span className="text-[10px] text-neutral-400 font-semibold">Promotion Safe</span>
            </div>

          </div>

        </div>

        {/* METICULOUS SUB-VIEW SEGMENTED SWITCHER */}
        <div className="mt-6 pt-5 border-t border-neutral-800/80 flex flex-col sm:flex-row items-center justify-between gap-4">
          
          <div className="flex items-center p-1.5 rounded-2xl bg-neutral-950/90 border border-neutral-800 w-full sm:w-auto shadow-inner">
            <button
              id="subtab-standings-btn"
              onClick={() => {
                playSoundEffect('click');
                setSubTab('standings');
              }}
              className={`relative flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition-all ${
                subTab === 'standings' ? 'text-white' : 'text-neutral-400 hover:text-neutral-200'
              }`}
            >
              {subTab === 'standings' && (
                <motion.div
                  layoutId="activeSubTabPill"
                  className="absolute inset-0 bg-emerald-600 rounded-xl shadow-md shadow-emerald-600/30 border border-emerald-400/30"
                  transition={{ type: "spring", stiffness: 450, damping: 32 }}
                />
              )}
              <span className="relative z-10 flex items-center gap-1.5">
                <Trophy className="w-4 h-4" />
                <span>League Standings</span>
              </span>
            </button>

            <button
              id="subtab-badges-btn"
              onClick={() => {
                playSoundEffect('click');
                setSubTab('badges');
              }}
              className={`relative flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition-all ${
                subTab === 'badges' ? 'text-white' : 'text-neutral-400 hover:text-neutral-200'
              }`}
            >
              {subTab === 'badges' && (
                <motion.div
                  layoutId="activeSubTabPill"
                  className="absolute inset-0 bg-emerald-600 rounded-xl shadow-md shadow-emerald-600/30 border border-emerald-400/30"
                  transition={{ type: "spring", stiffness: 450, damping: 32 }}
                />
              )}
              <span className="relative z-10 flex items-center gap-1.5">
                <Award className="w-4 h-4" />
                <span>Trophy Room & Badges</span>
                <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-white/20 text-white font-bold ml-0.5">
                  {totalBadgesUnlocked}
                </span>
              </span>
            </button>
          </div>

          <div className="text-xs text-neutral-400 font-medium hidden md:flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>Weekly Reset in <strong className="text-neutral-200">2d 14h</strong></span>
          </div>

        </div>

      </div>

      {/* SUB-VIEW 1: LEAGUE STANDINGS & LEADERBOARD */}
      {subTab === 'standings' && (
        <motion.div
          key="standings-content"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.2 }}
          className="space-y-6"
        >
          
          {/* Live Sync Status Banner */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 px-4 py-2.5 rounded-2xl bg-neutral-950/80 border border-neutral-800 text-xs">
            <div className="flex items-center gap-2">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
              </span>
              <span className="font-bold text-white">Live Global Leaderboard</span>
              <span className="text-neutral-500">•</span>
              <span className="text-neutral-400">1,000+ Player Capacity Active</span>
            </div>
            <div className="flex items-center gap-2 text-[11px] text-neutral-400">
              <span>Benchmark Targets: <strong className="text-amber-400">Elena (8,940 LP)</strong>, <strong className="text-slate-300">Kai (8,610 LP)</strong>, <strong className="text-amber-600">Amara (7,920 LP)</strong></span>
            </div>
          </div>

          {/* Controls Bar: Timeframe filters, Tier selector, Search */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-neutral-900/60 p-3 rounded-2xl border border-neutral-800">
            
            {/* Timeframe Filter Pills */}
            <div className="flex items-center gap-1.5 bg-neutral-950/80 p-1 rounded-xl border border-neutral-800 shrink-0">
              {[
                { id: 'all_time', label: 'All-Time' },
                { id: 'this_week', label: 'Weekly Season' },
                { id: 'friends', label: 'Friends' }
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => {
                    playSoundEffect('click');
                    setTimeframe(tab.id as any);
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    timeframe === tab.id
                      ? 'bg-emerald-600 text-white shadow-sm'
                      : 'text-neutral-400 hover:text-neutral-200'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Search & Tier Dropdown */}
            <div className="flex items-center gap-2 w-full md:w-auto">
              <div className="relative flex-1 md:w-56">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
                <input
                  type="text"
                  placeholder="Search competitor..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-neutral-950 border border-neutral-800 text-xs text-neutral-100 placeholder-neutral-500 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <select
                value={selectedTierFilter}
                onChange={e => {
                  playSoundEffect('click');
                  setSelectedTierFilter(e.target.value);
                }}
                className="px-3 py-1.5 rounded-xl bg-neutral-950 border border-neutral-800 text-xs font-bold text-neutral-300 focus:outline-none focus:border-emerald-500"
              >
                <option value="all">All Tiers</option>
                <option value="Mindset Master">Mindset Master</option>
                <option value="Diamond">Diamond</option>
                <option value="Platinum">Platinum</option>
                <option value="Gold">Gold</option>
                <option value="Silver">Silver</option>
                <option value="Bronze">Bronze</option>
              </select>
            </div>

          </div>

          {/* TOP 3 PODIUM CHAMPIONS (Inspired by Gameshow Leaderboard Reference) */}
          {filteredLeaderboard.length >= 3 && !searchQuery && (
            <div className="rounded-3xl p-6 bg-gradient-to-b from-neutral-900 via-neutral-900/90 to-neutral-950 border border-neutral-800 shadow-xl relative overflow-hidden">
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-40 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

              <div className="flex items-end justify-center gap-2 sm:gap-6 pt-6 pb-2 relative z-10">
                
                {/* #2 Silver (Left) */}
                {filteredLeaderboard[1] && (
                  <div className="flex flex-col items-center text-center space-y-2 flex-1 max-w-[130px] sm:max-w-[150px]">
                    <div className="relative">
                      <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full p-1 bg-gradient-to-tr from-slate-400 to-slate-200 shadow-lg shadow-slate-500/20">
                        <img
                          src={filteredLeaderboard[1].avatarUrl}
                          alt={filteredLeaderboard[1].username}
                          className="w-full h-full rounded-full object-cover"
                          referrerPolicy="no-referrer"
                        />
                      </div>
                      <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded-full bg-slate-300 text-neutral-950 text-[10px] font-black shadow-md">
                        #2
                      </div>
                    </div>
                    <div className="space-y-0.5 pt-1">
                      <span className="text-xs sm:text-sm font-bold text-white block truncate">{filteredLeaderboard[1].username}</span>
                      <span className="text-[11px] font-black text-slate-300 block">{filteredLeaderboard[1].score.toLocaleString()} LP</span>
                    </div>
                    {/* Pedestal */}
                    <div className="w-full h-14 bg-gradient-to-b from-neutral-800 to-neutral-900 rounded-t-2xl border-t-2 border-slate-400 flex items-center justify-center text-xs font-black text-slate-400">
                      2nd
                    </div>
                  </div>
                )}

                {/* #1 Champion Gold (Center Elevated) */}
                {filteredLeaderboard[0] && (
                  <div className="flex flex-col items-center text-center space-y-2 flex-1 max-w-[150px] sm:max-w-[180px] -mt-6">
                    <div className="relative">
                      <Crown className="w-6 h-6 text-amber-400 fill-amber-400 absolute -top-5 left-1/2 -translate-x-1/2 animate-bounce" />
                      <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full p-1.5 bg-gradient-to-tr from-amber-400 via-yellow-300 to-emerald-400 shadow-2xl shadow-amber-500/30 ring-4 ring-amber-400/20">
                        <img
                          src={filteredLeaderboard[0].avatarUrl}
                          alt={filteredLeaderboard[0].username}
                          className="w-full h-full rounded-full object-cover"
                          referrerPolicy="no-referrer"
                        />
                      </div>
                      <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 px-2.5 py-0.5 rounded-full bg-gradient-to-r from-amber-400 to-yellow-300 text-neutral-950 text-[10px] font-black shadow-lg">
                        #1
                      </div>
                    </div>
                    <div className="space-y-0.5 pt-1">
                      <span className="text-xs sm:text-base font-black text-amber-300 block truncate">{filteredLeaderboard[0].username}</span>
                      <span className="text-xs sm:text-sm font-black text-emerald-400 block">{filteredLeaderboard[0].score.toLocaleString()} LP</span>
                    </div>
                    {/* Pedestal */}
                    <div className="w-full h-20 bg-gradient-to-b from-amber-500/20 via-neutral-800 to-neutral-900 rounded-t-2xl border-t-2 border-amber-400 shadow-xl flex items-center justify-center text-sm font-black text-amber-300">
                      1st
                    </div>
                  </div>
                )}

                {/* #3 Bronze (Right) */}
                {filteredLeaderboard[2] && (
                  <div className="flex flex-col items-center text-center space-y-2 flex-1 max-w-[130px] sm:max-w-[150px]">
                    <div className="relative">
                      <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full p-1 bg-gradient-to-tr from-amber-700 to-amber-500 shadow-lg shadow-amber-700/20">
                        <img
                          src={filteredLeaderboard[2].avatarUrl}
                          alt={filteredLeaderboard[2].username}
                          className="w-full h-full rounded-full object-cover"
                          referrerPolicy="no-referrer"
                        />
                      </div>
                      <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded-full bg-amber-600 text-white text-[10px] font-black shadow-md">
                        #3
                      </div>
                    </div>
                    <div className="space-y-0.5 pt-1">
                      <span className="text-xs sm:text-sm font-bold text-white block truncate">{filteredLeaderboard[2].username}</span>
                      <span className="text-[11px] font-black text-amber-500 block">{filteredLeaderboard[2].score.toLocaleString()} LP</span>
                    </div>
                    {/* Pedestal */}
                    <div className="w-full h-10 bg-gradient-to-b from-neutral-800 to-neutral-900 rounded-t-2xl border-t-2 border-amber-600 flex items-center justify-center text-xs font-black text-amber-600">
                      3rd
                    </div>
                  </div>
                )}

              </div>
            </div>
          )}

          {/* Leaderboard Table / Responsive List */}
          <div className="rounded-3xl bg-neutral-900/80 border border-neutral-800 overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs sm:text-sm min-w-[620px] sm:min-w-0">
                <thead className="bg-neutral-950/70 border-b border-neutral-800 text-neutral-400 font-bold uppercase text-[10px] tracking-wider">
                  <tr>
                    <th className="py-3.5 px-4 sm:px-6">Rank</th>
                    <th className="py-3.5 px-4">Mindset Competitor</th>
                    <th className="py-3.5 px-4">League Tier</th>
                    <th className="py-3.5 px-4">Accuracy</th>
                    <th className="py-3.5 px-4">Streak</th>
                    <th className="py-3.5 px-4 text-right">League Points</th>
                    <th className="py-3.5 px-4 sm:px-6 text-center">Head-to-Head</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-800/60">
                  {filteredLeaderboard.map((entry) => {
                    const isYou = !!entry.isCurrentUser || entry.handle === profile.handle;
                    const isTopThree = entry.rank <= 3;

                    return (
                      <tr
                        key={entry.handle || entry.username}
                        className={`transition-colors ${
                          isYou
                            ? 'bg-emerald-950/40 hover:bg-emerald-950/60 border-l-4 border-l-emerald-500 font-semibold'
                            : 'hover:bg-neutral-800/40'
                        }`}
                      >
                        {/* Rank */}
                        <td className="py-4 px-4 sm:px-6 font-bold whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            {entry.rank === 1 && <Crown className="w-5 h-5 text-amber-400 fill-amber-400" />}
                            {entry.rank === 2 && <Medal className="w-5 h-5 text-slate-300" />}
                            {entry.rank === 3 && <Medal className="w-5 h-5 text-amber-600" />}
                            {!isTopThree && (
                              <span className="w-5 text-center text-neutral-400">{entry.rank}</span>
                            )}
                          </div>
                        </td>

                        {/* Player Info */}
                        <td className="py-4 px-4 whitespace-nowrap">
                          <div className="flex items-center gap-3">
                            <img
                              src={isYou ? profile.avatarUrl : entry.avatarUrl}
                              alt={entry.username}
                              className="w-8 h-8 sm:w-9 sm:h-9 rounded-full object-cover border border-neutral-700 shrink-0"
                              referrerPolicy="no-referrer"
                            />
                            <div>
                              <div className="flex items-center gap-1.5">
                                <span className={`font-bold ${isYou ? 'text-emerald-400' : 'text-white'}`}>
                                  {isYou ? `${profile.username} (You)` : entry.username}
                                </span>
                                {isYou && (
                                  <span className="text-[9px] font-bold px-1.5 py-0.2 rounded-full bg-emerald-500/20 text-emerald-300">
                                    You
                                  </span>
                                )}
                                {entry.isBenchmarkBoss && (
                                  <span className="text-[9px] font-black px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 flex items-center gap-1">
                                    <span>👑 Boss Target</span>
                                  </span>
                                )}
                              </div>
                              <span className="text-xs text-neutral-400 flex items-center gap-1.5">
                                <span>{entry.handle}</span>
                                {entry.bossTitle && (
                                  <span className="text-[10px] text-amber-400/80 italic font-medium">
                                    • {entry.bossTitle}
                                  </span>
                                )}
                              </span>
                            </div>
                          </div>
                        </td>

                        {/* Tier */}
                        <td className="py-4 px-4 whitespace-nowrap">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${getTierColor(entry.tier)}`}>
                            {entry.tier}
                          </span>
                        </td>

                        {/* Accuracy */}
                        <td className="py-4 px-4 font-semibold text-neutral-200 whitespace-nowrap">
                          {isYou ? `${profile.accuracyRate}%` : `${entry.accuracy}%`}
                        </td>

                        {/* Streak */}
                        <td className="py-4 px-4 font-semibold text-amber-400 whitespace-nowrap">
                          <span className="flex items-center gap-1">
                            <Flame className="w-3.5 h-3.5 fill-amber-400" />
                            {isYou ? profile.currentStreakDays : entry.peakStreak}
                          </span>
                        </td>

                        {/* Score */}
                        <td className="py-4 px-4 text-right font-black text-emerald-400 whitespace-nowrap">
                          {isYou ? profile.rankPoints.toLocaleString() : entry.score.toLocaleString()} LP
                        </td>

                        {/* Compare Action */}
                        <td className="py-4 px-4 sm:px-6 text-center whitespace-nowrap">
                          <button
                            onClick={() => {
                              playSoundEffect('click');
                              setComparedUser(entry);
                            }}
                            className="p-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-300 hover:text-white transition-all active:scale-95 inline-flex items-center gap-1 text-xs font-bold"
                            title={`Compare stats with ${entry.username}`}
                            aria-label={`Compare stats with ${entry.username}`}
                          >
                            <Swords className="w-3.5 h-3.5 text-emerald-400" />
                            <span className="hidden sm:inline">Compare</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

        </motion.div>
      )}

      {/* SUB-VIEW 2: TROPHY ROOM & BADGES */}
      {subTab === 'badges' && (
        <motion.div
          key="badges-content"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.2 }}
          className="space-y-6"
        >
          
          {/* Badge Category Tabs */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2">
            {[
              { id: 'all', label: 'All Badges' },
              { id: 'mindset', label: 'Mindset & Psychology' },
              { id: 'streak', label: 'Speed & Streaks' },
              { id: 'voice', label: 'Voice Interaction' },
              { id: 'social', label: 'Community & Social' },
              { id: 'mastery', label: 'Grandmaster Mastery' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => {
                  playSoundEffect('click');
                  setBadgeCategory(tab.id);
                }}
                className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all border ${
                  badgeCategory === tab.id
                    ? 'bg-emerald-600 text-white border-emerald-500 shadow-md font-extrabold'
                    : 'bg-neutral-900 text-neutral-400 border-neutral-800 hover:border-neutral-700 hover:text-white'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Badges Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredBadges.map(badge => {
              const isUnlocked = profile.unlockedBadgeIds.includes(badge.id);
              const isShowcased = profile.showcaseBadgeIds.includes(badge.id);

              return (
                <div
                  key={badge.id}
                  onClick={() => {
                    playSoundEffect('click');
                    setSelectedBadge(badge);
                  }}
                  className={`rounded-3xl p-5 border text-left flex flex-col justify-between transition-all cursor-pointer group ${
                    isUnlocked
                      ? 'bg-neutral-900/90 border-neutral-800 hover:border-emerald-500/50 shadow-xl'
                      : 'bg-neutral-950/60 border-neutral-850 opacity-60 hover:opacity-80'
                  }`}
                >
                  <div>
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div className="group-hover:scale-105 transition-transform shrink-0">
                        <BadgeVectorGraphic
                          iconName={badge.iconName}
                          badgeId={badge.id}
                          rarity={badge.rarity}
                          size="md"
                          isUnlocked={isUnlocked}
                        />
                      </div>

                      <div className="flex items-center gap-1.5">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${getRarityBadge(badge.rarity)}`}>
                          {badge.rarity}
                        </span>
                        {isShowcased && (
                          <span className="p-1 rounded-md bg-amber-500/20 text-amber-400 border border-amber-500/30" title="Showcased on Profile">
                            <Star className="w-3 h-3 fill-amber-400" />
                          </span>
                        )}
                      </div>
                    </div>

                    <h3 className="font-bold text-sm text-white mb-1">{badge.title}</h3>
                    <p className="text-xs text-neutral-400 leading-relaxed line-clamp-2 mb-3">
                      {badge.description}
                    </p>
                  </div>

                  {/* Progress & Showcase Action */}
                  <div className="pt-3 border-t border-neutral-800/80 flex items-center justify-between gap-2">
                    {isUnlocked ? (
                      <>
                        <button
                          type="button"
                          onClick={e => {
                            e.stopPropagation();
                            setSharingBadge(badge);
                          }}
                          className="text-[11px] font-bold text-emerald-400 hover:text-emerald-300 flex items-center gap-1.5 transition-colors"
                        >
                          <Share2 className="w-3.5 h-3.5" /> Share
                        </button>

                        <button
                          type="button"
                          onClick={e => {
                            e.stopPropagation();
                            toggleShowcase(badge.id);
                          }}
                          className={`text-xs font-bold px-2.5 py-1 rounded-lg border transition-all ${
                            isShowcased
                              ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                              : 'bg-neutral-800 text-neutral-300 border-neutral-700 hover:border-neutral-600'
                          }`}
                        >
                          {isShowcased ? 'Showcased' : 'Showcase'}
                        </button>
                      </>
                    ) : (
                      <div className="w-full space-y-1">
                        <div className="flex justify-between text-[10px] text-neutral-500 font-bold">
                          <span>Progress</span>
                          <span>{badge.progress} / {badge.maxProgress}</span>
                        </div>
                        <div className="w-full h-1.5 rounded-full bg-neutral-800 overflow-hidden">
                          <div
                            className="h-full bg-neutral-600 rounded-full"
                            style={{ width: `${(badge.progress / badge.maxProgress) * 100}%` }}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

        </motion.div>
      )}

      {/* HEAD-TO-HEAD COMPARISON MODAL */}
      <AnimatePresence>
        {comparedUser && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-950/80 backdrop-blur-sm"
            role="dialog"
            aria-label="Head-to-Head Comparison"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              transition={{ type: "spring", duration: 0.3 }}
              className="w-full max-w-xl rounded-3xl bg-neutral-900 border border-neutral-800 p-6 space-y-6 shadow-2xl"
            >
              <div className="flex items-center justify-between pb-3 border-b border-neutral-800">
                <span className="font-bold text-sm text-white flex items-center gap-2">
                  <Swords className="w-4 h-4 text-emerald-400" />
                  <span>Head-to-Head Comparison</span>
                </span>
                <button
                  onClick={() => setComparedUser(null)}
                  className="p-1.5 text-neutral-400 hover:text-white rounded-lg hover:bg-neutral-800"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* You */}
                <div className="p-4 rounded-2xl bg-neutral-950/70 border border-emerald-500/30 text-center space-y-2">
                  <img
                    src={profile.avatarUrl}
                    alt={profile.username}
                    className="w-14 h-14 rounded-full mx-auto object-cover border-2 border-emerald-500"
                    referrerPolicy="no-referrer"
                  />
                  <div>
                    <span className="text-xs font-bold text-white block">{profile.username} (You)</span>
                    <span className="text-[10px] text-emerald-400 font-semibold">{profile.leagueTier}</span>
                  </div>
                </div>

                {/* Rival */}
                <div className="p-4 rounded-2xl bg-neutral-950/70 border border-neutral-800 text-center space-y-2">
                  <img
                    src={comparedUser.avatarUrl}
                    alt={comparedUser.username}
                    className="w-14 h-14 rounded-full mx-auto object-cover border-2 border-neutral-700"
                    referrerPolicy="no-referrer"
                  />
                  <div>
                    <span className="text-xs font-bold text-white block">{comparedUser.username}</span>
                    <span className="text-[10px] text-indigo-400 font-semibold">{comparedUser.tier}</span>
                  </div>
                </div>
              </div>

              {/* Stats Comparison Grid */}
              <div className="space-y-3">
                {[
                  { label: 'Rank Points', you: `${profile.rankPoints} LP`, rival: `${comparedUser.score} LP`, youHigher: profile.rankPoints >= comparedUser.score },
                  { label: 'Accuracy Rate', you: `${profile.accuracyRate}%`, rival: `${comparedUser.accuracy}%`, youHigher: profile.accuracyRate >= comparedUser.accuracy },
                  { label: 'Peak Streak', you: `${profile.highestStreak}🔥`, rival: `${comparedUser.peakStreak}🔥`, youHigher: profile.highestStreak >= comparedUser.peakStreak },
                  { label: 'Badges', you: `${profile.unlockedBadgeIds.length}`, rival: `${comparedUser.badgesCount}`, youHigher: profile.unlockedBadgeIds.length >= comparedUser.badgesCount }
                ].map((stat, idx) => (
                  <div key={idx} className="flex items-center justify-between p-3 rounded-xl bg-neutral-950/50 border border-neutral-800 text-xs">
                    <span className={`font-bold ${stat.youHigher ? 'text-emerald-400' : 'text-neutral-400'}`}>{stat.you}</span>
                    <span className="text-neutral-400 font-semibold uppercase text-[10px]">{stat.label}</span>
                    <span className={`font-bold ${!stat.youHigher ? 'text-emerald-400' : 'text-neutral-400'}`}>{stat.rival}</span>
                  </div>
                ))}
              </div>

              <button
                onClick={() => setComparedUser(null)}
                className="w-full py-3 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-white font-bold text-xs transition-colors"
              >
                Close Comparison
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* BADGE INSPECTION MODAL */}
      <AnimatePresence>
        {selectedBadge && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-950/80 backdrop-blur-sm"
            role="dialog"
            aria-label="Badge Details"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              transition={{ type: "spring", duration: 0.3 }}
              className="w-full max-w-md rounded-3xl bg-neutral-900 border border-neutral-800 p-6 space-y-5 shadow-2xl text-center"
            >
              <div className="mx-auto flex items-center justify-center">
                <BadgeVectorGraphic
                  iconName={selectedBadge.iconName}
                  badgeId={selectedBadge.id}
                  rarity={selectedBadge.rarity}
                  size="xl"
                  isUnlocked={profile.unlockedBadgeIds.includes(selectedBadge.id)}
                />
              </div>

              <div className="space-y-1">
                <span className={`text-[10px] font-bold px-3 py-1 rounded-full border inline-block ${getRarityBadge(selectedBadge.rarity)}`}>
                  {selectedBadge.rarity} Tier
                </span>
                <h2 className="text-xl font-extrabold text-white mt-1">{selectedBadge.title}</h2>
                <p className="text-xs text-neutral-300 leading-relaxed px-4">
                  {selectedBadge.description}
                </p>
              </div>

              {selectedBadge.perk && (
                <div className="p-3 rounded-2xl bg-emerald-950/40 border border-emerald-500/30 text-xs text-emerald-300 font-semibold">
                  ✨ Perk: {selectedBadge.perk}
                </div>
              )}

              <div className="flex flex-col sm:flex-row gap-2">
                {profile.unlockedBadgeIds.includes(selectedBadge.id) && (
                  <>
                    <button
                      onClick={() => {
                        const target = selectedBadge;
                        setSelectedBadge(null);
                        setSharingBadge(target);
                      }}
                      className="py-3 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-md"
                    >
                      <Share2 className="w-4 h-4" />
                      <span>Share Badge</span>
                    </button>

                    <button
                      onClick={() => {
                        toggleShowcase(selectedBadge.id);
                        setSelectedBadge(null);
                      }}
                      className="flex-1 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-neutral-950 font-bold text-xs"
                    >
                      {profile.showcaseBadgeIds.includes(selectedBadge.id) ? 'Remove Showcase' : 'Showcase on Profile'}
                    </button>
                  </>
                )}
                <button
                  onClick={() => setSelectedBadge(null)}
                  className="px-6 py-3 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-white font-bold text-xs"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* BADGE SHARE CARD MODAL */}
      <BadgeShareCardModal
        badge={sharingBadge}
        profile={profile}
        onClose={() => setSharingBadge(null)}
        onShareToHub={onOpenSocialHub}
      />

    </motion.div>
  );
};
