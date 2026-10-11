import type { Request, Response } from 'express';
import { db } from '../config/firebase.js';
import { AuditService } from '../services/audit.service.js';
import { sendSuccess, sendError } from '../utils/response.js';
import { changeRoleSchema, changeStatusSchema } from '../validators/auth.validator.js';
import type { UserDocument } from '../types/index.js';

export class AdminController {
  /**
   * GET /api/admin/users
   * Lists all users in the system. Password hashes and salts are stripped.
   */
  public static async listUsers(req: Request, res: Response): Promise<void> {
    const snapshot = await db.collection('users').get();

    const users = snapshot.docs.map((doc: any) => {
      const data = doc.data() as UserDocument;
      return {
        id: data.id,
        username: data.username,
        role: data.role,
        status: data.status,
        twoFactorEnabled: data.twoFactorEnabled,
        createdAt: data.createdAt,
        lastLoginAt: data.lastLoginAt,
      };
    });

    sendSuccess(res, { users, total: users.length });
  }

  /**
   * GET /api/admin/users/:id
   * Retrieves specific user details.
   */
  public static async getUser(req: Request, res: Response): Promise<void> {
    const { id } = req.params;

    const userDoc = await db.collection('users').doc(id).get();
    if (!userDoc.exists) {
      sendError(res, 'USER_NOT_FOUND', 'User does not exist', 404);
      return;
    }

    const data = userDoc.data() as UserDocument;

    sendSuccess(res, {
      id: data.id,
      username: data.username,
      role: data.role,
      status: data.status,
      twoFactorEnabled: data.twoFactorEnabled,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
      lastLoginAt: data.lastLoginAt,
    });
  }

  /**
   * PATCH /api/admin/users/:id/role
   * Modifies a user's role (GUEST, USER, ADMIN).
   */
  public static async updateRole(req: Request, res: Response): Promise<void> {
    const { id } = req.params;
    const validated = changeRoleSchema.parse(req.body);
    const adminUser = req.user!;

    // Prevent admin from demoting themselves to avoid accidental lockout
    if (adminUser.userId === id && validated.role !== 'ADMIN') {
      sendError(res, 'ACTION_FORBIDDEN', 'You cannot demote your own administrator account', 400);
      return;
    }

    const userRef = db.collection('users').doc(id);
    const userDoc = await userRef.get();
    if (!userDoc.exists) {
      sendError(res, 'USER_NOT_FOUND', 'User does not exist', 404);
      return;
    }

    const oldData = userDoc.data() as UserDocument;

    await userRef.update({
      role: validated.role,
      updatedAt: new Date().toISOString(),
    });

    await AuditService.log('ADMIN_ROLE_CHANGED', {
      userId: adminUser.userId,
      username: adminUser.username,
      req,
      details: {
        targetUserId: id,
        targetUsername: oldData.username,
        oldRole: oldData.role,
        newRole: validated.role,
      },
      severity: 'WARNING',
    });

    sendSuccess(res, { id, role: validated.role }, 'User role updated successfully');
  }

  /**
   * PATCH /api/admin/users/:id/status
   * Enables or disables an account.
   */
  public static async updateStatus(req: Request, res: Response): Promise<void> {
    const { id } = req.params;
    const validated = changeStatusSchema.parse(req.body);
    const adminUser = req.user!;

    if (adminUser.userId === id && validated.status === 'DISABLED') {
      sendError(res, 'ACTION_FORBIDDEN', 'You cannot disable your own administrator account', 400);
      return;
    }

    const userRef = db.collection('users').doc(id);
    const userDoc = await userRef.get();
    if (!userDoc.exists) {
      sendError(res, 'USER_NOT_FOUND', 'User does not exist', 404);
      return;
    }

    const oldData = userDoc.data() as UserDocument;

    await userRef.update({
      status: validated.status,
      updatedAt: new Date().toISOString(),
    });

    // If disabled, revoke all active sessions for this user
    if (validated.status === 'DISABLED') {
      const sessionsSnapshot = await db
        .collection('sessions')
        .where('userId', '==', id)
        .get();

      for (const s of sessionsSnapshot.docs) {
        await s.ref.delete();
      }
    }

    await AuditService.log('ADMIN_STATUS_CHANGED', {
      userId: adminUser.userId,
      username: adminUser.username,
      req,
      details: {
        targetUserId: id,
        targetUsername: oldData.username,
        newStatus: validated.status,
      },
      severity: 'WARNING',
    });

    sendSuccess(res, { id, status: validated.status }, `User account marked as ${validated.status}`);
  }

  /**
   * DELETE /api/admin/users/:id
   * Deletes a user account and associated documents.
   */
  public static async deleteUser(req: Request, res: Response): Promise<void> {
    const { id } = req.params;
    const adminUser = req.user!;

    if (adminUser.userId === id) {
      sendError(res, 'ACTION_FORBIDDEN', 'You cannot delete your own administrator account', 400);
      return;
    }

    const userRef = db.collection('users').doc(id);
    const userDoc = await userRef.get();
    if (!userDoc.exists) {
      sendError(res, 'USER_NOT_FOUND', 'User does not exist', 404);
      return;
    }

    const userData = userDoc.data() as UserDocument;

    // Delete user, username pointer, 2FA record, and all sessions
    await userRef.delete();
    await db.collection('usernames').doc(userData.usernameLower).delete();
    await db.collection('twoFactor').doc(id).delete();

    const sessions = await db.collection('sessions').where('userId', '==', id).get();
    for (const s of sessions.docs) {
      await s.ref.delete();
    }

    await AuditService.log('ADMIN_USER_DELETED', {
      userId: adminUser.userId,
      username: adminUser.username,
      req,
      details: {
        deletedUserId: id,
        deletedUsername: userData.username,
      },
      severity: 'CRITICAL',
    });

    sendSuccess(res, { id }, 'User deleted successfully');
  }

  /**
   * GET /api/admin/audit-logs
   * Returns recent security audit events.
   */
  public static async getAuditLogs(req: Request, res: Response): Promise<void> {
    const logs = await AuditService.getLogs(100);
    sendSuccess(res, { logs, total: logs.length });
  }
}
