import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { LevelBadge } from "./LevelBadge";
import { Sparkles, Award, Zap, Coins } from "lucide-react";

interface BadgeUnlockPopupProps {
  level: number;
  onClose: () => void;
}

export function BadgeUnlockPopup({ level, onClose }: BadgeUnlockPopupProps) {
  const [flash, setFlash] = useState(true);
  const [showGlow, setShowGlow] = useState(false);
  const [showText, setShowText] = useState(false);
  const [showRewards, setShowRewards] = useState(false);

  // Play metallic system sound feedback
  useEffect(() => {
    // Initial white flash
    const timerFlash = setTimeout(() => setFlash(false), 240);
    
    // Scale up badge, then activate neon glow
    const timerGlow = setTimeout(() => setShowGlow(true), 600);
    
    // Fades in title and subtitle
    const timerText = setTimeout(() => setShowText(true), 1100);
    
    // Fades in rewards
    const timerRewards = setTimeout(() => setShowRewards(true), 1600);

    return () => {
      clearTimeout(timerFlash);
      clearTimeout(timerGlow);
      clearTimeout(timerText);
      clearTimeout(timerRewards);
    };
  }, [level]);

  // Determine colors based on level
  let accentColor = "text-[#10b981]";
  let accentBorder = "border-[#10b981]/30";
  let bgGradient = "from-[#10b981]/15 to-transparent";
  let rewardText = "";
  let subtitle = "Investigation Completed";

  if (level === 1) {
    accentColor = "text-[#10b981]";
    accentBorder = "border-[#10b981]/20";
    bgGradient = "from-[#10b981]/10 to-transparent";
    rewardText = "+250 Credits / +500 XP Awarded";
    subtitle = "Enemy Defeated";
  } else if (level === 2) {
    accentColor = "text-[#06b6d4]";
    accentBorder = "border-[#06b6d4]/20";
    bgGradient = "from-[#06b6d4]/10 to-transparent";
    rewardText = "+350 Credits / +600 XP Awarded";
    subtitle = "Investigation Completed";
  } else if (level === 3) {
    accentColor = "text-[#d946ef]";
    accentBorder = "border-[#d946ef]/20";
    bgGradient = "from-[#d946ef]/10 to-transparent";
    rewardText = "+800 Credits / +1500 XP Awarded";
    subtitle = "Poison Fang Defeated";
  }

  return (
    <div 
      className="fixed inset-0 z-[100] flex flex-col items-center justify-center p-4 bg-black/90 backdrop-blur-md cursor-pointer select-none overflow-hidden font-mono"
      onClick={onClose}
    >
      {/* 1. FLASH TRIGGER ELEMENT */}
      <AnimatePresence>
        {flash && (
          <motion.div 
            initial={{ opacity: 1 }}
            animate={{ opacity: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="absolute inset-0 bg-white z-[110]"
          />
        )}
      </AnimatePresence>

      {/* Futuristic Cyber Overlay Grid Marks */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.4)_50%),linear-gradient(90deg,rgba(0,0,0,0),rgba(16,185,129,0.02),rgba(0,0,0,0))] bg-[size:100%_4px,12px_100%] pointer-events-none" />

      {/* Cyber Subtitle HUD corners */}
      <div className="absolute top-6 left-6 text-[8px] text-zinc-500 font-extrabold flex flex-col uppercase gap-1 tracking-widest leading-none">
        <span>SECURITY SECTOR COMPLIENCE V.109</span>
        <span>ACCESS: SECURE OPERATIVE LINK</span>
      </div>
      <div className="absolute top-6 right-6 text-[8px] text-zinc-500 font-extrabold flex flex-col uppercase gap-1 tracking-widest text-right leading-none">
        <span>DECRYPTION ENGINE STATE: STABLE</span>
        <span>SYS_LOCK: BYPASSED</span>
      </div>

      <div className="absolute bottom-6 left-6 text-[8px] text-zinc-500 font-extrabold flex items-center gap-1.5 uppercase tracking-widest">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping"></span>
        <span>MAIN LINK CHASSIS DEC_ST</span>
      </div>
      <div className="absolute bottom-6 right-6 text-[8px] text-zinc-500 font-extrabold uppercase tracking-widest">
        <span>TAP TO FLUSH SYSTEM BUFFER</span>
      </div>

      {/* 2. THE BADGE CONTAINER */}
      <div className="relative flex flex-col items-center justify-center max-w-sm w-full text-center space-y-8 z-10">
        
        {/* Animated Outer Radar Pulse Rings */}
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none">
          <motion.div
            initial={{ scale: 0.6, opacity: 0 }}
            animate={showGlow ? { scale: [1, 2.2], opacity: [0.6, 0] } : {}}
            transition={{ repeat: Infinity, duration: 2.2, ease: "easeOut" }}
            className={`w-72 h-72 rounded-full border border-dashed ${accentBorder}`}
          />
          <motion.div
            initial={{ scale: 0.4, opacity: 0 }}
            animate={showGlow ? { scale: [1, 1.6], opacity: [0.4, 0] } : {}}
            transition={{ repeat: Infinity, duration: 1.8, delay: 0.4, ease: "easeOut" }}
            className={`w-72 h-72 rounded-full border ${accentBorder}`}
          />
        </div>

        {/* The Actual Badge with entrance slide/scale */}
        <motion.div
          initial={{ scale: 0.15, y: 70, opacity: 0, rotate: -15 }}
          animate={{ scale: 1, y: 0, opacity: 1, rotate: 0 }}
          transition={{ type: "spring", stiffness: 100, damping: 15, delay: 0.2 }}
          className="relative drop-shadow-[0_0_20px_rgba(255,255,255,0.05)]"
        >
          <LevelBadge 
            level={level} 
            size={220} 
            glowing={showGlow} 
            className="transform-gpu"
          />

          {/* Sparkles details appearing on glow */}
          {showGlow && (
            <>
              <motion.div
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: [0, 1, 0], scale: [0, 1.2, 0.4], x: [0, -60, -70], y: [0, -40, -50] }}
                transition={{ duration: 1.6, repeat: Infinity, repeatDelay: 0.5 }}
                className="absolute top-1/4 left-1/4"
              >
                <Sparkles size={16} className={`${accentColor}`} />
              </motion.div>
              <motion.div
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: [0, 0.9, 0], scale: [0, 1.4, 0.4], x: [0, 70, 80], y: [0, -30, -20] }}
                transition={{ duration: 1.8, repeat: Infinity, repeatDelay: 0.2 }}
                className="absolute top-1/3 right-1/4"
              >
                <Award size={18} className={`${accentColor}`} />
              </motion.div>
            </>
          )}
        </motion.div>

        {/* 3. UNDERNEATH TEXT LAYERS */}
        <div className="space-y-3 min-h-[140px] flex flex-col items-center justify-start">
          <AnimatePresence>
            {showText && (
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="space-y-1.5"
              >
                {/* CLEARED STATE HEADER */}
                <h1 className="font-sans font-black tracking-[0.2em] text-2xl uppercase text-white leading-none drop-shadow-[0_0_12px_rgba(255,255,255,0.25)]">
                  LEVEL {level} CLEARED
                </h1>
                
                {/* SUBTITLE */}
                <p className={`text-xs font-black uppercase tracking-[0.35em] ${accentColor}`}>
                  {subtitle}
                </p>

                <div className="w-20 h-0.5 mx-auto bg-gradient-to-r from-transparent via-zinc-650 to-transparent mt-3" />
              </motion.div>
            )}
          </AnimatePresence>

          <AnimatePresence>
            {showRewards && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.4 }}
                className={`mt-4 px-4 py-2 rounded bg-gradient-to-r ${bgGradient} border border-dashed ${accentBorder} backdrop-blur-sm shadow-md flex items-center gap-2 text-zinc-200 text-[10px] font-bold uppercase tracking-wider`}
              >
                <div className="flex items-center gap-1.5">
                  <Coins size={12} className={accentColor} />
                  <span>{rewardText}</span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Tap to continue prompt */}
        {showText && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: [0.3, 1, 0.3] }}
            transition={{ repeat: Infinity, duration: 1.5 }}
            className="text-[9.5px] font-extrabold text-zinc-500 uppercase tracking-widest pt-4"
          >
            ✦ CLICK / TAP SCREEN TO DEFLUSH BUFFER ✦
          </motion.div>
        )}
      </div>
    </div>
  );
}
