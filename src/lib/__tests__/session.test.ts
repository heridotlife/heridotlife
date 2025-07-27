import {
  cleanupExpiredSessions,
  createSession,
  deleteAllUserSessions,
  deleteSession,
  validateSession,
} from '../session';

// Mock Prisma
jest.mock('../prisma', () => ({
  __esModule: true,
  default: {
    session: {
      create: jest.fn(),
      findUnique: jest.fn(),
      delete: jest.fn(),
      deleteMany: jest.fn(),
    },
  },
}));

import prisma from '../prisma';

describe('Session Management', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createSession', () => {
    it('should create a new session successfully', async () => {
      const userId = 'user123';
      const mockSession = {
        id: 'session123',
        sessionToken: 'mock-session-token',
        userId,
        expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
      };

      (prisma.session.create as jest.Mock).mockResolvedValue(mockSession);

      const result = await createSession(userId);

      expect(result).toBeDefined();
      expect(result.sessionToken).toBe('mock-session-token');
      expect(result.userId).toBe(userId);
      expect(prisma.session.create).toHaveBeenCalledWith({
        data: {
          sessionToken: expect.any(String),
          userId,
          expires: expect.any(Date),
        },
      });
    });

    it('should throw error when session creation fails', async () => {
      const userId = 'user123';
      (prisma.session.create as jest.Mock).mockRejectedValue(
        new Error('Database error'),
      );

      await expect(createSession(userId)).rejects.toThrow(
        'Failed to create session',
      );
    });
  });

  describe('validateSession', () => {
    it('should return session with user data for valid session', async () => {
      const sessionToken = 'valid-session-token';
      const mockSession = {
        id: 'session123',
        sessionToken,
        userId: 'user123',
        expires: new Date(Date.now() + 24 * 60 * 60 * 1000), // 1 day from now
        user: {
          id: 'user123',
          name: 'Test User',
          email: 'test@example.com',
          image: null,
        },
      };

      (prisma.session.findUnique as jest.Mock).mockResolvedValue(mockSession);

      const result = await validateSession(sessionToken);

      expect(result).toBeDefined();
      expect(result?.sessionToken).toBe(sessionToken);
      expect(result?.user).toBeDefined();
      expect(result?.user.id).toBe('user123');
    });

    it('should return null for non-existent session', async () => {
      const sessionToken = 'invalid-session-token';
      (prisma.session.findUnique as jest.Mock).mockResolvedValue(null);

      const result = await validateSession(sessionToken);

      expect(result).toBeNull();
    });

    it('should return null and delete expired session', async () => {
      const sessionToken = 'expired-session-token';
      const mockSession = {
        id: 'session123',
        sessionToken,
        userId: 'user123',
        expires: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1 day ago
        user: {
          id: 'user123',
          name: 'Test User',
          email: 'test@example.com',
          image: null,
        },
      };

      (prisma.session.findUnique as jest.Mock).mockResolvedValue(mockSession);
      (prisma.session.delete as jest.Mock).mockResolvedValue(mockSession);

      const result = await validateSession(sessionToken);

      expect(result).toBeNull();
      expect(prisma.session.delete).toHaveBeenCalledWith({
        where: { sessionToken },
      });
    });

    it('should handle database errors gracefully', async () => {
      const sessionToken = 'valid-session-token';
      (prisma.session.findUnique as jest.Mock).mockRejectedValue(
        new Error('Database error'),
      );

      const result = await validateSession(sessionToken);

      expect(result).toBeNull();
    });
  });

  describe('deleteSession', () => {
    it('should delete session successfully', async () => {
      const sessionToken = 'session-to-delete';
      const mockDeletedSession = {
        id: 'session123',
        sessionToken,
        userId: 'user123',
        expires: new Date(),
      };

      (prisma.session.delete as jest.Mock).mockResolvedValue(
        mockDeletedSession,
      );

      const result = await deleteSession(sessionToken);

      expect(result).toBe(true);
      expect(prisma.session.delete).toHaveBeenCalledWith({
        where: { sessionToken },
      });
    });

    it('should return false when session deletion fails', async () => {
      const sessionToken = 'non-existent-session';
      (prisma.session.delete as jest.Mock).mockRejectedValue(
        new Error('Session not found'),
      );

      const result = await deleteSession(sessionToken);

      expect(result).toBe(false);
    });
  });

  describe('deleteAllUserSessions', () => {
    it('should delete all sessions for a user successfully', async () => {
      const userId = 'user123';
      const mockResult = { count: 3 };

      (prisma.session.deleteMany as jest.Mock).mockResolvedValue(mockResult);

      const result = await deleteAllUserSessions(userId);

      expect(result).toBe(true);
      expect(prisma.session.deleteMany).toHaveBeenCalledWith({
        where: { userId },
      });
    });

    it('should return false when deletion fails', async () => {
      const userId = 'user123';
      (prisma.session.deleteMany as jest.Mock).mockRejectedValue(
        new Error('Database error'),
      );

      const result = await deleteAllUserSessions(userId);

      expect(result).toBe(false);
    });
  });

  describe('cleanupExpiredSessions', () => {
    it('should delete expired sessions and return count', async () => {
      const mockResult = { count: 5 };

      (prisma.session.deleteMany as jest.Mock).mockResolvedValue(mockResult);

      const result = await cleanupExpiredSessions();

      expect(result).toBe(5);
      expect(prisma.session.deleteMany).toHaveBeenCalledWith({
        where: {
          expires: {
            lt: expect.any(Date),
          },
        },
      });
    });

    it('should return 0 when no expired sessions exist', async () => {
      const mockResult = { count: 0 };

      (prisma.session.deleteMany as jest.Mock).mockResolvedValue(mockResult);

      const result = await cleanupExpiredSessions();

      expect(result).toBe(0);
    });

    it('should return 0 when cleanup fails', async () => {
      (prisma.session.deleteMany as jest.Mock).mockRejectedValue(
        new Error('Database error'),
      );

      const result = await cleanupExpiredSessions();

      expect(result).toBe(0);
    });
  });
});
