-- Add 'telegram' to source_provider enum (required for Telegram aggregator source)
ALTER TYPE "public"."source_provider" ADD VALUE IF NOT EXISTS 'telegram';
