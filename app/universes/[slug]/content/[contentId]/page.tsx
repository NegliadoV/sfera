import Link from 'next/link';
import { notFound } from 'next/navigation';
import { auth } from '@/auth';
import { db, content, user, comments, reactions, contentLinks, sources, universes, universeMembers, contentPolls, contentPollVotes } from '@/lib/db';
import { normalizeUniverseSlug } from '@/lib/universe-slug';
import { eq, and, sql, or, inArray } from 'drizzle-orm';
import { DiscussionBlock } from '@/components/DiscussionBlock';
import { YouTubeEmbed } from '@/components/YouTubeEmbed';
import { MarkdownBody } from '@/components/MarkdownBody';
import { getYouTubeVideoId } from '@/lib/youtube';
import { isDirectVideoUrl } from '@/lib/video-url';
import { getProxiedImageSrc } from '@/lib/proxy-image';
import { ContentLinks } from './ContentLinks';
import { ContentPoll } from '@/components/ContentPoll';
import { ImageLightbox } from '@/components/ImageLightbox';
import { DeleteContentButton } from '../DeleteContentButton';
import { EditContentForm } from './EditContentForm';
import { PinUnpinButton } from './PinUnpinButton';

type Params = { slug: string; contentId: string };

export async function generateMetadata({ params }: { params: Promise<Params> }) {
  const { contentId } = await params;
  const [row] = await db
    .select({ title: content.title })
    .from(content)
    .where(eq(content.id, contentId));
  if (!row) return { title: 'Материал | Roominate' };
  return { title: `${row.title} | Roominate` };
}

export default async function UniverseContentPage({
  params,
  searchParams,
}: {
  params: Promise<Params>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const resolvedSearchParams = searchParams ? await searchParams : {};
  const p = await params;
  const slug = normalizeUniverseSlug(p.slug);
  const contentId = p.contentId;
  const showEditForm = resolvedSearchParams?.edit === '1';
  if (!slug) notFound();
  const session = await auth();

  const [contentRow] = await db
    .select({
      id: content.id,
      universeId: content.universeId,
      authorId: content.authorId,
      authorName: user.name,
      type: content.type,
      title: content.title,
      url: content.url,
      body: content.body,
      imageUrl: content.imageUrl,
      createdAt: content.createdAt,
      pinnedAt: content.pinnedAt,
      // Фаза 2: метаданные
      sourceId: content.sourceId,
      publishedAt: content.publishedAt,
      externalAuthor: content.externalAuthor,
      tags: content.tags,
    })
    .from(content)
    .leftJoin(user, eq(content.authorId, user.id))
    .where(eq(content.id, contentId));

  if (!contentRow) notFound();

  const commentsList = await db
    .select({
      id: comments.id,
      contentId: comments.contentId,
      authorId: comments.authorId,
      authorName: user.name,
      parentId: comments.parentId,
      type: comments.type,
      body: comments.body,
      createdAt: comments.createdAt,
    })
    .from(comments)
    .leftJoin(user, eq(comments.authorId, user.id))
    .where(eq(comments.contentId, contentId))
    .orderBy(comments.createdAt);

  const countsRows = await db
    .select({ reactionType: reactions.reactionType, count: sql<number>`count(*)::int` })
    .from(reactions)
    .where(
      and(eq(reactions.targetType, 'content'), eq(reactions.targetId, contentId))
    )
    .groupBy(reactions.reactionType);
  const counts: Record<string, number> = {};
  for (const r of countsRows) counts[r.reactionType] = r.count;
  let myReaction: string | null = null;
  if (session?.user?.id) {
    const [mine] = await db
      .select({ reactionType: reactions.reactionType })
      .from(reactions)
      .where(
        and(
          eq(reactions.targetType, 'content'),
          eq(reactions.targetId, contentId),
          eq(reactions.userId, session.user.id)
        )
      );
    myReaction = mine?.reactionType ?? null;
  }
  const reactionsData = { counts, myReaction };

  // Получаем связи контента
  const linksRaw = await db
    .select({
      id: contentLinks.id,
      linkType: contentLinks.linkType,
      fromContentId: contentLinks.fromContentId,
      toContentId: contentLinks.toContentId,
      note: contentLinks.note,
    })
    .from(contentLinks)
    .where(
      or(
        eq(contentLinks.fromContentId, contentId),
        eq(contentLinks.toContentId, contentId)
      )
    );

  // Получаем заголовки связанного контента
  const relatedContentIds = linksRaw
    .map((link) => (link.fromContentId === contentId ? link.toContentId : link.fromContentId))
    .filter((id, idx, arr) => arr.indexOf(id) === idx); // уникальные ID

  const relatedContent = relatedContentIds.length > 0
    ? await db
        .select({ id: content.id, title: content.title })
        .from(content)
        .where(inArray(content.id, relatedContentIds))
    : [];

  const contentMap = new Map(relatedContent.map((c) => [c.id, c.title]));
  const youtubeVideoId = contentRow.url ? getYouTubeVideoId(contentRow.url) : null;

  const links = linksRaw.map((link) => {
    const relatedId = link.fromContentId === contentId ? link.toContentId : link.fromContentId;
    return {
      ...link,
      relatedTitle: contentMap.get(relatedId) || null,
    };
  });

  // Получаем информацию об источнике, если есть
  let sourceInfo: { name: string; provider: string } | null = null;
  if (contentRow.sourceId) {
    const [source] = await db
      .select({ name: sources.name, provider: sources.provider })
      .from(sources)
      .where(eq(sources.id, contentRow.sourceId))
      .limit(1);
    if (source) {
      sourceInfo = source;
    }
  }

  // Получаем опрос, если есть
  const [pollData] = await db
    .select({
      id: contentPolls.id,
      options: contentPolls.options,
    })
    .from(contentPolls)
    .where(eq(contentPolls.contentId, contentId))
    .limit(1);

  let initialPollVotes: any[] = [];
  if (pollData) {
    initialPollVotes = await db
      .select()
      .from(contentPollVotes)
      .where(eq(contentPollVotes.pollId, pollData.id));
  }

  let canDelete = false;
  let canEdit = false;
  let canPin = false;
  if (session?.user?.id) {
    const [universe] = await db
      .select({ ownerId: universes.ownerId })
      .from(universes)
      .where(eq(universes.id, contentRow.universeId))
      .limit(1);
    if (universe) {
      const isOwner = universe.ownerId === session.user.id;
      const isSid = session.user.name === 'Сид';
      const [member] = await db
        .select({ role: universeMembers.role })
        .from(universeMembers)
        .where(
          and(
            eq(universeMembers.universeId, contentRow.universeId),
            eq(universeMembers.userId, session.user.id)
          )
        )
        .limit(1);
      const isModerator = member?.role === 'moderator' || member?.role === 'owner';
      canDelete = isOwner || isModerator || isSid;
      canEdit = contentRow.authorId === session.user.id || isModerator || isSid;
      canPin = isModerator || isSid;
    }
  }

  const displayAuthor = contentRow.externalAuthor || contentRow.authorName || 'Участник';
  const displayDate = contentRow.publishedAt ? new Date(contentRow.publishedAt) : new Date(contentRow.createdAt);
  
  // Проверяем и приводим теги к правильному типу
  const tagsArray = Array.isArray(contentRow.tags) ? (contentRow.tags as string[]) : null;

  const normalizeForComparison = (str: string) => {
    if (!str) return '';
    return str
      .replace(/<[^>]+>/g, ' ') // Strip HTML tags
      .replace(/&[a-z0-9#]+;/gi, ' ') // Strip HTML entities like &nbsp;
      .replace(/[^\p{L}\p{N}]+/gu, '') // Keep ONLY letters and numbers, remove all spaces/punctuation
      .toLowerCase();
  };

  const normTitle = normalizeForComparison(contentRow.title || '');
  const normBody = normalizeForComparison(contentRow.body || '');
  const titleNoEllipsis = (contentRow.title || '').replace(/[\.…]+$/, '');
  const normTitleNoEllipsis = normalizeForComparison(titleNoEllipsis);

  // If the normalized title is very short (e.g. "План"), it might accidentally match 
  // a body starting with "Планирование". So we require length > 15 for prefix match,
  // or an exact match regardless of length.
  const isDuplicate = Boolean(
    normTitle && normBody && (
      normTitle === normBody ||
      (normTitleNoEllipsis.length > 15 && normBody.startsWith(normTitleNoEllipsis)) ||
      (normTitle.length > 15 && normBody.startsWith(normTitle))
    )
  );

  return (
    <div className="platform-page">
      <div className="platform-breadcrumb mb-6">
        <Link href="/">Сферы</Link>
        <i className="fa-solid fa-chevron-right" style={{ fontSize: '0.65rem' }} aria-hidden />
        <Link href={`/universes/${slug}/content`}>Сфера</Link>
        <i className="fa-solid fa-chevron-right" style={{ fontSize: '0.65rem' }} aria-hidden />
        <span>{contentRow.title}</span>
      </div>
      {showEditForm && canEdit && (
        <EditContentForm
          contentId={contentId}
          slug={slug}
          initialTitle={contentRow.title}
          initialBody={contentRow.body}
          initialUrl={contentRow.url}
        />
      )}
      <article className="platform-card mb-8">
        <div>
          <div className="flex items-start justify-between gap-4 mb-2">
            {!isDuplicate ? (
              <h1 className="platform-hero-title platform-content-title flex items-center gap-2 flex-wrap flex-1 min-w-0">
                {contentRow.pinnedAt && (
                  <span title="Закреплён" className="text-lg">📌</span>
                )}
                {contentRow.title}
              </h1>
            ) : (
              <div className="flex items-center gap-2 flex-wrap flex-1 min-w-0">
                {contentRow.pinnedAt && (
                  <span title="Закреплён" className="text-lg">📌</span>
                )}
              </div>
            )}
            {canEdit && !showEditForm && (
              <Link
                href={`/universes/${slug}/content/${contentId}?edit=1`}
                className="platform-btn platform-btn-sm no-underline shrink-0 inline-flex items-center gap-2"
                title="Редактировать"
              >
                <i className="fa-solid fa-pen" aria-hidden />
                Редактировать
              </Link>
            )}
          </div>
          <div className="platform-card-desc text-sm mb-4 flex flex-wrap items-center gap-2">
            <span>{displayAuthor}</span>
            {session?.user?.id && contentRow.authorId && contentRow.authorId !== session.user.id && (
              <Link
                href={`/messages/${encodeURIComponent(contentRow.authorId)}`}
                className="text-xs"
                style={{ color: 'var(--accent-primary)', textDecoration: 'underline' }}
              >
                Написать автору
              </Link>
            )}
            <span>·</span>
            <time dateTime={displayDate.toISOString()} title={displayDate.toLocaleString('ru')}>
              {displayDate.toLocaleDateString('ru', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              })}
            </time>
            {sourceInfo && (
              <>
                <span>·</span>
                <span className="platform-tag" style={{ fontSize: '0.75rem' }}>
                  {sourceInfo.name} ({sourceInfo.provider})
                </span>
              </>
            )}
          </div>
          {tagsArray && tagsArray.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-4">
              {tagsArray.map((tag, idx) => (
                <span key={idx} className="platform-tag">
                  {tag}
                </span>
              ))}
            </div>
          )}
          {contentRow.url && (
            <div className="mb-4">
              {youtubeVideoId ? (
                <>
                  <YouTubeEmbed videoId={youtubeVideoId} title={contentRow.title} />
                  <a
                    href={contentRow.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="platform-btn platform-btn-sm mt-2 no-underline"
                  >
                    <i className="fa-brands fa-youtube" /> Открыть на YouTube
                  </a>
                </>
              ) : isDirectVideoUrl(contentRow.url) ? (
                <div className="video-embed-half">
                <div
                  className="relative w-full overflow-hidden rounded-[var(--radius-lg)] border my-4"
                  style={{
                    paddingBottom: '56.25%',
                    borderColor: 'var(--border-color)',
                    backgroundColor: 'var(--bg-accent)',
                  }}
                >
                  <video
                    src={contentRow.url}
                    controls
                    playsInline
                    className="absolute inset-0 w-full h-full"
                    style={{ objectFit: 'contain' }}
                  >
                    Ваш браузер не поддерживает воспроизведение видео.
                    <a href={contentRow.url} target="_blank" rel="noopener noreferrer">
                      Скачать видео
                    </a>
                  </video>
                </div>
                <a
                  href={contentRow.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="platform-btn platform-btn-sm mt-2 no-underline inline-flex"
                >
                  <i className="fa-solid fa-external-link-alt" /> Открыть видео в новой вкладке
                </a>
                </div>
              ) : contentRow.type === 'video' ? (
                <a
                  href={contentRow.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="platform-btn platform-btn-primary no-underline inline-flex items-center gap-2"
                >
                  <i className="fa-solid fa-play" /> Смотреть видео
                </a>
              ) : (
                <a
                  href={contentRow.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="platform-btn platform-btn-sm no-underline"
                >
                  <i className="fa-solid fa-link" /> {contentRow.url}
                </a>
              )}
            </div>
          )}
          {contentRow.body && (
            <div className="mb-4">
              <MarkdownBody content={contentRow.body} />
            </div>
          )}
          {pollData && (
            <ContentPoll
              pollId={pollData.id}
              options={pollData.options as any}
              initialVotes={initialPollVotes}
              pollAuthorId={contentRow.authorId ?? undefined}
            />
          )}
        </div>
      </article>
      {session?.user?.id && (
        <div className="mb-6 flex flex-wrap gap-4 items-center text-sm" style={{ color: 'var(--text-secondary)' }}>
          {canPin && (
            <PinUnpinButton
              contentId={contentId}
              pinned={!!contentRow.pinnedAt}
              className="platform-btn platform-btn-sm no-underline"
            />
          )}
          {canDelete && (
            <DeleteContentButton
              contentId={contentId}
              slug={slug}
              title={contentRow.title}
              className="platform-btn platform-btn-sm no-underline"
            />
          )}
        </div>
      )}
      {links.length > 0 && (
        <ContentLinks links={links} currentContentId={contentId} slug={slug} />
      )}
      <section id="discussion" aria-label="Обсуждение">
        {contentRow.imageUrl && (
          <div className="discussion-post-preview mb-6">
            <ImageLightbox
              src={getProxiedImageSrc(contentRow.imageUrl) ?? contentRow.imageUrl}
              originalSrc={contentRow.imageUrl}
              alt={contentRow.title}
              className="discussion-post-preview-image"
            />
          </div>
        )}
        <Link
          href={contentRow.sourceId ? `/universes/${slug}/sources/${contentRow.sourceId}` : `/universes/${slug}/content`}
          className="platform-btn platform-btn-sm no-underline mb-4 inline-flex"
        >
          Назад к постам
        </Link>
        <DiscussionBlock
          contentId={contentId}
          initialComments={commentsList}
          initialReactions={reactionsData}
          isAuthenticated={!!session?.user}
          currentUser={
            session?.user?.id
              ? { userId: session.user.id, userName: session.user.name ?? null }
              : null
          }
        />
      </section>
    </div>
  );
}
