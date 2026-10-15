import { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppButton } from '@/components/app-button';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { MaxContentWidth, Spacing } from '@/constants/theme';
import { useAuth } from '@/context/auth-context';
import { useTheme } from '@/hooks/use-theme';

type AuthMode = 'signIn' | 'signUp';

export function AuthScreen() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { signIn, signUp } = useAuth();

  const [mode, setMode] = useState<AuthMode>('signIn');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit() {
    const trimmedEmail = email.trim();

    setError('');
    setNotice('');

    if (trimmedEmail.length === 0) {
      setError('Enter your email address.');
      return;
    }

    if (!trimmedEmail.includes('@')) {
      setError('Enter a valid email address.');
      return;
    }

    if (password.length === 0) {
      setError('Enter your password.');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    setIsSubmitting(true);

    const result =
      mode === 'signIn'
        ? await signIn(trimmedEmail, password)
        : await signUp(trimmedEmail, password);

    setIsSubmitting(false);

    if (result.error) {
      setError(result.error);
      return;
    }

    if (result.notice) {
      setNotice(result.notice);
      setMode('signIn');
    }
  }

  function switchMode(nextMode: AuthMode) {
    setMode(nextMode);
    setError('');
    setNotice('');
  }

  const inputStyle = [
    styles.input,
    {
      color: theme.text,
      backgroundColor: theme.backgroundElement,
      borderColor: theme.backgroundSelected,
    },
  ];

  return (
    <ThemedView style={styles.screen}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={[
            styles.content,
            {
              paddingTop: insets.top + Spacing.four,
              paddingBottom: insets.bottom + Spacing.four,
            },
          ]}>
          <View style={styles.card}>
            <ThemedText type="subtitle">Expense Tracker</ThemedText>
            <ThemedText type="small" themeColor="textSecondary">
              {mode === 'signIn'
                ? 'Sign in to continue.'
                : 'Create an account to get started.'}
            </ThemedText>

            <View style={styles.field}>
              <ThemedText type="small" themeColor="textSecondary">
                Email
              </ThemedText>
              <TextInput
                value={email}
                onChangeText={setEmail}
                placeholder="you@example.com"
                placeholderTextColor={theme.textSecondary}
                style={inputStyle}
                autoCapitalize="none"
                autoCorrect={false}
                keyboardType="email-address"
                textContentType="emailAddress"
                accessibilityLabel="Email"
              />
            </View>

            <View style={styles.field}>
              <ThemedText type="small" themeColor="textSecondary">
                Password
              </ThemedText>
              <TextInput
                value={password}
                onChangeText={setPassword}
                placeholder="At least 6 characters"
                placeholderTextColor={theme.textSecondary}
                style={inputStyle}
                secureTextEntry
                textContentType={mode === 'signIn' ? 'password' : 'newPassword'}
                accessibilityLabel="Password"
              />
            </View>

            {error.length > 0 ? (
              <ThemedText type="small" style={{ color: theme.danger }}>
                {error}
              </ThemedText>
            ) : null}

            {notice.length > 0 ? (
              <ThemedText type="small" themeColor="textSecondary">
                {notice}
              </ThemedText>
            ) : null}

            <AppButton
              label={mode === 'signIn' ? 'Sign in' : 'Create account'}
              variant="emphasis"
              onPress={handleSubmit}
              disabled={isSubmitting}
              accessibilityLabel={mode === 'signIn' ? 'Sign in' : 'Create account'}
            />

            {isSubmitting ? <ActivityIndicator color={theme.text} /> : null}

            <AppButton
              label={
                mode === 'signIn'
                  ? 'Need an account? Create one'
                  : 'Already have an account? Sign in'
              }
              variant="secondary"
              onPress={() => switchMode(mode === 'signIn' ? 'signUp' : 'signIn')}
              accessibilityLabel={
                mode === 'signIn' ? 'Switch to create account' : 'Switch to sign in'
              }
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  flex: {
    flex: 1,
  },
  content: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.four,
  },
  card: {
    width: '100%',
    maxWidth: MaxContentWidth,
    gap: Spacing.three,
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
});
