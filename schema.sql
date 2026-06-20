-- D1 Database Schema for heridotlife URL Shortener
-- Run this with: wrangler d1 execute heridotlife-db --file=./schema.sql

-- Create ShortUrl table (main table for URL shortener)
CREATE TABLE IF NOT EXISTS ShortUrl (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  shortUrl TEXT UNIQUE NOT NULL,
  originalUrl TEXT NOT NULL,
  title TEXT,
  description TEXT,
  ogImage TEXT,
  userId TEXT,
  createdAt INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
  updatedAt INTEGER DEFAULT (strftime('%s', 'now')),
  clickCount INTEGER NOT NULL DEFAULT 0,
  latestClick INTEGER,
  isActive INTEGER NOT NULL DEFAULT 1,
  expiresAt INTEGER
);

-- Create Category table
CREATE TABLE IF NOT EXISTS Category (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT UNIQUE NOT NULL,
  clickCount INTEGER NOT NULL DEFAULT 0
);

-- Create junction table for many-to-many relationship between ShortUrl and Category
CREATE TABLE IF NOT EXISTS ShortUrlCategory (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  shortUrlId INTEGER NOT NULL,
  categoryId INTEGER NOT NULL,
  FOREIGN KEY (shortUrlId) REFERENCES ShortUrl(id) ON DELETE CASCADE,
  FOREIGN KEY (categoryId) REFERENCES Category(id) ON DELETE CASCADE,
  UNIQUE(shortUrlId, categoryId)
);

-- Create User table (for admin/future auth)
CREATE TABLE IF NOT EXISTS User (
  id TEXT PRIMARY KEY,
  name TEXT,
  email TEXT UNIQUE,
  image TEXT,
  password TEXT NOT NULL
);

-- Create Session table (for auth)
CREATE TABLE IF NOT EXISTS Session (
  id TEXT PRIMARY KEY,
  sessionToken TEXT UNIQUE NOT NULL,
  userId TEXT NOT NULL,
  expires INTEGER NOT NULL,
  FOREIGN KEY (userId) REFERENCES User(id) ON DELETE CASCADE
);

-- Create Account table (for OAuth providers)
CREATE TABLE IF NOT EXISTS Account (
  id TEXT PRIMARY KEY,
  userId TEXT NOT NULL,
  type TEXT NOT NULL,
  provider TEXT NOT NULL,
  providerAccountId TEXT NOT NULL,
  apiKey TEXT UNIQUE,
  refresh_token TEXT,
  access_token TEXT,
  expires_at INTEGER,
  token_type TEXT,
  scope TEXT,
  id_token TEXT,
  session_state TEXT,
  oauth_token_secret TEXT,
  oauth_token TEXT,
  FOREIGN KEY (userId) REFERENCES User(id) ON DELETE CASCADE,
  UNIQUE(provider, providerAccountId)
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_shorturl_shorturl ON ShortUrl(shortUrl);
CREATE INDEX IF NOT EXISTS idx_shorturl_userid ON ShortUrl(userId);
CREATE INDEX IF NOT EXISTS idx_shorturl_isactive ON ShortUrl(isActive);
CREATE INDEX IF NOT EXISTS idx_shorturl_expiresat ON ShortUrl(expiresAt);
CREATE INDEX IF NOT EXISTS idx_category_name ON Category(name);
CREATE INDEX IF NOT EXISTS idx_shorturlcategory_shorturl ON ShortUrlCategory(shortUrlId);
CREATE INDEX IF NOT EXISTS idx_shorturlcategory_category ON ShortUrlCategory(categoryId);
CREATE INDEX IF NOT EXISTS idx_session_token ON Session(sessionToken);
CREATE INDEX IF NOT EXISTS idx_user_email ON User(email);

-- ============================================================================
-- Blog (canonical state after migrations 002_add_blog_tables + 005_remove_user_dependency)
-- ============================================================================

-- Blog posts (authorId is nullable; no FK to User)
CREATE TABLE IF NOT EXISTS BlogPost (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  slug TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  excerpt TEXT NOT NULL,
  content TEXT NOT NULL,
  featuredImage TEXT,
  featuredImageAlt TEXT,
  authorId TEXT,
  metaTitle TEXT,
  metaDescription TEXT,
  ogImage TEXT,
  keywords TEXT,
  status TEXT NOT NULL DEFAULT 'draft' CHECK(status IN ('draft', 'published', 'archived')),
  isPublished INTEGER NOT NULL DEFAULT 0 CHECK(isPublished IN (0, 1)),
  publishedAt INTEGER,
  createdAt INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
  updatedAt INTEGER DEFAULT (strftime('%s', 'now')),
  viewCount INTEGER NOT NULL DEFAULT 0,
  readTime INTEGER
);

-- Blog categories
CREATE TABLE IF NOT EXISTS BlogCategory (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  slug TEXT UNIQUE NOT NULL,
  name TEXT UNIQUE NOT NULL,
  description TEXT,
  icon TEXT,
  color TEXT,
  postCount INTEGER NOT NULL DEFAULT 0,
  createdAt INTEGER NOT NULL DEFAULT (strftime('%s', 'now'))
);

-- Blog tags
CREATE TABLE IF NOT EXISTS BlogTag (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  slug TEXT UNIQUE NOT NULL,
  name TEXT UNIQUE NOT NULL,
  useCount INTEGER NOT NULL DEFAULT 0,
  createdAt INTEGER NOT NULL DEFAULT (strftime('%s', 'now'))
);

-- Junction: BlogPost <-> BlogCategory
CREATE TABLE IF NOT EXISTS BlogPostCategory (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  blogPostId INTEGER NOT NULL,
  categoryId INTEGER NOT NULL,
  FOREIGN KEY (blogPostId) REFERENCES BlogPost(id) ON DELETE CASCADE,
  FOREIGN KEY (categoryId) REFERENCES BlogCategory(id) ON DELETE CASCADE,
  UNIQUE(blogPostId, categoryId)
);

-- Junction: BlogPost <-> BlogTag
CREATE TABLE IF NOT EXISTS BlogPostTag (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  blogPostId INTEGER NOT NULL,
  tagId INTEGER NOT NULL,
  FOREIGN KEY (blogPostId) REFERENCES BlogPost(id) ON DELETE CASCADE,
  FOREIGN KEY (tagId) REFERENCES BlogTag(id) ON DELETE CASCADE,
  UNIQUE(blogPostId, tagId)
);

-- Blog indexes
CREATE INDEX IF NOT EXISTS idx_blogpost_slug ON BlogPost(slug);
CREATE INDEX IF NOT EXISTS idx_blogpost_status ON BlogPost(status);
CREATE INDEX IF NOT EXISTS idx_blogpost_published ON BlogPost(isPublished, publishedAt DESC);
CREATE INDEX IF NOT EXISTS idx_blogpost_author ON BlogPost(authorId);
CREATE INDEX IF NOT EXISTS idx_blogpost_created ON BlogPost(createdAt DESC);
CREATE INDEX IF NOT EXISTS idx_blogcategory_slug ON BlogCategory(slug);
CREATE INDEX IF NOT EXISTS idx_blogcategory_name ON BlogCategory(name);
CREATE INDEX IF NOT EXISTS idx_blogtag_slug ON BlogTag(slug);
CREATE INDEX IF NOT EXISTS idx_blogtag_name ON BlogTag(name);
CREATE INDEX IF NOT EXISTS idx_blogpostcategory_post ON BlogPostCategory(blogPostId);
CREATE INDEX IF NOT EXISTS idx_blogpostcategory_category ON BlogPostCategory(categoryId);
CREATE INDEX IF NOT EXISTS idx_blogposttag_post ON BlogPostTag(blogPostId);
CREATE INDEX IF NOT EXISTS idx_blogposttag_tag ON BlogPostTag(tagId);

-- Full-text search over BlogPost (external content table)
CREATE VIRTUAL TABLE IF NOT EXISTS BlogPost_fts USING fts5(
  title,
  excerpt,
  content,
  content='BlogPost',
  content_rowid='id'
);

-- Keep updatedAt fresh on BlogPost updates
CREATE TRIGGER IF NOT EXISTS blogpost_updated_at AFTER UPDATE ON BlogPost BEGIN
  UPDATE BlogPost SET updatedAt = strftime('%s', 'now') WHERE id = new.id;
END;

-- Keep the FTS index in sync with BlogPost
CREATE TRIGGER IF NOT EXISTS blogpost_ai AFTER INSERT ON BlogPost BEGIN
  INSERT INTO BlogPost_fts(rowid, title, excerpt, content)
  VALUES (new.id, new.title, new.excerpt, new.content);
END;

CREATE TRIGGER IF NOT EXISTS blogpost_ad AFTER DELETE ON BlogPost BEGIN
  DELETE FROM BlogPost_fts WHERE rowid = old.id;
END;

CREATE TRIGGER IF NOT EXISTS blogpost_au AFTER UPDATE ON BlogPost BEGIN
  UPDATE BlogPost_fts
  SET title = new.title, excerpt = new.excerpt, content = new.content
  WHERE rowid = new.id;
END;
