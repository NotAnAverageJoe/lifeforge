import React, { useMemo } from 'react';
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
import { currentStreak, isDoneToday } from '../dates';
import { useAppStore } from '../store';
import { BG, BORDER, CRIMSON, GOLD, GOLD_DIM, SURFACE, SURFACE2, TEXT, TEXT_DIM, TEXT_MUTED } from '../theme';
import { getLevelInfo, XP_DAILY, XP_PER_REP, XP_WEEKLY } from '../xp';

export default function ProfileScreen() {
  const { state, addXp, resetXp, deleteCharacter, clearAll } = useAppStore();
  const { habits, totalXp } = state;
  const { level, currentXp, nextLevelXp } = getLevelInfo(totalXp);
  const pct = nextLevelXp > 0 ? currentXp / nextLevelXp : 0;

  const stats = useMemo(() => {
    const doneToday = habits.filter(h => isDoneToday(h)).length;
    const bestStreak = habits.reduce((max, h) => Math.max(max, currentStreak(h)), 0);
    const totalCompletions = habits.reduce(
      (sum, h) => sum + Object.values(h.completions).reduce((s, c) => s + c, 0),
      0
    );
    const earliest = habits.reduce<string | null>((min, h) => {
      if (!min) return h.createdAt;
      return h.createdAt < min ? h.createdAt : min;
    }, null);
    return { doneToday, bestStreak, totalCompletions, earliest };
  }, [habits, totalXp]);

  const since = stats.earliest
    ? new Date(stats.earliest).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
    : '—';

  return (
    <SafeAreaView style={s.safe}>
      <StatusBar barStyle="light-content" />
      <ScrollView contentContainerStyle={s.scroll}>
        <Text style={s.heading}>The Adventurer</Text>

        {/* Rank card */}
        <View style={s.rankCard}>
          <View style={s.rankCircle}>
            <Text style={s.rankNum}>{level}</Text>
            <Text style={s.rankLabel}>RANK</Text>
          </View>
          <View style={s.xpSection}>
            <View style={s.xpRow}>
              <Text style={s.xpTitle}>Experience</Text>
              <Text style={s.xpFraction}>{currentXp} / {nextLevelXp} XP</Text>
            </View>
            <View style={s.track}>
              <View style={[s.fill, { width: `${pct * 100}%` }]} />
            </View>
            <Text style={s.xpSub}>{nextLevelXp - currentXp} XP to Rank {level + 1}</Text>
          </View>
        </View>

        {/* Total XP */}
        <View style={s.totalXpBadge}>
          <Text style={s.totalXpNum}>{totalXp.toLocaleString()}</Text>
          <Text style={s.totalXpLabel}>Total XP earned</Text>
        </View>

        {/* Stats grid */}
        <View style={s.grid}>
          <StatBox label="Quests" value={String(habits.length)} icon="📋" />
          <StatBox label="Slain Today" value={`${stats.doneToday}/${habits.length}`} icon="⚔️" />
          <StatBox label="Best Streak" value={`${stats.bestStreak}d`} icon="🔥" />
          <StatBox label="Total Victories" value={String(stats.totalCompletions)} icon="🏆" />
        </View>

        {stats.earliest && (
          <Text style={s.since}>Adventuring since {since}</Text>
        )}

        {/* XP lore */}
        <View style={s.lore}>
          <Text style={s.loreTitle}>— The Way of the Realm —</Text>
          <Text style={s.loreLine}>⚔️  Complete a daily quest → +{XP_DAILY} XP</Text>
          <Text style={s.loreLine}>📜  Complete a weekly quest → +{XP_WEEKLY} XP</Text>
          <Text style={s.loreLine}>🔁  Each rep (multiple quest) → +{XP_PER_REP} XP</Text>
          <Text style={s.loreLine}>📈  Each rank demands greater deeds</Text>
        </View>

        {/* Dev tools */}
        <View style={s.devSection}>
          <Text style={s.devTitle}>— Dungeon Master Tools —</Text>
          <View style={s.devRow}>
            <DevBtn label="+100 XP" onPress={() => addXp(100)} />
            <DevBtn
              label="Next Rank"
              onPress={() => {
                const { currentXp, nextLevelXp } = getLevelInfo(totalXp);
                addXp(nextLevelXp - currentXp);
              }}
            />
          </View>
          <View style={s.devRow}>
            <DevBtn
              label="Reset XP"
              danger
              onPress={() =>
                Alert.alert('Reset XP?', 'Set total XP back to 0?', [
                  { text: 'Cancel', style: 'cancel' },
                  { text: 'Reset', style: 'destructive', onPress: resetXp },
                ])
              }
            />
            <DevBtn
              label="New Character"
              danger
              onPress={() =>
                Alert.alert('Re-roll Character?', 'Run onboarding again? Your quests and XP are kept.', [
                  { text: 'Cancel', style: 'cancel' },
                  { text: 'Re-roll', style: 'destructive', onPress: deleteCharacter },
                ])
              }
            />
          </View>
          <View style={s.devRow}>
            <DevBtn
              label="Clear All Data"
              danger
              onPress={() =>
                Alert.alert('Clear All Data?', 'Wipe all quests, XP, and character?', [
                  { text: 'Cancel', style: 'cancel' },
                  { text: 'Wipe', style: 'destructive', onPress: clearAll },
                ])
              }
            />
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function DevBtn({ label, onPress, danger }: { label: string; onPress: () => void; danger?: boolean }) {
  return (
    <Pressable
      style={({ pressed }) => [db.btn, danger && db.dangerBtn, pressed && db.pressed]}
      onPress={onPress}
    >
      <Text style={[db.label, danger && db.dangerLabel]}>{label}</Text>
    </Pressable>
  );
}

function StatBox({ label, value, icon }: { label: string; value: string; icon: string }) {
  return (
    <View style={sb.box}>
      <Text style={sb.icon}>{icon}</Text>
      <Text style={sb.value}>{value}</Text>
      <Text style={sb.label}>{label}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: BG },
  scroll: { padding: 20, paddingBottom: 40 },
  heading: { fontSize: 28, fontWeight: '800', color: GOLD, letterSpacing: 1, marginBottom: 20 },
  rankCard: {
    backgroundColor: SURFACE,
    borderRadius: 18,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 20,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: BORDER,
  },
  rankCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: BG,
    borderWidth: 2,
    borderColor: GOLD,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rankNum: { fontSize: 28, fontWeight: '900', color: GOLD, lineHeight: 32 },
  rankLabel: { fontSize: 9, fontWeight: '800', color: TEXT_DIM, letterSpacing: 2 },
  xpSection: { flex: 1 },
  xpRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  xpTitle: { fontSize: 14, fontWeight: '700', color: TEXT },
  xpFraction: { fontSize: 12, color: TEXT_DIM },
  track: {
    height: 10,
    borderRadius: 5,
    backgroundColor: SURFACE2,
    overflow: 'hidden',
    marginBottom: 6,
    borderWidth: 1,
    borderColor: BORDER,
  },
  fill: { height: '100%', backgroundColor: GOLD, borderRadius: 5 },
  xpSub: { fontSize: 11, color: TEXT_MUTED },
  totalXpBadge: {
    backgroundColor: GOLD_DIM,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: GOLD,
    paddingVertical: 14,
    alignItems: 'center',
    marginBottom: 16,
  },
  totalXpNum: { fontSize: 26, fontWeight: '800', color: GOLD },
  totalXpLabel: { fontSize: 12, color: TEXT_DIM, marginTop: 2 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 16 },
  since: { fontSize: 13, color: TEXT_MUTED, textAlign: 'center', marginBottom: 20, fontStyle: 'italic' },
  lore: {
    backgroundColor: SURFACE,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: BORDER,
    padding: 16,
    gap: 8,
  },
  loreTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: GOLD,
    textAlign: 'center',
    letterSpacing: 1.5,
    marginBottom: 4,
  },
  loreLine: { fontSize: 14, color: TEXT_DIM, lineHeight: 20 },
  devSection: {
    marginTop: 24,
    backgroundColor: SURFACE,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: BORDER,
    padding: 16,
    gap: 10,
  },
  devTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: TEXT_MUTED,
    textAlign: 'center',
    letterSpacing: 1.5,
    marginBottom: 4,
  },
  devRow: { flexDirection: 'row', gap: 10 },
});

const db = StyleSheet.create({
  btn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: SURFACE2,
    borderWidth: 1,
    borderColor: BORDER,
    alignItems: 'center',
  },
  dangerBtn: { borderColor: CRIMSON, backgroundColor: '#1A0A0A' },
  pressed: { opacity: 0.65 },
  label: { fontSize: 13, fontWeight: '700', color: GOLD, letterSpacing: 0.5 },
  dangerLabel: { color: '#E05050' },
});

const sb = StyleSheet.create({
  box: {
    width: '47%',
    backgroundColor: SURFACE,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: BORDER,
    padding: 16,
    alignItems: 'center',
  },
  icon: { fontSize: 24, marginBottom: 6 },
  value: { fontSize: 22, fontWeight: '800', color: GOLD },
  label: { fontSize: 12, color: TEXT_DIM, marginTop: 2 },
});
