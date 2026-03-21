import { useState } from 'react';
import { StyleSheet, Text, TextInput, TouchableOpacity, View, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { router } from 'expo-router';
import { createUniverse } from '@/lib/universesApi';
import { useThemeColors } from '@/components/useThemeColors';
import { darkColors, mobileLayout, spacing, typography } from '@/constants/Theme';
import { ScreenContainer } from '@/components/screen';
import { PlatformButtonPrimary } from '@/components/platform';
import { useAuth } from '@/contexts/AuthContext';

export default function CreateUniverseScreen() {
  const colors = useThemeColors() ?? darkColors;
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [pending, setPending] = useState(false);
  const [error, setError] = useState('');
  const [conflictSlug, setConflictSlug] = useState<string | null>(null);
  const { logout } = useAuth();

  const onSubmit = async () => {
    if (!name.trim()) {
      setError('Введите название');
      return;
    }
    setPending(true);
    setError('');
    setConflictSlug(null);
    try {
      const trimmedName = name.trim();
      const slugCandidate = trimmedName
        .toLowerCase()
        .replace(/\s+/g, '-')
        .replace(/[^a-z0-9-]/g, '');
      const created = await createUniverse({ name: trimmedName, description: description.trim() || undefined });
      const targetSlug = created.slug ?? slugCandidate;
      router.replace(`/(tabs)/universes/${encodeURIComponent(targetSlug)}` as any);
    } catch (err: unknown) {
      const e = err as { status?: number; message?: string };
      const status = e?.status;
      const msg = e?.message || 'Ошибка создания сферы. Попробуйте ещё раз.';
      if (status === 401) {
        setError('Сессия истекла. Пожалуйста, войдите заново.');
        try {
          await logout();
        } catch {
          // ignore
        }
        router.replace('/(auth)/login' as any);
      } else if (status === 409) {
        setError('Сфера с таким адресом уже существует. Можно перейти к ней или выбрать другое имя.');
        const trimmedName = name.trim();
        const slugCandidate = trimmedName
          .toLowerCase()
          .replace(/\s+/g, '-')
          .replace(/[^a-z0-9-]/g, '');
        setConflictSlug(slugCandidate || null);
      } else {
        setError(msg);
      }
      setPending(false);
    }
  };

  return (
    <ScreenContainer>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.container}>
        <View style={[styles.field, { borderColor: colors.border }]}>
          <Text style={[typography.caption, { color: colors.textMuted, marginBottom: 4 }]}>Название</Text>
          <TextInput
            value={name}
            onChangeText={setName}
            placeholder="Например: Квантовая физика"
            placeholderTextColor={colors.textMuted}
            style={[styles.input, { color: colors.textPrimary, borderColor: colors.border }]}
            editable={!pending}
          />
        </View>
        <View style={[styles.field, { borderColor: colors.border }]}>
          <Text style={[typography.caption, { color: colors.textMuted, marginBottom: 4 }]}>Описание (необязательно)</Text>
          <TextInput
            value={description}
            onChangeText={setDescription}
            placeholder="Краткое описание сферы"
            placeholderTextColor={colors.textMuted}
            style={[styles.input, styles.textArea, { color: colors.textPrimary, borderColor: colors.border }]}
            multiline
            numberOfLines={2}
            editable={!pending}
          />
        </View>
        {error ? (
          <View style={{ marginBottom: spacing.sm }}>
            <Text style={[typography.body, { color: colors.accent }]}>{error}</Text>
            {conflictSlug ? (
              <TouchableOpacity
                onPress={() => router.replace(`/(tabs)/universes/${encodeURIComponent(conflictSlug)}` as any)}
                style={{ marginTop: spacing.xs }}>
                <Text style={[typography.caption, { color: colors.accent }]}>
                  Перейти к существующей сфере
                </Text>
              </TouchableOpacity>
            ) : null}
          </View>
        ) : null}
        <PlatformButtonPrimary onPress={onSubmit} disabled={pending}>
          {pending ? 'Создание…' : 'Создать сферу'}
        </PlatformButtonPrimary>
      </KeyboardAvoidingView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: mobileLayout.pagePadding },
  field: { marginBottom: spacing.lg },
  input: {
    borderWidth: 1,
    borderRadius: mobileLayout.blockRadius,
    paddingHorizontal: spacing.md,
    paddingVertical: 12,
    fontSize: 16,
  },
  textArea: { minHeight: 80, textAlignVertical: 'top' },
});
