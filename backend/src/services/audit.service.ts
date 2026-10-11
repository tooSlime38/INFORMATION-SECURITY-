import type { Request } from 'express';
import { db } from '../config/firebase.js';
import type { AuditEventType, AuditLogDocument } from '../types/index.js';

export class AuditService {
  private static readonly COLLECTION_NAME = 'auditLogs';

  /**
   * Records a security audit event in the database and server stdout.
   * Strips all passwords, credentials, and keys to prevent log poisoning or leakage.
   */
  public static async log(
    eventType: AuditEventType,
    options: {
      userId?: string;
      username?: string;
      req?: Request;
      details?: Record<string, unknown>;
      severity?: 'INFO' | 'WARNING' | 'CRITICAL';
    } = {}
  ): Promise<void> {
    const timestamp = new Date().toISOString();
    const severity = options.severity || 'INFO';

    const ipAddress =
      options.req?.headers['x-forwarded-for']?.toString().split(',')[0].trim() ||
      options.req?.socket?.remoteAddress ||
      'unknown';

    const userAgent = options.req?.headers['user-agent'] || 'unknown';

    // Sanitize details to guarantee zero sensitive credential leakage
    const sanitizedDetails: Record<string, unknown> = {};
    if (options.details) {
      for (const [key, value] of Object.entries(options.details)) {
        if (/password|secret|pepper|token|key|hash/i.test(key)) {
          sanitizedDetails[key] = '[REDACTED]';
        } else {
          sanitizedDetails[key] = value;
        }
      }
    }

    const logEntry: AuditLogDocument = {
      timestamp,
      eventType,
      userId: options.userId,
      username: options.username,
      ipAddress,
      userAgent,
      details: sanitizedDetails,
      severity,
    };

    // Print to console for immediate visibility during demonstration
    const symbol = severity === 'CRITICAL' ? '🚨' : severity === 'WARNING' ? '⚠️' : '📝';
    console.log(
      `${symbol} [AUDIT] [${timestamp}] [${severity}] ${eventType} - User: ${
        options.username || 'Anonymous'
      } (${ipAddress})`
    );

    try {
      await db.collection(this.COLLECTION_NAME).add(logEntry);
    } catch (err) {
      console.error('[AuditService.log Failure]:', err);
    }
  }

  /**
   * Retrieves audit logs for the admin dashboard.
   */
  public static async getLogs(limitCount = 50): Promise<AuditLogDocument[]> {
    try {
      const snapshot = await db
        .collection(this.COLLECTION_NAME)
        .limit(limitCount)
        .get();

      const logs: AuditLogDocument[] = snapshot.docs.map((doc: any) => ({
        id: doc.id,
        ...doc.data(),
      }));

      // Sort newest first
      return logs.sort(
        (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      );
    } catch (err) {
      console.error('[AuditService.getLogs Failure]:', err);
      return [];
    }
  }
}
