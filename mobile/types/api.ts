export type Universe = {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  color?: string | null;
};

export type ContentItem = {
  id: string;
  title: string;
  body?: string | null;
  universeId: string;
  universeSlug?: string;
  authorId?: string;
  createdAt?: string;
  updatedAt?: string;
};

export type DigestItem = {
  id: string;
  title: string;
  body?: string | null;
  universeSlug?: string;
  contentId?: string;
};

export type ConversationItem = {
  userId: string;
  userName?: string | null;
  userImage?: string | null;
  lastMessage?: { id?: string; body?: string; createdAt?: string } | null;
  unreadCount?: number;
};

export type GroupChatItem = {
  id: string;
  name: string;
  participantIds?: string[];
};

export type NotificationItem = {
  id: string;
  type: string;
  title?: string;
  contentId?: string;
  slug?: string;
  read?: boolean;
  createdAt?: string;
};

export type RoomItem = {
  id: string;
  title: string;
  universeId?: string;
  universeSlug?: string;
};

export type MindMapItem = {
  id: string;
  title: string;
  universeId?: string;
  universeSlug?: string;
};
