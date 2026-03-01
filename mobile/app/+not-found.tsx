import { useEffect } from 'react';
import { Link, Stack, usePathname, router } from 'expo-router';
import { StyleSheet } from 'react-native';

import { Text, View } from '@/components/Themed';
import { useThemeColors } from '@/components/useThemeColors';
import { darkColors, screenLayout, typography } from '@/constants/Theme';

export default function NotFoundScreen() {
  const pathname = usePathname();
  const colors = useThemeColors() ?? darkColors;

  useEffect(() => {
    if (pathname === '/' || pathname === '' || pathname === '/index') {
      router.replace('/(auth)/login');
    }
  }, [pathname]);

  return (
    <>
      <Stack.Screen options={{ title: 'Oops!' }} />
      <View style={[screenLayout.loadingCentered, styles.container, { backgroundColor: 'transparent' }]}>
        <Text style={[typography.titleLarge, { color: colors.textPrimary }]}>This screen doesn't exist.</Text>
        <Link href="/(auth)/login" style={styles.link}>
          <Text style={[typography.bodySmall, { color: colors.accent }]}>Go to home screen!</Text>
        </Link>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20 },
  link: { marginTop: 15, paddingVertical: 15 },
});
