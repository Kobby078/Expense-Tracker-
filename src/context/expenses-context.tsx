import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';

import { exampleExpenses, type Expense } from '@/data/example-expenses';
import { loadExpenses, saveExpenses } from '@/data/expense-storage';

type ExpensesContextValue = {
  expenses: Expense[];
  isLoaded: boolean;
  upsertExpense: (expense: Expense) => void;
  deleteExpense: (id: string) => void;
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

  return (
    <ExpensesContext.Provider
      value={{
        expenses,
        isLoaded,
        upsertExpense,
        deleteExpense,
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
