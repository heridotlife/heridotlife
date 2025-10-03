import { AuthenticatedSession } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function toggleUrlLogic(
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
  });

  if (!url) {
    throw new Error('URL not found');
  }

  const updated = await prisma.shortUrl.update({
    where: { id: urlId },
    data: {
      isActive: !url.isActive,
    },
  });

  return updated;
}
