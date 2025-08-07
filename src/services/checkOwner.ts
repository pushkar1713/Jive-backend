import { workspaceMembers } from "../db/schema.js";
import { db } from "../index.js";
import { and, eq } from "drizzle-orm";

export const checkOwner = async (workspaceId: string, userId: string) => {
  const workspaceMember = await db
    .select()
    .from(workspaceMembers)
    .where(
      and(
        eq(workspaceMembers.workspaceId, workspaceId),
        eq(workspaceMembers.userId, userId),
      ),
    );
  return workspaceMember[0].role === "owner";
};
