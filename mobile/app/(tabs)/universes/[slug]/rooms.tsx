import { useEffect, useState } from 'react';
import { FlatList, RefreshControl, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { apiRequest } from '@/lib/api';
import type { RoomItem } from '@/types/api';
import { useThemeColors } from '@/components/useThemeColors';
import { accentButtonShadow, darkColors, mobileLayout, screenLayout, spacing } from '@/constants/Theme';
import { ScreenContainer, LoadingScreen, EmptyState } from '@/components/screen';
import { ListCard } from '@/components/platform';

export default function UniverseRoomsScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const colors = useThemeColors() ?? darkColors;
  const [rooms, setRooms] = useState<RoomItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = async () => {
    try {
      const data = await apiRequest<RoomItem[] | { rooms?: RoomItem[] }>(
        `/api/universes/${encodeURIComponent(slug || '')}/rooms`
      );
      setRooms(Array.isArray(data) ? data : data.rooms ?? []);
    } catch {
      setRooms([]);
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
        data={rooms}
        keyExtractor={(item) => item.id}
        contentContainerStyle={screenLayout.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor={colors.accent} />
        }
        ListHeaderComponent={
          <TouchableOpacity
            onPress={() => slug && router.push(`/(tabs)/universes/${slug}/rooms/add` as any)}
            style={[styles.addBtn, { backgroundColor: colors.accent }, accentButtonShadow(colors.accent)]}>
            <Text style={styles.addBtnText}>Создать комнату</Text>
          </TouchableOpacity>
        }
        renderItem={({ item }) => (
          <ListCard
            title={item.title}
            onPress={() => router.push(`/(tabs)/universes/${slug}/rooms/${item.id}`)}
          />
        )}
        ListEmptyComponent={<EmptyState message="Нет комнат" />}
      />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  addBtn: { paddingVertical: 12, paddingHorizontal: 20, borderRadius: 10, marginBottom: spacing.md, alignSelf: 'flex-start', minHeight: mobileLayout.minTouchTarget, justifyContent: 'center' },
  addBtnText: { color: '#fff', fontWeight: '600', fontSize: 15 },
});
