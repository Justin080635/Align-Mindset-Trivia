import React from 'react';

interface BadgeVectorGraphicProps {
  iconName: string;
  badgeId?: string;
  rarity?: 'Common' | 'Rare' | 'Epic' | 'Legendary';
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'hero';
  className?: string;
  isUnlocked?: boolean;
}

export const BadgeVectorGraphic: React.FC<BadgeVectorGraphicProps> = ({
  iconName,
  badgeId = '',
  rarity = 'Rare',
  size = 'md',
  className = '',
  isUnlocked = true
}) => {
  const sizeMap = {
    sm: { w: 40, h: 40, radius: 'w-10 h-10' },
    md: { w: 56, h: 56, radius: 'w-14 h-14' },
    lg: { w: 80, h: 80, radius: 'w-20 h-20' },
    xl: { w: 120, h: 120, radius: 'w-28 sm:w-32 h-28 sm:h-32' },
    hero: { w: 180, h: 180, radius: 'w-40 sm:w-48 h-40 sm:h-48' }
  };

  const currentSize = sizeMap[size];

  // Rarity color configurations
  const rarityColors = {
    Common: {
      rimOuter: '#52525b',
      rimInner: '#3f3f46',
      coreGrad1: '#18181b',
      coreGrad2: '#27272a',
      accentGlow: '#a1a1aa',
      gemColor: '#71717a'
    },
    Rare: {
      rimOuter: '#06b6d4',
      rimInner: '#0891b2',
      coreGrad1: '#083344',
      coreGrad2: '#0e7490',
      accentGlow: '#22d3ee',
      gemColor: '#38bdf8'
    },
    Epic: {
      rimOuter: '#c084fc',
      rimInner: '#9333ea',
      coreGrad1: '#3b0764',
      coreGrad2: '#6b21a8',
      accentGlow: '#e879f9',
      gemColor: '#d8b4fe'
    },
    Legendary: {
      rimOuter: '#f59e0b',
      rimInner: '#b45309',
      coreGrad1: '#451a03',
      coreGrad2: '#78350f',
      accentGlow: '#fbbf24',
      gemColor: '#fef08a'
    }
  }[rarity] || {
    rimOuter: '#10b981',
    rimInner: '#059669',
    coreGrad1: '#064e3b',
    coreGrad2: '#047857',
    accentGlow: '#34d399',
    gemColor: '#6ee7b7'
  };

  const idPrefix = `${iconName}-${rarity}-${size}-${badgeId}`;

  // Dedicated custom SVG artwork paths for each badge concept
  const renderEmblemArtwork = () => {
    switch (iconName) {
      case 'BrainCircuit': // Growth Pioneer / Big Brain Energy
        return (
          <g>
            {/* Neural Matrix & Synapses */}
            <circle cx="50" cy="50" r="28" fill="none" stroke={rarityColors.accentGlow} strokeWidth="1.5" strokeDasharray="3,3" opacity="0.6" />
            <path
              d="M50 25 C36 25 28 36 28 50 C28 62 36 71 46 74 L46 78 C46 80 48 81 50 81 C52 81 54 80 54 78 L54 74 C64 71 72 62 72 50 C72 36 64 25 50 25 Z"
              fill="url(#brainGrad)"
              stroke={rarityColors.accentGlow}
              strokeWidth="2"
            />
            {/* Brain Hemisphere Divider */}
            <path d="M50 26 L50 74" stroke="#ffffff" strokeWidth="1.5" strokeLinecap="round" opacity="0.8" />
            {/* Neural Synaptic Nodes */}
            <circle cx="40" cy="38" r="3" fill="#ffffff" />
            <circle cx="60" cy="38" r="3" fill="#ffffff" />
            <circle cx="36" cy="52" r="2.5" fill={rarityColors.gemColor} />
            <circle cx="64" cy="52" r="2.5" fill={rarityColors.gemColor} />
            <circle cx="44" cy="64" r="2" fill="#ffffff" />
            <circle cx="56" cy="64" r="2" fill="#ffffff" />
            {/* Synaptic Traces */}
            <path d="M40 38 L50 45 L60 38 M36 52 L50 45 L64 52 M44 64 L50 56 L56 64" stroke="#ffffff" strokeWidth="1.2" opacity="0.75" />
            <circle cx="50" cy="45" r="3.5" fill="#facc15" />
          </g>
        );

      case 'Zap': // Speed Demon / Lightning Reflexes
        return (
          <g>
            {/* Speed Chevrons */}
            <path d="M22 36 L30 50 L22 64" fill="none" stroke={rarityColors.accentGlow} strokeWidth="2.5" strokeLinecap="round" opacity="0.4" />
            <path d="M78 36 L70 50 L78 64" fill="none" stroke={rarityColors.accentGlow} strokeWidth="2.5" strokeLinecap="round" opacity="0.4" />
            {/* Main Lightning Bolt */}
            <path
              d="M54 20 L32 50 L48 50 L44 80 L68 46 L52 46 Z"
              fill="url(#zapGrad)"
              stroke="#ffffff"
              strokeWidth="2"
              strokeLinejoin="round"
            />
            {/* Inner Bolt Core Glow */}
            <path
              d="M53 26 L38 48 L49 48 L46 72 L62 48 L51 48 Z"
              fill="#ffffff"
              opacity="0.9"
            />
            {/* Kinetic Sparks */}
            <circle cx="30" cy="28" r="2" fill="#fef08a" />
            <circle cx="70" cy="70" r="2" fill="#fef08a" />
            <circle cx="68" cy="30" r="1.5" fill="#ffffff" />
          </g>
        );

      case 'Mic': // Voice Virtuoso / Voice Boss
        return (
          <g>
            {/* Soundwave Frequency Arcs */}
            <path d="M22 50 C22 34 34 22 50 22" fill="none" stroke={rarityColors.accentGlow} strokeWidth="2.5" strokeLinecap="round" opacity="0.5" />
            <path d="M78 50 C78 34 66 22 50 22" fill="none" stroke={rarityColors.accentGlow} strokeWidth="2.5" strokeLinecap="round" opacity="0.5" />
            <path d="M28 50 C28 38 38 28 50 28" fill="none" stroke="#ffffff" strokeWidth="1.5" strokeLinecap="round" opacity="0.8" />
            <path d="M72 50 C72 38 62 28 50 28" fill="none" stroke="#ffffff" strokeWidth="1.5" strokeLinecap="round" opacity="0.8" />
            {/* Microphone Capsule */}
            <rect x="42" y="30" width="16" height="26" rx="8" fill="url(#micGrad)" stroke="#ffffff" strokeWidth="2" />
            {/* Mic Grille Lines */}
            <line x1="42" y1="38" x2="58" y2="38" stroke="#ffffff" strokeWidth="1.5" opacity="0.7" />
            <line x1="42" y1="44" x2="58" y2="44" stroke="#ffffff" strokeWidth="1.5" opacity="0.7" />
            <line x1="50" y1="30" x2="50" y2="56" stroke="#ffffff" strokeWidth="1.2" opacity="0.5" />
            {/* U-Shape Bracket */}
            <path d="M36 46 C36 58 44 64 50 64 C56 64 64 58 64 46" fill="none" stroke="#ffffff" strokeWidth="2.5" strokeLinecap="round" />
            {/* Stand & Base */}
            <line x1="50" y1="64" x2="50" y2="76" stroke="#ffffff" strokeWidth="3" strokeLinecap="round" />
            <line x1="38" y1="76" x2="62" y2="76" stroke="#ffffff" strokeWidth="3" strokeLinecap="round" />
            <circle cx="50" cy="42" r="3" fill="#38bdf8" />
          </g>
        );

      case 'Crown': // Mindset Master / Grand Imperial Crown
        return (
          <g>
            {/* Golden Laurel Wreath Backing */}
            <path d="M26 62 C24 48 30 36 40 30" fill="none" stroke="#facc15" strokeWidth="2" strokeLinecap="round" opacity="0.7" />
            <path d="M74 62 C76 48 70 36 60 30" fill="none" stroke="#facc15" strokeWidth="2" strokeLinecap="round" opacity="0.7" />
            {/* Imperial Crown Body */}
            <path
              d="M26 66 L30 38 L42 50 L50 24 L58 50 L70 38 L74 66 Z"
              fill="url(#goldCrownGrad)"
              stroke="#ffffff"
              strokeWidth="2"
              strokeLinejoin="round"
            />
            {/* Crown Base Velvet Band */}
            <rect x="24" y="66" width="52" height="10" rx="3" fill="url(#crownBaseGrad)" stroke="#fef08a" strokeWidth="1.5" />
            {/* Embedded Jewels */}
            <circle cx="50" cy="24" r="3.5" fill="#ffffff" stroke="#f59e0b" strokeWidth="1.5" />
            <circle cx="30" cy="38" r="3" fill="#38bdf8" stroke="#0284c7" strokeWidth="1" />
            <circle cx="70" cy="38" r="3" fill="#38bdf8" stroke="#0284c7" strokeWidth="1" />
            <circle cx="36" cy="71" r="2" fill="#ef4444" />
            <circle cx="50" cy="71" r="2.5" fill="#10b981" />
            <circle cx="64" cy="71" r="2" fill="#ef4444" />
            {/* Shimmer Highlight */}
            <path d="M48 42 L52 42 L50 62 Z" fill="#ffffff" opacity="0.75" />
          </g>
        );

      case 'Flame': // Flawless Streak / Solar Fire
        return (
          <g>
            {/* Solar Rays Burst */}
            <circle cx="50" cy="50" r="30" fill="none" stroke="#fb923c" strokeWidth="1" strokeDasharray="4,4" opacity="0.5" />
            {/* Outer Flame Contour */}
            <path
              d="M50 18 C50 18 64 32 64 48 C64 64 56 76 50 78 C44 76 36 64 36 48 C36 34 44 26 50 18 Z"
              fill="url(#fireOuterGrad)"
              stroke="#ffffff"
              strokeWidth="2"
            />
            {/* Mid Flame */}
            <path
              d="M50 30 C50 30 60 42 60 54 C60 66 54 74 50 76 C46 74 40 66 40 54 C40 42 46 36 50 30 Z"
              fill="url(#fireMidGrad)"
            />
            {/* Inner Core Plasma */}
            <path
              d="M50 44 C50 44 56 52 56 60 C56 68 53 72 50 74 C47 72 44 68 44 60 C44 52 48 48 50 44 Z"
              fill="#ffffff"
            />
            {/* Dancing Embers */}
            <circle cx="34" cy="38" r="2" fill="#fef08a" />
            <circle cx="66" cy="34" r="1.5" fill="#fef08a" />
            <circle cx="68" cy="58" r="2" fill="#f97316" />
          </g>
        );

      case 'ShieldCheck': // Stoic Sage / Spartan Aegis
        return (
          <g>
            {/* Spartan Aegis Shield */}
            <path
              d="M50 20 L76 30 C76 56 64 74 50 82 C36 74 24 56 24 30 Z"
              fill="url(#shieldGrad)"
              stroke={rarityColors.accentGlow}
              strokeWidth="2.5"
              strokeLinejoin="round"
            />
            {/* Inner Shield Inset */}
            <path
              d="M50 26 L70 34 C70 54 60 68 50 75 C40 68 30 54 30 34 Z"
              fill="url(#shieldInnerGrad)"
              stroke="#ffffff"
              strokeWidth="1.5"
              opacity="0.9"
            />
            {/* Stoic Pillar / Lambda Core Symbol */}
            <path d="M50 34 L50 64" stroke="#ffffff" strokeWidth="3" strokeLinecap="round" />
            <path d="M42 42 L50 34 L58 42" fill="none" stroke="#ffffff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
            {/* Shield Rivets */}
            <circle cx="34" cy="34" r="1.5" fill="#ffffff" />
            <circle cx="66" cy="34" r="1.5" fill="#ffffff" />
            <circle cx="50" cy="70" r="2" fill="#facc15" />
          </g>
        );

      case 'Users': // Community Beacon / Constellation
        return (
          <g>
            {/* Orbital Rings */}
            <ellipse cx="50" cy="50" rx="30" ry="14" fill="none" stroke={rarityColors.accentGlow} strokeWidth="1.5" transform="rotate(-25 50 50)" opacity="0.6" />
            <ellipse cx="50" cy="50" rx="30" ry="14" fill="none" stroke={rarityColors.accentGlow} strokeWidth="1.5" transform="rotate(25 50 50)" opacity="0.6" />
            {/* Central Leader Node */}
            <circle cx="50" cy="38" r="8" fill="url(#userCenterGrad)" stroke="#ffffff" strokeWidth="2" />
            <path d="M38 66 C38 56 43 52 50 52 C57 52 62 56 62 66 Z" fill="url(#userCenterGrad)" stroke="#ffffff" strokeWidth="2" />
            {/* Left Ally Node */}
            <circle cx="32" cy="46" r="6" fill="#0d9488" stroke="#ffffff" strokeWidth="1.5" />
            <path d="M22 68 C22 60 26 57 32 57 C35 57 37 58 39 60" fill="none" stroke="#ffffff" strokeWidth="1.5" />
            {/* Right Ally Node */}
            <circle cx="68" cy="46" r="6" fill="#0d9488" stroke="#ffffff" strokeWidth="1.5" />
            <path d="M78 68 C78 60 74 57 68 57 C65 57 63 58 61 60" fill="none" stroke="#ffffff" strokeWidth="1.5" />
            {/* Beacon Star */}
            <polygon points="50,22 52,26 56,27 53,30 54,34 50,32 46,34 47,30 44,27 48,26" fill="#facc15" />
          </g>
        );

      case 'CalendarCheck': // 7-Day Streak Club / Chrono Dial
        return (
          <g>
            {/* Chrono Sunburst Rim */}
            <circle cx="50" cy="50" r="28" fill="none" stroke="#f59e0b" strokeWidth="2" strokeDasharray="6,4" />
            {/* Calendar Dial Tablet */}
            <rect x="28" y="26" width="44" height="46" rx="8" fill="url(#calGrad)" stroke="#ffffff" strokeWidth="2" />
            {/* Calendar Header Bar */}
            <path d="M28 34 C28 30 32 26 36 26 L64 26 C68 26 72 30 72 34 L72 38 L28 38 Z" fill="#ef4444" />
            {/* Binder Rings */}
            <circle cx="38" cy="24" r="2.5" fill="#ffffff" stroke="#71717a" strokeWidth="1" />
            <circle cx="62" cy="24" r="2.5" fill="#ffffff" stroke="#71717a" strokeWidth="1" />
            {/* Golden Big "7" & Checkmark */}
            <text x="50" y="58" fontSize="20" fontWeight="900" textAnchor="middle" fill="#ffffff" fontFamily="sans-serif">7</text>
            <path d="M42 62 L48 68 L60 54" fill="none" stroke="#10b981" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />
          </g>
        );

      case 'Sparkles': // Host Whisperer / Neural Nexus Spark
        return (
          <g>
            {/* Synaptic Orbital Rays */}
            <circle cx="50" cy="50" r="28" fill="none" stroke={rarityColors.accentGlow} strokeWidth="1.5" opacity="0.6" />
            {/* 4-Point Primary Star */}
            <path
              d="M50 18 Q50 50 18 50 Q50 50 50 82 Q50 50 82 50 Q50 50 50 18 Z"
              fill="url(#sparkleGrad)"
              stroke="#ffffff"
              strokeWidth="2"
            />
            {/* Secondary Diagonal Diamond Spark */}
            <path
              d="M50 30 Q50 50 30 50 Q50 50 50 70 Q50 50 70 50 Q50 50 50 30 Z"
              fill="#ffffff"
              opacity="0.9"
            />
            <circle cx="50" cy="50" r="4.5" fill="#fde047" />
            <circle cx="30" cy="30" r="2" fill="#ffffff" />
            <circle cx="70" cy="30" r="2.5" fill="#c084fc" />
            <circle cx="30" cy="70" r="2.5" fill="#38bdf8" />
            <circle cx="70" cy="70" r="2" fill="#ffffff" />
          </g>
        );

      case 'Trophy': // Trivia Legend / Polymath Winged Chalice
      default:
        return (
          <g>
            {/* Laurel Wreath */}
            <path d="M22 52 C20 38 28 26 40 22" fill="none" stroke="#facc15" strokeWidth="2.5" strokeLinecap="round" />
            <path d="M78 52 C80 38 72 26 60 22" fill="none" stroke="#facc15" strokeWidth="2.5" strokeLinecap="round" />
            {/* Chalice Cup */}
            <path
              d="M32 26 L68 26 L64 54 C64 62 58 66 50 66 C42 66 36 62 36 54 Z"
              fill="url(#goldTrophyGrad)"
              stroke="#ffffff"
              strokeWidth="2"
            />
            {/* Cup Handles */}
            <path d="M32 30 C22 30 22 46 34 46" fill="none" stroke="#ffffff" strokeWidth="2.5" strokeLinecap="round" />
            <path d="M68 30 C78 30 78 46 66 46" fill="none" stroke="#ffffff" strokeWidth="2.5" strokeLinecap="round" />
            {/* Stem & Tiered Pedestal */}
            <rect x="47" y="66" width="6" height="8" fill="#d97706" />
            <path d="M36 74 L64 74 L68 82 L32 82 Z" fill="url(#pedestalGrad)" stroke="#fef08a" strokeWidth="1.5" />
            {/* Engraved Star on Trophy */}
            <polygon points="50,36 52,42 58,42 53,46 55,52 50,48 45,52 47,46 42,42 48,42" fill="#ffffff" />
          </g>
        );
    }
  };

  return (
    <div
      className={`relative inline-flex items-center justify-center select-none ${currentSize.radius} ${className} ${
        !isUnlocked ? 'filter grayscale opacity-60' : ''
      }`}
    >
      <svg
        viewBox="0 0 100 100"
        className="w-full h-full drop-shadow-xl"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          {/* Universal Medallion Radial Gradient */}
          <radialGradient id={`${idPrefix}-coreGlow`} cx="50%" cy="40%" r="60%">
            <stop offset="0%" stopColor={rarityColors.coreGrad2} />
            <stop offset="70%" stopColor={rarityColors.coreGrad1} />
            <stop offset="100%" stopColor="#09090b" />
          </radialGradient>

          {/* Rim Metallic Gradient */}
          <linearGradient id={`${idPrefix}-rimGrad`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.8" />
            <stop offset="30%" stopColor={rarityColors.rimOuter} />
            <stop offset="70%" stopColor={rarityColors.rimInner} />
            <stop offset="100%" stopColor="#18181b" />
          </linearGradient>

          {/* Specialized Asset Gradients */}
          <linearGradient id="brainGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#34d399" />
            <stop offset="100%" stopColor="#059669" />
          </linearGradient>

          <linearGradient id="zapGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#fef08a" />
            <stop offset="50%" stopColor="#f59e0b" />
            <stop offset="100%" stopColor="#d97706" />
          </linearGradient>

          <linearGradient id="micGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#67e8f9" />
            <stop offset="100%" stopColor="#0284c7" />
          </linearGradient>

          <linearGradient id="goldCrownGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#fef08a" />
            <stop offset="50%" stopColor="#f59e0b" />
            <stop offset="100%" stopColor="#b45309" />
          </linearGradient>

          <linearGradient id="crownBaseGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#991b1b" />
            <stop offset="50%" stopColor="#dc2626" />
            <stop offset="100%" stopColor="#991b1b" />
          </linearGradient>

          <linearGradient id="fireOuterGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#fde047" />
            <stop offset="50%" stopColor="#ea580c" />
            <stop offset="100%" stopColor="#991b1b" />
          </linearGradient>

          <linearGradient id="fireMidGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="60%" stopColor="#fb923c" />
            <stop offset="100%" stopColor="#c2410c" />
          </linearGradient>

          <linearGradient id="shieldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#38bdf8" />
            <stop offset="100%" stopColor="#1e3a8a" />
          </linearGradient>

          <linearGradient id="shieldInnerGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#1e293b" />
            <stop offset="100%" stopColor="#0f172a" />
          </linearGradient>

          <linearGradient id="userCenterGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#2dd4bf" />
            <stop offset="100%" stopColor="#0f766e" />
          </linearGradient>

          <linearGradient id="calGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#27272a" />
            <stop offset="100%" stopColor="#09090b" />
          </linearGradient>

          <linearGradient id="sparkleGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#e879f9" />
            <stop offset="50%" stopColor="#a855f7" />
            <stop offset="100%" stopColor="#6b21a8" />
          </linearGradient>

          <linearGradient id="goldTrophyGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#fef08a" />
            <stop offset="40%" stopColor="#f59e0b" />
            <stop offset="100%" stopColor="#b45309" />
          </linearGradient>

          <linearGradient id="pedestalGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#78350f" />
            <stop offset="100%" stopColor="#451a03" />
          </linearGradient>
        </defs>

        {/* 1. Medallion Outer Beveled Shield / Crest */}
        <polygon
          points="50,3 88,14 97,50 88,86 50,97 12,86 3,50 12,14"
          fill={`url(#${idPrefix}-rimGrad)`}
        />

        {/* 2. Medallion Inner Facet Cut */}
        <polygon
          points="50,7 84,17 92,50 84,83 50,93 16,83 8,50 16,17"
          fill="#18181b"
        />

        {/* 3. Core Radial Medallion Disc */}
        <circle
          cx="50"
          cy="50"
          r="38"
          fill={`url(#${idPrefix}-coreGlow)`}
          stroke={rarityColors.rimOuter}
          strokeWidth="1.5"
        />

        {/* 4. Engraved Concentric Inner Bevel */}
        <circle
          cx="50"
          cy="50"
          r="34"
          fill="none"
          stroke="#ffffff"
          strokeWidth="0.75"
          opacity="0.3"
        />

        {/* 5. The Thematic Artwork */}
        {renderEmblemArtwork()}

        {/* 6. Top Specular Highlight Glint */}
        <path
          d="M22 24 C32 14 68 14 78 24 C68 20 32 20 22 24 Z"
          fill="#ffffff"
          opacity="0.4"
        />

        {/* 7. Bottom Corner Rivets / Gems */}
        <circle cx="50" cy="91" r="2" fill={rarityColors.gemColor} />
        <circle cx="50" cy="9" r="1.5" fill="#ffffff" />
      </svg>
    </div>
  );
};
