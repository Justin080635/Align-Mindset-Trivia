import React, { useState, useEffect, useRef } from 'react';
import {
  Trophy,
  Award,
  Users,
  User,
  Bell,
  Sun,
  Moon,
  Volume2,
  VolumeX,
  Flame,
  Accessibility,
  Radio,
  CheckCircle2,
  Sparkles,
  X,
  Swords,
  ShieldCheck,
  Crown
} from 'lucide-react';
import { motion } from 'motion/react';
import { PlayerProfile, NotificationItem, HostPersona, TabType } from '../types';
import { playSoundEffect } from '../utils/audio';
import { useHaptics } from '../hooks/useHaptics';

interface NavbarProps {
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
  profile: PlayerProfile;
  setProfile: React.Dispatch<React.SetStateAction<PlayerProfile>>;
  currentHost: HostPersona;
  notifications: NotificationItem[];
  setNotifications: React.Dispatch<React.SetStateAction<NotificationItem[]>>;
  onOpenAccessibility: () => void;
  onOpenLiveVoice: () => void;
  onOpenGameshowAuth?: () => void;
  onOpenWelcomeTutorial?: () => void;
  onOpenFlywheelModal?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  profile,
  setProfile,
  currentHost,
  notifications = [],
  setNotifications,
  onOpenAccessibility,
  onOpenLiveVoice,
  onOpenGameshowAuth,
  onOpenWelcomeTutorial,
  onOpenFlywheelModal
}) => {
  const [showNotifications, setShowNotifications] = useState(false);
  const notificationRef = useRef<HTMLDivElement>(null);
  const haptics = useHaptics({ enabled: profile.hapticsEnabled ?? true });

  const safeNotifications = Array.isArray(notifications) ? notifications : [];
  const unreadCount = safeNotifications.filter(n => !n.isRead).length;

  // Close notifications on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
    };
    if (showNotifications) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showNotifications]);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && showNotifications) {
        setShowNotifications(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showNotifications]);

  const toggleTheme = () => {
    playSoundEffect('click');
    haptics.triggerNavTap();
    setProfile(prev => ({
      ...prev,
      theme: prev.theme === 'dark' ? 'light' : 'dark'
    }));
  };

  const toggleSound = () => {
    playSoundEffect('click');
    haptics.triggerNavTap();
    setProfile(prev => ({
      ...prev,
      soundEnabled: !prev.soundEnabled
    }));
  };

  const handleNotificationClick = (item: NotificationItem) => {
    playSoundEffect('click');
    haptics.triggerNavTap();
    if (setNotifications) {
      setNotifications(prev =>
        (prev || []).map(n => (n.id === item.id ? { ...n, isRead: true } : n))
      );
    }
    if (item.targetTab) {
      setActiveTab(item.targetTab);
      setShowNotifications(false);
    }
  };

  const markAllNotificationsRead = () => {
    playSoundEffect('click');
    haptics.triggerNavTap();
    if (setNotifications) {
      setNotifications(prev => (prev || []).map(n => ({ ...n, isRead: true })));
    }
  };

  const LEFT_NAV_ITEMS = [
    { id: 'play', label: 'Arena', shortLabel: 'Arena', icon: Sparkles, badge: null },
    { id: 'ranks', label: 'Ranks & Badges', shortLabel: 'Ranks', icon: Trophy, badge: null },
  ] as const;

  const RIGHT_NAV_ITEMS = [
    { id: 'social', label: 'Hub', shortLabel: 'Hub', icon: Users, badge: 'Active' },
    { id: 'profile', label: 'Profile', shortLabel: 'Profile', icon: User, badge: null },
  ] as const;

  const isTabActive = (itemId: string) => {
    if (itemId === 'ranks') {
      return activeTab === 'ranks' || activeTab === 'leaderboard' || activeTab === 'achievements';
    }
    return activeTab === itemId;
  };

  return (
    <>
      {/* TOP HEADER: Brand, Status, Voice Room & Quick Control Utility Cluster */}
      <header
        id="top-brand-header"
        className="sticky top-0 z-40 w-full backdrop-blur-xl border-b transition-colors duration-200 bg-[#070707]/90 text-white border-neutral-800/80 shadow-md"
        role="banner"
      >
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14 sm:h-16 gap-2 sm:gap-4">
            
            {/* BRAND LOGO & MOTTO */}
            <div className="flex items-center gap-2 sm:gap-3 shrink-0">
              <motion.button
                id="brand-logo-btn"
                onClick={() => {
                  playSoundEffect('click');
                  setActiveTab('play');
                }}
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.96 }}
                transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                className="flex items-center gap-2.5 text-left group focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 rounded-xl p-1"
                aria-label="Align Mindset Trivia Arena Home"
              >
                <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-gradient-to-br from-amber-300 via-yellow-400 to-amber-600 flex items-center justify-center shadow-md shadow-amber-500/25 group-hover:scale-105 transition-transform shrink-0 border border-amber-200/50">
                  <span className="text-base sm:text-lg font-black text-neutral-950 tracking-wider">A</span>
                </div>
                <div className="leading-tight">
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm sm:text-base font-black tracking-tight text-white group-hover:text-amber-300 transition-colors">
                      ALIGN
                    </span>
                    <span className="text-[10px] font-black px-1.5 py-0.2 rounded-full bg-amber-400/20 text-amber-300 border border-amber-400/40">
                      TRIVIA
                    </span>
                  </div>
                  <p className="text-[10px] text-neutral-400 font-medium hidden sm:block">
                    Mindset Initiative
                  </p>
                </div>
              </motion.button>
            </div>

            {/* STATUS & CONTROLS CLUSTER (WHITE, BLACK & GOLD) */}
            <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
              
              {/* Daily Fortune Wheel & Chest Trigger Button */}
              {onOpenFlywheelModal && (
                <motion.button
                  id="daily-wheel-nav-btn"
                  onClick={() => {
                    playSoundEffect('click');
                    onOpenFlywheelModal();
                  }}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  transition={{ type: 'spring', stiffness: 450, damping: 22 }}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-gradient-to-r from-amber-500/20 via-yellow-500/10 to-amber-500/20 hover:from-amber-500/30 hover:to-yellow-500/30 border border-amber-400/50 text-amber-300 hover:text-amber-200 text-xs font-bold transition-all shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 cursor-pointer"
                  title="Spin Daily Wheel & Claim 10-Day Streak Chest"
                  aria-label="Daily Fortune Wheel & Rewards"
                >
                  <span className="text-sm">🎁</span>
                  <span className="hidden sm:inline font-black text-[11px] tracking-wide text-amber-300">Daily Gift</span>
                </motion.button>
              )}

              {/* Streak Counter: Gold Flame with Gold count badge */}
              <motion.button
                id="user-streak-badge"
                onClick={() => {
                  playSoundEffect('click');
                  setActiveTab('profile');
                }}
                whileHover={{ scale: 1.08 }}
                whileTap={{ scale: 0.92 }}
                transition={{ type: 'spring', stiffness: 450, damping: 22 }}
                className="relative p-2 rounded-xl text-neutral-300 hover:text-white hover:bg-neutral-900 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 group"
                title={`${profile?.currentStreakDays ?? 0} Day Mindset Streak`}
                aria-label={`${profile?.currentStreakDays ?? 0} days streak`}
              >
                <Flame className="w-5 h-5 text-amber-400 fill-amber-400 filter drop-shadow group-hover:scale-110 transition-transform duration-200" />
                <span className="absolute -top-0.5 -right-0.5 min-w-[17px] h-[17px] px-1 bg-amber-400 text-neutral-950 font-black text-[10px] rounded-full flex items-center justify-center border border-neutral-950 shadow-sm leading-none">
                  {profile?.currentStreakDays ?? 0}
                </span>
              </motion.button>

              {/* Notifications Menu */}
              <div className="relative" ref={notificationRef}>
                <motion.button
                  id="notifications-dropdown-btn"
                  onClick={() => {
                    playSoundEffect('click');
                    setShowNotifications(!showNotifications);
                  }}
                  whileHover={{ scale: 1.08 }}
                  whileTap={{ scale: 0.92 }}
                  transition={{ type: 'spring', stiffness: 450, damping: 22 }}
                  className="relative p-2 rounded-xl text-neutral-400 hover:text-white hover:bg-neutral-900 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400"
                  aria-label="Notifications"
                  aria-expanded={showNotifications}
                >
                  <Bell className="w-4 h-4" />
                  {unreadCount > 0 && (
                    <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-amber-400 ring-2 ring-neutral-900 animate-pulse" />
                  )}
                </motion.button>

                {/* Notifications Dropdown Panel */}
                {showNotifications && (
                  <div
                    id="notifications-popover"
                    className="fixed sm:absolute top-14 sm:top-auto sm:right-0 sm:mt-2 inset-x-3 sm:inset-x-auto sm:w-96 rounded-2xl bg-neutral-950 border border-amber-500/30 shadow-2xl p-4 z-50 animate-in fade-in zoom-in-95 duration-150"
                    role="dialog"
                    aria-label="Recent notifications"
                  >
                    <div className="flex items-center justify-between pb-3 border-b border-neutral-800 mb-3">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-white">Live Alerts</span>
                        {unreadCount > 0 && (
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                            {unreadCount} new
                          </span>
                        )}
                      </div>
                      
                      <div className="flex items-center gap-2">
                        {unreadCount > 0 && (
                          <button
                            onClick={markAllNotificationsRead}
                            className="text-xs text-amber-400 hover:text-amber-300 flex items-center gap-1 font-medium"
                          >
                            <CheckCircle2 className="w-3 h-3" />
                            Mark read
                          </button>
                        )}
                        <button
                          onClick={() => setShowNotifications(false)}
                          className="sm:hidden p-1 text-neutral-400 hover:text-white"
                          aria-label="Close notifications"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    <div className="max-h-72 overflow-y-auto space-y-2.5 pr-1">
                      {safeNotifications.length === 0 ? (
                        <p className="text-center py-6 text-xs text-neutral-400">No new alerts.</p>
                      ) : (
                        safeNotifications.map(item => (
                          <button
                            key={item.id}
                            onClick={() => handleNotificationClick(item)}
                            className={`w-full text-left p-2.5 rounded-xl border transition-all ${
                              item.isRead
                                ? 'bg-neutral-900/50 border-neutral-800/60 opacity-70'
                                : 'bg-neutral-900 border-amber-500/40 shadow-sm'
                            }`}
                          >
                            <div className="flex items-start justify-between gap-2">
                              <span className="text-xs font-bold text-neutral-200">{item.title}</span>
                              <span className="text-[10px] text-neutral-500 shrink-0">{item.timestamp}</span>
                            </div>
                            <p className="text-xs text-neutral-300 mt-1 leading-relaxed">{item.message}</p>
                          </button>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Welcome Onboarding & Tutorial Guide Button */}
              {onOpenWelcomeTutorial && (
                <motion.button
                  id="welcome-tutorial-nav-btn"
                  onClick={() => {
                    playSoundEffect('click');
                    onOpenWelcomeTutorial();
                  }}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  transition={{ type: 'spring', stiffness: 450, damping: 22 }}
                  className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-neutral-900 hover:bg-neutral-850 text-neutral-200 hover:text-white border border-neutral-800 shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 cursor-pointer text-xs font-bold"
                  title="View Feature Tour & Welcome Tutorial"
                  aria-label="Welcome Guide"
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  <span>Guide</span>
                </motion.button>
              )}

              {/* Gameshow Sign In / Contestant ID Stage Button */}
              <motion.button
                id="gameshow-auth-nav-btn"
                onClick={() => {
                  playSoundEffect('click');
                  if (onOpenGameshowAuth) onOpenGameshowAuth();
                }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                transition={{ type: 'spring', stiffness: 450, damping: 22 }}
                className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-neutral-900 to-neutral-850 hover:from-neutral-850 hover:to-neutral-800 text-white border border-amber-500/40 shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 cursor-pointer text-xs font-bold"
                title="Gameshow Contestant Sign In & Stage Settings"
                aria-label="Gameshow Sign In"
              >
                <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
                <span className="truncate max-w-[100px]">
                  {profile.googleConnected ? 'Google Synced' : 'Sign In'}
                </span>
                {profile.googleConnected && (
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                )}
              </motion.button>

              {/* Profile Avatar Trigger Button */}
              <motion.button
                id="user-profile-header-btn"
                onClick={() => {
                  playSoundEffect('click');
                  setActiveTab('profile');
                }}
                whileHover={{ scale: 1.08 }}
                whileTap={{ scale: 0.92 }}
                transition={{ type: 'spring', stiffness: 450, damping: 22 }}
                className="relative p-0.5 rounded-full hover:ring-2 hover:ring-amber-400/80 transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 group ml-0.5"
                title="View & Edit Player Profile, Settings & Google Account"
                aria-label="View Profile and Settings"
              >
                <img
                  src={profile?.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'}
                  alt={profile?.username || 'User'}
                  className="w-8 h-8 rounded-full object-cover border-2 border-amber-400/70 shadow-md group-hover:border-amber-300 transition-colors"
                  referrerPolicy="no-referrer"
                />
                <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-amber-400 border-2 border-neutral-950 ring-1 ring-amber-400/60" />
              </motion.button>

            </div>
          </div>
        </div>
      </header>

      {/* ULTRA-FLUENT BOTTOM NAVIGATION BAR WITH CENTRALIZED CIRCULAR LIVE HOST BUTTON */}
      <nav
        id="bottom-primary-nav-dock"
        aria-label="Primary Navigation Dock"
        className="fixed bottom-0 inset-x-0 z-50 pointer-events-none flex justify-center px-3 pb-3 sm:pb-4 safe-area-pb"
      >
        <div className="pointer-events-auto bg-[#0a0a0a]/95 backdrop-blur-2xl border border-neutral-800 shadow-2xl rounded-2xl sm:rounded-full p-1.5 sm:p-2 flex items-center justify-between sm:justify-center gap-1 sm:gap-2.5 w-full max-w-xl sm:w-auto ring-1 ring-white/10">
          
          {/* LEFT WING TABS (Arena, Ranks & Badges) */}
          {LEFT_NAV_ITEMS.map(item => {
            const Icon = item.icon;
            const isActive = isTabActive(item.id);

            return (
              <motion.button
                key={item.id}
                id={`bottom-nav-${item.id}`}
                onClick={() => {
                  playSoundEffect('click');
                  haptics.triggerNavTap();
                  setActiveTab(item.id as any);
                }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.94 }}
                transition={{ type: 'spring', stiffness: 420, damping: 26 }}
                className={`relative flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-1.5 px-3 sm:px-4 py-2 rounded-xl sm:rounded-full text-xs font-bold min-w-[54px] sm:min-w-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 cursor-pointer ${
                  isActive
                    ? 'text-neutral-950 font-black'
                    : 'text-neutral-400 hover:text-white hover:bg-neutral-900/60'
                }`}
                aria-current={isActive ? 'page' : undefined}
              >
                {/* Motion Spring Layout Glow Pill - Gold Metallic */}
                {isActive && (
                  <motion.div
                    layoutId="activeBottomNavPill"
                    className="absolute inset-0 bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 rounded-xl sm:rounded-full shadow-lg shadow-amber-500/30 border border-amber-300/40"
                    transition={{ type: "spring", stiffness: 380, damping: 28 }}
                  />
                )}

                <span className="relative z-10 flex items-center justify-center">
                  <Icon className={`w-4 h-4 transition-colors duration-200 ${isActive ? 'text-neutral-950 stroke-[2.5]' : 'text-neutral-400'}`} />
                </span>

                <span className="relative z-10 text-[11px] sm:text-xs whitespace-nowrap transition-colors duration-200">
                  <span className="sm:inline hidden">{item.label}</span>
                  <span className="sm:hidden inline">{item.shortLabel}</span>
                </span>
              </motion.button>
            );
          })}

          {/* PROMINENT CENTRALIZED CIRCULAR LIVE HOST BUTTON (SHIMMERING GOLD MEDALLION) */}
          <div className="px-1.5 sm:px-3 shrink-0 flex items-center justify-center -my-3 sm:-my-4">
            <motion.button
              id="central-live-host-btn"
              onClick={() => {
                playSoundEffect('click');
                haptics.triggerNavTap();
                onOpenLiveVoice();
              }}
              whileHover={{ scale: 1.12, y: -4 }}
              whileTap={{ scale: 0.92 }}
              transition={{ type: 'spring', stiffness: 420, damping: 20 }}
              className="relative group w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-gradient-to-tr from-amber-300 via-yellow-400 to-amber-500 text-neutral-950 flex flex-col items-center justify-center shadow-2xl shadow-amber-500/40 border-2 border-neutral-950 ring-4 ring-neutral-950/80 hover:ring-amber-300/60 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 cursor-pointer -translate-y-1 sm:-translate-y-2"
              title="Launch Interactive Live Voice Room with AI Host"
              aria-label="Start Voice Conversation with AI Host"
            >
              {/* Outer glowing ambient gold halo */}
              <span className="absolute -inset-1.5 rounded-full bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-500 opacity-60 blur-lg group-hover:opacity-100 group-hover:scale-115 transition-all duration-300 pointer-events-none animate-pulse" />
              
              <span className="relative z-10 flex items-center justify-center">
                <Radio className="w-5 h-5 sm:w-6 sm:h-6 text-neutral-950 stroke-[2.5]" />
              </span>

              <span className="relative z-10 text-[8px] sm:text-[9.5px] font-black uppercase tracking-tighter text-neutral-950 leading-none mt-0.5">
                Live Host
              </span>

              {/* Live active pulsing beacon ring */}
              <span className="absolute top-1 right-1 sm:top-1.5 sm:right-1.5 w-3 h-3 rounded-full bg-amber-600 border-2 border-neutral-950 flex items-center justify-center z-20 shadow-sm">
                <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
              </span>
            </motion.button>
          </div>

          {/* RIGHT WING TABS (Social Hub, Profile) */}
          {RIGHT_NAV_ITEMS.map(item => {
            const Icon = item.icon;
            const isActive = isTabActive(item.id);

            return (
              <motion.button
                key={item.id}
                id={`bottom-nav-${item.id}`}
                onClick={() => {
                  playSoundEffect('click');
                  haptics.triggerNavTap();
                  setActiveTab(item.id as any);
                }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.94 }}
                transition={{ type: 'spring', stiffness: 420, damping: 26 }}
                className={`relative flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-1.5 px-3 sm:px-4 py-2 rounded-xl sm:rounded-full text-xs font-bold min-w-[54px] sm:min-w-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 cursor-pointer ${
                  isActive
                    ? 'text-neutral-950 font-black'
                    : 'text-neutral-400 hover:text-white hover:bg-neutral-900/60'
                }`}
                aria-current={isActive ? 'page' : undefined}
              >
                {/* Motion Spring Layout Glow Pill - Gold Metallic */}
                {isActive && (
                  <motion.div
                    layoutId="activeBottomNavPill"
                    className="absolute inset-0 bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 rounded-xl sm:rounded-full shadow-lg shadow-amber-500/30 border border-amber-300/40"
                    transition={{ type: "spring", stiffness: 380, damping: 28 }}
                  />
                )}

                <span className="relative z-10 flex items-center justify-center">
                  <Icon className={`w-4 h-4 transition-colors duration-200 ${isActive ? 'text-neutral-950 stroke-[2.5]' : 'text-neutral-400'}`} />
                </span>

                <span className="relative z-10 text-[11px] sm:text-xs whitespace-nowrap transition-colors duration-200">
                  <span className="sm:inline hidden">{item.label}</span>
                  <span className="sm:hidden inline">{item.shortLabel}</span>
                </span>

                {item.badge && !isActive && (
                  <span className="hidden md:inline-block relative z-10 text-[9px] font-bold px-1.5 py-0.2 rounded-full bg-amber-400/20 text-amber-300 border border-amber-400/30">
                    {item.badge}
                  </span>
                )}
              </motion.button>
            );
          })}

        </div>
      </nav>
    </>
  );
};

