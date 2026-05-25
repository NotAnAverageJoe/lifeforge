import * as Haptics from 'expo-haptics';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Animated,
  FlatList,
  Pressable,
  StatusBar,
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import HabitRow from '../components/HabitRow';
import { ABILITY_META, ABILITY_ORDER, CLASSES } from '../data/onboarding';
import { isDoneToday, isScheduledForDate, todayKey } from '../dates';
import { useAppStore } from '../store';
import { BG, BORDER, GOLD, SURFACE, SURFACE2, TEXT, TEXT_DIM, TEXT_MUTED } from '../theme';
import type { Character, Habit, RootStackParamList } from '../types';
import { getAbilityLevelInfo, getLevelInfo } from '../xp';

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function buildScheduleLabel(habit: Habit): string {
  if (!habit.scheduledDays || habit.scheduledDays.length === 0) return '';
  const WEEK_ORDER = [2, 3, 4, 5, 6, 7, 1];
  const sorted = [...habit.scheduledDays].sort((a, b) => WEEK_ORDER.indexOf(a) - WEEK_ORDER.indexOf(b));
  return sorted.map(d => DAY_NAMES[d - 1]).join(' · ');
}

type ListItem =
  | { type: 'habit'; habit: Habit; isOffDay?: boolean }
  | { type: 'section'; title: string };

type Nav = NativeStackNavigationProp<RootStackParamList>;

export default function TodayScreen() {
  const navigation = useNavigation<Nav>();
  const { state, toggleCompletion, deleteHabit } = useAppStore();
  const { habits, totalXp, character } = state;
  const [showAll, setShowAll] = useState(false);

  const today = todayKey();
  const todayHabits = habits.filter(h => isScheduledForDate(h, today));
  const offDayHabits = habits.filter(h => !isScheduledForDate(h, today));
  const doneCount = todayHabits.filter(h => isDoneToday(h)).length;

  const listData: ListItem[] = [
    ...todayHabits.map(h => ({ type: 'habit' as const, habit: h })),
    ...(showAll && offDayHabits.length > 0
      ? [
          { type: 'section' as const, title: 'Other Quests' },
          ...offDayHabits.map(h => ({ type: 'habit' as const, habit: h, isOffDay: true })),
        ]
      : []),
  ];

  const handleToggle = useCallback(
    (id: string) => {
      const habit = habits.find(h => h.id === id);
      if (!habit) return;
      const wasDone = isDoneToday(habit);
      toggleCompletion(id);
      if (!wasDone) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } else {
        Haptics.selectionAsync();
      }
    },
    [habits, toggleCompletion]
  );

  const handleEdit = useCallback(
    (id: string) => navigation.navigate('HabitForm', { habitId: id }),
    [navigation]
  );

  const handleDelete = useCallback(
    (id: string) => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
      deleteHabit(id);
    },
    [deleteHabit]
  );

  const dayLabel = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });

  return (
    <SafeAreaView style={s.safe}>
      <StatusBar barStyle="light-content" />

      <View style={s.header}>
        <View>
          <Text style={s.title}>Daily Quests</Text>
          <Text style={s.date}>{dayLabel}</Text>
        </View>
        <View style={s.headerRight}>
          {todayHabits.length > 0 && (
            <Text style={s.counter}>{doneCount}/{todayHabits.length}</Text>
          )}
          {offDayHabits.length > 0 && (
            <Pressable onPress={() => setShowAll(v => !v)}>
              <Text style={s.showAllBtn}>{showAll ? 'Today only' : 'Show all'}</Text>
            </Pressable>
          )}
        </View>
      </View>

      {character && <CharacterBanner character={character} totalXp={totalXp} />}

      <View style={s.divider} />

      <FlatList
        data={listData}
        keyExtractor={item => item.type === 'section' ? item.title : item.habit.id}
        contentContainerStyle={s.list}
        ListEmptyComponent={
          <View style={s.emptyWrap}>
            <Text style={s.emptyIcon}>⚔️</Text>
            {habits.length > 0 ? (
              <Text style={s.emptyText}>All clear for today.{'\n'}Tap "Show all" to manage your quests.</Text>
            ) : (
              <Text style={s.emptyText}>No quests yet.{'\n'}Tap + to forge your first one.</Text>
            )}
          </View>
        }
        renderItem={({ item }) => {
          if (item.type === 'section') {
            return (
              <View style={s.sectionHeader}>
                <Text style={s.sectionTitle}>{item.title}</Text>
              </View>
            );
          }
          const { habit, isOffDay } = item;
          return (
            <HabitRow
              habit={habit}
              onPress={() => handleToggle(habit.id)}
              onEdit={() => handleEdit(habit.id)}
              onDelete={() => handleDelete(habit.id)}
              scheduleLabel={isOffDay ? buildScheduleLabel(habit) : undefined}
              disabled={isOffDay}
            />
          );
        }}
      />

      <Pressable
        style={({ pressed }) => [s.fab, pressed && s.fabPressed]}
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          navigation.navigate('HabitForm', {});
        }}
      >
        <Text style={s.fabIcon}>+</Text>
      </Pressable>
    </SafeAreaView>
  );
}

function CharacterBanner({ character, totalXp }: { character: Character; totalXp: number }) {
  const navigation = useNavigation<Nav>();
  const { level, currentXp, nextLevelXp } = getLevelInfo(totalXp);
  const pct = nextLevelXp > 0 ? currentXp / nextLevelXp : 0;
  const animWidth = useRef(new Animated.Value(pct)).current;

  useEffect(() => {
    Animated.spring(animWidth, { toValue: pct, useNativeDriver: false, friction: 8 }).start();
  }, [pct]);

  const classDef = CLASSES.find(c => c.id === character.characterClass)!;

  return (
    <View style={cb.card}>
      <View style={cb.topRow}>
        <Text style={cb.classIcon}>{classDef.icon}</Text>
        <View style={cb.nameBlock}>
          <Text style={cb.charName}>{character.name}</Text>
          <Text style={cb.classLabel}>{classDef.name}</Text>
        </View>
        <View style={cb.rankBadge}>
          <Text style={cb.rankNum}>{level}</Text>
          <Text style={cb.rankLabel}>RANK</Text>
        </View>
      </View>

      <View style={cb.xpRow}>
        <View style={cb.xpTrack}>
          <Animated.View
            style={[
              cb.xpFill,
              { width: animWidth.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] }) },
            ]}
          />
        </View>
        <Text style={cb.xpLabel}>{currentXp}/{nextLevelXp} XP</Text>
      </View>

      <View style={cb.abilGridRow}>
        {ABILITY_ORDER.map(key => {
          const meta = ABILITY_META[key];
          const abilXp = character.abilityXp?.[key] ?? 0;
          const { level: aLevel, currentXp: aXp, nextLevelXp: aNext } = getAbilityLevelInfo(abilXp);
          const aPct = aNext > 0 ? aXp / aNext : 1;
          return (
            <TouchableOpacity
              key={key}
              style={[cb.abilBox, { borderColor: meta.color + '50' }]}
              onPress={() => navigation.navigate('AbilityDetail', { ability: key })}
              activeOpacity={0.75}
            >
              <Text style={[cb.abilAbbr, { color: meta.color }]}>{meta.abbr}</Text>
              <Text style={[cb.abilLevel, { color: meta.color }]}>Lv {aLevel}</Text>
              <View style={cb.abilBar}>
                <View style={[cb.abilBarFill, { width: `${aPct * 100}%`, backgroundColor: meta.color }]} />
              </View>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: BG },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 8,
  },
  title: { fontSize: 28, fontWeight: '800', color: GOLD, letterSpacing: 1 },
  date: { fontSize: 12, color: TEXT_DIM, marginTop: 3, letterSpacing: 0.3 },
  headerRight: { alignItems: 'flex-end', gap: 4 },
  counter: { fontSize: 18, fontWeight: '700', color: GOLD },
  showAllBtn: { fontSize: 11, fontWeight: '700', color: TEXT_MUTED, letterSpacing: 0.5 },
  sectionHeader: { paddingHorizontal: 4, paddingTop: 8, paddingBottom: 4 },
  sectionTitle: { fontSize: 11, fontWeight: '700', color: TEXT_DIM, textTransform: 'uppercase', letterSpacing: 1.5 },
  divider: { height: 1, backgroundColor: BORDER, marginHorizontal: 20, marginTop: 4 },
  list: { paddingHorizontal: 16, paddingTop: 12, paddingBottom: 100 },
  emptyWrap: { alignItems: 'center', marginTop: 60 },
  emptyIcon: { fontSize: 48, marginBottom: 12 },
  emptyText: { textAlign: 'center', color: TEXT_DIM, fontSize: 15, lineHeight: 24 },
  fab: {
    position: 'absolute',
    bottom: 28,
    right: 24,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: SURFACE,
    borderWidth: 2,
    borderColor: GOLD,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: GOLD,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 6,
  },
  fabPressed: { opacity: 0.7, transform: [{ scale: 0.95 }] },
  fabIcon: { color: GOLD, fontSize: 30, fontWeight: '300', lineHeight: 34 },
});

const cb = StyleSheet.create({
  card: {
    marginHorizontal: 16,
    marginBottom: 8,
    backgroundColor: SURFACE,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: BORDER,
    padding: 12,
    gap: 8,
  },
  topRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  classIcon: { fontSize: 24 },
  nameBlock: { flex: 1 },
  charName: { fontSize: 16, fontWeight: '800', color: TEXT },
  classLabel: { fontSize: 11, color: TEXT_DIM, fontWeight: '600', marginTop: 1 },
  rankBadge: {
    backgroundColor: BG,
    borderWidth: 1,
    borderColor: GOLD,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
    alignItems: 'center',
    minWidth: 52,
  },
  rankNum: { fontSize: 18, fontWeight: '900', color: GOLD, lineHeight: 20 },
  rankLabel: { fontSize: 8, fontWeight: '800', color: TEXT_DIM, letterSpacing: 1.5 },
  xpRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  xpTrack: {
    flex: 1,
    height: 6,
    borderRadius: 3,
    backgroundColor: SURFACE2,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: BORDER,
  },
  xpFill: { height: '100%', backgroundColor: GOLD, borderRadius: 3 },
  xpLabel: { fontSize: 10, color: TEXT_DIM, fontWeight: '600', minWidth: 68, textAlign: 'right' },
  abilGridRow: { flexDirection: 'row', gap: 6 },
  abilBox: {
    flex: 1,
    backgroundColor: SURFACE2,
    borderRadius: 8,
    borderWidth: 1,
    paddingVertical: 7,
    paddingHorizontal: 6,
    alignItems: 'center',
    gap: 2,
  },
  abilAbbr: { fontSize: 9, fontWeight: '800', letterSpacing: 0.5 },
  abilLevel: { fontSize: 11, fontWeight: '700' },
  abilBar: {
    width: '100%',
    height: 3,
    borderRadius: 2,
    backgroundColor: BG,
    overflow: 'hidden',
    marginTop: 1,
  },
  abilBarFill: { height: '100%', borderRadius: 2 },
});
