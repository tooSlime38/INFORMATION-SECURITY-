import rateLimit from 'express-rate-limit';
import { sendError } from '../utils/response.js';

// General API Rate Limiter: 100 requests per 15 minutes
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    sendError(res, 'RATE_LIMIT_EXCEEDED', 'Too many requests. Please try again later.', 429);
  },
});

// Strict Authentication Limiter: 10 attempts per 15 minutes per IP
// Defends against automated brute-force and credential stuffing attacks
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 15,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    sendError(
      res,
      'AUTH_RATE_LIMIT_EXCEEDED',
      'Too many authentication attempts. Please try again after 15 minutes.',
      429
    );
  },
});
