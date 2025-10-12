import type { APIRoute } from 'astro';
import { getSession } from '../../../lib/auth';
import { createCategorySchema } from '../../../lib/validations';
import { D1Helper } from '../../../lib/d1';

// GET all categories
export const GET: APIRoute = async (context) => {
  try {
    const session = await getSession(context);
    if (!session) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
    }

    const db = new D1Helper(context.locals.runtime.env.D1_db);
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
      const errorMessage = Object.values(validation.error.flatten().fieldErrors)[0]?.[0];
      return new Response(JSON.stringify({ error: errorMessage || 'Invalid input.' }), {
        status: 400,
      });
    }

    const { name } = validation.data;

    const db = new D1Helper(context.locals.runtime.env.D1_db);
    const category = await db.createCategory(name);

    return new Response(JSON.stringify(category), { status: 201 });
  } catch (error: unknown) {
    console.error('Error creating category', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), { status: 500 });
  }
};
