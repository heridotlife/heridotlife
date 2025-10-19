import type { APIRoute } from 'astro';
import { getSession } from '../../../lib/auth';
import type { D1Database } from '@cloudflare/workers-types';
import { getAllTags } from '../../../lib/blog/api';

/**
 * GET /api/blog/tags
 * Get all blog tags
 */
export const GET: APIRoute = async (context) => {
  try {
    const session = await getSession(context);
    if (!session) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
    }

    const db = context.locals.runtime.env.D1_db as D1Database;
    const tags = await getAllTags(db);

    return new Response(JSON.stringify(tags), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error fetching tags:', error);
    return new Response(
      JSON.stringify({
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      }),
      { status: 500 }
    );
  }
};
