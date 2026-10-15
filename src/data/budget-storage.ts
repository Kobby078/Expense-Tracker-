import AsyncStorage from '@react-native-async-storage/async-storage';

const MONTHLY_BUDGET_STORAGE_KEY = 'monthlyBudget';

function isValidMonthlyBudget(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value) && value > 0;
}

/**
 * Load the saved monthly budget.
 * Returns null when missing or invalid so the caller can apply the default.
 */
export async function loadMonthlyBudget(): Promise<number | null> {
  try {
    const raw = await AsyncStorage.getItem(MONTHLY_BUDGET_STORAGE_KEY);

    if (raw === null) {
      return null;
    }

    let parsed: unknown;
    try {
      parsed = JSON.parse(raw);
    } catch {
      return null;
    }

    if (!isValidMonthlyBudget(parsed)) {
      return null;
    }

    return parsed;
  } catch {
    return null;
  }
}

export async function saveMonthlyBudget(monthlyBudget: number): Promise<void> {
  try {
    if (!isValidMonthlyBudget(monthlyBudget)) {
      return;
    }

    await AsyncStorage.setItem(MONTHLY_BUDGET_STORAGE_KEY, JSON.stringify(monthlyBudget));
  } catch {
    // Ignore write failures so the app keeps running.
  }
}
