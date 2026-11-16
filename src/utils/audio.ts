/**
 * Audio Synthesis, Sound Effects & Haptic Feedback Suite
 */

import { triggerHaptic, cancelHaptics, HapticPreset, isHapticsSupported } from './haptics';

export type HapticType = HapticPreset | 'light' | 'medium' | 'error';

/**
 * Trigger physical haptic vibration feedback on supported mobile & touch devices
 */
export function triggerHapticFeedback(type: HapticType = 'light') {
  let mappedPreset: HapticPreset = 'tap';
  if (type === 'light') mappedPreset = 'tap';
  else if (type === 'medium') mappedPreset = 'selection';
  else if (type === 'error') mappedPreset = 'incorrect';
  else mappedPreset = type as HapticPreset;

  return triggerHaptic(mappedPreset);
}

export { triggerHaptic, cancelHaptics, isHapticsSupported };

let audioCtx: AudioContext | null = null;
let currentSourceNode: AudioBufferSourceNode | null = null;

function getAudioContext(): AudioContext {
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    audioCtx = new AudioContextClass();
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
}

// Convert base64 PCM 16-bit 24kHz audio to AudioBuffer
function pcmToAudioBuffer(ctx: AudioContext, base64: string, sampleRate = 24000): AudioBuffer {
  const binaryString = window.atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }

  const int16Array = new Int16Array(bytes.buffer);
  const float32Array = new Float32Array(int16Array.length);

  for (let i = 0; i < int16Array.length; i++) {
    float32Array[i] = int16Array[i] / 32768.0;
  }

  const audioBuffer = ctx.createBuffer(1, float32Array.length, sampleRate);
  audioBuffer.getChannelData(0).set(float32Array);
  return audioBuffer;
}

/**
 * Play sound effects dynamically with Web Audio synthesizer & sync with physical haptics
 */
export function playSoundEffect(type: 'correct' | 'incorrect' | 'streak' | 'click' | 'lifeline' | 'fanfare' | 'tick' | 'badge') {
  try {
    const ctx = getAudioContext();
    const now = ctx.currentTime;

    if (type === 'click') {
      triggerHapticFeedback('light');
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(800, now);
      osc.frequency.exponentialRampToValueAtTime(400, now + 0.05);
      gain.gain.setValueAtTime(0.15, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.05);
    } else if (type === 'tick') {
      triggerHapticFeedback('light');
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(1000, now);
      gain.gain.setValueAtTime(0.08, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.04);
    } else if (type === 'correct') {
      triggerHapticFeedback('success');
      // Harmonic major triad chime
      [523.25, 659.25, 783.99, 1046.5].forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + i * 0.06);
        gain.gain.setValueAtTime(0, now + i * 0.06);
        gain.gain.linearRampToValueAtTime(0.2, now + i * 0.06 + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.06 + 0.35);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + i * 0.06);
        osc.stop(now + i * 0.06 + 0.35);
      });
    } else if (type === 'incorrect') {
      triggerHapticFeedback('error');
      // Dissonant descending buzz
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(220, now);
      osc.frequency.linearRampToValueAtTime(130, now + 0.25);
      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.3);
    } else if (type === 'streak') {
      triggerHapticFeedback('streak');
      // Energetic rising arpeggio
      [440, 554.37, 659.25, 880, 1108.73].forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, now + idx * 0.07);
        gain.gain.setValueAtTime(0.18, now + idx * 0.07);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.07 + 0.4);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + idx * 0.07);
        osc.stop(now + idx * 0.07 + 0.4);
      });
    } else if (type === 'lifeline') {
      triggerHapticFeedback('warning');
      // Ethereal sweep
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(300, now);
      osc.frequency.exponentialRampToValueAtTime(1200, now + 0.3);
      gain.gain.setValueAtTime(0.15, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.4);
    } else if (type === 'fanfare' || type === 'badge') {
      triggerHapticFeedback('jackpot');
      // Victorious major progression
      const notes = [523.25, 659.25, 783.99, 1046.5, 1318.51];
      notes.forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + i * 0.1);
        gain.gain.setValueAtTime(0.2, now + i * 0.1);
        gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.1 + 0.6);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + i * 0.1);
        osc.stop(now + i * 0.1 + 0.6);
      });
    }
  } catch (e) {
    console.warn("Audio effect error:", e);
  }
}

// -------------------------------------------------------------
// Interactive Funny & Gameshow Trivia Soundtrack Synthesizer
// -------------------------------------------------------------

export type SoundtrackTheme = 'game_show_8bit' | 'jeopardy_tension' | 'benny_hill_comedy' | 'funky_lounge' | 'zen_lofi';

export interface SoundtrackTrackInfo {
  id: SoundtrackTheme;
  title: string;
  genre: string;
  bpm: number;
  description: string;
  emoji: string;
}

export const SOUNDTRACK_TRACKS: SoundtrackTrackInfo[] = [
  {
    id: 'game_show_8bit',
    title: 'Retro 8-Bit Quiz Hype',
    genre: 'Chiptune / Arcade Comedy',
    bpm: 140,
    description: 'Upbeat nostalgic arcade arpeggios that make high-speed trivia hilarious and fun!',
    emoji: '🕹️'
  },
  {
    id: 'jeopardy_tension',
    title: 'The Ticking Tension Clock',
    genre: 'Gameshow Suspense',
    bpm: 120,
    description: 'Comedic clockwork pizzicato countdown for nail-biting, funny buzzer races.',
    emoji: '⏰'
  },
  {
    id: 'benny_hill_comedy',
    title: 'Goofy Ragtime Kazoo Chase',
    genre: 'Slapstick / Vaudeville',
    bpm: 156,
    description: 'Super silly, chaotic brass bounces when players panic on rapid questions.',
    emoji: '🎷'
  },
  {
    id: 'funky_lounge',
    title: 'Funky Quizmaster Strut',
    genre: 'Groovy 70s Funk',
    bpm: 112,
    description: 'Slap-bass and rhythmic brass chords fit for a charismatic, flashy TV host.',
    emoji: '🕺'
  },
  {
    id: 'zen_lofi',
    title: 'Mindset Lo-Fi Chillroom',
    genre: 'Lo-Fi Chill Hop',
    bpm: 84,
    description: 'Relaxed warm vinyl chords and mellow bass for calm cognitive thinking.',
    emoji: '☕'
  }
];

let activeMusicInterval: number | null = null;
let currentTrackTheme: SoundtrackTheme | null = null;
let musicGainNode: GainNode | null = null;

export function stopTriviaSoundtrack() {
  if (activeMusicInterval) {
    clearInterval(activeMusicInterval);
    activeMusicInterval = null;
  }
  if (musicGainNode) {
    try {
      musicGainNode.gain.exponentialRampToValueAtTime(0.001, getAudioContext().currentTime + 0.3);
      setTimeout(() => {
        musicGainNode?.disconnect();
        musicGainNode = null;
      }, 350);
    } catch {}
  }
  currentTrackTheme = null;
}

export function getCurrentSoundtrack(): SoundtrackTheme | null {
  return currentTrackTheme;
}

export function playTriviaSoundtrack(theme: SoundtrackTheme, volume = 0.08) {
  stopTriviaSoundtrack();
  currentTrackTheme = theme;

  try {
    const ctx = getAudioContext();
    musicGainNode = ctx.createGain();
    musicGainNode.gain.setValueAtTime(volume, ctx.currentTime);
    musicGainNode.connect(ctx.destination);

    let step = 0;

    if (theme === 'game_show_8bit') {
      const melody = [523.25, 659.25, 783.99, 1046.5, 880, 659.25, 783.99, 587.33];
      const bassNotes = [130.81, 164.81, 196.00, 220.00];

      activeMusicInterval = window.setInterval(() => {
        if (!musicGainNode) return;
        const now = ctx.currentTime;
        const note = melody[step % melody.length];
        const bass = bassNotes[Math.floor(step / 2) % bassNotes.length];

        // Lead synth (square wave for 8-bit vibe)
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'square';
        osc.frequency.setValueAtTime(note, now);
        gain.gain.setValueAtTime(0.06, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
        osc.connect(gain);
        gain.connect(musicGainNode!);
        osc.start(now);
        osc.stop(now + 0.12);

        // Bass punch
        if (step % 2 === 0) {
          const bassOsc = ctx.createOscillator();
          const bassGain = ctx.createGain();
          bassOsc.type = 'triangle';
          bassOsc.frequency.setValueAtTime(bass, now);
          bassGain.gain.setValueAtTime(0.12, now);
          bassGain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
          bassOsc.connect(bassGain);
          bassGain.connect(musicGainNode!);
          bassOsc.start(now);
          bassOsc.stop(now + 0.2);
        }

        step++;
      }, 150);

    } else if (theme === 'jeopardy_tension') {
      const scale = [440, 493.88, 523.25, 587.33, 659.25, 587.33, 523.25, 493.88];
      
      activeMusicInterval = window.setInterval(() => {
        if (!musicGainNode) return;
        const now = ctx.currentTime;
        const note = scale[step % scale.length];

        // Ticking pizzicato woodblock note
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(note, now);
        gain.gain.setValueAtTime(0.1, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.09);
        osc.connect(gain);
        gain.connect(musicGainNode!);
        osc.start(now);
        osc.stop(now + 0.09);

        // Clock tick
        const tickOsc = ctx.createOscillator();
        const tickGain = ctx.createGain();
        tickOsc.type = 'triangle';
        tickOsc.frequency.setValueAtTime(step % 2 === 0 ? 1200 : 900, now);
        tickGain.gain.setValueAtTime(0.05, now);
        tickGain.gain.exponentialRampToValueAtTime(0.001, now + 0.03);
        tickOsc.connect(tickGain);
        tickGain.connect(musicGainNode!);
        tickOsc.start(now);
        tickOsc.stop(now + 0.03);

        step++;
      }, 200);

    } else if (theme === 'benny_hill_comedy') {
      // Bouncy ragtime major staccato
      const bouncy = [392.00, 440.00, 493.88, 523.25, 587.33, 659.25, 783.99, 659.25];
      activeMusicInterval = window.setInterval(() => {
        if (!musicGainNode) return;
        const now = ctx.currentTime;
        const n = bouncy[step % bouncy.length];

        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(n, now);
        gain.gain.setValueAtTime(0.04, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
        osc.connect(gain);
        gain.connect(musicGainNode!);
        osc.start(now);
        osc.stop(now + 0.08);

        step++;
      }, 120);

    } else if (theme === 'funky_lounge') {
      const chords = [
        [261.63, 329.63, 392.00, 493.88], // Cmaj7
        [220.00, 261.63, 329.63, 392.00], // Am7
        [174.61, 220.00, 261.63, 329.63], // Fmaj7
        [196.00, 246.94, 293.66, 349.23], // G7
      ];
      
      activeMusicInterval = window.setInterval(() => {
        if (!musicGainNode) return;
        const now = ctx.currentTime;
        const chord = chords[Math.floor(step / 4) % chords.length];

        chord.forEach((freq) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, now);
          gain.gain.setValueAtTime(0.025, now);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.28);
          osc.connect(gain);
          gain.connect(musicGainNode!);
          osc.start(now);
          osc.stop(now + 0.28);
        });

        step++;
      }, 260);

    } else if (theme === 'zen_lofi') {
      const lofiTones = [261.63, 311.13, 392.00, 466.16];
      activeMusicInterval = window.setInterval(() => {
        if (!musicGainNode) return;
        const now = ctx.currentTime;
        const freq = lofiTones[step % lofiTones.length];

        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now);
        gain.gain.setValueAtTime(0.04, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
        osc.connect(gain);
        gain.connect(musicGainNode!);
        osc.start(now);
        osc.stop(now + 0.5);

        step++;
      }, 400);
    }
  } catch (e) {
    console.warn("Soundtrack playback error:", e);
  }
}

/**
 * Stop any ongoing TTS audio playback
 */
export function stopAudioSpeech() {
  if (currentSourceNode) {
    try {
      currentSourceNode.stop();
      currentSourceNode.disconnect();
    } catch {}
    currentSourceNode = null;
  }
  if ('speechSynthesis' in window) {
    window.speechSynthesis.cancel();
  }
}

/**
 * Play text using Gemini TTS API (model: gemini-3.1-flash-tts-preview) with fallback to Web Speech API
 */
export async function playHostTTS(
  text: string,
  personality: string = 'Nova',
  voiceName: string = 'Puck',
  onStart?: () => void,
  onEnd?: () => void
): Promise<void> {
  stopAudioSpeech();

  if (!text || text.trim().length === 0) {
    onEnd?.();
    return;
  }

  try {
    onStart?.();

    // Call server TTS endpoint
    const response = await fetch('/api/tts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, personality, voice: voiceName })
    });

    const data = await response.json();

    if (data.audioBase64) {
      const ctx = getAudioContext();
      const audioBuffer = pcmToAudioBuffer(ctx, data.audioBase64, 24000);
      const source = ctx.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(ctx.destination);

      currentSourceNode = source;
      source.onended = () => {
        currentSourceNode = null;
        onEnd?.();
      };
      source.start();
      return;
    }
  } catch (e) {
    console.warn("Gemini TTS API call failed, falling back to Web Speech Synthesis:", e);
  }

  // Web Speech API Fallback
  if ('speechSynthesis' in window) {
    try {
      const cleanText = text.replace(/[*#_\[\]]/g, '');
      const utterance = new SpeechSynthesisUtterance(cleanText);
      utterance.rate = 1.05;
      
      // Select voice based on personality
      const voices = window.speechSynthesis.getVoices();
      if (voices.length > 0) {
        if (personality === 'Dr. Thaddeus') {
          const deepVoice = voices.find(v => v.name.includes('David') || v.name.includes('Male') || v.name.includes('UK'));
          if (deepVoice) utterance.voice = deepVoice;
          utterance.pitch = 0.9;
        } else if (personality === 'Aria') {
          const calmVoice = voices.find(v => v.name.includes('Samantha') || v.name.includes('Zira') || v.name.includes('Female'));
          if (calmVoice) utterance.voice = calmVoice;
          utterance.pitch = 1.1;
        } else if (personality === 'Cipher-9') {
          utterance.pitch = 1.3;
          utterance.rate = 1.2;
        }
      }

      utterance.onend = () => {
        onEnd?.();
      };
      utterance.onerror = () => {
        onEnd?.();
      };

      window.speechSynthesis.speak(utterance);
      return;
    } catch {
      onEnd?.();
    }
  } else {
    onEnd?.();
  }
}

/**
 * Setup Web Speech Recognition for voice answers and host interactions
 */
export function createSpeechRecognizer(
  onTranscript: (transcript: string, isFinal: boolean) => void,
  onError?: (error: string) => void
) {
  const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

  if (!SpeechRecognition) {
    return {
      isSupported: false,
      start: () => {},
      stop: () => {},
      abort: () => {}
    };
  }

  const recognition = new SpeechRecognition();
  recognition.continuous = false;
  recognition.interimResults = true;
  recognition.lang = 'en-US';

  recognition.onresult = (event: any) => {
    let interim = '';
    let final = '';
    for (let i = event.resultIndex; i < event.results.length; ++i) {
      if (event.results[i].isFinal) {
        final += event.results[i][0].transcript;
      } else {
        interim += event.results[i][0].transcript;
      }
    }
    const current = final || interim;
    onTranscript(current, !!final);
  };

  recognition.onerror = (event: any) => {
    onError?.(event.error || 'Speech recognition error');
  };

  return {
    isSupported: true,
    start: () => {
      try {
        recognition.start();
      } catch (e) {
        console.warn("Speech recognition already running or error:", e);
      }
    },
    stop: () => {
      try {
        recognition.stop();
      } catch {}
    },
    abort: () => {
      try {
        recognition.abort();
      } catch {}
    }
  };
}
