import React, { useRef, useEffect } from 'react';
import { Modal, View, Text, TouchableOpacity, FlatList, StyleSheet, useWindowDimensions, ScrollView, Image } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useThemeColors } from '@/components/useThemeColors';
import { typography, spacing } from '@/constants/Theme';
import type { ContentItem } from '@/types/api';
import { BlurView } from 'expo-blur';

type Props = {
  items: ContentItem[];
  initialIndex: number | null;
  onClose: () => void;
  slug: string;
};

export function ShortsViewerModal({ items, initialIndex, onClose, slug }: Props) {
  const colors = useThemeColors();
  const { height, width } = useWindowDimensions();
  const flatListRef = useRef<FlatList>(null);

  useEffect(() => {
    if (initialIndex !== null && flatListRef.current) {
      setTimeout(() => {
        flatListRef.current?.scrollToIndex({ index: initialIndex, animated: false });
      }, 50);
    }
  }, [initialIndex]);

  if (initialIndex === null) return null;

  return (
    <Modal visible={initialIndex !== null} animationType="slide" transparent>
      <View style={styles.container}>
        <FlatList
          ref={flatListRef}
          data={items}
          keyExtractor={(it) => it.id}
          pagingEnabled
          showsVerticalScrollIndicator={false}
          initialScrollIndex={initialIndex}
          getItemLayout={(_data, index) => ({ length: height, offset: height * index, index })}
          renderItem={({ item }) => {
            const displayDate = item.publishedAt ? new Date(item.publishedAt) : new Date(item.createdAt ?? '');
            const displayAuthor = item.externalAuthor || item.authorFullName || 'Участник';

            return (
              <View style={[styles.slide, { height, width }]}>
                {/* Background Tint */}
                <View style={[StyleSheet.absoluteFillObject, { backgroundColor: colors.bgPrimary, opacity: 0.95 }]} />

                {/* Content */}
                <ScrollView 
                  contentContainerStyle={styles.scrollContent} 
                  showsVerticalScrollIndicator={false}
                  nestedScrollEnabled
                >
                  <View style={styles.authorRow}>
                    <Text style={[styles.authorName, { color: colors.textPrimary }]}>{displayAuthor}</Text>
                    <Text style={[styles.dateText, { color: colors.textMuted }]}>
                      {displayDate.toLocaleDateString('ru')}
                    </Text>
                  </View>

                  <Text style={[styles.title, { color: colors.textPrimary }]}>{item.title}</Text>

                  {item.imageUrl ? (
                     <Image source={{ uri: item.imageUrl }} style={styles.image} resizeMode="contain" />
                  ) : null}

                  {item.body ? (
                    <Text style={[styles.bodyText, { color: colors.textSecondary }]}>
                      {item.body.replace(/<[^>]+>/g, '').trim()}
                    </Text>
                  ) : null}

                  {item.url ? (
                    <TouchableOpacity onPress={() => {/* Linking not strictly required here */}} style={[styles.urlBox, { backgroundColor: colors.bgCard, borderColor: colors.border }]}>
                       <Text style={[styles.urlText, { color: colors.accent }]} numberOfLines={1}>{item.url}</Text>
                    </TouchableOpacity>
                  ) : null}
                  
                  {/* Space for bottom overlay */}
                  <View style={{ height: 120 }} />
                </ScrollView>

                {/* Bottom Overlay Button */}
                <View style={styles.bottomOverlay}>
                   <TouchableOpacity 
                      activeOpacity={0.85} 
                      onPress={() => {
                        onClose();
                        router.push(`/(tabs)/universes/${slug}/content/${item.id}`);
                      }}
                      style={[styles.discussBtn, { backgroundColor: colors.accent, shadowColor: colors.accent }]}
                   >
                      <Ionicons name="chatbubble" size={20} color="#fff" style={{ marginRight: 8 }} />
                      <Text style={styles.discussBtnText}>Перейти к обсуждению</Text>
                   </TouchableOpacity>
                </View>
              </View>
            );
          }}
        />

        {/* Global Close Button */}
        <TouchableOpacity style={styles.closeBtn} onPress={onClose} activeOpacity={0.7}>
           <BlurView intensity={30} style={styles.closeBlur}>
              <Ionicons name="close" size={24} color="#fff" />
           </BlurView>
        </TouchableOpacity>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  slide: {
    flex: 1,
    justifyContent: 'flex-start',
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 100,
    paddingBottom: 40,
  },
  authorRow: {
    marginBottom: spacing.sm,
  },
  authorName: {
    fontWeight: '600',
    fontSize: 15,
  },
  dateText: {
    fontSize: 13,
  },
  title: {
    ...typography.titleLarge,
    fontSize: 28,
    fontWeight: '800',
    marginBottom: spacing.lg,
    lineHeight: 34,
  },
  image: {
    width: '100%',
    height: 250,
    borderRadius: 16,
    marginBottom: spacing.lg,
  },
  bodyText: {
    ...typography.body,
    fontSize: 17,
    lineHeight: 24,
    marginBottom: spacing.lg,
  },
  urlBox: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: spacing.lg,
  },
  urlText: {
    fontSize: 15,
    fontWeight: '500',
  },
  bottomOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 24,
    paddingBottom: 40,
    paddingTop: 40,
  },
  discussBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 20,
    elevation: 10,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
  },
  discussBtnText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  closeBtn: {
    position: 'absolute',
    top: 50,
    right: 20,
    zIndex: 10,
    borderRadius: 25,
    overflow: 'hidden',
  },
  closeBlur: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.4)',
  }
});
