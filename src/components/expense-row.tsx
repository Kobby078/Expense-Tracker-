import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import type { Expense } from '@/data/example-expenses';
import { formatCurrency } from '@/utils/format-currency';

type ExpenseRowProps = {
  expense: Expense;
  onPress: (expense: Expense) => void;
};

export function ExpenseRow({ expense, onPress }: ExpenseRowProps) {
  return (
    <Pressable
      onPress={() => onPress(expense)}
      accessibilityRole="button"
      accessibilityLabel={`${expense.name}, ${formatCurrency(expense.amount)}`}
      accessibilityHint="Opens edit expense"
      style={({ pressed }) => [pressed && styles.pressed]}>
      <ThemedView type="backgroundElement" style={styles.row}>
        <View style={styles.details}>
          <ThemedText type="smallBold">{expense.name}</ThemedText>
          <ThemedText type="small" themeColor="textSecondary">
            {expense.category}
          </ThemedText>
          <ThemedText type="small" themeColor="textSecondary">
            {expense.date}
          </ThemedText>
        </View>
        <ThemedText type="smallBold">{formatCurrency(expense.amount)}</ThemedText>
      </ThemedView>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 44,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.three,
    borderRadius: Spacing.three,
  },
  details: {
    flex: 1,
    paddingRight: Spacing.two,
    gap: Spacing.half,
  },
  pressed: {
    opacity: 0.7,
  },
});
