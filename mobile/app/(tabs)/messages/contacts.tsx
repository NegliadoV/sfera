import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  InteractionManager,
} from 'react-native';
import { router } from 'expo-router';
import { searchContacts, fetchContacts, type ContactUser } from '@/lib/messagesApi';
import {
  getContactRequests,
  sendContactRequest,
  respondToContactRequest,
  type ContactRequestIncoming,
  type ContactRequestOutgoing,
} from '@/lib/contactsApi';
import { useThemeColors } from '@/components/useThemeColors';
import { darkColors, mobileLayout, spacing, typography } from '@/constants/Theme';
import { ScreenContainer } from '@/components/screen';
import { PlatformButton } from '@/components/platform';

const SEARCH_DEBOUNCE_MS = 400;
const MIN_QUERY_LENGTH = 2;

function displayName(u: { name?: string | null; userTag?: string | null; email?: string | null; id: string }) {
  if (u.userTag) return `@${u.userTag}`;
  if (u.name?.trim()) return u.name;
  if (u.email) return u.email;
  return u.id.slice(0, 8);
}

function subline(u: { name?: string | null; userTag?: string | null; email?: string | null }) {
  const parts: string[] = [];
  if (u.userTag && u.name) parts.push(u.name);
  else if (u.email) parts.push(u.email);
  return parts.join(' · ') || undefined;
}

export default function ContactsScreen() {
  const colors = useThemeColors() ?? darkColors;
  const [incoming, setIncoming] = useState<ContactRequestIncoming[]>([]);
  const [outgoing, setOutgoing] = useState<ContactRequestOutgoing[]>([]);
  const [contactIds, setContactIds] = useState<Set<string>>(new Set());
  const [requestedIds, setRequestedIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [query, setQuery] = useState('');
  const [searchResults, setSearchResults] = useState<ContactUser[]>([]);
  const [searching, setSearching] = useState(false);
  const [sendingId, setSendingId] = useState<string | null>(null);
  const [respondingId, setRespondingId] = useState<string | null>(null);
  const [error, setError] = useState('');

  const loadRequestsAndContacts = useCallback(async () => {
    try {
      const [reqs, contacts] = await Promise.all([
        getContactRequests(),
        fetchContacts(),
      ]);
      setIncoming(reqs.incoming);
      setOutgoing(reqs.outgoing);
      setContactIds(new Set(contacts.map((c) => c.id)));
      setRequestedIds(new Set(reqs.outgoing.filter((r) => r.status === 'pending').map((r) => r.toUser.id)));
    } catch {
      setIncoming([]);
      setOutgoing([]);
      setContactIds(new Set());
      setRequestedIds(new Set());
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    const task = InteractionManager.runAfterInteractions(() => {
      loadRequestsAndContacts();
    });
    return () => task.cancel();
  }, [loadRequestsAndContacts]);

  useEffect(() => {
    if (!query || query.trim().length < MIN_QUERY_LENGTH) {
      setSearchResults([]);
      return;
    }
    const t = setTimeout(async () => {
      setSearching(true);
      setError('');
      try {
        const list = await searchContacts(query.trim());
        setSearchResults(Array.isArray(list) ? list : []);
      } catch (e: unknown) {
        setSearchResults([]);
        setError(e instanceof Error ? e.message : 'Ошибка поиска');
      } finally {
        setSearching(false);
      }
    }, SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(t);
  }, [query]);

  const onRefresh = () => {
    setRefreshing(true);
    loadRequestsAndContacts();
  };

  const handleSendRequest = async (toUserId: string) => {
    setSendingId(toUserId);
    setError('');
    try {
      await sendContactRequest(toUserId);
      setRequestedIds((prev) => new Set(prev).add(toUserId));
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Не удалось отправить запрос';
      setError(msg);
    } finally {
      setSendingId(null);
    }
  };

  const handleRespond = async (requestId: string, action: 'accept' | 'decline') => {
    setRespondingId(requestId);
    setError('');
    try {
      await respondToContactRequest(requestId, action);
      setIncoming((prev) => prev.filter((r) => r.id !== requestId));
      if (action === 'accept') {
        const r = incoming.find((x) => x.id === requestId);
        if (r) setContactIds((prev) => new Set(prev).add(r.fromUser.id));
      }
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Ошибка');
    } finally {
      setRespondingId(null);
    }
  };

  if (loading) {
    return (
      <ScreenContainer>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.accent} />
        </View>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.accent} />
        }>
        {/* Входящие запросы */}
        {incoming.length > 0 ? (
          <View style={styles.section}>
            <Text style={[typography.title, { color: colors.textPrimary, marginBottom: spacing.sm }]}>
              Входящие запросы
            </Text>
            {incoming.map((r) => (
              <View
                key={r.id}
                style={[
                  styles.row,
                  { backgroundColor: colors.bgCard, borderColor: colors.studioCardBorder ?? colors.border },
                ]}>
                <View style={styles.rowMain}>
                  <Text style={[typography.body, { color: colors.textPrimary }]}>
                    {displayName(r.fromUser)}
                  </Text>
                  {subline(r.fromUser) ? (
                    <Text style={[typography.caption, { color: colors.textMuted, marginTop: 2 }]}>
                      {subline(r.fromUser)}
                    </Text>
                  ) : null}
                </View>
                <View style={styles.rowActions}>
                  <TouchableOpacity
                    onPress={() => handleRespond(r.id, 'decline')}
                    disabled={respondingId === r.id}
                    style={[styles.smallBtn, { borderColor: colors.border, marginRight: 8 }]}>
                    <Text style={[typography.caption, { color: colors.textSecondary }]}>Отклонить</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => handleRespond(r.id, 'accept')}
                    disabled={respondingId === r.id}
                    style={[styles.smallBtn, { backgroundColor: colors.accent, borderColor: colors.accent }]}>
                    {respondingId === r.id ? (
                      <ActivityIndicator size="small" color="#fff" />
                    ) : (
                      <Text style={[typography.caption, { color: '#fff', fontWeight: '600' }]}>Принять</Text>
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>
        ) : null}

        {/* Поиск и добавление в друзья */}
        <View style={styles.section}>
          <Text style={[typography.title, { color: colors.textPrimary, marginBottom: spacing.sm }]}>
            Добавить в друзья
          </Text>
          <Text style={[typography.caption, { color: colors.textMuted, marginBottom: spacing.sm }]}>
            Введите тег (@ник), имя или email (минимум 2 символа)
          </Text>
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Поиск..."
            placeholderTextColor={colors.textMuted}
            style={[
              styles.input,
              { color: colors.textPrimary, backgroundColor: colors.bgCard, borderColor: colors.border },
            ]}
            autoCapitalize="none"
            autoCorrect={false}
          />
          {error ? (
            <Text style={[typography.caption, { color: colors.accent, marginTop: spacing.xs }]}>{error}</Text>
          ) : null}
          {searching ? (
            <ActivityIndicator color={colors.accent} style={{ marginVertical: spacing.md }} />
          ) : searchResults.length > 0 ? (
            <View style={styles.results}>
              {searchResults.map((u) => {
                const isContact = contactIds.has(u.id);
                const isRequested = requestedIds.has(u.id);
                const isSending = sendingId === u.id;
                return (
                  <View
                    key={u.id}
                    style={[
                      styles.row,
                      { backgroundColor: colors.bgCard, borderColor: colors.studioCardBorder ?? colors.border },
                    ]}>
                    <View style={styles.rowMain}>
                      <Text style={[typography.body, { color: colors.textPrimary }]}>{displayName(u)}</Text>
                      {subline(u) ? (
                        <Text style={[typography.caption, { color: colors.textMuted, marginTop: 2 }]}>
                          {subline(u)}
                        </Text>
                      ) : null}
                    </View>
                    <View style={styles.rowActions}>
                      {isContact ? (
                        <TouchableOpacity
                          onPress={() => router.push(`/(tabs)/messages/${u.id}` as any)}
                          style={[styles.smallBtn, { backgroundColor: colors.accent, borderColor: colors.accent }]}>
                          <Text style={[typography.caption, { color: '#fff', fontWeight: '600' }]}>
                            Написать
                          </Text>
                        </TouchableOpacity>
                      ) : isRequested ? (
                        <Text style={[typography.caption, { color: colors.textMuted }]}>Запрос отправлен</Text>
                      ) : (
                        <TouchableOpacity
                          onPress={() => handleSendRequest(u.id)}
                          disabled={isSending}
                          style={[styles.smallBtn, { backgroundColor: colors.accent, borderColor: colors.accent }]}>
                          {isSending ? (
                            <ActivityIndicator size="small" color="#fff" />
                          ) : (
                            <Text style={[typography.caption, { color: '#fff', fontWeight: '600' }]}>
                              Добавить
                            </Text>
                          )}
                        </TouchableOpacity>
                      )}
                    </View>
                  </View>
                );
              })}
            </View>
          ) : query.trim().length >= MIN_QUERY_LENGTH && !searching ? (
            <Text style={[typography.caption, { color: colors.textMuted, marginTop: spacing.sm }]}>
              Никого не найдено
            </Text>
          ) : null}
        </View>

        {/* Исходящие запросы */}
        {outgoing.filter((r) => r.status === 'pending').length > 0 ? (
          <View style={styles.section}>
            <Text style={[typography.title, { color: colors.textPrimary, marginBottom: spacing.sm }]}>
              Исходящие запросы
            </Text>
            {outgoing
              .filter((r) => r.status === 'pending')
              .map((r) => (
                <View
                  key={r.id}
                  style={[
                    styles.row,
                    { backgroundColor: colors.bgCard, borderColor: colors.studioCardBorder ?? colors.border },
                  ]}>
                  <View style={styles.rowMain}>
                    <Text style={[typography.body, { color: colors.textPrimary }]}>
                      {r.toUser.name || r.toUser.id}
                    </Text>
                  </View>
                  <Text style={[typography.caption, { color: colors.textMuted }]}>Ожидание</Text>
                </View>
              ))}
          </View>
        ) : null}
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1 },
  scrollContent: { padding: mobileLayout.pagePadding, paddingBottom: spacing.xxl },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  section: { marginBottom: spacing.xl },
  input: {
    borderWidth: 1,
    borderRadius: mobileLayout.blockRadius,
    paddingHorizontal: spacing.md,
    paddingVertical: 12,
    fontSize: 16,
  },
  results: { marginTop: spacing.sm },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: mobileLayout.blockPadding,
    borderRadius: mobileLayout.blockRadius,
    borderWidth: 1,
    marginBottom: spacing.sm,
    minHeight: mobileLayout.minTouchTarget,
  },
  rowMain: { flex: 1, marginRight: spacing.sm },
  rowActions: { flexDirection: 'row', alignItems: 'center' },
  smallBtn: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 20,
    borderWidth: 1,
  },
});
