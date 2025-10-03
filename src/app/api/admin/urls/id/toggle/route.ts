import { NextRequest } from 'next/server';

import { toggleUrlLogic } from '@/lib/api-handlers/toggle-url';
import {
  respondBadRequest,
  respondError,
  respondNotFound,
  respondSuccess,
  respondUnauthorized,
} from '@/lib/api-responses';
import { getSession } from '@/lib/auth';
import logger from '@/lib/logger';

// PATCH toggle isActive
export async function PATCH(request: NextRequest) {
  try {
    const session = await getSession();
    const id = request.nextUrl.searchParams.get('id');
    const urlId = Number(id);
    const updatedUrl = await toggleUrlLogic(session, urlId);
    logger(updatedUrl, `Toggled URL with ID ${urlId}`);
    return respondSuccess(updatedUrl);
  } catch (error: unknown) {
    const id = request.nextUrl.searchParams.get('id');
    logger(error, `Error toggling URL with ID ${id}`);
    if (error instanceof Error && error.message === 'Unauthorized') {
      return respondUnauthorized();
    }
    if (error instanceof Error && error.message === 'Invalid URL ID') {
      return respondBadRequest(error.message);
    }
    if (error instanceof Error && error.message === 'URL not found') {
      return respondNotFound(error.message);
    }
    return respondError('Internal server error');
  }
}
