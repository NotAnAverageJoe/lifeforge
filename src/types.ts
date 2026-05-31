export type FrequencyType = 'daily' | 'weekly' | 'multiple';

export type Habit = {
  id: string;
  name: string;
  color: string;
  frequency: FrequencyType;
  timesPerDay: number;
  scheduledDays?: number[]; // weekly only: 1=Sun 2=Mon 3=Tue 4=Wed 5=Thu 6=Fri 7=Sat
  scheduledTime?: string | null; // 'HH:MM' — when the habit takes place (display only)
  reminder: string | null; // 'HH:MM'
  reminderLeadMinutes?: number; // minutes before scheduledTime to notify (default 5)
  notificationIds: string[];
  completions: Record<string, number>; // 'YYYY-MM-DD' -> count
  createdAt: string;
  linkedAbility?: keyof AbilityScores;
};

export type Gender = 'male' | 'female' | 'non-binary' | 'prefer not to say';

export type AbilityScores = {
  strength: number;
  dexterity: number;
  constitution: number;
  intelligence: number;
  wisdom: number;
  charisma: number;
};

export type CharacterClass = 'warrior' | 'rogue' | 'mage' | 'cleric' | 'ranger' | 'bard';

export type Character = {
  name: string;
  birthday: string; // YYYY-MM-DD
  gender: Gender;
  abilities: AbilityScores;
  characterClass: CharacterClass;
  abilityXp?: Partial<Record<keyof AbilityScores, number>>;
};

export type ChoiceLogEntry = {
  choiceTitle: string;
  optionLabel: string;
  abilityAbbr?: string;
  checkPassed?: boolean;
  outcomeTitle: string;
};

export type CampaignCompletion = {
  campaignId: string;
  completedAt: string; // ISO date string
  successfulChecks: number;
  xpEarned: number;
  choiceLog: ChoiceLogEntry[];
  endingSceneId?: string;
};

export type AppState = {
  habits: Habit[];
  totalXp: number;
  pendingLevelUp: number | null;
  character: Character | null;
  campaignCompletions: CampaignCompletion[];
  isLoaded: boolean;
};

export type RootStackParamList = {
  MainTabs: undefined;
  HabitForm: { habitId?: string };
  AbilityDetail: { ability: keyof AbilityScores };
  Calendar: undefined;
  CampaignPlay: { campaignId: string };
};

export type CampaignStatus = 'coming_soon' | 'available' | 'in_progress' | 'completed';

export type Campaign = {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  icon: string;
  status: CampaignStatus;
};

export type TabParamList = {
  SideQuests: undefined;
  Campaigns: undefined;
  Hero: undefined;
};
