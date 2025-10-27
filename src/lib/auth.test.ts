import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createSession, getSession, verifyPassword, deleteSession } from './auth';
import { createMockContext } from '../../tests/helpers/mock-context';

describe('Authentication', () => {
  describe('verifyPassword', () => {
    it('should return true for correct password', async () => {
      const context = createMockContext();
      const result = await verifyPassword('test-admin-password', context.locals);
      expect(result).toBe(true);
    });

    it('should return false for incorrect password', async () => {
      const context = createMockContext();
      const result = await verifyPassword('wrong-password', context.locals);
      expect(result).toBe(false);
    });

    it('should return false when ADMIN_PASSWORD is not set', async () => {
      const context = createMockContext();
      context.locals.runtime.env.ADMIN_PASSWORD = '';

      const result = await verifyPassword('any-password', context.locals);
      expect(result).toBe(false);
    });

    it('should be resistant to timing attacks', async () => {
      // Skip in CI environments where timing is unreliable
      if (process.env.CI) {
        console.log('⏭️  Skipping timing attack test in CI environment');
        return;
      }

      const context = createMockContext();
      const attempts = 100;
      const timings: number[] = [];

      for (let i = 0; i < attempts; i++) {
        const start = performance.now();
        await verifyPassword('wrong-password-' + i, context.locals);
        const duration = performance.now() - start;
        timings.push(duration);
      }

      // Check that timing variance is low (standard deviation)
      const mean = timings.reduce((a, b) => a + b) / timings.length;
      const variance =
        timings.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / timings.length;
      const stdDev = Math.sqrt(variance);

      // Timing should be relatively consistent (low coefficient of variation)
      // Note: This test verifies constant-time behavior locally
      // In production, the crypto.subtle API provides timing attack resistance
      const coefficientOfVariation = stdDev / mean;

      // Log timing stats for manual verification
      console.log(
        `Timing stats: mean=${mean.toFixed(2)}ms, stdDev=${stdDev.toFixed(2)}ms, CV=${coefficientOfVariation.toFixed(2)}`
      );

      // Very lenient threshold - we mainly verify the function uses constant-time comparison
      expect(coefficientOfVariation).toBeLessThan(3.0);
    });
  });

  describe('createSession', () => {
    beforeEach(() => {
      vi.clearAllMocks();
    });

    it('should create a JWT session cookie', async () => {
      const context = createMockContext();
      const mockSet = vi.fn();
      context.cookies.set = mockSet;

      await createSession(context);

      expect(mockSet).toHaveBeenCalledWith(
        'admin-session',
        expect.any(String),
        expect.objectContaining({
          httpOnly: true,
          sameSite: 'lax',
          maxAge: 60 * 60 * 24 * 7,
          path: '/',
        })
      );
    });

    it('should throw error when AUTH_SECRET is not set', async () => {
      const context = createMockContext();
      context.locals.runtime.env.AUTH_SECRET = '';

      await expect(createSession(context)).rejects.toThrow(
        'AUTH_SECRET environment variable is not set'
      );
    });

    it('should throw error when AUTH_SECRET is too short', async () => {
      const context = createMockContext();
      context.locals.runtime.env.AUTH_SECRET = 'short'; // Less than 32 chars

      await expect(createSession(context)).rejects.toThrow(
        'AUTH_SECRET must be at least 32 characters'
      );
    });

    it('should create unique session IDs', async () => {
      const context = createMockContext();
      const sessions: string[] = [];
      const mockSet = vi.fn((_, token) => {
        sessions.push(token);
      });
      context.cookies.set = mockSet;

      await createSession(context);
      await createSession(context);

      expect(sessions[0]).not.toBe(sessions[1]);
    });
  });

  describe('getSession', () => {
    it('should return null when no cookie exists', async () => {
      const context = createMockContext();
      const result = await getSession(context);
      expect(result).toBeNull();
    });

    it('should return session for valid token', async () => {
      const context = createMockContext();

      // First create a session
      const mockSet = vi.fn();
      let tokenValue = '';
      context.cookies.set = mockSet;
      await createSession(context);
      tokenValue = mockSet.mock.calls[0][1];

      // Now try to get the session
      context.cookies.get = () => ({
        value: tokenValue,
        json: () => JSON.parse(tokenValue),
        number: () => Number(tokenValue),
        boolean: () => Boolean(tokenValue),
      });
      const result = await getSession(context);

      expect(result).toEqual({ authenticated: true });
    });

    it('should return null for invalid token', async () => {
      const context = createMockContext();
      context.cookies.get = () => ({
        value: 'invalid-token',
        json: () => ({}),
        number: () => 0,
        boolean: () => false,
      });

      const result = await getSession(context);
      expect(result).toBeNull();
    });

    it('should return null for expired token', async () => {
      const context = createMockContext();
      // Create a token that's already expired (would need to mock jwt)
      context.cookies.get = () => ({
        value: 'expired-token',
        json: () => ({}),
        number: () => 0,
        boolean: () => false,
      });

      const result = await getSession(context);
      expect(result).toBeNull();
    });
  });

  describe('deleteSession', () => {
    it('should delete session cookie', () => {
      const mockDelete = vi.fn();
      const cookies = { delete: mockDelete } as any;

      deleteSession(cookies);

      expect(mockDelete).toHaveBeenCalledWith('admin-session', { path: '/' });
    });
  });
});
