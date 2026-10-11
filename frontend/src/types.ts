export type UserRole = 'GUEST' | 'USER' | 'ADMIN';
export type UserStatus = 'ACTIVE' | 'DISABLED';

export interface User {
  id: string;
  username: string;
  role: UserRole;
  status: UserStatus;
  twoFactorEnabled: boolean;
  createdAt: string;
  lastLoginAt?: string;
}

export interface AuthState {
  user: User | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  tempToken: string | null;
  requires2FA: boolean;
}

export interface AuditLog {
  id?: string;
  timestamp: string;
  eventType: string;
  userId?: string;
  username?: string;
  ipAddress?: string;
  userAgent?: string;
  details?: Record<string, unknown>;
  severity: 'INFO' | 'WARNING' | 'CRITICAL';
}

export interface BackupMetadata {
  id: string;
  timestamp: string;
  collections: string[];
  totalDocuments: number;
  checksum: string;
  filePath: string;
  status: 'COMPLETED' | 'FAILED';
}
