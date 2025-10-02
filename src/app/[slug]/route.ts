import { NextResponse } from 'next/server';

import prisma from '@/lib/prisma';

export async function GET(
  req: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;

  // Check for valid slug parameter
  if (!slug || typeof slug !== 'string') {
    return NextResponse.json(
      { error: 'Missing or invalid short URL' },
      { status: 400 },
    );
  }

  // Exclude reserved paths (admin, api, _next, etc.)
  const reservedPaths = ['admin', 'api', '_next', 'category', 'urls', 'c'];
  if (reservedPaths.includes(slug.toLowerCase())) {
    return NextResponse.json({ error: 'Reserved path' }, { status: 404 });
  }

  try {
    // Fetch the short URL record from the database
    const shortUrlRecord = await prisma.shortUrl.findUnique({
      where: { shortUrl: slug },
      include: { categories: true },
    });

    // If the short URL doesn't exist, return 404
    if (!shortUrlRecord) {
      return NextResponse.json(
        { error: 'Short URL not found' },
        { status: 404 },
      );
    }

    // Check if URL is inactive
    if (!shortUrlRecord.isActive) {
      return NextResponse.json(
        { error: 'This short URL has been disabled' },
        { status: 410 },
      );
    }

    // Check if URL has expired
    if (shortUrlRecord.expiresAt && shortUrlRecord.expiresAt < new Date()) {
      return NextResponse.json(
        { error: 'This short URL has expired' },
        { status: 410 },
      );
    }

    // Update click count and categories in a single transaction
    const categoryIds = shortUrlRecord.categories.map((c) => c.id);

    await prisma.$transaction([
      // Update short URL click count and timestamp
      prisma.shortUrl.update({
        where: { id: shortUrlRecord.id },
        data: {
          clickCount: { increment: 1 },
          latestClick: new Date(),
        },
      }),
      // Batch update all categories at once
      ...(categoryIds.length > 0
        ? [
            prisma.category.updateMany({
              where: { id: { in: categoryIds } },
              data: { clickCount: { increment: 1 } },
            }),
          ]
        : []),
    ]);

    // Perform the redirection using a 302 response
    return NextResponse.redirect(shortUrlRecord.originalUrl); // 302 redirect
  } catch (error) {
    // Log error for debugging
    // eslint-disable-next-line no-console
    console.error('Error processing short URL redirect:', error);
    return NextResponse.redirect('/c');
  }
}
