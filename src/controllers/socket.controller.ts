// The pattern:
/* 1. Leave ALL rooms (regardless of what we think user is in)
2. Clear all tracking data
3. Join new workspace rooms
4. Update tracking with new data */

import { Server, Socket } from "socket.io";
import { getAllUserChannels } from "../services/getAllUserChannels.js";
import { MessagePayload } from "../validations/message.validator.js";
import {
  handleAttachments,
  handleMessages,
} from "../services/handleMessages.js";
import { getDMChannel } from "../services/getDM.js";

export class SocketController {
  static async joinWorkspace(socket: Socket) {
    socket.on(
      "joinChannel",
      async function joinChannelHandler(data: { workspaceId: string }, cb) {
        try {
          if (!socket.data.user) {
            return socket.emit("error", {
              success: false,
              message: "User not authenticated",
            });
          }

          const currentWorkspace = socket.data.currentWorkspace;

          if (currentWorkspace && currentWorkspace !== data.workspaceId) {
            console.log(
              `User ${socket.data.user.id} switching workspaces: ${currentWorkspace} → ${data.workspaceId}`,
            );
            socket.data.joinedRooms.forEach((room: string) => {
              socket.leave(room);
              console.log(
                `User ${socket.data.user.id} left room: ${room} (workspace switch)`,
              );
            });

            socket.data.joinedRooms = [];
          }

          const channels = await getAllUserChannels(
            data.workspaceId,
            socket.data.user.id,
          );

          const result = channels.result
            .map((channel) => channel.channelId)
            .filter((id): id is string => !!id);

          // will be implemented later in the future

          const joinedRooms: string[] = [];

          result.forEach((channelId) => {
            socket.join(channelId);
            joinedRooms.push(channelId);
            console.log(
              `User ${socket.data.user.id} joined channel room: ${channelId}`,
            );
          });

          if (!channels.defaultChannel[0].channelId) {
            return socket.emit("error", {
              success: false,
              message: "No default channel found",
            });
          }

          socket.join(channels.defaultChannel[0].channelId);
          joinedRooms.push(channels.defaultChannel[0].channelId);
          console.log(
            `User ${socket.data.user.id} joined default channel: ${channels.defaultChannel[0].channelId}`,
          );

          socket.data.joinedRooms = joinedRooms;
          socket.data.currentWorkspace = data.workspaceId;

          cb?.(null, {
            message: "Joined channel successfully",
            roomIds: joinedRooms,
          });
        } catch (error) {
          cb(error, null);
        }
      },
    );
  }

  /* static async leaveChannel(socket: Socket) {
    socket.on(
      "leaveChannel",
      async function leaveChannelHandler(data: { channelId: string }, cb) {
        try {
          if (!socket.data.user) {
            return socket.emit("error", {
              success: false,
              message: "User not authenticated",
            });
          }

          const roomsData = socket.data.joinedRooms;

          if (!roomsData.includes(data.channelId)) {
            return socket.emit("error", {
              success: false,
              message: "User not in channel",
            });
          }

          socket.leave(data.channelId);
          socket.data.joinedRooms = socket.data.joinedRooms.filter(
            (room: string) => room !== data.channelId,
          );

          cb?.(null, {
            message: "Left channel successfully",
          });
        } catch (error) {
          cb(error, null);
        }
      },
    );
  } */

  /*   static async leaveWorkspace(socket: Socket) {
    socket.on(
      "leaveWorkspace",
      async function leaveWorkspaceHandler(data: { workspaceId: string }, cb) {
        try {
          if (!socket.data.user) {
            return socket.emit("error", {
              success: false,
              message: "User not authenticated",
            });
          }

          const roomsData = socket.data.joinedRooms;

          if (!roomsData.includes(data.workspaceId)) {
            return socket.emit("error", {
              success: false,
              message: "User not in workspace",
            });
          }

          socket.leave(data.workspaceId);

          socket.data.joinedRooms = socket.data.joinedRooms.filter(
            (room: string) => room !== data.workspaceId,
          );

          cb?.(null, {
            message: "Left workspace successfully",
          });
        } catch (error) {
          cb(error, null);
        }
      },
    );
  } */

  static async joinDMChannel(socket: Socket) {
    socket.on(
      "joinDMChannel",
      async function joinDMChannelHandler(
        data: { targetUserId: string; workspaceId: string },
        cb,
      ) {
        try {
          if (!socket.data.user) {
            return socket.emit("error", {
              success: false,
              message: "User not authenticated",
            });
          }

          const dmChannel = await getDMChannel({
            userId: socket.data.user.id,
            targetUserId: data.targetUserId,
            workspaceId: data.workspaceId,
          });

          if (!dmChannel.success || !dmChannel.result) {
            return socket.emit("error", {
              success: false,
              message: "DM channel not found",
            });
          }

          const channelId = dmChannel.result[0].channel.id;

          socket.join(channelId);
          socket.data.joinedRooms.push(channelId);

          cb?.(null, {
            message: "Joined DM channel successfully",
            roomId: channelId,
          });
        } catch (error) {
          cb(error, null);
        }
      },
    );
  }

  static async sendMessage(socket: Socket, io: Server) {
    socket.on(
      "MESSAGE_SEND",
      async function sendMessageHandler(data: MessagePayload, cb) {
        try {
          if (!socket.data.user) {
            return socket.emit("error", {
              success: false,
              message: "User not authenticated",
            });
          }

          const messageData = await handleMessages({
            content: data.content,
            channelId: data.channelId,
            workspaceId: data.workspaceId,
            senderId: socket.data.user.id,
          });

          let attachmentData = null;

          if (data.attachments && data.key && data.contentType && data.size) {
            attachmentData = await handleAttachments({
              key: data.key,
              contentType: data.contentType,
              size: data.size,
              messageId: messageData.id,
            });
          }

          cb(null, {
            message: "Message sent successfully",
            messageId: messageData.id,
          });

          io.to(data.channelId).emit("MESSAGE_DELIVERED", {
            message: messageData,
            attachment: attachmentData,
          });
        } catch (error) {
          cb(error, null);
        }
      },
    );
  }
}
