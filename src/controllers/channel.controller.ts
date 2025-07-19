import { Request, Response } from "express";
import { db } from "../index.js";
import { channel } from "../db/schema.js";
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
}
