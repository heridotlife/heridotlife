import { NextResponse } from 'next/server';

import { getSession } from '@/lib/auth';
import prisma from '@/lib/prisma';

// GET single URL
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const urlId = parseInt(id);

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
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const urlId = parseInt(id);

    if (isNaN(urlId)) {
      return NextResponse.json({ error: 'Invalid URL ID' }, { status: 400 });
    }

    const body = await request.json();
    const { shortUrl, originalUrl, title, categoryIds, expiresAt, isActive } =
      body;

    // Check if URL exists
    const existing = await prisma.shortUrl.findUnique({
      where: { id: urlId },
      include: { categories: true },
    });

    if (!existing) {
      return NextResponse.json({ error: 'URL not found' }, { status: 404 });
    }

    // Check if new slug conflicts with another URL
    if (shortUrl && shortUrl !== existing.shortUrl) {
      const conflict = await prisma.shortUrl.findUnique({
        where: { shortUrl },
      });
      if (conflict) {
        return NextResponse.json(
          { error: 'Short URL already exists' },
          { status: 409 },
        );
      }
    }

    // Update URL with category management
    const url = await prisma.shortUrl.update({
      where: { id: urlId },
      data: {
        shortUrl: shortUrl || existing.shortUrl,
        originalUrl: originalUrl || existing.originalUrl,
        title: title !== undefined ? title : existing.title,
        expiresAt:
          expiresAt !== undefined
            ? expiresAt
              ? new Date(expiresAt)
              : null
            : existing.expiresAt,
        isActive: isActive !== undefined ? isActive : existing.isActive,
        categories: categoryIds
          ? {
              set: [], // Disconnect all first
              connect: categoryIds.map((id: number) => ({ id })),
            }
          : undefined,
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
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const urlId = parseInt(id);

    if (isNaN(urlId)) {
      return NextResponse.json({ error: 'Invalid URL ID' }, { status: 400 });
    }

    await prisma.shortUrl.delete({
      where: { id: urlId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Error deleting URL:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}
