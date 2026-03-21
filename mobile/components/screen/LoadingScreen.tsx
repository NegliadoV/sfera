import { View, ActivityIndicator } from 'react-native';
import { useThemeColors } from '@/components/useThemeColors';
import { darkColors } from '@/constants/Theme';

type LoadingScreenProps = {};

export function LoadingScreen({}: LoadingScreenProps) {
  const colors = useThemeColors();
  const c = colors ?? darkColors;
  const bg = 'transparent';
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: bg }}>
      <ActivityIndicator size="large" color={c.accent} />
    </View>
  );
}
