import AsyncStorage from '@react-native-async-storage/async-storage';
import { MaterialCommunityIcons } from '@expo/vector-icons';
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
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import HabitRow from '../components/HabitRow';
import { ABILITY_META, ABILITY_ORDER, CLASSES } from '../data/onboarding';
import { isDoneToday, isScheduledForDate, todayKey } from '../dates';
import { cancelHabitReminders } from '../notifications';
import { useAppStore } from '../store';
import {
  BG, BORDER, GOLD, SEPARATOR, SURFACE, SURFACE2, TEXT, TEXT_DIM, TEXT_MUTED,
} from '../theme';
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
      if (!wasDone) Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      else Haptics.selectionAsync();
    },
    [habits, toggleCompletion]
  );

  const handleEdit = useCallback(
    (id: string) => navigation.navigate('HabitForm', { habitId: id }),
    [navigation]
  );

  const handleDelete = useCallback(
    (id: string) => {
      const habit = habits.find(h => h.id === id);
      if (habit?.notificationIds.length) cancelHabitReminders(habit.notificationIds);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
      deleteHabit(id);
    },
    [habits, deleteHabit]
  );

  const dayLabel = new Date().toLocaleDateString('en-US', {
    weekday: 'long', month: 'long', day: 'numeric',
  });

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      <StatusBar barStyle="light-content" />

      <View style={s.header}>
        <View style={s.headerLeft}>
          <Text style={s.title}>SIDE QUESTS</Text>
          <Text style={s.date}>{dayLabel}</Text>
        </View>
        <View style={s.headerRight}>
          <View style={s.headerActions}>
            {offDayHabits.length > 0 && (
              <Pressable onPress={() => setShowAll(v => !v)}>
                <Text style={s.showAllBtn}>{showAll ? 'TODAY' : 'ALL'}</Text>
              </Pressable>
            )}
            <Pressable onPress={() => navigation.navigate('Calendar')} hitSlop={8}>
              <MaterialCommunityIcons name="calendar-month" size={22} color={GOLD} />
            </Pressable>
          </View>
        </View>
      </View>

      <View style={s.headerRule} />

      <FlatList
        data={listData}
        keyExtractor={item => item.type === 'section' ? item.title : item.habit.id}
        contentContainerStyle={s.list}
        ListHeaderComponent={
          <>
            {character && <CharacterBanner character={character} totalXp={totalXp} />}
            <DailyAffirmation />
          </>
        }
        ListEmptyComponent={
          <View style={s.emptyWrap}>
            <MaterialCommunityIcons name="sword-cross" size={48} color={TEXT_MUTED} />
            {habits.length > 0 ? (
              <Text style={s.emptyText}>All clear for today.{'\n'}Tap "ALL" to view other quests.</Text>
            ) : (
              <Text style={s.emptyText}>No side quests yet.{'\n'}Tap + to forge your first one.</Text>
            )}
          </View>
        }
        renderItem={({ item }) => {
          if (item.type === 'section') {
            return (
              <View style={s.sectionHeader}>
                <View style={s.sectionLine} />
                <Text style={s.sectionTitle}>{item.title}</Text>
                <View style={s.sectionLine} />
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
      {/* Identity row */}
      <View style={cb.topRow}>
        <View style={cb.iconCircle}>
          <MaterialCommunityIcons name={classDef.icon as any} size={26} color={GOLD} />
        </View>
        <View style={cb.nameBlock}>
          <Text style={cb.charName} numberOfLines={1}>{character.name}</Text>
          <Text style={cb.classLabel}>{classDef.name.toUpperCase()}</Text>
        </View>
        <View style={cb.rankBadge}>
          <Text style={cb.rankNum}>{level}</Text>
          <Text style={cb.rankSub}>RANK</Text>
        </View>
      </View>

      {/* XP progress */}
      <View style={cb.xpRow}>
        <View style={cb.xpTrack}>
          <Animated.View
            style={[
              cb.xpFill,
              { width: animWidth.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] }) },
            ]}
          />
        </View>
        <Text style={cb.xpLabel}>{currentXp.toLocaleString()} / {nextLevelXp.toLocaleString()} XP</Text>
      </View>

      {/* Ability score circles — D&D Beyond style */}
      <View style={cb.abilRow}>
        {ABILITY_ORDER.map(key => {
          const meta = ABILITY_META[key];
          const abilXp = character.abilityXp?.[key] ?? 0;
          const { level: aLevel, currentXp: aXp, nextLevelXp: aNext } = getAbilityLevelInfo(abilXp);
          const aPct = aNext > 0 ? aXp / aNext : 1;
          return (
            <TouchableOpacity
              key={key}
              style={[cb.abilBox, { borderColor: meta.color + '55' }]}
              onPress={() => navigation.navigate('AbilityDetail', { ability: key })}
              activeOpacity={0.75}
            >
              <Text style={[cb.abilAbbr, { color: meta.color }]}>{meta.abbr}</Text>
              <Text style={[cb.abilLevel, { color: meta.color }]}>{aLevel}</Text>
              <View style={cb.abilBar}>
                <View style={[cb.abilFill, { width: `${aPct * 100}%`, backgroundColor: meta.color }]} />
              </View>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const FALLBACK_AFFIRMATIONS = [
  'You are capable of amazing things.',
  'Every step forward is progress, no matter how small.',
  'Your potential is limitless.',
  'You have the strength to overcome any challenge.',
  'Today is a new opportunity to grow.',
  'Believe in yourself and all that you are.',
  'You are stronger than you think.',
];

function DailyAffirmation() {
  const [affirmation, setAffirmation] = useState<string | null>(null);

  useEffect(() => {
    const today = todayKey();
    const key = `daily_affirmation_${today}`;
    AsyncStorage.getItem(key)
      .then(cached => {
        if (cached) { setAffirmation(cached); return; }
        fetch('https://www.affirmations.dev/')
          .then(r => r.json())
          .then((data: { affirmation: string }) => {
            setAffirmation(data.affirmation);
            AsyncStorage.setItem(key, data.affirmation).catch(() => {});
          })
          .catch(() => {
            const fb = FALLBACK_AFFIRMATIONS[Math.floor(Math.random() * FALLBACK_AFFIRMATIONS.length)];
            setAffirmation(fb);
          });
      })
      .catch(() => {});
  }, []);

  if (!affirmation) return null;

  return (
    <View style={af.container}>
      <View style={af.row}>
        <View style={af.line} />
        <Text style={af.text} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.5}>
          "{affirmation}"
        </Text>
        <View style={af.line} />
      </View>
    </View>
  );
}

const af = StyleSheet.create({
  container: { paddingVertical: 4, marginBottom: 10 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  line: { flex: 1, height: StyleSheet.hairlineWidth, backgroundColor: TEXT_MUTED, minWidth: 16, opacity: 0.5 },
  text: {
    flexShrink: 1,
    fontFamily: 'Felipa_400Regular',
    fontSize: 20,
    color: TEXT_MUTED,
    textAlign: 'center',
  },
});

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: BG },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingTop: 14, paddingBottom: 10,
  },
  headerLeft: { flex: 1 },
  title: { fontSize: 22, fontWeight: '900', color: GOLD, letterSpacing: 3 },
  date: { fontSize: 11, color: TEXT_DIM, marginTop: 2, letterSpacing: 0.3 },
  headerRight: { alignItems: 'flex-end', gap: 6 },
  headerActions: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  showAllBtn: { fontSize: 10, fontWeight: '800', color: TEXT_DIM, letterSpacing: 1.5 },
  calIcon: { fontSize: 20 },
  headerRule: { height: 1, backgroundColor: BORDER, marginHorizontal: 20, marginBottom: 12 },
  sectionHeader: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingHorizontal: 4, paddingVertical: 8,
  },
  sectionLine: { flex: 1, height: 1, backgroundColor: SEPARATOR },
  sectionTitle: {
    fontSize: 10, fontWeight: '800', color: TEXT_DIM,
    textTransform: 'uppercase', letterSpacing: 2,
  },
  list: { paddingHorizontal: 16, paddingTop: 4, paddingBottom: 100 },
  emptyWrap: { alignItems: 'center', marginTop: 60 },
  emptyIcon: { fontSize: 48, marginBottom: 12 },
  emptyText: { textAlign: 'center', color: TEXT_DIM, fontSize: 15, lineHeight: 24 },
  fab: {
    position: 'absolute', bottom: 28, right: 24,
    width: 56, height: 56, borderRadius: 28,
    backgroundColor: SURFACE, borderWidth: 1.5, borderColor: GOLD,
    alignItems: 'center', justifyContent: 'center',
    shadowColor: GOLD, shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3, shadowRadius: 8, elevation: 6,
  },
  fabPressed: { opacity: 0.7, transform: [{ scale: 0.95 }] },
  fabIcon: { color: GOLD, fontSize: 28, fontWeight: '300', lineHeight: 32 },
});

const cb = StyleSheet.create({
  card: {
    marginBottom: 12,
    backgroundColor: SURFACE, borderRadius: 14,
    borderWidth: 1, borderColor: BORDER,
    padding: 14, gap: 10,
  },
  topRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  iconCircle: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: SURFACE2, borderWidth: 1, borderColor: BORDER,
    alignItems: 'center', justifyContent: 'center',
  },
  classIcon: { fontSize: 22 },
  nameBlock: { flex: 1 },
  charName: { fontSize: 16, fontWeight: '800', color: TEXT, letterSpacing: 0.2 },
  classLabel: { fontSize: 9, fontWeight: '800', color: TEXT_DIM, letterSpacing: 2, marginTop: 2 },
  rankBadge: {
    backgroundColor: BG, borderWidth: 1.5, borderColor: GOLD,
    borderRadius: 10, paddingHorizontal: 12, paddingVertical: 6,
    alignItems: 'center', minWidth: 56,
  },
  rankNum: { fontSize: 20, fontWeight: '900', color: GOLD, lineHeight: 22 },
  rankSub: { fontSize: 7, fontWeight: '800', color: TEXT_DIM, letterSpacing: 2 },
  xpRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  xpTrack: {
    flex: 1, height: 5, borderRadius: 3,
    backgroundColor: SURFACE2, overflow: 'hidden',
    borderWidth: 1, borderColor: BORDER,
  },
  xpFill: { height: '100%', backgroundColor: GOLD, borderRadius: 3 },
  xpLabel: { fontSize: 10, color: TEXT_DIM, fontWeight: '600', minWidth: 90, textAlign: 'right' },
  abilRow: { flexDirection: 'row', gap: 5 },
  abilBox: {
    flex: 1, backgroundColor: SURFACE2, borderRadius: 8, borderWidth: 1,
    paddingVertical: 8, paddingHorizontal: 4, alignItems: 'center', gap: 2,
  },
  abilAbbr: { fontSize: 8, fontWeight: '800', letterSpacing: 0.8 },
  abilLevel: { fontSize: 14, fontWeight: '900', lineHeight: 16 },
  abilBar: {
    width: '100%', height: 2, borderRadius: 1,
    backgroundColor: BG, overflow: 'hidden', marginTop: 2,
  },
  abilFill: { height: '100%', borderRadius: 1 },
});
