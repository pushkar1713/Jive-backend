import { db } from "../src/index.js";
import { workspace } from "../src/db/schema.js";
import { eq } from "drizzle-orm";

export async function getWorkspaceByJoinCode(joinCode: string) {
  if (joinCode.length !== 6 || !joinCode) {
    return Error("Invalid join code");
  }
  try {
    const result = await db
      .select()
      .from(workspace)
      .where(eq(workspace.joincode, joinCode));
    return result;
  } catch (error) {
    console.error(error);
    return Error("Internal server error");
  }
}
