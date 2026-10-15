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

import { AppButton } from '@/components/app-button';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type EditBudgetModalProps = {
  visible: boolean;
  currentBudget: number;
  onCancel: () => void;
  onSave: (amount: number) => void;
};

export function EditBudgetModal({
  visible,
  currentBudget,
  onCancel,
  onSave,
}: EditBudgetModalProps) {
  const theme = useTheme();
  const [budgetText, setBudgetText] = useState(String(currentBudget));
  const [error, setError] = useState('');

  useEffect(() => {
    if (!visible) {
      return;
    }

    setBudgetText(String(currentBudget));
    setError('');
  }, [visible, currentBudget]);

  function handleCancel() {
    setBudgetText(String(currentBudget));
    setError('');
    onCancel();
  }

  function handleSave() {
    const trimmed = budgetText.trim();

    if (trimmed.length === 0) {
      setError('Enter a monthly budget greater than 0.');
      return;
    }

    const amount = Number(trimmed);

    if (!Number.isFinite(amount) || amount <= 0) {
      setError('Enter a monthly budget greater than 0.');
      return;
    }

    onSave(amount);
    setError('');
  }

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={handleCancel}>
      <KeyboardAvoidingView
        style={styles.overlay}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <Pressable
          style={[styles.backdrop, { backgroundColor: theme.overlay }]}
          onPress={handleCancel}
          accessibilityRole="button"
          accessibilityLabel="Dismiss edit budget form"
        />
        <ThemedView type="backgroundElement" style={styles.sheet}>
          <ThemedText type="default">Edit monthly budget</ThemedText>
          <ThemedText type="small" themeColor="textSecondary">
            Set how much you plan to spend this month.
          </ThemedText>

          <View style={styles.field}>
            <ThemedText type="small" themeColor="textSecondary">
              Monthly budget
            </ThemedText>
            <TextInput
              value={budgetText}
              onChangeText={setBudgetText}
              placeholder="e.g. 500"
              placeholderTextColor={theme.textSecondary}
              style={[
                styles.input,
                {
                  color: theme.text,
                  backgroundColor: theme.background,
                  borderColor: theme.backgroundSelected,
                },
              ]}
              keyboardType="decimal-pad"
              accessibilityLabel="Monthly budget"
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
              accessibilityLabel="Cancel edit budget"
              style={styles.actionButton}
            />
            <AppButton
              label="Save"
              variant="primary"
              onPress={handleSave}
              accessibilityLabel="Save monthly budget"
              style={styles.actionButton}
            />
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
    minHeight: 44,
  },
  actions: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
  actionButton: {
    flex: 1,
  },
});
