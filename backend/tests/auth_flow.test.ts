import { describe, it, expect } from 'vitest';
import request from 'supertest';
import * as OTPAuth from 'otpauth';
import { app } from '../src/app.js';

describe('Authentication, 2FA, RBAC & Backup API Flow', () => {
  let adminAccessToken: string;
  let userAccessToken: string;
  let userRefreshToken: string;
  let user2faSecret: string;
  let userRecoveryCodes: string[];
  let backupSnapshotId: string;

  it('1. Register first user (should automatically be granted ADMIN role)', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        username: 'superadmin',
        password: 'AdminPassword123!',
        confirmPassword: 'AdminPassword123!',
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.user.username).toBe('superadmin');
    expect(res.body.data.user.role).toBe('ADMIN');
    expect(res.body.data.accessToken).toBeDefined();

    adminAccessToken = res.body.data.accessToken;
  });

  it('2. Register second user (should be granted standard USER role)', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        username: 'studentuser',
        password: 'StudentPassword123!',
        confirmPassword: 'StudentPassword123!',
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.user.username).toBe('studentuser');
    expect(res.body.data.user.role).toBe('USER');
    expect(res.body.data.accessToken).toBeDefined();

    userAccessToken = res.body.data.accessToken;
    userRefreshToken = res.body.data.refreshToken;
  });

  it('3. Prevent duplicate username registration (Uniqueness constraint)', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        username: 'STUDENTUSER', // Case-insensitive collision check
        password: 'AnotherPassword123!',
        confirmPassword: 'AnotherPassword123!',
      });

    expect(res.status).toBe(409);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('USERNAME_TAKEN');
  });

  it('4. Reject invalid login credentials with generic error', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({
        username: 'studentuser',
        password: 'WrongPassword999!',
      });

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('INVALID_CREDENTIALS');
  });

  it('5. Enforce RBAC: Non-admin USER is blocked from admin routes (403 Forbidden)', async () => {
    const res = await request(app)
      .get('/api/admin/users')
      .set('Authorization', `Bearer ${userAccessToken}`);

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('FORBIDDEN');
  });

  it('6. Enforce RBAC: ADMIN is allowed to access admin routes (200 OK)', async () => {
    const res = await request(app)
      .get('/api/admin/users')
      .set('Authorization', `Bearer ${adminAccessToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.users.length).toBeGreaterThanOrEqual(2);
  });

  it('7. Initiate 2FA Setup for standard user (produces encrypted secret & QR code)', async () => {
    const res = await request(app)
      .post('/api/auth/2fa/setup')
      .set('Authorization', `Bearer ${userAccessToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.qrCode).toMatch(/^data:image\/png;base64,/);
    expect(res.body.data.secret).toBeDefined();
    expect(res.body.data.recoveryCodes).toHaveLength(8);

    user2faSecret = res.body.data.secret;
    userRecoveryCodes = res.body.data.recoveryCodes;
  });

  it('8. Complete 2FA activation by verifying a valid 6-digit TOTP code', async () => {
    // Generate valid TOTP code using the shared secret
    const totp = new OTPAuth.TOTP({
      issuer: 'SecureAuthSystem',
      algorithm: 'SHA1',
      digits: 6,
      period: 30,
      secret: OTPAuth.Secret.fromBase32(user2faSecret),
    });
    const validCode = totp.generate();

    const res = await request(app)
      .post('/api/auth/2fa/enable')
      .set('Authorization', `Bearer ${userAccessToken}`)
      .send({ code: validCode });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.twoFactorEnabled).toBe(true);
  });

  it('9. Login flow when 2FA is active (must return temporary token, not session token)', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({
        username: 'studentuser',
        password: 'StudentPassword123!',
      });

    expect(res.status).toBe(200);
    expect(res.body.data.requires2FA).toBe(true);
    expect(res.body.data.tempToken).toBeDefined();
    expect(res.body.data.accessToken).toBeUndefined(); // Crucial: No access token yet!

    // Now complete 2FA verification using emergency recovery code
    const recoveryCodeToUse = userRecoveryCodes[0];
    const verifyRes = await request(app)
      .post('/api/auth/verify-2fa')
      .send({
        tempToken: res.body.data.tempToken,
        code: recoveryCodeToUse,
        isRecoveryCode: true,
      });

    expect(verifyRes.status).toBe(200);
    expect(verifyRes.body.success).toBe(true);
    expect(verifyRes.body.data.accessToken).toBeDefined();
  });

  it('10. Refresh token rotation test', async () => {
    const res = await request(app)
      .post('/api/auth/refresh')
      .send({ refreshToken: userRefreshToken });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.accessToken).toBeDefined();
    expect(res.body.data.refreshToken).toBeDefined();
    expect(res.body.data.refreshToken).not.toBe(userRefreshToken); // Rotated!
  });

  it('11. Database Backup & Disaster Recovery API Demonstration', async () => {
    // 1. Create Backup Snapshot
    const backupRes = await request(app)
      .post('/api/admin/backups/create')
      .set('Authorization', `Bearer ${adminAccessToken}`);

    expect(backupRes.status).toBe(201);
    expect(backupRes.body.success).toBe(true);
    expect(backupRes.body.data.checksum).toBeDefined();
    expect(backupRes.body.data.totalDocuments).toBeGreaterThan(0);

    backupSnapshotId = backupRes.body.data.id;

    // 2. List Backups
    const listRes = await request(app)
      .get('/api/admin/backups')
      .set('Authorization', `Bearer ${adminAccessToken}`);

    expect(listRes.status).toBe(200);
    expect(listRes.body.data.backups.length).toBeGreaterThan(0);

    // 3. Restore Database from Snapshot
    const restoreRes = await request(app)
      .post(`/api/admin/backups/restore/${backupSnapshotId}`)
      .set('Authorization', `Bearer ${adminAccessToken}`);

    expect(restoreRes.status).toBe(200);
    expect(restoreRes.body.success).toBe(true);
    expect(restoreRes.body.data.restoredDocuments).toBeGreaterThan(0);
  });

  it('12. Security Audit Log Inspection', async () => {
    const res = await request(app)
      .get('/api/admin/audit-logs')
      .set('Authorization', `Bearer ${adminAccessToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.logs.length).toBeGreaterThan(0);
  });
});
