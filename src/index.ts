import { Pool, neonConfig } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-serverless";
import { databaseConfig } from "./config/serverConfig.js";
import ws from "ws";

neonConfig.webSocketConstructor = ws;

const sql = new Pool({ connectionString: databaseConfig.url });
export const db = drizzle({ client: sql });
