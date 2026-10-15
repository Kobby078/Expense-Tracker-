import { getTodayLocalDate } from '@/utils/local-date';

export type Expense = {
  id: string;
  name: string;
  category: string;
  amount: number;
  date: string; // YYYY-MM-DD, local calendar day
};

export const MONTHLY_BUDGET = 500;
export const STARTING_BALANCE = 1240;

function daysAgoLocal(days: number): string {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return getTodayLocalDate(date);
}

export const exampleExpenses: Expense[] = [
  { id: '1', name: 'Weekly groceries', category: 'Groceries', amount: 54.32, date: daysAgoLocal(2) },
  { id: '2', name: 'Metro pass', category: 'Transit', amount: 12.5, date: daysAgoLocal(1) },
  { id: '3', name: 'Iced latte', category: 'Coffee', amount: 5.75, date: getTodayLocalDate() },
];
