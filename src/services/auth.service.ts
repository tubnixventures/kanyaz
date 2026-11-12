import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { UnauthorizedError } from '../utils/errors.ts';

export interface UserSession {
  userId: string;
  phoneNumber: string;
  fullName: string;
  role: string;
  organizationId?: string;
  country?: string;
}

const JWT_SECRET = process.env.JWT_SECRET || 'lively_backend_super_secret_jwt_key_2026';

export class AuthService {
  private static users = new Map<string, {
    id: string;
    phoneNumber: string;
    passwordHash: string;
    fullName: string;
    email?: string;
    role: string;
    country: string;
    county?: string;
    constituency?: string;
    ward?: string;
    region?: string;
    organizationId?: string;
  }>();

  static async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, 10);
  }

  static async comparePassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }

  static signToken(user: UserSession): string {
    return jwt.sign(user, JWT_SECRET, { expiresIn: '7d' });
  }

  static verifyToken(token: string): UserSession {
    try {
      return jwt.verify(token, JWT_SECRET) as UserSession;
    } catch {
      throw new UnauthorizedError('Invalid or expired authentication token');
    }
  }

  static registerUser(userData: {
    phoneNumber: string;
    passwordHash: string;
    fullName: string;
    email?: string;
    country: string;
    county?: string;
    constituency?: string;
    ward?: string;
    region?: string;
    organizationId?: string;
  }) {
    const id = `usr_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    const record = { id, role: 'voter', ...userData };
    this.users.set(userData.phoneNumber, record);
    return record;
  }

  static findByPhone(phoneNumber: string) {
    return this.users.get(phoneNumber) || null;
  }
}
