import type { Request, Response } from 'express';
import { sendError } from '../utils/response.js';

export function notFoundHandler(req: Request, res: Response): void {
  sendError(res, 'NOT_FOUND', `Route ${req.method} ${req.originalUrl} does not exist`, 404);
}
