import type { Expense } from '@/data/example-expenses';
import { mapCloudError, toExpense, type CloudResult } from '@/data/cloud/types';
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

export async function fetchCloudExpenses(): Promise<CloudResult<Expense[]>> {
  const { userId, error: authError } = await requireUserId();

  if (authError || !userId) {
    return { data: null, error: authError };
  }

  const { data, error } = await supabase
    .from('expenses')
    .select('*')
    .eq('user_id', userId)
    .order('date', { ascending: false });

  if (error) {
    return { data: null, error: mapCloudError(error.message) };
  }

  return { data: (data ?? []).map(toExpense), error: null };
}

export async function upsertCloudExpense(expense: Expense): Promise<CloudResult<Expense>> {
  const { userId, error: authError } = await requireUserId();

  if (authError || !userId) {
    return { data: null, error: authError };
  }

  const { data, error } = await supabase
    .from('expenses')
    .upsert(
      {
        user_id: userId,
        id: expense.id,
        name: expense.name,
        category: expense.category,
        amount: expense.amount,
        date: expense.date,
      },
      { onConflict: 'user_id,id' }
    )
    .select('*')
    .single();

  if (error) {
    return { data: null, error: mapCloudError(error.message) };
  }

  return { data: toExpense(data), error: null };
}

export async function updateCloudExpense(expense: Expense): Promise<CloudResult<Expense>> {
  const { userId, error: authError } = await requireUserId();

  if (authError || !userId) {
    return { data: null, error: authError };
  }

  const { data, error } = await supabase
    .from('expenses')
    .update({
      name: expense.name,
      category: expense.category,
      amount: expense.amount,
      date: expense.date,
    })
    .eq('user_id', userId)
    .eq('id', expense.id)
    .select('*')
    .single();

  if (error) {
    return { data: null, error: mapCloudError(error.message) };
  }

  return { data: toExpense(data), error: null };
}

export async function deleteCloudExpense(expenseId: string): Promise<CloudResult<true>> {
  const { userId, error: authError } = await requireUserId();

  if (authError || !userId) {
    return { data: null, error: authError };
  }

  const { error } = await supabase
    .from('expenses')
    .delete()
    .eq('user_id', userId)
    .eq('id', expenseId);

  if (error) {
    return { data: null, error: mapCloudError(error.message) };
  }

  return { data: true, error: null };
}
