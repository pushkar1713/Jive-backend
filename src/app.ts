import express from "express";
import { serverConfig } from "./config/serverConfig.js";
import cors from "cors";
import { toNodeHandler, fromNodeHeaders } from "better-auth/node";
import { auth } from "./lib/auth.js";
import userRouter from "./routes/user.routes.js";
import workspaceRouter from "./routes/workspace.routes.js";
const app = express();

app.use(
  cors({
    origin: "http://localhost:5173", //frontend domain,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    credentials: true,
  }),
);

app.all("/api/auth/*splat", toNodeHandler(auth));

app.use(express.json());

app.get("/ping", (req, res) => {
  res.send("pong");
});

app.use("/api/v1/user", userRouter);
app.use("/api/v1/workspace", workspaceRouter);

app.get("/api/me", async (req, res) => {
  const session = await auth.api.getSession({
    headers: fromNodeHeaders(req.headers),
  });
  res.json(session);
});

app.listen(serverConfig.port, () => {
  console.log(`Server is running on port ${serverConfig.port}`);
});
