CREATE TYPE "public"."space_type" AS ENUM('audio', 'video');--> statement-breakpoint
CREATE TABLE "live_space_participants" (
	"space_id" uuid NOT NULL,
	"user_id" text NOT NULL,
	"role" text DEFAULT 'speaker' NOT NULL,
	"joined_at" timestamp with time zone DEFAULT now() NOT NULL,
	"left_at" timestamp with time zone,
	CONSTRAINT "live_space_participants_space_id_user_id_pk" PRIMARY KEY("space_id","user_id")
);
--> statement-breakpoint
CREATE TABLE "live_spaces" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"type" "space_type" DEFAULT 'audio' NOT NULL,
	"creator_id" text NOT NULL,
	"universe_id" uuid,
	"is_private" boolean DEFAULT false NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"ended_at" timestamp with time zone
);
--> statement-breakpoint
ALTER TABLE "live_space_participants" ADD CONSTRAINT "live_space_participants_space_id_live_spaces_id_fk" FOREIGN KEY ("space_id") REFERENCES "public"."live_spaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "live_space_participants" ADD CONSTRAINT "live_space_participants_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "live_spaces" ADD CONSTRAINT "live_spaces_creator_id_user_id_fk" FOREIGN KEY ("creator_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "live_spaces" ADD CONSTRAINT "live_spaces_universe_id_universes_id_fk" FOREIGN KEY ("universe_id") REFERENCES "public"."universes"("id") ON DELETE cascade ON UPDATE no action;