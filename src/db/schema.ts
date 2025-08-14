import {
  pgTable,
  timestamp,
  varchar,
  text,
  pgEnum,
  boolean,
  uniqueIndex,
  bigint,
} from "drizzle-orm/pg-core";
import { user } from "./auth-schema.js";
import { sql } from "drizzle-orm";

export const roleEnum = pgEnum("role", [
  "admin",
  "member",
  "moderator",
  "owner",
]);
export const channelTypeEnum = pgEnum("channelType", ["chat", "convene"]);
export const channelPermission = pgEnum("channelPermission", [
  "public",
  "private",
]);

export const workspace = pgTable("workspace", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  name: varchar("name").notNull(),
  description: text("description"),
  joincode: varchar("joincode", { length: 6 }).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const channel = pgTable(
  "channel",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    name: varchar("name").notNull(),
    workspaceId: text("workspace_id").references(() => workspace.id),
    channelPermission: channelPermission("channelPermission").default("public"),
    type: channelTypeEnum("channelType").notNull().default("chat"),
    isDefault: boolean("is_default").default(false),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow(),
  },
  (t) => [
    uniqueIndex("uniq_ws_default")
      .on(t.workspaceId)
      .where(sql`${t.isDefault} = true`),
  ],
);

export const workspaceMembers = pgTable("workspace_members", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  workspaceId: text("workspace_id").references(() => workspace.id),
  userId: text("user_id").references(() => user.id),
  role: roleEnum("role").default("member"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const workspaceChannels = pgTable("workspace_channels", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  workspaceId: text("workspace_id").references(() => workspace.id),
  channelId: text("channel_id").references(() => channel.id),
});

export const channelMembers = pgTable("channel_members", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  channelId: text("channel_id").references(() => channel.id),
  userId: text("user_id").references(() => user.id),
  role: roleEnum("role").default("member"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const messages = pgTable("messages", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  content: text("content").notNull(),
  image: text("image"),
  senderId: text("sender_id").references(() => user.id),
  channelId: text("channel_id").references(() => channel.id),
  workspaceId: text("workspace_id").references(() => workspace.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const messageAttachments = pgTable("message_attachments", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  messageId: text("message_id").references(() => messages.id),
  key: text("key").notNull(),
  contentType: text("content_type").notNull(),
  size: bigint("size", { mode: "number" }).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});
