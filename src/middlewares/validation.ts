import { ZodType } from "zod";
import { Request, Response, NextFunction } from "express";

export const validate = (schema: ZodType) => {
  return async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const result = schema.safeParse(req.body);
      if (!result.success) {
        res.status(400).json({ message: result.error.message });
        return;
      }
      next();
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Internal server error" });
    }
  };
};
