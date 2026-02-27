import Link from 'next/link';

interface ContentLink {
  id: string;
  linkType: 'contradicts' | 'develops' | 'related';
  fromContentId: string;
  toContentId: string;
  note?: string | null;
  relatedTitle?: string | null;
}

interface ContentLinksProps {
  links: ContentLink[];
  currentContentId: string;
  slug: string;
}

const linkTypeLabels: Record<ContentLink['linkType'], string> = {
  contradicts: 'Противоречит',
  develops: 'Развивает',
  related: 'Связано',
};

const linkTypeColors: Record<ContentLink['linkType'], string> = {
  contradicts: 'rgba(239, 68, 68, 0.1)',
  develops: 'rgba(16, 185, 129, 0.1)',
  related: 'rgba(59, 130, 246, 0.1)',
};

export function ContentLinks({ links, currentContentId, slug }: ContentLinksProps) {
  const relatedLinks = links.filter(
    (link) =>
      (link.fromContentId === currentContentId || link.toContentId === currentContentId) &&
      link.relatedTitle
  );

  if (relatedLinks.length === 0) return null;

  return (
    <div
      className="rounded-[var(--radius-xl)] p-6 mb-8 border"
      style={{
        backgroundColor: 'var(--card-bg)',
        borderColor: 'var(--border-color)',
      }}
    >
      <h2 className="text-lg font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>
        Связанные материалы
      </h2>
      <ul className="space-y-2">
        {relatedLinks.map((link) => {
          const relatedContentId =
            link.fromContentId === currentContentId ? link.toContentId : link.fromContentId;
          const linkType = link.linkType;

          return (
            <li key={link.id}>
              <Link
                href={`/universes/${slug}/content/${relatedContentId}`}
                className="block p-3 rounded-[var(--radius-md)] border no-underline transition-colors hover:bg-[var(--hover-color)]"
                style={{
                  backgroundColor: 'var(--bg-secondary)',
                  borderColor: 'var(--border-color)',
                  color: 'var(--text-primary)',
                }}
              >
                <div className="flex items-start gap-2">
                  <span
                    className="px-2 py-0.5 rounded text-xs font-medium shrink-0"
                    style={{
                      backgroundColor: linkTypeColors[linkType],
                      color: 'var(--text-primary)',
                    }}
                  >
                    {linkTypeLabels[linkType]}
                  </span>
                  <div className="flex-1">
                    <div className="font-medium">{link.relatedTitle}</div>
                    {link.note && (
                      <div className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
                        {link.note}
                      </div>
                    )}
                  </div>
                </div>
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
