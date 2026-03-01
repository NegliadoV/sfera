import { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { apiRequest } from '@/lib/api';
import { parseTelegram, createContent } from '@/lib/contentApi';
import { useThemeColors } from '@/components/useThemeColors';
import { darkColors, mobileLayout, spacing, typography } from '@/constants/Theme';
import { ScreenContainer, LoadingScreen } from '@/components/screen';
import { PlatformButtonPrimary } from '@/components/platform';

type ContentType = 'link' | 'article' | 'telegram';

export default function AddContentScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const colors = useThemeColors() ?? darkColors;
  const [universeId, setUniverseId] = useState<string | null>(null);
  const [loadingUniverse, setLoadingUniverse] = useState(true);
  const [contentType, setContentType] = useState<ContentType>('link');
  const [title, setTitle] = useState('');
  const [url, setUrl] = useState('');
  const [body, setBody] = useState('');
  const [pending, setPending] = useState(false);
  const [parsePending, setParsePending] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!slug) {
      setLoadingUniverse(false);
      return;
    }
    apiRequest<{ id: string }>(`/api/universes/${encodeURIComponent(slug)}`)
      .then((u) => {
        setUniverseId((u as { id?: string }).id ?? null);
      })
      .catch(() => setUniverseId(null))
      .finally(() => setLoadingUniverse(false));
  }, [slug]);

  const handleParseTelegram = async () => {
    const raw = url.trim() || '';
    if (!raw) {
      setError('Вставьте ссылку на канал или пост Telegram (t.me/...)');
      return;
    }
    setParsePending(true);
    setError('');
    try {
      const data = await parseTelegram(raw);
      if (data.title) setTitle(data.title);
      if (data.description) setBody(data.description);
      if (data.url) setUrl(data.url);
    } catch {
      setError('Не удалось загрузить данные');
    } finally {
      setParsePending(false);
    }
  };

  const onSubmit = async () => {
    if (!title.trim()) {
      setError('Введите название');
      return;
    }
    if (contentType === 'telegram' && !url.trim()) {
      setError('Укажите ссылку на канал или пост Telegram');
      return;
    }
    if (contentType === 'article' && !body.trim()) {
      setError('Введите текст статьи');
      return;
    }
    if (!universeId) {
      setError('Вселенная не найдена');
      return;
    }
    setPending(true);
    setError('');
    try {
      await createContent({
        universeId,
        type: contentType === 'telegram' ? 'link' : contentType,
        title: title.trim(),
        url: (contentType === 'link' || contentType === 'telegram') ? (url.trim() || undefined) : undefined,
        body: body.trim() || undefined,
      });
      router.back();
    } catch (e: any) {
      setError(e?.message ?? 'Ошибка сохранения');
      setPending(false);
    }
  };

  if (loadingUniverse) return <LoadingScreen />;
  if (!universeId) {
    return (
      <ScreenContainer>
        <View style={styles.centered}>
          <Text style={[typography.body, { color: colors.textMuted }]}>Вселенная не найдена</Text>
        </View>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.kav}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <View style={styles.toggle}>
            {(['link', 'telegram', 'article'] as const).map((t) => (
              <TouchableOpacity
                key={t}
                onPress={() => setContentType(t)}
                style={[
                  styles.toggleBtn,
                  { borderColor: colors.border, backgroundColor: contentType === t ? colors.accent : colors.bgCard },
                ]}>
                <Text style={[typography.caption, { color: contentType === t ? '#fff' : colors.textPrimary }]}>
                  {t === 'link' ? 'Ссылка' : t === 'telegram' ? 'Telegram' : 'Статья'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          <View style={styles.field}>
            <Text style={[typography.caption, { color: colors.textMuted, marginBottom: 4 }]}>Название</Text>
            <TextInput
              value={title}
              onChangeText={setTitle}
              placeholder="Название"
              placeholderTextColor={colors.textMuted}
              style={[styles.input, { color: colors.textPrimary, borderColor: colors.border }]}
              editable={!pending}
            />
          </View>
          {(contentType === 'link' || contentType === 'telegram') && (
            <>
              <View style={styles.field}>
                <Text style={[typography.caption, { color: colors.textMuted, marginBottom: 4 }]}>
                  {contentType === 'telegram' ? 'Ссылка (t.me/...)' : 'Ссылка'}
                </Text>
                <TextInput
                  value={url}
                  onChangeText={setUrl}
                  placeholder={contentType === 'telegram' ? 't.me/...' : 'https://...'}
                  placeholderTextColor={colors.textMuted}
                  style={[styles.input, { color: colors.textPrimary, borderColor: colors.border }]}
                  keyboardType="url"
                  editable={!pending}
                />
                {contentType === 'telegram' && (
                  <TouchableOpacity
                    onPress={handleParseTelegram}
                    disabled={parsePending || !url.trim()}
                    style={[styles.parseBtn, { backgroundColor: colors.accent, marginTop: 8 }]}>
                    <Text style={styles.parseBtnText}>
                      {parsePending ? 'Загрузка…' : 'Загрузить из Telegram'}
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
              <View style={styles.field}>
                <Text style={[typography.caption, { color: colors.textMuted, marginBottom: 4 }]}>Описание</Text>
                <TextInput
                  value={body}
                  onChangeText={setBody}
                  placeholder="Краткое описание"
                  placeholderTextColor={colors.textMuted}
                  style={[styles.input, styles.textArea, { color: colors.textPrimary, borderColor: colors.border }]}
                  multiline
                  numberOfLines={2}
                  editable={!pending}
                />
              </View>
            </>
          )}
          {contentType === 'article' && (
            <View style={styles.field}>
              <Text style={[typography.caption, { color: colors.textMuted, marginBottom: 4 }]}>Текст статьи</Text>
              <TextInput
                value={body}
                onChangeText={setBody}
                placeholder="Текст в Markdown…"
                placeholderTextColor={colors.textMuted}
                style={[styles.input, styles.textArea, { color: colors.textPrimary, borderColor: colors.border, minHeight: 120 }]}
                multiline
                editable={!pending}
              />
            </View>
          )}
          {error ? <Text style={[typography.body, { color: colors.accent, marginVertical: 8 }]}>{error}</Text> : null}
          <PlatformButtonPrimary onPress={onSubmit} disabled={pending}>
            {pending ? 'Добавление…' : 'Добавить'}
          </PlatformButtonPrimary>
        </ScrollView>
      </KeyboardAvoidingView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  kav: { flex: 1 },
  scroll: { padding: mobileLayout.pagePadding, paddingBottom: spacing.xxl },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: mobileLayout.pagePadding },
  toggle: { flexDirection: 'row', gap: 8, marginBottom: spacing.lg },
  toggleBtn: { paddingVertical: 8, paddingHorizontal: 12, borderRadius: mobileLayout.blockRadius, borderWidth: 1, minHeight: mobileLayout.minTouchTarget, justifyContent: 'center' },
  field: { marginBottom: spacing.lg },
  input: { borderWidth: 1, borderRadius: mobileLayout.blockRadius, paddingHorizontal: spacing.md, paddingVertical: 12, fontSize: 16 },
  textArea: { minHeight: 80, textAlignVertical: 'top' },
  parseBtn: { paddingVertical: 10, paddingHorizontal: 16, borderRadius: mobileLayout.blockRadius, alignSelf: 'flex-start' },
  parseBtnText: { color: '#fff', fontWeight: '500', fontSize: 14 },
});
