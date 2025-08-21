ALTER TABLE "message_attachments" DROP CONSTRAINT "message_attachments_message_id_messages_id_fk";
--> statement-breakpoint
ALTER TABLE "channel" ADD COLUMN "is_dm" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "message_attachments" ADD CONSTRAINT "message_attachments_message_id_messages_id_fk" FOREIGN KEY ("message_id") REFERENCES "public"."messages"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "messages" DROP COLUMN "image";