import { z } from 'zod';

import { AuthenticatedSession } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { createCategorySchema } from '@/lib/validations';

export async function getCategoriesLogic(session: AuthenticatedSession | null) {
  if (!session) {
    throw new Error('Unauthorized');
  }

  const categories = await prisma.category.findMany({
    include: {
      _count: {
        select: { shortUrls: true },
      },
    },
    orderBy: {
      name: 'asc',
    },
  });

  return categories;
}

export async function createCategoryLogic(
  session: AuthenticatedSession | null,
  body: z.infer<typeof createCategorySchema>,
) {
  if (!session) {
    throw new Error('Unauthorized');
  }

  const validation = createCategorySchema.safeParse(body);

  if (!validation.success) {
    const errorMessage = Object.values(
      validation.error.flatten().fieldErrors,
    )[0]?.[0];
    throw new Error(errorMessage || 'Invalid input.');
  }

  const { name } = validation.data;

  const category = await prisma.category.create({
    data: { name },
  });

  return category;
}
