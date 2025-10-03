import { toggleUrlLogic } from '@/lib/api-handlers/toggle-url';
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
      update: jest.fn(),
    },
  },
}));

describe('toggleUrlLogic', () => {
  it('should throw Unauthorized error if unauthenticated', async () => {
    (getSession as jest.Mock).mockResolvedValue(null);
    await expect(toggleUrlLogic(null, 1)).rejects.toThrow('Unauthorized');
  });

  it('should throw Invalid URL ID error if urlId is NaN', async () => {
    (getSession as jest.Mock).mockResolvedValue({ authenticated: true });
    await expect(toggleUrlLogic({ authenticated: true }, NaN)).rejects.toThrow(
      'Invalid URL ID',
    );
  });

  it('should throw URL not found error if URL does not exist', async () => {
    (getSession as jest.Mock).mockResolvedValue({ authenticated: true });
    (prisma.shortUrl.findUnique as jest.Mock).mockResolvedValue(null);
    await expect(toggleUrlLogic({ authenticated: true }, 1)).rejects.toThrow(
      'URL not found',
    );
  });

  it('should toggle isActive status and return updated URL', async () => {
    (getSession as jest.Mock).mockResolvedValue({ authenticated: true });
    const mockUrl = { id: 1, isActive: true };
    const mockUpdatedUrl = { ...mockUrl, isActive: false };
    (prisma.shortUrl.findUnique as jest.Mock).mockResolvedValue(mockUrl);
    (prisma.shortUrl.update as jest.Mock).mockResolvedValue(mockUpdatedUrl);

    const updated = await toggleUrlLogic({ authenticated: true }, 1);
    expect(updated).toEqual(mockUpdatedUrl);
    expect(prisma.shortUrl.update).toHaveBeenCalledWith({
      where: { id: 1 },
      data: { isActive: false },
    });
  });

  it('should handle errors gracefully during toggle', async () => {
    (getSession as jest.Mock).mockResolvedValue({ authenticated: true });
    (prisma.shortUrl.findUnique as jest.Mock).mockResolvedValue({
      id: 1,
      isActive: true,
    });
    (prisma.shortUrl.update as jest.Mock).mockRejectedValue(
      new Error('DB Error'),
    );

    await expect(toggleUrlLogic({ authenticated: true }, 1)).rejects.toThrow(
      'DB Error',
    );
  });
});
