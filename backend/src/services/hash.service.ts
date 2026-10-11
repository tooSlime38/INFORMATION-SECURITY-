import argon2 from 'argon2';
import crypto from 'node:crypto';
import { env } from '../config/env.js';

export class HashService {
  /**
   * Combines the plaintext password with the server-side pepper using HMAC-SHA256.
   * This guarantees that even if an attacker gains read access to the Firestore database,
   * they cannot execute offline dictionary attacks or rainbow table attacks without
   * the server-side pepper secret stored outside the database.
   */
  private static pepperPassword(password: string): string {
    return crypto.createHmac('sha256', env.ARGON2_PEPPER).update(password).digest('hex');
  }

  /**
   * Generates a cryptographically secure random salt and computes the Argon2id hash.
   *
   * @param password The plaintext password provided by the user.
   * @returns Object containing the formatted Argon2id hash string and the unique salt.
   */
  public static async hashPassword(
    password: string
  ): Promise<{ hash: string; salt: string }> {
    // 1. Generate 16 cryptographically secure random bytes (128 bits of entropy)
    const rawSalt = crypto.randomBytes(16);
    const saltBase64 = rawSalt.toString('base64');

    // 2. Pre-process password with server-side pepper
    const pepperedPassword = this.pepperPassword(password);

    // 3. Compute Argon2id hash with recommended OWASP memory and time cost parameters
    const hash = await argon2.hash(pepperedPassword, {
      type: argon2.argon2id,
      memoryCost: 65536, // 64 MB of RAM
      timeCost: 3,       // 3 iterations
      parallelism: 4,    // 4 parallel threads
      salt: rawSalt,
    });

    return { hash, salt: saltBase64 };
  }

  /**
   * Verifies a candidate password against an existing Argon2id hash using constant-time comparison.
   *
   * @param candidatePassword The plaintext password submitted during login.
   * @param storedHash The Argon2id hash retrieved from Firestore.
   * @returns True if password matches, false otherwise.
   */
  public static async verifyPassword(
    candidatePassword: string,
    storedHash: string
  ): Promise<boolean> {
    try {
      const pepperedPassword = this.pepperPassword(candidatePassword);
      return await argon2.verify(storedHash, pepperedPassword);
    } catch (err) {
      console.error('[HashService.verifyPassword Error]:', err);
      return false;
    }
  }

  /**
   * Computes a fast, one-way SHA-256 hash.
   * Used for indexing token identifiers and hashing one-time recovery codes.
   */
  public static hashSha256(data: string): string {
    return crypto.createHash('sha256').update(data).digest('hex');
  }

  /**
   * Generates cryptographically secure random recovery codes for 2FA emergency access.
   * Format: 8 blocks of 10 alphanumeric characters (e.g. "a1b2-c3d4-e5")
   */
  public static generateRecoveryCodes(count = 8): { plaintextCodes: string[]; hashedCodes: string[] } {
    const plaintextCodes: string[] = [];
    const hashedCodes: string[] = [];

    for (let i = 0; i < count; i++) {
      const code = crypto.randomBytes(5).toString('hex').toUpperCase(); // 10 chars
      const formatted = `${code.slice(0, 5)}-${code.slice(5)}`;
      plaintextCodes.push(formatted);
      hashedCodes.push(this.hashSha256(formatted));
    }

    return { plaintextCodes, hashedCodes };
  }
}
