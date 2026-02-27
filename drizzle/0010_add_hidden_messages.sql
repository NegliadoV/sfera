-- Скрытые «у себя» сообщения (личка и группа)
CREATE TABLE IF NOT EXISTS "user_hidden_dm_messages" (
	"user_id" text NOT NULL,
	"message_id" uuid NOT NULL,
	CONSTRAINT "user_hidden_dm_messages_user_id_message_id_pk" PRIMARY KEY("user_id","message_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "user_hidden_group_messages" (
	"user_id" text NOT NULL,
	"message_id" uuid NOT NULL,
	CONSTRAINT "user_hidden_group_messages_user_id_message_id_pk" PRIMARY KEY("user_id","message_id")
);
--> statement-breakpoint
ALTER TABLE "user_hidden_dm_messages" ADD CONSTRAINT "user_hidden_dm_messages_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "user_hidden_dm_messages" ADD CONSTRAINT "user_hidden_dm_messages_message_id_direct_messages_id_fk" FOREIGN KEY ("message_id") REFERENCES "public"."direct_messages"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "user_hidden_group_messages" ADD CONSTRAINT "user_hidden_group_messages_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "user_hidden_group_messages" ADD CONSTRAINT "user_hidden_group_messages_message_id_group_chat_messages_id_fk" FOREIGN KEY ("message_id") REFERENCES "public"."group_chat_messages"("id") ON DELETE cascade ON UPDATE no action;
