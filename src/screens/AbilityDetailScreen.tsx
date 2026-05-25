import { useNavigation, useRoute } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import React, { useEffect, useRef } from 'react';
import {
  Animated,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ABILITY_DETAILS, ABILITY_META } from '../data/onboarding';
import { useAppStore } from '../store';
import { BG, BORDER, GOLD, SURFACE, SURFACE2, TEXT, TEXT_DIM, TEXT_MUTED } from '../theme';
import type { RootStackParamList } from '../types';
import { ABILITY_MAX_LEVEL, getAbilityLevelInfo } from '../xp';

type Route = RouteProp<RootStackParamList, 'AbilityDetail'>;
type Nav = NativeStackNavigationProp<RootStackParamList>;

export default function AbilityDetailScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<Route>();
  const { ability } = route.params;
  const { state } = useAppStore();
  const character = state.character!;

  const meta = ABILITY_META[ability];
  const details = ABILITY_DETAILS[ability];
  const abilXp = character.abilityXp?.[ability] ?? 0;
  const { level, currentXp, nextLevelXp } = getAbilityLevelInfo(abilXp);
  const isMaxLevel = level >= ABILITY_MAX_LEVEL;
  const pct = isMaxLevel ? 1 : nextLevelXp > 0 ? currentXp / nextLevelXp : 0;
  const baseScore = character.abilities[ability];

  const animWidth = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.spring(animWidth, { toValue: pct, useNativeDriver: false, friction: 8 }).start();
  }, [pct]);

  return (
    <SafeAreaView style={s.safe}>
      <StatusBar barStyle="light-content" />

      <View style={s.topBar}>
        <Pressable style={s.backBtn} onPress={() => navigation.goBack()}>
          <Text style={s.backArrow}>‹</Text>
          <Text style={s.backLabel}>Back</Text>
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={s.scroll}>
        {/* Hero block */}
        <View style={[s.hero, { borderColor: meta.color + '60' }]}>
          <Text style={s.heroIcon}>{meta.icon}</Text>
          <Text style={[s.heroName, { color: meta.color }]}>{meta.label}</Text>
          <View style={[s.levelBadge, { borderColor: meta.color }]}>
            <Text style={[s.levelNum, { color: meta.color }]}>{level}</Text>
            <Text style={s.levelSuffix}>{isMaxLevel ? ' MAX' : ` / ${ABILITY_MAX_LEVEL}`}</Text>
          </View>
        </View>

        {/* XP Bar */}
        <View style={s.xpSection}>
          <View style={s.xpTrack}>
            <Animated.View
              style={[
                s.xpFill,
                {
                  width: animWidth.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] }),
                  backgroundColor: meta.color,
                },
              ]}
            />
          </View>
          {isMaxLevel ? (
            <Text style={s.xpLabel}>Maximum level reached</Text>
          ) : (
            <Text style={s.xpLabel}>{currentXp} / {nextLevelXp} XP  ·  level {level + 1} in {nextLevelXp - currentXp} XP</Text>
          )}
        </View>

        {/* Base score */}
        <View style={s.statRow}>
          <Text style={s.statLabel}>Base Score</Text>
          <View style={s.dotRow}>
            {[1, 2, 3, 4, 5].map(n => (
              <View
                key={n}
                style={[s.dot, { backgroundColor: n <= baseScore ? meta.color : SURFACE2, borderColor: n <= baseScore ? meta.color : BORDER }]}
              />
            ))}
          </View>
          <Text style={[s.statValue, { color: meta.color }]}>{baseScore} / 5</Text>
        </View>

        {/* Description */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>What is {meta.label}?</Text>
          <Text style={s.sectionBody}>{details.description}</Text>
        </View>

        {/* Examples */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>How to level up</Text>
          {details.examples.map((ex, i) => (
            <View key={i} style={s.exampleRow}>
              <View style={[s.exampleDot, { backgroundColor: meta.color }]} />
              <Text style={s.exampleText}>{ex}</Text>
            </View>
          ))}
        </View>

        {/* XP breakdown */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>XP per linked habit</Text>
          <View style={s.xpBreakRow}>
            <View style={s.xpBreakItem}>
              <Text style={s.xpBreakVal}>+10</Text>
              <Text style={s.xpBreakLabel}>Daily</Text>
            </View>
            <View style={s.xpBreakItem}>
              <Text style={s.xpBreakVal}>+20</Text>
              <Text style={s.xpBreakLabel}>Weekly</Text>
            </View>
            <View style={s.xpBreakItem}>
              <Text style={s.xpBreakVal}>+5</Text>
              <Text style={s.xpBreakLabel}>Per rep</Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: BG },
  topBar: { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 4 },
  backBtn: { flexDirection: 'row', alignItems: 'center', gap: 2, alignSelf: 'flex-start' },
  backArrow: { fontSize: 28, color: GOLD, fontWeight: '300', lineHeight: 30 },
  backLabel: { fontSize: 15, color: GOLD, fontWeight: '600' },
  scroll: { padding: 20, paddingTop: 8, paddingBottom: 40 },
  hero: {
    alignItems: 'center',
    backgroundColor: SURFACE,
    borderRadius: 16,
    borderWidth: 1,
    padding: 28,
    marginBottom: 16,
    gap: 6,
  },
  heroIcon: { fontSize: 52, marginBottom: 4 },
  heroName: { fontSize: 28, fontWeight: '900', letterSpacing: 1 },
  levelBadge: {
    flexDirection: 'row',
    alignItems: 'baseline',
    borderWidth: 2,
    borderRadius: 10,
    paddingHorizontal: 18,
    paddingVertical: 6,
    marginTop: 6,
  },
  levelNum: { fontSize: 36, fontWeight: '900', lineHeight: 40 },
  levelSuffix: { fontSize: 15, color: TEXT_DIM, fontWeight: '600' },
  xpSection: { marginBottom: 16 },
  xpTrack: {
    height: 10,
    borderRadius: 5,
    backgroundColor: SURFACE2,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: BORDER,
    marginBottom: 6,
  },
  xpFill: { height: '100%', borderRadius: 5 },
  xpLabel: { fontSize: 11, color: TEXT_DIM, textAlign: 'center', letterSpacing: 0.3 },
  statRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: SURFACE,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: BORDER,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 14,
  },
  statLabel: { fontSize: 13, color: TEXT_DIM, fontWeight: '600' },
  dotRow: { flexDirection: 'row', gap: 6 },
  dot: { width: 12, height: 12, borderRadius: 6, borderWidth: 1 },
  statValue: { fontSize: 13, fontWeight: '700', minWidth: 30, textAlign: 'right' },
  section: {
    backgroundColor: SURFACE,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: BORDER,
    padding: 16,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: GOLD,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    marginBottom: 10,
  },
  sectionBody: { fontSize: 14, color: TEXT, lineHeight: 22 },
  exampleRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 8 },
  exampleDot: { width: 6, height: 6, borderRadius: 3, flexShrink: 0 },
  exampleText: { fontSize: 14, color: TEXT, flex: 1, lineHeight: 20 },
  xpBreakRow: { flexDirection: 'row', gap: 10 },
  xpBreakItem: {
    flex: 1,
    backgroundColor: SURFACE2,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: BORDER,
    paddingVertical: 10,
    alignItems: 'center',
    gap: 3,
  },
  xpBreakVal: { fontSize: 18, fontWeight: '900', color: GOLD },
  xpBreakLabel: { fontSize: 10, color: TEXT_MUTED, fontWeight: '700', letterSpacing: 0.5 },
});
