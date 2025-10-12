import type { APIRoute } from 'astro';
import { getSession } from '../../../../lib/auth';
import { updateUrlSchema } from '../../../../lib/validations';
import { D1Helper, toBool, toDate } from '../../../../lib/d1';

// GET URL by ID
export const GET: APIRoute = async (context) => {
  try {
    const session = await getSession(context);
    if (!session) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
    }

    const url = new URL(context.request.url);
    const id = url.searchParams.get('id');
    const urlId = Number(id);

    if (isNaN(urlId)) {
      return new Response(JSON.stringify({ error: 'Invalid URL ID' }), { status: 400 });
    }

    const db = new D1Helper(context.locals.runtime.env.D1_db);
    const urlData = await db.findShortUrlById(urlId);

    if (!urlData) {
      return new Response(JSON.stringify({ error: 'URL not found' }), { status: 404 });
    }

    // Fetch categories for this URL
    const categories = await db.getCategoriesForShortUrl(urlId);

    // Convert SQLite integers to JavaScript types
    const response = {
      ...urlData,
      isActive: toBool(urlData.isActive),
      createdAt: toDate(urlData.createdAt),
      updatedAt: toDate(urlData.updatedAt),
      expiresAt: urlData.expiresAt ? toDate(urlData.expiresAt) : null,
      categories,
    };

    return new Response(JSON.stringify(response), { status: 200 });
  } catch (error: unknown) {
    console.error('Error fetching URL by ID', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), { status: 500 });
  }
};

// PUT update URL
export const PUT: APIRoute = async (context) => {
  try {
    const session = await getSession(context);
    if (!session) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
    }

    const reqUrl = new URL(context.request.url);
    const id = reqUrl.searchParams.get('id');
    const urlId = Number(id);

    if (isNaN(urlId)) {
      return new Response(JSON.stringify({ error: 'Invalid URL ID' }), { status: 400 });
    }

    const body = await context.request.json();
    const validation = updateUrlSchema.safeParse(body);

    if (!validation.success) {
      const errorMessage = validation.error.issues[0]?.message;
      return new Response(
        JSON.stringify({ error: `Invalid input: ${errorMessage || 'Unknown error.'}` }),
        { status: 400 }
      );
    }

    const { slug, originalUrl, title, categoryIds, expiresAt } = validation.data;

    const db = new D1Helper(context.locals.runtime.env.D1_db);

    // Check if slug already exists (excluding current URL)
    const existingSlug = await db.findShortUrl(slug);
    if (existingSlug && existingSlug.id !== urlId) {
      return new Response(JSON.stringify({ error: 'Short URL already exists' }), { status: 409 });
    }

    // Update the URL
    const updatedUrl = await db.updateShortUrl(urlId, {
      shortUrl: slug,
      originalUrl,
      title: title || null,
      expiresAt: expiresAt ? new Date(expiresAt) : null,
    });

    // Update categories if provided
    if (categoryIds) {
      await db.setCategoriesForShortUrl(urlId, categoryIds);
    }

    // Fetch updated categories
    const categories = await db.getCategoriesForShortUrl(urlId);

    // Convert SQLite integers to JavaScript types
    const response = {
      ...updatedUrl,
      isActive: toBool(updatedUrl.isActive),
      createdAt: toDate(updatedUrl.createdAt),
      updatedAt: toDate(updatedUrl.updatedAt),
      expiresAt: updatedUrl.expiresAt ? toDate(updatedUrl.expiresAt) : null,
      categories,
    };

    return new Response(JSON.stringify(response), { status: 200 });
  } catch (error: unknown) {
    console.error('Error updating URL', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), { status: 500 });
  }
};

// DELETE URL
export const DELETE: APIRoute = async (context) => {
  try {
    const session = await getSession(context);
    if (!session) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
    }

    const url = new URL(context.request.url);
    const id = url.searchParams.get('id');
    const urlId = Number(id);

    if (isNaN(urlId)) {
      return new Response(JSON.stringify({ error: 'Invalid URL ID' }), { status: 400 });
    }

    const db = new D1Helper(context.locals.runtime.env.D1_db);
    await db.deleteShortUrl(urlId);

    return new Response(null, { status: 204 });
  } catch (error: unknown) {
    console.error('Error deleting URL', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), { status: 500 });
  }
};
