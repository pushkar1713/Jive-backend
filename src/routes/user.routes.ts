import { Router, Request, Response } from "express";
import { UserController } from "../controllers/user.controller.js";
import { verifyAuth } from "../middlewares/verify-auth.js";

const router = Router();

router.use(verifyAuth);

router.get("/", (req: Request, res: Response) => {
  res.send("this is the user router");
});

router.get("/profileData", verifyAuth, (req: Request, res: Response) => {
  UserController.getUserProfile(req, res);
});

router.get("/:id", verifyAuth, (req: Request, res: Response) => {
  UserController.getUserbyId(req, res);
});

export default router;
