import type { Request, Response } from 'express';
import { db } from '../config/firebase.js';
import { sendSuccess, sendError } from '../utils/response.js';
import type { UserDocument } from '../types/index.js';

export class UserController {
  /**
   * GET /api/users/me
   * Retrieves profile information for the authenticated user.
   */
  public static async getMe(req: Request, res: Response): Promise<void> {
    const userPayload = req.user!;

    const userDoc = await db.collection('users').doc(userPayload.userId).get();
    if (!userDoc.exists) {
      sendError(res, 'USER_NOT_FOUND', 'User profile not found', 404);
      return;
    }

    const user = userDoc.data() as UserDocument;

    sendSuccess(res, {
      id: user.id,
      username: user.username,
      role: user.role,
      status: user.status,
      twoFactorEnabled: user.twoFactorEnabled,
      createdAt: user.createdAt,
      lastLoginAt: user.lastLoginAt,
    });
  }
}
