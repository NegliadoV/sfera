-- Добавить поле icon в таблицу universes для хранения иконки сферы
ALTER TABLE "public"."universes" ADD COLUMN IF NOT EXISTS "icon" text;
