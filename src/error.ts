import { Response } from "express";
import { ZodError } from "zod";

export class BaseError extends Error {
  constructor(
    public readonly statusCode: number,
    public readonly code: string,
    message: string,
    public readonly details?: unknown,
  ) {
    super(message);

    Object.setPrototypeOf(this, new.target.prototype);

    Error.captureStackTrace(this, this.constructor);

    this.name = this.constructor.name;
  }

  public toJSON() {
    return {
      status: "error",
      code: this.code,
      message: this.message,
      ...(typeof this.details === "object" && this.details !== null
        ? { details: this.details }
        : {}),
    };
  }
}

export class UnauthorizedError extends BaseError {
  constructor(message = "Authentication required") {
    super(401, "UNAUTHORIZED", message);
  }
}

export class BadRequestError extends BaseError {
  constructor(message = "Bad Request") {
    super(400, "BAD_REQUEST", message);
  }
}

export class ForbiddenError extends BaseError {
  constructor(message = "you don't have permission to perform this action") {
    super(403, "FORBIDDEN", message);
  }
}

export class ValidationError extends BaseError {
  constructor(error?: ZodError, message?: string) {
    const errorDetails = error ? error.flatten() : message;
    super(
      400,
      "VALIDATION_ERROR",
      message || "Invalid input data",
      errorDetails,
    );
  }
}

export class NotFoundError extends BaseError {
  constructor(resource: string) {
    super(404, "NOT_FOUND", `${resource}`);
  }
}

export class ConflictError extends BaseError {
  constructor(message: string) {
    super(409, "CONFLICT", message);
  }
}

export class DbOperationError extends BaseError {
  constructor(message: string) {
    super(409, "DB_OPERATION_ERROR", message);
  }
}
export class InternalServerError extends BaseError {
  constructor(error?: any) {
    super(
      500,
      "INTERNAL_SERVER_ERROR",
      "An unexpected error occurred",
      process.env.NODE_ENV === "development" ? error : undefined,
    );
  }
}

export const isBaseError = (error: unknown): error is BaseError => {
  return error instanceof BaseError;
};

export const handleError = (error: unknown, res: Response): void => {
  console.error("Error:", error);

  const baseError = isBaseError(error) ? error : new InternalServerError(error);

  res.status(baseError.statusCode).json(baseError.toJSON());
};

export const ErrorFactory = {
  unauthorized: (message?: string) => new UnauthorizedError(message),
  forbidden: (message?: string) => new ForbiddenError(message),
  validation: (error: ZodError) => new ValidationError(error),
  notFound: (resource: string) => new NotFoundError(resource),
  conflict: (message: string) => new ConflictError(message),
  internal: (error?: unknown) => new InternalServerError(error),
  dbOperation: (message: string) => new DbOperationError(message),
  badRequest: (message: string) => new BadRequestError(message),
};
