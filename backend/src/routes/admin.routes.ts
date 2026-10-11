import { Router } from 'express';
import { AdminController } from '../controllers/admin.controller.js';
import { authenticate, requireRole } from '../middleware/auth.middleware.js';
import { BackupService } from '../services/backup.service.js';
import { sendSuccess } from '../utils/response.js';

export const adminRouter = Router();

// All admin routes strictly require valid authentication AND 'ADMIN' role
adminRouter.use(authenticate, requireRole(['ADMIN']));

// User Management
adminRouter.get('/users', AdminController.listUsers);
adminRouter.get('/users/:id', AdminController.getUser);
adminRouter.patch('/users/:id/role', AdminController.updateRole);
adminRouter.patch('/users/:id/status', AdminController.updateStatus);
adminRouter.delete('/users/:id', AdminController.deleteUser);

// Security Audit Logs
adminRouter.get('/audit-logs', AdminController.getAuditLogs);

// Database Backups & Disaster Recovery Management
adminRouter.get('/backups', async (req, res, next) => {
  try {
    const backups = await BackupService.listBackups();
    sendSuccess(res, { backups, total: backups.length });
  } catch (err) {
    next(err);
  }
});

adminRouter.post('/backups/create', async (req, res, next) => {
  try {
    const backup = await BackupService.createBackup();
    sendSuccess(res, backup, 'Automated backup snapshot created successfully', 201);
  } catch (err) {
    next(err);
  }
});

adminRouter.post('/backups/restore/:id', async (req, res, next) => {
  try {
    const result = await BackupService.restoreBackup(req.params.id);
    sendSuccess(res, result, 'Database restored successfully from snapshot');
  } catch (err) {
    next(err);
  }
});
