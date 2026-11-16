import React, { useState } from 'react';
import { motion } from 'motion/react';
import {
  X,
  Share2,
  Copy,
  Check,
  Award,
  Sparkles,
  Trophy,
  Crown,
  Flame,
  ShieldCheck,
  Send
} from 'lucide-react';
import { Badge, PlayerProfile } from '../types';
import { BadgeVectorGraphic } from './BadgeVectorGraphic';
import { playSoundEffect } from '../utils/audio';

interface BadgeShareCardModalProps {
  badge: Badge | null;
  profile: PlayerProfile;
  onClose: () => void;
  onShareToHub?: (badge: Badge) => void;
}

export const BadgeShareCardModal: React.FC<BadgeShareCardModalProps> = ({
  badge,
  profile,
  onClose,
  onShareToHub
}) => {
  const [copied, setCopied] = useState(false);
  const [hubShared, setHubShared] = useState(false);

  if (!badge) return null;

  const isUnlocked = profile.unlockedBadgeIds.includes(badge.id);

  const getRarityTag = (rarity: Badge['rarity']) => {
    switch (rarity) {
      case 'Legendary':
        return 'from-amber-400 to-yellow-200 text-neutral-950 font-black border-amber-300';
      case 'Epic':
        return 'from-purple-500 to-indigo-500 text-white font-bold border-purple-400';
      case 'Rare':
        return 'from-cyan-500 to-teal-500 text-neutral-950 font-extrabold border-cyan-300';
      case 'Common':
      default:
        return 'from-neutral-700 to-neutral-800 text-neutral-200 font-bold border-neutral-600';
    }
  };

  const handleCopyShareText = () => {
    playSoundEffect('click');
    const shareText = `🏆 I just unlocked the "${badge.title}" ${badge.rarity} Badge on Align Trivia!\n\n✨ "${badge.description}"\n⚡ Perk: ${badge.perk || 'Mastery Unlocked'}\n🔥 Current Streak: ${profile.currentStreakDays} Days | LP: ${profile.rankPoints}\n\nCan you beat my mindset stats on Align?`;
    
    navigator.clipboard.writeText(shareText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleHubPost = () => {
    playSoundEffect('fanfare');
    setHubShared(true);
    if (onShareToHub) {
      onShareToHub(badge);
    }
    setTimeout(() => {
      setHubShared(false);
    }, 3000);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-950/85 backdrop-blur-md animate-in fade-in"
      role="dialog"
      aria-modal="true"
      aria-label="Badge Share Card"
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0, y: 15 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0, y: 15 }}
        transition={{ type: "spring", duration: 0.35, bounce: 0.2 }}
        className="w-full max-w-md rounded-3xl bg-neutral-900 border border-neutral-800 overflow-hidden shadow-2xl space-y-0 text-left"
      >
        
        {/* Header Bar */}
        <div className="flex items-center justify-between p-4 px-6 border-b border-neutral-800/80 bg-neutral-950/60">
          <span className="text-xs font-bold text-neutral-300 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-400" />
            <span>Official Mastery Certificate</span>
          </span>
          <button
            onClick={onClose}
            className="p-1.5 text-neutral-400 hover:text-white rounded-lg hover:bg-neutral-800 transition-colors"
            aria-label="Close modal"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* THE SHAREABLE CERTIFICATE CANVAS */}
        <div className="p-6 sm:p-7 bg-gradient-to-b from-neutral-950 via-neutral-900 to-neutral-950 relative overflow-hidden border-b border-neutral-800">
          
          {/* Ambient Lighting */}
          <div className="absolute top-0 right-1/2 translate-x-1/2 -mt-12 w-48 h-48 bg-emerald-500/15 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 right-0 w-40 h-40 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

          {/* Top Align Trivia Stamp */}
          <div className="flex items-center justify-between relative z-10 mb-4">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-lg bg-emerald-500 flex items-center justify-center font-black text-xs text-neutral-950">
                A
              </div>
              <span className="text-xs font-extrabold text-white tracking-wider">ALIGN TRIVIA</span>
            </div>
            
            <span className={`text-[10px] px-2.5 py-0.5 rounded-full bg-gradient-to-r border shadow-sm ${getRarityTag(badge.rarity)}`}>
              {badge.rarity} Mastery
            </span>
          </div>

          {/* High-Definition Center Emblem */}
          <div className="my-5 flex flex-col items-center justify-center relative z-10">
            <div className="relative group cursor-pointer">
              <div className="absolute -inset-3 bg-gradient-to-r from-amber-500/20 via-emerald-500/20 to-cyan-500/20 rounded-full blur-xl animate-pulse" />
              <BadgeVectorGraphic
                iconName={badge.iconName}
                badgeId={badge.id}
                rarity={badge.rarity}
                size="hero"
                isUnlocked={isUnlocked}
              />
            </div>

            <h3 className="text-xl sm:text-2xl font-black text-white text-center mt-3 tracking-tight">
              {badge.title}
            </h3>
            
            <p className="text-xs text-neutral-300 text-center max-w-xs mt-1 leading-relaxed">
              {badge.description}
            </p>
          </div>

          {/* Perk Highlight */}
          {badge.perk && (
            <div className="p-3 rounded-2xl bg-emerald-950/50 border border-emerald-500/40 text-center relative z-10 mb-5 shadow-inner">
              <span className="text-[11px] font-bold text-emerald-300 flex items-center justify-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>Active Perk: {badge.perk}</span>
              </span>
            </div>
          )}

          {/* Player Attribution Footer */}
          <div className="pt-4 border-t border-neutral-800/80 flex items-center justify-between relative z-10">
            <div className="flex items-center gap-2.5">
              <img
                src={profile.avatarUrl}
                alt={profile.username}
                className="w-9 h-9 rounded-full object-cover border-2 border-emerald-500/60 shadow-md"
                referrerPolicy="no-referrer"
              />
              <div>
                <span className="text-xs font-black text-white block">{profile.username}</span>
                <span className="text-[10px] text-neutral-400 font-semibold">{profile.leagueTier} • {profile.rankPoints} LP</span>
              </div>
            </div>

            <div className="text-right">
              <span className="text-[10px] font-bold text-amber-400 flex items-center justify-end gap-1">
                <Flame className="w-3.5 h-3.5 fill-amber-400" /> {profile.currentStreakDays}d Streak
              </span>
              <span className="text-[9px] text-neutral-500 block font-mono">
                {badge.unlockedAt || 'Verified Master'}
              </span>
            </div>
          </div>

        </div>

        {/* ACTION BUTTONS */}
        <div className="p-5 bg-neutral-950/90 space-y-2.5">
          <div className="flex gap-2">
            <button
              onClick={handleCopyShareText}
              className="flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-neutral-950 font-black text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 active:scale-95 transition-all"
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4" />
                  <span>Copied Share Snippet!</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  <span>Copy Share Snippet</span>
                </>
              )}
            </button>

            <button
              onClick={handleHubPost}
              disabled={hubShared}
              className={`py-3 px-4 rounded-xl font-bold text-xs flex items-center justify-center gap-2 border transition-all ${
                hubShared
                  ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40'
                  : 'bg-neutral-900 hover:bg-neutral-800 text-neutral-200 border-neutral-700 hover:border-neutral-600'
              }`}
            >
              <Send className="w-4 h-4 text-cyan-400" />
              <span>{hubShared ? 'Posted to Hub!' : 'Share to Hub'}</span>
            </button>
          </div>

          <p className="text-[10px] text-center text-neutral-500 font-medium">
            Share your mindset badge milestone with friends, squads, or socials!
          </p>
        </div>

      </motion.div>
    </div>
  );
};
