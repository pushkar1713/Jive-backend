import { Request, Response } from "express";
import { db } from "../index.js";
import {
  channel,
  channelMembers,
  workspaceChannels,
  workspaceMembers,
} from "../db/schema.js";
import { eq, and, or, aliasedTable } from "drizzle-orm";
import {
  CreateChannelType,
  CreateDMChannelType,
} from "../validations/channel.validator.js";
import { getDMChannel } from "../services/getDM.js";
import { BaseError, ErrorFactory } from "../error.js";
import { globalErrorHandler } from "../globalErrorHandler.js";
import { apiResponse } from "../globalResponseHandler.js";

export class ChannelController {
  static async createChannel(req: Request, res: Response): Promise<void> {
    const { workspaceId, name, permission, type, isDefault } =
      req.body as CreateChannelType;
    if (!workspaceId || !name) {
      throw ErrorFactory.badRequest("either workspaceId or name is missing");
    }
    try {
      const result = await db.transaction(async (tx) => {
        const channelData = await tx
          .insert(channel)
          .values({
            workspaceId,
            name,
            type,
            channelPermission: permission,
            isDefault,
          })
          .returning();

        const members = await tx
          .insert(channelMembers)
          .values({
            channelId: channelData[0].id,
            userId: req.user?.id,
            role: "admin",
          })
          .returning();

        return { channel: channelData[0], members };
      });

      if (!result) {
        throw ErrorFactory.dbOperation("failed to create channel");
      }

      apiResponse(res, {
        statusCode: 200,
        message: "Channel created",
        data: result,
      });
      return;
    } catch (error) {
      globalErrorHandler(error as BaseError, req, res);
    }
  }

  static async createDMChannel(req: Request, res: Response): Promise<void> {
    const userId = req.user?.id;
    if (!userId) {
      throw ErrorFactory.badRequest("User ID is missing");
    }
    const { targetUserId, workspaceId } = req.body as CreateDMChannelType;
    if (!targetUserId || !workspaceId) {
      throw ErrorFactory.badRequest("targetUserId or workspaceId is missing");
    }

    if (userId === targetUserId) {
      throw ErrorFactory.badRequest(
        "You cannot create a DM channel with yourself",
      );
    }

    const dmChannel = await getDMChannel({
      userId,
      targetUserId,
      workspaceId,
    });

    if (dmChannel.success) {
      apiResponse(res, {
        statusCode: 200,
        message: "DM channel already exists",
        data: dmChannel.result,
      });
      return;
    }
    try {
      const result = await db.transaction(async (tx) => {
        const sortedUserIds = [userId, targetUserId].sort();
        const channelData = await tx
          .insert(channel)
          .values({
            name: `${sortedUserIds[0]}-${sortedUserIds[1]}`,
            workspaceId,
            channelPermission: "private",
            type: "chat",
            isDefault: false,
            isDM: true,
          })
          .returning();

        const members = await tx
          .insert(channelMembers)
          .values({
            channelId: channelData[0].id,
            userId,
            role: "admin",
          })
          .returning();

        const secondMember = await tx
          .insert(channelMembers)
          .values({
            channelId: channelData[0].id,
            userId: targetUserId,
            role: "admin",
          })
          .returning();

        return {
          channel: channelData[0],
          members: [members[0], secondMember[0]],
        };
      });

      if (!result) {
        throw ErrorFactory.dbOperation("failed to create DM channel");
      }

      apiResponse(res, {
        statusCode: 200,
        message: "DM channel created",
        data: result,
      });
      return;
    } catch (error) {
      globalErrorHandler(error as BaseError, req, res);
    }
  }
  static async joinPublicChannel(req: Request, res: Response): Promise<void> {
    const { channelId, workspaceId } = req.body as {
      channelId: string;
      workspaceId: string;
    };
    if (!channelId || !workspaceId) {
      throw ErrorFactory.badRequest("channelId is missing");
    }
    if (!req.user?.id) {
      throw ErrorFactory.unauthorized();
    }
    const channelType = await db
      .select()
      .from(channel)
      .where(eq(channel.id, channelId));
    if (channelType[0].channelPermission === "private") {
      throw ErrorFactory.badRequest("Channel is private");
    }

    const isMemberWorkspace = await db
      .select()
      .from(workspaceMembers)
      .where(
        and(
          eq(workspaceMembers.workspaceId, workspaceId),
          eq(workspaceMembers.userId, req.user?.id),
        ),
      );
    if (isMemberWorkspace.length === 0) {
      throw ErrorFactory.badRequest("User is not a member of the workspace");
    }

    const isMemberChannel = await db
      .select()
      .from(channelMembers)
      .where(
        and(
          eq(channelMembers.channelId, channelId),
          eq(channelMembers.userId, req.user?.id),
        ),
      );
    if (isMemberChannel.length > 0) {
      throw ErrorFactory.badRequest("User is already a member of the channel");
    }

    try {
      const result = await db
        .insert(channelMembers)
        .values({
          channelId,
          userId: req.user?.id,
          role: "member",
        })
        .returning();
      if (!result) {
        throw ErrorFactory.dbOperation("failed to join public channel");
      }
      apiResponse(res, {
        statusCode: 200,
        message: "Joined public channel",
        data: result,
      });
      return;
    } catch (error) {
      globalErrorHandler(error as BaseError, req, res);
    }
  }
}
