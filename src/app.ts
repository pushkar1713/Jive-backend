import express from "express";
import { serverConfig } from "./config/serverConfig.js";
import { Server } from "socket.io";
import cors from "cors";
import { createServer } from "http";
import { toNodeHandler, fromNodeHeaders } from "better-auth/node";
import { auth } from "./lib/auth.js";
import userRouter from "./routes/user.routes.js";
import workspaceRouter from "./routes/workspace.routes.js";
import uploadRouter from "./routes/upload.routes.js";
const app = express();
const server = createServer(app);

const io = new Server(server, {
  path: "/api/auth/socket.io",
  cors: {
    origin: "http://localhost:3001",
    credentials: true,
  },
});

app.use(
  cors({
    origin: "http://localhost:3001", //frontend domain,
    credentials: true,
  }),
);

io.use(async (socket, next) => {
  const session = await auth.api.getSession({
    headers: fromNodeHeaders(socket.handshake.headers),
  });
  if (!session) {
    next(new Error("Unauthorized"));
    return;
  }
  socket.data.user = session.user;
  console.log(socket.data.user);
  next();
});

io.on("connection", (socket) => {
  console.log("socket connected", socket.id, socket.data.user?.id);
  socket.emit("me", { id: socket.data.user?.id ?? null });
});

app.all("/api/auth/*splat", toNodeHandler(auth));

app.use(express.json());

app.get("/ping", (req, res) => {
  res.send("pong");
});

app.use("/api/v1/user", userRouter);
app.use("/api/v1/workspace", workspaceRouter);
app.use("/api/v1/uploads", uploadRouter);

app.get("/api/me", async (req, res) => {
  const session = await auth.api.getSession({
    headers: fromNodeHeaders(req.headers),
  });
  res.json(session);
});

server.listen(serverConfig.port, () => {
  console.log(`Server is running on port ${serverConfig.port}`);
});
