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
import { useThemeColors } from '@/components/useThemeColors';
import { darkColors, mobileLayout, spacing, radius, screenLayout, typography, accentButtonShadow } from '@/constants/Theme';

type MessageRow = {
  id: string;
  body: string;
  senderId: string;
  senderName?: string | null;
  createdAt: string;
};

export default function GroupChatScreen() {
  const { groupId } = useLocalSearchParams<{ groupId: string }>();
  const colors = useThemeColors() ?? darkColors;
  const [messages, setMessages] = useState<MessageRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadMessages = async () => {
    if (!groupId) return;
    setLoading(true);
    setError(null);
    try {
      const data = await apiRequest<MessageRow[] | { messages?: MessageRow[] }>(
        `/api/me/group-chats/${groupId}/messages`
      );
      const list = Array.isArray(data) ? data : (data?.messages ?? []);
      setMessages(list);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Не удалось загрузить сообщения группы.');
      setMessages([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMessages();
  }, [groupId]);

  const sendMessage = async () => {
    const body = input.trim();
    if (!body || !groupId || sending) return;
    setSending(true);
    try {
      const sent = await apiRequest<MessageRow>(
        `/api/me/group-chats/${groupId}/messages`,
        { method: 'POST', body: JSON.stringify({ body }) }
      );
      setMessages((prev) => [sent, ...prev]);
      setInput('');
    } catch {
      setError('Не удалось отправить сообщение.');
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
          <Text style={[typography.bodySmall, { color: colors.textSecondary }]}>{error}</Text>
        </View>
      ) : null}
      <FlatList
        data={messages}
        keyExtractor={(item) => item.id}
        contentContainerStyle={screenLayout.listContent}
        inverted
        renderItem={({ item }) => (
          <View style={[styles.bubble, screenLayout.contentBlock, { backgroundColor: colors.bgCard, borderColor: colors.studioCardBorder ?? colors.border }]}>
            {item.senderName ? (
              <Text style={[typography.caption, { color: colors.textMuted, marginBottom: 2 }]}>{item.senderName}</Text>
            ) : null}
            <Text style={[typography.body, { color: colors.textPrimary }]}>{item.body}</Text>
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
  errorBlock: { margin: spacing.md, padding: mobileLayout.blockPadding, borderRadius: mobileLayout.blockRadius, borderWidth: 1 },
  bubble: { maxWidth: '85%', marginBottom: spacing.xs },
  footer: { flexDirection: 'row', padding: mobileLayout.blockPadding, borderTopWidth: 1, alignItems: 'flex-end', gap: spacing.sm },
  input: { flex: 1, minHeight: 40, maxHeight: 100, borderRadius: mobileLayout.blockRadius, borderWidth: 1, paddingHorizontal: spacing.md, paddingVertical: spacing.xs, fontSize: 16 },
  sendBtn: { paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderRadius: mobileLayout.blockRadius, justifyContent: 'center', minHeight: mobileLayout.minTouchTarget },
  sendBtnText: { color: '#fff', fontWeight: '600', fontSize: 14 },
});
