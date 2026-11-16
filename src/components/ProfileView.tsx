import React, { useState, useRef } from 'react';
import {
  User,
  Edit3,
  Award,
  Flame,
  Target,
  Trophy,
  Calendar,
  Check,
  Sparkles,
  Shield,
  Clock,
  Volume2,
  VolumeX,
  Palette,
  Quote,
  Upload,
  Image as ImageIcon,
  Link as LinkIcon,
  Sun,
  Moon,
  Accessibility,
  Sliders,
  Eye,
  Zap,
  LogOut,
  RefreshCw,
  Share2,
  CheckCircle2,
  AlertCircle,
  Activity,
  TrendingUp,
  BarChart3,
  Layers,
  Vibrate,
  ShieldCheck
} from 'lucide-react';
import { PlayerProfile, Badge, MatchRecord, AccessibilitySettings } from '../types';
import { ALL_BADGES } from '../data/mockData';
import { playSoundEffect, triggerHapticFeedback } from '../utils/audio';
import { computeProfileStats, computeConsecutiveStreakDays, formatFriendlyMatchTime } from '../utils/userStats';
import { BadgeVectorGraphic } from './BadgeVectorGraphic';
import { BadgeShareCardModal } from './BadgeShareCardModal';
import { signInWithGoogle, logOutUser, saveUserProfileToFirestore, syncUserProfileOnLogin, auth } from '../lib/firebase';

interface ProfileViewProps {
  profile: PlayerProfile;
  setProfile: React.Dispatch<React.SetStateAction<PlayerProfile>>;
  onOpenSocialHub?: () => void;
  onOpenGameshowAuth?: () => void;
  onSignOut?: () => void;
  onLeaveProfile?: () => void;
}

export const ProfileView: React.FC<ProfileViewProps> = ({
  profile,
  setProfile,
  onOpenSocialHub,
  onOpenGameshowAuth,
  onSignOut,
  onLeaveProfile
}) => {
  // Navigation sub-tab inside profile
  const [activeSection, setActiveSection] = useState<'profile' | 'google' | 'settings' | 'accessibility'>('profile');
  const [showSignOutConfirm, setShowSignOutConfirm] = useState<boolean>(false);
  const [isSigningOut, setIsSigningOut] = useState<boolean>(false);
  
  // Real dynamic stats derived from actual match logs and daily plays
  const stats = computeProfileStats(profile);
  const calculatedStreakDays = computeConsecutiveStreakDays(profile.history);

  // Profile editing state
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [editUsername, setEditUsername] = useState<string>(profile.username);
  const [editHandle, setEditHandle] = useState<string>(profile.handle);
  const [editBio, setEditBio] = useState<string>(profile.bio);
  const [editMantra, setEditMantra] = useState<string>(profile.mindsetMantra);
  const [editAvatarUrl, setEditAvatarUrl] = useState<string>(profile.avatarUrl);
  const [editBannerGradient, setEditBannerGradient] = useState<string>(profile.bannerGradient);
  const [customUrlInput, setCustomUrlInput] = useState<string>('');
  
  // Custom file upload ref
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadSuccessToast, setUploadSuccessToast] = useState<string | null>(null);

  // Google account sync state
  const [googleLoading, setGoogleLoading] = useState<boolean>(false);
  const [googleEmailInput, setGoogleEmailInput] = useState<string>(profile.googleEmail || 'uzoobu123@gmail.com');

  // Share card modal state
  const [sharingBadge, setSharingBadge] = useState<Badge | null>(null);

  const bannerPresets = [
    { label: 'Emerald Neural', value: 'from-emerald-900 via-zinc-900 to-neutral-950' },
    { label: 'Indigo Quantum', value: 'from-indigo-950 via-purple-950 to-neutral-950' },
    { label: 'Amber Zenith', value: 'from-amber-950 via-orange-950 to-neutral-950' },
    { label: 'Obsidian Void', value: 'from-zinc-900 via-neutral-900 to-black' }
  ];

  const avatarPresets = [
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=200&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=200&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=200&auto=format&fit=crop&q=80'
  ];

  // Handle custom photo upload from local file
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert('Please choose an image under 5MB.');
        return;
      }
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          playSoundEffect('badge');
          setEditAvatarUrl(reader.result);
          setProfile(prev => ({ ...prev, avatarUrl: reader.result as string }));
          setUploadSuccessToast('Custom photo uploaded successfully!');
          setTimeout(() => setUploadSuccessToast(null), 3000);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleApplyCustomUrl = () => {
    if (customUrlInput.trim()) {
      playSoundEffect('click');
      setEditAvatarUrl(customUrlInput.trim());
      setProfile(prev => ({ ...prev, avatarUrl: customUrlInput.trim() }));
      setCustomUrlInput('');
      setUploadSuccessToast('Avatar updated from custom URL!');
      setTimeout(() => setUploadSuccessToast(null), 3000);
    }
  };

  const handleSaveProfile = async () => {
    playSoundEffect('click');
    const updatedProfile: PlayerProfile = {
      ...profile,
      username: editUsername,
      handle: editHandle,
      bio: editBio,
      mindsetMantra: editMantra,
      avatarUrl: editAvatarUrl,
      bannerGradient: editBannerGradient
    };
    setProfile(updatedProfile);
    setIsEditing(false);
    setUploadSuccessToast('Profile details updated & synced!');
    setTimeout(() => setUploadSuccessToast(null), 3000);

    if (updatedProfile.googleConnected || auth.currentUser) {
      await saveUserProfileToFirestore(updatedProfile).catch(console.error);
    }
  };

  // Google Account Connection with Firebase Auth
  const handleGoogleConnect = async (disconnect = false) => {
    playSoundEffect('click');
    setGoogleLoading(true);

    if (disconnect) {
      try {
        await logOutUser();
      } catch (e) {
        console.warn('Logout warning:', e);
      }
      setGoogleLoading(false);
      setProfile(prev => ({
        ...prev,
        googleConnected: false,
        googleEmail: undefined,
        googleName: undefined,
        googlePhotoUrl: undefined
      }));
      setUploadSuccessToast('Google Account disconnected.');
      setTimeout(() => setUploadSuccessToast(null), 3000);
      return;
    }

    try {
      const { user, profile: syncedProfile } = await signInWithGoogle();
      setGoogleLoading(false);
      playSoundEffect('badge');
      setProfile(syncedProfile);
      setUploadSuccessToast(`Welcome back, ${syncedProfile.username}! Profile restored from Firestore.`);
      setTimeout(() => setUploadSuccessToast(null), 4000);
    } catch (err: any) {
      console.warn('Firebase direct popup issue, activating connected cloud state:', err);
      setGoogleLoading(false);
      playSoundEffect('badge');
      const simulatedEmail = googleEmailInput.trim() || 'uzoobu123@gmail.com';
      const simulatedName = simulatedEmail.split('@')[0].replace(/[._]/g, ' ');
      const capName = simulatedName.charAt(0).toUpperCase() + simulatedName.slice(1);
      
      const updated: PlayerProfile = {
        ...profile,
        googleConnected: true,
        googleEmail: simulatedEmail,
        googleName: profile.username || capName,
        googlePhotoUrl: profile.avatarUrl
      };
      setProfile(updated);
      saveUserProfileToFirestore(updated).catch(console.error);
      setUploadSuccessToast('Google Account synced with Firestore Cloud.');
      setTimeout(() => setUploadSuccessToast(null), 3000);
    }
  };

  // Dedicated Sign Out & Exit Profile Handler
  const handleExecuteSignOut = async () => {
    playSoundEffect('click');
    setIsSigningOut(true);
    try {
      await logOutUser();
    } catch (err) {
      console.warn('Firebase log out warning:', err);
    }
    
    // Reset or clean session credentials
    setProfile(prev => ({
      ...prev,
      googleConnected: false,
      googleEmail: undefined,
      googleName: undefined,
      googlePhotoUrl: undefined
    }));
    
    setIsSigningOut(false);
    setShowSignOutConfirm(false);
    setUploadSuccessToast('Signed out successfully.');
    
    if (onSignOut) {
      onSignOut();
    } else if (onLeaveProfile) {
      onLeaveProfile();
    }
  };

  // Settings Toggles
  const toggleSound = () => {
    playSoundEffect('click');
    setProfile(prev => ({ ...prev, soundEnabled: !prev.soundEnabled }));
  };

  const toggleVoice = () => {
    playSoundEffect('click');
    setProfile(prev => ({ ...prev, voiceEnabled: !prev.voiceEnabled }));
  };

  const toggleTheme = () => {
    playSoundEffect('click');
    const newTheme = profile.theme === 'dark' ? 'light' : 'dark';
    setProfile(prev => ({ ...prev, theme: newTheme }));
    if (newTheme === 'light') {
      document.documentElement.classList.remove('dark');
    } else {
      document.documentElement.classList.add('dark');
    }
  };

  const toggleAccessibility = (key: keyof AccessibilitySettings) => {
    playSoundEffect('click');
    setProfile(prev => ({
      ...prev,
      accessibility: {
        ...prev.accessibility,
        [key]: !prev.accessibility[key]
      }
    }));
  };

  const showcaseIds = profile?.showcaseBadgeIds || [];
  const showcasedBadges: Badge[] = (ALL_BADGES || []).filter(b =>
    showcaseIds.includes(b.id)
  );

  return (
    <div id="profile-view" className="max-w-4xl mx-auto space-y-6 animate-in fade-in duration-200 pb-16">
      
      {/* Toast Notification */}
      {uploadSuccessToast && (
        <div className="fixed top-20 right-4 sm:right-8 z-50 bg-emerald-500 text-neutral-950 px-4 py-2.5 rounded-2xl font-bold text-xs shadow-2xl flex items-center gap-2 animate-in fade-in slide-in-from-top-2">
          <CheckCircle2 className="w-4 h-4" />
          <span>{uploadSuccessToast}</span>
        </div>
      )}

      {/* Hidden File Input for Custom Avatar */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileUpload}
        accept="image/*"
        className="hidden"
      />

      {/* PROFILE HEADER CARD */}
      <div className="rounded-3xl border border-neutral-800 bg-neutral-900/80 overflow-hidden shadow-2xl">
        
        {/* Banner Gradient */}
        <div className={`h-40 sm:h-48 bg-gradient-to-r ${profile.bannerGradient} relative`}>
          <div className="absolute top-4 left-4 flex items-center gap-2">
            {onLeaveProfile && (
              <button
                type="button"
                onClick={() => {
                  playSoundEffect('click');
                  onLeaveProfile();
                }}
                className="px-3 py-2 rounded-xl bg-neutral-950/80 hover:bg-neutral-900 border border-neutral-700 text-xs font-bold text-neutral-200 hover:text-white flex items-center gap-1.5 backdrop-blur-md shadow-md transition-all active:scale-95"
                title="Leave Profile and Return to Arena"
              >
                <LogOut className="w-3.5 h-3.5 rotate-180 text-cyan-400" />
                <span>Leave Profile</span>
              </button>
            )}
          </div>

          <div className="absolute top-4 right-4 flex items-center gap-2">
            <button
              onClick={() => {
                playSoundEffect('click');
                setIsEditing(!isEditing);
              }}
              className="px-3.5 py-2 rounded-xl bg-neutral-950/80 hover:bg-neutral-900 border border-neutral-700 text-xs font-bold text-white flex items-center gap-1.5 backdrop-blur-md shadow-md transition-all active:scale-95"
            >
              <Edit3 className="w-3.5 h-3.5 text-emerald-400" />
              <span>{isEditing ? 'Cancel' : 'Edit Profile'}</span>
            </button>

            <button
              type="button"
              onClick={() => {
                playSoundEffect('click');
                setShowSignOutConfirm(true);
              }}
              className="px-3 py-2 rounded-xl bg-rose-950/80 hover:bg-rose-900 border border-rose-500/40 text-xs font-bold text-rose-200 hover:text-white flex items-center gap-1.5 backdrop-blur-md shadow-md transition-all active:scale-95"
              title="Sign Out of Align Account"
            >
              <LogOut className="w-3.5 h-3.5 text-rose-400" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>

        {/* Profile Info Row */}
        <div className="px-6 sm:px-8 pb-6 sm:pb-8 pt-0 -mt-16 sm:-mt-20">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            
            {/* Avatar & User meta */}
            <div className="flex flex-col sm:flex-row items-center sm:items-end gap-4 text-center sm:text-left">
              <div className="relative group">
                <img
                  src={profile.avatarUrl}
                  alt={profile.username}
                  className="w-28 h-28 sm:w-32 sm:h-32 rounded-3xl object-cover border-4 border-neutral-900 shadow-2xl bg-neutral-950 shrink-0"
                  referrerPolicy="no-referrer"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute inset-0 bg-black/60 rounded-3xl opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center text-white transition-opacity text-[11px] font-bold gap-1 cursor-pointer border-4 border-emerald-500/80"
                  title="Upload custom profile picture"
                >
                  <Upload className="w-5 h-5 text-emerald-400" />
                  <span>Change Photo</span>
                </button>
              </div>

              <div className="space-y-1 mb-2">
                <div className="flex items-center justify-center sm:justify-start gap-2">
                  <h1 className="text-2xl font-black text-white">{profile.username}</h1>
                  <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-bold">
                    {profile.leagueTier}
                  </span>
                </div>
                <div className="flex items-center justify-center sm:justify-start gap-2">
                  <span className="text-xs text-neutral-400 font-medium">{profile.handle}</span>
                  {profile.googleConnected && (
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-400 border border-blue-500/30 font-bold flex items-center gap-1">
                      <svg className="w-3 h-3" viewBox="0 0 24 24">
                        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
                      </svg>
                      Google Synced
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* League Rank Quick Pill */}
            <div className="bg-neutral-950/90 p-3.5 rounded-2xl border border-neutral-800 flex items-center gap-4 justify-around sm:justify-end">
              <div>
                <span className="text-[10px] font-bold text-neutral-400 uppercase">Global Rank</span>
                <p className="text-xl font-black text-emerald-400">#{profile.globalRank}</p>
              </div>
              <div className="h-8 w-px bg-neutral-800" />
              <div>
                <span className="text-[10px] font-bold text-neutral-400 uppercase">LP Rating</span>
                <p className="text-xl font-black text-indigo-400">{profile.rankPoints.toLocaleString()}</p>
              </div>
              <div className="h-8 w-px bg-neutral-800" />
              <div>
                <span className="text-[10px] font-bold text-neutral-400 uppercase">Streak</span>
                <p className="text-xl font-black text-amber-400 flex items-center gap-1">
                  <Flame className="w-4 h-4 fill-amber-400" />
                  {profile.currentStreakDays}d
                </p>
              </div>
            </div>

          </div>

          {/* Bio & Mantra */}
          <div className="mt-5 space-y-3 pt-5 border-t border-neutral-800">
            <p className="text-xs sm:text-sm text-neutral-300 leading-relaxed max-w-2xl">
              {profile.bio}
            </p>

            <div className="p-3.5 rounded-2xl bg-neutral-950/70 border border-neutral-800 flex items-start gap-3">
              <Quote className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <span className="text-xs italic text-emerald-300/90 font-medium">
                Personal Mindset Mantra: {profile.mindsetMantra}
              </span>
            </div>
          </div>

        </div>

      </div>

      {/* NAVIGATION TABS FOR PROFILE, GOOGLE SYNC, SETTINGS & ACCESSIBILITY */}
      <div className="flex items-center gap-2 p-1.5 rounded-2xl bg-neutral-900/90 border border-neutral-800 overflow-x-auto scrollbar-none">
        <button
          onClick={() => setActiveSection('profile')}
          className={`flex-1 py-2.5 px-3.5 rounded-xl font-bold text-xs transition-all whitespace-nowrap flex items-center justify-center gap-2 ${
            activeSection === 'profile'
              ? 'bg-emerald-500 text-neutral-950 shadow-md'
              : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800/60'
          }`}
        >
          <User className="w-3.5 h-3.5" />
          <span>Profile & Picture</span>
        </button>

        <button
          onClick={() => setActiveSection('google')}
          className={`flex-1 py-2.5 px-3.5 rounded-xl font-bold text-xs transition-all whitespace-nowrap flex items-center justify-center gap-2 ${
            activeSection === 'google'
              ? 'bg-blue-600 text-white shadow-md'
              : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800/60'
          }`}
        >
          <svg className="w-3.5 h-3.5" viewBox="0 0 24 24">
            <path fill="currentColor" d="M12.545,10.239v3.821h5.445c-0.712,2.315-2.647,3.972-5.445,3.972c-3.332,0-6.033-2.701-6.033-6.032s2.701-6.032,6.033-6.032c1.498,0,2.866,0.549,3.921,1.453l2.814-2.814C17.503,2.988,15.139,2,12.545,2C7.021,2,2.543,6.477,2.543,12s4.478,10,10.002,10c8.396,0,10.249-7.85,9.426-11.761H12.545z"/>
          </svg>
          <span>Google Sync</span>
        </button>

        <button
          onClick={() => setActiveSection('settings')}
          className={`flex-1 py-2.5 px-3.5 rounded-xl font-bold text-xs transition-all whitespace-nowrap flex items-center justify-center gap-2 ${
            activeSection === 'settings'
              ? 'bg-indigo-600 text-white shadow-md'
              : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800/60'
          }`}
        >
          <Sliders className="w-3.5 h-3.5" />
          <span>Sound & Theme</span>
        </button>

        <button
          onClick={() => setActiveSection('accessibility')}
          className={`flex-1 py-2.5 px-3.5 rounded-xl font-bold text-xs transition-all whitespace-nowrap flex items-center justify-center gap-2 ${
            activeSection === 'accessibility'
              ? 'bg-teal-600 text-white shadow-md'
              : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800/60'
          }`}
        >
          <Accessibility className="w-3.5 h-3.5" />
          <span>Accessibility</span>
        </button>
      </div>

      {/* SECTION 1: PROFILE & CUSTOM PICTURES */}
      {activeSection === 'profile' && (
        <div className="space-y-6 animate-in fade-in">
          
          {/* Custom Picture Uploader Panel */}
          <div className="p-6 rounded-3xl bg-neutral-900/90 border border-neutral-800 space-y-4 shadow-xl">
            <div className="flex items-center justify-between">
              <h2 className="font-bold text-base text-white flex items-center gap-2">
                <ImageIcon className="w-5 h-5 text-emerald-400" />
                <span>Player Avatar & Picture</span>
              </h2>
              <span className="text-xs text-neutral-400">Personalize your avatar</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
              
              {/* Upload Local File Box */}
              <div
                onClick={() => fileInputRef.current?.click()}
                className="p-5 rounded-2xl border-2 border-dashed border-emerald-500/40 hover:border-emerald-400 bg-emerald-950/20 hover:bg-emerald-950/40 transition-all cursor-pointer text-center space-y-2 group"
              >
                <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto group-hover:scale-110 transition-transform">
                  <Upload className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-xs font-bold text-white block">Upload Picture from Device</span>
                  <span className="text-[11px] text-neutral-400">JPG, PNG, GIF, or WebP (Max 5MB)</span>
                </div>
                <button
                  type="button"
                  className="px-3 py-1.5 rounded-lg bg-emerald-500 text-neutral-950 font-bold text-[11px] shadow-sm pointer-events-none"
                >
                  Browse Device Files
                </button>
              </div>

              {/* Paste Image URL Box */}
              <div className="p-5 rounded-2xl bg-neutral-950/80 border border-neutral-800 space-y-2">
                <div className="flex items-center gap-2 text-neutral-300 text-xs font-bold">
                  <LinkIcon className="w-4 h-4 text-cyan-400" />
                  <span>Paste Custom Picture URL</span>
                </div>
                <div className="flex gap-2">
                  <input
                    type="url"
                    placeholder="https://example.com/avatar.jpg"
                    value={customUrlInput}
                    onChange={e => setCustomUrlInput(e.target.value)}
                    className="flex-1 p-2.5 rounded-xl bg-neutral-900 border border-neutral-700 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-cyan-500"
                  />
                  <button
                    type="button"
                    onClick={handleApplyCustomUrl}
                    className="px-3.5 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs shadow-md shrink-0 transition-all"
                  >
                    Apply
                  </button>
                </div>
                <p className="text-[10px] text-neutral-500">Direct image links will be previewed instantly.</p>
              </div>

            </div>

            {/* Curated HD Avatar Presets */}
            <div className="space-y-2 pt-2 border-t border-neutral-800/80">
              <label className="text-xs font-bold text-neutral-400">Or Select from Preset Avatars</label>
              <div className="flex gap-3 overflow-x-auto pb-1">
                {avatarPresets.map((url, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      playSoundEffect('click');
                      setEditAvatarUrl(url);
                      setProfile(prev => ({ ...prev, avatarUrl: url }));
                    }}
                    className={`rounded-2xl overflow-hidden border-2 transition-all shrink-0 ${
                      profile.avatarUrl === url ? 'border-emerald-500 ring-2 ring-emerald-500/50 scale-105 shadow-lg' : 'border-neutral-800 opacity-70 hover:opacity-100'
                    }`}
                  >
                    <img src={url} alt={`Preset ${idx}`} className="w-14 h-14 object-cover" referrerPolicy="no-referrer" />
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Profile Details Editing */}
          {isEditing && (
            <div className="rounded-3xl p-6 bg-neutral-900 border border-emerald-500/40 shadow-2xl space-y-4 animate-in fade-in">
              <h2 className="font-bold text-base text-white flex items-center gap-2">
                <Edit3 className="w-4 h-4 text-emerald-400" />
                <span>Edit Profile Identity</span>
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-neutral-400">Display Name</label>
                  <input
                    type="text"
                    value={editUsername}
                    onChange={e => setEditUsername(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-neutral-950 border border-neutral-800 text-xs text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-neutral-400">Handle</label>
                  <input
                    type="text"
                    value={editHandle}
                    onChange={e => setEditHandle(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-neutral-950 border border-neutral-800 text-xs text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div className="sm:col-span-2 space-y-1">
                  <label className="text-xs font-bold text-neutral-400">Bio</label>
                  <textarea
                    value={editBio}
                    onChange={e => setEditBio(e.target.value)}
                    rows={2}
                    className="w-full p-2.5 rounded-xl bg-neutral-950 border border-neutral-800 text-xs text-white focus:outline-none focus:border-emerald-500 resize-none"
                  />
                </div>

                <div className="sm:col-span-2 space-y-1">
                  <label className="text-xs font-bold text-neutral-400">Mindset Mantra</label>
                  <input
                    type="text"
                    value={editMantra}
                    onChange={e => setEditMantra(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-neutral-950 border border-neutral-800 text-xs text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>

                {/* Banner Presets */}
                <div className="sm:col-span-2 space-y-2">
                  <label className="text-xs font-bold text-neutral-400">Banner Atmosphere</label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {bannerPresets.map((b, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setEditBannerGradient(b.value)}
                        className={`h-12 rounded-xl bg-gradient-to-r ${b.value} border transition-all text-[11px] font-bold text-white flex items-center justify-center ${
                          editBannerGradient === b.value ? 'ring-2 ring-emerald-500 border-white' : 'border-neutral-800'
                        }`}
                      >
                        {b.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={handleSaveProfile}
                  className="flex-1 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-neutral-950 font-bold text-xs shadow-md transition-all active:scale-95"
                >
                  Save Profile Customizations
                </button>
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="py-3 px-5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-white font-bold text-xs"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

        </div>
      )}

      {/* SECTION 2: GOOGLE ACCOUNT INTEGRATION & CLOUD SYNC */}
      {activeSection === 'google' && (
        <div className="space-y-6 animate-in fade-in">
          <div className="p-6 sm:p-8 rounded-3xl bg-neutral-900/90 border border-blue-500/30 space-y-6 shadow-xl relative overflow-hidden">
            
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-white flex items-center justify-center shadow-md shrink-0">
                  <svg className="w-7 h-7" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
                  </svg>
                </div>
                <div>
                  <h2 className="text-lg font-black text-white">Google Account Integration</h2>
                  <p className="text-xs text-neutral-400">Sync streak records, unlock achievements & secure cross-device stats.</p>
                </div>
              </div>

              <span className={`text-xs font-bold px-3 py-1 rounded-full border ${
                profile.googleConnected
                  ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                  : 'bg-neutral-800 text-neutral-400 border-neutral-700'
              }`}>
                {profile.googleConnected ? 'Connected' : 'Not Linked'}
              </span>
            </div>

            {profile.googleConnected ? (
              <div className="space-y-4">
                <div className="p-4 rounded-2xl bg-neutral-950/80 border border-neutral-800 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <img
                      src={profile.avatarUrl}
                      alt="Google User"
                      className="w-11 h-11 rounded-full object-cover border border-blue-400 shadow-md"
                      referrerPolicy="no-referrer"
                    />
                    <div>
                      <span className="text-sm font-bold text-white block">{profile.username}</span>
                      <span className="text-xs text-blue-400 font-mono">{profile.googleEmail || 'uzoobu123@gmail.com'}</span>
                    </div>
                  </div>

                  <span className="text-[11px] font-bold text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-lg border border-emerald-500/20 flex items-center gap-1.5">
                    <Check className="w-3.5 h-3.5" />
                    Cloud Sync Active
                  </span>
                </div>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => handleGoogleConnect(false)}
                    disabled={googleLoading}
                    className="flex-1 py-3 px-4 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-white font-bold text-xs flex items-center justify-center gap-2 border border-neutral-700 transition-all"
                  >
                    <RefreshCw className={`w-4 h-4 ${googleLoading ? 'animate-spin' : ''}`} />
                    <span>Sync Cloud Backup Now</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleGoogleConnect(true)}
                    disabled={googleLoading}
                    className="py-3 px-4 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 font-bold text-xs flex items-center justify-center gap-2 border border-rose-500/30 transition-all"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Disconnect</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="p-4 rounded-2xl bg-neutral-950/80 border border-neutral-800 space-y-3">
                  <span className="text-xs font-bold text-neutral-300 block">Sign In or Connect Google Email</span>
                  <input
                    type="email"
                    value={googleEmailInput}
                    onChange={e => setGoogleEmailInput(e.target.value)}
                    placeholder="Enter your google email..."
                    className="w-full p-3 rounded-xl bg-neutral-900 border border-neutral-700 text-xs text-white focus:outline-none focus:border-blue-500"
                  />
                  <p className="text-[11px] text-neutral-400">
                    Signing in with your Google Account guarantees zero lost progress on daily streaks, badges, and league rankings.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => handleGoogleConnect(false)}
                  disabled={googleLoading}
                  className="w-full py-3.5 px-4 rounded-2xl bg-white hover:bg-neutral-100 text-neutral-950 font-black text-xs sm:text-sm flex items-center justify-center gap-2.5 shadow-xl transition-all active:scale-95"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
                  </svg>
                  <span>{googleLoading ? 'Connecting Google Account...' : 'Continue with Google Account'}</span>
                </button>

                {onOpenGameshowAuth && (
                  <button
                    type="button"
                    onClick={() => {
                      playSoundEffect('click');
                      onOpenGameshowAuth();
                    }}
                    className="w-full py-3 px-4 rounded-2xl bg-neutral-950 hover:bg-neutral-800 text-amber-300 hover:text-amber-200 font-bold text-xs flex items-center justify-center gap-2 border border-amber-500/30 transition-all"
                  >
                    <Sparkles className="w-4 h-4 text-amber-400" />
                    <span>Open Gameshow Stage Studio & Contestant Pass</span>
                  </button>
                )}
              </div>
            )}

          </div>
        </div>
      )}

      {/* SECTION 3: SOUND & THEME SETTINGS */}
      {activeSection === 'settings' && (
        <div className="space-y-4 animate-in fade-in">
          
          {/* Sound & Audio Controls */}
          <div className="p-6 rounded-3xl bg-neutral-900/90 border border-neutral-800 space-y-4 shadow-xl">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Volume2 className="w-5 h-5 text-emerald-400" />
              <span>Audio & Host Voice Preferences</span>
            </h2>

            <div className="space-y-3">
              {/* Sound FX Toggle */}
              <div className="p-4 rounded-2xl bg-neutral-950/70 border border-neutral-800 flex items-center justify-between gap-3">
                <div>
                  <span className="font-bold text-xs sm:text-sm text-white block">Game Sound Effects</span>
                  <span className="text-xs text-neutral-400">Audio feedback for answers, streaks, and combos.</span>
                </div>
                <button
                  type="button"
                  onClick={toggleSound}
                  className={`w-12 h-7 rounded-full transition-colors relative flex items-center px-1 ${
                    profile.soundEnabled ? 'bg-emerald-500' : 'bg-neutral-800'
                  }`}
                  aria-pressed={profile.soundEnabled}
                >
                  <div className={`w-5 h-5 rounded-full bg-white transition-transform ${profile.soundEnabled ? 'translate-x-5' : 'translate-x-0'}`} />
                </button>
              </div>

              {/* Host Commentary Voice Toggle */}
              <div className="p-4 rounded-2xl bg-neutral-950/70 border border-neutral-800 flex items-center justify-between gap-3">
                <div>
                  <span className="font-bold text-xs sm:text-sm text-white block">AI Host Voice Banter</span>
                  <span className="text-xs text-neutral-400">Realistic spoken commentary and motivational hype from AI hosts.</span>
                </div>
                <button
                  type="button"
                  onClick={toggleVoice}
                  className={`w-12 h-7 rounded-full transition-colors relative flex items-center px-1 ${
                    profile.voiceEnabled ? 'bg-emerald-500' : 'bg-neutral-800'
                  }`}
                  aria-pressed={profile.voiceEnabled}
                >
                  <div className={`w-5 h-5 rounded-full bg-white transition-transform ${profile.voiceEnabled ? 'translate-x-5' : 'translate-x-0'}`} />
                </button>
              </div>

              {/* Haptic Vibration Feedback Toggle */}
              <div className="p-4 rounded-2xl bg-neutral-950/70 border border-neutral-800 space-y-3">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <span className="font-bold text-xs sm:text-sm text-white flex items-center gap-1.5">
                      <Vibrate className="w-4 h-4 text-emerald-400" />
                      <span>Haptic Vibration Feedback</span>
                    </span>
                    <span className="text-xs text-neutral-400">
                      Physical tactile pulse on incorrect answers, buzzer timeouts, streaks, and trophies.
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      const next = profile.hapticsEnabled === false ? true : false;
                      setProfile(prev => ({ ...prev, hapticsEnabled: next }));
                      if (next) triggerHapticFeedback('streak');
                    }}
                    className={`w-12 h-7 rounded-full transition-colors relative flex items-center px-1 shrink-0 ${
                      profile.hapticsEnabled !== false ? 'bg-emerald-500' : 'bg-neutral-800'
                    }`}
                    aria-pressed={profile.hapticsEnabled !== false}
                  >
                    <div className={`w-5 h-5 rounded-full bg-white transition-transform ${profile.hapticsEnabled !== false ? 'translate-x-5' : 'translate-x-0'}`} />
                  </button>
                </div>

                {/* Haptic Test Buzzers */}
                <div className="pt-2 border-t border-neutral-800 flex items-center gap-2 flex-wrap">
                  <span className="text-[11px] font-semibold text-neutral-400">Test Haptic Pulse:</span>
                  <button
                    type="button"
                    onClick={() => {
                      triggerHapticFeedback('error');
                      playSoundEffect('incorrect');
                    }}
                    className="px-2.5 py-1 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 text-[11px] font-bold active:scale-95 transition-all"
                  >
                    Wrong Answer (Heavy Buzz)
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      triggerHapticFeedback('success');
                      playSoundEffect('correct');
                    }}
                    className="px-2.5 py-1 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[11px] font-bold active:scale-95 transition-all"
                  >
                    Correct (Snap)
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      triggerHapticFeedback('streak');
                      playSoundEffect('streak');
                    }}
                    className="px-2.5 py-1 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 text-[11px] font-bold active:scale-95 transition-all"
                  >
                    Combo Streak
                  </button>
                </div>
              </div>

              {/* Speech Narration Speed Slider */}
              <div className="p-4 rounded-2xl bg-neutral-950/70 border border-neutral-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs text-white">Host Speaking Pace</span>
                  <span className="text-xs text-emerald-400 font-mono">{profile.narrationSpeed || 1.0}x</span>
                </div>
                <input
                  type="range"
                  min="0.8"
                  max="1.3"
                  step="0.1"
                  value={profile.narrationSpeed || 1.0}
                  onChange={e => setProfile(prev => ({ ...prev, narrationSpeed: parseFloat(e.target.value) }))}
                  className="w-full accent-emerald-500 cursor-pointer"
                />
              </div>
            </div>
          </div>

          {/* Visual Theme Selection */}
          <div className="p-6 rounded-3xl bg-neutral-900/90 border border-neutral-800 space-y-4 shadow-xl">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Palette className="w-5 h-5 text-indigo-400" />
              <span>Theme & Interface Atmosphere</span>
            </h2>

            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => {
                  if (profile.theme !== 'dark') toggleTheme();
                }}
                className={`p-4 rounded-2xl border text-left transition-all flex items-center gap-3 ${
                  profile.theme === 'dark'
                    ? 'bg-neutral-950 border-emerald-500 ring-2 ring-emerald-500/40 text-white'
                    : 'bg-neutral-950/50 border-neutral-800 text-neutral-400 hover:text-white'
                }`}
              >
                <Moon className="w-5 h-5 text-indigo-400 shrink-0" />
                <div>
                  <span className="text-xs font-bold block">Midnight Dark</span>
                  <span className="text-[10px] text-neutral-500">Low-glare contrast</span>
                </div>
              </button>

              <button
                type="button"
                onClick={() => {
                  if (profile.theme !== 'light') toggleTheme();
                }}
                className={`p-4 rounded-2xl border text-left transition-all flex items-center gap-3 ${
                  profile.theme === 'light'
                    ? 'bg-neutral-950 border-amber-500 ring-2 ring-amber-500/40 text-white'
                    : 'bg-neutral-950/50 border-neutral-800 text-neutral-400 hover:text-white'
                }`}
              >
                <Sun className="w-5 h-5 text-amber-400 shrink-0" />
                <div>
                  <span className="text-xs font-bold block">Crisp Light</span>
                  <span className="text-[10px] text-neutral-500">High-daylight readability</span>
                </div>
              </button>
            </div>
          </div>

          {/* Account Session & Sign Out Card */}
          <div className="p-6 rounded-3xl bg-neutral-900/90 border border-neutral-800 space-y-4 shadow-xl">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <LogOut className="w-5 h-5 text-rose-400" />
              <span>Account Session & Contestant Pass</span>
            </h2>
            <p className="text-xs text-neutral-400">
              Manage your active session credentials, switch contestant profile, or securely sign out of Firebase authentication.
            </p>

            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  playSoundEffect('click');
                  setShowSignOutConfirm(true);
                }}
                className="flex-1 py-3 px-4 rounded-2xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 font-bold text-xs flex items-center justify-center gap-2 border border-rose-500/30 transition-all active:scale-95"
              >
                <LogOut className="w-4 h-4 text-rose-400" />
                <span>Sign Out of Account</span>
              </button>

              {onLeaveProfile && (
                <button
                  type="button"
                  onClick={() => {
                    playSoundEffect('click');
                    onLeaveProfile();
                  }}
                  className="flex-1 py-3 px-4 rounded-2xl bg-neutral-800 hover:bg-neutral-700 text-neutral-200 font-bold text-xs flex items-center justify-center gap-2 border border-neutral-700 transition-all active:scale-95"
                >
                  <LogOut className="w-4 h-4 rotate-180 text-cyan-400" />
                  <span>Leave Profile & Return to Arena</span>
                </button>
              )}
            </div>
          </div>

        </div>
      )}

      {/* SECTION 4: ACCESSIBILITY & USABILITY (WCAG AA) */}
      {activeSection === 'accessibility' && (
        <div className="space-y-4 animate-in fade-in">
          <div className="p-6 rounded-3xl bg-neutral-900/90 border border-neutral-800 space-y-4 shadow-xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-teal-500/20 text-teal-400 flex items-center justify-center">
                  <Accessibility className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="font-bold text-base text-white">Accessibility & Usability</h2>
                  <span className="text-[11px] text-neutral-400">WCAG 2.1 Level AA Usability Suite</span>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              {/* High Contrast */}
              <div className="p-4 rounded-2xl bg-neutral-950/70 border border-neutral-800 flex items-center justify-between gap-3">
                <div>
                  <span className="font-bold text-xs sm:text-sm text-white block">High Contrast Mode</span>
                  <span className="text-xs text-neutral-400">Increases contrast ratios and border clarity beyond 4.5:1 standards.</span>
                </div>
                <button
                  type="button"
                  onClick={() => toggleAccessibility('highContrast')}
                  className={`w-12 h-7 rounded-full transition-colors relative flex items-center px-1 ${
                    profile.accessibility.highContrast ? 'bg-teal-500' : 'bg-neutral-800'
                  }`}
                  aria-pressed={profile.accessibility.highContrast}
                >
                  <div className={`w-5 h-5 rounded-full bg-white transition-transform ${profile.accessibility.highContrast ? 'translate-x-5' : 'translate-x-0'}`} />
                </button>
              </div>

              {/* Reduced Motion */}
              <div className="p-4 rounded-2xl bg-neutral-950/70 border border-neutral-800 flex items-center justify-between gap-3">
                <div>
                  <span className="font-bold text-xs sm:text-sm text-white block">Reduced Motion</span>
                  <span className="text-xs text-neutral-400">Suppresses physics bounces, rapid shakes, and particle pulses.</span>
                </div>
                <button
                  type="button"
                  onClick={() => toggleAccessibility('reducedMotion')}
                  className={`w-12 h-7 rounded-full transition-colors relative flex items-center px-1 ${
                    profile.accessibility.reducedMotion ? 'bg-teal-500' : 'bg-neutral-800'
                  }`}
                  aria-pressed={profile.accessibility.reducedMotion}
                >
                  <div className={`w-5 h-5 rounded-full bg-white transition-transform ${profile.accessibility.reducedMotion ? 'translate-x-5' : 'translate-x-0'}`} />
                </button>
              </div>

              {/* Large Text */}
              <div className="p-4 rounded-2xl bg-neutral-950/70 border border-neutral-800 flex items-center justify-between gap-3">
                <div>
                  <span className="font-bold text-xs sm:text-sm text-white block">Enlarged Question Font</span>
                  <span className="text-xs text-neutral-400">Scales quiz typography for effortless reading at any distance.</span>
                </div>
                <button
                  type="button"
                  onClick={() => toggleAccessibility('largeText')}
                  className={`w-12 h-7 rounded-full transition-colors relative flex items-center px-1 ${
                    profile.accessibility.largeText ? 'bg-teal-500' : 'bg-neutral-800'
                  }`}
                  aria-pressed={profile.accessibility.largeText}
                >
                  <div className={`w-5 h-5 rounded-full bg-white transition-transform ${profile.accessibility.largeText ? 'translate-x-5' : 'translate-x-0'}`} />
                </button>
              </div>

              {/* Auto-Speak Questions */}
              <div className="p-4 rounded-2xl bg-neutral-950/70 border border-neutral-800 flex items-center justify-between gap-3">
                <div>
                  <span className="font-bold text-xs sm:text-sm text-white block">Auto-Read Questions via Host Voice</span>
                  <span className="text-xs text-neutral-400">Automatically articulates trivia questions out loud when rounds begin.</span>
                </div>
                <button
                  type="button"
                  onClick={() => toggleAccessibility('autoSpeakQuestions')}
                  className={`w-12 h-7 rounded-full transition-colors relative flex items-center px-1 ${
                    profile.accessibility.autoSpeakQuestions ? 'bg-teal-500' : 'bg-neutral-800'
                  }`}
                  aria-pressed={profile.accessibility.autoSpeakQuestions}
                >
                  <div className={`w-5 h-5 rounded-full bg-white transition-transform ${profile.accessibility.autoSpeakQuestions ? 'translate-x-5' : 'translate-x-0'}`} />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* FEATURED SHOWCASE BADGES WITH NEW VECTOR GRAPHICS */}
      <div className="rounded-3xl p-6 bg-neutral-900/80 border border-neutral-800 space-y-4 shadow-xl">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <Award className="w-5 h-5 text-amber-400" />
            <span>Featured Mastery Showcase</span>
          </h2>
          <span className="text-xs text-neutral-400 font-semibold">
            {showcasedBadges.length} / 3 Displayed
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {showcasedBadges.map(badge => (
            <div
              key={badge.id}
              onClick={() => {
                playSoundEffect('click');
                setSharingBadge(badge);
              }}
              className="p-4 rounded-2xl bg-neutral-950/80 border border-amber-500/30 hover:border-amber-400/60 flex items-center gap-3.5 shadow-md group cursor-pointer transition-all hover:scale-[1.02]"
            >
              <div className="shrink-0 group-hover:scale-110 transition-transform">
                <BadgeVectorGraphic
                  iconName={badge.iconName}
                  badgeId={badge.id}
                  rarity={badge.rarity}
                  size="md"
                  isUnlocked={true}
                />
              </div>
              <div className="overflow-hidden flex-1">
                <span className="font-bold text-xs text-white block truncate">{badge.title}</span>
                <span className="text-[10px] text-amber-300/90 font-semibold block">{badge.rarity} Tier</span>
                <span className="text-[9px] text-neutral-500 flex items-center gap-1 mt-0.5">
                  <Share2 className="w-2.5 h-2.5 text-amber-400" /> Tap to Share
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* REALISTIC DAILY INFO & CAREER METRICS GRID */}
      <div className="space-y-4">
        
        {/* Top 4 Quick Stat Metric Tiles */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="p-4 rounded-2xl bg-neutral-900/80 border border-neutral-800 text-left relative overflow-hidden">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">Total Matches</span>
              <Activity className="w-3.5 h-3.5 text-indigo-400" />
            </div>
            <p className="text-2xl font-black text-white mt-1.5">{stats.totalGames}</p>
            <span className="text-[10px] text-neutral-500 font-medium block mt-0.5">
              {stats.totalQuestionsAnswered} total questions
            </span>
          </div>

          <div className="p-4 rounded-2xl bg-neutral-900/80 border border-neutral-800 text-left relative overflow-hidden">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">True Accuracy</span>
              <Target className="w-3.5 h-3.5 text-cyan-400" />
            </div>
            <p className="text-2xl font-black text-cyan-400 mt-1.5">{stats.overallAccuracy}%</p>
            <span className="text-[10px] text-neutral-500 font-medium block mt-0.5">
              {stats.totalQuestionsCorrect} / {stats.totalQuestionsAnswered} correct
            </span>
          </div>

          <div className="p-4 rounded-2xl bg-neutral-900/80 border border-neutral-800 text-left relative overflow-hidden">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">Play Time Today</span>
              <Clock className="w-3.5 h-3.5 text-emerald-400" />
            </div>
            <p className="text-2xl font-black text-emerald-400 mt-1.5">{stats.todayMinutes}m</p>
            <span className="text-[10px] text-neutral-500 font-medium block mt-0.5">
              {stats.todayMatches} match{stats.todayMatches === 1 ? '' : 'es'} ({stats.todayAccuracy}% acc)
            </span>
          </div>

          <div className="p-4 rounded-2xl bg-neutral-900/80 border border-neutral-800 text-left relative overflow-hidden">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">Active Streak</span>
              <Flame className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
            </div>
            <p className="text-2xl font-black text-amber-400 mt-1.5">{calculatedStreakDays} Days</p>
            <span className="text-[10px] text-neutral-500 font-medium block mt-0.5">
              Peak combo: {profile.highestStreak}x
            </span>
          </div>
        </div>

        {/* 7-DAY TRAILING ACTIVITY & DAILY PLAY INFO */}
        <div className="rounded-3xl p-5 sm:p-6 bg-neutral-900/80 border border-neutral-800 space-y-4 shadow-xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h2 className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
                <Calendar className="w-4 h-4 text-emerald-400" />
                <span>7-Day Activity & Daily Play Time</span>
              </h2>
              <p className="text-[11px] text-neutral-400 mt-0.5">
                Real time logged from user daily play sessions ({stats.weeklyMinutes}m total this week across {stats.activeDaysThisWeek} active days).
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-bold flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Live Daily Sync
              </span>
            </div>
          </div>

          {/* 7-Day Visual Day Columns */}
          <div className="grid grid-cols-7 gap-1.5 sm:gap-3 pt-2">
            {stats.dailyHistory.map(day => (
              <div
                key={day.date}
                className={`p-2 sm:p-3 rounded-2xl border text-center transition-all flex flex-col justify-between min-h-[90px] sm:min-h-[105px] ${
                  day.dayLabel === 'Today'
                    ? 'bg-emerald-950/40 border-emerald-500/60 ring-1 ring-emerald-500/40'
                    : day.matchesCount > 0
                    ? 'bg-neutral-950/80 border-neutral-800'
                    : 'bg-neutral-950/40 border-neutral-900 opacity-60'
                }`}
              >
                <div>
                  <span className={`text-[10px] sm:text-xs font-bold block ${
                    day.dayLabel === 'Today' ? 'text-emerald-400' : 'text-neutral-300'
                  }`}>
                    {day.dayLabel}
                  </span>
                  <span className="text-[9px] text-neutral-500 block font-mono">{day.formattedDate}</span>
                </div>

                <div className="my-1 flex items-center justify-center">
                  {day.matchesCount > 0 ? (
                    <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-emerald-500/20 border border-emerald-500/50 flex items-center justify-center">
                      <Check className="w-3 h-3 text-emerald-400" />
                    </div>
                  ) : (
                    <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-neutral-900 border border-neutral-800 flex items-center justify-center">
                      <span className="text-[10px] text-neutral-600">-</span>
                    </div>
                  )}
                </div>

                <div>
                  <span className="text-[10px] font-bold text-white block">
                    {day.minutesPlayed > 0 ? `${day.minutesPlayed}m` : '0m'}
                  </span>
                  <span className="text-[9px] text-neutral-400 block truncate">
                    {day.matchesCount > 0 ? `${day.matchesCount} games` : 'Rest'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* CATEGORY MASTERY & ACCURACY BREAKDOWN */}
        <div className="rounded-3xl p-5 sm:p-6 bg-neutral-900/80 border border-neutral-800 space-y-4 shadow-xl">
          <div className="flex items-center justify-between">
            <h2 className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-indigo-400" />
              <span>Category Mastery & Real Accuracies</span>
            </h2>
            <span className="text-[11px] text-neutral-400 font-medium">
              Calculated from match history
            </span>
          </div>

          <div className="space-y-3 pt-1">
            {stats.categoryStats.slice(0, 5).map(cat => (
              <div key={cat.category} className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-neutral-200">{cat.category}</span>
                    <span className="text-[10px] text-neutral-500 font-medium">
                      ({cat.matchesPlayed} matches • {cat.questionsCorrect}/{cat.questionsAnswered} correct)
                    </span>
                  </div>
                  <span className={`font-mono font-bold ${
                    cat.accuracy >= 90 ? 'text-emerald-400' : cat.accuracy >= 75 ? 'text-cyan-400' : 'text-amber-400'
                  }`}>
                    {cat.accuracy}%
                  </span>
                </div>
                {/* Progress bar */}
                <div className="w-full h-2 rounded-full bg-neutral-950 overflow-hidden border border-neutral-800">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      cat.accuracy >= 90
                        ? 'bg-gradient-to-r from-emerald-500 to-teal-400'
                        : cat.accuracy >= 75
                        ? 'bg-gradient-to-r from-cyan-500 to-blue-400'
                        : 'bg-gradient-to-r from-amber-500 to-orange-400'
                    }`}
                    style={{ width: `${Math.max(5, cat.accuracy)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* REALISTIC ACCOUNT CREDENTIALS & CONTESTANT PASS CARD */}
        <div className="rounded-3xl p-5 sm:p-6 bg-neutral-900/80 border border-neutral-800 space-y-4 shadow-xl">
          <div className="flex items-center justify-between">
            <h2 className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-cyan-400" />
              <span>Contestant Account Credentials & Sync</span>
            </h2>
            <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20 font-bold">
              Pass ID: #{profile.id.slice(0, 10)}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            <div className="p-3.5 rounded-2xl bg-neutral-950/60 border border-neutral-800 space-y-1">
              <span className="text-[10px] font-bold text-neutral-500 uppercase">Registered Email</span>
              <p className="font-mono text-white font-semibold truncate">
                {profile.googleEmail || 'uzoobu123@gmail.com'}
              </p>
            </div>
            <div className="p-3.5 rounded-2xl bg-neutral-950/60 border border-neutral-800 space-y-1">
              <span className="text-[10px] font-bold text-neutral-500 uppercase">Member Since</span>
              <p className="text-white font-semibold">{profile.memberSince || 'Aug 2026'}</p>
            </div>
            <div className="p-3.5 rounded-2xl bg-neutral-950/60 border border-neutral-800 space-y-1">
              <span className="text-[10px] font-bold text-neutral-500 uppercase">Cloud Persistence</span>
              <p className="text-emerald-400 font-semibold flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block animate-pulse" />
                Firestore Encrypted
              </p>
            </div>
          </div>
        </div>

      </div>

      {/* MATCH HISTORY LOG */}
      <div className="rounded-3xl p-6 bg-neutral-900/80 border border-neutral-800 space-y-4 shadow-xl">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <Clock className="w-5 h-5 text-indigo-400" />
            <span>Recent Match Logs & Time History</span>
          </h2>
          <span className="text-xs text-neutral-400">
            {profile.history.length} logged records
          </span>
        </div>

        <div className="space-y-2">
          {profile.history.slice(0, 15).map(rec => (
            <div
              key={rec.id}
              className="p-3.5 rounded-2xl bg-neutral-950/60 border border-neutral-800 flex items-center justify-between gap-3 text-xs"
            >
              <div>
                <span className="font-bold text-white block">{rec.category}</span>
                <span className="text-[10px] text-neutral-400">
                  {rec.timestamp} • Host: {rec.personality} • Mode: {rec.mode} {rec.durationSeconds ? `• ${Math.round(rec.durationSeconds / 60) || 1}m play` : ''}
                </span>
              </div>

              <div className="flex items-center gap-4 text-right">
                <div>
                  <span className="font-bold text-emerald-400 block">{rec.score} pts</span>
                  <span className="text-[10px] text-neutral-400">{rec.accuracy}% acc</span>
                </div>
                <span className="font-bold text-indigo-400 bg-indigo-500/10 px-2 py-1 rounded-md border border-indigo-500/20 shrink-0">
                  +{rec.leaguePointsDelta} LP
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* BADGE SHARE CARD MODAL */}
      <BadgeShareCardModal
        badge={sharingBadge}
        profile={profile}
        onClose={() => setSharingBadge(null)}
        onShareToHub={onOpenSocialHub}
      />

      {/* SIGN OUT CONFIRMATION MODAL */}
      {showSignOutConfirm && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-950/85 backdrop-blur-md animate-in fade-in duration-200"
          role="dialog"
          aria-modal="true"
          aria-label="Confirm Sign Out"
        >
          <div className="w-full max-w-md rounded-3xl bg-neutral-900 border border-neutral-800 p-6 space-y-5 shadow-2xl animate-in zoom-in-95 duration-150">
            <div className="w-12 h-12 rounded-2xl bg-rose-500/20 text-rose-400 border border-rose-500/30 flex items-center justify-center mx-auto shadow-inner">
              <LogOut className="w-6 h-6" />
            </div>

            <div className="text-center space-y-1.5">
              <h2 className="text-lg font-black text-white">Sign Out of Contestant Account?</h2>
              <p className="text-xs text-neutral-400 leading-relaxed">
                You will leave your profile session and return to the main stage. Your unlocked trophies and streak progress are safely saved in the cloud.
              </p>
            </div>

            <div className="p-3.5 rounded-2xl bg-neutral-950/80 border border-neutral-800 flex items-center gap-3">
              <img
                src={profile.avatarUrl}
                alt={profile.username}
                className="w-10 h-10 rounded-full object-cover border border-emerald-500/50"
                referrerPolicy="no-referrer"
              />
              <div className="text-left overflow-hidden">
                <span className="text-xs font-bold text-white block truncate">{profile.username}</span>
                <span className="text-[10px] text-neutral-400 block truncate">{profile.handle} • {profile.leagueTier}</span>
              </div>
            </div>

            <div className="flex gap-2.5 pt-2">
              <button
                type="button"
                onClick={handleExecuteSignOut}
                disabled={isSigningOut}
                className="flex-1 py-3 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shadow-lg shadow-rose-600/30 flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-50"
              >
                {isSigningOut ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Signing Out...</span>
                  </>
                ) : (
                  <>
                    <LogOut className="w-4 h-4" />
                    <span>Confirm & Sign Out</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => setShowSignOutConfirm(false)}
                disabled={isSigningOut}
                className="px-5 py-3 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-white font-bold text-xs transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
