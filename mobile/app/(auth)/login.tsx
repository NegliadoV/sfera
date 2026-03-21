import { useState } from 'react';
import {
  StyleSheet,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { router } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { useThemeColors } from '@/components/useThemeColors';
import { darkColors, mobileLayout, spacing } from '@/constants/Theme';
import {
  PlatformCard,
  PlatformHeroTitle,
  PlatformHeroDesc,
  PlatformInput,
  PlatformButtonPrimary,
  PlatformButton,
  PlatformSectionHeading,
} from '@/components/platform';

export default function LoginScreen() {
  const colors = useThemeColors() ?? darkColors;
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const getLoginErrorMessage = (e: unknown): string => {
    if (e instanceof TypeError && (e.message === 'Failed to fetch' || e.message.includes('Network'))) {
      return 'Не удаётся подключиться к серверу. Запустите бэкенд в корне проекта: npm run dev. На телефоне задайте EXPO_PUBLIC_API_URL=http://IP_ВАШЕГО_ПК:3000';
    }
    if (e instanceof Error) {
      if ('status' in e) {
        if ((e as { status: number }).status === 404) return e.message;
        if ((e as { status: number }).status === 401) {
          return 'Неверный email или пароль. Для seed-входа выполните в корне проекта: npm run db:seed';
        }
      }
      if (e.message === 'Failed to fetch' || e.message.includes('Network')) {
        return 'Нет связи с сервером. Запустите бэкенд: npm run dev (в корне проекта). На телефоне укажите EXPO_PUBLIC_API_URL=http://ВАШ_IP:3000';
      }
      if (e.message) return e.message;
    }
    return 'Ошибка входа';
  };

  const handleLogin = async () => {
    if (!email.trim()) {
      Alert.alert('Ошибка', 'Введите email');
      return;
    }
    if (!password) {
      Alert.alert('Ошибка', 'Введите пароль');
      return;
    }
    setLoading(true);
    try {
      await login(email, password);
      setLoading(false);
      requestAnimationFrame(() => router.replace('/(tabs)'));
    } catch (e: unknown) {
      Alert.alert('Ошибка', getLoginErrorMessage(e));
      setLoading(false);
    }
  };

  const handleSeedLogin = async () => {
    setLoading(true);
    try {
      await login('seed@horizon.local', '');
      setLoading(false);
      requestAnimationFrame(() => router.replace('/(tabs)'));
    } catch (e: unknown) {
      Alert.alert('Ошибка', getLoginErrorMessage(e));
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={[styles.container, { backgroundColor: 'transparent' }]}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}>
        <PlatformCard compact>
          <PlatformHeroTitle gradient>Вход в Ноосферу</PlatformHeroTitle>
          <PlatformHeroDesc>
            Общий аккаунт с сайтом: используйте тот же email и пароль, что и на веб-версии.
          </PlatformHeroDesc>

          <PlatformInput
            label="Email"
            value={email}
            onChangeText={setEmail}
            placeholder="you@example.com"
            editable={!loading}
            autoCapitalize="none"
            keyboardType="email-address"
          />
          <PlatformInput
            label="Пароль"
            value={password}
            onChangeText={setPassword}
            placeholder="••••••••"
            secureTextEntry
            editable={!loading}
          />

          <PlatformButtonPrimary onPress={handleLogin} disabled={loading} loading={loading}>
            Войти
          </PlatformButtonPrimary>

          <View style={[styles.registerRow, { marginTop: spacing.lg }]}>
            <Text style={[styles.registerHint, { color: colors.textMuted }]}>Нет аккаунта? </Text>
            <TouchableOpacity onPress={() => router.push('/(auth)/register')} disabled={loading}>
              <Text style={[styles.registerLink, { color: colors.accentMuted }]}>Зарегистрироваться</Text>
            </TouchableOpacity>
          </View>

          <View style={[styles.seedSection, { borderTopColor: colors.studioPanelBorder }]}>
            <PlatformSectionHeading>Dev: вход как seed-пользователь</PlatformSectionHeading>
            <PlatformButton onPress={handleSeedLogin} disabled={loading}>
              Войти как seed-пользователь
            </PlatformButton>
          </View>
        </PlatformCard>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    maxWidth: 480,
    alignSelf: 'center',
    width: '100%',
    justifyContent: 'center',
    paddingHorizontal: mobileLayout.pagePadding,
    paddingBottom: spacing.xxl,
  },
  registerRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  registerHint: {
    fontSize: 15,
  },
  registerLink: {
    fontSize: 15,
    fontWeight: '500',
  },
  seedSection: {
    marginTop: spacing.xl,
    paddingTop: spacing.lg,
    borderTopWidth: 1,
  },
});
