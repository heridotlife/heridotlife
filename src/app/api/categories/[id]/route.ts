import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { getUserFromRequest } from '@/lib/auth';
import prisma from '@/lib/prisma';

// Force dynamic rendering for authenticated routes
export const dynamic = 'force-dynamic';

const updateCategorySchema = z.object({
  name: z.string().min(1).max(50),
});

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const categoryId = parseInt(params.id);
    if (isNaN(categoryId)) {
      return NextResponse.json(
        { error: 'Invalid category ID' },
        { status: 400 },
      );
    }

    const category = await prisma.category.findFirst({
      where: {
        id: categoryId,
        shortUrls: {
          some: {
            userId: user.id,
          },
        },
      },
      include: {
        shortUrls: {
          where: {
            userId: user.id,
          },
          select: {
            id: true,
            title: true,
            shortUrl: true,
            clickCount: true,
            createdAt: true,
          },
        },
      },
    });

    if (!category) {
      return NextResponse.json(
        { error: 'Category not found' },
        { status: 404 },
      );
    }

    return NextResponse.json({
      success: true,
      data: category,
    });
  } catch (error) {
    console.error('Category GET error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch category' },
      { status: 500 },
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const categoryId = parseInt(params.id);
    if (isNaN(categoryId)) {
      return NextResponse.json(
        { error: 'Invalid category ID' },
        { status: 400 },
      );
    }

    const body = await request.json();
    const validatedData = updateCategorySchema.parse(body);

    // Check if category exists and user has access
    const existingCategory = await prisma.category.findFirst({
      where: {
        id: categoryId,
        shortUrls: {
          some: {
            userId: user.id,
          },
        },
      },
    });

    if (!existingCategory) {
      return NextResponse.json(
        { error: 'Category not found' },
        { status: 404 },
      );
    }

    // Check if new name already exists
    const nameExists = await prisma.category.findFirst({
      where: {
        name: validatedData.name,
        id: {
          not: categoryId,
        },
      },
    });

    if (nameExists) {
      return NextResponse.json(
        { error: 'Category name already exists' },
        { status: 409 },
      );
    }

    const updatedCategory = await prisma.category.update({
      where: { id: categoryId },
      data: {
        name: validatedData.name,
      },
      include: {
        shortUrls: {
          where: {
            userId: user.id,
          },
          select: {
            id: true,
            title: true,
            shortUrl: true,
            clickCount: true,
            createdAt: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      data: updatedCategory,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input data', details: error.errors },
        { status: 400 },
      );
    }

    console.error('Category PUT error:', error);
    return NextResponse.json(
      { error: 'Failed to update category' },
      { status: 500 },
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const categoryId = parseInt(params.id);
    if (isNaN(categoryId)) {
      return NextResponse.json(
        { error: 'Invalid category ID' },
        { status: 400 },
      );
    }

    // Check if category exists and user has access
    const existingCategory = await prisma.category.findFirst({
      where: {
        id: categoryId,
        shortUrls: {
          some: {
            userId: user.id,
          },
        },
      },
      include: {
        shortUrls: {
          where: {
            userId: user.id,
          },
        },
      },
    });

    if (!existingCategory) {
      return NextResponse.json(
        { error: 'Category not found' },
        { status: 404 },
      );
    }

    // Remove category from all user's URLs
    const userUrlsWithCategory = await prisma.shortUrl.findMany({
      where: {
        userId: user.id,
        categories: {
          some: {
            id: categoryId,
          },
        },
      },
    });

    // Disconnect category from each URL
    for (const url of userUrlsWithCategory) {
      await prisma.shortUrl.update({
        where: { id: url.id },
        data: {
          categories: {
            disconnect: {
              id: categoryId,
            },
          },
        },
      });
    }

    // Delete the category
    await prisma.category.delete({
      where: { id: categoryId },
    });

    return NextResponse.json({
      success: true,
      message: 'Category deleted successfully',
    });
  } catch (error) {
    console.error('Category DELETE error:', error);
    return NextResponse.json(
      { error: 'Failed to delete category' },
      { status: 500 },
    );
  }
}
