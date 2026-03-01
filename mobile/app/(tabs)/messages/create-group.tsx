import { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  FlatList,
  ActivityIndicator,
} from 'react-native';
import { router } from 'expo-router';
import { fetchContacts, createGroupChat, type ContactUser } from '@/lib/messagesApi';
import { useThemeColors } from '@/components/useThemeColors';
import { darkColors, mobileLayout, spacing, typography } from '@/constants/Theme';
import { ScreenContainer } from '@/components/screen';
import { PlatformButtonPrimary } from '@/components/platform';

export default function CreateGroupScreen() {
  const colors = useThemeColors() ?? darkColors;
  const [name, setName] = useState('');
  const [contacts, setContacts] = useState<ContactUser[]>([]);
  const [loadingContacts, setLoadingContacts] = useState(true);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [pending, setPending] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchContacts()
      .then(setContacts)
      .catch(() => setContacts([]))
      .finally(() => setLoadingContacts(false));
  }, []);

  const toggle = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const onSubmit = async () => {
    if (!name.trim()) {
      setError('Введите название группы');
      return;
    }
    const ids = Array.from(selectedIds);
    if (ids.length === 0) {
      setError('Выберите хотя бы одного участника');
      return;
    }
    setPending(true);
    setError('');
    try {
      const group = await createGroupChat(name.trim(), ids);
      router.replace(`/(tabs)/messages/group/${group.id}` as any);
    } catch (e: any) {
      setError(e?.message ?? 'Ошибка создания');
      setPending(false);
    }
  };

  return (
    <ScreenContainer>
      <View style={styles.form}>
        <Text style={[typography.caption, { color: colors.textMuted, marginBottom: 4 }]}>Название группы</Text>
        <TextInput
          value={name}
          onChangeText={setName}
          placeholder="Название"
          placeholderTextColor={colors.textMuted}
          style={[styles.input, { color: colors.textPrimary, borderColor: colors.border }]}
          editable={!pending}
        />
        <Text style={[typography.title, { color: colors.textPrimary, marginTop: spacing.lg, marginBottom: spacing.sm }]}>
          Участники
        </Text>
        {loadingContacts ? (
          <ActivityIndicator color={colors.accent} style={{ marginVertical: spacing.lg }} />
        ) : (
          <FlatList
            data={contacts}
            keyExtractor={(item) => item.id}
            style={styles.list}
            renderItem={({ item }) => (
              <TouchableOpacity
                onPress={() => toggle(item.id)}
                style={[
                  styles.contactRow,
                  { backgroundColor: selectedIds.has(item.id) ? (colors.accent + '20') : colors.bgCard, borderColor: colors.studioCardBorder ?? colors.border },
                ]}>
                <Text style={[typography.body, { color: colors.textPrimary }]}>
                  {item.name || item.email || item.id}
                </Text>
                <Text style={[typography.caption, { color: colors.textMuted }]}>
                  {selectedIds.has(item.id) ? '✓' : ''}
                </Text>
              </TouchableOpacity>
            )}
            ListEmptyComponent={<Text style={[typography.body, { color: colors.textMuted }]}>Нет контактов</Text>}
          />
        )}
        {error ? <Text style={[typography.body, { color: colors.accent, marginTop: 8 }]}>{error}</Text> : null}
        <View style={styles.submit}>
          <PlatformButtonPrimary onPress={onSubmit} disabled={pending}>
            {pending ? 'Создание…' : 'Создать группу'}
          </PlatformButtonPrimary>
        </View>
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  form: { flex: 1, padding: mobileLayout.pagePadding },
  input: { borderWidth: 1, borderRadius: mobileLayout.blockRadius, paddingHorizontal: spacing.md, paddingVertical: 12, fontSize: 16 },
  list: { maxHeight: 280, marginBottom: spacing.md },
  contactRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: mobileLayout.blockPadding,
    borderRadius: mobileLayout.blockRadius,
    borderWidth: 1,
    marginBottom: spacing.sm,
    minHeight: mobileLayout.minTouchTarget,
  },
  submit: { marginTop: spacing.md },
});
