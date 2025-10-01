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
      allCategories.map(
        (category: { id: number; clickCount: number; name: string }) =>
          prisma.category.update({
            where: { id: category.id },
            data: { clickCount: { increment: 1 } },
          }),
      ),
    );

    // Perform the redirection using a 302 response
    return NextResponse.redirect(shortUrlRecord.originalUrl); // 302 redirect
  } catch {
    return NextResponse.redirect('/c');
  }
}
