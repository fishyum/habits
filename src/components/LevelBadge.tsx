import React from "react";

interface LevelBadgeProps {
  level: number;
  size?: number | string;
  className?: string;
  glowing?: boolean;
}

export function LevelBadge({
  level,
  size = 180,
  className = "",
  glowing = true,
}: LevelBadgeProps) {
  // Select color schemes based on level
  let themeColor = "#10b981"; // Level 1 (Green)
  let glowColor = "#22c55e";
  let labelText = "LEVEL 1";
  let subText = "— LEVEL 1 ENEMY — DEFEATED";

  if (level === 2) {
    themeColor = "#06b6d4"; // Level 2 (Cyan)
    glowColor = "#06b6d4";
    labelText = "LEVEL 2";
    subText = "— LEVEL 2 ENEMY — DEFEATED";
  } else if (level === 3) {
    themeColor = "#d946ef"; // Level 3 (Magenta/Purple)
    glowColor = "#d946ef";
    labelText = "LEVEL 3";
    subText = "— LEVEL 3 ENEMY — DEFEATED";
  }

  // Create SVG filters for real cyberpunk neon glow
  const filterId = `cyber-glow-lvl${level}`;

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 200 200"
      className={`select-none ${className}`}
      style={{ overflow: "visible" }}
    >
      <defs>
        {/* Real neon drop-shadow glow filter */}
        <filter id={filterId} x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="6" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>

        {/* Linear gradients for metallic effects */}
        <linearGradient id="metal-grad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#4b5563" />
          <stop offset="50%" stopColor="#1f2937" />
          <stop offset="100%" stopColor="#111827" />
        </linearGradient>

        <linearGradient id={`glow-grad-lvl${level}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={themeColor} stopOpacity="0.4" />
          <stop offset="100%" stopColor="#000000" stopOpacity="0.1" />
        </linearGradient>
      </defs>

      <g filter={glowing ? `url(#${filterId})` : undefined}>
        {/* 1. OUTER SHIELD FRAME */}
        {/* Draw the sturdy industrial shield outline */}
        <path
          d="
            M 100 22 
            L 115 22 
            L 118 32
            L 165 32
            L 174 48
            L 174 72
            L 160 84
            L 168 114
            L 150 142
            L 100 166
            L 50 142
            L 32 114
            L 40 84
            L 26 72
            L 26 48
            L 35 32
            L 82 32
            L 85 22
            Z
          "
          fill="url(#metal-grad)"
          stroke="#111111"
          strokeWidth="4"
          strokeLinejoin="bevel"
        />

        {/* Outer neon border highlight */}
        <path
          d="
            M 101 27 
            L 112 27 
            L 115 36
            L 161 36
            L 169 50
            L 169 70
            L 155 82
            L 163 112
            L 146 138
            L 100 160
            L 54 138
            L 37 112
            L 45 82
            L 31 70
            L 31 50
            L 39 36
            L 85 36
            L 88 27
            Z
          "
          fill="none"
          stroke={themeColor}
          strokeWidth="2.5"
          opacity="0.85"
          strokeLinejoin="bevel"
        />

        {/* 2. INNER GLOW FILL */}
        <path
          d="
            M 100 38
            L 158 38
            L 164 52
            L 164 68
            L 150 80
            L 158 110
            L 142 134
            L 100 154
            L 58 134
            L 42 110
            L 50 80
            L 36 68
            L 36 52
            L 42 38
            Z
          "
          fill={`url(#glow-grad-lvl${level})`}
        />

        {/* 3. HARDWARE DECORATION BOLTS & NOTCHES */}
        {/* Top Handle Detail */}
        <path
          d="M 88 22 L 88 15 L 112 15 L 112 22"
          fill="#111"
          stroke={themeColor}
          strokeWidth="1.5"
        />
        <rect x="94" y="11" width="12" height="4" rx="1" fill={themeColor} opacity="0.9" />

        {/* Corner tech notches */}
        <line x1="28" y1="60" x2="42" y2="60" stroke="#111111" strokeWidth="2.5" />
        <line x1="158" y1="60" x2="172" y2="60" stroke="#111111" strokeWidth="2.5" />
        <line x1="33" y1="94" x2="47" y2="94" stroke="#111111" strokeWidth="2.5" />
        <line x1="153" y1="94" x2="167" y2="94" stroke="#111111" strokeWidth="2.5" />

        {/* Active glowing indicator light bars */}
        <rect x="35" y="44" width="4" height="18" fill={themeColor} opacity="0.8" />
        <rect x="161" y="44" width="4" height="18" fill={themeColor} opacity="0.8" />

        {/* 4. CHASSIS INNER FRAME (The glowing inner pentagon/hexagon shield) */}
        <path
          d="
            M 100 68
            L 142 68
            L 150 94
            L 138 128
            L 100 138
            L 62 128
            L 50 94
            L 58 68
            Z
          "
          fill="#0c0a09"
          stroke="#111111"
          strokeWidth="3.5"
          strokeLinejoin="bevel"
        />
        <path
          d="
            M 100 71
            L 139 71
            L 146 92
            L 135 125
            L 100 134
            L 65 125
            L 54 92
            L 61 71
            Z
          "
          fill="none"
          stroke={themeColor}
          strokeWidth="2"
          opacity="0.9"
          strokeLinejoin="bevel"
        />

        {/* 5. CENTER GLOW STAR */}
        {/* Draw coordinates for a big stylized star centering at (100, 102) */}
        <polygon
          points="
            100,80
            105,94
            120,94
            108,103
            112,118
            100,109
            88,118
            92,103
            80,94
            95,94
          "
          fill={themeColor}
          opacity="0.9"
        />
        <polygon
          points="
            100,85
            103,94
            112,94
            105,100
            108,110
            100,104
            92,110
            95,100
            88,94
            97,94
          "
          fill="#ffffff"
          opacity="0.9"
        />

        {/* 6. BANNER & STARS AT BASE */}
        <path
          d="M 58 122 L 142 122 L 132 135 L 68 135 Z"
          fill="#171717"
          stroke="#111111"
          strokeWidth="2"
        />
        <g stroke={themeColor} strokeWidth="1.5" fill={themeColor}>
          {/* Three small green/cyan/magenta stars on banner */}
          {/* Star 1 */}
          <polygon points="80,125 82,129 86,129 83,131 84,135 80,133 76,135 77,131 74,129 78,129" />
          {/* Star 2 */}
          <polygon points="100,125 102,129 106,129 103,131 104,135 100,133 96,135 97,131 94,129 98,129" fill="#ffffff" stroke="#ffffff" />
          {/* Star 3 */}
          <polygon points="120,125 122,129 126,129 123,131 124,135 120,133 116,135 117,131 114,129 118,129" />
        </g>

        {/* 7. CLASSIC RETRO TEXT OVERLAYS */}
        <text
          x="100"
          y="49"
          fill={themeColor}
          fontSize="10"
          fontWeight="900"
          fontFamily="monospace"
          textAnchor="middle"
          letterSpacing="2.5"
          opacity="0.95"
        >
          {labelText}
        </text>
        <text
          x="100"
          y="60"
          fill="#ffffff"
          fontSize="12"
          fontWeight="900"
          fontFamily="sans-serif"
          textAnchor="middle"
          letterSpacing="2"
        >
          DEFEATED
        </text>
      </g>

      {/* Decorative subtitle text */}
      <text
        x="100"
        y="185"
        fill={themeColor}
        fontSize="8"
        fontWeight="800"
        fontFamily="monospace"
        textAnchor="middle"
        letterSpacing="1.2"
        opacity="0.85"
      >
        {subText}
      </text>
    </svg>
  );
}
