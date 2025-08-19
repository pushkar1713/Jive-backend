import { db } from "../index.js";
import { workspaceChannels, channelMembers, channel } from "../db/schema.js";
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

  const defaultChannel = await db
    .select({
      channelId: channel.id,
    })
    .from(workspaceChannels)
    .leftJoin(channel, eq(workspaceChannels.channelId, channel.id))
    .where(
      and(
        eq(workspaceChannels.workspaceId, workspaceId),
        eq(channel.isDefault, true),
      ),
    );

  return {
    result,
    defaultChannel,
  };
};
