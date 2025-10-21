-- Seed initial blog categories and tags
-- Run: npx wrangler d1 execute heridotlife --local --file=migrations/003_seed_blog_data.sql

-- Insert categories
INSERT INTO BlogCategory (name, slug, description, color) VALUES
  ('Technology', 'technology', 'Tech articles, tutorials, and industry insights', '#3B82F6'),
  ('Programming', 'programming', 'Coding guides, best practices, and development tips', '#10B981'),
  ('Web Development', 'web-development', 'Frontend and backend web development resources', '#8B5CF6'),
  ('DevOps', 'devops', 'Infrastructure, deployment, and automation', '#F59E0B'),
  ('AI & Machine Learning', 'ai-machine-learning', 'Artificial intelligence and ML resources', '#EF4444');

-- Insert tags
INSERT INTO BlogTag (name, slug) VALUES
  ('JavaScript', 'javascript'),
  ('TypeScript', 'typescript'),
  ('React', 'react'),
  ('Astro', 'astro'),
  ('Node.js', 'nodejs'),
  ('Python', 'python'),
  ('Docker', 'docker'),
  ('Kubernetes', 'kubernetes'),
  ('Cloudflare', 'cloudflare'),
  ('Performance', 'performance'),
  ('Security', 'security'),
  ('Tutorial', 'tutorial'),
  ('Best Practices', 'best-practices'),
  ('Testing', 'testing'),
  ('API', 'api');
