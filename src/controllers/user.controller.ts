import { Request, Response } from "express";
import { db } from "../index.js";
import { user } from "../db/auth-schema.js";
import { eq } from "drizzle-orm";

export class UserController {
  static async getUserProfile(req: Request, res: Response): Promise<void> {
    const id = req.user?.id;
    if (!id) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }
    try {
      const userData = await db.select().from(user).where(eq(user.id, id));
      if (!userData) {
        res.status(404).json({ message: "User not found" });
        return;
      }
      res.status(200).json(userData);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Internal server error" });
      return;
    }
  }
}
