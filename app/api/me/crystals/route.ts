import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { user } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { getSessionForRequest } from '@/lib/session';
import { NextRequest } from 'next/server';

export async function GET(req: NextRequest) {
  try {
    const session = await getSessionForRequest(req);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const [u] = await db
      .select({ crystals: user.crystals })
      .from(user)
      .where(eq(user.id, session.user.id));

    return NextResponse.json({ balance: u?.crystals ?? 0 });
  } catch (error) {
    console.error('Fetch crystals error:', error);
    return NextResponse.json({ error: 'Failed to fetch crystals' }, { status: 500 });
  }
}
