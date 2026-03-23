import {
  pgTable,
  text,
  uuid,
  timestamp,
  integer,
  pgEnum,
  primaryKey,
  uniqueIndex,
  jsonb,
  boolean,
} from 'drizzle-orm/pg-core';

// --- Auth.js / NextAuth tables (compatible with @auth/drizzle-adapter) ---
export const user = pgTable('user', {
  id: text('id')
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  name: text('name'),
  email: text('email').unique(),
  emailVerified: timestamp('emailVerified', { mode: 'date' }),
  image: text('image'),
  passwordHash: text('password_hash'), // для входа по email (nullable: OAuth/seed без пароля)
  /** Личный тег для поиска (@bublik33). lowercase, без @, уникальный. */
  userTag: text('user_tag').unique(),
  /** Баланс кристаллов SFERA */
  crystals: integer('crystals').notNull().default(0),
});

export const account = pgTable(
  'account',
  {
    userId: text('userId')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    type: text('type').notNull(),
    provider: text('provider').notNull(),
    providerAccountId: text('providerAccountId').notNull(),
    refresh_token: text('refresh_token'),
    access_token: text('access_token'),
    expires_at: integer('expires_at'),
    token_type: text('token_type'),
    scope: text('scope'),
    id_token: text('id_token'),
    session_state: text('session_state'),
  },
  (t) => ({
    compositePk: primaryKey({
      columns: [t.provider, t.providerAccountId],
    }),
  })
);

export const session = pgTable('session', {
  sessionToken: text('sessionToken').primaryKey(),
  userId: text('userId')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
  expires: timestamp('expires', { mode: 'date' }).notNull(),
});

export const verificationToken = pgTable(
  'verificationToken',
  {
    identifier: text('identifier').notNull(),
    token: text('token').notNull(),
    expires: timestamp('expires', { mode: 'date' }).notNull(),
  },
  (t) => ({
    compositePk: primaryKey({
      columns: [t.identifier, t.token],
    }),
  })
);

// --- App tables ---
export const roleEnum = pgEnum('role', ['owner', 'moderator', 'member']);

export const contentTypeEnum = pgEnum('content_type', [
  'text',
  'video',
  'podcast',
  'article',
  'link',
]);

export const universes = pgTable('universes', {
  id: uuid('id').primaryKey().defaultRandom(),
  slug: text('slug').notNull().unique(),
  name: text('name').notNull(),
  description: text('description'),
  icon: text('icon'),
  /** Оттенок сферы (hex или индекс пресета 0–7), задаётся при создании */
  sphereColor: text('sphere_color'),
  ownerId: text('owner_id')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
  // Фаза 6: Монетизация
  isPrivate: boolean('is_private').notNull().default(false),
  monthlyPrice: integer('monthly_price'), // Цена в рублях (целое число), null если бесплатно
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

export const universeMembers = pgTable(
  'universe_members',
  {
    universeId: uuid('universe_id')
      .notNull()
      .references(() => universes.id, { onDelete: 'cascade' }),
    userId: text('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    role: roleEnum('role').notNull().default('member'),
    joinedAt: timestamp('joined_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [primaryKey({ columns: [t.universeId, t.userId] })]
);

export const content = pgTable('content', {
  id: uuid('id').primaryKey().defaultRandom(),
  universeId: uuid('universe_id')
    .notNull()
    .references(() => universes.id, { onDelete: 'cascade' }),
  authorId: text('author_id')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
  type: contentTypeEnum('type').notNull().default('link'),
  title: text('title').notNull(),
  url: text('url'),
  body: text('body'),
  imageUrl: text('image_url'), // URL изображения (обложка, превью) из источника
  // Фаза 4: Gamification & Knowledge Economy
  savesCount: integer('saves_count').notNull().default(0),
  // Фаза 2: метаданные агрегации
  sourceId: uuid('source_id').references(() => sources.id, { onDelete: 'set null' }),
  publishedAt: timestamp('published_at', { withTimezone: true }),
  externalAuthor: text('external_author'), // Автор из внешнего источника
  tags: jsonb('tags'), // Массив строк или объект с тегами
  /** Когда задано — пост закреплён в ленте сферы (отображается сверху) */
  pinnedAt: timestamp('pinned_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

// --- Фаза 1: обсуждения и реакции ---
export const commentTypeEnum = pgEnum('comment_type', ['thesis', 'counterargument', 'question']);

export const comments = pgTable('comments', {
  id: uuid('id').primaryKey().defaultRandom(),
  contentId: uuid('content_id')
    .notNull()
    .references(() => content.id, { onDelete: 'cascade' }),
  authorId: text('author_id')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
  parentId: uuid('parent_id'),
  type: commentTypeEnum('type').notNull().default('thesis'),
  body: text('body').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

// Справочник типов реакций: confirm_source, please_clarify, important_counterargument
export const reactionTypeEnum = pgEnum('reaction_type', [
  'confirm_source',
  'please_clarify',
  'important_counterargument',
]);

export const reactionTargetEnum = pgEnum('reaction_target', ['content', 'comment']);

export const reactions = pgTable(
  'reactions',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    targetType: reactionTargetEnum('target_type').notNull(),
    targetId: text('target_id').notNull(), // content.id or comment.id (uuid as text)
    userId: text('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    reactionType: reactionTypeEnum('reaction_type').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [
    uniqueIndex('reactions_target_user_idx').on(t.targetType, t.targetId, t.userId),
  ]
);

// --- Фаза 2: Агрегатор контента ---

export const sourceProviderEnum = pgEnum('source_provider', ['rss', 'youtube', 'podcast', 'telegram', 'manual']);

// Очередь задач агрегатора (PostgreSQL, без Redis)
export const aggregatorJobs = pgTable('aggregator_jobs', {
  id: uuid('id').primaryKey().defaultRandom(),
  universeId: uuid('universe_id')
    .notNull()
    .references(() => universes.id, { onDelete: 'cascade' }),
  status: text('status').notNull().default('pending'), // pending | processing | completed | failed
  result: jsonb('result'), // { processed: number } при успехе
  error: text('error'), // сообщение об ошибке при failure
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  startedAt: timestamp('started_at', { withTimezone: true }),
  completedAt: timestamp('completed_at', { withTimezone: true }),
});

export const sources = pgTable('sources', {
  id: uuid('id').primaryKey().defaultRandom(),
  universeId: uuid('universe_id')
    .notNull()
    .references(() => universes.id, { onDelete: 'cascade' }),
  provider: sourceProviderEnum('provider').notNull().default('manual'),
  name: text('name').notNull(), // Название источника (например, "ArXiv Physics")
  url: text('url'), // RSS URL, YouTube канал ID, и т.д.
  config: jsonb('config'), // Дополнительные настройки провайдера (API ключи, фильтры)
  enabled: boolean('enabled').notNull().default(true),
  lastFetchedAt: timestamp('last_fetched_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

/** Персональные источники пользователя (агрегация только для себя) */
export const userSources = pgTable('user_sources', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: text('user_id')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
  provider: sourceProviderEnum('provider').notNull().default('rss'),
  name: text('name').notNull(),
  url: text('url'),
  config: jsonb('config'),
  enabled: boolean('enabled').notNull().default(true),
  lastFetchedAt: timestamp('last_fetched_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

/** Агрегированный контент пользователя (из user_sources) */
export const userContent = pgTable('user_content', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: text('user_id')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
  sourceId: uuid('source_id').references(() => userSources.id, { onDelete: 'set null' }),
  type: contentTypeEnum('type').notNull().default('link'),
  title: text('title').notNull(),
  url: text('url'),
  body: text('body'),
  imageUrl: text('image_url'),
  publishedAt: timestamp('published_at', { withTimezone: true }),
  externalAuthor: text('external_author'),
  tags: jsonb('tags'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

export const contentLinkTypeEnum = pgEnum('content_link_type', ['contradicts', 'develops', 'related']);

export const contentLinks = pgTable(
  'content_links',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    fromContentId: uuid('from_content_id')
      .notNull()
      .references(() => content.id, { onDelete: 'cascade' }),
    toContentId: uuid('to_content_id')
      .notNull()
      .references(() => content.id, { onDelete: 'cascade' }),
    linkType: contentLinkTypeEnum('link_type').notNull(),
    createdById: text('created_by_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    note: text('note'), // Опциональная заметка о связи
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [
    uniqueIndex('content_links_unique_idx').on(t.fromContentId, t.toContentId, t.linkType),
  ]
);

/** Отслеживание сферы — уведомления о новых постах */
export const universeTracking = pgTable(
  'universe_tracking',
  {
    universeId: uuid('universe_id')
      .notNull()
      .references(() => universes.id, { onDelete: 'cascade' }),
    userId: text('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [
    primaryKey({ columns: [t.universeId, t.userId] }),
  ]
);

// --- Фаза 4: Интерактивные Опросы (Polls) ---

export const contentPolls = pgTable('content_polls', {
  id: uuid('id').primaryKey().defaultRandom(),
  contentId: uuid('content_id')
    .notNull()
    .references(() => content.id, { onDelete: 'cascade' }),
  options: jsonb('options').notNull(), // Array<{ id: string, text: string }>
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

export const contentPollVotes = pgTable('content_poll_votes', {
  id: uuid('id').primaryKey().defaultRandom(),
  pollId: uuid('poll_id')
    .notNull()
    .references(() => contentPolls.id, { onDelete: 'cascade' }),
  optionId: text('option_id').notNull(),
  userId: text('user_id')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (t) => [
  uniqueIndex('poll_votes_user_idx').on(t.pollId, t.userId), // 1 голос на юзера в опросе
]);

/** Уведомления пользователя (новый пост в отслеживаемой сфере) */
export const notifications = pgTable('notifications', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: text('user_id')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
  universeId: uuid('universe_id')
    .notNull()
    .references(() => universes.id, { onDelete: 'cascade' }),
  contentId: uuid('content_id')
    .notNull()
    .references(() => content.id, { onDelete: 'cascade' }),
  type: text('type').notNull().default('new_post'),
  readAt: timestamp('read_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

export const universeAggregatorSettings = pgTable('universe_aggregator_settings', {
  id: uuid('id').primaryKey().defaultRandom(),
  universeId: uuid('universe_id')
    .notNull()
    .unique()
    .references(() => universes.id, { onDelete: 'cascade' }),
  sortBy: text('sort_by').default('newest'), // newest, most_discussed, controversial
  filterTags: jsonb('filter_tags'), // Массив тегов для фильтрации
  priorityRules: jsonb('priority_rules'), // Правила приоритизации контента
  autoApprove: boolean('auto_approve').notNull().default(false), // Автоматически добавлять агрегированный контент
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

export const userContentPreferences = pgTable('user_content_preferences', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: text('user_id')
    .notNull()
    .unique()
    .references(() => user.id, { onDelete: 'cascade' }),
  defaultSortBy: text('default_sort_by').default('newest'),
  showSourceInfo: boolean('show_source_info').notNull().default(true),
  showContentLinks: boolean('show_content_links').notNull().default(true),
  showAlgorithmHints: boolean('show_algorithm_hints').notNull().default(true), // Показывать "Показано, потому что..."
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

// --- Темы вселенной (для привязки комнат) ---
export const themes = pgTable('themes', {
  id: uuid('id').primaryKey().defaultRandom(),
  universeId: uuid('universe_id')
    .notNull()
    .references(() => universes.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

// --- Фаза 3: Комнаты и синхронный просмотр ---
export const roomStatusEnum = pgEnum('room_status', ['waiting', 'ongoing', 'finished']);

export const rooms = pgTable('rooms', {
  id: uuid('id').primaryKey().defaultRandom(),
  universeId: uuid('universe_id')
    .notNull()
    .references(() => universes.id, { onDelete: 'cascade' }),
  themeId: uuid('theme_id').references(() => themes.id, { onDelete: 'set null' }), // Тема внутри вселенной
  contentId: uuid('content_id').references(() => content.id, { onDelete: 'set null' }), // Опциональная привязка к контенту
  title: text('title').notNull(), // Название комнаты
  status: roomStatusEnum('status').notNull().default('waiting'), // ожидание / идёт / завершена
  timeLimitMinutes: integer('time_limit_minutes'), // Общий лимит по времени (опционально)
  createdById: text('created_by_id')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
  currentRoundIndex: integer('current_round_index').notNull().default(0), // Текущий раунд (0-based)
  startedAt: timestamp('started_at', { withTimezone: true }),
  finishedAt: timestamp('finished_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

export const roomRounds = pgTable('room_rounds', {
  id: uuid('id').primaryKey().defaultRandom(),
  roomId: uuid('room_id')
    .notNull()
    .references(() => rooms.id, { onDelete: 'cascade' }),
  name: text('name').notNull(), // Название раунда
  orderIndex: integer('order_index').notNull().default(0), // Порядок раунда
  durationMinutes: integer('duration_minutes'), // Длительность в минутах (опционально)
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

export const roomParticipants = pgTable(
  'room_participants',
  {
    roomId: uuid('room_id')
      .notNull()
      .references(() => rooms.id, { onDelete: 'cascade' }),
    userId: text('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    joinedAt: timestamp('joined_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [primaryKey({ columns: [t.roomId, t.userId] })]
);

export const roomChatMessages = pgTable('room_chat_messages', {
  id: uuid('id').primaryKey().defaultRandom(),
  roomId: uuid('room_id')
    .notNull()
    .references(() => rooms.id, { onDelete: 'cascade' }),
  userId: text('user_id')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
  body: text('body').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

// --- Фаза 4: Ментальные карты ---
export const mindMapNodeTypeEnum = pgEnum('mind_map_node_type', ['source', 'thesis', 'discussion']);

export const mindMaps = pgTable('mind_maps', {
  id: uuid('id').primaryKey().defaultRandom(),
  universeId: uuid('universe_id')
    .references(() => universes.id, { onDelete: 'cascade' }),
  title: text('title').notNull(),
  createdById: text('created_by_id')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

export const mindMapNodes = pgTable('mind_map_nodes', {
  id: uuid('id').primaryKey().defaultRandom(),
  mindMapId: uuid('mind_map_id')
    .notNull()
    .references(() => mindMaps.id, { onDelete: 'cascade' }),
  type: mindMapNodeTypeEnum('type').notNull(), // source | thesis | discussion
  label: text('label').notNull(),
  contentId: uuid('content_id').references(() => content.id, { onDelete: 'set null' }),
  commentId: uuid('comment_id').references(() => comments.id, { onDelete: 'set null' }),
  position: jsonb('position'), // { x: number, y: number } для визуального редактора
  data: jsonb('data'), // for ReactFlow arbitrary data (like bgColor)
  createdById: text('created_by_id')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

export const mindMapEdges = pgTable('mind_map_edges', {
  id: uuid('id').primaryKey().defaultRandom(),
  mindMapId: uuid('mind_map_id')
    .notNull()
    .references(() => mindMaps.id, { onDelete: 'cascade' }),
  fromNodeId: uuid('from_node_id')
    .notNull()
    .references(() => mindMapNodes.id, { onDelete: 'cascade' }),
  toNodeId: uuid('to_node_id')
    .notNull()
    .references(() => mindMapNodes.id, { onDelete: 'cascade' }),
  createdById: text('created_by_id')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

// --- Контакты и личные сообщения (DM) ---
export const contactRequestStatusEnum = pgEnum('contact_request_status', [
  'pending',
  'accepted',
  'declined',
]);

export const contactRequests = pgTable('contact_requests', {
  id: uuid('id').primaryKey().defaultRandom(),
  fromUserId: text('from_user_id')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
  toUserId: text('to_user_id')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
  status: contactRequestStatusEnum('status').notNull().default('pending'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

export const contacts = pgTable(
  'contacts',
  {
    userIdA: text('user_id_a')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    userIdB: text('user_id_b')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [primaryKey({ columns: [t.userIdA, t.userIdB] })]
);

export const userPrivacySettings = pgTable('user_privacy_settings', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: text('user_id')
    .notNull()
    .unique()
    .references(() => user.id, { onDelete: 'cascade' }),
  dmOnlyContacts: boolean('dm_only_contacts').notNull().default(false),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

export const userBlocks = pgTable(
  'user_blocks',
  {
    blockerId: text('blocker_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    blockedId: text('blocked_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [primaryKey({ columns: [t.blockerId, t.blockedId] })]
);

export const directMessageConversations = pgTable(
  'direct_message_conversations',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userIdA: text('user_id_a')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    userIdB: text('user_id_b')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    lastMessageAt: timestamp('last_message_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [uniqueIndex('dm_conversations_pair_idx').on(t.userIdA, t.userIdB)]
);

export const directMessages = pgTable('direct_messages', {
  id: uuid('id').primaryKey().defaultRandom(),
  conversationId: uuid('conversation_id')
    .notNull()
    .references(() => directMessageConversations.id, { onDelete: 'cascade' }),
  senderId: text('sender_id')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
  body: text('body').notNull(),
  attachmentUrl: text('attachment_url'),
  attachmentType: text('attachment_type'), // 'image' | 'video'
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  readAt: timestamp('read_at', { withTimezone: true }),
});

/** Сообщения лички, скрытые «у себя» для пользователя */
export const userHiddenDmMessages = pgTable(
  'user_hidden_dm_messages',
  {
    userId: text('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    messageId: uuid('message_id')
      .notNull()
      .references(() => directMessages.id, { onDelete: 'cascade' }),
  },
  (t) => [primaryKey({ columns: [t.userId, t.messageId] })]
);


// --- Групповые чаты ---
export const groupChats = pgTable('group_chats', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  createdById: text('created_by_id')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
  lastMessageAt: timestamp('last_message_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

export const groupChatParticipants = pgTable(
  'group_chat_participants',
  {
    groupId: uuid('group_id')
      .notNull()
      .references(() => groupChats.id, { onDelete: 'cascade' }),
    userId: text('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    joinedAt: timestamp('joined_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [primaryKey({ columns: [t.groupId, t.userId] })]
);

export const groupChatMessages = pgTable('group_chat_messages', {
  id: uuid('id').primaryKey().defaultRandom(),
  groupId: uuid('group_id')
    .notNull()
    .references(() => groupChats.id, { onDelete: 'cascade' }),
  senderId: text('sender_id')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
  body: text('body').notNull(),
  attachmentUrl: text('attachment_url'),
  attachmentType: text('attachment_type'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

/** Сообщения группы, скрытые «у себя» для пользователя */
export const userHiddenGroupMessages = pgTable(
  'user_hidden_group_messages',
  {
    userId: text('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    messageId: uuid('message_id')
      .notNull()
      .references(() => groupChatMessages.id, { onDelete: 'cascade' }),
  },
  (t) => [primaryKey({ columns: [t.userId, t.messageId] })]
);

// --- Фаза 5: Цифровая гигиена ---
export const digestDeliveryEnum = pgEnum('digest_delivery', ['none', 'in_app', 'email']);

export const userHygieneSettings = pgTable('user_hygiene_settings', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: text('user_id')
    .notNull()
    .unique()
    .references(() => user.id, { onDelete: 'cascade' }),
  focusMode: boolean('focus_mode').notNull().default(false),
  dailyTimeLimitMinutes: integer('daily_time_limit_minutes'), // null = без лимита
  digestDelivery: digestDeliveryEnum('digest_delivery').notNull().default('none'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

// --- Фаза 6: Монетизация (ЮKassa) ---
export const subscriptionStatusEnum = pgEnum('subscription_status', ['active', 'canceled', 'past_due', 'unpaid', 'pending_payment']);

export const universeSubscriptions = pgTable('universe_subscriptions', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: text('user_id')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
  universeId: uuid('universe_id')
    .notNull()
    .references(() => universes.id, { onDelete: 'cascade' }),
  status: subscriptionStatusEnum('status').notNull().default('unpaid'),
  paymentMethodId: text('payment_method_id'), // Для рекуррентных платежей (recurring)
  currentPeriodEnd: timestamp('current_period_end', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (t) => [
  uniqueIndex('univ_sub_user_universe_idx').on(t.userId, t.universeId),
]);

// --- Фаза 7: Shorts ---
export const shorts = pgTable('shorts', {
  id: uuid('id').primaryKey().defaultRandom(),
  title: text('title').notNull(),
  description: text('description'),
  videoUrl: text('video_url').notNull(),
  thumbnailUrl: text('thumbnail_url'),
  authorId: text('author_id')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
  universeId: uuid('universe_id')
    .references(() => universes.id, { onDelete: 'cascade' }), // Может быть не привязан к конкретной
  viewsCount: integer('views_count').notNull().default(0),
  likesCount: integer('likes_count').notNull().default(0),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

export const shortsLikes = pgTable(
  'shorts_likes',
  {
    shortId: uuid('short_id')
      .notNull()
      .references(() => shorts.id, { onDelete: 'cascade' }),
    userId: text('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [primaryKey({ columns: [t.shortId, t.userId] })]
);

export const crystalTransactions = pgTable('crystal_transactions', {
  id: uuid('id').primaryKey().defaultRandom(),
  senderId: text('sender_id')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
  receiverId: text('receiver_id')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
  amount: integer('amount').notNull(),
  shortId: uuid('short_id').references(() => shorts.id, { onDelete: 'set null' }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

// --- Фаза 8: Глобальные Комнаты (WebRTC / LiveKit) ---
export const spaceTypeEnum = pgEnum('space_type', ['audio', 'video']);

export const liveSpaces = pgTable('live_spaces', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  description: text('description'),
  type: spaceTypeEnum('type').notNull().default('audio'),
  creatorId: text('creator_id')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
  /** Если комната создана внутри сферы - привязываем её к сфере. Если null - это глобальная комната. */
  universeId: uuid('universe_id')
    .references(() => universes.id, { onDelete: 'cascade' }),
  isPrivate: boolean('is_private').notNull().default(false),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  endedAt: timestamp('ended_at', { withTimezone: true }),
});

export const liveSpaceParticipants = pgTable('live_space_participants', {
  spaceId: uuid('space_id')
    .notNull()
    .references(() => liveSpaces.id, { onDelete: 'cascade' }),
  userId: text('user_id')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
  role: text('role').notNull().default('speaker'), // 'speaker', 'listener', 'admin'
  joinedAt: timestamp('joined_at', { withTimezone: true }).defaultNow().notNull(),
  leftAt: timestamp('left_at', { withTimezone: true }),
}, (t) => [primaryKey({ columns: [t.spaceId, t.userId] })]);
