import { RequestHandler } from "express";
import { db } from "../index.js";
import { channelMembers, workspaceMembers } from "../db/schema.js";
import { and, eq } from "drizzle-orm";
import { ErrorFactory } from "../error.js";

const ROLE_WEIGHT = { member: 0, moderator: 1, admin: 2, owner: 3 } as const;

type role = "member" | "moderator" | "admin" | "owner";

function hasPermission(member: role, required: role): boolean {
  return ROLE_WEIGHT[member] >= ROLE_WEIGHT[required];
}

export enum Scope {
  WORKSPACE = "workspace",
  CHANNEL = "channel",
}

interface PermissionPayload {
  required: role;
  scope: Scope;
}

export const checkPermission =
  (payload: PermissionPayload): RequestHandler =>
  async (req, _res, next) => {
    const { required, scope } = payload;

    if (scope === Scope.WORKSPACE) {
      const { workspaceId } = req.params;
      const userId = req.user?.id;

      if (!userId) {
        throw ErrorFactory.unauthorized();
      }

      const data = await db
        .select()
        .from(workspaceMembers)
        .where(
          and(
            eq(workspaceMembers.workspaceId, workspaceId),
            eq(workspaceMembers.userId, userId),
          ),
        );

      if (data.length === 0) {
        throw ErrorFactory.forbidden();
      }

      const permission = data[0].role as role;

      const result = hasPermission(permission, required);

      if (result) {
        console.log(result);
        return next();
      }
    }

    if (scope === Scope.CHANNEL) {
      const { channelId } = req.params;
      const userId = req.user?.id;

      if (!userId) {
        throw ErrorFactory.unauthorized();
      }

      const data = await db
        .select()
        .from(channelMembers)
        .where(
          and(
            eq(channelMembers.channelId, channelId),
            eq(channelMembers.userId, userId),
          ),
        );

      if (data.length === 0) {
        throw ErrorFactory.forbidden();
      }

      const permission = data[0].role as role;

      const result = hasPermission(permission, required);

      if (result) {
        console.log(result);
        return next();
      }
    }

    throw ErrorFactory.forbidden("Forbidden");
  };
