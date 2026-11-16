import React, { useState, useEffect } from 'react';
import {
  Brain,
  Sparkles,
  Award,
  Trophy,
  Users,
  User,
  Radio,
  Bell,
  X,
  CheckCircle2,
  Flame,
  Volume2
} from 'lucide-react';
import { PlayerProfile, PersonalityType, HostPersona, NotificationItem, TabType } from './types';
import { INITIAL_PLAYER_PROFILE, HOST_PERSONAS, MOCK_NOTIFICATIONS } from './data/mockData';
import { Navbar } from './components/Navbar';
import { TriviaArena } from './components/TriviaArena';
import { RanksAndBadgesView } from './components/RanksAndBadgesView';
import { SocialHubView } from './components/SocialHubView';
import { ProfileView } from './components/ProfileView';
import { MultiplayerArena } from './components/MultiplayerArena';
import { GameshowAuthModal } from './components/GameshowAuthModal';
import { AccessibilityModal } from './components/AccessibilityModal';
import { LiveVoiceModal } from './components/LiveVoiceModal';
import { WelcomeAuthPage } from './components/WelcomeAuthPage';
import { FortuneFlywheelModal } from './components/FortuneFlywheelModal';
import { playSoundEffect } from './utils/audio';
import { auth, syncUserProfileOnLogin, saveUserProfileToFirestore } from './lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';

export function App() {
  // Persistence state with robust hydration fallback
  const [profile, setProfile] = useState<PlayerProfile>(() => {
    try {
      const saved = localStorage.getItem('align_trivia_profile');
      if (saved) {
        const parsed = JSON.parse(saved);
        return {
          ...INITIAL_PLAYER_PROFILE,
          ...parsed,
          showcaseBadgeIds: Array.isArray(parsed.showcaseBadgeIds)
            ? parsed.showcaseBadgeIds
            : INITIAL_PLAYER_PROFILE.showcaseBadgeIds,
          unlockedBadgeIds: Array.isArray(parsed.unlockedBadgeIds)
            ? parsed.unlockedBadgeIds
            : INITIAL_PLAYER_PROFILE.unlockedBadgeIds,
          history: Array.isArray(parsed.history)
            ? parsed.history
            : INITIAL_PLAYER_PROFILE.history,
          accessibility: {
            ...INITIAL_PLAYER_PROFILE.accessibility,
            ...(parsed.accessibility || {})
          }
        };
      }
    } catch {}
    return INITIAL_PLAYER_PROFILE;
  });

  const [selectedHost, setSelectedHost] = useState<PersonalityType>('Nova');
  const [activeTab, setActiveTab] = useState<TabType>('play');
  const [showWelcomePage, setShowWelcomePage] = useState<boolean>(() => {
    try {
      return localStorage.getItem('align_trivia_onboarding_done') !== 'true';
    } catch {
      return false;
    }
  });
  
  // Modals & Notifications
  const [isAccessibilityOpen, setIsAccessibilityOpen] = useState<boolean>(false);
  const [isVoiceModalOpen, setIsVoiceModalOpen] = useState<boolean>(false);
  const [isGameshowAuthOpen, setIsGameshowAuthOpen] = useState<boolean>(false);
  const [isFlywheelOpen, setIsFlywheelOpen] = useState<boolean>(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>(MOCK_NOTIFICATIONS || []);
  const [activeToast, setActiveToast] = useState<NotificationItem | null>(null);

  // Listen to Firebase Auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          const syncedProfile = await syncUserProfileOnLogin(firebaseUser);
          setProfile(syncedProfile);
        } catch (error) {
          console.error('Failed to sync user profile from Firestore:', error);
        }
      }
    });

    return () => unsubscribe();
  }, []);

  // Sync profile to localStorage and to Firestore if authenticated
  useEffect(() => {
    try {
      localStorage.setItem('align_trivia_profile', JSON.stringify(profile));
    } catch {}

    if (profile.id && profile.googleConnected && auth.currentUser) {
      saveUserProfileToFirestore(profile).catch(err => {
        console.error('Failed to auto-save to Firestore:', err);
      });
    }
  }, [profile]);

  // Periodic real-time push notification simulator (event updates & community banter)
  useEffect(() => {
    const timer = setTimeout(() => {
      const liveAlert: NotificationItem = {
        id: `notif-${Date.now()}`,
        title: '⚡ Community Challenge Surge!',
        message: 'The Align Mindset Initiative just crossed 80,000 points towards the collective goal!',
        type: 'challenge',
        timestamp: 'Just now',
        isRead: false
      };
      setNotifications(prev => [liveAlert, ...(prev || [])]);
      setActiveToast(liveAlert);
      if (profile?.soundEnabled) playSoundEffect('click');

      const autoDismiss = setTimeout(() => setActiveToast(null), 5000);
      return () => clearTimeout(autoDismiss);
    }, 15000);

    return () => clearTimeout(timer);
  }, [profile?.soundEnabled]);

  const currentHost: HostPersona = HOST_PERSONAS[selectedHost] || HOST_PERSONAS['Nova'];

  // Root accessibility classes
  const contrastClass = profile?.accessibility?.highContrast ? 'contrast-125' : '';
  const textScaleClass = profile?.accessibility?.largeText ? 'text-lg' : '';

  const handleCompleteOnboarding = () => {
    try {
      localStorage.setItem('align_trivia_onboarding_done', 'true');
    } catch {}
    setShowWelcomePage(false);
  };

  if (showWelcomePage) {
    return (
      <WelcomeAuthPage
        profile={profile}
        setProfile={setProfile}
        onCompleteOnboarding={handleCompleteOnboarding}
      />
    );
  }

  return (
    <div
      id="align-trivia-root-app"
      className={`min-h-screen bg-[#070707] text-white flex flex-col selection:bg-amber-400 selection:text-black ${contrastClass} ${textScaleClass}`}
    >
      {/* Top Accessible Navigation */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        profile={profile}
        setProfile={setProfile}
        currentHost={currentHost}
        notifications={notifications}
        setNotifications={setNotifications}
        onOpenAccessibility={() => setIsAccessibilityOpen(true)}
        onOpenLiveVoice={() => setIsVoiceModalOpen(true)}
        onOpenGameshowAuth={() => setIsGameshowAuthOpen(true)}
        onOpenWelcomeTutorial={() => setShowWelcomePage(true)}
        onOpenFlywheelModal={() => setIsFlywheelOpen(true)}
      />

      {/* Main Content Area with Bottom Dock Spacing */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-6 pb-28 sm:pb-32">
        
        {/* Render Tab Views with Smooth Animations */}
        {activeTab === 'play' && (
          <TriviaArena
            profile={profile}
            setProfile={setProfile}
            selectedHost={selectedHost}
            setSelectedHost={setSelectedHost}
            onOpenSocialHub={() => setActiveTab('social')}
            onOpenLeaderboard={() => setActiveTab('ranks')}
            onOpenVoiceModal={() => setIsVoiceModalOpen(true)}
            onOpenMultiplayer={() => setActiveTab('multiplayer')}
            onOpenGameshowAuth={() => setIsGameshowAuthOpen(true)}
            onOpenFlywheelModal={() => setIsFlywheelOpen(true)}
          />
        )}

        {activeTab === 'multiplayer' && (
          <MultiplayerArena
            profile={profile}
            setProfile={setProfile}
            onOpenSocialHub={() => setActiveTab('social')}
            onBackToSolo={() => setActiveTab('play')}
          />
        )}

        {(activeTab === 'ranks' || activeTab === 'leaderboard' || activeTab === 'achievements') && (
          <RanksAndBadgesView
            profile={profile}
            setProfile={setProfile}
            initialSubTab={activeTab === 'achievements' ? 'badges' : 'standings'}
            onOpenSocialHub={() => setActiveTab('social')}
          />
        )}

        {activeTab === 'social' && (
          <SocialHubView
            profile={profile}
            setProfile={setProfile}
            currentHost={currentHost}
          />
        )}

        {activeTab === 'profile' && (
          <ProfileView
            profile={profile}
            setProfile={setProfile}
            onOpenSocialHub={() => setActiveTab('social')}
            onOpenGameshowAuth={() => setIsGameshowAuthOpen(true)}
            onSignOut={() => {
              setShowWelcomePage(true);
            }}
            onLeaveProfile={() => {
              setActiveTab('play');
            }}
          />
        )}

      </main>

      {/* Real-time Push Notification Toast (White, Black & Gold) */}
      {activeToast && (
        <div
          className="fixed bottom-24 sm:bottom-24 right-3 sm:right-5 z-50 max-w-sm rounded-2xl bg-neutral-950/95 border border-amber-500/50 p-4 shadow-2xl gold-glow flex items-start gap-3 animate-in slide-in-from-bottom-5 duration-200"
          role="status"
          aria-live="polite"
        >
          <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/40 flex items-center justify-center shrink-0">
            <Bell className="w-4 h-4" />
          </div>
          <div className="space-y-0.5 flex-1">
            <h2 className="font-bold text-xs text-amber-200">{activeToast.title}</h2>
            <p className="text-xs text-neutral-200 leading-snug">{activeToast.message}</p>
          </div>
          <button
            onClick={() => setActiveToast(null)}
            className="p-1 text-neutral-400 hover:text-amber-300 transition-colors"
            aria-label="Dismiss notification"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Fortune Flywheel & Daily Rewards Modal */}
      <FortuneFlywheelModal
        isOpen={isFlywheelOpen}
        onClose={() => setIsFlywheelOpen(false)}
        profile={profile}
        setProfile={setProfile}
      />

      {/* Gameshow-Themed Authentic Authentication & Contestant Studio Modal */}
      <GameshowAuthModal
        isOpen={isGameshowAuthOpen}
        onClose={() => setIsGameshowAuthOpen(false)}
        profile={profile}
        setProfile={setProfile}
      />

      {/* WCAG AA Accessibility Modal */}
      <AccessibilityModal
        isOpen={isAccessibilityOpen}
        onClose={() => setIsAccessibilityOpen(false)}
        profile={profile}
        setProfile={setProfile}
      />

      {/* Interactive Live Voice Room Modal */}
      <LiveVoiceModal
        isOpen={isVoiceModalOpen}
        onClose={() => setIsVoiceModalOpen(false)}
        currentHost={currentHost}
        profile={profile}
      />

      {/* Accessible Footer with Gold Accents */}
      <footer className="border-t border-neutral-900 bg-neutral-950/80 py-6 px-4 text-center text-xs text-neutral-400 pb-28 sm:pb-24">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-neutral-300 font-medium">
            © 2026 <span className="text-white font-bold">Align Mindset Initiative</span>. Built for cognitive agility, high neuroplasticity & competitive growth.
          </p>
          <div className="flex items-center gap-4 text-neutral-400">
            <span className="text-amber-400/90 font-semibold">WCAG 2.1 AA Compliant</span>
            <span>•</span>
            <span className="text-amber-300/90 font-semibold">Gemini TTS & Live API Powered</span>
          </div>
        </div>
      </footer>

    </div>
  );
}

export default App;
