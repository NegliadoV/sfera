import { useEffect, useState } from 'react';
import { StyleSheet, ActivityIndicator, TouchableOpacity } from 'react-native';
import { Text, View } from '@/components/Themed';
import { useLocalSearchParams } from 'expo-router';
import { apiRequest } from '@/lib/api';
import { joinRoom } from '@/lib/roomsApi';
import { useThemeColors } from '@/components/useThemeColors';
import { accentButtonShadow, darkColors, mobileLayout, spacing, screenLayout } from '@/constants/Theme';

type RoomDetail = {
  id: string;
  title: string;
  universeId?: string;
};

export default function RoomDetailScreen() {
  const { slug, roomId } = useLocalSearchParams<{ slug: string; roomId: string }>();
  const colors = useThemeColors() ?? darkColors;
  const [room, setRoom] = useState<RoomDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [joinPending, setJoinPending] = useState(false);

  useEffect(() => {
    if (!roomId || !slug) return;
    setLoading(true);
    apiRequest<RoomDetail>(`/api/universes/${encodeURIComponent(slug)}/rooms/${roomId}`)
      .then(setRoom)
      .catch(() => setRoom(null))
      .finally(() => setLoading(false));
  }, [slug, roomId]);

  const onJoin = async () => {
    if (!slug || !roomId) return;
    setJoinPending(true);
    try {
      await joinRoom(slug, roomId);
    } catch {}
    setJoinPending(false);
  };

  if (loading) {
    return (
      <View style={[screenLayout.loadingCentered, { backgroundColor: 'transparent' }]}>
        <ActivityIndicator size="large" color={colors.accent} />
      </View>
    );
  }

  if (!room) {
    return (
      <View style={[screenLayout.loadingCentered, { backgroundColor: 'transparent', padding: spacing.lg }]}>
        <Text style={[styles.placeholder, { color: colors.textSecondary }]}>
          Не удалось загрузить комнату. Полноценный просмотр с синхронизацией доступен в веб-версии.
        </Text>
      </View>
    );
  }

  return (
    <View style={[screenLayout.screenContainer, { backgroundColor: 'transparent', padding: mobileLayout.pagePadding }]}>
      <View style={[styles.card, screenLayout.contentBlock, { backgroundColor: colors.bgCard, borderColor: colors.studioCardBorder ?? colors.border }]}>
        <Text style={[styles.title, { color: colors.textPrimary }]}>{room.title}</Text>
        <TouchableOpacity
          onPress={onJoin}
          disabled={joinPending}
          style={[styles.joinBtn, { backgroundColor: colors.accent }, accentButtonShadow(colors.accent)]}>
          <Text style={styles.joinBtnText}>{joinPending ? 'Вход…' : 'Войти в комнату'}</Text>
        </TouchableOpacity>
        <Text style={[styles.placeholder, { color: colors.textMuted, marginTop: spacing.md }]}>
          Комната просмотра. Для синхронного просмотра с видео откройте веб-версию.
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { marginBottom: spacing.md },
  title: { fontSize: 20, fontWeight: '600' },
  placeholder: { fontSize: 15 },
  joinBtn: { marginTop: spacing.md, paddingVertical: 12, paddingHorizontal: 20, borderRadius: 10, alignSelf: 'flex-start', minHeight: mobileLayout.minTouchTarget, justifyContent: 'center' },
  joinBtnText: { color: '#fff', fontWeight: '600', fontSize: 15 },
});
