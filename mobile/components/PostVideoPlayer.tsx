import * as WebBrowser from 'expo-web-browser';
import { Video, ResizeMode, type AVPlaybackStatus } from 'expo-av';
import { useRef, useState } from 'react';
import {
  View,
  Image,
  TouchableOpacity,
  StyleSheet,
  Text,
} from 'react-native';
import { getYouTubeVideoId } from '@/lib/youtube';
import { isDirectVideoUrl } from '@/lib/videoUrl';
import { useThemeColors } from '@/components/useThemeColors';
import { darkColors, radius, spacing } from '@/constants/Theme';

type PostVideoPlayerProps = {
  url: string;
  title?: string | null;
};

const VIDEO_ASPECT = 16 / 9;

export function PostVideoPlayer({ url, title }: PostVideoPlayerProps) {
  const colors = useThemeColors() ?? darkColors;
  const youtubeId = getYouTubeVideoId(url);
  const isDirect = isDirectVideoUrl(url);
  const videoRef = useRef<Video>(null);
  const [status, setStatus] = useState<AVPlaybackStatus | null>(null);
  const [thumbError, setThumbError] = useState(false);

  const openInBrowser = () => {
    WebBrowser.openBrowserAsync(url);
  };

  if (youtubeId) {
    const thumb = thumbError
      ? `https://img.youtube.com/vi/${youtubeId}/hqdefault.jpg`
      : `https://img.youtube.com/vi/${youtubeId}/maxresdefault.jpg`;
    return (
      <View style={[styles.wrapper, { backgroundColor: colors.bgAccent, borderColor: colors.border }]}>
        <TouchableOpacity
          activeOpacity={0.9}
          onPress={openInBrowser}
          style={styles.touchable}
        >
          <Image
            source={{ uri: thumb }}
            style={styles.thumbnail}
            resizeMode="cover"
            onError={() => setThumbError(true)}
          />
          <View style={styles.playOverlay}>
            <View style={[styles.playButton, { backgroundColor: 'rgba(0,0,0,0.6)' }]}>
              <Text style={styles.playIcon}>▶</Text>
            </View>
          </View>
          <View style={[styles.footerBar, { backgroundColor: 'rgba(0,0,0,0.5)' }]}>
            <Text style={styles.footerText}>YouTube</Text>
            <Text style={styles.footerHint}>Нажмите, чтобы открыть</Text>
          </View>
        </TouchableOpacity>
      </View>
    );
  }

  if (isDirect) {
    return (
      <View style={[styles.wrapper, { backgroundColor: colors.bgAccent, borderColor: colors.border }]}>
        <Video
          ref={videoRef}
          source={{ uri: url }}
          style={styles.video}
          useNativeControls
          resizeMode={ResizeMode.CONTAIN}
          onPlaybackStatusUpdate={(s) => setStatus(s)}
          progressUpdateIntervalMillis={500}
        />
        {status && 'isLoaded' in status && status.isLoaded && status.durationMillis != null && status.positionMillis != null && (
          <View style={[styles.progressBar, { backgroundColor: colors.border }]}>
            <View
              style={[
                styles.progressFill,
                {
                  width: `${Math.min(100, (status.positionMillis / status.durationMillis) * 100)}%`,
                  backgroundColor: colors.accent,
                },
              ]}
            />
          </View>
        )}
      </View>
    );
  }

  return null;
}

const styles = StyleSheet.create({
  wrapper: {
    width: '100%',
    borderRadius: radius.lg,
    borderWidth: 1,
    overflow: 'hidden',
    marginBottom: spacing.md,
  },
  touchable: {
    width: '100%',
    aspectRatio: VIDEO_ASPECT,
  },
  thumbnail: {
    width: '100%',
    height: '100%',
  },
  playOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
  playButton: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  playIcon: {
    color: '#fff',
    fontSize: 28,
    marginLeft: 4,
  },
  footerBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
  },
  footerText: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 12,
    fontWeight: '600',
  },
  footerHint: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 11,
  },
  video: {
    width: '100%',
    aspectRatio: VIDEO_ASPECT,
  },
  progressBar: {
    height: 3,
    width: '100%',
  },
  progressFill: {
    height: '100%',
    borderRadius: 1,
  },
});
