import { Stack } from 'expo-router';
import type { ViewStyle } from 'react-native';
import { useThemeColors } from '@/components/useThemeColors';
import { darkColors } from '@/constants/Theme';

export default function AuthLayout() {
  const colors = useThemeColors() ?? darkColors;
  const headerStyle: ViewStyle = {
    backgroundColor: colors.bgPrimary,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderSubtle,
  };

  return (
    <Stack
      screenOptions={{
        headerShown: true,
        title: 'SFERA',
        contentStyle: { backgroundColor: colors.bgPrimary },
        headerStyle: headerStyle as any,
        headerTintColor: colors.textSecondary,
        headerShadowVisible: false,
        animation: 'fade',
        animationDuration: 280,
      }}>
      <Stack.Screen name="login" options={{ title: 'Вход' }} />
      <Stack.Screen name="register" options={{ title: 'Регистрация' }} />
    </Stack>
  );
}
