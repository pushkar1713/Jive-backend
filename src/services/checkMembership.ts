import { workspaceMembers } from "../db/schema.js";
import { channelMembers } from "../db/schema.js";
import { db } from "../index.js";
import { and, eq } from "drizzle-orm";

export const workspaceMembership = async (
  workspaceId: string,
  userId: string,
) => {
  const workspaceMember = await db
    .select()
    .from(workspaceMembers)
    .where(
      and(
        eq(workspaceMembers.workspaceId, workspaceId),
        eq(workspaceMembers.userId, userId),
      ),
    );

  if (workspaceMember.length === 0) {
    return false;
  }

  return true;
};

export const channelMembership = async (channelId: string, userId: string) => {
  const channelMember = await db
    .select()
    .from(channelMembers)
    .where(
      and(
        eq(channelMembers.channelId, channelId),
        eq(channelMembers.userId, userId),
      ),
    );

  if (channelMember.length === 0) {
    return false;
  }

  return true;
};
