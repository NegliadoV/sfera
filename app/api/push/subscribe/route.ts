import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { pushSubscriptions } from '@/lib/db/schema';
import { auth } from '@/auth';

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const subscription = await req.json();
    
    if (!subscription.endpoint || !subscription.keys?.p256dh || !subscription.keys?.auth) {
      return NextResponse.json({ error: 'Invalid subscription' }, { status: 400 });
    }

    await db.insert(pushSubscriptions).values({
      userId: session.user.id,
      endpoint: subscription.endpoint,
      p256dh: subscription.keys.p256dh,
      auth: subscription.keys.auth,
    }).onConflictDoUpdate({
      target: pushSubscriptions.endpoint,
      set: { 
        userId: session.user.id,
        p256dh: subscription.keys.p256dh,
        auth: subscription.keys.auth, 
      }
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Push Subscribe Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
