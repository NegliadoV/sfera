import { NextRequest, NextResponse } from 'next/server';
import { db, contentPollVotes } from '@/lib/db';
import { eq } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id: pollId } = await params;
  if (!pollId) {
    return NextResponse.json({ error: 'Poll ID is required' }, { status: 400 });
  }

  try {
    const allVotes = await db.query.contentPollVotes.findMany({
      where: eq(contentPollVotes.pollId, pollId),
    });

    return NextResponse.json(allVotes);
  } catch (error) {
    console.error('Failed to get votes:', error);
    return NextResponse.json({ error: 'Failed to get votes' }, { status: 500 });
  }
}
