import React, { useState, useEffect } from 'react';
import {
  Trophy,
  Flame,
  Award,
  TrendingUp,
  TrendingDown,
  Minus,
  Sparkles,
  Shield,
  Search,
  Filter,
  UserCheck,
  ChevronRight,
  Zap,
  Target,
  X,
  Radio,
  Crown,
  Medal
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { LeaderboardEntry, LeagueTier, PlayerProfile } from '../types';
import { playSoundEffect } from '../utils/audio';
import { subscribeToGlobalLeaderboard, buildUnifiedLeaderboard } from '../lib/firebase';

interface LeaderboardViewProps {
  profile: PlayerProfile;
  onSelectUser?: (user: LeaderboardEntry) => void;
}

export const LeaderboardView: React.FC<LeaderboardViewProps> = ({ profile }) => {
  const [timeFilter, setTimeFilter] = useState<'daily' | 'weekly' | 'all_time'>('weekly');
  const [tierFilter, setTierFilter] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [comparedUser, setComparedUser] = useState<LeaderboardEntry | null>(null);

  const [entries, setEntries] = useState<LeaderboardEntry[]>(() =>
    buildUnifiedLeaderboard([], profile)
  );

  useEffect(() => {
    const unsub = subscribeToGlobalLeaderboard(updated => {
      setEntries(updated);
    }, profile);
    return () => unsub();
  }, [profile.rankPoints, profile.highestStreak, profile.accuracyRate, profile.id, profile.username]);

  const filteredEntries = entries.filter(e => {
    const matchesTier = tierFilter === 'All' || e.tier === tierFilter;
    const q = (searchQuery || '').toLowerCase();
    const matchesSearch =
      (e.username || '').toLowerCase().includes(q) ||
      (e.handle || '').toLowerCase().includes(q);
    return matchesTier && matchesSearch;
  });

  const getTierBadge = (tier: LeagueTier) => {
    switch (tier) {
      case 'Mindset Master':
        return 'bg-gradient-to-r from-amber-500 to-yellow-300 text-neutral-950 font-black border-amber-300';
      case 'Diamond':
        return 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40';
      case 'Platinum':
        return 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40';
      case 'Gold':
        return 'bg-amber-500/20 text-amber-300 border-amber-500/40';
      case 'Silver':
        return 'bg-neutral-400/20 text-neutral-300 border-neutral-400/40';
      case 'Bronze':
        return 'bg-orange-700/20 text-orange-400 border-orange-700/40';
    }
  };

  return (
    <motion.div
      id="leaderboard-view-container"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className="space-y-6"
    >
      
      {/* League Tier Banner */}
      <div className="rounded-3xl p-6 sm:p-8 bg-gradient-to-br from-neutral-900 via-neutral-900 to-neutral-950 border border-neutral-800 shadow-2xl relative overflow-hidden">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
                Season 4: Align Ascent
              </span>
              <span className="text-xs text-neutral-400">Ends in 4 days</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white">Global Leaderboard</h1>
            <p className="text-xs sm:text-sm text-neutral-300">
              See where you stand against players worldwide. Score high, keep streaks alive, and level up your tier!
            </p>
          </div>

          {/* User's Standings Summary Card */}
          <div className="w-full md:w-auto bg-neutral-950/80 p-4 sm:p-5 rounded-2xl border border-neutral-800 flex items-center justify-between sm:justify-start gap-5">
            <div>
              <span className="text-[10px] font-bold text-neutral-400 uppercase">Your League Rank</span>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-2xl font-black text-emerald-400">#{profile.globalRank}</span>
                <span className={`text-xs px-2 py-0.5 rounded-full border ${getTierBadge(profile.leagueTier)}`}>
                  {profile.leagueTier}
                </span>
              </div>
              <span className="text-xs text-neutral-400 font-medium">
                {profile.rankPoints.toLocaleString()} LP (580 to Diamond)
              </span>
            </div>

            <div className="h-10 w-px bg-neutral-800" />

            <div className="text-right">
              <span className="text-[10px] font-bold text-neutral-400 uppercase">Accuracy</span>
              <p className="text-xl font-bold text-cyan-400 mt-0.5">{profile.accuracyRate}%</p>
              <span className="text-[10px] text-amber-400 font-semibold">{profile.highestStreak}🔥 Peak</span>
            </div>
          </div>
        </div>
      </div>

      {/* Filter & Controls Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-neutral-900/60 p-4 rounded-2xl border border-neutral-800">
        
        {/* Time Tabs */}
        <div className="flex items-center gap-1 bg-neutral-950 p-1 rounded-xl border border-neutral-800 w-full sm:w-auto">
          {(['daily', 'weekly', 'all_time'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => {
                playSoundEffect('click');
                setTimeFilter(tab);
              }}
              className={`flex-1 sm:flex-none px-4 py-2 rounded-lg text-xs font-bold transition-all capitalize ${
                timeFilter === tab
                  ? 'bg-emerald-600 text-white shadow-md'
                  : 'text-neutral-400 hover:text-neutral-200'
              }`}
            >
              {tab.replace('_', ' ')}
            </button>
          ))}
        </div>

        {/* Tier Filter & Search */}
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-48">
            <Search className="w-3.5 h-3.5 text-neutral-400 absolute left-3 top-3" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search player..."
              className="w-full pl-8 pr-3 py-2 rounded-xl bg-neutral-950 border border-neutral-800 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-emerald-500"
            />
          </div>

          <select
            value={tierFilter}
            onChange={e => setTierFilter(e.target.value)}
            className="px-3 py-2 rounded-xl bg-neutral-950 border border-neutral-800 text-xs text-neutral-300 focus:outline-none focus:border-emerald-500 font-semibold"
          >
            <option value="All">All Tiers</option>
            <option value="Mindset Master">Mindset Master</option>
            <option value="Diamond">Diamond</option>
            <option value="Platinum">Platinum</option>
            <option value="Gold">Gold</option>
          </select>
        </div>
      </div>

      {/* Leaderboard Table / Responsive List */}
      <div className="rounded-3xl bg-neutral-900/80 border border-neutral-800 overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm min-w-[580px] sm:min-w-0">
            <thead className="bg-neutral-950/70 border-b border-neutral-800 text-neutral-400 font-bold uppercase text-[10px] tracking-wider">
              <tr>
                <th className="py-3.5 px-4 sm:px-6">Rank</th>
                <th className="py-3.5 px-4">Player</th>
                <th className="py-3.5 px-4 hidden sm:table-cell">Tier</th>
                <th className="py-3.5 px-4 text-center">Streak</th>
                <th className="py-3.5 px-4 text-center hidden md:table-cell">Accuracy</th>
                <th className="py-3.5 px-4 text-right">Points</th>
                <th className="py-3.5 px-4 text-center">Compare</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-800/60">
              {filteredEntries.map(entry => {
                const isYou = entry.isCurrentUser;

                return (
                  <tr
                    key={entry.rank}
                    className={`transition-colors ${
                      isYou
                        ? 'bg-emerald-950/40 hover:bg-emerald-950/60 border-l-4 border-l-emerald-500 font-semibold'
                        : 'hover:bg-neutral-800/40'
                    }`}
                  >
                    {/* Rank */}
                    <td className="py-4 px-4 sm:px-6 font-black">
                      <div className="flex items-center gap-2">
                        {entry.rank === 1 ? (
                          <span className="w-6 h-6 rounded-full bg-amber-400 text-neutral-950 flex items-center justify-center text-xs font-black shadow-md">
                            1
                          </span>
                        ) : entry.rank === 2 ? (
                          <span className="w-6 h-6 rounded-full bg-neutral-300 text-neutral-950 flex items-center justify-center text-xs font-black shadow-md">
                            2
                          </span>
                        ) : entry.rank === 3 ? (
                          <span className="w-6 h-6 rounded-full bg-amber-700 text-white flex items-center justify-center text-xs font-black shadow-md">
                            3
                          </span>
                        ) : (
                          <span className="text-neutral-400 font-bold ml-1.5">#{entry.rank}</span>
                        )}

                        {entry.trend === 'up' ? (
                          <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
                        ) : entry.trend === 'down' ? (
                          <TrendingDown className="w-3.5 h-3.5 text-rose-400" />
                        ) : (
                          <Minus className="w-3.5 h-3.5 text-neutral-500" />
                        )}
                      </div>
                    </td>

                    {/* User Profile */}
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-3">
                        <img
                          src={entry.avatarUrl}
                          alt={entry.username}
                          className="w-9 h-9 rounded-full object-cover border border-neutral-700 shrink-0"
                          referrerPolicy="no-referrer"
                        />
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-white text-xs sm:text-sm">{entry.username}</span>
                            {isYou && (
                              <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                                You
                              </span>
                            )}
                            {entry.isBenchmarkBoss && (
                              <span className="text-[9px] font-black px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 flex items-center gap-1">
                                <span>👑 Boss Target</span>
                              </span>
                            )}
                          </div>
                          <span className="text-[11px] text-neutral-400 flex items-center gap-1.5">
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
                    <td className="py-4 px-4 hidden sm:table-cell">
                      <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${getTierBadge(entry.tier)}`}>
                        {entry.tier}
                      </span>
                    </td>

                    {/* Streak */}
                    <td className="py-4 px-4 text-center">
                      <span className="inline-flex items-center gap-1 text-xs font-bold text-amber-400">
                        <Flame className="w-3.5 h-3.5 fill-amber-400" />
                        {entry.peakStreak}
                      </span>
                    </td>

                    {/* Accuracy */}
                    <td className="py-4 px-4 text-center hidden md:table-cell">
                      <span className="text-xs font-semibold text-cyan-400">{entry.accuracy}%</span>
                    </td>

                    {/* Points */}
                    <td className="py-4 px-4 text-right font-black text-emerald-400">
                      {entry.score.toLocaleString()} LP
                    </td>

                    {/* Compare Action */}
                    <td className="py-4 px-4 text-center">
                      <button
                        onClick={() => {
                          playSoundEffect('click');
                          setComparedUser(entry);
                        }}
                        className="p-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-300 transition-all active:scale-95"
                        title={`Compare your stats with ${entry.username}`}
                        aria-label={`Compare stats with ${entry.username}`}
                      >
                        <UserCheck className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Head-to-Head Comparison Drawer */}
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
                  <Target className="w-4 h-4 text-emerald-400" />
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
                    <span className="text-xs font-bold text-white block">{profile.username}</span>
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

    </motion.div>
  );
};

