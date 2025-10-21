import type { APIRoute } from 'astro';
import { getSession } from '../../../lib/auth';
import type { D1Database } from '@cloudflare/workers-types';
import { getAllCategories } from '../../../lib/blog/api';

/**
 * GET /api/blog/categories
 * Get all blog categories
 */
export const GET: APIRoute = async (context) => {
  try {
    const session = await getSession(context);
    if (!session) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
    }

    const db = context.locals.runtime.env.D1_db as D1Database;
    const categories = await getAllCategories(db);

    return new Response(JSON.stringify(categories), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error fetching categories:', error);
    return new Response(
      JSON.stringify({
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      }),
      { status: 500 }
    );
  }
};
