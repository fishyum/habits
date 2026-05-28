import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { RodentAvatar } from "./RodentAvatar";
import { LevelBadge } from "./LevelBadge";
import { 
  X, Shield, Award, CheckCircle2, ChevronRight, Activity, 
  Map, UserCheck, Flame, Cpu, Compass, Lock, Zap, RefreshCw, Star,
  Edit2
} from "lucide-react";

interface AgentProfilePanelProps {
  isOpen: boolean;
  onClose: () => void;
  codename: string;
  rank: string;
  level: number;
  xp: number;
  xpProgressPct: number;
  credits: number;
  threatLevel: number;
  investigations: any;
  investigationLevel: number;
  completedCasesCount: number;
  defeatedLvl1Boss: boolean;
  defeatedFinalBoss: boolean;
  purchasedItemIds: string[];
  equippedItemIds: string[];
  initialShopItems: any[];
  onTriggerBadgeUnlock: (levelNum: number) => void;
  onRenameCodename: (newName: string) => void;
}

export function AgentProfilePanel({
  isOpen,
  onClose,
  codename,
  rank,
  level,
  xp,
  xpProgressPct,
  credits,
  threatLevel,
  investigations,
  investigationLevel,
  completedCasesCount,
  defeatedLvl1Boss,
  defeatedFinalBoss,
  purchasedItemIds,
  equippedItemIds,
  initialShopItems,
  onTriggerBadgeUnlock,
  onRenameCodename,
}: AgentProfilePanelProps) {
  if (!isOpen) return null;

  const [isEditing, setIsEditing] = useState(false);
  const [tempName, setTempName] = useState(codename);

  // Let's compute completeness counts for stats
  const l1Total = (investigations.light_fixture || 0) + (investigations.server_rack || 0) + 
                   (investigations.keyboard || 0) + (investigations.document || 0) + (investigations.drawer || 0);
  const l2Total = (investigations.lvl2_typewriter || 0) + (investigations.lvl2_lantern || 0) + 
                   (investigations.lvl2_window || 0) + (investigations.lvl2_fireplace || 0) + (investigations.lvl2_chest || 0);
  const l3Total = (investigations.lvl3_mainframe || 0) + (investigations.lvl3_terminal || 0) + 
                   (investigations.lvl3_console || 0) + (investigations.lvl3_datadrive || 0) + 
                   (investigations.lvl3_monitor || 0) + (investigations.lvl3_firewall || 0) + (investigations.lvl3_crate || 0);
  const totalDecodes = l1Total + l2Total + l3Total;

  // Level completeness triggers
  const isL1Done = (investigations.light_fixture || 0) >= 5 && (investigations.server_rack || 0) >= 5 && 
                    (investigations.keyboard || 0) >= 5 && (investigations.document || 0) >= 5 && (investigations.drawer || 0) >= 5;
  const isL2Done = (investigations.lvl2_typewriter || 0) >= 5 && (investigations.lvl2_lantern || 0) >= 5 && 
                    (investigations.lvl2_window || 0) >= 5 && (investigations.lvl2_fireplace || 0) >= 5 && (investigations.lvl2_chest || 0) >= 5;
  const isL3Done = (investigations.lvl3_mainframe || 0) >= 5 && (investigations.lvl3_terminal || 0) >= 5 && 
                    (investigations.lvl3_console || 0) >= 5 && (investigations.lvl3_datadrive || 0) >= 5 && 
                    (investigations.lvl3_monitor || 0) >= 5 && (investigations.lvl3_firewall || 0) >= 5 && (investigations.lvl3_crate || 0) >= 5;

  // Build list of achievements
  const achievements = [
    {
      id: "ac_first",
      title: "First Penetration",
      description: "Successfully processed a secure terminal telemetry decode.",
      completed: totalDecodes > 0,
      icon: "⚡"
    },
    {
      id: "ac_lvl1",
      title: "Chamber Unlocked",
      description: "Analyzed all Level 1 evidence markers to 100%.",
      completed: isL1Done,
      icon: "🎯"
    },
    {
      id: "ac_owl",
      title: "Hoot Defused",
      description: "Neutralize hostiles from owl hacker group 'Beak Storm'.",
      completed: defeatedLvl1Boss,
      icon: "🦉"
    },
    {
      id: "ac_lvl2",
      title: "Study Mastered",
      description: "Exhausted all clues inside the Level 2 Study.",
      completed: isL2Done,
      icon: "📂"
    },
    {
      id: "ac_strike",
      title: "Cobra Neutralized",
      description: "Successfully finished Level 3 final boss Poison Fang.",
      completed: defeatedFinalBoss,
      icon: "🐍"
    },
    {
      id: "ac_shop",
      title: "Clearance Veteran",
      description: "Acquired at least 3 pieces of field tactical gear.",
      completed: purchasedItemIds.length >= 3,
      icon: "🧥"
    },
    {
      id: "ac_energy",
      title: "Stealth Ghost",
      description: "Operated infiltration cleanly with 0% corporate alarm threat level.",
      completed: threatLevel === 0,
      icon: "👻"
    },
    {
      id: "ac_million",
      title: "Op Budget King",
      description: "Retain over 1,500 Agency Operational Credits.",
      completed: credits >= 1500,
      icon: "💥"
    }
  ];

  const completedCount = achievements.filter(a => a.completed).length;

  return (
    <motion.div
      initial={{ x: "-100%" }}
      animate={{ x: 0 }}
      exit={{ x: "-100%" }}
      transition={{ type: "spring", stiffness: 180, damping: 22 }}
      className="fixed inset-y-0 left-0 w-full max-w-md bg-[#02050c] border-r-2 border-[#00cbff]/30 shadow-[0_0_20px_rgba(0,203,255,0.15)] z-50 flex flex-col font-mono text-zinc-350"
    >
      {/* Tactical Dossier Title header */}
      <header className="p-4 border-b border-[#0d283c] bg-[#050c18] flex justify-between items-center relative z-10 select-none">
        <div className="flex items-center gap-1.5 text-[#00cbff]">
          <Shield size={16} className="text-[#00cbff] animate-pulse" />
          <span className="text-[11px] font-extrabold tracking-[0.2em] uppercase neon-text-cyan">
            CLASSIFIED CLOVER OPERATIVE ARCHIVE
          </span>
        </div>
        <button
          onClick={onClose}
          className="p-1 px-2.5 rounded bg-[#0d283c] hover:bg-[#00cbff] text-[#00cbff] hover:text-black border border-[#00cbff]/40 active:scale-95 transition-all flex items-center justify-center text-[10px] font-bold"
        >
          <X size={12} className="mr-1" /> CLOSE
        </button>
      </header>

      {/* Profile Body contents */}
      <div className="flex-grow overflow-y-auto p-4 space-y-5 select-none relative z-15 grid-bg-cyber">
        
        {/* TOP IDENTITY EMBLEM TICKET */}
        <div className="p-4 rounded-xl border-2 border-[#0d283c] bg-[#040912]/95 text-white relative overflow-hidden shadow-lg neon-glow-cyan">
          <div className="absolute inset-x-0 bottom-0 h-[2px] bg-gradient-to-r from-cyan-500 via-purple-500 to-amber-500" />
          <div className="absolute top-2 right-2 text-[7px] text-[#00cbff] font-bold border border-[#00cbff]/30 px-1 rounded uppercase tracking-wider">
            AGENCY ID: 67116852
          </div>

          <div className="flex items-center gap-4">
            {/* Adorable Rodent Avatar active loadout container */}
            <div className="w-20 h-20 bg-slate-950/80 border-2 border-[#0d283c] rounded-lg flex items-center justify-center p-1.5 shadow-[0_0_15px_rgba(0,0,0,0.8)] relative">
              <RodentAvatar 
                size={70} 
                coat={equippedItemIds.find(id => initialShopItems.find(item => item.id === id)?.category === "coats")}
                goggles={equippedItemIds.find(id => initialShopItems.find(item => item.id === id)?.category === "goggles")}
                tail={equippedItemIds.find(id => initialShopItems.find(item => item.id === id)?.category === "tails")}
                hat={equippedItemIds.find(id => initialShopItems.find(item => item.id === id)?.category === "hats")}
                utility={equippedItemIds.find(id => initialShopItems.find(item => item.id === id)?.category === "utility")}
              />
            </div>

            <div className="space-y-1.5 flex-grow">
              <span className="bg-[#0d283c] text-[#00cbff] text-[7.5px] px-1.5 py-0.5 rounded tracking-widest font-black uppercase border border-[#00cbff]/30">
                {rank}
              </span>
              {isEditing ? (
                <div className="flex items-center gap-1.5 mt-0.5">
                  <input
                    type="text"
                    value={tempName}
                    onChange={(e) => setTempName(e.target.value)}
                    className="bg-slate-950 text-white font-black px-1.5 py-0.5 rounded border border-[#00cbff]/50 text-[11px] focus:ring-1 focus:ring-cyan-400 focus:outline-none max-w-[130px] uppercase font-mono"
                    autoFocus
                    maxLength={20}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && tempName.trim()) {
                        onRenameCodename(tempName.trim());
                        setIsEditing(false);
                      } else if (e.key === "Escape") {
                        setIsEditing(false);
                      }
                    }}
                  />
                  <button
                    onClick={() => {
                      if (tempName.trim()) {
                        onRenameCodename(tempName.trim());
                        setIsEditing(false);
                      }
                    }}
                    className="px-1.5 py-0.5 rounded bg-[#00cbff] text-black text-[9px] font-black hover:brightness-110 active:scale-95 transition-all font-mono"
                  >
                    SAVE
                  </button>
                  <button
                    onClick={() => {
                      setTempName(codename);
                      setIsEditing(false);
                    }}
                    className="px-1 py-0.5 rounded bg-slate-800 text-zinc-300 hover:text-white text-[9px] font-bold active:scale-95 transition-all font-mono"
                  >
                    ESC
                  </button>
                </div>
              ) : (
                <div 
                  className="flex items-center gap-1.5 group cursor-pointer select-none py-0.5" 
                  onClick={() => { 
                    setIsEditing(true); 
                    setTempName(codename); 
                  }}
                  title="Click to rename your agent"
                >
                  <h1 className="text-md font-black tracking-tight uppercase leading-none text-white truncate max-w-[170px] neon-text-cyan">
                    {codename}
                  </h1>
                  <Edit2 size={11} className="text-[#00cbff] opacity-60 group-hover:opacity-100 group-hover:scale-110 transition-all cursor-pointer flex-shrink-0" />
                </div>
              )}
              
              {/* Level XP Bar */}
              <div className="space-y-1">
                <div className="flex justify-between items-center text-[8.5px] font-bold text-zinc-400 leading-none">
                  <span className="text-[#00cbff]">LEVEL {level}</span>
                  <span>{500 - (xp % 500)} / 500 XP</span>
                </div>
                <div className="h-2 w-full bg-[#03060c] border border-[#0d283c] rounded overflow-hidden p-[0.5px]">
                  <div className="h-full bg-gradient-to-r from-[#00cbff] to-[#d946ef] rounded-sm progress-glow" style={{ width: `${xpProgressPct}%` }} />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ACTIVE ATTACHMENTS LOADOUT MATRIX */}
        <section className="space-y-2">
          <h2 className="text-[9.5px] font-black tracking-widest text-[#00cbff] uppercase border-b border-[#0d283c] pb-1">
            📡 SECURE LOADOUT CONFIGURATION
          </h2>
          <div className="grid grid-cols-5 gap-1.5">
            {/* Display equipped slots visually */}
            {["coats", "goggles", "tails", "hats", "utility"].map((cat) => {
              const activeItemId = equippedItemIds.find(id => initialShopItems.find(item => item.id === id)?.category === cat);
              const activeItem = initialShopItems.find(item => item.id === activeItemId);

              return (
                <div 
                  key={cat} 
                  className={`border border-[#0d283c] rounded-lg p-1 text-center bg-[#03060d]/90 flex flex-col justify-between items-center min-h-[58px] ${
                    activeItem ? "border-[#00cbff] neon-glow-cyan bg-[#040c18]" : ""
                  }`}
                >
                  <span className="text-[6.5px] text-zinc-500 uppercase font-black tracking-wider leading-none">
                    {cat}
                  </span>
                  
                  <div className="my-1 text-base">
                    {cat === "coats" ? "🧥" : cat === "goggles" ? "🕶️" : cat === "tails" ? "🧬" : cat === "hats" ? "🎩" : "💼"}
                  </div>

                  <span className={`text-[6.5px] font-bold uppercase truncate max-w-full px-0.5 leading-none ${
                    activeItem ? "text-[#00cbff]" : "text-zinc-650"
                  }`}>
                    {activeItem ? activeItem.title.replace("Trenchcoat", "Coat").replace("Goggles", "Gog") : "EMPTY"}
                  </span>
                </div>
              );
            })}
          </div>
        </section>

        {/* UNLOCKED BADGES GALLERY */}
        <section className="space-y-2">
          <div className="flex justify-between items-end border-b border-[#0d283c] pb-1">
            <h2 className="text-[9.5px] font-black tracking-widest text-[#00cbff] uppercase">
              🏅 SECTOR VICTORY BADGES
            </h2>
            <span className="text-[7.5px] text-zinc-500 uppercase font-extrabold select-none">
              Taps re-animate badges
            </span>
          </div>

          <div className="grid grid-cols-3 gap-3">
            {[1, 2, 3].map((num) => {
              const unlocked = num === 1 ? isL1Done : num === 2 ? isL2Done : isL3Done;
              
              return (
                <div 
                  key={num}
                  onClick={() => unlocked && onTriggerBadgeUnlock(num)}
                  className={`border rounded-xl p-2 bg-[#03060c] flex flex-col items-center justify-between transition-all select-none min-h-[148px] ${
                    unlocked 
                    ? "cursor-pointer border-[#00cbff]/40 hover:border-[#00cbff] hover:bg-[#051020] hover:scale-[1.03] active:scale-95 text-white shadow-[0_0_12px_rgba(0,170,255,0.1)]" 
                    : "opacity-35 border-[#0d283c] text-zinc-655 filter grayscale cursor-not-allowed"
                  }`}
                >
                  <div className="h-22 flex items-center justify-center relative">
                    <LevelBadge 
                      level={num} 
                      size={80} 
                      glowing={unlocked}
                      className={unlocked ? "animate-pulse" : ""}
                    />
                    {!unlocked && (
                      <div className="absolute inset-0 flex items-center justify-center bg-black/60 rounded-full w-10 h-10 mx-auto my-auto border border-[#0d283c]">
                        <Lock size={14} className="text-[#0d283c]" />
                      </div>
                    )}
                  </div>

                  <div className="text-center space-y-0.5 mt-1.5">
                    <p className="text-[8px] font-extrabold uppercase tracking-widest text-[#00cbff]">
                      LEVEL {num} BADGE
                    </p>
                    <p className={`text-[7px] font-extrabold uppercase ${unlocked ? "text-cyan-400" : "text-zinc-600"}`}>
                      {unlocked ? "✔ UNLOCKED" : "🔒 RESTRICTED"}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* INVESTIGATION DOSSIER STATS */}
        <section className="space-y-2">
          <h2 className="text-[9.5px] font-black tracking-widest text-[#00cbff] uppercase border-b border-[#0d283c] pb-1">
            📊 DEC_FIELD STATS DOSSIER
          </h2>
          <div className="grid grid-cols-2 gap-2 text-[9px]">
            <div className="p-2 rounded bg-[#040912]/80 border border-[#0d283c] flex justify-between items-center shadow-inner">
              <span className="text-[#00cbff]/80">DECODES LOGGED:</span>
              <span className="font-bold text-white text-xs">{totalDecodes}</span>
            </div>
            <div className="p-2 rounded bg-[#040912]/80 border border-[#0d283c] flex justify-between items-center shadow-inner">
              <span className="text-[#00cbff]/80">ENEMIES DEFEATED:</span>
              <span className="font-bold text-white text-xs">
                {(defeatedLvl1Boss ? 1 : 0) + (defeatedFinalBoss ? 1 : 0) + 2}
              </span>
            </div>
            <div className="p-2 rounded bg-[#040912]/80 border border-[#0d283c] flex justify-between items-center shadow-inner">
              <span className="text-[#00cbff]/80">S-RANK RESOLVED:</span>
              <span className="font-bold text-white text-xs">{completedCasesCount}</span>
            </div>
            <div className="p-2 rounded bg-[#040912]/80 border border-[#0d283c] flex justify-between items-center shadow-inner">
              <span className="text-[#00cbff]/80">CREDIT SPENDS:</span>
              <span className="font-bold text-orange-400 text-xs">{purchasedItemIds.length * 80} CR</span>
            </div>
          </div>
        </section>

        {/* CLOVER FIELD ACHIEVEMENTS HUB */}
        <section className="space-y-2">
          <div className="flex justify-between items-end border-b border-[#0d283c] pb-1">
            <h2 className="text-[9.5px] font-black tracking-widest text-[#00cbff] uppercase">
              ★ SYSTEM ACHIEVEMENT LOGS
            </h2>
            <span className="text-[7.5px] text-[#10b981] font-bold">
              {completedCount} / {achievements.length} ACTIVE
            </span>
          </div>

          <div className="space-y-1.5 overflow-hidden max-h-[170px] overflow-y-auto pr-1">
            {achievements.map((a) => (
              <div 
                key={a.id}
                className={`p-2 rounded border flex justify-between items-center text-[9px] gap-3 leading-tight ${
                  a.completed 
                  ? "bg-[#040f1a]/80 border-[#00cbff]/30 text-white" 
                  : "bg-black/40 border-[#0d283c] opacity-45 text-zinc-500"
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className="text-sm">{a.icon}</span>
                  <div>
                    <h3 className={`font-bold uppercase ${a.completed ? "text-[#00cbff]" : "text-zinc-650"}`}>
                      {a.title}
                    </h3>
                    <p className="text-[7.5px] text-zinc-550 italic uppercase">
                      {a.description}
                    </p>
                  </div>
                </div>

                <div className="flex-shrink-0">
                  {a.completed ? (
                    <span className="text-emerald-400 font-extrabold text-[8px]">✔ ACHIEVED</span>
                  ) : (
                    <span className="text-zinc-600 flex items-center gap-0.5"><Lock size={9}/> SECURE</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>

      </div>

      {/* Database sync telemetry bottom */}
      <footer className="p-3 bg-[#01050a] border-t border-[#0d283c] text-center text-[7.5px] text-[#00cbff] uppercase tracking-widest font-black flex items-center justify-center gap-1 leading-none select-none">
        <Activity size={10} className="text-[#00cbff] animate-pulse" />
        <span>CLASSIFIED // DATA DIRECT DEPL STATUS: ACTIVE</span>
      </footer>
    </motion.div>
  );
}
