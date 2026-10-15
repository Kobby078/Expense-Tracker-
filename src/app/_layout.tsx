import { DarkTheme, DefaultTheme, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { ActivityIndicator, StyleSheet, useColorScheme } from 'react-native';

import { AnimatedSplashOverlay } from '@/components/animated-icon';
import AppTabs from '@/components/app-tabs';
import { AuthScreen } from '@/components/auth-screen';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { AuthProvider, useAuth } from '@/context/auth-context';
import { BudgetProvider } from '@/context/budget-context';
import { CategoriesProvider } from '@/context/categories-context';
import { ExpensesProvider } from '@/context/expenses-context';
import { useTheme } from '@/hooks/use-theme';

SplashScreen.preventAutoHideAsync();

function RootContent() {
  const theme = useTheme();
  const { session, isAuthLoading } = useAuth();

  if (isAuthLoading) {
    return (
      <ThemedView style={styles.loadingScreen}>
        <ActivityIndicator color={theme.text} />
        <ThemedText type="small" themeColor="textSecondary">
          Checking sign-in…
        </ThemedText>
      </ThemedView>
    );
  }

  if (!session) {
    return <AuthScreen />;
  }

  return (
    <ExpensesProvider>
      <BudgetProvider>
        <CategoriesProvider>
          <AnimatedSplashOverlay />
          <AppTabs />
        </CategoriesProvider>
      </BudgetProvider>
    </ExpensesProvider>
  );
}

export default function TabLayout() {
  const colorScheme = useColorScheme();

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <AuthProvider>
        <RootContent />
      </AuthProvider>
    </ThemeProvider>
  );
}

const styles = StyleSheet.create({
  loadingScreen: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.three,
  },
});
