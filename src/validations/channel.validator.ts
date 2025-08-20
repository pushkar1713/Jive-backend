import { z } from "zod";

const createChannelSchema = z.object({
  workspaceId: z.string(),
  name: z.string(),
  type: z.enum(["chat", "convene"]),
  permission: z.enum(["public", "private"]),
  isDefault: z.boolean(),
});

const createDMChannelSchema = z.object({
  targetUserId: z.string(),
  workspaceId: z.string(),
});

type CreateChannelType = z.infer<typeof createChannelSchema>;
type CreateDMChannelType = z.infer<typeof createDMChannelSchema>;

export {
  createChannelSchema,
  CreateChannelType,
  createDMChannelSchema,
  CreateDMChannelType,
};
