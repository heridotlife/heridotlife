import { randomBytes } from 'crypto';

import prisma from './prisma';

/**
 * Create a new session for a user
 */
export async function createSession(userId: string) {
  try {
    // Generate a unique session token
    const sessionToken = randomBytes(32).toString('hex');

    // Set expiration to 7 days from now
    const expires = new Date();
    expires.setDate(expires.getDate() + 7);

    const session = await prisma.session.create({
      data: {
        sessionToken,
        userId,
        expires,
      },
    });

    return session;
  } catch (error) {
    throw new Error('Failed to create session');
  }
}

/**
 * Validate a session token
 */
export async function validateSession(sessionToken: string) {
  try {
    const session = await prisma.session.findUnique({
      where: { sessionToken },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          },
        },
      },
    });

    if (!session) {
      return null;
    }

    // Check if session has expired
    if (session.expires < new Date()) {
      // Delete expired session
      await deleteSession(sessionToken);
      return null;
    }

    return session;
  } catch (error) {
    return null;
  }
}

/**
 * Delete a session
 */
export async function deleteSession(sessionToken: string) {
  try {
    await prisma.session.delete({
      where: { sessionToken },
    });
    return true;
  } catch (error) {
    return false;
  }
}

/**
 * Delete all sessions for a user
 */
export async function deleteAllUserSessions(userId: string) {
  try {
    await prisma.session.deleteMany({
      where: { userId },
    });
    return true;
  } catch (error) {
    return false;
  }
}

/**
 * Clean up expired sessions
 */
export async function cleanupExpiredSessions() {
  try {
    const result = await prisma.session.deleteMany({
      where: {
        expires: {
          lt: new Date(),
        },
      },
    });
    return result.count;
  } catch (error) {
    return 0;
  }
}
