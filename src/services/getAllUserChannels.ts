import { db } from "../index.js";
import { workspaceChannels, channelMembers } from "../db/schema.js";
import { and, eq } from "drizzle-orm";

export const getAllUserChannels = async (
  workspaceId: string,
  userId: string,
) => {
  const result = await db
    .select({
      channelId: workspaceChannels.channelId,
    })
    .from(workspaceChannels)
    .innerJoin(
      channelMembers,
      eq(workspaceChannels.channelId, channelMembers.channelId),
    )
    .where(
      and(
        eq(workspaceChannels.workspaceId, workspaceId),
        eq(channelMembers.userId, userId),
      ),
    );

  return result;
};
