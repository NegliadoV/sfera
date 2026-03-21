import { View, TouchableOpacity } from 'react-native';
import { spacing } from '@/constants/Theme';
import { PlatformCard } from './PlatformCard';
import { PlatformCardTitle } from './PlatformCardTitle';
import { PlatformCardDesc } from './PlatformCardDesc';

type ListCardProps = {
  title: string;
  subtitle?: string | null;
  onPress?: () => void;
};

export function ListCard({ title, subtitle, onPress }: ListCardProps) {
  const content = (
    <PlatformCard compact>
      <PlatformCardTitle>{title}</PlatformCardTitle>
      {subtitle ? <PlatformCardDesc>{subtitle}</PlatformCardDesc> : null}
    </PlatformCard>
  );

  const wrapper = (
    <View style={{ flex: 1, marginBottom: spacing.lg }}>
      {onPress ? (
        <TouchableOpacity activeOpacity={0.85} onPress={onPress} style={{ flex: 1 }}>
          {content}
        </TouchableOpacity>
      ) : (
        content
      )}
    </View>
  );
  return wrapper;
}
