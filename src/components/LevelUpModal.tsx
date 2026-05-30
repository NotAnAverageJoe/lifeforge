import { MaterialCommunityIcons } from '@expo/vector-icons';
import React, { useEffect, useRef } from 'react';
import { Animated, Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { BORDER, CRIMSON, GOLD, SURFACE, SURFACE2, TEXT, TEXT_DIM } from '../theme';

type Props = { level: number; onDismiss: () => void };

const ICONS = ['sword', 'shield', 'star-four-points', 'trophy', 'sword', 'shield'];

export default function LevelUpModal({ level, onDismiss }: Props) {
  const scale = useRef(new Animated.Value(0.4)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const iconAnims = useRef(ICONS.map(() => new Animated.Value(0))).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(scale, { toValue: 1, friction: 5, useNativeDriver: true }),
      Animated.timing(opacity, { toValue: 1, duration: 200, useNativeDriver: true }),
    ]).start(() => {
      Animated.stagger(
        80,
        iconAnims.map(a => Animated.spring(a, { toValue: 1, friction: 4, useNativeDriver: true }))
      ).start();
    });
  }, []);

  return (
    <Modal transparent animationType="fade" statusBarTranslucent>
      <View style={s.backdrop}>
        <Animated.View style={[s.card, { transform: [{ scale }], opacity }]}>
          <View style={s.iconsRow}>
            {ICONS.map((icon, i) => (
              <Animated.View
                key={i}
                style={[
                  {
                    transform: [
                      { translateY: iconAnims[i].interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) },
                      { scale: iconAnims[i] },
                    ],
                    opacity: iconAnims[i],
                  },
                ]}
              >
                <MaterialCommunityIcons name={icon as any} size={22} color={GOLD} />
              </Animated.View>
            ))}
          </View>

          <Text style={s.banner}>— RANK ASCENSION —</Text>
          <Text style={s.levelNum}>{level}</Text>
          <Text style={s.sub}>Thou hast ascended to Rank {level}!</Text>
          <Text style={s.tagline}>Thy resolve grows stronger, hero.</Text>

          <Pressable style={s.btn} onPress={onDismiss}>
            <Text style={s.btnText}>Onward!</Text>
          </Pressable>
        </Animated.View>
      </View>
    </Modal>
  );
}

const s = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.75)', justifyContent: 'center', alignItems: 'center' },
  card: {
    backgroundColor: SURFACE,
    borderRadius: 20,
    padding: 32,
    alignItems: 'center',
    width: 300,
    borderWidth: 2,
    borderColor: GOLD,
  },
  iconsRow: { flexDirection: 'row', gap: 4, marginBottom: 16 },
  icon: { fontSize: 22 },
  banner: { fontSize: 11, fontWeight: '800', color: GOLD, letterSpacing: 3, marginBottom: 8 },
  levelNum: { fontSize: 80, fontWeight: '900', color: GOLD, lineHeight: 88, marginBottom: 4 },
  sub: { fontSize: 17, fontWeight: '700', color: TEXT, marginBottom: 6, textAlign: 'center' },
  tagline: { fontSize: 13, color: TEXT_DIM, marginBottom: 28, fontStyle: 'italic' },
  btn: {
    backgroundColor: CRIMSON,
    borderRadius: 10,
    paddingHorizontal: 40,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: GOLD,
  },
  btnText: { color: TEXT, fontWeight: '700', fontSize: 15, letterSpacing: 1 },
});
