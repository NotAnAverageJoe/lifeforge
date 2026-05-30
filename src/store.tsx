import AsyncStorage from '@react-native-async-storage/async-storage';
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useReducer,
} from 'react';
import { todayKey } from './dates';
import { cancelAllNotifications, cancelHabitReminders } from './notifications';
import type { AppState, CampaignCompletion, Character, Habit } from './types';
import {
  getLevelInfo,
  XP_ABILITY_DAILY,
  XP_ABILITY_PER_REP,
  XP_ABILITY_WEEKLY,
  XP_DAILY,
  XP_PER_REP,
  XP_WEEKLY,
} from './xp';

const STORAGE_KEY = 'app_data_v2';
const LEGACY_KEY = 'habits_v1';

const INITIAL_STATE: AppState = {
  habits: [],
  totalXp: 0,
  pendingLevelUp: null,
  character: null,
  campaignCompletions: [],
  isLoaded: false,
};

type Action =
  | { type: 'LOAD'; payload: { habits: Habit[]; totalXp: number; character: Character | null; campaignCompletions: CampaignCompletion[] } }
  | { type: 'ADD_HABIT'; payload: Habit }
  | { type: 'UPDATE_HABIT'; payload: Habit }
  | { type: 'DELETE_HABIT'; payload: string }
  | { type: 'TOGGLE_COMPLETION'; payload: { habitId: string; date: string } }
  | { type: 'DISMISS_LEVEL_UP' }
  | { type: 'ADD_XP'; payload: number }
  | { type: 'RESET_XP' }
  | { type: 'COMPLETE_ONBOARDING'; payload: Character }
  | { type: 'DELETE_CHARACTER' }
  | { type: 'CLEAR_ALL' }
  | { type: 'COMPLETE_CAMPAIGN'; payload: CampaignCompletion };

function reducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case 'LOAD':
      return { ...state, ...action.payload, isLoaded: true };

    case 'COMPLETE_CAMPAIGN': {
      const newTotalXp = Math.max(0, state.totalXp + action.payload.xpEarned);
      const oldLevel = getLevelInfo(state.totalXp).level;
      const newLevel = getLevelInfo(newTotalXp).level;
      const pendingLevelUp = newLevel > oldLevel ? newLevel : state.pendingLevelUp;
      return {
        ...state,
        totalXp: newTotalXp,
        pendingLevelUp,
        campaignCompletions: [...state.campaignCompletions, action.payload],
      };
    }

    case 'ADD_HABIT':
      return { ...state, habits: [...state.habits, action.payload] };

    case 'UPDATE_HABIT':
      return {
        ...state,
        habits: state.habits.map(h => (h.id === action.payload.id ? action.payload : h)),
      };

    case 'DELETE_HABIT':
      return { ...state, habits: state.habits.filter(h => h.id !== action.payload) };

    case 'TOGGLE_COMPLETION': {
      const { habitId, date } = action.payload;
      const habit = state.habits.find(h => h.id === habitId);
      if (!habit) return state;

      const currentCount = habit.completions[date] ?? 0;
      let newCount: number;
      let xpDelta = 0;
      let abilityXpDelta = 0;

      if (habit.frequency === 'multiple') {
        if (currentCount >= habit.timesPerDay) {
          newCount = 0;
          xpDelta = -(XP_PER_REP * habit.timesPerDay);
          abilityXpDelta = -(XP_ABILITY_PER_REP * habit.timesPerDay);
        } else {
          newCount = currentCount + 1;
          xpDelta = XP_PER_REP;
          abilityXpDelta = XP_ABILITY_PER_REP;
        }
      } else {
        const xpAmount = habit.frequency === 'weekly' ? XP_WEEKLY : XP_DAILY;
        const abilXpAmount = habit.frequency === 'weekly' ? XP_ABILITY_WEEKLY : XP_ABILITY_DAILY;
        if (currentCount >= 1) {
          newCount = 0;
          xpDelta = -xpAmount;
          abilityXpDelta = -abilXpAmount;
        } else {
          newCount = 1;
          xpDelta = xpAmount;
          abilityXpDelta = abilXpAmount;
        }
      }

      const newCompletions = { ...habit.completions };
      if (newCount === 0) {
        delete newCompletions[date];
      } else {
        newCompletions[date] = newCount;
      }

      const newTotalXp = Math.max(0, state.totalXp + xpDelta);
      const oldLevel = getLevelInfo(state.totalXp).level;
      const newLevel = getLevelInfo(newTotalXp).level;
      const pendingLevelUp = newLevel > oldLevel ? newLevel : state.pendingLevelUp;

      let newCharacter = state.character;
      if (habit.linkedAbility && state.character) {
        const prevAbilXp = state.character.abilityXp?.[habit.linkedAbility] ?? 0;
        newCharacter = {
          ...state.character,
          abilityXp: {
            ...(state.character.abilityXp ?? {}),
            [habit.linkedAbility]: Math.max(0, prevAbilXp + abilityXpDelta),
          },
        };
      }

      return {
        ...state,
        habits: state.habits.map(h =>
          h.id === habitId ? { ...h, completions: newCompletions } : h
        ),
        totalXp: newTotalXp,
        pendingLevelUp,
        character: newCharacter,
      };
    }

    case 'DISMISS_LEVEL_UP':
      return { ...state, pendingLevelUp: null };

    case 'ADD_XP': {
      const newTotalXp = Math.max(0, state.totalXp + action.payload);
      const oldLevel = getLevelInfo(state.totalXp).level;
      const newLevel = getLevelInfo(newTotalXp).level;
      const pendingLevelUp = newLevel > oldLevel ? newLevel : state.pendingLevelUp;
      return { ...state, totalXp: newTotalXp, pendingLevelUp };
    }

    case 'RESET_XP':
      return { ...state, totalXp: 0, pendingLevelUp: null };

    case 'COMPLETE_ONBOARDING':
      return { ...state, character: action.payload };

    case 'DELETE_CHARACTER':
      return { ...state, character: null };

    case 'CLEAR_ALL':
      return { ...INITIAL_STATE, isLoaded: true };

    default:
      return state;
  }
}

type Ctx = {
  state: AppState;
  dispatch: React.Dispatch<Action>;
  addHabit: (habit: Habit) => void;
  updateHabit: (habit: Habit) => void;
  deleteHabit: (id: string) => void;
  toggleCompletion: (habitId: string) => void;
  dismissLevelUp: () => void;
  addXp: (amount: number) => void;
  resetXp: () => void;
  completeOnboarding: (character: Character) => void;
  deleteCharacter: () => void;
  clearAll: () => void;
  completeCampaign: (completion: CampaignCompletion) => void;
};

const AppContext = createContext<Ctx | null>(null);

async function loadData(): Promise<{ habits: Habit[]; totalXp: number; character: Character | null; campaignCompletions: CampaignCompletion[] }> {
  const raw = await AsyncStorage.getItem(STORAGE_KEY);
  if (raw) {
    const parsed = JSON.parse(raw);
    return {
      habits: (parsed.habits ?? []).map((h: any) => ({
        ...h,
        scheduledDays: h.scheduledDays ?? (h.startDay != null ? [h.startDay] : undefined),
      })),
      totalXp: parsed.totalXp ?? 0,
      character: parsed.character ?? null,
      campaignCompletions: parsed.campaignCompletions ?? [],
    };
  }

  // Migrate from v1 schema
  const legacyRaw = await AsyncStorage.getItem(LEGACY_KEY);
  if (legacyRaw) {
    type LegacyHabit = { id: string; name: string; completedDates: string[] };
    const old: LegacyHabit[] = JSON.parse(legacyRaw);
    return {
      habits: old.map(h => ({
        id: h.id,
        name: h.name,
        color: '#6C63FF',
        frequency: 'daily',
        timesPerDay: 1,
        reminder: null,
        notificationIds: [],
        completions: Object.fromEntries(h.completedDates.map(d => [d, 1])),
        createdAt: h.id,
      })),
      totalXp: 0,
      character: null,
      campaignCompletions: [],
    };
  }
  return { habits: [], totalXp: 0, character: null, campaignCompletions: [] };
}

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(reducer, INITIAL_STATE);

  useEffect(() => {
    loadData().then(data => dispatch({ type: 'LOAD', payload: data }));
  }, []);

  useEffect(() => {
    if (!state.isLoaded) return;
    AsyncStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        habits: state.habits,
        totalXp: state.totalXp,
        character: state.character,
        campaignCompletions: state.campaignCompletions,
      })
    );
  }, [state.habits, state.totalXp, state.character, state.campaignCompletions, state.isLoaded]);

  const addHabit = useCallback((habit: Habit) => dispatch({ type: 'ADD_HABIT', payload: habit }), []);
  const updateHabit = useCallback((habit: Habit) => dispatch({ type: 'UPDATE_HABIT', payload: habit }), []);
  const deleteHabit = useCallback((id: string) => dispatch({ type: 'DELETE_HABIT', payload: id }), []);
  const toggleCompletion = useCallback(
    (habitId: string) =>
      dispatch({ type: 'TOGGLE_COMPLETION', payload: { habitId, date: todayKey() } }),
    []
  );
  const dismissLevelUp = useCallback(() => dispatch({ type: 'DISMISS_LEVEL_UP' }), []);
  const addXp = useCallback((amount: number) => dispatch({ type: 'ADD_XP', payload: amount }), []);
  const resetXp = useCallback(() => dispatch({ type: 'RESET_XP' }), []);
  const completeOnboarding = useCallback(
    (character: Character) => dispatch({ type: 'COMPLETE_ONBOARDING', payload: character }),
    []
  );
  const deleteCharacter = useCallback(() => dispatch({ type: 'DELETE_CHARACTER' }), []);
  const clearAll = useCallback(async () => {
    await cancelAllNotifications();
    dispatch({ type: 'CLEAR_ALL' });
  }, []);
  const completeCampaign = useCallback(
    (completion: CampaignCompletion) => dispatch({ type: 'COMPLETE_CAMPAIGN', payload: completion }),
    []
  );

  return (
    <AppContext.Provider
      value={{
        state, dispatch,
        addHabit, updateHabit, deleteHabit, toggleCompletion,
        dismissLevelUp, addXp, resetXp,
        completeOnboarding, deleteCharacter, clearAll, completeCampaign,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useAppStore(): Ctx {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useAppStore must be used inside AppProvider');
  return ctx;
}
