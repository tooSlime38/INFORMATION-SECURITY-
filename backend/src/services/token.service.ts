import jwt from 'jsonwebtoken';
import crypto from 'node:crypto';
import type { Response } from 'express';
import { env } from '../config/env.js';
import type { TokenPayload, TwoFactorPendingPayload } from '../types/index.js';

export class TokenService {
  /**
   * Generates a short-lived signed JWT access token (e.g. 15 minutes).
   */
  public static generateAccessToken(payload: TokenPayload): string {
    return jwt.sign(payload, env.JWT_ACCESS_SECRET, {
      expiresIn: env.JWT_ACCESS_EXPIRES_IN as any,
    });
  }

  /**
   * Generates a cryptographically random refresh token string.
   */
  public static generateRefreshTokenString(): string {
    return crypto.randomBytes(40).toString('hex');
  }

  /**
   * Generates a short-lived restricted JWT for intermediate 2FA verification.
   * This token CANNOT access any protected routes except POST /api/auth/verify-2fa.
   */
  public static generateTwoFactorPendingToken(userId: string, username: string): string {
    const payload: TwoFactorPendingPayload = {
      userId,
      username,
      type: '2FA_PENDING',
    };
    return jwt.sign(payload, env.JWT_2FA_SECRET, {
      expiresIn: env.JWT_2FA_EXPIRES_IN as any,
    });
  }

  /**
   * Verifies an access token and returns its decoded payload.
   */
  public static verifyAccessToken(token: string): TokenPayload {
    return jwt.verify(token, env.JWT_ACCESS_SECRET) as TokenPayload;
  }

  /**
   * Verifies a 2FA pending intermediate token.
   */
  public static verifyTwoFactorPendingToken(token: string): TwoFactorPendingPayload {
    return jwt.verify(token, env.JWT_2FA_SECRET) as TwoFactorPendingPayload;
  }

  /**
   * Sets the refresh token as an HttpOnly, SameSite=Strict cookie for web clients.
   * This protects web clients from Cross-Site Scripting (XSS) token theft.
   */
  public static setRefreshTokenCookie(res: Response, refreshToken: string): void {
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: env.NODE_ENV === 'production',
      sameSite: env.NODE_ENV === 'production' ? 'strict' : 'lax',
      path: '/api/auth',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days in milliseconds
    });
  }

  /**
   * Clears the refresh token cookie upon logout.
   */
  public static clearRefreshTokenCookie(res: Response): void {
    res.clearCookie('refreshToken', {
      httpOnly: true,
      secure: env.NODE_ENV === 'production',
      sameSite: env.NODE_ENV === 'production' ? 'strict' : 'lax',
      path: '/api/auth',
    });
  }
}
