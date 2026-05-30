import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import React from 'react';
import { Pressable, ScrollView, StatusBar, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAppStore } from '../store';
import {
  BG, BORDER, DONE_FG, GOLD, PURPLE, SEPARATOR, SURFACE, SURFACE2, TEXT, TEXT_DIM, TEXT_MUTED,
} from '../theme';
import type { Campaign, RootStackParamList } from '../types';

const CAMPAIGNS: Campaign[] = [
  {
    id: 'forgotten_flagon',
    title: 'The Forgotten Flagon',
    subtitle: 'Demo Campaign  ·  Chapter I',
    description:
      "A routine stop at a roadside tavern turns into a night you won't forget. Brawlers, shadows, and secrets lurk within its smoke-stained walls. Will your hero walk away victorious — or stumble into something far darker?",
    icon: 'glass-mug-variant',
    status: 'available',
  },
  {
    id: 'iron_citadel',
    title: 'The Iron Citadel',
    subtitle: 'Chapter II  ·  Coming Soon',
    description:
      "Deep within the mountains lies a fortress of iron and shadow. Ancient machines stir behind its sealed gates. The empire's darkest secret awaits those brave enough to delve within.",
    icon: 'castle',
    status: 'coming_soon',
  },
  {
    id: 'curse_of_velmira',
    title: 'Curse of Velmira',
    subtitle: 'Limited Event  ·  Coming Soon',
    description:
      'A plague of nightmares spreads from the cursed city of Velmira. The Witch-Queen\'s tower burns at midnight. Break the curse before dawn — or be consumed by darkness.',
    icon: 'moon-waning-crescent',
    status: 'coming_soon',
  },
];

export default function CampaignsScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { state } = useAppStore();
  const completedIds = new Set(state.campaignCompletions.map(c => c.campaignId));

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      <StatusBar barStyle="light-content" />
      <ScrollView contentContainerStyle={s.scroll}>

        <Text style={s.pageLabel}>CAMPAIGNS</Text>
        <Text style={s.pageSubtitle}>Epic adventures forged for your hero</Text>
        <View style={s.headerRule} />

        <View style={s.sectionRow}>
          <View style={s.sectionLine} />
          <Text style={s.sectionLabel}>AVAILABLE ADVENTURES</Text>
          <View style={s.sectionLine} />
        </View>

        {CAMPAIGNS.map((c, index) => (
          <CampaignRow
            key={c.id}
            campaign={c}
            index={index}
            isCompleted={completedIds.has(c.id)}
            onPlay={() => navigation.navigate('CampaignPlay', { campaignId: c.id })}
          />
        ))}

        <View style={s.teaser}>
          <MaterialCommunityIcons name="sword" size={32} color={TEXT_MUTED} />
          <Text style={s.teaserText}>More adventures are being forged.{'\n'}Return when the realm calls.</Text>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

function CampaignRow({
  campaign,
  isCompleted,
  onPlay,
}: {
  campaign: Campaign;
  index: number;
  isCompleted: boolean;
  onPlay: () => void;
}) {
  const isAvailable = campaign.status === 'available' && !isCompleted;
  const isTappable = isAvailable || isCompleted;
  const iconColor = isCompleted ? PURPLE : isAvailable ? GOLD : TEXT_MUTED;
  const hintColor = isCompleted ? PURPLE : DONE_FG;

  return (
    <Pressable
      style={({ pressed }) => [s.row, pressed && isTappable && { opacity: 0.85 }]}
      onPress={isTappable ? onPlay : undefined}
    >
      {/* Icon column */}
      <View style={[s.iconCol, isCompleted && s.iconColDone]}>
        <MaterialCommunityIcons name={campaign.icon as any} size={28} color={iconColor} />
      </View>

      {/* Content */}
      <View style={s.rowBody}>
        <View style={s.rowTop}>
          <Text style={s.subtitle} numberOfLines={1}>{campaign.subtitle.toUpperCase()}</Text>
          {isCompleted ? (
            <View style={s.doneChip}>
              <MaterialCommunityIcons name="check-circle" size={9} color={PURPLE} />
              <Text style={s.doneText}>COMPLETE</Text>
            </View>
          ) : isAvailable ? (
            <View style={s.availableChip}>
              <View style={s.availableDot} />
              <Text style={s.availableText}>PLAY</Text>
            </View>
          ) : (
            <View style={s.statusChip}>
              <View style={s.statusDot} />
              <Text style={s.statusText}>SOON</Text>
            </View>
          )}
        </View>
        <Text style={[s.title, !isAvailable && !isCompleted && { color: TEXT_DIM }]}>{campaign.title}</Text>
        <Text style={s.desc} numberOfLines={1}>{campaign.description}</Text>
        {(isAvailable || isCompleted) && (
          <View style={s.playRow}>
            <MaterialCommunityIcons
              name={isCompleted ? 'book-open-outline' : 'play-circle-outline'}
              size={12}
              color={hintColor}
            />
            <Text style={[s.playHint, { color: hintColor }]}>
              {isCompleted ? 'Tap to view your story' : 'Tap to begin your adventure'}
            </Text>
          </View>
        )}
      </View>
    </Pressable>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: BG },
  scroll: { paddingBottom: 48 },

  pageLabel: {
    fontSize: 22, fontWeight: '900', color: GOLD, letterSpacing: 4,
    paddingHorizontal: 20, paddingTop: 16, marginBottom: 4,
  },
  pageSubtitle: {
    fontSize: 11, color: TEXT_DIM, letterSpacing: 0.3,
    paddingHorizontal: 20, marginBottom: 12,
  },
  headerRule: { height: 1, backgroundColor: BORDER, marginHorizontal: 20, marginBottom: 16 },

  sectionRow: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    marginHorizontal: 16, marginBottom: 14,
  },
  sectionLine: { flex: 1, height: 1, backgroundColor: SEPARATOR },
  sectionLabel: { fontSize: 9, fontWeight: '800', color: TEXT_DIM, letterSpacing: 2 },

  row: {
    marginHorizontal: 16, marginBottom: 10,
    backgroundColor: SURFACE, borderRadius: 12,
    borderWidth: 1, borderColor: BORDER,
    flexDirection: 'row', overflow: 'hidden',
  },
  iconCol: {
    width: 60, backgroundColor: SURFACE2,
    alignItems: 'center', justifyContent: 'center',
    borderRightWidth: 1, borderRightColor: BORDER,
  },
  iconColDone: { backgroundColor: PURPLE + '14' },

  doneChip: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: PURPLE + '18', borderRadius: 5,
    borderWidth: 1, borderColor: PURPLE,
    paddingHorizontal: 6, paddingVertical: 3,
  },
  doneText: { fontSize: 7, fontWeight: '800', color: PURPLE, letterSpacing: 1.5 },

  rowBody: { flex: 1, padding: 10, gap: 3 },
  rowTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  subtitle: { flex: 1, fontSize: 8, fontWeight: '700', color: TEXT_DIM, letterSpacing: 1.2 },
  title: { fontSize: 15, fontWeight: '800', color: TEXT, letterSpacing: 0.1 },
  desc: { fontSize: 11, color: TEXT_DIM, lineHeight: 16 },

  availableChip: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: DONE_FG + '18', borderRadius: 5,
    borderWidth: 1, borderColor: DONE_FG,
    paddingHorizontal: 6, paddingVertical: 3,
  },
  availableDot: { width: 4, height: 4, borderRadius: 2, backgroundColor: DONE_FG },
  availableText: { fontSize: 7, fontWeight: '800', color: DONE_FG, letterSpacing: 1.5 },

  statusChip: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: SURFACE2, borderRadius: 5,
    borderWidth: 1, borderColor: BORDER,
    paddingHorizontal: 6, paddingVertical: 3,
  },
  statusDot: { width: 4, height: 4, borderRadius: 2, backgroundColor: TEXT_MUTED },
  statusText: { fontSize: 7, fontWeight: '800', color: TEXT_MUTED, letterSpacing: 1.5 },

  playRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  playHint: { fontSize: 10, color: DONE_FG, fontWeight: '600' },

  teaser: {
    marginHorizontal: 16, marginTop: 8,
    backgroundColor: SURFACE, borderRadius: 14,
    borderWidth: 1, borderColor: BORDER,
    padding: 24, alignItems: 'center', gap: 10,
  },
  teaserText: { fontSize: 12, color: TEXT_MUTED, textAlign: 'center', lineHeight: 20 },

});
