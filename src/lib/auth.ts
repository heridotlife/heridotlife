/**
 * Authentication utilities for admin sessions
 * Uses JWT tokens stored in HTTP-only cookies
 * @module lib/auth
 */

import type { APIContext } from 'astro';
import { jwtVerify, SignJWT } from 'jose';

// Track if we've warned about plain-text passwords to prevent log spam
let plaintextPasswordWarned = false;

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
 * Constant-time buffer comparison to prevent timing attacks
 * @param a - First buffer to compare
 * @param b - Second buffer to compare
 * @returns True if buffers are equal, false otherwise
 */
function timingSafeEqual(a: Uint8Array, b: Uint8Array): boolean {
  // If lengths differ, still do comparison to maintain constant time
  if (a.length !== b.length) {
    // Do a dummy comparison to prevent timing leaks
    let _diff = 1;
    for (let i = 0; i < Math.max(a.length, b.length); i++) {
      const aVal = i < a.length ? a[i] : 0;
      const bVal = i < b.length ? b[i] : 0;
      _diff |= aVal ^ bVal;
    }
    return false;
  }

  // Constant-time comparison
  let diff = 0;
  for (let i = 0; i < a.length; i++) {
    diff |= a[i] ^ b[i];
  }
  return diff === 0;
}

/**
 * Convert ArrayBuffer or Uint8Array to base64 string
 * Safe for binary data: byte values (0-255) map directly to Latin-1 characters for btoa()
 * @param buffer - Buffer to encode
 * @returns Base64 encoded string
 */
function arrayBufferToBase64(buffer: ArrayBuffer | Uint8Array): string {
  const bytes = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

/**
 * Convert base64 string to Uint8Array
 * @param base64 - Base64 encoded string
 * @returns Uint8Array
 */
function base64ToUint8Array(base64: string): Uint8Array {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

/**
 * Hash a password using PBKDF2 with a random salt
 * @param password - Plain text password to hash
 * @returns Hashed password string in format: pbkdf2:iterations:salt:hash
 */
export async function hashPassword(password: string): Promise<string> {
  // OWASP Application Security Verification Standard (ASVS) v4.0.2 (2021)
  // recommends minimum 600,000 iterations for PBKDF2-SHA256
  // https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html
  const iterations = 600000;
  const saltLength = 16; // 128 bits
  const hashLength = 32; // 256 bits

  // Generate random salt
  const salt = crypto.getRandomValues(new Uint8Array(saltLength));

  // Import password as key material
  const encoder = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    encoder.encode(password),
    'PBKDF2',
    false,
    ['deriveBits']
  );

  // Derive key using PBKDF2
  const hashBuffer = await crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      salt: (salt.buffer as ArrayBuffer).slice(salt.byteOffset, salt.byteOffset + salt.byteLength),
      iterations: iterations,
      hash: 'SHA-256',
    },
    keyMaterial,
    hashLength * 8 // bits
  );

  // Format: algorithm:iterations:salt:hash (all base64 encoded)
  const saltBase64 = arrayBufferToBase64(salt);
  const hashBase64 = arrayBufferToBase64(hashBuffer);

  return `pbkdf2:${iterations}:${saltBase64}:${hashBase64}`;
}

/**
 * Verify a password against a hashed password
 * @param password - Plain text password to verify
 * @param hashedPassword - Hashed password string (from hashPassword)
 * @returns True if password matches, false otherwise
 */
async function verifyPasswordHash(password: string, hashedPassword: string): Promise<boolean> {
  try {
    // Parse the hashed password format: algorithm:iterations:salt:hash
    const parts = hashedPassword.split(':');
    if (parts.length !== 4 || parts[0] !== 'pbkdf2') {
      console.error('Invalid password hash format');
      return false;
    }

    const iterations = parseInt(parts[1], 10);
    const salt = base64ToUint8Array(parts[2]);
    const storedHash = base64ToUint8Array(parts[3]);

    // Hash the input password with the same salt and iterations
    const encoder = new TextEncoder();
    const keyMaterial = await crypto.subtle.importKey(
      'raw',
      encoder.encode(password),
      'PBKDF2',
      false,
      ['deriveBits']
    );

    const hashBuffer = await crypto.subtle.deriveBits(
      {
        name: 'PBKDF2',
        salt: (salt.buffer as ArrayBuffer).slice(
          salt.byteOffset,
          salt.byteOffset + salt.byteLength
        ),
        iterations: iterations,
        hash: 'SHA-256',
      },
      keyMaterial,
      storedHash.length * 8 // bits
    );

    const computedHash = new Uint8Array(hashBuffer);

    // Timing-safe comparison of hashes
    return timingSafeEqual(computedHash, storedHash);
  } catch (error) {
    console.error('Password verification error:', error);
    return false;
  }
}

/**
 * Verify a password against the configured admin password
 * Supports both hashed passwords (recommended) and plain text (legacy)
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

  // Check if password is hashed (format: pbkdf2:iterations:salt:hash)
  if (adminPassword.startsWith('pbkdf2:')) {
    // Use secure PBKDF2 verification
    return await verifyPasswordHash(password, adminPassword);
  }

  // Legacy plain-text password support (for migration period)
  // WARNING: Plain-text passwords are insecure and should be migrated to hashed passwords
  // Only log warning once per Worker instance to prevent log spam
  if (!plaintextPasswordWarned) {
    console.warn(
      '[Security] Plain-text password detected in ADMIN_PASSWORD. ' +
        'Please migrate to hashed password using the hashPassword utility.'
    );
    plaintextPasswordWarned = true;
  }

  // Simple byte comparison for legacy plain text
  // Still constant-time to prevent timing attacks
  const encoder = new TextEncoder();
  const inputBytes = encoder.encode(password);
  const storedBytes = encoder.encode(adminPassword);

  return timingSafeEqual(inputBytes, storedBytes);
}
