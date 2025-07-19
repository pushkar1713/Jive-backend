import { Request, Response } from "express";
import { createWorkspaceType } from "../validations/workspace.validator.js";
import { db } from "../index.js";
import { workspace, workspaceMembers } from "../db/schema.js";
import { v4 as uuidv4 } from "uuid";
import { eq } from "drizzle-orm";

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
            role: "admin",
          })
          .returning();
        return {
          workspace: workspacePayload,
          workspaceMember: workspaceMemberPayload,
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

  static async getWorkspaceByJoinCode(
    req: Request,
    res: Response,
  ): Promise<void> {
    const { joinCode } = req.params as { joinCode: string };

    if (joinCode.length !== 6 || !joinCode) {
      res.status(400).json({ message: "Invalid join code" });
      return;
    }
    try {
      const result = await db
        .select()
        .from(workspace)
        .where(eq(workspace.joincode, joinCode));
      if (!result) {
        res.status(404).json({ message: "Workspace not found" });
        return;
      }
      res.status(200).json(result);
      return;
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Internal server error" });
      return;
    }
  }
}
