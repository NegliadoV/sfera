import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { user, crystalTransactions } from '@/lib/db/schema';
import { eq, sql } from 'drizzle-orm';
import { getSessionForRequest } from '@/lib/session';
import { NextRequest } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const session = await getSessionForRequest(req);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const senderId = session.user.id;
    
    const body = await req.json();
    const { receiverId, amount, shortId } = body;

    if (!receiverId || !amount || typeof amount !== 'number' || amount <= 0) {
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
    }

    if (senderId === receiverId) {
      return NextResponse.json({ error: 'Cannot send crystals to yourself' }, { status: 400 });
    }

    // Wrap in transaction
    const result = await db.transaction(async (tx) => {
      // 1. Check sender balance
      const [sender] = await tx
        .select({ crystals: user.crystals })
        .from(user)
        .where(eq(user.id, senderId));
      
      if (!sender || sender.crystals < amount) {
        throw new Error('Insufficient balance');
      }

      // 2. Deduct from sender
      await tx
        .update(user)
        .set({ crystals: sql`${user.crystals} - ${amount}` })
        .where(eq(user.id, senderId));

      // 3. Add to receiver
      await tx
        .update(user)
        .set({ crystals: sql`${user.crystals} + ${amount}` })
        .where(eq(user.id, receiverId));

      // 4. Log transaction
      await tx.insert(crystalTransactions).values({
        senderId,
        receiverId,
        amount,
        shortId: shortId || null,
      });

      return { success: true };
    });

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Crystals transfer error:', error);
    if (error.message === 'Insufficient balance') {
      return NextResponse.json({ error: error.message }, { status: 402 }); // Payment required
    }
    return NextResponse.json({ error: 'Transfer failed' }, { status: 500 });
  }
}
