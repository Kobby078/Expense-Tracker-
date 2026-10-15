import { useState } from 'react';
import {
  ActivityIndicator,
  Platform,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AddExpenseModal } from '@/components/add-expense-modal';
import { EmptyState } from '@/components/empty-state';
import { ExpenseRow } from '@/components/expense-row';
import { FilterChip } from '@/components/filter-chip';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BottomTabInset, MaxContentWidth, Spacing } from '@/constants/theme';
import { useCategories } from '@/context/categories-context';
import { useExpenses } from '@/context/expenses-context';
import type { Expense } from '@/data/example-expenses';
import { useTheme } from '@/hooks/use-theme';
import { categoriesMatch, mergeCategoryNames } from '@/utils/category-name';

type SortOption = 'newest' | 'oldest' | 'highest' | 'lowest';

const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: 'newest', label: 'Newest' },
  { value: 'oldest', label: 'Oldest' },
  { value: 'highest', label: 'Highest' },
  { value: 'lowest', label: 'Lowest' },
];

function getDisplayedExpenses(
  expenses: Expense[],
  searchQuery: string,
  selectedCategory: string,
  sortOption: SortOption
) {
  const normalizedQuery = searchQuery.trim().toLowerCase();
  const activeCategory = selectedCategory === 'All' ? 'All' : selectedCategory;

  const filtered = expenses.filter((expense) => {
    const matchesSearch =
      normalizedQuery.length === 0 ||
      expense.name.toLowerCase().includes(normalizedQuery) ||
      expense.category.toLowerCase().includes(normalizedQuery);

    const matchesCategory =
      activeCategory === 'All' || categoriesMatch(expense.category, activeCategory);

    return matchesSearch && matchesCategory;
  });

  // Keep original indexes so same-day rows preserve existing relative order.
  // Do not treat expense id as a timestamp.
  const indexed = filtered.map((expense, index) => ({ expense, index }));

  if (sortOption === 'newest') {
    indexed.sort((a, b) => {
      const byDate = b.expense.date.localeCompare(a.expense.date);
      return byDate !== 0 ? byDate : a.index - b.index;
    });
  } else if (sortOption === 'oldest') {
    indexed.sort((a, b) => {
      const byDate = a.expense.date.localeCompare(b.expense.date);
      return byDate !== 0 ? byDate : a.index - b.index;
    });
  } else if (sortOption === 'highest') {
    indexed.sort((a, b) => {
      const byAmount = b.expense.amount - a.expense.amount;
      return byAmount !== 0 ? byAmount : a.index - b.index;
    });
  } else if (sortOption === 'lowest') {
    indexed.sort((a, b) => {
      const byAmount = a.expense.amount - b.expense.amount;
      return byAmount !== 0 ? byAmount : a.index - b.index;
    });
  }

  return indexed.map(({ expense }) => expense);
}

export default function TransactionsScreen() {
  const safeAreaInsets = useSafeAreaInsets();
  const insets = {
    ...safeAreaInsets,
    bottom: safeAreaInsets.bottom + BottomTabInset + Spacing.three,
  };
  const theme = useTheme();
  const { expenses, isLoaded, upsertExpense, deleteExpense } = useExpenses();
  const { categories: managedCategories } = useCategories();

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedExpense, setSelectedExpense] = useState<Expense | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [sortOption, setSortOption] = useState<SortOption>('newest');

  const expenseCategories = expenses.map((expense) => expense.category);
  const categories = [
    'All',
    ...mergeCategoryNames(managedCategories, expenseCategories).sort((a, b) =>
      a.localeCompare(b)
    ),
  ];

  const activeCategory =
    selectedCategory === 'All' ||
    categories.some((category) => categoriesMatch(category, selectedCategory))
      ? selectedCategory
      : 'All';
  const displayedExpenses = getDisplayedExpenses(
    expenses,
    searchQuery,
    activeCategory,
    sortOption
  );

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
          <View style={styles.header}>
            <ThemedText type="subtitle">Transactions</ThemedText>
            <ThemedText type="small" themeColor="textSecondary">
              Search, filter, and sort your expense history.
            </ThemedText>
          </View>

          <View style={styles.controlBlock}>
            <ThemedText type="smallBold">Search</ThemedText>
            <TextInput
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder="Search name or category"
              placeholderTextColor={theme.textSecondary}
              style={[
                styles.searchInput,
                {
                  color: theme.text,
                  backgroundColor: theme.backgroundElement,
                  borderColor: theme.backgroundSelected,
                },
              ]}
              autoCapitalize="none"
              autoCorrect={false}
              clearButtonMode="while-editing"
              accessibilityLabel="Search expenses"
            />
          </View>

          <View style={styles.controlBlock}>
            <ThemedText type="smallBold">Category</ThemedText>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={styles.chipRow}>
                {categories.map((category) => (
                  <FilterChip
                    key={category}
                    label={category}
                    selected={activeCategory === category}
                    onPress={() => setSelectedCategory(category)}
                    accessibilityLabel={`Filter by ${category}`}
                  />
                ))}
              </View>
            </ScrollView>
          </View>

          <View style={styles.controlBlock}>
            <ThemedText type="smallBold">Sort</ThemedText>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={styles.chipRow}>
                {SORT_OPTIONS.map((option) => (
                  <FilterChip
                    key={option.value}
                    label={option.label}
                    selected={sortOption === option.value}
                    onPress={() => setSortOption(option.value)}
                    accessibilityLabel={`Sort by ${option.label}`}
                  />
                ))}
              </View>
            </ScrollView>
          </View>

          <ThemedView style={styles.section}>
            <ThemedText type="smallBold">Results</ThemedText>
            {expenses.length === 0 ? (
              <EmptyState
                title="No expenses yet"
                message="Add one from the Home tab."
              />
            ) : displayedExpenses.length === 0 ? (
              <EmptyState
                title="No matching expenses"
                message="Try clearing your search or filters."
              />
            ) : (
              displayedExpenses.map((expense) => (
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
  header: {
    gap: Spacing.one,
  },
  searchInput: {
    borderWidth: 1,
    borderRadius: Spacing.two,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    fontSize: 16,
    minHeight: 44,
  },
  controlBlock: {
    gap: Spacing.two,
  },
  chipRow: {
    flexDirection: 'row',
    gap: Spacing.two,
    alignItems: 'center',
  },
  section: {
    gap: Spacing.two,
  },
});
