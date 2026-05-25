export const XP_DAILY = 10;
export const XP_WEEKLY = 15;
export const XP_PER_REP = 5; // each rep of a 'multiple' habit

export const XP_ABILITY_DAILY = 10;
export const XP_ABILITY_WEEKLY = 20;
export const XP_ABILITY_PER_REP = 5;
export const ABILITY_MAX_LEVEL = 20;

// XP needed to advance from `level` to `level + 1`
export function xpForLevelUp(level: number): number {
  return Math.round(30 * Math.pow(1.15, level - 1));
}

export type LevelInfo = {
  level: number;
  currentXp: number;
  nextLevelXp: number;
};

export function getLevelInfo(totalXp: number): LevelInfo {
  let level = 1;
  let remaining = Math.max(0, totalXp);
  while (remaining >= xpForLevelUp(level)) {
    remaining -= xpForLevelUp(level);
    level++;
  }
  return { level, currentXp: remaining, nextLevelXp: xpForLevelUp(level) };
}

// Ability leveling: max level 20, threshold grows ~25% per level
// Total XP to reach level 20 ≈ 5700 (≈1.5 years of daily habits)
export function abilityXpForLevel(level: number): number {
  return Math.round(30 * Math.pow(1.25, level - 1));
}

export type AbilityLevelInfo = {
  level: number;
  currentXp: number;
  nextLevelXp: number;
};

// Returns the cumulative XP needed to reach `targetLevel` from level 1
export function totalXpForAbilityLevel(targetLevel: number): number {
  let total = 0;
  for (let l = 1; l < targetLevel; l++) {
    total += abilityXpForLevel(l);
  }
  return total;
}

export function getAbilityLevelInfo(totalXp: number): AbilityLevelInfo {
  let level = 1;
  let remaining = Math.max(0, totalXp);
  while (level < ABILITY_MAX_LEVEL && remaining >= abilityXpForLevel(level)) {
    remaining -= abilityXpForLevel(level);
    level++;
  }
  if (level >= ABILITY_MAX_LEVEL) {
    return { level: ABILITY_MAX_LEVEL, currentXp: 0, nextLevelXp: 0 };
  }
  return { level, currentXp: remaining, nextLevelXp: abilityXpForLevel(level) };
}
