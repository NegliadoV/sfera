/**
 * Добавляет таблицы для контактов и личных сообщений (DM).
 * Запуск: npx tsx scripts/add-dm-contacts-tables.ts
 */
import 'dotenv/config';
import postgres from 'postgres';

const connectionString =
  process.env.DATABASE_URL ?? 'postgres://horizon:horizon_dev@localhost:5432/horizon';

async function main() {
  const sql = postgres(connectionString, { max: 1 });
  try {
    await sql.unsafe(`SET client_min_messages TO WARNING`);

    // contact_request_status enum
    await sql.unsafe(`
      DO $$ BEGIN
        CREATE TYPE "public"."contact_request_status" AS ENUM('pending', 'accepted', 'declined');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);
    console.log('OK: contact_request_status enum');

    // contact_requests
    await sql.unsafe(`
      CREATE TABLE IF NOT EXISTS "contact_requests" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
        "from_user_id" text NOT NULL REFERENCES "user"("id") ON DELETE CASCADE,
        "to_user_id" text NOT NULL REFERENCES "user"("id") ON DELETE CASCADE,
        "status" "contact_request_status" DEFAULT 'pending' NOT NULL,
        "created_at" timestamp with time zone DEFAULT now() NOT NULL
      );
    `);
    console.log('OK: contact_requests');

    // contacts
    await sql.unsafe(`
      CREATE TABLE IF NOT EXISTS "contacts" (
        "user_id_a" text NOT NULL REFERENCES "user"("id") ON DELETE CASCADE,
        "user_id_b" text NOT NULL REFERENCES "user"("id") ON DELETE CASCADE,
        "created_at" timestamp with time zone DEFAULT now() NOT NULL,
        PRIMARY KEY ("user_id_a", "user_id_b")
      );
    `);
    console.log('OK: contacts');

    // user_privacy_settings
    await sql.unsafe(`
      CREATE TABLE IF NOT EXISTS "user_privacy_settings" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
        "user_id" text NOT NULL UNIQUE REFERENCES "user"("id") ON DELETE CASCADE,
        "dm_only_contacts" boolean DEFAULT false NOT NULL,
        "created_at" timestamp with time zone DEFAULT now() NOT NULL,
        "updated_at" timestamp with time zone DEFAULT now() NOT NULL
      );
    `);
    console.log('OK: user_privacy_settings');

    // user_blocks
    await sql.unsafe(`
      CREATE TABLE IF NOT EXISTS "user_blocks" (
        "blocker_id" text NOT NULL REFERENCES "user"("id") ON DELETE CASCADE,
        "blocked_id" text NOT NULL REFERENCES "user"("id") ON DELETE CASCADE,
        "created_at" timestamp with time zone DEFAULT now() NOT NULL,
        PRIMARY KEY ("blocker_id", "blocked_id")
      );
    `);
    console.log('OK: user_blocks');

    // direct_message_conversations
    await sql.unsafe(`
      CREATE TABLE IF NOT EXISTS "direct_message_conversations" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
        "user_id_a" text NOT NULL REFERENCES "user"("id") ON DELETE CASCADE,
        "user_id_b" text NOT NULL REFERENCES "user"("id") ON DELETE CASCADE,
        "last_message_at" timestamp with time zone,
        "created_at" timestamp with time zone DEFAULT now() NOT NULL,
        UNIQUE ("user_id_a", "user_id_b")
      );
    `);
    console.log('OK: direct_message_conversations');

    // direct_messages
    await sql.unsafe(`
      CREATE TABLE IF NOT EXISTS "direct_messages" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
        "conversation_id" uuid NOT NULL REFERENCES "direct_message_conversations"("id") ON DELETE CASCADE,
        "sender_id" text NOT NULL REFERENCES "user"("id") ON DELETE CASCADE,
        "body" text NOT NULL,
        "created_at" timestamp with time zone DEFAULT now() NOT NULL,
        "read_at" timestamp with time zone
      );
    `);
    console.log('OK: direct_messages');

    console.log('Done: все таблицы DM/контактов добавлены.');
  } catch (e) {
    console.error(e);
    process.exit(1);
  } finally {
    await sql.end();
  }
}

main();
