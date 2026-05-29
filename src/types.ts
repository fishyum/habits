export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  energy: number;
  credits: number;
  xp: number;
  updatedAt?: string;
}

export type HabitType = "sleep" | "exercise" | "intelligence" | "mood" | "creativity";

export interface Habit {
  id: string;
  userId: string;
  title: string;
  type: HabitType;
  completed: boolean;
  currentValue: string;
  energyReward: number;
  difficulty?: "easy" | "medium" | "hard";
  updatedAt?: string;
}

export type MarkerId = 
  | "light_fixture" | "server_rack" | "keyboard" | "document" | "drawer"
  | "lvl2_typewriter" | "lvl2_lantern" | "lvl2_window" | "lvl2_fireplace" | "lvl2_chest"
  | "lvl3_mainframe" | "lvl3_terminal" | "lvl3_console" | "lvl3_datadrive" | "lvl3_monitor" | "lvl3_firewall" | "lvl3_crate";

export interface Investigation {
  id: string;
  userId: string;
  markerId: MarkerId;
  searchedCount: number;
  maxCount: number;
  updatedAt?: string;
}

export interface Purchase {
  id: string;
  userId: string;
  itemId: string;
  purchasedAt: string;
}

export interface ChatMessage {
  id: string;
  userId: string;
  sender: "user" | "ai";
  content: string;
  rating?: number; // 0-5 stars
  createdAt: string;
}

export interface ShopItem {
  id: string;
  title: string;
  cost: number;
  description: string;
  category: "coats" | "goggles" | "tails" | "hats" | "utility" | "rewards";
  imageUrl?: string;
  icon?: string;
  locked: boolean;
  clearanceLevel?: number;
  unlockedByBoss?: boolean;
}
