import { useEffect, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity } from 'react-native';
import { getTracking, trackUniverse } from '@/lib/universesApi';
import { useThemeColors } from '@/components/useThemeColors';
import { darkColors, spacing, accentButtonShadow } from '@/constants/Theme';
import { BlurView } from 'expo-blur';

type TrackUniverseButtonProps = {
  universeSlug: string;
  label?: string;
  labelActive?: string;
};

export function TrackUniverseButton({
  universeSlug,
  label = 'Отслеживать',
  labelActive = 'Отслеживаю',
}: TrackUniverseButtonProps) {
  const colors = useThemeColors() ?? darkColors;
  const [tracking, setTracking] = useState<boolean | null>(null);
  const [pending, setPending] = useState(false);

  useEffect(() => {
    if (!universeSlug) return;
    let cancelled = false;
    getTracking(universeSlug)
      .then((data) => { if (!cancelled) setTracking(data.tracking); })
      .catch(() => { if (!cancelled) setTracking(false); });
    return () => { cancelled = true; };
  }, [universeSlug]);

  const onPress = async () => {
    if (pending || tracking === null || !universeSlug) return;
    setPending(true);
    try {
      const data = await trackUniverse(universeSlug);
      setTracking(data.tracking);
    } catch {
      // keep previous state
    } finally {
      setPending(false);
    }
  };

  if (tracking === null || !universeSlug) return null;

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={pending}
      style={[
        styles.btnWrapper,
        !tracking && accentButtonShadow(colors.accent)
      ]}
      activeOpacity={0.8}>
      <BlurView
        intensity={50}
        tint="dark"
        experimentalBlurMethod="dimezisBlurView"
        style={[
          styles.btn, 
          { 
            backgroundColor: tracking ? 'rgba(255,255,255,0.03)' : colors.accent + '20', 
            borderColor: tracking ? 'rgba(255,255,255,0.06)' : colors.accent + '80'
          }
        ]}>
        <Text style={[styles.text, { color: tracking ? colors.textSecondary : colors.accent }]}>
          {tracking ? labelActive : label}
        </Text>
      </BlurView>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  btnWrapper: {
    borderRadius: 12,
    alignSelf: 'flex-start',
    overflow: 'hidden',
  },
  btn: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    fontSize: 14,
    fontWeight: '500',
  },
});
