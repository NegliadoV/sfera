import Ionicons from '@expo/vector-icons/Ionicons';
import { useThemeColors } from '@/components/useThemeColors';
import { spacing } from '@/constants/Theme';
import { DrawerContentScrollView } from '@react-navigation/drawer';
import { useRouter, usePathname } from 'expo-router';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

type NavItem = {
  route: string;
  label: string;
  icon: string;
  iconActive?: string;
};

const MAIN_ITEMS: NavItem[] = [
  { route: '/(tabs)/universes', label: 'Вселенные', icon: 'planet-outline' as const, iconActive: 'planet' as const },
  { route: '/(tabs)/messages', label: 'Сообщения', icon: 'chatbubbles-outline' as const, iconActive: 'chatbubbles' as const },
  { route: '/(tabs)/me', label: 'Я', icon: 'person-outline' as const, iconActive: 'person' as const },
  { route: '/(tabs)/settings', label: 'Настройки', icon: 'settings-outline' as const, iconActive: 'settings' as const },
];

function isActive(pathname: string, route: string): boolean {
  const segment = route.replace(/^\//, '').replace(/^\(tabs\)\//, '');
  if (pathname === route || pathname === segment || pathname.endsWith(route)) return true;
  if (segment === 'universes' && (pathname.includes('universes') && !pathname.includes('universe/'))) return true;
  if (segment === 'universes' && pathname === '/') return true;
  if (segment === 'messages' && pathname.includes('messages')) return true;
  if (segment === 'me' && pathname.includes('/me') && !pathname.includes('messages')) return true;
  if (segment === 'settings' && pathname.includes('settings')) return true;
  return false;
}

export function AppSidebarMobile(props: import('@react-navigation/drawer').DrawerContentComponentProps) {
  const colors = useThemeColors();
  const router = useRouter();
  const pathname = usePathname();

  return (
    <DrawerContentScrollView
      {...props}
      contentContainerStyle={[styles.container, { paddingTop: spacing.xl }]}
      style={[styles.scroll, { backgroundColor: colors.studioPanelBg, borderRightColor: colors.studioPanelBorder }]}>
      <View style={[styles.section, { borderBottomColor: colors.studioPanelBorder }]}>
        <Text style={[styles.sectionLabel, { color: colors.studioMetaColor }]}>Навигация</Text>
        {MAIN_ITEMS.map((item) => {
          const active = isActive(pathname, item.route);
          return (
            <TouchableOpacity
              key={item.route}
              onPress={() => {
                router.navigate(item.route as any);
                props.navigation.closeDrawer();
              }}
              style={[
                styles.link,
                {
                  backgroundColor: active ? colors.hoverColor : 'transparent',
                  borderWidth: active ? 1 : 0,
                  borderColor: active ? colors.borderSubtle : 'transparent',
                },
              ]}
              activeOpacity={0.8}>
              <Ionicons
                name={(active ? item.iconActive ?? item.icon : item.icon) as any}
                size={22}
                color={active ? colors.textPrimary : colors.studioMetaColor}
              />
              <Text
                style={[
                  styles.linkText,
                  { color: active ? colors.textPrimary : colors.studioMetaColor },
                ]}
                numberOfLines={1}>
                {item.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </DrawerContentScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingBottom: spacing.xxl,
  },
  scroll: {
    borderRightWidth: 1,
  },
  section: {
    paddingHorizontal: spacing.sm,
    paddingBottom: spacing.lg,
    borderBottomWidth: 1,
    marginBottom: spacing.md,
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: spacing.md,
    paddingHorizontal: 6,
  },
  link: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 28,
    marginBottom: 4,
  },
  linkText: {
    fontSize: 15,
    fontWeight: '500',
    flex: 1,
  },
});
