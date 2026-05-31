# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Expo Docs

**Always read the exact versioned Expo docs before writing any Expo-related code:**
https://docs.expo.dev/versions/v54.0.0/

## Commands

```bash
# Start dev server (opens QR code for Expo Go)
npx expo start

# Platform-specific launchers
npx expo start --android
npx expo start --ios

# Type-check (no test suite configured)
npx tsc --noEmit
```

### Supabase CLI (project is linked to `fuecfmgmwzbppaawpflw`)

```bash
npx supabase migration list          # check which migrations are applied locally vs remote
npx supabase db push --linked        # apply pending migrations to the remote database
npx supabase db push --linked --dry-run  # preview without applying
```

## Environment variables

`.env` (gitignored) must contain:
```
EXPO_PUBLIC_SUPABASE_URL=https://<project-ref>.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=<anon key>
```
`EXPO_PUBLIC_` prefix is intentional — these are the public anon key and URL (not secrets). `src/lib/supabase.ts` throws at startup if either is missing.

## Architecture

**Entry point**: `index.ts` → `App.tsx`. App.tsx wires up the provider tree, navigation, and the auth/onboarding gate — it contains no screen logic.

**Provider tree** (outermost → innermost):
```
SafeAreaProvider (backgroundColor: BG) → AppProvider → View (backgroundColor: BG) → AppShell
```
`AppShell` reads `session` (undefined = resolving, null = signed out, Session = signed in), `state.isLoaded`, and `state.character`: renders a blank view while loading, `AuthScreen` if signed out, `OnboardingFlow` if `character === null`, or the `NavigationContainer` otherwise.

**Authentication** (`App.tsx` + `src/lib/supabase.ts` + `src/screens/AuthScreen.tsx`):
- On startup, `getUser()` validates the JWT server-side (not just from cache). Falls back to cached session on network error for offline support. `INITIAL_SESSION` is suppressed in `onAuthStateChange` since startup is handled by `getUser()`.
- `src/lib/supabase.ts` exports the Supabase client. Sessions are stored in `expo-secure-store` on native (chunked into 1900-byte pieces to work around iOS's 2048-byte SecureStore limit) and `AsyncStorage` on web.
- `AuthScreen` handles sign-in / sign-up with client-side email validation, 8-char password minimum, and a 10-second cooldown after failed attempts. Raw Supabase error strings are mapped to safe user-facing messages via `sanitizeAuthError()`.

**Sync layer** (`src/lib/sync.ts`):
- All functions call `supabase.auth.getUser()` for identity — never trust a locally stored user ID.
- Data is stored as opaque JSON blobs: `habits` table stores each habit as `data jsonb`, `characters` table stores the full character as `data jsonb`, `user_xp` stores `total_xp integer`, `campaign_completions` stores each completion as `data jsonb`.
- `pullAll()` fetches all four tables in parallel. `pushAllLocal()` upserts everything at once (used on first sign-in to seed an empty remote from local data). Individual push functions (`pushHabit`, `pushCharacter`, `pushXp`, `pushCampaignCompletion`) are called by the store after each mutation.
- `MERGE_REMOTE` in the store union-merges remote + local habits/completions and takes `Math.max` for XP.

**Database schema** (see `supabase/migrations/20260531000000_rls_policies.sql`):
```
habits             (id text PK, user_id uuid, data jsonb, updated_at timestamptz)
characters         (user_id uuid PK, data jsonb, updated_at timestamptz)
user_xp            (user_id uuid PK, total_xp integer, updated_at timestamptz)
campaign_completions (user_id uuid, campaign_id text, data jsonb, updated_at timestamptz, PK: user_id+campaign_id)
```
All tables have RLS enabled with `FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id)`.

**Navigation**: Two-level React Navigation setup.
- Root stack (`createNativeStackNavigator`): `MainTabs` + `HabitForm` (modal) + `AbilityDetail` (modal) + `Calendar` (modal) + `CampaignPlay` (modal)
- Tab stack (`createBottomTabNavigator`): `Side Quests` (TodayScreen) | `Campaigns` (CampaignsScreen) | `Hero` (ProfileScreen)

All overlay screens use `presentation: 'modal', animation: 'slide_from_bottom'`. `MainTabs` uses `animation: 'none'`. Default stack animation is `slide_from_right`.

**Navigation theming**: `NavigationContainer` receives a custom `NAV_THEME` (derived from `DarkTheme`) with `background`, `card`, `border`, and `text` overridden to the app palette. The `Stack.Navigator` sets `contentStyle: { backgroundColor: BG }` as a screen default. Both layers together prevent any white flash during transitions. `SafeAreaProvider` also has `style={{ backgroundColor: BG }}`. Do not remove any of these — they are all load-bearing.

**State management** (`src/store.tsx`): Single `useReducer`-based context (`AppContext`) exposed via `useAppStore()`. All mutations go through typed `Action` discriminated union. Persisted to AsyncStorage under key `app_data_v2` (JSON: `{ habits, totalXp, character, campaignCompletions }`). Legacy `habits_v1` key and old `startDay` field are migrated on first load.

**Core data types** (`src/types.ts`):
- `Habit` — `completions: Record<string, number>` maps `YYYY-MM-DD` → completion count. `frequency` is `'daily' | 'weekly' | 'multiple'`. Weekly habits use `scheduledDays: number[]` (1=Sun … 7=Sat). `linkedAbility` optionally links a habit to one of the six abilities. `scheduledTime` and `reminderLeadMinutes` are display/notification-only.
- `Character` — `name`, `birthday`, `gender`, `abilities: AbilityScores` (six scores 1–5), `characterClass`, `abilityXp: Partial<Record<keyof AbilityScores, number>>` (cumulative XP per ability).
- `CampaignCompletion` — `campaignId`, `completedAt`, `successfulChecks`, `xpEarned`, `choiceLog: ChoiceLogEntry[]`, `endingSceneId`.
- `AppState` — `habits[]`, `totalXp`, `pendingLevelUp`, `character | null`, `campaignCompletions[]`, `isLoaded`.

**XP system** (`src/xp.ts`):
- *Character XP*: `XP_DAILY=10`, `XP_WEEKLY=15`, `XP_PER_REP=5`. Level thresholds grow via `30 * 1.15^(level-1)`. `getLevelInfo(totalXp)` returns `{ level, currentXp, nextLevelXp }`. Level-up detection in `TOGGLE_COMPLETION` sets `pendingLevelUp`, which triggers `LevelUpModal`.
- *Ability XP*: `XP_ABILITY_DAILY=10`, `XP_ABILITY_WEEKLY=20`, `XP_ABILITY_PER_REP=5`. Ability levels cap at 20 (`ABILITY_MAX_LEVEL`); threshold grows via `30 * 1.25^(level-1)`. `getAbilityLevelInfo(totalXp)` returns level info. `totalXpForAbilityLevel(n)` returns cumulative XP to reach level n (used to seed ability XP from onboarding scores).
- Both character XP and linked ability XP are awarded/deducted together inside `TOGGLE_COMPLETION`.

**Date helpers** (`src/dates.ts`): All dates are `YYYY-MM-DD` strings. `todayKey()` returns today. `isScheduledForDate(habit, dateStr)` returns true for daily/multiple habits always, and for weekly habits only when `dateStr` falls on one of `scheduledDays`. `isDoneToday(habit)` checks `completions[today] >= 1` (or `>= timesPerDay` for multiple). Use `T12:00:00` when constructing `Date` objects from date strings to avoid timezone-midnight bugs.

**Onboarding** (`src/screens/OnboardingFlow.tsx` + `src/data/onboarding.ts`): 4-step wizard: Name/Birthday/Gender → Abilities (quiz or manual) → Class → Done. Two paths for step 2: `abilitiesMode === 'quiz'` uses `AbilitiesStep` (one question at a time, animated, with `isTransitioning` ref guard to prevent rapid-tap race conditions), `abilitiesMode === 'manual'` uses `ManualAbilitiesStep` (all 6 sliders on one page). `ClassStep` receives resolved `abilities: AbilityScores` directly. `suggestClass()` in `onboarding.ts` picks the class with the highest weighted score. On completion, ability scores 1–5 are converted to starting ability XP via `totalXpForAbilityLevel(score)`.

**Side Quests screen** (`src/screens/TodayScreen.tsx`): Habits are filtered to `isScheduledForDate(habit, today)` by default. When off-schedule habits exist, a "Show all" toggle appears. Off-day habits render with `disabled=true` and a `scheduleLabel`. The header contains a calendar icon that navigates to `'Calendar'` on the root stack.

**Habit form** (`src/screens/HabitFormScreen.tsx`): New-habit mode shows **Quick Habits** first — six one-tap presets (one per ability) defined in `QUICK_HABITS`. Tapping one calls `addHabit` directly and navigates back, skipping the form entirely. There is no sigil/color picker; new habits default to `GOLD` and when a `linkedAbility` is selected `effectiveColor` switches to `ABILITY_META[ability].color`. Weekly habits use a multi-select day picker — at least one day must remain selected; `scheduledDays` stored as a sorted `number[]`. The footer uses `useSafeAreaInsets` to compute `paddingBottom: Math.max(8, Math.floor(insets.bottom / 2))` so it sits correctly above the home indicator without excess dead space.

**Calendar screen** (`src/screens/CalendarScreen.tsx`): Modal over MainTabs, opened from TodayScreen's calendar button. Week starts Monday — offset calculated as `(getFirstDayOfMonth(year, month) + 6) % 7`. All day cells are tappable; tapping sets `selectedDate`. A day detail panel below the grid shows habits for the selected date via `isScheduledForDate`, with completion status, ability abbreviation, and edit/delete actions. Future dates show a placeholder message.

**Ability detail** (`src/screens/AbilityDetailScreen.tsx`): Modal over MainTabs, navigated to from the ability boxes in `CharacterBanner` on TodayScreen. Shows level, animated XP bar, base score dots, description, and example habits from `ABILITY_DETAILS`. Route param: `{ ability: keyof AbilityScores }`.

**Campaigns screen** (`src/screens/CampaignsScreen.tsx`): Displays the list of `Campaign` objects from `src/data/campaigns.ts`. Tapping an available campaign navigates to `CampaignPlay`.

**Campaign Play screen** (`src/screens/CampaignPlayScreen.tsx`): Scene-based branching narrative engine. Campaign data (`CampaignDefinition`) lives in `src/data/campaigns.ts` as a record of `CampaignScene` objects keyed by scene ID. Scene types: `intro`/`result` (tap to advance), `choice` (presents `ChoiceOption[]`, each optionally with an `AbilityCheck`), and `completion` (awards XP based on `successfulChecks`). Ability checks compare the character's ability level against `requiredLevel` with a probabilistic pass chance (guaranteed at 2× level). On completion, `completeCampaign` dispatches `COMPLETE_CAMPAIGN` which persists to local state and syncs via `pushCampaignCompletion`. A previously completed campaign resumes at the ending scene.

**HabitRow** (`src/components/HabitRow.tsx`): Swipe-left to delete (threshold 80px, animated slide-off + `Alert` confirm). Long-press to edit. Displays streak badge and, if `habit.linkedAbility` is set, an ability abbreviation badge (e.g. STR, DEX) colored with the ability's color from `ABILITY_META`.

**Hero screen** (`src/screens/ProfileScreen.tsx`): Shows character rank, XP bar, stat grid, XP lore. Includes a "Dungeon Master Tools" section with dev buttons (`+100 XP`, `Next Rank`, `Reset XP`, `New Character`, `Clear All Data`) — this is intentional for testing, not a bug.

**Theme** (`src/theme.ts`): Blue-purple-gold mystic palette. Key tokens: `BG=#0D0B1E`, `SURFACE=#16133A`, `SURFACE2=#1E1A4A`, `BORDER=#2D2860`, `GOLD=#C9A84C`, `PURPLE=#7B5EA7`, `TEXT=#E4DFFF`. All screens import from here; do not hardcode colors.

**Ability colors** are defined in `ABILITY_META` in `src/data/onboarding.ts`: STR=#E05A5A, DEX=#4DD890, CON=#E8904A, INT=#5B9CF6, WIS=#A374D8, CHA=#E86FA0.

**Safe area**: All screens use `SafeAreaView` from `react-native-safe-area-context` (not from `react-native`). `SafeAreaProvider` lives in `App.tsx`. **Tab screens** (TodayScreen, CampaignsScreen, ProfileScreen) use `edges={['top']}` — the bottom tab navigator already handles the bottom inset, so omitting `'bottom'` prevents a double gap above the tab bar. **Modal screens** (HabitFormScreen, CalendarScreen, AbilityDetailScreen, CampaignPlayScreen) also use `edges={['top']}` but must manage their own bottom inset via `useSafeAreaInsets` on any pinned footer View.

**Tab bar** (`App.tsx`): `TabIcon` renders a 36×36 `View` containing a `MaterialCommunityIcons` icon (size 26) so React Navigation's icon container cannot clip it. `tabBarIconStyle: { height: 36, width: 36 }` allocates that slot explicitly. Total tab bar `height: 96`, `paddingTop: 6`, `paddingBottom: 28`.
