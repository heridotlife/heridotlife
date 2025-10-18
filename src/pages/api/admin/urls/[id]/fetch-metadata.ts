import type { APIRoute } from 'astro';
import { getSession } from '../../../../../lib/auth';
import { createCachedD1Helper } from '../../../../../lib/cached-d1';
import { fetchOGMetadata } from '../../../../../lib/og-fetcher';

/**
 * Fetch OG metadata for a URL and update the database
 * POST /api/admin/urls/:id/fetch-metadata
 */
export const POST: APIRoute = async (context) => {
  try {
    const session = await getSession(context);
    if (!session) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
    }

    const { id } = context.params;
    if (!id) {
      return new Response(JSON.stringify({ error: 'URL ID is required' }), { status: 400 });
    }

    const db = createCachedD1Helper(
      context.locals.runtime.env.D1_db,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      context.locals.runtime.env.heridotlife_kv as any
    );

    // Get the URL
    const url = await db.findShortUrlById(parseInt(id));
    if (!url) {
      return new Response(JSON.stringify({ error: 'URL not found' }), { status: 404 });
    }

    // Fetch OG metadata
    const metadata = await fetchOGMetadata(url.originalUrl);

    // Update the URL with fetched metadata
    const updatedUrl = await db.updateShortUrl(parseInt(id), {
      title: metadata.title || url.title,
      description: metadata.description || undefined,
      ogImage: metadata.ogImage || undefined,
    });

    return new Response(
      JSON.stringify({
        success: true,
        url: updatedUrl,
        metadata,
      }),
      { status: 200 }
    );
  } catch (error: unknown) {
    console.error('Error in fetch-metadata endpoint:', error);
    return new Response(
      JSON.stringify({
        error: 'Internal server error',
        details: String(error),
      }),
      { status: 500 }
    );
  }
};
