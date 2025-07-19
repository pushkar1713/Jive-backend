import { Router } from "express";
import { WorkspaceController } from "../controllers/workspace.controller.js";
import { validate } from "../middlewares/validation.js";
import { createWorkspaceSchema } from "../validations/workspace.validator.js";
import { verifyAuth } from "../middlewares/verify-auth.js";

const router = Router();

router.post(
  "/create",
  validate(createWorkspaceSchema),
  verifyAuth,
  WorkspaceController.createWorkspace,
);

export default router;
