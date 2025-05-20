import dotenv from "dotenv";

dotenv.config();

export const serverConfig = {
  port: process.env.PORT || 3000,
};
