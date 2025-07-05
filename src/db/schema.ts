import { pgTable, timestamp, varchar, text, pgEnum } from "drizzle-orm/pg-core";
import { user } from "./auth-schema.js";

export const roleEnum = pgEnum("role", ["admin", "member"]);

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

export const channel = pgTable("channel", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  name: varchar("name").notNull(),
  workspaceId: text("workspace_id").references(() => workspace.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const workspaceMembers = pgTable("workspace_members", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  workspaceId: text("workspace_id").references(() => workspace.id),
  userId: text("user_id").references(() => user.id),
  role: roleEnum("role").default("member"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const channelMembers = pgTable("channel_members", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  channelId: text("channel_id").references(() => channel.id),
  userId: text("user_id").references(() => user.id),
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
