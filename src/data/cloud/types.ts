import type { Expense } from '@/data/example-expenses';
import type { Database } from '@/lib/database.types';

export type CloudResult<T> = {
  data: T | null;
  error: string | null;
};

export type ExpenseRow = Database['public']['Tables']['expenses']['Row'];
export type CategoryRow = Database['public']['Tables']['categories']['Row'];
export type UserSettingsRow = Database['public']['Tables']['user_settings']['Row'];

/** Supabase `numeric` may arrive as number or string. */
export function toAppNumber(value: number | string): number {
  const amount = typeof value === 'number' ? value : Number(value);

  if (!Number.isFinite(amount)) {
    return 0;
  }

  return amount;
}

export function toExpense(row: ExpenseRow): Expense {
  return {
    id: row.id,
    name: row.name,
    category: row.category,
    amount: toAppNumber(row.amount),
    date: row.date,
  };
}

export function mapCloudError(message: string, fallback = 'Something went wrong.'): string {
  const lower = message.toLowerCase();

  if (lower.includes('not authenticated')) {
    return 'You must be signed in.';
  }

  if (lower.includes('already exists')) {
    return 'That category already exists.';
  }

  if (lower.includes('used by')) {
    return message;
  }

  if (lower.includes('not found')) {
    return message;
  }

  if (lower.includes('duplicate key') || lower.includes('unique')) {
    return 'That record already exists.';
  }

  if (lower.includes('network') || lower.includes('fetch')) {
    return 'Network error. Check your connection and try again.';
  }

  return message.length > 0 ? message : fallback;
}
