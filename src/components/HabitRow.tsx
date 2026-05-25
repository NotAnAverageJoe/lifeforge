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
import { BORDER, CRIMSON, DONE_BG, DONE_FG, SURFACE, TEXT, TEXT_DIM, TEXT_MUTED } from '../theme';
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

export default function HabitRow({ habit, onPress, onEdit, onDelete, scheduleLabel, disabled }: Props) {
  const done = isDoneToday(habit);
  const streak = currentStreak(habit);
  const count = getTodayCount(habit);
  const color = habit.color;
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
            'This quest will be lost forever.',
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

  const freqLabel =
    habit.frequency === 'weekly'
      ? 'weekly'
      : habit.frequency === 'multiple'
      ? `${count}/${habit.timesPerDay}×`
      : null;

  return (
    <View style={s.container}>
      <View style={[s.actionBg, s.deleteBg]}>
        <Text style={s.actionLabel}>Delete</Text>
      </View>

      <Animated.View style={[s.row, { transform: [{ translateX }] }, disabled && s.rowDisabled]} {...panResponder.panHandlers}>
        <Pressable style={s.pressable} onPress={disabled ? undefined : onPress} onLongPress={onEdit} delayLongPress={400}>
          <View
            style={[
              s.check,
              { borderColor: done ? DONE_FG : color },
              done && { backgroundColor: DONE_BG },
            ]}
          >
            {done && <Text style={s.checkMark}>✓</Text>}
            {!done && habit.frequency === 'multiple' && count > 0 && (
              <Text style={[s.partialCount, { color }]}>{count}</Text>
            )}
          </View>

          <View style={s.nameCol}>
            <Text style={[s.name, done && s.nameDone]} numberOfLines={1}>
              {habit.name}
            </Text>
            {freqLabel && <Text style={s.freq}>{freqLabel}</Text>}
            {scheduleLabel && <Text style={s.schedLabel}>{scheduleLabel}</Text>}
          </View>

          {streak > 0 && (
            <View style={[s.badge, { backgroundColor: color + '22' }]}>
              <Text style={[s.badgeText, { color }]}>🔥 {streak}</Text>
            </View>
          )}
        </Pressable>
      </Animated.View>
    </View>
  );
}

const s = StyleSheet.create({
  container: { borderRadius: 14, marginBottom: 10, overflow: 'hidden' },
  actionBg: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
  },
  deleteBg: { backgroundColor: CRIMSON, paddingRight: 20, justifyContent: 'flex-end' },
  actionLabel: { fontSize: 12, fontWeight: '700', color: '#E8D5A3', letterSpacing: 1 },
  row: { backgroundColor: SURFACE, borderWidth: 1, borderColor: BORDER, borderRadius: 14 },
  pressable: { flexDirection: 'row', alignItems: 'center', padding: 16 },
  check: {
    width: 30,
    height: 30,
    borderRadius: 15,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  checkMark: { color: DONE_FG, fontSize: 15, fontWeight: '700' },
  partialCount: { fontSize: 12, fontWeight: '700' },
  nameCol: { flex: 1 },
  name: { fontSize: 16, color: TEXT, fontWeight: '500' },
  nameDone: { textDecorationLine: 'line-through', color: TEXT_MUTED },
  freq: { fontSize: 11, color: TEXT_DIM, marginTop: 2 },
  schedLabel: { fontSize: 10, color: TEXT_MUTED, marginTop: 2 },
  rowDisabled: { opacity: 0.55 },
  badge: { borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3, marginLeft: 8 },
  badgeText: { fontSize: 13, fontWeight: '600' },
});
