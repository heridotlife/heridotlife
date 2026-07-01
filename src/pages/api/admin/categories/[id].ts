import type { APIRoute } from 'astro';
import { getSession } from '../../../../lib/auth';
import { createCachedD1Helper } from '../../../../lib/cached-d1';
import { updateCategorySchema } from '../../../../lib/validations';
import { env } from 'cloudflare:workers';

// PUT - Update category
export const PUT: APIRoute = async (context) => {
  try {
    const session = await getSession(context);
    if (!session) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
    }

    const categoryId = Number(context.params.id);

    if (isNaN(categoryId)) {
      return new Response(JSON.stringify({ error: 'Invalid category ID' }), { status: 400 });
    }

    const body = await context.request.json();
    const validation = updateCategorySchema.safeParse(body);

    if (!validation.success) {
      const errorMessage = validation.error.issues[0]?.message;
      return new Response(
        JSON.stringify({ error: `Invalid input: ${errorMessage || 'Unknown error.'}` }),
        { status: 400 }
      );
    }

    const { name } = validation.data;

    const db = createCachedD1Helper(
      env.D1_db,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      env.heridotlife_kv as any
    );

    try {
      const updated = await db.updateCategory(categoryId, name);

      if (!updated) {
        return new Response(JSON.stringify({ error: 'Category not found' }), { status: 404 });
      }

      return new Response(JSON.stringify(updated), { status: 200 });
    } catch (err) {
      if (err instanceof Error && err.message === 'Category name already exists') {
        return new Response(JSON.stringify({ error: err.message }), { status: 409 });
      }
      throw err;
    }
  } catch (error: unknown) {
    console.error('Error updating category', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), { status: 500 });
  }
};

// DELETE - Delete category
export const DELETE: APIRoute = async (context) => {
  try {
    const session = await getSession(context);
    if (!session) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
    }

    const categoryId = Number(context.params.id);

    if (isNaN(categoryId)) {
      return new Response(JSON.stringify({ error: 'Invalid category ID' }), { status: 400 });
    }

    const db = createCachedD1Helper(
      env.D1_db,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      env.heridotlife_kv as any
    );

    try {
      await db.deleteCategory(categoryId);
      return new Response(null, { status: 204 });
    } catch (err) {
      if (err instanceof Error && err.message === 'Category not found') {
        return new Response(JSON.stringify({ error: err.message }), { status: 404 });
      }
      throw err;
    }
  } catch (error: unknown) {
    console.error('Error deleting category', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), { status: 500 });
  }
};
