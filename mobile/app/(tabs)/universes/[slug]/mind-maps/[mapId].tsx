import { useEffect, useState } from 'react';
import { StyleSheet, ActivityIndicator } from 'react-native';
import { Text, View } from '@/components/Themed';
import { useLocalSearchParams } from 'expo-router';
import { apiRequest } from '@/lib/api';
import { useThemeColors } from '@/components/useThemeColors';
import { darkColors, mobileLayout, spacing, screenLayout } from '@/constants/Theme';

type MindMapDetail = {
  id: string;
  title: string;
  universeId?: string;
};

export default function MindMapDetailScreen() {
  const { slug, mapId } = useLocalSearchParams<{ slug: string; mapId: string }>();
  const colors = useThemeColors() ?? darkColors;
  const [map, setMap] = useState<MindMapDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!mapId || !slug) return;
    setLoading(true);
    apiRequest<MindMapDetail>(`/api/universes/${encodeURIComponent(slug)}/mind-maps/${mapId}`)
      .then(setMap)
      .catch(() => setMap(null))
      .finally(() => setLoading(false));
  }, [slug, mapId]);

  if (loading) {
    return (
      <View style={[screenLayout.loadingCentered, { backgroundColor: 'transparent' }]}>
        <ActivityIndicator size="large" color={colors.accent} />
      </View>
    );
  }

  if (!map) {
    return (
      <View style={[screenLayout.loadingCentered, { backgroundColor: 'transparent', padding: spacing.lg }]}>
        <Text style={[styles.placeholder, { color: colors.textSecondary }]}>
          Не удалось загрузить карту. Редактор доступен в веб-версии.
        </Text>
      </View>
    );
  }

  return (
    <View style={[screenLayout.screenContainer, { backgroundColor: 'transparent', padding: mobileLayout.pagePadding }]}>
      <View style={[styles.card, screenLayout.contentBlock, { backgroundColor: colors.bgCard, borderColor: colors.studioCardBorder ?? colors.border }]}>
        <Text style={[styles.title, { color: colors.textPrimary }]}>{map.title}</Text>
        <Text style={[styles.placeholder, { color: colors.textMuted, marginTop: spacing.md }]}>
          Просмотр и редактирование ментальной карты доступны в веб-приложении.
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {},
  title: { fontSize: 20, fontWeight: '600' },
  placeholder: { fontSize: 15 },
});
