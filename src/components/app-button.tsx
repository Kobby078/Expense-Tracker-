import { Pressable, StyleSheet, type StyleProp, type ViewStyle } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type AppButtonVariant = 'primary' | 'secondary' | 'destructive' | 'destructiveFilled';

type AppButtonProps = {
  label: string;
  onPress: () => void;
  variant?: AppButtonVariant;
  disabled?: boolean;
  accessibilityLabel?: string;
  style?: StyleProp<ViewStyle>;
};

export function AppButton({
  label,
  onPress,
  variant = 'primary',
  disabled = false,
  accessibilityLabel,
  style,
}: AppButtonProps) {
  const theme = useTheme();

  let backgroundColor: string = theme.backgroundSelected;
  let borderColor: string = 'transparent';
  let borderWidth = 0;
  let textColor: string = disabled ? theme.textSecondary : theme.text;

  if (variant === 'secondary') {
    backgroundColor = theme.backgroundElement;
    borderColor = theme.backgroundSelected;
    borderWidth = 1;
  } else if (variant === 'destructive') {
    backgroundColor = theme.backgroundElement;
    borderColor = theme.danger;
    borderWidth = 1;
    textColor = theme.danger;
  } else if (variant === 'destructiveFilled') {
    backgroundColor = theme.danger;
    borderColor = theme.danger;
    borderWidth = 1;
    textColor = '#ffffff';
  }

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityState={{ disabled }}
      style={({ pressed }) => [
        styles.button,
        {
          backgroundColor,
          borderColor,
          borderWidth,
          opacity: disabled ? 0.5 : pressed ? 0.7 : 1,
        },
        style,
      ]}>
      <ThemedText type="smallBold" style={{ color: textColor }}>
        {label}
      </ThemedText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 44,
    paddingVertical: Spacing.three,
    paddingHorizontal: Spacing.three,
    borderRadius: Spacing.three,
  },
});
