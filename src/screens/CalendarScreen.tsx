import React, { useState } from 'react';
import {
  Alert,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { ABILITY_META } from '../data/onboarding';
import {
  getDaysInMonth,
  getFirstDayOfMonth,
  isScheduledForDate,
  maxPossibleOnDate,
  todayKey,
  totalCompletionsOnDate,
} from '../dates';
import { useAppStore } from '../store';
import {
  BG, BORDER, DONE_BG, DONE_FG, GOLD, SURFACE, SURFACE2, TEXT, TEXT_DIM, TEXT_MUTED,
} from '../theme';
import type { Habit, RootStackParamList } from '../types';

type Nav = NativeStackNavigationProp<RootStackParamList>;

// Week starts Monday: Mo Tu We Th Fr Sa Su
const DAY_LABELS = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'];
const MONTH_NAMES = [
  'January','February','March','April','May','June',
  'July','August','September','October','November','December',
];

function intensityColor(ratio: number): string {
  if (ratio <= 0) return SURFACE2;
  if (ratio < 0.34) return '#3D2A0A';
  if (ratio < 0.67) return '#7A5A14';
  return GOLD;
}

function isDoneOnDate(habit: Habit, dateStr: string): boolean {
  const count = habit.completions[dateStr] ?? 0;
  return habit.frequency === 'multiple' ? count >= habit.timesPerDay : count >= 1;
}

function formatSelectedDate(dateStr: string): string {
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString('en-US', {
    weekday: 'long', month: 'long', day: 'numeric',
  });
}

export default function CalendarScreen() {
  const navigation = useNavigation<Nav>();
  const { state, deleteHabit } = useAppStore();
  const { habits } = state;

  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth());
  const [selectedDate, setSelectedDate] = useState<string>(todayKey());

  const today = todayKey();
  const daysInMonth = getDaysInMonth(year, month);
  // getFirstDayOfMonth returns 0=Sun…6=Sat; convert to Mon-first offset
  const mondayOffset = (getFirstDayOfMonth(year, month) + 6) % 7;
  const maxPerDay = maxPossibleOnDate(habits);

  function prevMonth() {
    if (month === 0) { setYear(y => y - 1); setMonth(11); }
    else setMonth(m => m - 1);
  }
  function nextMonth() {
    if (month === 11) { setYear(y => y + 1); setMonth(0); }
    else setMonth(m => m + 1);
  }

  const totalThisMonth = Array.from({ length: daysInMonth }, (_, i) => {
    const d = `${year}-${String(month + 1).padStart(2, '0')}-${String(i + 1).padStart(2, '0')}`;
    return totalCompletionsOnDate(habits, d);
  }).reduce((a, b) => a + b, 0);

  const cells: (number | null)[] = [
    ...Array(mondayOffset).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];

  const dayHabits = habits.filter(h => isScheduledForDate(h, selectedDate));
  const isFutureSelected = selectedDate > today;

  return (
    <SafeAreaView style={s.safe}>
      <StatusBar barStyle="light-content" />
      <ScrollView contentContainerStyle={s.scroll}>

        {/* Header */}
        <View style={s.headerRow}>
          <Pressable onPress={() => navigation.goBack()} style={s.backBtn}>
            <Text style={s.backIcon}>‹</Text>
          </Pressable>
          <Text style={s.heading}>Chronicle</Text>
          <View style={s.backBtn} />
        </View>

        {/* Month navigation */}
        <View style={s.monthRow}>
          <Pressable onPress={prevMonth} style={s.navBtn}>
            <Text style={s.navIcon}>‹</Text>
          </Pressable>
          <Text style={s.monthLabel}>{MONTH_NAMES[month]} {year}</Text>
          <Pressable
            onPress={nextMonth}
            style={s.navBtn}
            disabled={year === now.getFullYear() && month === now.getMonth()}
          >
            <Text style={[s.navIcon, year === now.getFullYear() && month === now.getMonth() && s.navDisabled]}>
              ›
            </Text>
          </Pressable>
        </View>

        {/* Calendar grid */}
        <View style={s.grid}>
          {DAY_LABELS.map(d => (
            <View key={d} style={s.cell}>
              <Text style={s.dayLabel}>{d}</Text>
            </View>
          ))}

          {cells.map((day, idx) => {
            if (day === null) return <View key={`empty-${idx}`} style={s.cell} />;
            const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            const count = totalCompletionsOnDate(habits, dateStr);
            const ratio = maxPerDay > 0 ? count / maxPerDay : 0;
            const isToday = dateStr === today;
            const isFuture = dateStr > today;
            const isSelected = dateStr === selectedDate;

            return (
              <Pressable
                key={dateStr}
                style={s.cell}
                onPress={() => setSelectedDate(dateStr)}
              >
                <View style={[
                  s.dayCell,
                  { backgroundColor: isFuture ? 'transparent' : intensityColor(ratio) },
                  isToday && s.todayRing,
                  isSelected && !isToday && s.selectedRing,
                ]}>
                  <Text style={[
                    s.dayNum,
                    isToday && s.todayNum,
                    isFuture && s.futureNum,
                    isSelected && s.selectedNum,
                  ]}>
                    {day}
                  </Text>
                  {count > 0 && !isFuture && (
                    <Text style={s.countDot}>{count}</Text>
                  )}
                </View>
              </Pressable>
            );
          })}
        </View>

        <View style={s.legend}>
          {[0, 0.2, 0.5, 1].map(r => (
            <View key={r} style={[s.legendDot, { backgroundColor: intensityColor(r) }]} />
          ))}
          <Text style={s.legendText}>Less → More</Text>
        </View>

        {/* Day detail panel */}
        <View style={s.dayPanel}>
          <Text style={s.dayPanelDate}>{formatSelectedDate(selectedDate)}</Text>

          {isFutureSelected ? (
            <Text style={s.emptyDay}>No entries yet for this day.</Text>
          ) : dayHabits.length === 0 ? (
            <Text style={s.emptyDay}>No side quests scheduled.</Text>
          ) : (
            dayHabits.map(habit => (
              <DayHabitRow
                key={habit.id}
                habit={habit}
                dateStr={selectedDate}
                onEdit={() => navigation.navigate('HabitForm', { habitId: habit.id })}
                onDelete={() =>
                  Alert.alert(
                    `Delete "${habit.name}"?`,
                    'This side quest will be lost forever.',
                    [
                      { text: 'Cancel', style: 'cancel' },
                      { text: 'Delete', style: 'destructive', onPress: () => deleteHabit(habit.id) },
                    ]
                  )
                }
              />
            ))
          )}
        </View>

        {/* Monthly summary */}
        <View style={s.summary}>
          <View style={s.statBox}>
            <Text style={s.statNum}>{totalThisMonth}</Text>
            <Text style={s.statLabel}>Victories{'\n'}this moon</Text>
          </View>
          <View style={s.statBox}>
            <Text style={s.statNum}>{habits.length}</Text>
            <Text style={s.statLabel}>Active{'\n'}quests</Text>
          </View>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

function DayHabitRow({
  habit, dateStr, onEdit, onDelete,
}: {
  habit: Habit;
  dateStr: string;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const count = habit.completions[dateStr] ?? 0;
  const done = isDoneOnDate(habit, dateStr);
  const abilMeta = habit.linkedAbility ? ABILITY_META[habit.linkedAbility] : null;
  const accentColor = abilMeta?.color ?? habit.color;

  return (
    <View style={dh.row}>
      <View style={[
        dh.check,
        { borderColor: done ? DONE_FG : accentColor },
        done && { backgroundColor: DONE_BG },
      ]}>
        {done && <Text style={dh.checkMark}>✓</Text>}
        {!done && habit.frequency === 'multiple' && count > 0 && (
          <Text style={[dh.partialCount, { color: accentColor }]}>{count}</Text>
        )}
      </View>

      <View style={dh.nameCol}>
        <Text style={[dh.name, done && dh.nameDone]} numberOfLines={1}>
          {habit.name}
        </Text>
        {abilMeta && (
          <Text style={[dh.abilTag, { color: abilMeta.color }]}>{abilMeta.abbr}</Text>
        )}
        {habit.frequency === 'multiple' && (
          <Text style={dh.countTag}>{count}/{habit.timesPerDay}×</Text>
        )}
      </View>

      <Pressable
        onPress={onEdit}
        style={({ pressed }) => [dh.iconBtn, pressed && { opacity: 0.5 }]}
        hitSlop={8}
      >
        <Text style={dh.iconText}>✏️</Text>
      </Pressable>
      <Pressable
        onPress={onDelete}
        style={({ pressed }) => [dh.iconBtn, pressed && { opacity: 0.5 }]}
        hitSlop={8}
      >
        <Text style={dh.iconText}>🗑️</Text>
      </Pressable>
    </View>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: BG },
  scroll: { padding: 20, paddingBottom: 48 },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  backBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  backIcon: { fontSize: 28, color: GOLD, fontWeight: '300' },
  heading: { fontSize: 24, fontWeight: '800', color: GOLD, letterSpacing: 1 },
  monthRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
    backgroundColor: SURFACE,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: BORDER,
    paddingHorizontal: 4,
  },
  navBtn: { padding: 12 },
  navIcon: { fontSize: 28, color: GOLD, fontWeight: '300' },
  navDisabled: { color: TEXT_MUTED },
  monthLabel: { fontSize: 16, fontWeight: '700', color: TEXT, letterSpacing: 0.5 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: 8 },
  cell: { width: `${100 / 7}%`, alignItems: 'center', marginBottom: 4 },
  dayLabel: { fontSize: 10, color: TEXT_MUTED, fontWeight: '700', marginBottom: 4, letterSpacing: 0.5 },
  dayCell: {
    width: 36, height: 36, borderRadius: 8,
    alignItems: 'center', justifyContent: 'center',
  },
  todayRing: { borderWidth: 2, borderColor: GOLD },
  selectedRing: { borderWidth: 2, borderColor: TEXT },
  dayNum: { fontSize: 12, color: TEXT, fontWeight: '500' },
  todayNum: { color: GOLD, fontWeight: '800' },
  futureNum: { color: TEXT_MUTED },
  selectedNum: { fontWeight: '800' },
  countDot: { fontSize: 8, color: BG, fontWeight: '700', position: 'absolute', bottom: 3 },
  legend: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 6, marginTop: 4, marginBottom: 20,
  },
  legendDot: { width: 14, height: 14, borderRadius: 4 },
  legendText: { fontSize: 11, color: TEXT_MUTED, marginLeft: 4 },
  dayPanel: {
    backgroundColor: SURFACE, borderRadius: 14, borderWidth: 1,
    borderColor: BORDER, padding: 16, marginBottom: 16, gap: 8,
  },
  dayPanelDate: {
    fontSize: 13, fontWeight: '700', color: GOLD, marginBottom: 4,
  },
  emptyDay: { fontSize: 13, color: TEXT_MUTED, fontStyle: 'italic' },
  summary: { flexDirection: 'row', gap: 12 },
  statBox: {
    flex: 1, backgroundColor: SURFACE, borderRadius: 14,
    borderWidth: 1, borderColor: BORDER, padding: 16, alignItems: 'center',
  },
  statNum: { fontSize: 32, fontWeight: '800', color: GOLD },
  statLabel: { fontSize: 12, color: TEXT_DIM, textAlign: 'center', marginTop: 4, lineHeight: 18 },
});

const dh = StyleSheet.create({
  row: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingVertical: 8, borderTopWidth: 1, borderTopColor: BORDER,
  },
  check: {
    width: 28, height: 28, borderRadius: 14, borderWidth: 2,
    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  checkMark: { color: DONE_FG, fontSize: 14, fontWeight: '700' },
  partialCount: { fontSize: 11, fontWeight: '700' },
  nameCol: { flex: 1 },
  name: { fontSize: 15, color: TEXT, fontWeight: '500' },
  nameDone: { textDecorationLine: 'line-through', color: TEXT_MUTED },
  abilTag: { fontSize: 10, fontWeight: '800', letterSpacing: 0.5, marginTop: 1 },
  countTag: { fontSize: 10, color: TEXT_MUTED, marginTop: 1 },
  iconBtn: { padding: 4 },
  iconText: { fontSize: 16 },
});
