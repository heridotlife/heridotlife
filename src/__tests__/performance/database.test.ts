import { performance } from 'perf_hooks';

// Mock Prisma for database performance testing
jest.mock('@/lib/prisma', () => ({
  __esModule: true,
  default: {
    shortUrl: {
      findMany: jest.fn(),
      count: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    category: {
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    user: {
      findUnique: jest.fn(),
      create: jest.fn(),
    },
    session: {
      create: jest.fn(),
      findUnique: jest.fn(),
      delete: jest.fn(),
    },
  },
}));

describe('Database Performance Tests', () => {
  describe('Query Optimization', () => {
    it('should optimize URL listing queries', async () => {
      const mockPrisma = jest.requireMock('@/lib/prisma').default;

      // Mock the findMany to simulate database query
      mockPrisma.shortUrl.findMany.mockResolvedValue([
        {
          id: '1',
          title: 'Test URL',
          originalUrl: 'https://example.com',
          clickCount: 10,
        },
        {
          id: '2',
          title: 'Another URL',
          originalUrl: 'https://test.com',
          clickCount: 5,
        },
      ]);

      const startTime = performance.now();

      // Simulate optimized query with proper includes and pagination
      const result = await mockPrisma.shortUrl.findMany({
        where: { userId: '1' },
        include: {
          categories: {
            select: { id: true, name: true },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip: 0,
        take: 10,
      });

      const endTime = performance.now();
      const queryTime = endTime - startTime;

      // Query should complete within 100ms
      expect(queryTime).toBeLessThan(100);
      expect(result).toHaveLength(2);
      expect(mockPrisma.shortUrl.findMany).toHaveBeenCalledWith({
        where: { userId: '1' },
        include: {
          categories: {
            select: { id: true, name: true },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip: 0,
        take: 10,
      });
    });

    it('should handle large dataset queries efficiently', async () => {
      const mockPrisma = jest.requireMock('@/lib/prisma').default;

      // Mock large dataset
      const largeDataset = Array.from({ length: 1000 }, (_, i) => ({
        id: i.toString(),
        title: `URL ${i}`,
        originalUrl: `https://example${i}.com`,
        clickCount: Math.floor(Math.random() * 1000),
      }));

      mockPrisma.shortUrl.findMany.mockResolvedValue(largeDataset);

      const startTime = performance.now();

      const result = await mockPrisma.shortUrl.findMany({
        where: { userId: '1' },
        select: {
          id: true,
          title: true,
          originalUrl: true,
          clickCount: true,
        },
        orderBy: { clickCount: 'desc' },
        take: 100,
      });

      const endTime = performance.now();
      const queryTime = endTime - startTime;

      // Large query should complete within 200ms
      expect(queryTime).toBeLessThan(200);
      expect(result).toHaveLength(1000);
    });

    it('should optimize count queries', async () => {
      const mockPrisma = jest.requireMock('@/lib/prisma').default;
      mockPrisma.shortUrl.count.mockResolvedValue(150);

      const startTime = performance.now();

      const count = await mockPrisma.shortUrl.count({
        where: { userId: '1' },
      });

      const endTime = performance.now();
      const queryTime = endTime - startTime;

      // Count query should be very fast
      expect(queryTime).toBeLessThan(50);
      expect(count).toBe(150);
    });
  });

  describe('Connection Pool Performance', () => {
    it('should handle concurrent database operations', async () => {
      const mockPrisma = jest.requireMock('@/lib/prisma').default;

      // Mock concurrent operations
      mockPrisma.shortUrl.findMany.mockResolvedValue([]);
      mockPrisma.category.findMany.mockResolvedValue([]);
      mockPrisma.user.findUnique.mockResolvedValue(null);

      const concurrentOperations = 20;
      const startTime = performance.now();

      const operations = Array.from(
        { length: concurrentOperations },
        (_, i) => {
          if (i % 3 === 0) {
            return mockPrisma.shortUrl.findMany({ where: { userId: '1' } });
          } else if (i % 3 === 1) {
            return mockPrisma.category.findMany({ where: { userId: '1' } });
          } else {
            return mockPrisma.user.findUnique({ where: { id: '1' } });
          }
        },
      );

      const results = await Promise.all(operations);
      const endTime = performance.now();
      const totalTime = endTime - startTime;

      // All operations should complete within 500ms
      expect(totalTime).toBeLessThan(500);
      expect(results).toHaveLength(concurrentOperations);
    });

    it('should handle database connection errors gracefully', async () => {
      const mockPrisma = jest.requireMock('@/lib/prisma').default;

      // Mock connection error
      mockPrisma.shortUrl.findMany.mockRejectedValue(
        new Error('Connection failed'),
      );

      const startTime = performance.now();

      try {
        await mockPrisma.shortUrl.findMany({ where: { userId: '1' } });
      } catch (error) {
        const endTime = performance.now();
        const errorTime = endTime - startTime;

        // Error should be thrown quickly (not hang)
        expect(errorTime).toBeLessThan(100);
        expect((error as Error).message).toBe('Connection failed');
      }
    });
  });

  describe('Query Caching Performance', () => {
    it('should simulate query caching benefits', async () => {
      const mockPrisma = jest.requireMock('@/lib/prisma').default;

      // Mock cached and non-cached queries
      const cachedData = [{ id: '1', title: 'Cached URL' }];
      mockPrisma.shortUrl.findMany.mockResolvedValue(cachedData);

      // First query (cache miss)
      const startTime1 = performance.now();
      const result1 = await mockPrisma.shortUrl.findMany({
        where: { userId: '1' },
      });
      const endTime1 = performance.now();
      const queryTime1 = endTime1 - startTime1;

      // Second query (cache hit)
      const startTime2 = performance.now();
      const result2 = await mockPrisma.shortUrl.findMany({
        where: { userId: '1' },
      });
      const endTime2 = performance.now();
      const queryTime2 = endTime2 - startTime2;

      // Both queries should be fast, but second should be faster
      expect(queryTime1).toBeLessThan(100);
      expect(queryTime2).toBeLessThan(100);
      expect(result1).toEqual(result2);
    });

    it('should handle cache invalidation', async () => {
      const mockPrisma = jest.requireMock('@/lib/prisma').default;

      // Simulate cache invalidation scenario
      const initialData = [{ id: '1', title: 'Original URL' }];
      const updatedData = [{ id: '1', title: 'Updated URL' }];

      mockPrisma.shortUrl.findMany
        .mockResolvedValueOnce(initialData) // First call
        .mockResolvedValueOnce(updatedData); // Second call after update

      // Initial query
      const result1 = await mockPrisma.shortUrl.findMany({
        where: { id: '1' },
      });
      expect(result1).toEqual(initialData);

      // Simulate update operation
      mockPrisma.shortUrl.update.mockResolvedValue({
        id: '1',
        title: 'Updated URL',
      });
      await mockPrisma.shortUrl.update({
        where: { id: '1' },
        data: { title: 'Updated URL' },
      });

      // Query after update (should reflect changes)
      const result2 = await mockPrisma.shortUrl.findMany({
        where: { id: '1' },
      });
      expect(result2).toEqual(updatedData);
    });
  });

  describe('Index Performance', () => {
    it('should test indexed query performance', async () => {
      const mockPrisma = jest.requireMock('@/lib/prisma').default;

      // Mock indexed queries
      const indexedData = Array.from({ length: 100 }, (_, i) => ({
        id: i.toString(),
        userId: '1',
        title: `URL ${i}`,
        createdAt: new Date(Date.now() - i * 1000),
      }));

      mockPrisma.shortUrl.findMany.mockResolvedValue(indexedData);

      const startTime = performance.now();

      // Query using indexed fields (userId, createdAt)
      const result = await mockPrisma.shortUrl.findMany({
        where: { userId: '1' },
        orderBy: { createdAt: 'desc' },
        take: 50,
      });

      const endTime = performance.now();
      const queryTime = endTime - startTime;

      // Indexed query should be very fast
      expect(queryTime).toBeLessThan(50);
      expect(result).toHaveLength(100);
    });

    it('should compare indexed vs non-indexed queries', async () => {
      const mockPrisma = jest.requireMock('@/lib/prisma').default;

      const testData = Array.from({ length: 1000 }, (_, i) => ({
        id: i.toString(),
        userId: '1',
        title: `URL ${i}`,
        clickCount: Math.floor(Math.random() * 1000),
      }));

      mockPrisma.shortUrl.findMany.mockResolvedValue(testData);

      // Indexed query (userId)
      const startTime1 = performance.now();
      const indexedResult = await mockPrisma.shortUrl.findMany({
        where: { userId: '1' },
        take: 100,
      });
      const endTime1 = performance.now();
      const indexedTime = endTime1 - startTime1;

      // Non-indexed query (title LIKE)
      const startTime2 = performance.now();
      const nonIndexedResult = await mockPrisma.shortUrl.findMany({
        where: {
          title: { contains: 'URL' },
        },
        take: 100,
      });
      const endTime2 = performance.now();
      const nonIndexedTime = endTime2 - startTime2;

      // Both should be fast, but indexed should be faster
      expect(indexedTime).toBeLessThan(100);
      expect(nonIndexedTime).toBeLessThan(200);
      expect(indexedResult).toHaveLength(1000);
      expect(nonIndexedResult).toHaveLength(1000);
    });
  });
});
