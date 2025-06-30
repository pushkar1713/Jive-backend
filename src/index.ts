import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { databaseConfig } from "./config/serverConfig.js";
import { eq } from "drizzle-orm";

const sql = neon(databaseConfig.url!);
const db = drizzle({ client: sql });
