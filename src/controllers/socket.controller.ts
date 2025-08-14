import { Server, Socket } from "socket.io";
import { getAllUserChannels } from "../services/getAllUserChannels.js";

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
}
