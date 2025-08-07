import { Request, Response } from "express";
import { db } from "../index.js";
import { channel, channelMembers } from "../db/schema.js";
import { eq } from "drizzle-orm";

export class ChannelController {
  static async getChannelsOfWorkspace(
    req: Request,
    res: Response,
  ): Promise<void> {
    const { workspaceId } = req.params as { workspaceId: string };
    if (!workspaceId) {
      res.status(400).json({ message: "Workspace ID is required" });
      return;
    }
    try {
      const result = await db
        .select()
        .from(channel)
        .where(eq(channel.workspaceId, workspaceId));
      res.status(200).json(result);
      return;
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Internal server error" });
      return;
    }
  }
  static async createChannel(req: Request, res: Response): Promise<void> {
    const { workspaceId, name, type, isDefault } = req.body as {
      workspaceId: string;
      name: string;
      type: "chat" | "convene";
      isDefault: boolean;
    };
    if (!workspaceId || !name) {
      res
        .status(400)
        .json({ message: "either workspaceId or name is missing" });
      return;
    }
    try {
      const result = await db
        .insert(channel)
        .values({
          workspaceId,
          name,
          type,
          isDefault,
        })
        .returning();
      res.status(200).json({ message: "Channel created", result });
      return;
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Internal server error" });
      return;
    }
  }
  static async addMemberToChannel(req: Request, res: Response): Promise<void> {
    const { channelId, memberId } = req.body as {
      channelId: string;
      memberId: string;
    };
    if (!channelId || !memberId) {
      res
        .status(400)
        .json({ message: "either channelId or memberId is missing" });
      return;
    }
    try {
      const result = await db
        .insert(channelMembers)
        .values({
          channelId,
          userId: memberId,
        })
        .returning();
      res.status(200).json({ message: "Member added to channel", result });
      return;
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Internal server error" });
      return;
    }
  }
}
