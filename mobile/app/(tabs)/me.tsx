import { useEffect, useState } from 'react';
import { ScrollView, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { fetchMyContent } from '@/lib/meApi';
import { fetchMyUniverses } from '@/lib/universesApi';
import { useThemeColors } from '@/components/useThemeColors';
import { darkColors, mobileLayout, spacing, screenLayout, typography } from '@/constants/Theme';
import { ScreenContainer, LoadingScreen, EmptyState } from '@/components/screen';
import { ListCard } from '@/components/platform';

type UserContentRow = {
  id: string;
  title?: string | null;
  sourceId?: string | null;
  publishedAt?: string | null;
  [key: string]: unknown;
};

type MyUniverse = { id: string; slug: string; name: string };

export default function MeScreen() {
  const colors = useThemeColors() ?? darkColors;
  const { user } = useAuth();
  const [items, setItems] = useState<UserContentRow[]>([]);
  const [myUniverses, setMyUniverses] = useState<MyUniverse[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = async () => {
    try {
      const [contentData, universesData] = await Promise.all([
        fetchMyContent(),
        fetchMyUniverses(),
      ]);
      setItems(Array.isArray(contentData) ? (contentData as UserContentRow[]) : []);
      setMyUniverses(Array.isArray(universesData) ? universesData : []);
    } catch {
      setItems([]);
      setMyUniverses([]);
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
    <ScreenContainer style={styles.container}>
      <ScrollView
        contentContainerStyle={[screenLayout.listContent, styles.scrollContent]}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor={colors.accent} />
        }>
        <View style={[styles.profile, screenLayout.contentBlock, { backgroundColor: colors.bgCard, borderColor: colors.studioCardBorder ?? colors.border }]}>
          <Text style={[styles.name, { color: colors.textPrimary }]}>
            {user?.name || user?.email || 'Профиль'}
          </Text>
          {user?.email ? (
            <Text style={[styles.email, { color: colors.textSecondary }]}>{user.email}</Text>
          ) : null}
        </View>
        <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Мои сферы</Text>
        <View style={styles.list}>
          {myUniverses.length === 0 ? (
            <EmptyState message="Нет сфер" />
          ) : (
            myUniverses.map((u) => (
              <ListCard
                key={u.id}
                title={u.name}
                onPress={() => u.slug && router.push(`/(tabs)/universes/${encodeURIComponent(u.slug)}` as any)}
              />
            ))
          )}
        </View>
        <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Мой контент</Text>
        <View style={styles.list}>
          {items.length === 0 ? (
            <EmptyState message="Пока ничего" />
          ) : (
            items.slice(0, 20).map((item) => (
              <ListCard key={item.id} title={item.title ?? 'Без названия'} />
            ))
          )}
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { paddingBottom: spacing.xxl },
  profile: { marginBottom: spacing.md },
  name: { ...typography.titleLarge },
  email: { ...typography.bodySmall, marginTop: spacing.xs },
  sectionTitle: { ...typography.title, marginHorizontal: 0, marginTop: spacing.lg, marginBottom: spacing.sm },
  list: { paddingHorizontal: 0 },
});
