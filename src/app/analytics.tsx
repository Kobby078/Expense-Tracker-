import { useState } from 'react';
import { ActivityIndicator, Platform, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppButton } from '@/components/app-button';
import { EmptyState } from '@/components/empty-state';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BottomTabInset, MaxContentWidth, Spacing } from '@/constants/theme';
import { useExpenses } from '@/context/expenses-context';
import type { Expense } from '@/data/example-expenses';
import { useTheme } from '@/hooks/use-theme';
import { formatCurrency } from '@/utils/format-currency';
import {
  addMonthsToYearMonth,
  formatMonthName,
  formatYearMonthLabel,
  getCurrentYearMonth,
  isExpenseInYearMonth,
} from '@/utils/local-date';

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

function getMonthOverMonthMessage(
  selectedTotal: number,
  previousTotal: number,
  previousYearMonth: string
): string {
  const previousMonthName = formatMonthName(previousYearMonth);

  if (previousTotal === 0 && selectedTotal === 0) {
    return `No spending in ${previousMonthName}`;
  }

  if (previousTotal === 0 && selectedTotal > 0) {
    return `No spending in ${previousMonthName}`;
  }

  if (selectedTotal === previousTotal) {
    return `Same as ${previousMonthName}`;
  }

  const percentChange = Math.abs(((selectedTotal - previousTotal) / previousTotal) * 100);

  if (selectedTotal < previousTotal) {
    return `${formatPercent(percentChange)} less than ${previousMonthName}`;
  }

  return `${formatPercent(percentChange)} more than ${previousMonthName}`;
}

export default function AnalyticsScreen() {
  const safeAreaInsets = useSafeAreaInsets();
  const insets = {
    ...safeAreaInsets,
    bottom: safeAreaInsets.bottom + BottomTabInset + Spacing.three,
  };
  const theme = useTheme();
  const { expenses, isLoaded } = useExpenses();
  const currentYearMonth = getCurrentYearMonth();
  const [selectedYearMonth, setSelectedYearMonth] = useState(currentYearMonth);

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

  // YYYY-MM strings compare lexicographically in calendar order.
  const isAtOrPastCurrentMonth = selectedYearMonth >= currentYearMonth;
  const isViewingCurrentMonth = selectedYearMonth === currentYearMonth;
  const previousYearMonth = addMonthsToYearMonth(selectedYearMonth, -1);
  const monthLabel = formatYearMonthLabel(selectedYearMonth);

  const monthExpenses = expenses.filter((expense) =>
    isExpenseInYearMonth(expense.date, selectedYearMonth)
  );
  const previousMonthExpenses = expenses.filter((expense) =>
    isExpenseInYearMonth(expense.date, previousYearMonth)
  );

  const selectedTotal = monthExpenses.reduce((sum, expense) => sum + expense.amount, 0);
  const previousTotal = previousMonthExpenses.reduce((sum, expense) => sum + expense.amount, 0);
  const expenseCount = monthExpenses.length;
  const hasMonthExpenses = expenseCount > 0;
  const averageAmount = hasMonthExpenses ? selectedTotal / expenseCount : 0;
  const largestExpense = hasMonthExpenses
    ? monthExpenses.reduce((largest, expense) =>
        expense.amount > largest.amount ? expense : largest
      )
    : null;
  const categoryTotals = getCategoryTotals(monthExpenses);
  const comparisonMessage = getMonthOverMonthMessage(
    selectedTotal,
    previousTotal,
    previousYearMonth
  );

  function goToPreviousMonth() {
    setSelectedYearMonth((current) => addMonthsToYearMonth(current, -1));
  }

  function goToNextMonth() {
    if (isAtOrPastCurrentMonth) {
      return;
    }
    setSelectedYearMonth((current) => {
      const next = addMonthsToYearMonth(current, 1);
      return next > currentYearMonth ? currentYearMonth : next;
    });
  }

  function goToCurrentMonth() {
    setSelectedYearMonth(currentYearMonth);
  }

  return (
    <ScrollView
      style={[styles.scrollView, { backgroundColor: theme.background }]}
      contentInset={insets}
      contentContainerStyle={[styles.contentContainer, contentPlatformStyle]}>
      <ThemedView style={styles.container}>
        <View style={styles.header}>
          <ThemedText type="subtitle">Analytics</ThemedText>
          <ThemedText type="small" themeColor="textSecondary">
            Browse spending by month.
          </ThemedText>
        </View>

        <ThemedView type="backgroundElement" style={styles.monthNav}>
          <ThemedText type="smallBold" style={styles.monthHeading}>
            {monthLabel}
          </ThemedText>

          <View style={styles.monthNavButtons}>
            <AppButton
              label="Previous"
              variant="secondary"
              onPress={goToPreviousMonth}
              accessibilityLabel="Previous month"
              style={styles.navButton}
            />
            <AppButton
              label="Next"
              variant="primary"
              onPress={goToNextMonth}
              disabled={isAtOrPastCurrentMonth}
              accessibilityLabel="Next month"
              style={styles.navButton}
            />
          </View>

          {!isViewingCurrentMonth ? (
            <Pressable
              onPress={goToCurrentMonth}
              accessibilityRole="button"
              accessibilityLabel="Go to this month"
              style={({ pressed }) => [styles.thisMonthButton, pressed && styles.pressed]}>
              <ThemedText type="linkPrimary">This month</ThemedText>
            </Pressable>
          ) : null}
        </ThemedView>

        {expenses.length === 0 ? (
          <EmptyState
            title="No expenses yet"
            message="Add expenses from the Home tab. You can still move between months above."
          />
        ) : null}

        <ThemedView style={styles.summaryGrid}>
          <ThemedView type="backgroundElement" style={styles.summaryCard}>
            <ThemedText type="small" themeColor="textSecondary">
              Total spent
            </ThemedText>
            <ThemedText type="smallBold">{formatCurrency(selectedTotal)}</ThemedText>
          </ThemedView>
          <ThemedView type="backgroundElement" style={styles.summaryCard}>
            <ThemedText type="small" themeColor="textSecondary">
              Transactions
            </ThemedText>
            <ThemedText type="smallBold">{expenseCount}</ThemedText>
          </ThemedView>
          <ThemedView type="backgroundElement" style={styles.summaryCard}>
            <ThemedText type="small" themeColor="textSecondary">
              Average
            </ThemedText>
            <ThemedText type="smallBold">
              {hasMonthExpenses ? formatCurrency(averageAmount) : '—'}
            </ThemedText>
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

        <ThemedView type="backgroundElement" style={styles.comparisonCard}>
          <ThemedText type="small" themeColor="textSecondary">
            Compared to last month
          </ThemedText>
          <ThemedText type="smallBold">{comparisonMessage}</ThemedText>
          <ThemedText type="small" themeColor="textSecondary">
            Previous month total: {formatCurrency(previousTotal)}
          </ThemedText>
        </ThemedView>

        <ThemedView style={styles.section}>
          <ThemedText type="smallBold">Spending by category</ThemedText>
          {!hasMonthExpenses ? (
            <EmptyState
              title={`No expenses in ${monthLabel}`}
              message="Try another month or add one from Home."
            />
          ) : (
            categoryTotals.map((item) => {
              const percent = selectedTotal > 0 ? (item.total / selectedTotal) * 100 : 0;

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
            })
          )}
        </ThemedView>
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
  header: {
    gap: Spacing.one,
  },
  monthNav: {
    gap: Spacing.three,
    padding: Spacing.three,
    borderRadius: Spacing.three,
  },
  monthNavButtons: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
  navButton: {
    flex: 1,
  },
  monthHeading: {
    textAlign: 'center',
  },
  thisMonthButton: {
    alignSelf: 'center',
    minHeight: 44,
    justifyContent: 'center',
    paddingHorizontal: Spacing.three,
  },
  summaryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
  summaryCard: {
    width: '48%',
    flexGrow: 1,
    gap: Spacing.two,
    padding: Spacing.three,
    borderRadius: Spacing.three,
  },
  comparisonCard: {
    gap: Spacing.two,
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
  pressed: {
    opacity: 0.7,
  },
});
