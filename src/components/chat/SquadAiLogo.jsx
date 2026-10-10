import React from 'react'

/**
 * SquadAiLogo — A glowing futuristic AI Robot logo matching the
 * Success Squad dark purple (#6366f1) and cyan (#06b6d4) theme.
 */
export default function SquadAiLogo({
  size = 28,
  className = '',
  isSpeaking = false,
  isGlowing = true,
  style = {}
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`squad-ai-robot-logo ${isSpeaking ? 'is-speaking' : ''} ${className}`}
      style={{
        display: 'inline-block',
        verticalAlign: 'middle',
        filter: isGlowing ? 'drop-shadow(0 0 8px rgba(6, 182, 212, 0.45))' : 'none',
        ...style
      }}
    >
      <defs>
        {/* Primary Purple-to-Cyan Linear Gradient */}
        <linearGradient id="squadHeadGrad" x1="15%" y1="0%" x2="85%" y2="100%">
          <stop offset="0%" stopColor="#818cf8" />
          <stop offset="45%" stopColor="#6366f1" />
          <stop offset="100%" stopColor="#06b6d4" />
        </linearGradient>

        {/* Visor Dark Glass Gradient */}
        <linearGradient id="squadVisorGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#0c0e1e" />
          <stop offset="100%" stopColor="#121633" />
        </linearGradient>

        {/* Cyan Neon Eye / Beacon Gradient */}
        <linearGradient id="squadCyanNeon" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#67e8f9" />
          <stop offset="100%" stopColor="#06b6d4" />
        </linearGradient>

        {/* Ear Pod Metallic Gradient */}
        <linearGradient id="squadEarGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#312e81" />
          <stop offset="50%" stopColor="#4338ca" />
          <stop offset="100%" stopColor="#0891b2" />
        </linearGradient>

        {/* Glowing Filter for Eyes and Beacon */}
        <filter id="squadEyeGlow" x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur stdDeviation="2.5" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* ── Antenna / Cyber Crest ── */}
      {/* Antenna Pole */}
      <rect x="47.5" y="6" width="5" height="15" rx="2.5" fill="url(#squadHeadGrad)" />
      {/* Top Antenna Beacon (Pulsing Glow) */}
      <circle
        cx="50"
        cy="7"
        r="6"
        fill="url(#squadCyanNeon)"
        filter="url(#squadEyeGlow)"
        className="squad-robot-beacon"
      />
      <circle cx="50" cy="7" r="2.5" fill="#ffffff" />

      {/* ── Outer Head Chassis ── */}
      <rect
        x="18"
        y="18"
        width="64"
        height="56"
        rx="20"
        fill="url(#squadHeadGrad)"
      />

      {/* Chassis Top Highlight Rim */}
      <path
        d="M 28 20 Q 50 17 72 20"
        stroke="#c7d2fe"
        strokeWidth="2.5"
        strokeLinecap="round"
        opacity="0.8"
      />

      {/* ── Ear Headphones / Modules ── */}
      {/* Left Ear */}
      <rect x="10" y="34" width="9" height="24" rx="4.5" fill="url(#squadEarGrad)" />
      <circle cx="14" cy="46" r="2.5" fill="#22d3ee" filter="url(#squadEyeGlow)" />

      {/* Right Ear */}
      <rect x="81" y="34" width="9" height="24" rx="4.5" fill="url(#squadEarGrad)" />
      <circle cx="86" cy="46" r="2.5" fill="#22d3ee" filter="url(#squadEyeGlow)" />

      {/* ── Dark Curved Visor Glass ── */}
      <rect
        x="24"
        y="25"
        width="52"
        height="42"
        rx="14"
        fill="url(#squadVisorGrad)"
        stroke="rgba(6, 182, 212, 0.4)"
        strokeWidth="1.5"
      />

      {/* Visor Glare / Reflection Accent */}
      <path
        d="M 28 30 L 44 30 L 38 35 L 28 35 Z"
        fill="#ffffff"
        opacity="0.12"
      />

      {/* ── Glowing AI Cyber Eyes ── */}
      {/* Left Eye */}
      <g filter="url(#squadEyeGlow)" className="squad-robot-left-eye">
        <rect
          x="32"
          y="35"
          width="11"
          height="12"
          rx="5"
          fill="url(#squadCyanNeon)"
        />
        <circle cx="37.5" cy="39" r="2" fill="#ffffff" />
      </g>

      {/* Right Eye */}
      <g filter="url(#squadEyeGlow)" className="squad-robot-right-eye">
        <rect
          x="57"
          y="35"
          width="11"
          height="12"
          rx="5"
          fill="url(#squadCyanNeon)"
        />
        <circle cx="62.5" cy="39" r="2" fill="#ffffff" />
      </g>

      {/* ── Mouth / Audio Waveform Display ── */}
      {isSpeaking ? (
        /* Dynamic Speaking Equalizer Waveform */
        <g filter="url(#squadEyeGlow)" className="squad-robot-speaking-mouth">
          <rect x="36" y="53" width="3.5" height="7" rx="1.5" fill="#22d3ee">
            <animate attributeName="height" values="4;9;3;8;4" dur="0.6s" repeatCount="indefinite" />
            <animate attributeName="y" values="55;51;55;51;55" dur="0.6s" repeatCount="indefinite" />
          </rect>
          <rect x="42" y="51" width="3.5" height="11" rx="1.5" fill="#38bdf8">
            <animate attributeName="height" values="7;13;5;12;7" dur="0.5s" repeatCount="indefinite" />
            <animate attributeName="y" values="53;49;54;50;53" dur="0.5s" repeatCount="indefinite" />
          </rect>
          <rect x="48" y="50" width="4" height="13" rx="2" fill="#67e8f9">
            <animate attributeName="height" values="8;15;6;14;8" dur="0.55s" repeatCount="indefinite" />
            <animate attributeName="y" values="52;48;53;49;52" dur="0.55s" repeatCount="indefinite" />
          </rect>
          <rect x="54" y="51" width="3.5" height="11" rx="1.5" fill="#38bdf8">
            <animate attributeName="height" values="6;12;4;11;6" dur="0.48s" repeatCount="indefinite" />
            <animate attributeName="y" values="53;49;55;50;53" dur="0.48s" repeatCount="indefinite" />
          </rect>
          <rect x="60" y="53" width="3.5" height="7" rx="1.5" fill="#22d3ee">
            <animate attributeName="height" values="4;8;3;7;4" dur="0.58s" repeatCount="indefinite" />
            <animate attributeName="y" values="55;52;55;52;55" dur="0.58s" repeatCount="indefinite" />
          </rect>
        </g>
      ) : (
        /* Cute Cyber Smile / LED Bar */
        <g filter="url(#squadEyeGlow)">
          <path
            d="M 40 54 Q 50 60 60 54"
            stroke="url(#squadCyanNeon)"
            strokeWidth="3.2"
            strokeLinecap="round"
          />
        </g>
      )}

      {/* ── Robotic Neck Collar Plate ── */}
      <path
        d="M 37 77 L 63 77 L 59 86 L 41 86 Z"
        fill="url(#squadHeadGrad)"
        opacity="0.9"
      />
      <line x1="43" y1="81" x2="57" y2="81" stroke="#22d3ee" strokeWidth="2" strokeLinecap="round" />
    </svg>
  )
}
