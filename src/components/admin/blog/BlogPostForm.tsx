import { useEffect, useState } from 'react';
import { Save, ArrowLeft, Eye, X, Plus } from 'lucide-react';
import Button from '../../ui/Button';
import { generateSlug } from '../../../lib/blog/validations';
import { calculateReadingTime } from '../../../lib/blog/utils';
import type { BlogPost, BlogCategory, BlogTag } from '../../../lib/blog/types';

interface BlogPostFormProps {
  mode: 'create' | 'edit';
  postId?: string;
}

// Per-post limits, shared by the existing checkboxes and the inline "add" inputs.
const MAX_CATEGORIES = 5;
const MAX_TAGS = 10;
// Default color for categories created inline; full styling is editable in the
// taxonomy page (/admin/blog/taxonomy).
const DEFAULT_CATEGORY_COLOR = '#0ea5e9';

export default function BlogPostForm({ mode, postId }: BlogPostFormProps) {
  const [loading, setLoading] = useState(mode === 'edit');
  const [saving, setSaving] = useState(false);
  const [categories, setCategories] = useState<BlogCategory[]>([]);
  const [tags, setTags] = useState<BlogTag[]>([]);

  // Form fields
  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [excerpt, setExcerpt] = useState('');
  const [content, setContent] = useState('');
  const [featuredImage, setFeaturedImage] = useState('');
  const [featuredImageAlt, setFeaturedImageAlt] = useState('');
  const [selectedCategories, setSelectedCategories] = useState<number[]>([]);
  const [selectedTags, setSelectedTags] = useState<number[]>([]);
  const [status, setStatus] = useState<'draft' | 'published'>('draft');
  const [metaTitle, setMetaTitle] = useState('');
  const [metaDescription, setMetaDescription] = useState('');
  const [contentView, setContentView] = useState<'write' | 'split' | 'preview'>('write');

  // Inline taxonomy creation
  const [newCategoryName, setNewCategoryName] = useState('');
  const [addingCategory, setAddingCategory] = useState(false);
  const [newTagName, setNewTagName] = useState('');
  const [addingTag, setAddingTag] = useState(false);

  useEffect(() => {
    fetchCategories();
    fetchTags();
    if (mode === 'edit' && postId) {
      fetchPost();
    }
  }, [mode, postId]);

  const fetchCategories = async () => {
    try {
      const response = await fetch('/api/blog/categories');
      const data = (await response.json()) as BlogCategory[];
      setCategories(data);
    } catch (error) {
      console.error('Failed to fetch categories:', error);
    }
  };

  const fetchTags = async () => {
    try {
      const response = await fetch('/api/blog/tags');
      const data = (await response.json()) as BlogTag[];
      setTags(data);
    } catch (error) {
      console.error('Failed to fetch tags:', error);
    }
  };

  const fetchPost = async () => {
    try {
      const response = await fetch(`/api/blog/posts/${postId}`);
      const post = (await response.json()) as BlogPost;

      setTitle(post.title);
      setSlug(post.slug);
      setExcerpt(post.excerpt);
      setContent(post.content);
      setFeaturedImage(post.featuredImage || '');
      setFeaturedImageAlt(post.featuredImageAlt || '');
      setSelectedCategories(post.categories.map((c) => c.id));
      setSelectedTags(post.tags?.map((t) => t.id) || []);
      setStatus(post.status as 'draft' | 'published');
      setMetaTitle(post.metaTitle || '');
      setMetaDescription(post.metaDescription || '');
    } catch (error) {
      console.error('Failed to fetch post:', error);
      alert('Failed to load post');
    } finally {
      setLoading(false);
    }
  };

  const handleTitleChange = (value: string) => {
    setTitle(value);
    if (mode === 'create' && !slug) {
      setSlug(generateSlug(value));
    }
    if (!metaTitle) {
      setMetaTitle(value.substring(0, 70));
    }
  };

  const handleExcerptChange = (value: string) => {
    setExcerpt(value);
    if (!metaDescription) {
      setMetaDescription(value.substring(0, 160));
    }
  };

  const handleSubmit = async (e: React.SubmitEvent) => {
    e.preventDefault();

    // Validation
    if (!title.trim()) {
      alert('Please enter a title');
      return;
    }
    if (!slug.trim()) {
      alert('Please enter a slug');
      return;
    }
    if (excerpt.length < 50) {
      alert('Excerpt must be at least 50 characters');
      return;
    }
    if (content.length < 100) {
      alert('Content must be at least 100 characters');
      return;
    }

    setSaving(true);

    try {
      const payload = {
        title,
        slug,
        excerpt,
        content,
        featuredImage: featuredImage || undefined,
        featuredImageAlt: featuredImageAlt || undefined,
        categoryIds: selectedCategories,
        tagIds: selectedTags,
        status,
        isPublished: status === 'published',
        publishedAt: status === 'published' ? Math.floor(Date.now() / 1000) : undefined,
        readTime: calculateReadingTime(content),
        metaTitle: metaTitle || undefined,
        metaDescription: metaDescription || undefined,
      };

      const url = mode === 'create' ? '/api/blog/posts' : `/api/blog/posts/${postId}`;

      const method = mode === 'create' ? 'POST' : 'PUT';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(error || 'Failed to save post');
      }

      alert(`Post ${mode === 'create' ? 'created' : 'updated'} successfully!`);
      window.location.href = '/admin/blog';
    } catch (error) {
      console.error('Failed to save post:', error);
      alert(error instanceof Error ? error.message : 'Failed to save post');
    } finally {
      setSaving(false);
    }
  };

  // Create a new category inline and auto-select it. If one with the same name/
  // slug already exists (locally or per the API's UNIQUE constraint), select that
  // one instead of erroring.
  const handleAddCategory = async () => {
    const name = newCategoryName.trim();
    if (!name) return;
    if (selectedCategories.length >= MAX_CATEGORIES) {
      alert(`Maximum ${MAX_CATEGORIES} categories per post`);
      return;
    }

    const slug = generateSlug(name);
    const existing = categories.find(
      (c) => c.slug === slug || c.name.toLowerCase() === name.toLowerCase()
    );
    if (existing) {
      setSelectedCategories((prev) => (prev.includes(existing.id) ? prev : [...prev, existing.id]));
      setNewCategoryName('');
      return;
    }

    setAddingCategory(true);
    try {
      const response = await fetch('/api/blog/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, slug, color: DEFAULT_CATEGORY_COLOR }),
      });
      if (!response.ok) {
        const data = (await response.json().catch(() => ({}))) as {
          message?: string;
          error?: string;
        };
        throw new Error(data.message || data.error || 'Failed to create category');
      }
      const created = (await response.json()) as BlogCategory;
      setCategories((prev) => [...prev, created]);
      setSelectedCategories((prev) => [...prev, created.id]);
      setNewCategoryName('');
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Failed to create category');
    } finally {
      setAddingCategory(false);
    }
  };

  // Create a new tag inline and auto-select it (same dedupe behavior as above).
  const handleAddTag = async () => {
    const name = newTagName.trim();
    if (!name) return;
    if (selectedTags.length >= MAX_TAGS) {
      alert(`Maximum ${MAX_TAGS} tags per post`);
      return;
    }

    const slug = generateSlug(name);
    const existing = tags.find(
      (t) => t.slug === slug || t.name.toLowerCase() === name.toLowerCase()
    );
    if (existing) {
      setSelectedTags((prev) => (prev.includes(existing.id) ? prev : [...prev, existing.id]));
      setNewTagName('');
      return;
    }

    setAddingTag(true);
    try {
      const response = await fetch('/api/blog/tags', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, slug }),
      });
      if (!response.ok) {
        const data = (await response.json().catch(() => ({}))) as {
          message?: string;
          error?: string;
        };
        throw new Error(data.message || data.error || 'Failed to create tag');
      }
      const created = (await response.json()) as BlogTag;
      setTags((prev) => [...prev, created]);
      setSelectedTags((prev) => [...prev, created.id]);
      setNewTagName('');
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Failed to create tag');
    } finally {
      setAddingTag(false);
    }
  };

  const readTime = calculateReadingTime(content);
  const wordCount = content.trim().split(/\s+/).length;

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-sky-600 dark:border-sky-400"></div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-4">
          <Button
            type="button"
            onClick={() => (window.location.href = '/admin/blog')}
            variant="ghost"
            icon={ArrowLeft}
          >
            Back
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
              {mode === 'create' ? 'Create New Post' : 'Edit Post'}
            </h1>
            {mode === 'edit' && (
              <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">ID: {postId}</p>
            )}
          </div>
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <Button type="submit" variant="primary" icon={Save} disabled={saving} fullWidth>
            {saving ? 'Saving...' : 'Save Post'}
          </Button>
          {mode === 'edit' && (
            <Button
              type="button"
              onClick={() => window.open(`/blog/${slug}`, '_blank')}
              variant="outline"
              icon={Eye}
            >
              Preview
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Title */}
          <div className="bg-white dark:bg-slate-800 rounded-lg p-6 shadow-lg border border-slate-200 dark:border-slate-700">
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => handleTitleChange(e.target.value)}
              required
              className="w-full px-4 py-2.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white placeholder-slate-500 dark:placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500"
              placeholder="Enter post title"
            />
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              {title.length} / 200 characters
            </p>
          </div>

          {/* Slug */}
          <div className="bg-white dark:bg-slate-800 rounded-lg p-6 shadow-lg border border-slate-200 dark:border-slate-700">
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Slug <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              required
              className="w-full px-4 py-2.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white placeholder-slate-500 dark:placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500 font-mono text-sm"
              placeholder="post-url-slug"
            />
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              URL: <span className="font-mono">/blog/{slug || 'your-slug'}</span>
            </p>
          </div>

          {/* Excerpt */}
          <div className="bg-white dark:bg-slate-800 rounded-lg p-6 shadow-lg border border-slate-200 dark:border-slate-700">
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Excerpt <span className="text-red-500">*</span>
            </label>
            <textarea
              value={excerpt}
              onChange={(e) => handleExcerptChange(e.target.value)}
              required
              rows={3}
              className="w-full px-4 py-2.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white placeholder-slate-500 dark:placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500"
              placeholder="Short description (50-300 characters)"
            />
            <p
              className={`text-xs mt-1 ${
                excerpt.length < 50
                  ? 'text-red-500'
                  : excerpt.length > 300
                    ? 'text-yellow-500'
                    : 'text-slate-500 dark:text-slate-400'
              }`}
            >
              {excerpt.length} / 300 characters {excerpt.length < 50 && '(minimum 50)'}
            </p>
          </div>

          {/* Content */}
          <div className="bg-white dark:bg-slate-800 rounded-lg p-6 shadow-lg border border-slate-200 dark:border-slate-700">
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                Content <span className="text-red-500">*</span>
              </label>
              <div className="inline-flex rounded-lg border border-slate-300 dark:border-slate-600 overflow-hidden text-xs">
                {(['write', 'split', 'preview'] as const).map((view) => (
                  <button
                    key={view}
                    type="button"
                    onClick={() => setContentView(view)}
                    className={`px-3 py-1.5 capitalize transition-colors ${
                      contentView === view
                        ? 'bg-sky-600 text-white'
                        : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    {view}
                  </button>
                ))}
              </div>
            </div>
            <div className={contentView === 'split' ? 'grid grid-cols-1 lg:grid-cols-2 gap-4' : ''}>
              {contentView !== 'preview' && (
                <textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  required
                  rows={25}
                  className="w-full px-4 py-2.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white placeholder-slate-500 dark:placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500 font-mono text-sm"
                  placeholder="Write your post content (HTML)"
                />
              )}
              {contentView !== 'write' && (
                <div
                  className="prose prose-sky dark:prose-invert max-w-none rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-4 overflow-auto min-h-[200px] max-h-[640px]"
                  // Admin-only preview of the author's own HTML content; rendered
                  // identically to the public post page (set:html).
                  dangerouslySetInnerHTML={{
                    __html:
                      content ||
                      '<p class="text-slate-400">Nothing to preview yet — start writing.</p>',
                  }}
                />
              )}
            </div>
            <div className="flex justify-between text-xs text-slate-500 dark:text-slate-400 mt-1">
              <span>
                {wordCount} words · ~{readTime} min read
              </span>
              <span
                className={
                  content.length < 100
                    ? 'text-red-500'
                    : content.length > 100000
                      ? 'text-yellow-500'
                      : ''
                }
              >
                {content.length.toLocaleString()} / 100,000 characters
              </span>
            </div>
          </div>

          {/* SEO Section */}
          <div className="bg-white dark:bg-slate-800 rounded-lg p-6 shadow-lg border border-slate-200 dark:border-slate-700">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
              SEO Metadata
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Meta Title
                </label>
                <input
                  type="text"
                  value={metaTitle}
                  onChange={(e) => setMetaTitle(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white placeholder-slate-500 dark:placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500"
                  placeholder="Leave empty to use post title"
                />
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  {metaTitle.length} / 70 characters (optimal for SEO)
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Meta Description
                </label>
                <textarea
                  value={metaDescription}
                  onChange={(e) => setMetaDescription(e.target.value)}
                  rows={2}
                  className="w-full px-4 py-2.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white placeholder-slate-500 dark:placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500"
                  placeholder="Leave empty to use excerpt"
                />
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  {metaDescription.length} / 160 characters (optimal for SEO)
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Status */}
          <div className="bg-white dark:bg-slate-800 rounded-lg p-6 shadow-lg border border-slate-200 dark:border-slate-700">
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Status
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as 'draft' | 'published')}
              className="w-full px-4 py-2.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500"
            >
              <option value="draft">Draft</option>
              <option value="published">Published</option>
            </select>
          </div>

          {/* Featured Image */}
          <div className="bg-white dark:bg-slate-800 rounded-lg p-6 shadow-lg border border-slate-200 dark:border-slate-700">
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Featured Image
            </label>
            <input
              type="url"
              value={featuredImage}
              onChange={(e) => setFeaturedImage(e.target.value)}
              className="w-full px-4 py-2.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white placeholder-slate-500 dark:placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500"
              placeholder="https://..."
            />
            {featuredImage && (
              <div className="mt-4 relative">
                <img
                  src={featuredImage}
                  alt="Featured image preview"
                  className="w-full rounded-lg"
                  onError={(e) => {
                    e.currentTarget.src =
                      'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="100" height="100"%3E%3Crect fill="%23ddd"/%3E%3Ctext x="50%" y="50%" fill="%23999" text-anchor="middle" dy=".3em"%3EInvalid%3C/text%3E%3C/svg%3E';
                  }}
                />
                <button
                  type="button"
                  onClick={() => setFeaturedImage('')}
                  className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}
            <div className="mt-2">
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Alt Text
              </label>
              <input
                type="text"
                value={featuredImageAlt}
                onChange={(e) => setFeaturedImageAlt(e.target.value)}
                className="w-full px-4 py-2.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white placeholder-slate-500 dark:placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500"
                placeholder="Image description for accessibility"
              />
            </div>
          </div>

          {/* Categories */}
          <div className="bg-white dark:bg-slate-800 rounded-lg p-6 shadow-lg border border-slate-200 dark:border-slate-700">
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">
              Categories
            </label>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {categories.length === 0 ? (
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  No categories available
                </p>
              ) : (
                categories.map((category) => (
                  <label key={category.id} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selectedCategories.includes(category.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          if (selectedCategories.length >= MAX_CATEGORIES) {
                            alert(`Maximum ${MAX_CATEGORIES} categories per post`);
                            return;
                          }
                          setSelectedCategories([...selectedCategories, category.id]);
                        } else {
                          setSelectedCategories(
                            selectedCategories.filter((id) => id !== category.id)
                          );
                        }
                      }}
                      className="rounded text-sky-600 focus:ring-sky-500"
                    />
                    <span className="text-sm text-slate-700 dark:text-slate-300">
                      {category.name}
                    </span>
                  </label>
                ))
              )}
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
              {selectedCategories.length} / {MAX_CATEGORIES} selected
            </p>
            <div className="mt-3 flex gap-2 border-t border-slate-200 dark:border-slate-700 pt-3">
              <input
                type="text"
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    void handleAddCategory();
                  }
                }}
                placeholder="New category…"
                className="flex-1 min-w-0 px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-sm text-slate-900 dark:text-white placeholder-slate-500 dark:placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500"
              />
              <Button
                type="button"
                onClick={handleAddCategory}
                disabled={addingCategory || !newCategoryName.trim()}
                loading={addingCategory}
                variant="outline"
                size="sm"
                icon={Plus}
              >
                Add
              </Button>
            </div>
          </div>

          {/* Tags */}
          <div className="bg-white dark:bg-slate-800 rounded-lg p-6 shadow-lg border border-slate-200 dark:border-slate-700">
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">
              Tags
            </label>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {tags.length === 0 ? (
                <p className="text-sm text-slate-500 dark:text-slate-400">No tags available</p>
              ) : (
                tags.map((tag) => (
                  <label key={tag.id} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selectedTags.includes(tag.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          if (selectedTags.length >= MAX_TAGS) {
                            alert(`Maximum ${MAX_TAGS} tags per post`);
                            return;
                          }
                          setSelectedTags([...selectedTags, tag.id]);
                        } else {
                          setSelectedTags(selectedTags.filter((id) => id !== tag.id));
                        }
                      }}
                      className="rounded text-sky-600 focus:ring-sky-500"
                    />
                    <span className="text-sm text-slate-700 dark:text-slate-300">{tag.name}</span>
                  </label>
                ))
              )}
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
              {selectedTags.length} / {MAX_TAGS} selected
            </p>
            <div className="mt-3 flex gap-2 border-t border-slate-200 dark:border-slate-700 pt-3">
              <input
                type="text"
                value={newTagName}
                onChange={(e) => setNewTagName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    void handleAddTag();
                  }
                }}
                placeholder="New tag…"
                className="flex-1 min-w-0 px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-sm text-slate-900 dark:text-white placeholder-slate-500 dark:placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500"
              />
              <Button
                type="button"
                onClick={handleAddTag}
                disabled={addingTag || !newTagName.trim()}
                loading={addingTag}
                variant="outline"
                size="sm"
                icon={Plus}
              >
                Add
              </Button>
            </div>
          </div>
        </div>
      </div>
    </form>
  );
}
