import type { APIRoute } from 'astro';
import { getSession } from '../../../lib/auth';
import { createCachedD1Helper } from '../../../lib/cached-d1';
import { toDate } from '../../../lib/d1';

export const GET: APIRoute = async (context) => {
  try {
    const session = await getSession(context);
    if (!session) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
    }

    // Use cached D1 helper for better performance
    const db = createCachedD1Helper(
      context.locals.runtime.env.D1_db,
      context.locals.runtime.env.heridotlife_kv as any
    );

    // Get stats (now cached for 30 minutes)
    const stats = await db.getStats();

    // Convert timestamps to Date objects for recentClicks
    const statsWithDates = {
      ...stats,
      recentClicks: stats.recentClicks.map((click) => ({
        ...click,
        latestClick: click.latestClick ? toDate(click.latestClick) : null,
      })),
    };

    return new Response(JSON.stringify(statsWithDates), { status: 200 });
  } catch (error: unknown) {
    console.error('Error fetching admin stats', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), { status: 500 });
  }
};
