import type { APIRoute } from 'astro';
import { getSession } from '../../../../lib/auth';
import type { D1Database } from '@cloudflare/workers-types';
import { updateBlogCategory, deleteBlogCategory, getCategoryById } from '../../../../lib/blog/api';
import { updateBlogCategorySchema } from '../../../../lib/blog/validations';
import { env } from 'cloudflare:workers';

function parseId(context: Parameters<APIRoute>[0]): number | null {
  const id = Number(context.params.id);
  return Number.isInteger(id) && id > 0 ? id : null;
}

/**
 * PUT /api/blog/categories/:id
 * Update a blog category
 */
export const PUT: APIRoute = async (context) => {
  try {
    const session = await getSession(context);
    if (!session) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
    }

    const id = parseId(context);
    if (id === null) {
      return new Response(JSON.stringify({ error: 'Invalid category ID' }), { status: 400 });
    }

    const body = await context.request.json();
    const validation = updateBlogCategorySchema.safeParse(body);
    if (!validation.success) {
      const message = validation.error.issues[0]?.message || 'Invalid input';
      return new Response(JSON.stringify({ error: 'Validation failed', message }), { status: 400 });
    }

    const db = env.D1_db as D1Database;
    const existing = await getCategoryById(db, id);
    if (!existing) {
      return new Response(JSON.stringify({ error: 'Category not found' }), { status: 404 });
    }

    const category = await updateBlogCategory(db, id, validation.data);
    return new Response(JSON.stringify(category), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    if (error instanceof Error && error.message.includes('UNIQUE constraint')) {
      return new Response(
        JSON.stringify({
          error: 'Duplicate',
          message: 'A category with this slug or name already exists',
        }),
        { status: 409 }
      );
    }
    console.error('Error updating category:', error);
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
 * DELETE /api/blog/categories/:id
 * Delete a blog category
 */
export const DELETE: APIRoute = async (context) => {
  try {
    const session = await getSession(context);
    if (!session) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
    }

    const id = parseId(context);
    if (id === null) {
      return new Response(JSON.stringify({ error: 'Invalid category ID' }), { status: 400 });
    }

    const db = env.D1_db as D1Database;
    await deleteBlogCategory(db, id);
    return new Response(null, { status: 204 });
  } catch (error) {
    console.error('Error deleting category:', error);
    return new Response(
      JSON.stringify({
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      }),
      { status: 500 }
    );
  }
};
