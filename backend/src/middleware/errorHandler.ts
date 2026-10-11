import type { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { env } from '../config/env.js';
import { sendError } from '../utils/response.js';

export function errorHandler(
  err: unknown,
  req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  next: NextFunction
): void {
  // Handle Zod schema validation errors
  if (err instanceof ZodError) {
    const formattedErrors = err.issues.map((issue) => ({
      field: issue.path.join('.'),
      message: issue.message,
    }));
    sendError(res, 'VALIDATION_ERROR', 'Request validation failed', 400, formattedErrors);
    return;
  }

  // Handle malformed JSON request bodies
  if (err instanceof SyntaxError && 'status' in err && (err as { status: number }).status === 400) {
    sendError(res, 'INVALID_JSON', 'Malformed JSON payload in request body', 400);
    return;
  }

  // Log error internally (excluding sensitive payload data)
  console.error(`[Unhandled Error] [${req.method} ${req.path}]:`, err);

  const errorMessage =
    env.NODE_ENV === 'production'
      ? 'An internal server error occurred'
      : err instanceof Error
      ? err.message
      : 'Unknown internal error';

  sendError(
    res,
    'INTERNAL_SERVER_ERROR',
    errorMessage,
    500,
    env.NODE_ENV === 'development' && err instanceof Error ? { stack: err.stack } : undefined
  );
}
