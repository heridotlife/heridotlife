import type { APIRoute } from 'astro';
import { getSession } from '../../../../../lib/auth';
import { D1Helper, toBool, toDate } from '../../../../../lib/d1';

export const PATCH: APIRoute = async (context) => {
  try {
    const session = await getSession(context);
    if (!session) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
    }

    const id = context.params.id;
    const urlId = Number(id);

    if (isNaN(urlId)) {
      return new Response(JSON.stringify({ error: 'Invalid URL ID' }), { status: 400 });
    }

    const db = new D1Helper(context.locals.runtime.env.D1_db);
    const updatedUrl = await db.toggleShortUrlActive(urlId);

    if (!updatedUrl) {
      return new Response(JSON.stringify({ error: 'URL not found' }), { status: 404 });
    }

    // Convert SQLite integers to JavaScript types
    const response = {
      ...updatedUrl,
      isActive: toBool(updatedUrl.isActive),
      createdAt: toDate(updatedUrl.createdAt),
      updatedAt: toDate(updatedUrl.updatedAt),
      expiresAt: updatedUrl.expiresAt ? toDate(updatedUrl.expiresAt) : null,
    };

    return new Response(JSON.stringify(response), { status: 200 });
  } catch (error: unknown) {
    console.error('Error toggling URL', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), { status: 500 });
  }
};
