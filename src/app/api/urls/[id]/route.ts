import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { validateSession } from '@/lib/session';
import prisma from '@/lib/prisma';

// Force dynamic rendering for authenticated routes
export const dynamic = 'force-dynamic';

const updateUrlSchema = z.object({
  title: z
    .string()
    .min(1, 'Title is required')
    .max(100, 'Title must be less than 100 characters')
    .optional(),
  categoryIds: z.array(z.number()).optional(),
});

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    // Get session token from cookies
    const sessionToken = request.cookies.get('sessionToken')?.value;

    if (!sessionToken) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    // Validate session
    const session = await validateSession(sessionToken);
    if (!session) {
      return NextResponse.json(
        { error: 'Invalid or expired session' },
        { status: 401 },
      );
    }

    const { id } = await params;
    const urlId = parseInt(id);
    if (isNaN(urlId)) {
      return NextResponse.json({ error: 'Invalid URL ID' }, { status: 400 });
    }

    // Get the URL with categories
    const url = await prisma.shortUrl.findFirst({
      where: {
        id: urlId,
        userId: session.user.id,
      },
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

    return NextResponse.json({
      success: true,
      data: url,
    });
  } catch (error) {
    console.error('Get URL error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    // Get session token from cookies
    const sessionToken = request.cookies.get('sessionToken')?.value;

    if (!sessionToken) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    // Validate session
    const session = await validateSession(sessionToken);
    if (!session) {
      return NextResponse.json(
        { error: 'Invalid or expired session' },
        { status: 401 },
      );
    }

    const { id } = await params;
    const urlId = parseInt(id);
    if (isNaN(urlId)) {
      return NextResponse.json({ error: 'Invalid URL ID' }, { status: 400 });
    }

    const body = await request.json();

    // Validate input
    const validationResult = updateUrlSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: validationResult.error.errors },
        { status: 400 },
      );
    }

    const { title, categoryIds } = validationResult.data;

    // Check if URL exists and belongs to user
    const existingUrl = await prisma.shortUrl.findFirst({
      where: {
        id: urlId,
        userId: session.user.id,
      },
    });

    if (!existingUrl) {
      return NextResponse.json({ error: 'URL not found' }, { status: 404 });
    }

    // Update URL data
    const updateData: any = {};
    if (title !== undefined) {
      updateData.title = title;
    }

    // Update the URL
    const updatedUrl = await prisma.shortUrl.update({
      where: { id: urlId },
      data: updateData,
      include: {
        categories: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    // Update categories if provided
    if (categoryIds !== undefined) {
      // Remove all existing category associations
      await prisma.shortUrl.update({
        where: { id: urlId },
        data: {
          categories: {
            set: [],
          },
        },
      });

      // Add new category associations
      if (categoryIds.length > 0) {
        await prisma.shortUrl.update({
          where: { id: urlId },
          data: {
            categories: {
              connect: categoryIds.map((categoryId) => ({ id: categoryId })),
            },
          },
        });
      }

      // Fetch updated URL with categories
      const finalUrl = await prisma.shortUrl.findFirst({
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

      return NextResponse.json({
        success: true,
        data: finalUrl,
      });
    }

    return NextResponse.json({
      success: true,
      data: updatedUrl,
    });
  } catch (error) {
    console.error('Update URL error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    // Get session token from cookies
    const sessionToken = request.cookies.get('sessionToken')?.value;

    if (!sessionToken) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    // Validate session
    const session = await validateSession(sessionToken);
    if (!session) {
      return NextResponse.json(
        { error: 'Invalid or expired session' },
        { status: 401 },
      );
    }

    const { id } = await params;
    const urlId = parseInt(id);
    if (isNaN(urlId)) {
      return NextResponse.json({ error: 'Invalid URL ID' }, { status: 400 });
    }

    // Check if URL exists and belongs to user
    const existingUrl = await prisma.shortUrl.findFirst({
      where: {
        id: urlId,
        userId: session.user.id,
      },
    });

    if (!existingUrl) {
      return NextResponse.json({ error: 'URL not found' }, { status: 404 });
    }

    // Delete the URL
    await prisma.shortUrl.delete({
      where: { id: urlId },
    });

    return NextResponse.json({
      success: true,
      message: 'URL deleted successfully',
    });
  } catch (error) {
    console.error('Delete URL error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}
