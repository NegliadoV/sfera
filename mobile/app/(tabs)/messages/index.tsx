import { useEffect, useState } from 'react';
import { FlatList, RefreshControl, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { fetchConversations, fetchGroupChats } from '@/lib/messagesApi';
import type { ConversationItem, GroupChatItem } from '@/types/api';
import { useThemeColors } from '@/components/useThemeColors';
import { darkColors, screenLayout } from '@/constants/Theme';
import { ScreenContainer, LoadingScreen, EmptyState } from '@/components/screen';
import { ListCard } from '@/components/platform';

type ConvoItem = {
  userId?: string;
  userName?: string | null;
  lastMessage?: { body?: string | null } | null;
  id?: string;
  name?: string;
  isGroup?: boolean;
};

export default function MessagesListScreen() {
  const colors = useThemeColors() ?? darkColors;
  const [conversations, setConversations] = useState<ConversationItem[]>([]);
  const [groups, setGroups] = useState<GroupChatItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = async () => {
    try {
      const [convos, grps] = await Promise.all([
        fetchConversations(),
        fetchGroupChats(),
      ]);
      setConversations(Array.isArray(convos) ? convos : []);
      setGroups(Array.isArray(grps) ? grps : []);
    } catch {
      setConversations([]);
      setGroups([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const list: ConvoItem[] = [
    ...conversations.map((c) => ({
      userId: c.userId,
      userName: c.userName,
      lastMessage: c.lastMessage,
      isGroup: false,
    })),
    ...groups.map((g) => ({
      id: g.id,
      name: g.name,
      isGroup: true,
    })),
  ];

  if (loading) return <LoadingScreen />;

  return (
    <ScreenContainer>
      <FlatList
        data={list}
        keyExtractor={(item) => (item.isGroup ? item.id! : item.userId!)}
        contentContainerStyle={screenLayout.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor={colors.accent} />
        }
        renderItem={({ item }) => (
          <ListCard
            title={item.isGroup ? (item.name ?? '') : (item.userName || item.userId || 'Диалог')}
            subtitle={!item.isGroup && item.lastMessage?.body ? item.lastMessage.body : undefined}
            onPress={() => {
              if (item.isGroup && item.id) router.push(`/(tabs)/messages/group/${item.id}`);
              else if (item.userId) router.push(`/(tabs)/messages/${item.userId}`);
            }}
          />
        )}
        ListEmptyComponent={<EmptyState message="Нет чатов" />}
      />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({});
