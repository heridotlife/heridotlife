import { createUrlLogic, getUrlsLogic } from '@/lib/api-handlers/urls';
import { getSession } from '@/lib/auth';
import prisma from '@/lib/prisma';

jest.mock('@/lib/auth', () => ({
  getSession: jest.fn(),
}));

jest.mock('@/lib/prisma', () => ({
  __esModule: true,
  default: {
    shortUrl: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
    },
  },
}));

describe('getUrlsLogic', () => {
  it('should throw Unauthorized error if unauthenticated', async () => {
    (getSession as jest.Mock).mockResolvedValue(null);

    await expect(getUrlsLogic(null)).rejects.toThrow('Unauthorized');
  });

  it('should return URLs if authenticated', async () => {
    (getSession as jest.Mock).mockResolvedValue({ authenticated: true });
    const mockUrls = [
      {
        id: 1,
        shortUrl: 'test1',
        originalUrl: 'https://example.com/1',
        categories: [{ id: 1, name: 'Cat1' }],
      },
    ];
    (prisma.shortUrl.findMany as jest.Mock).mockResolvedValue(mockUrls);

    const urls = await getUrlsLogic({ authenticated: true });
    expect(urls).toEqual(mockUrls);
  });

  it('should handle errors gracefully', async () => {
    (getSession as jest.Mock).mockResolvedValue({ authenticated: true });
    (prisma.shortUrl.findMany as jest.Mock).mockRejectedValue(
      new Error('DB Error'),
    );

    await expect(getUrlsLogic({ authenticated: true })).rejects.toThrow(
      'DB Error',
    );
  });
});

describe('createUrlLogic', () => {
  beforeEach(() => {
    (prisma.shortUrl.findUnique as jest.Mock).mockResolvedValue(null); // No existing slug by default
  });

  it('should throw Unauthorized error if unauthenticated', async () => {
    (getSession as jest.Mock).mockResolvedValue(null);

    await expect(
      createUrlLogic(null, {
        slug: 'new-url',
        originalUrl: 'https://new.com',
      }),
    ).rejects.toThrow('Unauthorized');
  });

  it('should throw error if authenticated but with invalid input', async () => {
    (getSession as jest.Mock).mockResolvedValue({ authenticated: true });

    await expect(createUrlLogic({ authenticated: true }, {})).rejects.toThrow(
      'Invalid input: expected string, received undefined',
    );
  });

  it('should throw error if slug already exists', async () => {
    (getSession as jest.Mock).mockResolvedValue({ authenticated: true });
    (prisma.shortUrl.findUnique as jest.Mock).mockResolvedValue({
      id: 1,
      shortUrl: 'existing-slug',
    });

    await expect(
      createUrlLogic(
        { authenticated: true },
        { slug: 'existing-slug', originalUrl: 'https://new.com' },
      ),
    ).rejects.toThrow('Short URL already exists');
  });

  it('should return the created URL if authenticated and with valid input', async () => {
    (getSession as jest.Mock).mockResolvedValue({ authenticated: true });
    const mockUrl = {
      id: 2,
      shortUrl: 'new-url',
      originalUrl: 'https://new.com',
      categories: [],
    };
    (prisma.shortUrl.create as jest.Mock).mockResolvedValue(mockUrl);

    const url = await createUrlLogic(
      { authenticated: true },
      { slug: 'new-url', originalUrl: 'https://new.com' },
    );
    expect(url).toEqual(mockUrl);
  });

  it('should handle errors gracefully during creation', async () => {
    (getSession as jest.Mock).mockResolvedValue({ authenticated: true });
    (prisma.shortUrl.create as jest.Mock).mockRejectedValue(
      new Error('DB Error'),
    );

    await expect(
      createUrlLogic(
        { authenticated: true },
        { slug: 'new-url', originalUrl: 'https://new.com' },
      ),
    ).rejects.toThrow('DB Error');
  });
});
