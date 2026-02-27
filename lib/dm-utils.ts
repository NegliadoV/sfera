import { db, directMessageConversations, userBlocks, userPrivacySettings, contacts } from '@/lib/db';
import { eq, and, or } from 'drizzle-orm';

/** Canonical pair: userIdA < userIdB */
export function canonicalPair(a: string, b: string): [string, string] {
  return a < b ? [a, b] : [b, a];
}

/** Check if recipient blocked sender */
export async function isBlocked(blockerId: string, blockedId: string): Promise<boolean> {
  const [row] = await db
    .select()
    .from(userBlocks)
    .where(and(
      eq(userBlocks.blockerId, blockerId),
      eq(userBlocks.blockedId, blockedId)
    ))
    .limit(1);
  return !!row;
}

/** Check if recipient has dm_only_contacts and sender is not in contacts */
export async function canSendDm(senderId: string, recipientId: string): Promise<{ ok: boolean; reason?: string }> {
  const blocked = await isBlocked(recipientId, senderId);
  if (blocked) {
    return { ok: false, reason: 'blocked' };
  }

  const [privacy] = await db
    .select()
    .from(userPrivacySettings)
    .where(eq(userPrivacySettings.userId, recipientId))
    .limit(1);

  if (!privacy?.dmOnlyContacts) {
    return { ok: true };
  }

  const [a, b] = canonicalPair(senderId, recipientId);
  const [contact] = await db
    .select()
    .from(contacts)
    .where(and(eq(contacts.userIdA, a), eq(contacts.userIdB, b)))
    .limit(1);

  if (!contact) {
    return { ok: false, reason: 'contacts_only' };
  }
  return { ok: true };
}

/** Get or create conversation between two users. Returns conversation id. */
export async function getOrCreateConversation(userA: string, userB: string): Promise<string> {
  const [a, b] = canonicalPair(userA, userB);

  const [existing] = await db
    .select()
    .from(directMessageConversations)
    .where(and(
      eq(directMessageConversations.userIdA, a),
      eq(directMessageConversations.userIdB, b)
    ))
    .limit(1);

  if (existing) {
    return existing.id;
  }

  const [inserted] = await db
    .insert(directMessageConversations)
    .values({ userIdA: a, userIdB: b })
    .returning({ id: directMessageConversations.id });

  return inserted!.id;
}
