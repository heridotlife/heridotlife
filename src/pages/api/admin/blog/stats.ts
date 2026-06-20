import type { APIRoute } from 'astro';
import { getSession } from '../../../../lib/auth';
import type { D1Database } from '@cloudflare/workers-types';
import { getBlogStats } from '../../../../lib/blog/api';
import { env } from 'cloudflare:workers';

/**
 * GET /api/admin/blog/stats
 * Aggregate blog statistics for the admin dashboard.
 */
export const GET: APIRoute = async (context) => {
  try {
    const session = await getSession(context);
    if (!session) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
    }

    const db = env.D1_db as D1Database;
    const stats = await getBlogStats(db);

    return new Response(JSON.stringify(stats), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error fetching blog stats:', error);
    return new Response(
      JSON.stringify({
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      }),
      { status: 500 }
    );
  }
};
