import { Request, Response } from "express";
import { db } from "../index.js";
import { user } from "../db/auth-schema.js";
import { eq } from "drizzle-orm";
import { ErrorFactory, BaseError } from "../error.js";
import { globalErrorHandler } from "../globalErrorHandler.js";

export class UserController {
  static async getUserProfile(req: Request, res: Response): Promise<void> {
    const id = req.user?.id;
    if (!id) {
      throw ErrorFactory.unauthorized();
    }
    try {
      const userData = await db.select().from(user).where(eq(user.id, id));
      if (!userData) {
        throw ErrorFactory.notFound("User not found");
      }
      res.status(200).json(userData);
    } catch (error) {
      globalErrorHandler(error as BaseError, req, res);
    }
  }

  static async getUserbyId(req: Request, res: Response): Promise<void> {
    const id = req.params.id;
    if (!id) {
      throw ErrorFactory.unauthorized();
    }
    try {
      const userData = await db.select().from(user).where(eq(user.id, id));
      if (!userData) {
        throw ErrorFactory.notFound("User not found");
      }
      res.status(200).json(userData);
      return;
    } catch (error) {
      globalErrorHandler(error as BaseError, req, res);
    }
  }
}
