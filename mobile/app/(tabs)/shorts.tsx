import React, { useEffect, useState, useRef, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, Dimensions, TouchableOpacity, ViewToken, ActivityIndicator } from 'react-native';
import { Video, ResizeMode, AVPlaybackStatus } from 'expo-av';
import { useFocusEffect } from 'expo-router';
import { Heart, MessageCircle, Share2, Gem, Play } from 'lucide-react-native';
import { useThemeColors } from '@/components/useThemeColors';
import { darkColors } from '@/constants/Theme';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';

const { width, height } = Dimensions.get('window');

type Short = {
  id: string;
  title: string;
  description: string;
  videoUrl: string;
  viewsCount: number;
  likesCount: number;
  author: {
    id: string;
    name: string | null;
    image: string | null;
    userTag: string | null;
  };
};

const TAB_BAR_HEIGHT = 80; // approximate safe area avoiding the pill tabbar

const ShortVideo = React.memo(({ short, isActive, onDonate }: { short: Short; isActive: boolean; onDonate: () => void }) => {
  const videoRef = useRef<Video>(null);
  const [status, setStatus] = useState<AVPlaybackStatus | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const colors = useThemeColors() ?? darkColors;

  useFocusEffect(
    useCallback(() => {
      let active = true;
      if (isActive && videoRef.current) {
        setIsPlaying(true);
        videoRef.current.playAsync().catch(() => {});
      } else if (!isActive && videoRef.current) {
        setIsPlaying(false);
        videoRef.current.pauseAsync().catch(() => {});
        videoRef.current.setPositionAsync(0).catch(() => {});
      }
      return () => { active = false; };
    }, [isActive])
  );

  const togglePlay = () => {
    if (!videoRef.current) return;
    if (isPlaying) {
      videoRef.current.pauseAsync();
      setIsPlaying(false);
    } else {
      videoRef.current.playAsync();
      setIsPlaying(true);
    }
  };

  const isLoaded = status?.isLoaded;

  return (
    <View style={styles.container}>
      <TouchableOpacity activeOpacity={1} onPress={togglePlay} style={StyleSheet.absoluteFill}>
        <Video
          ref={videoRef}
          style={StyleSheet.absoluteFill}
          source={{ uri: short.videoUrl }}
          resizeMode={ResizeMode.COVER}
          isLooping
          onPlaybackStatusUpdate={(stat) => setStatus(stat)}
        />
        
        {!isPlaying && isActive && (
          <View style={styles.playOverlay}>
            <View style={styles.playButton}>
              <Play color="#fff" size={40} fill="#fff" />
            </View>
          </View>
        )}

        <LinearGradient
          colors={['transparent', 'rgba(0,0,0,0.4)', 'rgba(0,0,0,0.9)']}
          style={styles.gradientOverlay}
        >
          <View style={styles.infoContainer}>
            <Text style={styles.title} numberOfLines={2}>{short.title}</Text>
            {short.description ? <Text style={styles.description} numberOfLines={3}>{short.description}</Text> : null}
            
            <View style={styles.authorRow}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{short.author.name?.slice(0, 1)?.toUpperCase() || '?'}</Text>
              </View>
              <View>
                <Text style={styles.authorName}>{short.author.name}</Text>
                <Text style={styles.authorTag}>@{short.author.userTag || short.author.id.slice(0, 5)}</Text>
              </View>
              <View style={[styles.followBtn, { borderColor: colors.studioPanelBorder, backgroundColor: colors.studioPanelBg }]}>
                <Text style={styles.followText}>Подписаться</Text>
              </View>
            </View>
          </View>
        </LinearGradient>

        <View style={styles.actionsContainer}>
          <ActionIcon icon={<Heart color="#fff" size={24} />} count={short.likesCount.toString()} />
          <ActionIcon icon={<MessageCircle color="#fff" size={24} />} count="0" />
          <ActionIcon icon={<Share2 color="#fff" size={24} />} count="Share" />
          <View style={{ marginTop: 12 }}>
            <ActionIcon icon={<Gem color="#22d3ee" size={24} />} count="10 💎" onPress={onDonate} neon />
          </View>
        </View>
      </TouchableOpacity>
    </View>
  );
});

const ActionIcon = ({ icon, count, onPress, neon }: { icon: React.ReactNode, count: string, onPress?: () => void, neon?: boolean }) => {
  const colors = useThemeColors() ?? darkColors;
  return (
    <View style={styles.actionItem}>
      <TouchableOpacity onPress={onPress} activeOpacity={0.7}>
        <BlurView 
          intensity={60} 
          tint="dark" 
          style={[styles.actionBtn, neon && { shadowColor: '#22d3ee', shadowOpacity: 0.8, shadowRadius: 15, elevation: 10 }]} 
          experimentalBlurMethod="dimezisBlurView"
        >
          {icon}
        </BlurView>
      </TouchableOpacity>
      <Text style={styles.actionCount}>{count}</Text>
    </View>
  );
};

export default function ShortsScreen() {
  const [shorts, setShorts] = useState<Short[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeIndex, setActiveIndex] = useState(0);

  const fetchShorts = async () => {
    try {
      const res = await fetch('http://localhost:3000/api/shorts');
      const data = await res.json();
      if (data.shorts) setShorts(data.shorts);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchShorts();
  }, []);

  const onViewableItemsChanged = useCallback(({ viewableItems }: { viewableItems: ViewToken[] }) => {
    if (viewableItems.length > 0) {
      setActiveIndex(viewableItems[0].index || 0);
    }
  }, []);

  const viewabilityConfigCallbackPairs = useRef([{ 
    viewabilityConfig: { itemVisiblePercentThreshold: 50 }, 
    onViewableItemsChanged 
  }]);

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center', backgroundColor: darkColors.bgPrimary }]}>
        <ActivityIndicator size="large" color={darkColors.accent} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: '#000' }]}>
      <FlatList
        data={shorts}
        keyExtractor={(item) => item.id}
        renderItem={({ item, index }) => (
          <ShortVideo 
            short={item} 
            isActive={index === activeIndex} 
            onDonate={() => {}}
          />
        )}
        pagingEnabled
        showsVerticalScrollIndicator={false}
        viewabilityConfigCallbackPairs={viewabilityConfigCallbackPairs.current}
        getItemLayout={(data, index) => ({ length: height, offset: height * index, index })}
        snapToInterval={height}
        snapToAlignment="start"
        decelerationRate="fast"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { width, height },
  playOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  playButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  gradientOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '50%',
    justifyContent: 'flex-end',
    padding: 24,
    paddingBottom: TAB_BAR_HEIGHT + 24,
  },
  infoContainer: {
    width: '80%',
  },
  title: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '700',
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  description: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 14,
    marginTop: 8,
    lineHeight: 20,
  },
  authorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 16,
    gap: 12,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  avatarText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
  authorName: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },
  authorTag: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 12,
  },
  followBtn: {
    marginLeft: 'auto',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
  },
  followText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  actionsContainer: {
    position: 'absolute',
    right: 16,
    bottom: TAB_BAR_HEIGHT + 24,
    alignItems: 'center',
    gap: 16,
  },
  actionItem: {
    alignItems: 'center',
    gap: 6,
  },
  actionBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    backgroundColor: 'rgba(0,0,0,0.4)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  actionCount: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
});
