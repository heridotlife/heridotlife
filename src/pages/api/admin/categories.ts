import type { APIRoute } from 'astro';
import { getSession } from '../../../lib/auth';
import { createCategorySchema } from '../../../lib/validations';
import { createCachedD1Helper } from '../../../lib/cached-d1';

// GET all categories
export const GET: APIRoute = async (context) => {
  try {
    const session = await getSession(context);
    if (!session) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
    }

    // Use cached D1 helper for better performance
    const db = createCachedD1Helper(
      context.locals.runtime.env.D1_db,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      context.locals.runtime.env.heridotlife_kv as any
    );

    const categories = await db.getAllCategories();

    return new Response(JSON.stringify(categories), { status: 200 });
  } catch (error: unknown) {
    console.error('Error fetching categories', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), { status: 500 });
  }
};

// POST create category
export const POST: APIRoute = async (context) => {
  try {
    const session = await getSession(context);
    if (!session) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
    }

    const body = await context.request.json();
    const validation = createCategorySchema.safeParse(body);

    if (!validation.success) {
      const errorMessage = validation.error.issues[0]?.message;
      return new Response(JSON.stringify({ error: errorMessage || 'Invalid input.' }), {
        status: 400,
      });
    }

    const { name } = validation.data;

    // Use cached D1 helper (will auto-invalidate category caches)
    const db = createCachedD1Helper(
      context.locals.runtime.env.D1_db,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      context.locals.runtime.env.heridotlife_kv as any
    );

    const category = await db.createCategory(name);

    return new Response(JSON.stringify(category), { status: 201 });
  } catch (error: unknown) {
    console.error('Error creating category', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), { status: 500 });
  }
};
