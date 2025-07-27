import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import prisma from '@/lib/prisma';
import { validateSession } from '@/lib/session';

const createUrlSchema = z.object({
  originalUrl: z.string().url('Please provide a valid URL'),
  shortUrl: z
    .string()
    .min(3, 'Short URL must be at least 3 characters')
    .max(20, 'Short URL must be less than 20 characters')
    .optional(),
  title: z
    .string()
    .min(1, 'Title is required')
    .max(100, 'Title must be less than 100 characters'),
  categoryIds: z.array(z.number()).optional(),
});

export async function GET(request: NextRequest) {
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

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const search = searchParams.get('search') || '';
    const categoryId = searchParams.get('categoryId') || '';
    const sortBy = searchParams.get('sortBy') || 'createdAt';
    const sortOrder = searchParams.get('sortOrder') || 'desc';

    // Build where clause
    const where: any = {
      userId: session.user.id,
    };

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { originalUrl: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (categoryId) {
      where.categoryId = categoryId;
    }

    // Get URLs with pagination
    const [urls, total] = await Promise.all([
      prisma.shortUrl.findMany({
        where,
        include: {
          categories: {
            select: {
              id: true,
              name: true,
            },
          },
        },
        orderBy: {
          [sortBy]: sortOrder,
        },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.shortUrl.count({ where }),
    ]);

    // Calculate pagination info
    const totalPages = Math.ceil(total / limit);
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;

    return NextResponse.json({
      success: true,
      data: urls,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNextPage,
        hasPrevPage,
      },
    });
  } catch (error) {
    console.error('Get URLs error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
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

    const body = await request.json();

    // Validate input
    const validationResult = createUrlSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: validationResult.error.errors },
        { status: 400 },
      );
    }

    const {
      originalUrl,
      shortUrl: customShortUrl,
      title,
      categoryIds,
    } = validationResult.data;

    // Generate short URL if not provided
    const finalShortUrl = customShortUrl || generateShortCode();

    // Check if short URL already exists
    const existingUrl = await prisma.shortUrl.findUnique({
      where: { shortUrl: finalShortUrl },
    });

    if (existingUrl) {
      return NextResponse.json(
        { error: 'Short URL already exists' },
        { status: 409 },
      );
    }

    // Create the short URL
    const shortUrl = await prisma.shortUrl.create({
      data: {
        originalUrl,
        shortUrl: finalShortUrl,
        title,
        userId: session.user.id,
        ...(categoryIds &&
          categoryIds.length > 0 && {
            categories: {
              connect: categoryIds.map((id) => ({ id })),
            },
          }),
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

    return NextResponse.json(
      {
        success: true,
        data: shortUrl,
        message: 'URL created successfully',
      },
      { status: 201 },
    );
  } catch (error) {
    console.error('Create URL error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}

// Helper function to generate short codes
function generateShortCode(): string {
  const chars =
    'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}
