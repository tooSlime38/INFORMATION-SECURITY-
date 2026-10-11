export type UserRole = 'GUEST' | 'USER' | 'ADMIN';
export type UserStatus = 'ACTIVE' | 'DISABLED';

export interface UserDocument {
  id: string;                      // Internal Firestore document ID
  username: string;                // Primary login identifier (case-preserved)
  usernameLower: string;           // Normalized lowercase for uniqueness checks
  passwordHash: string;            // Argon2id hash containing salt, params, and output
  salt: string;                    // Base64-encoded unique per-user salt
  role: UserRole;                  // RBAC role: GUEST | USER | ADMIN
  status: UserStatus;              // ACTIVE | DISABLED
  twoFactorEnabled: boolean;       // Whether TOTP 2FA is active
  twoFactorVerifiedAt?: string;    // ISO timestamp when 2FA was verified
  createdAt: string;               // ISO timestamp
  updatedAt: string;               // ISO timestamp
  lastLoginAt?: string;            // ISO timestamp
}

export interface TwoFactorSecretDocument {
  userId: string;
  encryptedSecret: string;         // AES-256-GCM ciphertext
  iv: string;                      // Hex-encoded Initialization Vector (12 bytes)
  authTag: string;                 // Hex-encoded Authentication Tag (16 bytes)
  recoveryCodes: string[];         // SHA-256 hashed emergency recovery codes
  updatedAt: string;
}

export interface SessionDocument {
  id: string;                      // Session / Token ID
  userId: string;
  username: string;
  role: UserRole;
  refreshTokenHash: string;        // SHA-256 hash of the active refresh token
  userAgent?: string;
  ipAddress?: string;
  expiresAt: string;               // ISO timestamp
  createdAt: string;
}

export type AuditEventType =
  | 'AUTH_REGISTER_SUCCESS'
  | 'AUTH_REGISTER_FAILED'
  | 'AUTH_LOGIN_SUCCESS'
  | 'AUTH_LOGIN_FAILED'
  | 'AUTH_LOGOUT'
  | 'AUTH_2FA_PENDING'
  | 'AUTH_2FA_SUCCESS'
  | 'AUTH_2FA_FAILED'
  | 'AUTH_2FA_RECOVERY_USED'
  | 'AUTH_2FA_ENABLED'
  | 'AUTH_2FA_DISABLED'
  | 'USER_PASSWORD_CHANGED'
  | 'ADMIN_ROLE_CHANGED'
  | 'ADMIN_STATUS_CHANGED'
  | 'ADMIN_USER_DELETED'
  | 'BACKUP_CREATED_SUCCESS'
  | 'BACKUP_FAILED'
  | 'BACKUP_RESTORED_SUCCESS'
  | 'BACKUP_RESTORE_FAILED';

export interface AuditLogDocument {
  id?: string;
  timestamp: string;               // ISO timestamp
  eventType: AuditEventType;
  userId?: string;
  username?: string;
  ipAddress?: string;
  userAgent?: string;
  details?: Record<string, unknown>;
  severity: 'INFO' | 'WARNING' | 'CRITICAL';
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  message?: string;
  data?: T;
  error?: {
    code: string;
    details?: unknown;
  };
}

export interface TokenPayload {
  userId: string;
  username: string;
  role: UserRole;
  sessionId?: string;
}

export interface TwoFactorPendingPayload {
  userId: string;
  username: string;
  type: '2FA_PENDING';
}
