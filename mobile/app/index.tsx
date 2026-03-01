import { useEffect } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { useThemeColors } from '@/components/useThemeColors';
import { darkColors, screenLayout } from '@/constants/Theme';

export default function IndexRedirect() {
  const { token, isLoading } = useAuth();
  const colors = useThemeColors() ?? darkColors;

  useEffect(() => {
    if (isLoading) return;
    if (token) {
      router.replace('/(tabs)/messages');
    } else {
      router.replace('/(auth)/login');
    }
  }, [token, isLoading]);

  // Не показывать спиннер, если уже авторизован — сразу редирект (например, при нажатии «Назад» с (tabs))
  if (!isLoading && token) {
    return <View style={{ flex: 1, backgroundColor: colors.bgPrimary }} />;
  }

  return (
    <View style={[screenLayout.loadingCentered, { backgroundColor: colors.bgPrimary }]}>
      <ActivityIndicator size="large" color={colors.accent} />
    </View>
  );
}
