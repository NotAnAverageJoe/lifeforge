export const XP_DAILY = 100;
export const XP_WEEKLY = 200;
export const XP_PER_REP = 50;

export const XP_ABILITY_DAILY = 60;
export const XP_ABILITY_WEEKLY = 120;
export const XP_ABILITY_PER_REP = 30;

// D&D 5E cumulative XP thresholds. Index = level - 1, so index 0 = level 1 at 0 XP.
const LEVEL_THRESHOLDS = [
       0,    300,    900,   2_700,   6_500,
  14_000, 23_000, 34_000,  48_000,  64_000,
  85_000,100_000,120_000, 140_000, 165_000,
 195_000,225_000,265_000, 305_000, 355_000,
] as const;

// Same D&D 5E curve at 1/5 scale — governs individual ability scores.
// Reaching ability level 10 requires ~7 months of daily linked habits;
// level 20 is a multi-year achievement.
const ABILITY_THRESHOLDS: readonly number[] = LEVEL_THRESHOLDS.map(t => Math.round(t / 5));

export const MAX_CHARACTER_LEVEL = LEVEL_THRESHOLDS.length; // 20
export const ABILITY_MAX_LEVEL = ABILITY_THRESHOLDS.length; // 20

export type LevelInfo = { level: number; currentXp: number; nextLevelXp: number };
export type AbilityLevelInfo = LevelInfo;

function levelFromThresholds(totalXp: number, thresholds: readonly number[]): LevelInfo {
  const xp = Math.max(0, totalXp);
  const max = thresholds.length;
  let level = 1;
  for (let i = 1; i < max; i++) {
    if (xp >= thresholds[i]) level = i + 1;
    else break;
  }
  if (level >= max) {
    return { level: max, currentXp: xp - thresholds[max - 1], nextLevelXp: 0 };
  }
  return {
    level,
    currentXp: xp - thresholds[level - 1],
    nextLevelXp: thresholds[level] - thresholds[level - 1],
  };
}

export function getLevelInfo(totalXp: number): LevelInfo {
  return levelFromThresholds(totalXp, LEVEL_THRESHOLDS);
}

export function getAbilityLevelInfo(totalXp: number): AbilityLevelInfo {
  return levelFromThresholds(totalXp, ABILITY_THRESHOLDS);
}

// Cumulative XP needed to be at `targetLevel` (used to seed ability XP from onboarding scores).
export function totalXpForAbilityLevel(targetLevel: number): number {
  const idx = Math.min(Math.max(targetLevel - 1, 0), ABILITY_THRESHOLDS.length - 1);
  return ABILITY_THRESHOLDS[idx];
}

// XP required to advance from `level` to `level + 1` (character system).
export function xpForLevelUp(level: number): number {
  if (level >= MAX_CHARACTER_LEVEL) return 0;
  return LEVEL_THRESHOLDS[level] - LEVEL_THRESHOLDS[level - 1];
}
