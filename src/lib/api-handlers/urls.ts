import { z } from 'zod';

import { AuthenticatedSession } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { createUrlSchema } from '@/lib/validations';

export async function getUrlsLogic(session: AuthenticatedSession | null) {
  if (!session) {
    throw new Error('Unauthorized');
  }

  const urls = await prisma.shortUrl.findMany({
    include: {
      categories: {
        select: {
          id: true,
          name: true,
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
  });

  return urls;
}

export async function createUrlLogic(
  session: AuthenticatedSession | null,
  body: z.infer<typeof createUrlSchema>,
) {
  if (!session) {
    throw new Error('Unauthorized');
  }

  const validation = createUrlSchema.safeParse(body);

  if (!validation.success) {
    const errorMessage = Object.values(
      validation.error.flatten().fieldErrors,
    )[0]?.[0];
    throw new Error(`Invalid input: ${errorMessage || 'Unknown error.'}`);
  }

  const { slug, originalUrl, title, categoryId, expiresAt, active } =
    validation.data;

  // Check if slug already exists
  const existing = await prisma.shortUrl.findUnique({
    where: { shortUrl: slug },
  });

  if (existing) {
    throw new Error('Short URL already exists');
  }

  // Create URL
  const url = await prisma.shortUrl.create({
    data: {
      shortUrl: slug,
      originalUrl,
      title: title || null,
      expiresAt: expiresAt ? new Date(expiresAt) : null,
      isActive: active !== undefined ? active : true,
      categories: categoryId
        ? {
            connect: { id: Number(categoryId) },
          }
        : undefined,
    },
    include: {
      categories: true,
    },
  });

  return url;
}
