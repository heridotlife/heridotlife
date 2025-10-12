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
