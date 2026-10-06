export type Expense = {
  id: string;
  name: string;
  category: string;
  amount: number;
};

export const MONTHLY_BUDGET = 500;
export const STARTING_BALANCE = 1240;

export const exampleExpenses: Expense[] = [
  { id: '1', name: 'Weekly groceries', category: 'Groceries', amount: 54.32 },
  { id: '2', name: 'Metro pass', category: 'Transit', amount: 12.5 },
  { id: '3', name: 'Iced latte', category: 'Coffee', amount: 5.75 },
];
