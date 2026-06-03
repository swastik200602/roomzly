export class AppError extends Error {
  public readonly statusCode: number;
  public readonly code: string;
  public readonly details?: unknown;

  constructor(statusCode: number, code: string, message: string, details?: unknown) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
  }
}

export const badRequest = (message: string, details?: unknown): AppError =>
  new AppError(400, "BAD_REQUEST", message, details);

export const unauthorized = (message = "Authentication required"): AppError =>
  new AppError(401, "UNAUTHORIZED", message);

export const forbidden = (message = "Insufficient permissions"): AppError =>
  new AppError(403, "FORBIDDEN", message);

export const notFound = (message = "Resource not found"): AppError =>
  new AppError(404, "NOT_FOUND", message);

export const conflict = (message: string, details?: unknown): AppError =>
  new AppError(409, "CONFLICT", message, details);
