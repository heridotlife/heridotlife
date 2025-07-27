import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

import prisma from './prisma';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

export interface JWTPayload {
  userId: string;
  email: string;
  iat: number;
  exp: number;
}

/**
 * Hash a password using bcrypt
 */
export async function hashPassword(password: string): Promise<string> {
  const saltRounds = 12;
  return bcrypt.hash(password, saltRounds);
}

/**
 * Verify a password against its hash
 */
export async function verifyPassword(
  password: string,
  hash: string,
): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

/**
 * Generate a JWT token for a user
 */
export function generateToken(userId: string, email: string): string {
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore - JWT types are conflicting, but this works at runtime
  return jwt.sign({ userId, email }, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN,
  });
}

/**
 * Verify and decode a JWT token
 */
export function verifyToken(token: string): JWTPayload | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as JWTPayload;
    return decoded;
  } catch (error) {
    return null;
  }
}

/**
 * Extract user information from a JWT token
 */
export async function getUserFromToken(token: string) {
  const payload = verifyToken(token);
  if (!payload) {
    return null;
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
      },
    });

    return user;
  } catch (error) {
    return null;
  }
}

/**
 * Get user from request (extracts token from cookies)
 */
export async function getUserFromRequest(_request: Request) {
  try {
    const { cookies } = await import('next/headers');
    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;

    if (!token) {
      return null;
    }

    return await getUserFromToken(token);
  } catch (error) {
    return null;
  }
}

/**
 * Validate user credentials
 */
export async function validateCredentials(email: string, password: string) {
  try {
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return null;
    }

    const isValidPassword = await verifyPassword(password, user.password);
    if (!isValidPassword) {
      return null;
    }

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      image: user.image,
    };
  } catch (error) {
    return null;
  }
}
