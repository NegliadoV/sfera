import { NextRequest, NextResponse } from 'next/server';
import { getSessionForRequest } from '@/lib/session';
import { db, contentPolls, contentPollVotes } from '@/lib/db';
import { eq, and } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSessionForRequest(req);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id: pollId } = await params;
  if (!pollId) {
    return NextResponse.json({ error: 'Poll ID is required' }, { status: 400 });
  }

  try {
    const { optionId } = await req.json();
    if (!optionId || typeof optionId !== 'string') {
      return NextResponse.json({ error: 'optionId is required' }, { status: 400 });
    }

    // Check if the poll exists
    const poll = await db.query.contentPolls.findFirst({
      where: eq(contentPolls.id, pollId),
    });

    if (!poll) {
      return NextResponse.json({ error: 'Poll not found' }, { status: 404 });
    }

    // Verify optionId is valid for this poll
    const options = poll.options as Array<{ id: string; text: string }>;
    if (!options.some((o) => o.id === optionId)) {
      return NextResponse.json({ error: 'Invalid optionId for this poll' }, { status: 400 });
    }

    // Check if user already voted in this poll
    const existingVote = await db.query.contentPollVotes.findFirst({
      where: and(
        eq(contentPollVotes.pollId, pollId),
        eq(contentPollVotes.userId, session.user.id)
      ),
    });

    if (existingVote) {
      // The user already voted, optionally we could allow changing the vote,
      // but typical polls are immutable. We'll return 400 for now.
      return NextResponse.json({ error: 'You have already voted in this poll' }, { status: 400 });
    }

    // Record the vote
    await db.insert(contentPollVotes).values({
      pollId,
      optionId,
      userId: session.user.id,
    });

    // Fetch the updated vote counts to return
    const allVotes = await db.query.contentPollVotes.findMany({
      where: eq(contentPollVotes.pollId, pollId),
    });

    return NextResponse.json({ success: true, votes: allVotes });
  } catch (error) {
    console.error('Failed to register vote:', error);
    return NextResponse.json({ error: 'Failed to register vote' }, { status: 500 });
  }
}
