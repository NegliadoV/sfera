import { useEffect, useState, useCallback } from 'react';
import {
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Linking,
  TouchableOpacity,
  TextInput,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Image,
} from 'react-native';
import { Text, View } from '@/components/Themed';
import { useLocalSearchParams, router } from 'expo-router';
import { apiRequest } from '@/lib/api';
import { useThemeColors } from '@/components/useThemeColors';
import { darkColors, mobileLayout, radius, spacing, screenLayout, typography, accentButtonShadow } from '@/constants/Theme';
import { PostVideoPlayer } from '@/components/PostVideoPlayer';
import { getYouTubeVideoId } from '@/lib/youtube';
import { isDirectVideoUrl } from '@/lib/videoUrl';
import { getReactions, setReaction, REACTION_TYPES, type ReactionType } from '@/lib/reactionsApi';
import { getComments, postComment, type CommentItem } from '@/lib/contentApi';

type ContentDetail = {
  id: string;
  title: string;
  body?: string | null;
  url?: string | null;
  imageUrl?: string | null;
  type?: string | null;
  authorName?: string | null;
  createdAt?: string;
};

const REACTION_LABELS: Record<ReactionType, string> = {
  confirm_source: 'Подтверждаю источник',
  please_clarify: 'Нужно уточнить',
  important_counterargument: 'Важный контраргумент',
};

export default function ContentDetailScreen() {
  const { slug, contentId } = useLocalSearchParams<{ slug: string; contentId: string }>();
  const colors = useThemeColors() ?? darkColors;
  const [item, setItem] = useState<ContentDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reactions, setReactions] = useState<{ counts: Record<string, number>; myReaction: string | null } | null>(null);
  const [comments, setComments] = useState<CommentItem[]>([]);
  const [commentBody, setCommentBody] = useState('');
  const [commentPending, setCommentPending] = useState(false);
  const [deletePending, setDeletePending] = useState(false);

  const loadContent = useCallback(() => {
    if (!contentId) return;
    setLoading(true);
    setError(null);
    apiRequest<ContentDetail>(`/api/content/${contentId}`)
      .then(setItem)
      .catch((e) => {
        setError(e instanceof Error ? e.message : 'Не удалось загрузить');
        setItem(null);
      })
      .finally(() => setLoading(false));
  }, [contentId]);

  useEffect(() => {
    loadContent();
  }, [loadContent]);

  useEffect(() => {
    if (!contentId) return;
    getReactions('content', contentId).then(setReactions).catch(() => setReactions(null));
  }, [contentId]);

  useEffect(() => {
    if (!contentId) return;
    getComments(contentId).then(setComments).catch(() => setComments([]));
  }, [contentId]);

  const refreshReactions = () => {
    if (contentId) getReactions('content', contentId).then(setReactions).catch(() => {});
  };

  const onReaction = async (reactionType: ReactionType) => {
    if (!contentId) return;
    try {
      await setReaction('content', contentId, reactionType);
      refreshReactions();
    } catch {}
  };

  const onPostComment = async () => {
    if (!contentId || !commentBody.trim()) return;
    setCommentPending(true);
    try {
      const newComment = await postComment(contentId, { body: commentBody.trim() });
      setComments((prev) => [...prev, newComment]);
      setCommentBody('');
    } catch {}
    setCommentPending(false);
  };

  const onDelete = () => {
    if (!contentId) return;
    Alert.alert('Удалить материал?', undefined, [
      { text: 'Отмена', style: 'cancel' },
      {
        text: 'Удалить',
        style: 'destructive',
        onPress: async () => {
          setDeletePending(true);
          try {
            await apiRequest(`/api/content/${contentId}`, { method: 'DELETE' });
            router.back();
          } catch {}
          setDeletePending(false);
        },
      },
    ]);
  };

  if (loading) {
    return (
      <View style={[screenLayout.loadingCentered, { backgroundColor: colors.bgPrimary }]}>
        <ActivityIndicator size="large" color={colors.accent} />
      </View>
    );
  }

  if (error || !item) {
    return (
      <View style={[screenLayout.loadingCentered, { backgroundColor: colors.bgPrimary, padding: spacing.lg }]}>
        <Text style={[typography.body, { color: colors.textSecondary, marginBottom: spacing.md }]}>{error ?? 'Материал не найден'}</Text>
        <TouchableOpacity style={[styles.backBtn, { backgroundColor: colors.border }]} onPress={() => router.back()}>
          <Text style={[typography.body, { color: colors.textPrimary }]}>Назад</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={[styles.container, { backgroundColor: colors.bgPrimary }]}>
      <ScrollView
        style={screenLayout.screenContainer}
        contentContainerStyle={[screenLayout.listContent, { paddingBottom: spacing.sm }]}
        keyboardShouldPersistTaps="handled">
        {/* Пост в виде сообщения (пузырь) — весь контент: фото, видео, ссылка, текст */}
        <View style={[styles.bubble, screenLayout.contentBlock, { backgroundColor: colors.bgCard, borderColor: colors.studioCardBorder ?? colors.border }]}>
          {item.authorName ? (
            <Text style={[typography.caption, { color: colors.textMuted, marginBottom: 2 }]}>{item.authorName}</Text>
          ) : null}
          <Text style={[typography.titleLarge, { color: colors.textPrimary }]}>{item.title}</Text>

          {/* Фото (imageUrl) */}
          {item.imageUrl ? (
            <Image
              source={{ uri: item.imageUrl }}
              style={styles.mediaImage}
              resizeMode="cover"
            />
          ) : null}

          {/* Видео (YouTube или прямое видео) или ссылка */}
          {item.url ? (
            <>
              <PostVideoPlayer url={item.url} title={item.title} />
              {!getYouTubeVideoId(item.url) && !isDirectVideoUrl(item.url) ? (
                <TouchableOpacity
                  style={[styles.link, { borderColor: colors.border, marginTop: spacing.sm }]}
                  onPress={() => Linking.openURL(item.url!)}>
                  <Text style={[typography.bodySmall, { color: colors.accent }]} numberOfLines={1}>
                    {item.url}
                  </Text>
                </TouchableOpacity>
              ) : null}
            </>
          ) : null}

          {/* Текст поста */}
          {item.body ? (
            <Text style={[typography.body, { color: colors.textSecondary, marginTop: spacing.sm, lineHeight: 24 }]}>{item.body}</Text>
          ) : null}
        </View>

        {reactions && (
          <View style={[styles.section, styles.reactionsBlock, screenLayout.contentBlock, { backgroundColor: darkColors.studioPanelBg, borderColor: darkColors.studioCardBorder }]}>
            <Text style={[typography.caption, { color: colors.textMuted, marginBottom: spacing.xs }]}>Реакции</Text>
            <View style={[styles.reactionsRow, { backgroundColor: 'transparent' }]}>
              {REACTION_TYPES.map((rt) => (
                <TouchableOpacity
                  key={rt}
                  onPress={() => onReaction(rt)}
                  style={[
                    styles.reactionBtn,
                    { borderColor: reactions.myReaction === rt ? colors.accent : darkColors.studioCardBorder, backgroundColor: reactions.myReaction === rt ? colors.accent : darkColors.studioPanelBg },
                  ]}>
                  <Text style={[typography.caption, { color: reactions.myReaction === rt ? '#fff' : colors.textPrimary }]}>
                    {REACTION_LABELS[rt]} {reactions.counts[rt] ? `(${reactions.counts[rt]})` : ''}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* Комментарии как сообщения в чате */}
        {comments.length > 0 ? (
          <View style={[styles.section, { backgroundColor: colors.bgPrimary }]}>
            <Text style={[typography.caption, { color: colors.textMuted, marginBottom: spacing.xs }]}>Комментарии</Text>
            {comments.map((c) => (
              <View key={c.id} style={[styles.commentBubble, screenLayout.contentBlock, { backgroundColor: colors.bgCard, borderColor: colors.studioCardBorder ?? colors.border }]}>
                <Text style={[typography.caption, { color: colors.textMuted, marginBottom: 2 }]}>{c.authorName ?? 'Участник'}</Text>
                <Text style={[typography.body, { color: colors.textPrimary }]}>{c.body}</Text>
              </View>
            ))}
          </View>
        ) : null}

        <TouchableOpacity
          onPress={onDelete}
          disabled={deletePending}
          style={[styles.deleteBtn, { borderColor: colors.studioCardBorder ?? colors.border, backgroundColor: colors.studioPanelBg ?? colors.bgCard }]}>
          <Text style={[typography.body, { color: colors.accent }]}>{deletePending ? 'Удаление…' : 'Удалить материал'}</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Поле ввода как в чате */}
      <View style={[styles.footer, { backgroundColor: colors.bgCard, borderColor: colors.studioPanelBorder ?? colors.border }]}>
        <TextInput
          value={commentBody}
          onChangeText={setCommentBody}
          placeholder="Написать комментарий..."
          placeholderTextColor={colors.textMuted}
          style={[styles.commentInput, { backgroundColor: colors.bgSecondary, color: colors.textPrimary, borderColor: colors.studioCardBorder ?? colors.border }]}
          multiline
          editable={!commentPending}
          maxLength={4096}
        />
        <TouchableOpacity
          onPress={onPostComment}
          disabled={commentPending || !commentBody.trim()}
          style={[styles.sendBtn, { backgroundColor: colors.accent }, accentButtonShadow(colors.accent)]}>
          <Text style={styles.sendBtnText}>{commentPending ? '…' : 'Отпр.'}</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  bubble: {
    maxWidth: '85%',
    alignSelf: 'flex-start',
    marginBottom: spacing.xs,
    overflow: 'hidden',
  },
  mediaImage: {
    width: '100%',
    aspectRatio: 16 / 9,
    maxHeight: 280,
    borderRadius: mobileLayout.blockRadius,
    marginTop: spacing.sm,
  },
  link: { padding: spacing.sm, borderRadius: mobileLayout.blockRadius, borderWidth: 1 },
  backBtn: { paddingHorizontal: spacing.lg, paddingVertical: spacing.sm, borderRadius: mobileLayout.blockRadius },
  section: { marginTop: spacing.lg },
  reactionsBlock: {},
  reactionsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  reactionBtn: { paddingVertical: 10, paddingHorizontal: 14, borderRadius: mobileLayout.blockRadius, borderWidth: 1 },
  commentBubble: {
    maxWidth: '85%',
    alignSelf: 'flex-start',
    marginBottom: spacing.xs,
  },
  footer: { flexDirection: 'row', padding: spacing.sm, borderTopWidth: 1, alignItems: 'flex-end', gap: spacing.sm },
  commentInput: { flex: 1, minHeight: 40, maxHeight: 100, borderRadius: radius.sm, borderWidth: 1, paddingHorizontal: spacing.md, paddingVertical: spacing.xs, fontSize: 16 },
  sendBtn: { paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderRadius: radius.sm, justifyContent: 'center' },
  sendBtnText: { color: '#fff', fontWeight: '600', fontSize: 14 },
  deleteBtn: { marginTop: spacing.xl, paddingVertical: 12, paddingHorizontal: 16, borderRadius: mobileLayout.blockRadius, borderWidth: 1, alignSelf: 'flex-start' },
});
