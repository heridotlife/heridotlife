import { NextRequest, NextResponse } from 'next/server';

import {
  deleteUrlLogic,
  getUrlByIdLogic,
  updateUrlLogic,
} from '@/lib/api-handlers/url-by-id';
import {
  respondBadRequest,
  respondConflict,
  respondError,
  respondNotFound,
  respondSuccess,
  respondUnauthorized,
} from '@/lib/api-responses';
import { getSession } from '@/lib/auth';
import logger from '@/lib/logger';

// GET URL by ID
export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    const id = request.nextUrl.searchParams.get('id');
    const urlId = Number(id);
    const url = await getUrlByIdLogic(session, urlId);
    logger(url, `Fetched URL with ID ${urlId}`);
    return respondSuccess(url);
  } catch (error: unknown) {
    const id = request.nextUrl.searchParams.get('id');
    logger(error, `Error fetching URL with ID ${id}`);
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

// PUT update URL
export async function PUT(request: NextRequest) {
  try {
    const session = await getSession();
    const id = request.nextUrl.searchParams.get('id');
    const urlId = Number(id);
    const body = await request.json();
    const url = await updateUrlLogic(session, urlId, body);
    logger(url, `Updated URL with ID ${urlId}`);
    return respondSuccess(url);
  } catch (error: unknown) {
    const id = request.nextUrl.searchParams.get('id');
    logger(error, `Error updating URL with ID ${id}`);
    if (error instanceof Error && error.message === 'Unauthorized') {
      return respondUnauthorized();
    }
    if (error instanceof Error && error.message === 'Invalid URL ID') {
      return respondBadRequest(error.message);
    }
    if (error instanceof Error && error.message.startsWith('Invalid input')) {
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

// DELETE URL
export async function DELETE(request: NextRequest) {
  try {
    const session = await getSession();
    const id = request.nextUrl.searchParams.get('id');
    const urlId = Number(id);
    await deleteUrlLogic(session, urlId);
    logger({ urlId }, `Deleted URL with ID ${urlId}`);
    return new NextResponse(null, { status: 204 });
  } catch (error: unknown) {
    const id = request.nextUrl.searchParams.get('id');
    logger(error, `Error deleting URL with ID ${id}`);
    if (error instanceof Error && error.message === 'Unauthorized') {
      return respondUnauthorized();
    }
    if (error instanceof Error && error.message === 'Invalid URL ID') {
      return respondBadRequest(error.message);
    }
    return respondError('Internal server error');
  }
}
