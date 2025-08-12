import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "../db/auth-schema.js";
import { databaseConfig } from "../config/serverConfig.js";
import { neon } from "@neondatabase/serverless";
import { username, openAPI } from "better-auth/plugins";

const sql = neon(databaseConfig.url!);
const db = drizzle({ client: sql, schema });

export const auth = betterAuth({
  trustedOrigins: ["http://localhost:3001"],
  database: drizzleAdapter(db, {
    provider: "pg",
    schema,
  }),
  emailAndPassword: {
    enabled: true,
  },
  plugins: [username(), openAPI()],
});
