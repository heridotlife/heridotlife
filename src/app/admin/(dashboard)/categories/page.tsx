'use client';

import { useEffect, useState } from 'react';

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
          <input
            type='text'
            value={newCategory}
            onChange={(e) => setNewCategory(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
            placeholder='New category name...'
            className='flex-1 px-4 py-2 rounded-lg border border-sky-200 dark:border-sky-700 bg-white dark:bg-slate-900 text-sky-900 dark:text-sky-100 focus:ring-2 focus:ring-sky-500 focus:border-transparent'
          />
          <button
            onClick={handleCreate}
            disabled={creating || !newCategory.trim()}
            className='px-6 py-2 rounded-lg bg-gradient-to-r from-sky-500 to-cyan-500 dark:from-sky-600 dark:to-cyan-600 text-white font-medium shadow-lg hover:shadow-xl hover:from-sky-600 hover:to-cyan-600 dark:hover:from-sky-700 dark:hover:to-cyan-700 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed'
          >
            {creating ? 'Creating...' : 'Add Category'}
          </button>
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
              <h3 className='text-xl font-bold text-sky-900 dark:text-sky-100 mb-4'>
                {category.name}
              </h3>
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
