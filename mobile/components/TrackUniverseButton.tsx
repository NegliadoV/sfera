import { useEffect, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity } from 'react-native';
import { getTracking, trackUniverse } from '@/lib/universesApi';
import { useThemeColors } from '@/components/useThemeColors';
import { darkColors, spacing } from '@/constants/Theme';

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
      style={[styles.btn, { backgroundColor: colors.bgAccent ?? colors.hoverColor, borderColor: colors.border }]}
      activeOpacity={0.8}>
      <Text style={[styles.text, { color: colors.textPrimary }]}>
        {tracking ? labelActive : label}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  btn: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 10,
    borderWidth: 1,
    alignSelf: 'flex-start',
  },
  text: {
    fontSize: 14,
    fontWeight: '500',
  },
});
