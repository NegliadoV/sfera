-- Очередь задач агрегатора (PostgreSQL, без Redis)
CREATE TABLE IF NOT EXISTS "aggregator_jobs" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "universe_id" uuid NOT NULL REFERENCES "universes"("id") ON DELETE CASCADE,
  "status" text DEFAULT 'pending' NOT NULL,
  "result" jsonb,
  "error" text,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "started_at" timestamp with time zone,
  "completed_at" timestamp with time zone
);

CREATE INDEX IF NOT EXISTS "aggregator_jobs_status_idx" ON "aggregator_jobs" ("status") WHERE status = 'pending';
