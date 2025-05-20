"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const serverConfig_1 = require("./config/serverConfig");
const app = (0, express_1.default)();
app.get("/ping", (req, res) => {
    res.send("/pong");
});
app.listen(serverConfig_1.serverConfig.port, () => {
    console.log(`Server is running on port ${serverConfig_1.serverConfig.port}`);
});
