import type { APIRoute } from 'astro';
import { getSession } from '../../../lib/auth';
import { D1Helper, toDate } from '../../../lib/d1';

export const GET: APIRoute = async (context) => {
  try {
    const session = await getSession(context);
    if (!session) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
    }

    const db = new D1Helper(context.locals.runtime.env.D1_db);
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
