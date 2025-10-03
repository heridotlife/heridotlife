import { NextResponse } from 'next/server';

import { getSession } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { createCategorySchema } from '@/lib/validations';

// GET all categories
export async function GET() {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const categories = await prisma.category.findMany({
      include: {
        _count: {
          select: { shortUrls: true },
        },
      },
      orderBy: {
        name: 'asc',
      },
    });

    return NextResponse.json(categories);
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Error fetching categories:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}

// POST create category
export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const validation = createCategorySchema.safeParse(body);

    if (!validation.success) {
      const errorMessage = Object.values(
        validation.error.flatten().fieldErrors,
      )[0]?.[0];
      return NextResponse.json(
        { error: errorMessage || 'Invalid input.' },
        { status: 400 },
      );
    }

    const { name } = validation.data;

    const category = await prisma.category.create({
      data: { name },
    });

    return NextResponse.json(category, { status: 201 });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Error creating category:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}
