import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';

import { exampleExpenses, type Expense } from '@/data/example-expenses';
import { loadExpenses, saveExpenses } from '@/data/expense-storage';
import { categoriesMatch, normalizeCategoryKey } from '@/utils/category-name';

type ExpensesContextValue = {
  expenses: Expense[];
  isLoaded: boolean;
  upsertExpense: (expense: Expense) => void;
  deleteExpense: (id: string) => void;
  renameCategoryOnExpenses: (from: string, to: string) => void;
};

const ExpensesContext = createContext<ExpensesContextValue | null>(null);

type ExpensesProviderProps = {
  children: ReactNode;
};

export function ExpensesProvider({ children }: ExpensesProviderProps) {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    async function loadSavedExpenses() {
      try {
        const savedExpenses = await loadExpenses();
        setExpenses(savedExpenses ?? exampleExpenses);
      } catch {
        setExpenses(exampleExpenses);
      } finally {
        setIsLoaded(true);
      }
    }

    loadSavedExpenses();
  }, []);

  useEffect(() => {
    if (!isLoaded) {
      return;
    }

    saveExpenses(expenses).catch(() => {
      // Keep the UI usable even if saving fails once.
    });
  }, [expenses, isLoaded]);

  function upsertExpense(expense: Expense) {
    setExpenses((current) => {
      const alreadyExists = current.some((item) => item.id === expense.id);

      if (alreadyExists) {
        return current.map((item) => (item.id === expense.id ? expense : item));
      }

      return [expense, ...current];
    });
  }

  function deleteExpense(id: string) {
    setExpenses((current) => current.filter((item) => item.id !== id));
  }

  function renameCategoryOnExpenses(from: string, to: string) {
    const fromKey = normalizeCategoryKey(from);

    if (fromKey.length === 0) {
      return;
    }

    setExpenses((current) =>
      current.map((expense) =>
        categoriesMatch(expense.category, from) ? { ...expense, category: to } : expense
      )
    );
  }

  return (
    <ExpensesContext.Provider
      value={{
        expenses,
        isLoaded,
        upsertExpense,
        deleteExpense,
        renameCategoryOnExpenses,
      }}>
      {children}
    </ExpensesContext.Provider>
  );
}

export function useExpenses() {
  const context = useContext(ExpensesContext);

  if (context === null) {
    throw new Error('useExpenses must be used inside ExpensesProvider');
  }

  return context;
}
