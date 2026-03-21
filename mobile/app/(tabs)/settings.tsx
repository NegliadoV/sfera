import { useState, useEffect } from 'react';
import { Platform, StyleSheet, TouchableOpacity, Alert, ScrollView, View, Text, TextInput } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useThemeColors } from '@/components/useThemeColors';
import { useAppTheme } from '@/contexts/AppThemeContext';
import { router } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { darkColors, mobileLayout, spacing, tabBarTokens } from '@/constants/Theme';
import { PlatformCard, PlatformSectionHeading, PlatformButton } from '@/components/platform';
import { getUserTag, updateUserTag } from '@/lib/meApi';

export default function SettingsScreen() {
  const colors = useThemeColors() ?? darkColors;
  const insets = useSafeAreaInsets();
  const tabBarHeight = tabBarTokens.rowHeight + tabBarTokens.marginBottom +
    (Platform.OS === 'web' ? 20 : Math.max(insets.bottom, 12) + tabBarTokens.webPaddingBottom);
  const { themeMode, setThemeMode, accent, setAccent, accentPresets } = useAppTheme();
  const { user, logout } = useAuth();
  const [userTag, setUserTag] = useState('');
  const [userTagLoading, setUserTagLoading] = useState(true);
  const [userTagSaving, setUserTagSaving] = useState(false);

  useEffect(() => {
    getUserTag()
      .then((tag) => setUserTag(tag ?? ''))
      .catch(() => setUserTag(''))
      .finally(() => setUserTagLoading(false));
  }, []);

  const saveUserTag = async () => {
    const trimmed = userTag.trim().replace(/^@+/, '');
    setUserTagSaving(true);
    try {
      const updated = await updateUserTag(trimmed || '');
      setUserTag(updated ?? '');
    } catch {}
    setUserTagSaving(false);
  };

  const handleLogout = () => {
    Alert.alert('Выйти', 'Вы уверены?', [
      { text: 'Отмена', style: 'cancel' },
      { text: 'Выйти', style: 'destructive', onPress: async () => {
        await logout();
        router.replace('/(auth)/login');
      } },
    ]);
  };

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: 'transparent' }]}
      contentContainerStyle={[styles.scrollContent, { paddingBottom: spacing.xxl + tabBarHeight }]}>
      <Text style={[styles.title, { color: colors.textPrimary }]}>Настройки</Text>
      {user?.email && (
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>{user.email}</Text>
      )}

      <PlatformCard compact style={styles.section}>
        <PlatformSectionHeading>Тег</PlatformSectionHeading>
        <Text style={[styles.hint, { color: colors.textMuted }]}>
          Уникальный тег для поиска (3–30 символов: буквы, цифры, подчёркивание).
        </Text>
        {!userTagLoading && (
          <>
            <TextInput
              value={userTag}
              onChangeText={setUserTag}
              placeholder="@username"
              placeholderTextColor={colors.textMuted}
              style={[styles.userTagInput, { color: colors.textPrimary, borderColor: colors.border }]}
              editable={!userTagSaving}
            />
            <TouchableOpacity
              onPress={saveUserTag}
              disabled={userTagSaving}
              style={[styles.saveTagBtn, { backgroundColor: colors.accent }]}>
              <Text style={styles.saveTagBtnText}>{userTagSaving ? 'Сохранение…' : 'Сохранить тег'}</Text>
            </TouchableOpacity>
          </>
        )}
      </PlatformCard>

      <PlatformCard compact style={styles.section}>
        <PlatformSectionHeading>Внешний вид</PlatformSectionHeading>
        <Text style={[styles.hint, { color: colors.textMuted }]}>
          Акцентный цвет. Сохраняется на устройстве.
        </Text>

        <Text style={[styles.label, { color: colors.textSecondary }]}>Акцентный цвет</Text>
        <View style={styles.accentRow}>
          {accentPresets.map((preset) => {
            const isActive = accent.value.toLowerCase() === preset.value.toLowerCase();
            return (
              <TouchableOpacity
                key={preset.value}
                onPress={() => setAccent(preset.value, preset.hover)}
                style={[
                  styles.accentSwatch,
                  { backgroundColor: preset.value, borderColor: isActive ? colors.textPrimary : colors.border },
                  isActive && styles.accentSwatchActive,
                ]}
              />
            );
          })}
        </View>
      </PlatformCard>

      <View style={styles.logoutRow}>
        <PlatformButton onPress={handleLogout}>Выйти</PlatformButton>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: {
    padding: mobileLayout.pagePadding,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: spacing.xs,
  },
  subtitle: {
    marginBottom: spacing.lg,
    fontSize: 14,
  },
  section: {
    marginBottom: spacing.lg,
  },
  hint: {
    fontSize: 14,
    marginBottom: spacing.md,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: spacing.sm,
  },
  themeRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  themeOption: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: mobileLayout.blockRadius,
    borderWidth: 1,
    alignItems: 'center',
    minHeight: mobileLayout.minTouchTarget,
    justifyContent: 'center',
  },
  themeOptionActive: {
    borderWidth: 2,
  },
  themeOptionText: {
    fontSize: 15,
    fontWeight: '500',
  },
  accentRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  accentSwatch: {
    width: 40,
    height: 40,
    borderRadius: 12,
    borderWidth: 2,
  },
  accentSwatchActive: {
    borderWidth: 3,
  },
  logoutRow: {
    marginTop: spacing.md,
  },
  userTagInput: {
    borderWidth: 1,
    borderRadius: mobileLayout.blockRadius,
    paddingHorizontal: spacing.md,
    paddingVertical: 12,
    fontSize: 16,
    marginBottom: spacing.sm,
  },
  saveTagBtn: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: mobileLayout.blockRadius,
    alignSelf: 'flex-start',
    minHeight: mobileLayout.minTouchTarget,
    justifyContent: 'center',
  },
  saveTagBtnText: { color: '#fff', fontWeight: '600', fontSize: 14 },
});
