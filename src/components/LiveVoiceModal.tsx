import React, { useState, useEffect, useRef } from 'react';
import {
  Radio,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  X,
  Sparkles,
  Bot,
  MessageSquare,
  Flame,
  Send
} from 'lucide-react';
import { HostPersona, PlayerProfile } from '../types';
import { playHostTTS, stopAudioSpeech, createSpeechRecognizer, playSoundEffect } from '../utils/audio';

interface LiveVoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentHost: HostPersona;
  profile: PlayerProfile;
}

export const LiveVoiceModal: React.FC<LiveVoiceModalProps> = ({
  isOpen,
  onClose,
  currentHost,
  profile
}) => {
  const [isMicActive, setIsMicActive] = useState<boolean>(false);
  const [transcript, setTranscript] = useState<string>('');
  const [hostReply, setHostReply] = useState<string>(
    `Live voice room active! I'm ${currentHost.name}. Talk to me about mindset strategies, ask for a quick practice trivia question, or test your cognitive reflexes!`
  );
  const [isThinking, setIsThinking] = useState<boolean>(false);
  const [history, setHistory] = useState<{ sender: 'user' | 'host'; text: string }[]>([]);
  const [textInput, setTextInput] = useState<string>('');

  const recognizerRef = useRef<any>(null);

  useEffect(() => {
    if (isOpen) {
      // Greet user
      playHostTTS(hostReply, currentHost.id, currentHost.voiceName);
    } else {
      stopAudioSpeech();
      recognizerRef.current?.stop();
    }
  }, [isOpen, currentHost]);

  if (!isOpen) return null;

  const handleSendPrompt = async (userPrompt: string) => {
    if (!userPrompt.trim()) return;

    playSoundEffect('click');
    setHistory(prev => [...prev, { sender: 'user', text: userPrompt }]);
    setIsThinking(true);
    setTextInput('');

    try {
      const res = await fetch('/api/host-commentary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          personality: currentHost.id,
          eventType: 'intro',
          playerName: profile.username,
          userQuery: userPrompt
        })
      });
      const data = await res.json();
      const reply = data.commentary || "Let's keep training your cognitive reflexes!";

      setHostReply(reply);
      setHistory(prev => [...prev, { sender: 'host', text: reply }]);
      await playHostTTS(reply, currentHost.id, currentHost.voiceName);
    } catch (e) {
      console.warn("Live voice chat error:", e);
    } finally {
      setIsThinking(false);
    }
  };

  const toggleMic = () => {
    if (isMicActive) {
      recognizerRef.current?.stop();
      setIsMicActive(false);
    } else {
      playSoundEffect('click');
      setIsMicActive(true);
      setTranscript('Listening...');

      const recognizer = createSpeechRecognizer(
        (text, isFinal) => {
          setTranscript(text);
          if (isFinal) {
            handleSendPrompt(text);
            setIsMicActive(false);
          }
        },
        err => {
          console.warn("Speech error:", err);
          setIsMicActive(false);
        }
      );
      recognizerRef.current = recognizer;
      recognizer.start();
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-950/85 backdrop-blur-md animate-in fade-in"
      role="dialog"
      aria-modal="true"
      aria-labelledby="voice-room-title"
    >
      <div className="w-full max-w-lg rounded-3xl bg-neutral-900 border border-cyan-500/30 p-6 space-y-6 shadow-2xl relative overflow-hidden">
        
        {/* Ambient background glow */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-neutral-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-cyan-950 border border-cyan-500/40 flex items-center justify-center text-cyan-400">
              <Radio className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h2 id="voice-room-title" className="font-bold text-base text-white">
                Live AI Host Voice Room
              </h2>
              <span className="text-[11px] text-cyan-300 font-medium">
                Real-Time Voice API • Host: {currentHost.name}
              </span>
            </div>
          </div>

          <button
            onClick={() => {
              stopAudioSpeech();
              onClose();
            }}
            className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Animated Host Voice Orb */}
        <div className="py-6 flex flex-col items-center justify-center text-center space-y-4">
          <div className="relative">
            <div className={`w-24 h-24 rounded-3xl bg-gradient-to-br ${currentHost.avatarBg} flex items-center justify-center text-5xl shadow-2xl transition-transform ${
              isMicActive ? 'scale-110 ring-4 ring-cyan-400/50' : 'scale-100'
            }`}>
              {currentHost.avatar}
            </div>

            {/* Pulsing waves */}
            {isMicActive && (
              <div className="absolute inset-0 rounded-3xl border-2 border-cyan-400 animate-ping opacity-60 pointer-events-none" />
            )}
          </div>

          <div className="space-y-1">
            <h3 className="font-extrabold text-lg text-white">{currentHost.name}</h3>
            <span className="text-xs text-neutral-400 font-medium">{currentHost.tagLine}</span>
          </div>
        </div>

        {/* Live Conversation Stream Box */}
        <div className="max-h-48 overflow-y-auto p-4 rounded-2xl bg-neutral-950/80 border border-neutral-800 space-y-2.5 text-xs">
          <div className="p-2.5 rounded-xl bg-neutral-900 border border-neutral-800 text-neutral-200 leading-relaxed">
            <span className="font-bold text-emerald-400 block mb-0.5">{currentHost.name}:</span>
            "{hostReply}"
          </div>

          {history.map((msg, idx) => (
            <div
              key={idx}
              className={`p-2.5 rounded-xl text-left ${
                msg.sender === 'user'
                  ? 'bg-cyan-950/50 border border-cyan-500/30 text-cyan-200 ml-4'
                  : 'bg-neutral-900 border border-neutral-800 text-neutral-200 mr-4'
              }`}
            >
              <span className="font-bold block text-[10px] text-neutral-400 uppercase">
                {msg.sender === 'user' ? profile.username : currentHost.name}
              </span>
              {msg.text}
            </div>
          ))}

          {isThinking && (
            <div className="text-neutral-400 text-xs italic animate-pulse">
              {currentHost.name} is formulating response...
            </div>
          )}
        </div>

        {/* Voice Push-to-Talk & Text Form */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <button
              onClick={toggleMic}
              className={`flex-1 py-3.5 rounded-2xl font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-lg ${
                isMicActive
                  ? 'bg-rose-600 hover:bg-rose-500 text-white animate-pulse'
                  : 'bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-neutral-950'
              }`}
            >
              {isMicActive ? (
                <>
                  <Mic className="w-4 h-4" />
                  <span>Tap to Finish Speaking</span>
                </>
              ) : (
                <>
                  <Mic className="w-4 h-4" />
                  <span>Push to Speak with {currentHost.name}</span>
                </>
              )}
            </button>
          </div>

          <form
            onSubmit={e => {
              e.preventDefault();
              handleSendPrompt(textInput);
            }}
            className="flex items-center gap-2"
          >
            <input
              type="text"
              value={textInput}
              onChange={e => setTextInput(e.target.value)}
              placeholder="Or type a question/topic..."
              className="flex-1 p-2.5 rounded-xl bg-neutral-950 border border-neutral-800 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-cyan-500"
            />
            <button
              type="submit"
              disabled={!textInput.trim()}
              className="p-2.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-white disabled:opacity-40"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>

      </div>
    </div>
  );
};
