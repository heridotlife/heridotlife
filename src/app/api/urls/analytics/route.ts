import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { getUserFromRequest } from '@/lib/auth';
import prisma from '@/lib/prisma';

// Force dynamic rendering for authenticated routes
export const dynamic = 'force-dynamic';

const analyticsQuerySchema = z.object({
  dateRange: z.enum(['7d', '30d', '90d', '1y']).default('7d'),
  categoryId: z.string().optional(),
});

export async function GET(request: NextRequest) {
  try {
    // Get authenticated user
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const query = analyticsQuerySchema.parse({
      dateRange: searchParams.get('dateRange') || '7d',
      categoryId: searchParams.get('categoryId'),
    });

    // Calculate date range
    const now = new Date();
    const dateRanges = {
      '7d': new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000),
      '30d': new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000),
      '90d': new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000),
      '1y': new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000),
    };
    const startDate = dateRanges[query.dateRange];

    // Build where clause for user's URLs
    const whereClause: any = {
      userId: user.id,
      createdAt: {
        gte: startDate,
      },
    };

    // Add category filter if provided
    if (query.categoryId) {
      whereClause.categories = {
        some: {
          id: parseInt(query.categoryId),
        },
      };
    }

    // Get total URLs count
    const totalUrls = await prisma.shortUrl.count({
      where: whereClause,
    });

    // Get total clicks
    const totalClicks = await prisma.shortUrl.aggregate({
      where: whereClause,
      _sum: {
        clickCount: true,
      },
    });

    // Get average clicks per URL
    const averageClicks =
      totalUrls > 0
        ? Math.round((totalClicks._sum.clickCount || 0) / totalUrls)
        : 0;

    // Get top performing URLs
    const topUrls = await prisma.shortUrl.findMany({
      where: whereClause,
      select: {
        id: true,
        title: true,
        shortUrl: true,
        clickCount: true,
        originalUrl: true,
        latestClick: true,
      },
      orderBy: {
        clickCount: 'desc',
      },
      take: 10,
    });

    // Get recent activity (URLs with recent clicks)
    const recentActivity = await prisma.shortUrl.findMany({
      where: {
        ...whereClause,
        latestClick: {
          not: null,
        },
      },
      select: {
        id: true,
        title: true,
        shortUrl: true,
        clickCount: true,
        latestClick: true,
      },
      orderBy: {
        latestClick: 'desc',
      },
      take: 10,
    });

    // Get category statistics
    const categoryStats = await prisma.category.findMany({
      where: {
        shortUrls: {
          some: {
            userId: user.id,
            createdAt: {
              gte: startDate,
            },
          },
        },
      },
      select: {
        name: true,
        shortUrls: {
          where: {
            userId: user.id,
            createdAt: {
              gte: startDate,
            },
          },
          select: {
            clickCount: true,
          },
        },
      },
    });

    // Calculate category totals
    const categoryTotals = categoryStats.map((category: any) => ({
      name: category.name,
      urlCount: category.shortUrls.length,
      totalClicks: category.shortUrls.reduce(
        (sum: number, url: { clickCount: number }) => sum + url.clickCount,
        0,
      ),
    }));

    // Get growth percentage (mock calculation for now)
    const previousPeriodStart = new Date(
      startDate.getTime() - (now.getTime() - startDate.getTime()),
    );
    const previousPeriodUrls = await prisma.shortUrl.count({
      where: {
        userId: user.id,
        createdAt: {
          gte: previousPeriodStart,
          lt: startDate,
        },
      },
    });

    const growthPercentage =
      previousPeriodUrls > 0
        ? Math.round(
            ((totalUrls - previousPeriodUrls) / previousPeriodUrls) * 100,
          )
        : 0;

    return NextResponse.json({
      success: true,
      data: {
        totalUrls,
        totalClicks: totalClicks._sum.clickCount || 0,
        averageClicks,
        growthPercentage,
        topUrls,
        recentActivity,
        categoryStats: categoryTotals,
        dateRange: query.dateRange,
      },
    });
  } catch (error) {
    console.error('Analytics API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch analytics data' },
      { status: 500 },
    );
  }
}
