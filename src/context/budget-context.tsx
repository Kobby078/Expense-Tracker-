import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';

import { DEFAULT_MONTHLY_BUDGET } from '@/constants/budget';
import { loadMonthlyBudget, saveMonthlyBudget } from '@/data/budget-storage';

type BudgetContextValue = {
  monthlyBudget: number;
  isBudgetLoaded: boolean;
  setMonthlyBudget: (amount: number) => void;
};

const BudgetContext = createContext<BudgetContextValue | null>(null);

type BudgetProviderProps = {
  children: ReactNode;
};

export function BudgetProvider({ children }: BudgetProviderProps) {
  const [monthlyBudget, setMonthlyBudgetState] = useState(DEFAULT_MONTHLY_BUDGET);
  const [isBudgetLoaded, setIsBudgetLoaded] = useState(false);

  useEffect(() => {
    async function loadSavedBudget() {
      try {
        const savedBudget = await loadMonthlyBudget();
        setMonthlyBudgetState(savedBudget ?? DEFAULT_MONTHLY_BUDGET);
      } catch {
        setMonthlyBudgetState(DEFAULT_MONTHLY_BUDGET);
      } finally {
        setIsBudgetLoaded(true);
      }
    }

    loadSavedBudget();
  }, []);

  useEffect(() => {
    if (!isBudgetLoaded) {
      return;
    }

    saveMonthlyBudget(monthlyBudget).catch(() => {
      // Keep the UI usable even if saving fails once.
    });
  }, [monthlyBudget, isBudgetLoaded]);

  function setMonthlyBudget(amount: number) {
    if (!Number.isFinite(amount) || amount <= 0) {
      return;
    }

    setMonthlyBudgetState(amount);
  }

  return (
    <BudgetContext.Provider
      value={{
        monthlyBudget,
        isBudgetLoaded,
        setMonthlyBudget,
      }}>
      {children}
    </BudgetContext.Provider>
  );
}

export function useBudget() {
  const context = useContext(BudgetContext);

  if (context === null) {
    throw new Error('useBudget must be used inside BudgetProvider');
  }

  return context;
}
