import { View, TouchableOpacity } from 'react-native';
import { spacing } from '@/constants/Theme';
import { PlatformCard } from './PlatformCard';
import { PlatformCardTitle } from './PlatformCardTitle';
import { PlatformCardDesc } from './PlatformCardDesc';

type ListCardProps = {
  title: string;
  subtitle?: string | null;
  onPress?: () => void;
  /** Принудительно тёмная карточка (на экране «Сборка») */
  forceDark?: boolean;
};

export function ListCard({ title, subtitle, onPress, forceDark }: ListCardProps) {
  const content = (
    <PlatformCard compact forceDark={forceDark}>
      <PlatformCardTitle forceDark={forceDark}>{title}</PlatformCardTitle>
      {subtitle ? <PlatformCardDesc forceDark={forceDark}>{subtitle}</PlatformCardDesc> : null}
    </PlatformCard>
  );

  const wrapper = (
    <View style={{ marginBottom: spacing.sm }}>
      {onPress ? (
        <TouchableOpacity activeOpacity={0.85} onPress={onPress}>
          {content}
        </TouchableOpacity>
      ) : (
        content
      )}
    </View>
  );
  return wrapper;
}
