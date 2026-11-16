import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  User
} from 'firebase/auth';
import {
  getFirestore,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  collection,
  query,
  where,
  getDocs,
  onSnapshot,
  orderBy,
  limit,
  Unsubscribe
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';
import { PlayerProfile, MatchRecord, LeaderboardEntry, LeagueTier } from '../types';
import { INITIAL_PLAYER_PROFILE, BENCHMARK_TOP_BOSSES, MOCK_LEADERBOARD } from '../data/mockData';
import { computeProfileStats, computeConsecutiveStreakDays, generateRealisticInitialHistory } from '../utils/userStats';

// Initialize Firebase App instance safely
export const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// Authentication Instance
export const auth = getAuth(app);

// Firestore Instance (with custom database ID from config if present)
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId || undefined);

// Google Provider setup
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({
  prompt: 'select_account'
});

/**
 * Sign in with Google Popup
 */
export async function signInWithGoogle(): Promise<{ user: User; profile: PlayerProfile }> {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    const user = result.user;

    // Load or create the user profile document in Firestore
    const profile = await syncUserProfileOnLogin(user);
    return { user, profile };
  } catch (error: any) {
    console.error('Google Sign In Error:', error);
    throw error;
  }
}

/**
 * Sign out current user
 */
export async function logOutUser(): Promise<void> {
  await signOut(auth);
}

/**
 * Sync / Restore user profile from Firestore or initialize new one
 */
export async function syncUserProfileOnLogin(user: User): Promise<PlayerProfile> {
  const userDocRef = doc(db, 'users', user.uid);
  const userSnapshot = await getDoc(userDocRef);

  if (userSnapshot.exists()) {
    const data = userSnapshot.data();
    
    // Load matches history
    const matchesQuery = query(collection(db, 'matchHistory'), where('userId', '==', user.uid));
    const matchesSnap = await getDocs(matchesQuery);
    const history: MatchRecord[] = [];
    matchesSnap.forEach(d => {
      history.push(d.data() as MatchRecord);
    });

    const activeHistory = history.length > 0 ? history : generateRealisticInitialHistory();
    // Sort by isoDate or timestamp desc
    activeHistory.sort((a, b) => {
      const timeA = a.isoDate ? new Date(a.isoDate).getTime() : 0;
      const timeB = b.isoDate ? new Date(b.isoDate).getTime() : 0;
      return timeB - timeA;
    });

    const calculatedStats = computeProfileStats({
      ...INITIAL_PLAYER_PROFILE,
      history: activeHistory,
      totalGames: activeHistory.length,
      accuracyRate: INITIAL_PLAYER_PROFILE.accuracyRate
    });

    const calculatedStreakDays = computeConsecutiveStreakDays(activeHistory);

    const rankPoints = typeof data.rankPoints === 'number' ? data.rankPoints : 4420;
    // Calculate realistic dynamic rank based on tier and rank points
    const dynamicGlobalRank = Math.max(1, Math.floor(5000 / (rankPoints / 100 + 1)));

    const loadedProfile: PlayerProfile = {
      ...INITIAL_PLAYER_PROFILE,
      id: user.uid,
      username: data.username || user.displayName || 'Champion Contestant',
      handle: data.handle || `@${(user.displayName || 'contestant').toLowerCase().replace(/[^a-z0-9]/g, '')}`,
      avatarUrl: user.photoURL || data.avatarUrl || INITIAL_PLAYER_PROFILE.avatarUrl,
      bannerGradient: data.bannerGradient || INITIAL_PLAYER_PROFILE.bannerGradient,
      bio: data.bio || INITIAL_PLAYER_PROFILE.bio,
      mindsetMantra: data.mindsetMantra || INITIAL_PLAYER_PROFILE.mindsetMantra,
      leagueTier: data.leagueTier || INITIAL_PLAYER_PROFILE.leagueTier,
      rankPoints,
      globalRank: data.globalRank || dynamicGlobalRank,
      totalGames: calculatedStats.totalGames,
      accuracyRate: calculatedStats.overallAccuracy,
      highestStreak: typeof data.highestStreak === 'number' ? data.highestStreak : 12,
      currentStreakDays: calculatedStreakDays,
      showcaseBadgeIds: data.showcaseBadgeIds || INITIAL_PLAYER_PROFILE.showcaseBadgeIds,
      unlockedBadgeIds: data.unlockedBadgeIds || INITIAL_PLAYER_PROFILE.unlockedBadgeIds,
      soundEnabled: data.soundEnabled !== undefined ? data.soundEnabled : true,
      voiceEnabled: data.voiceEnabled !== undefined ? data.voiceEnabled : true,
      hapticsEnabled: data.hapticsEnabled !== undefined ? data.hapticsEnabled : true,
      narrationSpeed: data.narrationSpeed || 1.0,
      theme: data.theme || 'dark',
      memberSince: data.memberSince || 'Aug 2026',
      accessibility: data.accessibility || INITIAL_PLAYER_PROFILE.accessibility,
      history: activeHistory,
      googleConnected: true,
      googleEmail: user.email || undefined,
      googleName: user.displayName || undefined,
      googlePhotoUrl: user.photoURL || undefined,
    };

    return loadedProfile;
  } else {
    // Brand new user profile in Firestore
    const cleanHandle = `@${(user.displayName || 'mindset_player').toLowerCase().replace(/[^a-z0-9]/g, '')}`;
    const initialHistory = generateRealisticInitialHistory();
    const initialStats = computeProfileStats({
      ...INITIAL_PLAYER_PROFILE,
      history: initialHistory,
      totalGames: initialHistory.length
    });

    const newProfile: PlayerProfile = {
      ...INITIAL_PLAYER_PROFILE,
      id: user.uid,
      username: user.displayName || 'Champion Contestant',
      handle: cleanHandle,
      avatarUrl: user.photoURL || INITIAL_PLAYER_PROFILE.avatarUrl,
      totalGames: initialStats.totalGames,
      accuracyRate: initialStats.overallAccuracy,
      currentStreakDays: computeConsecutiveStreakDays(initialHistory),
      googleConnected: true,
      googleEmail: user.email || undefined,
      googleName: user.displayName || undefined,
      googlePhotoUrl: user.photoURL || undefined,
      memberSince: new Date().toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
      history: initialHistory
    };

    // Save to Firestore
    await saveUserProfileToFirestore(newProfile);
    return newProfile;
  }
}

/**
 * Persist user progress, rank points, badges, and settings to Firestore
 */
export async function saveUserProfileToFirestore(profile: PlayerProfile): Promise<void> {
  if (!profile.id) return;

  try {
    const userDocRef = doc(db, 'users', profile.id);
    const { history, ...cleanProfileData } = profile;

    await setDoc(
      userDocRef,
      {
        ...cleanProfileData,
        updatedAt: new Date().toISOString()
      },
      { merge: true }
    );
  } catch (err) {
    console.error('Error saving user profile to Firestore:', err);
  }
}

/**
 * Record a completed match to Firestore
 */
export async function saveMatchToFirestore(userId: string, match: MatchRecord): Promise<void> {
  if (!userId) return;
  try {
    const matchDocRef = doc(db, 'matchHistory', match.id);
    await setDoc(matchDocRef, {
      ...match,
      userId
    });
  } catch (err) {
    console.error('Error saving match record to Firestore:', err);
  }
}

/**
 * Helper to build the unified leaderboard merging real Firestore users,
 * the 3 Benchmark Bosses (Elena, Kai, Amara), and current user state.
 */
export function buildUnifiedLeaderboard(
  firestoreUsers: LeaderboardEntry[],
  currentProfile?: PlayerProfile
): LeaderboardEntry[] {
  const mergedMap = new Map<string, LeaderboardEntry>();

  // 1. Seed benchmark legendary bosses (Elena, Kai, Amara)
  BENCHMARK_TOP_BOSSES.forEach(boss => {
    mergedMap.set(boss.handle.toLowerCase(), { ...boss });
  });

  // 2. Add other mock contenders if total real users is low
  if (firestoreUsers.length < 5) {
    MOCK_LEADERBOARD.forEach(entry => {
      if (!entry.isCurrentUser && !mergedMap.has(entry.handle.toLowerCase())) {
        mergedMap.set(entry.handle.toLowerCase(), { ...entry });
      }
    });
  }

  // 3. Add / overwrite with real Firestore user accounts
  firestoreUsers.forEach(user => {
    const key = (user.handle || `@user_${user.username.replace(/\s+/g, '').toLowerCase()}`).toLowerCase();
    mergedMap.set(key, user);
  });

  // 4. Ensure current user profile is correctly integrated
  if (currentProfile) {
    const userHandle = (currentProfile.handle || '@you').toLowerCase();
    const existing = mergedMap.get(userHandle);
    mergedMap.set(userHandle, {
      rank: 0,
      username: currentProfile.username || 'You (Contestant)',
      handle: currentProfile.handle || '@you',
      avatarUrl: currentProfile.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
      tier: currentProfile.leagueTier || 'Platinum',
      score: currentProfile.rankPoints,
      peakStreak: currentProfile.highestStreak,
      accuracy: currentProfile.accuracyRate,
      isCurrentUser: true,
      trend: existing?.trend || 'up',
      badgesCount: currentProfile.unlockedBadgeIds?.length || 5
    });
  }

  // 5. Convert to array and sort by score descending
  const sorted = Array.from(mergedMap.values()).sort((a, b) => b.score - a.score);

  // 6. Assign final sequential ranks 1, 2, 3...
  return sorted.map((item, idx) => ({
    ...item,
    rank: idx + 1
  }));
}

/**
 * Real-time subscription to the global Firestore leaderboard.
 * Automatically updates when any user scores in a match or signs in.
 */
export function subscribeToGlobalLeaderboard(
  onUpdate: (entries: LeaderboardEntry[]) => void,
  currentProfile?: PlayerProfile
): Unsubscribe {
  try {
    const usersCol = collection(db, 'users');
    const leaderboardQuery = query(usersCol, orderBy('rankPoints', 'desc'), limit(100));

    return onSnapshot(
      leaderboardQuery,
      snapshot => {
        const firestoreUsers: LeaderboardEntry[] = snapshot.docs.map(docSnap => {
          const d = docSnap.data();
          const isMe = currentProfile?.id ? docSnap.id === currentProfile.id : false;
          return {
            rank: 0,
            username: d.username || 'Contestant',
            handle: d.handle || `@${(d.username || 'player').toLowerCase().replace(/[^a-z0-9]/g, '')}`,
            avatarUrl: d.avatarUrl || d.googlePhotoUrl || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
            tier: (d.leagueTier as LeagueTier) || 'Bronze',
            score: typeof d.rankPoints === 'number' ? d.rankPoints : 0,
            peakStreak: typeof d.highestStreak === 'number' ? d.highestStreak : 0,
            accuracy: typeof d.accuracyRate === 'number' ? d.accuracyRate : 0,
            isCurrentUser: isMe,
            trend: 'up',
            badgesCount: Array.isArray(d.unlockedBadgeIds) ? d.unlockedBadgeIds.length : (d.badgesCount || 4)
          };
        });

        const unified = buildUnifiedLeaderboard(firestoreUsers, currentProfile);
        onUpdate(unified);
      },
      error => {
        console.warn('Firestore leaderboard subscription warning, using local/benchmark state:', error);
        const fallback = buildUnifiedLeaderboard([], currentProfile);
        onUpdate(fallback);
      }
    );
  } catch (err) {
    console.warn('Failed to initialize leaderboard listener:', err);
    const fallback = buildUnifiedLeaderboard([], currentProfile);
    onUpdate(fallback);
    return () => {};
  }
}

/**
 * One-time fetch of global leaderboard
 */
export async function fetchGlobalLeaderboard(currentProfile?: PlayerProfile): Promise<LeaderboardEntry[]> {
  try {
    const usersCol = collection(db, 'users');
    const leaderboardQuery = query(usersCol, orderBy('rankPoints', 'desc'), limit(100));
    const snapshot = await getDocs(leaderboardQuery);

    const firestoreUsers: LeaderboardEntry[] = snapshot.docs.map(docSnap => {
      const d = docSnap.data();
      const isMe = currentProfile?.id ? docSnap.id === currentProfile.id : false;
      return {
        rank: 0,
        username: d.username || 'Contestant',
        handle: d.handle || `@${(d.username || 'player').toLowerCase().replace(/[^a-z0-9]/g, '')}`,
        avatarUrl: d.avatarUrl || d.googlePhotoUrl || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
        tier: (d.leagueTier as LeagueTier) || 'Bronze',
        score: typeof d.rankPoints === 'number' ? d.rankPoints : 0,
        peakStreak: typeof d.highestStreak === 'number' ? d.highestStreak : 0,
        accuracy: typeof d.accuracyRate === 'number' ? d.accuracyRate : 0,
        isCurrentUser: isMe,
        trend: 'up',
        badgesCount: Array.isArray(d.unlockedBadgeIds) ? d.unlockedBadgeIds.length : (d.badgesCount || 4)
      };
    });

    return buildUnifiedLeaderboard(firestoreUsers, currentProfile);
  } catch (err) {
    console.warn('Error fetching global leaderboard, using benchmark leaderboard:', err);
    return buildUnifiedLeaderboard([], currentProfile);
  }
}
