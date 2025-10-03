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

// GET all categories
export async function GET() {
  try {
    const session = await getSession();
    const categories = await getCategoriesLogic(session);
    return respondSuccess(categories);
  } catch (error: unknown) {
    // eslint-disable-next-line no-console
    console.error('Error fetching categories:', error);
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
    return respondSuccess(category, 201);
  } catch (error: unknown) {
    // eslint-disable-next-line no-console
    console.error('Error creating category:', error);
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
