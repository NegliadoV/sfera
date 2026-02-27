/**
 * Базовый интерфейс для провайдеров агрегации контента
 */
export interface AggregatedContentItem {
  title: string;
  url?: string;
  body?: string;
  imageUrl?: string; // URL изображения (обложка, превью)
  type: 'link' | 'article' | 'video' | 'podcast';
  publishedAt?: Date;
  externalAuthor?: string;
  tags?: string[];
}

export interface AggregatorProvider {
  fetch(url: string, config?: Record<string, unknown>): Promise<AggregatedContentItem[]>;
}
