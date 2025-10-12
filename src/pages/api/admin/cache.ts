import type { APIRoute } from 'astro';
import { getSession } from '../../../lib/auth';
import { createCachedD1Helper } from '../../../lib/cached-d1';

interface TTLConfig {
  shortTerm: number;
  mediumTerm: number;
  longTerm: number;
  urlLookup: number;
  adminStats: number;
}

// Default TTL values (in seconds)
const DEFAULT_TTL_CONFIG: TTLConfig = {
  shortTerm: 300, // 5 minutes
  mediumTerm: 3600, // 1 hour
  longTerm: 86400, // 24 hours
  urlLookup: 86400, // 24 hours
  adminStats: 1800, // 30 minutes
};

// Store TTL config in KV (with a special key)
const TTL_CONFIG_KEY = 'admin:cache:ttl_config';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function getTTLConfig(kv: any): Promise<TTLConfig> {
  try {
    const cached = await kv.get(TTL_CONFIG_KEY);
    return cached ? JSON.parse(cached) : DEFAULT_TTL_CONFIG;
  } catch (error) {
    console.error('Error getting TTL config:', error);
    return DEFAULT_TTL_CONFIG;
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function setTTLConfig(kv: any, config: TTLConfig): Promise<void> {
  try {
    await kv.put(TTL_CONFIG_KEY, JSON.stringify(config));
  } catch (error) {
    console.error('Error setting TTL config:', error);
    throw error;
  }
}

export const POST: APIRoute = async (context) => {
  try {
    const session = await getSession(context);
    if (!session) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
    }

    const db = createCachedD1Helper(
      context.locals.runtime.env.D1_db,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      context.locals.runtime.env.heridotlife_kv as any
    );

    const requestBody = (await context.request.json()) as { action: string };
    const { action } = requestBody;

    switch (action) {
      case 'clear_all':
        await db.clearAllCaches();
        return new Response(
          JSON.stringify({
            message: 'All caches cleared successfully',
            timestamp: new Date().toISOString(),
          }),
          { status: 200 }
        );

      case 'warm_cache':
        await db.warmCache();
        return new Response(
          JSON.stringify({
            message: 'Cache warming initiated',
            timestamp: new Date().toISOString(),
          }),
          { status: 200 }
        );

      case 'invalidate_urls':
        await db.invalidateUrlCaches();
        return new Response(
          JSON.stringify({
            message: 'URL caches invalidated',
            timestamp: new Date().toISOString(),
          }),
          { status: 200 }
        );

      case 'get_stats': {
        const stats = await db.getCacheStats();
        return new Response(
          JSON.stringify({
            cacheStats: stats,
            timestamp: new Date().toISOString(),
          }),
          { status: 200 }
        );
      }

      case 'get_ttl_config': {
        const ttlConfig = await getTTLConfig(context.locals.runtime.env.heridotlife_kv);
        return new Response(
          JSON.stringify({
            ttlConfig,
            timestamp: new Date().toISOString(),
          }),
          { status: 200 }
        );
      }

      case 'set_ttl_config': {
        const requestWithTTL = requestBody as { action: string; ttlConfig?: TTLConfig };
        const { ttlConfig: newTTLConfig } = requestWithTTL;

        // Validate TTL values
        if (!newTTLConfig || typeof newTTLConfig !== 'object') {
          return new Response(JSON.stringify({ error: 'Invalid TTL configuration' }), {
            status: 400,
          });
        }

        // Validate each TTL value is a positive number
        const requiredKeys: (keyof TTLConfig)[] = [
          'shortTerm',
          'mediumTerm',
          'longTerm',
          'urlLookup',
          'adminStats',
        ];
        for (const key of requiredKeys) {
          if (
            typeof newTTLConfig[key] !== 'number' ||
            newTTLConfig[key] <= 0 ||
            newTTLConfig[key] > 2592000
          ) {
            // Max 30 days
            return new Response(
              JSON.stringify({
                error: `Invalid TTL value for ${key}. Must be a positive number <= 2592000 seconds (30 days)`,
              }),
              { status: 400 }
            );
          }
        }

        await setTTLConfig(context.locals.runtime.env.heridotlife_kv, newTTLConfig);

        // Clear all caches since TTL changed
        await db.clearAllCaches();

        return new Response(
          JSON.stringify({
            message: 'TTL configuration updated successfully. All caches cleared.',
            ttlConfig: newTTLConfig,
            timestamp: new Date().toISOString(),
          }),
          { status: 200 }
        );
      }

      default:
        return new Response(
          JSON.stringify({
            error:
              'Invalid action. Supported actions: clear_all, warm_cache, invalidate_urls, get_stats, get_ttl_config, set_ttl_config',
          }),
          { status: 400 }
        );
    }
  } catch (error: unknown) {
    console.error('Error in cache management:', error);
    return new Response(
      JSON.stringify({
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      }),
      { status: 500 }
    );
  }
};

export const GET: APIRoute = async (context) => {
  try {
    const session = await getSession(context);
    if (!session) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
    }

    const url = new URL(context.request.url);
    const action = url.searchParams.get('action');

    const db = createCachedD1Helper(
      context.locals.runtime.env.D1_db,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      context.locals.runtime.env.heridotlife_kv as any
    );

    if (action === 'get_ttl_config') {
      // Get current TTL configuration
      const ttlConfig = await getTTLConfig(context.locals.runtime.env.heridotlife_kv);

      return new Response(
        JSON.stringify({
          ttlConfig,
          timestamp: new Date().toISOString(),
        }),
        {
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Default: get cache statistics
    const stats = await db.getCacheStats();

    return new Response(
      JSON.stringify({
        cacheStats: stats,
        timestamp: new Date().toISOString(),
        availableActions: ['clear_all', 'warm_cache', 'invalidate_urls', 'get_stats'],
      }),
      {
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Cache GET operation failed:', error);
    return new Response(
      JSON.stringify({
        error: 'Failed to get cache information',
      }),
      { status: 500 }
    );
  }
};
