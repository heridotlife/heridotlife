'use client';

import { useEffect, useState } from 'react';
import { Plus, Pencil, Trash2, X, Check, ArrowLeft } from 'lucide-react';
import Button from '../../ui/Button';
import Input from '../../ui/Input';
import { generateSlug } from '../../../lib/blog/validations';

interface BlogCategory {
  id: number;
  slug: string;
  name: string;
  description: string | null;
  icon: string | null;
  color: string | null;
  postCount?: number;
}

interface BlogTag {
  id: number;
  slug: string;
  name: string;
  useCount?: number;
}

const DEFAULT_COLOR = '#0ea5e9';

export default function BlogTaxonomyPage() {
  const [categories, setCategories] = useState<BlogCategory[]>([]);
  const [tags, setTags] = useState<BlogTag[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Category create form
  const [newCatName, setNewCatName] = useState('');
  const [newCatDesc, setNewCatDesc] = useState('');
  const [newCatColor, setNewCatColor] = useState(DEFAULT_COLOR);
  const [creatingCat, setCreatingCat] = useState(false);

  // Tag create form
  const [newTagName, setNewTagName] = useState('');
  const [creatingTag, setCreatingTag] = useState(false);

  // Inline edit state
  const [editCatId, setEditCatId] = useState<number | null>(null);
  const [editCatName, setEditCatName] = useState('');
  const [editCatColor, setEditCatColor] = useState(DEFAULT_COLOR);
  const [editTagId, setEditTagId] = useState<number | null>(null);
  const [editTagName, setEditTagName] = useState('');

  useEffect(() => {
    void load();
  }, []);

  const load = async () => {
    try {
      setLoading(true);
      const [catRes, tagRes] = await Promise.all([
        fetch('/api/blog/categories'),
        fetch('/api/blog/tags'),
      ]);
      if (!catRes.ok || !tagRes.ok) throw new Error('Failed to load taxonomy');
      setCategories((await catRes.json()) as BlogCategory[]);
      setTags((await tagRes.json()) as BlogTag[]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load taxonomy');
    } finally {
      setLoading(false);
    }
  };

  const fail = async (res: Response, fallback: string) => {
    const data = (await res.json().catch(() => ({}))) as { message?: string; error?: string };
    throw new Error(data.message || data.error || fallback);
  };

  // ---- Categories ----
  const createCategory = async () => {
    const name = newCatName.trim();
    if (!name) return;
    try {
      setCreatingCat(true);
      const res = await fetch('/api/blog/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          slug: generateSlug(name),
          description: newCatDesc.trim() || undefined,
          color: newCatColor,
        }),
      });
      if (!res.ok) await fail(res, 'Failed to create category');
      setNewCatName('');
      setNewCatDesc('');
      setNewCatColor(DEFAULT_COLOR);
      await load();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to create category');
    } finally {
      setCreatingCat(false);
    }
  };

  const saveCategory = async (id: number) => {
    const name = editCatName.trim();
    if (!name) return;
    try {
      const res = await fetch(`/api/blog/categories/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, color: editCatColor }),
      });
      if (!res.ok) await fail(res, 'Failed to update category');
      setEditCatId(null);
      await load();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to update category');
    }
  };

  const deleteCategory = async (id: number, name: string) => {
    if (!confirm(`Delete category "${name}"? It will be removed from all posts.`)) return;
    try {
      const res = await fetch(`/api/blog/categories/${id}`, { method: 'DELETE' });
      if (!res.ok) await fail(res, 'Failed to delete category');
      await load();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to delete category');
    }
  };

  // ---- Tags ----
  const createTag = async () => {
    const name = newTagName.trim();
    if (!name) return;
    try {
      setCreatingTag(true);
      const res = await fetch('/api/blog/tags', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, slug: generateSlug(name) }),
      });
      if (!res.ok) await fail(res, 'Failed to create tag');
      setNewTagName('');
      await load();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to create tag');
    } finally {
      setCreatingTag(false);
    }
  };

  const saveTag = async (id: number) => {
    const name = editTagName.trim();
    if (!name) return;
    try {
      const res = await fetch(`/api/blog/tags/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, slug: generateSlug(name) }),
      });
      if (!res.ok) await fail(res, 'Failed to update tag');
      setEditTagId(null);
      await load();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to update tag');
    }
  };

  const deleteTag = async (id: number, name: string) => {
    if (!confirm(`Delete tag "${name}"? It will be removed from all posts.`)) return;
    try {
      const res = await fetch(`/api/blog/tags/${id}`, { method: 'DELETE' });
      if (!res.ok) await fail(res, 'Failed to delete tag');
      await load();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to delete tag');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-slate-500 dark:text-slate-400">Loading taxonomy...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-red-600 dark:text-red-400">{error}</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
            Blog Categories &amp; Tags
          </h1>
          <p className="text-slate-600 dark:text-slate-400 mt-1">
            Organize posts with categories and tags
          </p>
        </div>
        <Button
          onClick={() => (window.location.href = '/admin/blog')}
          variant="secondary"
          icon={ArrowLeft}
        >
          Back to Posts
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Categories */}
        <section className="bg-white dark:bg-slate-800 rounded-lg shadow-lg border border-slate-200 dark:border-slate-700 p-5 space-y-4">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">
            Categories ({categories.length})
          </h2>

          <div className="space-y-3 border-b border-slate-200 dark:border-slate-700 pb-4">
            <Input
              type="text"
              value={newCatName}
              onChange={(e) => setNewCatName(e.target.value)}
              placeholder="New category name..."
              fullWidth
            />
            <Input
              type="text"
              value={newCatDesc}
              onChange={(e) => setNewCatDesc(e.target.value)}
              placeholder="Description (optional)"
              fullWidth
            />
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={newCatColor}
                onChange={(e) => setNewCatColor(e.target.value)}
                aria-label="Category color"
                className="h-11 w-14 rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900"
              />
              <Button
                onClick={createCategory}
                disabled={creatingCat || !newCatName.trim()}
                loading={creatingCat}
                variant="primary"
                icon={Plus}
                fullWidth
              >
                Add Category
              </Button>
            </div>
          </div>

          <ul className="space-y-2">
            {categories.length === 0 && (
              <li className="text-sm text-slate-500 dark:text-slate-400 py-4 text-center">
                No categories yet.
              </li>
            )}
            {categories.map((cat) => (
              <li
                key={cat.id}
                className="flex items-center gap-3 rounded-lg border border-slate-200 dark:border-slate-700 px-3 py-2"
              >
                {editCatId === cat.id ? (
                  <>
                    <input
                      type="color"
                      value={editCatColor}
                      onChange={(e) => setEditCatColor(e.target.value)}
                      aria-label="Category color"
                      className="h-9 w-10 rounded border border-slate-300 dark:border-slate-600"
                    />
                    <input
                      type="text"
                      value={editCatName}
                      autoFocus
                      onChange={(e) => setEditCatName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') void saveCategory(cat.id);
                        if (e.key === 'Escape') setEditCatId(null);
                      }}
                      className="flex-1 min-w-0 px-2 py-1 rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                    />
                    <Button
                      onClick={() => saveCategory(cat.id)}
                      variant="ghost"
                      size="sm"
                      icon={Check}
                      title="Save"
                    />
                    <Button
                      onClick={() => setEditCatId(null)}
                      variant="ghost"
                      size="sm"
                      icon={X}
                      title="Cancel"
                    />
                  </>
                ) : (
                  <>
                    <span
                      className="h-4 w-4 rounded-full flex-shrink-0"
                      style={{ backgroundColor: cat.color || DEFAULT_COLOR }}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-slate-900 dark:text-white truncate">
                        {cat.name}
                      </div>
                      <div className="text-xs text-slate-500 dark:text-slate-400 truncate">
                        /{cat.slug} · {cat.postCount ?? 0} posts
                      </div>
                    </div>
                    <Button
                      onClick={() => {
                        setEditCatId(cat.id);
                        setEditCatName(cat.name);
                        setEditCatColor(cat.color || DEFAULT_COLOR);
                      }}
                      variant="ghost"
                      size="sm"
                      icon={Pencil}
                      title="Edit"
                    />
                    <Button
                      onClick={() => deleteCategory(cat.id, cat.name)}
                      variant="ghost"
                      size="sm"
                      icon={Trash2}
                      className="text-red-600 dark:text-red-400"
                      title="Delete"
                    />
                  </>
                )}
              </li>
            ))}
          </ul>
        </section>

        {/* Tags */}
        <section className="bg-white dark:bg-slate-800 rounded-lg shadow-lg border border-slate-200 dark:border-slate-700 p-5 space-y-4">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">Tags ({tags.length})</h2>

          <div className="flex gap-2 border-b border-slate-200 dark:border-slate-700 pb-4">
            <Input
              type="text"
              value={newTagName}
              onChange={(e) => setNewTagName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && createTag()}
              placeholder="New tag name..."
              fullWidth
            />
            <Button
              onClick={createTag}
              disabled={creatingTag || !newTagName.trim()}
              loading={creatingTag}
              variant="primary"
              icon={Plus}
            >
              Add
            </Button>
          </div>

          <ul className="space-y-2">
            {tags.length === 0 && (
              <li className="text-sm text-slate-500 dark:text-slate-400 py-4 text-center">
                No tags yet.
              </li>
            )}
            {tags.map((tag) => (
              <li
                key={tag.id}
                className="flex items-center gap-3 rounded-lg border border-slate-200 dark:border-slate-700 px-3 py-2"
              >
                {editTagId === tag.id ? (
                  <>
                    <input
                      type="text"
                      value={editTagName}
                      autoFocus
                      onChange={(e) => setEditTagName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') void saveTag(tag.id);
                        if (e.key === 'Escape') setEditTagId(null);
                      }}
                      className="flex-1 min-w-0 px-2 py-1 rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                    />
                    <Button
                      onClick={() => saveTag(tag.id)}
                      variant="ghost"
                      size="sm"
                      icon={Check}
                      title="Save"
                    />
                    <Button
                      onClick={() => setEditTagId(null)}
                      variant="ghost"
                      size="sm"
                      icon={X}
                      title="Cancel"
                    />
                  </>
                ) : (
                  <>
                    <div className="flex-1 min-w-0">
                      <span className="font-medium text-slate-900 dark:text-white">
                        #{tag.name}
                      </span>
                      <span className="text-xs text-slate-500 dark:text-slate-400 ml-2">
                        {tag.useCount ?? 0} uses
                      </span>
                    </div>
                    <Button
                      onClick={() => {
                        setEditTagId(tag.id);
                        setEditTagName(tag.name);
                      }}
                      variant="ghost"
                      size="sm"
                      icon={Pencil}
                      title="Edit"
                    />
                    <Button
                      onClick={() => deleteTag(tag.id, tag.name)}
                      variant="ghost"
                      size="sm"
                      icon={Trash2}
                      className="text-red-600 dark:text-red-400"
                      title="Delete"
                    />
                  </>
                )}
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
}
