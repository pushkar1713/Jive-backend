import { Request, Response } from "express";
import { BaseError } from "./error.js";

export const globalErrorHandler = (
  error: Error | BaseError,
  req: Request,
  res: Response,
): void => {
  console.error("Error:", {
    name: error.name,
    message: error.message,
    stack: error.stack,
    ...(error instanceof BaseError && {
      statusCode: error.statusCode,
      code: error.code,
      details: error.details,
    }),
  });

  if (error instanceof BaseError) {
    res.status(error.statusCode).json(error.toJSON());
    return;
  }

  const internalError = {
    status: "error",
    statusCode: 500,
    code: "INTERNAL_SERVER_ERROR",
    message:
      process.env.NODE_ENV === "production"
        ? "An unexpected error occurred"
        : error.message,
    ...(process.env.NODE_ENV === "development" && { stack: error.stack }),
  };

  res.status(500).json(internalError);
};
