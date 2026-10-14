import { useEffect, useState } from 'react';
import { ActivityIndicator, Platform, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AddExpenseModal } from '@/components/add-expense-modal';
import { ExpenseRow } from '@/components/expense-row';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BottomTabInset, MaxContentWidth, Spacing } from '@/constants/theme';
import {
  exampleExpenses,
  MONTHLY_BUDGET,
  STARTING_BALANCE,
  type Expense,
} from '@/data/example-expenses';
import { loadExpenses, saveExpenses } from '@/data/expense-storage';
import { useTheme } from '@/hooks/use-theme';

function formatCurrency(amount: number) {
  return `$${amount.toFixed(2)}`;
}

export default function HomeScreen() {
  const safeAreaInsets = useSafeAreaInsets();
  const insets = {
    ...safeAreaInsets,
    bottom: safeAreaInsets.bottom + BottomTabInset + Spacing.three,
  };
  const theme = useTheme();

  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);

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

  const totalSpent = expenses.reduce((sum, expense) => sum + expense.amount, 0);
  const currentBalance = STARTING_BALANCE - totalSpent;
  const budgetPercent = Math.min(100, (totalSpent / MONTHLY_BUDGET) * 100);

  function handleSaveExpense(expense: Expense) {
    setExpenses((current) => [expense, ...current]);
    setIsFormOpen(false);
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
          <ThemedText type="subtitle">Expense Tracker</ThemedText>

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
              <ThemedText type="subtitle">{formatCurrency(totalSpent)}</ThemedText>
            </ThemedView>
          </ThemedView>

          <ThemedView type="backgroundElement" style={styles.budgetCard}>
            <ThemedView type="backgroundElement" style={styles.budgetHeader}>
              <ThemedText type="smallBold">Monthly budget</ThemedText>
              <ThemedText type="small" themeColor="textSecondary">
                {formatCurrency(totalSpent)} / {formatCurrency(MONTHLY_BUDGET)}
              </ThemedText>
            </ThemedView>
            <View style={[styles.progressTrack, { backgroundColor: theme.backgroundSelected }]}>
              <View
                style={[
                  styles.progressFill,
                  { width: `${budgetPercent}%`, backgroundColor: theme.text },
                ]}
              />
            </View>
          </ThemedView>

          <ThemedView style={styles.section}>
            <ThemedText type="smallBold">Recent expenses</ThemedText>
            {expenses.map((expense) => (
              <ExpenseRow key={expense.id} expense={expense} />
            ))}
          </ThemedView>

          <Pressable
            onPress={() => setIsFormOpen(true)}
            style={({ pressed }) => [styles.addButton, pressed && styles.pressed]}>
            <ThemedView type="backgroundSelected" style={styles.addButtonInner}>
              <ThemedText type="smallBold">Add Expense</ThemedText>
            </ThemedView>
          </Pressable>
        </ThemedView>
      </ScrollView>

      <AddExpenseModal
        visible={isFormOpen}
        onCancel={() => setIsFormOpen(false)}
        onSave={handleSaveExpense}
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
    gap: Spacing.four,
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
  addButton: {
    alignSelf: 'stretch',
  },
  addButtonInner: {
    alignItems: 'center',
    paddingVertical: Spacing.three,
    borderRadius: Spacing.three,
  },
  pressed: {
    opacity: 0.7,
  },
});
