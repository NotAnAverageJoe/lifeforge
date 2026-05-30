import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import type { Habit } from './types';

// Expo Go dropped expo-notifications support in SDK 53. Skip all notification
// setup when running there so the app works without errors during development.
const IS_EXPO_GO = Constants.appOwnership === 'expo';

if (!IS_EXPO_GO) {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
      shouldShowBanner: true,
      shouldShowList: true,
    }),
  });
}

export async function requestNotificationPermission(): Promise<boolean> {
  if (Platform.OS === 'web' || IS_EXPO_GO) return false;
  const { status: existing } = await Notifications.getPermissionsAsync();
  if (existing === 'granted') return true;
  const { status } = await Notifications.requestPermissionsAsync({
    ios: { allowAlert: true, allowBadge: true, allowSound: true },
  });
  return status === 'granted';
}

export async function scheduleHabitReminder(habit: Habit): Promise<string[]> {
  if (!habit.reminder || IS_EXPO_GO) return [];
  const permitted = await requestNotificationPermission();
  if (!permitted) return [];

  const [hourStr, minuteStr] = habit.reminder.split(':');
  const hour = parseInt(hourStr, 10);
  const minute = parseInt(minuteStr, 10);
  if (isNaN(hour) || isNaN(minute)) return [];

  const leadMinutes = habit.reminderLeadMinutes ?? 5;
  const body = `Starting in ${leadMinutes} minute${leadMinutes === 1 ? '' : 's'}!`;

  if (habit.frequency === 'weekly') {
    const days = habit.scheduledDays?.length ? habit.scheduledDays : [2];
    const ids = await Promise.all(
      days.map(weekday =>
        Notifications.scheduleNotificationAsync({
          content: { title: habit.name, body },
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
    content: { title: habit.name, body },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour,
      minute,
    },
  });
  return [id];
}

export async function notifyCampaignAvailable(campaignTitle: string): Promise<void> {
  if (IS_EXPO_GO) return;
  const permitted = await requestNotificationPermission();
  if (!permitted) return;
  await Notifications.scheduleNotificationAsync({
    content: {
      title: '⚔️ New Campaign Available!',
      body: `"${campaignTitle}" is ready. Your adventure awaits.`,
    },
    trigger: null,
  });
}

export async function notifyChapterAvailable(campaignTitle: string, chapterName: string): Promise<void> {
  if (IS_EXPO_GO) return;
  const permitted = await requestNotificationPermission();
  if (!permitted) return;
  await Notifications.scheduleNotificationAsync({
    content: {
      title: `📖 New Chapter: ${chapterName}`,
      body: `A new chapter has opened in "${campaignTitle}". Continue your journey.`,
    },
    trigger: null,
  });
}

export async function cancelHabitReminders(notificationIds: string[]): Promise<void> {
  if (IS_EXPO_GO) return;
  await Promise.all(notificationIds.map(id => Notifications.cancelScheduledNotificationAsync(id)));
}

export async function cancelAllNotifications(): Promise<void> {
  if (IS_EXPO_GO) return;
  await Notifications.cancelAllScheduledNotificationsAsync();
  await AsyncStorage.removeItem(DAILY_NUDGE_KEY);
}

const DAILY_NUDGE_KEY = 'daily_nudge_id';
import AsyncStorage from '@react-native-async-storage/async-storage';

export async function scheduleDailyNudge(): Promise<void> {
  if (IS_EXPO_GO) return;
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
