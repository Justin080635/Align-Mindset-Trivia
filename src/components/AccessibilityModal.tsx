import React from 'react';
import {
  Accessibility,
  Check,
  Volume2,
  Eye,
  Zap,
  Sliders,
  Keyboard,
  X
} from 'lucide-react';
import { PlayerProfile, AccessibilitySettings } from '../types';
import { playSoundEffect } from '../utils/audio';

interface AccessibilityModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile: PlayerProfile;
  setProfile: React.Dispatch<React.SetStateAction<PlayerProfile>>;
}

export const AccessibilityModal: React.FC<AccessibilityModalProps> = ({
  isOpen,
  onClose,
  profile,
  setProfile
}) => {
  if (!isOpen) return null;

  const toggleSetting = (key: keyof AccessibilitySettings) => {
    playSoundEffect('click');
    setProfile(prev => ({
      ...prev,
      accessibility: {
        ...prev.accessibility,
        [key]: !prev.accessibility[key]
      }
    }));
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-950/85 backdrop-blur-sm animate-in fade-in"
      role="dialog"
      aria-modal="true"
      aria-labelledby="accessibility-title"
    >
      <div className="w-full max-w-lg rounded-3xl bg-neutral-900 border border-neutral-800 p-6 space-y-6 shadow-2xl">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-neutral-800">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <Accessibility className="w-5 h-5" />
            </div>
            <div>
              <h2 id="accessibility-title" className="font-bold text-base text-white">
                Accessibility & Usability
              </h2>
              <span className="text-[11px] text-neutral-400">
                WCAG 2.1 Level AA Usability Standards
              </span>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
            aria-label="Close accessibility modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Toggles */}
        <div className="space-y-3">
          
          {/* High Contrast */}
          <div className="p-4 rounded-2xl bg-neutral-950/70 border border-neutral-800 flex items-center justify-between gap-3">
            <div>
              <span className="font-bold text-xs sm:text-sm text-white block">High Contrast Mode</span>
              <span className="text-xs text-neutral-400">
                Increases contrast ratios and border visibility beyond WCAG AA 4.5:1 ratios.
              </span>
            </div>
            <button
              type="button"
              onClick={() => toggleSetting('highContrast')}
              className={`w-12 h-7 rounded-full transition-colors relative flex items-center px-1 ${
                profile.accessibility.highContrast ? 'bg-emerald-500' : 'bg-neutral-800'
              }`}
              aria-pressed={profile.accessibility.highContrast}
            >
              <div
                className={`w-5 h-5 rounded-full bg-white transition-transform ${
                  profile.accessibility.highContrast ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* Auto-Speak Questions */}
          <div className="p-4 rounded-2xl bg-neutral-950/70 border border-neutral-800 flex items-center justify-between gap-3">
            <div>
              <span className="font-bold text-xs sm:text-sm text-white block">Auto-Narration (TTS)</span>
              <span className="text-xs text-neutral-400">
                Automatically reads questions and host commentary using Gemini TTS voice models.
              </span>
            </div>
            <button
              type="button"
              onClick={() => toggleSetting('autoSpeakQuestions')}
              className={`w-12 h-7 rounded-full transition-colors relative flex items-center px-1 ${
                profile.accessibility.autoSpeakQuestions ? 'bg-emerald-500' : 'bg-neutral-800'
              }`}
              aria-pressed={profile.accessibility.autoSpeakQuestions}
            >
              <div
                className={`w-5 h-5 rounded-full bg-white transition-transform ${
                  profile.accessibility.autoSpeakQuestions ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* Reduced Motion */}
          <div className="p-4 rounded-2xl bg-neutral-950/70 border border-neutral-800 flex items-center justify-between gap-3">
            <div>
              <span className="font-bold text-xs sm:text-sm text-white block">Reduced Motion</span>
              <span className="text-xs text-neutral-400">
                Suppresses intense particle effects, bouncing animations, and transitions.
              </span>
            </div>
            <button
              type="button"
              onClick={() => toggleSetting('reducedMotion')}
              className={`w-12 h-7 rounded-full transition-colors relative flex items-center px-1 ${
                profile.accessibility.reducedMotion ? 'bg-emerald-500' : 'bg-neutral-800'
              }`}
              aria-pressed={profile.accessibility.reducedMotion}
            >
              <div
                className={`w-5 h-5 rounded-full bg-white transition-transform ${
                  profile.accessibility.reducedMotion ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* Large Text */}
          <div className="p-4 rounded-2xl bg-neutral-950/70 border border-neutral-800 flex items-center justify-between gap-3">
            <div>
              <span className="font-bold text-xs sm:text-sm text-white block">Enhanced Font Scale</span>
              <span className="text-xs text-neutral-400">
                Enlarges interface headings and questions for enhanced visual readability.
              </span>
            </div>
            <button
              type="button"
              onClick={() => toggleSetting('largeText')}
              className={`w-12 h-7 rounded-full transition-colors relative flex items-center px-1 ${
                profile.accessibility.largeText ? 'bg-emerald-500' : 'bg-neutral-800'
              }`}
              aria-pressed={profile.accessibility.largeText}
            >
              <div
                className={`w-5 h-5 rounded-full bg-white transition-transform ${
                  profile.accessibility.largeText ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

        </div>

        {/* Keyboard Navigation Cheatsheet */}
        <div className="p-4 rounded-2xl bg-neutral-950 border border-neutral-800 space-y-2">
          <div className="flex items-center gap-2 text-xs font-bold text-neutral-300">
            <Keyboard className="w-4 h-4 text-emerald-400" />
            <span>Keyboard Shortcuts</span>
          </div>
          <div className="grid grid-cols-2 gap-2 text-xs text-neutral-400">
            <div><kbd className="px-1.5 py-0.5 rounded bg-neutral-800 text-white font-mono">1 / A</kbd> : Option A</div>
            <div><kbd className="px-1.5 py-0.5 rounded bg-neutral-800 text-white font-mono">2 / B</kbd> : Option B</div>
            <div><kbd className="px-1.5 py-0.5 rounded bg-neutral-800 text-white font-mono">3 / C</kbd> : Option C</div>
            <div><kbd className="px-1.5 py-0.5 rounded bg-neutral-800 text-white font-mono">4 / D</kbd> : Option D</div>
            <div><kbd className="px-1.5 py-0.5 rounded bg-neutral-800 text-white font-mono">H</kbd> : AI Host Clue</div>
            <div><kbd className="px-1.5 py-0.5 rounded bg-neutral-800 text-white font-mono">Space</kbd> : Next / Speak</div>
          </div>
        </div>

        <button
          onClick={onClose}
          className="w-full py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-neutral-950 font-bold text-xs shadow-md"
        >
          Apply Preferences
        </button>
      </div>
    </div>
  );
};
