import type { Request, Response, NextFunction } from 'express';
import { TokenService } from '../services/token.service.js';
import { AuditService } from '../services/audit.service.js';
import { sendError } from '../utils/response.js';
import type { UserRole } from '../types/index.js';

/**
 * Authentication Middleware
 * Validates the Authorization Bearer token header and attaches the user payload to the request.
 */
export function authenticate(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    sendError(res, 'UNAUTHORIZED', 'Authentication token is missing or malformed', 401);
    return;
  }

  const token = authHeader.split(' ')[1];

  try {
    const payload = TokenService.verifyAccessToken(token);
    req.user = payload;
    next();
  } catch (err: any) {
    const isExpired = err?.name === 'TokenExpiredError';
    sendError(
      res,
      isExpired ? 'TOKEN_EXPIRED' : 'INVALID_TOKEN',
      isExpired ? 'Access token has expired. Please refresh your session.' : 'Invalid access token',
      401
    );
  }
}

/**
 * Role-Based Access Control (RBAC) Middleware
 * Enforces server-side authorization checks.
 *
 * @param allowedRoles Array of roles permitted to access this resource (e.g. ['ADMIN'])
 */
export function requireRole(allowedRoles: UserRole[]) {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    if (!req.user) {
      sendError(res, 'UNAUTHORIZED', 'Authentication required', 401);
      return;
    }

    if (!allowedRoles.includes(req.user.role)) {
      // Log unauthorized access attempts for security monitoring
      await AuditService.log('ADMIN_ROLE_CHANGED', {
        userId: req.user.userId,
        username: req.user.username,
        req,
        details: {
          attemptedRoute: req.originalUrl,
          requiredRoles: allowedRoles,
          userRole: req.user.role,
          action: 'ACCESS_DENIED_FORBIDDEN',
        },
        severity: 'WARNING',
      });

      sendError(
        res,
        'FORBIDDEN',
        `Access denied. Role '${req.user.role}' lacks permission for this resource.`,
        403
      );
      return;
    }

    next();
  };
}
