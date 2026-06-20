import type { APIRoute } from 'astro';
import { getSession } from '../../../lib/auth';
import type { D1Database } from '@cloudflare/workers-types';
import { getAllTags, createBlogTag } from '../../../lib/blog/api';
import { createBlogTagSchema } from '../../../lib/blog/validations';
import { env } from 'cloudflare:workers';

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

    const db = env.D1_db as D1Database;
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

/**
 * POST /api/blog/tags
 * Create a new blog tag
 */
export const POST: APIRoute = async (context) => {
  try {
    const session = await getSession(context);
    if (!session) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
    }

    const body = await context.request.json();
    const validation = createBlogTagSchema.safeParse(body);
    if (!validation.success) {
      const message = validation.error.issues[0]?.message || 'Invalid input';
      return new Response(JSON.stringify({ error: 'Validation failed', message }), { status: 400 });
    }

    const db = env.D1_db as D1Database;
    const tag = await createBlogTag(db, validation.data);

    return new Response(JSON.stringify(tag), {
      status: 201,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    if (error instanceof Error && error.message.includes('UNIQUE constraint')) {
      return new Response(
        JSON.stringify({
          error: 'Duplicate',
          message: 'A tag with this slug or name already exists',
        }),
        { status: 409 }
      );
    }
    console.error('Error creating tag:', error);
    return new Response(
      JSON.stringify({
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      }),
      { status: 500 }
    );
  }
};
