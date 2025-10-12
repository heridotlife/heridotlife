import type { APIRoute } from 'astro';
import { getSession } from '../../../lib/auth';
import { createCachedD1Helper } from '../../../lib/cached-d1';

export const POST: APIRoute = async (context) => {
  try {
    const session = await getSession(context);
    if (!session) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
    }

    const db = createCachedD1Helper(
      context.locals.runtime.env.D1_db,
      context.locals.runtime.env.heridotlife_kv as any
    );

    const requestBody = await context.request.json() as { action: string };
    const { action } = requestBody;

    switch (action) {
      case 'clear_all':
        await db.clearAllCaches();
        return new Response(JSON.stringify({ 
          message: 'All caches cleared successfully',
          timestamp: new Date().toISOString()
        }), { status: 200 });

      case 'warm_cache':
        await db.warmCache();
        return new Response(JSON.stringify({ 
          message: 'Cache warming initiated',
          timestamp: new Date().toISOString()
        }), { status: 200 });

      case 'invalidate_urls':
        await db.invalidateUrlCaches();
        return new Response(JSON.stringify({ 
          message: 'URL caches invalidated',
          timestamp: new Date().toISOString()
        }), { status: 200 });

      case 'get_stats':
        const stats = await db.getCacheStats();
        return new Response(JSON.stringify({
          cacheStats: stats,
          timestamp: new Date().toISOString()
        }), { status: 200 });

      default:
        return new Response(JSON.stringify({ 
          error: 'Invalid action. Supported actions: clear_all, warm_cache, invalidate_urls, get_stats' 
        }), { status: 400 });
    }
  } catch (error: unknown) {
    console.error('Error in cache management:', error);
    return new Response(JSON.stringify({ 
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    }), { status: 500 });
  }
};

export const GET: APIRoute = async (context) => {
  try {
    const session = await getSession(context);
    if (!session) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
    }

    const db = createCachedD1Helper(
      context.locals.runtime.env.D1_db,
      context.locals.runtime.env.heridotlife_kv as any
    );

    const stats = await db.getCacheStats();
    
    return new Response(JSON.stringify({
      cacheStats: stats,
      timestamp: new Date().toISOString(),
      availableActions: [
        'clear_all',
        'warm_cache', 
        'invalidate_urls',
        'get_stats'
      ]
    }), { status: 200 });
  } catch (error: unknown) {
    console.error('Error fetching cache stats:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), { status: 500 });
  }
};