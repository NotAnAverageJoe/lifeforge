import * as Haptics from 'expo-haptics';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import React, { useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  cancelHabitReminders,
  scheduleHabitReminder,
} from '../notifications';
import { ABILITY_META, ABILITY_ORDER } from '../data/onboarding';
import { useAppStore } from '../store';
import { BG, BORDER, GOLD, GOLD_DIM, SEPARATOR, SURFACE, SURFACE2, TEXT, TEXT_DIM, TEXT_MUTED } from '../theme';
import type { AbilityScores, FrequencyType, Habit, RootStackParamList } from '../types';

type Nav = NativeStackNavigationProp<RootStackParamList, 'HabitForm'>;
type Route = RouteProp<RootStackParamList, 'HabitForm'>;

const QUICK_HABITS: { name: string; ability: keyof AbilityScores }[] = [
  { name: 'Go to the gym',      ability: 'strength' },
  { name: 'Morning stretch',    ability: 'dexterity' },
  { name: 'Sleep 8 hours',      ability: 'constitution' },
  { name: 'Read 20 minutes',    ability: 'intelligence' },
  { name: 'Meditate',           ability: 'wisdom' },
  { name: 'Call a friend',      ability: 'charisma' },
];

const FREQ_OPTIONS: { key: FrequencyType; label: string }[] = [
  { key: 'daily', label: 'Daily' },
  { key: 'weekly', label: 'Weekly' },
  { key: 'multiple', label: 'Multiple/day' },
];

const WEEK_DAYS = [
  { label: 'Mo', value: 2 },
  { label: 'Tu', value: 3 },
  { label: 'We', value: 4 },
  { label: 'Th', value: 5 },
  { label: 'Fr', value: 6 },
  { label: 'Sa', value: 7 },
  { label: 'Su', value: 1 },
];

export default function HabitFormScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<Route>();
  const { state, addHabit, updateHabit } = useAppStore();
  const editId = route.params?.habitId;
  const existing = editId ? state.habits.find(h => h.id === editId) : undefined;

  const insets = useSafeAreaInsets();

  const [name, setName] = useState(existing?.name ?? '');
  const [color] = useState(existing?.color ?? GOLD);
  const [frequency, setFrequency] = useState<FrequencyType>(existing?.frequency ?? 'daily');
  const [timesPerDay, setTimesPerDay] = useState(existing?.timesPerDay ?? 2);
  const [scheduledDays, setScheduledDays] = useState<number[]>(existing?.scheduledDays ?? [2]);
  const [linkedAbility, setLinkedAbility] = useState<keyof AbilityScores | undefined>(existing?.linkedAbility);

  const effectiveColor = linkedAbility ? ABILITY_META[linkedAbility].color : color;

  function toggleDay(v: number) {
    setScheduledDays(days =>
      days.includes(v)
        ? days.length > 1 ? days.filter(d => d !== v) : days
        : [...days, v].sort((a, b) => a - b)
    );
  }
  const [scheduledTimeOn, setScheduledTimeOn] = useState(!!existing?.scheduledTime);
  const [scheduledTime, setScheduledTime] = useState<Date>(() => {
    if (existing?.scheduledTime) {
      const [h, m] = existing.scheduledTime.split(':').map(Number);
      const d = new Date();
      d.setHours(h, m, 0, 0);
      return d;
    }
    const d = new Date();
    d.setHours(9, 0, 0, 0);
    return d;
  });
  const [showScheduledTimePicker, setShowScheduledTimePicker] = useState(false);
  const scheduledTimeLabel = scheduledTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

  const [reminderOn, setReminderOn] = useState(!!existing?.reminder);

  async function handleQuickAdd(qh: typeof QUICK_HABITS[0]) {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const habit: Habit = {
      id: Date.now().toString(),
      name: qh.name,
      color: ABILITY_META[qh.ability].color,
      frequency: 'daily',
      timesPerDay: 1,
      scheduledTime: null,
      reminder: null,
      notificationIds: [],
      completions: {},
      createdAt: new Date().toISOString(),
      linkedAbility: qh.ability,
    };
    addHabit(habit);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    navigation.goBack();
  }

  async function handleSave() {
    const trimmed = name.trim();
    if (!trimmed) {
      Alert.alert('A side quest must have a name.');
      return;
    }

    const scheduledTimeStr = scheduledTimeOn
      ? `${String(scheduledTime.getHours()).padStart(2, '0')}:${String(scheduledTime.getMinutes()).padStart(2, '0')}`
      : null;

    const reminderStr = reminderOn && scheduledTimeOn
      ? (() => {
          const d = new Date(scheduledTime);
          d.setMinutes(d.getMinutes() - 5);
          return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
        })()
      : null;

    if (existing) {
      if (existing.notificationIds.length) {
        await cancelHabitReminders(existing.notificationIds);
      }
      const updated: Habit = {
        ...existing,
        name: trimmed,
        color: effectiveColor,
        frequency,
        timesPerDay: frequency === 'multiple' ? timesPerDay : 1,
        scheduledDays: frequency === 'weekly' ? scheduledDays : undefined,
        scheduledTime: scheduledTimeStr,
        reminder: reminderStr,
        notificationIds: [],
        linkedAbility,
      };
      const ids = await scheduleHabitReminder({ ...updated, notificationIds: [] });
      updateHabit({ ...updated, notificationIds: ids });
    } else {
      const habit: Habit = {
        id: Date.now().toString(),
        name: trimmed,
        color: effectiveColor,
        frequency,
        timesPerDay: frequency === 'multiple' ? timesPerDay : 1,
        scheduledDays: frequency === 'weekly' ? scheduledDays : undefined,
        scheduledTime: scheduledTimeStr,
        reminder: reminderStr,
        notificationIds: [],
        completions: {},
        createdAt: new Date().toISOString(),
        linkedAbility,
      };
      const ids = await scheduleHabitReminder(habit);
      addHabit({ ...habit, notificationIds: ids });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }

    navigation.goBack();
  }

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      <StatusBar barStyle="light-content" />
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView contentContainerStyle={s.scroll} keyboardShouldPersistTaps="handled">
          <Text style={s.heading}>{existing ? 'Edit Side Quest' : 'New Side Quest'}</Text>

          {/* Quick Habits — new only */}
          {!existing && (
            <>
              <Text style={s.label}>Quick Habits</Text>
              <Text style={[s.sublabel, { marginTop: -6, marginBottom: 12 }]}>One tap to forge an instant quest</Text>
              {[QUICK_HABITS.slice(0, 3), QUICK_HABITS.slice(3)].map((row, ri) => (
                <View key={ri} style={s.quickRow}>
                  {row.map(qh => {
                    const meta = ABILITY_META[qh.ability];
                    return (
                      <Pressable
                        key={qh.ability}
                        style={({ pressed }) => [
                          s.quickCard,
                          { borderColor: meta.color + '60', backgroundColor: meta.color + '12' },
                          pressed && { opacity: 0.7 },
                        ]}
                        onPress={() => handleQuickAdd(qh)}
                      >
                        <Text style={s.quickCardIcon}>{meta.icon}</Text>
                        <Text style={[s.quickCardAbility, { color: meta.color }]}>{meta.abbr}</Text>
                        <Text style={s.quickCardName}>{qh.name}</Text>
                      </Pressable>
                    );
                  })}
                </View>
              ))}
              <View style={s.orRow}>
                <View style={s.orLine} />
                <Text style={s.orLabel}>OR BUILD YOUR OWN</Text>
                <View style={s.orLine} />
              </View>
            </>
          )}

          {/* Name */}
          <Text style={s.label}>Side Quest Name</Text>
          <TextInput
            style={s.input}
            value={name}
            onChangeText={setName}
            placeholder="e.g. Morning training"
            placeholderTextColor={TEXT_MUTED}
            maxLength={60}
            autoFocus={!existing}
          />

          {/* Frequency */}
          <Text style={s.label}>Recurrence</Text>
          <View style={s.segRow}>
            {FREQ_OPTIONS.map(opt => (
              <Pressable
                key={opt.key}
                style={[s.seg, frequency === opt.key && { backgroundColor: effectiveColor }]}
                onPress={() => setFrequency(opt.key)}
              >
                <Text style={[s.segText, frequency === opt.key && s.segTextActive]}>
                  {opt.label}
                </Text>
              </Pressable>
            ))}
          </View>

          {/* Days of week picker — weekly only, multi-select */}
          {frequency === 'weekly' && (
            <>
              <Text style={s.label}>Days of the Week</Text>
              <View style={s.dayRow}>
                {WEEK_DAYS.map(day => (
                  <Pressable
                    key={day.value}
                    style={[s.dayBtn, scheduledDays.includes(day.value) && { backgroundColor: effectiveColor }]}
                    onPress={() => toggleDay(day.value)}
                  >
                    <Text style={[s.dayBtnText, scheduledDays.includes(day.value) && s.dayBtnTextActive]}>
                      {day.label}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </>
          )}

          {/* Times per day — multiple only */}
          {frequency === 'multiple' && (
            <>
              <Text style={s.label}>Times per day</Text>
              <View style={s.stepperRow}>
                <Pressable style={s.stepBtn} onPress={() => setTimesPerDay(t => Math.max(2, t - 1))}>
                  <Text style={s.stepBtnText}>−</Text>
                </Pressable>
                <Text style={s.stepVal}>{timesPerDay}</Text>
                <Pressable style={s.stepBtn} onPress={() => setTimesPerDay(t => Math.min(20, t + 1))}>
                  <Text style={s.stepBtnText}>+</Text>
                </Pressable>
              </View>
            </>
          )}

          {/* Linked Ability */}
          <Text style={s.label}>Linked Ability</Text>
          <Text style={s.sublabel}>XP earned on completion goes to this ability</Text>
          <View style={s.abilRow}>
            {ABILITY_ORDER.map(key => {
              const meta = ABILITY_META[key];
              const selected = linkedAbility === key;
              return (
                <Pressable
                  key={key}
                  style={[
                    s.abilChip,
                    selected && { backgroundColor: meta.color + '30', borderColor: meta.color },
                  ]}
                  onPress={() => setLinkedAbility(selected ? undefined : key)}
                >
                  <Text style={s.abilChipIcon}>{meta.icon}</Text>
                  <Text style={[s.abilChipText, selected && { color: meta.color }]}>{meta.abbr}</Text>
                </Pressable>
              );
            })}
          </View>

          {/* Scheduled Time */}
          <View style={s.toggleRow}>
            <Text style={s.label}>Scheduled Time</Text>
            <Switch
              value={scheduledTimeOn}
              onValueChange={setScheduledTimeOn}
              trackColor={{ true: effectiveColor }}
              thumbColor={TEXT}
            />
          </View>
          <Text style={[s.sublabel, { marginTop: -8 }]}>When this habit takes place each day</Text>

          {scheduledTimeOn && (
            Platform.OS === 'ios' ? (
              <DateTimePicker
                value={scheduledTime}
                mode="time"
                display="spinner"
                onChange={(_, date) => { if (date) setScheduledTime(date); }}
                style={{ marginBottom: 16 }}
              />
            ) : (
              <>
                <Pressable style={[s.timeBtn, { borderColor: effectiveColor }]} onPress={() => setShowScheduledTimePicker(true)}>
                  <Text style={[s.timeBtnText, { color: effectiveColor }]}>🕐  {scheduledTimeLabel}</Text>
                </Pressable>
                {showScheduledTimePicker && (
                  <DateTimePicker
                    value={scheduledTime}
                    mode="time"
                    display="default"
                    onChange={(event, date) => {
                      setShowScheduledTimePicker(false);
                      if (event.type === 'set' && date) setScheduledTime(date);
                    }}
                  />
                )}
              </>
            )
          )}

          {/* Reminder */}
          {scheduledTimeOn && (
            <Pressable style={s.checkboxRow} onPress={() => setReminderOn(v => !v)}>
              <View style={[s.checkbox, reminderOn && { backgroundColor: effectiveColor, borderColor: effectiveColor }]}>
                {reminderOn && <Text style={s.checkboxMark}>✓</Text>}
              </View>
              <View style={{ flex: 1 }}>
                <Text style={s.label}>Set reminder</Text>
                <Text style={s.sublabel}>Notifies 5 minutes before scheduled time</Text>
              </View>
            </Pressable>
          )}
        </ScrollView>

        <View style={[s.footer, { paddingBottom: Math.max(8, Math.floor(insets.bottom / 2)) }]}>
          <Pressable
            style={({ pressed }) => [s.cancelBtn, pressed && { opacity: 0.6 }]}
            onPress={() => navigation.goBack()}
          >
            <Text style={s.cancelText}>Retreat</Text>
          </Pressable>
          <Pressable style={[s.saveBtn, { backgroundColor: effectiveColor }]} onPress={handleSave}>
            <Text style={s.saveText}>{existing ? 'Save Changes' : 'Forge Side Quest'}</Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: BG },
  scroll: { padding: 20, paddingBottom: 8 },
  heading: { fontSize: 26, fontWeight: '800', color: GOLD, letterSpacing: 1, marginBottom: 24 },
  label: {
    fontSize: 11,
    fontWeight: '700',
    color: TEXT_DIM,
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 1.5,
  },
  input: {
    backgroundColor: SURFACE,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: BORDER,
    padding: 14,
    fontSize: 16,
    color: TEXT,
    marginBottom: 20,
  },
  quickRow: { flexDirection: 'row', gap: 8, marginBottom: 8 },
  quickCard: {
    flex: 1, borderRadius: 10, borderWidth: 1,
    paddingVertical: 12, paddingHorizontal: 4, alignItems: 'center', gap: 4,
  },
  quickCardIcon: { fontSize: 20 },
  quickCardAbility: { fontSize: 8, fontWeight: '800', letterSpacing: 1.5 },
  quickCardName: { fontSize: 10, color: TEXT_DIM, textAlign: 'center', lineHeight: 14, fontWeight: '600' },
  orRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 8, marginBottom: 20 },
  orLine: { flex: 1, height: 1, backgroundColor: SEPARATOR },
  orLabel: { fontSize: 9, fontWeight: '800', color: TEXT_MUTED, letterSpacing: 1.5 },
  segRow: { flexDirection: 'row', gap: 8, marginBottom: 20 },
  seg: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: SURFACE2,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: BORDER,
  },
  segText: { fontSize: 13, fontWeight: '600', color: TEXT_DIM },
  segTextActive: { color: TEXT },
  dayRow: { flexDirection: 'row', gap: 6, marginBottom: 20 },
  dayBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: SURFACE2,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: BORDER,
  },
  dayBtnText: { fontSize: 13, fontWeight: '700', color: TEXT_DIM },
  dayBtnTextActive: { color: TEXT },
  stepperRow: { flexDirection: 'row', alignItems: 'center', gap: 20, marginBottom: 20 },
  stepBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: SURFACE2,
    borderWidth: 1,
    borderColor: BORDER,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepBtnText: { fontSize: 22, color: TEXT, lineHeight: 26 },
  stepVal: { fontSize: 22, fontWeight: '700', color: GOLD, minWidth: 30, textAlign: 'center' },
  sublabel: { fontSize: 11, color: TEXT_MUTED, marginBottom: 10, marginTop: -4 },
  abilRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 20 },
  abilChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 10,
    backgroundColor: SURFACE2,
    borderWidth: 1,
    borderColor: BORDER,
  },
  abilChipIcon: { fontSize: 14 },
  abilChipText: { fontSize: 12, fontWeight: '700', color: TEXT_DIM, letterSpacing: 0.5 },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginBottom: 20,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: BORDER,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  checkboxMark: { color: TEXT, fontSize: 13, fontWeight: '700' },
  timeBtn: {
    borderRadius: 10,
    borderWidth: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginBottom: 20,
    backgroundColor: GOLD_DIM,
  },
  timeBtnText: { fontSize: 15, fontWeight: '600' },
  footer: {
    flexDirection: 'row',
    paddingTop: 10,
    paddingHorizontal: 16,
    gap: 12,
    backgroundColor: BG,
    borderTopWidth: 1,
    borderTopColor: BORDER,
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 11,
    borderRadius: 12,
    backgroundColor: SURFACE,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: BORDER,
  },
  cancelText: { fontWeight: '700', color: TEXT_DIM, fontSize: 15, letterSpacing: 0.5 },
  saveBtn: { flex: 2, paddingVertical: 11, borderRadius: 12, alignItems: 'center' },
  saveText: { fontWeight: '700', color: TEXT, fontSize: 15, letterSpacing: 0.5 },
});
