import { NextResponse } from 'next/server';

import { getSession } from '@/lib/auth';
import prisma from '@/lib/prisma';

// GET all URLs
export async function GET() {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
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

    return NextResponse.json(urls);
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Error fetching URLs:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}

// POST create new URL
export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { shortUrl, originalUrl, title, categoryIds, expiresAt, isActive } =
      body;

    // Validation
    if (!shortUrl || !originalUrl) {
      return NextResponse.json(
        { error: 'Short URL and Original URL are required' },
        { status: 400 },
      );
    }

    // Check if slug already exists
    const existing = await prisma.shortUrl.findUnique({
      where: { shortUrl },
    });

    if (existing) {
      return NextResponse.json(
        { error: 'Short URL already exists' },
        { status: 409 },
      );
    }

    // Create URL
    const url = await prisma.shortUrl.create({
      data: {
        shortUrl,
        originalUrl,
        title: title || null,
        expiresAt: expiresAt ? new Date(expiresAt) : null,
        isActive: isActive !== undefined ? isActive : true,
        categories: categoryIds?.length
          ? {
              connect: categoryIds.map((id: number) => ({ id })),
            }
          : undefined,
      },
      include: {
        categories: true,
      },
    });

    return NextResponse.json(url, { status: 201 });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Error creating URL:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}
