import { useState } from 'react';
import { ActivityIndicator, Platform, ScrollView, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AddExpenseModal } from '@/components/add-expense-modal';
import { ExpenseRow } from '@/components/expense-row';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BottomTabInset, MaxContentWidth, Spacing } from '@/constants/theme';
import { useExpenses } from '@/context/expenses-context';
import type { Expense } from '@/data/example-expenses';
import { useTheme } from '@/hooks/use-theme';

export default function TransactionsScreen() {
  const safeAreaInsets = useSafeAreaInsets();
  const insets = {
    ...safeAreaInsets,
    bottom: safeAreaInsets.bottom + BottomTabInset + Spacing.three,
  };
  const theme = useTheme();
  const { expenses, isLoaded, upsertExpense, deleteExpense } = useExpenses();

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedExpense, setSelectedExpense] = useState<Expense | null>(null);

  function closeForm() {
    setIsFormOpen(false);
    setSelectedExpense(null);
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

  if (!isLoaded) {
    return (
      <ThemedView style={styles.loadingScreen}>
        <ActivityIndicator color={theme.text} />
        <ThemedText type="small" themeColor="textSecondary">
          Loading expenses…
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
          <ThemedText type="subtitle">Transactions</ThemedText>
          <ThemedText type="small" themeColor="textSecondary">
            Full expense history, newest first.
          </ThemedText>

          <ThemedView style={styles.section}>
            {expenses.length === 0 ? (
              <ThemedText type="small" themeColor="textSecondary">
                No expenses yet. Add one from the Home tab.
              </ThemedText>
            ) : (
              expenses.map((expense) => (
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
  section: {
    gap: Spacing.two,
  },
});
