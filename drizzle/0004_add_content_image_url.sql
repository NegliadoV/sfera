-- Добавить поле image_url в таблицу content для хранения URL изображений из источников
ALTER TABLE "public"."content" ADD COLUMN IF NOT EXISTS "image_url" text;
