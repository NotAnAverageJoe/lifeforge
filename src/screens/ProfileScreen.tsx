import { MaterialCommunityIcons } from '@expo/vector-icons';
import React, { useMemo } from 'react';
import {
  Alert,
  Linking,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { currentStreak, isDoneToday } from '../dates';
import { supabase } from '../lib/supabase';
import { clearAllRemote } from '../lib/sync';
import { useAppStore } from '../store';
import {
  BG, BORDER, CRIMSON, GOLD, GOLD_DIM, SEPARATOR, SURFACE, SURFACE2,
  TEXT, TEXT_DIM, TEXT_MUTED,
} from '../theme';
import { getLevelInfo, XP_DAILY, XP_PER_REP, XP_WEEKLY } from '../xp';

export default function ProfileScreen() {
  const { state, addXp, resetXp, deleteCharacter, clearAll, resetCampaigns } = useAppStore();
  const { habits, totalXp, character } = state;
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
  }, [habits]);

  const since = stats.earliest
    ? new Date(stats.earliest).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
    : null;

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      <StatusBar barStyle="light-content" />
      <ScrollView contentContainerStyle={s.scroll}>

        {/* Page label */}
        <Text style={s.pageLabel}>HERO</Text>
        <View style={s.titleRule} />

        {/* Character header card */}
        <View style={s.heroCard}>
          {/* Rank circle — prominent, D&D Beyond style */}
          <View style={s.rankCircle}>
            <Text style={s.rankNum}>{level}</Text>
            <Text style={s.rankLabel}>RANK</Text>
          </View>

          {character && (
            <View style={s.heroInfo}>
              <Text style={s.heroName}>{character.name}</Text>
              <Text style={s.heroClass}>{character.characterClass.toUpperCase()}</Text>
            </View>
          )}

          {/* XP section */}
          <View style={s.xpSection}>
            <View style={s.xpRow}>
              <Text style={s.xpLabel}>EXPERIENCE</Text>
              <Text style={s.xpFraction}>{currentXp.toLocaleString()} / {nextLevelXp.toLocaleString()} XP</Text>
            </View>
            <View style={s.xpTrack}>
              <View style={[s.xpFill, { width: `${pct * 100}%` }]} />
            </View>
            <Text style={s.xpSub}>{(nextLevelXp - currentXp).toLocaleString()} XP to Rank {level + 1}</Text>
          </View>
        </View>

        {/* Total XP banner */}
        <View style={s.totalBanner}>
          <Text style={s.totalNum}>{totalXp.toLocaleString()}</Text>
          <Text style={s.totalLabel}>TOTAL XP EARNED</Text>
        </View>

        {/* Stats grid */}
        <SectionLabel title="CHRONICLE" />
        <View style={s.statsGrid}>
          <StatCell icon="clipboard-list" value={String(habits.length)} label="Active Quests" />
          <StatCell icon="sword" value={`${stats.doneToday}/${habits.length}`} label="Slain Today" />
          <StatCell icon="fire" value={`${stats.bestStreak}d`} label="Best Streak" />
          <StatCell icon="trophy" value={stats.totalCompletions.toLocaleString()} label="Total Victories" />
        </View>

        {since && <Text style={s.since}>Adventuring since {since}</Text>}

        {/* XP lore */}
        <SectionLabel title="THE WAY OF THE REALM" />
        <View style={s.loreCard}>
          <LoreLine icon="sword" text={`Daily quest complete  →  +${XP_DAILY} XP`} />
          <View style={s.loreDivider} />
          <LoreLine icon="format-list-text" text={`Weekly quest complete  →  +${XP_WEEKLY} XP`} />
          <View style={s.loreDivider} />
          <LoreLine icon="repeat-variant" text={`Each rep (multiple quest)  →  +${XP_PER_REP} XP`} />
          <View style={s.loreDivider} />
          <LoreLine icon="trending-up" text="Each rank demands greater deeds" />
        </View>

        {/* Account */}
        <SectionLabel title="ACCOUNT" muted />
        <View style={s.devCard}>
          <Pressable
            style={({ pressed }) => [db.btn, pressed && { opacity: 0.6 }]}
            onPress={() =>
              Alert.alert('Sign Out?', 'You can sign back in any time — your data is safe.', [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Sign Out', style: 'destructive', onPress: () => supabase.auth.signOut() },
              ])
            }
          >
            <Text style={db.label}>Sign Out</Text>
          </Pressable>
        </View>

        {/* Credits */}
        <SectionLabel title="CREDITS" muted />
        <View style={s.devCard}>
          <Text style={cr.line}>Class icons by{' '}
            <Text
              style={cr.link}
              onPress={() => Linking.openURL('https://github.com/intrinsical/tw-dnd')}
            >intrinsical</Text>
            {' '}· tw-dnd · GPL-3.0
          </Text>
        </View>

        {/* Dev tools */}
        <SectionLabel title="DUNGEON MASTER TOOLS" muted />
        <View style={s.devCard}>
          <View style={s.devRow}>
            <DevBtn label="+100 XP" onPress={() => addXp(100)} />
            <DevBtn
              label="Next Rank"
              onPress={() => {
                const { currentXp: cx, nextLevelXp: nx } = getLevelInfo(totalXp);
                addXp(nx - cx);
              }}
            />
          </View>
          <View style={s.devRow}>
            <DevBtn label="Reset XP" danger onPress={() =>
              Alert.alert('Reset XP?', 'Set total XP back to 0?', [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Reset', style: 'destructive', onPress: resetXp },
              ])} />
            <DevBtn label="New Character" danger onPress={() =>
              Alert.alert('Re-roll Character?', 'Run onboarding again? Quests and XP are kept.', [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Re-roll', style: 'destructive', onPress: deleteCharacter },
              ])} />
          </View>
          <View style={s.devRow}>
            <DevBtn label="Reset Campaigns" danger onPress={() =>
              Alert.alert('Reset Campaign Progress?', 'All completed campaigns will be marked as available again.', [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Reset', style: 'destructive', onPress: resetCampaigns },
              ])} />
          </View>
          <DevBtn label="Clear All Data" danger onPress={() =>
            Alert.alert('Clear All Data?', 'Wipe all quests, XP, character, and cloud data?', [
              { text: 'Cancel', style: 'cancel' },
              { text: 'Wipe', style: 'destructive', onPress: async () => {
                await clearAll();
                clearAllRemote().catch(() => {});
              }},
            ])} />
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

function SectionLabel({ title, muted }: { title: string; muted?: boolean }) {
  return (
    <View style={sl.row}>
      <View style={sl.line} />
      <Text style={[sl.text, muted && sl.textMuted]}>{title}</Text>
      <View style={sl.line} />
    </View>
  );
}

function StatCell({ icon, value, label }: { icon: string; value: string; label: string }) {
  return (
    <View style={sc.cell}>
      <MaterialCommunityIcons name={icon as any} size={22} color={TEXT_DIM} />
      <Text style={sc.value}>{value}</Text>
      <Text style={sc.label}>{label}</Text>
    </View>
  );
}

function LoreLine({ icon, text }: { icon: string; text: string }) {
  return (
    <View style={ll.row}>
      <MaterialCommunityIcons name={icon as any} size={16} color={TEXT_DIM} style={{ width: 22, textAlign: 'center' }} />
      <Text style={ll.text}>{text}</Text>
    </View>
  );
}

function DevBtn({ label, onPress, danger }: { label: string; onPress: () => void; danger?: boolean }) {
  return (
    <Pressable
      style={({ pressed }) => [db.btn, danger && db.dangerBtn, pressed && { opacity: 0.6 }]}
      onPress={onPress}
    >
      <Text style={[db.label, danger && db.dangerLabel]}>{label}</Text>
    </Pressable>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: BG },
  scroll: { padding: 20, paddingBottom: 48 },
  pageLabel: {
    fontSize: 22, fontWeight: '900', color: GOLD, letterSpacing: 4, marginBottom: 8,
  },
  titleRule: { height: 1, backgroundColor: BORDER, marginBottom: 20 },
  heroCard: {
    backgroundColor: SURFACE, borderRadius: 16, borderWidth: 1, borderColor: BORDER,
    padding: 20, gap: 16, marginBottom: 12, alignItems: 'center',
  },
  rankCircle: {
    width: 96, height: 96, borderRadius: 48,
    backgroundColor: BG, borderWidth: 2, borderColor: GOLD,
    alignItems: 'center', justifyContent: 'center',
  },
  rankNum: { fontSize: 42, fontWeight: '900', color: GOLD, lineHeight: 46 },
  rankLabel: { fontSize: 9, fontWeight: '800', color: TEXT_DIM, letterSpacing: 2.5 },
  heroInfo: { alignItems: 'center', gap: 4 },
  heroName: { fontSize: 20, fontWeight: '800', color: TEXT, letterSpacing: 0.5 },
  heroClass: { fontSize: 10, fontWeight: '800', color: TEXT_DIM, letterSpacing: 2.5 },
  xpSection: { width: '100%', gap: 6 },
  xpRow: { flexDirection: 'row', justifyContent: 'space-between' },
  xpLabel: { fontSize: 9, fontWeight: '800', color: TEXT_DIM, letterSpacing: 2 },
  xpFraction: { fontSize: 11, color: GOLD, fontWeight: '700' },
  xpTrack: {
    height: 8, borderRadius: 4, backgroundColor: SURFACE2,
    overflow: 'hidden', borderWidth: 1, borderColor: BORDER,
  },
  xpFill: { height: '100%', backgroundColor: GOLD, borderRadius: 4 },
  xpSub: { fontSize: 10, color: TEXT_MUTED, textAlign: 'right' },
  totalBanner: {
    backgroundColor: GOLD_DIM, borderRadius: 12, borderWidth: 1, borderColor: GOLD,
    paddingVertical: 14, alignItems: 'center', marginBottom: 20,
  },
  totalNum: { fontSize: 28, fontWeight: '900', color: GOLD },
  totalLabel: { fontSize: 9, fontWeight: '800', color: TEXT_DIM, letterSpacing: 2, marginTop: 2 },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 8 },
  since: { fontSize: 12, color: TEXT_MUTED, textAlign: 'center', marginBottom: 20, fontStyle: 'italic' },
  loreCard: {
    backgroundColor: SURFACE, borderRadius: 14, borderWidth: 1, borderColor: BORDER,
    paddingVertical: 4, marginBottom: 8,
  },
  loreDivider: { height: 1, backgroundColor: SEPARATOR, marginHorizontal: 16 },
  devCard: {
    backgroundColor: SURFACE, borderRadius: 14, borderWidth: 1, borderColor: BORDER,
    padding: 14, gap: 10,
  },
  devRow: { flexDirection: 'row', gap: 10 },
});

const sl = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12, marginTop: 8 },
  line: { flex: 1, height: 1, backgroundColor: SEPARATOR },
  text: { fontSize: 9, fontWeight: '800', color: GOLD, letterSpacing: 2 },
  textMuted: { color: TEXT_MUTED },
});

const sc = StyleSheet.create({
  cell: {
    width: '47%', backgroundColor: SURFACE, borderRadius: 12,
    borderWidth: 1, borderColor: BORDER, padding: 16, alignItems: 'center', gap: 4,
  },
  value: { fontSize: 24, fontWeight: '900', color: GOLD },
  label: { fontSize: 11, color: TEXT_DIM },
});

const ll = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14 },
  text: { fontSize: 13, color: TEXT_DIM, flex: 1, lineHeight: 18 },
});

const cr = StyleSheet.create({
  line: { fontSize: 12, color: TEXT_MUTED, lineHeight: 18 },
  link: { color: GOLD, fontWeight: '600' },
});

const db = StyleSheet.create({
  btn: {
    flex: 1, paddingVertical: 12, borderRadius: 10,
    backgroundColor: SURFACE2, borderWidth: 1, borderColor: BORDER, alignItems: 'center',
  },
  dangerBtn: { borderColor: CRIMSON + '80', backgroundColor: '#1A0A0C' },
  label: { fontSize: 12, fontWeight: '700', color: GOLD, letterSpacing: 0.5 },
  dangerLabel: { color: '#E05060' },
});
