import { useState } from 'react';
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

type AddExpenseModalProps = {
  visible: boolean;
  onCancel: () => void;
  onSave: (expense: Expense) => void;
};

function resetForm(
  setName: (value: string) => void,
  setCategory: (value: string) => void,
  setAmountText: (value: string) => void,
  setError: (value: string) => void
) {
  setName('');
  setCategory('');
  setAmountText('');
  setError('');
}

export function AddExpenseModal({ visible, onCancel, onSave }: AddExpenseModalProps) {
  const theme = useTheme();
  const [name, setName] = useState('');
  const [category, setCategory] = useState('');
  const [amountText, setAmountText] = useState('');
  const [error, setError] = useState('');

  function handleCancel() {
    resetForm(setName, setCategory, setAmountText, setError);
    onCancel();
  }

  function handleSave() {
    const trimmedName = name.trim();
    const trimmedCategory = category.trim();
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

    onSave({
      id: String(Date.now()),
      name: trimmedName,
      category: trimmedCategory,
      amount,
    });

    resetForm(setName, setCategory, setAmountText, setError);
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
          <ThemedText type="smallBold">Add Expense</ThemedText>

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
  pressed: {
    opacity: 0.7,
  },
});
