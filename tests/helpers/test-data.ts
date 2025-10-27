/**
 * Test data fixtures
 */
import type { ShortUrl, Category } from '@/lib/d1';

export const testShortUrls: ShortUrl[] = [
  {
    id: 1,
    shortUrl: 'gh',
    originalUrl: 'https://github.com/heridotlife',
    title: 'GitHub Profile',
    description: 'My GitHub profile',
    ogImage: 'https://github.com/heridotlife.png',
    userId: null,
    createdAt: 1640000000,
    updatedAt: 1640000000,
    clickCount: 42,
    latestClick: 1640000100,
    isActive: 1,
    expiresAt: null,
  },
  {
    id: 2,
    shortUrl: 'li',
    originalUrl: 'https://linkedin.com/in/heridotlife',
    title: 'LinkedIn Profile',
    description: 'Professional network',
    ogImage: null,
    userId: null,
    createdAt: 1640000000,
    updatedAt: 1640000000,
    clickCount: 15,
    latestClick: null,
    isActive: 1,
    expiresAt: null,
  },
];

export const testCategories: Category[] = [
  { id: 1, name: 'Social', clickCount: 50 },
  { id: 2, name: 'Tech', clickCount: 120 },
  { id: 3, name: 'Blog', clickCount: 80 },
];
