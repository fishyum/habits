import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Home as HomeIcon, 
  Search, 
  Activity, 
  Archive, 
  ShoppingBag, 
  User as UserIcon, 
  Settings, 
  Play, 
  Pause, 
  Power, 
  Compass, 
  Moon,
  Flame,
  Palette,
  Plus, 
  Send,
  Star,
  Check,
  AlertCircle,
  Award,
  Zap,
  Sparkles,
  RefreshCw,
  LogOut,
  ChevronRight,
  Edit2,
  Trash2,
  Lock,
  Unlock,
  Radio,
  Tv,
  Skull,
  Timer,
  ShieldAlert,
  ShieldCheck
} from "lucide-react";
import { initFirebase, getFirebaseObjects } from "./lib/firebase";
import { signInWithPopup, signOut, onAuthStateChanged, GoogleAuthProvider } from "firebase/auth";
import { doc, getDoc, setDoc, updateDoc, collection, onSnapshot, addDoc, getDocFromServer } from "firebase/firestore";
import { UserProfile, Habit, HabitType, Investigation, MarkerId, Purchase, ChatMessage, ShopItem } from "./types";
import { RodentAvatar } from "./components/RodentAvatar";
import { LevelBadge } from "./components/LevelBadge";
import { BadgeUnlockPopup } from "./components/BadgeUnlockPopup";
import { AgentProfilePanel } from "./components/AgentProfilePanel";

// TypewriterText component for typing clues character-by-character
function TypewriterText({ text, speed = 25, glitch = false }: { text: string; speed?: number; glitch?: boolean }) {
  const [displayedText, setDisplayedText] = useState("");
  
  useEffect(() => {
    setDisplayedText("");
    let index = 0;
    const interval = setInterval(() => {
      if (index < text.length) {
        let char = text[index];
        if (glitch && Math.random() < 0.15) {
          const glitches = "_@%#&█";
          char = glitches[Math.floor(Math.random() * glitches.length)];
        }
        setDisplayedText((prev) => prev + char);
        index++;
      } else {
        clearInterval(interval);
      }
    }, speed);
    return () => clearInterval(interval);
  }, [text, speed, glitch]);

  return <span className={glitch ? "animate-pulse text-red-500 font-mono" : ""}>{displayedText}</span>;
}

// Dynamic retro synthesizer for tactile feedback with no dependencies!
const playSynthSound = (type: "tap" | "complete" | "sonar" | "alarm" | "credits") => {
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);

    if (type === "tap") {
      osc.type = "sine";
      osc.frequency.setValueAtTime(480, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(80, ctx.currentTime + 0.08);
      gain.gain.setValueAtTime(0.03, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.08);
      osc.start();
      osc.stop(ctx.currentTime + 0.08);
    } else if (type === "complete") {
      osc.type = "triangle";
      osc.frequency.setValueAtTime(523.25, ctx.currentTime); // C5
      osc.frequency.setValueAtTime(659.25, ctx.currentTime + 0.07); // E5
      osc.frequency.setValueAtTime(783.99, ctx.currentTime + 0.14); // G5
      gain.gain.setValueAtTime(0.05, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
      osc.start();
      osc.stop(ctx.currentTime + 0.35);
    } else if (type === "sonar") {
      osc.type = "sine";
      osc.frequency.setValueAtTime(940, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(300, ctx.currentTime + 0.25);
      gain.gain.setValueAtTime(0.02, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.25);
      osc.start();
      osc.stop(ctx.currentTime + 0.25);
    } else if (type === "alarm") {
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(140, ctx.currentTime);
      osc.frequency.linearRampToValueAtTime(260, ctx.currentTime + 0.12);
      gain.gain.setValueAtTime(0.04, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.12);
      osc.start();
      osc.stop(ctx.currentTime + 0.12);
    } else if (type === "credits") {
      osc.type = "sine";
      osc.frequency.setValueAtTime(880, ctx.currentTime);
      osc.frequency.setValueAtTime(1100, ctx.currentTime + 0.06);
      gain.gain.setValueAtTime(0.04, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.18);
      osc.start();
      osc.stop(ctx.currentTime + 0.2);
    }
  } catch (err) {
    // Web audio was blocked or is unsupported
  }
};

type ActiveTab = "home" | "investigate" | "protocol" | "shop" | "agent";

interface EnemyArrivals {
  agent_pur: number;
  beak_storm: number;
  mr_mustela: number;
  poison_fang: number;
}

interface ActiveEncounter {
  enemyId: "agent_pur" | "beak_storm" | "mr_mustela" | "poison_fang";
  name: string;
  maxHp: number;
  hp: number;
  timer: number;
  isForced: boolean;
  levelToUnlockAfter?: number;
  phase?: number;
  maxPhases?: number;
  lastTimeTapped: number;
}

const formatCountdown = (ms: number) => {
  if (ms <= 0) return "00:00";
  const totalSecs = Math.floor(ms / 1000);
  const hrs = Math.floor(totalSecs / 3600);
  const mins = Math.floor((totalSecs % 3600) / 60);
  const secs = totalSecs % 60;

  const pad = (num: number) => String(num).padStart(2, "0");
  if (hrs > 0) {
    return `${pad(hrs)}:${pad(mins)}:${pad(secs)}`;
  }
  return `${pad(mins)}:${pad(secs)}`;
};

export default function App() {
  // Navigation & Screen Control
  const [activeTab, setActiveTab ] = useState<ActiveTab>("home");
  const [showSettings, setShowSettings] = useState(false);

  // Timed Threat Arrival System States
  const [enemyArrivals, setEnemyArrivals] = useState<EnemyArrivals>(() => {
    const saved = localStorage.getItem("agent_enemy_arrivals");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {}
    }
    return {
      agent_pur: Date.now() + 15 * 60 * 1000,
      beak_storm: Date.now() + 30 * 60 * 1000,
      mr_mustela: Date.now() + 45 * 60 * 1000,
      poison_fang: Date.now() + 120 * 60 * 1000,
    };
  });

  const [currentTime, setCurrentTime] = useState<number>(Date.now());
  const [arrivingEnemy, setArrivingEnemy] = useState<any>(null);

  const [activeSabotages, setActiveSabotages] = useState<Record<string, boolean>>(() => {
    const saved = localStorage.getItem("agent_active_sabotages");
    try {
      return saved ? JSON.parse(saved) : {
        agent_pur: false,
        beak_storm: false,
        mr_mustela: false,
        poison_fang: false,
      };
    } catch (e) {
      return {
        agent_pur: false,
        beak_storm: false,
        mr_mustela: false,
        poison_fang: false,
      };
    }
  });

  useEffect(() => {
    localStorage.setItem("agent_active_sabotages", JSON.stringify(activeSabotages));
  }, [activeSabotages]);

  useEffect(() => {
    localStorage.setItem("agent_enemy_arrivals", JSON.stringify(enemyArrivals));
  }, [enemyArrivals]);

  const resetEnemyTimer = (enemyId: "agent_pur" | "beak_storm" | "mr_mustela" | "poison_fang") => {
    const durations = {
      agent_pur: 15 * 60 * 1000,
      beak_storm: 30 * 60 * 1000,
      mr_mustela: 45 * 60 * 1000,
      poison_fang: 120 * 60 * 1000,
    };
    setEnemyArrivals((prev) => ({
      ...prev,
      [enemyId]: Date.now() + durations[enemyId],
    }));
  };

  // Combat Interruption System States
  const [activeEncounter, setActiveEncounter] = useState<ActiveEncounter | null>(() => {
    const saved = localStorage.getItem("agent_active_encounter");
    try {
      return saved ? JSON.parse(saved) : null;
    } catch (e) {
      return null;
    }
  });

  const [lastProgressTime, setLastProgressTime] = useState<number>(() => {
    const saved = localStorage.getItem("agent_last_progress_time");
    return saved ? parseInt(saved) : Date.now();
  });

  const [defeatedLvl1Boss, setDefeatedLvl1Boss] = useState<boolean>(() => {
    return localStorage.getItem("agent_defeated_lvl1_boss") === "true";
  });

  const [defeatedLvl2Boss, setDefeatedLvl2Boss] = useState<boolean>(() => {
    return localStorage.getItem("agent_defeated_lvl2_boss") === "true";
  });

  const [defeatedFinalBoss, setDefeatedFinalBoss] = useState<boolean>(() => {
    return localStorage.getItem("agent_defeated_final_boss") === "true";
  });

  const [isCombatFlashing, setIsCombatFlashing] = useState(false);
  const [floatingEffects, setFloatingEffects] = useState<{ id: string; text: string; x: number; y: number }[]>([]);

  useEffect(() => {
    if (activeEncounter) {
      localStorage.setItem("agent_active_encounter", JSON.stringify(activeEncounter));
    } else {
      localStorage.removeItem("agent_active_encounter");
    }
  }, [activeEncounter]);

  useEffect(() => {
    localStorage.setItem("agent_last_progress_time", lastProgressTime.toString());
  }, [lastProgressTime]);

  useEffect(() => {
    localStorage.setItem("agent_defeated_lvl1_boss", defeatedLvl1Boss.toString());
  }, [defeatedLvl1Boss]);

  useEffect(() => {
    localStorage.setItem("agent_defeated_lvl2_boss", defeatedLvl2Boss.toString());
  }, [defeatedLvl2Boss]);

  useEffect(() => {
    localStorage.setItem("agent_defeated_final_boss", defeatedFinalBoss.toString());
  }, [defeatedFinalBoss]);

  const registerProgress = () => {
    setLastProgressTime(Date.now());
  };

  // Firebase integration status
  const [firebaseActive, setFirebaseActive] = useState(false);
  const [user, setUser] = useState<any>(null); // Firebase Auth User
  const [loading, setLoading] = useState(true);

  // Core Agent Metrics (Dynamic State with offline fallback localStorage preservation)
  const [credits, setCredits] = useState<number>(() => {
    const saved = localStorage.getItem("agent_credits");
    return saved ? parseInt(saved) : 1240;
  });
  const [xp, setXp] = useState<number>(() => {
    const saved = localStorage.getItem("agent_xp");
    return saved ? parseInt(saved) : 100;
  });
  const [threatLevel, setThreatLevel] = useState<number>(() => {
    const saved = localStorage.getItem("agent_threat_level");
    return saved ? parseInt(saved) : 10;
  });

  // --- Rivalry Gameplay Mechanic ---
  const [playerProgress, setPlayerProgress] = useState<number>(() => {
    const saved = localStorage.getItem("agent_rivalry_player_progress");
    return saved ? Math.min(100, Math.max(0, parseInt(saved, 10))) : 0;
  });

  const [rivalProgress, setRivalProgress] = useState<number>(() => {
    const saved = localStorage.getItem("agent_rivalry_rival_progress");
    return saved ? Math.min(100, Math.max(0, parseInt(saved, 10))) : 15;
  });

  const [flashPlayerChange, setFlashPlayerChange] = useState<boolean>(false);
  const [flashRivalChange, setFlashRivalChange] = useState<boolean>(false);
  const [isCaseSolvedOpen, setIsCaseSolvedOpen] = useState<boolean>(false);
  const [isCaseStolenOpen, setIsCaseStolenOpen] = useState<boolean>(false);

  const modifyRivalryProgress = (playerDelta: number, rivalDelta: number, reason?: string) => {
    setPlayerProgress((prevP) => {
      let nextP = Math.min(100, Math.max(0, prevP + playerDelta));
      if (playerDelta !== 0) {
        setFlashPlayerChange(true);
        setTimeout(() => setFlashPlayerChange(false), 900);
      }
      
      setRivalProgress((prevR) => {
        let nextR = Math.min(100, Math.max(0, prevR + rivalDelta));
        if (rivalDelta !== 0) {
          setFlashRivalChange(true);
          setTimeout(() => setFlashRivalChange(false), 900);
        }
        
        // Save to localStorage
        localStorage.setItem("agent_rivalry_player_progress", nextP.toString());
        localStorage.setItem("agent_rivalry_rival_progress", nextR.toString());

        // Check Win/Lose conditions
        if (nextP >= 100 && prevP < 100 && !isCaseSolvedOpen && !isCaseStolenOpen) {
          setIsCaseSolvedOpen(true);
          playSynthSound("complete");
        } else if (nextR >= 100 && prevR < 100 && !isCaseSolvedOpen && !isCaseStolenOpen) {
          setIsCaseStolenOpen(true);
          playSynthSound("alarm");
        }

        return nextR;
      });

      return nextP;
    });

    if (reason && (playerDelta !== 0 || rivalDelta !== 0)) {
      if (playerDelta > 0 || rivalDelta < 0) {
        addToast(`🔵 CASE ADVANCED: ${reason} (PLAYER: +${playerDelta}% / RIVAL: ${rivalDelta >= 0 ? "+" : ""}${rivalDelta}%)`, "success");
      } else {
        addToast(`🔴 THREAT ESCALATED: ${reason} (PLAYER: ${playerDelta >= 0 ? "+" : ""}${playerDelta}% / RIVAL: +${rivalDelta}%)`, "warn");
      }
    }
  };

  const restartCurrentLevel = () => {
    playSynthSound("complete");
    setInvestigations((prev) => {
      const updated = { ...prev };
      if (investigationLevel === 1) {
        updated.light_fixture = 0;
        updated.server_rack = 0;
        updated.keyboard = 0;
        updated.document = 0;
        updated.drawer = 0;
      } else if (investigationLevel === 2) {
        updated.lvl2_typewriter = 0;
        updated.lvl2_lantern = 0;
        updated.lvl2_window = 0;
        updated.lvl2_fireplace = 0;
        updated.lvl2_chest = 0;
      } else {
        updated.lvl3_mainframe = 0;
        updated.lvl3_terminal = 0;
        updated.lvl3_console = 0;
        updated.lvl3_datadrive = 0;
        updated.lvl3_monitor = 0;
        updated.lvl3_firewall = 0;
        updated.lvl3_crate = 0;
      }
      return updated;
    });
    setThreatLevel(15);
    setPlayerProgress(0);
    setRivalProgress(15);
    localStorage.setItem("agent_rivalry_player_progress", "0");
    localStorage.setItem("agent_rivalry_rival_progress", "15");
    setIsCaseStolenOpen(false);
    addToast("🔄 Level reset successfully. Case parameters re-initialized!", "success");
  };

  const getRivalrySubtitleValue = () => {
    const diff = playerProgress - rivalProgress;
    if (diff > 15) {
      return "INVESTIGATION ADVANTAGE";
    } else if (diff > 0) {
      return `CASE CONTROL: +${diff}%`;
    } else if (diff === 0) {
      return "COMPETITIVE DETECTIVE PACING";
    } else if (diff < -15) {
      return "THREAT INCREASING";
    } else {
      return "RIVAL FALLING BEHIND";
    }
  };

  // Protected Hours firewall states
  const [protectedHoursEnabled, setProtectedHoursEnabled] = useState<boolean>(() => {
    return localStorage.getItem("agent_protected_hours_enabled") === "true";
  });
  const [protectedHoursStart, setProtectedHoursStart] = useState<string>(() => {
    return localStorage.getItem("agent_protected_hours_start") || "22:30";
  });
  const [protectedHoursEnd, setProtectedHoursEnd] = useState<string>(() => {
    return localStorage.getItem("agent_protected_hours_end") || "06:35";
  });
  const [protectedHoursPreset, setProtectedHoursPreset] = useState<string>(() => {
    return localStorage.getItem("agent_protected_hours_preset") || "sleep";
  });

  useEffect(() => {
    localStorage.setItem("agent_protected_hours_enabled", protectedHoursEnabled.toString());
  }, [protectedHoursEnabled]);

  useEffect(() => {
    localStorage.setItem("agent_protected_hours_start", protectedHoursStart);
  }, [protectedHoursStart]);

  useEffect(() => {
    localStorage.setItem("agent_protected_hours_end", protectedHoursEnd);
  }, [protectedHoursEnd]);

  useEffect(() => {
    localStorage.setItem("agent_protected_hours_preset", protectedHoursPreset);
  }, [protectedHoursPreset]);

  const isProtectedHoursActive = (): boolean => {
    if (!protectedHoursEnabled) return false;
    const [startH, startM] = protectedHoursStart.split(":").map(Number);
    const [endH, endM] = protectedHoursEnd.split(":").map(Number);
    const now = new Date();
    const currentH = now.getHours();
    const currentM = now.getMinutes();
    const currentMinutes = currentH * 60 + currentM;
    const startMinutes = startH * 60 + startM;
    const endMinutes = endH * 60 + endM;
    if (startMinutes <= endMinutes) {
      return currentMinutes >= startMinutes && currentMinutes <= endMinutes;
    } else {
      return currentMinutes >= startMinutes || currentMinutes <= endMinutes;
    }
  };

  const formatTime12Hour = (timeStr: string): string => {
    if (!timeStr) return "";
    const [h, m] = timeStr.split(":").map(Number);
    const ampm = h >= 12 ? "PM" : "AM";
    const displayH = h % 12 === 0 ? 12 : h % 12;
    const displayM = m < 10 ? `0${m}` : m;
    return `${displayH}:${displayM} ${ampm}`;
  };
  const [codename, setCodename] = useState<string>(() => {
    const saved = localStorage.getItem("agent_codename");
    return saved || "Agent 7-Jeongin";
  });
  const [isEditingCodename, setIsEditingCodename] = useState(false);
  const [tempCodename, setTempCodename] = useState(codename);

  const [casePoints, setCasePoints] = useState<number>(() => {
    const saved = localStorage.getItem("agent_case_points");
    return saved ? parseInt(saved) : 0;
  });

  useEffect(() => {
    localStorage.setItem("agent_case_points", casePoints.toString());
  }, [casePoints]);

  const [shownBadgeUnlocks, setShownBadgeUnlocks] = useState<number[]>(() => {
    const saved = localStorage.getItem("agent_shown_badge_unlocks");
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    localStorage.setItem("agent_shown_badge_unlocks", JSON.stringify(shownBadgeUnlocks));
  }, [shownBadgeUnlocks]);

  const [activeBadgeUnlock, setActiveBadgeUnlock] = useState<number | null>(null);
  const [isProfileOpen, setIsProfileOpen] = useState<boolean>(false);

  // Dynamic progressive analysis dialogue box states
  const [currentClueHotspot, setCurrentClueHotspot] = useState<MarkerId | "">("");
  const [currentClueCount, setCurrentClueCount] = useState<number>(0);

  // Today's Habits checklists (saves dynamically with mood tracker default)
  const [habits, setHabits] = useState<Habit[]>(() => {
    const saved = localStorage.getItem("agent_habits");
    let current: Habit[] = [];
    if (saved) {
      try {
        current = JSON.parse(saved).filter((h: any) => h.type !== "precision" && h.id !== "h_precision");
      } catch (e) {
        current = [];
      }
    }
    
    // Default list of habits
    const defaults: Habit[] = [
      { id: "h_sleep", userId: "local_agent", title: "Sleep", type: "sleep", completed: false, currentValue: "7h 42m", energyReward: 20, difficulty: "medium" },
      { id: "h_exercise", userId: "local_agent", title: "Exercise", type: "exercise", completed: false, currentValue: "21 / 30", energyReward: 20, difficulty: "medium" },
      { id: "h_intel", userId: "local_agent", title: "Study Session", type: "intelligence", completed: false, currentValue: "45m", energyReward: 40, difficulty: "hard" },
      { id: "h_drawing", userId: "local_agent", title: "Drawing", type: "creativity", completed: false, currentValue: "0h", energyReward: 20, difficulty: "medium" },
      { id: "h_mood", userId: "local_agent", title: "Mood Reflection", type: "mood", completed: false, currentValue: "FOCUSED", energyReward: 10, difficulty: "easy" },
    ];

    if (current.length === 0) {
      return defaults;
    }
    
    // Auto-bootstrap mood reflection habit for existing sessions
    if (!current.some((h) => h.type === "mood")) {
      current.push({ id: "h_mood", userId: "local_agent", title: "Mood Reflection", type: "mood", completed: false, currentValue: "FOCUSED", energyReward: 15 });
    }
    // Auto-bootstrap drawing habit for existing sessions
    if (!current.some((h) => h.type === "creativity")) {
      current.push({ id: "h_drawing", userId: "local_agent", title: "Drawing", type: "creativity", completed: false, currentValue: "0h", energyReward: 20, difficulty: "medium" });
    }
    return current;
  });

  // Case investigation marker checklist
  const [investigations, setInvestigations] = useState<{ [key in MarkerId]: number }>(() => {
    const saved = localStorage.getItem("agent_investigations");
    const defaultVal = {
      light_fixture: 0,
      server_rack: 0,
      keyboard: 0,
      document: 0,
      drawer: 0,
      lvl2_typewriter: 0,
      lvl2_lantern: 0,
      lvl2_window: 0,
      lvl2_fireplace: 0,
      lvl2_chest: 0,
      lvl3_mainframe: 0,
      lvl3_terminal: 0,
      lvl3_console: 0,
      lvl3_datadrive: 0,
      lvl3_monitor: 0,
      lvl3_firewall: 0,
      lvl3_crate: 0
    };
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return { ...defaultVal, ...parsed };
      } catch (e) {
        return defaultVal;
      }
    }
    return defaultVal;
  });

  // Shop purchase inventories
  const [purchasedItemIds, setPurchasedItemIds] = useState<string[]>(() => {
    const saved = localStorage.getItem("agent_purchaselist");
    return saved ? JSON.parse(saved) : ["item_trenchcoat", "item_goggles", "item_antenna"];
  });

  const [equippedItemIds, setEquippedItemIds] = useState<string[]>(() => {
    const saved = localStorage.getItem("agent_equipped_items");
    return saved ? JSON.parse(saved) : ["item_trenchcoat"];
  });

  const [lastTappedHotspot, setLastTappedHotspot] = useState<string | null>(null);

  // Focus Timer Protocol states
  const [timerRunning, setTimerRunning] = useState(false);
  const [focusedSeconds, setFocusedSeconds] = useState(0);
  const [goalSeconds, setGoalSeconds] = useState(2 * 60 * 60); // 2 hours
  const stopwatchInterval = useRef<any>(null);

  // Focus completion authorized state
  const [hasFinishedTimer, setHasFinishedTimer] = useState<boolean>(() => {
    const saved = localStorage.getItem("agent_timer_finished");
    return saved === "true";
  });

  // Neural Dream AI brief messenger chat states
  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    const saved = localStorage.getItem("agent_briefmsgs");
    if (saved) return JSON.parse(saved);
    return [
      {
        id: "msg_init",
        userId: "local_agent",
        sender: "ai",
        content: "Decipher terminal initialized. Describe your dream or submit field investigation notes below, Agent. Let's uncover the underlying symbols for your current investigation case.",
        createdAt: new Date().toISOString()
      }
    ];
  });
  const [dreamInputStr, setDreamInputStr] = useState("");
  const [sendingAIQuery, setSendingAIQuery] = useState(false);

  const [floatingXps, setFloatingXps] = useState<{ id: number; text: string; x: number; y: number }[]>([]);

  const [debugLevelUpPopup, setDebugLevelUpPopup] = useState<{
    show: boolean;
    oldLevel: number;
    newLevel: number;
    newRank: string;
  } | null>(null);

  // Interactive Create Habit Custom Protocol dialog popup
  const [showAddHabitModal, setShowAddHabitModal] = useState(false);
  const [newHabitTitle, setNewHabitTitle] = useState("");
  const [newHabitType, setNewHabitType] = useState<HabitType>("intelligence");
  const [newHabitReward, setNewHabitReward] = useState(20);
  const [newHabitDifficulty, setNewHabitDifficulty] = useState<"easy" | "medium" | "hard">("medium");

  // User notifications toast stack
  const [toasts, setToasts] = useState<{ id: string; text: string; type: "success" | "warn" | "credits" }[]>([]);

  // Timer counter representation
  const [selectedProtocolType, setSelectedProtocolType] = useState<"sleep" | "exercise" | "intelligence" | "creativity">("intelligence");
  const [sessionTimerActive, setSessionTimerActive] = useState(false);
  const [sessionSecCount, setSessionSecCount] = useState(() => {
    const saved = localStorage.getItem("agent_intel_session_sec");
    return saved ? parseInt(saved) : 2712; // starts e.g. 45:12
  });
  const [creativityProgressSec, setCreativityProgressSec] = useState(() => {
    const saved = localStorage.getItem("agent_creativity_progress_sec");
    return saved ? parseInt(saved) : 0; // starts e.g. 0h
  });

  // ---------------------------
  // Audio Player simulation states
  const [sleepPlaying, setSleepPlaying] = useState(false);
  const [exercisePlaying, setExercisePlaying] = useState(false);
  const [exerciseProgressSec, setExerciseProgressSec] = useState(() => {
    const saved = localStorage.getItem("agent_exercise_progress_sec");
    return saved ? parseInt(saved) : 1260; // 21 minutes
  });
  const [sleepProgressSec, setSleepProgressSec] = useState(() => {
    const saved = localStorage.getItem("agent_sleep_seq_sec");
    return saved ? parseInt(saved) : 21600; // starts at 6h, 7h target
  });
  const exerciseTimerRef = useRef<any>(null);

  // Generate success UI toast
  const addToast = (text: string, type: "success" | "warn" | "credits" = "success") => {
    const id = Math.random().toString();
    setToasts((prev) => [...prev, { id, text, type }]);
    
    // Play sound congruent with type
    if (type === "success") playSynthSound("complete");
    else if (type === "warn") playSynthSound("alarm");
    else if (type === "credits") playSynthSound("credits");

    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  };

  // Automatically clean up floating XP subtract texts that are older than 1.5s
  useEffect(() => {
    if (floatingXps.length === 0) return;
    const interval = setInterval(() => {
      const now = Date.now();
      setFloatingXps((prev) => prev.filter((item) => now - item.id < 1200));
    }, 500);
    return () => clearInterval(interval);
  }, [floatingXps]);

  // -----------------------------------------------------
  // Initialize Firebase Connection if available
  // -----------------------------------------------------
  useEffect(() => {
    async function setupFirebaseSync() {
      try {
        const { isConfigured, auth: fAuth, db: fDb } = await initFirebase();
        if (isConfigured && fAuth) {
          setFirebaseActive(true);
          
          // Listen to state changes
          onAuthStateChanged(fAuth, (firebaseUser) => {
            if (firebaseUser) {
              setUser(firebaseUser);
              addToast(`Agent profile verified: ${firebaseUser.email}`, "success");
              pullUserDataFromCloud(firebaseUser.uid, fDb);
            } else {
              setUser(null);
            }
            setLoading(false);
          });
        } else {
          setLoading(false);
        }
      } catch (err) {
        console.warn("Database initialization failed. Offline mode active.");
        setLoading(false);
      }
    }
    setupFirebaseSync();
  }, []);

  // Sync state to LocalStorage for offline persistence so metrics are NEVER lost
  useEffect(() => {
    localStorage.setItem("agent_credits", credits.toString());
  }, [credits]);

  useEffect(() => {
    localStorage.setItem("agent_xp", xp.toString());
  }, [xp]);

  useEffect(() => {
    localStorage.setItem("agent_threat_level", threatLevel.toString());
  }, [threatLevel]);

  useEffect(() => {
    localStorage.setItem("agent_codename", codename);
  }, [codename]);

  useEffect(() => {
    localStorage.setItem("agent_habits", JSON.stringify(habits));
  }, [habits]);

  useEffect(() => {
    localStorage.setItem("agent_investigations", JSON.stringify(investigations));
  }, [investigations]);

  useEffect(() => {
    localStorage.setItem("agent_purchaselist", JSON.stringify(purchasedItemIds));
  }, [purchasedItemIds]);

  useEffect(() => {
    localStorage.setItem("agent_equipped_items", JSON.stringify(equippedItemIds));
  }, [equippedItemIds]);

  useEffect(() => {
    localStorage.setItem("agent_briefmsgs", JSON.stringify(messages));
  }, [messages]);

  useEffect(() => {
    localStorage.setItem("agent_timer_finished", hasFinishedTimer.toString());
  }, [hasFinishedTimer]);

  useEffect(() => {
    localStorage.setItem("agent_intel_session_sec", sessionSecCount.toString());
  }, [sessionSecCount]);

  useEffect(() => {
    localStorage.setItem("agent_exercise_progress_sec", exerciseProgressSec.toString());
  }, [exerciseProgressSec]);

  useEffect(() => {
    localStorage.setItem("agent_sleep_seq_sec", sleepProgressSec.toString());
  }, [sleepProgressSec]);

  useEffect(() => {
    localStorage.setItem("agent_creativity_progress_sec", creativityProgressSec.toString());
  }, [creativityProgressSec]);


  // -----------------------------------------------------
  // Data pulling & Cloud Sync functions (Firestore & Auth)
  // -----------------------------------------------------
  const pullUserDataFromCloud = async (uid: string, fDb: any) => {
    try {
      const userRef = doc(fDb, "users", uid);
      const userSnap = await getDoc(userRef);

      if (userSnap.exists()) {
        const data = userSnap.data();
        if (data.credits) setCredits(data.credits);
        if (data.xp) setXp(data.xp);
        if (data.threatLevel) setThreatLevel(data.threatLevel);
        if (data.displayName) setCodename(data.displayName);
      } else {
        // Bootstrap template user data in firestore
        await setDoc(userRef, {
          uid,
          email: user?.email || "verified_agent@gmail.com",
          displayName: codename,
          threatLevel,
          credits,
          xp,
          updatedAt: new Date().toISOString()
        });
      }

      // Sync user habits list from firestore if they exist
      const habitsRef = doc(fDb, "users", uid, "sync", "habits");
      const snap = await getDoc(habitsRef);
      if (snap.exists()) {
        const syncedHabits = snap.data().list;
        if (syncedHabits && syncedHabits.length > 0) {
          setHabits(syncedHabits);
        }
      }
    } catch (e) {
      console.error("Firestore retrieval error: ", e);
    }
  };

  const syncUserDataToCloud = async (updatedCredits: number, updatedXp: number, updatedThreatLevel: number) => {
    const { isConfigured, db: fDb } = getFirebaseObjects();
    if (isConfigured && user && fDb) {
      try {
        const userRef = doc(fDb, "users", user.uid);
        await updateDoc(userRef, {
          credits: updatedCredits,
          xp: updatedXp,
          threatLevel: updatedThreatLevel,
          updatedAt: new Date().toISOString()
        });
      } catch (err) {
        console.error("Could not upload profile metrics to cloud database:", err);
      }
    }
  };

  // Google Login / Sign Out helpers
  const handleGoogleSignIn = async () => {
    playSynthSound("tap");
    const { isConfigured, auth: fAuth, provider: fProvider } = getFirebaseObjects();
    
    if (isConfigured && fAuth && fProvider) {
      try {
        const result = await signInWithPopup(fAuth, fProvider);
        setUser(result.user);
        addToast(`Authenticated as ${result.user.displayName}`, "success");
      } catch (err: any) {
        console.error("Sign-in failed:", err);
        addToast("Authentication terminal rejected popup permission.", "warn");
      }
    } else {
      // Mock local mock sign-in to play elements if Firebase Terms of Service is not fully confirmed in developers UI yet
      const mockUser = {
        uid: "agent_offline_mock_7",
        email: "intel_jeongin@gmail.com",
        displayName: "S-Rank Operative Jeongin"
      };
      setUser(mockUser);
      setCodename("Agent 7-Jeongin (Demo)");
      addToast("Signed in securely under secure local simulation bypass.", "success");
    }
  };

  const handleSignOut = async () => {
    playSynthSound("tap");
    const { isConfigured, auth: fAuth } = getFirebaseObjects();
    if (isConfigured && fAuth) {
      await signOut(fAuth);
    }
    setUser(null);
    addToast("Logged out of agency satellite. Sandbox format active.", "warn");
  };


  const startFocusForCategory = (type: "sleep" | "exercise" | "intelligence" | "creativity") => {
    playSynthSound("tap");
    setActiveTab("protocol");
    setSelectedProtocolType(type);
    
    // Stop any existing stopwatch interval first to ensure clean reassignment
    if (stopwatchInterval.current) {
      clearInterval(stopwatchInterval.current);
    }
    
    // Reset focused uptime seconds for the fresh session
    setFocusedSeconds(0);
    setTimerRunning(true);
    
    stopwatchInterval.current = setInterval(() => {
      setFocusedSeconds((prev) => prev + 1);
      
      if (type === "intelligence") {
        setSessionSecCount((prev) => prev + 1);
      } else if (type === "exercise") {
        setExerciseProgressSec((prev) => Math.min(1800, prev + 1));
      } else if (type === "sleep") {
        setSleepProgressSec((prev) => prev + 10);
      } else if (type === "creativity") {
        setCreativityProgressSec((prev) => Math.min(3600, prev + 1));
      }
    }, 1000);
    
    const getLabel = (t: string) => {
      if (t === "intelligence") return "Study Session";
      if (t === "exercise") return "Exercise";
      if (t === "sleep") return "Sleep";
      if (t === "creativity") return "Drawing";
      return "Focus";
    };
    addToast(`Focus Protocol started: Timing '${getLabel(type)}' session sync.`, "success");
  };


  // -----------------------------------------------------
  // Focus Stopwatch Protocol Logic
  // -----------------------------------------------------
  const handleToggleTimer = () => {
    playSynthSound("tap");
    if (!timerRunning) {
      setTimerRunning(true);
      stopwatchInterval.current = setInterval(() => {
        setFocusedSeconds((prev) => prev + 1);
        
        // Dynamic active state increment based on selection
        if (selectedProtocolType === "intelligence") {
          setSessionSecCount((prev) => prev + 1);
        } else if (selectedProtocolType === "exercise") {
          setExerciseProgressSec((prev) => Math.min(1800, prev + 1));
        } else if (selectedProtocolType === "sleep") {
          setSleepProgressSec((prev) => prev + 10); // Sleep increments fast in simulation
        } else if (selectedProtocolType === "creativity") {
          setCreativityProgressSec((prev) => Math.min(3600, prev + 1));
        }
      }, 1000);
      const getLabel = (type: string) => {
        if (type === "intelligence") return "Study Session";
        if (type === "exercise") return "Exercise";
        if (type === "sleep") return "Sleep";
        if (type === "creativity") return "Drawing";
        return "Focus";
      };
      const label = getLabel(selectedProtocolType);
      addToast(`Focus Protocol started: Timing '${label}' session sync.`, "success");
    } else {
      setTimerRunning(false);
      clearInterval(stopwatchInterval.current);
      // Give intelligence reward upon stopping successfully
      const earnedCr = Math.min(200, Math.floor(focusedSeconds / 6));
      const earnedXp = Math.min(600, focusedSeconds * 3);
      
      if (focusedSeconds >= 3) {
        setCredits((prev) => prev + earnedCr);
        setXp((prev) => prev + earnedXp);
        setHasFinishedTimer(true);
        const getLabel = (type: string) => {
          if (type === "intelligence") return "Study Session";
          if (type === "exercise") return "Exercise";
          if (type === "sleep") return "Sleep";
          if (type === "creativity") return "Drawing";
          return "Focus";
        };
        const label = getLabel(selectedProtocolType);
        addToast(`Focus session completed for '${label}'! +${earnedCr} CR // +${earnedXp} XP`, "credits");
        syncUserDataToCloud(credits + earnedCr, xp + earnedXp, threatLevel);
      } else {
        addToast("Focus terminated. Complete at least 3 seconds of focus to authorize your Daily Directives.", "warn");
      }
      setFocusedSeconds(0);
    }
  };

  const formatTimerString = (secTotal: number) => {
    const hours = Math.floor(secTotal / 3600);
    const minutes = Math.floor((secTotal % 3600) / 60);
    const seconds = secTotal % 60;
    
    return (
      (hours > 0 ? hours.toString().padStart(2, "0") + ":" : "") + 
      minutes.toString().padStart(2, "0") + ":" + 
      seconds.toString().padStart(2, "0")
    );
  };


  const isHabitAuthorized = (type: HabitType) => {
    if (type === "sleep") return sleepProgressSec >= 25200; // 7 hours
    if (type === "exercise") return exerciseProgressSec >= 1800; // 30 mins
    if (type === "intelligence") return sessionSecCount >= 7200; // 2 hours
    if (type === "creativity") return creativityProgressSec >= 3600; // 1 hour
    return true; // mood reflection or others are always unlocked
  };

  const getHabitUnlockProgress = (type: HabitType) => {
    if (type === "sleep") return { current: sleepProgressSec, target: 25200, label: "7 Hours" };
    if (type === "exercise") return { current: exerciseProgressSec, target: 1800, label: "30 Minutes" };
    if (type === "intelligence") return { current: sessionSecCount, target: 7200, label: "2 Hours" };
    if (type === "creativity") return { current: creativityProgressSec, target: 3600, label: "1 Hour" };
    return null;
  };


  // -----------------------------------------------------
  // Habits Completed Interactions
  // -----------------------------------------------------
  const getXpRewardForHabit = (h: Habit): number => {
    if (h.difficulty) {
      if (h.difficulty === "easy") return 10;
      if (h.difficulty === "medium") return 20;
      if (h.difficulty === "hard") return 40;
    }
    // Fallbacks for legacy habits without explicit difficulty field
    const titleLower = h.title.toLowerCase();
    if (titleLower.includes("mood") || titleLower.includes("reflection") || h.type === "mood") return 10;
    if (titleLower.includes("exercise") || titleLower.includes("drawing") || titleLower.includes("todo") || titleLower.includes("to-do") || h.type === "exercise" || h.type === "sleep") return 20;
    if (titleLower.includes("study") || titleLower.includes("intel") || h.type === "intelligence") return 40;
    return 20; // default medium
  };

  const handleToggleHabit = (id: string) => {
    playSynthSound("tap");
    const hTarget = habits.find((h) => h.id === id);
    if (!hTarget) return;

    if (!isHabitAuthorized(hTarget.type)) {
      if (hTarget.type === "sleep") {
        addToast(`🔒 Target locked: 7h needed.`, "warn");
      } else if (hTarget.type === "exercise") {
        addToast(`🔒 Target locked: 30m needed.`, "warn");
      } else if (hTarget.type === "intelligence") {
        addToast(`🔒 Target locked: 2h study focus needed.`, "warn");
      } else {
        addToast(`🔒 Directive locked.`, "warn");
      }
      return;
    }

    setHabits((prev) =>
      prev.map((h) => {
        if (h.id === id) {
          const newState = !h.completed;
          const xpReward = getXpRewardForHabit(h);
          const creditsReward = 50; // standard credits reward
          
          if (newState) {
            const nextXp = xp + xpReward;
            const nextCredits = credits + creditsReward;
            setXp(nextXp);
            setCredits(nextCredits);
            addToast(`Protocol Executed. Completed '${h.title}': +${xpReward} XP // +${creditsReward} CR!`, "credits");
            syncUserDataToCloud(nextCredits, nextXp, threatLevel);
          } else {
            const nextXp = Math.max(0, xp - xpReward);
            const nextCredits = Math.max(0, credits - creditsReward);
            setXp(nextXp);
            setCredits(nextCredits);
            addToast(`Recalibrated '${h.title}': -${xpReward} XP // -${creditsReward} CR.`, "warn");
            syncUserDataToCloud(nextCredits, nextXp, threatLevel);
          }
          return { ...h, completed: newState };
        }
        return h;
      })
    );
  };

  const handleUpdateMood = (id: string, moodValue: string) => {
    playSynthSound("complete");
    setHabits((prev) =>
      prev.map((h) => {
        if (h.id === id) {
          addToast(`Cognitive Resonance Update: Integrated [${moodValue}] mood pattern.`, "success");
          return { ...h, currentValue: moodValue };
        }
        return h;
      })
    );
  };

  const handleAddCustomHabit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newHabitTitle.trim()) return;

    const id = "h_custom_" + Date.now();
    const resolvedReward = newHabitDifficulty === "easy" ? 10 : newHabitDifficulty === "medium" ? 20 : 40;
    
    const newHabitObject: Habit = {
      id,
      userId: user?.uid || "local_agent",
      title: newHabitTitle,
      type: newHabitType,
      completed: false,
      currentValue: "Manual case evidence logging...",
      energyReward: resolvedReward,
      difficulty: newHabitDifficulty
    };

    setHabits((prev) => [...prev, newHabitObject]);
    setShowAddHabitModal(false);
    setNewHabitTitle("");
    addToast(`Added Custom Tactical Directive: ${newHabitTitle} (${newHabitDifficulty.toUpperCase()} difficulty)`, "success");
  };

  const handleDeleteHabit = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    playSynthSound("tap");
    setHabits((prev) => prev.filter((h) => h.id !== id));
    addToast("Directive removed from dashboard database.", "warn");
  };


  // -----------------------------------------------------
  // Combat Interruption System Game Logic
  // -----------------------------------------------------

  const spawnDamageText = (text: string) => {
    const id = Math.random().toString();
    const x = Math.floor(Math.random() * 120) - 60; // offset from center
    const y = Math.floor(Math.random() * 80) - 80;  // offset from center
    setFloatingEffects((prev) => [...prev, { id, text, x, y }]);
    setTimeout(() => {
      setFloatingEffects((prev) => prev.filter((item) => item.id !== id));
    }, 1200);
  };

  const startCombatEncounter = (
    enemyId: "agent_pur" | "beak_storm" | "mr_mustela" | "poison_fang",
    name: string,
    maxHp: number,
    isForced: boolean,
    levelToUnlockAfter?: number
  ) => {
    playSynthSound("alarm");
    const newEncounter: ActiveEncounter = {
      enemyId,
      name,
      maxHp,
      hp: maxHp,
      timer: enemyId === "poison_fang" ? 45 : 30, // seconds logic
      isForced,
      levelToUnlockAfter,
      phase: enemyId === "poison_fang" ? 1 : undefined,
      maxPhases: enemyId === "poison_fang" ? 3 : undefined,
      lastTimeTapped: Date.now()
    };
    setActiveEncounter(newEncounter);
    addToast(`🚨 SECURE CYBERLINK! Hostile entity detected.`, "warn");
  };

  const handleFightBack = (enemyId: "agent_pur" | "beak_storm" | "mr_mustela" | "poison_fang") => {
    playSynthSound("tap");
    const nameMap = {
      agent_pur: "Agent Pur",
      beak_storm: "Beak Storm",
      mr_mustela: "Mr. Mustela",
      poison_fang: "Poison Fang"
    };
    const maxHpMap = {
      agent_pur: 20,
      beak_storm: 35,
      mr_mustela: 55,
      poison_fang: 110
    };
    startCombatEncounter(enemyId, nameMap[enemyId], maxHpMap[enemyId], false);
  };

  const triggerInactivityEncounter = () => {
    // Select enemy type depending on player's current level
    let enemyId: "agent_pur" | "beak_storm" | "mr_mustela" | "poison_fang" = "agent_pur";
    let name = "Agent Pur";
    let maxHp = 30;

    if (investigationLevel === 1) {
      enemyId = "agent_pur";
      name = "Agent Pur";
      maxHp = 30;
    } else if (investigationLevel === 2) {
      const rand = Math.random();
      if (rand < 0.2) {
        enemyId = "mr_mustela";
        name = "Mr Mustela";
        maxHp = 60;
      } else {
        enemyId = "beak_storm";
        name = "Beak Storm";
        maxHp = 45;
      }
    } else if (investigationLevel === 3) {
      const rand = Math.random();
      if (rand < 0.25) {
        enemyId = "beak_storm";
        name = "Beak Storm";
        maxHp = 45;
      } else {
        enemyId = "mr_mustela";
        name = "Mr Mustela";
        maxHp = 60;
      }
    }

    startCombatEncounter(enemyId, name, maxHp, false);
  };

  const handleCombatLoss = (encounter: ActiveEncounter) => {
    playSynthSound("alarm");
    
    // Increase threat level by 20%
    const threatGained = 20;
    setThreatLevel((prev) => Math.min(100, prev + threatGained));

    // Damaging progress: decrease investigations progress slightly
    setInvestigations((prev) => {
      const updated = { ...prev };
      if (investigationLevel === 1) {
        if (updated.light_fixture > 0) updated.light_fixture--;
        if (updated.server_rack > 0) updated.server_rack--;
      } else if (investigationLevel === 2) {
        if (updated.lvl2_typewriter > 0) updated.lvl2_typewriter--;
        if (updated.lvl2_lantern > 0) updated.lvl2_lantern--;
      } else {
        if (updated.lvl3_mainframe > 0) updated.lvl3_mainframe--;
        if (updated.lvl3_terminal > 0) updated.lvl3_terminal--;
      }
      return updated;
    });

    modifyRivalryProgress(-10, 15, "Encounter Defeat - Syndicate Intruder Escaped");
    addToast(`❌ COMBAT RETREAT: Investigation Compromised! Threat Level spiked (+${threatGained}%) & Telemetry data corrupted!`, "warn");
    setActiveEncounter(null);
    setLastProgressTime(Date.now()); // Reset inactivity stopwatch
  };

  const handleCombatVictory = (encounter: ActiveEncounter) => {
    playSynthSound("complete");

    // Assign rewards per user specs: 50 credits per defeated enemy; 10 XP for normal enemies, 20 XP for bosses
    const isBoss = encounter.isForced || encounter.enemyId === "poison_fang";
    const rewardCr = 50;
    const rewardXp = isBoss ? 20 : 10;
    
    // Maintain sensible threat-level reduction coefficients
    let rewardThreat = 15;
    if (encounter.enemyId === "agent_pur") {
      rewardThreat = 10;
    } else if (encounter.enemyId === "beak_storm") {
      rewardThreat = 15;
    } else if (encounter.enemyId === "mr_mustela") {
      rewardThreat = 20;
    } else if (encounter.enemyId === "poison_fang") {
      rewardThreat = 40;
    }

    const nextCr = credits + rewardCr;
    const nextXp = xp + rewardXp;
    const nextThreat = Math.max(0, threatLevel - rewardThreat);

    setCredits(nextCr);
    setXp(nextXp);
    setThreatLevel(nextThreat);

    // Call dynamic progress updater on defeating enemies (reduces rival, increases player)
    modifyRivalryProgress(
      isBoss ? 20 : 10,
      isBoss ? -25 : -15,
      `Hostile Agent Neutralized: ${encounter.name}`
    );

    addToast(`🏆 CYBER INTERACTION DEACTIVATED! Defeated ${encounter.name}`, "success");
    addToast(`Rewards: +${rewardCr} Credits // +${rewardXp} XP (Rank Progression) // -${rewardThreat}% Threat Level!`, "credits");
    syncUserDataToCloud(nextCr, nextXp, nextThreat);

    if (encounter.enemyId === "beak_storm" && encounter.isForced) {
      setDefeatedLvl1Boss(true);
      setInvestigationLevel(2); // Auto-advance level
    } else if (encounter.enemyId === "mr_mustela" && encounter.isForced) {
      setDefeatedLvl2Boss(true);
      setInvestigationLevel(3); // Auto-advance level
    } else if (encounter.enemyId === "poison_fang" && encounter.isForced) {
      setDefeatedFinalBoss(true);
    }

    // Immediately resolve and disable active sabotage effects
    setActiveSabotages((prev) => ({
      ...prev,
      [encounter.enemyId]: false
    }));

    resetEnemyTimer(encounter.enemyId);
    setActiveEncounter(null);
    setLastProgressTime(Date.now()); // Reset inactivity stopwatch so you're clean
  };

  const handleTapEnemy = () => {
    if (!activeEncounter) return;

    playSynthSound("tap");
    setIsCombatFlashing(true);
    setTimeout(() => setIsCombatFlashing(false), 80);

    const hitTerms = ["💥 CHIP", "⚡ EXPLOIT", "🔥 BYPASS", "✨ CRITICAL", "-1 HP"];
    spawnDamageText(hitTerms[Math.floor(Math.random() * hitTerms.length)]);
    registerProgress();

    setActiveEncounter((prev) => {
      if (!prev) return null;

      const newHp = Math.max(0, prev.hp - 1);

      if (newHp <= 0) {
        // One enemy encounter = one defeat. No more repeated phases!
        setTimeout(() => {
          handleCombatVictory(prev);
        }, 50);
        return null;
      }

      return {
        ...prev,
        hp: newHp,
        lastTimeTapped: Date.now()
      };
    });
  };

  // Real-time ticking threat countdown and enemy arrival loop
  useEffect(() => {
    // 1. Tick currentTime every second
    let tickerCount = 0;
    const interval = setInterval(() => {
      setCurrentTime(Date.now());
      tickerCount++;

      // Check if hostiles are active
      const hasHostiles = activeEncounter || arrivingEnemy || Object.values(activeSabotages).some(Boolean);
      if (hasHostiles && tickerCount % 6 === 0) {
        modifyRivalryProgress(0, 1, "Hostile Sabotage Active - Rival Gains Edge");
      }

      // Check if Threat Level is high
      if (threatLevel >= 60 && tickerCount % 12 === 0) {
        modifyRivalryProgress(0, 1, "Security Faults Active - Rival Intercepting Data");
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [activeEncounter, arrivingEnemy, activeSabotages, threatLevel]);

  // Monitor for expired threat countdown timers to trigger arrival interruption
  useEffect(() => {
    if (activeEncounter || arrivingEnemy) return;

    // Check priorities of incoming digital threats
    const enemyList: { id: "agent_pur" | "beak_storm" | "mr_mustela" | "poison_fang"; name: string; maxHp: number; isForced: boolean }[] = [
      { id: "poison_fang", name: "Poison Fang (FINAL BOSS)", maxHp: 110, isForced: true },
      { id: "mr_mustela", name: "Mr. Mustela (Level 3)", maxHp: 55, isForced: false },
      { id: "beak_storm", name: "Beak Storm (Level 2)", maxHp: 35, isForced: false },
      { id: "agent_pur", name: "Agent Pur (Level 1)", maxHp: 20, isForced: false }
    ];

    for (const enemy of enemyList) {
      if (currentTime >= enemyArrivals[enemy.id] && !activeSabotages[enemy.id]) {
        // Trigger enemy interruption encounter automatically with arrival animation
        setArrivingEnemy({
          enemyId: enemy.id,
          name: enemy.name,
          maxHp: enemy.maxHp,
          isForced: enemy.isForced
        });
        break; // Guard and handle only one arrival event at a time
      }
    }
  }, [currentTime, enemyArrivals, activeEncounter, arrivingEnemy, activeSabotages]);

  // Transition from arriving state to actual active combat sequence after brief alert animation
  useEffect(() => {
    if (!arrivingEnemy) return;

    const timeout = setTimeout(() => {
      // Instead of starting combat immediately, activate the enemy's sabotage effect
      setActiveSabotages((prev) => ({
        ...prev,
        [arrivingEnemy.enemyId]: true
      }));

      addToast(`⚡ WARNING: ${arrivingEnemy.name.toUpperCase()} HAS DEPLOYED ACTIVE SABOTAGE EFFECTS!`, "warn");

      // Apply immediate progress theft when Agent Pur arrives!
      if (arrivingEnemy.enemyId === "agent_pur") {
        modifyRivalryProgress(-4, 10, "Agent Pur Deployed Progress Theft!");
        setInvestigations((prev) => {
          const keys = Object.keys(prev) as MarkerId[];
          const updated = { ...prev };
          let affected = false;
          for (const key of keys) {
            // Deduct progress only from currently active but unfinished objects
            if (updated[key] && updated[key] > 0 && updated[key] < 5) {
              const loss = Math.min(2, updated[key]);
              updated[key] -= loss;
              affected = true;
            }
          }
          if (affected) {
            addToast("⚠️ AGENT PUR STOLE INVESTIGATION DATA: Progress Lost! (-2 Taps)", "warn");
          } else {
            addToast("⚠️ AGENT PUR INTERCEPTED SYSTEM: Core security channels disrupted!", "warn");
          }
          return updated;
        });
      }

      if (arrivingEnemy.enemyId === "beak_storm") {
        modifyRivalryProgress(0, 10, "Beak Storm Deployed - Encryption Pacing Disrupted");
      }

      if (arrivingEnemy.enemyId === "mr_mustela") {
        modifyRivalryProgress(0, 12, "Mr. Mustela Deployed - Data Obstructed and Locked");
      }

      // Apply Poison Fang heavy corruption upon arrival:
      if (arrivingEnemy.enemyId === "poison_fang") {
        modifyRivalryProgress(-8, 18, "Poison Fang Corrupted Evidence Grid!");
        setThreatLevel((t) => Math.min(100, t + 45));
        setInvestigations((prev) => {
          const keys = Object.keys(prev) as MarkerId[];
          const updated = { ...prev };
          let affected = false;
          for (const key of keys) {
            if (updated[key] && updated[key] > 0) {
              updated[key] = Math.max(0, updated[key] - 3);
              affected = true;
            }
          }
          if (affected) {
            addToast("🚨 WARNING: POISON FANG CORRUPTED CORE EVIDENCE FILES! (-3 Taps on all objects)", "warn");
          }
          return updated;
        });
        addToast("🚨 POISON FANG HAS BREACHED THE SYSTEM // FALSE CLUES DETECTED // THREAT LEVEL CRITICAL!", "warn");
      }

      setArrivingEnemy(null);
    }, 3000);

    return () => clearTimeout(timeout);
  }, [arrivingEnemy]);

  // Real-time ticking combat countdown & Boss counter attack checker
  useEffect(() => {
    if (!activeEncounter) return;

    const tick = () => {
      setActiveEncounter((prev) => {
        if (!prev) return null;

        let nextTime = prev.timer - 1;

        // Beak Storm speeds up danger escalation and accelerates threat countdown
        if (prev.enemyId === "beak_storm") {
          setThreatLevel((t) => Math.min(100, t + 1.5));
          nextTime = prev.timer - 2; // 2 seconds decrement per tick (accelerates time pressure)
          // Use Math.abs for check so we don't spam if it jumps past
          if (Math.abs(nextTime % 4) === 0) {
            addToast("⚠️ WARNING: BEAK STORM ACCELERATED THREAT ACTIVITY!", "warn");
          }
        }

        // Poison Fang (Final Boss) major system corruption and threat leak
        if (prev.enemyId === "poison_fang") {
          setThreatLevel((t) => Math.min(100, t + 2)); // Massive threat leak
          if (prev.timer % 5 === 0) {
            addToast("🚨 POISON FANG HAS BREACHED THE SYSTEM // THREAT LEVEL CRITICAL!", "warn");
          }
          
          const sinceLastTap = (Date.now() - prev.lastTimeTapped) / 1000;
          if (sinceLastTap > 1.8) {
            spawnDamageText("💥 CLUE CORRUPTION!");
            setThreatLevel((t) => Math.min(100, t + 5));
            modifyRivalryProgress(0, 3, "Poison Fang Corrupted Case Clues");
            nextTime = Math.max(0, nextTime - 3); // 3 seconds penalty
            playSynthSound("alarm");
            addToast(`🚨 COBRA INTERFERENCE: Poison Fang corrupted clues! +5% Threat Level & -3s Limit! Continuous focus required!`, "warn");
          }
        }

        if (nextTime <= 0) {
          setTimeout(() => {
            handleCombatLoss(prev);
          }, 10);
          return null;
        }

        return { ...prev, timer: nextTime };
      });
    };

    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [activeEncounter]);

  const corruptTextIfHighThreat = (text: string, threat: number) => {
    if (threat < 60) return text;
    
    // Distort text if threat is high
    const glitchChars = ["█", "░", "▒", "▓", "▀", "▄", "■", "▰", "▱"];
    const chars = text.split("");
    const prob = Math.min(0.65, (threat - 40) / 100); // 0.2 to 0.6 probability
    
    const glitched = chars.map((char) => {
      if (char === " " || char === "." || char === "/" || char === "(" || char === ")" || char === ":") return char;
      if (Math.random() < prob) {
        return glitchChars[Math.floor(Math.random() * glitchChars.length)];
      }
      return char;
    }).join("");
    
    return `[⚠️ EVIDENCE CORRUPTED LEVEL ${Math.floor(threat)}%] ${glitched}`;
  };

  const getHumanLabel = (marker: string): string => {
    if (!marker) return "";
    const mappings: Record<string, string> = {
      light_fixture: "Flickering Overhead Light",
      server_rack: "Archived File Stack",
      keyboard: "Input Terminal Keys",
      document: "Classified Paper Folder",
      drawer: "Locked Desk Drawer",
      lvl2_window: "Rain-streaked Window",
      lvl2_fireplace: "Cold Fireplace",
      lvl2_lantern: "Antique Lantern",
      lvl2_typewriter: "Mechanical Typewriter",
      lvl2_chest: "Old Filing Chest",
      lvl3_mainframe: "Secured Evidence Terminal",
      lvl3_terminal: "Case Archive Console",
      lvl3_console: "Network Gateway Interface",
      lvl3_datadrive: "Encrypted Case Drives",
      lvl3_monitor: "Surveillance Feed Monitor",
      lvl3_firewall: "Syndicate Obstruction Shield",
      lvl3_crate: "Smuggled Goods Container"
    };
    return mappings[marker] || marker.replace("lvl2_", "").replace("lvl3_", "").replace("_", " ");
  };

  const getHotspotClue = (marker: string, count: number): string => {
    if (activeSabotages.agent_pur) {
      return corruptTextIfHighThreat("░░ [CLUE STOLEN BY AGENT PUR] ░░ INVESTIGATION DATA DATA EXPIRED / STOLEN ░░ DEFEAT AGENT PUR TO SAFELY DECRYPT FILE FEED!", threatLevel);
    }
    if (activeSabotages.poison_fang) {
      return "░█▓░█▀ WARNING: FALSE CLUES DETECTED █░▓█ POISON FANG HAS BREACHED THE SYSTEM WITH MALWARE ░█ CORRUPTED CODE SYNC ▒█";
    }

    if (!marker) return "Detective link active. Select any highlighted object or archive piece above to search for investigation clues...";

    const humanName = getHumanLabel(marker);
    let rawClue = "";
    
    if (count <= 1) {
      if (marker === "light_fixture") rawClue = "This light keeps flickering...";
      else if (marker === "server_rack") rawClue = "The archived file stack contains locked log volumes. Dust covers the server ports...";
      else if (marker === "keyboard") rawClue = "Dusty keypad. Several keys have excessive wear indicating regular entry of access keys.";
      else if (marker === "document") rawClue = "A shredded paper ledger printout. Some forensic ink patterns are visible under scrutiny.";
      else if (marker === "drawer") rawClue = "A locked heavy-gauge chamber drawer. Fits a special detective scan card.";
      else rawClue = `Investigating the secure ${humanName}... Signals are masked but detectable. (Tap 1/5)`;
    } else if (count === 2) {
      if (marker === "light_fixture") rawClue = "Its lumen fluctuation aligns perfectly with standard encrypted beacon signals.";
      else if (marker === "server_rack") rawClue = "Secondary scans indicate partitioned old cases containing recorded sabotage plans.";
      else if (marker === "keyboard") rawClue = "The key residue exhibits low traces of syndicate synthetic bio-oil.";
      else if (marker === "document") rawClue = "The papers mention 'Project Chiron' and a deep corporate conspiracy lead.";
      else if (marker === "drawer") rawClue = "Forensic scans indicate a cold metal microcapsule hidden inside the deep drawer cavity.";
      else rawClue = `Gaining secondary access to the ${humanName}... Scanning local clues. (Tap 2/5)`;
    } else if (count === 3) {
      if (marker === "light_fixture") rawClue = "This light is suspicious. An auxiliary energy wire leads directly to the neighboring wall module.";
      else if (marker === "server_rack") rawClue = "Intercepted secure directory log! Terminal shows continuous automated background logins.";
      else if (marker === "keyboard") rawClue = "Deciphering keystroke rhythm. The master password sequence starts with 'AG_404_ADMIN'...";
      else if (marker === "document") rawClue = "A scribbled access passcode is buried under notes: 'CLOVER_77'.";
      else if (marker === "drawer") rawClue = "Mechanical locking pins are resisting. Overriding with a detective pulse tool.";
      else rawClue = `Uncovering structural evidence connections in ${humanName}. Clue pressure is mounting... (Tap 3/5)`;
    } else if (count === 4) {
      if (marker === "light_fixture") rawClue = "The light ballast houses a covert transponder chip tracking active staff movements.";
      else if (marker === "server_rack") rawClue = "Datalink established with node b-shards. Transferring hidden case dossiers and notes...";
      else if (marker === "keyboard") rawClue = "A micro-switch under the Spacebar triggers acoustic vibrations and speech playback.";
      else if (marker === "document") rawClue = "The coordinate on the margins leads directly to Clover corporate secure archives.";
      else if (marker === "drawer") rawClue = "Manual safety pins are starting to disengage. Cold cryogenic storage seal is releasing.";
      else rawClue = `Bypassing localized obstructions on ${humanName}. Case file access imminent. (Tap 4/5)`;
    } else {
      if (marker === "light_fixture") rawClue = "The wiring behind the light leads to a hidden wall cache. Found key files!";
      else if (marker === "server_rack") rawClue = "Archive database authorized! Extracted master investigation files. Decoded.";
      else if (marker === "keyboard") rawClue = "Micro-console popped open! Extracted core evidence memory stick.";
      else if (marker === "document") rawClue = "Spectro-scan fully assembled papers. Clover corporate record acquired!";
      else if (marker === "drawer") rawClue = "Drawer unlocked! Obtained highly classified physical case dossier records.";
      else rawClue = `Analysis fully resolved! ${humanName} verified evidence successfully uncovered.`;
    }

    return corruptTextIfHighThreat(rawClue, threatLevel);
  };


  // -----------------------------------------------------
  // Point-and-Click Evidence Search Scene Logic
  // -----------------------------------------------------
  const handleInteractMarker = (marker: MarkerId, amountNeeded: number, e?: React.MouseEvent) => {
    playSynthSound("sonar");
    registerProgress(); // Reset inactivity timer on progress
    
    if (activeSabotages.mr_mustela) {
      modifyRivalryProgress(0, 3, "Evidence Lock Access Denied - Mr. Mustela Locked Interface");
      addToast("⚠️ Lock icon active. EVIDENCE ACCESS DENIED: OBJECT LOCKED BY MR. MUSTELA 🦦", "warn");
      playSynthSound("alarm");
      return;
    }

    if (threatLevel >= 100) {
      addToast("⚠️ DISTRICT LOCKDOWN: Threat Level is critical (100%)! Neutralize active syndicate interference to continue investigations!", "warn");
      playSynthSound("alarm");
      return;
    }

    let dynamicAmountNeeded = amountNeeded;
    if (activeSabotages.beak_storm) {
      dynamicAmountNeeded = amountNeeded + 2;
    } else if (threatLevel >= 85) {
      dynamicAmountNeeded = amountNeeded + 3;
    } else if (threatLevel >= 50) {
      dynamicAmountNeeded = amountNeeded + 1;
    }

    const currentCount = investigations[marker] || 0;
    const isFinishedBefore = currentCount >= dynamicAmountNeeded;
    if (isFinishedBefore) {
      addToast(`Section investigated. No further evidence extracted from target.`, "warn");
      setCurrentClueCount(currentCount);
      setCurrentClueHotspot(marker);
      return;
    }

    if (xp < 5) {
      addToast("⚠️ INSUFFICIENT XP: Complete Tasks To Continue Investigation", "warn");
      playSynthSound("alarm");
      return;
    }

    // Capture tap position
    let animateX = window.innerWidth / 2;
    let animateY = window.innerHeight / 2;
    if (e && e.clientX && e.clientY) {
      animateX = e.clientX;
      animateY = e.clientY;
    }

    setFloatingXps((prev) => [
      ...prev,
      {
        id: Date.now() + Math.random(),
        text: "-5 XP",
        x: animateX,
        y: animateY
      }
    ]);

    const nextXp = Math.max(0, xp - 5);
    setXp(nextXp);

    const currentCountSec = investigations[marker] || 0;
    const nextCountSec = Math.min(dynamicAmountNeeded, currentCountSec + 1);
    const freshlyCompletedSec = nextCountSec >= dynamicAmountNeeded;
    const playerProgressDelta = freshlyCompletedSec ? 8 : 3;
    modifyRivalryProgress(playerProgressDelta, 0, freshlyCompletedSec ? `Evidence Object "${getHumanLabel(marker)}" Completed!` : `Discovered case clue fragment`);

    if (activeSabotages.beak_storm) {
      addToast("⚠️ BEAK STORM REINFORCED SECURITY: tap counter flashes red! Required taps increased (+2)!", "warn");
    } else if (dynamicAmountNeeded > amountNeeded) {
      addToast(`⚠️ COMPROMISED FEED: High Threat Level increased evidence obstruction (+${dynamicAmountNeeded - amountNeeded} taps required)!`, "warn");
    }

    setLastTappedHotspot(marker);
    setCurrentClueHotspot(marker);
    setTimeout(() => {
      setLastTappedHotspot(null);
    }, 450);

    const isLvl3 = marker.startsWith("lvl3_");
    
    // Investigative actions slowly raise hostile alert tracking (+1% threat)
    let nextThreatLevel = threatLevel;
    if (!isProtectedHoursActive()) {
      nextThreatLevel = Math.min(100, threatLevel + 1);
      setThreatLevel(nextThreatLevel);
    }

    setInvestigations((prev) => {
      const current = prev[marker] || 0;
      const nextCount = Math.min(dynamicAmountNeeded, current + 1);
      setCurrentClueCount(nextCount);
      const freshlyCompleted = nextCount >= dynamicAmountNeeded;

      // Extract raw credits
      const rewardCr = freshlyCompleted ? (isLvl3 ? 350 : 250) : (isLvl3 ? 35 : 25);
      
      setCredits((prevCr) => prevCr + rewardCr);
      
      if (isLvl3) {
        const pReward = freshlyCompleted ? 50 : 5;
        setCasePoints((prevCp) => prevCp + pReward);
      }
      
      if (freshlyCompleted) {
        playSynthSound("complete");
        if (isLvl3) {
          addToast(`★ CASE BREAKING SECURED ★ Uncovered critical evidence for ${getHumanLabel(marker)}: +${rewardCr} CR / +50 Case Points!`, "credits");
        } else {
          addToast(`ANALYSIS FULLY RESOLVED: Unlocked ${getHumanLabel(marker)} case profile! Received +${rewardCr} CR!`, "credits");
        }
      } else {
        if (isLvl3) {
          addToast(`Investigating [${getHumanLabel(marker)}]: ${nextCount}/${dynamicAmountNeeded} analyzed. (+${rewardCr} CR / +5 Case Points)`, "success");
        } else {
          addToast(`Probing ${getHumanLabel(marker)}: ${nextCount}/${dynamicAmountNeeded} processed. (+${rewardCr} CR // -5 XP spent)`, "success");
        }
      }
      
      syncUserDataToCloud(credits + rewardCr, nextXp, nextThreatLevel);
      return { ...prev, [marker]: nextCount };
    });
  };

  // Automatic Forced Boss Encounters based on level completions
  useEffect(() => {
    // 1. Level 1 complete forced encounter
    const lvl1Completed = (
      (investigations.light_fixture || 0) >= 5 &&
      (investigations.server_rack || 0) >= 5 &&
      (investigations.keyboard || 0) >= 5 &&
      (investigations.document || 0) >= 5 &&
      (investigations.drawer || 0) >= 5
    );
    if (lvl1Completed && !defeatedLvl1Boss && !activeSabotages.beak_storm && !arrivingEnemy && !activeEncounter) {
      playSynthSound("alarm");
      setArrivingEnemy({
        enemyId: "beak_storm",
        name: "Beak Storm (Level 1 Boss)",
        maxHp: 50,
        isForced: true
      });
    }

    // 2. Level 2 complete forced encounter
    const lvl2Completed = (
      (investigations.lvl2_typewriter || 0) >= 5 &&
      (investigations.lvl2_lantern || 0) >= 5 &&
      (investigations.lvl2_window || 0) >= 5 &&
      (investigations.lvl2_fireplace || 0) >= 5 &&
      (investigations.lvl2_chest || 0) >= 5
    );
    if (lvl2Completed && !defeatedLvl2Boss && !activeSabotages.mr_mustela && !arrivingEnemy && !activeEncounter) {
      playSynthSound("alarm");
      setArrivingEnemy({
        enemyId: "mr_mustela",
        name: "Mr. Mustela (Level 2 Boss)",
        maxHp: 80,
        isForced: true
      });
    }

    // 3. Level 3 complete forced encounter
    const lvl3Completed = (
      (investigations.lvl3_mainframe || 0) >= 5 &&
      (investigations.lvl3_terminal || 0) >= 5 &&
      (investigations.lvl3_console || 0) >= 5 &&
      (investigations.lvl3_datadrive || 0) >= 5 &&
      (investigations.lvl3_monitor || 0) >= 5 &&
      (investigations.lvl3_firewall || 0) >= 5 &&
      (investigations.lvl3_crate || 0) >= 5
    );
    if (lvl3Completed && !defeatedFinalBoss && !activeSabotages.poison_fang && !arrivingEnemy && !activeEncounter) {
      playSynthSound("alarm");
      setArrivingEnemy({
        enemyId: "poison_fang",
        name: "Poison Fang (FINAL BOSS)",
        maxHp: 120,
        isForced: true
      });
    }
  }, [investigations, defeatedLvl1Boss, defeatedLvl2Boss, defeatedFinalBoss, activeEncounter, activeSabotages, arrivingEnemy]);

  const [investigationLevel, setInvestigationLevel] = useState<1 | 2 | 3>(() => {
    const saved = localStorage.getItem("agent_investigation_level");
    const lvl = saved === "3" ? 3 : saved === "2" ? 2 : 1;

    const savedInvest = localStorage.getItem("agent_investigations");
    let isL1Done = false;
    let isL2Done = false;
    if (savedInvest) {
      try {
        const parsed = JSON.parse(savedInvest);
        isL1Done = (
          (parsed.light_fixture || 0) >= 5 &&
          (parsed.server_rack || 0) >= 5 &&
          (parsed.keyboard || 0) >= 5 &&
          (parsed.document || 0) >= 5 &&
          (parsed.drawer || 0) >= 5
        );
        isL2Done = (
          (parsed.lvl2_typewriter || 0) >= 5 &&
          (parsed.lvl2_lantern || 0) >= 5 &&
          (parsed.lvl2_window || 0) >= 5 &&
          (parsed.lvl2_fireplace || 0) >= 5 &&
          (parsed.lvl2_chest || 0) >= 5
        );
      } catch (e) {}
    }

    const isL2Defeated = localStorage.getItem("agent_defeated_lvl2_boss") === "true";
    if (lvl === 3 && (!isL2Done || !isL2Defeated)) {
      return isL1Done ? 2 : 1;
    }
    if (lvl === 2 && !isL1Done) {
      return 1;
    }
    return lvl;
  });

  useEffect(() => {
    localStorage.setItem("agent_investigation_level", investigationLevel.toString());
    const baseProgress = getOverallInvestigationProgress();
    setPlayerProgress(baseProgress);
    setRivalProgress(15);
    localStorage.setItem("agent_rivalry_player_progress", baseProgress.toString());
    localStorage.setItem("agent_rivalry_rival_progress", "15");
  }, [investigationLevel]);

  const isLevel1Complete = () => {
    return (
      (investigations.light_fixture || 0) >= 5 &&
      (investigations.server_rack || 0) >= 5 &&
      (investigations.keyboard || 0) >= 5 &&
      (investigations.document || 0) >= 5 &&
      (investigations.drawer || 0) >= 5
    );
  };

  const isLevel2Complete = () => {
    return (
      (investigations.lvl2_typewriter || 0) >= 5 &&
      (investigations.lvl2_lantern || 0) >= 5 &&
      (investigations.lvl2_window || 0) >= 5 &&
      (investigations.lvl2_fireplace || 0) >= 5 &&
      (investigations.lvl2_chest || 0) >= 5
    );
  };

  const isLevel3Complete = () => {
    return (
      (investigations.lvl3_mainframe || 0) >= 5 &&
      (investigations.lvl3_terminal || 0) >= 5 &&
      (investigations.lvl3_console || 0) >= 5 &&
      (investigations.lvl3_datadrive || 0) >= 5 &&
      (investigations.lvl3_monitor || 0) >= 5 &&
      (investigations.lvl3_firewall || 0) >= 5 &&
      (investigations.lvl3_crate || 0) >= 5
    );
  };

  // Trigger Badge Unlock screen automatically upon level completion transition
  useEffect(() => {
    const isL1 = isLevel1Complete();
    const isL2 = isLevel2Complete();
    const isL3 = isLevel3Complete();

    if (isL1 && !shownBadgeUnlocks.includes(1)) {
      setShownBadgeUnlocks((prev) => [...prev, 1]);
      setActiveBadgeUnlock(1);
    } else if (isL2 && !shownBadgeUnlocks.includes(2)) {
      setShownBadgeUnlocks((prev) => [...prev, 2]);
      setActiveBadgeUnlock(2);
    } else if (isL3 && !shownBadgeUnlocks.includes(3)) {
      setShownBadgeUnlocks((prev) => [...prev, 3]);
      setActiveBadgeUnlock(3);
    }
  }, [investigations, shownBadgeUnlocks]);

  // Helper calculates overall searched percentage
  const getOverallInvestigationProgress = () => {
    if (investigationLevel === 1) {
      const caps = {
        light_fixture: 5,
        server_rack: 5,
        keyboard: 5,
        document: 5,
        drawer: 5
      };
      let totalInvestigated = 0;
      let totalCapacity = 0;
      Object.keys(caps).forEach((key) => {
        totalInvestigated += Math.min(5, investigations[key as MarkerId] || 0);
        totalCapacity += caps[key as keyof typeof caps];
      });
      return Math.min(100, Math.floor((totalInvestigated / totalCapacity) * 100));
    } else if (investigationLevel === 2) {
      const caps = {
        lvl2_typewriter: 5,
        lvl2_lantern: 5,
        lvl2_window: 5,
        lvl2_fireplace: 5,
        lvl2_chest: 5
      };
      let totalInvestigated = 0;
      let totalCapacity = 0;
      Object.keys(caps).forEach((key) => {
        totalInvestigated += Math.min(5, investigations[key as MarkerId] || 0);
        totalCapacity += caps[key as keyof typeof caps];
      });
      return Math.min(100, Math.floor((totalInvestigated / totalCapacity) * 100));
    } else {
      const caps = {
        lvl3_mainframe: 5,
        lvl3_terminal: 5,
        lvl3_console: 5,
        lvl3_datadrive: 5,
        lvl3_monitor: 5,
        lvl3_firewall: 5,
        lvl3_crate: 5
      };
      let totalInvestigated = 0;
      let totalCapacity = 0;
      Object.keys(caps).forEach((key) => {
        totalInvestigated += Math.min(caps[key as keyof typeof caps], investigations[key as MarkerId] || 0);
        totalCapacity += caps[key as keyof typeof caps];
      });
      return Math.min(100, Math.floor((totalInvestigated / totalCapacity) * 100));
    }
  };


  // -----------------------------------------------------
  // Agency Shop Acquisition Module
  // -----------------------------------------------------
  const initialShopItems: ShopItem[] = [
    // 1. COATS & OUTFITS
    { id: "item_trenchcoat", title: "Shadow Infiltrator", cost: 120, description: "Stealth active-camouflage cloak. +Tactical sync bonus.", category: "coats", locked: false },
    { id: "item_cloak", title: "Bloodroot Cloak", cost: 150, description: "Heavy thermal shield crimson shroud. Enhanced armor weave.", category: "coats", locked: false },
    { id: "item_recon", title: "Night Ops Tactical Suit", cost: 130, description: "Covert carbon nanosuit padding. Specialized for climbing.", category: "coats", locked: false },
    { id: "item_vest", title: "Field Detective Coat", cost: 100, description: "Classic wool vest and micro-wire tracking receiver.", category: "coats", locked: false },
    { id: "item_neon", title: "Neon Grid Jacket", cost: 140, description: "High-visibility cyberpunk infiltration coat. Tracker active.", category: "coats", locked: false },
    { id: "item_arctic", title: "Arctic Agent Coat", cost: 130, description: "Tundra sub-zero heavy insulation with thermal shields.", category: "coats", locked: false },

    // 2. GOGGLES & FACE ACCESSORIES
    { id: "item_goggles", title: "Thermal Scopes", cost: 80, description: "Enhanced optic visor for clue detection. Infrared sensor.", category: "goggles", locked: false },
    { id: "item_visor", title: "Gold-Rim Spy Visor", cost: 80, description: "Polarized luxury target scanner HUD and drone connector.", category: "goggles", locked: false },
    { id: "item_lens", title: "Cracked Prototype Lens", cost: 70, description: "Repurposed hacker glass. Glitch security override matrix.", category: "goggles", locked: false },
    { id: "item_hacker", title: "Dual-Lens Hacker Goggles", cost: 80, description: "Direct terminal feed analyzer. Parallel digital sweeps.", category: "goggles", locked: false },
    { id: "item_mask", title: "Phantom Mask", cost: 70, description: "Anti-biometric scanning scrambler. Faceshield projection.", category: "goggles", locked: false },
    { id: "item_collar", title: "Voice Scrambler Collar", cost: 60, description: "Vocal frequency modulator. Secure channel communications.", category: "goggles", locked: false },

    // 3. TAIL UPGRADES
    { id: "item_antenna", title: "Shock Tail Antenna", cost: 90, description: "Signal disruption tail upgrade. Charge discharge link.", category: "tails", locked: false },
    { id: "item_hook", title: "Magnetic Hook Tail", cost: 90, description: "Silent structural grapple claw. Ultra-range leverage.", category: "tails", locked: false },
    { id: "item_jammer", title: "Signal Jammer Tail", cost: 80, description: "Portable tactical beacon scrambler. Dampens field radars.", category: "tails", locked: false },
    { id: "item_grapple", title: "Plasma Grapple", cost: 100, description: "High energy vertical plasma anchor strap. Quick traction.", category: "tails", locked: false },
    { id: "item_claw", title: "Triple-Claw Tail", cost: 110, description: "Semiautonomous micro-lockpicker subassembly helper.", category: "tails", locked: false },

    // 4. HATS
    { id: "item_fedora", title: "Noir Fedora", cost: 60, description: "Classic reinforced halogen brim felt shade hat.", category: "hats", locked: false },
    { id: "item_beret", title: "Tactical Beret", cost: 60, description: "Elite agent wool beret. Special operations certification.", category: "hats", locked: false },
    { id: "item_hoodcap", title: "Hood + Cap Combo", cost: 60, description: "Stealth security camera visor. Anti-recognition sweep.", category: "hats", locked: false },
    { id: "item_cyberhat", title: "Cyber Detective Hat", cost: 70, description: "Triangulated sensor deerstalker. Parsed grid tracker.", category: "hats", locked: false },
    { id: "item_headset", title: "Signal Officer Headset", cost: 60, description: "High frequency audio interceptor. Direct line decryptor.", category: "hats", locked: false },
    { id: "item_crown", title: "Broken Crown Helmet", cost: 80, description: "Cracked operational helm. Unlocks on Beak Storm defeat.", category: "hats", locked: false }, // Hint details

    // 5. UTILITY ACCESSORIES
    { id: "item_drone", title: "Mini Drone Companion", cost: 120, description: "Autonomous pathfinder drone scout with telemetry uplink.", category: "utility", locked: false },
    { id: "item_wrist", title: "Holo-Wrist Device", cost: 90, description: "Sub-dermal holographic terminal projector interface.", category: "utility", locked: false },
    { id: "item_satchel", title: "Spy Satchel", cost: 80, description: "Weatherproof datachip compartment pouch. High capacity.", category: "utility", locked: false },
    { id: "item_belt", title: "Lockpick Belt", cost: 70, description: "Serrated locksmith picks and secondary gear loops.", category: "utility", locked: false },
    { id: "item_injector", title: "Energy Injector", cost: 70, description: "Emergency adrenalin dose. Shuts database down alerts.", category: "utility", locked: false },
    { id: "item_files", title: "Classified File Holder", cost: 80, description: "Carbon hardcase for dossier storage. Unlocks on Mustela defeat.", category: "utility", locked: false },

    // Legacy compatibility fallback
    { id: "item_emblem", title: "Velvet Fang Emblem", cost: 0, description: "Elite level insignia badge.", category: "rewards", locked: false, unlockedByBoss: true },
    { id: "item_trophy", title: "Viper Boss Trophy", cost: 9999, description: "Syndicate victory commemoration statue.", category: "rewards", locked: true }
  ];

  const handleAcquireShopItem = (item: ShopItem) => {
    playSynthSound("tap");
    
    if (purchasedItemIds.includes(item.id)) {
      addToast(`Inventory alert: You already own the ${item.title}!`, "warn");
      return;
    }

    if (credits < item.cost) {
      addToast(`Acquisition blocked: Insufficient operational CR. Needed: ${item.cost} CR`, "warn");
      return;
    }

    // Process acquisition
    const remainingCr = credits - item.cost;
    setCredits(remainingCr);
    setPurchasedItemIds((prev) => [...prev, item.id]);
    
    addToast(`ACQUIRING ${item.title}... Decent transaction processed.`, "success");
    addToast(`Successfully acquired ${item.title}! Inventory updated.`, "credits");
    
    syncUserDataToCloud(remainingCr, xp, threatLevel);
  };

  const handleToggleEquipItem = (itemId: string) => {
    playSynthSound("sonar");
    const item = initialShopItems.find((i) => i.id === itemId);
    if (!item) return;

    if (!purchasedItemIds.includes(itemId)) {
      addToast(`Access Blocked: Purchase ${item.title} first!`, "warn");
      return;
    }

    setEquippedItemIds((prev) => {
      // Find other items in the same category
      const sameCategoryItems = initialShopItems.filter((i) => i.category === item.category);
      const cleaned = prev.filter((id) => !sameCategoryItems.some((s) => s.id === id));
      
      if (prev.includes(itemId)) {
        // Toggle off
        addToast(`Disengaged: ${item.title}`, "warn");
        return cleaned;
      } else {
        // Toggle on
        addToast(`Equipped: ${item.title}`, "success");
        return [...cleaned, itemId];
      }
    });
  };


  // -----------------------------------------------------
  // Intelligent Operations Briefing Decrypter (Gemini Part)
  // -----------------------------------------------------
  const handleSendDreamToBriefingSystem = async () => {
    if (!dreamInputStr.trim()) return;
    playSynthSound("tap");
    
    const userMessage: ChatMessage = {
      id: "msg_user_" + Date.now(),
      userId: user?.uid || "local_agent",
      sender: "user",
      content: dreamInputStr.trim(),
      createdAt: new Date().toISOString()
    };

    setMessages((prev) => [...prev, userMessage]);
    setDreamInputStr("");
    setSendingAIQuery(true);

    try {
      // Call our express backend route that handles server-side Gemini generation!
      const res = await fetch("/api/briefing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: userMessage.content })
      });

      if (!res.ok) {
        throw new Error("satellite connection dropout");
      }

      const data = await res.json();
      
      const aiResponse: ChatMessage = {
        id: "msg_ai_" + Date.now(),
        userId: user?.uid || "local_agent",
        sender: "ai",
        content: data.text || "Corrupted signal format decoded.",
        createdAt: new Date().toISOString()
      };

      setMessages((prev) => [...prev, aiResponse]);
      playSynthSound("complete");

    } catch (err) {
      console.error(err);
      addToast("Briefing transmission network dropout. Decrypted offline report formulated.", "warn");
      
      // Dynamic offline mock reply to maintain absolute playability even if network key is unassigned
      const backupAi: ChatMessage = {
        id: "msg_ai_offline_" + Date.now(),
        userId: user?.uid || "local_agent",
        sender: "ai",
        content: "TRANSMISSION ERROR OFFLINE FALLBACK:\n\nAgent, your subconscious dream signals a transition or an underlying emotional challenge. While our remote satellite link is temporarily down, let us interpret this wave pattern psychologically: element pathways, keys, or corridors in your subconscious signals often represent strives toward transitions or resolving hidden stressors within your waking environment. Refine your cognitive focus to prepare.\n\n*Connection Status: Offline Fallback Active*",
        createdAt: new Date().toISOString()
      };
      setMessages((prev) => [...prev, backupAi]);
    } finally {
      setSendingAIQuery(false);
    }
  };

  const handleRateMessage = (msgId: string, ratingValue: number) => {
    playSynthSound("credits");
    setMessages((prev) =>
      prev.map((msg) => (msg.id === msgId ? { ...msg, rating: ratingValue } : msg))
    );
    addToast(`Feedback logged into terminal registry: ${ratingValue} / 5 stars`, "success");
  };


  // -----------------------------------------------------
  // Clock time updating
  // -----------------------------------------------------
  useEffect(() => {
    // Session stopwatch timer count representing Intelligence Analysis habit
    if (!sessionTimerActive) return;
    const interval = setInterval(() => {
      setSessionSecCount((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [sessionTimerActive]);

  // Sleep Player simulated audio Loop
  useEffect(() => {
    let playInterval: any = null;
    if (sleepPlaying) {
      playInterval = setInterval(() => {
        // give tiny random rest coordinates
        addToast("Sleep audio loop active: Playing relaxing ambient white-noise waves...", "success");
      }, 15000);
    }
    return () => clearInterval(playInterval);
  }, [sleepPlaying]);

  // Exercise simulated countdown loop
  const handleToggleExerciseSession = () => {
    playSynthSound("tap");
    if (exercisePlaying) {
      setExercisePlaying(false);
      clearInterval(exerciseTimerRef.current);
      addToast("Physical tactical session paused.", "warn");
    } else {
      if (exerciseProgressSec >= 1800) {
        addToast("Daily tactical combat routine already maxed out!", "warn");
        return;
      }
      setExercisePlaying(true);
      addToast("Initiated physical endurance scan tracker.", "success");
      exerciseTimerRef.current = setInterval(() => {
        setExerciseProgressSec((prev) => {
          const next = prev + 60; // moves 1 minute
          if (next >= 1800) {
            // Completed exercise!
            clearInterval(exerciseTimerRef.current);
            setExercisePlaying(false);
            // reward
            const targetThreat = Math.max(0, threatLevel - 25);
            setThreatLevel(targetThreat);
            setXp((prevXp) => prevXp + 200);
            addToast("SUCCESS: Combat training limit resolved! -25% Threat Level, +200 XP", "success");
            syncUserDataToCloud(credits, xp + 200, targetThreat);
            return 1800;
          }
          return next;
        });
      }, 1000); // 1 second is mock 1 minute
    }
  };


  const agentLevel = Math.max(1, Math.min(10, 1 + Math.floor(xp / 500)));
  const xpForCurrentLevel = xp % 500;
  const xpProgressPct = Math.max(0, Math.min(100, (xpForCurrentLevel / 500) * 100));

  const rankTitles = [
    "Novice Detective",
    "Field Infiltrator",
    "Telemetry Decrypter",
    "Operational Expert",
    "Syndicate Scout",
    "Infiltration Lead",
    "Division Inspector",
    "Command Agent",
    "Cyber Vanguard",
    "Master Operative"
  ];
  const agentRank = rankTitles[agentLevel - 1] || "Classified Operative";

  const handleDebugLevelUp = () => {
    playSynthSound("complete");
    
    // Save current level/rank details for the modal
    const currentLvl = agentLevel;
    const nextLvl = Math.min(10, currentLvl + 1);
    const nextRank = rankTitles[nextLvl - 1] || "Classified Operative";

    // 1. Calculate next level start point for XP
    const nextXp = (nextLvl - 1) * 500;
    setXp(nextXp);

    // 2. Automatically unlock the next investigation level's content
    let updatedLevel = investigationLevel;
    let nextInvestigations = { ...investigations };
    
    if (investigationLevel === 1) {
      updatedLevel = 2;
      nextInvestigations.light_fixture = 5;
      nextInvestigations.server_rack = 5;
      nextInvestigations.keyboard = 5;
      nextInvestigations.document = 5;
      nextInvestigations.drawer = 5;
      setInvestigations(nextInvestigations);
      setInvestigationLevel(2);
      addToast("Level 1 Investigation Completed & Unlocked!", "success");
    } else if (investigationLevel === 2) {
      updatedLevel = 3;
      nextInvestigations.lvl2_typewriter = 5;
      nextInvestigations.lvl2_lantern = 5;
      nextInvestigations.lvl2_window = 5;
      nextInvestigations.lvl2_fireplace = 5;
      nextInvestigations.lvl2_chest = 5;
      setInvestigations(nextInvestigations);
      setInvestigationLevel(3);
      addToast("Level 2 Investigation Completed & Unlocked!", "success");
    } else if (investigationLevel === 3) {
      nextInvestigations.lvl3_mainframe = 5;
      nextInvestigations.lvl3_terminal = 5;
      nextInvestigations.lvl3_console = 5;
      nextInvestigations.lvl3_datadrive = 5;
      nextInvestigations.lvl3_monitor = 5;
      nextInvestigations.lvl3_firewall = 5;
      nextInvestigations.lvl3_crate = 5;
      setInvestigations(nextInvestigations);
      setDefeatedFinalBoss(true);
      addToast("Level 3 Investigation Completed!", "success");
    }

    // 3. Save progression (sync to cloud & localstorage)
    syncUserDataToCloud(credits, nextXp, threatLevel);
    localStorage.setItem("agent_xp", nextXp.toString());
    localStorage.setItem("agent_investigation_level", updatedLevel.toString());
    localStorage.setItem("agent_investigations", JSON.stringify(nextInvestigations));

    // 4. Set state to show the level-up animation popup
    setDebugLevelUpPopup({
      show: true,
      oldLevel: currentLvl,
      newLevel: nextLvl,
      newRank: nextRank
    });
    
    addToast(`DEBUG INTEL OVERRIDE: Level ${nextLvl} unlocked!`, "success");
  };

  // -----------------------------------------------------
  // Render View Components
  // -----------------------------------------------------
  return (
    <div className="min-h-screen bg-[#050505] text-[#f3f4f6] relative overflow-x-hidden flex items-center justify-center select-none font-body">
      
      {/* Dynamic atmospheric desk grains */}
      <div className="grain-overlay absolute inset-0 z-0 bg-repeat"></div>

      {/* Responsive constraints: Constrained container acting as mobile viewport on desktop, scales naturally on smartphones */}
      <div className="w-full max-w-md min-h-screen bg-[#0c0c0c] border-x border-white/5 shadow-2xl flex flex-col relative z-10 pb-24">
        
        {/* Floating XP -5 Micro-Animations */}
        <div className="absolute inset-0 pointer-events-none z-50 overflow-hidden">
          {floatingXps.map((item) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 1, y: item.y - 20, x: Math.min(Math.max(20, item.x - 45), 320), scale: 0.85 }}
              animate={{ opacity: 0, y: item.y - 130, scale: 1.12 }}
              transition={{ duration: 0.9, ease: "easeOut" }}
              className="absolute font-mono text-xs font-extrabold text-[#f87171] drop-shadow-[0_0_8px_rgba(239,68,68,0.45)] select-none whitespace-nowrap"
            >
              {item.text}
            </motion.div>
          ))}
        </div>

        {/* TOP STATUS API BAR */}
        <header className="sticky top-0 left-0 w-full z-40 flex justify-between items-center px-4 h-16 bg-[#111111]/80 backdrop-blur-md border-b border-white/5 shadow-md">
          <button 
            onClick={() => { playSynthSound("tap"); setIsProfileOpen(true); }}
            className="flex items-center gap-2 px-2.5 py-1.5 bg-[#161412] hover:bg-[#201d19] border border-white/10 rounded-xl cursor-pointer text-left transition-all active:scale-95 group relative overflow-hidden max-w-[180px] shadow-sm font-mono"
          >
            <div className="w-9 h-9 bg-zinc-950 rounded-full border border-white/10 flex items-center justify-center p-0.5 flex-shrink-0 group-hover:border-emerald-500/50 transition-colors">
              <RodentAvatar 
                size={34} 
                coat={equippedItemIds.find(id => initialShopItems.find(item => item.id === id)?.category === "coats")}
                goggles={equippedItemIds.find(id => initialShopItems.find(item => item.id === id)?.category === "goggles")}
                tail={equippedItemIds.find(id => initialShopItems.find(item => item.id === id)?.category === "tails")}
                hat={equippedItemIds.find(id => initialShopItems.find(item => item.id === id)?.category === "hats")}
                utility={equippedItemIds.find(id => initialShopItems.find(item => item.id === id)?.category === "utility")}
              />
            </div>
            <div className="space-y-0.5 leading-none flex-grow min-w-0 pr-1">
              <div className="text-[10px] font-black text-white group-hover:text-emerald-400 transition-colors truncate">
                {codename}
              </div>
              <div className="text-[7.5px] text-zinc-400 font-bold uppercase truncate">
                {agentRank}
              </div>
              <div className="text-[7px] text-zinc-550 font-extrabold uppercase">
                LVL {agentLevel} AGENT
              </div>
            </div>

            {/* Micro XP Progress Bar embedded in button bottom */}
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-zinc-950">
              <div className="h-full bg-emerald-550 rounded-sm" style={{ width: `${xpProgressPct}%` }}></div>
            </div>
          </button>
          
          <div className="flex items-center gap-2">
            {/* Authenticated user sync state badge indicator */}
            <button 
              onClick={user ? handleSignOut : handleGoogleSignIn}
              className={`text-[10px] uppercase font-bold py-1.5 px-3 rounded text-xs transition-all active:scale-95 flex items-center gap-1 ${
                user 
                ? "bg-[#161616] text-white/90 border border-white/10 hover:text-blue-400" 
                : "bg-blue-600 text-white font-extrabold shadow-[0_0_15px_rgba(37,99,235,0.35)] hover:bg-blue-500"
              }`}
            >
              {user ? <LogOut size={11} /> : <Zap size={11} className="animate-pulse" />}
              {user ? "Cloud Active" : "Sign In"}
            </button>
            <button 
              onClick={() => { playSynthSound("tap"); setShowSettings(true); }}
              className="p-1 px-1.5 rounded-lg border border-white/5 text-gray-400 hover:text-white active:scale-95 transition-all text-xs flex items-center justify-center h-8"
            >
              <Settings size={16} />
            </button>
          </div>
        </header>

        {/* MAIN BODY CONTENTS - Scrollable */}
        <main className="flex-grow p-4 space-y-6 overflow-y-auto">
          
          {/* TOAST NOTIFICATION STREAM */}
          <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 w-full max-w-[340px] pointer-events-none space-y-2 px-4">
            <AnimatePresence>
              {toasts.map((t) => (
                <motion.div
                  key={t.id}
                  initial={{ opacity: 0, y: -10, scale: 0.9 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 5, scale: 0.9 }}
                  className={`p-3 rounded-xl border text-xs font-bold shadow-xl flex items-center gap-2 pointer-events-auto backdrop-blur-md ${
                    t.type === "warn" 
                    ? "bg-red-950/90 border-red-500/20 text-red-100" 
                    : t.type === "credits"
                    ? "bg-[#161616]/95 border-blue-500/30 text-blue-400"
                    : "bg-[#161616]/95 border-white/10 text-white"
                  }`}
                >
                  <AlertCircle size={14} className="flex-shrink-0 text-blue-500" />
                  <span>{t.text}</span>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

          {/* VIEW RENDER BRANCHES */}
          <AnimatePresence mode="wait">
            
            {/* TAB 1: HOME DASHBOARD */}
            {activeTab === "home" && (
              <motion.div 
                key="tab_home"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-6"
              >
                
                {/* Agent Stats Summary Dashboard Cards */}
                <section className="bg-gradient-to-br from-[#111111] to-[#161616] border border-white/5 p-5 rounded-2xl relative overflow-hidden shadow-xl">
                  <div className="absolute top-2 right-2 flex items-center justify-center pointer-events-none">
                    <RodentAvatar 
                      size={80} 
                      coat={equippedItemIds.find(id => initialShopItems.find(item => item.id === id)?.category === "coats")}
                      goggles={equippedItemIds.find(id => initialShopItems.find(item => item.id === id)?.category === "goggles")}
                      tail={equippedItemIds.find(id => initialShopItems.find(item => item.id === id)?.category === "tails")}
                      hat={equippedItemIds.find(id => initialShopItems.find(item => item.id === id)?.category === "hats")}
                      utility={equippedItemIds.find(id => initialShopItems.find(item => item.id === id)?.category === "utility")}
                      className="opacity-25"
                    />
                  </div>
                  <h3 className="text-xs uppercase font-extrabold text-gray-400 mb-4 tracking-widest flex items-center gap-1.5">
                    <Sparkles size={11} className="text-blue-500" /> Agent Telemetry Desk
                  </h3>
                  <div className="grid grid-cols-3 gap-2">
                    <div className="bg-[#1a1a1a] border border-white/5 rounded-xl p-3 text-center transition-all hover:border-red-500/30">
                      <p className="text-[8px] font-bold text-gray-500 tracking-wider">THREAT LEVEL</p>
                      <p className="font-headline text-lg font-light text-white mt-0.5">
                        {threatLevel}<span className="text-[10px] text-red-500 ml-0.5">%</span>
                      </p>
                      <div className="w-full bg-black/60 h-1 rounded-full overflow-hidden mt-2 max-w-[50px] mx-auto">
                        <div className="h-full bg-red-500 progress-glow" style={{ width: `${threatLevel}%` }}></div>
                      </div>
                    </div>
                    <div className="bg-[#1a1a1a] border border-white/5 rounded-xl p-3 text-center transition-all hover:border-blue-500/30">
                      <p className="text-[8px] font-bold text-gray-500 tracking-wider">CREDITS</p>
                      <p className="font-headline text-lg font-light text-white mt-0.5">
                        {credits.toLocaleString()}<span className="text-[9px] text-blue-500 ml-0.5">CR</span>
                      </p>
                    </div>
                    <div className="bg-[#1a1a1a] border border-white/5 rounded-xl p-3 text-center transition-all hover:border-blue-500/30">
                      <p className="text-[8px] font-bold text-gray-500 tracking-wider">COGNITIVE XP</p>
                      <p className="font-headline text-lg font-light text-white mt-0.5">
                        {xp.toLocaleString()}<span className="text-[9px] text-indigo-500 ml-0.5">XP</span>
                      </p>
                    </div>
                  </div>
                </section>

                {/* Tactical Case Progress vs Rival bar */}
                <section className="space-y-2 bg-[#111111] p-4 rounded-2xl border border-white/5 relative overflow-hidden">
                  <div className="flex justify-between text-[10px] font-extrabold uppercase tracking-widest text-gray-400">
                    <span className={`text-blue-400 flex items-center gap-1.5 transition-all duration-300 ${flashPlayerChange ? "scale-105 text-white brightness-150 font-black" : ""}`}>
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-ping inline-block"></span>
                      YOU {playerProgress}%
                    </span>
                    <span className={`text-red-500 tracking-widest text-right font-black transition-all duration-300 ${flashRivalChange ? "scale-105 text-red-300 animate-pulse bg-red-950/40 px-1 rounded inline-block" : ""}`}>
                      RIVAL {rivalProgress}%
                    </span>
                  </div>
                  <div className="h-3 bg-black rounded-full overflow-hidden flex p-[1.5px] border border-white/5 shadow-inner relative">
                    {/* Player bar */}
                    <div 
                      className={`h-full bg-gradient-to-r from-blue-500 to-blue-600 rounded-full transition-all duration-700 ease-out relative shadow-[0_0_12px_rgba(59,130,246,0.6)] ${flashPlayerChange ? "brightness-125" : ""}`} 
                      style={{ width: `${playerProgress}%` }}
                    >
                      {/* Tactical pulse lines inside player bar */}
                      <div className="absolute inset-0 bg-[linear-gradient(90deg,transparent_45%,rgba(255,255,255,0.4)_50%,transparent_55%)] bg-[size:200%_100%] animate-[shimmer_2s_infinite]"></div>
                    </div>
                    {/* Rival bar */}
                    <div 
                      className={`h-full bg-gradient-to-l from-red-600 to-[#7f1d1d] opacity-90 rounded-full transition-all duration-700 ease-out relative ${flashRivalChange ? "animate-pulse brightness-150 border-r border-red-400" : ""}`} 
                      style={{ width: `${rivalProgress}%` }}
                    >
                      {/* Glitch lines inside rival bar */}
                      <div className="absolute inset-0 opacity-20 bg-[repeating-linear-gradient(45deg,#000,#000_2px,transparent_2px,transparent_6px)]"></div>
                    </div>
                  </div>
                  <p className="text-center font-mono text-[9px] text-gray-500 lowercase tracking-widest font-extrabold flex items-center justify-center gap-1.5">
                    <span className={`inline-block w-1.5 h-1.5 rounded-full ${playerProgress >= rivalProgress ? "bg-blue-400 animate-pulse" : "bg-red-500 animate-ping"}`}></span>
                    {getRivalrySubtitleValue()}
                  </p>
                </section>

                {/* CURRENT CASE DETAIL POLAROID TILT CARD */}
                <section className="p-4 bg-[#161616] border border-white/10 shadow-2xl rounded-2xl transition-all duration-300 relative group">
                  
                  {/* Photo area with case industrial rain picture */}
                  <div className="bg-[#0e0e0e] aspect-[16/10] w-full rounded-xl overflow-hidden border border-white/5 relative mb-4">
                    <img 
                      className="w-full h-full object-cover grayscale opacity-70 group-hover:grayscale-0 group-hover:opacity-100 transition-all duration-700 hover:scale-105"
                      src="https://lh3.googleusercontent.com/aida-public/AB6AXuAjsuOvPUqh1Yx9xcx9wiuZfuPxUQNBxIEMOrKQB3vlr2WHpS79JwoCfOa0DbBrjvrbYURJY1_BK4RvObCWfq4MjTITnEy4yTkuzgtFRzPEthnBpEfJTjd8w8uf9Nljy1vZBmzM7eTsfyenAWqGy2KeMfFNUmrbESoYEahHk2uM7DNWuBMKpaDWyskhQQZm2AZP3peXVPxSgk3a6N_iZjlC1-NPGkvhuFwS57kaZudNBg53YGxRPSqIkD97a1Gwf_34irHNAZ3WD_k"
                      alt="Industrial Sector Hall" 
                    />
                    <div className="absolute top-2.5 left-2.5 bg-red-500/10 text-red-400 border border-red-500/20 font-mono text-[8px] font-bold px-2 py-0.5 rounded-full tracking-widest uppercase">
                      Classified
                    </div>
                  </div>

                  <div className="space-y-2">
                    <h4 className="leading-none text-white text-md font-extrabold tracking-tight uppercase">
                      MISSING DATA CHIP
                    </h4>
                    <p className="text-[12px] leading-snug text-gray-400 pl-3 border-l-2 border-blue-600 font-normal">
                      Subject was last seen entering the North Sector terminal vault. Locate the code carrier chip before the rival infiltrant triggers a wipeout. High priority.
                    </p>
                  </div>

                  <div className="mt-4 flex justify-between items-center border-t border-white/5 pt-3.5 text-gray-400">
                    <span className="text-[8px] font-bold tracking-widest font-mono uppercase">CONFIDENTIAL // SECTOR N7</span>
                    <button 
                      onClick={() => { playSynthSound("tap"); setActiveTab("investigate"); }}
                      className="px-3.5 py-1.5 text-[10px] font-bold uppercase tracking-wider rounded-xl bg-blue-600 text-white hover:bg-blue-500 active:scale-95 shadow-[0_0_15px_rgba(59,130,246,0.25)] hover:shadow-[0_0_20px_rgba(59,130,246,0.4)] transition-all text-xs"
                    >
                      RESUME INVESTIGATION
                    </button>
                  </div>
                </section>

                {/* HABIT PROTOCOLS LIST WIDGETS */}
                <section className="space-y-3 bg-[#111111] border border-white/5 rounded-2xl overflow-hidden shadow-xl">
                  <div className="px-5 py-4 bg-white/2 border-b border-white/5 flex justify-between items-center">
                    <h3 className="font-extrabold text-[11px] text-gray-200 tracking-widest uppercase flex items-center gap-1.5">
                      <Award size={12} className="text-blue-500" /> DAILY OPS
                    </h3>
                    <div className="flex items-center gap-2">
                       <span className={`px-2 py-0.5 rounded-full text-[8.5px] uppercase tracking-widest font-bold border ${
                        habits.every((h) => isHabitAuthorized(h.type))
                        ? "bg-yellow-550/10 text-yellow-400 border-yellow-500/20 animate-pulse" 
                        : "bg-amber-500/10 text-amber-500 border-amber-500/20"
                      }`}>
                        {habits.every((h) => isHabitAuthorized(h.type)) ? "🔓 TARGETS" : "🔒 TARGETS"}
                      </span>
                      <span className="font-mono text-[9px] text-blue-400 uppercase tracking-widest bg-blue-500/10 px-2.5 py-0.5 rounded-full border border-blue-500/20">
                        {habits.filter((h) => h.completed).length}/{habits.length}
                      </span>
                    </div>
                  </div>

                  <div className="divide-y divide-white/5">
                    {habits.map((h) => (
                      <div key={h.id} className="p-4 hover:bg-white/2 transition-colors">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-3">
                            {/* Checkbox circle triggers toggle */}
                            <button 
                              onClick={() => handleToggleHabit(h.id)}
                              className={`w-6 h-6 rounded-full border flex items-center justify-center transition-all ${
                                h.completed 
                                ? "bg-blue-600 border-blue-500 text-white scale-102 shadow-[0_0_10px_rgba(59,130,246,0.25)]"
                                : !isHabitAuthorized(h.type)
                                ? "border-amber-500/30 bg-amber-500/5 text-amber-500/70 hover:border-amber-500/60"
                                : "border-white/10 hover:border-blue-500/50 text-transparent hover:bg-blue-500/10"
                              }`}
                            >
                              {h.completed ? (
                                <Check size={12} strokeWidth={4} />
                              ) : !isHabitAuthorized(h.type) ? (
                                <Lock size={10} className="text-amber-500/80" />
                              ) : (
                                <Check size={12} strokeWidth={4} />
                              )}
                            </button>
                            <div className="flex flex-col">
                              <span className={`text-[13px] font-bold transition-all ${h.completed ? "line-through text-gray-500" : "text-white"}`}>
                                {h.title === "Sleep Hygiene" ? "Sleep" : h.title === "Exercise Routine" ? "Exercise" : h.title === "Intelligence Analysis" ? "Study Session" : h.title}
                              </span>
                              {h.type === "sleep" && (
                                <span className="text-[10px] text-zinc-400 font-mono mt-0.5">
                                  {Math.floor(sleepProgressSec / 3600)}h / 7h
                                </span>
                              )}
                              {h.type === "exercise" && (
                                <span className="text-[10px] text-zinc-400 font-mono mt-0.5">
                                  {Math.floor(exerciseProgressSec / 60)}m / 30m
                                </span>
                              )}
                              {h.type === "intelligence" && (
                                <span className="text-[10px] text-zinc-400 font-mono mt-0.5">
                                  {Math.floor(sessionSecCount / 3600)}h / 2h
                                </span>
                              )}
                              {h.type === "mood" && h.currentValue && (
                                <span className="text-[10px] text-zinc-400 font-mono mt-0.5 uppercase">
                                  {h.currentValue}
                                </span>
                              )}
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-1.5">
                            {h.difficulty && (
                              <span className={`font-mono text-[8px] uppercase tracking-widest px-1.5 py-0.5 rounded font-extrabold ${
                                h.difficulty === "easy" 
                                ? "bg-green-500/10 text-green-400 border border-green-500/20"
                                : h.difficulty === "medium"
                                ? "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                                : "bg-red-500/10 text-red-400 border border-red-500/20"
                              }`}>
                                {h.difficulty}
                              </span>
                            )}
                            
                            <span className="font-mono text-[10px] text-indigo-400 font-extrabold tracking-wider bg-indigo-500/5 px-2.5 py-0.5 rounded border border-indigo-500/15 shadow-[0_0_8px_rgba(99,102,241,0.1)]">
                              +{getXpRewardForHabit(h)} XP
                            </span>
                            
                            {/* Extra delete toggle for custom user protocols */}
                            {h.id.startsWith("h_custom_") && (
                              <button 
                                onClick={(e) => handleDeleteHabit(h.id, e)}
                                className="p-1 text-red-400/80 hover:text-red-400 active:scale-90 transition-all text-xs"
                              >
                                <Trash2 size={12} />
                              </button>
                            )}
                          </div>
                        </div>

                        {/* Habit details sub widgets */}
                        {h.type === "mood" && (
                          <div className="bg-[#161616] border border-white/5 rounded-xl p-3 mt-2.5 space-y-2.5">
                            <p className="text-[8.5px] text-gray-500 tracking-wider">COGNITIVE SIGNATURE LOGGER</p>
                            <div className="grid grid-cols-5 gap-1 pt-0.5">
                              {[
                                { val: "FOCUSED", label: "🧠 Focus", color: "border-blue-500/10 text-blue-400 hover:bg-blue-500/5 hover:border-blue-500/20" },
                                { val: "CHARGED", label: "⚡ Charge", color: "border-green-500/10 text-green-400 hover:bg-green-500/5 hover:border-green-500/20" },
                                { val: "STEALTH", label: "🤫 Stealth", color: "border-zinc-500/10 text-zinc-400 hover:bg-zinc-500/5 hover:border-zinc-500/20" },
                                { val: "STRESSED", label: "🚨 Stress", color: "border-red-500/10 text-red-400 hover:bg-red-500/5 hover:border-red-500/20" },
                                { val: "DRAINED", label: "💤 Drain", color: "border-orange-500/10 text-orange-400 hover:bg-orange-500/5 hover:border-orange-500/20" }
                              ].map((m) => (
                                <button
                                  key={m.val}
                                  onClick={() => handleUpdateMood(h.id, m.val)}
                                  className={`py-1.5 px-0.5 rounded-lg border text-[9.5px] font-bold text-center transition-all ${
                                    h.currentValue === m.val
                                    ? "bg-blue-600/15 border-blue-500/40 text-blue-400 font-extrabold shadow-[0_0_10px_rgba(59,130,246,0.15)]"
                                    : `${m.color} bg-black/40`
                                  }`}
                                >
                                  {m.label}
                                </button>
                              ))}
                            </div>
                            <div className="flex justify-between items-center text-[9px] text-gray-500 px-1 pt-1.5 border-t border-white/5 font-mono">
                              <span>ACTIVE COGNITIVE STATE:</span>
                              <span className="font-extrabold text-blue-400 tracking-wider uppercase">{h.currentValue || "NOT DEPLOYED"}</span>
                            </div>
                          </div>
                        )}
                        {h.type === "sleep" && (
                          <div className="bg-[#0e0e0e]/40 border border-[#524535]/15 rounded-xl p-3 flex justify-between items-center mt-2 font-mono">
                            <div className="leading-none space-y-1">
                              <p className="text-[8px] text-[#d6c3b0]/55 tracking-widest uppercase">SLEEP SYNCHRONICITY</p>
                              <p className="text-xs font-extrabold tracking-widest text-white">{Math.floor(sleepProgressSec / 3600)}H {Math.floor((sleepProgressSec % 3600) / 60)}M / 7H</p>
                            </div>
                            <button 
                              onClick={() => startFocusForCategory("sleep")}
                              className="px-3.5 py-1.5 rounded bg-blue-500/10 border border-blue-500/20 text-[9px] font-bold text-blue-400 uppercase tracking-widest hover:bg-blue-500/20 hover:text-white transition-all flex items-center gap-1.5 shadow-[0_0_10px_rgba(59,130,246,0.15)] active:scale-95"
                            >
                              <Play size={10} className="fill-blue-400/25" />
                              START FOCUS PROTOCOL
                            </button>
                          </div>
                        )}

                        {h.type === "exercise" && (
                          <div className="bg-[#0e0e0e]/40 border border-[#524535]/15 rounded-xl p-3 flex items-center justify-between mt-2 font-mono">
                            <div className="flex items-center gap-3">
                              <div className="relative w-8 h-8 flex-shrink-0">
                                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                                  <circle className="text-[#201f1f] stroke-current" cx="18" cy="18" fill="none" r="16" strokeWidth={3} />
                                  <circle 
                                    className="text-blue-500 stroke-current animate-pulse" 
                                    cx="18" 
                                    cy="18" 
                                    fill="none" 
                                    r="16" 
                                    strokeDasharray="100" 
                                    strokeDashoffset={100 - Math.min(100, Math.floor((exerciseProgressSec / 1800) * 100))} 
                                    strokeLinecap="round" 
                                    strokeWidth={3} 
                                  />
                                </svg>
                                <div className="absolute inset-0 flex items-center justify-center text-[8px] font-extrabold text-blue-400">
                                  {Math.min(100, Math.floor((exerciseProgressSec / 1800) * 100))}%
                                </div>
                              </div>
                              <div className="leading-none space-y-1">
                                <p className="text-[8px] text-[#d6c3b0]/55 tracking-widest uppercase">ENDURANCE LEVEL</p>
                                <p className="text-xs font-extrabold text-white">{Math.floor(exerciseProgressSec / 60)} / 30 MIN</p>
                              </div>
                            </div>
                            <button 
                              onClick={() => startFocusForCategory("exercise")}
                              className="px-3.5 py-1.5 rounded bg-blue-500/10 border border-blue-500/20 text-[9px] font-bold text-blue-400 uppercase tracking-widest hover:bg-blue-500/20 hover:text-white transition-all flex items-center gap-1.5 shadow-[0_0_10px_rgba(59,130,246,0.15)] active:scale-95"
                            >
                              <Play size={10} className="fill-blue-400/25" />
                              START FOCUS PROTOCOL
                            </button>
                          </div>
                        )}

                        {h.type === "intelligence" && (
                          <div className="bg-[#0e0e0e]/40 border border-white/5 rounded-xl p-3 font-mono text-[10px] mt-2 text-[#d6c3b0] space-y-2">
                            <div className="flex justify-between items-center">
                              <div>
                                <p className="text-[8px] text-zinc-550 tracking-widest uppercase">INTELLIGENCE LOGS TIME</p>
                                <p className="text-xs text-white font-extrabold tracking-widest mt-0.5">{formatTimerString(sessionSecCount)} / 2H</p>
                              </div>
                              <div className="text-right">
                                <p className="text-[8px] text-zinc-550 tracking-widest uppercase">CLUES COLLECTED</p>
                                <p className="text-xs text-blue-400 font-extrabold tracking-widest mt-0.5">02 / 05</p>
                              </div>
                            </div>
                            <button 
                              onClick={() => startFocusForCategory("intelligence")}
                              className="w-full bg-blue-500/10 border border-blue-500/20 py-2 rounded-lg font-bold text-blue-400 hover:text-white uppercase tracking-widest font-mono text-[9px] hover:bg-blue-500/15 transition-all flex items-center justify-center gap-1.5 shadow-[0_0_8px_rgba(99,102,241,0.1)] hover:border-blue-500/50"
                            >
                              <Play size={10} className="fill-blue-400/25" />
                              START FOCUS PROTOCOL
                            </button>
                          </div>
                        )}

                        {h.type === "creativity" && (
                          <div className="bg-[#0e0e0e]/40 border border-white/5 rounded-xl p-3 font-mono text-[10px] mt-2 text-[#d6c3b0] space-y-2">
                            <div className="flex justify-between items-center">
                              <div>
                                <p className="text-[8px] text-zinc-550 tracking-widest uppercase">CREATIVITY TIMELINE</p>
                                <p className="text-xs text-white font-extrabold tracking-widest mt-0.5">{Math.floor(creativityProgressSec / 60)}M / 60M</p>
                              </div>
                              <div className="text-right">
                                <p className="text-[8px] text-zinc-550 tracking-widest uppercase">SCHE-DRAFT STATUS</p>
                                <p className="text-xs text-purple-400 font-extrabold tracking-widest mt-0.5">CONCEPT ACTIVE</p>
                              </div>
                            </div>
                            <button 
                              onClick={() => startFocusForCategory("creativity")}
                              className="w-full bg-blue-500/10 border border-blue-500/20 py-2 rounded-lg font-bold text-blue-400 hover:text-white uppercase tracking-widest font-mono text-[9px] hover:bg-blue-500/15 transition-all flex items-center justify-center gap-1.5 shadow-[0_0_8px_rgba(99,102,241,0.1)] hover:border-blue-500/50"
                            >
                              <Play size={10} className="fill-blue-400/25" />
                              START FOCUS PROTOCOL
                            </button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>

                  {/* Add New Custom Protocol Directive Button */}
                  <div 
                    onClick={() => { playSynthSound("tap"); setShowAddHabitModal(true); }}
                    className="flex items-center justify-between px-5 py-3 hover:bg-[#ffd7a9]/5 cursor-pointer group active:bg-[#ffd7a9]/10 transition-colors border-t border-[#524535]/15"
                  >
                    <div className="flex items-center gap-3">
                      <Plus size={16} className="text-[#ffb347] group-hover:rotate-90 transition-transform" />
                      <span className="text-xs font-bold text-[#d6c3b0] group-hover:text-[#ffd7a9] transition-colors">
                        Add New Protocol Directive...
                      </span>
                    </div>
                    <ChevronRight size={14} className="text-[#d6c3b0]/40 group-hover:translate-x-1 transition-transform" />
                  </div>
                </section>

                {/* Level Up Progression Debug Controller */}
                <section className="bg-gradient-to-br from-[#020813] to-[#041225] border border-[#00cbff]/20 p-5 rounded-2xl relative overflow-hidden shadow-[0_0_15px_rgba(0,203,255,0.08)]">
                  {/* Neon laser decorative edge */}
                  <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-[#00cbff] to-transparent"></div>
                  
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <h4 className="font-mono text-[9px] uppercase tracking-[0.2em] font-extrabold text-[#00cbff]">
                        System Progression Sandbox
                      </h4>
                      <span className="bg-[#00cbff]/10 text-[#00cbff] border border-[#00cbff]/30 text-[7.5px] uppercase tracking-widest px-1.5 py-0.5 rounded font-bold font-mono shadow-[0_0_8px_rgba(0,203,255,0.2)]">
                        Active Override
                      </span>
                    </div>

                    <button 
                      onClick={handleDebugLevelUp}
                      className="w-full relative py-3 bg-gradient-to-r from-[#00cbff]/15 to-[#00cbff]/5 hover:from-[#00cbff]/25 hover:to-[#00cbff]/15 active:scale-[0.98] transition-all rounded-xl border border-[#00cbff] shadow-[0_0_15px_rgba(0,203,255,0.3)] flex items-center justify-center cursor-pointer group overflow-hidden"
                    >
                      {/* Scanning light flare */}
                      <span className="absolute inset-x-0 top-0 h-[1px] bg-[#00cbff] opacity-65 group-hover:opacity-100 transition-opacity"></span>
                      <span className="text-xs font-bold font-mono uppercase tracking-[0.25em] text-[#00cbff] drop-shadow-[0_0_6px_rgba(0,203,255,0.7)] group-hover:scale-105 transition-transform duration-200">
                        LEVEL UP
                      </span>
                    </button>

                    <div className="text-center">
                      <p className="text-[8px] font-mono text-zinc-500 uppercase tracking-widest">
                        Debug/Test Mode: Bypasses standard Directive criteria, rewards immediate XP, & decodes level cases.
                      </p>
                    </div>
                  </div>
                </section>
              </motion.div>
            )}

            {/* TAB 2: POINT-AND-CLICK INVESTIGATE EVIDENCE SCENE */}
            {activeTab === "investigate" && (
              <motion.div 
                key="tab_invest"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-4 h-full"
              >
                {/* Immersive Investigation XP Budget Fuel HUD Bar */}
                <div className="bg-[#100f0f] border border-[#ffb347]/20 rounded-xl p-3 space-y-2 select-none shadow-md">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-indigo-505 animate-pulse shadow-[0_0_8px_rgba(99,102,241,0.6)]"></span>
                      <span className="font-mono text-[9px] uppercase tracking-widest font-extrabold text-[#ffd7a9]">XP</span>
                    </div>
                    <span className="font-mono text-[10px] font-extrabold text-white">
                      {xp} XP / {500} XP (Lvl {agentLevel})
                    </span>
                  </div>
                  <div className="h-2 w-full bg-black rounded overflow-hidden border border-white/5 relative">
                    <div 
                      className="h-full bg-gradient-to-r from-indigo-505 via-indigo-650 to-cyan-400 transition-all duration-300" 
                      style={{ width: `${Math.min(100, (xpForCurrentLevel / 500) * 100)}%` }}
                    ></div>
                  </div>
                  <div className="flex justify-between items-center text-[8px] font-mono text-gray-500">
                    <span>Tap Cost: -5 XP per analysis click</span>
                    {xp < 25 ? (
                      <span className="text-red-400 font-extrabold animate-pulse">
                        ⚠️ CRITICAL RESERVES: Complete Daily Directives!
                      </span>
                    ) : (
                      <span className="text-green-400 font-bold">
                        ● Operational Stamina Active
                      </span>
                    )}
                  </div>
                </div>

                {/* Visual Board HUD */}
                <header className="flex justify-between items-start">
                  <div className="space-y-1 w-1/2">
                    <p className="text-[10px] text-[#ffd7a9] uppercase tracking-widest font-bold">Investigation Lead Progress</p>
                    <div className="h-1.5 w-full bg-black rounded-full overflow-hidden flex border border-[#524535]/30">
                      <div className="h-full bg-[#ffb347]" style={{ width: `${getOverallInvestigationProgress()}%` }}></div>
                    </div>
                    <p className="text-[9px] text-[#d6c3b0]/70 font-mono">
                      Decryption Lead: {getOverallInvestigationProgress()}% Complete
                    </p>
                  </div>

                  <div className="bg-[#0e0e0e]/90 border border-red-900/30 p-2 rounded flex items-center gap-2">
                    <div className="text-right leading-none">
                      <p className="text-[8px] text-red-400 uppercase tracking-tighter font-extrabold">Rival Intercept</p>
                      <p className="font-headline font-semibold text-lg text-white">12:48 secs</p>
                    </div>
                    <div className="w-8 h-8 rounded bg-red-950/20 border border-red-800/40 flex items-center justify-center text-red-500">
                      <AlertCircle size={18} className={getOverallInvestigationProgress() === 100 ? "" : "animate-pulse"} />
                    </div>
                  </div>
                </header>

                {/* Sub-header Level Selector Tabs */}
                <div className="grid grid-cols-3 gap-1 bg-[#111] p-1 rounded-xl border border-white/5 font-mono text-[9px] select-none">
                  <button 
                    onClick={() => { playSynthSound("tap"); setInvestigationLevel(1); }}
                    className={`py-1.5 rounded-lg text-center transition-all ${
                      investigationLevel === 1 
                      ? "bg-yellow-500 text-black font-bold shadow-md" 
                      : "text-gray-400 hover:text-white"
                    }`}
                  >
                    L1: CHAMBER {isLevel1Complete() && "⭐"}
                  </button>
                  <button 
                    onClick={() => {
                      if (!isLevel1Complete()) {
                        playSynthSound("alarm");
                        addToast("Locked — Complete Level 1 Investigation first!", "warn");
                        return;
                      }
                      if (!defeatedLvl1Boss) {
                        playSynthSound("alarm");
                        addToast("🚨 ACCESS COMPROMISED: Hostile owl hacker blocks Study decryption. Defeat Beak Storm first!", "warn");
                        startCombatEncounter("beak_storm", "Beak Storm (Level 1 Boss)", 50, true, 2);
                        return;
                      }
                      playSynthSound("tap");
                      setInvestigationLevel(2);
                    }}
                    className={`py-1.5 rounded-lg text-center transition-all flex items-center justify-center gap-0.5 ${
                      !isLevel1Complete()
                      ? "hover:bg-red-950/20 text-red-500/70 cursor-not-allowed"
                      : !defeatedLvl1Boss
                      ? "bg-red-950/40 text-red-400 border border-red-500/20 animate-pulse cursor-pointer"
                      : investigationLevel === 2
                      ? "bg-yellow-500 text-black font-bold shadow-md"
                      : "text-gray-400 hover:text-white"
                    }`}
                  >
                    {!isLevel1Complete() ? (
                      <>
                        <Lock size={8} className="text-red-500/70" /> L2: Locked
                      </>
                    ) : !defeatedLvl1Boss ? (
                      <>
                        <AlertCircle size={8} className="text-red-400 animate-spin" /> L2: Intruder
                      </>
                    ) : (
                      <>
                        L2: STUDY {isLevel2Complete() && "⭐"}
                      </>
                    )}
                  </button>
                  <button 
                    onClick={() => {
                      if (!isLevel2Complete()) {
                        playSynthSound("alarm");
                        addToast("Locked — Complete Level 2 Investigation first!", "warn");
                        return;
                      }
                      if (!defeatedLvl2Boss) {
                        playSynthSound("alarm");
                        addToast("🚨 ACCESS COMPROMISED: Hostile otter defender blocks Mainframe gateway. Defeat Mr. Mustela first!", "warn");
                        startCombatEncounter("mr_mustela", "Mr. Mustela (Level 2 Boss)", 80, true, 3);
                        return;
                      }
                      playSynthSound("complete");
                      setInvestigationLevel(3);
                    }}
                    className={`py-1.5 rounded-lg text-center transition-all flex items-center justify-center gap-0.5 ${
                      !isLevel2Complete()
                      ? "hover:bg-red-950/20 text-red-500/70 cursor-not-allowed"
                      : !defeatedLvl2Boss
                      ? "bg-red-950/40 text-red-400 border border-red-500/20 animate-pulse cursor-pointer"
                      : investigationLevel === 3
                      ? "bg-cyan-500 text-black font-bold shadow-md"
                      : "text-gray-400 hover:text-white"
                    }`}
                  >
                    {!isLevel2Complete() ? (
                      <>
                        <Lock size={8} className="text-red-500/70" /> L3: Locked
                      </>
                    ) : !defeatedLvl2Boss ? (
                      <>
                        <AlertCircle size={8} className="text-red-400 animate-spin" /> L3: Intruder
                      </>
                    ) : (
                      <>
                        L3: COLLAPSE {isLevel3Complete() && "⭐"}
                      </>
                    )}
                  </button>
                </div>

                {/* Main Level Screen switcher */}
                {investigationLevel === 1 ? (
                  /* LEVEL 1 LEVEL RENDERER */
                  isLevel1Complete() ? (
                    <motion.div 
                      initial={{ scale: 0.95, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ duration: 0.5 }}
                      className="space-y-4 text-center select-none"
                    >
                      <div className="bg-[#1c1917]/80 border border-yellow-500/20 rounded-2xl p-4 shadow-xl backdrop-blur-sm relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-red-600 via-yellow-400 to-red-600"></div>
                        
                        <div className="flex justify-center items-center gap-2 mb-1.5 mt-1">
                          <span className="text-xs font-mono uppercase tracking-[0.25em] text-yellow-400 font-bold block animate-bounce">
                            ★ CASE DECRYPTED ★
                          </span>
                        </div>

                        <h2 className="font-headline text-3xl text-yellow-500 uppercase tracking-tight drop-shadow-[0_0_8px_rgba(234,179,8,0.2)]">
                          ⭐ CASE SOLVED ⭐
                        </h2>
                        
                        <p className="text-[11px] text-[#d6c3b0]/80 italic mt-2 max-w-sm mx-auto leading-relaxed">
                          Excellent work, Agent! Decryption Lead is 100% complete. Our brave rabbit, sugar glider, and guinea pig detective crew celebrate inside the Secret Chamber! Level 2 Study is now unlocked!
                        </p>
                      </div>

                      {/* Celebration Pixel Art Image */}
                      <div className="relative w-full aspect-[9/16] max-w-[340px] mx-auto rounded-xl overflow-hidden border border-yellow-500/30 shadow-[0_0_30px_rgba(234,179,8,0.15)] bg-black">
                        <img 
                          src="/src/assets/images/case_solved_1779869401999.png" 
                          alt="Case solved celebration" 
                          className="w-full h-full object-cover"
                          referrerPolicy="no-referrer"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/30 pointer-events-none"></div>
                        
                        {/* Decorative badges */}
                        <div className="absolute top-4 left-4 bg-yellow-500/95 text-black text-[9px] font-mono uppercase tracking-widest px-2 py-0.5 rounded font-bold shadow-md">
                          Clearance Verified
                        </div>
                        <div className="absolute bottom-4 left-4 right-4 text-left">
                          <p className="text-[8px] text-yellow-400/80 font-mono tracking-widest uppercase leading-none font-bold">Archive Status</p>
                          <p className="text-white text-xs font-bold font-mono tracking-wide leading-tight mt-1">DATABASE INTRUSION REVERTED</p>
                        </div>
                      </div>

                      {/* Action buttons */}
                      <div className="flex flex-col gap-2 pt-2 max-w-[340px] mx-auto">
                        <button
                          onClick={() => {
                            playSynthSound("complete");
                            setInvestigationLevel(2);
                            addToast("Entering Level 2: Cozy Vintage Study...", "success");
                          }}
                          className="bg-yellow-500 text-black text-xs font-bold uppercase tracking-widest px-6 py-2.5 rounded-lg active:scale-95 transition-all shadow-lg hover:bg-yellow-400 border border-yellow-300/20"
                        >
                          🔓 Proceed to Level 2 Investigation
                        </button>
                        <button
                          onClick={() => {
                            playSynthSound("complete");
                            setInvestigations((prev) => ({
                              ...prev,
                              light_fixture: 0,
                              server_rack: 0,
                              keyboard: 0,
                              document: 0,
                              drawer: 0
                            }));
                            addToast("Level 1 markers cleared. Re-opening secret chamber...", "success");
                          }}
                          className="bg-zinc-800 text-gray-300 text-[10px] font-bold uppercase tracking-widest px-6 py-2.5 rounded-lg active:scale-95 transition-all border border-zinc-700/50 hover:bg-zinc-700 hover:text-white"
                        >
                          🔄 Reset Level 1 Probe
                        </button>
                      </div>
                    </motion.div>
                  ) : (
                    <>
                      <p className="text-[11px] text-[#d6c3b0]/70 italic leading-snug">
                        Click on target elements inside the secret chamber image below to search for evidence files of the data chip. Clue decryptions slowly increase hostile alert tracking (Threat Level) by 1%, yielding credits and experience!
                      </p>

                      {/* Cyber-Noir Room Point-and-Click Stage Container */}
                      <div className="relative w-full aspect-[9/16] rounded-xl overflow-hidden border border-[#524535]/40 shadow-inner bg-black">
                        
                        {/* Gray-Noir Graphic Image */}
                        <img 
                          src="https://lh3.googleusercontent.com/aida-public/AB6AXuB-2fNvwvPEFZkspt95HqvZJdVEwKoM885_WPDG3PkvCKb583ftkJT0uDvxpZDRRMpdReaekyKC6n66efGdd1yzFU-kFfrBDIG7mplRTueXdS8E-9huCgjUNEFUeyJUgxE0fX3sohaavYz9PM7cNRRElqUeyvDkQQh0cYuT6j2ojN6QJ_degFGWGTGAC88m_9EWWvQdVML3iOdMfqcHOvJLXKoZTIysmZo8o9vS7Xmwk2P8JwN7pcIpKkiGaW-N5TU9k85vFghiaJwQnA" 
                          alt="Cyber-noir storage" 
                          className="w-full h-full object-cover scale-102"
                          referrerPolicy="no-referrer"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-transparent to-black/50 pointer-events-none"></div>

                        <div className="absolute inset-0">
                          
                          {/* Hotspot 1: Light Fixture */}
                          <div 
                            onClick={() => handleInteractMarker("light_fixture", 5)}
                            className="absolute top-[22%] left-[45%] group cursor-pointer z-20"
                          >
                            <div className="flex items-center gap-2 active:scale-95 transition-transform duration-100 p-1">
                              <div className={`w-7 h-7 rounded-full bg-[#ffb347]/20 border border-[#ffb347]/80 flex items-center justify-center marker-glow group-hover:bg-[#ffb347]/40 transition-all ${
                                lastTappedHotspot === "light_fixture" ? "animate-pulse scale-125 border-yellow-400 bg-yellow-400/50 shadow-[0_0_15px_rgba(234,179,8,0.7)]" : ""
                              }`}>
                                <Search size={12} className="text-[#ffd7a9]" />
                              </div>
                              <div className="bg-black/80 backdrop-blur-sm border-l-2 border-[#ffb347] p-1 px-2 rounded-sm text-[10px] min-w-[70px]">
                                <p className="text-[#ffd7a9]/70 font-mono uppercase text-[7px] tracking-widest leading-none">Light Fixture</p>
                                <p className="font-bold text-white leading-none mt-0.5">{investigations.light_fixture || 0}/5</p>
                              </div>
                            </div>
                          </div>

                          {/* Hotspot 2: Server Rack */}
                          <div 
                            onClick={() => handleInteractMarker("server_rack", 5)}
                            className="absolute top-[44%] right-[22%] group cursor-pointer z-20"
                          >
                            <div className="flex items-center gap-2 active:scale-95 transition-transform duration-100 p-1">
                              <div className={`w-7 h-7 rounded-full bg-[#ffb347]/20 border border-[#ffb347]/80 flex items-center justify-center marker-glow group-hover:bg-[#ffb347]/40 transition-all ${
                                lastTappedHotspot === "server_rack" ? "animate-pulse scale-125 border-yellow-400 bg-yellow-400/50 shadow-[0_0_15px_rgba(234,179,8,0.7)]" : ""
                              }`}>
                                <Search size={12} className="text-[#ffd7a9]" />
                              </div>
                              <div className="bg-black/80 backdrop-blur-sm border-l-2 border-[#ffb347] p-1 px-2 rounded-sm text-[10px] min-w-[70px]">
                                <p className="text-[#ffd7a9]/70 font-mono uppercase text-[7px] tracking-widest leading-none">Server Rack</p>
                                <p className="font-bold text-white leading-none mt-0.5">{investigations.server_rack || 0}/5</p>
                              </div>
                            </div>
                          </div>

                          {/* Hotspot 3: Keyboard */}
                          <div 
                            onClick={() => handleInteractMarker("keyboard", 5)}
                            className="absolute bottom-[35%] left-[28%] group cursor-pointer z-20"
                          >
                            <div className="flex items-center gap-2 active:scale-95 transition-transform duration-100 p-1">
                              <div className={`w-7 h-7 rounded-full bg-[#ffb347]/20 border border-[#ffb347]/80 flex items-center justify-center marker-glow group-hover:bg-[#ffb347]/40 transition-all ${
                                lastTappedHotspot === "keyboard" ? "animate-pulse scale-125 border-yellow-400 bg-yellow-400/50 shadow-[0_0_15px_rgba(234,179,8,0.7)]" : ""
                              }`}>
                                <Search size={12} className="text-[#ffd7a9]" />
                              </div>
                              <div className="bg-black/80 backdrop-blur-sm border-l-2 border-[#ffb347] p-1 px-2 rounded-sm text-[10px] min-w-[70px]">
                                <p className="text-[#ffd7a9]/70 font-mono uppercase text-[7px] tracking-widest leading-none">Keyboard</p>
                                <p className="font-bold text-white leading-none mt-0.5">{investigations.keyboard || 0}/5</p>
                              </div>
                            </div>
                          </div>

                          {/* Hotspot 4: Document */}
                          <div 
                            onClick={() => handleInteractMarker("document", 5)}
                            className="absolute bottom-[24%] left-[8%] group cursor-pointer z-20"
                          >
                            <div className="flex items-center gap-2 active:scale-95 transition-transform duration-100 p-1">
                              <div className={`w-7 h-7 rounded-full bg-[#ffb347]/20 border border-[#ffb347]/80 flex items-center justify-center marker-glow group-hover:bg-[#ffb347]/40 transition-all ${
                                lastTappedHotspot === "document" ? "animate-pulse scale-125 border-yellow-400 bg-yellow-400/50 shadow-[0_0_15px_rgba(234,179,8,0.7)]" : ""
                              }`}>
                                <Search size={12} className="text-[#ffd7a9]" />
                              </div>
                              <div className="bg-black/80 backdrop-blur-sm border-l-2 border-[#ffb347] p-1 px-2 rounded-sm text-[10px] min-w-[70px]">
                                <p className="text-[#ffd7a9]/70 font-mono uppercase text-[7px] tracking-widest leading-none">Document</p>
                                <p className="font-bold text-white leading-none mt-0.5">{investigations.document || 0}/5</p>
                              </div>
                            </div>
                          </div>

                          {/* Hotspot 5: Drawer */}
                          <div 
                            onClick={() => handleInteractMarker("drawer", 5)}
                            className="absolute bottom-[20%] right-[32%] group cursor-pointer z-20"
                          >
                            <div className="flex items-center gap-2 active:scale-95 transition-transform duration-100 p-1">
                              <div className={`w-7 h-7 rounded-full bg-[#ffb347]/20 border border-[#ffb347]/80 flex items-center justify-center marker-glow group-hover:bg-[#ffb347]/40 transition-all ${
                                lastTappedHotspot === "drawer" ? "animate-pulse scale-125 border-yellow-400 bg-yellow-400/50 shadow-[0_0_15px_rgba(234,179,8,0.7)]" : ""
                              }`}>
                                <Search size={12} className="text-[#ffd7a9]" />
                              </div>
                              <div className="bg-black/80 backdrop-blur-sm border-l-2 border-[#ffb347] p-1 px-2 rounded-sm text-[10px] min-w-[70px]">
                                <p className="text-[#ffd7a9]/70 font-mono uppercase text-[7px] tracking-widest leading-none">Chamber Drawer</p>
                                <p className="font-bold text-white leading-none mt-0.5">{investigations.drawer || 0}/5</p>
                              </div>
                            </div>
                          </div>

                        </div>
                      </div>
                    </>
                  )
                ) : investigationLevel === 2 ? (
                  /* LEVEL 2 LEVEL RENDERER */
                  !isLevel1Complete() ? (
                    <div className="flex flex-col items-center justify-center text-center p-8 bg-black/60 border border-red-500/20 rounded-xl space-y-4 shadow-xl">
                      <Lock size={32} className="text-red-500 animate-bounce" />
                      <h3 className="font-headline font-semibold text-lg text-white">LOCKED DETECTION</h3>
                      <p className="text-xs text-[#d6c3b0]/80 leading-relaxed">
                        Locked — Complete Level 1 Investigation to decipher master passkeys first.
                      </p>
                      <button
                        onClick={() => { playSynthSound("tap"); setInvestigationLevel(1); }}
                        className="bg-[#ffd7a9] text-[#462a00] font-bold text-xs uppercase tracking-wider px-4 py-2 rounded-lg hover:bg-[#ffb347] active:scale-95 transition-all"
                      >
                        Return to Level 1
                      </button>
                    </div>
                  ) : isLevel2Complete() ? (
                    <motion.div 
                      initial={{ scale: 0.95, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ duration: 0.5 }}
                      className="space-y-4 text-center select-none"
                    >
                      <div className="bg-[#1c1917]/80 border border-yellow-500/20 rounded-2xl p-4 shadow-xl backdrop-blur-sm relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-red-600 via-yellow-400 to-red-600"></div>
                        
                        <div className="flex justify-center items-center gap-2 mb-1.5 mt-1">
                          <span className="text-xs font-mono uppercase tracking-[0.25em] text-yellow-400 font-bold block animate-bounce">
                            ★ CASE DECRYPTED ★
                          </span>
                        </div>

                        <h2 className="font-headline text-3xl text-yellow-500 uppercase tracking-tight drop-shadow-[0_0_8px_rgba(234,179,8,0.2)]">
                          ⭐ CASE SOLVED ⭐
                        </h2>
                        
                        <p className="text-[11px] text-[#d6c3b0]/80 italic mt-2 max-w-sm mx-auto leading-relaxed">
                          Excellent work, Agent! Decryption Lead is 100% complete. Our brave rabbit, sugar glider, and guinea pig detective crew celebrate inside the Vintage Cozy Study! Level 3 Mainframe Core is now unlocked!
                        </p>
                      </div>

                      {/* Celebration Pixel Art Image */}
                      <div className="relative w-full aspect-[9/16] max-w-[340px] mx-auto rounded-xl overflow-hidden border border-yellow-500/30 shadow-[0_0_30px_rgba(234,179,8,0.15)] bg-black">
                        <img 
                          src="/src/assets/images/case_solved_1779869401999.png" 
                          alt="Case solved celebration" 
                          className="w-full h-full object-cover"
                          referrerPolicy="no-referrer"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/30 pointer-events-none"></div>
                        
                        {/* Decorative badges */}
                        <div className="absolute top-4 left-4 bg-yellow-500/95 text-black text-[9px] font-mono uppercase tracking-widest px-2 py-0.5 rounded font-bold shadow-md">
                          Clearance Verified
                        </div>
                        <div className="absolute bottom-4 left-4 right-4 text-left">
                          <p className="text-[8px] text-yellow-400/80 font-mono tracking-widest uppercase leading-none font-bold">Archive Status</p>
                          <p className="text-white text-xs font-bold font-mono tracking-wide leading-tight mt-1">VINTAGE STUDY BLUEPRINTS SECURED</p>
                        </div>
                      </div>

                      {/* Action buttons */}
                      <div className="flex flex-col gap-2 pt-2 max-w-[340px] mx-auto">
                        <button
                          onClick={() => {
                            playSynthSound("complete");
                            setInvestigationLevel(3);
                            addToast("Entering Level 3: Mainframe Core & Server Central...", "success");
                          }}
                          className="bg-yellow-500 text-black text-xs font-bold uppercase tracking-widest px-6 py-2.5 rounded-lg active:scale-95 transition-all shadow-lg hover:bg-yellow-400 border border-yellow-300/20"
                        >
                          🔓 Proceed to Level 3 Investigation
                        </button>
                        <button
                          onClick={() => {
                            playSynthSound("complete");
                            setInvestigations((prev) => ({
                              ...prev,
                              lvl2_typewriter: 0,
                              lvl2_lantern: 0,
                              lvl2_window: 0,
                              lvl2_fireplace: 0,
                              lvl2_chest: 0
                            }));
                            addToast("Level 2 investigation reset. Re-opening vintage study case...", "success");
                          }}
                          className="bg-zinc-800 text-gray-300 text-[10px] font-bold uppercase tracking-widest px-6 py-2.5 rounded-lg active:scale-95 transition-all border border-zinc-700/50 hover:bg-zinc-700 hover:text-white"
                        >
                          🔄 Reset Level 2 Probe
                        </button>
                      </div>
                    </motion.div>
                  ) : (
                    <>
                      <p className="text-[11px] text-[#d6c3b0]/70 italic leading-snug">
                        Tap highlighted elements inside the wood-paneled study reference scene to investigate coordinates of hidden case records. Deep case probing slowly increases hostile alert tracking (Threat Level) by 1%, yielding credits and experience!
                      </p>

                      {/* Level 2 Point-and-Click Stage Container */}
                      <div className="relative w-full aspect-[9/16] rounded-xl overflow-hidden border border-yellow-500/20 shadow-inner bg-black">
                        
                        {/* Wood-Paneled Vintage Study reference image */}
                        <img 
                          src="/src/assets/images/level2_bg.png" 
                          alt="Vintage Cozy Study" 
                          className="w-full h-full object-cover scale-102"
                          referrerPolicy="no-referrer"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-black/60 pointer-events-none"></div>

                        <div className="absolute inset-0">
                          
                          {/* Hotspot 1: Misty Window */}
                          <div 
                            onClick={() => handleInteractMarker("lvl2_window", 5)}
                            className="absolute top-[25%] left-[20%] group cursor-pointer z-20"
                          >
                            <div className="flex items-center gap-2 active:scale-95 transition-transform duration-100 p-1">
                              <div className={`w-7 h-7 rounded-full bg-[#ffb347]/20 border border-[#ffb347]/80 flex items-center justify-center marker-glow group-hover:bg-[#ffb347]/40 transition-all ${
                                lastTappedHotspot === "lvl2_window" ? "animate-pulse scale-125 border-yellow-400 bg-yellow-400/50 shadow-[0_0_15px_rgba(234,179,8,0.7)]" : ""
                              }`}>
                                <Search size={12} className="text-[#ffd7a9]" />
                              </div>
                              <div className="bg-black/85 backdrop-blur-sm border-l-2 border-[#ffb347] p-1 px-2 rounded-sm text-[10px] min-w-[70px] shadow-lg">
                                <p className="text-[#ffd7a9]/70 font-mono uppercase text-[7px] tracking-widest leading-none">Misty Window</p>
                                <p className="font-bold text-white leading-none mt-0.5">{investigations.lvl2_window || 0}/5</p>
                              </div>
                            </div>
                          </div>

                          {/* Hotspot 2: Cozy Fireplace */}
                          <div 
                            onClick={() => handleInteractMarker("lvl2_fireplace", 5)}
                            className="absolute top-[48%] right-[15%] group cursor-pointer z-20"
                          >
                            <div className="flex items-center gap-2 active:scale-95 transition-transform duration-100 p-1">
                              <div className={`w-7 h-7 rounded-full bg-[#ffb347]/20 border border-[#ffb347]/80 flex items-center justify-center marker-glow group-hover:bg-[#ffb347]/40 transition-all ${
                                lastTappedHotspot === "lvl2_fireplace" ? "animate-pulse scale-125 border-yellow-400 bg-yellow-400/50 shadow-[0_0_15px_rgba(234,179,8,0.7)]" : ""
                              }`}>
                                <Search size={12} className="text-[#ffd7a9]" />
                              </div>
                              <div className="bg-black/85 backdrop-blur-sm border-l-2 border-[#ffb347] p-1 px-2 rounded-sm text-[10px] min-w-[70px] shadow-lg">
                                <p className="text-[#ffd7a9]/70 font-mono uppercase text-[7px] tracking-widest leading-none">Cozy Fireplace</p>
                                <p className="font-bold text-white leading-none mt-0.5">{investigations.lvl2_fireplace || 0}/5</p>
                              </div>
                            </div>
                          </div>

                          {/* Hotspot 3: Kerosene Lantern */}
                          <div 
                            onClick={() => handleInteractMarker("lvl2_lantern", 5)}
                            className="absolute top-[56%] left-[38%] group cursor-pointer z-20"
                          >
                            <div className="flex items-center gap-2 active:scale-95 transition-transform duration-100 p-1">
                              <div className={`w-7 h-7 rounded-full bg-[#ffb347]/20 border border-[#ffb347]/80 flex items-center justify-center marker-glow group-hover:bg-[#ffb347]/40 transition-all ${
                                lastTappedHotspot === "lvl2_lantern" ? "animate-pulse scale-125 border-yellow-400 bg-yellow-400/50 shadow-[0_0_15px_rgba(234,179,8,0.7)]" : ""
                              }`}>
                                <Search size={12} className="text-[#ffd7a9]" />
                              </div>
                              <div className="bg-black/85 backdrop-blur-sm border-l-2 border-[#ffb347] p-1 px-2 rounded-sm text-[10px] min-w-[70px] shadow-lg">
                                <p className="text-[#ffd7a9]/70 font-mono uppercase text-[7px] tracking-widest leading-none">Kerosene Lantern</p>
                                <p className="font-bold text-white leading-none mt-0.5">{investigations.lvl2_lantern || 0}/5</p>
                              </div>
                            </div>
                          </div>

                          {/* Hotspot 4: Vintage Typewriter */}
                          <div 
                            onClick={() => handleInteractMarker("lvl2_typewriter", 5)}
                            className="absolute top-[65%] right-[24%] group cursor-pointer z-20"
                          >
                            <div className="flex items-center gap-2 active:scale-95 transition-transform duration-100 p-1">
                              <div className={`w-7 h-7 rounded-full bg-[#ffb347]/20 border border-[#ffb347]/80 flex items-center justify-center marker-glow group-hover:bg-[#ffb347]/40 transition-all ${
                                lastTappedHotspot === "lvl2_typewriter" ? "animate-pulse scale-125 border-yellow-400 bg-yellow-400/50 shadow-[0_0_15px_rgba(234,179,8,0.7)]" : ""
                              }`}>
                                <Search size={12} className="text-[#ffd7a9]" />
                              </div>
                              <div className="bg-black/85 backdrop-blur-sm border-l-2 border-[#ffb347] p-1 px-2 rounded-sm text-[10px] min-w-[70px] shadow-lg">
                                <p className="text-[#ffd7a9]/70 font-mono uppercase text-[7px] tracking-widest leading-none">Typewriter</p>
                                <p className="font-bold text-white leading-none mt-0.5">{investigations.lvl2_typewriter || 0}/5</p>
                              </div>
                            </div>
                          </div>

                          {/* Hotspot 5: Secure Chest */}
                          <div 
                            onClick={() => handleInteractMarker("lvl2_chest", 5)}
                            className="absolute bottom-[16%] left-[34%] group cursor-pointer z-20"
                          >
                            <div className="flex items-center gap-2 active:scale-95 transition-transform duration-100 p-1">
                              <div className={`w-7 h-7 rounded-full bg-[#ffb347]/20 border border-[#ffb347]/80 flex items-center justify-center marker-glow group-hover:bg-[#ffb347]/40 transition-all ${
                                lastTappedHotspot === "lvl2_chest" ? "animate-pulse scale-125 border-yellow-400 bg-yellow-400/50 shadow-[0_0_15px_rgba(234,179,8,0.7)]" : ""
                              }`}>
                                <Search size={12} className="text-[#ffd7a9]" />
                              </div>
                              <div className="bg-black/85 backdrop-blur-sm border-l-2 border-[#ffb347] p-1 px-2 rounded-sm text-[10px] min-w-[70px] shadow-lg">
                                <p className="text-[#ffd7a9]/70 font-mono uppercase text-[7px] tracking-widest leading-none">Secure Chest</p>
                                <p className="font-bold text-white leading-none mt-0.5">{investigations.lvl2_chest || 0}/5</p>
                              </div>
                            </div>
                          </div>

                        </div>
                      </div>
                    </>
                  )
                ) : (
                  /* LEVEL 3 LEVEL RENDERER */
                    !isLevel2Complete() ? (
                      <div className="flex flex-col items-center justify-center text-center p-8 bg-black/60 border border-red-500/20 rounded-xl space-y-4 shadow-xl select-none">
                        <Lock size={32} className="text-red-500 animate-bounce" />
                        <h3 className="font-headline font-semibold text-lg text-white">LOCKED DETECTION — LEVEL 3</h3>
                        <p className="text-xs text-[#d6c3b0]/80 leading-relaxed">
                          Locked — Complete Level 2 Investigation to decrypt credentials and open the mainframe access gateway!
                        </p>
                        <button
                          onClick={() => { playSynthSound("tap"); setInvestigationLevel(2); }}
                          className="bg-yellow-500 text-black font-bold text-xs uppercase tracking-wider px-4 py-2 rounded-lg hover:bg-yellow-400 active:scale-95 transition-all"
                        >
                          Return to Level 2
                        </button>
                      </div>
                    ) : !defeatedLvl2Boss ? (
                      <div className="flex flex-col items-center justify-center text-center p-8 bg-black/80 border-2 border-red-500/40 rounded-xl space-y-4 shadow-xl select-none relative overflow-hidden max-w-[340px] mx-auto">
                        <div className="absolute inset-0 bg-red-950/20 animate-pulse pointer-events-none"></div>
                        <AlertCircle size={32} className="text-red-500 animate-bounce" />
                        <h3 className="font-headline font-bold text-base text-red-500 uppercase tracking-widest">🚨 ACCESS REFUSED 🚨</h3>
                        <p className="text-[11px] text-zinc-300 leading-relaxed font-mono">
                          Mr. Mustela (Level 2 Boss) is active and has bricked deep security protocols. 
                          You must bypass and defeat this warden to restore mainframe access keys!
                        </p>
                        <button
                          onClick={() => {
                            startCombatEncounter("mr_mustela", "Mr. Mustela (Level 2 Boss)", 80, true, 3);
                          }}
                          className="w-full bg-red-600 hover:bg-red-500 text-white font-extrabold text-[10px] uppercase tracking-widest px-4 py-2.5 rounded-lg active:scale-95 transition-all shadow-[0_0_15px_rgba(220,38,38,0.4)] border border-red-400 font-mono"
                        >
                          ⚡ COMBAT: DEFEAT MR. MUSTELA
                        </button>
                      </div>
                    ) : isLevel3Complete() ? (
                      !defeatedFinalBoss ? (
                        <div className="flex flex-col items-center justify-center text-center p-8 bg-black/80 border-2 border-red-500/40 rounded-xl space-y-4 shadow-xl select-none relative overflow-hidden max-w-[340px] mx-auto">
                          <div className="absolute inset-0 bg-red-950/20 animate-pulse pointer-events-none"></div>
                          <AlertCircle size={44} className="text-red-500 animate-bounce" />
                          <h3 className="font-headline font-bold text-base text-red-550 uppercase tracking-widest">🚨 ACCESS COMPROMISED 🚨</h3>
                          <p className="text-[10px] text-zinc-300 leading-relaxed font-mono">
                            A highly-encrypted hostile digital syndicate boss has intercepted the mainframe bypass gateway! 
                            You must neutralize POISON FANG to retrieve the S-Rank case clearance files.
                          </p>
                          <button
                            onClick={() => {
                              startCombatEncounter("poison_fang", "Poison Fang (FINAL BOSS)", 120, true, 4);
                            }}
                            className="bg-red-600 hover:bg-red-500 text-white font-extrabold text-[10px] uppercase tracking-widest px-5 py-3 rounded-lg active:scale-95 transition-all shadow-[0_0_15px_rgba(220,38,38,0.5)] border border-red-400 font-mono"
                          >
                            ⚡ COMBAT PROTOCOL: DEFEAT BOSS
                          </button>
                        </div>
                      ) : (
                        <motion.div 
                          initial={{ scale: 0.95, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          transition={{ duration: 0.5 }}
                          className="space-y-4 text-center select-none"
                        >
                          <div className="bg-[#1c1917]/80 border border-yellow-500/20 rounded-2xl p-4 shadow-xl backdrop-blur-sm relative overflow-hidden">
                            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-red-600 via-yellow-400 to-red-600"></div>
                            
                            <div className="flex justify-center items-center gap-2 mb-1.5 mt-1">
                              <span className="text-xs font-mono uppercase tracking-[0.25em] text-yellow-400 font-bold block animate-bounce">
                                ★ CASE DECRYPTED ★
                              </span>
                            </div>

                            <h2 className="font-headline text-3xl text-yellow-500 uppercase tracking-tight drop-shadow-[0_0_8px_rgba(234,179,8,0.2)]">
                              ⭐ CASE SOLVED ⭐
                        </h2>
                        
                            <p className="text-[11px] text-[#d6c3b0]/80 italic mt-2 max-w-sm mx-auto leading-relaxed">
                              Excellent work, Agent! Decryption Lead is 100% complete and final security clearances are verified. Our brave rabbit, sugar glider, and guinea pig detective crew celebrate inside the Mainframe core! All cases have been solved at S-Rank!
                            </p>
                          </div>

                          {/* Celebration Pixel Art Image */}
                          <div className="relative w-full aspect-[9/16] max-w-[340px] mx-auto rounded-xl overflow-hidden border border-yellow-500/30 shadow-[0_0_30px_rgba(234,179,8,0.15)] bg-black">
                            <img 
                              src="/src/assets/images/case_solved_1779869401999.png" 
                              alt="Case solved celebration" 
                              className="w-full h-full object-cover"
                              referrerPolicy="no-referrer"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/30 pointer-events-none"></div>
                            
                            {/* Decorative badges */}
                            <div className="absolute top-4 left-4 bg-yellow-500/95 text-black text-[9px] font-mono uppercase tracking-widest px-2 py-0.5 rounded font-bold shadow-md">
                              Clearance Verified
                            </div>
                            <div className="absolute bottom-4 left-4 right-4 text-left">
                              <p className="text-[8px] text-yellow-400/80 font-mono tracking-widest uppercase leading-none font-bold">Archive Status</p>
                              <p className="text-white text-xs font-bold font-mono tracking-wide leading-tight mt-1">MAINFRAME CORE FULLY RESTORED</p>
                            </div>
                          </div>

                          {/* Action button */}
                          <div className="flex flex-col gap-2 pt-2 max-w-[340px] mx-auto">
                            <div className="bg-[#ffd7a9]/10 border border-[#ffb347]/20 p-3 rounded-lg text-xs leading-normal text-[#d6c3b0] mb-1 font-mono">
                              🎉 CONGRATULATIONS! You have fully completed all cases and decrypted every secret level archive!
                            </div>
                            <button
                              onClick={() => {
                                playSynthSound("complete");
                                setDefeatedFinalBoss(false); // Reset final boss block on reboot
                                setInvestigations((prev) => ({
                                  ...prev,
                                  lvl3_mainframe: 0,
                                  lvl3_terminal: 0,
                                  lvl3_console: 0,
                                  lvl3_datadrive: 0,
                                  lvl3_monitor: 0,
                                  lvl3_firewall: 0,
                                  lvl3_crate: 0
                                }));
                                setCasePoints(0);
                                addToast("Level 3 investigation reset. Commencing Data Rescue...", "success");
                              }}
                              className="bg-zinc-800 text-gray-300 text-[10px] font-bold uppercase tracking-widest px-6 py-2.5 rounded-lg active:scale-95 transition-all border border-zinc-700/50 hover:bg-zinc-700 hover:text-white"
                            >
                              🔄 Reboot Level 3 Mainframe
                            </button>
                          </div>
                        </motion.div>
                      )
                    ) : (
                      <>
                        {/* LEVEL 3 TOP HUD CARD */}
                        <div className="bg-black/80 border border-cyan-500/20 rounded-xl p-3.5 space-y-3 font-mono text-xs shadow-lg relative overflow-hidden backdrop-blur-sm">
                          {/* Hazards visual light strip */}
                          <div className="absolute top-0 left-0 w-full h-[3px] bg-gradient-to-r from-red-600 via-cyan-400 to-red-600 animate-pulse"></div>
                          
                          <div className="flex justify-between items-center">
                            <div className="flex items-center gap-1.5 text-cyan-400 text-[10px] font-bold uppercase tracking-wider">
                              <span className="w-2 h-2 rounded-full bg-cyan-500 animate-ping"></span>
                              CASE: OPERATION STOLEN CASE
                            </div>
                            <div className="bg-red-950/40 border border-red-500/30 text-red-400 text-[9px] font-semibold px-2 py-0.5 rounded uppercase flex items-center gap-1">
                              <AlertCircle size={10} className="animate-spin" /> SYSTEM DATA COLLAPSE
                            </div>
                          </div>

                          <div>
                            <p className="text-[10px] text-zinc-400 font-sans leading-relaxed">
                              <strong className="text-yellow-500">OBJECTIVE STATEMENT:</strong> Hack critical conduits to trace Master File fragments. Tap corrupted systems to deploy rescue logic. Unstable voltages present!
                            </p>
                          </div>

                          {/* Threat level tracking */}
                          <div className="grid grid-cols-2 gap-3 pt-1 border-t border-zinc-900">
                            <div className="space-y-1">
                              <div className="flex justify-between text-[9px] text-[#ffd7a9]">
                                <span>⚠️ THREAT ALARM LEVEL</span>
                                <span>{threatLevel}%</span>
                              </div>
                              <div className="h-2 w-full bg-zinc-950 rounded border border-zinc-800 p-[1px] overflow-hidden">
                                <div 
                                  className={`h-full transition-all ${threatLevel >= 80 ? "bg-red-500 animate-pulse" : "bg-gradient-to-r from-cyan-400 to-red-500"}`} 
                                  style={{ width: `${threatLevel}%` }}
                                ></div>
                              </div>
                              {threatLevel >= 100 && (
                                <p className="text-[7.5px] text-red-500 font-semibold animate-pulse uppercase leading-none mt-1">
                                  LOCKDOWN: Defuse upcoming threat to resume
                                </p>
                              )}
                            </div>

                            <div className="space-y-1">
                              <div className="flex justify-between text-[9px] text-cyan-400">
                                <span>★ DECRYPTION SCORE</span>
                                <span>{casePoints} CP</span>
                              </div>
                              <div className="bg-cyan-950/20 border border-cyan-500/10 p-1 px-1.5 rounded-sm flex items-center justify-between">
                                <span className="text-[8px] text-cyan-400 uppercase tracking-widest font-bold">EST_CP_VAL</span>
                                <span className="text-[10px] text-white font-bold font-headline">{casePoints} CP</span>
                              </div>
                            </div>
                          </div>

                          {/* Player vs Rival bar */}
                          <div className="space-y-1 pt-1.5 border-t border-zinc-900/60">
                            <div className="flex justify-between text-[8px] font-bold tracking-wider leading-none">
                              <span className="text-cyan-400 uppercase">AGENT CONTROL ({playerProgress}%)</span>
                              <span className="text-red-500 uppercase">RIVAL INTRUDER ({rivalProgress}% ACCESS)</span>
                            </div>
                            <div className="h-1.5 w-full bg-zinc-950 rounded-full overflow-hidden flex">
                              <div className="bg-cyan-400 h-full transition-all" style={{ width: `${playerProgress}%` }}></div>
                              <div className="bg-red-500/80 h-full transition-all" style={{ width: `${rivalProgress}%` }}></div>
                            </div>
                          </div>
                        </div>

                        {/* LEVEL 3 STAGE STYLES */}
                        <p className="text-[11px] text-cyan-400/80 italic leading-snug">
                          ⚡ WARNING: Corrupted systems detected. Tap flickering neon hotspots directly on the central data cathedral library scene. Scans increase mainframe alerts (Threat Level) by 1%.
                        </p>

                        <div className="relative w-full aspect-[9/16] rounded-xl overflow-hidden border border-cyan-500/30 shadow-inner bg-black">
                          {/* Strobe background flashing layer */}
                          <div className="absolute inset-0 bg-red-950/5 pointer-events-none animate-pulse z-10 border border-red-500/10 rounded-xl"></div>
                          
                          {/* High resolution Gothic library reference background */}
                          <img 
                            src="/src/assets/images/level3_bg.png" 
                            alt="Gothic Cathedral Arch Library Data Collapse" 
                            className="w-full h-full object-cover scale-102 font-bold"
                            referrerPolicy="no-referrer"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-transparent to-red-950/40 pointer-events-none z-10"></div>

                                                   {/* Hotspot 1: Corrupted Mainframe (Hard: 5 taps) */}
                            <div 
                              onClick={() => handleInteractMarker("lvl3_mainframe", 5)}
                              className="absolute top-[35%] left-[12%] group cursor-pointer z-20"
                            >
                              <div className="flex items-center gap-1.5 active:scale-95 transition-all duration-100 p-1">
                                <div className={`w-7 h-7 rounded-sm bg-cyan-900/20 border border-cyan-400 flex items-center justify-center marker-glow group-hover:bg-cyan-500/40 transition-all ${
                                  lastTappedHotspot === "lvl3_mainframe" ? "animate-ping scale-125 border-cyan-400 bg-cyan-400/50 shadow-[0_0_15px_rgba(6,182,212,0.7)]" : ""
                                }`}>
                                  <Search size={11} className="text-cyan-300 animate-pulse animate-bounce" />
                                </div>
                                <div className="bg-black/90 backdrop-blur-md border-l-2 border-cyan-400 p-1 px-1.5 rounded-sm text-[10px] min-w-[75px] shadow-lg">
                                  <p className="text-zinc-400 font-mono text-[7px] tracking-widest leading-none uppercase">Mainframe</p>
                                  <p className="font-bold text-white leading-none mt-0.5">{investigations.lvl3_mainframe || 0}/5</p>
                                </div>
                                {lastTappedHotspot === "lvl3_mainframe" && (
                                  <span className="absolute -top-3 left-1 text-[8px] font-extrabold text-[#06b6d4] drop-shadow-md animate-bounce bg-black/80 px-1 py-0.5 rounded border border-cyan-400">+1 TAP</span>
                                )}
                              </div>
                            </div>

                            {/* Hotspot 2: Security Terminal (Medium: 5 taps) */}
                            <div 
                              onClick={() => handleInteractMarker("lvl3_terminal", 5)}
                              className="absolute top-[52%] left-[16%] group cursor-pointer z-20"
                            >
                              <div className="flex items-center gap-1.5 active:scale-95 transition-all duration-100 p-1">
                                <div className={`w-7 h-7 rounded-sm bg-cyan-900/20 border border-cyan-400 flex items-center justify-center marker-glow group-hover:bg-cyan-500/40 transition-all ${
                                  lastTappedHotspot === "lvl3_terminal" ? "animate-ping scale-125 border-cyan-400 bg-cyan-400/50 shadow-[0_0_15px_rgba(6,182,212,0.7)]" : ""
                                }`}>
                                  <Search size={11} className="text-cyan-300" />
                                </div>
                                <div className="bg-black/90 backdrop-blur-md border-l-2 border-cyan-400 p-1 px-1.5 rounded-sm text-[10px] min-w-[75px] shadow-lg">
                                  <p className="text-zinc-400 font-mono text-[7px] tracking-widest leading-none uppercase">Terminal</p>
                                  <p className="font-bold text-white leading-none mt-0.5">{investigations.lvl3_terminal || 0}/5</p>
                                </div>
                                {lastTappedHotspot === "lvl3_terminal" && (
                                  <span className="absolute -top-3 left-1 text-[8px] font-extrabold text-[#06b6d4] drop-shadow-md animate-bounce bg-black/80 px-1 py-0.5 rounded border border-cyan-400">+1 TAP</span>
                                )}
                              </div>
                            </div>

                            {/* Hotspot 3: Emergency Console (Medium: 5 taps) */}
                            <div 
                              onClick={() => handleInteractMarker("lvl3_console", 5)}
                              className="absolute top-[60%] left-[45%] group cursor-pointer z-20"
                            >
                              <div className="flex items-center gap-1.5 active:scale-95 transition-all duration-100 p-1">
                                <div className={`w-7 h-7 rounded-sm bg-cyan-900/20 border border-cyan-400 flex items-center justify-center marker-glow group-hover:bg-cyan-500/40 transition-all ${
                                  lastTappedHotspot === "lvl3_console" ? "animate-ping scale-125 border-cyan-400 bg-cyan-400/50 shadow-[0_0_15px_rgba(6,182,212,0.7)]" : ""
                                }`}>
                                  <Search size={11} className="text-cyan-300 animate-pulse" />
                                </div>
                                <div className="bg-black/90 backdrop-blur-md border-l-2 border-cyan-400 p-1 px-1.5 rounded-sm text-[10px] min-w-[75px] shadow-lg">
                                  <p className="text-zinc-400 font-mono text-[7px] tracking-widest leading-none uppercase">Console</p>
                                  <p className="font-bold text-white leading-none mt-0.5">{investigations.lvl3_console || 0}/5</p>
                                </div>
                                {lastTappedHotspot === "lvl3_console" && (
                                  <span className="absolute -top-3 left-1 text-[8px] font-extrabold text-[#06b6d4] drop-shadow-md animate-bounce bg-black/80 px-1 py-0.5 rounded border border-cyan-400">+1 TAP</span>
                                )}
                              </div>
                            </div>

                            {/* Hotspot 4: Hidden Data Drive (Easy: 5 taps) */}
                            <div 
                              onClick={() => handleInteractMarker("lvl3_datadrive", 5)}
                              className="absolute top-[30%] right-[10%] group cursor-pointer z-20"
                            >
                              <div className="flex items-center gap-1.5 active:scale-95 transition-all duration-100 p-1">
                                <div className={`w-7 h-7 rounded-sm bg-cyan-900/20 border border-cyan-400 flex items-center justify-center marker-glow group-hover:bg-cyan-500/40 transition-all ${
                                  lastTappedHotspot === "lvl3_datadrive" ? "animate-ping scale-125 border-cyan-400 bg-cyan-400/50 shadow-[0_0_15px_rgba(6,182,212,0.7)]" : ""
                                }`}>
                                  <Search size={11} className="text-cyan-300 text-cyan-300 border-glow" />
                                </div>
                                <div className="bg-black/90 backdrop-blur-md border-l-2 border-cyan-400 p-1 px-1.5 rounded-sm text-[10px] min-w-[75px] shadow-lg">
                                  <p className="text-zinc-400 font-mono text-[7px] tracking-widest leading-none uppercase">Data Drive</p>
                                  <p className="font-bold text-white leading-none mt-0.5">{investigations.lvl3_datadrive || 0}/5</p>
                                </div>
                                {lastTappedHotspot === "lvl3_datadrive" && (
                                  <span className="absolute -top-3 left-1 text-[8px] font-extrabold text-[#06b6d4] drop-shadow-md animate-bounce bg-black/80 px-1 py-0.5 rounded border border-cyan-400">+1 TAP</span>
                                )}
                              </div>
                            </div>

                            {/* Hotspot 5: Broken Surveillance Monitor (Hard: 5 taps) */}
                            <div 
                              onClick={() => handleInteractMarker("lvl3_monitor", 5)}
                              className="absolute top-[48%] right-[16%] group cursor-pointer z-20"
                            >
                              <div className="flex items-center gap-1.5 active:scale-95 transition-all duration-100 p-1">
                                <div className={`w-7 h-7 rounded-sm bg-cyan-900/20 border border-cyan-400 flex items-center justify-center marker-glow group-hover:bg-cyan-500/40 transition-all ${
                                  lastTappedHotspot === "lvl3_monitor" ? "animate-ping scale-125 border-cyan-400 bg-cyan-400/50 shadow-[0_0_15px_rgba(6,182,212,0.7)]" : ""
                                }`}>
                                  <Search size={11} className="text-cyan-300 animate-pulse" />
                                </div>
                                <div className="bg-black/90 backdrop-blur-md border-l-2 border-cyan-400 p-1 px-1.5 rounded-sm text-[10px] min-w-[75px] shadow-lg">
                                  <p className="text-zinc-400 font-mono text-[7px] tracking-widest leading-none uppercase">Monitor</p>
                                  <p className="font-bold text-white leading-none mt-0.5">{investigations.lvl3_monitor || 0}/5</p>
                                </div>
                                {lastTappedHotspot === "lvl3_monitor" && (
                                  <span className="absolute -top-3 left-1 text-[8px] font-extrabold text-[#06b6d4] drop-shadow-md animate-bounce bg-black/80 px-1 py-0.5 rounded border border-cyan-400">+1 TAP</span>
                                )}
                              </div>
                            </div>

                            {/* Hotspot 6: Syndicate Obstruction Shield (Easy: 5 taps) */}
                            <div 
                              onClick={() => handleInteractMarker("lvl3_firewall", 5)}
                              className="absolute bottom-[22%] left-[26%] group cursor-pointer z-20"
                            >
                              <div className="flex items-center gap-1.5 active:scale-95 transition-all duration-100 p-1">
                                <div className={`w-7 h-7 rounded-sm bg-cyan-900/20 border border-cyan-400 flex items-center justify-center marker-glow group-hover:bg-cyan-500/40 transition-all ${
                                  lastTappedHotspot === "lvl3_firewall" ? "animate-ping scale-125 border-cyan-400 bg-cyan-400/50 shadow-[0_0_15px_rgba(6,182,212,0.7)]" : ""
                                }`}>
                                  <Search size={11} className="text-cyan-300" />
                                </div>
                                <div className="bg-black/90 backdrop-blur-md border-l-2 border-cyan-400 p-1 px-1.5 rounded-sm text-[10px] min-w-[75px] shadow-lg">
                                  <p className="text-zinc-400 font-mono text-[7px] tracking-widest leading-none uppercase">Shield</p>
                                  <p className="font-bold text-white leading-none mt-0.5">{investigations.lvl3_firewall || 0}/5</p>
                                </div>
                                {lastTappedHotspot === "lvl3_firewall" && (
                                  <span className="absolute -top-3 left-1 text-[8px] font-extrabold text-[#06b6d4] drop-shadow-md animate-bounce bg-black/80 px-1 py-0.5 rounded border border-cyan-400">+1 TAP</span>
                                )}
                              </div>
                            </div>

                            {/* Hotspot 7: Locked Evidence Crate (Medium: 5 taps) */}
                            <div 
                              onClick={() => handleInteractMarker("lvl3_crate", 5)}
                              className="absolute bottom-[16%] right-[22%] group cursor-pointer z-20"
                            >
                              <div className="flex items-center gap-1.5 active:scale-95 transition-all duration-100 p-1">
                                <div className={`w-7 h-7 rounded-sm bg-cyan-900/20 border border-cyan-400 flex items-center justify-center marker-glow group-hover:bg-cyan-500/40 transition-all ${
                                  lastTappedHotspot === "lvl3_crate" ? "animate-ping scale-125 border-cyan-400 bg-cyan-400/50 shadow-[0_0_15px_rgba(6,182,212,0.7)]" : ""
                                }`}>
                                  <Search size={11} className="text-cyan-300 animate-pulse" />
                                </div>
                                <div className="bg-black/90 backdrop-blur-md border-l-2 border-cyan-400 p-1 px-1.5 rounded-sm text-[10px] min-w-[75px] shadow-lg">
                                  <p className="text-zinc-400 font-mono text-[7px] tracking-widest leading-none uppercase">Evidence Crate</p>
                                  <p className="font-bold text-white leading-none mt-0.5">{investigations.lvl3_crate || 0}/5</p>
                                </div>
                                {lastTappedHotspot === "lvl3_crate" && (
                                  <span className="absolute -top-3 left-1 text-[8px] font-extrabold text-[#06b6d4] drop-shadow-md animate-bounce bg-black/80 px-1 py-0.5 rounded border border-cyan-400">+1 TAP</span>
                                )}
                              </div>
                            </div>

                          </div>
                      </>
                    )
                  )}

                  {/* NEON CYBERPUNK CLUE DIALOGUE BOX */}
                  <div className="border border-cyan-500/30 bg-black/80 backdrop-blur-md rounded-xl p-4 shadow-[0_0_15px_rgba(6,182,212,0.15)] relative overflow-hidden font-mono mt-2 mb-4 select-none">
                    {/* Glowing Accent Corner Elements */}
                    <div className="absolute top-0 left-0 w-2 h-2 border-t-2 border-l-2 border-cyan-400"></div>
                    <div className="absolute top-0 right-0 w-2 h-2 border-t-2 border-r-2 border-cyan-400"></div>
                    <div className="absolute bottom-0 left-0 w-2 h-2 border-b-2 border-l-2 border-cyan-400"></div>
                    <div className="absolute bottom-0 right-0 w-2 h-2 border-b-2 border-r-2 border-cyan-400"></div>
                    
                    {/* Diagnostic Scanlines overlay */}
                    <div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[size:100%_4px,6px_100%] pointer-events-none opacity-40"></div>

                    {/* Header bar */}
                    <div className="flex justify-between items-center text-[8px] text-cyan-400 tracking-widest uppercase border-b border-cyan-500/20 pb-2 mb-2">
                      <span className="flex items-center gap-1.5 font-bold">
                        <Search size={10} className="animate-spin text-cyan-400" />
                        [DETECTION FEED: PROBE STREAM]
                      </span>
                      <span className="text-zinc-500 font-extrabold animate-pulse">
                        {currentClueHotspot ? "LINK ESTABLISHED" : "LINK STANDBY"}
                      </span>
                    </div>

                    {/* Dialogue Main Section */}
                    {currentClueHotspot ? (
                      <div className="space-y-1">
                        <p className="text-[10px] text-zinc-400 leading-none mb-1.5">
                          TARGET DECRYPTED:{" "}
                          <span className="text-cyan-400 font-extrabold uppercase">
                            {currentClueHotspot.replace("lvl2_", "").replace("lvl3_", "").replace("_", " ")} (TAP {currentClueCount}/5)
                          </span>
                        </p>
                        <p className="text-xs text-white leading-relaxed min-h-[36px]">
                          <TypewriterText text={getHotspotClue(currentClueHotspot, currentClueCount)} speed={20} glitch={currentClueCount < 5 && Math.random() < 0.2} />
                          <span className="animate-[ping_0.8s_infinite] text-cyan-400 font-bold ml-1">_</span>
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-1">
                        <p className="text-[10px] text-zinc-500 mb-1.5 uppercase tracking-widest">[SYSTEM LOGS: WAITING ON INPUT]</p>
                        <p className="text-[11px] text-zinc-400 leading-snug min-h-[36px]">
                          <TypewriterText text="Point-and-click objects in the digital environment above to probe and decrypt detective clues..." speed={15} />
                          <span className="animate-pulse text-cyan-400 ml-1 font-bold">█</span>
                        </p>
                      </div>
                    )}
                  </div>

                  {/* ENEMY ARRIVAL TRACKER TERMINAL PANEL */}
                  <div className="mt-6 border-2 border-red-950/40 rounded-xl bg-black/95 p-4 shadow-[0_0_20px_rgba(239,68,68,0.15)] max-w-sm mx-auto select-none font-mono text-left relative overflow-hidden">
                    {/* Retro CRT Scan Lines overlay */}
                    <div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.04),rgba(0,255,0,0.01),rgba(0,0,255,0.04))] bg-[size:100%_4px,6px_100%] pointer-events-none z-10"></div>
                    
                    {/* Header bar and radar simulation */}
                    <div className="flex items-center justify-between border-b border-red-950 pb-2 mb-3 relative z-10">
                      <div className="flex items-center gap-1.5">
                        <span className="relative flex h-2 w-2">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                        </span>
                        <div>
                          <h3 className="text-[10px] font-black text-red-500 tracking-wider uppercase flex items-center gap-1 leading-none">
                            <Radio size={12} className="text-red-500 animate-[pulse_1.0s_infinite]" /> ENEMY THREAT MONITOR
                          </h3>
                          <p className="text-[7px] text-zinc-550 tracking-[0.05em] uppercase leading-none mt-1">CLOVER SECURITY PASSIVE SCAN</p>
                        </div>
                      </div>
                      <span className="text-[7.5px] bg-red-950 text-red-400 border border-red-900/40 px-1.5 py-0.5 rounded text-[7px] uppercase tracking-widest font-extrabold animate-pulse">
                        RADAR ACTIVE
                      </span>
                    </div>

                    {/* Simulation logs of incoming malware */}
                        <div className="space-y-2 relative z-10">
                      {[
                        { id: "agent_pur", label: "LEVEL 1 ENEMY", name: "Agent Pur", icon: "🐱", effect: "Progress Theft - Delivers Tap Penalties" },
                        { id: "beak_storm", label: "LEVEL 2 ENEMY", name: "Beak Storm", icon: "🦉", effect: "Security Pressure - Required Taps +2" },
                        { id: "mr_mustela", label: "LEVEL 3 ENEMY", name: "Mr. Mustela", icon: "🦦", effect: "Evidence Lockdown - Taps Blocked" },
                        { id: "poison_fang", label: "FINAL BOSS", name: "Poison Fang", icon: "🐍", effect: "System Corruption - False Clues Loaded" }
                      ].map((enemy) => {
                        const isSabotaging = activeSabotages[enemy.id];
                        const nextArr = enemyArrivals[enemy.id as keyof EnemyArrivals] || 0;
                        const remainingMs = Math.max(0, nextArr - currentTime);
                        const isArriving = remainingMs <= 10000; // < 10 seconds left
                        const isHighWarning = remainingMs <= 60000; // < 60 seconds left
                        const formattedTime = formatCountdown(remainingMs);

                        return (
                          <div 
                            key={enemy.id} 
                            className={`border ${
                              isSabotaging
                              ? "bg-red-950/25 border-red-500/80 shadow-[inset_0_0_10px_rgba(239,68,68,0.15)] animate-pulse"
                              : isArriving 
                                ? "bg-red-950/45 border-red-500 animate-[pulse_0.7s_infinite] shadow-[0_0_8px_rgba(239,68,68,0.25)]" 
                                : isHighWarning 
                                  ? "bg-amber-950/30 border-amber-500/50" 
                                  : "bg-[#03060c] border-[#0d283c]/65"
                            } rounded-lg p-2.5 flex items-center justify-between transition-all select-none`}
                          >
                            <div className="flex items-center gap-2">
                              {/* Avatar Indicator Box */}
                              <div className={`w-8 h-8 rounded border ${
                                isSabotaging
                                ? "border-red-500 bg-red-950 text-red-400 text-lg"
                                : isArriving 
                                  ? "border-red-500 bg-red-900/40 text-lg animate-bounce" 
                                  : "border-[#0d283c]/60 bg-slate-950 text-md"
                              } flex items-center justify-center`}>
                                {enemy.icon}
                              </div>
                              <div className="space-y-0.5">
                                <div className="flex items-center gap-1.5">
                                  <span className="text-[7px] text-zinc-500 uppercase tracking-widest font-black leading-none">
                                    {enemy.label}
                                  </span>
                                  {isSabotaging && (
                                    <span className="text-[6.5px] font-extrabold text-red-500 bg-red-950/80 px-1 border border-red-900 rounded uppercase leading-none tracking-wider animate-[pulse_1s_infinite]">
                                      SABOTAGE ACTIVE
                                    </span>
                                  )}
                                </div>
                                <h4 className={`text-[10px] font-extrabold uppercase leading-none tracking-tight ${
                                  isSabotaging ? "text-red-400" : isArriving ? "text-red-450" : "text-white"
                                }`}>
                                  {enemy.name}
                                </h4>
                                {isSabotaging && (
                                  <p className="text-[6.8px] text-zinc-400 leading-none mt-1 uppercase font-semibold">
                                    {enemy.effect}
                                  </p>
                                )}
                              </div>
                            </div>

                            {/* Live Timer and status details or Fight Back Button */}
                            <div className="text-right space-y-0.5 min-w-[70px]">
                              {isSabotaging ? (
                                <button
                                  onClick={() => handleFightBack(enemy.id as any)}
                                  className="px-2.5 py-1 text-[8.5px] font-black uppercase tracking-wider rounded border border-cyan-450 bg-cyan-950/65 text-cyan-400 hover:bg-cyan-400 hover:text-black hover:shadow-[0_0_12px_#22d3ee] duration-200 cursor-pointer animate-[pulse_1.5s_infinite] shadow-[0_0_8px_rgba(34,211,238,0.2)] font-sans"
                                >
                                  FIGHT BACK
                                </button>
                              ) : (
                                <>
                                  {isArriving ? (
                                    <span className="text-[7.5px] font-black bg-red-650 text-black px-1.5 py-0.5 rounded uppercase tracking-wider animate-[pulse_0.5s_infinite] inline-block font-sans">
                                      ⚠️ ARRIVING
                                    </span>
                                  ) : isHighWarning ? (
                                    <span className="text-[7.5px] font-black bg-amber-500 text-black px-1.5 py-0.5 rounded uppercase tracking-wider inline-block">
                                      IMPENDING
                                    </span>
                                  ) : (
                                    <span className="text-[7.5px] font-extrabold text-zinc-500 uppercase tracking-wide">
                                      SECURE LNK
                                    </span>
                                  )}
                                  <p className={`text-xs font-black select-all font-mono tracking-widest leading-none mt-1 ${
                                    isArriving 
                                    ? "text-red-500 text-glow-red animate-pulse" 
                                    : isHighWarning 
                                      ? "text-amber-500" 
                                      : "text-cyan-400"
                                  }`}>
                                    {formattedTime}
                                  </p>
                                </>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Footer instructions simulating radar operations */}
                    <div className="mt-3 pt-2 flex justify-between items-center text-[7px] text-zinc-500 tracking-wide uppercase leading-none border-t border-zinc-900">
                      <span className="flex items-center gap-0.5">
                        <Timer size={10} className="text-zinc-550" /> THREAT ARRIVAL TRACKER
                      </span>
                      <span className="text-emerald-500 animate-pulse font-bold">RADAR TRACE OK</span>
                    </div>
                  </div>
                </motion.div>
            )}


            {/* TAB 3: FOCUS TIMER PROTOCOL SCREEN */}
            {activeTab === "protocol" && (() => {
              const getProtoTheme = () => {
                switch (selectedProtocolType) {
                  case "intelligence":
                    return {
                      glow: "shadow-[0_0_30px_rgba(59,130,246,0.3)] border-blue-500/30",
                      text: "text-blue-400 drop-shadow-[0_0_12px_rgba(59,130,246,0.5)]",
                      orbit: "bg-blue-500 shadow-[0_0_15px_#3b82f6]",
                      bg: "bg-blue-500/5",
                      ring: "border-blue-500/10"
                    };
                  case "sleep":
                    return {
                      glow: "shadow-[0_0_30px_rgba(34,211,238,0.3)] border-cyan-500/30",
                      text: "text-cyan-400 drop-shadow-[0_0_12px_rgba(34,211,238,0.5)]",
                      orbit: "bg-cyan-500 shadow-[0_0_15px_#06b6d4]",
                      bg: "bg-cyan-500/5",
                      ring: "border-cyan-500/10"
                    };
                  case "exercise":
                    return {
                      glow: "shadow-[0_0_30px_rgba(16,185,129,0.3)] border-emerald-500/30",
                      text: "text-emerald-400 drop-shadow-[0_0_12px_rgba(16,185,129,0.5)]",
                      orbit: "bg-emerald-500 shadow-[0_0_15px_#10b981]",
                      bg: "bg-emerald-500/5",
                      ring: "border-emerald-500/10"
                    };
                  case "creativity":
                    return {
                      glow: "shadow-[0_0_30px_rgba(168,85,247,0.3)] border-purple-500/30",
                      text: "text-purple-400 drop-shadow-[0_0_12px_rgba(168,85,247,0.5)]",
                      orbit: "bg-purple-500 shadow-[0_0_15px_#a855f7]",
                      bg: "bg-purple-500/5",
                      ring: "border-purple-500/10"
                    };
                  default:
                    return {
                      glow: "shadow-[0_0_30px_rgba(59,130,246,0.3)] border-blue-500/30",
                      text: "text-blue-400 drop-shadow-[0_0_12px_rgba(59,130,246,0.5)]",
                      orbit: "bg-blue-500 shadow-[0_0_15px_#3b82f6]",
                      bg: "bg-blue-500/5",
                      ring: "border-blue-500/10"
                    };
                }
              };
              const protoTheme = getProtoTheme();
              return (
                <motion.div 
                  key="tab_proto"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="space-y-6 text-center select-none py-4"
                >
                  <div className="relative text-center mb-4 space-y-1">
                    <h1 className={`font-headline text-5xl italic transition-all duration-300 ${protoTheme.text}`}>
                      Focus Protocol
                    </h1>
                    <span className="text-[10px] tracking-widest uppercase text-gray-400 font-mono flex items-center justify-center gap-1.5 leading-none">
                      <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse inline-block"></span>
                      Intel Gathering Loop Active
                    </span>
                  </div>

                  {/* Directive Selection Segment Buttons */}
                  <div className="max-w-[420px] mx-auto px-4 space-y-2">
                    <p className="text-[10px] font-mono tracking-widest text-gray-500 uppercase">
                      Select Target Operational Directive
                    </p>
                    <div className="grid grid-cols-4 gap-2">
                      {[
                        { key: "intelligence", label: "Intelligence", icon: Compass, color: "hover:border-blue-500/40" },
                        { key: "sleep", label: "Sleep", icon: Moon, color: "hover:border-cyan-500/40" },
                        { key: "exercise", label: "Exercise", icon: Flame, color: "hover:border-emerald-500/40" },
                        { key: "creativity", label: "Drawing", icon: Palette, color: "hover:border-purple-500/40" }
                      ].map((item) => {
                        const IconComp = item.icon;
                        const isSelected = selectedProtocolType === item.key;
                        return (
                          <button
                            key={item.key}
                            onClick={() => {
                              if (timerRunning) {
                                addToast("⚠️ Can't hot-swap session while the protocol loop is active.", "warn");
                                return;
                              }
                              playSynthSound("tap");
                              setSelectedProtocolType(item.key as any);
                            }}
                            className={`py-3 px-2 rounded-xl border text-center transition-all flex flex-col items-center justify-center gap-1 cursor-pointer ${
                              isSelected
                              ? selectedProtocolType === "intelligence" 
                                ? "bg-blue-600/15 border-blue-400 shadow-[0_0_15px_rgba(59,130,246,0.25)] text-white font-bold"
                                : selectedProtocolType === "sleep"
                                  ? "bg-cyan-600/15 border-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.25)] text-white font-bold"
                                  : selectedProtocolType === "exercise"
                                    ? "bg-emerald-600/15 border-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.25)] text-white font-bold"
                                    : "bg-purple-600/15 border-purple-400 shadow-[0_0_15px_rgba(168,85,247,0.25)] text-white font-bold"
                              : `bg-black/40 border-white/5 text-gray-500 ${item.color}`
                            }`}
                          >
                            <IconComp size={16} className={isSelected ? selectedProtocolType === "intelligence" ? "text-blue-400 animate-pulse" : selectedProtocolType === "sleep" ? "text-cyan-400 animate-pulse" : selectedProtocolType === "exercise" ? "text-emerald-400 animate-pulse" : "text-purple-400 animate-pulse" : "text-gray-500"} />
                            <span className="text-[10px] uppercase tracking-wider">{item.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Circular Glass Stopwatch display */}
                  <div className="flex items-center justify-center relative my-6">
                    
                    {/* Glowing outer rings for futuristic HUD visuals */}
                    <div className="absolute w-[280px] h-[280px] rounded-full border border-white/[0.02] pointer-events-none"></div>
                    <div className="absolute w-[300px] h-[300px] rounded-full border border-dashed border-white/[0.01] pointer-events-none"></div>
                    {timerRunning && (
                      <>
                        <div className={`absolute inset-[-12px] rounded-full border ${protoTheme.ring} animate-[ping_3s_infinite] pointer-events-none`}></div>
                        <div className={`absolute inset-[-24px] rounded-full border ${protoTheme.ring} opacity-50 animate-[ping_4s_infinite_1.5s] pointer-events-none`}></div>
                      </>
                    )}

                    {/* Glow circle outlines */}
                    <div className={`relative w-64 h-64 rounded-full border flex items-center justify-center transition-all duration-500 group ${protoTheme.glow} ${protoTheme.bg}`}>
                      
                      {/* Inner dash circle */}
                      <div className="absolute inset-4 rounded-full border border-dashed border-white/5"></div>
                      
                      {/* Translucent glass circle */}
                      <div className="absolute inset-0 rounded-full border-[8px] border-white/5 backdrop-blur-sm"></div>

                      {/* Timer figures */}
                      <div className="text-center relative z-10 space-y-1">
                        <span className="block font-headline text-5xl md:text-6xl text-white tracking-tighter tabular-nums drop-shadow-[0_0_15px_rgba(255,255,255,0.45)]">
                          {selectedProtocolType === "intelligence" && formatTimerString(sessionSecCount)}
                          {selectedProtocolType === "exercise" && formatTimerString(exerciseProgressSec)}
                          {selectedProtocolType === "sleep" && formatTimerString(sleepProgressSec)}
                          {selectedProtocolType === "creativity" && formatTimerString(creativityProgressSec)}
                        </span>
                        <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-blue-400 block font-bold transition-all duration-300">
                          {selectedProtocolType === "intelligence" ? "Intelligence Focus Log" : selectedProtocolType === "exercise" ? "Exercise Endurance Log" : selectedProtocolType === "sleep" ? "Sleep Cycle Tracker" : "Creativity Drafting Log"}
                        </span>
                      </div>

                      {/* Orbiting element mimicking scanning signal */}
                      <motion.div 
                        animate={timerRunning ? { rotate: 360 } : {}}
                        transition={timerRunning ? { repeat: Infinity, duration: 6, ease: "linear" } : {}}
                        className="absolute inset-0 rounded-full border border-transparent"
                      >
                        <div className={`absolute top-1/2 left-[-5px] -translate-y-1/2 w-3.5 h-3.5 rounded-full transition-all duration-300 ${protoTheme.orbit}`}></div>
                      </motion.div>
                    </div>
                  </div>

                  {/* Brief stat telemetry card */}
                  <div className="px-6 py-4 rounded-2xl bg-[#111111] border border-white/5 flex justify-around items-center max-w-[340px] mx-auto shadow-2xl">
                    <div className="text-left leading-none">
                      <span className="text-[8.5px] font-bold text-gray-500 uppercase tracking-widest font-mono">EST TARGET PROGRESS</span>
                      <p className="text-white font-extrabold text-[13px] mt-1.5 uppercase font-mono tracking-wider">
                        {selectedProtocolType === "intelligence" ? "2h 00m Target" : selectedProtocolType === "exercise" ? "30m Target" : selectedProtocolType === "sleep" ? "7h 00m Target" : "1h 00m Target"}
                      </p>
                    </div>
                    <div className="h-6 w-[1px] bg-white/10"></div>
                    <div className="text-left leading-none">
                      <span className="text-[8.5px] font-bold text-gray-500 uppercase tracking-widest font-mono">SESSION ELAPSED</span>
                      <p className="text-blue-400 font-extrabold text-[13px] mt-1.5 font-mono animate-pulse">
                        {timerRunning ? formatTimerString(focusedSeconds) : "00:00 (IDLE)"}
                      </p>
                    </div>
                  </div>

                  {/* Big tactical start focus switch button */}
                  <div className="max-w-[280px] mx-auto mt-4">
                    <motion.button 
                      whileTap={{ scale: 0.95 }}
                      onClick={handleToggleTimer}
                      className={`w-full font-bold py-3.5 rounded-xl flex items-center justify-center gap-2 cursor-pointer transition-all uppercase duration-150 tracking-wider text-xs ${
                        timerRunning 
                        ? "bg-red-950/60 border border-red-600/30 text-red-200 shadow-[0_0_15px_rgba(239,68,68,0.25)]" 
                        : "bg-blue-600 text-white font-bold hover:bg-blue-500 transition-colors shadow-[0_0_15px_rgba(59,130,246,0.35)]"
                      }`}
                    >
                      <Power size={16} className={`${timerRunning ? "animate-spin text-red-400" : ""}`} />
                      {timerRunning ? "SUSPEND PROTOCOL" : "START FOCUS PROTOCOL"}
                    </motion.button>
                    <p className="text-center mt-3 text-[9px] text-gray-600 italic">
                      Unauthorized terminal termination will alter historical logs database records.
                    </p>
                  </div>
                </motion.div>
              );
            })()}

            {/* TAB 4: SHOP ACQUISITIONS */}
            {activeTab === "shop" && (
              <motion.div 
                key="tab_shop"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-6"
              >
                {/* 1. CINEMATIC S-RANK BIOMETRIC SYNC & GEAR LAB */}
                <div className="bg-[#030a16]/95 text-white border-2 border-cyan-500/30 rounded-2xl p-6 shadow-[0_0_30px_rgba(6,182,212,0.15)] font-mono relative overflow-hidden">
                  {/* Tech grid scanlines */}
                  <div className="absolute inset-0 bg-[linear-gradient(rgba(0,203,255,0.012)_1px,transparent_1px)] bg-[size:100%_4px] pointer-events-none"></div>
                  <div className="absolute -top-32 -left-32 w-64 h-64 bg-cyan-500/5 rounded-full blur-3xl pointer-events-none"></div>
                  <div className="absolute -bottom-32 -right-32 w-64 h-64 bg-orange-500/5 rounded-full blur-3xl pointer-events-none"></div>

                  <div className="flex flex-col lg:flex-row gap-6 relative z-10">
                    
                    {/* Left Column: Large Holographic Preview Chassis */}
                    <div className="flex flex-col items-center gap-2.5 flex-shrink-0">
                      <div className="w-full md:w-[220px] aspect-square bg-slate-950/95 border-2 border-cyan-500/40 rounded-xl relative overflow-hidden flex items-center justify-center shadow-[0_0_20px_rgba(6,182,212,0.15)]">
                        {/* Sci-Fi grid background */}
                        <div className="absolute inset-0 bg-[linear-gradient(rgba(6,182,212,0.04)_1.5px,transparent_1.5px),linear-gradient(90deg,rgba(6,182,212,0.04)_1.5px,transparent_1.5px)] bg-[size:16px_16px] pointer-events-none"></div>
                        
                        {/* Interactive Rotating Scan Sweep Line */}
                        <div className="absolute inset-x-0 h-0.5 bg-gradient-to-r from-transparent via-cyan-400 to-transparent shadow-[0_0_8px_#22d3ee] pointer-events-none animate-[bounce_4s_infinite]"></div>

                        {/* Corner Target Markers */}
                        <div className="absolute top-2 left-2 w-3.5 h-3.5 border-t-2 border-l-2 border-cyan-400/60"></div>
                        <div className="absolute top-2 right-2 w-3.5 h-3.5 border-t-2 border-r-2 border-cyan-400/60"></div>
                        <div className="absolute bottom-2 left-2 w-3.5 h-3.5 border-b-2 border-l-2 border-cyan-400/60"></div>
                        <div className="absolute bottom-2 right-2 w-3.5 h-3.5 border-b-2 border-r-2 border-cyan-400/60"></div>

                        {/* Top centering tick marks */}
                        <div className="absolute top-1 left-1/2 -translate-x-1/2 text-[8px] text-cyan-400/55 tracking-tighter">[ CHASSIS SYNC 100% ]</div>

                        {/* Very large, spectacular S-Rank Rodent artwork */}
                        <RodentAvatar 
                          size={180} 
                          coat={equippedItemIds.find(id => initialShopItems.find(item => item.id === id)?.category === "coats")}
                          goggles={equippedItemIds.find(id => initialShopItems.find(item => id === id)?.category === "goggles")}
                          tail={equippedItemIds.find(id => initialShopItems.find(item => id === id)?.category === "tails")}
                          hat={equippedItemIds.find(id => initialShopItems.find(item => id === id)?.category === "hats")}
                          utility={equippedItemIds.find(id => initialShopItems.find(item => item.id === id)?.category === "utility")}
                          className="drop-shadow-[0_0_15px_rgba(255,255,255,0.08)]"
                        />

                        {/* Diagnostic detail badge */}
                        <div className="absolute bottom-2 left-2 right-2 bg-black/75 border border-cyan-500/20 px-2 py-1.5 rounded flex justify-between items-center text-[7.5px] leading-none font-bold">
                          <span className="text-cyan-400 flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                            ACTIVE MATRIX
                          </span>
                          <span className="text-zinc-400 uppercase">S-RANK SYNC</span>
                        </div>
                      </div>
                      
                      <p className="text-[8px] text-cyan-400/60 uppercase font-bold tracking-[0.2em]">
                        ◀ ROTATE CHASSIS STABILIZED ▶
                      </p>
                    </div>

                    {/* Right Column: Detective Info, Active Stats & Equipped Grid */}
                    <div className="flex-grow space-y-4 text-left">
                      <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="bg-cyan-500/10 text-cyan-400 text-[8px] font-black px-2 py-0.5 rounded tracking-wider uppercase border border-cyan-500/30">
                              Active Agency Infiltration Chassis
                            </span>
                          </div>
                          {isEditingCodename ? (
                            <form 
                              onSubmit={(e) => {
                                e.preventDefault();
                                if (tempCodename.trim()) {
                                  setCodename(tempCodename.trim());
                                  setIsEditingCodename(false);
                                }
                              }}
                              className="flex items-center gap-1.5 mt-0.5"
                            >
                              <input
                                type="text"
                                value={tempCodename}
                                onChange={(e) => setTempCodename(e.target.value)}
                                className="bg-slate-950 text-white font-black px-2 py-1 rounded border-2 border-cyan-500 text-xs focus:ring-1 focus:ring-cyan-400 focus:outline-none max-w-[150px] uppercase font-mono"
                                autoFocus
                                maxLength={20}
                              />
                              <button
                                type="submit"
                                className="px-2 py-1 rounded bg-cyan-500 hover:bg-cyan-400 text-black text-[9px] font-black transition-all font-mono"
                              >
                                SAVE
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setIsEditingCodename(false);
                                }}
                                className="px-2 py-1 rounded bg-slate-800 text-zinc-300 hover:text-white text-[9px] font-bold transition-all font-mono"
                              >
                                CANCEL
                              </button>
                            </form>
                          ) : (
                            <div 
                              className="flex items-center gap-1.5 group cursor-pointer select-none py-0.5" 
                              onClick={() => { 
                                setIsEditingCodename(true); 
                                setTempCodename(codename); 
                              }}
                              title="Click to rename your agent"
                            >
                              <h4 className="text-xl font-black tracking-tight uppercase text-white neon-text-cyan">
                                {codename}
                              </h4>
                              <Edit2 size={13} className="text-[#00cbff] opacity-60 group-hover:opacity-100 group-hover:scale-110 transition-all cursor-pointer flex-shrink-0" />
                            </div>
                          )}
                          <h5 className="text-[9px] text-[#00cbff] font-extrabold uppercase tracking-widest leading-none">
                            👑 Rank S-Class Elite Detective | Level {agentLevel || 12} Specialist
                          </h5>
                        </div>

                        {/* Tactical Operational Budget Block */}
                        <div className="bg-[#010408]/90 border border-cyan-500/20 p-3 rounded-xl flex flex-col items-center justify-center text-center shadow-[0_0_12px_rgba(0,203,255,0.08)] min-w-[150px] self-stretch sm:self-auto">
                          <span className="text-[7.5px] text-zinc-500 uppercase font-extrabold tracking-widest leading-none">
                            OPERATIONAL LAB BUDGET
                          </span>
                          <div className="flex items-center gap-1 mt-1 text-xl font-black tracking-wider text-orange-400 neon-text-amber">
                            <span>🔸</span>
                            <span>{credits.toLocaleString()}</span>
                            <span className="text-[10px] text-zinc-500 font-extrabold select-none ml-0.5">CR</span>
                          </div>
                        </div>
                      </div>

                      {/* Diagnostic Attribute Sync Sliders */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 bg-black/45 border border-cyan-500/10 p-3 rounded-xl">
                        <div className="space-y-1">
                          <div className="flex justify-between items-center text-[8.5px] uppercase font-bold leading-none">
                            <span className="text-zinc-400">👤 Biometric Stealth Index</span>
                            <span className="text-[#00cbff] font-black">{(85 + equippedItemIds.length * 2.5).toFixed(1)}%</span>
                          </div>
                          <div className="h-1.5 w-full bg-slate-900 rounded-full overflow-hidden border border-white/5">
                            <div 
                              className="h-full bg-gradient-to-r from-cyan-600 to-cyan-400 transition-all duration-500" 
                              style={{ width: `${Math.min(100, 85 + equippedItemIds.length * 2.5)}%` }}
                            ></div>
                          </div>
                        </div>

                        <div className="space-y-1">
                          <div className="flex justify-between items-center text-[8.5px] uppercase font-bold leading-none">
                            <span className="text-zinc-400">📡 Signal Intercept Power</span>
                            <span className="text-amber-400 font-black">{(92 + equippedItemIds.length * 1.5).toFixed(1)}%</span>
                          </div>
                          <div className="h-1.5 w-full bg-slate-900 rounded-full overflow-hidden border border-white/5">
                            <div 
                              className="h-full bg-gradient-to-r from-amber-600 to-amber-400 transition-all duration-500" 
                              style={{ width: `${Math.min(100, 92 + equippedItemIds.length * 1.5)}%` }}
                            ></div>
                          </div>
                        </div>

                        <div className="space-y-1">
                          <div className="flex justify-between items-center text-[8.5px] uppercase font-bold leading-none">
                            <span className="text-zinc-400">🧬 Cybernetic Tactical Sync</span>
                            <span className="text-emerald-400 font-black">{(80 + equippedItemIds.length * 4.0).toFixed(1)}%</span>
                          </div>
                          <div className="h-1.5 w-full bg-slate-900 rounded-full overflow-hidden border border-white/5">
                            <div 
                              className="h-full bg-gradient-to-r from-emerald-600 to-emerald-400 transition-all duration-500" 
                              style={{ width: `${Math.min(100, 80 + equippedItemIds.length * 4.0)}%` }}
                            ></div>
                          </div>
                        </div>

                        <div className="space-y-1">
                          <div className="flex justify-between items-center text-[8.5px] uppercase font-bold leading-none">
                            <span className="text-zinc-400">🛡️ Network Threat Absorb</span>
                            <span className="text-purple-400 font-black">{(95 - equippedItemIds.length * 0.8).toFixed(1)}%</span>
                          </div>
                          <div className="h-1.5 w-full bg-slate-900 rounded-full overflow-hidden border border-white/5">
                            <div 
                              className="h-full bg-gradient-to-r from-purple-600 to-purple-400 transition-all duration-500" 
                              style={{ width: `${Math.min(100, 95 - equippedItemIds.length * 0.8)}%` }}
                            ></div>
                          </div>
                        </div>
                      </div>

                      {/* Currently Equipped Item Badge Row */}
                      <div className="space-y-1.5">
                        <span className="text-[8px] text-zinc-500 uppercase tracking-widest font-black block">
                          🔧 ACTIVE UTILITY SLOTS HARDPOINT SYNC STATUS
                        </span>
                        <div className="flex flex-wrap gap-2 text-[8px] font-bold uppercase">
                          {["coats", "goggles", "tails", "hats", "utility"].map((cat) => {
                            const equippedId = equippedItemIds.find(id => initialShopItems.find(item => item.id === id)?.category === cat);
                            const item = initialShopItems.find(i => i.id === equippedId);
                            return (
                              <div 
                                key={cat} 
                                className={`px-2.5 py-1.5 rounded-lg border flex items-center gap-1.5 transition-colors ${
                                  item 
                                    ? "bg-cyan-950/40 border-cyan-400/40 text-cyan-200 shadow-[0_0_8px_rgba(6,182,212,0.1)]" 
                                    : "bg-zinc-950/50 border-zinc-900 text-zinc-500"
                                }`}
                              >
                                <span>
                                  {cat === "coats" ? "🧥" : cat === "goggles" ? "🕶️" : cat === "tails" ? "🧬" : cat === "hats" ? "🎩" : "💼"}
                                </span>
                                <span>{cat.toUpperCase()}:</span>
                                <span className={`font-black ${item ? "text-[#00cbff]" : "text-zinc-650"}`}>
                                  {item ? item.title.toUpperCase() : "STOCK UNIT"}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                    </div>
                  </div>
                </div>

                {/* CATEGORIES DETAILED GRID CATALOG */}
                <div className="bg-[#02050c]/98 text-zinc-350 border-2 border-[#0d283c] rounded-xl p-4 md:p-6 shadow-[0_0_40px_rgba(3,7,18,0.9)] space-y-8 font-mono relative overflow-hidden">
                  {/* Modern scan lines and glowing backing */}
                  <div className="absolute inset-0 bg-[linear-gradient(rgba(0,0,0,0.02)_1px,transparent_1px)] bg-[size:100%_4px] pointer-events-none"></div>
                  <div className="absolute top-0 right-0 w-80 h-80 bg-cyan-500/5 blur-[120px] pointer-events-none"></div>

                  <div className="border-b-2 border-dashed border-[#0d283c]/40 pb-4 flex flex-col sm:flex-row justify-between items-center gap-4 relative z-10">
                    <div>
                      <h2 className="text-base font-black tracking-widest uppercase flex items-center gap-2 text-white">
                        <span className="text-[#00cbff]">&gt;&gt;</span> TACTICAL EQUIPMENT CATALOG
                      </h2>
                      <p className="text-[10px] text-[#00cbff] font-bold uppercase tracking-wider mt-0.5">
                        SPEND SECURE FIELD CREDITS (CR) TO UPGRADE OPERATIVE HARDWARE SYSTEM CAPABILITIES
                      </p>
                    </div>

                    {/* Category quick selectors with cyber accents */}
                    <div className="flex flex-wrap gap-1.5 justify-center">
                      {[
                        { id: "coats", label: "OUTFITS" },
                        { id: "goggles", label: "OPTICS" },
                        { id: "tails", label: "CHASSIS" },
                        { id: "hats", label: "HEADGEAR" },
                        { id: "utility", label: "UTILITY" },
                      ].map((catSelector) => (
                        <button
                          key={catSelector.id}
                          onClick={() => {
                            playSynthSound("tap");
                            document.getElementById(`sec_${catSelector.id}`)?.scrollIntoView({ behavior: "smooth" });
                          }}
                          className="px-3 py-1 bg-[#040c18] hover:bg-[#00cbff] text-[#00cbff] hover:text-black border border-[#00cbff]/30 hover:border-transparent rounded text-[9px] font-extrabold transition-all duration-200 select-none cursor-pointer tracking-wider"
                        >
                          {catSelector.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Rendering sequentially to match the specific grid layouts of the reference photo */}
                  <div className="space-y-10 relative z-10">
                    
                    {/* helper mappings */}
                    {(() => {
                      const getItemRarity = (itemId: string) => {
                        const legendary = ["item_trenchcoat", "item_neon", "item_crown", "item_drone", "item_files"];
                        const epic = ["item_cloak", "item_recon", "item_hacker", "item_mask", "item_antenna", "item_grapple", "item_cyberhat", "item_headset", "item_injector"];
                        const rare = ["item_arctic", "item_goggles", "item_lens", "item_jammer", "item_claw", "item_hoodcap", "item_wrist", "item_satchel"];
                        
                        if (legendary.includes(itemId)) {
                          return { name: "LEGENDARY", color: "text-amber-400 border-amber-500/40 bg-amber-500/10", glow: "shadow-[0_0_15px_rgba(245,158,11,0.3)]", ring: "border-amber-500/30" };
                        }
                        if (epic.includes(itemId)) {
                          return { name: "EPIC", color: "text-purple-400 border-purple-500/40 bg-purple-500/10", glow: "shadow-[0_0_15px_rgba(168,85,247,0.25)]", ring: "border-purple-500/35" };
                        }
                        if (rare.includes(itemId)) {
                          return { name: "RARE", color: "text-sky-400 border-sky-500/40 bg-sky-500/10", glow: "shadow-[0_0_15px_rgba(14,165,233,0.2)]", ring: "border-sky-500/30" };
                        }
                        return { name: "COMMON", color: "text-slate-400 border-[#1a3854]/40 bg-slate-600/5", glow: "", ring: "border-[#112d47]" };
                      };

                      const isItemLockedByBoss = (itemId: string) => {
                        if (itemId === "item_crown" && !defeatedLvl1Boss) {
                          return "DEFEAT BEAK STORM (LVL 1 BOSS)";
                        }
                        if (itemId === "item_files" && !defeatedLvl2Boss) {
                          return "DEFEAT MR. MUSTELA (LVL 2 BOSS)";
                        }
                        return null;
                      };

                      const renderItemCard = (item: ShopItem) => {
                        const owned = purchasedItemIds.includes(item.id);
                        const equipped = equippedItemIds.includes(item.id);
                        const rarity = getItemRarity(item.id);
                        const bossLockMessage = isItemLockedByBoss(item.id);

                        // High fidelity color palettes
                        let ambientGlowColor = "bg-slate-500/10";
                        let borderGradient = "border-[#112d47]";
                        
                        if (equipped) {
                          ambientGlowColor = "bg-emerald-500/25";
                          borderGradient = "border-emerald-500 shadow-[0_0_25px_rgba(16,185,129,0.35)]";
                        } else if (bossLockMessage) {
                          ambientGlowColor = "bg-red-950/20";
                          borderGradient = "border-red-950/60 opacity-50 cursor-not-allowed";
                        } else if (rarity.name === "LEGENDARY") {
                          ambientGlowColor = "bg-amber-500/20";
                          borderGradient = "border-amber-500/30 hover:border-amber-400 hover:shadow-[0_0_24px_rgba(245,158,11,0.25)]";
                        } else if (rarity.name === "EPIC") {
                          ambientGlowColor = "bg-purple-500/20";
                          borderGradient = "border-purple-500/30 hover:border-purple-400 hover:shadow-[0_0_24px_rgba(168,85,247,0.22)]";
                        } else if (rarity.name === "RARE") {
                          ambientGlowColor = "bg-sky-500/20";
                          borderGradient = "border-sky-500/30 hover:border-sky-400 hover:shadow-[0_0_24px_rgba(14,165,233,0.18)]";
                        } else {
                          borderGradient = "border-[#142f4c] hover:border-cyan-500/40 hover:shadow-[0_0_20px_rgba(6,182,212,0.15)]";
                        }

                        return (
                          <motion.div
                            key={item.id}
                            whileHover={!bossLockMessage ? { y: -6, scale: 1.025 } : {}}
                            whileTap={!bossLockMessage ? { scale: 0.98 } : {}}
                            onClick={() => {
                              if (bossLockMessage) {
                                playSynthSound("alarm");
                                addToast(`🔒 Locked: ${bossLockMessage}`, "warn");
                                return;
                              }
                              if (owned) {
                                handleToggleEquipItem(item.id);
                              } else {
                                handleAcquireShopItem(item);
                              }
                            }}
                            className={`group flex flex-col justify-between p-4 rounded-xl border-2 transition-all duration-300 relative select-none cursor-pointer overflow-hidden ${
                              equipped 
                                ? "bg-gradient-to-b from-[#06181b]/98 to-[#02070c]/98" 
                                : bossLockMessage
                                  ? "bg-[#010307]/90"
                                  : owned 
                                    ? "bg-gradient-to-b from-[#051122]/98 to-[#02050c]/98"
                                    : "bg-gradient-to-b from-[#030913]/98 to-[#010307]/98"
                            } ${borderGradient}`}
                          >
                            {/* Technical Corner crosshair details */}
                            <div className="absolute top-1.5 left-1.5 w-2.5 h-2.5 border-t border-l border-cyan-500/30 pointer-events-none group-hover:border-cyan-400/70 transition-colors"></div>
                            <div className="absolute top-1.5 right-1.5 w-2.5 h-2.5 border-t border-r border-cyan-500/30 pointer-events-none group-hover:border-cyan-400/70 transition-colors"></div>
                            <div className="absolute bottom-1.5 left-1.5 w-2.5 h-2.5 border-b border-l border-cyan-500/30 pointer-events-none group-hover:border-cyan-400/70 transition-colors"></div>
                            <div className="absolute bottom-1.5 right-1.5 w-2.5 h-2.5 border-b border-r border-cyan-500/30 pointer-events-none group-hover:border-cyan-400/70 transition-colors"></div>

                            {/* Neon Header rarity bar */}
                            <div className={`absolute top-0 inset-x-0 h-[4px] ${
                              equipped ? "bg-gradient-to-r from-emerald-500 to-teal-400" : bossLockMessage ? "bg-red-800" : 
                              rarity.name === "LEGENDARY" ? "bg-gradient-to-r from-amber-500 via-orange-400 to-yellow-500 animate-pulse" :
                              rarity.name === "EPIC" ? "bg-gradient-to-r from-purple-500 to-fuchsia-400" :
                              rarity.name === "RARE" ? "bg-gradient-to-r from-sky-500 to-cyan-400" : "bg-slate-750"
                            }`}></div>

                            {/* Custom Card Preview Box - Takes 60-70% of the space visually */}
                            <div className="aspect-[4/5] w-full bg-[#01050c]/95 border border-[#112d47] rounded-lg flex items-center justify-center p-3 relative overflow-hidden transition-all duration-300 group-hover:border-cyan-500/45 shadow-[inset_0_0_24px_rgba(0,0,0,0.95)]">
                              <span className="absolute top-2 left-2 text-[8px] text-zinc-500 font-mono tracking-widest font-black uppercase select-none opacity-85">
                                REF_#{item.id.replace("item_", "").toUpperCase()}
                              </span>
                              <span className="absolute top-2 right-2 text-[8px] text-zinc-500 font-mono tracking-widest font-black uppercase select-none opacity-85">
                                RANK.{rarity.name[0]}L
                              </span>

                              {/* Heavy Ambient Backlighting Behind Character */}
                              <div className={`absolute w-36 h-36 rounded-full pointer-events-none blur-3xl opacity-40 transition-all duration-300 group-hover:scale-110 group-hover:opacity-60 ${ambientGlowColor}`}></div>

                              {/* Scanning Holographic Laser Overlay */}
                              {equipped && (
                                <div className="absolute inset-0 bg-gradient-to-b from-[#10b981]/12 to-transparent h-[45%] w-full pointer-events-none animate-[scan_2.2s_linear_infinite]"></div>
                              )}

                              {/* Micro scale sci-fi grids */}
                              <div className="absolute inset-0 bg-[linear-gradient(rgba(6,182,212,0.025)_1px,transparent_1px),linear-gradient(90deg,rgba(6,182,212,0.025)_1px,transparent_1px)] bg-[size:8px_8px] pointer-events-none opacity-90"></div>

                              {/* Interactive HUD Marks */}
                              <div className="absolute top-[20%] left-[8%] w-3 h-3 border-t border-l border-cyan-500/15 pointer-events-none group-hover:border-cyan-400/40"></div>
                              <div className="absolute top-[20%] right-[8%] w-3 h-3 border-t border-r border-cyan-500/15 pointer-events-none group-hover:border-cyan-400/40"></div>
                              <div className="absolute bottom-[20%] left-[8%] w-3 h-3 border-b border-l border-cyan-500/15 pointer-events-none group-hover:border-cyan-400/40"></div>
                              <div className="absolute bottom-[20%] right-[8%] w-3 h-3 border-b border-r border-cyan-500/15 pointer-events-none group-hover:border-cyan-400/40"></div>

                              {/* HUGE centering render container for Rodent avatar */}
                              <div className={`w-full h-full max-w-[170px] max-h-[170px] sm:max-w-[190px] sm:max-h-[190px] flex items-center justify-center transition-all duration-500 z-10 ${
                                !bossLockMessage 
                                  ? "filter drop-shadow-[0_0_15px_rgba(6,182,212,0.22)] group-hover:scale-[1.12] group-hover:rotate-1" 
                                  : "scale-95 filter saturate-20 brightness-35"
                              }`}>
                                <RodentAvatar
                                  size="100%"
                                  coat={item.category === "coats" ? item.id : (equippedItemIds.find(id => initialShopItems.find(x => x.id === id)?.category === "coats") || null)}
                                  goggles={item.category === "goggles" ? item.id : (equippedItemIds.find(id => initialShopItems.find(x => x.id === id)?.category === "goggles") || null)}
                                  tail={item.category === "tails" ? item.id : (equippedItemIds.find(id => initialShopItems.find(x => x.id === id)?.category === "tails") || null)}
                                  hat={item.category === "hats" ? item.id : (equippedItemIds.find(id => initialShopItems.find(x => x.id === id)?.category === "hats") || null)}
                                  utility={item.category === "utility" ? item.id : (equippedItemIds.find(id => initialShopItems.find(x => x.id === id)?.category === "utility") || null)}
                                  className="w-full h-full transition-transform"
                                />
                              </div>

                              {/* Overlay for dynamically locked items */}
                              {bossLockMessage && (
                                <div className="absolute inset-0 bg-black/94 backdrop-blur-[1px] flex flex-col items-center justify-center p-3 z-20 text-center">
                                  <div className="p-2.5 rounded bg-red-950/20 border border-red-900/40 animate-pulse">
                                    <Lock size={16} className="text-red-500 stroke-[2.5]" />
                                  </div>
                                  <span className="text-[9px] font-mono text-red-500 font-extrabold tracking-widest uppercase mt-2 shadow-[0_0_8px_rgba(239,68,68,0.2)]">
                                    CLASSIFIED CLUSTER
                                  </span>
                                  <span className="text-[7.5px] text-zinc-400 font-bold uppercase mt-1.5 max-w-[85%] leading-normal text-wrap border-t border-red-500/15 pt-1.5">
                                    {bossLockMessage}
                                  </span>
                                </div>
                              )}
                            </div>

                            {/* Tactical description, labels and action controllers */}
                            <div className="mt-4 flex flex-col justify-between flex-grow space-y-3">
                              <div className="space-y-1.5 w-full text-center">
                                <h4 className="text-sm sm:text-base font-black tracking-widest uppercase text-zinc-100 group-hover:text-[#00cbff] transition-colors leading-tight font-sans">
                                  {item.title}
                                </h4>
                                
                                <div className="flex items-center justify-center gap-1.5 pt-0.5">
                                  <span className={`text-[8px] font-extrabold tracking-widest px-2 py-0.5 rounded border font-mono leading-none uppercase ${rarity.color} ${rarity.glow}`}>
                                    {rarity.name}
                                  </span>
                                  <span className="text-[8px] font-extrabold text-[#00cbff] bg-[#00cbff]/5 border border-[#00cbff]/20 px-1.5 py-0.5 rounded leading-none font-mono uppercase tracking-widest whitespace-nowrap">
                                    {item.category.toUpperCase()}
                                  </span>
                                </div>

                                <p className="text-[10px] text-zinc-300 font-medium leading-relaxed mt-2 select-none h-11 overflow-hidden font-sans border-t border-[#102a3f]/40 pt-1.5">
                                  {item.description}
                                </p>
                              </div>

                              {/* Tactical buttons & credit price tag displays */}
                              <div className="w-full pt-3 border-t border-[#102a3f]/30 flex items-center justify-center">
                                {equipped ? (
                                  <div className="w-full py-2 rounded bg-emerald-500/10 border border-emerald-500/45 flex items-center justify-center gap-1.5 shadow-[0_0_12px_rgba(16,185,129,0.3)]">
                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                                    <span className="text-[9px] font-black font-mono text-[#10b981] tracking-widest uppercase leading-none">
                                      IN DEPLOYMENT
                                    </span>
                                  </div>
                                ) : owned ? (
                                  <div className="w-full py-2 rounded bg-cyan-950/40 hover:bg-cyan-500/20 border border-cyan-500/45 flex items-center justify-center cursor-pointer group-hover:border-[#00cbff]/85 transition-all duration-300 shadow-[0_0_10px_rgba(6,182,212,0.1)]">
                                    <span className="text-[9px] font-black font-mono text-cyan-400 tracking-widest uppercase leading-none group-hover:text-cyan-200">
                                      MOUNT PIECE
                                    </span>
                                  </div>
                                ) : (
                                  <div className="w-full py-2 rounded bg-gradient-to-r from-amber-600/10 to-amber-500/5 hover:from-amber-550/20 hover:to-amber-500/10 border border-amber-500/35 hover:border-amber-500/75 flex items-center justify-center gap-2 transition-all duration-300 shadow-[0_0_8px_rgba(245,158,11,0.05)] cursor-pointer">
                                    <span className="text-xs font-black font-mono text-amber-400 flex items-center gap-1 leading-none tracking-wider">
                                      🔸 {item.cost} <span className="text-[8px] text-zinc-500 uppercase font-black tracking-widest">CR</span>
                                    </span>
                                  </div>
                                )}
                              </div>
                            </div>
                          </motion.div>
                        );
                      };

                      return (
                        <div className="space-y-12">
                          {/* Sequential display of first 3 primary horizontal categories with MUCH wider columns */}
                          {[
                            { id: "coats", name: "Tactical Coats & Outfits", icon: "🧥" },
                            { id: "goggles", name: "Combat Optics & Face Protection", icon: "🕶️" },
                            { id: "tails", name: "Chassis & Tail Reinforcements", icon: "🧬" }
                          ].map((categoryItem) => {
                            const filtered = initialShopItems.filter((item) => item.category === categoryItem.id);
                            // REDESIGNED: Maximum 3 columns wide on large desktop grids to make EACH CARD exceptionally wide, taller and cinematic!
                            const columnsCount = "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8";
                            
                            return (
                              <section key={categoryItem.id} id={`sec_${categoryItem.id}`} className="space-y-6 scroll-mt-6">
                                {/* Sleek Cyberpunk Header with cap indicator and gradient separator */}
                                <div className="flex items-center gap-3 border-b-2 border-dashed border-[#0d283c]/60 pb-3">
                                  <div className="w-1.5 h-5 bg-[#00cbff] shadow-[0_0_12px_rgba(0,203,255,0.8)] rounded-sm"></div>
                                  <span className="text-sm font-black text-[#00cbff]">{categoryItem.icon}</span>
                                  <h3 className="text-xs sm:text-sm font-black tracking-widest text-[#00cbff] uppercase font-mono">
                                    {categoryItem.name}
                                  </h3>
                                  <div className="flex-grow h-[1px] bg-gradient-to-r from-[#0d283c]/50 to-transparent"></div>
                                </div>

                                <div className={`grid ${columnsCount}`}>
                                  {filtered.map(renderItemCard)}
                                </div>
                              </section>
                            );
                          })}

                          {/* Dual columns split screen layout for Hats and Utilities with clean wide column proportions */}
                          <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 lg:gap-12 pt-4">
                            {/* Left Column: Hats */}
                            <section id="sec_hats" className="space-y-6 scroll-mt-6">
                              <div className="flex items-center gap-3 border-b-2 border-dashed border-[#0d283c]/60 pb-3">
                                <div className="w-1.5 h-5 bg-[#00cbff] shadow-[0_0_12px_rgba(0,203,255,0.8)] rounded-sm"></div>
                                <span className="text-sm font-black text-[#00cbff]">🎩</span>
                                <h3 className="text-xs sm:text-sm font-black tracking-widest text-[#00cbff] uppercase font-mono">
                                  Tactical Headgear Specs
                                </h3>
                                <div className="flex-grow h-[1px] bg-gradient-to-r from-[#0d283c]/50 to-transparent"></div>
                              </div>

                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 lg:gap-8">
                                {initialShopItems.filter((i) => i.category === "hats").map(renderItemCard)}
                              </div>
                            </section>

                            {/* Right Column: Utilities */}
                            <section id="sec_utility" className="space-y-6 scroll-mt-6">
                              <div className="flex items-center gap-3 border-b-2 border-dashed border-[#0d283c]/60 pb-3">
                                <div className="w-1.5 h-5 bg-[#00cbff] shadow-[0_0_12px_rgba(0,203,255,0.8)] rounded-sm"></div>
                                <span className="text-sm font-black text-[#00cbff]">💼</span>
                                <h3 className="text-xs sm:text-sm font-black tracking-widest text-[#00cbff] uppercase font-mono">
                                  Utility Tech Accessories
                                </h3>
                                <div className="flex-grow h-[1px] bg-gradient-to-r from-[#0d283c]/50 to-transparent"></div>
                              </div>

                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 lg:gap-8">
                                {initialShopItems.filter((i) => i.category === "utility").map(renderItemCard)}
                              </div>
                            </section>
                          </div>
                        </div>
                      );
                    })()}

                  </div>

                  {/* BOTTOM TACTICAL FOOTER DIRECTIVES */}
                  <div className="border-t border-[#0d283c]/40 pt-4 mt-8 flex flex-col md:flex-row justify-between items-center text-[9px] text-[#00cbff]/60 font-black gap-3 select-none tracking-widest">
                    <div className="flex items-center gap-2">
                      <span className="text-[#00cbff] animate-pulse">★</span>
                      <span>DEFEAT BOSSES IN TACTICAL RECKONING TO DECRYPT EXCLUSIVE FIELD EQUIPMENT!</span>
                    </div>

                    <div className="flex flex-wrap gap-4 font-mono">
                      <span>CAT → 🐾</span>
                      <span>HAWK → 🪶</span>
                      <span>WEASEL → 📋</span>
                      <span>VIPER → 👁️</span>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* TAB 5: AI BRIEFING CHAT AGENT */}
            {activeTab === "agent" && (
              <motion.div 
                key="tab_agent"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="flex flex-col space-y-4 max-h-[70vh]"
              >
                <div className="text-center space-y-1">
                  <h3 className="font-headline text-2xl italic text-[#ffd7a9] drop-shadow-[0_0_8px_rgba(255,179,71,0.2)]">
                    Intelligence Briefing System
                  </h3>
                  <p className="text-[10px] font-mono uppercase tracking-widest text-[#d6c3b0]/80">
                    subconscious cryptanalysis core online
                  </p>
                </div>

                {/* Secure Telegram Dialog logs window */}
                <div className="flex-grow bg-[#0e0e0e]/80 border border-[#524535]/30 rounded-xl p-4 overflow-y-auto space-y-4 h-[340px] flex flex-col">
                  {messages.map((m) => (
                    <div 
                      key={m.id} 
                      className={`flex flex-col space-y-1.5 p-3 rounded-lg max-w-[85%] text-xs border text-[12px] leading-snug font-body relative ${
                        m.sender === "user"
                        ? "bg-[#2a2a2a]/40 border-[#524535]/20 text-[#e5e2e1] self-end rounded-tr-none"
                        : "bg-[#201f1f]/80 border-[#ffd7a9]/15 text-[#d6c3b0] self-start rounded-tl-none font-sans"
                      }`}
                    >
                      <p className="text-[9px] uppercase font-bold text-[#ffb347]/80 tracking-wider">
                        {m.sender === "user" ? "You" : "Briefing Agent AI"}
                      </p>
                      
                      <p className="whitespace-pre-line tracking-wide">
                        {m.content}
                      </p>

                      {/* AI interpretation feedback ratings */}
                      {m.sender === "ai" && m.id !== "msg_init" && (
                        <div className="flex items-center gap-1.5 pt-2 mt-2 border-t border-[#524535]/20 text-[10px]">
                          <span className="text-[9px] opacity-65">How insightful is this dream scan?</span>
                          <div className="flex items-center gap-0.5">
                            {[1, 2, 3, 4, 5].map((val) => (
                              <button 
                                key={val}
                                onClick={() => handleRateMessage(m.id, val)}
                                className="active:scale-130 transition-transform p-0.5"
                              >
                                <Star 
                                  size={11} 
                                  className={m.rating && m.rating >= val ? "fill-[#ffd7a9] text-[#ffd7a9]" : "text-zinc-500"} 
                                />
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}

                  {sendingAIQuery && (
                    <div className="bg-[#201f1f]/30 border border-[#524535]/10 p-3 rounded-lg text-xs tracking-widest text-[#ffd7a9] self-start animate-pulse font-mono flex items-center gap-2">
                      <RefreshCw size={12} className="animate-spin text-[#ffb347]" /> DECRYPTING TRANSMISSION SIGNAL FEED...
                    </div>
                  )}
                </div>

                {/* Transmission Input Area */}
                <div className="relative">
                  <div className="flex gap-2">
                    <input 
                      type="text" 
                      value={dreamInputStr}
                      onChange={(e) => setDreamInputStr(e.target.value)}
                      onKeyDown={(e) => { if (e.key === "Enter") handleSendDreamToBriefingSystem(); }}
                      placeholder="Describe another dream or submit intelligence reports..."
                      className="flex-grow bg-[#0e0e0e] border border-[#524535]/40 rounded-lg px-4 py-3 text-xs text-[#e5e2e1] focus:outline-none focus:border-[#ffd7a9] transition-colors font-mono"
                    />
                    <button 
                      onClick={handleSendDreamToBriefingSystem}
                      className="bg-[#ffd7a9] text-[#462a00] p-3 rounded-lg hover:bg-[#ffb347] active:scale-90 transition-all shadow-md flex items-center justify-center cursor-pointer font-bold h-11 w-11"
                    >
                      <Send size={15} />
                    </button>
                  </div>
                </div>
              </motion.div>
            )}

          </AnimatePresence>
        </main>

        {/* FLOATING ACTION TAB BAR - BOTTOM PINNED */}
        <nav 
          id="custom_navbar"
          className="absolute bottom-0 left-0 w-full z-40 bg-[#03070f]/95 backdrop-blur-md border-t border-[#0d283c] shadow-[0_-4px_25px_rgba(0,203,255,0.12)] px-2 pb-6 pt-2 select-none h-20 flex justify-around items-center rounded-t-xl"
        >
          
          <button 
            onClick={() => { playSynthSound("tap"); setActiveTab("home"); }}
            className={`flex flex-col items-center justify-center w-16 h-12 rounded transition-all active:scale-90 duration-100 ${
              activeTab === "home" 
              ? "text-[#00cbff] bg-[#00cbff]/10 drop-shadow-[0_0_8px_rgba(0,203,255,0.35)] font-black" 
              : "text-zinc-500 hover:text-[#00cbff]"
            }`}
          >
            <HomeIcon size={18} />
            <span className="text-[8px] uppercase tracking-wider font-extrabold mt-1">Home</span>
          </button>

          <button 
            onClick={() => { playSynthSound("tap"); setActiveTab("investigate"); }}
            className={`flex flex-col items-center justify-center w-16 h-12 rounded transition-all active:scale-90 duration-100 ${
              activeTab === "investigate" 
              ? "text-[#00cbff] bg-[#00cbff]/10 drop-shadow-[0_0_8px_rgba(0,203,255,0.35)] font-black"
              : "text-zinc-500 hover:text-[#00cbff]"
            }`}
          >
            <Search size={18} />
            <span className="text-[8px] uppercase tracking-wider font-extrabold mt-1">Investigate</span>
          </button>

          {/* Core circular centerpiece tab trigger */}
          <button 
            onClick={() => { playSynthSound("tap"); setActiveTab("protocol"); }}
            className={`flex flex-col items-center justify-center w-16 h-12 rounded transition-all active:scale-90 duration-100 ${
              activeTab === "protocol" 
              ? "text-[#00cbff] bg-[#00cbff]/10 drop-shadow-[0_0_8px_rgba(0,203,255,0.35)] font-black"
              : "text-zinc-500 hover:text-[#00cbff]"
            }`}
          >
            <Activity size={18} />
            <span className="text-[8px] uppercase tracking-wider font-extrabold mt-1">Protocol</span>
          </button>

          <button 
            onClick={() => { playSynthSound("tap"); setActiveTab("shop"); }}
            className={`flex flex-col items-center justify-center w-16 h-12 rounded transition-all active:scale-90 duration-100 ${
              activeTab === "shop" 
              ? "text-[#00cbff] bg-[#00cbff]/10 drop-shadow-[0_0_8px_rgba(0,203,255,0.35)] font-black"
              : "text-zinc-500 hover:text-[#00cbff]"
            }`}
          >
            <ShoppingBag size={18} />
            <span className="text-[8px] uppercase tracking-wider font-extrabold mt-1">Shop</span>
          </button>

          <button 
            onClick={() => { playSynthSound("tap"); setActiveTab("agent"); }}
            className={`flex flex-col items-center justify-center w-16 h-12 rounded transition-all active:scale-90 duration-100 ${
              activeTab === "agent" 
              ? "text-[#00cbff] bg-[#00cbff]/10 drop-shadow-[0_0_8px_rgba(0,203,255,0.35)] font-black"
              : "text-zinc-500 hover:text-[#00cbff]"
            }`}
          >
            <UserIcon size={18} />
            <span className="text-[8px] uppercase tracking-wider font-extrabold mt-1">Agent</span>
          </button>

        </nav>

        {/* DIALOG 1: ADD HABIT CUSTOM PROTOCOL MODAL OVERLAY */}
        {showAddHabitModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-black/80 backdrop-blur-sm">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="bg-[#1c1b1b] border border-[#524535]/50 rounded-xl p-5 w-full max-w-[340px] space-y-4 shadow-2xl relative"
            >
              <h3 className="font-headline text-lg italic text-[#ffd7a9] uppercase tracking-wide border-b border-[#524535]/30 pb-2">
                New Tactical Directive
              </h3>

              <form onSubmit={handleAddCustomHabit} className="space-y-4 text-xs font-mono">
                <div className="space-y-1.5 text-[#d6c3b0]">
                  <label className="block text-[9px] uppercase tracking-wider">Directive Title / Description</label>
                  <input 
                    type="text" 
                    value={newHabitTitle}
                    onChange={(e) => setNewHabitTitle(e.target.value)}
                    placeholder="e.g. Draw weapon blueprints..."
                    className="w-full bg-black border border-[#524535]/40 rounded p-2.5 outline-none focus:border-[#ffd7a9] text-xs text-white"
                    required
                  />
                </div>

                <div className="space-y-1.5 text-gray-400">
                  <label className="block text-[9px] uppercase tracking-wider">Operational Sector Type</label>
                  <select 
                    value={newHabitType}
                    onChange={(e) => setNewHabitType(e.target.value as HabitType)}
                    className="w-full bg-black border border-white/10 rounded p-2.5 text-xs text-white"
                  >
                    <option value="intelligence">Sector I: Study Session</option>
                    <option value="exercise">Sector E: Exercise</option>
                    <option value="sleep">Sector S: Sleep</option>
                    <option value="mood">Sector M: Mood Reflection</option>
                  </select>
                </div>

                <div className="space-y-1.5 text-[#d6c3b0]">
                  <label className="block text-[9px] uppercase tracking-wider">Operational Difficulty (XP Reward)</label>
                  <div className="grid grid-cols-3 gap-1.5 pt-1">
                    {(["easy", "medium", "hard"] as const).map((diff) => (
                      <button
                        key={diff}
                        type="button"
                        onClick={() => { playSynthSound("tap"); setNewHabitDifficulty(diff); }}
                        className={`py-2 rounded border uppercase text-[8px] font-bold tracking-widest transition-all ${
                          newHabitDifficulty === diff
                            ? diff === "easy"
                              ? "bg-green-500/20 text-green-300 border-green-500 shadow-[0_0_10px_rgba(34,197,94,0.15)]"
                              : diff === "medium"
                              ? "bg-amber-500/20 text-amber-300 border-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.15)]"
                              : "bg-red-500/20 text-red-350 border-red-500 shadow-[0_0_10px_rgba(239,68,68,0.15)]"
                            : "bg-black border-white/5 text-gray-400 hover:text-white hover:border-white/10"
                        }`}
                      >
                        {diff}
                        <span className="block text-[7px] text-zinc-500 mt-0.5 font-normal whitespace-nowrap">
                          {diff === "easy" ? "+10 XP" : diff === "medium" ? "+20 XP" : "+40 XP"}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex gap-2 pt-2 text-[10px]">
                  <button 
                    type="button"
                    onClick={() => { playSynthSound("tap"); setShowAddHabitModal(false); }}
                    className="flex-1 border border-[#524535]/40 py-2.5 text-[#d6c3b0] rounded uppercase hover:bg-[#2a2a2a]"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit"
                    className="flex-1 bg-blue-600 text-white py-2.5 rounded-xl font-bold uppercase hover:bg-blue-500 transition-colors shadow-[0_0_15px_rgba(59,130,246,0.3)]"
                  >
                    Deploy Directive
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}

        {/* DIALOG 2: IMMERSIVE SETTINGS PANEL */}
        {showSettings && (
          <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-black/85 backdrop-blur-md">
            <motion.div 
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-[#1c1b1b] border border-[#ffd7a9]/30 rounded-xl p-6 w-full max-w-[340px] space-y-5"
            >
              <div className="border-b border-[#524535]/30 pb-3 flex justify-between items-center text-[#ffd7a9]">
                <h4 className="font-headline text-lg italic tracking-tight font-bold">Terminal Configurations</h4>
                <Compass size={18} className="animate-spin text-[#ffb347]" />
              </div>

              <div className="space-y-4 text-xs font-mono">
                <div className="space-y-1.5 text-[#d6c3b0]">
                  <label className="block text-[9px] uppercase tracking-widest font-bold">Edit Codename</label>
                  <input 
                    type="text" 
                    value={codename}
                    onChange={(e) => setCodename(e.target.value)}
                    className="w-full bg-black border border-[#524535]/30 rounded p-2 text-xs text-white"
                  />
                </div>

                <div className="p-3 bg-[#0e0e0e] rounded text-[10px] text-[#d6c3b0]/70 space-y-1 leading-snug">
                  <p className="font-bold text-[#ffd7a9] uppercase text-[9px] tracking-wider mb-1">Satellite Diagnostics</p>
                  <p>Database: {firebaseActive ? "⚡ Connected Cloud Run" : "Offline Sandbox Fallback"}</p>
                  <p>Infiltration Level: S-RANK ELITE</p>
                  <p>Protocol Code: STOLEN_CASE_7</p>
                  <p className="italic text-[#ffd7a9]/50 mt-1">Unauthorized sandbox modification restricted under agency laws.</p>
                </div>

                <div className="grid grid-cols-2 gap-2 text-[10px]">
                  <button 
                    onClick={() => {
                      playSynthSound("tap");
                      setCredits(1240);
                      setXp(4500);
                      setThreatLevel(15);
                      setInvestigations({
                        light_fixture: 0,
                        server_rack: 0,
                        keyboard: 0,
                        document: 0,
                        drawer: 0
                      });
                      addToast("Telemetry counts reset successfully.", "warn");
                    }}
                    className="border border-red-500/20 py-2.5 rounded text-red-300 uppercase hover:bg-red-950/20"
                  >
                    Reset System
                  </button>
                  <button 
                    onClick={() => { playSynthSound("tap"); setShowSettings(false); }}
                    className="bg-[#ffd7a9] text-[#462a00] py-2.5 rounded font-bold uppercase hover:bg-[#ffb347]"
                  >
                    Save & Exit
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}

        {/* ENEMY ARRIVAL ANIMATION OVERLAY */}
        <AnimatePresence>
          {arrivingEnemy && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-[#02050b]/98 backdrop-blur-md z-[100] flex flex-col items-center justify-center font-mono text-white p-6"
            >
              {/* Animated matrix streams / grid in bg */}
              <div className="absolute inset-0 bg-[linear-gradient(rgba(239,68,68,0.05)_1px,transparent_1px)] bg-[size:100%_12px] pointer-events-none animate-pulse"></div>

              {/* Hazard warning borders */}
              <div className="absolute top-0 inset-x-0 h-6 bg-gradient-to-r from-red-600 via-amber-500 to-red-600 flex text-[9px] font-black items-center justify-around overflow-hidden select-none whitespace-nowrap tracking-widest text-black">
                <span className="w-full text-center">☣️ WARNING: INVESTIGATION SABOTAGE EN ROUTE // SYNDICATE THREAT INTERFERENCE ☣️</span>
              </div>
              <div className="absolute bottom-0 inset-x-0 h-6 bg-gradient-to-r from-red-600 via-amber-500 to-red-600 flex text-[9px] font-black items-center justify-around overflow-hidden select-none whitespace-nowrap tracking-widest text-black">
                <span className="w-full text-center">☣️ CRITICAL: CASE TRACE INITIATED // ESCALATING THREAT LEVEL RESOLUTION ☣️</span>
              </div>

              <div className="space-y-6 text-center max-w-sm relative z-10 px-4">
                <div className="relative inline-block mx-auto">
                  <span className="absolute inset-0 blur-xl bg-red-600/30 rounded-full animate-ping"></span>
                  <div className="relative w-28 h-28 rounded-full border-2 border-red-500 flex items-center justify-center bg-black/90 shadow-[0_0_20px_rgba(239,68,68,0.5)] mx-auto">
                    {/* The actual icon of arriving enemy inside */}
                    <span className="text-4xl select-none animate-bounce">
                      {arrivingEnemy.enemyId === "agent_pur" ? "🐱" : arrivingEnemy.enemyId === "beak_storm" ? "🦉" : arrivingEnemy.enemyId === "mr_mustela" ? "🦦" : "🐍"}
                    </span>
                  </div>
                </div>

                <div className="space-y-2 uppercase">
                  <h2 className="text-[10px] font-black tracking-[0.25em] text-red-500 animate-pulse">
                    [ DIRECT INTRUSION DETECTED ]
                  </h2>
                  <h1 className="text-4xl font-black tracking-tight text-white drop-shadow-[0_0_10px_rgba(239,68,68,0.4)]">
                    {arrivingEnemy.name}
                  </h1>
                  <p className="text-zinc-400 text-[10px] tracking-wide max-w-xs mx-auto leading-relaxed normal-case">
                    Decryption channels compromised. Hostile rival has bypass-synced with clover nodes and deployed active investigation sabotage!
                  </p>
                </div>

                <div className="p-3 bg-red-950/25 border border-red-500/30 rounded-xl max-w-xs mx-auto space-y-1.5 shadow-[inset_0_0_12px_rgba(239,68,68,0.1)]">
                  <div className="flex justify-between text-[8px] text-red-400 font-bold tracking-widest uppercase">
                    <span>HACK RATE:</span>
                    <span>INJECTING STRIKE PROTOCOL...</span>
                  </div>
                  <div className="h-2 w-full bg-zinc-950 rounded overflow-hidden p-[0.5px] border border-red-500/25">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: "100%" }}
                      transition={{ duration: 2.8, ease: "linear" }}
                      className="h-full bg-gradient-to-r from-red-600 to-amber-500 rounded-sm"
                    />
                  </div>
                </div>

                <div className="text-[9px] text-zinc-500 tracking-wider animate-pulse font-extrabold uppercase">
                  DEPLOYING ACTIVE INTRUSION MALWARE...
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* COMBAT SYSTEM INTERRUPT OVERLAY */}
        <AnimatePresence>
          {activeEncounter && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/95 z-50 flex flex-col justify-between p-6 select-none overflow-auto font-mono text-white"
            >
              {/* Pulsing hazard border overlay */}
              <div className="fixed inset-0 pointer-events-none border-4 border-red-650 animate-pulse opacity-60 z-30"></div>

              {/* Warning Header */}
              <div className="text-center pt-2 space-y-1 z-35 relative">
                <div className="flex justify-center items-center gap-2">
                  <span className="w-2.5 h-2.5 bg-red-600 rounded-full animate-ping"></span>
                  <span className="text-[10px] uppercase tracking-[0.25em] font-extrabold text-red-550 animate-pulse">
                    ☣️ INTRUSION WARNING: CRITICAL MALWARE INTRUSION ☣️
                  </span>
                  <span className="w-2.5 h-2.5 bg-red-600 rounded-full animate-ping"></span>
                </div>
                <h1 className="text-xs text-zinc-400 font-bold uppercase tracking-wider">
                  Cyber Interference Breach Detected by Rival Syndicate
                </h1>
                <p className="text-[9px] text-zinc-500 max-w-xs mx-auto leading-normal">
                  The active investigative sandbox channel has been compromised! Neutralize the hostile agent immediately to safeguard decryption codes!
                </p>
              </div>

              {/* Enemy Threat Sprite Hologram Frame */}
              <div className="my-auto flex flex-col items-center justify-center relative z-25 py-4">
                <div className={`relative w-[220px] h-[220px] rounded-2xl border-2 ${
                  isCombatFlashing ? "bg-red-500/20 border-red-500" : "bg-zinc-950/80 border-red-600/35"
                } shadow-[0_0_30px_rgba(220,38,38,0.25)] flex items-center justify-center overflow-hidden cursor-pointer transition-all active:scale-95 group`}
                  onClick={handleTapEnemy}
                >
                  {/* Neon screen grid lines scanner */}
                  <div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[size:100%_4px,6px_100%] pointer-events-none"></div>
                  
                  {/* Pulsing lock glow */}
                  <div className="absolute inset-0 bg-red-950/10 pointer-events-none group-hover:bg-red-950/20 transition-all"></div>

                  {/* Enemy image */}
                  <img 
                    src={`/src/assets/images/enemy_${activeEncounter.enemyId === "agent_pur" ? "pur" : activeEncounter.enemyId === "beak_storm" ? "beak" : activeEncounter.enemyId === "mr_mustela" ? "mustela" : "fang"}.png`}
                    alt={activeEncounter.name}
                    className={`w-[185px] h-[185px] object-contain transition-transform duration-75 ${
                      isCombatFlashing ? "scale-105 brightness-150 rotate-2" : "group-hover:scale-102"
                    }`}
                    referrerPolicy="no-referrer"
                    onError={(e) => {
                      e.currentTarget.style.display = "none";
                    }}
                  />

                  {/* Fallback visual indicator */}
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none font-bold select-none p-4 text-center">
                    <span className="text-[10px] text-red-500/30 uppercase font-headline">Threat Entity</span>
                    <span className="text-zinc-600 text-xs hidden uppercase font-mono group-hover:inline-block">Click Core</span>
                  </div>

                  {/* Damage & decryptions Floating numbers rendering */}
                  <AnimatePresence>
                    {floatingEffects.map((eff) => (
                      <motion.div
                        key={eff.id}
                        initial={{ opacity: 1, scale: 0.8, y: 15 }}
                        animate={{ opacity: 0, scale: 1.3, y: eff.y - 45, x: eff.x }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.8, ease: "easeOut" }}
                        className="absolute text-center drop-shadow-[0_0_6px_rgba(220,38,38,0.8)] font-extrabold text-[13px] text-red-400 z-45 pointer-events-none"
                      >
                        {eff.text}
                      </motion.div>
                    ))}
                  </AnimatePresence>

                  {/* Rapid glitch flicker warning element */}
                  {isCombatFlashing && (
                    <div className="absolute inset-0 bg-red-600/30 z-35 mix-blend-color-dodge pointer-events-none animate-ping"></div>
                  )}
                </div>

                {/* Threat HP Gauge Slider */}
                <div className="w-full max-w-[280px] mt-6 space-y-1.5 text-center px-4">
                  <div className="flex justify-between items-center text-[10px] font-bold">
                    <span className="text-red-400 font-bold uppercase tracking-widest text-[9px] flex items-center gap-1">
                      💀 {activeEncounter.name.toUpperCase()}
                      {activeEncounter.enemyId === "poison_fang" && (
                        <span className="text-yellow-550 animate-pulse text-[8px] border border-yellow-500/30 px-1 rounded">
                          PHASE {activeEncounter.phase || 1}/3
                        </span>
                      )}
                    </span>
                    <span className="text-zinc-300 font-mono text-[9px]">
                      {activeEncounter.hp} / {activeEncounter.maxHp} HP
                    </span>
                  </div>

                  <div className="h-2.5 w-full bg-zinc-950 rounded-full overflow-hidden border border-red-500/20 shadow-inner relative flex">
                    <motion.div 
                      className="h-full bg-gradient-to-r from-red-650 via-red-550 to-red-450 rounded-full"
                      style={{ width: `${(activeEncounter.hp / activeEncounter.maxHp) * 100}%` }}
                      animate={{ scaleX: 1 }}
                      transition={{ type: "spring", stiffness: 80 }}
                    ></motion.div>
                    
                    {/* Tick line details on energy grid bar */}
                    <div className="absolute inset-x-0 inset-y-0 opacity-10 bg-[linear-gradient(to_right,#000_1px,transparent_1px)] bg-[size:10%_100%] pointer-events-none"></div>
                  </div>

                  {activeEncounter.enemyId === "poison_fang" && (
                    <p className="text-[8px] text-yellow-500/80 animate-pulse mt-1 leading-normal">
                      ⚠️ Cobra deploys counter-means! Slower taps trigger instant damage (+3% Threat Level & -2s Limit)! Keep up high frequency taps!
                    </p>
                  )}
                </div>
              </div>

              {/* Action Interactive Bottom Controls */}
              <div className="text-center space-y-3 pb-2 relative z-35">
                <div className="space-y-0.5">
                  <div className="text-[15px] font-extrabold text-red-500 animate-pulse tracking-wide uppercase">
                    💥 DISRUPT LINK: TAP ENEMY SPRITE!
                  </div>
                  <div className="text-[10px] text-zinc-400">
                    Hostile link synchronization sequence timing:
                  </div>
                </div>

                {/* Massive digital countdown */}
                <div className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-red-950/20 border border-red-600/30 rounded-lg max-w-xs mx-auto text-red-500 shadow-md">
                  <AlertCircle size={15} className="animate-spin" />
                  <span className="text-sm font-black tracking-wider font-mono">
                    {activeEncounter.timer}s SECURITY EXPIRATION!
                  </span>
                </div>

                <div className="text-[8px] text-zinc-500 leading-normal max-w-xs mx-auto">
                  *Failure will increase Threat Level (+20%) and decay system analysis meters! Neutralization awards major XP, S-Rank completions and items clearance credits!
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {isProfileOpen && (
            <AgentProfilePanel
              isOpen={isProfileOpen}
              onClose={() => setIsProfileOpen(false)}
              codename={codename}
              rank={agentRank}
              level={agentLevel}
              xp={xp}
              xpProgressPct={xpProgressPct}
              credits={credits}
              threatLevel={threatLevel}
              investigations={investigations}
              investigationLevel={investigationLevel}
              completedCasesCount={casePoints >= 50 ? Math.floor(casePoints / 50) : 0}
              defeatedLvl1Boss={defeatedLvl1Boss}
              defeatedFinalBoss={defeatedFinalBoss}
              purchasedItemIds={purchasedItemIds}
              equippedItemIds={equippedItemIds}
              initialShopItems={initialShopItems}
              onTriggerBadgeUnlock={(lvlNum) => {
                setActiveBadgeUnlock(lvlNum);
              }}
              onRenameCodename={(newName) => {
                setCodename(newName);
              }}
            />
          )}
        </AnimatePresence>

        <AnimatePresence>
          {activeBadgeUnlock !== null && (
            <BadgeUnlockPopup
              level={activeBadgeUnlock}
              onClose={() => {
                playSynthSound("complete");
                setActiveBadgeUnlock(null);
              }}
            />
          )}
        </AnimatePresence>

        {/* Level Up Debug Popup Overlay */}
        <AnimatePresence>
          {debugLevelUpPopup && debugLevelUpPopup.show && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/90 backdrop-blur-md z-50 flex items-center justify-center p-4"
              onClick={() => setDebugLevelUpPopup(null)}
            >
              <motion.div
                initial={{ scale: 0.9, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.9, y: 20 }}
                className="w-full max-w-xs bg-[#030a16] border-2 border-[#00cbff] rounded-2xl p-6 relative overflow-hidden select-none text-center shadow-[0_0_40px_rgba(0,203,255,0.25)]"
                onClick={(e) => e.stopPropagation()}
              >
                {/* Cyber backdrop grid and top warning scanline lines */}
                <div className="absolute inset-0 bg-[linear-gradient(rgba(0,203,255,0.04)_1px,transparent_1px),linear-gradient(90deg,rgba(0,203,255,0.04)_1px,transparent_1px)] bg-[size:16px_16px] pointer-events-none"></div>
                <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-[#00cbff] to-transparent opacity-80 animate-pulse"></div>

                <div className="relative z-10 space-y-5">
                  <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-[#00cbff]/10 border border-[#00cbff]/30 text-[#00cbff] drop-shadow-[0_0_12px_rgba(0,203,255,0.3)]">
                    <Sparkles size={24} className="animate-spin-slow" />
                  </div>

                  <div className="space-y-1">
                    <h2 className="font-headline text-2xl font-black text-[#00cbff] tracking-[0.15em] uppercase drop-shadow-[0_0_8px_rgba(0,203,255,0.5)]">
                      LEVEL UP
                    </h2>
                    <p className="font-mono text-[8px] tracking-[0.2em] text-[#00cbff]/55 uppercase">
                      SYSTEM DATA OVERRIDE GRANTED
                    </p>
                  </div>

                  <div className="bg-[#051125] border border-[#00cbff]/15 rounded-xl p-3.5 space-y-2 font-mono">
                    <p className="text-zinc-400 text-[9px] uppercase tracking-wider">
                      You advanced to Level {debugLevelUpPopup.newLevel}
                    </p>
                    <div className="h-[1px] bg-[#00cbff]/10 my-1"></div>
                    <p className="text-[8px] text-[#00cbff]/50 uppercase tracking-widest">
                      New Rank Assigned
                    </p>
                    <p className="text-sm font-extrabold text-yellow-400 tracking-wide">
                      {debugLevelUpPopup.newRank}
                    </p>
                  </div>

                  <button
                    onClick={() => {
                      playSynthSound("complete");
                      setDebugLevelUpPopup(null);
                    }}
                    className="w-full bg-[#00cbff] hover:bg-[#00cbff]/90 text-black font-mono font-black text-[10px] uppercase tracking-widest py-2.5 rounded-lg active:scale-95 transition-all shadow-[0_0_10px_rgba(0,203,255,0.2)]"
                  >
                    DEPLOY PROGRESSION
                  </button>

                  <p className="text-[7.5px] font-mono text-zinc-500 uppercase tracking-widest">
                    Authorized Terminal Protocol
                  </p>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* CASE RESOLVED / VICTORY OVERLAY */}
        <AnimatePresence>
          {isCaseSolvedOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/95 backdrop-blur-lg z-50 flex items-center justify-center p-4 select-none"
            >
              <motion.div
                initial={{ scale: 0.9, y: 30 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.9, y: 30 }}
                className="w-full max-w-sm bg-[#020d1c] border-2 border-[#10b981] rounded-2xl p-6 relative overflow-hidden text-center shadow-[0_0_50px_rgba(16,185,129,0.25)]"
              >
                {/* Visual tech styling backdrops */}
                <div className="absolute inset-0 bg-[linear-gradient(rgba(16,185,129,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(16,185,129,0.03)_1px,transparent_1px)] bg-[size:16px_16px] pointer-events-none"></div>
                <div className="absolute inset-x-0 top-0 h-[2px] bg-[#10b981] opacity-75"></div>

                <div className="space-y-5 relative z-10">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-[#10b981]/10 border border-[#10b981]/30 text-[#10b981] shadow-[0_0_20px_rgba(16,185,129,0.25)]">
                    <ShieldCheck size={32} className="animate-pulse" />
                  </div>

                  <div className="space-y-1">
                    <h2 className="font-headline text-xl font-black text-[#10b981] tracking-[0.1em] uppercase">
                      CASE SECURED
                    </h2>
                    <p className="font-mono text-[9px] tracking-widest text-[#10b981]/60 uppercase">
                      COGNITIVE GRID CLEAR / PLAYER ADVANTAGE
                    </p>
                  </div>

                  <div className="bg-[#05162a] border border-[#10b981]/15 rounded-xl p-4 text-left space-y-2.5 font-mono text-[11px]">
                    <div className="flex justify-between items-center text-zinc-400">
                      <span>INVESTIGATION STATUS</span>
                      <span className="text-[#10b981] font-bold">100% COMPLETE</span>
                    </div>
                    <div className="h-[1px] bg-zinc-900/40"></div>
                    <div className="flex justify-between items-center text-zinc-400">
                      <span>RIVAL ACCESS PROGRESS</span>
                      <span className="text-red-500 font-bold">{rivalProgress}%</span>
                    </div>
                    <div className="h-[1px] bg-zinc-900/40"></div>
                    <div className="flex justify-between items-center text-zinc-400">
                      <span>CREDITS EARNED</span>
                      <span className="text-yellow-400 font-bold">+250 CR</span>
                    </div>
                    <div className="h-[1px] bg-zinc-900/40"></div>
                    <div className="flex justify-between items-center text-zinc-400">
                      <span>COGNITIVE REWARD</span>
                      <span className="text-indigo-400 font-bold">+50 XP</span>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      playSynthSound("complete");
                      setCredits((c) => c + 250);
                      setXp((x) => x + 50);
                      
                      // Turn advances or level ups
                      if (investigationLevel === 1) {
                        setDefeatedLvl1Boss(true);
                        setInvestigationLevel(2);
                        addToast("🔓 Level 2 unlocked! Advancing investigation...", "success");
                      } else if (investigationLevel === 2) {
                        setDefeatedLvl2Boss(true);
                        setInvestigationLevel(3);
                        addToast("🔓 Level 3 unlocked! Advancing final investigations...", "success");
                      } else {
                        setDefeatedFinalBoss(true);
                        addToast("🏆 CONGRATULATIONS! ALL GRID CASE INVESTIGATIONS FULLY SOLVED!", "success");
                      }
                      
                      // Reset rivalry state parameters for the next active level
                      setPlayerProgress(0);
                      setRivalProgress(15);
                      localStorage.setItem("agent_rivalry_player_progress", "0");
                      localStorage.setItem("agent_rivalry_rival_progress", "15");
                      setIsCaseSolvedOpen(false);
                    }}
                    className="w-full bg-[#10b981] hover:bg-[#059669] text-black font-mono font-black text-xs uppercase tracking-widest py-3 rounded-xl active:scale-95 transition-all shadow-[0_0_15px_rgba(16,185,129,0.3)]"
                  >
                    ADVANCE INVESTIGATION
                  </button>

                  <p className="text-[8px] font-mono text-zinc-500 uppercase tracking-widest text-center">
                    CLASSIFIED LEVEL CLEARANCE PERMITTED
                  </p>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* CASE STOLEN / DEFEAT OVERLAY */}
        <AnimatePresence>
          {isCaseStolenOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/95 backdrop-blur-lg z-50 flex items-center justify-center p-4 select-none"
            >
              <motion.div
                initial={{ scale: 0.9, y: 30 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.9, y: 30 }}
                className="w-full max-w-sm bg-[#160303] border-2 border-[#ef4444] rounded-2xl p-6 relative overflow-hidden text-center shadow-[0_0_50px_rgba(239,68,68,0.3)]"
              >
                {/* Visual tech styling backdrops */}
                <div className="absolute inset-0 bg-[linear-gradient(rgba(239,68,68,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(239,68,68,0.03)_1px,transparent_1px)] bg-[size:16px_16px] pointer-events-none"></div>
                <div className="absolute inset-x-0 top-0 h-[2px] bg-[#ef4444] opacity-75"></div>

                <div className="space-y-5 relative z-10">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-[#ef4444]/10 border border-[#ef4444]/30 text-[#ef4444] shadow-[0_0_20px_rgba(239,68,68,0.25)]">
                    <ShieldAlert size={32} className="animate-bounce" />
                  </div>

                  <div className="space-y-1">
                    <h2 className="font-headline text-xl font-black text-[#ef4444] tracking-[0.1em] uppercase">
                      CASE COMPROMISED
                    </h2>
                    <p className="font-mono text-[9px] tracking-widest text-[#ef4444]/60 uppercase">
                      GRID HIJACK / RIVAL SECURED OVERRIDE
                    </p>
                  </div>

                  <div className="bg-[#240a0a] border border-[#ef4444]/15 rounded-xl p-4 text-left space-y-2.5 font-mono text-[11px]">
                    <div className="flex justify-between items-center text-zinc-400">
                      <span>RIVAL CONTROL STATUS</span>
                      <span className="text-[#ef4444] font-bold">100% HIJACKED</span>
                    </div>
                    <div className="h-[1px] bg-zinc-900/40"></div>
                    <div className="flex justify-between items-center text-zinc-400">
                      <span>PLAYER INVESTIGATION PROGRESS</span>
                      <span className="text-blue-400 font-bold">{playerProgress}%</span>
                    </div>
                    <div className="h-[1px] bg-zinc-900/40"></div>
                    <div className="flex justify-between items-center text-zinc-400">
                      <span>SYSTEM PENALTY</span>
                      <span className="text-yellow-500 font-bold">GRID BACKUP RECOVERY REQUIRED</span>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      restartCurrentLevel();
                    }}
                    className="w-full bg-[#ef4444] hover:bg-[#dc2626] text-white font-mono font-black text-xs uppercase tracking-widest py-3 rounded-xl active:scale-95 transition-all shadow-[0_0_15px_rgba(239,68,68,0.3)]"
                  >
                    🔄 RE-INITIALIZE CASE PARAMETERS
                  </button>

                  <p className="text-[8px] font-mono text-zinc-500 uppercase tracking-widest text-center">
                    SECURITY GRID BACKUP PROTOCOLS ENGAGED
                  </p>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

      </div>
    </div>
  );
}
