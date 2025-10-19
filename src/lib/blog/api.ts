/**
 * Blog API functions for database operations
 * @module lib/blog/api
 */

import type { D1Database } from '@cloudflare/workers-types';
import type {
  BlogPost,
  BlogPostListItem,
  BlogListResponse,
  BlogCategory,
  BlogTag,
  BlogQueryOptions,
  CreateBlogPostInput,
  UpdateBlogPostInput,
  BlogStats,
} from './types';

/**
 * Get all published blog posts with pagination and filtering
 */
export async function getAllPublishedPosts(
  db: D1Database,
  options: BlogQueryOptions = {}
): Promise<BlogListResponse> {
  const {
    page = 1,
    limit = 10,
    categorySlug,
    tagSlug,
    sortBy = 'publishedAt',
    sortOrder = 'desc',
  } = options;

  const offset = (page - 1) * limit;

  // Build WHERE clause
  let whereClause = 'WHERE bp.isPublished = 1';
  const bindings: (string | number)[] = [];

  if (categorySlug) {
    whereClause += ' AND EXISTS (SELECT 1 FROM BlogPostCategory bpc INNER JOIN BlogCategory bc ON bpc.categoryId = bc.id WHERE bpc.blogPostId = bp.id AND bc.slug = ?)';
    bindings.push(categorySlug);
  }

  if (tagSlug) {
    whereClause += ' AND EXISTS (SELECT 1 FROM BlogPostTag bpt INNER JOIN BlogTag bt ON bpt.tagId = bt.id WHERE bpt.blogPostId = bp.id AND bt.slug = ?)';
    bindings.push(tagSlug);
  }

  // Get total count
  const countQuery = `SELECT COUNT(*) as count FROM BlogPost bp ${whereClause}`;
  const countResult = await db.prepare(countQuery).bind(...bindings).first<{ count: number }>();
  const total = countResult?.count || 0;

  // Get posts
  const orderByClause = `ORDER BY bp.${sortBy} ${sortOrder.toUpperCase()}`;
  const postsQuery = `
    SELECT 
      bp.id, bp.slug, bp.title, bp.excerpt,
      bp.featuredImage, bp.featuredImageAlt,
      bp.publishedAt, bp.readTime, bp.viewCount
    FROM BlogPost bp
    ${whereClause}
    ${orderByClause}
    LIMIT ? OFFSET ?
  `;

  const postsResult = await db
    .prepare(postsQuery)
    .bind(...bindings, limit, offset)
    .all<BlogPostListItem>();

  const posts = postsResult.results || [];

  // Fetch categories for each post
  for (const post of posts) {
    const categoriesResult = await db
      .prepare(`
        SELECT bc.* FROM BlogCategory bc
        INNER JOIN BlogPostCategory bpc ON bc.id = bpc.categoryId
        WHERE bpc.blogPostId = ?
      `)
      .bind(post.id)
      .all<BlogCategory>();

    post.categories = categoriesResult.results || [];
  }

  const totalPages = Math.ceil(total / limit);

  return {
    posts,
    pagination: {
      page,
      limit,
      total,
      totalPages,
      hasNext: page < totalPages,
      hasPrev: page > 1,
    },
  };
}

/**
 * Get a single blog post by slug
 */
export async function getPostBySlug(db: D1Database, slug: string): Promise<BlogPost | null> {
  const post = await db
    .prepare(`
      SELECT * FROM BlogPost 
      WHERE slug = ? AND isPublished = 1
    `)
    .bind(slug)
    .first<BlogPost>();

  if (!post) return null;

  // Convert integer flags to boolean
  post.isPublished = Boolean(post.isPublished);

  // Get categories
  const categoriesResult = await db
    .prepare(`
      SELECT bc.* FROM BlogCategory bc
      INNER JOIN BlogPostCategory bpc ON bc.id = bpc.categoryId
      WHERE bpc.blogPostId = ?
    `)
    .bind(post.id)
    .all<BlogCategory>();

  post.categories = categoriesResult.results || [];

  // Get tags
  const tagsResult = await db
    .prepare(`
      SELECT bt.* FROM BlogTag bt
      INNER JOIN BlogPostTag bpt ON bt.id = bpt.tagId
      WHERE bpt.blogPostId = ?
    `)
    .bind(post.id)
    .all<BlogTag>();

  post.tags = tagsResult.results || [];

  return post;
}

/**
 * Get a blog post by ID (admin)
 */
export async function getPostById(db: D1Database, id: number): Promise<BlogPost | null> {
  const post = await db
    .prepare('SELECT * FROM BlogPost WHERE id = ?')
    .bind(id)
    .first<BlogPost>();

  if (!post) return null;

  post.isPublished = Boolean(post.isPublished);

  // Get categories and tags (same as getPostBySlug)
  const categoriesResult = await db
    .prepare(`
      SELECT bc.* FROM BlogCategory bc
      INNER JOIN BlogPostCategory bpc ON bc.id = bpc.categoryId
      WHERE bpc.blogPostId = ?
    `)
    .bind(post.id)
    .all<BlogCategory>();

  post.categories = categoriesResult.results || [];

  const tagsResult = await db
    .prepare(`
      SELECT bt.* FROM BlogTag bt
      INNER JOIN BlogPostTag bpt ON bt.id = bpt.tagId
      WHERE bpt.blogPostId = ?
    `)
    .bind(post.id)
    .all<BlogTag>();

  post.tags = tagsResult.results || [];

  return post;
}

/**
 * Increment view count for a post
 */
export async function incrementViewCount(db: D1Database, slug: string): Promise<void> {
  await db
    .prepare(`
      UPDATE BlogPost 
      SET viewCount = viewCount + 1 
      WHERE slug = ? AND isPublished = 1
    `)
    .bind(slug)
    .run();
}

/**
 * Create a new blog post
 */
export async function createBlogPost(
  db: D1Database,
  input: CreateBlogPostInput
): Promise<BlogPost> {
  const now = Math.floor(Date.now() / 1000);

  const result = await db
    .prepare(`
      INSERT INTO BlogPost (
        slug, title, excerpt, content,
        featuredImage, featuredImageAlt,
        metaTitle, metaDescription, ogImage, keywords,
        status, isPublished, publishedAt, readTime, createdAt
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `)
    .bind(
      input.slug,
      input.title,
      input.excerpt,
      input.content,
      input.featuredImage || null,
      input.featuredImageAlt || null,
      input.metaTitle || null,
      input.metaDescription || null,
      input.ogImage || null,
      input.keywords || null,
      input.status || 'draft',
      input.isPublished ? 1 : 0,
      input.publishedAt || null,
      input.readTime || null,
      now
    )
    .run();

  const postId = result.meta.last_row_id as number;

  // Link categories
  if (input.categoryIds && input.categoryIds.length > 0) {
    for (const categoryId of input.categoryIds) {
      await db
        .prepare('INSERT INTO BlogPostCategory (blogPostId, categoryId) VALUES (?, ?)')
        .bind(postId, categoryId)
        .run();

      // Increment category post count
      await db
        .prepare('UPDATE BlogCategory SET postCount = postCount + 1 WHERE id = ?')
        .bind(categoryId)
        .run();
    }
  }

  // Link tags
  if (input.tagIds && input.tagIds.length > 0) {
    for (const tagId of input.tagIds) {
      await db
        .prepare('INSERT INTO BlogPostTag (blogPostId, tagId) VALUES (?, ?)')
        .bind(postId, tagId)
        .run();

      // Increment tag use count
      await db
        .prepare('UPDATE BlogTag SET useCount = useCount + 1 WHERE id = ?')
        .bind(tagId)
        .run();
    }
  }

  return (await getPostById(db, postId))!;
}

/**
 * Update a blog post
 */
export async function updateBlogPost(
  db: D1Database,
  id: number,
  input: UpdateBlogPostInput
): Promise<BlogPost> {
  const fields: string[] = [];
  const values: (string | number | null)[] = [];

  // Build dynamic UPDATE query
  if (input.slug !== undefined) {
    fields.push('slug = ?');
    values.push(input.slug);
  }
  if (input.title !== undefined) {
    fields.push('title = ?');
    values.push(input.title);
  }
  if (input.excerpt !== undefined) {
    fields.push('excerpt = ?');
    values.push(input.excerpt);
  }
  if (input.content !== undefined) {
    fields.push('content = ?');
    values.push(input.content);
  }
  if (input.featuredImage !== undefined) {
    fields.push('featuredImage = ?');
    values.push(input.featuredImage || null);
  }
  if (input.featuredImageAlt !== undefined) {
    fields.push('featuredImageAlt = ?');
    values.push(input.featuredImageAlt || null);
  }
  if (input.status !== undefined) {
    fields.push('status = ?');
    values.push(input.status);
  }
  if (input.isPublished !== undefined) {
    fields.push('isPublished = ?');
    values.push(input.isPublished ? 1 : 0);
  }
  if (input.publishedAt !== undefined) {
    fields.push('publishedAt = ?');
    values.push(input.publishedAt || null);
  }

  if (fields.length > 0) {
    values.push(id);
    await db
      .prepare(`UPDATE BlogPost SET ${fields.join(', ')} WHERE id = ?`)
      .bind(...values)
      .run();
  }

  // Update categories if provided
  if (input.categoryIds !== undefined) {
    // Remove existing categories
    await db.prepare('DELETE FROM BlogPostCategory WHERE blogPostId = ?').bind(id).run();

    // Add new categories
    for (const categoryId of input.categoryIds) {
      await db
        .prepare('INSERT INTO BlogPostCategory (blogPostId, categoryId) VALUES (?, ?)')
        .bind(id, categoryId)
        .run();
    }
  }

  // Update tags if provided
  if (input.tagIds !== undefined) {
    // Remove existing tags
    await db.prepare('DELETE FROM BlogPostTag WHERE blogPostId = ?').bind(id).run();

    // Add new tags
    for (const tagId of input.tagIds) {
      await db
        .prepare('INSERT INTO BlogPostTag (blogPostId, tagId) VALUES (?, ?)')
        .bind(id, tagId)
        .run();
    }
  }

  return (await getPostById(db, id))!;
}

/**
 * Delete a blog post
 */
export async function deleteBlogPost(db: D1Database, id: number): Promise<void> {
  await db.prepare('DELETE FROM BlogPost WHERE id = ?').bind(id).run();
}

/**
 * Get all categories
 */
export async function getAllCategories(db: D1Database): Promise<BlogCategory[]> {
  const result = await db
    .prepare('SELECT * FROM BlogCategory ORDER BY postCount DESC, name ASC')
    .all<BlogCategory>();

  return result.results || [];
}

/**
 * Get all tags
 */
export async function getAllTags(db: D1Database): Promise<BlogTag[]> {
  const result = await db
    .prepare('SELECT * FROM BlogTag ORDER BY useCount DESC, name ASC')
    .all<BlogTag>();

  return result.results || [];
}

/**
 * Get blog statistics for admin dashboard
 */
export async function getBlogStats(db: D1Database): Promise<BlogStats> {
  // Total posts
  const totalPostsResult = await db
    .prepare('SELECT COUNT(*) as count FROM BlogPost')
    .first<{ count: number }>();
  const totalPosts = totalPostsResult?.count || 0;

  // Published posts
  const publishedResult = await db
    .prepare('SELECT COUNT(*) as count FROM BlogPost WHERE isPublished = 1')
    .first<{ count: number }>();
  const publishedPosts = publishedResult?.count || 0;

  // Draft posts
  const draftResult = await db
    .prepare('SELECT COUNT(*) as count FROM BlogPost WHERE status = ?')
    .bind('draft')
    .first<{ count: number }>();
  const draftPosts = draftResult?.count || 0;

  // Total views
  const viewsResult = await db
    .prepare('SELECT SUM(viewCount) as total FROM BlogPost')
    .first<{ total: number }>();
  const totalViews = viewsResult?.total || 0;

  // Categories count
  const categoriesResult = await db
    .prepare('SELECT COUNT(*) as count FROM BlogCategory')
    .first<{ count: number }>();
  const totalCategories = categoriesResult?.count || 0;

  // Tags count
  const tagsResult = await db
    .prepare('SELECT COUNT(*) as count FROM BlogTag')
    .first<{ count: number }>();
  const totalTags = tagsResult?.count || 0;

  // Top posts by views
  const topPostsResult = await db
    .prepare('SELECT id, title, slug, viewCount as views FROM BlogPost ORDER BY viewCount DESC LIMIT 5')
    .all();
  const topPosts =
    topPostsResult.results?.map((p: any) => ({
      id: p.id,
      title: p.title,
      slug: p.slug,
      views: p.views,
    })) || [];

  // Recent posts
  const recentPostsResult = await db
    .prepare(
      'SELECT id, title, slug, status, updatedAt FROM BlogPost ORDER BY updatedAt DESC LIMIT 5'
    )
    .all();
  const recentPosts =
    recentPostsResult.results?.map((p: any) => ({
      id: p.id,
      title: p.title,
      slug: p.slug,
      status: p.status,
      updatedAt: p.updatedAt,
    })) || [];

  return {
    totalPosts,
    publishedPosts,
    draftPosts,
    totalViews,
    totalCategories,
    totalTags,
    topPosts,
    recentPosts,
  };
}
