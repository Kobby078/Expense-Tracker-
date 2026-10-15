import { useEffect, useState } from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import type { Expense } from '@/data/example-expenses';
import { useTheme } from '@/hooks/use-theme';
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
  const isEditing = expenseToEdit !== null;

  const [name, setName] = useState('');
  const [category, setCategory] = useState('');
  const [amountText, setAmountText] = useState('');
  const [dateText, setDateText] = useState(getTodayLocalDate());
  const [error, setError] = useState('');
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);

  useEffect(() => {
    if (!visible) {
      return;
    }

    setIsConfirmingDelete(false);

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
      setError('Please enter a category.');
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
    <Modal visible={visible} animationType="slide" transparent onRequestClose={handleCancel}>
      <KeyboardAvoidingView
        style={styles.overlay}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <Pressable style={styles.backdrop} onPress={handleCancel} />
        <ThemedView type="backgroundElement" style={styles.sheet}>
          <ThemedText type="smallBold">{isEditing ? 'Edit Expense' : 'Add Expense'}</ThemedText>

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
            />
          </View>

          <View style={styles.field}>
            <ThemedText type="small" themeColor="textSecondary">
              Category
            </ThemedText>
            <TextInput
              value={category}
              onChangeText={setCategory}
              placeholder="e.g. Food"
              placeholderTextColor={theme.textSecondary}
              style={inputStyle}
              autoCapitalize="words"
            />
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
            />
          </View>

          {error.length > 0 ? (
            <ThemedText type="small" style={styles.error}>
              {error}
            </ThemedText>
          ) : null}

          <View style={styles.actions}>
            <Pressable
              onPress={handleCancel}
              style={({ pressed }) => [styles.actionButton, pressed && styles.pressed]}>
              <ThemedView type="backgroundSelected" style={styles.actionButtonInner}>
                <ThemedText type="smallBold">Cancel</ThemedText>
              </ThemedView>
            </Pressable>
            <Pressable
              onPress={handleSave}
              style={({ pressed }) => [styles.actionButton, pressed && styles.pressed]}>
              <ThemedView type="backgroundSelected" style={styles.actionButtonInner}>
                <ThemedText type="smallBold">Save</ThemedText>
              </ThemedView>
            </Pressable>
          </View>

          {isEditing && !isConfirmingDelete ? (
            <Pressable
              onPress={handleDeletePress}
              style={({ pressed }) => [styles.deleteButton, pressed && styles.pressed]}>
              <ThemedText type="smallBold" style={styles.deleteText}>
                Delete Expense
              </ThemedText>
            </Pressable>
          ) : null}

          {isEditing && isConfirmingDelete ? (
            <View style={styles.confirmDelete}>
              <ThemedText type="small" themeColor="textSecondary">
                Delete this expense? This cannot be undone.
              </ThemedText>
              <View style={styles.actions}>
                <Pressable
                  onPress={() => setIsConfirmingDelete(false)}
                  style={({ pressed }) => [styles.actionButton, pressed && styles.pressed]}>
                  <ThemedView type="backgroundSelected" style={styles.actionButtonInner}>
                    <ThemedText type="smallBold">Keep</ThemedText>
                  </ThemedView>
                </Pressable>
                <Pressable
                  onPress={handleConfirmDelete}
                  style={({ pressed }) => [styles.actionButton, pressed && styles.pressed]}>
                  <ThemedView type="backgroundSelected" style={styles.actionButtonInner}>
                    <ThemedText type="smallBold" style={styles.deleteText}>
                      Yes, delete
                    </ThemedText>
                  </ThemedView>
                </Pressable>
              </View>
            </View>
          ) : null}
        </ThemedView>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
  },
  sheet: {
    gap: Spacing.three,
    padding: Spacing.four,
    borderTopLeftRadius: Spacing.four,
    borderTopRightRadius: Spacing.four,
  },
  field: {
    gap: Spacing.one,
  },
  input: {
    borderWidth: 1,
    borderRadius: Spacing.two,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    fontSize: 16,
  },
  error: {
    color: '#C62828',
  },
  actions: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
  actionButton: {
    flex: 1,
  },
  actionButtonInner: {
    alignItems: 'center',
    paddingVertical: Spacing.three,
    borderRadius: Spacing.three,
  },
  deleteButton: {
    alignItems: 'center',
    paddingVertical: Spacing.two,
  },
  deleteText: {
    color: '#C62828',
  },
  confirmDelete: {
    gap: Spacing.two,
  },
  pressed: {
    opacity: 0.7,
  },
});
