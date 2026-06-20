import type { APIRoute } from 'astro';
import { getSession } from '../../../lib/auth';
import type { D1Database } from '@cloudflare/workers-types';
import { getAllCategories, createBlogCategory } from '../../../lib/blog/api';
import { createBlogCategorySchema } from '../../../lib/blog/validations';
import { env } from 'cloudflare:workers';

/**
 * GET /api/blog/categories
 * Get all blog categories
 */
export const GET: APIRoute = async (context) => {
  try {
    const session = await getSession(context);
    if (!session) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
    }

    const db = env.D1_db as D1Database;
    const categories = await getAllCategories(db);

    return new Response(JSON.stringify(categories), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error fetching categories:', error);
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
 * POST /api/blog/categories
 * Create a new blog category
 */
export const POST: APIRoute = async (context) => {
  try {
    const session = await getSession(context);
    if (!session) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
    }

    const body = await context.request.json();
    const validation = createBlogCategorySchema.safeParse(body);
    if (!validation.success) {
      const message = validation.error.issues[0]?.message || 'Invalid input';
      return new Response(JSON.stringify({ error: 'Validation failed', message }), { status: 400 });
    }

    const db = env.D1_db as D1Database;
    const category = await createBlogCategory(db, validation.data);

    return new Response(JSON.stringify(category), {
      status: 201,
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
    console.error('Error creating category:', error);
    return new Response(
      JSON.stringify({
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      }),
      { status: 500 }
    );
  }
};
