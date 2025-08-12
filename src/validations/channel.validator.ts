import { z } from "zod";

const createChannelSchema = z.object({
  workspaceId: z.string(),
  name: z.string(),
  type: z.enum(["chat", "convene"]),
  permission: z.enum(["public", "private"]),
  isDefault: z.boolean(),
});

type CreateChannelType = z.infer<typeof createChannelSchema>;

export { createChannelSchema, CreateChannelType };
