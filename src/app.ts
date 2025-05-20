import express from "express";
import { serverConfig } from "./config/serverConfig";

const app = express();

app.get("/ping", (req, res) => {
  res.send("pong");
});

app.listen(serverConfig.port, () => {
  console.log(`Server is running on port ${serverConfig.port}`);
});
