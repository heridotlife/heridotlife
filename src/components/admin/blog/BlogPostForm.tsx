import { useEffect, useState } from 'react';
import { Save, ArrowLeft, Eye, X } from 'lucide-react';
import Button from '../../ui/Button';
import { generateSlug } from '../../../lib/blog/validations';
import { calculateReadingTime } from '../../../lib/blog/utils';
import type { BlogPost, BlogCategory, BlogTag } from '../../../lib/blog/types';

interface BlogPostFormProps {
  mode: 'create' | 'edit';
  postId?: string;
}

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

  const handleSubmit = async (e: React.FormEvent) => {
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
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Content <span className="text-red-500">*</span>
            </label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              required
              rows={25}
              className="w-full px-4 py-2.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white placeholder-slate-500 dark:placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500 font-mono text-sm"
              placeholder="Write your post content (HTML or Markdown)"
            />
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
                    e.currentTarget.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="100" height="100"%3E%3Crect fill="%23ddd"/%3E%3Ctext x="50%" y="50%" fill="%23999" text-anchor="middle" dy=".3em"%3EInvalid%3C/text%3E%3C/svg%3E';
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
                <p className="text-sm text-slate-500 dark:text-slate-400">No categories available</p>
              ) : (
                categories.map((category) => (
                  <label key={category.id} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selectedCategories.includes(category.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          if (selectedCategories.length >= 5) {
                            alert('Maximum 5 categories per post');
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
              {selectedCategories.length} / 5 selected
            </p>
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
                          if (selectedTags.length >= 10) {
                            alert('Maximum 10 tags per post');
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
              {selectedTags.length} / 10 selected
            </p>
          </div>
        </div>
      </div>
    </form>
  );
}
