import { ActivityIndicator, Platform, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BottomTabInset, MaxContentWidth, Spacing } from '@/constants/theme';
import { useExpenses } from '@/context/expenses-context';
import type { Expense } from '@/data/example-expenses';
import { useTheme } from '@/hooks/use-theme';

function formatCurrency(amount: number) {
  return `$${amount.toFixed(2)}`;
}

function formatPercent(percent: number) {
  return `${percent.toFixed(1)}%`;
}

type CategoryTotal = {
  category: string;
  total: number;
};

function getCategoryTotals(expenses: Expense[]): CategoryTotal[] {
  const totalsByCategory = expenses.reduce<Record<string, number>>((totals, expense) => {
    totals[expense.category] = (totals[expense.category] ?? 0) + expense.amount;
    return totals;
  }, {});

  return Object.entries(totalsByCategory)
    .map(([category, total]) => ({ category, total }))
    .sort((a, b) => b.total - a.total);
}

export default function AnalyticsScreen() {
  const safeAreaInsets = useSafeAreaInsets();
  const insets = {
    ...safeAreaInsets,
    bottom: safeAreaInsets.bottom + BottomTabInset + Spacing.three,
  };
  const theme = useTheme();
  const { expenses, isLoaded } = useExpenses();

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

  const hasExpenses = expenses.length > 0;
  const totalSpent = expenses.reduce((sum, expense) => sum + expense.amount, 0);
  const expenseCount = expenses.length;
  const averageAmount = hasExpenses ? totalSpent / expenseCount : 0;
  const largestExpense = hasExpenses
    ? expenses.reduce((largest, expense) =>
        expense.amount > largest.amount ? expense : largest
      )
    : null;
  const categoryTotals = getCategoryTotals(expenses);

  return (
    <ScrollView
      style={[styles.scrollView, { backgroundColor: theme.background }]}
      contentInset={insets}
      contentContainerStyle={[styles.contentContainer, contentPlatformStyle]}>
      <ThemedView style={styles.container}>
        <ThemedText type="subtitle">Analytics</ThemedText>
        <ThemedText type="small" themeColor="textSecondary">
          Summary of all saved expenses.
        </ThemedText>

        {!hasExpenses ? (
          <ThemedView type="backgroundElement" style={styles.emptyCard}>
            <ThemedText type="smallBold">No expenses yet</ThemedText>
            <ThemedText type="small" themeColor="textSecondary">
              Add expenses from the Home tab to see totals, averages, and category breakdowns here.
            </ThemedText>
          </ThemedView>
        ) : (
          <>
            <ThemedView style={styles.summaryGrid}>
              <ThemedView type="backgroundElement" style={styles.summaryCard}>
                <ThemedText type="small" themeColor="textSecondary">
                  Total spent
                </ThemedText>
                <ThemedText type="smallBold">{formatCurrency(totalSpent)}</ThemedText>
              </ThemedView>
              <ThemedView type="backgroundElement" style={styles.summaryCard}>
                <ThemedText type="small" themeColor="textSecondary">
                  Expenses
                </ThemedText>
                <ThemedText type="smallBold">{expenseCount}</ThemedText>
              </ThemedView>
              <ThemedView type="backgroundElement" style={styles.summaryCard}>
                <ThemedText type="small" themeColor="textSecondary">
                  Average
                </ThemedText>
                <ThemedText type="smallBold">{formatCurrency(averageAmount)}</ThemedText>
              </ThemedView>
              <ThemedView type="backgroundElement" style={styles.summaryCard}>
                <ThemedText type="small" themeColor="textSecondary">
                  Largest
                </ThemedText>
                <ThemedText type="smallBold">
                  {largestExpense ? formatCurrency(largestExpense.amount) : '—'}
                </ThemedText>
                {largestExpense ? (
                  <ThemedText type="small" themeColor="textSecondary">
                    {largestExpense.name}
                  </ThemedText>
                ) : null}
              </ThemedView>
            </ThemedView>

            <ThemedView style={styles.section}>
              <ThemedText type="smallBold">Spending by category</ThemedText>
              {categoryTotals.map((item) => {
                const percent = totalSpent > 0 ? (item.total / totalSpent) * 100 : 0;

                return (
                  <ThemedView
                    key={item.category}
                    type="backgroundElement"
                    style={styles.categoryCard}>
                    <View style={styles.categoryHeader}>
                      <ThemedText type="smallBold">{item.category}</ThemedText>
                      <ThemedText type="small" themeColor="textSecondary">
                        {formatCurrency(item.total)} · {formatPercent(percent)}
                      </ThemedText>
                    </View>
                    <View style={[styles.barTrack, { backgroundColor: theme.backgroundSelected }]}>
                      <View
                        style={[
                          styles.barFill,
                          { width: `${percent}%`, backgroundColor: theme.text },
                        ]}
                      />
                    </View>
                  </ThemedView>
                );
              })}
            </ThemedView>
          </>
        )}
      </ThemedView>
    </ScrollView>
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
  emptyCard: {
    gap: Spacing.two,
    padding: Spacing.three,
    borderRadius: Spacing.three,
  },
  summaryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
  summaryCard: {
    width: '48%',
    flexGrow: 1,
    gap: Spacing.one,
    padding: Spacing.three,
    borderRadius: Spacing.three,
  },
  section: {
    gap: Spacing.two,
  },
  categoryCard: {
    gap: Spacing.two,
    padding: Spacing.three,
    borderRadius: Spacing.three,
  },
  categoryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: Spacing.two,
  },
  barTrack: {
    height: Spacing.two,
    borderRadius: Spacing.one,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    borderRadius: Spacing.one,
  },
});
