import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { pushSubscriptions } from '@/lib/db/schema';
import { auth } from '@/auth';
import { eq, and } from 'drizzle-orm';

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { endpoint } = await req.json();
    
    if (!endpoint) {
      return NextResponse.json({ error: 'Endpoint missing' }, { status: 400 });
    }

    await db.delete(pushSubscriptions)
      .where(and(
        eq(pushSubscriptions.userId, session.user.id),
        eq(pushSubscriptions.endpoint, endpoint)
      ));

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Push Unsubscribe Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
