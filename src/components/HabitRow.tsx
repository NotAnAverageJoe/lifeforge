import React, { useRef } from 'react';
import {
  Alert,
  Animated,
  PanResponder,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { currentStreak, getTodayCount, isDoneToday } from '../dates';
import { ABILITY_META } from '../data/onboarding';
import { BORDER, CRIMSON, DONE_FG, SURFACE, TEXT, TEXT_DIM, TEXT_MUTED } from '../theme';
import type { Habit } from '../types';

type Props = {
  habit: Habit;
  onPress: () => void;
  onEdit: () => void;
  onDelete: () => void;
  scheduleLabel?: string;
  disabled?: boolean;
};

const SWIPE_THRESHOLD = 80;

function formatScheduledTime(t: string): string {
  const [h, m] = t.split(':').map(Number);
  const d = new Date();
  d.setHours(h, m, 0, 0);
  return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
}

export default function HabitRow({ habit, onPress, onEdit, onDelete, scheduleLabel, disabled }: Props) {
  const done = isDoneToday(habit);
  const streak = currentStreak(habit);
  const count = getTodayCount(habit);
  const accentColor = habit.linkedAbility
    ? ABILITY_META[habit.linkedAbility].color
    : habit.color;
  const translateX = useRef(new Animated.Value(0)).current;

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponder: (_, { dx, dy }) =>
        Math.abs(dx) > Math.abs(dy) * 1.5 && Math.abs(dx) > 8,
      onPanResponderMove: (_, { dx }) => translateX.setValue(Math.min(0, dx)),
      onPanResponderRelease: (_, { dx }) => {
        if (dx < -SWIPE_THRESHOLD) {
          const resetAnim = () =>
            Animated.spring(translateX, { toValue: 0, useNativeDriver: true, friction: 7 }).start();
          Alert.alert(
            `Delete "${habit.name}"?`,
            'This side quest will be lost forever.',
            [
              { text: 'Cancel', style: 'cancel', onPress: resetAnim },
              {
                text: 'Delete',
                style: 'destructive',
                onPress: () =>
                  Animated.timing(translateX, { toValue: -400, duration: 180, useNativeDriver: true }).start(
                    () => onDelete()
                  ),
              },
            ]
          );
        } else {
          Animated.spring(translateX, { toValue: 0, useNativeDriver: true, friction: 7 }).start();
        }
      },
      onPanResponderTerminate: () => {
        Animated.spring(translateX, { toValue: 0, useNativeDriver: true, friction: 7 }).start();
      },
    })
  ).current;

  const subParts: string[] = [];
  if (habit.frequency === 'weekly') subParts.push('WEEKLY');
  else if (habit.frequency === 'multiple') subParts.push(`${count}/${habit.timesPerDay}×`);
  else subParts.push('DAILY');
  if (habit.scheduledTime) subParts.push(formatScheduledTime(habit.scheduledTime));
  if (scheduleLabel) subParts.push(scheduleLabel);

  const borderColor = done ? DONE_FG : accentColor;

  return (
    <View style={s.container}>
      <View style={s.deleteBg}>
        <Text style={s.deleteLabel}>DELETE</Text>
      </View>

      <Animated.View
        style={[s.row, { borderLeftColor: borderColor }, disabled && s.rowDisabled, { transform: [{ translateX }] }]}
        {...panResponder.panHandlers}
      >
        <Pressable
          style={s.pressable}
          onPress={disabled ? undefined : onPress}
          onLongPress={onEdit}
          delayLongPress={400}
        >
          {/* Completion circle */}
          <View style={[
            s.check,
            { borderColor },
            done && { backgroundColor: borderColor + '20' },
          ]}>
            {done && <Text style={[s.checkMark, { color: DONE_FG }]}>✓</Text>}
            {!done && habit.frequency === 'multiple' && count > 0 && (
              <Text style={[s.partialCount, { color: accentColor }]}>{count}</Text>
            )}
          </View>

          {/* Name + metadata */}
          <View style={s.nameCol}>
            <Text style={[s.name, done && s.nameDone]} numberOfLines={1}>{habit.name}</Text>
            <Text style={s.sub}>{subParts.join('  ·  ')}</Text>
          </View>

          {/* Right badges */}
          <View style={s.rightBadges}>
            {streak > 1 && (
              <View style={[s.streakBadge, { backgroundColor: accentColor + '18' }]}>
                <Text style={[s.streakText, { color: accentColor }]}>🔥 {streak}</Text>
              </View>
            )}
            {habit.linkedAbility && (() => {
              const meta = ABILITY_META[habit.linkedAbility];
              return (
                <View style={[s.abilBadge, { backgroundColor: meta.color + '20', borderColor: meta.color + '50' }]}>
                  <Text style={[s.abilText, { color: meta.color }]}>{meta.abbr}</Text>
                </View>
              );
            })()}
          </View>
        </Pressable>
      </Animated.View>
    </View>
  );
}

const s = StyleSheet.create({
  container: { marginBottom: 8, borderRadius: 12, overflow: 'hidden' },
  deleteBg: {
    position: 'absolute', top: 0, bottom: 0, left: 0, right: 0,
    backgroundColor: CRIMSON,
    justifyContent: 'flex-end', alignItems: 'center',
    flexDirection: 'row', paddingRight: 20,
  },
  deleteLabel: { fontSize: 10, fontWeight: '800', color: '#E8D5A3', letterSpacing: 2 },
  row: {
    backgroundColor: SURFACE,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: BORDER,
    borderLeftWidth: 4,
  },
  rowDisabled: { opacity: 0.45 },
  pressable: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: 14, paddingHorizontal: 14, gap: 12,
  },
  check: {
    width: 28, height: 28, borderRadius: 14, borderWidth: 2,
    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  checkMark: { fontSize: 13, fontWeight: '800' },
  partialCount: { fontSize: 11, fontWeight: '700' },
  nameCol: { flex: 1 },
  name: { fontSize: 15, color: TEXT, fontWeight: '600', letterSpacing: 0.1 },
  nameDone: { textDecorationLine: 'line-through', color: TEXT_MUTED },
  sub: { fontSize: 10, color: TEXT_DIM, marginTop: 3, letterSpacing: 0.8, fontWeight: '600' },
  rightBadges: { flexDirection: 'row', gap: 6, alignItems: 'center' },
  streakBadge: { borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 },
  streakText: { fontSize: 12, fontWeight: '700' },
  abilBadge: { borderRadius: 6, paddingHorizontal: 7, paddingVertical: 3, borderWidth: 1 },
  abilText: { fontSize: 10, fontWeight: '800', letterSpacing: 0.5 },
});
