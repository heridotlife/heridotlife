import prisma from '@/lib/prisma';

export async function redirectLogic(shortUrlParam: string | null) {
  if (!shortUrlParam) {
    throw new Error('Missing short URL parameter');
  }

  let shortUrlRecord;

  // Check if the parameter is an integer ID or a short URL string
  const id = parseInt(shortUrlParam, 10);
  if (!isNaN(id)) {
    // If it's a number, find by ID
    shortUrlRecord = await prisma.shortUrl.findUnique({
      where: { id },
      include: { categories: true },
    });
  } else {
    // Otherwise, find by short URL string
    shortUrlRecord = await prisma.shortUrl.findUnique({
      where: { shortUrl: shortUrlParam },
      include: { categories: true },
    });
  }

  // If the short URL doesn't exist, return 404
  if (!shortUrlRecord) {
    throw new Error('Short URL not found');
  }

  // Update the click count and latest click timestamp
  await prisma.shortUrl.update({
    where: { id: shortUrlRecord.id },
    data: {
      clickCount: { increment: 1 },
      latestClick: new Date(),
    },
  });

  // Update click count for all associated categories
  const allCategories = shortUrlRecord.categories;
  await Promise.all(
    allCategories.map((category: { id: number }) =>
      prisma.category.update({
        where: { id: category.id },
        data: { clickCount: { increment: 1 } },
      }),
    ),
  );

  return shortUrlRecord.originalUrl;
}
