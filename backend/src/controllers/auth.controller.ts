import type { Request, Response } from 'express';
import crypto from 'node:crypto';
import { db } from '../config/firebase.js';
import { HashService } from '../services/hash.service.js';
import { CryptoService } from '../services/crypto.service.js';
import { TotpService } from '../services/totp.service.js';
import { TokenService } from '../services/token.service.js';
import { AuditService } from '../services/audit.service.js';
import { sendSuccess, sendError } from '../utils/response.js';
import {
  registerSchema,
  loginSchema,
  verify2faSchema,
  enable2faSchema,
  disable2faSchema,
} from '../validators/auth.validator.js';
import type {
  UserDocument,
  TwoFactorSecretDocument,
  SessionDocument,
  UserRole,
} from '../types/index.js';

export class AuthController {
  /**
   * POST /api/auth/register
   * Registers a new user using strictly Username + Password.
   */
  public static async register(req: Request, res: Response): Promise<void> {
    const validated = registerSchema.parse(req.body);
    const usernameTrimmed = validated.username.trim();
    const usernameLower = usernameTrimmed.toLowerCase();

    const usernameRef = db.collection('usernames').doc(usernameLower);
    const usersCollection = db.collection('users');

    // Atomic transaction: verify uniqueness and create user simultaneously
    const result = await db.runTransaction(async (transaction: any) => {
      const usernameDoc = await transaction.get(usernameRef);
      if (usernameDoc.exists) {
        return { error: 'USERNAME_EXISTS' };
      }

      // Check if this is the very first user in the system (auto-assign ADMIN role)
      const allUsers = await usersCollection.limit(1).get();
      const isFirstUser = allUsers.empty;
      const role: UserRole = isFirstUser ? 'ADMIN' : 'USER';

      // Hash password using Argon2id with unique salt and server-side pepper
      const { hash, salt } = await HashService.hashPassword(validated.password);

      const userId = crypto.randomUUID();
      const now = new Date().toISOString();

      const newUser: UserDocument = {
        id: userId,
        username: usernameTrimmed,
        usernameLower,
        passwordHash: hash,
        salt,
        role,
        status: 'ACTIVE',
        twoFactorEnabled: false,
        createdAt: now,
        updatedAt: now,
      };

      const userDocRef = usersCollection.doc(userId);
      transaction.set(userDocRef, newUser);
      transaction.set(usernameRef, { userId, createdAt: now });

      return { user: newUser };
    });

    if ('error' in result && result.error === 'USERNAME_EXISTS') {
      await AuditService.log('AUTH_REGISTER_FAILED', {
        username: usernameTrimmed,
        req,
        details: { reason: 'Username already taken' },
        severity: 'WARNING',
      });
      sendError(res, 'USERNAME_TAKEN', 'That username is already taken. Please choose another.', 409);
      return;
    }

    const createdUser = result.user!;

    // Create session & tokens
    const sessionId = crypto.randomUUID();
    const rawRefreshToken = TokenService.generateRefreshTokenString();
    const refreshTokenHash = HashService.hashSha256(rawRefreshToken);

    const now = new Date();
    const expiresAt = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString();

    const sessionDoc: SessionDocument = {
      id: sessionId,
      userId: createdUser.id,
      username: createdUser.username,
      role: createdUser.role,
      refreshTokenHash,
      userAgent: req.headers['user-agent'],
      ipAddress: req.socket?.remoteAddress,
      createdAt: now.toISOString(),
      expiresAt,
    };

    await db.collection('sessions').doc(sessionId).set(sessionDoc);

    const accessToken = TokenService.generateAccessToken({
      userId: createdUser.id,
      username: createdUser.username,
      role: createdUser.role,
      sessionId,
    });

    // Set HttpOnly cookie for web clients
    TokenService.setRefreshTokenCookie(res, rawRefreshToken);

    await AuditService.log('AUTH_REGISTER_SUCCESS', {
      userId: createdUser.id,
      username: createdUser.username,
      req,
      details: { role: createdUser.role },
      severity: 'INFO',
    });

    sendSuccess(
      res,
      {
        user: {
          id: createdUser.id,
          username: createdUser.username,
          role: createdUser.role,
          status: createdUser.status,
          twoFactorEnabled: createdUser.twoFactorEnabled,
          createdAt: createdUser.createdAt,
        },
        accessToken,
        refreshToken: rawRefreshToken, // provided in response for mobile storage
      },
      'User registered successfully',
      201
    );
  }

  /**
   * POST /api/auth/login
   * Authenticates username + password. If 2FA enabled, returns temporary token.
   */
  public static async login(req: Request, res: Response): Promise<void> {
    const validated = loginSchema.parse(req.body);
    const usernameLower = validated.username.trim().toLowerCase();

    // Query user by normalized username
    const userSnapshot = await db
      .collection('users')
      .where('usernameLower', '==', usernameLower)
      .limit(1)
      .get();

    if (userSnapshot.empty) {
      await AuditService.log('AUTH_LOGIN_FAILED', {
        username: validated.username,
        req,
        details: { reason: 'User not found' },
        severity: 'WARNING',
      });
      // Generic message to prevent username enumeration
      sendError(res, 'INVALID_CREDENTIALS', 'Invalid username or password', 401);
      return;
    }

    const userDoc = userSnapshot.docs[0];
    const user = userDoc.data() as UserDocument;

    // Check account status
    if (user.status === 'DISABLED') {
      await AuditService.log('AUTH_LOGIN_FAILED', {
        userId: user.id,
        username: user.username,
        req,
        details: { reason: 'Account disabled' },
        severity: 'WARNING',
      });
      sendError(res, 'ACCOUNT_DISABLED', 'Your account has been disabled by an administrator', 403);
      return;
    }

    // Verify password with Argon2id + pepper
    const isPasswordValid = await HashService.verifyPassword(
      validated.password,
      user.passwordHash
    );

    if (!isPasswordValid) {
      await AuditService.log('AUTH_LOGIN_FAILED', {
        userId: user.id,
        username: user.username,
        req,
        details: { reason: 'Incorrect password' },
        severity: 'WARNING',
      });
      sendError(res, 'INVALID_CREDENTIALS', 'Invalid username or password', 401);
      return;
    }

    // If 2FA is enabled, do NOT issue access tokens yet!
    // Issue a restricted short-lived 2FA_PENDING token instead.
    if (user.twoFactorEnabled) {
      const tempToken = TokenService.generateTwoFactorPendingToken(user.id, user.username);

      await AuditService.log('AUTH_2FA_PENDING', {
        userId: user.id,
        username: user.username,
        req,
        details: { message: '2FA challenge initiated' },
        severity: 'INFO',
      });

      sendSuccess(
        res,
        {
          requires2FA: true,
          tempToken,
        },
        'Two-factor authentication required'
      );
      return;
    }

    // If 2FA is not enabled, log in directly
    const sessionId = crypto.randomUUID();
    const rawRefreshToken = TokenService.generateRefreshTokenString();
    const refreshTokenHash = HashService.hashSha256(rawRefreshToken);

    const now = new Date();
    const expiresAt = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString();

    const sessionDoc: SessionDocument = {
      id: sessionId,
      userId: user.id,
      username: user.username,
      role: user.role,
      refreshTokenHash,
      userAgent: req.headers['user-agent'],
      ipAddress: req.socket?.remoteAddress,
      createdAt: now.toISOString(),
      expiresAt,
    };

    await db.collection('sessions').doc(sessionId).set(sessionDoc);

    // Update lastLoginAt on user document
    await db.collection('users').doc(user.id).update({
      lastLoginAt: now.toISOString(),
    });

    const accessToken = TokenService.generateAccessToken({
      userId: user.id,
      username: user.username,
      role: user.role,
      sessionId,
    });

    TokenService.setRefreshTokenCookie(res, rawRefreshToken);

    await AuditService.log('AUTH_LOGIN_SUCCESS', {
      userId: user.id,
      username: user.username,
      req,
      details: { role: user.role, twoFactor: false },
      severity: 'INFO',
    });

    sendSuccess(
      res,
      {
        requires2FA: false,
        user: {
          id: user.id,
          username: user.username,
          role: user.role,
          status: user.status,
          twoFactorEnabled: user.twoFactorEnabled,
          createdAt: user.createdAt,
        },
        accessToken,
        refreshToken: rawRefreshToken,
      },
      'Login successful'
    );
  }

  /**
   * POST /api/auth/verify-2fa
   * Completes login by verifying TOTP code or emergency recovery code.
   */
  public static async verify2fa(req: Request, res: Response): Promise<void> {
    const validated = verify2faSchema.parse(req.body);

    let payload;
    try {
      payload = TokenService.verifyTwoFactorPendingToken(validated.tempToken);
    } catch {
      sendError(res, 'INVALID_TOKEN', '2FA session has expired or is invalid. Please log in again.', 401);
      return;
    }

    const userDoc = await db.collection('users').doc(payload.userId).get();
    if (!userDoc.exists) {
      sendError(res, 'USER_NOT_FOUND', 'User record not found', 404);
      return;
    }

    const user = userDoc.data() as UserDocument;

    // Fetch encrypted 2FA record
    const twoFactorDoc = await db.collection('twoFactor').doc(user.id).get();
    if (!twoFactorDoc.exists) {
      sendError(res, '2FA_NOT_CONFIGURED', 'Two-factor configuration missing for user', 400);
      return;
    }

    const twoFactorData = twoFactorDoc.data() as TwoFactorSecretDocument;

    let isCodeValid = false;
    let usedRecovery = false;

    if (validated.isRecoveryCode) {
      // Emergency recovery code verification
      const codeHash = HashService.hashSha256(validated.code.trim().toUpperCase());
      const codeIndex = twoFactorData.recoveryCodes.indexOf(codeHash);

      if (codeIndex !== -1) {
        isCodeValid = true;
        usedRecovery = true;
        // Consume the one-time recovery code (delete it from database)
        const updatedCodes = [...twoFactorData.recoveryCodes];
        updatedCodes.splice(codeIndex, 1);
        await db.collection('twoFactor').doc(user.id).update({
          recoveryCodes: updatedCodes,
        });

        await AuditService.log('AUTH_2FA_RECOVERY_USED', {
          userId: user.id,
          username: user.username,
          req,
          details: { remainingCodes: updatedCodes.length },
          severity: 'WARNING',
        });
      }
    } else {
      // Standard TOTP Verification: Decrypt secret using AES-256-GCM
      try {
        const decryptedSecret = CryptoService.decrypt(
          twoFactorData.encryptedSecret,
          twoFactorData.iv,
          twoFactorData.authTag
        );

        isCodeValid = TotpService.verifyToken(validated.code.trim(), decryptedSecret);
      } catch (err) {
        console.error('[AES Decryption Error during 2FA]:', err);
        sendError(res, 'CRYPTO_ERROR', 'Cryptographic verification failure', 500);
        return;
      }
    }

    if (!isCodeValid) {
      await AuditService.log('AUTH_2FA_FAILED', {
        userId: user.id,
        username: user.username,
        req,
        details: { isRecoveryCode: validated.isRecoveryCode },
        severity: 'WARNING',
      });
      sendError(res, 'INVALID_2FA_CODE', 'Invalid 2FA authentication code', 401);
      return;
    }

    // Create session and finalize authentication
    const sessionId = crypto.randomUUID();
    const rawRefreshToken = TokenService.generateRefreshTokenString();
    const refreshTokenHash = HashService.hashSha256(rawRefreshToken);

    const now = new Date();
    const expiresAt = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString();

    const sessionDoc: SessionDocument = {
      id: sessionId,
      userId: user.id,
      username: user.username,
      role: user.role,
      refreshTokenHash,
      userAgent: req.headers['user-agent'],
      ipAddress: req.socket?.remoteAddress,
      createdAt: now.toISOString(),
      expiresAt,
    };

    await db.collection('sessions').doc(sessionId).set(sessionDoc);

    await db.collection('users').doc(user.id).update({
      lastLoginAt: now.toISOString(),
    });

    const accessToken = TokenService.generateAccessToken({
      userId: user.id,
      username: user.username,
      role: user.role,
      sessionId,
    });

    TokenService.setRefreshTokenCookie(res, rawRefreshToken);

    await AuditService.log('AUTH_2FA_SUCCESS', {
      userId: user.id,
      username: user.username,
      req,
      details: { role: user.role, usedRecoveryCode: usedRecovery },
      severity: 'INFO',
    });

    sendSuccess(
      res,
      {
        user: {
          id: user.id,
          username: user.username,
          role: user.role,
          status: user.status,
          twoFactorEnabled: user.twoFactorEnabled,
          createdAt: user.createdAt,
        },
        accessToken,
        refreshToken: rawRefreshToken,
      },
      '2FA verification successful. Logged in.'
    );
  }

  /**
   * POST /api/auth/refresh
   * Rotates refresh tokens and issues a fresh access token.
   */
  public static async refresh(req: Request, res: Response): Promise<void> {
    // Read from HttpOnly cookie (Web) OR body (Mobile)
    const tokenCandidate = req.cookies?.refreshToken || req.body?.refreshToken;

    if (!tokenCandidate) {
      sendError(res, 'UNAUTHORIZED', 'No refresh token provided', 401);
      return;
    }

    const tokenHash = HashService.hashSha256(tokenCandidate);

    const sessionSnapshot = await db
      .collection('sessions')
      .where('refreshTokenHash', '==', tokenHash)
      .limit(1)
      .get();

    if (sessionSnapshot.empty) {
      sendError(res, 'INVALID_SESSION', 'Refresh token is invalid or has been revoked', 401);
      return;
    }

    const sessionDoc = sessionSnapshot.docs[0];
    const session = sessionDoc.data() as SessionDocument;

    // Check expiration
    if (new Date(session.expiresAt).getTime() < Date.now()) {
      await sessionDoc.ref.delete();
      sendError(res, 'SESSION_EXPIRED', 'Session expired. Please log in again.', 401);
      return;
    }

    // Refresh Token Rotation: revoke current token and generate new one
    const newRefreshToken = TokenService.generateRefreshTokenString();
    const newRefreshTokenHash = HashService.hashSha256(newRefreshToken);

    await sessionDoc.ref.update({
      refreshTokenHash: newRefreshTokenHash,
    });

    const newAccessToken = TokenService.generateAccessToken({
      userId: session.userId,
      username: session.username,
      role: session.role,
      sessionId: session.id,
    });

    TokenService.setRefreshTokenCookie(res, newRefreshToken);

    sendSuccess(res, {
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
    });
  }

  /**
   * POST /api/auth/logout
   * Revokes the current session and clears cookies.
   */
  public static async logout(req: Request, res: Response): Promise<void> {
    const tokenCandidate = req.cookies?.refreshToken || req.body?.refreshToken;

    if (tokenCandidate) {
      const tokenHash = HashService.hashSha256(tokenCandidate);
      const sessionSnapshot = await db
        .collection('sessions')
        .where('refreshTokenHash', '==', tokenHash)
        .get();

      for (const doc of sessionSnapshot.docs) {
        await doc.ref.delete();
      }
    }

    TokenService.clearRefreshTokenCookie(res);

    if (req.user) {
      await AuditService.log('AUTH_LOGOUT', {
        userId: req.user.userId,
        username: req.user.username,
        req,
      });
    }

    sendSuccess(res, null, 'Logged out successfully');
  }

  /**
   * POST /api/auth/2fa/setup
   * Generates a new TOTP secret, encrypts it using AES-256-GCM, and produces a QR Code.
   */
  public static async setup2fa(req: Request, res: Response): Promise<void> {
    const user = req.user!;

    // 1. Generate TOTP secret and uri
    const { secret, uri } = TotpService.generateSecret(user.username);

    // 2. Encrypt the secret using AES-256-GCM before saving to database
    const encrypted = CryptoService.encrypt(secret);

    // 3. Generate 8 emergency one-time recovery codes
    const { plaintextCodes, hashedCodes } = HashService.generateRecoveryCodes();

    // 4. Save to twoFactor collection (pending verification)
    const twoFactorDoc: TwoFactorSecretDocument = {
      userId: user.userId,
      encryptedSecret: encrypted.ciphertext,
      iv: encrypted.iv,
      authTag: encrypted.authTag,
      recoveryCodes: hashedCodes,
      updatedAt: new Date().toISOString(),
    };

    await db.collection('twoFactor').doc(user.userId).set(twoFactorDoc);

    // 5. Generate QR Code image Data URL
    const qrCodeDataUrl = await TotpService.generateQrCodeDataUrl(uri);

    sendSuccess(
      res,
      {
        qrCode: qrCodeDataUrl,
        secret, // Plaintext secret shown only during setup for manual entry
        recoveryCodes: plaintextCodes, // Shown only once so user can print/save
      },
      'Scan the QR code in your authenticator app and save your recovery codes.'
    );
  }

  /**
   * POST /api/auth/2fa/enable
   * Confirms setup by verifying the first TOTP code and activates 2FA.
   */
  public static async enable2fa(req: Request, res: Response): Promise<void> {
    const validated = enable2faSchema.parse(req.body);
    const user = req.user!;

    const twoFactorDoc = await db.collection('twoFactor').doc(user.userId).get();
    if (!twoFactorDoc.exists) {
      sendError(res, 'SETUP_NOT_INITIATED', 'Please initiate 2FA setup first', 400);
      return;
    }

    const twoFactorData = twoFactorDoc.data() as TwoFactorSecretDocument;

    // Decrypt TOTP secret with AES-256-GCM
    const decryptedSecret = CryptoService.decrypt(
      twoFactorData.encryptedSecret,
      twoFactorData.iv,
      twoFactorData.authTag
    );

    // Verify user entered correct code from their app
    const isValid = TotpService.verifyToken(validated.code, decryptedSecret);
    if (!isValid) {
      sendError(res, 'INVALID_CODE', 'Incorrect 6-digit code. Please check your app.', 400);
      return;
    }

    // Activate 2FA on user document
    await db.collection('users').doc(user.userId).update({
      twoFactorEnabled: true,
      twoFactorVerifiedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    await AuditService.log('AUTH_2FA_ENABLED', {
      userId: user.userId,
      username: user.username,
      req,
      severity: 'INFO',
    });

    sendSuccess(res, { twoFactorEnabled: true }, 'Two-factor authentication successfully enabled.');
  }

  /**
   * POST /api/auth/2fa/disable
   * Disables 2FA (requires current password confirmation for security).
   */
  public static async disable2fa(req: Request, res: Response): Promise<void> {
    const validated = disable2faSchema.parse(req.body);
    const user = req.user!;

    const userDoc = await db.collection('users').doc(user.userId).get();
    const userData = userDoc.data() as UserDocument;

    // Verify current password
    const isPasswordValid = await HashService.verifyPassword(
      validated.password,
      userData.passwordHash
    );

    if (!isPasswordValid) {
      sendError(res, 'INVALID_PASSWORD', 'Incorrect password. Cannot disable 2FA.', 401);
      return;
    }

    // Disable 2FA on user doc and delete secret record
    await db.collection('users').doc(user.userId).update({
      twoFactorEnabled: false,
      updatedAt: new Date().toISOString(),
    });

    await db.collection('twoFactor').doc(user.userId).delete();

    await AuditService.log('AUTH_2FA_DISABLED', {
      userId: user.userId,
      username: user.username,
      req,
      severity: 'WARNING',
    });

    sendSuccess(res, { twoFactorEnabled: false }, 'Two-factor authentication has been disabled.');
  }
}
