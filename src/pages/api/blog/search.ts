import type { APIRoute } from 'astro';
import type { D1Database, KVNamespace } from '@cloudflare/workers-types';
import { blogSearchSchema } from '../../../lib/blog/validations';
import { createCachedD1Helper } from '../../../lib/cached-d1';
import { env } from 'cloudflare:workers';

/**
 * GET /api/blog/search
 * Public full-text search over published blog posts (FTS5).
 * Query params: q (required), page, limit
 */
export const GET: APIRoute = async (context) => {
  try {
    const url = new URL(context.request.url);
    const validation = blogSearchSchema.safeParse({
      q: url.searchParams.get('q') ?? '',
      page: url.searchParams.get('page') ?? undefined,
      limit: url.searchParams.get('limit') ?? undefined,
    });

    if (!validation.success) {
      const message = validation.error.issues[0]?.message || 'Invalid search query';
      return new Response(JSON.stringify({ error: 'Validation failed', message }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const { q, page, limit } = validation.data;

    const db = createCachedD1Helper(
      env.D1_db as D1Database,
      env.heridotlife_kv as unknown as KVNamespace
    );

    const result = await db.searchPosts({ q, page, limit });

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=300, stale-while-revalidate=300',
      },
    });
  } catch (error) {
    console.error('Error searching blog posts:', error);
    return new Response(
      JSON.stringify({
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
