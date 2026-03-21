import { useEffect, useState } from 'react';
import { FlatList, RefreshControl, TouchableOpacity, Text, StyleSheet, Alert, Modal, Pressable, View } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { mobileLayout, spacing, typography, accentButtonShadow, darkColors, screenLayout } from '@/constants/Theme';
import { apiRequest } from '@/lib/api';
import type { ContentItem } from '@/types/api';
import { useThemeColors } from '@/components/useThemeColors';
import { ScreenContainer, LoadingScreen, EmptyState } from '@/components/screen';
import { ShortsViewerModal } from '@/components/platform/ShortsViewerModal';

export default function UniverseContentScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const colors = useThemeColors() ?? darkColors;
  const [items, setItems] = useState<ContentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [pinningId, setPinningId] = useState<string | null>(null);
  const [menuItem, setMenuItem] = useState<ContentItem | null>(null);
  const [activeModalIndex, setActiveModalIndex] = useState<number | null>(null);

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
      const list = Array.isArray(data) ? data : data.items ?? [];
      list.sort((a, b) => {
        const aPin = a.pinnedAt ? 1 : 0;
        const bPin = b.pinnedAt ? 1 : 0;
        if (bPin !== aPin) return bPin - aPin;
        return (b.createdAt ?? '').localeCompare(a.createdAt ?? '');
      });
      setItems(list);
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

  const handleLongPress = (item: ContentItem) => {
    if (!slug) return;
    setMenuItem(item);
  };

  const closeMenu = () => setMenuItem(null);

  const runEdit = () => {
    if (!slug || !menuItem) return;
    closeMenu();
    router.push(`/(tabs)/universes/${slug}/content/${menuItem.id}?edit=1` as any);
  };

  const runPinToggle = () => {
    if (!menuItem) return;
    const id = menuItem.id;
    const isPinned = !!menuItem.pinnedAt;
    closeMenu();
    handlePinToggle(id, isPinned);
  };

  const runForward = () => {
    if (!slug || !menuItem) return;
    const shareParams = `shareContent=${encodeURIComponent(menuItem.id)}&shareTitle=${encodeURIComponent(menuItem.title ?? '')}&shareSlug=${encodeURIComponent(slug)}`;
    closeMenu();
    router.push(`/(tabs)/messages?${shareParams}` as any);
  };

  const runDelete = () => {
    if (!menuItem) return;
    const id = menuItem.id;
    const title = menuItem.title;
    closeMenu();
    confirmDelete(id, title);
  };

  const handlePinToggle = async (contentId: string, currentlyPinned: boolean) => {
    if (pinningId) return;
    setPinningId(contentId);
    try {
      await apiRequest(`/api/content/${contentId}`, {
        method: 'PATCH',
        body: JSON.stringify({ pinned: !currentlyPinned }),
      });
      setItems((prev) =>
        prev.map((c) =>
          c.id === contentId ? { ...c, pinnedAt: currentlyPinned ? null : new Date().toISOString() } : c
        )
      );
    } catch {
      Alert.alert('Ошибка', 'Не удалось изменить закрепление');
    } finally {
      setPinningId(null);
    }
  };

  const confirmDelete = (contentId: string, title: string) => {
    Alert.alert(
      'Удалить пост?',
      title ? `«${title.slice(0, 50)}${title.length > 50 ? '…' : ''}»` : undefined,
      [
        { text: 'Отмена', style: 'cancel' },
        {
          text: 'Удалить',
          style: 'destructive',
          onPress: async () => {
            try {
              await apiRequest(`/api/content/${contentId}`, { method: 'DELETE' });
              setItems((prev) => prev.filter((c) => c.id !== contentId));
            } catch {
              Alert.alert('Ошибка', 'Не удалось удалить пост');
            }
          },
        },
      ]
    );
  };

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
        renderItem={({ item, index }) => (
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={() => setActiveModalIndex(index)}
            onLongPress={() => handleLongPress(item)}
            delayLongPress={400}
            style={[styles.bubble, screenLayout.contentBlock, { backgroundColor: colors.bgCard, borderColor: colors.studioCardBorder ?? colors.border, minHeight: mobileLayout.minTouchTarget }]}>
            <Text style={[typography.title, { color: colors.textPrimary }]} numberOfLines={1}>
              {item.pinnedAt ? '📌 ' : ''}{item.title ?? 'Без названия'}
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

      <Modal
        visible={!!menuItem}
        transparent
        animationType="fade"
        onRequestClose={closeMenu}
      >
        <Pressable style={styles.menuBackdrop} onPress={closeMenu}>
          <Pressable style={[styles.menuBox, { backgroundColor: colors.bgCard, borderColor: colors.border }]} onPress={(e) => e.stopPropagation()}>
            {menuItem ? (
              <>
                <Text style={[styles.menuTitle, { color: colors.textSecondary }]} numberOfLines={1}>
                  {menuItem.title ?? 'Без названия'}
                </Text>
                <TouchableOpacity style={styles.menuRow} onPress={runEdit} activeOpacity={0.7}>
                  <Text style={[styles.menuRowText, { color: colors.textPrimary }]}>Изменить</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.menuRow} onPress={runPinToggle} activeOpacity={0.7}>
                  <Text style={[styles.menuRowText, { color: colors.textPrimary }]}>
                    {menuItem.pinnedAt ? 'Открепить' : 'Закрепить'}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.menuRow} onPress={runForward} activeOpacity={0.7}>
                  <Text style={[styles.menuRowText, { color: colors.textPrimary }]}>Переслать</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.menuRow} onPress={runDelete} activeOpacity={0.7}>
                  <Text style={[styles.menuRowText, { color: colors.accent }]}>Удалить</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.menuRow, styles.menuRowCancel]} onPress={closeMenu} activeOpacity={0.7}>
                  <Text style={[styles.menuRowText, { color: colors.textSecondary }]}>Отмена</Text>
                </TouchableOpacity>
              </>
            ) : null}
          </Pressable>
        </Pressable>
      </Modal>

      <ShortsViewerModal 
        items={items} 
        initialIndex={activeModalIndex} 
        onClose={() => setActiveModalIndex(null)} 
        slug={slug ?? ''} 
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
  menuBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  menuBox: {
    width: '100%',
    maxWidth: 320,
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
  },
  menuTitle: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    fontSize: 13,
  },
  menuRow: {
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.06)',
  },
  menuRowText: { fontSize: 16 },
  menuRowCancel: { borderTopWidth: 2, borderTopColor: 'rgba(255,255,255,0.12)' },
});
