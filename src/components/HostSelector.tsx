import React, { useState, useRef } from 'react';
import { Volume2, Sparkles, Check, Square, Bot, Zap, Compass, Brain, Flame, ChevronLeft, ChevronRight, ArrowRight } from 'lucide-react';
import { PersonalityType, HostPersona } from '../types';
import { HOST_PERSONAS } from '../data/mockData';
import { playHostTTS, stopAudioSpeech, playSoundEffect } from '../utils/audio';
import { HostVectorGraphic } from './HostVectorGraphic';

interface HostSelectorProps {
  selectedHost: PersonalityType;
  onSelectHost: (host: PersonalityType) => void;
  soundEnabled: boolean;
}

export const HostSelector: React.FC<HostSelectorProps> = ({
  selectedHost,
  onSelectHost,
  soundEnabled
}) => {
  const [playingVoice, setPlayingVoice] = useState<string | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const scroll = (direction: 'left' | 'right') => {
    if (soundEnabled) {
      playSoundEffect('click');
    }
    if (scrollContainerRef.current) {
      const scrollAmount = direction === 'right' ? 320 : -320;
      scrollContainerRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  const handleTestVoice = async (e: React.MouseEvent, host: HostPersona) => {
    e.stopPropagation();
    if (playingVoice === host.id) {
      stopAudioSpeech();
      setPlayingVoice(null);
      return;
    }

    setPlayingVoice(host.id);
    if (soundEnabled) {
      playSoundEffect('click');
    }

    await playHostTTS(
      host.sampleQuote,
      host.id,
      host.voiceName,
      () => setPlayingVoice(host.id),
      () => setPlayingVoice(null)
    );
  };

  const getHostIcon = (id: PersonalityType) => {
    switch (id) {
      case 'Nova':
        return <Zap className="w-5 h-5 text-amber-400" />;
      case 'Dr. Thaddeus':
        return <Brain className="w-5 h-5 text-indigo-400" />;
      case 'Aria':
        return <Compass className="w-5 h-5 text-emerald-400" />;
      case 'Cipher-9':
        return <Bot className="w-5 h-5 text-cyan-400" />;
      case 'Coach Marcus':
        return <Flame className="w-5 h-5 text-rose-400" />;
    }
  };

  return (
    <div id="host-personality-selector" className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-neutral-100 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-emerald-400" />
            <span>Select Your AI Trivia Host</span>
          </h2>
          <p className="text-xs text-neutral-400">
            Choose your host personality. Scroll right to explore each AI's distinct commentary, banter style, and mindset coaching.
          </p>
        </div>

        {/* Scroll navigation arrows & status */}
        <div className="flex items-center gap-2 shrink-0">
          <span className="hidden sm:inline-flex items-center gap-1 text-[11px] text-neutral-400 font-medium bg-neutral-950 px-2.5 py-1 rounded-xl border border-neutral-800">
            <span>Scroll Right</span>
            <ArrowRight className="w-3 h-3 text-emerald-400 animate-pulse" />
          </span>

          <div className="flex items-center gap-1 bg-neutral-950 p-1 rounded-xl border border-neutral-800">
            <button
              type="button"
              onClick={() => scroll('left')}
              className="p-1.5 rounded-lg bg-neutral-900 hover:bg-neutral-800 text-neutral-300 hover:text-white transition-colors cursor-pointer"
              title="Scroll Left"
              aria-label="Scroll hosts left"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => scroll('right')}
              className="p-1.5 rounded-lg bg-neutral-900 hover:bg-neutral-800 text-emerald-400 hover:text-emerald-300 transition-colors cursor-pointer"
              title="Scroll Right"
              aria-label="Scroll hosts right"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Horizontal Scroll Container */}
      <div
        ref={scrollContainerRef}
        className="flex items-stretch gap-4 overflow-x-auto pb-4 pt-1 scroll-smooth snap-x snap-mandatory focus:outline-none"
        style={{ scrollbarWidth: 'thin', scrollbarColor: '#334155 transparent' }}
        tabIndex={0}
        aria-label="AI Host Carousel - Scroll right to browse all hosts"
      >
        {Object.values(HOST_PERSONAS).map(host => {
          const isSelected = selectedHost === host.id;
          const isAudioPlaying = playingVoice === host.id;

          return (
            <div
              key={host.id}
              onClick={() => {
                playSoundEffect('click');
                onSelectHost(host.id);
              }}
              role="button"
              tabIndex={0}
              onKeyDown={e => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  onSelectHost(host.id);
                }
              }}
              className={`relative group rounded-3xl p-5 cursor-pointer transition-all duration-200 border text-left flex flex-col justify-between w-[285px] sm:w-[320px] shrink-0 snap-start ${
                isSelected
                  ? 'bg-neutral-800/95 border-emerald-500 shadow-xl shadow-emerald-950/40 ring-2 ring-emerald-500/25'
                  : 'bg-neutral-950/80 border-neutral-800/90 hover:border-neutral-700 hover:bg-neutral-900/90'
              }`}
              aria-pressed={isSelected}
              aria-label={`Select AI Host ${host.name}: ${host.tagLine}`}
            >
              {/* Active Badge */}
              {isSelected && (
                <div className="absolute top-4 right-4 px-2.5 py-1 rounded-full bg-emerald-500 text-neutral-950 text-[10px] font-black uppercase tracking-wider flex items-center gap-1 shadow-md">
                  <Check className="w-3 h-3 stroke-[3]" />
                  <span>Selected</span>
                </div>
              )}

              <div>
                {/* Header with Avatar & Icon */}
                <div className="flex items-center gap-3 mb-3">
                  <HostVectorGraphic hostId={host.id} size="md" className="shrink-0" />
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="font-extrabold text-base text-white">{host.name}</span>
                      {getHostIcon(host.id)}
                    </div>
                    <span className="text-xs font-semibold text-emerald-400 block leading-tight">
                      {host.archetype}
                    </span>
                  </div>
                </div>

                <p className="text-xs text-neutral-300 line-clamp-3 mb-3 leading-relaxed">
                  {host.bio}
                </p>

                {/* Traits Chips */}
                <div className="flex flex-wrap gap-1.5 mb-4">
                  {host.traits.slice(0, 3).map((t, idx) => (
                    <span
                      key={idx}
                      className="text-[10px] font-semibold px-2 py-0.5 rounded-lg bg-neutral-900 text-neutral-300 border border-neutral-800"
                    >
                      {t}
                    </span>
                  ))}
                </div>
              </div>

              {/* Voice Sample Button & Footer */}
              <div className="pt-3 border-t border-neutral-800/80 flex items-center justify-between gap-2">
                <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">
                  Voice: {host.voiceName}
                </span>

                <button
                  type="button"
                  onClick={e => handleTestVoice(e, host)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    isAudioPlaying
                      ? 'bg-amber-500 text-neutral-950 animate-pulse font-black shadow-md'
                      : 'bg-neutral-900 hover:bg-neutral-800 text-neutral-200 border border-neutral-700'
                  }`}
                  aria-label={isAudioPlaying ? `Stop ${host.name} voice preview` : `Listen to ${host.name} voice preview`}
                >
                  {isAudioPlaying ? (
                    <>
                      <Square className="w-3 h-3 fill-current" />
                      <span>Stop</span>
                    </>
                  ) : (
                    <>
                      <Volume2 className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Voice Preview</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

