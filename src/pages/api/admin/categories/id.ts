import type { APIRoute } from 'astro';
import { getSession } from '../../../../lib/auth';
import { D1Helper } from '../../../../lib/d1';
import { z } from 'zod';

const updateCategorySchema = z.object({
  name: z.string().min(1).max(50),
});

// PUT - Update category
export const PUT: APIRoute = async (context) => {
  try {
    const session = await getSession(context);
    if (!session) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
    }

    const url = new URL(context.request.url);
    const id = url.searchParams.get('id');
    const categoryId = Number(id);

    if (isNaN(categoryId)) {
      return new Response(JSON.stringify({ error: 'Invalid category ID' }), { status: 400 });
    }

    const body = await context.request.json();
    const validation = updateCategorySchema.safeParse(body);

    if (!validation.success) {
      const errorMessage = Object.values(validation.error.flatten().fieldErrors)[0]?.[0];
      return new Response(JSON.stringify({ error: `Invalid input: ${errorMessage || 'Unknown error.'}` }), { status: 400 });
    }

    const { name } = validation.data;

    const db = new D1Helper(context.locals.runtime.env.D1_db);

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

    const url = new URL(context.request.url);
    const id = url.searchParams.get('id');
    const categoryId = Number(id);

    if (isNaN(categoryId)) {
      return new Response(JSON.stringify({ error: 'Invalid category ID' }), { status: 400 });
    }

    const db = new D1Helper(context.locals.runtime.env.D1_db);

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