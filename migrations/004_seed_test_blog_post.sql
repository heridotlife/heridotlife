-- Test Blog Post Data
-- Run: npx wrangler d1 execute heridotlife --local --file=migrations/004_seed_test_blog_post.sql

-- Insert a test blog post
INSERT INTO BlogPost (
  slug,
  title,
  excerpt,
  content,
  featuredImage,
  featuredImageAlt,
  metaTitle,
  metaDescription,
  ogImage,
  keywords,
  status,
  isPublished,
  publishedAt,
  readTime,
  viewCount,
  createdAt,
  updatedAt
) VALUES (
  'welcome-to-my-blog',
  'Welcome to My Blog - Testing the New Blog Feature',
  'This is a comprehensive test post to verify all blog features are working correctly, including admin CRUD operations, public display, category filtering, and tag functionality.',
  '<h1>Welcome to My Blog!</h1>

<p>This is a test post to verify that our blog feature is working correctly. Let me walk you through what we''re testing:</p>

<h2>Features Being Tested</h2>

<ul>
  <li><strong>Admin CRUD Operations</strong> - Create, read, update, delete posts</li>
  <li><strong>Public Display</strong> - Blog listing and individual post pages</li>
  <li><strong>Category Filtering</strong> - Filter posts by category</li>
  <li><strong>Tag System</strong> - Organize posts with tags</li>
  <li><strong>SEO Optimization</strong> - Meta tags and Open Graph data</li>
  <li><strong>View Counter</strong> - Track post views</li>
  <li><strong>Reading Time</strong> - Estimated reading time calculation</li>
</ul>

<h2>Technical Stack</h2>

<p>This blog is built with modern web technologies:</p>

<pre><code>- Astro 5.14.4 (SSR with Cloudflare adapter)
- React 19 (Admin UI components)
- Cloudflare D1 (SQLite at the edge)
- Cloudflare KV (Caching layer)
- TypeScript (Type safety)
- Tailwind CSS (Styling)
</code></pre>

<h2>Content Management</h2>

<p>The admin interface provides a complete content management system with:</p>

<ol>
  <li><strong>Rich Content Editor</strong> - Write posts with HTML or Markdown</li>
  <li><strong>Auto-Slug Generation</strong> - SEO-friendly URLs from titles</li>
  <li><strong>Character Counters</strong> - Live validation for optimal content length</li>
  <li><strong>Reading Time Calculator</strong> - Automatic estimation based on word count</li>
  <li><strong>Multi-Category Support</strong> - Up to 5 categories per post</li>
  <li><strong>Tag Management</strong> - Up to 10 tags per post</li>
  <li><strong>Draft/Publish Status</strong> - Control post visibility</li>
</ol>

<h2>Performance Features</h2>

<blockquote>
  <p>"Performance is not just about speed, it''s about user experience."</p>
</blockquote>

<p>Our blog includes several performance optimizations:</p>

<ul>
  <li>Multi-layer caching with Cloudflare KV</li>
  <li>Database query optimization with indexes</li>
  <li>Full-text search with FTS5</li>
  <li>Edge-rendered pages for global distribution</li>
  <li>Efficient pagination for large datasets</li>
</ul>

<h2>Security Measures</h2>

<p>Security is built into every layer:</p>

<table>
  <thead>
    <tr>
      <th>Feature</th>
      <th>Implementation</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td>Input Validation</td>
      <td>Zod schemas with safeParse()</td>
    </tr>
    <tr>
      <td>XSS Prevention</td>
      <td>Content sanitization and validation</td>
    </tr>
    <tr>
      <td>SQL Injection</td>
      <td>Parameterized queries only</td>
    </tr>
    <tr>
      <td>Authentication</td>
      <td>Session-based with JWT</td>
    </tr>
    <tr>
      <td>Rate Limiting</td>
      <td>KV-based request throttling</td>
    </tr>
  </tbody>
</table>

<h2>Next Steps</h2>

<p>If you''re seeing this post, congratulations! The blog feature is working. Here''s what you can do next:</p>

<ol>
  <li>Edit this post from the admin panel</li>
  <li>Create new posts with your own content</li>
  <li>Test category and tag filtering</li>
  <li>Try the search functionality</li>
  <li>Deploy to production when ready</li>
</ol>

<h2>Code Example</h2>

<p>Here''s how easy it is to create a blog post via the API:</p>

<pre><code>// Create a new blog post
const response = await fetch(''/api/blog/posts'', {
  method: ''POST'',
  headers: { ''Content-Type'': ''application/json'' },
  body: JSON.stringify({
    title: ''My First Post'',
    slug: ''my-first-post'',
    excerpt: ''This is my first blog post!'',
    content: ''&lt;p&gt;Hello, world!&lt;/p&gt;'',
    status: ''published'',
    categoryIds: [1, 2],
    tagIds: [1, 2, 3]
  })
});

const post = await response.json();
console.log(''Post created:'', post);
</code></pre>

<h2>Conclusion</h2>

<p>This blog feature is ready for production use. It includes everything you need for a modern, performant, and secure blogging platform.</p>

<p>Happy blogging! ✨</p>',
  '/images/blog/welcome-post.jpg',
  'Welcome banner with blog logo',
  'Welcome to My Blog - Complete Blog Feature Test',
  'A comprehensive test post demonstrating all blog features including admin interface, public display, categories, tags, SEO optimization, and performance features.',
  '/images/blog/welcome-post-og.jpg',
  'blog, test, welcome, astro, cloudflare, typescript, react',
  'published',
  1,
  strftime('%s', 'now'),
  8,
  0,
  strftime('%s', 'now'),
  strftime('%s', 'now')
);

-- Get the ID of the post we just created
-- We'll use this to add categories and tags
-- Note: In SQLite, last_insert_rowid() gets the last inserted ID

-- Add categories to the test post (DevOps and Backend)
INSERT INTO BlogPostCategory (blogPostId, categoryId)
VALUES 
  ((SELECT id FROM BlogPost WHERE slug = 'welcome-to-my-blog'), 1),
  ((SELECT id FROM BlogPost WHERE slug = 'welcome-to-my-blog'), 2);

-- Add tags to the test post (astro, typescript, cloudflare)
INSERT INTO BlogPostTag (blogPostId, tagId)
VALUES 
  ((SELECT id FROM BlogPost WHERE slug = 'welcome-to-my-blog'), 1),
  ((SELECT id FROM BlogPost WHERE slug = 'welcome-to-my-blog'), 2),
  ((SELECT id FROM BlogPost WHERE slug = 'welcome-to-my-blog'), 3);

-- Update category post counts
UPDATE BlogCategory 
SET postCount = (
  SELECT COUNT(*) 
  FROM BlogPostCategory 
  WHERE categoryId = BlogCategory.id
);

-- Update tag use counts
UPDATE BlogTag 
SET useCount = (
  SELECT COUNT(*) 
  FROM BlogPostTag 
  WHERE tagId = BlogTag.id
);

-- Verify the post was created
SELECT 
  id, 
  slug, 
  title, 
  status,
  isPublished,
  readTime,
  viewCount,
  datetime(publishedAt, 'unixepoch') as published_date
FROM BlogPost 
WHERE slug = 'welcome-to-my-blog';
