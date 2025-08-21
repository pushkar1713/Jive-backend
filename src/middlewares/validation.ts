import { ZodType } from "zod";
import { Request, Response, NextFunction } from "express";
import { ErrorFactory } from "../error.js";

export const validate = (schema: ZodType) => {
  return async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const result = schema.safeParse(req.body);
      if (!result.success) {
        throw ErrorFactory.validation(result.error);
      }
      next();
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Internal server error" });
    }
  };
};
