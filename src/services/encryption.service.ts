import crypto from 'node:crypto';

const ALGORITHM = 'aes-256-gcm';
const DEFAULT_ENCRYPTION_KEY = (process.env.ENCRYPTION_KEY || 'lively_aes256_secret_key_32bytes!').padEnd(32).slice(0, 32);

export class EncryptionService {
  static encrypt(plainText: string, secretKey = DEFAULT_ENCRYPTION_KEY): string {
    const iv = crypto.randomBytes(12);
    const cipher = crypto.createCipheriv(ALGORITHM, Buffer.from(secretKey, 'utf-8'), iv);
    let encrypted = cipher.update(plainText, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    const authTag = cipher.getAuthTag().toString('hex');
    // Format: iv:authTag:encryptedContent
    return `${iv.toString('hex')}:${authTag}:${encrypted}`;
  }

  static decrypt(cipherBundle: string, secretKey = DEFAULT_ENCRYPTION_KEY): string {
    const parts = cipherBundle.split(':');
    if (parts.length !== 3) {
      throw new Error('Invalid cipher bundle format');
    }
    const [ivHex, authTagHex, encryptedHex] = parts;
    const decipher = crypto.createDecipheriv(
      ALGORITHM,
      Buffer.from(secretKey, 'utf-8'),
      Buffer.from(ivHex, 'hex')
    );
    decipher.setAuthTag(Buffer.from(authTagHex, 'hex'));
    let decrypted = decipher.update(encryptedHex, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  }
}
