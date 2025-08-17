import { Server, Socket } from "socket.io";
import { getAllUserChannels } from "../services/getAllUserChannels.js";
import { MessagePayload } from "../validations/message.validator.js";
import {
  handleAttachments,
  handleMessages,
} from "../services/handleMessages.js";
import { error } from "console";

export class SocketController {
  static async joinChannel(socket: Socket) {
    socket.on(
      "joinChannel",
      async function joinChannelHandler(
        data: { workspaceId: string; channelId: string },
        cb,
      ) {
        try {
          if (!socket.data.user) {
            return socket.emit("error", {
              success: false,
              message: "User not authenticated",
            });
          }

          const channels = await getAllUserChannels(
            data.workspaceId,
            socket.data.user.id,
          );

          const result = channels
            .map((channel) => channel.channelId)
            .filter((id): id is string => !!id)
            .filter((id) => socket.join(id));

          cb?.(null, {
            message: "Joined channel successfully",
            roomId: data.channelId,
          });
        } catch (error) {
          cb(error, null);
        }
      },
    );
  }
  static async sendMessage(socket: Socket, io: Server) {
    socket.on(
      "sendMessage",
      async function sendMessageHandler(data: MessagePayload, cb) {
        try {
          if (!socket.data.user) {
            return cb(error, {
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

          io.to(data.channelId).emit("message", {
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
