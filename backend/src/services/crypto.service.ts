import crypto from 'node:crypto';
import { env } from '../config/env.js';

export interface EncryptedPayload {
  ciphertext: string; // Base64 or Hex encoded encrypted data
  iv: string;         // Hex encoded 12-byte initialization vector (nonce)
  authTag: string;    // Hex encoded 16-byte authentication tag
}

export class CryptoService {
  private static readonly ALGORITHM = 'aes-256-gcm';
  private static readonly IV_LENGTH = 12; // 96 bits recommended for AES-GCM
  private static readonly AUTH_TAG_LENGTH = 16; // 128 bits authentication tag

  /**
   * Retrieves the 32-byte encryption key from the environment configuration.
   * Throws an error if the key is not exactly 32 bytes (256 bits).
   */
  private static getKey(): Buffer {
    const key = Buffer.from(env.AES_ENCRYPTION_KEY, 'hex');
    if (key.length !== 32) {
      throw new Error(`AES-256 key must be exactly 32 bytes (received ${key.length} bytes)`);
    }
    return key;
  }

  /**
   * Encrypts plaintext using AES-256-GCM.
   *
   * @param plaintext Sensitive data to encrypt (e.g. TOTP base32 secret).
   * @returns Encrypted payload containing ciphertext, IV, and GCM authentication tag.
   */
  public static encrypt(plaintext: string): EncryptedPayload {
    const key = this.getKey();

    // 1. Generate a cryptographically random, unique 12-byte IV (Nonce) for every encryption.
    // Crucial: Reusing an IV with the same AES-GCM key destroys cryptographic security.
    const iv = crypto.randomBytes(this.IV_LENGTH);

    // 2. Initialize AES-256-GCM cipher
    const cipher = crypto.createCipheriv(this.ALGORITHM, key, iv, {
      authTagLength: this.AUTH_TAG_LENGTH,
    });

    // 3. Encrypt the plaintext
    let ciphertext = cipher.update(plaintext, 'utf8', 'hex');
    ciphertext += cipher.final('hex');

    // 4. Retrieve the 16-byte authentication tag produced by Galois mode
    const authTag = cipher.getAuthTag().toString('hex');

    return {
      ciphertext,
      iv: iv.toString('hex'),
      authTag,
    };
  }

  /**
   * Decrypts and authenticates ciphertext using AES-256-GCM.
   *
   * @param ciphertext Hex-encoded encrypted data
   * @param iv Hex-encoded 12-byte initialization vector
   * @param authTag Hex-encoded 16-byte authentication tag
   * @returns Decrypted original plaintext string
   * @throws Error if the key is wrong, data has been tampered with, or tag verification fails.
   */
  public static decrypt(ciphertext: string, iv: string, authTag: string): string {
    const key = this.getKey();
    const ivBuffer = Buffer.from(iv, 'hex');
    const authTagBuffer = Buffer.from(authTag, 'hex');

    // 1. Initialize decipher
    const decipher = crypto.createDecipheriv(this.ALGORITHM, key, ivBuffer, {
      authTagLength: this.AUTH_TAG_LENGTH,
    });

    // 2. Set expected authentication tag for integrity verification
    decipher.setAuthTag(authTagBuffer);

    // 3. Decrypt data
    let decrypted = decipher.update(ciphertext, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
  }
}
