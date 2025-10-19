import type { APIRoute } from 'astro';
import { getSession } from '../../../../lib/auth';
import type { D1Database } from '@cloudflare/workers-types';
import { updateBlogPostSchema } from '../../../../lib/blog/validations';
import { getPostById, updateBlogPost, deleteBlogPost } from '../../../../lib/blog/api';
import type { UpdateBlogPostInput } from '../../../../lib/blog/types';

/**
 * GET /api/blog/posts/[id]
 * Get a single blog post by ID
 */
export const GET: APIRoute = async (context) => {
  try {
    const session = await getSession(context);
    if (!session) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
    }

    const { id } = context.params;
    if (!id) {
      return new Response(JSON.stringify({ error: 'Post ID is required' }), { status: 400 });
    }

    const postId = parseInt(id, 10);
    if (isNaN(postId)) {
      return new Response(JSON.stringify({ error: 'Invalid post ID' }), { status: 400 });
    }

    const db = context.locals.runtime.env.D1_db as D1Database;
    const post = await getPostById(db, postId);

    if (!post) {
      return new Response(JSON.stringify({ error: 'Post not found' }), { status: 404 });
    }

    return new Response(JSON.stringify(post), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error fetching blog post:', error);
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
 * PUT /api/blog/posts/[id]
 * Update a blog post
 */
export const PUT: APIRoute = async (context) => {
  try {
    const session = await getSession(context);
    if (!session) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
    }

    const { id } = context.params;
    if (!id) {
      return new Response(JSON.stringify({ error: 'Post ID is required' }), { status: 400 });
    }

    const postId = parseInt(id, 10);
    if (isNaN(postId)) {
      return new Response(JSON.stringify({ error: 'Invalid post ID' }), { status: 400 });
    }

    const body = await context.request.json();

    // Validate input
    const validation = updateBlogPostSchema.safeParse(body);
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

    const db = context.locals.runtime.env.D1_db as D1Database;

    // Update the blog post
    const input: UpdateBlogPostInput = validation.data;
    const post = await updateBlogPost(db, postId, input);

    if (!post) {
      return new Response(JSON.stringify({ error: 'Post not found' }), { status: 404 });
    }

    return new Response(JSON.stringify(post), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error updating blog post:', error);

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

/**
 * DELETE /api/blog/posts/[id]
 * Delete a blog post
 */
export const DELETE: APIRoute = async (context) => {
  try {
    const session = await getSession(context);
    if (!session) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
    }

    const { id } = context.params;
    if (!id) {
      return new Response(JSON.stringify({ error: 'Post ID is required' }), { status: 400 });
    }

    const postId = parseInt(id, 10);
    if (isNaN(postId)) {
      return new Response(JSON.stringify({ error: 'Invalid post ID' }), { status: 400 });
    }

    const db = context.locals.runtime.env.D1_db as D1Database;

    // Check if post exists before deleting
    const post = await getPostById(db, postId);
    if (!post) {
      return new Response(JSON.stringify({ error: 'Post not found' }), { status: 404 });
    }

    // Delete the blog post
    await deleteBlogPost(db, postId);

    return new Response(JSON.stringify({ success: true, message: 'Post deleted' }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error deleting blog post:', error);
    return new Response(
      JSON.stringify({
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      }),
      { status: 500 }
    );
  }
};
