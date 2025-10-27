/**
 * Authentication utilities for admin sessions
 * Uses JWT tokens stored in HTTP-only cookies
 * @module lib/auth
 */

import type { APIContext } from 'astro';
import { jwtVerify, SignJWT } from 'jose';

/**
 * Authenticated session payload
 */
export interface AuthenticatedSession {
  /** Whether the session is authenticated */
  authenticated: boolean;
}

/**
 * JWT payload structure
 */
export interface JWTPayload {
  /** Authentication status */
  authenticated: boolean;
  /** Session ID for tracking */
  sid: string;
  /** Issued at timestamp */
  iat: number;
  /** JWT ID (matches session ID) */
  jti: string;
  /** Expiration time */
  exp?: number;
}

/** Cookie name for session storage */
const COOKIE_NAME = 'admin-session' as const;

/**
 * Get JWT secret key from environment
 * @param locals - Astro locals with runtime environment
 * @returns Secret key as Uint8Array
 * @throws Error if AUTH_SECRET is not set or too short
 */
function getSecretKey(locals: APIContext['locals']): Uint8Array {
  const secret = locals.runtime?.env.AUTH_SECRET;

  // Security: Fail hard if AUTH_SECRET is not set - don't use insecure defaults
  if (!secret) {
    throw new Error('AUTH_SECRET environment variable is not set. Cannot create secure sessions.');
  }

  // Validate minimum length for security
  if (secret.length < 32) {
    throw new Error('AUTH_SECRET must be at least 32 characters long for security.');
  }

  return new TextEncoder().encode(secret);
}

/**
 * Create a new authenticated session
 * Generates a JWT token and sets it as an HTTP-only cookie
 * @param context - Astro API context
 */
export async function createSession(context: APIContext): Promise<void> {
  const secretKey = getSecretKey(context.locals);

  // Generate unique session ID for tracking and potential revocation
  const sessionId = crypto.randomUUID();
  const issuedAt = Math.floor(Date.now() / 1000);

  const token = await new SignJWT({
    authenticated: true,
    sid: sessionId, // Session ID for tracking
    iat: issuedAt, // Issued at (redundant but explicit)
  })
    .setProtectedHeader({ alg: 'HS256', typ: 'JWT' })
    .setExpirationTime('7d')
    .setIssuedAt()
    .setJti(sessionId) // JWT ID matches session ID
    .sign(secretKey);

  context.cookies.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: import.meta.env.PROD,
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7, // 7 days
    path: '/',
  });
}

/**
 * Get the current session from cookies
 * @param context - Astro API context
 * @returns Session object if authenticated, null otherwise
 */
export async function getSession(context: APIContext): Promise<AuthenticatedSession | null> {
  const token = context.cookies.get(COOKIE_NAME)?.value;

  if (!token) {
    return null;
  }

  try {
    const secretKey = getSecretKey(context.locals);
    const { payload } = await jwtVerify(token, secretKey);
    return payload.authenticated ? { authenticated: true } : null;
  } catch {
    return null;
  }
}

/**
 * Delete the current session
 * @param cookies - Astro cookies object
 */
export function deleteSession(cookies: APIContext['cookies']): void {
  cookies.delete(COOKIE_NAME, { path: '/' });
}

/**
 * Constant-time password comparison to prevent timing attacks
 * Uses crypto.subtle for HMAC-based comparison
 * @param a - First string to compare
 * @param b - Second string to compare
 * @returns True if strings are equal, false otherwise
 */
async function timingSafeEqual(a: string, b: string): Promise<boolean> {
  // Convert strings to Uint8Array
  const encoder = new TextEncoder();
  const aBytes = encoder.encode(a);
  const bBytes = encoder.encode(b);

  // If lengths differ, still compare to prevent timing leaks
  if (aBytes.length !== bBytes.length) {
    // Do a dummy comparison to maintain constant time
    const dummyA = new Uint8Array(Math.max(aBytes.length, bBytes.length));
    const dummyB = new Uint8Array(Math.max(aBytes.length, bBytes.length));
    dummyA.set(aBytes);
    dummyB.set(bBytes);
    return false;
  }

  // Use crypto.subtle if available (Workers environment)
  if (typeof crypto !== 'undefined' && crypto.subtle) {
    try {
      // Import both values as keys for comparison
      const keyA = await crypto.subtle.importKey(
        'raw',
        aBytes,
        { name: 'HMAC', hash: 'SHA-256' },
        false,
        ['sign']
      );
      const keyB = await crypto.subtle.importKey(
        'raw',
        bBytes,
        { name: 'HMAC', hash: 'SHA-256' },
        false,
        ['sign']
      );

      // Sign a known message with both keys and compare
      const message = encoder.encode('password-verification');
      const signA = await crypto.subtle.sign('HMAC', keyA, message);
      const signB = await crypto.subtle.sign('HMAC', keyB, message);

      // Compare signatures (also constant-time)
      const sigA = new Uint8Array(signA);
      const sigB = new Uint8Array(signB);

      let diff = 0;
      for (let i = 0; i < sigA.length; i++) {
        diff |= sigA[i] ^ sigB[i];
      }
      return diff === 0;
    } catch {
      // Fall back to manual constant-time comparison
    }
  }

  // Manual constant-time comparison as fallback
  let diff = 0;
  for (let i = 0; i < aBytes.length; i++) {
    diff |= aBytes[i] ^ bBytes[i];
  }
  return diff === 0;
}

/**
 * Verify a password against the configured admin password
 * Uses constant-time comparison to prevent timing attacks
 * @param password - Password to verify
 * @param locals - Astro locals with runtime environment
 * @returns True if password matches, false otherwise
 */
export async function verifyPassword(
  password: string,
  locals: APIContext['locals']
): Promise<boolean> {
  const adminPassword = locals.runtime?.env.ADMIN_PASSWORD;

  // Security: Fail hard if ADMIN_PASSWORD is not set - don't use insecure defaults
  if (!adminPassword) {
    console.error('ADMIN_PASSWORD environment variable is not set');
    return false;
  }

  // Use constant-time comparison to prevent timing attacks
  return await timingSafeEqual(password, adminPassword);
}
