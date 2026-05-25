import type { AbilityScores, CharacterClass } from '../types';

export type AbilityKey = keyof AbilityScores;

export type Question = {
  id: string;
  ability: AbilityKey;
  text: string;
  options: [string, string, string, string, string];
};

export type ClassDef = {
  id: CharacterClass;
  name: string;
  icon: string;
  tagline: string;
  description: string;
  primaryAbilities: [AbilityKey, AbilityKey];
};

export const ABILITY_META: Record<AbilityKey, { label: string; abbr: string; color: string; icon: string }> = {
  strength:     { label: 'Strength',     abbr: 'STR', color: '#E05A5A', icon: '💪' },
  dexterity:    { label: 'Dexterity',    abbr: 'DEX', color: '#4DD890', icon: '🌀' },
  constitution: { label: 'Constitution', abbr: 'CON', color: '#E8904A', icon: '🛡️' },
  intelligence: { label: 'Intelligence', abbr: 'INT', color: '#5B9CF6', icon: '📚' },
  wisdom:       { label: 'Wisdom',       abbr: 'WIS', color: '#A374D8', icon: '🔮' },
  charisma:     { label: 'Charisma',     abbr: 'CHA', color: '#E86FA0', icon: '✨' },
};

export const ABILITY_DETAILS: Record<AbilityKey, { description: string; examples: string[] }> = {
  strength: {
    description: "Raw physical power — your ability to lift, push, pull, and overcome resistance. Strength is the foundation of a warrior's might.",
    examples: ['Weightlifting & barbell training', 'Bodyweight exercises (pull-ups, dips)', 'Rock climbing', 'Resistance band training', 'Carrying heavy loads regularly'],
  },
  dexterity: {
    description: 'Speed, agility, and precision — the mastery of your body\'s movements. Dexterity lets you strike fast and move with grace under pressure.',
    examples: ['Yoga & flexibility training', 'Martial arts or boxing', 'Dance or movement practice', 'Agility ladder drills', 'Juggling or fine motor skill practice'],
  },
  constitution: {
    description: 'Endurance, resilience, and vitality — how well your body sustains effort and recovers. A high constitution means you outlast every challenge.',
    examples: ['Running, cycling, or rowing', 'Cold exposure (showers or ice baths)', 'Consistent sleep schedule', 'Nutrition & hydration habits', 'Breathwork & recovery practice'],
  },
  intelligence: {
    description: 'The capacity to learn, reason, and apply knowledge. Intelligence is sharpened by study, curiosity, and the relentless pursuit of understanding.',
    examples: ['Reading books (fiction & non-fiction)', 'Online courses or formal study', 'Learning a new language', 'Coding or mathematics', 'Writing & critical analysis'],
  },
  wisdom: {
    description: 'Insight, self-awareness, and good judgment — the art of turning experience into understanding. Wisdom is the quiet power behind every great decision.',
    examples: ['Daily journaling', 'Meditation & mindfulness', 'Therapy or coaching sessions', 'Reviewing past decisions', 'Gratitude & reflection practices'],
  },
  charisma: {
    description: 'Presence, persuasion, and the power to inspire. Charisma is the force that draws people to you and opens doors that no key can unlock.',
    examples: ['Public speaking & storytelling', 'Networking & social events', 'Improv theatre or acting', 'Podcasting or content creation', 'Leadership & mentoring others'],
  },
};

export const ABILITY_ORDER: AbilityKey[] = [
  'strength', 'dexterity', 'constitution', 'intelligence', 'wisdom', 'charisma',
];

// One question per ability — slider answers 1–5
export const QUESTIONS: Question[] = [
  {
    id: 'str',
    ability: 'strength',
    text: 'How often do you lift weights or do strength training?',
    options: ['Never', 'Rarely', 'Sometimes', 'Often', 'Every day'],
  },
  {
    id: 'dex',
    ability: 'dexterity',
    text: 'How often do you practise flexibility, yoga, or agility training?',
    options: ['Never', 'Rarely', 'Sometimes', 'Regularly', 'Daily'],
  },
  {
    id: 'con',
    ability: 'constitution',
    text: 'How would you rate your stamina, sleep quality, and physical resilience?',
    options: ['Very poor', 'Below average', 'Average', 'Good', 'Excellent'],
  },
  {
    id: 'int',
    ability: 'intelligence',
    text: 'How often do you read books, study, or actively learn new skills?',
    options: ['Never', 'Rarely', 'Sometimes', 'Regularly', 'Every day'],
  },
  {
    id: 'wis',
    ability: 'wisdom',
    text: 'How often do you journal, meditate, or reflect on your decisions?',
    options: ['Never', 'Rarely', 'Sometimes', 'Regularly', 'Daily practice'],
  },
  {
    id: 'cha',
    ability: 'charisma',
    text: 'How would you describe your social energy and presence?',
    options: ['Very withdrawn', 'Mostly reserved', 'Balanced', 'Outgoing', 'Natural leader'],
  },
];

export const CLASSES: ClassDef[] = [
  {
    id: 'warrior',
    name: 'Warrior',
    icon: '⚔️',
    tagline: 'Unyielding. Relentless. Forged in iron.',
    description: 'You meet every challenge head-on with raw strength and endurance.',
    primaryAbilities: ['strength', 'constitution'],
  },
  {
    id: 'rogue',
    name: 'Rogue',
    icon: '🗡️',
    tagline: 'Swift. Sharp. Always one step ahead.',
    description: 'Precision, agility, and cunning over brute force — always.',
    primaryAbilities: ['dexterity', 'intelligence'],
  },
  {
    id: 'mage',
    name: 'Mage',
    icon: '🔮',
    tagline: 'Knowledge is the greatest power.',
    description: 'A tireless scholar of all things arcane. Wisdom tempers your intellect.',
    primaryAbilities: ['intelligence', 'wisdom'],
  },
  {
    id: 'cleric',
    name: 'Cleric',
    icon: '✨',
    tagline: 'Healer of body. Guardian of spirit.',
    description: 'Guided by wisdom and sustained by iron will, you restore and uplift.',
    primaryAbilities: ['wisdom', 'constitution'],
  },
  {
    id: 'ranger',
    name: 'Ranger',
    icon: '🏹',
    tagline: 'Fleet of foot. True of eye.',
    description: 'A master of survival who blends physical power with uncanny agility.',
    primaryAbilities: ['dexterity', 'strength'],
  },
  {
    id: 'bard',
    name: 'Bard',
    icon: '🎭',
    tagline: 'Every room lights up when you walk in.',
    description: 'Your greatest power is your magnetism. Charm opens every door.',
    primaryAbilities: ['charisma', 'intelligence'],
  },
];

// answers: 6 values (1-5), one per ability in ABILITY_ORDER order
export function computeAbilities(answers: number[]): AbilityScores {
  return {
    strength:     answers[0] ?? 3,
    dexterity:    answers[1] ?? 3,
    constitution: answers[2] ?? 3,
    intelligence: answers[3] ?? 3,
    wisdom:       answers[4] ?? 3,
    charisma:     answers[5] ?? 3,
  };
}

export function suggestClass(abilities: AbilityScores): CharacterClass {
  const scores: Record<CharacterClass, number> = {
    warrior: abilities.strength * 2 + abilities.constitution,
    rogue:   abilities.dexterity * 2 + abilities.intelligence,
    mage:    abilities.intelligence * 2 + abilities.wisdom,
    cleric:  abilities.wisdom * 2 + abilities.constitution,
    ranger:  abilities.dexterity * 2 + abilities.strength,
    bard:    abilities.charisma * 3,
  };
  return (Object.entries(scores) as [CharacterClass, number][]).reduce<CharacterClass>(
    (best, [cls, score]) => (score > scores[best] ? cls : best),
    'warrior'
  );
}
