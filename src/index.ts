import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { databaseConfig } from "./config/serverConfig.js";

const sql = neon(databaseConfig.url!);
export const db = drizzle({ client: sql });
