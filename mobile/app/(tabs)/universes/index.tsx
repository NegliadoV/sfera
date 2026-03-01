import { useEffect, useState } from 'react';
import { FlatList, RefreshControl, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { fetchUniverses } from '@/lib/universesApi';
import type { Universe } from '@/types/api';
import { useThemeColors } from '@/components/useThemeColors';
import { accentButtonShadow, darkColors, mobileLayout, screenLayout, spacing } from '@/constants/Theme';
import { ScreenContainer, LoadingScreen, EmptyState } from '@/components/screen';
import { ListCard } from '@/components/platform';

export default function UniversesListScreen() {
  const colors = useThemeColors() ?? darkColors;
  const [list, setList] = useState<Universe[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = async () => {
    try {
      const data = await fetchUniverses();
      setList(Array.isArray(data) ? data : []);
    } catch {
      setList([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  if (loading) return <LoadingScreen />;

  return (
    <ScreenContainer>
      <FlatList
        data={list}
        keyExtractor={(item) => item?.id ?? item?.slug ?? ''}
        contentContainerStyle={screenLayout.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor={colors.accent} />
        }
        ListHeaderComponent={
          <TouchableOpacity
            onPress={() => router.push('/(tabs)/universes/create')}
            style={[styles.createBtn, { backgroundColor: colors.accent }, accentButtonShadow(colors.accent)]}>
            <Text style={styles.createBtnText}>Создать сферу</Text>
          </TouchableOpacity>
        }
        renderItem={({ item }) => (
          <ListCard
            title={item.name ?? ''}
            subtitle={item.description ?? undefined}
            onPress={() => item?.slug && router.push(`/(tabs)/universes/${encodeURIComponent(item.slug)}`)}
          />
        )}
        ListEmptyComponent={<EmptyState message="Нет вселенных" />}
      />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  createBtn: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 10,
    marginBottom: spacing.md,
    alignSelf: 'flex-start',
    minHeight: mobileLayout.minTouchTarget,
    justifyContent: 'center',
  },
  createBtnText: { color: '#fff', fontWeight: '600', fontSize: 15 },
});
