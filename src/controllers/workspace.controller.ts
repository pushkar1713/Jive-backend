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
import { ErrorFactory, BaseError } from "../error.js";
import { globalErrorHandler } from "../globalErrorHandler.js";
import { apiResponse } from "../globalResponseHandler.js";

export class WorkspaceController {
  static async createWorkspace(req: Request, res: Response): Promise<void> {
    const { name, description } = req.body as createWorkspaceType;
    const userId = req.user?.id;
    if (!userId) {
      throw ErrorFactory.unauthorized();
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

      if (!workspaceData) {
        throw ErrorFactory.dbOperation("failed to create workspace");
      }
      apiResponse(res, {
        statusCode: 201,
        message: "Workspace created successfully",
        data: workspaceData,
      });
      return;
    } catch (error) {
      globalErrorHandler(error as BaseError, req, res);
    }
  }

  static async getWorkspacesOfUser(req: Request, res: Response): Promise<void> {
    const userId = req.user?.id;
    if (!userId) {
      throw ErrorFactory.unauthorized();
    }
    try {
      const result = await db
        .select({
          workspace: workspaceMembers.workspaceId,
        })
        .from(workspaceMembers)
        .innerJoin(workspace, eq(workspaceMembers.workspaceId, workspace.id))
        .where(eq(workspaceMembers.userId, userId));

      if (!result) {
        throw ErrorFactory.notFound("No workspaces found");
      }
      apiResponse(res, {
        statusCode: 200,
        message: "Workspaces fetched successfully",
        data: result,
      });
      return;
    } catch (error) {
      globalErrorHandler(error as BaseError, req, res);
    }
  }

  static async joinWorkspace(req: Request, res: Response): Promise<void> {
    const { joinCode } = req.params as { joinCode: string };
    const userId = req.user?.id;
    if (!userId) {
      throw ErrorFactory.unauthorized();
    }
    try {
      const workspace = await getWorkspaceByJoinCode(joinCode);
      if (workspace instanceof Error) {
        throw ErrorFactory.badRequest("Invalid join code");
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
        throw ErrorFactory.badRequest("Already a member of this workspace");
      }

      const addMember = await db
        .insert(workspaceMembers)
        .values({
          workspaceId: workspace[0].id,
          role: "member",
          userId,
        })
        .returning();

      if (!addMember) {
        throw ErrorFactory.dbOperation("failed to join workspace");
      }
      apiResponse(res, {
        statusCode: 200,
        message: "Joined workspace",
        data: addMember,
      });
      return;
    } catch (error) {
      globalErrorHandler(error as BaseError, req, res);
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
      throw ErrorFactory.badRequest(
        "either workspaceId or memberId is missing",
      );
    }
    const userId = req.user?.id;
    if (!userId) {
      throw ErrorFactory.unauthorized();
    }
    const isOwner = await checkOwner(workspaceId, userId);
    if (!isOwner) {
      throw ErrorFactory.forbidden("You are not the owner of this workspace");
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
        throw ErrorFactory.badRequest(
          "Member already exists in this workspace",
        );
      }
      const addMember = await db
        .insert(workspaceMembers)
        .values({
          workspaceId,
          userId: memberId,
          role: "member",
        })
        .returning();

      if (!addMember) {
        throw ErrorFactory.dbOperation("failed to add member to workspace");
      }

      const getChannel = await db
        .select()
        .from(channel)
        .where(
          and(
            eq(channel.workspaceId, workspaceId),
            eq(channel.isDefault, true),
          ),
        );

      if (!getChannel) {
        throw ErrorFactory.dbOperation("failed to get channel");
      }

      const addMemberToChannel = await db
        .insert(channelMembers)
        .values({
          channelId: getChannel[0].id,
          userId: memberId,
        })
        .returning();

      if (!addMemberToChannel) {
        throw ErrorFactory.dbOperation("failed to add member to channel");
      }

      apiResponse(res, {
        statusCode: 200,
        message: "Member added to workspace",
        data: addMember,
      });
      return;
    } catch (error) {
      console.error(error);
      globalErrorHandler(error as BaseError, req, res);
    }
  }

  static async getWorkspaceMembers(req: Request, res: Response): Promise<void> {
    const { workspaceId } = req.params as { workspaceId: string };
    if (!workspaceId) {
      throw ErrorFactory.badRequest("workspaceId is missing");
    }
    try {
      const members = await db
        .select()
        .from(workspaceMembers)
        .where(eq(workspaceMembers.workspaceId, workspaceId));
      if (!members) {
        throw ErrorFactory.notFound("No members found");
      }
      apiResponse(res, {
        statusCode: 200,
        message: "Members fetched successfully",
        data: members,
      });
      return;
    } catch (error) {
      globalErrorHandler(error as BaseError, req, res);
    }
  }

  static async getWorkspaceChannelsAll(
    req: Request,
    res: Response,
  ): Promise<void> {
    const { workspaceId } = req.params as { workspaceId: string };

    if (!workspaceId) {
      throw ErrorFactory.badRequest("workspaceId is missing");
    }

    const userId = req.user?.id;

    if (!userId) {
      throw ErrorFactory.unauthorized();
    }

    const isOwner = await checkOwner(workspaceId, userId);

    if (!isOwner) {
      throw ErrorFactory.forbidden("You are not the owner of this workspace");
    }
    try {
      const channels = await db
        .select()
        .from(workspaceChannels)
        .innerJoin(channel, eq(workspaceChannels.channelId, channel.id))
        .where(eq(workspaceChannels.workspaceId, workspaceId));
      if (!channels) {
        throw ErrorFactory.notFound("No channels found");
      }
      apiResponse(res, {
        statusCode: 200,
        message: "Channels fetched successfully",
        data: channels,
      });
      return;
    } catch (error) {
      globalErrorHandler(error as BaseError, req, res);
    }
  }

  static async getWorkspaceChannelsUser(
    req: Request,
    res: Response,
  ): Promise<void> {
    const { workspaceId } = req.params as { workspaceId: string };

    if (!workspaceId) {
      throw ErrorFactory.badRequest("workspaceId is missing");
    }

    const userId = req.user?.id;

    if (!userId) {
      throw ErrorFactory.unauthorized();
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
      if (!channels) {
        throw ErrorFactory.notFound("No channels found");
      }
      apiResponse(res, {
        statusCode: 200,
        message: "Channels fetched successfully",
        data: channels,
      });
      return;
    } catch (error) {
      globalErrorHandler(error as BaseError, req, res);
    }
  }

  static async editWorkspace(req: Request, res: Response): Promise<void> {
    const { workspaceId } = req.params as { workspaceId: string };
    const userId = req.user?.id;
    if (!userId) {
      throw ErrorFactory.unauthorized();
    }
    const isOwner = await checkOwner(workspaceId, userId);

    if (!isOwner) {
      throw ErrorFactory.forbidden("You are not the owner of this workspace");
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
      if (!result) {
        throw ErrorFactory.dbOperation("failed to edit workspace");
      }
      apiResponse(res, {
        statusCode: 200,
        message: "Workspace edited successfully",
        data: result,
      });
      return;
    } catch (error) {
      globalErrorHandler(error as BaseError, req, res);
    }
  }

  static async deleteWorkspace(req: Request, res: Response): Promise<void> {
    const { workspaceId } = req.params;
    const userId = req.user?.id;
    if (!userId) {
      throw ErrorFactory.unauthorized();
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
      if (!result) {
        throw ErrorFactory.dbOperation("failed to delete workspace");
      }
      apiResponse(res, {
        statusCode: 200,
        message: "Workspace deleted",
      });
      return;
    } catch (error) {
      globalErrorHandler(error as BaseError, req, res);
    }
  }
}
