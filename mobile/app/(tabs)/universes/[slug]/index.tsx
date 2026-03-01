import { useEffect, useState } from 'react';
import { StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Text, View } from '@/components/Themed';
import { router, useLocalSearchParams } from 'expo-router';
import { fetchUniverseBySlug } from '@/lib/universesApi';
import type { Universe } from '@/types/api';
import { useThemeColors } from '@/components/useThemeColors';
import { darkColors, spacing, screenLayout, typography } from '@/constants/Theme';
import { TrackUniverseButton } from '@/components/TrackUniverseButton';

export default function UniverseDetailScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const colors = useThemeColors() ?? darkColors;
  const [universe, setUniverse] = useState<Universe | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!slug) return;
    fetchUniverseBySlug(slug)
      .then(setUniverse)
      .catch(() => setUniverse(null))
      .finally(() => setLoading(false));
  }, [slug]);

  if (loading) {
    return (
      <View style={[screenLayout.loadingCentered, { backgroundColor: 'transparent' }]}>
        <ActivityIndicator size="large" color={colors.accent} />
      </View>
    );
  }

  if (!universe) {
    return (
      <View style={[screenLayout.loadingCentered, { backgroundColor: 'transparent' }]}>
        <Text style={[typography.body, { color: colors.textSecondary }]}>Не удалось загрузить</Text>
      </View>
    );
  }

  return (
    <ScrollView style={[screenLayout.screenContainer, { backgroundColor: 'transparent' }]} contentContainerStyle={screenLayout.listContent}>
      <View style={[styles.card, screenLayout.contentBlock, { backgroundColor: colors.bgCard, borderColor: colors.studioCardBorder ?? colors.border }]}>
        <Text style={[typography.titleLarge, { color: colors.textPrimary }]}>{universe.name}</Text>
        {universe.description ? (
          <Text style={[typography.body, { color: colors.textSecondary, marginTop: spacing.sm }]}>{universe.description}</Text>
        ) : null}
        <View style={{ marginTop: spacing.md }}>
          <TrackUniverseButton universeSlug={slug ?? ''} />
        </View>
      </View>
      <TouchableOpacity
        style={[screenLayout.cardCompact, { backgroundColor: colors.bgCard, borderColor: colors.studioCardBorder ?? colors.border }]}
        onPress={() => router.push(`/(tabs)/universes/${slug}/content`)}>
        <Text style={[typography.body, { color: colors.accent, fontWeight: '500' }]}>Контент</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[screenLayout.cardCompact, { backgroundColor: colors.bgCard, borderColor: colors.studioCardBorder ?? colors.border }]}
        onPress={() => router.push(`/(tabs)/universes/${slug}/rooms`)}>
        <Text style={[typography.body, { color: colors.accent, fontWeight: '500' }]}>Комнаты просмотра</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[screenLayout.cardCompact, { backgroundColor: colors.bgCard, borderColor: colors.studioCardBorder ?? colors.border }]}
        onPress={() => router.push(`/(tabs)/universes/${slug}/mind-maps`)}>
        <Text style={[typography.body, { color: colors.accent, fontWeight: '500' }]}>Ментальные карты</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  card: { marginBottom: spacing.md },
});
