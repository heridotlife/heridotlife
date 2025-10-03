import { getStatsLogic } from '@/lib/api-handlers/stats';
import { getSession } from '@/lib/auth';
import prisma from '@/lib/prisma';

jest.mock('@/lib/auth', () => ({
  getSession: jest.fn(),
}));

jest.mock('@/lib/prisma', () => ({
  __esModule: true,
  default: {
    shortUrl: {
      count: jest.fn(),
      aggregate: jest.fn(),
      findMany: jest.fn(),
    },
  },
}));

describe('getStatsLogic', () => {
  it('should throw Unauthorized error if unauthenticated', async () => {
    (getSession as jest.Mock).mockResolvedValue(null);

    await expect(getStatsLogic(null)).rejects.toThrow('Unauthorized');
  });

  it('should return stats if authenticated', async () => {
    (getSession as jest.Mock).mockResolvedValue({ authenticated: true });
    (prisma.shortUrl.count as jest.Mock)
      .mockResolvedValueOnce(10) // totalUrls
      .mockResolvedValueOnce(5) // activeUrls
      .mockResolvedValueOnce(2); // expiredUrls
    (prisma.shortUrl.aggregate as jest.Mock).mockResolvedValue({
      _sum: { clickCount: 100 },
    });
    (prisma.shortUrl.findMany as jest.Mock).mockResolvedValue([
      { id: 1, shortUrl: 'abc', title: 'Test 1', latestClick: new Date() },
    ]);

    const stats = await getStatsLogic({ authenticated: true });
    expect(stats).toEqual({
      totalUrls: 10,
      activeUrls: 5,
      expiredUrls: 2,
      totalClicks: 100,
      recentClicks: [
        {
          id: 1,
          shortUrl: 'abc',
          title: 'Test 1',
          latestClick: expect.any(Date),
        },
      ],
    });
  });

  it('should handle errors gracefully', async () => {
    (getSession as jest.Mock).mockResolvedValue({ authenticated: true });
    (prisma.shortUrl.count as jest.Mock).mockRejectedValue(
      new Error('DB Error'),
    );

    await expect(getStatsLogic({ authenticated: true })).rejects.toThrow(
      'DB Error',
    );
  });
});
