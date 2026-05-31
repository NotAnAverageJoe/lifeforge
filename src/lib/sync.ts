import type { CampaignCompletion, Character, Habit } from '../types';
import { supabase } from './supabase';

export type RemoteData = {
  habits: Habit[];
  character: Character | null;
  totalXp: number;
  campaignCompletions: CampaignCompletion[];
};

async function uid(): Promise<string | null> {
  const { data: { user } } = await supabase.auth.getUser();
  return user?.id ?? null;
}

export async function pushHabit(habit: Habit): Promise<void> {
  const userId = await uid();
  if (!userId) return;
  await supabase.from('habits').upsert({
    id: habit.id,
    user_id: userId,
    data: habit,
    updated_at: new Date().toISOString(),
  });
}

export async function deleteHabitRemote(habitId: string): Promise<void> {
  const userId = await uid();
  if (!userId) return;
  await supabase.from('habits').delete().match({ id: habitId, user_id: userId });
}

export async function pushCharacter(character: Character): Promise<void> {
  const userId = await uid();
  if (!userId) return;
  await supabase.from('characters').upsert({
    user_id: userId,
    data: character,
    updated_at: new Date().toISOString(),
  });
}

export async function deleteCharacterRemote(): Promise<void> {
  const userId = await uid();
  if (!userId) return;
  await supabase.from('characters').delete().eq('user_id', userId);
}

export async function pushXp(totalXp: number): Promise<void> {
  const userId = await uid();
  if (!userId) return;
  await supabase.from('user_xp').upsert({
    user_id: userId,
    total_xp: totalXp,
    updated_at: new Date().toISOString(),
  });
}

export async function pushCampaignCompletion(completion: CampaignCompletion): Promise<void> {
  const userId = await uid();
  if (!userId) return;
  await supabase.from('campaign_completions').upsert({
    user_id: userId,
    campaign_id: completion.campaignId,
    data: completion,
    updated_at: new Date().toISOString(),
  });
}

export async function deleteCampaignCompletionsRemote(): Promise<void> {
  const userId = await uid();
  if (!userId) return;
  await supabase.from('campaign_completions').delete().eq('user_id', userId);
}

export async function clearAllRemote(): Promise<void> {
  const userId = await uid();
  if (!userId) return;
  await Promise.all([
    supabase.from('habits').delete().eq('user_id', userId),
    supabase.from('characters').delete().eq('user_id', userId),
    supabase.from('user_xp').delete().eq('user_id', userId),
    supabase.from('campaign_completions').delete().eq('user_id', userId),
  ]);
}

export async function pullAll(): Promise<RemoteData | null> {
  const userId = await uid();
  if (!userId) return null;

  const [habitsRes, charRes, xpRes, campRes] = await Promise.all([
    supabase.from('habits').select('data').eq('user_id', userId),
    supabase.from('characters').select('data').eq('user_id', userId).maybeSingle(),
    supabase.from('user_xp').select('total_xp').eq('user_id', userId).maybeSingle(),
    supabase.from('campaign_completions').select('data').eq('user_id', userId),
  ]);

  return {
    habits: (habitsRes.data ?? []).map((r: any) => r.data as Habit),
    character: charRes.data ? (charRes.data.data as Character) : null,
    totalXp: xpRes.data?.total_xp ?? 0,
    campaignCompletions: (campRes.data ?? []).map((r: any) => r.data as CampaignCompletion),
  };
}

export async function pushAllLocal(
  habits: Habit[],
  character: Character | null,
  totalXp: number,
  campaignCompletions: CampaignCompletion[],
): Promise<void> {
  const userId = await uid();
  if (!userId) return;
  const now = new Date().toISOString();
  const ops: PromiseLike<any>[] = [
    supabase.from('user_xp').upsert({ user_id: userId, total_xp: totalXp, updated_at: now }),
  ];
  if (habits.length > 0) {
    ops.push(supabase.from('habits').upsert(
      habits.map(h => ({ id: h.id, user_id: userId, data: h, updated_at: now }))
    ));
  }
  if (character) {
    ops.push(supabase.from('characters').upsert({ user_id: userId, data: character, updated_at: now }));
  }
  if (campaignCompletions.length > 0) {
    ops.push(supabase.from('campaign_completions').upsert(
      campaignCompletions.map(c => ({
        user_id: userId,
        campaign_id: c.campaignId,
        data: c,
        updated_at: now,
      }))
    ));
  }
  await Promise.all(ops);
}
