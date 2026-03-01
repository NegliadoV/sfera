import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useThemeColors } from '@/components/useThemeColors';
import { darkColors } from '@/constants/Theme';

type PlatformCardTitleProps = {
  children: React.ReactNode;
  icon?: React.ReactNode;
  forceDark?: boolean;
};

export function PlatformCardTitle({ children, icon, forceDark }: PlatformCardTitleProps) {
  const themeColors = useThemeColors();
  const colors = forceDark ? darkColors : themeColors;
  const textColor = colors?.textPrimary ?? darkColors.textPrimary;
  const accentColor = colors?.accent ?? darkColors.accent;
  const iconWithAccent =
    icon && React.isValidElement(icon) && (icon as React.ReactElement<{ tintColor?: string }>).props?.tintColor == null
      ? React.cloneElement(icon as React.ReactElement<{ tintColor?: string }>, { tintColor: accentColor })
      : icon;

  return (
    <View style={styles.row}>
      {iconWithAccent ? <View style={[styles.icon, { marginRight: 12 }]}>{iconWithAccent}</View> : null}
      <Text style={[styles.title, { color: textColor }]} numberOfLines={2}>
        {children ?? ''}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  icon: {},
  title: {
    fontWeight: '600',
    fontSize: 20,
    flex: 1,
  },
});
