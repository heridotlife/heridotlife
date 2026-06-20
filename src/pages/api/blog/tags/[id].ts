import type { APIRoute } from 'astro';
import { getSession } from '../../../../lib/auth';
import type { D1Database } from '@cloudflare/workers-types';
import { updateBlogTag, deleteBlogTag, getTagById } from '../../../../lib/blog/api';
import { createBlogTagSchema } from '../../../../lib/blog/validations';
import { env } from 'cloudflare:workers';

const updateBlogTagSchema = createBlogTagSchema.partial();

function parseId(context: Parameters<APIRoute>[0]): number | null {
  const id = Number(context.params.id);
  return Number.isInteger(id) && id > 0 ? id : null;
}

/**
 * PUT /api/blog/tags/:id
 * Update a blog tag
 */
export const PUT: APIRoute = async (context) => {
  try {
    const session = await getSession(context);
    if (!session) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
    }

    const id = parseId(context);
    if (id === null) {
      return new Response(JSON.stringify({ error: 'Invalid tag ID' }), { status: 400 });
    }

    const body = await context.request.json();
    const validation = updateBlogTagSchema.safeParse(body);
    if (!validation.success) {
      const message = validation.error.issues[0]?.message || 'Invalid input';
      return new Response(JSON.stringify({ error: 'Validation failed', message }), { status: 400 });
    }

    const db = env.D1_db as D1Database;
    const existing = await getTagById(db, id);
    if (!existing) {
      return new Response(JSON.stringify({ error: 'Tag not found' }), { status: 404 });
    }

    const tag = await updateBlogTag(db, id, validation.data);
    return new Response(JSON.stringify(tag), {
      status: 200,
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
    console.error('Error updating tag:', error);
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
 * DELETE /api/blog/tags/:id
 * Delete a blog tag
 */
export const DELETE: APIRoute = async (context) => {
  try {
    const session = await getSession(context);
    if (!session) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
    }

    const id = parseId(context);
    if (id === null) {
      return new Response(JSON.stringify({ error: 'Invalid tag ID' }), { status: 400 });
    }

    const db = env.D1_db as D1Database;
    await deleteBlogTag(db, id);
    return new Response(null, { status: 204 });
  } catch (error) {
    console.error('Error deleting tag:', error);
    return new Response(
      JSON.stringify({
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      }),
      { status: 500 }
    );
  }
};
