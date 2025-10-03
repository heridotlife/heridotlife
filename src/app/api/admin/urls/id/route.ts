import { NextRequest, NextResponse } from 'next/server';

import { getSession } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { updateUrlSchema } from '@/lib/validations';

// GET URL by ID
export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const id = request.nextUrl.searchParams.get('id');
    const urlId = Number(id);
    if (isNaN(urlId)) {
      return NextResponse.json({ error: 'Invalid URL ID' }, { status: 400 });
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
      return NextResponse.json({ error: 'URL not found' }, { status: 404 });
    }

    return NextResponse.json(url);
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Error fetching URL:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}

// PUT update URL
export async function PUT(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const id = request.nextUrl.searchParams.get('id');
    const urlId = Number(id);
    if (isNaN(urlId)) {
      return NextResponse.json({ error: 'Invalid URL ID' }, { status: 400 });
    }

    const body = await request.json();
    const validation = updateUrlSchema.safeParse(body);

    if (!validation.success) {
      const errorMessage = Object.values(
        validation.error.flatten().fieldErrors,
      )[0]?.[0];
      return NextResponse.json(
        { error: errorMessage || 'Invalid input.' },
        { status: 400 },
      );
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
      return NextResponse.json(
        { error: 'Short URL already exists' },
        { status: 409 },
      );
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

    return NextResponse.json(url);
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Error updating URL:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}

// DELETE URL
export async function DELETE(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const id = request.nextUrl.searchParams.get('id');
    const urlId = Number(id);
    if (isNaN(urlId)) {
      return NextResponse.json({ error: 'Invalid URL ID' }, { status: 400 });
    }

    await prisma.shortUrl.delete({
      where: { id: urlId },
    });

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Error deleting URL:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}
