import { useState } from 'react';
import { StyleSheet, Text, TextInput, TouchableOpacity, View, KeyboardAvoidingView, Platform } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { createRoom } from '@/lib/roomsApi';
import { useThemeColors } from '@/components/useThemeColors';
import { darkColors, mobileLayout, spacing, typography } from '@/constants/Theme';
import { ScreenContainer } from '@/components/screen';
import { PlatformButtonPrimary } from '@/components/platform';

export default function CreateRoomScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const colors = useThemeColors() ?? darkColors;
  const [title, setTitle] = useState('');
  const [pending, setPending] = useState(false);
  const [error, setError] = useState('');

  const onSubmit = async () => {
    if (!title.trim()) {
      setError('Введите название комнаты');
      return;
    }
    if (!slug) {
      setError('Вселенная не найдена');
      return;
    }
    setPending(true);
    setError('');
    try {
      await createRoom(slug, { title: title.trim() });
      router.back();
    } catch (e: any) {
      setError(e?.message ?? 'Ошибка создания');
      setPending(false);
    }
  };

  return (
    <ScreenContainer>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.kav}>
        <View style={styles.form}>
          <Text style={[typography.caption, { color: colors.textMuted, marginBottom: 4 }]}>Название комнаты</Text>
          <TextInput
            value={title}
            onChangeText={setTitle}
            placeholder="Например: Просмотр выпуска"
            placeholderTextColor={colors.textMuted}
            style={[styles.input, { color: colors.textPrimary, borderColor: colors.border }]}
            editable={!pending}
          />
          {error ? <Text style={[typography.body, { color: colors.accent, marginTop: 8 }]}>{error}</Text> : null}
          <View style={styles.submit}>
            <PlatformButtonPrimary onPress={onSubmit} disabled={pending}>
            {pending ? 'Создание…' : 'Создать комнату'}
            </PlatformButtonPrimary>
          </View>
        </View>
      </KeyboardAvoidingView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  kav: { flex: 1, padding: mobileLayout.pagePadding },
  form: {},
  input: { borderWidth: 1, borderRadius: mobileLayout.blockRadius, paddingHorizontal: spacing.md, paddingVertical: 12, fontSize: 16 },
  submit: { marginTop: spacing.lg },
});
