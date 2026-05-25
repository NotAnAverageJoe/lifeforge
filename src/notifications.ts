import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import type { Habit } from './types';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export async function requestNotificationPermission(): Promise<boolean> {
  if (Platform.OS === 'web') return false;
  const { status: existing } = await Notifications.getPermissionsAsync();
  if (existing === 'granted') return true;
  const { status } = await Notifications.requestPermissionsAsync({
    ios: { allowAlert: true, allowBadge: true, allowSound: true },
  });
  return status === 'granted';
}

export async function scheduleHabitReminder(habit: Habit): Promise<string[]> {
  if (!habit.reminder) return [];
  const permitted = await requestNotificationPermission();
  if (!permitted) return [];

  const [hourStr, minuteStr] = habit.reminder.split(':');
  const hour = parseInt(hourStr, 10);
  const minute = parseInt(minuteStr, 10);
  if (isNaN(hour) || isNaN(minute)) return [];

  if (habit.frequency === 'weekly') {
    const days = habit.scheduledDays?.length ? habit.scheduledDays : [2];
    const ids = await Promise.all(
      days.map(weekday =>
        Notifications.scheduleNotificationAsync({
          content: { title: habit.name, body: "Don't forget your habit today!" },
          trigger: {
            type: Notifications.SchedulableTriggerInputTypes.WEEKLY,
            weekday,
            hour,
            minute,
          },
        })
      )
    );
    return ids;
  }

  const id = await Notifications.scheduleNotificationAsync({
    content: { title: habit.name, body: 'Time to complete your habit!' },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour,
      minute,
    },
  });
  return [id];
}

export async function cancelHabitReminders(notificationIds: string[]): Promise<void> {
  await Promise.all(notificationIds.map(id => Notifications.cancelScheduledNotificationAsync(id)));
}

const DAILY_NUDGE_KEY = 'daily_nudge_id';
import AsyncStorage from '@react-native-async-storage/async-storage';

export async function scheduleDailyNudge(): Promise<void> {
  const permitted = await requestNotificationPermission();
  if (!permitted) return;

  const existing = await AsyncStorage.getItem(DAILY_NUDGE_KEY);
  if (existing) {
    try {
      await Notifications.cancelScheduledNotificationAsync(existing);
    } catch { /* already cancelled */ }
  }

  const id = await Notifications.scheduleNotificationAsync({
    content: {
      title: "How are your habits going? 🔥",
      body: 'Check in to keep your streak alive!',
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour: 20,
      minute: 0,
    },
  });
  await AsyncStorage.setItem(DAILY_NUDGE_KEY, id);
}
