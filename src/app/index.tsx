import { useState } from 'react';
import { ActivityIndicator, Platform, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AddExpenseModal } from '@/components/add-expense-modal';
import { AppButton } from '@/components/app-button';
import { EditBudgetModal } from '@/components/edit-budget-modal';
import { EmptyState } from '@/components/empty-state';
import { ExpenseRow } from '@/components/expense-row';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BottomTabInset, MaxContentWidth, Spacing } from '@/constants/theme';
import { useBudget } from '@/context/budget-context';
import { useExpenses } from '@/context/expenses-context';
import { STARTING_BALANCE, type Expense } from '@/data/example-expenses';
import { useTheme } from '@/hooks/use-theme';
import { formatCurrency } from '@/utils/format-currency';
import { getCurrentYearMonth, isExpenseInYearMonth } from '@/utils/local-date';

const RECENT_EXPENSE_COUNT = 3;

export default function HomeScreen() {
  const safeAreaInsets = useSafeAreaInsets();
  const insets = {
    ...safeAreaInsets,
    bottom: safeAreaInsets.bottom + BottomTabInset + Spacing.three,
  };
  const theme = useTheme();
  const { expenses, isLoaded, upsertExpense, deleteExpense } = useExpenses();
  const { monthlyBudget, isBudgetLoaded, setMonthlyBudget } = useBudget();

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedExpense, setSelectedExpense] = useState<Expense | null>(null);
  const [isBudgetFormOpen, setIsBudgetFormOpen] = useState(false);

  // Copy + sort by real date (newest first). Same-day rows keep Context order.
  const recentExpenses = expenses
    .map((expense, index) => ({ expense, index }))
    .sort((a, b) => {
      const byDate = b.expense.date.localeCompare(a.expense.date);
      return byDate !== 0 ? byDate : a.index - b.index;
    })
    .slice(0, RECENT_EXPENSE_COUNT)
    .map(({ expense }) => expense);
  const currentYearMonth = getCurrentYearMonth();
  const spentThisMonth = expenses
    .filter((expense) => isExpenseInYearMonth(expense.date, currentYearMonth))
    .reduce((sum, expense) => sum + expense.amount, 0);
  const totalSpentAllTime = expenses.reduce((sum, expense) => sum + expense.amount, 0);
  const currentBalance = STARTING_BALANCE - totalSpentAllTime;
  const usagePercent = (spentThisMonth / monthlyBudget) * 100;
  const barWidthPercent = Math.min(100, usagePercent);
  const isOverBudget = spentThisMonth > monthlyBudget;

  function closeForm() {
    setIsFormOpen(false);
    setSelectedExpense(null);
  }

  function handleOpenAdd() {
    setSelectedExpense(null);
    setIsFormOpen(true);
  }

  function handleOpenEdit(expense: Expense) {
    setSelectedExpense(expense);
    setIsFormOpen(true);
  }

  function handleSaveExpense(expense: Expense) {
    upsertExpense(expense);
    closeForm();
  }

  function handleDeleteExpense(id: string) {
    deleteExpense(id);
    closeForm();
  }

  function handleSaveBudget(amount: number) {
    setMonthlyBudget(amount);
    setIsBudgetFormOpen(false);
  }

  const contentPlatformStyle = Platform.select({
    android: {
      paddingTop: insets.top,
      paddingLeft: insets.left,
      paddingRight: insets.right,
      paddingBottom: insets.bottom,
    },
    web: {
      paddingTop: Spacing.six,
      paddingBottom: Spacing.four,
    },
  });

  if (!isLoaded || !isBudgetLoaded) {
    return (
      <ThemedView style={styles.loadingScreen}>
        <ActivityIndicator color={theme.text} />
        <ThemedText type="small" themeColor="textSecondary">
          Loading…
        </ThemedText>
      </ThemedView>
    );
  }

  return (
    <>
      <ScrollView
        style={[styles.scrollView, { backgroundColor: theme.background }]}
        contentInset={insets}
        contentContainerStyle={[styles.contentContainer, contentPlatformStyle]}>
        <ThemedView style={styles.container}>
          <View style={styles.header}>
            <ThemedText type="subtitle">Expense Tracker</ThemedText>
            <ThemedText type="small" themeColor="textSecondary">
              Overview of your spending.
            </ThemedText>
          </View>

          <ThemedView style={styles.summaryRow}>
            <ThemedView type="backgroundElement" style={styles.summaryCard}>
              <ThemedText type="small" themeColor="textSecondary">
                Current balance
              </ThemedText>
              <ThemedText type="subtitle">{formatCurrency(currentBalance)}</ThemedText>
            </ThemedView>
            <ThemedView type="backgroundElement" style={styles.summaryCard}>
              <ThemedText type="small" themeColor="textSecondary">
                Spent this month
              </ThemedText>
              <ThemedText type="subtitle">{formatCurrency(spentThisMonth)}</ThemedText>
            </ThemedView>
          </ThemedView>

          <ThemedView type="backgroundElement" style={styles.budgetCard}>
            <ThemedView type="backgroundElement" style={styles.budgetHeader}>
              <ThemedText type="smallBold">Monthly budget</ThemedText>
              <ThemedText type="small" themeColor="textSecondary">
                {formatCurrency(spentThisMonth)} / {formatCurrency(monthlyBudget)}
              </ThemedText>
            </ThemedView>
            <ThemedText type="small" themeColor="textSecondary">
              {Math.round(usagePercent)}% used
            </ThemedText>
            {isOverBudget ? (
              <ThemedText type="smallBold" style={{ color: theme.danger }}>
                Over budget
              </ThemedText>
            ) : null}
            <View style={[styles.progressTrack, { backgroundColor: theme.backgroundSelected }]}>
              <View
                style={[
                  styles.progressFill,
                  {
                    width: `${barWidthPercent}%`,
                    backgroundColor: isOverBudget ? theme.danger : theme.text,
                  },
                ]}
              />
            </View>
            <AppButton
              label="Edit budget"
              variant="secondary"
              onPress={() => setIsBudgetFormOpen(true)}
              accessibilityLabel="Edit monthly budget"
            />
          </ThemedView>

          <AppButton
            label="Add Expense"
            variant="emphasis"
            onPress={handleOpenAdd}
            accessibilityLabel="Add expense"
          />

          <ThemedView style={styles.section}>
            <ThemedText type="smallBold">Recent expenses</ThemedText>
            {recentExpenses.length === 0 ? (
              <EmptyState
                title="No expenses yet"
                message="Tap Add Expense to get started."
              />
            ) : (
              recentExpenses.map((expense) => (
                <ExpenseRow key={expense.id} expense={expense} onPress={handleOpenEdit} />
              ))
            )}
          </ThemedView>
        </ThemedView>
      </ScrollView>

      <AddExpenseModal
        visible={isFormOpen}
        expenseToEdit={selectedExpense}
        onCancel={closeForm}
        onSave={handleSaveExpense}
        onDelete={handleDeleteExpense}
      />

      <EditBudgetModal
        visible={isBudgetFormOpen}
        currentBudget={monthlyBudget}
        onCancel={() => setIsBudgetFormOpen(false)}
        onSave={handleSaveBudget}
      />
    </>
  );
}

const styles = StyleSheet.create({
  loadingScreen: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.three,
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
  container: {
    maxWidth: MaxContentWidth,
    flexGrow: 1,
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.four,
    gap: Spacing.three,
  },
  header: {
    gap: Spacing.one,
  },
  summaryRow: {
    flexDirection: 'row',
    gap: Spacing.three,
  },
  summaryCard: {
    flex: 1,
    gap: Spacing.one,
    padding: Spacing.three,
    borderRadius: Spacing.three,
  },
  budgetCard: {
    gap: Spacing.three,
    padding: Spacing.three,
    borderRadius: Spacing.three,
  },
  budgetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  progressTrack: {
    height: Spacing.two,
    borderRadius: Spacing.one,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: Spacing.one,
  },
  section: {
    gap: Spacing.two,
  },
});
