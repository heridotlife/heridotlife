-- Migration: Add OG fields to ShortUrl table
-- Run with: wrangler d1 execute D1_db --local --file=./migrations/add_og_fields.sql

-- Add description column for OG description
ALTER TABLE ShortUrl ADD COLUMN description TEXT;

-- Add ogImage column for OG image URL
ALTER TABLE ShortUrl ADD COLUMN ogImage TEXT;