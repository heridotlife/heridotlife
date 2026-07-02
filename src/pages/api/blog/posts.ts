import type { APIRoute } from 'astro';
import { getSession } from '../../../lib/auth';
import type { D1Database } from '@cloudflare/workers-types';
import { createBlogPostSchema } from '../../../lib/blog/validations';
import { getAllPublishedPosts, createBlogPost } from '../../../lib/blog/api';
import type { CreateBlogPostInput } from '../../../lib/blog/types';
import { env } from 'cloudflare:workers';

/**
 * GET /api/blog/posts
 * List all blog posts (with optional filters)
 * Query params: status, page, limit, sortBy, sortOrder
 */
export const GET: APIRoute = async (context) => {
  try {
    const session = await getSession(context);
    if (!session) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
    }

    const db = env.D1_db as D1Database;
    const url = new URL(context.request.url);

    // Parse query parameters. This endpoint is admin-only (session-gated
    // above), so the default is 'all' — the admin list must include drafts.
    const status = (url.searchParams.get('status') || 'all') as
      'draft' | 'published' | 'archived' | 'all';
    const page = parseInt(url.searchParams.get('page') || '1', 10);
    const limit = parseInt(url.searchParams.get('limit') || '50', 10);
    const sortBy = (url.searchParams.get('sortBy') || 'createdAt') as
      'publishedAt' | 'viewCount' | 'createdAt';
    const sortOrder = (url.searchParams.get('sortOrder') || 'desc') as 'asc' | 'desc';

    // Fetch posts
    const result = await getAllPublishedPosts(db, {
      status,
      page,
      limit,
      sortBy,
      sortOrder,
    });

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error fetching blog posts:', error);
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
 * POST /api/blog/posts
 * Create a new blog post
 */
export const POST: APIRoute = async (context) => {
  try {
    const session = await getSession(context);
    if (!session) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
    }

    const body = await context.request.json();

    // Validate input
    const validation = createBlogPostSchema.safeParse(body);
    if (!validation.success) {
      const errorMessage = validation.error.issues[0]?.message || 'Invalid input';
      return new Response(
        JSON.stringify({
          error: 'Validation failed',
          message: errorMessage,
          issues: validation.error.issues,
        }),
        { status: 400 }
      );
    }

    const db = env.D1_db as D1Database;

    // Create the blog post. Single-admin site: posts have no author identity
    // (BlogPost.authorId is nullable and unused since migration 005).
    const input: CreateBlogPostInput = validation.data;

    const post = await createBlogPost(db, input);

    return new Response(JSON.stringify(post), {
      status: 201,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error creating blog post:', error);

    if (error instanceof Error && error.message.includes('UNIQUE constraint')) {
      return new Response(
        JSON.stringify({
          error: 'Duplicate slug',
          message: 'A post with this slug already exists',
        }),
        { status: 409 }
      );
    }

    return new Response(
      JSON.stringify({
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      }),
      { status: 500 }
    );
  }
};
