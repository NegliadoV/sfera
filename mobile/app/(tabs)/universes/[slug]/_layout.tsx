import { Stack } from 'expo-router';
import type { ViewStyle } from 'react-native';
import { useThemeColors } from '@/components/useThemeColors';
import { darkColors } from '@/constants/Theme';

export default function UniverseSlugLayout() {
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
      <Stack.Screen name="index" options={{ title: 'Вселенная', headerShown: true }} />
      <Stack.Screen name="content" options={{ title: 'Контент' }} />
      <Stack.Screen name="content/add" options={{ title: 'Добавить материал', headerShown: true }} />
      <Stack.Screen name="rooms" options={{ title: 'Комнаты' }} />
      <Stack.Screen name="rooms/add" options={{ title: 'Создать комнату', headerShown: true }} />
      <Stack.Screen name="mind-maps" options={{ title: 'Ментальные карты' }} />
      <Stack.Screen name="mind-maps/add" options={{ title: 'Создать карту', headerShown: true }} />
    </Stack>
  );
}
