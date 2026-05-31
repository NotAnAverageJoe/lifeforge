import { MaterialCommunityIcons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useState } from 'react';
import {
  Pressable, ScrollView, StatusBar, StyleSheet, Text, View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { CAMPAIGNS_MAP } from '../data/campaigns';
import type { ChoiceOption } from '../data/campaigns';
import { ABILITY_META } from '../data/onboarding';
import { useAppStore } from '../store';
import {
  BG, BORDER, GOLD, SURFACE, SURFACE2, TEXT, TEXT_DIM, TEXT_MUTED,
} from '../theme';
import type { AbilityScores, ChoiceLogEntry, RootStackParamList } from '../types';
import { getAbilityLevelInfo } from '../xp';

type Props = NativeStackScreenProps<RootStackParamList, 'CampaignPlay'>;

const SUCCESS_COLOR = '#4EC9A0';
const FAIL_COLOR = '#A31E2D';

type CheckOverlay = {
  ability: keyof AbilityScores;
  requiredLevel: number;
  charLevel: number;
  passed: boolean;
  guaranteed: boolean;
  successChance: number;
  nextScene: string;
  choiceTitle: string;
  optionLabel: string;
};

export default function CampaignPlayScreen({ navigation, route }: Props) {
  const { campaignId } = route.params;
  const { state, completeCampaign } = useAppStore();
  const insets = useSafeAreaInsets();
  const character = state.character!;

  const campaign = CAMPAIGNS_MAP[campaignId];
  const existingCompletion = state.campaignCompletions.find(c => c.campaignId === campaignId);

  const [started, setStarted] = useState(!!existingCompletion);
  const [sceneId, setSceneId] = useState(
    existingCompletion ? (existingCompletion.endingSceneId ?? 'ending_victory') : campaign.startScene
  );
  const [successfulChecks, setSuccessfulChecks] = useState(existingCompletion?.successfulChecks ?? 0);
  const [choicesDone, setChoicesDone] = useState(existingCompletion ? campaign.totalChoiceScreens : 0);
  const [checkOverlay, setCheckOverlay] = useState<CheckOverlay | null>(null);
  const [rewardClaimed, setRewardClaimed] = useState(!!existingCompletion);
  const [choiceLog, setChoiceLog] = useState<ChoiceLogEntry[]>(existingCompletion?.choiceLog ?? []);

  const scene = campaign.scenes[sceneId];
  const footerPad = Math.max(16, insets.bottom);

  function getCharAbilityLevel(ability: keyof AbilityScores): number {
    const xp = character.abilityXp?.[ability] ?? 0;
    return getAbilityLevelInfo(xp).level;
  }

  function handleChoice(option: ChoiceOption) {
    if (scene.type !== 'choice') return;
    if (option.check) {
      const charLevel = getCharAbilityLevel(option.check.ability);
      const guaranteed = charLevel >= option.check.requiredLevel;
      const successChance = guaranteed ? 1 : charLevel / option.check.requiredLevel;
      const passed = guaranteed || Math.random() < successChance;
      setCheckOverlay({
        ability: option.check.ability,
        requiredLevel: option.check.requiredLevel,
        charLevel,
        passed,
        guaranteed,
        successChance,
        nextScene: passed ? option.check.successScene : option.check.failScene,
        choiceTitle: scene.title,
        optionLabel: option.label,
      });
      if (passed) setSuccessfulChecks(c => c + 1);
    } else {
      const outScene = campaign.scenes[option.scene!];
      setChoiceLog(log => [...log, {
        choiceTitle: scene.title,
        optionLabel: option.label,
        outcomeTitle: outScene.title,
      }]);
      setChoicesDone(c => c + 1);
      setSceneId(option.scene!);
    }
  }

  function handleContinue() {
    if (scene.type === 'choice' || scene.type === 'completion') return;
    setSceneId(scene.nextScene);
  }

  function handleCheckContinue() {
    if (!checkOverlay) return;
    const outScene = campaign.scenes[checkOverlay.nextScene];
    setChoiceLog(log => [...log, {
      choiceTitle: checkOverlay.choiceTitle,
      optionLabel: checkOverlay.optionLabel,
      abilityAbbr: ABILITY_META[checkOverlay.ability].abbr,
      checkPassed: checkOverlay.passed,
      outcomeTitle: outScene.title,
    }]);
    setChoicesDone(c => c + 1);
    setSceneId(checkOverlay.nextScene);
    setCheckOverlay(null);
  }

  function handleClaimReward() {
    const comp = scene;
    if (comp.type !== 'completion') return;
    const xpEarned = comp.baseXp + successfulChecks * comp.bonusXpPerCheck;
    completeCampaign({
      campaignId,
      completedAt: new Date().toISOString(),
      successfulChecks,
      xpEarned,
      choiceLog,
      endingSceneId: sceneId,
    });
    setRewardClaimed(true);
  }

  const header = (
    <View style={s.header}>
      <Pressable style={s.closeBtn} onPress={() => navigation.goBack()}>
        <MaterialCommunityIcons name="close" size={20} color={TEXT_DIM} />
      </Pressable>
      <Text style={s.headerTitle} numberOfLines={1}>{campaign.title}</Text>
      <View style={s.progressDots}>
        {Array.from({ length: campaign.totalChoiceScreens }).map((_, i) => (
          <View key={i} style={[s.dot, i < choicesDone && s.dotFilled]} />
        ))}
      </View>
    </View>
  );

  // ── Campaign lobby (detail before starting) ───────────────────────────────
  if (!started) {
    return (
      <SafeAreaView style={s.safe} edges={['top']}>
        <StatusBar barStyle="light-content" />
        {header}
        <ScrollView style={s.scroll} contentContainerStyle={s.scrollPad}>
          <View style={s.lobbyBanner}>
            <MaterialCommunityIcons name={campaign.icon as any} size={64} color={GOLD} />
            <Text style={s.lobbyTitle}>{campaign.title}</Text>
            <Text style={s.lobbySubtitle}>{campaign.subtitle}</Text>
          </View>
          <View style={s.lobbyRule} />
          <Text style={s.lobbyDesc}>{campaign.description}</Text>
        </ScrollView>
        <View style={[s.footer, { paddingBottom: footerPad }]}>
          <Pressable style={s.continueBtn} onPress={() => setStarted(true)}>
            <Text style={s.continueBtnText}>Start Adventure  ⚔</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  // ── Check result overlay ──────────────────────────────────────────────────
  if (checkOverlay) {
    const meta = ABILITY_META[checkOverlay.ability];
    const resultColor = checkOverlay.passed ? SUCCESS_COLOR : FAIL_COLOR;
    return (
      <SafeAreaView style={s.safe} edges={['top']}>
        <StatusBar barStyle="light-content" />
        {header}
        <View style={s.checkWrapper}>
          <View style={s.checkCard}>
            <View style={[s.checkBadge, { backgroundColor: meta.color + '22', borderColor: meta.color }]}>
              <Text style={[s.checkBadgeText, { color: meta.color }]}>{meta.abbr} CHECK</Text>
            </View>
            <View style={s.checkStats}>
              <View style={s.statRow}>
                <Text style={s.statLabel}>Required Level</Text>
                <Text style={s.statValue}>{checkOverlay.requiredLevel}</Text>
              </View>
              <View style={[s.statRow, { borderBottomWidth: 0 }]}>
                <Text style={s.statLabel}>Your {meta.label}</Text>
                <Text style={s.statValue}>{checkOverlay.charLevel}</Text>
              </View>
            </View>
            <View style={[s.checkResult, { backgroundColor: resultColor + '18', borderColor: resultColor }]}>
              <MaterialCommunityIcons
                name={checkOverlay.passed ? 'check-circle-outline' : 'close-circle-outline'}
                size={26}
                color={resultColor}
              />
              <Text style={[s.checkResultText, { color: resultColor }]}>
                {checkOverlay.passed ? 'CHECK PASSED' : 'CHECK FAILED'}
              </Text>
            </View>
            {!checkOverlay.guaranteed && (
              <Text style={s.chanceNote}>
                {Math.round(checkOverlay.successChance * 100)}% success chance
              </Text>
            )}
          </View>
        </View>
        <View style={[s.footer, { paddingBottom: footerPad }]}>
          <Pressable style={s.continueBtn} onPress={handleCheckContinue}>
            <Text style={s.continueBtnText}>Continue  →</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  // ── Intro / Result narrative scene ────────────────────────────────────────
  if (scene.type === 'intro' || scene.type === 'result') {
    return (
      <SafeAreaView style={s.safe} edges={['top']}>
        <StatusBar barStyle="light-content" />
        {header}
        <ScrollView style={s.scroll} contentContainerStyle={s.scrollPad}>
          {scene.type === 'intro' && (
            <View style={s.iconWrap}>
              <MaterialCommunityIcons name={campaign.icon as any} size={52} color={GOLD} />
            </View>
          )}
          <Text style={s.sceneTitle}>{scene.title}</Text>
          <Text style={s.prose}>{scene.prose}</Text>
        </ScrollView>
        <View style={[s.footer, { paddingBottom: footerPad }]}>
          <Pressable style={s.continueBtn} onPress={handleContinue}>
            <Text style={s.continueBtnText}>Continue  →</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  // ── Choice scene ──────────────────────────────────────────────────────────
  if (scene.type === 'choice') {
    return (
      <SafeAreaView style={s.safe} edges={['top']}>
        <StatusBar barStyle="light-content" />
        {header}
        <ScrollView style={s.scroll} contentContainerStyle={[s.scrollPad, { paddingBottom: footerPad }]}>
          <Text style={s.sceneTitle}>{scene.title}</Text>
          <Text style={s.setupProse}>{scene.prose}</Text>
          <View style={s.choicesWrap}>
            {scene.choices.map(opt => {
              const check = opt.check;
              const charLevel = check ? getCharAbilityLevel(check.ability) : 0;
              const guaranteed = check ? charLevel >= check.requiredLevel : false;
              const successPct = check && !guaranteed
                ? Math.round((charLevel / check.requiredLevel) * 100)
                : null;
              const meta = check ? ABILITY_META[check.ability] : null;

              return (
                <Pressable
                  key={opt.id}
                  style={({ pressed }) => [s.choiceBtn, pressed && s.choiceBtnPressed]}
                  onPress={() => handleChoice(opt)}
                >
                  <View style={s.choiceLabelRow}>
                    <Text style={s.choiceLabel}>{opt.label}</Text>
                    {meta && (
                      <View style={[s.abilityChip, { backgroundColor: meta.color + '22', borderColor: meta.color }]}>
                        <Text style={[s.abilityChipText, { color: meta.color }]}>{meta.abbr}</Text>
                      </View>
                    )}
                  </View>
                  <Text style={s.choiceFlavor}>{opt.flavorText}</Text>
                  {check && (
                    <Text style={s.checkInfoText}>
                      {meta!.label} Lv.{check.requiredLevel} required
                      {'   '}·{'   '}
                      Your Lv: {charLevel}
                      {'   '}·{'   '}
                      {guaranteed ? 'Guaranteed' : `${successPct}% success`}
                    </Text>
                  )}
                </Pressable>
              );
            })}
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // ── Completion scene ──────────────────────────────────────────────────────
  if (scene.type === 'completion') {
    const comp = scene;
    if (comp.type !== 'completion') return null;
    const clampedChecks = Math.min(successfulChecks, 3) as 0 | 1 | 2 | 3;
    const campaignXp = comp.baseXp + successfulChecks * comp.bonusXpPerCheck;

    return (
      <SafeAreaView style={s.safe} edges={['top']}>
        <StatusBar barStyle="light-content" />
        {header}
        <ScrollView style={s.scroll} contentContainerStyle={s.scrollPad}>
          <View style={s.completionBanner}>
            <MaterialCommunityIcons name={campaign.icon as any} size={56} color={GOLD} />
            <Text style={s.completionTitle}>{comp.title}</Text>
            <Text style={s.completionSub}>CAMPAIGN COMPLETE</Text>
          </View>
          <Text style={s.prose}>{comp.proseByChecks[clampedChecks]}</Text>
          <Text style={s.epilogue}>{comp.epilogue}</Text>

          <View style={s.xpCard}>
            <Text style={s.xpCardTitle}>REWARDS</Text>
            <View style={s.xpRow}>
              <Text style={s.xpLabel}>Campaign Completion</Text>
              <Text style={s.xpVal}>+{comp.baseXp} XP</Text>
            </View>
            {successfulChecks > 0 && (
              <View style={s.xpRow}>
                <Text style={s.xpLabel}>Ability Checks Passed  ×{successfulChecks}</Text>
                <Text style={s.xpVal}>+{successfulChecks * comp.bonusXpPerCheck} XP</Text>
              </View>
            )}
            <View style={[s.xpRow, s.xpTotalRow]}>
              <Text style={s.xpTotalLabel}>Total</Text>
              <Text style={s.xpTotalVal}>+{campaignXp} XP</Text>
            </View>
          </View>

          {choiceLog.length > 0 && (
            <View style={s.logSection}>
              <Text style={s.logSectionTitle}>CHAPTER LOG</Text>
              {choiceLog.map((entry, i) => (
                <View key={i} style={s.logCard}>
                  <Text style={s.logChoiceNum}>Choice {i + 1}  ·  {entry.choiceTitle}</Text>
                  <Text style={s.logOptionLabel}>{entry.optionLabel}</Text>
                  {entry.abilityAbbr != null && (
                    <Text style={[s.logCheck, { color: entry.checkPassed ? SUCCESS_COLOR : FAIL_COLOR }]}>
                      {entry.abilityAbbr} Check  ·  {entry.checkPassed ? 'PASSED' : 'FAILED'}
                    </Text>
                  )}
                  <Text style={s.logOutcome}>→  {entry.outcomeTitle}</Text>
                </View>
              ))}
            </View>
          )}
        </ScrollView>
        <View style={[s.footer, { paddingBottom: footerPad }]}>
          {rewardClaimed ? (
            <Pressable style={s.continueBtn} onPress={() => navigation.goBack()}>
              <Text style={s.continueBtnText}>Return to Campaigns</Text>
            </Pressable>
          ) : (
            <Pressable style={[s.continueBtn, s.claimBtn]} onPress={handleClaimReward}>
              <Text style={s.continueBtnText}>Claim +{campaignXp} XP  ⚡</Text>
            </Pressable>
          )}
        </View>
      </SafeAreaView>
    );
  }

  return null;
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: BG },

  header: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 12,
    borderBottomWidth: 1, borderBottomColor: BORDER, gap: 12,
  },
  closeBtn: {
    width: 34, height: 34, borderRadius: 17,
    backgroundColor: SURFACE2, alignItems: 'center', justifyContent: 'center',
  },
  headerTitle: {
    flex: 1, fontSize: 15, fontWeight: '700', color: TEXT, letterSpacing: 0.2,
  },
  progressDots: { flexDirection: 'row', gap: 6, alignItems: 'center' },
  dot: {
    width: 8, height: 8, borderRadius: 4,
    backgroundColor: SURFACE2, borderWidth: 1, borderColor: TEXT_MUTED,
  },
  dotFilled: { backgroundColor: GOLD, borderColor: GOLD },

  scroll: { flex: 1 },
  scrollPad: { padding: 20, paddingBottom: 12 },

  iconWrap: { alignItems: 'center', marginBottom: 20, marginTop: 4 },
  sceneTitle: {
    fontSize: 22, fontWeight: '800', color: TEXT,
    marginBottom: 16, letterSpacing: 0.2,
  },
  prose: { fontSize: 15, color: TEXT, lineHeight: 26, letterSpacing: 0.1 },
  setupProse: {
    fontSize: 14, color: TEXT_DIM, lineHeight: 22,
    marginBottom: 20, fontStyle: 'italic',
  },
  epilogue: {
    fontSize: 13, color: TEXT_DIM, lineHeight: 20,
    fontStyle: 'italic', marginTop: 16,
  },

  // ── Choice buttons ──────────────────────────────────────────────────────
  choicesWrap: { gap: 10 },
  choiceBtn: {
    backgroundColor: SURFACE, borderRadius: 12,
    borderWidth: 1, borderColor: BORDER,
    padding: 14, gap: 6,
  },
  choiceBtnPressed: { opacity: 0.7 },
  choiceLabelRow: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between', gap: 8,
  },
  choiceLabel: { flex: 1, fontSize: 16, fontWeight: '700', color: TEXT },
  choiceFlavor: { fontSize: 12, color: TEXT_DIM, lineHeight: 18 },
  abilityChip: {
    paddingHorizontal: 8, paddingVertical: 3,
    borderRadius: 6, borderWidth: 1,
  },
  abilityChipText: { fontSize: 10, fontWeight: '800', letterSpacing: 1 },
  checkInfoText: {
    fontSize: 11, color: TEXT_MUTED, marginTop: 2,
  },

  // ── Footer ──────────────────────────────────────────────────────────────
  footer: {
    paddingHorizontal: 16, paddingTop: 12,
    borderTopWidth: 1, borderTopColor: BORDER, backgroundColor: BG,
  },
  continueBtn: {
    backgroundColor: GOLD, borderRadius: 12,
    paddingVertical: 14, alignItems: 'center',
  },
  claimBtn: { backgroundColor: '#7B5EA7' },
  continueBtnText: {
    fontSize: 16, fontWeight: '800', color: BG, letterSpacing: 0.5,
  },

  // ── Check overlay ────────────────────────────────────────────────────────
  checkWrapper: {
    flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24,
  },
  checkCard: {
    width: '100%', backgroundColor: SURFACE,
    borderRadius: 16, borderWidth: 1, borderColor: BORDER,
    padding: 24, gap: 18, alignItems: 'center',
  },
  checkBadge: {
    paddingHorizontal: 18, paddingVertical: 8,
    borderRadius: 8, borderWidth: 1,
  },
  checkBadgeText: { fontSize: 14, fontWeight: '800', letterSpacing: 2.5 },
  checkStats: { width: '100%', gap: 0 },
  statRow: {
    flexDirection: 'row', justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1, borderBottomColor: BORDER,
  },
  statLabel: { fontSize: 13, color: TEXT_DIM },
  statValue: { fontSize: 13, fontWeight: '700', color: TEXT },
  checkResult: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingHorizontal: 20, paddingVertical: 14,
    borderRadius: 10, borderWidth: 1,
    width: '100%', justifyContent: 'center',
  },
  checkResultText: { fontSize: 17, fontWeight: '900', letterSpacing: 2 },
  chanceNote: { fontSize: 11, color: TEXT_MUTED },

  // ── Lobby ────────────────────────────────────────────────────────────────
  lobbyBanner: { alignItems: 'center', gap: 10, paddingTop: 8, marginBottom: 20 },
  lobbyTitle: {
    fontSize: 26, fontWeight: '900', color: GOLD,
    letterSpacing: 0.3, textAlign: 'center',
  },
  lobbySubtitle: {
    fontSize: 11, color: TEXT_DIM, letterSpacing: 1, textAlign: 'center',
  },
  lobbyRule: { height: 1, backgroundColor: BORDER, marginBottom: 20 },
  lobbyDesc: { fontSize: 15, color: TEXT, lineHeight: 26, letterSpacing: 0.1 },

  // ── Chapter log ──────────────────────────────────────────────────────────
  logSection: { marginTop: 24, gap: 10 },
  logSectionTitle: {
    fontSize: 10, fontWeight: '800', color: TEXT_DIM, letterSpacing: 2, marginBottom: 2,
  },
  logCard: {
    backgroundColor: SURFACE, borderRadius: 10,
    borderWidth: 1, borderColor: BORDER,
    padding: 12, gap: 4,
  },
  logChoiceNum: { fontSize: 10, fontWeight: '700', color: TEXT_DIM, letterSpacing: 1 },
  logOptionLabel: { fontSize: 14, fontWeight: '700', color: TEXT },
  logCheck: { fontSize: 12, fontWeight: '700', letterSpacing: 0.5 },
  logOutcome: { fontSize: 12, color: TEXT_DIM, fontStyle: 'italic' },

  // ── Completion ───────────────────────────────────────────────────────────
  completionBanner: {
    alignItems: 'center', gap: 8, marginBottom: 24, paddingTop: 4,
  },
  completionTitle: {
    fontSize: 24, fontWeight: '900', color: GOLD,
    letterSpacing: 0.5, textAlign: 'center',
  },
  completionSub: {
    fontSize: 10, fontWeight: '800', color: TEXT_DIM, letterSpacing: 3,
  },
  xpCard: {
    marginTop: 24, backgroundColor: SURFACE,
    borderRadius: 12, borderWidth: 1, borderColor: BORDER, padding: 16, gap: 10,
  },
  xpCardTitle: {
    fontSize: 10, fontWeight: '800', color: TEXT_DIM, letterSpacing: 2, marginBottom: 2,
  },
  xpRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  xpLabel: { fontSize: 13, color: TEXT_DIM },
  xpVal: { fontSize: 13, fontWeight: '700', color: TEXT },
  xpTotalRow: {
    paddingTop: 10, borderTopWidth: 1, borderTopColor: BORDER, marginTop: 4,
  },
  xpTotalLabel: { fontSize: 14, fontWeight: '700', color: TEXT },
  xpTotalVal: { fontSize: 18, fontWeight: '900', color: GOLD },
});
