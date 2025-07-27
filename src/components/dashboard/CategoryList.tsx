'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

interface Category {
  id: number;
  name: string;
  clickCount: number;
  shortUrls: Array<{
    id: number;
    title: string;
    shortUrl: string;
    clickCount: number;
    createdAt: string;
  }>;
}

interface CategoryListProps {
  onCategorySelect?: (categoryId: number) => void;
  selectedCategoryId?: number;
}

export default function CategoryList({
  onCategorySelect,
  selectedCategoryId,
}: CategoryListProps) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [editingCategory, setEditingCategory] = useState<number | null>(null);
  const [editName, setEditName] = useState('');

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      setError('');

      const response = await fetch('/api/categories', {
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Failed to fetch categories');
      }

      const result = await response.json();
      setCategories(result.data);
    } catch (error) {
      setError(
        error instanceof Error ? error.message : 'Failed to fetch categories',
      );
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (category: Category) => {
    setEditingCategory(category.id);
    setEditName(category.name);
  };

  const handleSave = async (categoryId: number) => {
    try {
      const response = await fetch(`/api/categories/${categoryId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ name: editName }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update category');
      }

      // Refresh categories
      await fetchCategories();
      setEditingCategory(null);
      setEditName('');
    } catch (error) {
      setError(
        error instanceof Error ? error.message : 'Failed to update category',
      );
    }
  };

  const handleDelete = async (categoryId: number) => {
    if (
      !confirm(
        'Are you sure you want to delete this category? This will remove it from all associated URLs.',
      )
    ) {
      return;
    }

    try {
      const response = await fetch(`/api/categories/${categoryId}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete category');
      }

      // Refresh categories
      await fetchCategories();
    } catch (error) {
      setError(
        error instanceof Error ? error.message : 'Failed to delete category',
      );
    }
  };

  const handleCancel = () => {
    setEditingCategory(null);
    setEditName('');
  };

  if (loading) {
    return (
      <div className='space-y-4'>
        <div className='animate-pulse'>
          {[...Array(3)].map((_, i) => (
            <div key={i} className='h-16 bg-gray-200 rounded mb-4'></div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className='text-center py-8'>
        <div className='text-red-600 mb-4'>{error}</div>
        <button
          onClick={fetchCategories}
          className='px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700'
        >
          Try Again
        </button>
      </div>
    );
  }

  if (categories.length === 0) {
    return (
      <div className='text-center py-8'>
        <div className='text-gray-600 mb-4'>No categories found</div>
        <Link
          href='/dashboard/urls/create'
          className='px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700'
        >
          Create Your First URL
        </Link>
      </div>
    );
  }

  return (
    <div className='space-y-4'>
      {error && (
        <div className='p-4 bg-red-50 border border-red-200 rounded-md'>
          <p className='text-sm text-red-600'>{error}</p>
        </div>
      )}

      {categories.map((category) => (
        <div
          key={category.id}
          className={`bg-white border rounded-lg p-4 hover:shadow-md transition-shadow ${
            selectedCategoryId === category.id ? 'ring-2 ring-blue-500' : ''
          }`}
        >
          <div className='flex items-center justify-between'>
            <div className='flex-1'>
              {editingCategory === category.id ? (
                <div className='flex items-center space-x-2'>
                  <input
                    type='text'
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className='flex-1 px-3 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
                    autoFocus
                  />
                  <button
                    onClick={() => handleSave(category.id)}
                    className='px-3 py-1 text-sm bg-green-600 text-white rounded-md hover:bg-green-700'
                  >
                    Save
                  </button>
                  <button
                    onClick={handleCancel}
                    className='px-3 py-1 text-sm bg-gray-600 text-white rounded-md hover:bg-gray-700'
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <div className='flex items-center justify-between'>
                  <div className='flex items-center space-x-3'>
                    <button
                      onClick={() => onCategorySelect?.(category.id)}
                      className='text-left'
                    >
                      <h3 className='text-lg font-medium text-gray-900'>
                        {category.name}
                      </h3>
                      <p className='text-sm text-gray-500'>
                        {category.shortUrls.length} URLs • {category.clickCount}{' '}
                        total clicks
                      </p>
                    </button>
                  </div>
                  <div className='flex items-center space-x-2'>
                    <button
                      onClick={() => handleEdit(category)}
                      className='px-3 py-1 text-sm text-blue-600 hover:text-blue-900'
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(category.id)}
                      className='px-3 py-1 text-sm text-red-600 hover:text-red-900'
                    >
                      Delete
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {category.shortUrls.length > 0 && (
            <div className='mt-3 pt-3 border-t border-gray-200'>
              <h4 className='text-sm font-medium text-gray-700 mb-2'>
                Recent URLs:
              </h4>
              <div className='space-y-1'>
                {category.shortUrls.slice(0, 3).map((url) => (
                  <div
                    key={url.id}
                    className='flex items-center justify-between text-sm'
                  >
                    <span className='text-gray-600'>
                      {url.title || url.shortUrl}
                    </span>
                    <span className='text-gray-500'>
                      {url.clickCount} clicks
                    </span>
                  </div>
                ))}
                {category.shortUrls.length > 3 && (
                  <div className='text-xs text-gray-500'>
                    +{category.shortUrls.length - 3} more URLs
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
