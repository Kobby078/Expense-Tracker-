import { StyleSheet } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import type { Expense } from '@/data/example-expenses';

type ExpenseRowProps = {
  expense: Expense;
};

function formatCurrency(amount: number) {
  return `$${amount.toFixed(2)}`;
}

export function ExpenseRow({ expense }: ExpenseRowProps) {
  return (
    <ThemedView type="backgroundElement" style={styles.row}>
      <ThemedView type="backgroundElement" style={styles.details}>
        <ThemedText type="smallBold">{expense.name}</ThemedText>
        <ThemedText type="small" themeColor="textSecondary">
          {expense.category}
        </ThemedText>
      </ThemedView>
      <ThemedText type="smallBold">{formatCurrency(expense.amount)}</ThemedText>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.three,
    borderRadius: Spacing.three,
  },
  details: {
    flex: 1,
    paddingRight: Spacing.two,
    gap: Spacing.half,
  },
});
