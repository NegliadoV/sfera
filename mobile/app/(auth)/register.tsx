import { useState } from 'react';
import {
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ScrollView,
  View,
} from 'react-native';
import { router } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { useThemeColors } from '@/components/useThemeColors';
import { darkColors, mobileLayout, spacing } from '@/constants/Theme';
import {
  PlatformCard,
  PlatformHeroDesc,
  PlatformInput,
  PlatformButtonPrimary,
  PlatformButton,
} from '@/components/platform';

export default function RegisterScreen() {
  const colors = useThemeColors() ?? darkColors;
  const { register } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    if (!email.trim()) {
      Alert.alert('Ошибка', 'Введите email');
      return;
    }
    if (password.length < 8) {
      Alert.alert('Ошибка', 'Пароль не менее 8 символов');
      return;
    }
    setLoading(true);
    try {
      await register(email, password, name.trim() || undefined);
      router.replace('/(tabs)');
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Ошибка регистрации';
      const status = e && typeof (e as { status?: number }).status === 'number' ? (e as { status: number }).status : 0;
      if (status === 409) {
        Alert.alert('Аккаунт уже есть', 'Пользователь с таким email уже зарегистрирован (на сайте или в приложении). Войдите с этим email и паролем.');
        return;
      }
      Alert.alert('Ошибка', msg);
    } finally {
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
          <PlatformHeroDesc>
            Общий аккаунт с сайтом: после регистрации вы сможете входить и на сайте, и здесь.
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
            label="Имя (необязательно)"
            value={name}
            onChangeText={setName}
            placeholder="Имя"
            editable={!loading}
          />
          <PlatformInput
            label="Пароль"
            value={password}
            onChangeText={setPassword}
            placeholder="Минимум 8 символов"
            secureTextEntry
            editable={!loading}
          />

          <PlatformButtonPrimary onPress={handleRegister} disabled={loading} loading={loading}>
            Зарегистрироваться
          </PlatformButtonPrimary>

          <View style={[styles.backRow, { marginTop: spacing.lg }]}>
            <PlatformButton onPress={() => router.back()} disabled={loading} small>
              Уже есть аккаунт? Войти
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
    paddingTop: 48,
    paddingHorizontal: mobileLayout.pagePadding,
    paddingBottom: spacing.xxl,
  },
  backRow: {},
});
