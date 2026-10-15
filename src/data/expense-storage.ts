import AsyncStorage from '@react-native-async-storage/async-storage';

import type { Expense } from '@/data/example-expenses';
import { getTodayLocalDate, isValidLocalDateString } from '@/utils/local-date';

const EXPENSES_STORAGE_KEY = 'expenses';

/**
 * Upgrade a raw stored object into a full Expense.
 * Legacy rows without a date get today's local date because their true
 * historical dates are unknown — this keeps month filters and sorting safe.
 */
function normalizeExpense(raw: unknown): Expense | null {
  if (raw === null || typeof raw !== 'object') {
    return null;
  }

  const item = raw as Record<string, unknown>;
  const id = typeof item.id === 'string' ? item.id : null;
  const name = typeof item.name === 'string' ? item.name : null;
  const category = typeof item.category === 'string' ? item.category : null;
  const amount = typeof item.amount === 'number' && Number.isFinite(item.amount) ? item.amount : null;

  if (id === null || name === null || category === null || amount === null) {
    return null;
  }

  const rawDate = typeof item.date === 'string' ? item.date : '';
  const date = isValidLocalDateString(rawDate) ? rawDate.trim() : getTodayLocalDate();

  return {
    id,
    name,
    category,
    amount,
    date,
  };
}

export async function loadExpenses(): Promise<Expense[] | null> {
  try {
    const raw = await AsyncStorage.getItem(EXPENSES_STORAGE_KEY);

    if (raw === null) {
      return null;
    }

    let parsed: unknown;
    try {
      parsed = JSON.parse(raw);
    } catch {
      return null;
    }

    if (!Array.isArray(parsed)) {
      return null;
    }

    const normalized = parsed
      .map((item) => normalizeExpense(item))
      .filter((item): item is Expense => item !== null);

    return normalized;
  } catch {
    return null;
  }
}

export async function saveExpenses(expenses: Expense[]): Promise<void> {
  try {
    await AsyncStorage.setItem(EXPENSES_STORAGE_KEY, JSON.stringify(expenses));
  } catch {
    // Ignore write failures so the app keeps running.
  }
}
