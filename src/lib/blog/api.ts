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
  BlogSearchResponse,
  BlogSearchResult,
  CreateBlogCategoryInput,
  UpdateBlogCategoryInput,
  CreateBlogTagInput,
} from './types';
import { buildFtsMatchQuery, buildHighlightedSnippet, tokenizeSearchQuery } from './utils';

/**
 * Get blog posts with pagination and filtering.
 *
 * Without a `status` option this returns published posts only (the public
 * listings). The admin list passes `status` to see drafts/archived posts, or
 * `'all'` for every post regardless of status.
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
    status,
    sortBy = 'publishedAt',
    sortOrder = 'desc',
  } = options;

  const offset = (page - 1) * limit;

  // Build WHERE clause
  let whereClause: string;
  const bindings: (string | number)[] = [];

  if (status === 'all') {
    whereClause = 'WHERE 1 = 1';
  } else if (status) {
    whereClause = 'WHERE bp.status = ?';
    bindings.push(status);
  } else {
    whereClause = 'WHERE bp.isPublished = 1';
  }

  if (categorySlug) {
    whereClause += `
      AND EXISTS (
        SELECT 1
        FROM BlogPostCategory bpc
        INNER JOIN BlogCategory bc ON bpc.categoryId = bc.id
        WHERE bpc.blogPostId = bp.id
        AND bc.slug = ?
      )`;
    bindings.push(categorySlug);
  }

  if (tagSlug) {
    whereClause += `
      AND EXISTS (
        SELECT 1
        FROM BlogPostTag bpt
        INNER JOIN BlogTag bt ON bpt.tagId = bt.id
        WHERE bpt.blogPostId = bp.id
        AND bt.slug = ?
      )`;
    bindings.push(tagSlug);
  }

  // Get total count
  const countQuery = `SELECT COUNT(*) as count FROM BlogPost bp ${whereClause}`;
  const countResult = await db
    .prepare(countQuery)
    .bind(...bindings)
    .first<{ count: number }>();
  const total = countResult?.count || 0;

  // Get posts
  const orderByClause = `ORDER BY bp.${sortBy} ${sortOrder.toUpperCase()}`;
  const postsQuery = `
    SELECT
      bp.id, bp.slug, bp.title, bp.excerpt,
      bp.featuredImage, bp.featuredImageAlt,
      bp.status, bp.isPublished,
      bp.publishedAt, bp.createdAt, bp.readTime, bp.viewCount
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
      .prepare(
        `
        SELECT bc.* FROM BlogCategory bc
        INNER JOIN BlogPostCategory bpc ON bc.id = bpc.categoryId
        WHERE bpc.blogPostId = ?
      `
      )
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
 * Full-text search over published blog posts using the BlogPost_fts FTS5 index.
 *
 * The raw query is tokenized into a safe FTS5 MATCH expression (see
 * {@link buildFtsMatchQuery}), results are ranked by bm25 relevance, and each
 * result gets an HTML-safe highlighted snippet.
 */
export async function searchPosts(
  db: D1Database,
  options: { q: string; page?: number; limit?: number }
): Promise<BlogSearchResponse> {
  const { q, page = 1, limit = 10 } = options;
  const matchQuery = buildFtsMatchQuery(q);
  const terms = tokenizeSearchQuery(q);

  const emptyResponse: BlogSearchResponse = {
    results: [],
    query: q,
    total: 0,
    pagination: {
      page,
      limit,
      total: 0,
      totalPages: 0,
      hasNext: false,
      hasPrev: false,
    },
  };

  // No usable tokens (e.g. query was only punctuation) -> no results.
  if (!matchQuery) return emptyResponse;

  const offset = (page - 1) * limit;

  // Total matching count
  const countResult = await db
    .prepare(
      `SELECT COUNT(*) as count
       FROM BlogPost_fts
       JOIN BlogPost bp ON bp.id = BlogPost_fts.rowid
       WHERE BlogPost_fts MATCH ? AND bp.isPublished = 1`
    )
    .bind(matchQuery)
    .first<{ count: number }>();
  const total = countResult?.count || 0;

  if (total === 0) return emptyResponse;

  // Ranked results (bm25: lower rank = better match)
  const rowsResult = await db
    .prepare(
      `SELECT bp.id, bp.slug, bp.title, bp.excerpt, bp.content, bp.publishedAt,
              bm25(BlogPost_fts) AS rank
       FROM BlogPost_fts
       JOIN BlogPost bp ON bp.id = BlogPost_fts.rowid
       WHERE BlogPost_fts MATCH ? AND bp.isPublished = 1
       ORDER BY rank
       LIMIT ? OFFSET ?`
    )
    .bind(matchQuery, limit, offset)
    .all<{
      id: number;
      slug: string;
      title: string;
      excerpt: string;
      content: string;
      publishedAt: number | null;
      rank: number;
    }>();

  const rows = rowsResult.results || [];

  const results: BlogSearchResult[] = [];
  for (const row of rows) {
    const categoriesResult = await db
      .prepare(
        `SELECT bc.* FROM BlogCategory bc
         INNER JOIN BlogPostCategory bpc ON bc.id = bpc.categoryId
         WHERE bpc.blogPostId = ?`
      )
      .bind(row.id)
      .all<BlogCategory>();

    // Prefer a snippet from the body; fall back to the excerpt.
    const snippet =
      buildHighlightedSnippet(row.content, terms) || buildHighlightedSnippet(row.excerpt, terms);

    results.push({
      id: row.id,
      slug: row.slug,
      title: row.title,
      excerpt: row.excerpt,
      highlightedSnippet: snippet,
      // Expose a positive relevance score (bm25 returns lower-is-better).
      matchScore: -row.rank,
      publishedAt: row.publishedAt ?? undefined,
      categories: categoriesResult.results || [],
    });
  }

  const totalPages = Math.ceil(total / limit);

  return {
    results,
    query: q,
    total,
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
    .prepare(
      `
      SELECT * FROM BlogPost 
      WHERE slug = ? AND isPublished = 1
    `
    )
    .bind(slug)
    .first<BlogPost>();

  if (!post) return null;

  // Convert integer flags to boolean
  post.isPublished = Boolean(post.isPublished);

  // Get categories
  const categoriesResult = await db
    .prepare(
      `
      SELECT bc.* FROM BlogCategory bc
      INNER JOIN BlogPostCategory bpc ON bc.id = bpc.categoryId
      WHERE bpc.blogPostId = ?
    `
    )
    .bind(post.id)
    .all<BlogCategory>();

  post.categories = categoriesResult.results || [];

  // Get tags
  const tagsResult = await db
    .prepare(
      `
      SELECT bt.* FROM BlogTag bt
      INNER JOIN BlogPostTag bpt ON bt.id = bpt.tagId
      WHERE bpt.blogPostId = ?
    `
    )
    .bind(post.id)
    .all<BlogTag>();

  post.tags = tagsResult.results || [];

  return post;
}

/**
 * Get a blog post by ID (admin)
 */
export async function getPostById(db: D1Database, id: number): Promise<BlogPost | null> {
  const post = await db.prepare('SELECT * FROM BlogPost WHERE id = ?').bind(id).first<BlogPost>();

  if (!post) return null;

  post.isPublished = Boolean(post.isPublished);

  // Get categories and tags (same as getPostBySlug)
  const categoriesResult = await db
    .prepare(
      `
      SELECT bc.* FROM BlogCategory bc
      INNER JOIN BlogPostCategory bpc ON bc.id = bpc.categoryId
      WHERE bpc.blogPostId = ?
    `
    )
    .bind(post.id)
    .all<BlogCategory>();

  post.categories = categoriesResult.results || [];

  const tagsResult = await db
    .prepare(
      `
      SELECT bt.* FROM BlogTag bt
      INNER JOIN BlogPostTag bpt ON bt.id = bpt.tagId
      WHERE bpt.blogPostId = ?
    `
    )
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
    .prepare(
      `
      UPDATE BlogPost 
      SET viewCount = viewCount + 1 
      WHERE slug = ? AND isPublished = 1
    `
    )
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
    .prepare(
      `
      INSERT INTO BlogPost (
        slug, title, excerpt, content,
        featuredImage, featuredImageAlt,
        metaTitle, metaDescription, ogImage, keywords,
        status, isPublished, publishedAt, readTime, createdAt
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `
    )
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

  const postId = result.meta.last_row_id;
  if (typeof postId !== 'number' || !postId) {
    throw new Error('Failed to get post ID');
  }

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
      await db.prepare('UPDATE BlogTag SET useCount = useCount + 1 WHERE id = ?').bind(tagId).run();
    }
  }

  const post = await getPostById(db, postId);
  if (!post) {
    throw new Error('Failed to retrieve the newly created blog post');
  }
  return post;
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

  const updatedPost = await getPostById(db, id);
  if (!updatedPost) {
    throw new Error(`Blog post with id ${id} not found after update.`);
  }
  return updatedPost;
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
 * Get a single category by id.
 */
export async function getCategoryById(db: D1Database, id: number): Promise<BlogCategory | null> {
  return await db.prepare('SELECT * FROM BlogCategory WHERE id = ?').bind(id).first<BlogCategory>();
}

/**
 * Create a new blog category.
 */
export async function createBlogCategory(
  db: D1Database,
  input: CreateBlogCategoryInput
): Promise<BlogCategory> {
  const result = await db
    .prepare(
      `INSERT INTO BlogCategory (slug, name, description, icon, color)
       VALUES (?, ?, ?, ?, ?)`
    )
    .bind(
      input.slug,
      input.name,
      input.description || null,
      input.icon || null,
      input.color || null
    )
    .run();

  const id = result.meta.last_row_id;
  if (typeof id !== 'number' || !id) {
    throw new Error('Failed to create category');
  }

  const category = await getCategoryById(db, id);
  if (!category) throw new Error('Failed to retrieve the newly created category');
  return category;
}

/**
 * Update a blog category (partial).
 */
export async function updateBlogCategory(
  db: D1Database,
  id: number,
  input: UpdateBlogCategoryInput
): Promise<BlogCategory> {
  const fields: string[] = [];
  const values: (string | null)[] = [];

  if (input.slug !== undefined) {
    fields.push('slug = ?');
    values.push(input.slug);
  }
  if (input.name !== undefined) {
    fields.push('name = ?');
    values.push(input.name);
  }
  if (input.description !== undefined) {
    fields.push('description = ?');
    values.push(input.description || null);
  }
  if (input.icon !== undefined) {
    fields.push('icon = ?');
    values.push(input.icon || null);
  }
  if (input.color !== undefined) {
    fields.push('color = ?');
    values.push(input.color || null);
  }

  if (fields.length > 0) {
    values.push(String(id));
    await db
      .prepare(`UPDATE BlogCategory SET ${fields.join(', ')} WHERE id = ?`)
      .bind(...values)
      .run();
  }

  const category = await getCategoryById(db, id);
  if (!category) throw new Error(`Category with id ${id} not found after update.`);
  return category;
}

/**
 * Delete a blog category. Junction rows are removed via FK cascade.
 */
export async function deleteBlogCategory(db: D1Database, id: number): Promise<void> {
  await db.prepare('DELETE FROM BlogCategory WHERE id = ?').bind(id).run();
}

/**
 * Get a single tag by id.
 */
export async function getTagById(db: D1Database, id: number): Promise<BlogTag | null> {
  return await db.prepare('SELECT * FROM BlogTag WHERE id = ?').bind(id).first<BlogTag>();
}

/**
 * Create a new blog tag.
 */
export async function createBlogTag(db: D1Database, input: CreateBlogTagInput): Promise<BlogTag> {
  const result = await db
    .prepare('INSERT INTO BlogTag (slug, name) VALUES (?, ?)')
    .bind(input.slug, input.name)
    .run();

  const id = result.meta.last_row_id;
  if (typeof id !== 'number' || !id) {
    throw new Error('Failed to create tag');
  }

  const tag = await getTagById(db, id);
  if (!tag) throw new Error('Failed to retrieve the newly created tag');
  return tag;
}

/**
 * Update a blog tag (slug/name).
 */
export async function updateBlogTag(
  db: D1Database,
  id: number,
  input: { slug?: string; name?: string }
): Promise<BlogTag> {
  const fields: string[] = [];
  const values: string[] = [];

  if (input.slug !== undefined) {
    fields.push('slug = ?');
    values.push(input.slug);
  }
  if (input.name !== undefined) {
    fields.push('name = ?');
    values.push(input.name);
  }

  if (fields.length > 0) {
    values.push(String(id));
    await db
      .prepare(`UPDATE BlogTag SET ${fields.join(', ')} WHERE id = ?`)
      .bind(...values)
      .run();
  }

  const tag = await getTagById(db, id);
  if (!tag) throw new Error(`Tag with id ${id} not found after update.`);
  return tag;
}

/**
 * Delete a blog tag. Junction rows are removed via FK cascade.
 */
export async function deleteBlogTag(db: D1Database, id: number): Promise<void> {
  await db.prepare('DELETE FROM BlogTag WHERE id = ?').bind(id).run();
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
    .prepare(
      'SELECT id, title, slug, viewCount as views FROM BlogPost ORDER BY viewCount DESC LIMIT 5'
    )
    .all<{ id: number; title: string; slug: string; views: number }>();
  const topPosts =
    topPostsResult.results?.map((p) => ({
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
    .all<{ id: number; title: string; slug: string; status: string; updatedAt: number }>();
  const recentPosts =
    recentPostsResult.results?.map((p) => ({
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
