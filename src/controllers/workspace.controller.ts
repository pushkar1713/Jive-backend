import { Request, Response } from "express";
import { createWorkspaceType } from "../validations/workspace.validator.js";
import { db } from "../index.js";
import {
  channel,
  workspace,
  workspaceMembers,
  channelMembers,
  workspaceChannels,
} from "../db/schema.js";
import { v4 as uuidv4 } from "uuid";
import { and, eq } from "drizzle-orm";
import { getWorkspaceByJoinCode } from "../services/getWorkspaceByCode.js";
import { checkOwner } from "../services/checkOwner.js";

export class WorkspaceController {
  static async createWorkspace(req: Request, res: Response): Promise<void> {
    const { name, description } = req.body as createWorkspaceType;
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }
    try {
      const workspaceData = await db.transaction(async (tx) => {
        const joinCode = uuidv4().substring(0, 6).toUpperCase();
        const workspacePayload = await tx
          .insert(workspace)
          .values({
            name,
            description,
            joincode: joinCode,
          })
          .returning();
        const workspaceMemberPayload = await tx
          .insert(workspaceMembers)
          .values({
            workspaceId: workspacePayload[0].id,
            userId,
            role: "owner",
          })
          .returning();
        const channelPayload = await tx
          .insert(channel)
          .values({
            workspaceId: workspacePayload[0].id,
            name: "general",
            type: "chat",
            isDefault: true,
          })
          .returning();
        return {
          workspace: workspacePayload,
          workspaceMember: workspaceMemberPayload,
          channel: channelPayload,
        };
      });
      res.status(201).json(workspaceData);
      return;
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Internal server error" });
      return;
    }
  }

  static async getWorkspacesOfUser(req: Request, res: Response): Promise<void> {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }
    try {
      const result = await db
        .select({
          workspace: workspaceMembers.workspaceId,
        })
        .from(workspaceMembers)
        .innerJoin(workspace, eq(workspaceMembers.workspaceId, workspace.id))
        .where(eq(workspaceMembers.userId, userId));
      res.status(200).json(result);
      return;
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Internal server error" });
      return;
    }
  }

  static async joinWorkspace(req: Request, res: Response): Promise<void> {
    const { joinCode } = req.params as { joinCode: string };
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }
    try {
      const workspace = await getWorkspaceByJoinCode(joinCode);
      console.log(workspace);
      if (workspace instanceof Error) {
        res.status(400).json({ message: "Invalid join code" });
        return;
      }

      const isMember = await db
        .select()
        .from(workspaceMembers)
        .where(
          and(
            eq(workspaceMembers.workspaceId, workspace[0].id),
            eq(workspaceMembers.userId, userId),
          ),
        );
      if (isMember.length > 0) {
        res.status(400).json({ message: "Already a member of this workspace" });
        return;
      }

      const addMember = await db
        .insert(workspaceMembers)
        .values({
          workspaceId: workspace[0].id,
          role: "member",
          userId,
        })
        .returning();
      res.status(200).json({ message: "Joined workspace", addMember });
      return;
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Internal server error" });
      return;
    }
  }

  static async addMemberToWorkspace(
    req: Request,
    res: Response,
  ): Promise<void> {
    const { workspaceId, memberId } = req.body as {
      workspaceId: string;
      memberId: string;
    };
    if (!workspaceId || !memberId) {
      res
        .status(400)
        .json({ message: "either workspaceId or memberId is missing" });
      return;
    }
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }
    const isOwner = await checkOwner(workspaceId, userId);
    if (!isOwner) {
      res
        .status(403)
        .json({ message: "You are not the owner of this workspace" });
      return;
    }
    try {
      const isMember = await db
        .select()
        .from(workspaceMembers)
        .where(
          and(
            eq(workspaceMembers.workspaceId, workspaceId),
            eq(workspaceMembers.userId, memberId),
          ),
        );
      if (isMember.length > 0) {
        res
          .status(400)
          .json({ message: "Member already exists in this workspace" });
        return;
      }
      const addMember = await db
        .insert(workspaceMembers)
        .values({
          workspaceId,
          userId: memberId,
          role: "member",
        })
        .returning();

      const getChannel = await db
        .select()
        .from(channel)
        .where(
          and(
            eq(channel.workspaceId, workspaceId),
            eq(channel.isDefault, true),
          ),
        );

      const addMemberToChannel = await db
        .insert(channelMembers)
        .values({
          channelId: getChannel[0].id,
          userId: memberId,
        })
        .returning();
      res.status(200).json({
        message: "Member added to workspace",
        addMember,
        addMemberToChannel,
      });
      return;
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Internal server error" });
      return;
    }
  }

  static async getWorkspaceMembers(req: Request, res: Response): Promise<void> {
    const { workspaceId } = req.params as { workspaceId: string };
    if (!workspaceId) {
      res.status(400).json({ message: "workspaceId is missing" });
      return;
    }
    try {
      const members = await db
        .select()
        .from(workspaceMembers)
        .where(eq(workspaceMembers.workspaceId, workspaceId));
      res.status(200).json(members);
      return;
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Internal server error" });
      return;
    }
  }

  static async getWorkspaceChannelsAll(
    req: Request,
    res: Response,
  ): Promise<void> {
    const { workspaceId } = req.params as { workspaceId: string };

    if (!workspaceId) {
      res.status(400).json({ message: "workspaceId is missing" });
      return;
    }

    const userId = req.user?.id;

    if (!userId) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    const isOwner = await checkOwner(workspaceId, userId);

    if (!isOwner) {
      res
        .status(403)
        .json({ message: "You are not the owner of this workspace" });
      return;
    }
    try {
      const channels = await db
        .select()
        .from(workspaceChannels)
        .innerJoin(channel, eq(workspaceChannels.channelId, channel.id))
        .where(eq(workspaceChannels.workspaceId, workspaceId));
      res.status(200).json(channels);
      return;
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Internal server error" });
      return;
    }
  }

  static async getWorkspaceChannelsUser(
    req: Request,
    res: Response,
  ): Promise<void> {
    const { workspaceId } = req.params as { workspaceId: string };

    if (!workspaceId) {
      res.status(400).json({ message: "workspaceId is missing" });
      return;
    }

    const userId = req.user?.id;

    if (!userId) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    try {
      const channels = await db
        .select()
        .from(channelMembers)
        .innerJoin(channel, eq(channelMembers.channelId, channel.id))
        .where(
          and(
            eq(workspaceChannels.workspaceId, workspaceId),
            eq(channelMembers.userId, userId),
          ),
        );
      res.status(200).json(channels);
      return;
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Internal server error" });
      return;
    }
  }

  static async editWorkspace(req: Request, res: Response): Promise<void> {
    const { workspaceId } = req.params as { workspaceId: string };
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }
    const isOwner = await checkOwner(workspaceId, userId);

    if (!isOwner) {
      res
        .status(403)
        .json({ message: "You are not the owner of this workspace" });
      return;
    }

    const { name, description } = req.body as {
      name: string;
      description: string;
    };

    try {
      const result = await db
        .update(workspace)
        .set({
          name,
          description,
        })
        .where(eq(workspace.id, workspaceId))
        .returning();
      res.status(200).json(result);
      return;
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Internal server error" });
      return;
    }
  }
  static async deleteWorkspace(req: Request, res: Response): Promise<void> {
    const { workspaceId } = req.params;
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }
    // const isOwner = await checkOwner(workspaceId, userId);
    // if (!isOwner) {
    //   res
    //     .status(403)
    //     .json({ message: "You are not the owner of this workspace" });
    //   return;
    // }
    try {
      const result = await db
        .delete(workspace)
        .where(eq(workspace.id, workspaceId));
      res.status(200).json({ message: "Workspace deleted" });
      return;
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Internal server error" });
      return;
    }
  }
}
