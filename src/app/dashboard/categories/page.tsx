'use client';

import { useState } from 'react';

import CategoryList from '@/components/dashboard/CategoryList';

export default function CategoriesPage() {
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(
    null,
  );
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState('');

  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newCategoryName.trim()) {
      setError('Category name is required');
      return;
    }

    try {
      setCreating(true);
      setError('');

      const response = await fetch('/api/categories', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ name: newCategoryName.trim() }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create category');
      }

      // Reset form
      setNewCategoryName('');
      setShowCreateForm(false);

      // Refresh the page to show new category
      window.location.reload();
    } catch (error) {
      setError(
        error instanceof Error ? error.message : 'Failed to create category',
      );
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className='space-y-6'>
      {/* Header */}
      <div className='flex items-center justify-between'>
        <div>
          <h1 className='text-2xl font-bold text-gray-900'>Categories</h1>
          <p className='text-gray-600'>Organize your URLs with categories</p>
        </div>
        <button
          onClick={() => setShowCreateForm(!showCreateForm)}
          className='px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700'
        >
          {showCreateForm ? 'Cancel' : 'Add Category'}
        </button>
      </div>

      {/* Create Category Form */}
      {showCreateForm && (
        <div className='bg-white shadow rounded-lg p-6'>
          <h2 className='text-lg font-semibold text-gray-900 mb-4'>
            Create New Category
          </h2>

          {error && (
            <div className='p-4 bg-red-50 border border-red-200 rounded-md mb-4'>
              <p className='text-sm text-red-600'>{error}</p>
            </div>
          )}

          <form onSubmit={handleCreateCategory} className='space-y-4'>
            <div>
              <label
                htmlFor='categoryName'
                className='block text-sm font-medium text-gray-700 mb-2'
              >
                Category Name
              </label>
              <input
                type='text'
                id='categoryName'
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
                placeholder='Enter category name'
                disabled={creating}
              />
            </div>

            <div className='flex items-center space-x-3'>
              <button
                type='submit'
                disabled={creating || !newCategoryName.trim()}
                className='px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50'
              >
                {creating ? 'Creating...' : 'Create Category'}
              </button>
              <button
                type='button'
                onClick={() => {
                  setShowCreateForm(false);
                  setNewCategoryName('');
                  setError('');
                }}
                className='px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200'
                disabled={creating}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Categories List */}
      <div className='bg-white shadow rounded-lg p-6'>
        <h2 className='text-lg font-semibold text-gray-900 mb-4'>
          Your Categories
        </h2>
        <CategoryList
          onCategorySelect={setSelectedCategoryId}
          selectedCategoryId={selectedCategoryId || undefined}
        />
      </div>

      {/* Category Details */}
      {selectedCategoryId && (
        <div className='bg-white shadow rounded-lg p-6'>
          <h2 className='text-lg font-semibold text-gray-900 mb-4'>
            Category Details
          </h2>
          <p className='text-gray-600'>Category ID: {selectedCategoryId}</p>
          <p className='text-sm text-gray-500 mt-2'>
            Click on a category above to view its details and manage its URLs.
          </p>
        </div>
      )}
    </div>
  );
}
