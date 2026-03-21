import { apiRequest } from '@/lib/api';
import type { ConversationItem, GroupChatItem } from '@/types/api';

export async function fetchConversations(): Promise<ConversationItem[]> {
  try {
    const data = await apiRequest<ConversationItem[] | { conversations?: ConversationItem[] }>('/api/me/conversations');
    if (Array.isArray(data)) return data;
    return data.conversations ?? [];
  } catch {
    return [];
  }
}

export async function fetchGroupChats(): Promise<GroupChatItem[]> {
  try {
    const data = await apiRequest<GroupChatItem[] | { groups?: GroupChatItem[] }>('/api/me/group-chats');
    if (Array.isArray(data)) return data;
    return data.groups ?? [];
  } catch {
    return [];
  }
}

export async function fetchMessagesBadge(): Promise<{ total: number }> {
  try {
    return await apiRequest<{ total: number }>('/api/me/messages-badge');
  } catch {
    return { total: 0 };
  }
}

export type ContactUser = { id: string; name?: string | null; email?: string | null; image?: string | null; userTag?: string | null };

export async function fetchContacts(): Promise<ContactUser[]> {
  try {
    const data = await apiRequest<ContactUser[]>('/api/me/contacts');
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

export async function searchContacts(query: string): Promise<ContactUser[]> {
  if (!query || query.trim().length < 2) return [];
  try {
    const data = await apiRequest<ContactUser[]>(`/api/me/contacts/search?query=${encodeURIComponent(query.trim())}`);
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

export async function createGroupChat(name: string, participantIds: string[]) {
  return apiRequest<{ id: string; name: string }>('/api/me/group-chats', {
    method: 'POST',
    body: JSON.stringify({ name: name.trim(), participantIds }),
  });
}
