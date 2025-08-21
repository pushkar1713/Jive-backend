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
import { ErrorFactory, BaseError } from "../error.js";
import { globalErrorHandler } from "../globalErrorHandler.js";
import { apiResponse } from "../globalResponseHandler.js";

export class MessageController {
  static async getMessages(req: Request, res: Response): Promise<void> {
    try {
      const { channelId, workspaceId, page } = req.body as GetMessagesPayload;
      const userId = req.user?.id;

      if (!userId) {
        throw ErrorFactory.unauthorized();
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

      if (messageData.length === 0) {
        throw ErrorFactory.notFound("No messages found");
      }

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

      apiResponse(res, {
        statusCode: 200,
        message: "Messages fetched successfully",
        data: transformedMessageData,
      });
      return;
    } catch (error) {
      globalErrorHandler(error as BaseError, req, res);
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
        throw ErrorFactory.unauthorized();
      }

      const isWorkspaceMember = await workspaceMembership(workspaceId, userId);
      const isChannelMember = await channelMembership(channelId, userId);

      if (!isWorkspaceMember || !isChannelMember) {
        throw ErrorFactory.unauthorized();
      }

      await db
        .delete(messages)
        .where(and(eq(messages.id, messageId), eq(messages.senderId, userId)));

      apiResponse(res, {
        statusCode: 200,
        message: "Message deleted",
      });
      return;
    } catch (error) {
      globalErrorHandler(error as BaseError, req, res);
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
        throw ErrorFactory.unauthorized();
      }

      const isWorkspaceMember = await workspaceMembership(workspaceId, userId);
      const isChannelMember = await channelMembership(channelId, userId);

      if (!isWorkspaceMember || !isChannelMember) {
        throw ErrorFactory.unauthorized();
      }

      const message = await db
        .select()
        .from(messages)
        .where(eq(messages.id, messageId));

      if (message.length === 0) {
        throw ErrorFactory.notFound("Message not found");
      }

      if (message[0].senderId !== userId) {
        throw ErrorFactory.unauthorized();
      }

      await db
        .update(messages)
        .set({ content })
        .where(and(eq(messages.id, messageId), eq(messages.senderId, userId)));

      apiResponse(res, {
        statusCode: 200,
        message: "Message updated",
      });
      return;
    } catch (error) {
      globalErrorHandler(error as BaseError, req, res);
    }
  }
}
