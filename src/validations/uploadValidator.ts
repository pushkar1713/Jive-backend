import { z } from "zod";

const messageAttachmentSchema = z.object({
  fileName: z.string().min(1),
  contentType: z.string().min(1),
  size: z.number().min(1),
});

type MessageAttachment = z.infer<typeof messageAttachmentSchema>;

export const uploadValidator = {
  messageAttachmentSchema,
};

export type { MessageAttachment };
