# LifeForge — Antigravity

A D&D-inspired habit tracker built with Expo and React Native. Turn your daily habits into character-building quests, earn XP, level up your abilities, and forge the hero you want to become.

## Features

- **Daily Quests** — habit list filtered to today; weekly habits only appear on their scheduled days
- **Show All toggle** — access off-schedule habits for editing or deletion without cluttering today's view
- **Multi-day weekly habits** — schedule a habit on any combination of days (e.g. Mon, Wed, Fri)
- **Six ability scores** — STR, DEX, CON, INT, WIS, CHA each have their own XP track and level cap (20)
- **Character classes** — class is auto-suggested from your highest ability scores during onboarding
- **XP & leveling** — complete quests to earn character XP and ability XP; level-up triggers a modal
- **Swipe to delete** — swipe left on any habit row to reveal a delete action
- **Reminders** — per-habit push notifications; weekly habits get one notification per scheduled day
- **Onboarding wizard** — 4-step D&D character creation (name/birthday/gender → abilities → class → done)

## Tech Stack

| Layer | Library |
|---|---|
| Framework | Expo SDK ~54 / React Native 0.81 |
| Navigation | React Navigation 7 (native stack + bottom tabs) |
| State | `useReducer` + Context API, persisted via AsyncStorage |
| Notifications | expo-notifications |
| Haptics | expo-haptics |
| Language | TypeScript |

## Getting Started

```bash
# Install dependencies
npm install

# Start dev server (scan QR with Expo Go)
npx expo start

# Type-check
npx tsc --noEmit
```

Requires [Expo Go](https://expo.dev/go) on your iOS or Android device, or an emulator.

## Project Structure

```
src/
  screens/       # TodayScreen, HabitFormScreen, CalendarScreen, ProfileScreen, AbilityDetailScreen, OnboardingFlow
  components/    # HabitRow (swipe gesture), LevelUpModal
  data/          # onboarding.ts — class definitions, ability metadata, ABILITY_META
  store.tsx      # global state (useReducer), AsyncStorage persistence
  types.ts       # Habit, Character, AppState type definitions
  dates.ts       # todayKey, isScheduledForDate, isDoneToday, currentStreak
  xp.ts          # XP constants, getLevelInfo, getAbilityLevelInfo, totalXpForAbilityLevel
  theme.ts       # color tokens (BG, SURFACE, GOLD, ability colors, …)
  notifications.ts
App.tsx          # provider tree + onboarding gate + navigation setup
```

## License

MIT
