import { DarkTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import 'react-native-reanimated';

import { AuthProvider } from '@/contexts/AuthContext';
import { AppThemeProvider } from '@/contexts/AppThemeContext';
import { useThemeColors } from '@/components/useThemeColors';
import { darkColors } from '@/constants/Theme';
import { AppBackground } from '@/components/platform/AppBackground';

export {
  ErrorBoundary,
} from 'expo-router';

export const unstable_settings = {
  initialRouteName: 'index',
};

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded, error] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  });

  useEffect(() => {
    if (error) throw error;
  }, [error]);

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  if (!loaded) {
    return (
      <View
        style={[
          StyleSheet.absoluteFill,
          { justifyContent: 'center', alignItems: 'center', backgroundColor: darkColors.bgPrimary },
        ]}>
        <ActivityIndicator size="large" color={darkColors.accent} />
      </View>
    );
  }

  return (
    <AuthProvider>
      <AppThemeProvider>
        <RootLayoutNav />
      </AppThemeProvider>
    </AuthProvider>
  );
}

function RootLayoutNav() {
  const colors = useThemeColors();
  const c = colors ?? darkColors;
  const navTheme = {
    ...DarkTheme,
    colors: {
      ...DarkTheme.colors,
      primary: c.accent,
      background: 'transparent',
      card: 'transparent',
      text: c.textPrimary,
      border: c.border,
    },
  };
  // Как в веб: studio-bg-gradient (160deg, bg-primary → bg-secondary → bg-primary)
  const gradientColors = [c.bgPrimary, c.bgSecondary, c.bgPrimary] as [string, string, ...string[]];
  return (
    <>
      <StatusBar style="light" />
      <ThemeProvider value={navTheme}>
        <AppBackground />
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: 'transparent' },
            animation: 'slide_from_right',
            animationDuration: 320,
          }}>
          <Stack.Screen name="index" />
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="(auth)" />
          <Stack.Screen name="modal" options={{ presentation: 'modal' }} />
        </Stack>
      </ThemeProvider>
    </>
  );
}
