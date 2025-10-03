import { redirectLogic } from '@/lib/api-handlers/redirect';
import prisma from '@/lib/prisma';

jest.mock('@/lib/prisma', () => ({
  __esModule: true,
  default: {
    shortUrl: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    category: {
      update: jest.fn(),
    },
  },
}));

describe('redirectLogic', () => {
  beforeEach(() => {
    (prisma.shortUrl.findUnique as jest.Mock).mockClear();
    (prisma.shortUrl.update as jest.Mock).mockClear();
    (prisma.category.update as jest.Mock).mockClear();
  });

  it('should throw error if shortUrlParam is missing', async () => {
    await expect(redirectLogic(null)).rejects.toThrow(
      'Missing short URL parameter',
    );
  });

  it('should throw error if short URL not found by slug', async () => {
    (prisma.shortUrl.findUnique as jest.Mock).mockResolvedValue(null);
    await expect(redirectLogic('nonexistent')).rejects.toThrow(
      'Short URL not found',
    );
  });

  it('should throw error if short URL not found by ID', async () => {
    (prisma.shortUrl.findUnique as jest.Mock).mockResolvedValue(null);
    await expect(redirectLogic('123')).rejects.toThrow('Short URL not found');
  });

  it('should redirect and update counts for slug', async () => {
    const mockUrl = {
      id: 1,
      shortUrl: 'test',
      originalUrl: 'https://example.com',
      clickCount: 0,
      categories: [{ id: 10, name: 'Cat1', clickCount: 0 }],
    };
    (prisma.shortUrl.findUnique as jest.Mock).mockResolvedValue(mockUrl);
    (prisma.shortUrl.update as jest.Mock).mockResolvedValue({
      ...mockUrl,
      clickCount: 1,
    });
    (prisma.category.update as jest.Mock).mockResolvedValue({
      id: 10,
      name: 'Cat1',
      clickCount: 1,
    });

    const result = await redirectLogic('test');
    expect(result).toBe('https://example.com');
    expect(prisma.shortUrl.update).toHaveBeenCalledWith({
      where: { id: 1 },
      data: {
        clickCount: { increment: 1 },
        latestClick: expect.any(Date),
      },
    });
    expect(prisma.category.update).toHaveBeenCalledWith({
      where: { id: 10 },
      data: { clickCount: { increment: 1 } },
    });
  });

  it('should redirect and update counts for ID', async () => {
    const mockUrl = {
      id: 123,
      shortUrl: 'test-id',
      originalUrl: 'https://example.com/id',
      clickCount: 0,
      categories: [{ id: 20, name: 'Cat2', clickCount: 0 }],
    };
    (prisma.shortUrl.findUnique as jest.Mock).mockResolvedValue(mockUrl);
    (prisma.shortUrl.update as jest.Mock).mockResolvedValue({
      ...mockUrl,
      clickCount: 1,
    });
    (prisma.category.update as jest.Mock).mockResolvedValue({
      id: 20,
      name: 'Cat2',
      clickCount: 1,
    });

    const result = await redirectLogic('123');
    expect(result).toBe('https://example.com/id');
    expect(prisma.shortUrl.update).toHaveBeenCalledWith({
      where: { id: 123 },
      data: {
        clickCount: { increment: 1 },
        latestClick: expect.any(Date),
      },
    });
    expect(prisma.category.update).toHaveBeenCalledWith({
      where: { id: 20 },
      data: { clickCount: { increment: 1 } },
    });
  });

  it('should handle errors gracefully', async () => {
    (prisma.shortUrl.findUnique as jest.Mock).mockRejectedValue(
      new Error('DB Error'),
    );
    await expect(redirectLogic('test')).rejects.toThrow('DB Error');
  });
});
