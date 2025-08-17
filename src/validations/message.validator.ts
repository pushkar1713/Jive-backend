import { z } from "zod";

const messageSchema = z.object({
  content: z.string().min(1),
  channelId: z.string().min(1),
  workspaceId: z.string().min(1),
  senderId: z.string().min(1),
  attachments: z.boolean(),
  key: z.string().optional(),
  contentType: z.string().optional(),
  size: z.number().optional(),
});

export const messageValidator = {
  messageSchema,
};

export type MessagePayload = z.infer<typeof messageSchema>;
