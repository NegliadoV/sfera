import { useState } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';
import { useThemeColors } from '@/components/useThemeColors';
import { darkColors, radius, spacing } from '@/constants/Theme';

type PlatformInputProps = {
  label: string;
  value: string;
  onChangeText: (t: string) => void;
  placeholder?: string;
  secureTextEntry?: boolean;
  editable?: boolean;
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
  keyboardType?: 'default' | 'email-address' | 'numeric' | 'phone-pad';
};

export function PlatformInput({
  label,
  value,
  onChangeText,
  placeholder,
  secureTextEntry,
  editable = true,
  autoCapitalize,
  keyboardType,
}: PlatformInputProps) {
  const colors = useThemeColors() ?? darkColors;
  const [focused, setFocused] = useState(false);

  return (
    <View style={styles.field}>
      <Text style={[styles.label, { color: colors.textSecondary }]}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.textMuted}
        secureTextEntry={secureTextEntry}
        editable={editable}
        autoCapitalize={autoCapitalize}
        keyboardType={keyboardType}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        style={[
          styles.input,
          {
            backgroundColor: colors.bgAccent ?? colors.bgSecondary,
            color: colors.textPrimary,
            borderColor: focused ? colors.neonBorder : colors.border,
            borderWidth: 1,
            borderRadius: radius.sm,
            paddingVertical: 12,
            paddingHorizontal: 16,
            fontSize: 16,
            minHeight: 48,
          },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  field: {
    marginBottom: spacing.md,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 6,
  },
  input: {},
});
