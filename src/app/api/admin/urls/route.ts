import { NextResponse } from 'next/server';

import { getSession } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { createUrlSchema } from '@/lib/validations';

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
    const validation = createUrlSchema.safeParse(body);

    if (!validation.success) {
      const errorMessage = Object.values(
        validation.error.flatten().fieldErrors,
      )[0]?.[0];
      return NextResponse.json(
        { error: errorMessage || 'Invalid input.' },
        { status: 400 },
      );
    }

    const { slug, originalUrl, title, categoryId, expiresAt, active } =
      validation.data;

    // Check if slug already exists
    const existing = await prisma.shortUrl.findUnique({
      where: { shortUrl: slug },
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
