CREATE TYPE "public"."channelPermission" AS ENUM('public', 'private');--> statement-breakpoint
CREATE TYPE "public"."channelType" AS ENUM('chat', 'convene');--> statement-breakpoint
ALTER TYPE "public"."role" ADD VALUE 'moderator';--> statement-breakpoint
ALTER TYPE "public"."role" ADD VALUE 'owner';--> statement-breakpoint
CREATE TABLE "workspace_channels" (
	"id" text PRIMARY KEY NOT NULL,
	"workspace_id" text,
	"channel_id" text
);
--> statement-breakpoint
ALTER TABLE "channel" ADD COLUMN "channelPermission" "channelPermission" DEFAULT 'public';--> statement-breakpoint
ALTER TABLE "channel" ADD COLUMN "channelType" "channelType" DEFAULT 'chat' NOT NULL;--> statement-breakpoint
ALTER TABLE "channel" ADD COLUMN "is_default" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "channel_members" ADD COLUMN "role" "role" DEFAULT 'member';--> statement-breakpoint
ALTER TABLE "workspace_channels" ADD CONSTRAINT "workspace_channels_workspace_id_workspace_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspace"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workspace_channels" ADD CONSTRAINT "workspace_channels_channel_id_channel_id_fk" FOREIGN KEY ("channel_id") REFERENCES "public"."channel"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "uniq_ws_default" ON "channel" USING btree ("workspace_id") WHERE "channel"."is_default" = true;