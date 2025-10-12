import type { APIContext } from 'astro';
import { jwtVerify, SignJWT } from 'jose';

export type AuthenticatedSession = { authenticated: boolean };

const COOKIE_NAME = 'admin-session';

function getSecretKey(locals: APIContext['locals']): Uint8Array {
  const secret = locals.runtime?.env.AUTH_SECRET || 'your-secret-key-change-in-production';
  return new TextEncoder().encode(secret);
}

export async function createSession(context: APIContext) {
  const secretKey = getSecretKey(context.locals);
  const token = await new SignJWT({ authenticated: true })
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime('7d')
    .setIssuedAt()
    .sign(secretKey);

  context.cookies.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: import.meta.env.PROD,
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7, // 7 days
    path: '/',
  });
}

export async function getSession(context: APIContext) {
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

export function deleteSession(cookies: APIContext['cookies']) {
  cookies.delete(COOKIE_NAME, { path: '/' });
}

export function verifyPassword(password: string, locals: APIContext['locals']): boolean {
  const adminPassword = locals.runtime?.env.ADMIN_PASSWORD || 'admin';
  return password === adminPassword;
}
