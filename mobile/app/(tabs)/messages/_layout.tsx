import { useRouter } from 'expo-router';
import { Stack } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import type { ViewStyle } from 'react-native';
import { View, TouchableOpacity } from 'react-native';
import { useThemeColors } from '@/components/useThemeColors';
import { darkColors } from '@/constants/Theme';

export default function MessagesLayout() {
  const router = useRouter();
  const colors = useThemeColors() ?? darkColors;
  const headerStyle: ViewStyle = {
    backgroundColor: colors.bgPrimary,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderSubtle,
  };
  return (
    <Stack
      screenOptions={{
        headerShown: true,
        contentStyle: { backgroundColor: 'transparent' },
        headerStyle: headerStyle as any,
        headerTintColor: colors.textPrimary,
        headerTitleAlign: 'left',
        animation: 'slide_from_right',
        animationDuration: 320,
      }}>
      <Stack.Screen
        name="index"
        options={{
          title: 'Чаты',
          headerBackVisible: false,
          headerRight: () => (
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <TouchableOpacity onPress={() => router.push('/(tabs)/messages/contacts' as any)} style={{ marginRight: 8, padding: 8 }}>
                <Ionicons name="person-add-outline" size={22} color={colors.textPrimary} />
              </TouchableOpacity>
              <TouchableOpacity onPress={() => router.push('/(tabs)/messages/create-group' as any)} style={{ marginRight: 8, padding: 8 }}>
                <Ionicons name="create-outline" size={22} color={colors.textPrimary} />
              </TouchableOpacity>
            </View>
          ),
        }}
      />
      <Stack.Screen name="contacts" options={{ title: 'Друзья' }} />
      <Stack.Screen name="create-group" options={{ title: 'Создать группу', headerShown: true }} />
      <Stack.Screen name="[userId]" options={{ title: 'Чат' }} />
      <Stack.Screen name="group/[groupId]" options={{ title: 'Групповой чат' }} />
    </Stack>
  );
}
