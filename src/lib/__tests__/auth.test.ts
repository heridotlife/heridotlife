import {
  generateToken,
  hashPassword,
  validateCredentials,
  verifyPassword,
  verifyToken,
} from '../auth';

// Mock Prisma
jest.mock('../prisma', () => ({
  __esModule: true,
  default: {
    user: {
      findUnique: jest.fn(),
    },
  },
}));

import prisma from '../prisma';

describe('Auth Utilities', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('hashPassword', () => {
    it('should hash a password correctly', async () => {
      const password = 'testpassword123';
      const hashedPassword = await hashPassword(password);

      expect(hashedPassword).toBeDefined();
      expect(hashedPassword).not.toBe(password);
      expect(hashedPassword).toMatch(/^\$2[aby]\$\d{1,2}\$[./A-Za-z0-9]{53}$/);
    });

    it('should generate different hashes for the same password', async () => {
      const password = 'testpassword123';
      const hash1 = await hashPassword(password);
      const hash2 = await hashPassword(password);

      expect(hash1).not.toBe(hash2);
    });
  });

  describe('verifyPassword', () => {
    it('should verify a correct password', async () => {
      const password = 'testpassword123';
      const hashedPassword = await hashPassword(password);
      const isValid = await verifyPassword(password, hashedPassword);

      expect(isValid).toBe(true);
    });

    it('should reject an incorrect password', async () => {
      const password = 'testpassword123';
      const wrongPassword = 'wrongpassword';
      const hashedPassword = await hashPassword(password);
      const isValid = await verifyPassword(wrongPassword, hashedPassword);

      expect(isValid).toBe(false);
    });
  });

  describe('generateToken', () => {
    it('should generate a valid JWT token', () => {
      const userId = 'user123';
      const email = 'test@example.com';
      const token = generateToken(userId, email);

      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
      expect(token.split('.')).toHaveLength(3); // JWT has 3 parts
    });

    it('should generate different tokens for different users', () => {
      const token1 = generateToken('user1', 'user1@example.com');
      const token2 = generateToken('user2', 'user2@example.com');

      expect(token1).not.toBe(token2);
    });
  });

  describe('verifyToken', () => {
    it('should verify a valid token', () => {
      const userId = 'user123';
      const email = 'test@example.com';
      const token = generateToken(userId, email);
      const payload = verifyToken(token);

      expect(payload).toBeDefined();
      expect(payload?.userId).toBe(userId);
      expect(payload?.email).toBe(email);
    });

    it('should return null for invalid token', () => {
      const payload = verifyToken('invalid.token.here');

      expect(payload).toBeNull();
    });

    it('should return null for malformed token', () => {
      const payload = verifyToken('not.a.jwt.token');

      expect(payload).toBeNull();
    });
  });

  describe('validateCredentials', () => {
    it('should return user data for valid credentials', async () => {
      const mockUser = {
        id: 'user123',
        name: 'Test User',
        email: 'test@example.com',
        password: await hashPassword('password123'),
        image: null,
      };

      (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);

      const result = await validateCredentials(
        'test@example.com',
        'password123',
      );

      expect(result).toBeDefined();
      expect(result?.id).toBe('user123');
      expect(result?.name).toBe('Test User');
      expect(result?.email).toBe('test@example.com');
      expect(result).not.toHaveProperty('password');
    });

    it('should return null for non-existent user', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);

      const result = await validateCredentials(
        'nonexistent@example.com',
        'password123',
      );

      expect(result).toBeNull();
    });

    it('should return null for incorrect password', async () => {
      const mockUser = {
        id: 'user123',
        name: 'Test User',
        email: 'test@example.com',
        password: await hashPassword('correctpassword'),
        image: null,
      };

      (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);

      const result = await validateCredentials(
        'test@example.com',
        'wrongpassword',
      );

      expect(result).toBeNull();
    });

    it('should handle database errors gracefully', async () => {
      (prisma.user.findUnique as jest.Mock).mockRejectedValue(
        new Error('Database error'),
      );

      const result = await validateCredentials(
        'test@example.com',
        'password123',
      );

      expect(result).toBeNull();
    });
  });
});
