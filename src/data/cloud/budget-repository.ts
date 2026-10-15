import { mapCloudError, toAppNumber, type CloudResult } from '@/data/cloud/types';
import { supabase } from '@/lib/supabase';

async function requireUserId(): Promise<{ userId: string | null; error: string | null }> {
  const { data, error } = await supabase.auth.getUser();

  if (error) {
    return { userId: null, error: mapCloudError(error.message) };
  }

  if (!data.user) {
    return { userId: null, error: 'You must be signed in.' };
  }

  return { userId: data.user.id, error: null };
}

export async function fetchCloudMonthlyBudget(): Promise<CloudResult<number | null>> {
  const { userId, error: authError } = await requireUserId();

  if (authError || !userId) {
    return { data: null, error: authError };
  }

  const { data, error } = await supabase
    .from('user_settings')
    .select('monthly_budget')
    .eq('user_id', userId)
    .maybeSingle();

  if (error) {
    return { data: null, error: mapCloudError(error.message) };
  }

  if (!data) {
    return { data: null, error: null };
  }

  return { data: toAppNumber(data.monthly_budget), error: null };
}

export async function saveCloudMonthlyBudget(
  monthlyBudget: number
): Promise<CloudResult<number>> {
  const { userId, error: authError } = await requireUserId();

  if (authError || !userId) {
    return { data: null, error: authError };
  }

  if (!Number.isFinite(monthlyBudget) || monthlyBudget <= 0) {
    return { data: null, error: 'Enter a monthly budget greater than 0.' };
  }

  const { data, error } = await supabase
    .from('user_settings')
    .upsert(
      {
        user_id: userId,
        monthly_budget: monthlyBudget,
      },
      { onConflict: 'user_id' }
    )
    .select('monthly_budget')
    .single();

  if (error) {
    return { data: null, error: mapCloudError(error.message) };
  }

  return { data: toAppNumber(data.monthly_budget), error: null };
}
