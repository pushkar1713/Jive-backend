import { z } from "zod";
import { workspace } from "../db/schema.js";

export const permissionValidator = z.object({
  permission: z.enum(["admin", "user", "moderator", "owner", "member"]),
  userId: z.string(),
  workspaceId: z.string(),
  channelId: z.string(),
});

export type PermissionValidator = z.infer<typeof permissionValidator>;
