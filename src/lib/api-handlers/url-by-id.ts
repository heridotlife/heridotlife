import { z } from 'zod';

import { AuthenticatedSession } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { updateUrlSchema } from '@/lib/validations';

export async function getUrlByIdLogic(
  session: AuthenticatedSession | null,
  urlId: number,
) {
  if (!session) {
    throw new Error('Unauthorized');
  }

  if (isNaN(urlId)) {
    throw new Error('Invalid URL ID');
  }

  const url = await prisma.shortUrl.findUnique({
    where: { id: urlId },
    include: {
      categories: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  });

  if (!url) {
    throw new Error('URL not found');
  }

  return url;
}

export async function updateUrlLogic(
  session: AuthenticatedSession | null,
  urlId: number,
  body: z.infer<typeof updateUrlSchema>,
) {
  if (!session) {
    throw new Error('Unauthorized');
  }

  if (isNaN(urlId)) {
    throw new Error('Invalid URL ID');
  }

  const validation = updateUrlSchema.safeParse(body);

  if (!validation.success) {
    const errorMessage = Object.values(
      validation.error.flatten().fieldErrors,
    )[0]?.[0];
    throw new Error(`Invalid input: ${errorMessage || 'Unknown error.'}`);
  }

  const { slug, originalUrl, title, categoryId, expiresAt } = validation.data;

  // Check if slug already exists and belongs to another URL
  const existingSlug = await prisma.shortUrl.findFirst({
    where: {
      shortUrl: slug,
      id: { not: urlId },
    },
  });

  if (existingSlug) {
    throw new Error('Short URL already exists');
  }

  // Update URL
  const url = await prisma.shortUrl.update({
    where: { id: urlId },
    data: {
      shortUrl: slug,
      originalUrl,
      title: title || null,
      expiresAt: expiresAt ? new Date(expiresAt) : null,
      categories: {
        set: categoryId ? [{ id: Number(categoryId) }] : [],
      },
    },
    include: {
      categories: true,
    },
  });

  return url;
}

export async function deleteUrlLogic(
  session: AuthenticatedSession | null,
  urlId: number,
) {
  if (!session) {
    throw new Error('Unauthorized');
  }

  if (isNaN(urlId)) {
    throw new Error('Invalid URL ID');
  }

  await prisma.shortUrl.delete({
    where: { id: urlId },
  });

  return { message: 'URL deleted successfully' };
}
