import { useEffect, useState } from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';

import { AppButton } from '@/components/app-button';
import { FilterChip } from '@/components/filter-chip';
import { ManageCategoriesModal } from '@/components/manage-categories-modal';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useCategories } from '@/context/categories-context';
import type { Expense } from '@/data/example-expenses';
import { useTheme } from '@/hooks/use-theme';
import { categoriesMatch, mergeCategoryNames } from '@/utils/category-name';
import { getTodayLocalDate, isValidLocalDateString } from '@/utils/local-date';

type AddExpenseModalProps = {
  visible: boolean;
  expenseToEdit: Expense | null;
  onCancel: () => void;
  onSave: (expense: Expense) => void;
  onDelete: (id: string) => void;
};

export function AddExpenseModal({
  visible,
  expenseToEdit,
  onCancel,
  onSave,
  onDelete,
}: AddExpenseModalProps) {
  const theme = useTheme();
  const { categories, isCategoriesLoaded } = useCategories();
  const isEditing = expenseToEdit !== null;

  const [name, setName] = useState('');
  const [category, setCategory] = useState('');
  const [amountText, setAmountText] = useState('');
  const [dateText, setDateText] = useState(getTodayLocalDate());
  const [error, setError] = useState('');
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);
  const [isManageCategoriesOpen, setIsManageCategoriesOpen] = useState(false);

  const selectableCategories = mergeCategoryNames(
    categories,
    category.length > 0 ? [category] : []
  );

  useEffect(() => {
    if (!visible) {
      return;
    }

    setIsConfirmingDelete(false);
    setIsManageCategoriesOpen(false);

    if (expenseToEdit) {
      setName(expenseToEdit.name);
      setCategory(expenseToEdit.category);
      setAmountText(String(expenseToEdit.amount));
      setDateText(expenseToEdit.date);
      setError('');
      return;
    }

    setName('');
    setCategory('');
    setAmountText('');
    setDateText(getTodayLocalDate());
    setError('');
  }, [visible, expenseToEdit]);

  function clearForm() {
    setName('');
    setCategory('');
    setAmountText('');
    setDateText(getTodayLocalDate());
    setError('');
    setIsConfirmingDelete(false);
    setIsManageCategoriesOpen(false);
  }

  function handleCancel() {
    clearForm();
    onCancel();
  }

  function handleSave() {
    const trimmedName = name.trim();
    const trimmedCategory = category.trim();
    const trimmedDate = dateText.trim();
    const amount = Number(amountText);

    if (trimmedName.length === 0) {
      setError('Please enter an expense name.');
      return;
    }

    if (trimmedCategory.length === 0) {
      setError('Please choose a category.');
      return;
    }

    if (!Number.isFinite(amount) || amount <= 0) {
      setError('Amount must be a positive number.');
      return;
    }

    if (!isValidLocalDateString(trimmedDate)) {
      setError('Enter a valid date as YYYY-MM-DD.');
      return;
    }

    onSave({
      id: expenseToEdit?.id ?? String(Date.now()),
      name: trimmedName,
      category: trimmedCategory,
      amount,
      date: trimmedDate,
    });

    clearForm();
  }

  function handleDeletePress() {
    if (!expenseToEdit) {
      return;
    }

    // Confirm inside the modal instead of Alert.alert.
    // Alert is unreliable on web and can fail when used with Modal on iOS.
    setIsConfirmingDelete(true);
  }

  function handleConfirmDelete() {
    if (!expenseToEdit) {
      return;
    }

    const idToDelete = expenseToEdit.id;
    clearForm();
    onDelete(idToDelete);
  }

  const inputStyle = [
    styles.input,
    {
      color: theme.text,
      backgroundColor: theme.background,
      borderColor: theme.backgroundSelected,
    },
  ];

  return (
    <>
      <Modal visible={visible} animationType="slide" transparent onRequestClose={handleCancel}>
        <KeyboardAvoidingView
          style={styles.overlay}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <Pressable
            style={[styles.backdrop, { backgroundColor: theme.overlay }]}
            onPress={handleCancel}
            accessibilityRole="button"
            accessibilityLabel="Dismiss expense form"
          />
          <ThemedView type="backgroundElement" style={styles.sheet}>
            <ScrollView
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.sheetContent}>
              <ThemedText type="default">
                {isEditing ? 'Edit Expense' : 'Add Expense'}
              </ThemedText>

              <View style={styles.field}>
                <ThemedText type="small" themeColor="textSecondary">
                  Name
                </ThemedText>
                <TextInput
                  value={name}
                  onChangeText={setName}
                  placeholder="e.g. Lunch"
                  placeholderTextColor={theme.textSecondary}
                  style={inputStyle}
                  autoCapitalize="sentences"
                  accessibilityLabel="Name"
                />
              </View>

              <View style={styles.field}>
                <ThemedText type="small" themeColor="textSecondary">
                  Category
                </ThemedText>
                {!isCategoriesLoaded ? (
                  <ThemedText type="small" themeColor="textSecondary">
                    Loading categories…
                  </ThemedText>
                ) : (
                  <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    <View style={styles.chipRow}>
                      {selectableCategories.map((item) => (
                        <FilterChip
                          key={item}
                          label={item}
                          selected={categoriesMatch(category, item)}
                          onPress={() => setCategory(item)}
                          accessibilityLabel={`Choose category ${item}`}
                        />
                      ))}
                    </View>
                  </ScrollView>
                )}
                <Pressable
                  onPress={() => setIsManageCategoriesOpen(true)}
                  accessibilityRole="button"
                  accessibilityLabel="Manage categories"
                  style={({ pressed }) => [styles.manageLink, pressed && styles.pressed]}>
                  <ThemedText type="linkPrimary">Manage categories</ThemedText>
                </Pressable>
              </View>

              <View style={styles.field}>
                <ThemedText type="small" themeColor="textSecondary">
                  Amount
                </ThemedText>
                <TextInput
                  value={amountText}
                  onChangeText={setAmountText}
                  placeholder="e.g. 12.50"
                  placeholderTextColor={theme.textSecondary}
                  style={inputStyle}
                  keyboardType="decimal-pad"
                  accessibilityLabel="Amount"
                />
              </View>

              <View style={styles.field}>
                <ThemedText type="small" themeColor="textSecondary">
                  Date (YYYY-MM-DD)
                </ThemedText>
                <TextInput
                  value={dateText}
                  onChangeText={setDateText}
                  placeholder="e.g. 2026-10-15"
                  placeholderTextColor={theme.textSecondary}
                  style={inputStyle}
                  autoCapitalize="none"
                  autoCorrect={false}
                  accessibilityLabel="Date"
                />
              </View>

              {error.length > 0 ? (
                <ThemedText type="small" style={{ color: theme.danger }}>
                  {error}
                </ThemedText>
              ) : null}

              <View style={styles.actions}>
                <AppButton
                  label="Cancel"
                  variant="secondary"
                  onPress={handleCancel}
                  accessibilityLabel="Cancel"
                  style={styles.actionButton}
                />
                <AppButton
                  label={isEditing ? 'Save' : 'Add'}
                  variant="primary"
                  onPress={handleSave}
                  accessibilityLabel={isEditing ? 'Save expense' : 'Add expense'}
                  style={styles.actionButton}
                />
              </View>

              {isEditing && !isConfirmingDelete ? (
                <AppButton
                  label="Delete Expense"
                  variant="destructive"
                  onPress={handleDeletePress}
                  accessibilityLabel="Delete expense"
                />
              ) : null}

              {isEditing && isConfirmingDelete ? (
                <View style={styles.confirmDelete}>
                  <ThemedText type="small" themeColor="textSecondary">
                    Delete this expense? This cannot be undone.
                  </ThemedText>
                  <View style={styles.actions}>
                    <AppButton
                      label="Keep"
                      variant="secondary"
                      onPress={() => setIsConfirmingDelete(false)}
                      accessibilityLabel="Keep expense"
                      style={styles.actionButton}
                    />
                    <AppButton
                      label="Yes, delete"
                      variant="destructiveFilled"
                      onPress={handleConfirmDelete}
                      accessibilityLabel="Confirm delete expense"
                      style={styles.actionButton}
                    />
                  </View>
                </View>
              ) : null}
            </ScrollView>
          </ThemedView>
        </KeyboardAvoidingView>
      </Modal>

      <ManageCategoriesModal
        visible={isManageCategoriesOpen}
        onClose={() => setIsManageCategoriesOpen(false)}
      />
    </>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFill,
  },
  sheet: {
    maxHeight: '90%',
    borderTopLeftRadius: Spacing.four,
    borderTopRightRadius: Spacing.four,
  },
  sheetContent: {
    gap: Spacing.three,
    padding: Spacing.four,
  },
  field: {
    gap: Spacing.one,
  },
  chipRow: {
    flexDirection: 'row',
    gap: Spacing.two,
    alignItems: 'center',
  },
  manageLink: {
    alignSelf: 'flex-start',
    minHeight: 44,
    justifyContent: 'center',
  },
  input: {
    borderWidth: 1,
    borderRadius: Spacing.two,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    fontSize: 16,
    minHeight: 44,
  },
  actions: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
  actionButton: {
    flex: 1,
  },
  confirmDelete: {
    gap: Spacing.two,
  },
  pressed: {
    opacity: 0.7,
  },
});
