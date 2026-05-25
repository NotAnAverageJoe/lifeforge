import type { Habit } from './types';

export function todayKey(): string {
  return new Date().toISOString().slice(0, 10);
}

export function weekStartKey(dateStr: string): string {
  const d = new Date(dateStr + 'T12:00:00');
  const day = d.getDay(); // 0 = Sun
  const diff = day === 0 ? -6 : 1 - day; // shift to Monday
  d.setDate(d.getDate() + diff);
  return d.toISOString().slice(0, 10);
}

export function getCompletionCount(habit: Habit, date: string): number {
  return habit.completions[date] ?? 0;
}

export function isScheduledForDate(habit: Habit, dateStr: string): boolean {
  if (habit.frequency !== 'weekly') return true;
  const days = habit.scheduledDays;
  if (!days || days.length === 0) return true;
  const d = new Date(dateStr + 'T12:00:00');
  const appDay = d.getDay() + 1; // 1=Sun, 2=Mon, ..., 7=Sat
  return days.includes(appDay);
}

export function isDoneToday(habit: Habit): boolean {
  const today = todayKey();
  const count = habit.completions[today] ?? 0;
  if (habit.frequency === 'multiple') return count >= habit.timesPerDay;
  return count >= 1;
}

export function getTodayCount(habit: Habit): number {
  if (habit.frequency === 'weekly') return isDoneToday(habit) ? 1 : 0;
  return habit.completions[todayKey()] ?? 0;
}

export function currentStreak(habit: Habit): number {
  const today = todayKey();
  const yesterday = offsetDate(today, -1);

  if (habit.frequency === 'weekly') {
    const thisWeek = weekStartKey(today);
    const lastWeek = weekStartKey(yesterday);
    const hasThis = Object.keys(habit.completions).some(d => weekStartKey(d) === thisWeek);
    const hasLast = Object.keys(habit.completions).some(d => weekStartKey(d) === lastWeek);
    if (!hasThis && !hasLast) return 0;
    let streak = 0;
    let checkWeek = hasThis ? thisWeek : lastWeek;
    while (true) {
      const found = Object.keys(habit.completions).some(d => weekStartKey(d) === checkWeek);
      if (!found) break;
      streak++;
      checkWeek = offsetDate(checkWeek, -7);
    }
    return streak;
  }

  const fullDays = new Set(
    Object.entries(habit.completions)
      .filter(([, c]) => c >= habit.timesPerDay)
      .map(([d]) => d)
  );
  if (!fullDays.has(today) && !fullDays.has(yesterday)) return 0;
  let streak = 0;
  let check = fullDays.has(today) ? today : yesterday;
  while (fullDays.has(check)) {
    streak++;
    check = offsetDate(check, -1);
  }
  return streak;
}

function offsetDate(dateStr: string, days: number): string {
  const d = new Date(dateStr + 'T12:00:00');
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

export function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

export function getFirstDayOfMonth(year: number, month: number): number {
  return new Date(year, month, 1).getDay(); // 0=Sun
}

export function totalCompletionsOnDate(habits: Habit[], date: string): number {
  return habits.reduce((sum, h) => {
    if (h.frequency === 'weekly') {
      const weekStart = weekStartKey(date);
      const done = Object.keys(h.completions).some(d => weekStartKey(d) === weekStart && h.completions[d] > 0);
      return sum + (done ? 1 : 0);
    }
    return sum + (h.completions[date] ?? 0);
  }, 0);
}

export function maxPossibleOnDate(habits: Habit[]): number {
  return habits.reduce((sum, h) => sum + h.timesPerDay, 0);
}
