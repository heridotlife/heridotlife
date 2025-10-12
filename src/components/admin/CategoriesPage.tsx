'use client';

import { useEffect, useState } from 'react';
import { Pencil, Trash2, X, Check } from '../ui/icons';
import Button from '../ui/Button';
import Input from '../ui/Input';

interface Category {
  id: number;
  name: string;
  clickCount: number;
  _count: {
    shortUrls: number;
  };
}

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newCategory, setNewCategory] = useState('');
  const [creating, setCreating] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editName, setEditName] = useState('');
  const [deleting, setDeleting] = useState<number | null>(null);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/categories');
      if (!response.ok) throw new Error('Failed to fetch categories');
      const data = await response.json();
      setCategories(data);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to load categories',
      );
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    if (!newCategory.trim()) return;

    try {
      setCreating(true);
      const response = await fetch('/api/admin/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newCategory.trim() }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to create category');
      }

      setNewCategory('');
      fetchCategories();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to create category');
    } finally {
      setCreating(false);
    }
  };

  const handleEdit = (category: Category) => {
    setEditingId(category.id);
    setEditName(category.name);
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditName('');
  };

  const handleSaveEdit = async (id: number) => {
    if (!editName.trim()) return;

    try {
      const response = await fetch(`/api/admin/categories/id?id=${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: editName.trim() }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to update category');
      }

      setEditingId(null);
      setEditName('');
      fetchCategories();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to update category');
    }
  };

  const handleDelete = async (id: number, name: string) => {
    if (!confirm(`Are you sure you want to delete the category "${name}"? This will remove it from all associated URLs.`)) {
      return;
    }

    try {
      setDeleting(id);
      const response = await fetch(`/api/admin/categories/id?id=${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to delete category');
      }

      fetchCategories();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to delete category');
    } finally {
      setDeleting(null);
    }
  };

  if (loading) {
    return (
      <div className='flex items-center justify-center min-h-[400px]'>
        <div className='text-sky-600 dark:text-sky-400'>
          Loading categories...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className='flex items-center justify-center min-h-[400px]'>
        <div className='text-red-600 dark:text-red-400'>{error}</div>
      </div>
    );
  }

  return (
    <div className='space-y-6'>
      {/* Header */}
      <div>
        <h1 className='text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-sky-700 via-blue-600 to-cyan-700 dark:from-sky-300 dark:via-cyan-200 dark:to-blue-300'>
          Categories
        </h1>
        <p className='text-sky-600 dark:text-sky-400 mt-2'>
          Organize your short URLs with categories
        </p>
      </div>

      {/* Add Category */}
      <div className='bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-lg shadow-lg border border-sky-200 dark:border-sky-700 p-4'>
        <div className='flex gap-4'>
          <Input
            type='text'
            value={newCategory}
            onChange={(e) => setNewCategory(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
            placeholder='New category name...'
            fullWidth
          />
          <Button
            onClick={handleCreate}
            disabled={creating || !newCategory.trim()}
            variant='primary'
            loading={creating}
          >
            Add Category
          </Button>
        </div>
      </div>

      {/* Categories Grid */}
      <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'>
        {categories.length > 0 ? (
          categories.map((category) => (
            <div
              key={category.id}
              className='bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-lg shadow-lg border border-sky-200 dark:border-sky-700 p-6 hover:shadow-xl transition-shadow duration-300'
            >
              {editingId === category.id ? (
                // Edit mode
                <div className='space-y-4'>
                  <Input
                    type='text'
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleSaveEdit(category.id);
                      if (e.key === 'Escape') handleCancelEdit();
                    }}
                    fullWidth
                    autoFocus
                  />
                  <div className='flex gap-2'>
                    <Button
                      onClick={() => handleSaveEdit(category.id)}
                      variant='primary'
                      size='sm'
                      icon={Check}
                      iconPosition='left'
                      fullWidth
                    >
                      Save
                    </Button>
                    <Button
                      onClick={handleCancelEdit}
                      variant='secondary'
                      size='sm'
                      icon={X}
                      iconPosition='left'
                      fullWidth
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                // View mode
                <>
                  <div className='flex items-start justify-between mb-4'>
                    <h3 className='text-xl font-bold text-sky-900 dark:text-sky-100 flex-1'>
                      {category.name}
                    </h3>
                    <div className='flex gap-2'>
                      <Button
                        onClick={() => handleEdit(category)}
                        variant='ghost'
                        size='sm'
                        icon={Pencil}
                        title='Edit category'
                      />
                      <Button
                        onClick={() => handleDelete(category.id, category.name)}
                        disabled={deleting === category.id}
                        variant='ghost'
                        size='sm'
                        icon={Trash2}
                        className='text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-200'
                        title='Delete category'
                      />
                    </div>
                  </div>
                  <div className='space-y-2'>
                    <div className='flex items-center justify-between text-sm'>
                      <span className='text-sky-600 dark:text-sky-400'>URLs:</span>
                      <span className='font-semibold text-sky-700 dark:text-sky-300'>
                        {category._count.shortUrls}
                      </span>
                    </div>
                    <div className='flex items-center justify-between text-sm'>
                      <span className='text-sky-600 dark:text-sky-400'>
                        Clicks:
                      </span>
                      <span className='font-semibold text-sky-700 dark:text-sky-300'>
                        {category.clickCount}
                      </span>
                    </div>
                  </div>
                </>
              )}
            </div>
          ))
        ) : (
          <div className='col-span-full text-center py-12 text-sky-600 dark:text-sky-400'>
            No categories yet. Create your first one above!
          </div>
        )}
      </div>
    </div>
  );
}
