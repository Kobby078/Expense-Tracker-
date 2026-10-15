import { DarkTheme, DefaultTheme, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useColorScheme } from 'react-native';

import { AnimatedSplashOverlay } from '@/components/animated-icon';
import AppTabs from '@/components/app-tabs';
import { BudgetProvider } from '@/context/budget-context';
import { CategoriesProvider } from '@/context/categories-context';
import { ExpensesProvider } from '@/context/expenses-context';

SplashScreen.preventAutoHideAsync();

export default function TabLayout() {
  const colorScheme = useColorScheme();
  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <ExpensesProvider>
        <BudgetProvider>
          <CategoriesProvider>
            <AnimatedSplashOverlay />
            <AppTabs />
          </CategoriesProvider>
        </BudgetProvider>
      </ExpensesProvider>
    </ThemeProvider>
  );
}
