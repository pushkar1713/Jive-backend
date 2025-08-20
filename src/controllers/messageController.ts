import { Request, Response } from "express";
import { GetMessagesPayload } from "../validations/message.validator.js";
import { db } from "../index.js";
import { messageAttachments, messages } from "../db/schema.js";
import { desc, eq, and } from "drizzle-orm";
import { UploadController } from "./upload.controller.js";
import {
  channelMembership,
  workspaceMembership,
} from "../services/checkMembership.js";

export class MessageController {
  static async getMessages(req: Request, res: Response): Promise<void> {
    try {
      const { channelId, workspaceId, page } = req.body as GetMessagesPayload;
      const userId = req.user?.id;

      if (!userId) {
        res.status(401).json({ message: "Unauthorized" });
        return;
      }

      const messageData = await db
        .select()
        .from(messages)
        .leftJoin(
          messageAttachments,
          eq(messages.id, messageAttachments.messageId),
        )
        .orderBy(desc(messages.createdAt))
        .where(
          and(
            eq(messages.channelId, channelId),
            eq(messages.workspaceId, workspaceId),
          ),
        )
        .limit(25)
        .offset((page - 1) * 25);

      const transformedMessageData = await Promise.all(
        messageData.map(async (message) => {
          let url: string | null = null;

          if (message.message_attachments) {
            url = await UploadController.getFileUrl(
              message.message_attachments.key,
            );
          }
          return {
            ...message,
            message_attachments: message.message_attachments
              ? {
                  ...message.message_attachments,
                  url,
                }
              : null,
          };
        }),
      );

      res.status(200).json({
        messages: transformedMessageData,
      });
      return;
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Internal server error" });
      return;
    }
  }

  static async deleteMessage(req: Request, res: Response): Promise<void> {
    try {
      const { messageId, workspaceId, channelId } = req.body as {
        messageId: string;
        workspaceId: string;
        channelId: string;
      };
      const userId = req.user?.id;

      if (!userId) {
        res.status(401).json({ message: "Unauthorized" });
        return;
      }

      const isWorkspaceMember = await workspaceMembership(workspaceId, userId);
      const isChannelMember = await channelMembership(channelId, userId);

      if (!isWorkspaceMember || !isChannelMember) {
        res.status(401).json({ message: "Unauthorized" });
        return;
      }

      await db
        .delete(messages)
        .where(and(eq(messages.id, messageId), eq(messages.senderId, userId)));

      res.status(200).json({ message: "Message deleted" });
      return;
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Internal server error" });
      return;
    }
  }

  static async updateMessage(req: Request, res: Response): Promise<void> {
    try {
      const { messageId, content, workspaceId, channelId } = req.body as {
        messageId: string;
        content: string;
        workspaceId: string;
        channelId: string;
      };

      const userId = req.user?.id;

      if (!userId) {
        res.status(401).json({ message: "Unauthorized" });
        return;
      }

      const isWorkspaceMember = await workspaceMembership(workspaceId, userId);
      const isChannelMember = await channelMembership(channelId, userId);

      if (!isWorkspaceMember || !isChannelMember) {
        res.status(401).json({ message: "Unauthorized" });
        return;
      }

      const message = await db
        .select()
        .from(messages)
        .where(eq(messages.id, messageId));

      if (message.length === 0) {
        res.status(404).json({ message: "Message not found" });
        return;
      }

      if (message[0].senderId !== userId) {
        res.status(401).json({ message: "Unauthorized" });
        return;
      }

      await db
        .update(messages)
        .set({ content })
        .where(and(eq(messages.id, messageId), eq(messages.senderId, userId)));

      res.status(200).json({ message: "Message updated" });
      return;
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Internal server error" });
      return;
    }
  }
}
