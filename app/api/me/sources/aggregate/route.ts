import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { aggregateUserSync } from '@/lib/aggregator/user-functions';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

export async function POST() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const result = await aggregateUserSync(session.user.id);
    return NextResponse.json({
      message: 'Aggregation completed',
      processed: result.processed,
    });
  } catch (e) {
    console.error('POST /api/me/sources/aggregate', e);
    const errorMsg = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: `Failed to aggregate: ${errorMsg}` }, { status: 500 });
  }
}
