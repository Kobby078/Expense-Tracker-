import AsyncStorage from '@react-native-async-storage/async-storage';

import { formatCategoryName, mergeCategoryNames } from '@/utils/category-name';

const CATEGORIES_STORAGE_KEY = 'categories';

function normalizeStoredCategories(value: unknown): string[] | null {
  if (!Array.isArray(value)) {
    return null;
  }

  const names = value.filter((item): item is string => typeof item === 'string');

  if (names.length === 0) {
    return null;
  }

  return mergeCategoryNames(
    [],
    names.map((name) => formatCategoryName(name)).filter((name) => name.length > 0)
  );
}

/**
 * Load saved category names.
 * Returns null when missing or invalid so the caller can apply defaults.
 */
export async function loadCategories(): Promise<string[] | null> {
  try {
    const raw = await AsyncStorage.getItem(CATEGORIES_STORAGE_KEY);

    if (raw === null) {
      return null;
    }

    let parsed: unknown;
    try {
      parsed = JSON.parse(raw);
    } catch {
      return null;
    }

    return normalizeStoredCategories(parsed);
  } catch {
    return null;
  }
}

export async function saveCategories(categories: string[]): Promise<void> {
  try {
    const normalized = mergeCategoryNames([], categories);

    if (normalized.length === 0) {
      return;
    }

    await AsyncStorage.setItem(CATEGORIES_STORAGE_KEY, JSON.stringify(normalized));
  } catch {
    // Ignore write failures so the app keeps running.
  }
}
