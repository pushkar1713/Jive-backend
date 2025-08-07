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

router.post("/join/:joinCode", verifyAuth, WorkspaceController.joinWorkspace);

router.get("/test", (req, res) => {
  res.status(200).json({ message: "test" });
  return;
});

router.post("/test2", (req, res) => {
  res.status(200).json({ message: "test2" });
  return;
});

router.post(
  "/add-member",
  verifyAuth,
  WorkspaceController.addMemberToWorkspace,
);

export default router;
