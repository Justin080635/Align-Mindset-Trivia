import React from 'react';
import { PersonalityType } from '../types';

interface HostVectorGraphicProps {
  hostId: PersonalityType | string;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'hero';
  className?: string;
  isAnimated?: boolean;
}

export const HostVectorGraphic: React.FC<HostVectorGraphicProps> = ({
  hostId,
  size = 'md',
  className = '',
  isAnimated = true
}) => {
  const sizeMap = {
    sm: { w: 44, h: 44, radius: 'w-11 h-11' },
    md: { w: 60, h: 60, radius: 'w-15 h-15' },
    lg: { w: 84, h: 84, radius: 'w-21 h-21' },
    xl: { w: 120, h: 120, radius: 'w-30 h-30' },
    hero: { w: 160, h: 160, radius: 'w-40 h-40' }
  };

  const currentSize = sizeMap[size] || sizeMap.md;

  const hostThemes: Record<string, {
    outerRing: string;
    innerRing: string;
    bgGrad1: string;
    bgGrad2: string;
    glowColor: string;
    accentColor: string;
    badgeTitle: string;
  }> = {
    Nova: {
      outerRing: '#f59e0b',
      innerRing: '#d97706',
      bgGrad1: '#451a03',
      bgGrad2: '#78350f',
      glowColor: '#fbbf24',
      accentColor: '#fde047',
      badgeTitle: 'Superstar Emcee'
    },
    'Dr. Thaddeus': {
      outerRing: '#38bdf8',
      innerRing: '#0284c7',
      bgGrad1: '#082f49',
      bgGrad2: '#0369a1',
      glowColor: '#7dd3fc',
      accentColor: '#e0f2fe',
      badgeTitle: 'Cognitive Scholar'
    },
    Aria: {
      outerRing: '#34d399',
      innerRing: '#059669',
      bgGrad1: '#064e3b',
      bgGrad2: '#047857',
      glowColor: '#6ee7b7',
      accentColor: '#a7f3d0',
      badgeTitle: 'Zen Mindset Guru'
    },
    'Cipher-9': {
      outerRing: '#c084fc',
      innerRing: '#9333ea',
      bgGrad1: '#3b0764',
      bgGrad2: '#6b21a8',
      glowColor: '#e879f9',
      accentColor: '#f5d0fe',
      badgeTitle: 'Cybernetic Oracle'
    },
    'Coach Marcus': {
      outerRing: '#f43f5e',
      innerRing: '#e11d48',
      bgGrad1: '#4c0519',
      bgGrad2: '#881337',
      glowColor: '#fb7185',
      accentColor: '#ffe4e6',
      badgeTitle: 'Hustle & Clutch Captain'
    }
  };

  const theme = hostThemes[hostId] || hostThemes.Nova;
  const gradId = `host-grad-${hostId.toLowerCase().replace(/[^a-z0-9]/g, '-')}-${size}`;

  const renderHostArtwork = () => {
    switch (hostId) {
      case 'Nova':
        return (
          <g>
            {/* Hype Starburst Rays */}
            <g opacity="0.75">
              <line x1="50" y1="18" x2="50" y2="8" stroke={theme.accentColor} strokeWidth="2.5" strokeLinecap="round" />
              <line x1="50" y1="82" x2="50" y2="92" stroke={theme.accentColor} strokeWidth="2.5" strokeLinecap="round" />
              <line x1="18" y1="50" x2="8" y2="50" stroke={theme.accentColor} strokeWidth="2.5" strokeLinecap="round" />
              <line x1="82" y1="50" x2="92" y2="50" stroke={theme.accentColor} strokeWidth="2.5" strokeLinecap="round" />
              <line x1="27" y1="27" x2="20" y2="20" stroke={theme.glowColor} strokeWidth="2" strokeLinecap="round" />
              <line x1="73" y1="73" x2="80" y2="80" stroke={theme.glowColor} strokeWidth="2" strokeLinecap="round" />
              <line x1="73" y1="27" x2="80" y2="20" stroke={theme.glowColor} strokeWidth="2" strokeLinecap="round" />
              <line x1="27" y1="73" x2="20" y2="80" stroke={theme.glowColor} strokeWidth="2" strokeLinecap="round" />
            </g>

            {/* Broadcast Microphone & Crown Emblem */}
            <path
              d="M50 22 L55 33 L67 35 L58 43 L60 55 L50 49 L40 55 L42 43 L33 35 L45 33 Z"
              fill="url(#novaStarGrad)"
              stroke="#ffffff"
              strokeWidth="1.5"
            />
            {/* Live Studio Capsule */}
            <rect x="44" y="44" width="12" height="20" rx="6" fill="#fef08a" stroke="#ffffff" strokeWidth="1.5" />
            <path d="M38 54 C38 62 44 67 50 67 C56 67 62 62 62 54" fill="none" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" />
            <line x1="50" y1="67" x2="50" y2="76" stroke="#ffffff" strokeWidth="2.5" strokeLinecap="round" />
            <line x1="42" y1="76" x2="58" y2="76" stroke="#ffffff" strokeWidth="2.5" strokeLinecap="round" />
            <circle cx="50" cy="50" r="2.5" fill="#d97706" />
          </g>
        );

      case 'Dr. Thaddeus':
        return (
          <g>
            {/* Scholar Laurels */}
            <path
              d="M26 62 C22 48 26 36 34 28 M74 62 C78 48 74 36 66 28"
              fill="none"
              stroke={theme.glowColor}
              strokeWidth="2"
              strokeLinecap="round"
              strokeDasharray="4,3"
            />
            {/* Intellectual Mortarboard & Book */}
            <path
              d="M50 25 L74 37 L50 49 L26 37 Z"
              fill="url(#thaddeusCapGrad)"
              stroke="#ffffff"
              strokeWidth="2"
              strokeLinejoin="round"
            />
            <path d="M70 40 L70 54 C70 58 60 62 50 62 C40 62 30 58 30 54 L30 40" fill="none" stroke="#38bdf8" strokeWidth="2" />
            <line x1="74" y1="37" x2="77" y2="52" stroke="#fef08a" strokeWidth="1.5" strokeLinecap="round" />
            <circle cx="77" cy="53" r="2" fill="#fef08a" />

            {/* Academic Spectacles / Knowledge Monocle */}
            <circle cx="43" cy="60" r="6" fill="#082f49" stroke="#ffffff" strokeWidth="1.5" />
            <circle cx="57" cy="60" r="6" fill="#082f49" stroke="#ffffff" strokeWidth="1.5" />
            <path d="M49 60 L51 60" stroke="#ffffff" strokeWidth="2" />
            <circle cx="43" cy="60" r="2" fill="#38bdf8" />
            <circle cx="57" cy="60" r="2" fill="#38bdf8" />
          </g>
        );

      case 'Aria':
        return (
          <g>
            {/* Zen Meditation Rings & Harmonic Waves */}
            <circle cx="50" cy="50" r="26" fill="none" stroke={theme.glowColor} strokeWidth="1.5" strokeDasharray="3,3" opacity="0.6" />
            <circle cx="50" cy="50" r="32" fill="none" stroke={theme.accentColor} strokeWidth="1" opacity="0.4" />

            {/* Blooming Lotus Petals */}
            <path
              d="M50 24 C44 36 44 48 50 64 C56 48 56 36 50 24 Z"
              fill="url(#ariaLotusGrad)"
              stroke="#ffffff"
              strokeWidth="1.5"
            />
            <path
              d="M34 38 C32 48 38 56 48 64 C42 54 38 46 34 38 Z"
              fill="#34d399"
              opacity="0.85"
              stroke="#ffffff"
              strokeWidth="1.2"
            />
            <path
              d="M66 38 C68 48 62 56 52 64 C58 54 62 46 66 38 Z"
              fill="#34d399"
              opacity="0.85"
              stroke="#ffffff"
              strokeWidth="1.2"
            />
            {/* Mindful Energy Core */}
            <circle cx="50" cy="52" r="5" fill="#fef08a" stroke="#ffffff" strokeWidth="1.5" />
            <circle cx="50" cy="52" r="2" fill="#065f46" />
            {/* Base Ripple */}
            <path d="M30 68 C40 73 60 73 70 68" fill="none" stroke="#a7f3d0" strokeWidth="2" strokeLinecap="round" />
          </g>
        );

      case 'Cipher-9':
        return (
          <g>
            {/* Cyberpunk Circuit Grid & Data Hexagon */}
            <polygon
              points="50,20 76,35 76,65 50,80 24,65 24,35"
              fill="none"
              stroke={theme.glowColor}
              strokeWidth="1.8"
              strokeDasharray="4,2"
            />
            {/* Robotic Optical Visor */}
            <rect x="32" y="42" width="36" height="14" rx="4" fill="#1e1b4b" stroke="#ffffff" strokeWidth="1.8" />
            <line x1="34" y1="49" x2="66" y2="49" stroke="#e879f9" strokeWidth="3" strokeLinecap="round" />
            <circle cx="50" cy="49" r="3" fill="#ffffff" />

            {/* Neural Matrix Trace Lines */}
            <path d="M50 20 L50 38 M24 50 L32 50 M76 50 L68 50 M50 62 L50 80" stroke="#c084fc" strokeWidth="2" strokeLinecap="round" />
            <circle cx="50" cy="38" r="2.5" fill="#f43f5e" />
            <circle cx="50" cy="62" r="2.5" fill="#f43f5e" />
            <circle cx="32" cy="50" r="2" fill="#38bdf8" />
            <circle cx="68" cy="50" r="2" fill="#38bdf8" />
          </g>
        );

      case 'Coach Marcus':
        return (
          <g>
            {/* Athletic Fire Wings & Shield */}
            <path
              d="M50 18 L76 28 C76 54 64 68 50 78 C36 68 24 54 24 28 Z"
              fill="url(#coachShieldGrad)"
              stroke="#ffffff"
              strokeWidth="2"
              strokeLinejoin="round"
            />
            {/* Dynamic Energy Flame / Whistle Emblem */}
            <path
              d="M50 28 C55 36 62 42 62 52 C62 60 56 64 50 64 C44 64 38 60 38 52 C38 42 45 36 50 28 Z"
              fill="#fb7185"
              stroke="#ffffff"
              strokeWidth="1.5"
            />
            <path
              d="M50 38 C53 44 57 48 57 54 C57 58 53 60 50 60 C47 60 43 58 43 54 C43 48 47 44 50 38 Z"
              fill="#fef08a"
            />
            {/* Clutch Lightning Strike */}
            <path d="M48 40 L44 50 L50 50 L46 62 L56 48 L50 48 Z" fill="#ffffff" />
          </g>
        );

      default:
        return (
          <circle cx="50" cy="50" r="20" fill={theme.glowColor} />
        );
    }
  };

  return (
    <div
      className={`relative inline-flex items-center justify-center select-none ${currentSize.radius} ${className}`}
      title={`${hostId} — ${theme.badgeTitle}`}
    >
      <svg
        viewBox="0 0 100 100"
        width={currentSize.w}
        height={currentSize.h}
        className="w-full h-full drop-shadow-lg"
      >
        <defs>
          {/* Gradients */}
          <radialGradient id={gradId} cx="50%" cy="40%" r="60%">
            <stop offset="0%" stopColor={theme.bgGrad2} />
            <stop offset="100%" stopColor={theme.bgGrad1} />
          </radialGradient>

          <linearGradient id="novaStarGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#fef08a" />
            <stop offset="50%" stopColor="#f59e0b" />
            <stop offset="100%" stopColor="#b45309" />
          </linearGradient>

          <linearGradient id="thaddeusCapGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#38bdf8" />
            <stop offset="100%" stopColor="#0369a1" />
          </linearGradient>

          <linearGradient id="ariaLotusGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#a7f3d0" />
            <stop offset="50%" stopColor="#34d399" />
            <stop offset="100%" stopColor="#059669" />
          </linearGradient>

          <linearGradient id="coachShieldGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#f43f5e" />
            <stop offset="100%" stopColor="#881337" />
          </linearGradient>

          <filter id={`glow-${gradId}`} x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        {/* Outer Heavy Hexagonal Shield Rim */}
        <polygon
          points="50,4 88,26 88,74 50,96 12,74 12,26"
          fill={theme.outerRing}
          stroke="#000000"
          strokeWidth="1.5"
          filter={`url(#glow-${gradId})`}
        />

        {/* Inner Shield Bezel */}
        <polygon
          points="50,8 84,28 84,72 50,92 16,72 16,28"
          fill={theme.innerRing}
        />

        {/* Core Shield Face Plate */}
        <polygon
          points="50,11 81,30 81,70 50,89 19,70 19,30"
          fill={`url(#${gradId})`}
        />

        {/* Corner Rivet Screws */}
        <circle cx="50" cy="8" r="1.5" fill="#ffffff" />
        <circle cx="84" cy="28" r="1.5" fill="#ffffff" />
        <circle cx="84" cy="72" r="1.5" fill="#ffffff" />
        <circle cx="50" cy="92" r="1.5" fill="#ffffff" />
        <circle cx="16" cy="72" r="1.5" fill="#ffffff" />
        <circle cx="16" cy="28" r="1.5" fill="#ffffff" />

        {/* Dedicated Vector Host Artwork */}
        {renderHostArtwork()}
      </svg>
    </div>
  );
};
