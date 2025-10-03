import { createUrlLogic, getUrlsLogic } from '@/lib/api-handlers/urls';
import {
  respondBadRequest,
  respondConflict,
  respondError,
  respondSuccess,
  respondUnauthorized,
} from '@/lib/api-responses';
import { getSession } from '@/lib/auth';
import logger from '@/lib/logger';

// GET all URLs
export async function GET() {
  try {
    const session = await getSession();
    const urls = await getUrlsLogic(session);
    logger(urls, 'Fetched all URLs');
    return respondSuccess(urls);
  } catch (error: unknown) {
    logger(error, 'Error fetching URLs');
    if (error instanceof Error && error.message === 'Unauthorized') {
      return respondUnauthorized();
    }
    return respondError('Internal server error');
  }
}

// POST create new URL
export async function POST(request: Request) {
  try {
    const session = await getSession();
    const body = await request.json();
    const url = await createUrlLogic(session, body);
    logger(url, 'Created new URL');
    return respondSuccess(url, 201);
  } catch (error: unknown) {
    logger(error, 'Error creating URL');
    if (error instanceof Error && error.message === 'Unauthorized') {
      return respondUnauthorized();
    }
    if (error instanceof Error && error.message.startsWith('Invalid input')) {
      // Catch Zod validation errors
      return respondBadRequest(error.message);
    }
    if (
      error instanceof Error &&
      error.message === 'Short URL already exists'
    ) {
      return respondConflict(error.message);
    }
    return respondError('Internal server error');
  }
}
