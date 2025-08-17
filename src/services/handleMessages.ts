import { messageAttachments, messages } from "../db/schema.js";
import { db } from "../index.js";

type CreateMessageData = {
  content: string;
  channelId: string;
  workspaceId: string;
  senderId: string;
};

type CreateAttachmentData = {
  key: string;
  contentType: string;
  size: number;
  messageId: string;
};

export const handleMessages = async (data: CreateMessageData) => {
  try {
    const { content, channelId, workspaceId, senderId } = data;

    const message = await db
      .insert(messages)
      .values({
        content,
        channelId,
        workspaceId,
        senderId,
      })
      .returning();

    return message[0];
  } catch (error) {
    console.error(error);
    throw error;
  }
};

export const handleAttachments = async (data: CreateAttachmentData) => {
  try {
    const { key, contentType, size, messageId } = data;

    const attachment = await db
      .insert(messageAttachments)
      .values({
        key,
        contentType,
        size,
        messageId,
      })
      .returning();

    return attachment[0];
  } catch (error) {
    console.error(error);
    throw error;
  }
};
