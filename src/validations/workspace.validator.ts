import { z } from "zod";

export const createWorkspaceSchema = z.object({
  name: z.string().min(6, "name must be at least 6 characters long"),
  description: z.string().optional(),
});

export type createWorkspaceType = z.infer<typeof createWorkspaceSchema>;
