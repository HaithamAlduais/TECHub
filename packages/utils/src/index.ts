// ============================================
// TECHub Shared Utilities
// ============================================

import type { LevelName } from "@techub/types";

// --- XP & Leveling ---
export const LEVEL_THRESHOLDS: Record<LevelName, number> = {
  Trainee: 0,
  Junior: 500,
  Mid: 2000,
  Senior: 5000,
  Principal: 12000,
  Legend: 25000,
};

export function getLevelFromXP(xp: number): LevelName {
  const levels = Object.entries(LEVEL_THRESHOLDS).reverse() as [
    LevelName,
    number,
  ][];
  for (const [level, threshold] of levels) {
    if (xp >= threshold) return level;
  }
  return "Trainee";
}

export function getXPForNextLevel(xp: number): {
  currentLevel: LevelName;
  nextLevel: LevelName | null;
  xpNeeded: number;
  progress: number;
} {
  const currentLevel = getLevelFromXP(xp);
  const levels = Object.keys(LEVEL_THRESHOLDS) as LevelName[];
  const currentIndex = levels.indexOf(currentLevel);
  const nextLevel = levels[currentIndex + 1] ?? null;

  if (!nextLevel) {
    return { currentLevel, nextLevel: null, xpNeeded: 0, progress: 100 };
  }

  const currentThreshold = LEVEL_THRESHOLDS[currentLevel];
  const nextThreshold = LEVEL_THRESHOLDS[nextLevel];
  const xpNeeded = nextThreshold - xp;
  const progress =
    ((xp - currentThreshold) / (nextThreshold - currentThreshold)) * 100;

  return { currentLevel, nextLevel, xpNeeded, progress };
}

// --- XP Event Values ---
export const XP_VALUES = {
  connect_platform: 50,
  verify_skill: 20,
  complete_node: 150,
  apply_opportunity: 10,
  get_interview: 50,
  get_hired: 500,
  daily_quest: 30,
} as const;

// --- Token Packages ---
export const TOKEN_PACKAGES = [
  { tokens: 50, price_sar: 15, label: "Starter" },
  { tokens: 150, price_sar: 35, label: "Pro" },
  { tokens: 500, price_sar: 99, label: "Power" },
  { tokens: 2000, price_sar: 299, label: "Enterprise" },
] as const;

export const DAILY_FREE_TOKENS = 10;

// --- Skill Scoring Weights ---
export const SKILL_WEIGHTS = {
  hackerrank: 0.4,
  github: 0.35,
  credly: 0.15,
  community: 0.1,
} as const;
