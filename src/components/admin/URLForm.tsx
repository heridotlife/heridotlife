'use client';

import { type FormEvent, useEffect, useState } from 'react';
import Button from '../ui/Button';
import Input from '../ui/Input';

interface Category {
  id: number;
  name: string;
}

interface URLFormProps {
  urlId?: number;
}

interface ShortUrlData {
  shortUrl: string;
  originalUrl: string;
  title?: string | null;
  categories: Category[];
  expiresAt?: number | null;
  isActive: boolean;
}

export default function URLForm({ urlId }: URLFormProps) {
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [formData, setFormData] = useState({
    slug: '',
    originalUrl: '',
    title: '',
    categoryIds: [] as number[],
    expiresAt: '',
    active: true,
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
        const data = await response.json() as Category[];
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
      const data = await response.json() as ShortUrlData;
      setFormData({
        slug: data.shortUrl,
        originalUrl: data.originalUrl,
        title: data.title || '',
        categoryIds: data.categories.map((c: Category) => c.id),
        expiresAt: data.expiresAt
          ? new Date(data.expiresAt).toISOString().slice(0, 16)
          : '',
        active: data.isActive,
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

      const data = await response.json() as { error?: string };

      if (response.ok) {
        window.location.href = '/admin/urls';
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
        <div className='flex items-center gap-2'>
          <span className='text-sky-600 dark:text-sky-400'>/</span>
          <Input
            id='slug'
            label='Short URL Slug'
            type='text'
            value={formData.slug}
            onChange={(e) =>
              setFormData({ ...formData, slug: e.target.value })
            }
            placeholder='my-link'
            required
            fullWidth
          />
        </div>
      </div>

      <Input
        id='originalUrl'
        label='Original URL'
        type='url'
        value={formData.originalUrl}
        onChange={(e) =>
          setFormData({ ...formData, originalUrl: e.target.value })
        }
        placeholder='https://example.com'
        required
        fullWidth
      />

      <Input
        id='title'
        label='Title (Optional)'
        type='text'
        value={formData.title}
        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
        placeholder='Descriptive title'
        fullWidth
      />

      {categories.length > 0 && (
        <div>
          <label className='block text-sm font-medium text-sky-700 dark:text-sky-300 mb-2'>
            Categories
          </label>
          <div className='flex flex-wrap gap-2'>
            {categories.map((category) => (
              <Button
                key={category.id}
                type='button'
                variant={formData.categoryIds.includes(category.id) ? 'primary' : 'secondary'}
                size='sm'
                onClick={() => handleCategoryToggle(category.id)}
              >
                {category.name}
              </Button>
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
        <Input
          id='expiresAt'
          type='datetime-local'
          value={formData.expiresAt}
          onChange={(e) =>
            setFormData({ ...formData, expiresAt: e.target.value })
          }
          fullWidth
        />
      </div>

      <div className='flex items-center'>
        <input
          id='active'
          type='checkbox'
          checked={formData.active}
          onChange={(e) =>
            setFormData({ ...formData, active: e.target.checked })
          }
          className='w-4 h-4 text-sky-600 bg-white dark:bg-slate-900 border-sky-300 dark:border-sky-700 rounded focus:ring-sky-500'
        />
        <label
          htmlFor='active'
          className='ml-2 text-sm font-medium text-sky-700 dark:text-sky-300'
        >
          Active
        </label>
      </div>

      <div className='flex gap-4'>
        <Button
          type='submit'
          variant='primary'
          size='lg'
          loading={loading}
          fullWidth
        >
          {urlId ? 'Update URL' : 'Create URL'}
        </Button>
        <Button
          type='button'
          variant='outline'
          size='lg'
          onClick={() => (window.location.href = '/admin/urls')}
          fullWidth
        >
          Cancel
        </Button>
      </div>
    </form>
  );
}
