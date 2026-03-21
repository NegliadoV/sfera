import { notFound } from 'next/navigation';
import { auth } from '@/auth';
import { db, universes, universeMembers, universeSubscriptions } from '@/lib/db';
import { eq, and } from 'drizzle-orm';
import { normalizeUniverseSlug } from '@/lib/universe-slug';
import { SubscribePaywall } from './SubscribePaywall';

export default async function UniverseSlugLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ slug: string }>;
}) {
  const slug = normalizeUniverseSlug((await params).slug);
  if (!slug) notFound();

  const [u] = await db.select().from(universes).where(eq(universes.slug, slug)).limit(1);
  if (!u) notFound();

  if (!u.isPrivate) {
    return <>{children}</>;
  }

  const session = await auth();
  if (!session?.user?.id) {
    return <SubscribePaywall universe={u} />;
  }

  // Check owner
  if (u.ownerId === session.user.id) {
    return <>{children}</>;
  }

  // Check moderator/member role
  const [member] = await db
    .select({ role: universeMembers.role })
    .from(universeMembers)
    .where(and(eq(universeMembers.universeId, u.id), eq(universeMembers.userId, session.user.id)))
    .limit(1);

  if (member?.role === 'owner' || member?.role === 'moderator') {
    return <>{children}</>;
  }

  // Check subscription
  const [subscription] = await db
    .select()
    .from(universeSubscriptions)
    .where(and(eq(universeSubscriptions.universeId, u.id), eq(universeSubscriptions.userId, session.user.id)))
    .limit(1);

  if (subscription?.status === 'active') {
    // Check if it's expired
    if (subscription.currentPeriodEnd && new Date() > subscription.currentPeriodEnd) {
      return <SubscribePaywall universe={u} expired />;
    }
    return <>{children}</>;
  }

  return <SubscribePaywall universe={u} />;
}
