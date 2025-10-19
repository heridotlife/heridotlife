-- Blog Tables Migration
-- Version: 002
-- Date: 2025-10-19
-- Description: Add blog functionality to heridotlife

-- ============================================================================
-- Core Blog Tables
-- ============================================================================

-- Blog Posts table
CREATE TABLE IF NOT EXISTS BlogPost (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  slug TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  excerpt TEXT NOT NULL,
  content TEXT NOT NULL,
  
  -- Images
  featuredImage TEXT,
  featuredImageAlt TEXT,
  
  -- Author (link to existing User table)
  authorId TEXT NOT NULL,
  
  -- SEO fields
  metaTitle TEXT,
  metaDescription TEXT,
  ogImage TEXT,
  keywords TEXT,
  
  -- Status & visibility
  status TEXT NOT NULL DEFAULT 'draft' CHECK(status IN ('draft', 'published', 'archived')),
  isPublished INTEGER NOT NULL DEFAULT 0 CHECK(isPublished IN (0, 1)),
  publishedAt INTEGER,
  
  -- Timestamps
  createdAt INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
  updatedAt INTEGER DEFAULT (strftime('%s', 'now')),
  
  -- Analytics
  viewCount INTEGER NOT NULL DEFAULT 0,
  readTime INTEGER,
  
  FOREIGN KEY (authorId) REFERENCES User(id) ON DELETE CASCADE
);

-- Categories table
CREATE TABLE IF NOT EXISTS BlogCategory (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  slug TEXT UNIQUE NOT NULL,
  name TEXT UNIQUE NOT NULL,
  description TEXT,
  icon TEXT, -- lucide-react icon name
  color TEXT, -- hex color for badges
  postCount INTEGER NOT NULL DEFAULT 0,
  createdAt INTEGER NOT NULL DEFAULT (strftime('%s', 'now'))
);

-- Junction table: BlogPost <-> BlogCategory (many-to-many)
CREATE TABLE IF NOT EXISTS BlogPostCategory (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  blogPostId INTEGER NOT NULL,
  categoryId INTEGER NOT NULL,
  FOREIGN KEY (blogPostId) REFERENCES BlogPost(id) ON DELETE CASCADE,
  FOREIGN KEY (categoryId) REFERENCES BlogCategory(id) ON DELETE CASCADE,
  UNIQUE(blogPostId, categoryId)
);

-- Tags table
CREATE TABLE IF NOT EXISTS BlogTag (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  slug TEXT UNIQUE NOT NULL,
  name TEXT UNIQUE NOT NULL,
  useCount INTEGER NOT NULL DEFAULT 0,
  createdAt INTEGER NOT NULL DEFAULT (strftime('%s', 'now'))
);

-- Junction table: BlogPost <-> BlogTag (many-to-many)
CREATE TABLE IF NOT EXISTS BlogPostTag (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  blogPostId INTEGER NOT NULL,
  tagId INTEGER NOT NULL,
  FOREIGN KEY (blogPostId) REFERENCES BlogPost(id) ON DELETE CASCADE,
  FOREIGN KEY (tagId) REFERENCES BlogTag(id) ON DELETE CASCADE,
  UNIQUE(blogPostId, tagId)
);

-- ============================================================================
-- Performance Indexes
-- ============================================================================

-- BlogPost indexes
CREATE INDEX IF NOT EXISTS idx_blogpost_slug ON BlogPost(slug);
CREATE INDEX IF NOT EXISTS idx_blogpost_status ON BlogPost(status);
CREATE INDEX IF NOT EXISTS idx_blogpost_published ON BlogPost(isPublished, publishedAt DESC);
CREATE INDEX IF NOT EXISTS idx_blogpost_author ON BlogPost(authorId);
CREATE INDEX IF NOT EXISTS idx_blogpost_createdat ON BlogPost(createdAt DESC);

-- BlogCategory indexes
CREATE INDEX IF NOT EXISTS idx_blogcategory_slug ON BlogCategory(slug);
CREATE INDEX IF NOT EXISTS idx_blogcategory_name ON BlogCategory(name);

-- BlogTag indexes
CREATE INDEX IF NOT EXISTS idx_blogtag_slug ON BlogTag(slug);
CREATE INDEX IF NOT EXISTS idx_blogtag_name ON BlogTag(name);

-- Junction table indexes
CREATE INDEX IF NOT EXISTS idx_blogpostcategory_post ON BlogPostCategory(blogPostId);
CREATE INDEX IF NOT EXISTS idx_blogpostcategory_category ON BlogPostCategory(categoryId);
CREATE INDEX IF NOT EXISTS idx_blogposttag_post ON BlogPostTag(blogPostId);
CREATE INDEX IF NOT EXISTS idx_blogposttag_tag ON BlogPostTag(tagId);

-- ============================================================================
-- Full-Text Search (FTS5)
-- ============================================================================

-- Virtual table for full-text search
CREATE VIRTUAL TABLE IF NOT EXISTS BlogPostFTS USING fts5(
  title,
  excerpt,
  content,
  keywords,
  content='BlogPost',
  content_rowid='id',
  tokenize='porter unicode61'
);

-- Trigger: Sync FTS on INSERT
CREATE TRIGGER IF NOT EXISTS blogpost_fts_insert AFTER INSERT ON BlogPost BEGIN
  INSERT INTO BlogPostFTS(rowid, title, excerpt, content, keywords)
  VALUES (new.id, new.title, new.excerpt, new.content, COALESCE(new.keywords, ''));
END;

-- Trigger: Sync FTS on DELETE
CREATE TRIGGER IF NOT EXISTS blogpost_fts_delete AFTER DELETE ON BlogPost BEGIN
  DELETE FROM BlogPostFTS WHERE rowid = old.id;
END;

-- Trigger: Sync FTS on UPDATE
CREATE TRIGGER IF NOT EXISTS blogpost_fts_update AFTER UPDATE ON BlogPost BEGIN
  UPDATE BlogPostFTS
  SET title = new.title,
      excerpt = new.excerpt,
      content = new.content,
      keywords = COALESCE(new.keywords, '')
  WHERE rowid = new.id;
END;

-- ============================================================================
-- Automatic Timestamp Updates
-- ============================================================================

-- Trigger: Update updatedAt on BlogPost UPDATE
CREATE TRIGGER IF NOT EXISTS blogpost_updated_at AFTER UPDATE ON BlogPost BEGIN
  UPDATE BlogPost SET updatedAt = strftime('%s', 'now') WHERE id = new.id;
END;

-- ============================================================================
-- Sample Data (Development Only)
-- ============================================================================

-- Insert sample categories
INSERT OR IGNORE INTO BlogCategory (slug, name, description, icon, color, postCount)
VALUES
  ('devops', 'DevOps', 'DevOps practices and automation', 'Cog', '#3b82f6', 0),
  ('backend', 'Backend', 'Backend development and APIs', 'Server', '#8b5cf6', 0),
  ('cloud', 'Cloud', 'Cloud infrastructure and services', 'Cloud', '#06b6d4', 0),
  ('kubernetes', 'Kubernetes', 'Container orchestration with K8s', 'Boxes', '#2563eb', 0),
  ('automation', 'Automation', 'CI/CD and workflow automation', 'Zap', '#f59e0b', 0),
  ('security', 'Security', 'Security best practices', 'Shield', '#ef4444', 0),
  ('performance', 'Performance', 'Performance optimization', 'Gauge', '#10b981', 0),
  ('tutorial', 'Tutorial', 'Step-by-step guides', 'BookOpen', '#ec4899', 0);

-- Insert sample tags
INSERT OR IGNORE INTO BlogTag (slug, name, useCount)
VALUES
  ('astro', 'Astro', 0),
  ('typescript', 'TypeScript', 0),
  ('cloudflare', 'Cloudflare', 0),
  ('docker', 'Docker', 0),
  ('terraform', 'Terraform', 0),
  ('golang', 'Golang', 0),
  ('python', 'Python', 0),
  ('aws', 'AWS', 0),
  ('gcp', 'GCP', 0),
  ('monitoring', 'Monitoring', 0);

-- ============================================================================
-- Verification Queries (Comment out in production)
-- ============================================================================

-- SELECT 'BlogPost table created' as message;
-- SELECT COUNT(*) as category_count FROM BlogCategory;
-- SELECT COUNT(*) as tag_count FROM BlogTag;
