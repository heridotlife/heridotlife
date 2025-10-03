'use client';

import { useRouter } from 'next/navigation';
import { FormEvent, useEffect, useState } from 'react';

interface Category {
  id: number;
  name: string;
}

interface URLFormProps {
  urlId?: number;
}

export default function URLForm({ urlId }: URLFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [formData, setFormData] = useState({
    shortUrl: '',
    originalUrl: '',
    title: '',
    categoryIds: [] as number[],
    expiresAt: '',
    isActive: true,
  });
  const [error, setError] = useState('');

  useEffect(() => {
    fetchCategories();
    if (urlId) {
      fetchUrl();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [urlId]);

  const fetchCategories = async () => {
    try {
      const response = await fetch('/api/admin/categories');
      if (response.ok) {
        const data = await response.json();
        setCategories(data);
      }
    } catch {
      // Silent fail, categories are optional
    }
  };

  const fetchUrl = async () => {
    try {
      const response = await fetch(`/api/admin/urls/id?id=${urlId}`);
      if (!response.ok) throw new Error('Failed to fetch URL');
      const data = await response.json();
      setFormData({
        shortUrl: data.shortUrl,
        originalUrl: data.originalUrl,
        title: data.title || '',
        categoryIds: data.categories.map((c: Category) => c.id),
        expiresAt: data.expiresAt
          ? new Date(data.expiresAt).toISOString().slice(0, 16)
          : '',
        isActive: data.isActive,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load URL');
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const payload = {
        ...formData,
        expiresAt: formData.expiresAt || null,
      };

      const response = await fetch(
        urlId ? `/api/admin/urls/id?id=${urlId}` : '/api/admin/urls',
        {
          method: urlId ? 'PUT' : 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        },
      );

      const data = await response.json();

      if (response.ok) {
        router.push('/admin/urls');
      } else {
        setError(data.error || 'Failed to save URL');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleCategoryToggle = (categoryId: number) => {
    setFormData((prev) => ({
      ...prev,
      categoryIds: prev.categoryIds.includes(categoryId)
        ? prev.categoryIds.filter((id) => id !== categoryId)
        : [...prev.categoryIds, categoryId],
    }));
  };

  return (
    <form onSubmit={handleSubmit} className='space-y-6'>
      {error && (
        <div className='p-4 bg-red-100 dark:bg-red-900/30 border border-red-200 dark:border-red-700 rounded-lg text-red-700 dark:text-red-300'>
          {error}
        </div>
      )}

      <div>
        <label
          htmlFor='shortUrl'
          className='block text-sm font-medium text-sky-700 dark:text-sky-300 mb-2'
        >
          Short URL Slug *
        </label>
        <div className='flex items-center'>
          <span className='text-sky-600 dark:text-sky-400 mr-1'>/</span>
          <input
            id='shortUrl'
            type='text'
            value={formData.shortUrl}
            onChange={(e) =>
              setFormData({ ...formData, shortUrl: e.target.value })
            }
            className='flex-1 px-4 py-2 rounded-lg border border-sky-200 dark:border-sky-700 bg-white dark:bg-slate-900 text-sky-900 dark:text-sky-100 focus:ring-2 focus:ring-sky-500 focus:border-transparent'
            placeholder='my-link'
            required
          />
        </div>
      </div>

      <div>
        <label
          htmlFor='originalUrl'
          className='block text-sm font-medium text-sky-700 dark:text-sky-300 mb-2'
        >
          Original URL *
        </label>
        <input
          id='originalUrl'
          type='url'
          value={formData.originalUrl}
          onChange={(e) =>
            setFormData({ ...formData, originalUrl: e.target.value })
          }
          className='w-full px-4 py-2 rounded-lg border border-sky-200 dark:border-sky-700 bg-white dark:bg-slate-900 text-sky-900 dark:text-sky-100 focus:ring-2 focus:ring-sky-500 focus:border-transparent'
          placeholder='https://example.com'
          required
        />
      </div>

      <div>
        <label
          htmlFor='title'
          className='block text-sm font-medium text-sky-700 dark:text-sky-300 mb-2'
        >
          Title (Optional)
        </label>
        <input
          id='title'
          type='text'
          value={formData.title}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          className='w-full px-4 py-2 rounded-lg border border-sky-200 dark:border-sky-700 bg-white dark:bg-slate-900 text-sky-900 dark:text-sky-100 focus:ring-2 focus:ring-sky-500 focus:border-transparent'
          placeholder='Descriptive title'
        />
      </div>

      {categories.length > 0 && (
        <div>
          <label className='block text-sm font-medium text-sky-700 dark:text-sky-300 mb-2'>
            Categories
          </label>
          <div className='flex flex-wrap gap-2'>
            {categories.map((category) => (
              <button
                key={category.id}
                type='button'
                onClick={() => handleCategoryToggle(category.id)}
                className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                  formData.categoryIds.includes(category.id)
                    ? 'bg-sky-500 dark:bg-sky-600 text-white'
                    : 'bg-sky-100 dark:bg-sky-900 text-sky-700 dark:text-sky-300 hover:bg-sky-200 dark:hover:bg-sky-800'
                }`}
              >
                {category.name}
              </button>
            ))}
          </div>
        </div>
      )}

      <div>
        <label
          htmlFor='expiresAt'
          className='block text-sm font-medium text-sky-700 dark:text-sky-300 mb-2'
        >
          Expires At (Optional)
        </label>
        <input
          id='expiresAt'
          type='datetime-local'
          value={formData.expiresAt}
          onChange={(e) =>
            setFormData({ ...formData, expiresAt: e.target.value })
          }
          className='w-full px-4 py-2 rounded-lg border border-sky-200 dark:border-sky-700 bg-white dark:bg-slate-900 text-sky-900 dark:text-sky-100 focus:ring-2 focus:ring-sky-500 focus:border-transparent'
        />
      </div>

      <div className='flex items-center'>
        <input
          id='isActive'
          type='checkbox'
          checked={formData.isActive}
          onChange={(e) =>
            setFormData({ ...formData, isActive: e.target.checked })
          }
          className='w-4 h-4 text-sky-600 bg-white dark:bg-slate-900 border-sky-300 dark:border-sky-700 rounded focus:ring-sky-500'
        />
        <label
          htmlFor='isActive'
          className='ml-2 text-sm font-medium text-sky-700 dark:text-sky-300'
        >
          Active
        </label>
      </div>

      <div className='flex gap-4'>
        <button
          type='submit'
          disabled={loading}
          className='flex-1 px-6 py-3 rounded-lg bg-gradient-to-r from-sky-500 to-cyan-500 dark:from-sky-600 dark:to-cyan-600 text-white font-medium shadow-lg hover:shadow-xl hover:from-sky-600 hover:to-cyan-600 dark:hover:from-sky-700 dark:hover:to-cyan-700 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed'
        >
          {loading ? 'Saving...' : urlId ? 'Update URL' : 'Create URL'}
        </button>
        <button
          type='button'
          onClick={() => router.push('/admin/urls')}
          className='flex-1 px-6 py-3 rounded-lg border border-sky-300 dark:border-sky-700 text-sky-700 dark:text-sky-300 font-medium hover:bg-sky-50 dark:hover:bg-slate-700 transition-colors duration-200'
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
