import { Stack } from 'expo-router';
import type { ViewStyle } from 'react-native';
import { useThemeColors } from '@/components/useThemeColors';
import { darkColors } from '@/constants/Theme';

export default function UniversesLayout() {
  const colors = useThemeColors() ?? darkColors;
  const headerStyle: ViewStyle = {
    backgroundColor: colors.bgPrimary,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderSubtle,
  };
  return (
    <Stack
      screenOptions={{
        contentStyle: { backgroundColor: 'transparent' },
        headerStyle: headerStyle as any,
        headerTintColor: colors.textPrimary,
        animation: 'slide_from_right',
        animationDuration: 320,
      }}>
      <Stack.Screen name="index" options={{ title: 'Вселенные', headerShown: true }} />
      <Stack.Screen name="create" options={{ title: 'Создать сферу', headerShown: true }} />
      <Stack.Screen name="[slug]" options={{ headerShown: false }} />
    </Stack>
  );
}
