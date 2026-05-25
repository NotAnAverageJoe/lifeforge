import React, { useState } from 'react';
import {
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  getDaysInMonth,
  getFirstDayOfMonth,
  maxPossibleOnDate,
  todayKey,
  totalCompletionsOnDate,
} from '../dates';
import { useAppStore } from '../store';
import { BG, BORDER, GOLD, GOLD_DIM, SURFACE, SURFACE2, TEXT, TEXT_DIM, TEXT_MUTED } from '../theme';

const DAY_LABELS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
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

export default function CalendarScreen() {
  const { state } = useAppStore();
  const { habits } = state;

  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth());

  const today = todayKey();
  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfMonth(year, month);
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
    ...Array(firstDay).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];

  return (
    <SafeAreaView style={s.safe}>
      <StatusBar barStyle="light-content" />
      <ScrollView contentContainerStyle={s.scroll}>
        <Text style={s.heading}>Chronicle</Text>

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

            return (
              <View key={dateStr} style={s.cell}>
                <View
                  style={[
                    s.dayCell,
                    { backgroundColor: isFuture ? 'transparent' : intensityColor(ratio) },
                    isToday && s.todayRing,
                  ]}
                >
                  <Text style={[s.dayNum, isToday && s.todayNum, isFuture && s.futureNum]}>{day}</Text>
                  {count > 0 && !isFuture && (
                    <Text style={s.countDot}>{count}</Text>
                  )}
                </View>
              </View>
            );
          })}
        </View>

        <View style={s.legend}>
          {[0, 0.2, 0.5, 1].map(r => (
            <View key={r} style={[s.legendDot, { backgroundColor: intensityColor(r) }]} />
          ))}
          <Text style={s.legendText}>Less → More</Text>
        </View>

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

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: BG },
  scroll: { padding: 20, paddingBottom: 40 },
  heading: { fontSize: 28, fontWeight: '800', color: GOLD, letterSpacing: 1, marginBottom: 20 },
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
    width: 36,
    height: 36,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  todayRing: { borderWidth: 2, borderColor: GOLD },
  dayNum: { fontSize: 12, color: TEXT, fontWeight: '500' },
  todayNum: { color: GOLD, fontWeight: '800' },
  futureNum: { color: TEXT_MUTED },
  countDot: { fontSize: 8, color: BG, fontWeight: '700', position: 'absolute', bottom: 3 },
  legend: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 8,
    marginBottom: 24,
  },
  legendDot: { width: 14, height: 14, borderRadius: 4 },
  legendText: { fontSize: 11, color: TEXT_MUTED, marginLeft: 4 },
  summary: { flexDirection: 'row', gap: 12 },
  statBox: {
    flex: 1,
    backgroundColor: SURFACE,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: BORDER,
    padding: 16,
    alignItems: 'center',
  },
  statNum: { fontSize: 32, fontWeight: '800', color: GOLD },
  statLabel: { fontSize: 12, color: TEXT_DIM, textAlign: 'center', marginTop: 4, lineHeight: 18 },
});
