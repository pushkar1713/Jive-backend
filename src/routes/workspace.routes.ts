import { Router } from "express";
import { WorkspaceController } from "../controllers/workspace.controller.js";
import { validate } from "../middlewares/validation.js";
import { createWorkspaceSchema } from "../validations/workspace.validator.js";
import { verifyAuth } from "../middlewares/verify-auth.js";
import { checkPermission } from "../middlewares/checkPermission.js";
import { Scope } from "../middlewares/checkPermission.js";

const router = Router();

router.post(
  "/create",
  validate(createWorkspaceSchema),
  verifyAuth,
  WorkspaceController.createWorkspace,
);

router.post("/join/:joinCode", verifyAuth, WorkspaceController.joinWorkspace);

router.delete(
  "/delete/:workspaceId",
  verifyAuth,
  checkPermission({ required: "admin", scope: Scope.WORKSPACE }),
  WorkspaceController.deleteWorkspace,
);

router.post(
  "/add-member",
  verifyAuth,
  WorkspaceController.addMemberToWorkspace,
);

export default router;
