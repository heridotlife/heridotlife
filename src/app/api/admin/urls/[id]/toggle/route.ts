import { NextResponse } from 'next/server';

import { getSession } from '@/lib/auth';
import prisma from '@/lib/prisma';

// PATCH toggle isActive
export async function PATCH(
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
    });

    if (!url) {
      return NextResponse.json({ error: 'URL not found' }, { status: 404 });
    }

    const updated = await prisma.shortUrl.update({
      where: { id: urlId },
      data: {
        isActive: !url.isActive,
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Error toggling URL:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}
