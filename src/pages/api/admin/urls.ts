import type { APIRoute } from 'astro';
import { getSession } from '../../../lib/auth';
import { createCachedD1Helper } from '../../../lib/cached-d1';
import { toBool, toDate } from '../../../lib/d1';
import { createUrlSchema } from '../../../lib/validations';

// GET all URLs
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

    const urls = await db.getAllShortUrls();

    // Get categories for each URL
    const urlsWithCategories = await Promise.all(
      urls.map(async (url) => {
        const categories = await db.getCategoriesForShortUrl(url.id);
        return {
          ...url,
          isActive: toBool(url.isActive),
          createdAt: toDate(url.createdAt),
          updatedAt: toDate(url.updatedAt),
          latestClick: toDate(url.latestClick),
          expiresAt: toDate(url.expiresAt),
          categories: categories.map((c) => ({ id: c.id, name: c.name })),
        };
      })
    );

    return new Response(JSON.stringify(urlsWithCategories), { status: 200 });
  } catch (error: unknown) {
    console.error('Error fetching URLs', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), { status: 500 });
  }
};

// POST create new URL
export const POST: APIRoute = async (context) => {
  try {
    const session = await getSession(context);
    if (!session) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
    }

    const body = await context.request.json();
    const validation = createUrlSchema.safeParse(body);

    if (!validation.success) {
      const errorMessage = validation.error.issues[0]?.message;
      return new Response(
        JSON.stringify({ error: `Invalid input: ${errorMessage || 'Unknown error.'}` }),
        { status: 400 }
      );
    }

    const { slug, originalUrl, title, categoryIds, expiresAt, active } = validation.data;

    // Use cached D1 helper (will auto-invalidate caches on create)
    const db = createCachedD1Helper(
      context.locals.runtime.env.D1_db,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      context.locals.runtime.env.heridotlife_kv as any
    );

    const existing = await db.findShortUrl(slug);

    if (existing) {
      return new Response(JSON.stringify({ error: 'Short URL already exists' }), { status: 409 });
    }

    const url = await db.createShortUrl({
      shortUrl: slug,
      originalUrl,
      title: title || null,
      isActive: active !== undefined ? active : true,
      expiresAt: expiresAt ? new Date(expiresAt) : null,
    });

    // Add categories if provided (will auto-invalidate category caches)
    if (categoryIds && categoryIds.length > 0) {
      await db.setCategoriesForShortUrl(url.id, categoryIds);
    }

    // Get the URL with categories for response
    const categories = await db.getCategoriesForShortUrl(url.id);
    const urlWithCategories = {
      ...url,
      isActive: toBool(url.isActive),
      createdAt: toDate(url.createdAt),
      updatedAt: toDate(url.updatedAt),
      latestClick: toDate(url.latestClick),
      expiresAt: toDate(url.expiresAt),
      categories: categories.map((c) => ({ id: c.id, name: c.name })),
    };

    return new Response(JSON.stringify(urlWithCategories), { status: 201 });
  } catch (error: unknown) {
    console.error('Error creating URL', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), { status: 500 });
  }
};
