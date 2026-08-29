import { getSessionForServerComponent } from '@/lib/session';
import { db, mindMaps } from '@/lib/db';
import { eq, desc } from 'drizzle-orm';
import { redirect } from 'next/navigation';
import { MindMapsPageClient } from './MindMapsPageClient';

export const dynamic = 'force-dynamic';

export default async function PersonalMindMapsPage() {
  const session = await getSessionForServerComponent();
  if (!session?.user?.id) {
    redirect('/auth/signin?callbackUrl=/me/mind-maps');
  }

  const mapsList = await db
    .select()
    .from(mindMaps)
    .where(eq(mindMaps.createdById, session.user.id))
    .orderBy(desc(mindMaps.updatedAt));

  return <MindMapsPageClient mapsList={mapsList} />;
}
