import {
  deleteUrlLogic,
  getUrlByIdLogic,
  updateUrlLogic,
} from '@/lib/api-handlers/url-by-id';
import { getSession } from '@/lib/auth';
import prisma from '@/lib/prisma';

jest.mock('@/lib/auth', () => ({
  getSession: jest.fn(),
}));

jest.mock('@/lib/prisma', () => ({
  __esModule: true,
  default: {
    shortUrl: {
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
  },
}));

describe('getUrlByIdLogic', () => {
  it('should throw Unauthorized error if unauthenticated', async () => {
    (getSession as jest.Mock).mockResolvedValue(null);
    await expect(getUrlByIdLogic(null, 1)).rejects.toThrow('Unauthorized');
  });

  it('should throw Invalid URL ID error if urlId is NaN', async () => {
    (getSession as jest.Mock).mockResolvedValue({ authenticated: true });
    await expect(getUrlByIdLogic({ authenticated: true }, NaN)).rejects.toThrow(
      'Invalid URL ID',
    );
  });

  it('should throw URL not found error if URL does not exist', async () => {
    (getSession as jest.Mock).mockResolvedValue({ authenticated: true });
    (prisma.shortUrl.findUnique as jest.Mock).mockResolvedValue(null);
    await expect(getUrlByIdLogic({ authenticated: true }, 1)).rejects.toThrow(
      'URL not found',
    );
  });

  it('should return URL if authenticated and URL exists', async () => {
    (getSession as jest.Mock).mockResolvedValue({ authenticated: true });
    const mockUrl = {
      id: 1,
      shortUrl: 'test',
      originalUrl: 'https://test.com',
      categories: [],
    };
    (prisma.shortUrl.findUnique as jest.Mock).mockResolvedValue(mockUrl);
    const url = await getUrlByIdLogic({ authenticated: true }, 1);
    expect(url).toEqual(mockUrl);
  });
});

describe('updateUrlLogic', () => {
  beforeEach(() => {
    (prisma.shortUrl.findFirst as jest.Mock).mockResolvedValue(null); // No existing slug by default
  });

  it('should throw Unauthorized error if unauthenticated', async () => {
    (getSession as jest.Mock).mockResolvedValue(null);
    await expect(
      updateUrlLogic(null, 1, { slug: 'new', originalUrl: 'https://new.com' }),
    ).rejects.toThrow('Unauthorized');
  });

  it('should throw Invalid URL ID error if urlId is NaN', async () => {
    (getSession as jest.Mock).mockResolvedValue({ authenticated: true });
    await expect(
      updateUrlLogic({ authenticated: true }, NaN, {
        slug: 'new',
        originalUrl: 'https://new.com',
      }),
    ).rejects.toThrow('Invalid URL ID');
  });

  it('should throw error if authenticated but with invalid input', async () => {
    (getSession as jest.Mock).mockResolvedValue({ authenticated: true });
    await expect(
      updateUrlLogic({ authenticated: true }, 1, {}),
    ).rejects.toThrow('Invalid input: expected string, received undefined');
  });

  it('should throw error if slug already exists and belongs to another URL', async () => {
    (getSession as jest.Mock).mockResolvedValue({ authenticated: true });
    (prisma.shortUrl.findFirst as jest.Mock).mockResolvedValue({
      id: 2,
      shortUrl: 'existing',
    });
    await expect(
      updateUrlLogic({ authenticated: true }, 1, {
        slug: 'existing',
        originalUrl: 'https://new.com',
      }),
    ).rejects.toThrow('Short URL already exists');
  });

  it('should return updated URL if authenticated and valid input', async () => {
    (getSession as jest.Mock).mockResolvedValue({ authenticated: true });
    const mockUpdatedUrl = {
      id: 1,
      shortUrl: 'updated',
      originalUrl: 'https://updated.com',
      categories: [],
    };
    (prisma.shortUrl.update as jest.Mock).mockResolvedValue(mockUpdatedUrl);
    const url = await updateUrlLogic({ authenticated: true }, 1, {
      slug: 'updated',
      originalUrl: 'https://updated.com',
    });
    expect(url).toEqual(mockUpdatedUrl);
  });

  it('should handle errors gracefully during update', async () => {
    (getSession as jest.Mock).mockResolvedValue({ authenticated: true });
    (prisma.shortUrl.update as jest.Mock).mockRejectedValue(
      new Error('DB Error'),
    );
    await expect(
      updateUrlLogic({ authenticated: true }, 1, {
        slug: 'updated',
        originalUrl: 'https://updated.com',
      }),
    ).rejects.toThrow('DB Error');
  });
});

describe('deleteUrlLogic', () => {
  it('should throw Unauthorized error if unauthenticated', async () => {
    (getSession as jest.Mock).mockResolvedValue(null);
    await expect(deleteUrlLogic(null, 1)).rejects.toThrow('Unauthorized');
  });

  it('should throw Invalid URL ID error if urlId is NaN', async () => {
    (getSession as jest.Mock).mockResolvedValue({ authenticated: true });
    await expect(deleteUrlLogic({ authenticated: true }, NaN)).rejects.toThrow(
      'Invalid URL ID',
    );
  });

  it('should delete URL if authenticated and valid ID', async () => {
    (getSession as jest.Mock).mockResolvedValue({ authenticated: true });
    (prisma.shortUrl.delete as jest.Mock).mockResolvedValue({ id: 1 });
    const result = await deleteUrlLogic({ authenticated: true }, 1);
    expect(result).toEqual({ message: 'URL deleted successfully' });
  });

  it('should handle errors gracefully during deletion', async () => {
    (getSession as jest.Mock).mockResolvedValue({ authenticated: true });
    (prisma.shortUrl.delete as jest.Mock).mockRejectedValue(
      new Error('DB Error'),
    );
    await expect(deleteUrlLogic({ authenticated: true }, 1)).rejects.toThrow(
      'DB Error',
    );
  });
});
