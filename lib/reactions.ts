export const REACTION_TYPES = [
  'confirm_source',
  'please_clarify',
  'important_counterargument',
] as const;

export type ReactionType = (typeof REACTION_TYPES)[number];

export const REACTION_LABELS: Record<ReactionType, string> = {
  confirm_source: 'Подтверждаю источником',
  please_clarify: 'Прошу разъяснить',
  important_counterargument: 'Важный контраргумент',
};

export const COMMENT_TYPES = ['thesis', 'counterargument', 'question'] as const;
export type CommentType = (typeof COMMENT_TYPES)[number];

export const COMMENT_LABELS: Record<CommentType, string> = {
  thesis: 'Тезис',
  counterargument: 'Контраргумент',
  question: 'Вопрос',
};
