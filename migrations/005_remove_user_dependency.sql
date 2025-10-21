-- Remove User dependency from BlogPost
-- Version: 005
-- Date: 2025-10-19
-- Description: Make authorId nullable and remove foreign key constraint

-- SQLite doesn't support ALTER TABLE DROP CONSTRAINT or MODIFY COLUMN
-- We need to recreate the table without the foreign key

-- Step 1: Create new table without foreign key
CREATE TABLE IF NOT EXISTS BlogPost_new (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  slug TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  excerpt TEXT NOT NULL,
  content TEXT NOT NULL,
  
  -- Images
  featuredImage TEXT,
  featuredImageAlt TEXT,
  
  -- Author (now nullable, no foreign key)
  authorId TEXT,
  
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
  readTime INTEGER
);

-- Step 2: Copy data from old table (if exists)
INSERT INTO BlogPost_new 
SELECT id, slug, title, excerpt, content, featuredImage, featuredImageAlt, 
       authorId, metaTitle, metaDescription, ogImage, keywords, 
       status, isPublished, publishedAt, createdAt, updatedAt, 
       viewCount, readTime
FROM BlogPost;

-- Step 3: Drop old table
DROP TABLE BlogPost;

-- Step 4: Rename new table
ALTER TABLE BlogPost_new RENAME TO BlogPost;

-- Step 5: Recreate indexes
CREATE INDEX IF NOT EXISTS idx_blogpost_slug ON BlogPost(slug);
CREATE INDEX IF NOT EXISTS idx_blogpost_status ON BlogPost(status);
CREATE INDEX IF NOT EXISTS idx_blogpost_published ON BlogPost(isPublished, publishedAt DESC);
CREATE INDEX IF NOT EXISTS idx_blogpost_author ON BlogPost(authorId);
CREATE INDEX IF NOT EXISTS idx_blogpost_created ON BlogPost(createdAt DESC);

-- Step 6: Recreate FTS index
DROP TABLE IF EXISTS BlogPost_fts;
CREATE VIRTUAL TABLE IF NOT EXISTS BlogPost_fts USING fts5(
  title, 
  excerpt, 
  content,
  content='BlogPost',
  content_rowid='id'
);

-- Populate FTS index with existing data
INSERT INTO BlogPost_fts(rowid, title, excerpt, content)
SELECT id, title, excerpt, content FROM BlogPost;

-- Recreate FTS triggers
DROP TRIGGER IF EXISTS blogpost_ai;
CREATE TRIGGER blogpost_ai AFTER INSERT ON BlogPost BEGIN
  INSERT INTO BlogPost_fts(rowid, title, excerpt, content)
  VALUES (new.id, new.title, new.excerpt, new.content);
END;

DROP TRIGGER IF EXISTS blogpost_ad;
CREATE TRIGGER blogpost_ad AFTER DELETE ON BlogPost BEGIN
  DELETE FROM BlogPost_fts WHERE rowid = old.id;
END;

DROP TRIGGER IF EXISTS blogpost_au;
CREATE TRIGGER blogpost_au AFTER UPDATE ON BlogPost BEGIN
  UPDATE BlogPost_fts SET 
    title = new.title,
    excerpt = new.excerpt,
    content = new.content
  WHERE rowid = new.id;
END;

-- Verify the change
SELECT 'Migration 005 completed: authorId is now nullable' as status;
