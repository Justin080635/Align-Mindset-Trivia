import React, { useState } from 'react';
import {
  Award,
  BrainCircuit,
  Zap,
  Mic,
  Crown,
  Flame,
  ShieldCheck,
  Users,
  CalendarCheck,
  Sparkles,
  Trophy,
  Check,
  Lock,
  Star
} from 'lucide-react';
import { Badge, PlayerProfile } from '../types';
import { ALL_BADGES } from '../data/mockData';
import { playSoundEffect } from '../utils/audio';

interface AchievementsViewProps {
  profile: PlayerProfile;
  setProfile: React.Dispatch<React.SetStateAction<PlayerProfile>>;
}

export const AchievementsView: React.FC<AchievementsViewProps> = ({ profile, setProfile }) => {
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [selectedBadge, setSelectedBadge] = useState<Badge | null>(null);

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

  const filteredBadges = (ALL_BADGES || []).filter(b => {
    if (activeCategory === 'all') return true;
    return b.category === activeCategory;
  });

  const unlockedIds = profile?.unlockedBadgeIds || [];
  const totalUnlocked = (ALL_BADGES || []).filter(b => unlockedIds.includes(b.id)).length;

  return (
    <div id="achievements-view" className="space-y-6 animate-in fade-in duration-200">
      
      {/* Header Banner */}
      <div className="rounded-3xl p-6 sm:p-8 bg-gradient-to-br from-neutral-900 via-neutral-900 to-neutral-950 border border-neutral-800 shadow-2xl relative overflow-hidden">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold px-3 py-1 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30">
                Trophy Room
              </span>
              <span className="text-xs text-neutral-400">{totalUnlocked} / {ALL_BADGES.length} Unlocked</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white">Achievements & Badges</h1>
            <p className="text-xs sm:text-sm text-neutral-300">
              Unlock cool badges by building hot streaks, answering with speed, using live voice, and leveling up your tier!
            </p>
          </div>

          {/* Progress Bar Summary */}
          <div className="w-full md:w-64 bg-neutral-950/80 p-4 rounded-2xl border border-neutral-800 space-y-2">
            <div className="flex items-center justify-between text-xs font-bold">
              <span className="text-neutral-400">Total Completion</span>
              <span className="text-emerald-400">{Math.round((totalUnlocked / ALL_BADGES.length) * 100)}%</span>
            </div>
            <div className="w-full h-2.5 rounded-full bg-neutral-800 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full transition-all duration-1000"
                style={{ width: `${(totalUnlocked / ALL_BADGES.length) * 100}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Category Tabs */}
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
              setActiveCategory(tab.id);
            }}
            className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all border ${
              activeCategory === tab.id
                ? 'bg-emerald-600 text-white border-emerald-500 shadow-md'
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
                  <div className={`w-12 h-12 rounded-2xl bg-neutral-950 border border-neutral-800 flex items-center justify-center shadow-inner group-hover:scale-105 transition-transform`}>
                    {isUnlocked ? getBadgeIcon(badge.iconName) : <Lock className="w-5 h-5 text-neutral-600" />}
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
                    <span className="text-[11px] font-semibold text-emerald-400 flex items-center gap-1">
                      <Check className="w-3.5 h-3.5" /> Unlocked
                    </span>

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

      {/* Badge Inspection Modal */}
      {selectedBadge && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-950/80 backdrop-blur-sm animate-in fade-in"
          role="dialog"
          aria-label="Badge Details"
        >
          <div className="w-full max-w-md rounded-3xl bg-neutral-900 border border-neutral-800 p-6 space-y-5 shadow-2xl text-center">
            <div className="w-16 h-16 rounded-2xl bg-neutral-950 border border-neutral-800 mx-auto flex items-center justify-center shadow-lg">
              {profile.unlockedBadgeIds.includes(selectedBadge.id)
                ? getBadgeIcon(selectedBadge.iconName)
                : <Lock className="w-8 h-8 text-neutral-600" />}
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

            <div className="flex gap-2">
              {profile.unlockedBadgeIds.includes(selectedBadge.id) && (
                <button
                  onClick={() => {
                    toggleShowcase(selectedBadge.id);
                    setSelectedBadge(null);
                  }}
                  className="flex-1 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-neutral-950 font-bold text-xs"
                >
                  {profile.showcaseBadgeIds.includes(selectedBadge.id) ? 'Remove from Showcase' : 'Feature on Profile'}
                </button>
              )}
              <button
                onClick={() => setSelectedBadge(null)}
                className="px-6 py-3 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-white font-bold text-xs"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
