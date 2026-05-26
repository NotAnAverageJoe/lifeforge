import React from 'react';
import { Pressable, ScrollView, StatusBar, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  BG, BORDER, GOLD, GOLD_DIM, SEPARATOR, SURFACE, SURFACE2, TEXT, TEXT_DIM, TEXT_MUTED,
} from '../theme';
import type { Campaign } from '../types';

const CAMPAIGNS: Campaign[] = [
  {
    id: 'forgotten_flagon',
    title: 'The Forgotten Flagon',
    subtitle: 'Demo Campaign  ·  Chapter I',
    description:
      "A routine stop at a roadside tavern turns into a night you won't forget. Brawlers, shadows, and secrets lurk within its smoke-stained walls. Will your hero walk away victorious — or stumble into something far darker?",
    icon: '🍺',
    status: 'coming_soon',
  },
  {
    id: 'iron_citadel',
    title: 'The Iron Citadel',
    subtitle: 'Chapter II  ·  Coming Soon',
    description:
      "Deep within the mountains lies a fortress of iron and shadow. Ancient machines stir behind its sealed gates. The empire's darkest secret awaits those brave enough to delve within.",
    icon: '⚙️',
    status: 'coming_soon',
  },
  {
    id: 'curse_of_velmira',
    title: 'Curse of Velmira',
    subtitle: 'Limited Event  ·  Coming Soon',
    description:
      'A plague of nightmares spreads from the cursed city of Velmira. The Witch-Queen\'s tower burns at midnight. Break the curse before dawn — or be consumed by darkness.',
    icon: '🌙',
    status: 'coming_soon',
  },
];

export default function CampaignsScreen() {
  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      <StatusBar barStyle="light-content" />
      <ScrollView contentContainerStyle={s.scroll}>

        {/* Page header */}
        <Text style={s.pageLabel}>CAMPAIGNS</Text>
        <Text style={s.pageSubtitle}>Epic adventures forged for your hero</Text>
        <View style={s.headerRule} />

        {/* Campaign list */}
        <View style={s.sectionRow}>
          <View style={s.sectionLine} />
          <Text style={s.sectionLabel}>AVAILABLE ADVENTURES</Text>
          <View style={s.sectionLine} />
        </View>

        {CAMPAIGNS.map((c, index) => (
          <CampaignRow key={c.id} campaign={c} index={index} />
        ))}

        {/* Teaser footer */}
        <View style={s.teaser}>
          <Text style={s.teaserIcon}>🗡️</Text>
          <Text style={s.teaserText}>More adventures are being forged.{'\n'}Return when the realm calls.</Text>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

function CampaignRow({ campaign, index }: { campaign: Campaign; index: number }) {
  const isComingSoon = campaign.status === 'coming_soon';

  return (
    <Pressable
      style={({ pressed }) => [s.row, pressed && { opacity: 0.85 }]}
      onPress={undefined}
    >
      {/* Art panel */}
      <View style={s.artPanel}>
        <Text style={s.artIcon}>{campaign.icon}</Text>
        {index === 0 && (
          <View style={s.newBadge}>
            <Text style={s.newBadgeText}>NEXT</Text>
          </View>
        )}
      </View>

      {/* Content */}
      <View style={s.rowBody}>
        <View style={s.rowTop}>
          <View style={s.rowTitles}>
            <Text style={s.subtitle}>{campaign.subtitle.toUpperCase()}</Text>
            <Text style={s.title}>{campaign.title}</Text>
          </View>
          <View style={s.statusChip}>
            <View style={s.statusDot} />
            <Text style={s.statusText}>SOON</Text>
          </View>
        </View>
        <Text style={s.desc} numberOfLines={2}>{campaign.description}</Text>
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
    marginHorizontal: 16, marginBottom: 12,
    backgroundColor: SURFACE, borderRadius: 14,
    borderWidth: 1, borderColor: BORDER,
    overflow: 'hidden',
  },
  artPanel: {
    height: 100, backgroundColor: SURFACE2,
    alignItems: 'center', justifyContent: 'center',
    borderBottomWidth: 1, borderBottomColor: BORDER,
  },
  artIcon: { fontSize: 52 },
  newBadge: {
    position: 'absolute', top: 10, right: 10,
    backgroundColor: GOLD_DIM, borderWidth: 1, borderColor: GOLD,
    borderRadius: 5, paddingHorizontal: 8, paddingVertical: 3,
  },
  newBadgeText: { fontSize: 9, fontWeight: '800', color: GOLD, letterSpacing: 1.5 },

  rowBody: { padding: 14, gap: 8 },
  rowTop: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' },
  rowTitles: { flex: 1, gap: 3 },
  subtitle: { fontSize: 9, fontWeight: '700', color: TEXT_DIM, letterSpacing: 1.2 },
  title: { fontSize: 18, fontWeight: '800', color: TEXT, letterSpacing: 0.2 },
  desc: { fontSize: 12, color: TEXT_DIM, lineHeight: 18 },

  statusChip: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: SURFACE2, borderRadius: 6,
    borderWidth: 1, borderColor: BORDER,
    paddingHorizontal: 8, paddingVertical: 4,
    marginLeft: 10,
  },
  statusDot: { width: 5, height: 5, borderRadius: 3, backgroundColor: TEXT_MUTED },
  statusText: { fontSize: 8, fontWeight: '800', color: TEXT_MUTED, letterSpacing: 1.5 },

  teaser: {
    marginHorizontal: 16, marginTop: 8,
    backgroundColor: SURFACE, borderRadius: 14,
    borderWidth: 1, borderColor: BORDER,
    padding: 24, alignItems: 'center', gap: 10,
  },
  teaserIcon: { fontSize: 32 },
  teaserText: {
    fontSize: 12, color: TEXT_MUTED, textAlign: 'center', lineHeight: 20,
  },
});
