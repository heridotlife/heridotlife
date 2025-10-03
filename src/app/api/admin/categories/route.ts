import {
  createCategoryLogic,
  getCategoriesLogic,
} from '@/lib/api-handlers/categories';
import {
  respondBadRequest,
  respondError,
  respondSuccess,
  respondUnauthorized,
} from '@/lib/api-responses';
import { getSession } from '@/lib/auth';
import logger from '@/lib/logger';

// GET all categories
export async function GET() {
  try {
    const session = await getSession();
    const categories = await getCategoriesLogic(session);
    logger(categories, 'Fetched all categories');
    return respondSuccess(categories);
  } catch (error: unknown) {
    logger(error, 'Error fetching categories');
    if (error instanceof Error && error.message === 'Unauthorized') {
      return respondUnauthorized();
    }
    return respondError('Internal server error');
  }
}

// POST create category
export async function POST(request: Request) {
  try {
    const session = await getSession();
    const body = await request.json();
    const category = await createCategoryLogic(session, body);
    logger(category, 'Created new category');
    return respondSuccess(category, 201);
  } catch (error: unknown) {
    logger(error, 'Error creating category');
    if (error instanceof Error && error.message === 'Unauthorized') {
      return respondUnauthorized();
    }
    if (error instanceof Error && error.message.startsWith('Invalid input')) {
      // Catch Zod validation errors
      return respondBadRequest(error.message);
    }
    return respondError('Internal server error');
  }
}
