ALTER TABLE "direct_messages" ADD COLUMN IF NOT EXISTS "attachment_url" text;
ALTER TABLE "direct_messages" ADD COLUMN IF NOT EXISTS "attachment_type" text;
