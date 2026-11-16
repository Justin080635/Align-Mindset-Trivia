import React, { useState } from 'react';
import {
  Users,
  MessageSquare,
  Sparkles,
  Heart,
  Send,
  Trophy,
  Flame,
  Bot,
  Share2,
  CheckCircle2,
  Shield,
  Zap,
  Target,
  Volume2,
  VolumeX,
  Plus,
  CornerDownRight,
  Check,
  Award,
  Filter,
  Landmark,
  BrainCircuit,
  Compass,
  Atom
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import confetti from 'canvas-confetti';
import { DiscussionPost, CommunityGoal, PlayerProfile, HostPersona } from '../types';
import { MOCK_COMMUNITY_GOAL, MOCK_DISCUSSION_POSTS, HOST_PERSONAS } from '../data/mockData';
import { playSoundEffect, playHostTTS } from '../utils/audio';

interface SocialHubViewProps {
  profile: PlayerProfile;
  setProfile: React.Dispatch<React.SetStateAction<PlayerProfile>>;
  currentHost: HostPersona;
}

interface SquadItem {
  id: string;
  name: string;
  members: number;
  score: string;
  focus: string;
  iconName: 'Landmark' | 'BrainCircuit' | 'Compass' | 'Atom';
  iconColor: string;
  isJoined?: boolean;
  weeklyTarget: number;
  weeklyProgress: number;
}

const renderSquadIcon = (iconName: string, iconColor: string, size = 'md') => {
  const iconClass = size === 'sm' ? 'w-4 h-4' : 'w-6 h-6';
  switch (iconName) {
    case 'Landmark':
      return <Landmark className={`${iconClass} ${iconColor}`} />;
    case 'BrainCircuit':
      return <BrainCircuit className={`${iconClass} ${iconColor}`} />;
    case 'Compass':
      return <Compass className={`${iconClass} ${iconColor}`} />;
    case 'Atom':
      return <Atom className={`${iconClass} ${iconColor}`} />;
    default:
      return <Shield className={`${iconClass} ${iconColor}`} />;
  }
};

const INITIAL_SQUADS: SquadItem[] = [
  {
    id: 'sq-1',
    name: 'Stoic Sages',
    members: 42,
    score: '48,200 LP',
    focus: 'Staying calm, rational & collected under severe time pressure',
    iconName: 'Landmark',
    iconColor: 'text-amber-400',
    isJoined: true,
    weeklyTarget: 50000,
    weeklyProgress: 48200
  },
  {
    id: 'sq-2',
    name: 'NeuroHackers',
    members: 56,
    score: '62,900 LP',
    focus: 'Deep focus, dopamine regulation, flow state & memory techniques',
    iconName: 'BrainCircuit',
    iconColor: 'text-cyan-400',
    isJoined: false,
    weeklyTarget: 70000,
    weeklyProgress: 62900
  },
  {
    id: 'sq-3',
    name: 'Atomic Habit Builders',
    members: 38,
    score: '41,500 LP',
    focus: 'Tiny 1% daily improvements, habit stacking & streak discipline',
    iconName: 'Compass',
    iconColor: 'text-emerald-400',
    isJoined: false,
    weeklyTarget: 45000,
    weeklyProgress: 41500
  },
  {
    id: 'sq-4',
    name: 'Future Tech & AI Explorers',
    members: 51,
    score: '59,100 LP',
    focus: 'Next-gen AI architectures, quantum leaps & tech mental models',
    iconName: 'Atom',
    iconColor: 'text-indigo-400',
    isJoined: false,
    weeklyTarget: 60000,
    weeklyProgress: 59100
  }
];

export const SocialHubView: React.FC<SocialHubViewProps> = ({ profile, setProfile, currentHost }) => {
  const [goal, setGoal] = useState<CommunityGoal>(MOCK_COMMUNITY_GOAL);
  const [posts, setPosts] = useState<DiscussionPost[]>(MOCK_DISCUSSION_POSTS);
  const [squads, setSquads] = useState<SquadItem[]>(INITIAL_SQUADS);
  const [newPostContent, setNewPostContent] = useState<string>('');
  const [selectedTag, setSelectedTag] = useState<string>('Mindset Shift');
  const [activeFilterTag, setActiveFilterTag] = useState<string>('All');
  const [isSynthesizing, setIsSynthesizing] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'discussion' | 'squads'>('discussion');
  const [copiedPostId, setCopiedPostId] = useState<string | null>(null);
  const [expandedReplyId, setExpandedReplyId] = useState<string | null>(null);
  const [replyInputs, setReplyInputs] = useState<Record<string, string>>({});
  const [isGoalContributed, setIsGoalContributed] = useState<boolean>(false);

  // Quick preset prompt pills
  const QUICK_PROMPTS = [
    "What's your 10-second mental reset when stressed?",
    "Which book or idea completely rewired your focus?",
    "How do you bounce back after losing a high streak?"
  ];

  const handleUpvote = (postId: string) => {
    playSoundEffect('click');
    setPosts(prev =>
      prev.map(p => {
        if (p.id === postId) {
          const newUpvoted = !p.hasUpvoted;
          return {
            ...p,
            upvotes: newUpvoted ? p.upvotes + 1 : p.upvotes - 1,
            hasUpvoted: newUpvoted
          };
        }
        return p;
      })
    );
  };

  const handleSharePost = (post: DiscussionPost) => {
    playSoundEffect('click');
    try {
      if (navigator.clipboard) {
        navigator.clipboard.writeText(`"${post.content}" — ${post.authorName} on Align Trivia Arena`);
      }
    } catch {}
    setCopiedPostId(post.id);
    setTimeout(() => setCopiedPostId(null), 2500);
  };

  const handleAddReply = (postId: string) => {
    const text = (replyInputs[postId] || '').trim();
    if (!text) return;

    playSoundEffect('click');
    setPosts(prev =>
      prev.map(p => {
        if (p.id === postId) {
          const currentReplies = p.replies || [];
          const newReply = {
            id: `reply-${Date.now()}`,
            authorName: profile.username,
            authorAvatar: profile.avatarUrl,
            timestamp: 'Just now',
            content: text
          };
          return {
            ...p,
            repliesCount: p.repliesCount + 1,
            replies: [...currentReplies, newReply]
          };
        }
        return p;
      })
    );

    setReplyInputs(prev => ({ ...prev, [postId]: '' }));
  };

  const handleCreatePost = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPostContent.trim()) return;

    playSoundEffect('click');
    const newPost: DiscussionPost = {
      id: `post-${Date.now()}`,
      authorName: profile.username,
      authorHandle: profile.handle,
      authorAvatar: profile.avatarUrl,
      authorTier: profile.leagueTier,
      timestamp: 'Just now',
      content: newPostContent.trim(),
      upvotes: 1,
      hasUpvoted: true,
      repliesCount: 0,
      tags: [selectedTag],
      replies: []
    };

    setPosts([newPost, ...posts]);
    setNewPostContent('');
    confetti({ particleCount: 30, spread: 60, origin: { y: 0.8 } });
  };

  const handleSynthesizeDiscussion = async () => {
    playSoundEffect('click');
    setIsSynthesizing(true);

    try {
      const res = await fetch('/api/discussion-synthesis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          promptTopic: "How do you bounce back from mistakes and keep confidence high?",
          posts: posts.map(p => ({ author: p.authorName, content: p.content }))
        })
      });
      const data = await res.json();

      if (data.synthesis) {
        const synthesisPost: DiscussionPost = {
          id: `synth-${Date.now()}`,
          authorName: `${currentHost.name} (AI Host Summary)`,
          authorHandle: `@${currentHost.id.toLowerCase()}_ai_host`,
          authorAvatar: currentHost.avatar,
          authorTier: 'Mindset Master',
          timestamp: 'Just now',
          isHostSynthesis: true,
          content: `${data.synthesis}\n\n🌟 Key Takeaway: "${data.keyTakeaway}"`,
          upvotes: 12,
          hasUpvoted: true,
          repliesCount: 3,
          tags: ['AI Host Summary', 'Key Takeaway'],
          replies: []
        };

        setPosts([synthesisPost, ...posts]);
        confetti({ particleCount: 50, spread: 80, origin: { y: 0.6 } });
      }
    } catch (err) {
      console.warn("Discussion synthesis error:", err);
    } finally {
      setIsSynthesizing(false);
    }
  };

  const handleContributeGoal = () => {
    if (isGoalContributed) return;
    playSoundEffect('click');
    setIsGoalContributed(true);
    setGoal(prev => ({
      ...prev,
      currentPoints: Math.min(prev.targetPoints, prev.currentPoints + 500),
      participantsCount: prev.participantsCount + 1
    }));
    confetti({ particleCount: 40, spread: 70, origin: { y: 0.5 } });
  };

  const handleToggleSquad = (squadId: string) => {
    playSoundEffect('click');
    setSquads(prev =>
      prev.map(s => {
        if (s.id === squadId) {
          const nextJoined = !s.isJoined;
          return {
            ...s,
            isJoined: nextJoined,
            members: nextJoined ? s.members + 1 : s.members - 1
          };
        }
        return s;
      })
    );
  };

  const goalPercent = Math.min(100, Math.round((goal.currentPoints / goal.targetPoints) * 100));

  const filteredPosts = posts.filter(p => {
    if (activeFilterTag === 'All') return true;
    if (activeFilterTag === 'AI Summaries') return p.isHostSynthesis;
    return p.tags?.some(t => t.toLowerCase() === activeFilterTag.toLowerCase());
  });

  return (
    <div id="social-hub-view" className="space-y-6">
      
      {/* Community Goal Banner with Fluid Animation */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: "easeOut" }}
        className="rounded-3xl p-5 sm:p-7 md:p-8 bg-gradient-to-br from-neutral-900 via-neutral-900 to-neutral-950 border border-neutral-800 shadow-2xl relative overflow-hidden"
      >
        {/* Subtle background glow */}
        <div className="absolute -right-20 -top-20 w-72 h-72 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2.5 max-w-2xl">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-bold px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                Community Goal
              </span>
              <span className="text-xs text-neutral-400 font-medium">{goal.deadline}</span>
              <span className="text-xs text-amber-400/90 font-semibold hidden sm:inline">• Unlock Golden Avatar Frame</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              {goal.title}
            </h1>
            <p className="text-xs sm:text-sm text-neutral-300 leading-relaxed">
              {goal.description}
            </p>
          </div>

          {/* Goal Progress Module */}
          <div className="w-full lg:w-88 bg-neutral-950/80 p-4 sm:p-5 rounded-2xl border border-neutral-800/90 space-y-3 shrink-0 shadow-inner">
            <div className="flex items-center justify-between text-xs font-bold">
              <span className="text-neutral-400">Total Community Progress</span>
              <span className="text-emerald-400 font-black text-sm">{goalPercent}%</span>
            </div>

            <div className="w-full h-3 rounded-full bg-neutral-800/90 overflow-hidden p-0.5 border border-neutral-700/50">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${goalPercent}%` }}
                transition={{ duration: 1.2, ease: "easeOut" }}
                className="h-full bg-gradient-to-r from-emerald-500 via-teal-400 to-cyan-400 rounded-full"
              />
            </div>

            <div className="flex items-center justify-between text-[11px] text-neutral-400">
              <span className="font-semibold text-neutral-300">{goal.currentPoints.toLocaleString()} / {goal.targetPoints.toLocaleString()} pts</span>
              <span>{goal.participantsCount} Players</span>
            </div>

            <button
              onClick={handleContributeGoal}
              disabled={isGoalContributed}
              className={`w-full py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                isGoalContributed
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 cursor-default'
                  : 'bg-emerald-500 hover:bg-emerald-400 text-neutral-950 shadow-md hover:scale-[1.02] active:scale-[0.98]'
              }`}
            >
              {isGoalContributed ? (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>+500 LP Contributed Today!</span>
                </>
              ) : (
                <>
                  <Zap className="w-3.5 h-3.5 fill-neutral-950" />
                  <span>Contribute +500 LP to Goal</span>
                </>
              )}
            </button>
          </div>
        </div>
      </motion.div>

      {/* Modern Fluid Sub-Tabs */}
      <div className="flex items-center justify-between border-b border-neutral-800/90 pb-3 gap-2 flex-wrap">
        <div className="flex items-center gap-1.5 bg-neutral-950 p-1 rounded-2xl border border-neutral-800">
          <button
            onClick={() => {
              playSoundEffect('click');
              setActiveTab('discussion');
            }}
            className={`relative flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-colors ${
              activeTab === 'discussion' ? 'text-white' : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            {activeTab === 'discussion' && (
              <motion.div
                layoutId="activeHubTabPill"
                className="absolute inset-0 bg-emerald-600 rounded-xl shadow-md"
                transition={{ type: "spring", stiffness: 450, damping: 35 }}
              />
            )}
            <span className="relative z-10 flex items-center gap-2">
              <MessageSquare className="w-4 h-4" />
              <span>Daily Chat & Hot Takes</span>
            </span>
          </button>

          <button
            onClick={() => {
              playSoundEffect('click');
              setActiveTab('squads');
            }}
            className={`relative flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-colors ${
              activeTab === 'squads' ? 'text-white' : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            {activeTab === 'squads' && (
              <motion.div
                layoutId="activeHubTabPill"
                className="absolute inset-0 bg-emerald-600 rounded-xl shadow-md"
                transition={{ type: "spring", stiffness: 450, damping: 35 }}
              />
            )}
            <span className="relative z-10 flex items-center gap-2">
              <Users className="w-4 h-4" />
              <span>Trivia Squads</span>
              <span className="relative z-10 text-[10px] px-1.5 py-0.2 rounded-full bg-neutral-900/80 border border-neutral-700 text-neutral-300">
                {squads.length}
              </span>
            </span>
          </button>
        </div>

        {/* Tag Filter Pills for Feed */}
        {activeTab === 'discussion' && (
          <div className="flex items-center gap-1 overflow-x-auto py-1 max-w-full">
            {['All', 'Mindset Shift', 'Brain Hacks', 'Daily Win', 'AI Summaries'].map(tag => (
              <button
                key={tag}
                onClick={() => {
                  playSoundEffect('click');
                  setActiveFilterTag(tag);
                }}
                className={`text-[11px] font-bold px-3 py-1.5 rounded-xl border whitespace-nowrap transition-all ${
                  activeFilterTag === tag
                    ? 'bg-neutral-100 text-neutral-950 border-white shadow-sm'
                    : 'bg-neutral-900/70 text-neutral-400 border-neutral-800 hover:text-white hover:border-neutral-700'
                }`}
              >
                {tag === 'All' ? 'All Posts' : `#${tag}`}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Active Tab Content Area */}
      <AnimatePresence mode="wait">
        {activeTab === 'discussion' ? (
          <motion.div
            key="discussion-panel"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.25 }}
            className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start"
          >
            
            {/* Discussion Feed Column */}
            <div className="lg:col-span-2 space-y-4">
              
              {/* Post Input Form Card */}
              <form
                onSubmit={handleCreatePost}
                className="rounded-3xl p-5 bg-neutral-900/90 border border-neutral-800 shadow-xl space-y-3.5"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <span className="text-xs font-bold text-neutral-200">Share a Mindset Tip, Habit or Question</span>
                  <div className="flex flex-wrap gap-1.5">
                    {['Mindset Shift', 'Brain Hacks', 'Daily Win'].map(tag => (
                      <button
                        key={tag}
                        type="button"
                        onClick={() => setSelectedTag(tag)}
                        className={`text-[10px] font-bold px-2.5 py-1 rounded-lg border transition-all ${
                          selectedTag === tag
                            ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 shadow-sm'
                            : 'bg-neutral-950 text-neutral-400 border-neutral-800 hover:border-neutral-700'
                        }`}
                      >
                        #{tag}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="relative">
                  <textarea
                    value={newPostContent}
                    onChange={e => setNewPostContent(e.target.value)}
                    placeholder="What's a mindset shift or habit that completely changed how you work or learn?"
                    rows={3}
                    className="w-full p-3.5 rounded-2xl bg-neutral-950 border border-neutral-800 text-xs sm:text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all resize-none leading-relaxed"
                  />
                </div>

                {/* Quick Inspiration Prompts */}
                <div className="space-y-1.5">
                  <span className="text-[10px] font-semibold text-neutral-500 block">Need inspiration? Try clicking a prompt:</span>
                  <div className="flex flex-wrap gap-1.5">
                    {QUICK_PROMPTS.map((prompt, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setNewPostContent(prompt)}
                        className="text-[10px] text-neutral-400 hover:text-emerald-300 bg-neutral-950/70 hover:bg-neutral-950 border border-neutral-800/80 px-2.5 py-1.5 rounded-lg text-left transition-colors truncate max-w-full flex items-center gap-1.5"
                      >
                        <Sparkles className="w-3 h-3 text-amber-400 shrink-0" />
                        <span className="truncate">{prompt}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex items-center justify-between pt-1 border-t border-neutral-800/60">
                  <div className="flex items-center gap-2">
                    <img
                      src={profile.avatarUrl}
                      alt={profile.username}
                      className="w-5 h-5 rounded-full object-cover border border-emerald-500/50"
                      referrerPolicy="no-referrer"
                    />
                    <span className="text-[11px] text-neutral-400">Posting as <strong className="text-neutral-200">{profile.username}</strong></span>
                  </div>

                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.96 }}
                    type="submit"
                    disabled={!newPostContent.trim()}
                    className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-neutral-950 font-bold text-xs flex items-center gap-1.5 shadow-md shadow-emerald-500/20 disabled:opacity-50 disabled:pointer-events-none transition-colors"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Post to Hub</span>
                  </motion.button>
                </div>
              </form>

              {/* Posts Feed */}
              <div className="space-y-3.5">
                <AnimatePresence initial={false}>
                  {filteredPosts.map(post => {
                    const isCopied = copiedPostId === post.id;
                    const isExpanded = expandedReplyId === post.id;

                    return (
                      <motion.div
                        layout
                        initial={{ opacity: 0, y: 15, scale: 0.98 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        transition={{ duration: 0.25 }}
                        key={post.id}
                        className={`rounded-3xl p-5 border transition-all ${
                          post.isHostSynthesis
                            ? 'bg-gradient-to-br from-neutral-900 via-indigo-950/40 to-neutral-900 border-indigo-500/50 shadow-xl ring-1 ring-indigo-500/20'
                            : 'bg-neutral-900/80 border-neutral-800 hover:border-neutral-700/80 shadow-md'
                        }`}
                      >
                        {/* Post Header */}
                        <div className="flex items-center justify-between gap-3 mb-3">
                          <div className="flex items-center gap-3">
                            {post.isHostSynthesis ? (
                              <div className="w-10 h-10 rounded-2xl bg-indigo-600/30 border border-indigo-500/50 flex items-center justify-center text-xl shadow-inner shrink-0">
                                {post.authorAvatar}
                              </div>
                            ) : (
                              <img
                                src={post.authorAvatar}
                                alt={post.authorName}
                                className="w-10 h-10 rounded-full object-cover border border-neutral-700 shrink-0"
                                referrerPolicy="no-referrer"
                              />
                            )}

                            <div>
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="font-bold text-xs sm:text-sm text-white">{post.authorName}</span>
                                {post.isHostSynthesis ? (
                                  <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-indigo-500/30 text-indigo-300 border border-indigo-500/40">
                                    AI Host Recapped
                                  </span>
                                ) : (
                                  <span className="text-[10px] font-semibold text-neutral-400">{post.authorHandle}</span>
                                )}
                              </div>
                              <span className="text-[10px] text-neutral-500">{post.timestamp}</span>
                            </div>
                          </div>

                          <div className="flex items-center gap-1.5 flex-wrap justify-end">
                            {post.tags?.map((t, idx) => (
                              <span key={idx} className="text-[10px] font-semibold px-2 py-0.5 rounded-lg bg-neutral-950 text-emerald-400 border border-neutral-800/90">
                                #{t}
                              </span>
                            ))}
                          </div>
                        </div>

                        {/* Post Content */}
                        <p className="text-xs sm:text-sm text-neutral-200 leading-relaxed whitespace-pre-line mb-4 font-normal">
                          {post.content}
                        </p>

                        {/* Post Actions Bar */}
                        <div className="flex items-center justify-between pt-3 border-t border-neutral-800/80 text-xs">
                          <div className="flex items-center gap-2">
                            {/* Upvote Button with Pop */}
                            <motion.button
                              whileTap={{ scale: 0.85 }}
                              onClick={() => handleUpvote(post.id)}
                              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border font-semibold transition-all ${
                                post.hasUpvoted
                                  ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                                  : 'bg-neutral-950 text-neutral-400 border-neutral-800 hover:text-neutral-200 hover:border-neutral-700'
                              }`}
                            >
                              <Heart className={`w-3.5 h-3.5 ${post.hasUpvoted ? 'fill-rose-400 text-rose-400' : ''}`} />
                              <span>{post.upvotes}</span>
                            </motion.button>

                            {/* Reply Toggle */}
                            <button
                              onClick={() => {
                                playSoundEffect('click');
                                setExpandedReplyId(isExpanded ? null : post.id);
                              }}
                              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold transition-all ${
                                isExpanded
                                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                                  : 'bg-neutral-950 text-neutral-400 border-neutral-800 hover:text-neutral-200 hover:border-neutral-700'
                              }`}
                            >
                              <MessageSquare className="w-3.5 h-3.5" />
                              <span>{post.repliesCount} {post.repliesCount === 1 ? 'Reply' : 'Replies'}</span>
                            </button>
                          </div>

                          <div className="flex items-center gap-2">
                            {/* Listen to AI Summary Audio (if synthesis post) */}
                            {post.isHostSynthesis && (
                              <button
                                onClick={() => {
                                  playSoundEffect('click');
                                  playHostTTS(post.content.slice(0, 200), currentHost.voiceName);
                                }}
                                className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-indigo-950/70 border border-indigo-500/40 text-indigo-300 text-xs font-semibold hover:bg-indigo-900/80 transition-colors"
                                title="Listen to AI Host readout"
                              >
                                <Volume2 className="w-3.5 h-3.5 text-indigo-400" />
                                <span className="hidden sm:inline">Listen</span>
                              </button>
                            )}

                            {/* Share / Copy button */}
                            <button
                              onClick={() => handleSharePost(post)}
                              className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-neutral-950 border border-neutral-800 text-neutral-400 hover:text-white hover:border-neutral-700 transition-all text-xs font-semibold"
                              title="Copy quote"
                            >
                              {isCopied ? (
                                <>
                                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                                  <span className="text-emerald-400">Copied!</span>
                                </>
                              ) : (
                                <>
                                  <Share2 className="w-3.5 h-3.5" />
                                  <span className="hidden sm:inline">Share</span>
                                </>
                              )}
                            </button>
                          </div>
                        </div>

                        {/* Expandable Threaded Replies */}
                        <AnimatePresence>
                          {isExpanded && (
                            <motion.div
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: 'auto' }}
                              exit={{ opacity: 0, height: 0 }}
                              transition={{ duration: 0.25 }}
                              className="mt-3.5 pt-3.5 border-t border-neutral-800/80 space-y-3"
                            >
                              {/* Existing replies list */}
                              {(post.replies || []).length > 0 && (
                                <div className="space-y-2 pl-2 sm:pl-3 border-l-2 border-emerald-500/30">
                                  {post.replies?.map(r => (
                                    <div key={r.id} className="p-2.5 rounded-xl bg-neutral-950/80 border border-neutral-800 text-xs space-y-1">
                                      <div className="flex items-center justify-between gap-2">
                                        <div className="flex items-center gap-2">
                                          <img src={r.authorAvatar} alt={r.authorName} className="w-5 h-5 rounded-full object-cover" referrerPolicy="no-referrer" />
                                          <span className="font-bold text-white">{r.authorName}</span>
                                        </div>
                                        <span className="text-[10px] text-neutral-500">{r.timestamp}</span>
                                      </div>
                                      <p className="text-neutral-300 leading-relaxed pl-7">{r.content}</p>
                                    </div>
                                  ))}
                                </div>
                              )}

                              {/* Add reply input */}
                              <div className="flex items-center gap-2">
                                <input
                                  type="text"
                                  value={replyInputs[post.id] || ''}
                                  onChange={e => setReplyInputs({ ...replyInputs, [post.id]: e.target.value })}
                                  onKeyDown={e => {
                                    if (e.key === 'Enter') handleAddReply(post.id);
                                  }}
                                  placeholder="Write a supportive reply or answer..."
                                  className="flex-1 px-3 py-2 rounded-xl bg-neutral-950 border border-neutral-800 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-emerald-500"
                                />
                                <button
                                  type="button"
                                  onClick={() => handleAddReply(post.id)}
                                  disabled={!(replyInputs[post.id] || '').trim()}
                                  className="px-3.5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-neutral-950 font-bold text-xs disabled:opacity-40 transition-colors"
                                >
                                  Reply
                                </button>
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              </div>

            </div>

            {/* AI Facilitation & Community Sidebar */}
            <div className="space-y-4">
              
              {/* AI Discussion Synthesizer Card */}
              <motion.div
                whileHover={{ y: -2 }}
                transition={{ duration: 0.2 }}
                className="rounded-3xl p-5 sm:p-6 bg-gradient-to-b from-neutral-900 via-neutral-900 to-indigo-950/30 border border-indigo-500/40 space-y-3.5 shadow-xl relative overflow-hidden"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-white font-bold text-sm">
                    <Bot className="w-5 h-5 text-indigo-400" />
                    <span>AI Host Daily Summary</span>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                    Live
                  </span>
                </div>

                <p className="text-xs text-neutral-300 leading-relaxed">
                  Have <strong className="text-white">{currentHost.name}</strong> scan today's player discussions and generate an instant, actionable insight summary for everyone!
                </p>

                <button
                  onClick={handleSynthesizeDiscussion}
                  disabled={isSynthesizing}
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-indigo-600 via-indigo-500 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/30 disabled:opacity-50 transition-all hover:scale-[1.01] active:scale-[0.98]"
                >
                  {isSynthesizing ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Distilling Insights...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 text-amber-300" />
                      <span>Summarize Today's Chat</span>
                    </>
                  )}
                </button>
              </motion.div>

              {/* Active Squads Quick Highlight Card */}
              <div className="rounded-3xl p-5 bg-neutral-900/80 border border-neutral-800 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-xs sm:text-sm text-white flex items-center gap-1.5">
                    <Trophy className="w-4 h-4 text-amber-400" />
                    <span>Top Trivia Squads</span>
                  </h3>
                  <button
                    onClick={() => setActiveTab('squads')}
                    className="text-[11px] text-emerald-400 hover:text-emerald-300 font-semibold"
                  >
                    View all →
                  </button>
                </div>

                <div className="space-y-2">
                  {squads.slice(0, 3).map(sq => (
                    <div key={sq.id} className="p-2.5 rounded-xl bg-neutral-950/80 border border-neutral-800/90 flex items-center justify-between gap-2 text-xs">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-xl bg-neutral-900 border border-neutral-800 flex items-center justify-center shrink-0">
                          {renderSquadIcon(sq.iconName, sq.iconColor, 'sm')}
                        </div>
                        <div>
                          <span className="font-bold text-white block">{sq.name}</span>
                          <span className="text-[10px] text-neutral-400">{sq.members} players</span>
                        </div>
                      </div>
                      <span className="font-bold text-emerald-400 text-xs">{sq.score}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Community Values Card */}
              <div className="rounded-3xl p-5 bg-neutral-900/80 border border-neutral-800 space-y-2.5 text-xs text-neutral-300">
                <h3 className="font-bold text-xs sm:text-sm text-white flex items-center gap-1.5">
                  <Shield className="w-4 h-4 text-emerald-400" />
                  <span>The Arena Mindset</span>
                </h3>
                <ul className="space-y-2 text-neutral-400 leading-relaxed text-[11px]">
                  <li className="flex items-start gap-2">
                    <span className="text-emerald-400 font-bold">1.</span>
                    <span><strong>Mistakes are data:</strong> Treat wrong answers as free calibration for next time.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-emerald-400 font-bold">2.</span>
                    <span><strong>Share real hacks:</strong> Post techniques that helped your focus, sleep, or learning.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-emerald-400 font-bold">3.</span>
                    <span><strong>Cheer each other on:</strong> Upvote cool thoughts and celebrate new high scores.</span>
                  </li>
                </ul>
              </div>

            </div>

          </motion.div>
        ) : (
          /* Collaborative Squads Grid View with Mobile Responsiveness */
          <motion.div
            key="squads-panel"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.25 }}
            className="space-y-4"
          >
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-neutral-900/60 p-4 rounded-2xl border border-neutral-800">
              <div>
                <h2 className="font-bold text-sm sm:text-base text-white">Join a Squad & Multiply League Points</h2>
                <p className="text-xs text-neutral-400">Play matches together, combine weekly points, and unlock squad-exclusive trophy badges.</p>
              </div>
              <span className="text-xs font-bold text-emerald-400 px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 shrink-0">
                Weekly Reset in 4 Days
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {squads.map(squad => {
                const progressPct = Math.min(100, Math.round((squad.weeklyProgress / squad.weeklyTarget) * 100));

                return (
                  <motion.div
                    whileHover={{ y: -3 }}
                    transition={{ duration: 0.2 }}
                    key={squad.id}
                    className={`rounded-3xl p-5 border text-left flex flex-col justify-between space-y-4 transition-all shadow-xl ${
                      squad.isJoined
                        ? 'bg-gradient-to-br from-neutral-900 via-neutral-900 to-emerald-950/30 border-emerald-500/50 ring-1 ring-emerald-500/20'
                        : 'bg-neutral-900/80 border-neutral-800 hover:border-neutral-700'
                    }`}
                  >
                    <div className="space-y-3">
                      <div className="flex items-start justify-between gap-2">
                        <div className="w-12 h-12 rounded-2xl bg-neutral-950 border border-neutral-800 flex items-center justify-center shadow-inner shrink-0 ring-1 ring-white/5">
                          {renderSquadIcon(squad.iconName, squad.iconColor, 'md')}
                        </div>

                        {squad.isJoined && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                            Your Squad
                          </span>
                        )}
                      </div>

                      <div>
                        <h3 className="font-bold text-sm text-white mb-0.5">{squad.name}</h3>
                        <span className="text-xs text-emerald-400 font-bold block">{squad.score}</span>
                      </div>

                      <p className="text-xs text-neutral-300 leading-relaxed min-h-[36px]">
                        {squad.focus}
                      </p>

                      {/* Weekly Goal Progress */}
                      <div className="space-y-1 pt-1">
                        <div className="flex justify-between text-[10px] text-neutral-400 font-semibold">
                          <span>Weekly Target</span>
                          <span className="text-neutral-200">{progressPct}%</span>
                        </div>
                        <div className="w-full h-1.5 rounded-full bg-neutral-950 overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-emerald-500 to-cyan-400 rounded-full"
                            style={{ width: `${progressPct}%` }}
                          />
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-xs text-neutral-400 pt-3 border-t border-neutral-800/80">
                      <span className="font-medium">{squad.members} Members</span>

                      <button
                        onClick={() => handleToggleSquad(squad.id)}
                        className={`px-3.5 py-1.5 rounded-xl font-bold text-xs transition-all ${
                          squad.isJoined
                            ? 'bg-neutral-800 hover:bg-rose-500/20 hover:text-rose-300 text-neutral-300 border border-neutral-700'
                            : 'bg-emerald-500 hover:bg-emerald-400 text-neutral-950 shadow-md'
                        }`}
                      >
                        {squad.isJoined ? 'Leave' : 'Join Squad'}
                      </button>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
};
