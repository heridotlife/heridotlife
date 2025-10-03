import { NextResponse } from 'next/server';

import { redirectLogic } from '@/lib/api-handlers/redirect';
import { respondBadRequest, respondNotFound } from '@/lib/api-responses';
import logger from '@/lib/logger';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const shortUrlParam = searchParams.get('shortUrl');

  try {
    const originalUrl = await redirectLogic(shortUrlParam);
    logger({ shortUrlParam, originalUrl }, 'Redirecting short URL');
    return NextResponse.redirect(originalUrl);
  } catch (error: unknown) {
    logger(error, `Error redirecting short URL: ${shortUrlParam}`);
    if (
      error instanceof Error &&
      error.message === 'Missing short URL parameter'
    ) {
      return respondBadRequest(error.message);
    }
    if (error instanceof Error && error.message === 'Short URL not found') {
      return respondNotFound(error.message);
    }
    // Fallback for any other errors, redirect to a generic error page or home
    return NextResponse.redirect('/c');
  }
}
