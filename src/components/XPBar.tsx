import { MaterialCommunityIcons } from '@expo/vector-icons';
import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';
import { BORDER, GOLD, SURFACE2, TEXT, TEXT_DIM } from '../theme';
import { getLevelInfo } from '../xp';

type Props = { totalXp: number; compact?: boolean };

export default function XPBar({ totalXp, compact = false }: Props) {
  const { level, currentXp, nextLevelXp } = getLevelInfo(totalXp);
  const pct = nextLevelXp > 0 ? currentXp / nextLevelXp : 0;
  const animWidth = useRef(new Animated.Value(pct)).current;

  useEffect(() => {
    Animated.spring(animWidth, { toValue: pct, useNativeDriver: false, friction: 8 }).start();
  }, [pct]);

  if (compact) {
    return (
      <View style={s.compactWrap}>
        <View style={s.track}>
          <Animated.View
            style={[s.fill, { width: animWidth.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] }) }]}
          />
        </View>
        <Text style={s.compactLabel}>Rank {level}</Text>
      </View>
    );
  }

  return (
    <View style={s.wrap}>
      <View style={s.row}>
        <View style={s.rankRow}>
          <MaterialCommunityIcons name="sword" size={14} color={GOLD} />
          <Text style={s.levelText}>  Rank {level}</Text>
        </View>
        <Text style={s.xpText}>{currentXp} / {nextLevelXp} XP</Text>
      </View>
      <View style={s.track}>
        <Animated.View
          style={[s.fill, { width: animWidth.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] }) }]}
        />
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  wrap: { paddingHorizontal: 20, paddingVertical: 10 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  rankRow: { flexDirection: 'row', alignItems: 'center' },
  levelText: { fontSize: 14, fontWeight: '700', color: GOLD, letterSpacing: 0.5 },
  xpText: { fontSize: 12, color: TEXT_DIM },
  track: { height: 8, borderRadius: 4, backgroundColor: SURFACE2, overflow: 'hidden', borderWidth: 1, borderColor: BORDER },
  fill: { height: '100%', backgroundColor: GOLD, borderRadius: 4 },
  compactWrap: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  compactLabel: { fontSize: 12, fontWeight: '700', color: GOLD },
});
