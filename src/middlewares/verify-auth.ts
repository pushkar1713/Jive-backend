import { Request, Response, NextFunction } from "express";
import { fromNodeHeaders } from "better-auth/node";
import { auth } from "../lib/auth.js";
import { ErrorFactory } from "../error.js";

export const verifyAuth = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  const session = await auth.api.getSession({
    headers: fromNodeHeaders(req.headers),
  });
  if (!session) {
    throw ErrorFactory.unauthorized();
  }
  req.user = session.user;
  next();
};
