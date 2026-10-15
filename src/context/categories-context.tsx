import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';

import { DEFAULT_CATEGORIES } from '@/constants/categories';
import { useExpenses } from '@/context/expenses-context';
import { loadCategories, saveCategories } from '@/data/category-storage';
import {
  categoriesMatch,
  formatCategoryName,
  mergeCategoryNames,
  normalizeCategoryKey,
} from '@/utils/category-name';

type CategoryMutationResult = {
  ok: boolean;
  error?: string;
};

type CategoriesContextValue = {
  categories: string[];
  isCategoriesLoaded: boolean;
  addCategory: (name: string) => CategoryMutationResult;
  renameCategory: (from: string, to: string) => CategoryMutationResult;
  deleteCategory: (name: string) => CategoryMutationResult;
};

const CategoriesContext = createContext<CategoriesContextValue | null>(null);

type CategoriesProviderProps = {
  children: ReactNode;
};

export function CategoriesProvider({ children }: CategoriesProviderProps) {
  const { expenses, isLoaded: isExpensesLoaded, renameCategoryOnExpenses } = useExpenses();
  const [categories, setCategories] = useState<string[]>([...DEFAULT_CATEGORIES]);
  const [isCategoriesLoaded, setIsCategoriesLoaded] = useState(false);

  useEffect(() => {
    async function loadSavedCategories() {
      try {
        const savedCategories = await loadCategories();
        setCategories(savedCategories ?? [...DEFAULT_CATEGORIES]);
      } catch {
        setCategories([...DEFAULT_CATEGORIES]);
      } finally {
        setIsCategoriesLoaded(true);
      }
    }

    loadSavedCategories();
  }, []);

  // Merge orphan expense category strings into the managed list after both loads finish.
  useEffect(() => {
    if (!isCategoriesLoaded || !isExpensesLoaded) {
      return;
    }

    const expenseCategoryNames = expenses.map((expense) => expense.category);
    setCategories((current) => {
      const merged = mergeCategoryNames(current, expenseCategoryNames);
      const unchanged =
        merged.length === current.length &&
        merged.every((name, index) => name === current[index]);
      return unchanged ? current : merged;
    });
  }, [expenses, isCategoriesLoaded, isExpensesLoaded]);

  useEffect(() => {
    if (!isCategoriesLoaded) {
      return;
    }

    saveCategories(categories).catch(() => {
      // Keep the UI usable even if saving fails once.
    });
  }, [categories, isCategoriesLoaded]);

  function addCategory(name: string): CategoryMutationResult {
    const formatted = formatCategoryName(name);

    if (formatted.length === 0) {
      return { ok: false, error: 'Enter a category name.' };
    }

    const key = normalizeCategoryKey(formatted);
    const alreadyExists = categories.some(
      (category) => normalizeCategoryKey(category) === key
    );

    if (alreadyExists) {
      return { ok: false, error: 'That category already exists.' };
    }

    setCategories((current) => [...current, formatted]);
    return { ok: true };
  }

  function renameCategory(from: string, to: string): CategoryMutationResult {
    const formattedTo = formatCategoryName(to);

    if (formattedTo.length === 0) {
      return { ok: false, error: 'Enter a category name.' };
    }

    const fromIndex = categories.findIndex((category) => categoriesMatch(category, from));

    if (fromIndex === -1) {
      return { ok: false, error: 'That category was not found.' };
    }

    const toKey = normalizeCategoryKey(formattedTo);
    const collision = categories.some(
      (category, index) =>
        index !== fromIndex && normalizeCategoryKey(category) === toKey
    );

    if (collision) {
      return { ok: false, error: 'That category already exists.' };
    }

    const currentDisplayName = categories[fromIndex];

    setCategories((current) =>
      current.map((category) =>
        categoriesMatch(category, from) ? formattedTo : category
      )
    );
    // Update every expense in this logical category, including legacy casing variants.
    renameCategoryOnExpenses(currentDisplayName, formattedTo);
    return { ok: true };
  }

  function deleteCategory(name: string): CategoryMutationResult {
    const exists = categories.some((category) => categoriesMatch(category, name));

    if (!exists) {
      return { ok: false, error: 'That category was not found.' };
    }

    const inUseCount = expenses.filter((expense) =>
      categoriesMatch(expense.category, name)
    ).length;

    if (inUseCount > 0) {
      return {
        ok: false,
        error: `This category is used by ${inUseCount} expense(s). Edit those expenses to another category first.`,
      };
    }

    setCategories((current) =>
      current.filter((category) => !categoriesMatch(category, name))
    );
    return { ok: true };
  }

  return (
    <CategoriesContext.Provider
      value={{
        categories,
        isCategoriesLoaded,
        addCategory,
        renameCategory,
        deleteCategory,
      }}>
      {children}
    </CategoriesContext.Provider>
  );
}

export function useCategories() {
  const context = useContext(CategoriesContext);

  if (context === null) {
    throw new Error('useCategories must be used inside CategoriesProvider');
  }

  return context;
}
