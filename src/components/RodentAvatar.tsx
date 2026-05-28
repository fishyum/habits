import React from "react";

interface RodentAvatarProps {
  coat?: string | null;
  goggles?: string | null;
  tail?: string | null;
  hat?: string | null;
  utility?: string | null;
  size?: number | string;
  className?: string;
}

export function RodentAvatar({
  coat,
  goggles,
  tail,
  hat,
  utility,
  size = 76,
  className = "",
}: RodentAvatarProps) {
  // We draw a gorgeous, high-fidelity cyber rodent detective based strictly on the original reference image.
  // The proportions feature a sleek determined mouse head, a cowl draping over the head with ears sticking out,
  // a long flowing tactical trench coat, a mechanical grappling hook tail, and a silenced pistol.
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 120 120"
      className={`select-none ${className}`}
      style={{ imageRendering: "pixelated" }}
    >
      <defs>
        {/* Shadow filter for neon glow effects */}
        <filter id="neon-glow-cyan" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="2" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        <filter id="neon-glow-red" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="1.5" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        
        {/* Fur and Shading Gradients */}
        <linearGradient id="furGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#aa8d75" />
          <stop offset="50%" stopColor="#8A735E" />
          <stop offset="100%" stopColor="#5d4c3e" />
        </linearGradient>
        <linearGradient id="innerEarGrad" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#fca5a5" />
          <stop offset="100%" stopColor="#ef4444" stopOpacity="0.6" />
        </linearGradient>
        <linearGradient id="eyeVisorGrad" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#fbbf24" />
          <stop offset="50%" stopColor="#f59e0b" />
          <stop offset="100%" stopColor="#d97706" />
        </linearGradient>

        {/* Outfit Gradients */}
        <linearGradient id="trenchcoatGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#2c303a" />
          <stop offset="100%" stopColor="#11131a" />
        </linearGradient>
        <linearGradient id="cloakGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#b91c1c" />
          <stop offset="60%" stopColor="#7f1d1d" />
          <stop offset="100%" stopColor="#450a0a" />
        </linearGradient>
        <linearGradient id="reconGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#1e293b" />
          <stop offset="100%" stopColor="#0f172a" />
        </linearGradient>
        <linearGradient id="neonGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#1a0b2e" />
          <stop offset="100%" stopColor="#0a0514" />
        </linearGradient>
        <linearGradient id="arcticGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#f8fafc" />
          <stop offset="50%" stopColor="#cbd5e1" />
          <stop offset="100%" stopColor="#64748b" />
        </linearGradient>
        
        {/* Metallic Grapple Gradient */}
        <linearGradient id="metalGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#cbd5e1" stopOpacity="0.9" />
          <stop offset="10%" stopColor="#94a3b8" />
          <stop offset="100%" stopColor="#334155" />
        </linearGradient>
      </defs>

      {/* 1. GROUND CYBER SHADOW */}
      <ellipse cx="60" cy="106" rx="42" ry="7" fill="#020617" opacity="0.45" />
      {/* Dynamic pulse echo helper lines around shadow */}
      <ellipse cx="60" cy="106" rx="46" ry="8.5" fill="none" stroke="#22d3ee" strokeWidth="0.5" strokeDasharray="3,6" opacity="0.25" />

      {/* 2. TAIL SYSTEM (Placed behind the body for depth correctness) */}
      {/* Ribbed mouse tail segment curves up to the left holding grapple claws */}
      <g id="tail_upgrades">
        {!tail ? (
          // S-Rank Standard cyber grappling tail from the original artwork
          <g>
            {/* Guide curve path */}
            <path
              d="M 45 88 Q 18 84 21 54 Q 23 32 38 34"
              fill="none"
              stroke="#544336"
              strokeWidth="5"
              strokeLinecap="round"
            />
            <path
              d="M 45 88 Q 18 84 21 54 Q 23 32 38 34"
              fill="none"
              stroke="#ab8d75"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeDasharray="4,2"
            />
            {/* default high-fidelity metal grapple hook at the tip of the tail */}
            <g transform="translate(38, 34) rotate(-35)">
              <circle cx="0" cy="0" r="3.5" fill="#334155" stroke="#0f172a" strokeWidth="1" />
              <path d="M 0 0 L -6 -8 M 0 0 L 1 -11 M 0 0 L 7 -8 M 0 0 L 3 -3" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" />
              {/* Grapple loops */}
              <path d="M -6 -8 Q -10 -9 -8 -5" fill="none" stroke="#64748b" strokeWidth="1.5" strokeLinecap="round" />
              <path d="M 7 -8 Q 11 -9 9 -5" fill="none" stroke="#64748b" strokeWidth="1.5" strokeLinecap="round" />
            </g>
          </g>
        ) : tail === "item_antenna" ? (
          <g>
            <path d="M 45 88 Q 18 84 21 54 Q 23 32 38 34" fill="none" stroke="#475569" strokeWidth="5.5" strokeLinecap="round" />
            <path d="M 45 88 Q 18 84 21 54 Q 23 32 38 34" fill="none" stroke="#00cbff" strokeWidth="1" strokeDasharray="2,3" />
            <g transform="translate(38, 34)">
              <circle cx="0" cy="0" r="5" fill="#1e293b" stroke="#00cbff" strokeWidth="1.5" />
              <line x1="0" y1="0" x2="6" y2="-12" stroke="#cbd5e1" strokeWidth="2" />
              <circle cx="6" cy="-12" r="3" fill="#22d3ee" filter="url(#neon-glow-cyan)" />
              {/* Cyan electric arc sparks */}
              <path d="M 4 -16 L 2 -22 M 10 -14 L 16 -16" stroke="#22d3ee" strokeWidth="1.5" strokeLinecap="round" />
            </g>
          </g>
        ) : tail === "item_hook" ? (
          <g>
            {/* Mega magnetic grappling anchor */}
            <path d="M 45 88 Q 18 84 21 54 Q 23 32 38 34" fill="none" stroke="#334155" strokeWidth="6" strokeLinecap="round" />
            <path d="M 45 88 Q 18 84 21 54 Q 23 32 38 34" fill="none" stroke="#cbd5e1" strokeWidth="2" strokeDasharray="3,1" />
            <g transform="translate(38,34) rotate(-15)">
              <rect x="-4" y="-4" width="8" height="8" rx="1.5" fill="#1e293b" stroke="#475569" strokeWidth="1.5" />
              <path d="M -4 -4 L -12 -12 Q -18 -8 -13 0" fill="none" stroke="url(#metalGrad)" strokeWidth="3" strokeLinecap="round" />
              <path d="M 4 -4 L 12 -12 Q 18 -8 13 0" fill="none" stroke="url(#metalGrad)" strokeWidth="3" strokeLinecap="round" />
              <path d="M 0 -4 L 0 -16" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round" />
            </g>
          </g>
        ) : tail === "item_jammer" ? (
          <g>
            <path d="M 45 88 Q 18 84 21 54 Q 23 32 38 34" fill="none" stroke="#27272a" strokeWidth="5" strokeLinecap="round" />
            <g transform="translate(38,34)">
              <circle cx="0" cy="0" r="6" fill="#eab308" stroke="#78350f" strokeWidth="2" />
              <circle cx="0" cy="0" r="2" fill="#fff" />
              {/* Concentric warning telemetry waves */}
              <circle cx="0" cy="0" r="12" fill="none" stroke="#eab308" strokeWidth="1" strokeDasharray="4,4" className="animate-ping" style={{ transformOrigin: "38px 34px" }} />
              <circle cx="0" cy="0" r="20" fill="none" stroke="#fbbf24" strokeWidth="0.5" strokeDasharray="2,5" opacity="0.5" />
            </g>
          </g>
        ) : tail === "item_grapple" ? (
          <g>
            <path d="M 45 88 Q 18 84 21 54 Q 23 32 38 34" fill="none" stroke="#0f172a" strokeWidth="6" strokeLinecap="round" />
            <g transform="translate(38,34) rotate(-45)">
              {/* Plasma emitting core */}
              <path d="M -5 0 L 5 0 L 0 -12 Z" fill="#38bdf8" />
              <polygon points="-8,-4 8,-4 0,-18" fill="none" stroke="#00cbff" strokeWidth="2" filter="url(#neon-glow-cyan)" />
              <line x1="0" y1="0" x2="0" y2="-22" stroke="#e0f2fe" strokeWidth="2.5" />
            </g>
          </g>
        ) : tail === "item_claw" ? (
          <g>
            <path d="M 45 88 Q 18 84 21 54 Q 23 32 38 34" fill="none" stroke="#52525b" strokeWidth="5.5" strokeLinecap="round" />
            <g transform="translate(38,34) rotate(-20)">
              <circle cx="0" cy="0" r="4" fill="#3f3f46" />
              {/* Tri-claw mechanical pincher prongs */}
              <path d="M -4 -2 Q -12 -14 -6 -18" fill="none" stroke="#94a3b8" strokeWidth="2.5" strokeLinecap="round" />
              <path d="M 4 -2 Q 12 -14 6 -18" fill="none" stroke="#94a3b8" strokeWidth="2.5" strokeLinecap="round" />
              <path d="M 0 -4 L 0 -16" stroke="#ef4444" strokeWidth="2" />
            </g>
          </g>
        ) : null}
      </g>

      {/* 3. COATS & OUTFITS - BACKSIDE FLOWING CAPE/TRENCHCOAT TAILS */}
      {/* This renders the dynamic wind-blown coat flap on the left side */}
      <g id="outfit_backside_wings">
        {(!coat || coat === "item_trenchcoat") && (
          <path
            d="M 46 64 C 32 70 24 82 20 98 C 30 102 44 98 48 88 Z"
            fill="url(#trenchcoatGrad)"
            stroke="#0f1218"
            strokeWidth="2.5"
          />
        )}
        {coat === "item_cloak" && (
          <path
            d="M 44 64 C 28 68 18 80 12 98 C 24 104 42 100 46 88 Z"
            fill="url(#cloakGrad)"
            stroke="#450a0a"
            strokeWidth="2.5"
          />
        )}
        {coat === "item_recon" && (
          <path
            d="M 46 64 C 34 68 28 78 25 94 C 32 98 42 94 48 86 Z"
            fill="url(#reconGrad)"
            stroke="#020617"
            strokeWidth="2"
          />
        )}
        {coat === "item_vest" && (
          <path
            d="M 46 64 C 38 72 34 82 32 92 C 38 95 45 92 48 86 Z"
            fill="#78350f"
            stroke="#451a03"
            strokeWidth="1.5"
          />
        )}
        {coat === "item_neon" && (
          <g>
            <path
              d="M 46 64 C 32 70 24 82 20 98 C 30 102 44 98 48 88 Z"
              fill="url(#neonGrad)"
              stroke="#0a0514"
              strokeWidth="2.5"
            />
            {/* Glowing neon circuit outline flaring along cape */}
            <path
              d="M 41 68 C 30 74 24 84 22 95"
              fill="none"
              stroke="#c084fc"
              strokeWidth="2"
              filter="url(#neon-glow-red)"
            />
          </g>
        )}
        {coat === "item_arctic" && (
          <path
            d="M 44 62 C 26 68 18 80 15 99 C 28 103 44 98 47 88 Z"
            fill="url(#arcticGrad)"
            stroke="#475569"
            strokeWidth="3"
          />
        )}
      </g>

      {/* 4. BASE BODY MODULE (Paws and legs under dark straps) */}
      <g id="base_legs">
        {/* Rear leg / thigh holster wrapper */}
        <ellipse cx="40" cy="94" rx="6" ry="10" fill="#4d3f35" stroke="#1c1b19" strokeWidth="2.5" />
        {/* Foot Left */}
        <g transform="translate(35, 96)">
          <rect x="0" y="0" width="8" height="11" rx="3" fill="#ab8d75" stroke="#1c1b19" strokeWidth="2.5" />
          {/* Paw wrappings */}
          <line x1="0" y1="4" x2="8" y2="4" stroke="#1e293b" strokeWidth="1.5" />
          <line x1="0" y1="7" x2="8" y2="7" stroke="#1e293b" strokeWidth="1.5" />
        </g>

        {/* Front leg */}
        <ellipse cx="62" cy="94" rx="7" ry="11" fill="#4d3f35" stroke="#1c1b19" strokeWidth="2.5" />
        {/* Foot Right */}
        <g transform="translate(58, 96)">
          <rect x="0" y="0" width="9" height="11" rx="3" fill="#ab8d75" stroke="#1c1b19" strokeWidth="2.5" />
          {/* Paw wrappings */}
          <line x1="0" y1="4" x2="9" y2="4" stroke="#1e293b" strokeWidth="1.5" />
          <line x1="0" y1="7" x2="9" y2="7" stroke="#1e293b" strokeWidth="1.5" />
        </g>
      </g>

      {/* 5. COATS & OUTFITS - TORSO & CHEST LAYER (Detailed overlays with straps) */}
      <g id="outfits_torso">
        {(!coat || coat === "item_trenchcoat") && (
          <g>
            {/* Charcoal black technical tactical vest coat combo */}
            <path
              d="M 44 56 L 76 56 Q 80 72 76 96 L 44 96 Q 40 76 44 56 Z"
              fill="url(#trenchcoatGrad)"
              stroke="#0f1115"
              strokeWidth="2.5"
            />
            {/* Layered chest vest plates */}
            <path d="M 46 64 H 74" stroke="#1e293b" strokeWidth="4.5" />
            <path d="M 46 74 H 74" stroke="#1e293b" strokeWidth="4.5" />
            
            {/* Tactical straps criscrossing */}
            <line x1="44" y1="58" x2="74" y2="88" stroke="#090a0f" strokeWidth="2.5" />
            <line x1="74" y1="58" x2="44" y2="88" stroke="#090a0f" strokeWidth="2.5" />

            {/* Brass golden buckles */}
            <rect x="56" y="67" width="5" height="5" rx="1" fill="#fbbf24" stroke="#78350f" strokeWidth="1" />
            <rect x="56" y="80" width="5" height="5" rx="1" fill="#fbbf24" stroke="#78350f" strokeWidth="1" />
          </g>
        )}

        {coat === "item_cloak" && (
          <g>
            {/* Crimson rich flowing high collar cloak */}
            <path
              d="M 42 54 L 78 54 Q 84 72 78 96 L 42 96 Q 36 74 42 54 Z"
              fill="url(#cloakGrad)"
              stroke="#450a0a"
              strokeWidth="2.5"
            />
            {/* Folding cowl neck overlays */}
            <path d="M 42 54 L 60 76 L 78 54" fill="#5c0707" stroke="#450a0a" strokeWidth="1.5" />
            
            {/* Gold metallic brand emblem on left breast */}
            <polygon points="48,65 52,61 56,65 52,69" fill="#facc15" stroke="#854d0e" strokeWidth="1" />
          </g>
        )}

        {coat === "item_recon" && (
          <g>
            {/* Sleek tactical Midnight Recon armor suit */}
            <path
              d="M 44 56 L 76 56 L 74 94 L 46 94 Z"
              fill="url(#reconGrad)"
              stroke="#020617"
              strokeWidth="2.5"
            />
            {/* Glowing amber sensor core strips */}
            <line x1="60" y1="58" x2="60" y2="92" stroke="#ea580c" strokeWidth="3" strokeLinecap="round" />
            <line x1="60" y1="58" x2="60" y2="92" stroke="#fbbf24" strokeWidth="1" strokeLinecap="round" />

            {/* Segmented tactical side padding */}
            <path d="M 45 66 H 54 M 45 76 H 54 M 45 86 H 54" stroke="#1e293b" strokeWidth="2" />
            <path d="M 66 66 H 75 M 66 76 H 75 M 66 86 H 75" stroke="#1e293b" strokeWidth="2" />
          </g>
        )}

        {coat === "item_vest" && (
          <g>
            {/* Tweed checked vest set over white dress shirt */}
            <path
              d="M 44 56 L 76 56 L 74 94 L 46 94 Z"
              fill="#e4e4e7"
              stroke="#1c1b19"
              strokeWidth="2"
            />
            {/* Checked tweed overlay vest panel */}
            <path
              d="M 44 62 L 76 62 L 72 94 L 48 94 Z"
              fill="#d97706"
              stroke="#78350f"
              strokeWidth="1.5"
            />
            {/* Plaid lines */}
            <line x1="52" y1="62" x2="52" y2="94" stroke="#451a03" strokeWidth="1" strokeDasharray="2,2" />
            <line x1="68" y1="62" x2="68" y2="94" stroke="#451a03" strokeWidth="1" strokeDasharray="2,2" />
            <line x1="44" y1="78" x2="76" y2="78" stroke="#451a03" strokeWidth="1" strokeDasharray="2,2" />

            {/* Tie inside shirt */}
            <polygon points="57,56 63,56 60,66" fill="#18181b" />
          </g>
        )}

        {coat === "item_neon" && (
          <g>
            {/* Technical cyber jacket containing bright pulsing neon traces */}
            <path
              d="M 44 56 L 76 56 L 74 96 L 46 96 Z"
              fill="url(#neonGrad)"
              stroke="#0f051d"
              strokeWidth="2.5"
            />
            {/* Neon circuit paths glowing cyan/purple */}
            <path
              d="M 48 64 H 72 M 48 76 H 72 M 60 56 V 96"
              fill="none"
              stroke="#a855f7"
              strokeWidth="2.5"
              strokeLinecap="round"
              filter="url(#neon-glow-red)"
            />
            <path
              d="M 52 64 H 68 M 60 60 V 90"
              fill="none"
              stroke="#22d3ee"
              strokeWidth="1.2"
              strokeLinecap="round"
              filter="url(#neon-glow-cyan)"
            />
          </g>
        )}

        {coat === "item_arctic" && (
          <g>
            {/* Padded sub-zero arctic extreme jacket */}
            <path
              d="M 42 54 L 78 54 Q 84 72 78 96 L 42 96 Q 36 74 42 54 Z"
              fill="url(#arcticGrad)"
              stroke="#475569"
              strokeWidth="3"
            />
            {/* Horizontal padding block structures */}
            <line x1="42" y1="66" x2="78" y2="66" stroke="#94a3b8" strokeWidth="3.5" />
            <line x1="42" y1="78" x2="78" y2="78" stroke="#94a3b8" strokeWidth="3.5" />
            
            {/* Center zipper details */}
            <line x1="60" y1="54" x2="60" y2="96" stroke="#ef4444" strokeWidth="2.5" />
            <line x1="60" y1="54" x2="60" y2="96" stroke="#fca5a5" strokeWidth="1" />
          </g>
        )}
      </g>

      {/* 6. FRONT ARMS & WEAPON MODULE (Aiming high-fidelity silencer gun) */}
      <g id="front_arms">
        {/* Left hand / rear arm resting on holster */}
        <path d="M 43 65 Q 36 74 40 82" fill="none" stroke="#5d4c3e" strokeWidth="5" strokeLinecap="round" />
        <circle cx="40" cy="82" r="3.5" fill="#ab8d75" stroke="#1c1b19" strokeWidth="1" />

        {/* Right arm aiming forward/sideways holding silenced tactical handgun */}
        <g id="aiming_gun">
          {/* Paw sleeve */}
          {coat === "item_arctic" ? (
            <path d="M 70 68 Q 80 66 84 75" fill="none" stroke="url(#arcticGrad)" strokeWidth="6" strokeLinecap="round" />
          ) : coat === "item_cloak" ? (
            <path d="M 70 68 Q 80 66 84 75" fill="none" stroke="url(#cloakGrad)" strokeWidth="5.5" strokeLinecap="round" />
          ) : (
            <path d="M 70 68 Q 80 66 84 75" fill="none" stroke="url(#trenchcoatGrad)" strokeWidth="5" strokeLinecap="round" />
          )}

          {/* Mouse fur paw hand */}
          <circle cx="84" cy="75" r="3.5" fill="#ab8d75" stroke="#1c1b19" strokeWidth="1" />

          {/* S-Rank Silencer Pistol / Cyber Handgun */}
          <g transform="translate(84, 75) rotate(15)">
            {/* Pistol body */}
            <rect x="1" y="-3" width="12" height="5" fill="#1e293b" stroke="#020617" strokeWidth="1.5" />
            {/* Long Tactical Silencer barrel barrel */}
            <rect x="13" y="-3" width="14" height="3" fill="#0f172a" stroke="#000" strokeWidth="1" />
            {/* Scope details */}
            <rect x="3" y="-5" width="6" height="2.5" fill="#000" />
            <circle cx="9" cy="-4" r="0.5" fill="#22d3ee" />
            {/* Gun grip/handle */}
            <rect x="2" y="2" width="4.5" height="7" fill="#475569" stroke="#000" strokeWidth="1.2" transform="rotate(25)" />
            {/* Core muzzle energy flare simulation */}
            <circle cx="28" cy="-1.5" r="1.5" fill="#ef4444" className="animate-pulse" />
          </g>
        </g>
      </g>

      {/* 7. HIGH-FIDELITY COGNITIVE S-RANK HEAD & COWL (Fidelity over default) */}
      <g id="head_and_cowl">
        {/* We place the head center at (60, 38) pointing towards the right */}
        {/* Core face fur base element with long determined nose bridge */}
        <path
          d="M 44 42 C 44 26 74 26 77 42 C 77 46 68 53 58 53 C 48 53 44 46 44 42 Z"
          fill="url(#furGrad)"
          stroke="#1c1b19"
          strokeWidth="3"
        />

        {/* Elegant rodent ears poking dynamically through head cowl holes */}
        {/* Left Ear */}
        <g id="left_ear_poking">
          <circle cx="43" cy="24" r="13" fill="#5d4c3e" stroke="#1c1b19" strokeWidth="3" />
          <path d="M 43 11 C 33 11 32 30 43 36 Z" fill="url(#innerEarGrad)" />
        </g>
        {/* Right Ear */}
        <g id="right_ear_poking">
          <circle cx="77" cy="24" r="13" fill="#5d4c3e" stroke="#1c1b19" strokeWidth="3" />
          <path d="M 77 11 C 87 11 88 30 77 36 Z" fill="url(#innerEarGrad)" />
        </g>

        {/* DETERMINED COWL/HOOD WRAP OVER HEAD */}
        {/* This represents the dark detective cowl covering the neck and crown */}
        {coat === "item_arctic" ? (
          <path
            d="M 41 40 Q 36 18 60 18 Q 84 18 79 40 Q 84 52 60 52 Q 36 52 41 40 Z"
            fill="none"
            stroke="url(#arcticGrad)"
            strokeWidth="6.5"
          />
        ) : coat === "item_cloak" ? (
          <path
            d="M 41 40 Q 36 18 60 18 Q 84 18 79 40 Q 84 52 60 52 Q 36 52 41 40 Z"
            fill="none"
            stroke="url(#cloakGrad)"
            strokeWidth="5.5"
          />
        ) : (
          <path
            d="M 41 40 Q 36 18 60 18 Q 84 18 79 40 Q 84 52 60 52 Q 36 52 41 40 Z"
            fill="none"
            stroke="url(#trenchcoatGrad)"
            strokeWidth="5"
          />
        )}

        {/* Detailed Whiskers extending outwards with sharp strokes */}
        <g stroke="#373026" strokeWidth="1.2" strokeLinecap="round" opacity="0.85">
          {/* Left cheek whiskers */}
          <line x1="42" y1="46" x2="28" y2="44" />
          <line x1="41" y1="50" x2="26" y2="52" />
          {/* Right cheek whiskers */}
          <line x1="78" y1="46" x2="92" y2="44" />
          <line x1="79" y1="50" x2="94" y2="52" />
        </g>

        {/* Snout with determined pink/black cyber spy nose tip */}
        <polygon points="56,48 64,48 60,53" fill="#ffa5a5" stroke="#1c1b19" strokeWidth="1.5" />
        
        {/* Core S-Rank Spy Eyes (Active by default, overlays with visor/goggles) */}
        <g id="standard_eyes">
          {/* Left Eye */}
          <circle cx="50" cy="38" r="3.2" fill="#18181b" />
          <circle cx="51.2" cy="36.8" r="0.9" fill="#ffffff" />
          {/* Right Eye */}
          <circle cx="70" cy="38" r="3.2" fill="#18181b" />
          <circle cx="71.2" cy="36.8" r="0.9" fill="#ffffff" />
        </g>
      </g>

      {/* 8. ACTIVE HAT WRAPPERS (Rendered elegantly on top of cowl/ears) */}
      <g id="shop_hats">
        {hat === "item_fedora" && (
          <g transform="translate(60, 16) scale(1.1)">
            {/* Noir detective fedora pulled extremely low */}
            <ellipse cx="0" cy="0" rx="19" ry="3.5" fill="#1e293b" stroke="#020617" strokeWidth="2" />
            <path d="M -13 0 L -10 -15 Q 0 -18 10 -15 L 13 0 Z" fill="#1e293b" stroke="#020617" strokeWidth="2" />
            {/* Orange glowing band stripe */}
            <path d="M -12.5 -3 L -11.5 -7 H 11.5 L 12.5 -3 Z" fill="#ea580c" />
          </g>
        )}

        {hat === "item_beret" && (
          <g transform="translate(60, 15) rotate(-10)">
            <path d="M -16 4 C -16 -8 16 -8 16 0 C 16 6 10 9 0 8 C -8 7 -16 4 -16 4 Z" fill="#991b1b" stroke="#450a0a" strokeWidth="2.5" />
            {/* Gold clearance star shield */}
            <polygon points="-2,1 0,-3 2,1 -2,-2 2,-2" fill="#facc15" stroke="#78350f" strokeWidth="0.8" />
          </g>
        )}

        {hat === "item_hoodcap" && (
          <g transform="translate(60, 18)">
            {/* Deep snug stealth hood cowl wrap */}
            <path d="M -18 10 C -18 -8 18 -8 18 10" fill="none" stroke="#020617" strokeWidth="3" />
          </g>
        )}

        {hat === "item_cyberhat" && (
          <g transform="translate(60, 14)">
            {/* High-tech intelligence military visor cap */}
            <polygon points="-16,4 16,4 12,-8 -12,-8" fill="#0f172a" stroke="#1e293b" strokeWidth="2" />
            <line x1="-15" y1="-1" x2="15" y2="-1" stroke="#d8b4fe" strokeWidth="3" filter="url(#neon-glow-red)" />
            <line x1="-15" y1="-1" x2="15" y2="-1" stroke="#a855f7" strokeWidth="1" />
          </g>
        )}

        {hat === "item_headset" && (
          <g transform="translate(60, 26)">
            {/* Comms carbon brace running across head */}
            <path d="M -16 -4 A 16 16 0 0 1 16 -4" fill="none" stroke="#334155" strokeWidth="3" />
            {/* Glowing ear muffs */}
            <rect x="-21" y="-8" width="6" height="12" rx="2.5" fill="#f59e0b" stroke="#78350f" strokeWidth="1.5" />
            <rect x="15" y="-8" width="6" height="12" rx="2.5" fill="#f59e0b" stroke="#78350f" strokeWidth="1.5" />
            {/* Receiver wire mic pointing to his mouth */}
            <path d="M -18 4 Q -12 14 -3 10" fill="none" stroke="#475569" strokeWidth="1.8" />
            <circle cx="-3" cy="10" r="1.5" fill="#ef4444" />
          </g>
        )}

        {hat === "item_crown" && (
          <g transform="translate(60, 14) rotate(5)">
            {/* Cracked legendary gold crown peaks */}
            <path d="M -14 6 L -11 -6 L -4 1 L 0 -8 L 4 1 L 11 -6 L 14 6 Z" fill="#eab308" stroke="#78350f" strokeWidth="2" />
            {/* Glowing emerald gemstone insert */}
            <circle cx="0" cy="-1.5" r="2.2" fill="#10b981" />
            <line x1="-6" y1="-2" x2="-4" y2="5" stroke="#451a03" strokeWidth="1" />
          </g>
        )}
      </g>

      {/* 9. GOGGLES & EYE GEAR (Overlaid properly on top of eyes) */}
      <g id="shop_goggles">
        {goggles === "item_goggles" && (
          <g transform="translate(60, 38)">
            {/* Double glowing infrared scanners */}
            <rect x="-15" y="-6" width="30" height="12" rx="3.5" fill="#0f172a" stroke="#020617" strokeWidth="1.8" />
            {/* Left and Right Glowing RED lens segments */}
            <circle cx="-8.5" cy="0" r="4.5" fill="#ef4444" stroke="#7f1d1d" strokeWidth="1.2" />
            <circle cx="8.5" cy="0" r="4.5" fill="#ef4444" stroke="#7f1d1d" strokeWidth="1.2" />
            {/* Highlight reflections */}
            <rect x="-9.8" y="-1.5" width="2" height="2" fill="#fff" />
            <rect x="7.2" y="-1.5" width="2" height="2" fill="#fff" />
            {/* Secure strap sides */}
            <line x1="-15" y1="0" x2="-22" y2="0" stroke="#111" strokeWidth="3" />
            <line x1="15" y1="0" x2="22" y2="0" stroke="#111" strokeWidth="3" />
          </g>
        )}

        {goggles === "item_visor" ? (
          <g transform="translate(60, 38)">
            {/* The iconic sleek visor screen with high-fidelity scanlines and glowing amber border */}
            <polygon points="-16,-5 16,-5 13,4 -13,4" fill="url(#eyeVisorGrad)" stroke="#b45309" strokeWidth="1.8" filter="url(#neon-glow-red)" />
            {/* Scanline pattern */}
            <line x1="-14" y1="-2" x2="14" y2="-2" stroke="#ffffff" strokeWidth="1.5" opacity="0.65" />
            <line x1="-13" y1="1" x2="13" y2="1" stroke="#ffffff" strokeWidth="0.8" opacity="0.4" />
            {/* Temple wings */}
            <line x1="-16" y1="-2" x2="-21" y2="-2" stroke="#000" strokeWidth="2.5" />
            <line x1="16" y1="-2" x2="21" y2="-2" stroke="#000" strokeWidth="2.5" />
          </g>
        ) : goggles === "item_lens" ? (
          <g transform="translate(70, 38)">
            {/* Cracked monochrome diagnostic glass over right eye */}
            <circle cx="0" cy="0" r="7" fill="none" stroke="#eab308" strokeWidth="2.2" />
            <circle cx="0" cy="0" r="6" fill="#34d399" opacity="0.85" />
            {/* Crack lines */}
            <line x1="-4.5" y1="-3" x2="4.5" y2="3" stroke="#fff" strokeWidth="1" />
            <line x1="3" y1="-4" x2="-2.5" y2="2.5" stroke="#fff" strokeWidth="0.8" />
          </g>
        ) : goggles === "item_hacker" ? (
          <g transform="translate(60, 38)">
            {/* Double round green matrix HUD displays */}
            <circle cx="-8.5" cy="0" r="5.5" fill="#10b981" stroke="#047857" strokeWidth="1.8" opacity="0.85" />
            <circle cx="8.5" cy="0" r="5.5" fill="#10b981" stroke="#047857" strokeWidth="1.8" opacity="0.85" />
            <line x1="-3" y1="0" x2="3" y2="0" stroke="#0f172a" strokeWidth="2" />
            {/* Matrix details */}
            <rect x="-10" y="-2" width="3" height="3.5" fill="#fff" opacity="0.8" />
            <rect x="7" y="-2" width="3" height="3.5" fill="#fff" opacity="0.8" />
          </g>
        ) : goggles === "item_mask" ? (
          <g transform="translate(60, 42)">
            {/* Futuristic biometric-scrambling plate mask over down snout */}
            <path d="M -6 -6 L 16 -6 L 12 6 L -2 6 Z" fill="#4b5563" stroke="#1f2937" strokeWidth="2" />
            <circle cx="5" cy="0" r="2" fill="#22d3ee" filter="url(#neon-glow-cyan)" />
          </g>
        ) : goggles === "item_collar" ? (
          <g transform="translate(60, 50)">
            {/* heavy cyber collar at throat */}
            <rect x="-11" y="-3" width="22" height="6.5" rx="2.2" fill="#1e293b" stroke="#0f172a" strokeWidth="2" />
            <circle cx="0" cy="0" r="1.8" fill="#ef4444" className="animate-pulse" />
          </g>
        ) : null}
      </g>

      {/* 10. UTILITIES AND FLIGHT ASSISTS COMPANION GEAR */}
      <g id="shop_utility">
        {utility === "item_drone" && (
          <g transform="translate(98, 20)" className="animate-bounce" style={{ animationDuration: "2.5s" }}>
            {/* Highly detailed quadcopter drone accompanying the detective */}
            <ellipse cx="0" cy="0" rx="11" ry="5.5" fill="#1f2937" stroke="#111827" strokeWidth="1.8" />
            {/* Spinners */}
            <line x1="-15" y1="-6" x2="15" y2="-6" stroke="#94a3b8" strokeWidth="1.5" />
            <path d="M -15 -6 Q 0 -13 15 -6" fill="none" stroke="#22d3ee" strokeWidth="1" strokeDasharray="3,3" opacity="0.6" />
            {/* Camera sensor glowing ruby */}
            <circle cx="0" cy="1" r="2.5" fill="#ef4444" filter="url(#neon-glow-red)" />
            <circle cx="0" cy="1" r="0.8" fill="#fff" />
            {/* Stabilizing landing landing gears */}
            <path d="M -8 4 L -11 11 M 8 4 L 11 11" stroke="#475569" strokeWidth="2.2" strokeLinecap="round" />
          </g>
        )}

        {utility === "item_wrist" && (
          <g transform="translate(85, 84)">
            {/* Glowing cyan holographic display projecting text codes */}
            <polygon points="4,-4 22,-8 22,12 4,16" fill="#06b6d4" fillOpacity="0.15" stroke="#22d3ee" strokeWidth="2" filter="url(#neon-glow-cyan)" />
            {/* Hologram binary projection streams */}
            <line x1="6" y1="0" x2="19" y2="-3" stroke="#e0f2fe" strokeWidth="1.5" />
            <line x1="6" y1="4" x2="19" y2="1" stroke="#e0f2fe" strokeWidth="1.5" />
            <line x1="6" y1="8" x2="15" y2="6" stroke="#e0f2fe" strokeWidth="1.5" />
            {/* Link lines to wrist device */}
            <line x1="0" y1="4" x2="4" y2="6" stroke="#00cbff" strokeWidth="1" strokeDasharray="1,1" />
          </g>
        )}

        {utility === "item_satchel" && (
          <g transform="translate(56, 85)">
            {/* Heavy diagonal messenger strap across detective waist */}
            <line x1="-16" y1="-23" x2="12" y2="0" stroke="#451a03" strokeWidth="3.2" strokeLinecap="round" />
            <line x1="-16" y1="-23" x2="12" y2="0" stroke="#f59e0b" strokeWidth="1" strokeLinecap="round" strokeDasharray="4,4" />
            {/* Leather satchel bag equipped with metallic clamps */}
            <rect x="7" y="-2" width="13" height="11" rx="2" fill="#78350f" stroke="#451a03" strokeWidth="2" />
            <rect x="12" y="1" width="3" height="5" fill="#1e293b" />
          </g>
        )}

        {utility === "item_belt" && (
          <g transform="translate(60, 94)">
            {/* Multi-pouch tactical locksmith utility belt */}
            <rect x="-18" y="-1.5" width="36" height="3.5" rx="1" fill="#2d2d30" stroke="#0f1115" strokeWidth="1" />
            {/* Mini tools in slots */}
            <rect x="-14" y="-3.5" width="5" height="5.5" fill="#52525b" stroke="#18181b" strokeWidth="1" />
            <rect x="9" y="-3.5" width="5" height="5.5" fill="#52525b" stroke="#18181b" strokeWidth="1" />
            {/* Metallic key picker hook drooping */}
            <path d="M 0 0 L 0 8 Q -3 11 -3 8" fill="none" stroke="#d4d4d8" strokeWidth="1.8" strokeLinecap="round" />
          </g>
        )}

        {utility === "item_injector" && (
          <g transform="translate(94, 88) rotate(-15)">
            {/* Stealth electronic device or jammer chemical injector */}
            <rect x="-3" y="-6" width="6" height="12" rx="1.5" fill="#10b981" stroke="#047857" strokeWidth="1.5" />
            <line x1="0" y1="-6" x2="0" y2="-11" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" />
            <line x1="-4" y1="-2" x2="4" y2="-2" stroke="#fff" strokeWidth="1" />
          </g>
        )}

        {utility === "item_files" && (
          <g transform="translate(56, 75) rotate(-35)">
            {/* S-Rank Yellow folders loaded with classified case notes */}
            <polygon points="-5,-4 10,0 8,10 -7,6" fill="#f59e0b" stroke="#78350f" strokeWidth="1.5" />
            {/* Mini stamp detail */}
            <rect x="-2" y="1" width="5" height="3" fill="#ef4444" rx="0.5" />
            {/* Written document lines */}
            <path d="M -3,6 L 4,8" stroke="#1c1b19" strokeWidth="1" />
          </g>
        )}
      </g>
    </svg>
  );
}
