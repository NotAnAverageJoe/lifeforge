import * as Haptics from 'expo-haptics';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import React, { useRef, useState } from 'react';
import {
  Animated,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  ABILITY_META,
  ABILITY_ORDER,
  CLASSES,
  QUESTIONS,
  computeAbilities,
  suggestClass,
  type AbilityKey,
} from '../data/onboarding';
import ClassIcon from '../components/ClassIcon';
import { useAppStore } from '../store';
import { totalXpForAbilityLevel } from '../xp';
import {
  BG, BORDER, GOLD, GOLD_DIM, SURFACE, SURFACE2,
  TEXT, TEXT_DIM, TEXT_MUTED, PURPLE_DIM, PURPLE,
} from '../theme';
import type { AbilityScores, Character, CharacterClass, Gender } from '../types';

type IdentityData = { name: string; birthday: Date; gender: Gender };

function calcAge(birthday: Date): number {
  const today = new Date();
  let age = today.getFullYear() - birthday.getFullYear();
  const m = today.getMonth() - birthday.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birthday.getDate())) age--;
  return age;
}

const GENDERS: { key: Gender; label: string }[] = [
  { key: 'male', label: 'Male' },
  { key: 'female', label: 'Female' },
  { key: 'non-binary', label: 'Non-binary' },
  { key: 'prefer not to say', label: 'Prefer not to say' },
];

// ─── Main wizard ─────────────────────────────────────────────────────────────

export default function OnboardingFlow() {
  const { completeOnboarding } = useAppStore();
  const [step, setStep] = useState(0);
  const [identity, setIdentity] = useState<IdentityData>({
    name: '',
    birthday: new Date('2000-01-01'),
    gender: 'prefer not to say',
  });
  const [abilitiesMode, setAbilitiesMode] = useState<'quiz' | 'manual'>('quiz');
  const [answers, setAnswers] = useState<number[]>(Array(QUESTIONS.length).fill(3));
  const [manualAbilities, setManualAbilities] = useState<AbilityScores>({
    strength: 3, dexterity: 3, constitution: 3,
    intelligence: 3, wisdom: 3, charisma: 3,
  });

  function handleIdentityNext(data: IdentityData) {
    setIdentity(data);
    setStep(2);
  }

  function handleAbilitiesNext(ans: number[]) {
    setAnswers(ans);
    setStep(3);
  }

  function handleManualNext(abilities: AbilityScores) {
    setManualAbilities(abilities);
    setStep(3);
  }

  function handleComplete(characterClass: CharacterClass) {
    const abilities = abilitiesMode === 'quiz'
      ? computeAbilities(answers)
      : manualAbilities;
    const abilityXp: Partial<Record<keyof AbilityScores, number>> = {};
    for (const key of ABILITY_ORDER) {
      abilityXp[key] = totalXpForAbilityLevel(abilities[key]);
    }
    const character: Character = {
      name: identity.name,
      birthday: identity.birthday.toISOString().split('T')[0],
      gender: identity.gender,
      abilities,
      characterClass,
      abilityXp,
    };
    completeOnboarding(character);
  }

  const resolvedAbilities = abilitiesMode === 'quiz'
    ? computeAbilities(answers)
    : manualAbilities;

  switch (step) {
    case 0: return <WelcomeStep onNext={() => setStep(1)} />;
    case 1: return (
      <IdentityStep
        initial={identity}
        onNext={handleIdentityNext}
        onBack={() => setStep(0)}
      />
    );
    case 2:
      if (abilitiesMode === 'manual') {
        return (
          <ManualAbilitiesStep
            initial={manualAbilities}
            onNext={handleManualNext}
            onBack={() => setAbilitiesMode('quiz')}
          />
        );
      }
      return (
        <AbilitiesStep
          initialAnswers={answers}
          onNext={handleAbilitiesNext}
          onBack={() => setStep(1)}
          onManual={() => setAbilitiesMode('manual')}
        />
      );
    case 3: return (
      <ClassStep
        abilities={resolvedAbilities}
        onComplete={handleComplete}
        onBack={() => setStep(2)}
      />
    );
    default: return null;
  }
}

// ─── Step 1: Welcome / How It Works ──────────────────────────────────────────

const HOW_IT_WORKS = [
  {
    icon: 'sword-cross',
    color: '#C9A84C',
    title: 'Side Quests',
    desc: 'Turn daily and weekly habits into quests. Complete them to earn XP, build streaks, and track your history on the Calendar.',
  },
  {
    icon: 'shield-star',
    color: '#5B9CF6',
    title: 'Abilities & Class',
    desc: 'Six ability scores — Strength, Dexterity, Constitution, Intelligence, Wisdom, Charisma — define how you grow. Your class grants +2 to its two key abilities, boosting your edge in everything you do.',
  },
  {
    icon: 'map',
    color: '#A374D8',
    title: 'Campaigns',
    desc: 'Story-driven adventures with branching choices and ability checks. Your ability levels directly affect your odds of success on each check.',
  },
  {
    icon: 'chevron-triple-up',
    color: '#4DD890',
    title: 'Rank Up',
    desc: 'Every completed quest earns XP. Climb from Rank 1 to Rank 20 — early ranks come quickly, but reaching the top takes years of real-world dedication.',
  },
] as const;

function WelcomeStep({ onNext }: { onNext: () => void }) {
  return (
    <SafeAreaView style={w.safe}>
      <StatusBar barStyle="light-content" />
      <ScrollView contentContainerStyle={w.scroll} showsVerticalScrollIndicator={false}>
        <View style={w.crest}>
          <MaterialCommunityIcons name="sword-cross" size={44} color={GOLD} />
          <View style={w.crestLine} />
        </View>

        <Text style={w.title}>LIFEFORGE</Text>
        <Text style={w.subtitle}>HOW IT WORKS</Text>

        <View style={w.cards}>
          {HOW_IT_WORKS.map(item => (
            <View key={item.title} style={[w.card, { borderLeftColor: item.color }]}>
              <View style={[w.cardIconWrap, { backgroundColor: item.color + '1A' }]}>
                <MaterialCommunityIcons name={item.icon as any} size={20} color={item.color} />
              </View>
              <View style={w.cardBody}>
                <Text style={[w.cardTitle, { color: item.color }]}>{item.title}</Text>
                <Text style={w.cardDesc}>{item.desc}</Text>
              </View>
            </View>
          ))}
        </View>

        <Text style={w.lore}>Your legend begins now.</Text>

        <Pressable
          style={({ pressed }) => [w.cta, pressed && w.ctaPressed]}
          onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); onNext(); }}
        >
          <Text style={w.ctaText}>Begin Character Creation  ›</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const w = StyleSheet.create({
  safe: { flex: 1, backgroundColor: BG },
  scroll: { padding: 24, paddingBottom: 48, alignItems: 'center' },
  crest: { alignItems: 'center', marginTop: 16, marginBottom: 16 },
  crestLine: { marginTop: 8, width: 44, height: 2, backgroundColor: GOLD, opacity: 0.5 },
  title: {
    fontSize: 32, fontWeight: '900', color: GOLD,
    letterSpacing: 6, textAlign: 'center', marginBottom: 6,
  },
  subtitle: {
    fontSize: 11, fontWeight: '800', color: TEXT_DIM,
    letterSpacing: 4, textAlign: 'center', marginBottom: 24,
  },
  cards: { width: '100%', gap: 10, marginBottom: 28 },
  card: {
    backgroundColor: SURFACE, borderRadius: 14, borderWidth: 1,
    borderColor: BORDER, borderLeftWidth: 3,
    flexDirection: 'row', padding: 14, gap: 12, alignItems: 'flex-start',
  },
  cardIconWrap: {
    width: 36, height: 36, borderRadius: 10,
    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  cardBody: { flex: 1 },
  cardTitle: { fontSize: 13, fontWeight: '800', letterSpacing: 0.3, marginBottom: 4 },
  cardDesc: { fontSize: 13, color: TEXT_DIM, lineHeight: 19 },
  lore: {
    fontSize: 13, color: TEXT_MUTED, textAlign: 'center',
    fontStyle: 'italic', marginBottom: 24,
  },
  cta: {
    width: '100%', paddingVertical: 16, borderRadius: 14,
    backgroundColor: GOLD, alignItems: 'center',
  },
  ctaPressed: { opacity: 0.8 },
  ctaText: { fontSize: 16, fontWeight: '800', color: BG, letterSpacing: 1 },
});

// ─── Step 2: Identity ─────────────────────────────────────────────────────────

function IdentityStep({
  initial, onNext, onBack,
}: {
  initial: IdentityData;
  onNext: (data: IdentityData) => void;
  onBack: () => void;
}) {
  const [name, setName] = useState(initial.name);
  const [birthday, setBirthday] = useState(initial.birthday);
  const [gender, setGender] = useState<Gender>(initial.gender);
  const [showPicker, setShowPicker] = useState(false);

  const age = calcAge(birthday);
  const canProceed = name.trim().length >= 2;
  const birthdayLabel = birthday.toLocaleDateString('en-US', {
    month: 'long', day: 'numeric', year: 'numeric',
  });

  return (
    <SafeAreaView style={id.safe}>
      <StatusBar barStyle="light-content" />
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView contentContainerStyle={id.scroll} keyboardShouldPersistTaps="handled">
          <StepHeader current={2} total={4} title="Who are you, Adventurer?" onBack={onBack} />

          <FieldLabel>Your Name</FieldLabel>
          <TextInput
            style={id.input}
            value={name}
            onChangeText={setName}
            placeholder="Enter your name"
            placeholderTextColor={TEXT_MUTED}
            maxLength={40}
            autoFocus
          />

          <FieldLabel>Birthday</FieldLabel>
          <Pressable style={id.dateBtn} onPress={() => setShowPicker(true)}>
            <Text style={id.dateBtnMain}>🎂  {birthdayLabel}</Text>
            <Text style={id.dateBtnAge}>Age {age}</Text>
          </Pressable>

          {Platform.OS === 'ios' ? (
            <Modal visible={showPicker} transparent animationType="slide">
              <Pressable style={id.pickerOverlay} onPress={() => setShowPicker(false)}>
                <Pressable style={id.pickerSheet} onPress={e => e.stopPropagation()}>
                  <View style={id.pickerHeader}>
                    <Text style={id.pickerTitle}>Select Birthday</Text>
                    <Pressable style={id.doneBtn} onPress={() => setShowPicker(false)}>
                      <Text style={id.doneBtnText}>Done</Text>
                    </Pressable>
                  </View>
                  <DateTimePicker
                    value={birthday}
                    mode="date"
                    display="spinner"
                    maximumDate={new Date()}
                    minimumDate={new Date('1920-01-01')}
                    onChange={(_, date) => { if (date) setBirthday(date); }}
                    style={id.picker}
                  />
                </Pressable>
              </Pressable>
            </Modal>
          ) : (
            showPicker && (
              <DateTimePicker
                value={birthday}
                mode="date"
                display="default"
                maximumDate={new Date()}
                minimumDate={new Date('1920-01-01')}
                onChange={(event, date) => {
                  setShowPicker(false);
                  if (event.type === 'set' && date) setBirthday(date);
                }}
              />
            )
          )}

          <FieldLabel>Gender</FieldLabel>
          <View style={id.genderGrid}>
            {GENDERS.map(g => (
              <Pressable
                key={g.key}
                style={[id.genderChip, gender === g.key && id.genderChipSelected]}
                onPress={() => setGender(g.key)}
              >
                <Text style={[id.genderChipText, gender === g.key && id.genderChipTextSelected]}>
                  {g.label}
                </Text>
              </Pressable>
            ))}
          </View>
        </ScrollView>

        <View style={id.footer}>
          <Pressable style={id.backBtn} onPress={onBack}>
            <Text style={id.backBtnText}>‹ Back</Text>
          </Pressable>
          <Pressable
            style={[id.nextBtn, !canProceed && id.nextBtnDisabled]}
            onPress={() => { if (canProceed) onNext({ name, birthday, gender }); }}
          >
            <Text style={id.nextBtnText}>Continue ›</Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const id = StyleSheet.create({
  safe: { flex: 1, backgroundColor: BG },
  scroll: { padding: 20, paddingBottom: 8 },
  input: {
    backgroundColor: SURFACE, borderRadius: 12, borderWidth: 1,
    borderColor: BORDER, padding: 14, fontSize: 16, color: TEXT, marginBottom: 20,
  },
  dateBtn: {
    backgroundColor: SURFACE, borderRadius: 12, borderWidth: 1, borderColor: BORDER,
    paddingHorizontal: 16, paddingVertical: 14, marginBottom: 20,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
  },
  dateBtnMain: { fontSize: 15, color: TEXT },
  dateBtnAge: { fontSize: 13, color: GOLD, fontWeight: '700' },
  pickerOverlay: {
    flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.6)',
  },
  pickerSheet: {
    backgroundColor: SURFACE, borderTopLeftRadius: 20, borderTopRightRadius: 20,
    borderWidth: 1, borderColor: BORDER, paddingBottom: 32,
  },
  pickerHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingTop: 16, paddingBottom: 12,
    borderBottomWidth: 1, borderBottomColor: BORDER,
  },
  pickerTitle: { fontSize: 15, fontWeight: '700', color: TEXT },
  picker: { backgroundColor: SURFACE },
  doneBtn: {
    backgroundColor: GOLD, borderRadius: 10, paddingVertical: 8, paddingHorizontal: 16,
    alignItems: 'center',
  },
  doneBtnText: { fontWeight: '700', color: BG },
  genderGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 20 },
  genderChip: {
    paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20,
    backgroundColor: SURFACE, borderWidth: 1, borderColor: BORDER,
  },
  genderChipSelected: { backgroundColor: GOLD_DIM, borderColor: GOLD },
  genderChipText: { fontSize: 14, color: TEXT_DIM, fontWeight: '600' },
  genderChipTextSelected: { color: GOLD },
  footer: {
    flexDirection: 'row', padding: 20, gap: 12,
    borderTopWidth: 1, borderTopColor: BORDER, backgroundColor: BG,
  },
  backBtn: {
    flex: 1, paddingVertical: 14, borderRadius: 12,
    backgroundColor: SURFACE, alignItems: 'center', borderWidth: 1, borderColor: BORDER,
  },
  backBtnText: { fontWeight: '700', color: TEXT_DIM, fontSize: 15 },
  nextBtn: { flex: 2, paddingVertical: 14, borderRadius: 12, backgroundColor: GOLD, alignItems: 'center' },
  nextBtnDisabled: { opacity: 0.35 },
  nextBtnText: { fontWeight: '800', color: BG, fontSize: 15, letterSpacing: 0.5 },
});

// ─── Step 3a: Abilities Quiz ──────────────────────────────────────────────────

function AbilitiesStep({
  initialAnswers, onNext, onBack, onManual,
}: {
  initialAnswers: number[];
  onNext: (answers: number[]) => void;
  onBack: () => void;
  onManual: () => void;
}) {
  const [currentQ, setCurrentQ] = useState(0);
  const [answers, setAnswers] = useState<number[]>(
    initialAnswers.length === QUESTIONS.length ? [...initialAnswers] : Array(QUESTIONS.length).fill(3)
  );
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const slideAnim = useRef(new Animated.Value(0)).current;
  const isTransitioning = useRef(false);

  const totalQ = QUESTIONS.length;
  const safeQ = Math.max(0, Math.min(currentQ, totalQ - 1));
  const q = QUESTIONS[safeQ];

  function animateTransition(updateFn: () => void) {
    isTransitioning.current = true;
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 0, duration: 130, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: -12, duration: 130, useNativeDriver: true }),
    ]).start(() => {
      updateFn();
      isTransitioning.current = false;
      slideAnim.setValue(14);
      Animated.parallel([
        Animated.timing(fadeAnim, { toValue: 1, duration: 180, useNativeDriver: true }),
        Animated.timing(slideAnim, { toValue: 0, duration: 180, useNativeDriver: true }),
      ]).start();
    });
  }

  function handleSlider(val: number) {
    const next = [...answers];
    next[safeQ] = val;
    setAnswers(next);
  }

  function handleNext() {
    if (isTransitioning.current) return;
    Haptics.selectionAsync();
    if (currentQ < totalQ - 1) {
      animateTransition(() => setCurrentQ(prev => prev + 1));
    } else {
      onNext(answers);
    }
  }

  function goBack() {
    if (isTransitioning.current) return;
    if (currentQ > 0) {
      animateTransition(() => setCurrentQ(prev => prev - 1));
    } else {
      onBack();
    }
  }

  const progressColor = ABILITY_META[q.ability].color;
  const selectedLabel = q.options[answers[safeQ] - 1];

  return (
    <SafeAreaView style={ab.safe}>
      <StatusBar barStyle="light-content" />

      <View style={ab.progressWrap}>
        {QUESTIONS.map((qq, i) => (
          <View
            key={qq.id}
            style={[
              ab.progressSeg,
              {
                backgroundColor:
                  i < currentQ
                    ? ABILITY_META[qq.ability].color
                    : i === currentQ
                    ? ABILITY_META[qq.ability].color + '88'
                    : SURFACE2,
              },
            ]}
          />
        ))}
      </View>

      <View style={ab.counterRow}>
        <Text style={ab.counterText}>Question {currentQ + 1} of {totalQ}</Text>
      </View>

      <Animated.View
        style={[ab.questionWrap, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}
      >
        <View style={[ab.abilityTag, { backgroundColor: progressColor + '22', borderColor: progressColor + '55' }]}>
          <View style={[ab.abilityDot, { backgroundColor: progressColor }]} />
          <Text style={[ab.abilityTagText, { color: progressColor }]}>
            {ABILITY_META[q.ability].label}
          </Text>
        </View>

        <Text style={ab.question}>{q.text}</Text>

        <StepSlider
          value={answers[currentQ]}
          onChange={handleSlider}
          color={progressColor}
          minLabel={q.options[0]}
          maxLabel={q.options[4]}
        />

        <Text style={[ab.selectedLabel, { color: progressColor }]}>
          {selectedLabel}
        </Text>
      </Animated.View>

      <View style={ab.footer}>
        <Pressable style={ab.backBtn} onPress={goBack}>
          <Text style={ab.backBtnText}>‹ Back</Text>
        </Pressable>
        <Pressable style={ab.nextBtn} onPress={handleNext}>
          <Text style={ab.nextBtnText}>
            {currentQ === totalQ - 1 ? 'See Results ›' : 'Next ›'}
          </Text>
        </Pressable>
      </View>

      <Pressable style={ab.manualLink} onPress={onManual}>
        <Text style={ab.manualLinkText}>Enter stats manually instead</Text>
      </Pressable>
    </SafeAreaView>
  );
}

const ab = StyleSheet.create({
  safe: { flex: 1, backgroundColor: BG },
  progressWrap: {
    flexDirection: 'row', paddingHorizontal: 16, paddingTop: 16,
    gap: 3, height: 28, alignItems: 'center',
  },
  progressSeg: { flex: 1, height: 6, borderRadius: 3 },
  counterRow: { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 4 },
  counterText: { fontSize: 12, color: TEXT_MUTED, fontWeight: '600', letterSpacing: 0.5 },
  questionWrap: { flex: 1, paddingHorizontal: 20, paddingTop: 12 },
  abilityTag: {
    flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start',
    borderWidth: 1, borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4,
    marginBottom: 16, gap: 6,
  },
  abilityDot: { width: 6, height: 6, borderRadius: 3 },
  abilityTagText: { fontSize: 11, fontWeight: '700', letterSpacing: 1 },
  question: { fontSize: 20, fontWeight: '700', color: TEXT, lineHeight: 28, marginBottom: 28 },
  selectedLabel: {
    textAlign: 'center', fontSize: 15, fontWeight: '700',
    marginTop: 12, letterSpacing: 0.3,
  },
  footer: {
    flexDirection: 'row', padding: 20, gap: 12,
    borderTopWidth: 1, borderTopColor: BORDER, backgroundColor: BG,
  },
  backBtn: {
    flex: 1, paddingVertical: 14, borderRadius: 12,
    backgroundColor: SURFACE, alignItems: 'center', borderWidth: 1, borderColor: BORDER,
  },
  backBtnText: { fontWeight: '700', color: TEXT_DIM, fontSize: 15 },
  nextBtn: { flex: 2, paddingVertical: 14, borderRadius: 12, backgroundColor: GOLD, alignItems: 'center' },
  nextBtnText: { fontWeight: '800', color: BG, fontSize: 15, letterSpacing: 0.5 },
  manualLink: { paddingVertical: 12, alignItems: 'center' },
  manualLinkText: { fontSize: 13, color: TEXT_MUTED, textDecorationLine: 'underline' },
});

// ─── Step 3b: Manual Abilities ────────────────────────────────────────────────

function ManualAbilitiesStep({
  initial, onNext, onBack,
}: {
  initial: AbilityScores;
  onNext: (abilities: AbilityScores) => void;
  onBack: () => void;
}) {
  const [abilities, setAbilities] = useState<AbilityScores>({ ...initial });

  function update(key: AbilityKey, val: number) {
    setAbilities(prev => ({ ...prev, [key]: val }));
  }

  return (
    <SafeAreaView style={ma.safe}>
      <StatusBar barStyle="light-content" />
      <ScrollView contentContainerStyle={ma.scroll} showsVerticalScrollIndicator={false}>
        <StepHeader current={3} total={4} title="Set Your Abilities" onBack={onBack} />

        <Text style={ma.subtitle}>
          Rate yourself honestly — the realm reflects your true strengths.
        </Text>

        {ABILITY_ORDER.map(key => {
          const meta = ABILITY_META[key];
          const score = abilities[key];
          return (
            <View key={key} style={ma.row}>
              <View style={ma.rowHeader}>
                <View style={[ma.dot, { backgroundColor: meta.color }]} />
                <Text style={[ma.abilLabel, { color: meta.color }]}>{meta.label.toUpperCase()}</Text>
                <Text style={[ma.scoreNum, { color: meta.color }]}>{score}/5</Text>
              </View>
              <StepSlider
                value={score}
                onChange={val => update(key, val)}
                color={meta.color}
                minLabel="Low"
                maxLabel="High"
              />
            </View>
          );
        })}
      </ScrollView>

      <View style={ma.footer}>
        <Pressable style={ma.backBtn} onPress={onBack}>
          <Text style={ma.backBtnText}>‹ Back</Text>
        </Pressable>
        <Pressable
          style={ma.nextBtn}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            onNext(abilities);
          }}
        >
          <Text style={ma.nextBtnText}>Continue ›</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const ma = StyleSheet.create({
  safe: { flex: 1, backgroundColor: BG },
  scroll: { padding: 20, paddingBottom: 8 },
  subtitle: {
    fontSize: 14, color: TEXT_MUTED, lineHeight: 20,
    textAlign: 'center', marginBottom: 20, fontStyle: 'italic',
  },
  row: {
    backgroundColor: SURFACE, borderRadius: 14, borderWidth: 1,
    borderColor: BORDER, padding: 14, marginBottom: 10,
  },
  rowHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
  dot: { width: 8, height: 8, borderRadius: 4 },
  abilLabel: { fontSize: 11, fontWeight: '800', letterSpacing: 1.5, flex: 1 },
  scoreNum: { fontSize: 18, fontWeight: '800' },
  footer: {
    flexDirection: 'row', padding: 20, gap: 12,
    borderTopWidth: 1, borderTopColor: BORDER, backgroundColor: BG,
  },
  backBtn: {
    flex: 1, paddingVertical: 14, borderRadius: 12,
    backgroundColor: SURFACE, alignItems: 'center', borderWidth: 1, borderColor: BORDER,
  },
  backBtnText: { fontWeight: '700', color: TEXT_DIM, fontSize: 15 },
  nextBtn: { flex: 2, paddingVertical: 14, borderRadius: 12, backgroundColor: GOLD, alignItems: 'center' },
  nextBtnText: { fontWeight: '800', color: BG, fontSize: 15, letterSpacing: 0.5 },
});

// ─── Step 4: Class Selection ──────────────────────────────────────────────────

function ClassStep({
  abilities, onComplete, onBack,
}: {
  abilities: AbilityScores;
  onComplete: (cls: CharacterClass) => void;
  onBack: () => void;
}) {
  const suggested = suggestClass(abilities);
  const [selected, setSelected] = useState<CharacterClass>(suggested);

  return (
    <SafeAreaView style={cs.safe}>
      <StatusBar barStyle="light-content" />
      <ScrollView contentContainerStyle={cs.scroll} showsVerticalScrollIndicator={false}>
        <StepHeader current={4} total={4} title="Your nature is revealed…" onBack={onBack} />

        <View style={cs.abilitiesCard}>
          <Text style={cs.sectionLabel}>— Your Abilities —</Text>
          {ABILITY_ORDER.map(key => {
            const meta = ABILITY_META[key];
            const score = abilities[key];
            const pct = score / 5;
            return (
              <View key={key} style={cs.abilityRow}>
                <Text style={cs.abilAbbr}>{meta.abbr}</Text>
                <View style={cs.abilTrack}>
                  <View style={[cs.abilFill, { width: `${pct * 100}%`, backgroundColor: meta.color }]} />
                </View>
                <Text style={[cs.abilScore, { color: meta.color }]}>{score}</Text>
              </View>
            );
          })}
        </View>

        <Text style={cs.sectionLabel2}>— Choose Your Path —</Text>

        <View style={cs.suggestedCallout}>
          <Text style={cs.suggestedText}>
            ✦  The realm sees you as a{' '}
            <Text style={cs.suggestedClass}>
              {CLASSES.find(c => c.id === suggested)?.name}
            </Text>
          </Text>
        </View>

        <View style={cs.grid}>
          {CLASSES.map(cls => {
            const isSuggested = cls.id === suggested;
            const isSelected = cls.id === selected;
            return (
              <Pressable
                key={cls.id}
                style={[
                  cs.classCard,
                  isSuggested && cs.classCardSuggested,
                  isSelected && cs.classCardSelected,
                ]}
                onPress={() => { Haptics.selectionAsync(); setSelected(cls.id); }}
              >
                {isSuggested && (
                  <View style={cs.suggestedBadge}>
                    <Text style={cs.suggestedBadgeText}>SUGGESTED</Text>
                  </View>
                )}
                <ClassIcon classId={cls.id} color={isSelected ? GOLD : TEXT_DIM} width={28} height={28} />
                <Text style={[cs.className, isSelected && cs.classNameSelected]}>{cls.name}</Text>
                <Text style={cs.classTagline}>{cls.tagline}</Text>
                <View style={cs.classAbilRow}>
                  {cls.primaryAbilities.map(a => (
                    <View key={a} style={[cs.classAbilChip, { backgroundColor: ABILITY_META[a].color + '33' }]}>
                      <Text style={[cs.classAbilText, { color: ABILITY_META[a].color }]}>
                        {ABILITY_META[a].abbr}
                      </Text>
                    </View>
                  ))}
                </View>
              </Pressable>
            );
          })}
        </View>

        {(() => {
          const def = CLASSES.find(c => c.id === selected)!;
          return (
            <View style={cs.descCard}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <ClassIcon classId={def.id} color={GOLD} width={18} height={18} />
                <Text style={cs.descTitle}>{def.name}</Text>
              </View>
              <Text style={cs.descText}>{def.description}</Text>
            </View>
          );
        })()}

        <Pressable
          style={({ pressed }) => [cs.cta, pressed && cs.ctaPressed]}
          onPress={() => {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            onComplete(selected);
          }}
        >
          <Text style={cs.ctaText}>Forge Your Legend  ›</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const cs = StyleSheet.create({
  safe: { flex: 1, backgroundColor: BG },
  scroll: { padding: 20, paddingBottom: 48 },
  sectionLabel: {
    fontSize: 11, fontWeight: '700', color: GOLD,
    textAlign: 'center', letterSpacing: 2, marginBottom: 12,
  },
  sectionLabel2: {
    fontSize: 11, fontWeight: '700', color: GOLD,
    textAlign: 'center', letterSpacing: 2, marginTop: 20, marginBottom: 12,
  },
  abilitiesCard: {
    backgroundColor: SURFACE, borderRadius: 14, borderWidth: 1,
    borderColor: BORDER, padding: 16, gap: 10,
  },
  abilityRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  abilAbbr: { width: 32, fontSize: 11, fontWeight: '800', color: TEXT_DIM, letterSpacing: 0.5 },
  abilTrack: {
    flex: 1, height: 8, borderRadius: 4, backgroundColor: SURFACE2,
    overflow: 'hidden', borderWidth: 1, borderColor: BORDER,
  },
  abilFill: { height: '100%', borderRadius: 4 },
  abilScore: { width: 22, fontSize: 13, fontWeight: '800', textAlign: 'right' },
  suggestedCallout: {
    backgroundColor: PURPLE_DIM, borderRadius: 10, borderWidth: 1,
    borderColor: PURPLE + '55', paddingVertical: 10, paddingHorizontal: 14, marginBottom: 16,
  },
  suggestedText: { fontSize: 14, color: TEXT_DIM, textAlign: 'center' },
  suggestedClass: { color: GOLD, fontWeight: '800' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 16 },
  classCard: {
    width: '47.5%', backgroundColor: SURFACE, borderRadius: 14,
    borderWidth: 1, borderColor: BORDER, padding: 14, alignItems: 'center',
    gap: 6, position: 'relative', overflow: 'hidden',
  },
  classCardSuggested: { borderColor: GOLD + '88' },
  classCardSelected: { backgroundColor: GOLD_DIM, borderColor: GOLD, borderWidth: 2 },
  suggestedBadge: {
    position: 'absolute', top: 0, right: 0, backgroundColor: GOLD,
    paddingHorizontal: 6, paddingVertical: 2, borderBottomLeftRadius: 8,
  },
  suggestedBadgeText: { fontSize: 8, fontWeight: '900', color: BG, letterSpacing: 0.5 },
  classIcon: { fontSize: 28 },
  className: { fontSize: 15, fontWeight: '800', color: TEXT_DIM },
  classNameSelected: { color: GOLD },
  classTagline: { fontSize: 10, color: TEXT_MUTED, textAlign: 'center', lineHeight: 14, fontStyle: 'italic' },
  classAbilRow: { flexDirection: 'row', gap: 4, marginTop: 2 },
  classAbilChip: { borderRadius: 8, paddingHorizontal: 6, paddingVertical: 2 },
  classAbilText: { fontSize: 9, fontWeight: '800', letterSpacing: 0.5 },
  descCard: {
    backgroundColor: SURFACE, borderRadius: 14, borderWidth: 1,
    borderColor: BORDER, padding: 16, marginBottom: 24, gap: 6,
  },
  descTitle: { fontSize: 16, fontWeight: '800', color: GOLD },
  descText: { fontSize: 14, color: TEXT_DIM, lineHeight: 21 },
  cta: { paddingVertical: 16, borderRadius: 14, backgroundColor: GOLD, alignItems: 'center' },
  ctaPressed: { opacity: 0.8 },
  ctaText: { fontSize: 16, fontWeight: '800', color: BG, letterSpacing: 1 },
});

// ─── Shared: StepSlider ───────────────────────────────────────────────────────

function StepSlider({
  value, onChange, color, minLabel, maxLabel,
}: {
  value: number; // 1–5
  onChange: (v: number) => void;
  color: string;
  minLabel?: string;
  maxLabel?: string;
}) {
  return (
    <View style={sls.wrap}>
      <View style={sls.row}>
        {[1, 2, 3, 4, 5].map((n, i) => (
          <React.Fragment key={n}>
            {i > 0 && (
              <View style={[sls.connector, n <= value && { backgroundColor: color }]} />
            )}
            <Pressable
              onPress={() => { Haptics.selectionAsync(); onChange(n); }}
              style={sls.dotBtn}
              hitSlop={8}
            >
              <View style={[sls.dot, n <= value && { backgroundColor: color, borderColor: color }]}>
                {n === value && <View style={sls.inner} />}
              </View>
            </Pressable>
          </React.Fragment>
        ))}
      </View>
      {(minLabel || maxLabel) && (
        <View style={sls.labelRow}>
          <Text style={sls.labelText}>{minLabel ?? ''}</Text>
          <Text style={sls.labelText}>{maxLabel ?? ''}</Text>
        </View>
      )}
    </View>
  );
}

const sls = StyleSheet.create({
  wrap: { paddingVertical: 8 },
  row: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 4 },
  connector: { flex: 1, height: 3, borderRadius: 1.5, backgroundColor: BORDER },
  dotBtn: { padding: 6 },
  dot: {
    width: 30, height: 30, borderRadius: 15,
    backgroundColor: SURFACE2, borderWidth: 2, borderColor: BORDER,
    alignItems: 'center', justifyContent: 'center',
  },
  inner: { width: 10, height: 10, borderRadius: 5, backgroundColor: BG },
  labelRow: {
    flexDirection: 'row', justifyContent: 'space-between',
    paddingHorizontal: 10, marginTop: 4,
  },
  labelText: { fontSize: 11, color: TEXT_MUTED },
});

// ─── Shared: StepHeader & FieldLabel ─────────────────────────────────────────

function StepHeader({
  current, total, title, onBack,
}: {
  current: number;
  total: number;
  title: string;
  onBack: () => void;
}) {
  return (
    <View style={sh.wrap}>
      <View style={sh.topRow}>
        <Pressable onPress={onBack} style={sh.backBtn}>
          <Text style={sh.backText}>‹</Text>
        </Pressable>
        <Text style={sh.step}>Step {current} of {total}</Text>
        <View style={sh.backBtn} />
      </View>
      <Text style={sh.title}>{title}</Text>
      <View style={sh.progressBar}>
        {Array.from({ length: total }).map((_, i) => (
          <View key={i} style={[sh.seg, i < current && sh.segFilled]} />
        ))}
      </View>
    </View>
  );
}

function FieldLabel({ children }: { children: string }) {
  return <Text style={fl.label}>{children}</Text>;
}

const sh = StyleSheet.create({
  wrap: { marginBottom: 24 },
  topRow: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between', marginBottom: 8,
  },
  backBtn: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  backText: { fontSize: 26, color: GOLD, fontWeight: '300' },
  step: { fontSize: 12, color: TEXT_MUTED, fontWeight: '600', letterSpacing: 1 },
  title: { fontSize: 22, fontWeight: '800', color: GOLD, textAlign: 'center', marginBottom: 14 },
  progressBar: { flexDirection: 'row', gap: 6 },
  seg: { flex: 1, height: 4, borderRadius: 2, backgroundColor: SURFACE2 },
  segFilled: { backgroundColor: GOLD },
});

const fl = StyleSheet.create({
  label: {
    fontSize: 11, fontWeight: '700', color: TEXT_DIM,
    textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 8,
  },
});
