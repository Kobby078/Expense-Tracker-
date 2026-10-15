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
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useCategories } from '@/context/categories-context';
import { useTheme } from '@/hooks/use-theme';

type ManageCategoriesModalProps = {
  visible: boolean;
  onClose: () => void;
};

export function ManageCategoriesModal({ visible, onClose }: ManageCategoriesModalProps) {
  const theme = useTheme();
  const { categories, addCategory, renameCategory, deleteCategory } = useCategories();

  const [newCategoryText, setNewCategoryText] = useState('');
  const [addError, setAddError] = useState('');
  const [actionError, setActionError] = useState('');
  const [editingCategory, setEditingCategory] = useState<string | null>(null);
  const [renameText, setRenameText] = useState('');

  useEffect(() => {
    if (!visible) {
      return;
    }

    setNewCategoryText('');
    setAddError('');
    setActionError('');
    setEditingCategory(null);
    setRenameText('');
  }, [visible]);

  function handleAdd() {
    const result = addCategory(newCategoryText);

    if (!result.ok) {
      setAddError(result.error ?? 'Could not add category.');
      return;
    }

    setNewCategoryText('');
    setAddError('');
    setActionError('');
  }

  function startRename(category: string) {
    setEditingCategory(category);
    setRenameText(category);
    setActionError('');
  }

  function cancelRename() {
    setEditingCategory(null);
    setRenameText('');
  }

  function handleRenameSave() {
    if (editingCategory === null) {
      return;
    }

    const result = renameCategory(editingCategory, renameText);

    if (!result.ok) {
      setActionError(result.error ?? 'Could not rename category.');
      return;
    }

    setEditingCategory(null);
    setRenameText('');
    setActionError('');
  }

  function handleDelete(category: string) {
    const result = deleteCategory(category);

    if (!result.ok) {
      setActionError(result.error ?? 'Could not delete category.');
      return;
    }

    if (editingCategory === category) {
      cancelRename();
    }

    setActionError('');
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
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <KeyboardAvoidingView
        style={styles.overlay}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <Pressable
          style={[styles.backdrop, { backgroundColor: theme.overlay }]}
          onPress={onClose}
          accessibilityRole="button"
          accessibilityLabel="Dismiss manage categories"
        />
        <ThemedView type="backgroundElement" style={styles.sheet}>
          <ScrollView
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.sheetContent}>
            <ThemedText type="default">Manage categories</ThemedText>
            <ThemedText type="small" themeColor="textSecondary">
              Add, rename, or delete categories used when logging expenses.
            </ThemedText>

            <View style={styles.addRow}>
              <TextInput
                value={newCategoryText}
                onChangeText={setNewCategoryText}
                placeholder="New category name"
                placeholderTextColor={theme.textSecondary}
                style={[inputStyle, styles.addInput]}
                autoCapitalize="words"
                accessibilityLabel="New category name"
              />
              <AppButton
                label="Add"
                variant="primary"
                onPress={handleAdd}
                accessibilityLabel="Add category"
                style={styles.addButton}
              />
            </View>

            {addError.length > 0 ? (
              <ThemedText type="small" style={{ color: theme.danger }}>
                {addError}
              </ThemedText>
            ) : null}

            {actionError.length > 0 ? (
              <ThemedText type="small" style={{ color: theme.danger }}>
                {actionError}
              </ThemedText>
            ) : null}

            <View style={styles.list}>
              {categories.map((category) => {
                const isEditing = editingCategory === category;

                return (
                  <ThemedView
                    key={category}
                    type="background"
                    style={styles.categoryRow}>
                    {isEditing ? (
                      <View style={styles.renameBlock}>
                        <TextInput
                          value={renameText}
                          onChangeText={setRenameText}
                          style={inputStyle}
                          autoCapitalize="words"
                          accessibilityLabel={`Rename ${category}`}
                        />
                        <View style={styles.rowActions}>
                          <AppButton
                            label="Cancel"
                            variant="secondary"
                            onPress={cancelRename}
                            accessibilityLabel="Cancel rename"
                            style={styles.rowButton}
                          />
                          <AppButton
                            label="Save"
                            variant="primary"
                            onPress={handleRenameSave}
                            accessibilityLabel="Save category name"
                            style={styles.rowButton}
                          />
                        </View>
                      </View>
                    ) : (
                      <>
                        <ThemedText type="smallBold" style={styles.categoryName}>
                          {category}
                        </ThemedText>
                        <View style={styles.rowActions}>
                          <AppButton
                            label="Rename"
                            variant="secondary"
                            onPress={() => startRename(category)}
                            accessibilityLabel={`Rename ${category}`}
                            style={styles.rowButton}
                          />
                          <AppButton
                            label="Delete"
                            variant="destructive"
                            onPress={() => handleDelete(category)}
                            accessibilityLabel={`Delete ${category}`}
                            style={styles.rowButton}
                          />
                        </View>
                      </>
                    )}
                  </ThemedView>
                );
              })}
            </View>

            <AppButton
              label="Done"
              variant="primary"
              onPress={onClose}
              accessibilityLabel="Done managing categories"
            />
          </ScrollView>
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
    maxHeight: '90%',
    borderTopLeftRadius: Spacing.four,
    borderTopRightRadius: Spacing.four,
  },
  sheetContent: {
    gap: Spacing.three,
    padding: Spacing.four,
  },
  addRow: {
    flexDirection: 'row',
    gap: Spacing.two,
    alignItems: 'center',
  },
  addInput: {
    flex: 1,
  },
  addButton: {
    minWidth: 88,
  },
  input: {
    borderWidth: 1,
    borderRadius: Spacing.two,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    fontSize: 16,
    minHeight: 44,
  },
  list: {
    gap: Spacing.two,
  },
  categoryRow: {
    gap: Spacing.two,
    padding: Spacing.three,
    borderRadius: Spacing.three,
  },
  categoryName: {
    flex: 1,
  },
  renameBlock: {
    gap: Spacing.two,
  },
  rowActions: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
  rowButton: {
    flex: 1,
  },
});
