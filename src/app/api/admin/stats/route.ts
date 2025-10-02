import { NextResponse } from 'next/server';

import { getSession } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function GET() {
  try {
    // Check authentication
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get total URLs
    const totalUrls = await prisma.shortUrl.count();

    // Get active URLs
    const activeUrls = await prisma.shortUrl.count({
      where: { isActive: true },
    });

    // Get expired URLs
    const expiredUrls = await prisma.shortUrl.count({
      where: {
        expiresAt: {
          lt: new Date(),
        },
      },
    });

    // Get total clicks (sum of all URL click counts)
    const clicksResult = await prisma.shortUrl.aggregate({
      _sum: {
        clickCount: true,
      },
    });
    const totalClicks = clicksResult._sum.clickCount || 0;

    // Get recent clicks (last 10 URLs with latest clicks)
    const recentClicks = await prisma.shortUrl.findMany({
      where: {
        latestClick: {
          not: null,
        },
      },
      select: {
        id: true,
        shortUrl: true,
        title: true,
        latestClick: true,
      },
      orderBy: {
        latestClick: 'desc',
      },
      take: 10,
    });

    return NextResponse.json({
      totalUrls,
      activeUrls,
      expiredUrls,
      totalClicks,
      recentClicks,
    });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Error fetching admin stats:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}
