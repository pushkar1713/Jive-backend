import { channel, channelMembers } from "../db/schema.js";
import { db } from "../index.js";
import { aliasedTable, eq, and } from "drizzle-orm";

type Payload = {
  userId: string;
  targetUserId: string;
  workspaceId: string;
};

export const getDMChannel = async (data: Payload) => {
  const { userId, targetUserId, workspaceId } = data;

  const cm1 = aliasedTable(channelMembers, "cm1");
  const cm2 = aliasedTable(channelMembers, "cm2");

  const result = await db
    .select()
    .from(channel)
    .innerJoin(cm1, eq(channel.id, cm1.channelId))
    .innerJoin(cm2, eq(channel.id, cm2.channelId))
    .where(
      and(
        eq(channel.workspaceId, workspaceId),
        eq(channel.isDM, true),
        eq(cm1.userId, userId),
        eq(cm2.userId, targetUserId),
      ),
    );

  if (result.length === 0) {
    return {
      success: false,
      message: "DM channel not found",
      result: null,
    };
  }

  return {
    success: true,
    message: "DM channel",
    result,
  };
};
