import * as OTPAuth from 'otpauth';
import QRCode from 'qrcode';

export class TotpService {
  private static readonly ISSUER = 'SecureAuthSystem';

  /**
   * Generates a new cryptographically random TOTP secret and corresponding otpauth URL.
   *
   * @param username The user's account name.
   */
  public static generateSecret(username: string): { secret: string; uri: string } {
    const totp = new OTPAuth.TOTP({
      issuer: this.ISSUER,
      label: username,
      algorithm: 'SHA1',
      digits: 6,
      period: 30,
      secret: new OTPAuth.Secret({ size: 20 }), // 160 bits of entropy
    });

    return {
      secret: totp.secret.base32,
      uri: totp.toString(),
    };
  }

  /**
   * Generates a base64 Data URL QR code from the otpauth URI for easy display in web/mobile.
   *
   * @param uri The otpauth:// URI
   * @returns Base64 PNG data URL string
   */
  public static async generateQrCodeDataUrl(uri: string): Promise<string> {
    return QRCode.toDataURL(uri, {
      errorCorrectionLevel: 'M',
      margin: 2,
      width: 256,
      color: {
        dark: '#000000',
        light: '#ffffff',
      },
    });
  }

  /**
   * Verifies a 6-digit TOTP code against the decrypted Base32 secret.
   * Allows a clock drift window of +/- 1 time-step (30 seconds) to account for slight clock skew.
   *
   * @param token 6-digit code entered by user
   * @param secret Decrypted Base32 secret
   */
  public static verifyToken(token: string, secret: string): boolean {
    const totp = new OTPAuth.TOTP({
      issuer: this.ISSUER,
      algorithm: 'SHA1',
      digits: 6,
      period: 30,
      secret: OTPAuth.Secret.fromBase32(secret),
    });

    // delta returns null if invalid, or an integer delta (-1, 0, 1) if valid
    const delta = totp.validate({
      token,
      window: 1, // +/- 30 seconds clock drift tolerance
    });

    return delta !== null;
  }
}
