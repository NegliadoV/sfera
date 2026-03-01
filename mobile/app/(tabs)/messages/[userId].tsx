import { useEffect, useState } from 'react';
import {
  StyleSheet,
  FlatList,
  ActivityIndicator,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Text, View } from '@/components/Themed';
import { useLocalSearchParams } from 'expo-router';
import { apiRequest } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { useThemeColors } from '@/components/useThemeColors';
import { darkColors, mobileLayout, spacing, screenLayout, typography, accentButtonShadow } from '@/constants/Theme';

type MessageRow = {
  id: string;
  body: string;
  senderId: string;
  createdAt: string;
  isOwn?: boolean;
};

export default function ChatScreen() {
  const { userId } = useLocalSearchParams<{ userId: string }>();
  const { user: me } = useAuth();
  const colors = useThemeColors() ?? darkColors;
  const [messages, setMessages] = useState<MessageRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadMessages = async () => {
    if (!userId) return;
    setLoading(true);
    setError(null);
    try {
      const data = await apiRequest<{ messages?: Array<{ id: string; body: string; senderId: string; createdAt: string }> }>(
        `/api/me/conversations/${userId}`
      );
      const list = data?.messages ?? (Array.isArray(data) ? data : []);
      setMessages(
        (list as MessageRow[]).map((m) => ({
          ...m,
          isOwn: me?.id ? m.senderId === me.id : false,
        }))
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Не удалось загрузить переписку. Для мобилки в API нужна поддержка JWT (getSessionForRequest).');
      setMessages([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMessages();
  }, [userId]);

  const sendMessage = async () => {
    const body = input.trim();
    if (!body || !userId || sending) return;
    setSending(true);
    try {
      const sent = await apiRequest<{ id: string; body: string; senderId: string; createdAt: string }>(
        `/api/me/conversations/${userId}/messages`,
        { method: 'POST', body: JSON.stringify({ body }) }
      );
      setMessages((prev) => [...prev, { ...sent, isOwn: true }]);
      setInput('');
    } catch {
      setError('Не удалось отправить. Проверьте поддержку JWT в API.');
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return (
      <View style={[screenLayout.loadingCentered, { backgroundColor: 'transparent' }]}>
        <ActivityIndicator size="large" color={colors.accent} />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={[styles.container, { backgroundColor: 'transparent' }]}>
      {error ? (
        <View style={[styles.errorBlock, { backgroundColor: colors.bgCard, borderColor: colors.studioCardBorder ?? colors.border }]}>
          <Text style={[styles.errorText, { color: colors.textSecondary }]}>{error}</Text>
        </View>
      ) : null}
      <FlatList
        data={messages}
        keyExtractor={(item) => item.id}
        contentContainerStyle={screenLayout.listContent}
        renderItem={({ item }) => (
          <View
            style={[
              styles.bubble,
              screenLayout.contentBlock,
              item.isOwn ? { alignSelf: 'flex-end', backgroundColor: colors.accent, borderColor: colors.accent } : { alignSelf: 'flex-start', backgroundColor: colors.bgCard, borderColor: colors.studioCardBorder ?? colors.border },
            ]}>
            <Text style={[typography.body, { color: item.isOwn ? '#fff' : colors.textPrimary }]}>{item.body}</Text>
          </View>
        )}
        ListEmptyComponent={
          <View style={screenLayout.empty}>
            <Text style={[typography.body, { color: colors.textMuted }]}>Нет сообщений</Text>
          </View>
        }
      />
      <View style={[styles.footer, { backgroundColor: colors.bgCard, borderColor: colors.studioPanelBorder ?? colors.border }]}>
        <TextInput
          style={[styles.input, { backgroundColor: colors.bgSecondary, color: colors.textPrimary, borderColor: colors.border }]}
          placeholder="Сообщение..."
          placeholderTextColor={colors.textMuted}
          value={input}
          onChangeText={setInput}
          editable={!sending}
          multiline
          maxLength={4096}
        />
        <TouchableOpacity
          style={[styles.sendBtn, { backgroundColor: colors.accent }, accentButtonShadow(colors.accent)]}
          onPress={sendMessage}
          disabled={!input.trim() || sending}>
          <Text style={styles.sendBtnText}>Отпр.</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  errorBlock: { margin: spacing.md, padding: mobileLayout.blockPadding, borderRadius: mobileLayout.blockRadius, borderWidth: 1 },
  errorText: { fontSize: 14 },
  bubble: { maxWidth: '80%', marginBottom: spacing.xs },
  footer: { flexDirection: 'row', padding: mobileLayout.blockPadding, borderTopWidth: 1, alignItems: 'flex-end', gap: spacing.sm },
  input: { flex: 1, minHeight: 40, maxHeight: 100, borderRadius: mobileLayout.blockRadius, borderWidth: 1, paddingHorizontal: spacing.md, paddingVertical: spacing.xs, fontSize: 16 },
  sendBtn: { paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderRadius: mobileLayout.blockRadius, justifyContent: 'center', minHeight: mobileLayout.minTouchTarget },
  sendBtnText: { color: '#fff', fontWeight: '600', fontSize: 14 },
});
