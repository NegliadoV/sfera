import { useEffect, useState } from 'react';
import { FlatList, RefreshControl, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { mobileLayout, spacing, typography, accentButtonShadow, darkColors, screenLayout } from '@/constants/Theme';
import { apiRequest } from '@/lib/api';
import type { ContentItem } from '@/types/api';
import { useThemeColors } from '@/components/useThemeColors';
import { ScreenContainer, LoadingScreen, EmptyState } from '@/components/screen';

export default function UniverseContentScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const colors = useThemeColors() ?? darkColors;
  const [items, setItems] = useState<ContentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = async () => {
    if (!slug) {
      setLoading(false);
      setRefreshing(false);
      return;
    }
    try {
      const universe = await apiRequest<{ id: string }>(`/api/universes/${encodeURIComponent(slug)}`);
      const universeId = (universe as { id?: string }).id;
      if (!universeId) {
        setItems([]);
        return;
      }
      const data = await apiRequest<ContentItem[] | { items?: ContentItem[] }>(
        `/api/content?universeId=${encodeURIComponent(universeId)}`
      );
      setItems(Array.isArray(data) ? data : data.items ?? []);
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    load();
  }, [slug]);

  if (loading) return <LoadingScreen />;

  return (
    <ScreenContainer>
      <FlatList
        data={items}
        keyExtractor={(item) => item.id}
        contentContainerStyle={screenLayout.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor={colors.accent} />
        }
        ListHeaderComponent={
          <TouchableOpacity
            onPress={() => slug && router.push(`/(tabs)/universes/${slug}/content/add` as any)}
            style={[styles.addBtn, { backgroundColor: colors.accent }, accentButtonShadow(colors.accent)]}>
            <Text style={styles.addBtnText}>Добавить материал</Text>
          </TouchableOpacity>
        }
        renderItem={({ item }) => (
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={() => router.push(`/(tabs)/universes/${slug}/content/${item.id}`)}
            style={[styles.bubble, screenLayout.contentBlock, { backgroundColor: colors.bgCard, borderColor: colors.studioCardBorder ?? colors.border, minHeight: mobileLayout.minTouchTarget }]}>
            <Text style={[typography.title, { color: colors.textPrimary }]} numberOfLines={1}>
              {item.title ?? 'Без названия'}
            </Text>
            {item.body ? (
              <Text style={[typography.bodySmall, { color: colors.textSecondary, marginTop: spacing.xs }]} numberOfLines={2}>
                {item.body}
              </Text>
            ) : null}
          </TouchableOpacity>
        )}
        ListEmptyComponent={<EmptyState message="Нет контента" />}
      />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  addBtn: { paddingVertical: 12, paddingHorizontal: 20, borderRadius: 10, marginBottom: spacing.md, alignSelf: 'flex-start', minHeight: mobileLayout.minTouchTarget, justifyContent: 'center' },
  addBtnText: { color: '#fff', fontWeight: '600', fontSize: 15 },
  bubble: {
    maxWidth: '85%',
    alignSelf: 'flex-start',
    marginBottom: spacing.xs,
    justifyContent: 'center',
  },
});
