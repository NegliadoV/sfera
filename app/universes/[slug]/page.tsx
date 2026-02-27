import { notFound, redirect } from 'next/navigation';
import { normalizeUniverseSlug } from '@/lib/universe-slug';

export const dynamic = 'force-dynamic';

export default async function UniversePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const slug = normalizeUniverseSlug((await params).slug);
  if (!slug) notFound();
  redirect(`/universes/${slug}/content`);
}
