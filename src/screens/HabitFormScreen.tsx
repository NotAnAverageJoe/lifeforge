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
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  cancelHabitReminders,
  scheduleHabitReminder,
} from '../notifications';
import { ABILITY_META, ABILITY_ORDER } from '../data/onboarding';
import { useAppStore } from '../store';
import { BG, BORDER, GOLD, GOLD_DIM, SURFACE, SURFACE2, TEXT, TEXT_DIM, TEXT_MUTED } from '../theme';
import type { AbilityScores, FrequencyType, Habit, RootStackParamList } from '../types';

type Nav = NativeStackNavigationProp<RootStackParamList, 'HabitForm'>;
type Route = RouteProp<RootStackParamList, 'HabitForm'>;

const COLORS = ['#8B1A1A', '#C9A84C', '#2D5016', '#1A2C5C', '#4A1A5C', '#8B6914'];
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

  const [name, setName] = useState(existing?.name ?? '');
  const [color, setColor] = useState(existing?.color ?? COLORS[0]);
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
  const [reminderOn, setReminderOn] = useState(!!existing?.reminder);
  const [reminderTime, setReminderTime] = useState<Date>(() => {
    if (existing?.reminder) {
      const [h, m] = existing.reminder.split(':').map(Number);
      const d = new Date();
      d.setHours(h, m, 0, 0);
      return d;
    }
    const d = new Date();
    d.setHours(9, 0, 0, 0);
    return d;
  });
  const [showTimePicker, setShowTimePicker] = useState(false);

  const timeLabel = reminderTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

  async function handleSave() {
    const trimmed = name.trim();
    if (!trimmed) {
      Alert.alert('A quest must have a name.');
      return;
    }

    const reminderStr = reminderOn
      ? `${String(reminderTime.getHours()).padStart(2, '0')}:${String(reminderTime.getMinutes()).padStart(2, '0')}`
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
    <SafeAreaView style={s.safe}>
      <StatusBar barStyle="light-content" />
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView contentContainerStyle={s.scroll} keyboardShouldPersistTaps="handled">
          <Text style={s.heading}>{existing ? 'Edit Quest' : 'New Quest'}</Text>

          {/* Name */}
          <Text style={s.label}>Quest Name</Text>
          <TextInput
            style={s.input}
            value={name}
            onChangeText={setName}
            placeholder="e.g. Morning training"
            placeholderTextColor={TEXT_MUTED}
            maxLength={60}
            autoFocus={!existing}
          />

          {/* Color — hidden when an ability is linked (uses ability color) */}
          {!linkedAbility && (
            <>
              <Text style={s.label}>Sigil Color</Text>
              <View style={s.colorRow}>
                {COLORS.map(c => (
                  <Pressable
                    key={c}
                    style={[s.colorDot, { backgroundColor: c }, color === c && s.colorSelected]}
                    onPress={() => setColor(c)}
                  />
                ))}
              </View>
            </>
          )}

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

          {/* Reminder */}
          <View style={s.reminderRow}>
            <Text style={s.label}>Reminder Bell</Text>
            <Switch
              value={reminderOn}
              onValueChange={setReminderOn}
              trackColor={{ true: effectiveColor }}
              thumbColor={TEXT}
            />
          </View>

          {reminderOn && (
            Platform.OS === 'ios' ? (
              <DateTimePicker
                value={reminderTime}
                mode="time"
                display="spinner"
                onChange={(_, date) => { if (date) setReminderTime(date); }}
                style={{ marginBottom: 16 }}
              />
            ) : (
              <>
                <Pressable style={[s.timeBtn, { borderColor: effectiveColor }]} onPress={() => setShowTimePicker(true)}>
                  <Text style={[s.timeBtnText, { color: effectiveColor }]}>🔔  {timeLabel}</Text>
                </Pressable>
                {showTimePicker && (
                  <DateTimePicker
                    value={reminderTime}
                    mode="time"
                    display="default"
                    onChange={(event, date) => {
                      setShowTimePicker(false);
                      if (event.type === 'set' && date) setReminderTime(date);
                    }}
                  />
                )}
              </>
            )
          )}
        </ScrollView>

        <View style={s.footer}>
          <Pressable style={s.cancelBtn} onPress={() => navigation.goBack()}>
            <Text style={s.cancelText}>Retreat</Text>
          </Pressable>
          <Pressable style={[s.saveBtn, { backgroundColor: effectiveColor }]} onPress={handleSave}>
            <Text style={s.saveText}>{existing ? 'Save Changes' : 'Forge Quest'}</Text>
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
  colorRow: { flexDirection: 'row', gap: 12, marginBottom: 20 },
  colorDot: { width: 32, height: 32, borderRadius: 16 },
  colorSelected: { borderWidth: 3, borderColor: GOLD },
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
  reminderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
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
    padding: 20,
    gap: 12,
    backgroundColor: BG,
    borderTopWidth: 1,
    borderTopColor: BORDER,
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: SURFACE,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: BORDER,
  },
  cancelText: { fontWeight: '700', color: TEXT_DIM, fontSize: 15, letterSpacing: 0.5 },
  saveBtn: { flex: 2, paddingVertical: 14, borderRadius: 12, alignItems: 'center' },
  saveText: { fontWeight: '700', color: TEXT, fontSize: 15, letterSpacing: 0.5 },
});
