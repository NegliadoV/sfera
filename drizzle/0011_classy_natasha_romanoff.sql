CREATE TABLE "crystal_transactions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"sender_id" text NOT NULL,
	"receiver_id" text NOT NULL,
	"amount" integer NOT NULL,
	"short_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "crystals" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "crystal_transactions" ADD CONSTRAINT "crystal_transactions_sender_id_user_id_fk" FOREIGN KEY ("sender_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "crystal_transactions" ADD CONSTRAINT "crystal_transactions_receiver_id_user_id_fk" FOREIGN KEY ("receiver_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "crystal_transactions" ADD CONSTRAINT "crystal_transactions_short_id_shorts_id_fk" FOREIGN KEY ("short_id") REFERENCES "public"."shorts"("id") ON DELETE set null ON UPDATE no action;