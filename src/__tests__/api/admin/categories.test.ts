import {
  createCategoryLogic,
  getCategoriesLogic,
} from '@/lib/api-handlers/categories';
import { getSession } from '@/lib/auth';
import prisma from '@/lib/prisma';

// Mock the getSession function
jest.mock('@/lib/auth', () => ({
  getSession: jest.fn(),
}));

// Mock Prisma client
jest.mock('@/lib/prisma', () => ({
  __esModule: true,
  default: {
    category: {
      findMany: jest.fn(),
      create: jest.fn(),
    },
  },
}));

describe('getCategoriesLogic', () => {
  it('should throw Unauthorized error if unauthenticated', async () => {
    (getSession as jest.Mock).mockResolvedValue(null);

    await expect(getCategoriesLogic(null)).rejects.toThrow('Unauthorized');
  });

  it('should return categories if authenticated', async () => {
    (getSession as jest.Mock).mockResolvedValue({ authenticated: true });
    const mockCategories = [
      { id: 1, name: 'Category 1', _count: { shortUrls: 5 } },
      { id: 2, name: 'Category 2', _count: { shortUrls: 10 } },
    ];
    (prisma.category.findMany as jest.Mock).mockResolvedValue(mockCategories);

    const categories = await getCategoriesLogic({ authenticated: true });
    expect(categories).toEqual(mockCategories);
  });

  it('should handle errors gracefully', async () => {
    (getSession as jest.Mock).mockResolvedValue({ authenticated: true });
    (prisma.category.findMany as jest.Mock).mockRejectedValue(
      new Error('DB Error'),
    );

    await expect(getCategoriesLogic({ authenticated: true })).rejects.toThrow(
      'DB Error',
    );
  });
});

describe('createCategoryLogic', () => {
  it('should throw Unauthorized error if unauthenticated', async () => {
    (getSession as jest.Mock).mockResolvedValue(null);

    await expect(
      createCategoryLogic(null, { name: 'New Category' }),
    ).rejects.toThrow('Unauthorized');
  });

  it('should throw error if authenticated but with invalid input', async () => {
    (getSession as jest.Mock).mockResolvedValue({ authenticated: true });

    await expect(
      createCategoryLogic({ authenticated: true }, {}),
    ).rejects.toThrow('Invalid input: expected string, received undefined');
  });

  it('should return the created category if authenticated and with valid input', async () => {
    (getSession as jest.Mock).mockResolvedValue({ authenticated: true });
    const mockCategory = { id: 3, name: 'New Category' };
    (prisma.category.create as jest.Mock).mockResolvedValue(mockCategory);

    const category = await createCategoryLogic(
      { authenticated: true },
      { name: 'New Category' },
    );
    expect(category).toEqual(mockCategory);
  });

  it('should handle errors gracefully during creation', async () => {
    (getSession as jest.Mock).mockResolvedValue({ authenticated: true });
    (prisma.category.create as jest.Mock).mockRejectedValue(
      new Error('DB Error'),
    );

    await expect(
      createCategoryLogic({ authenticated: true }, { name: 'New Category' }),
    ).rejects.toThrow('DB Error');
  });
});
