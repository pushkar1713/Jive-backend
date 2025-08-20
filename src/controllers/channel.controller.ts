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

export class ChannelController {
  static async createChannel(req: Request, res: Response): Promise<void> {
    const { workspaceId, name, permission, type, isDefault } =
      req.body as CreateChannelType;
    if (!workspaceId || !name) {
      res
        .status(400)
        .json({ message: "either workspaceId or name is missing" });
      return;
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

      res.status(200).json({ message: "Channel created", result });
      return;
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Internal server error" });
      return;
    }
  }

  static async createDMChannel(req: Request, res: Response): Promise<void> {
    const userId = req.user?.id;
    if (!userId) {
      res.status(400).json({ message: "User ID is missing" });
      return;
    }
    const { targetUserId, workspaceId } = req.body as CreateDMChannelType;
    if (!targetUserId || !workspaceId) {
      res
        .status(400)
        .json({ message: "targetUserId or workspaceId is missing" });
      return;
    }

    if (userId === targetUserId) {
      res
        .status(400)
        .json({ message: "You cannot create a DM channel with yourself" });
      return;
    }

    const dmChannel = await getDMChannel({
      userId,
      targetUserId,
      workspaceId,
    });

    if (dmChannel.success) {
      res.status(200).json({
        message: "DM channel already exists",
        result: dmChannel.result,
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
      res.status(200).json({ message: "DM channel created", result });
      return;
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Internal server error" });
      return;
    }
  }
  static async joinPublicChannel(req: Request, res: Response): Promise<void> {
    const { channelId, workspaceId } = req.body as {
      channelId: string;
      workspaceId: string;
    };
    if (!channelId || !workspaceId) {
      res.status(400).json({ message: "channelId is missing" });
      return;
    }
    if (!req.user?.id) {
      res.status(400).json({ message: "User ID is missing" });
      return;
    }
    const channelType = await db
      .select()
      .from(channel)
      .where(eq(channel.id, channelId));
    if (channelType[0].channelPermission === "private") {
      res.status(400).json({ message: "Channel is private" });
      return;
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
      res
        .status(400)
        .json({ message: "User is not a member of the workspace" });
      return;
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
      res
        .status(400)
        .json({ message: "User is already a member of the channel" });
      return;
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
      res.status(200).json({ message: "Joined public channel", result });
      return;
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Internal server error" });
      return;
    }
  }
}
