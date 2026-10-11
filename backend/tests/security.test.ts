import { describe, it, expect } from 'vitest';
import { HashService } from '../src/services/hash.service.js';
import { CryptoService } from '../src/services/crypto.service.js';
import { TotpService } from '../src/services/totp.service.js';

describe('Cryptographic & Security Primitives', () => {
  describe('Argon2id Password Hashing with Salt & Pepper', () => {
    it('should generate an Argon2id hash containing proper parameters', async () => {
      const password = 'SuperSecretPassword123!';
      const { hash, salt } = await HashService.hashPassword(password);

      expect(hash).toContain('$argon2id$');
      expect(salt).toBeDefined();
      expect(typeof salt).toBe('string');
    });

    it('should generate different hashes for the same password due to unique salts', async () => {
      const password = 'IdenticalPassword123!';
      const hash1 = await HashService.hashPassword(password);
      const hash2 = await HashService.hashPassword(password);

      expect(hash1.hash).not.toBe(hash2.hash);
      expect(hash1.salt).not.toBe(hash2.salt);
    });

    it('should successfully verify the correct password', async () => {
      const password = 'CorrectPassword456!';
      const { hash } = await HashService.hashPassword(password);

      const isValid = await HashService.verifyPassword(password, hash);
      expect(isValid).toBe(true);
    });

    it('should reject an incorrect password', async () => {
      const password = 'RealPassword789!';
      const { hash } = await HashService.hashPassword(password);

      const isValid = await HashService.verifyPassword('WrongPassword', hash);
      expect(isValid).toBe(false);
    });
  });

  describe('AES-256-GCM Authenticated Encryption', () => {
    it('should encrypt plaintext into ciphertext, IV, and GCM authentication tag', () => {
      const secret = 'JBSWY3DPEHPK3PXP'; // Base32 TOTP secret
      const encrypted = CryptoService.encrypt(secret);

      expect(encrypted.ciphertext).toBeDefined();
      expect(encrypted.iv).toHaveLength(24); // 12 bytes = 24 hex characters
      expect(encrypted.authTag).toHaveLength(32); // 16 bytes = 32 hex characters
      expect(encrypted.ciphertext).not.toBe(secret);
    });

    it('should decrypt ciphertext back to original plaintext', () => {
      const originalSecret = 'MY_CONFIDENTIAL_TOTP_SECRET';
      const encrypted = CryptoService.encrypt(originalSecret);

      const decrypted = CryptoService.decrypt(
        encrypted.ciphertext,
        encrypted.iv,
        encrypted.authTag
      );

      expect(decrypted).toBe(originalSecret);
    });

    it('should detect tampering and fail decryption if ciphertext is altered (AEAD Integrity)', () => {
      const secret = 'SECRET_DATA_TO_TAMPER';
      const encrypted = CryptoService.encrypt(secret);

      // Alter one character of the ciphertext
      const tamperedCiphertext =
        encrypted.ciphertext.slice(0, -2) + (encrypted.ciphertext.endsWith('0') ? '1' : '0');

      expect(() => {
        CryptoService.decrypt(tamperedCiphertext, encrypted.iv, encrypted.authTag);
      }).toThrow();
    });
  });

  describe('TOTP (RFC 6238) Engine', () => {
    it('should generate a valid Base32 secret and otpauth URI', () => {
      const { secret, uri } = TotpService.generateSecret('teststudent');
      expect(secret).toMatch(/^[A-Z2-7]+$/); // Base32 format
      expect(uri).toContain('otpauth://totp/SecureAuthSystem:teststudent');
    });

    it('should generate a valid QR code Data URL', async () => {
      const { uri } = TotpService.generateSecret('teststudent');
      const dataUrl = await TotpService.generateQrCodeDataUrl(uri);
      expect(dataUrl).toMatch(/^data:image\/png;base64,/);
    });
  });
});
