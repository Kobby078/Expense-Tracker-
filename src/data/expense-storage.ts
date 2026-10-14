import AsyncStorage from '@react-native-async-storage/async-storage';

import type { Expense } from '@/data/example-expenses';

const EXPENSES_STORAGE_KEY = 'expenses';

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

    return parsed as Expense[];
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
