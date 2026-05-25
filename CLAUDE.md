# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Expo Docs

**Always read the exact versioned Expo docs before writing any Expo-related code:**
https://docs.expo.dev/versions/v56.0.0/

## Commands

```bash
# Start dev server (opens QR code for Expo Go)
npx expo start

# Type-check (no test suite configured)
npx tsc --noEmit
```

## Architecture

**Entry point**: `index.ts` → `App.tsx`. App.tsx wires up the provider tree, navigation, and the onboarding gate — it contains no screen logic.

**Provider tree** (outermost → innermost):
```
SafeAreaProvider → AppProvider → AppShell
```
`AppShell` reads `state.isLoaded` and `state.character`: renders a blank view while loading, `OnboardingFlow` if `character === null`, or the main `NavigationContainer` otherwise.

**Navigation**: Two-level React Navigation setup.
- Root stack: `MainTabs` (bottom tab) + `HabitForm` (modal) + `AbilityDetail`
- Tab stack: `Quests` (TodayScreen) | `Chronicle` (CalendarScreen) | `Hero` (ProfileScreen)

**State management** (`src/store.tsx`): Single `useReducer`-based context (`AppContext`) exposed via `useAppStore()`. All mutations go through typed `Action` discriminated union. Persisted to AsyncStorage under key `app_data_v2` (JSON: `{ habits, totalXp, character }`). Legacy `habits_v1` key and old `startDay` field are migrated on first load.

**Core data types** (`src/types.ts`):
- `Habit` — `completions: Record<string, number>` maps `YYYY-MM-DD` → completion count. `frequency` is `'daily' | 'weekly' | 'multiple'`. Weekly habits use `scheduledDays: number[]` (1=Sun … 7=Sat, multiple days supported). `linkedAbility` optionally links a habit to one of the six abilities.
- `Character` — `name`, `birthday`, `gender`, `abilities: AbilityScores` (six scores 1–5), `characterClass`, `abilityXp: Partial<Record<keyof AbilityScores, number>>` (cumulative XP per ability).
- `AppState` — `habits[]`, `totalXp`, `pendingLevelUp`, `character | null`, `isLoaded`.

**XP system** (`src/xp.ts`):
- *Character XP*: `XP_DAILY=10`, `XP_WEEKLY=15`, `XP_PER_REP=5`. Level thresholds grow via `30 * 1.15^(level-1)`. `getLevelInfo(totalXp)` returns `{ level, currentXp, nextLevelXp }`. Level-up detection in `TOGGLE_COMPLETION` sets `pendingLevelUp`, which triggers `LevelUpModal`.
- *Ability XP*: `XP_ABILITY_DAILY=10`, `XP_ABILITY_WEEKLY=20`, `XP_ABILITY_PER_REP=5`. Ability levels cap at 20; threshold grows via `30 * 1.25^(level-1)`. `getAbilityLevelInfo(totalXp)` returns level info. `totalXpForAbilityLevel(n)` returns cumulative XP to reach level n (used to seed ability XP from onboarding scores).
- Both character XP and linked ability XP are awarded/deducted together inside `TOGGLE_COMPLETION`.

**Date helpers** (`src/dates.ts`): All dates are `YYYY-MM-DD` strings. `todayKey()` returns today. `isScheduledForDate(habit, dateStr)` returns true for daily/multiple habits always, and for weekly habits only when `dateStr` falls on one of `scheduledDays`. `isDoneToday(habit)` checks `completions[today] >= 1` (or `>= timesPerDay` for multiple) — it checks today's specific date, not the whole week. Use `T12:00:00` when constructing `Date` objects from date strings to avoid timezone-midnight bugs.

**Onboarding** (`src/screens/OnboardingFlow.tsx` + `src/data/onboarding.ts`): 4-step wizard: Name/Birthday/Gender → Abilities (quiz or manual) → Class → Done. Two paths for step 2: `abilitiesMode === 'quiz'` uses `AbilitiesStep` (one `StepSlider` per question, 6 questions), `abilitiesMode === 'manual'` uses `ManualAbilitiesStep` (all 6 sliders on one page). `ClassStep` receives resolved `abilities: AbilityScores` directly. `suggestClass()` in `onboarding.ts` picks the class with the highest weighted score. On completion, ability scores 1–5 are converted to starting ability XP via `totalXpForAbilityLevel(score)` so the quiz score directly sets the starting ability level.

**Habit form** (`src/screens/HabitFormScreen.tsx`): When a `linkedAbility` is selected, `effectiveColor` is derived from `ABILITY_META[ability].color` and the sigil color picker is hidden. Weekly habits use a multi-select day picker — at least one day must remain selected. `scheduledDays` is stored as a sorted `number[]`.

**Quest screen** (`src/screens/TodayScreen.tsx`): Habits are filtered to `isScheduledForDate(habit, today)` by default. When off-schedule habits exist, a "Show all" toggle appears — tapping it adds an "Other Quests" section below today's habits. Off-day habits are rendered with `disabled=true` (checkbox non-interactive, long-press to edit and swipe-to-delete still work) and a `scheduleLabel` showing their scheduled days.

**Ability detail** (`src/screens/AbilityDetailScreen.tsx`): Navigated to from the ability boxes on TodayScreen (CharacterBanner). Shows level, animated XP bar, base score dots, description, and example habits. Route param: `{ ability: keyof AbilityScores }`.

**Theme** (`src/theme.ts`): Blue-purple-gold mystic palette. Key tokens: `BG=#0D0B1E`, `SURFACE=#16133A`, `SURFACE2=#1E1A4A`, `BORDER=#2D2860`, `GOLD=#C9A84C`, `PURPLE=#7B5EA7`, `TEXT=#E4DFFF`. All screens import from here; do not hardcode colors.

**Ability colors** are defined in `ABILITY_META` in `src/data/onboarding.ts`: STR=#E05A5A, DEX=#4DD890, CON=#E8904A, INT=#5B9CF6, WIS=#A374D8, CHA=#E86FA0.

**Safe area**: All screens use `SafeAreaView` from `react-native-safe-area-context` (not from `react-native`). `SafeAreaProvider` lives in `App.tsx`.
