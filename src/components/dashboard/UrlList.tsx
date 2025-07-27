'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

interface Category {
  id: number;
  name: string;
}

interface ShortUrl {
  id: number;
  shortUrl: string;
  originalUrl: string;
  title: string;
  clickCount: number;
  latestClick: Date | null;
  createdAt: Date;
  categories: Category[];
}

interface UrlListProps {
  className?: string;
}

export default function UrlList({ className = '' }: UrlListProps) {
  const [urls, setUrls] = useState<ShortUrl[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [search, setSearch] = useState('');
  const [_categoryFilter, setCategoryFilter] = useState('');
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState('desc');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalUrls, setTotalUrls] = useState(0);

  useEffect(() => {
    fetchUrls();
  }, [search, _categoryFilter, sortBy, sortOrder, page]);

  const fetchUrls = async () => {
    try {
      setLoading(true);
      setError('');

      const params = new URLSearchParams({
        page: page.toString(),
        limit: '10',
        ...(search && { search }),
        ...(_categoryFilter && { categoryId: _categoryFilter }),
        sortBy,
        sortOrder,
      });

      const response = await fetch(`/api/urls?${params}`, {
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Failed to fetch URLs');
      }

      const data = await response.json();
      setUrls(data.data);
      setTotalPages(data.pagination.totalPages);
      setTotalUrls(data.pagination.total);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to fetch URLs');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (urlId: number) => {
    if (!confirm('Are you sure you want to delete this URL?')) {
      return;
    }

    try {
      const response = await fetch(`/api/urls/${urlId}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Failed to delete URL');
      }

      // Refresh the list
      fetchUrls();
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to delete URL');
    }
  };

  const copyToClipboard = async (shortUrl: string) => {
    try {
      await navigator.clipboard.writeText(
        `${window.location.origin}/${shortUrl}`,
      );
      // You could add a toast notification here
    } catch (error) {
      console.error('Failed to copy to clipboard:', error);
    }
  };

  if (loading && urls.length === 0) {
    return (
      <div className={`space-y-4 ${className}`}>
        <div className='animate-pulse'>
          {[...Array(5)].map((_, i) => (
            <div key={i} className='bg-gray-200 h-16 rounded-md mb-4' />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`text-center py-8 ${className}`}>
        <div className='text-red-600 mb-4'>{error}</div>
        <button
          onClick={fetchUrls}
          className='px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700'
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Filters */}
      <div className='flex flex-col sm:flex-row gap-4'>
        <div className='flex-1'>
          <input
            type='text'
            placeholder='Search URLs...'
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
          />
        </div>
        <div className='flex gap-2'>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className='px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
          >
            <option value='createdAt'>Date Created</option>
            <option value='title'>Title</option>
            <option value='clickCount'>Clicks</option>
          </select>
          <select
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value)}
            className='px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
          >
            <option value='desc'>Descending</option>
            <option value='asc'>Ascending</option>
          </select>
        </div>
      </div>

      {/* URL List */}
      {urls.length === 0 ? (
        <div className='text-center py-8'>
          <svg
            className='mx-auto h-12 w-12 text-gray-400'
            fill='none'
            stroke='currentColor'
            viewBox='0 0 24 24'
          >
            <path
              strokeLinecap='round'
              strokeLinejoin='round'
              strokeWidth={2}
              d='M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1'
            />
          </svg>
          <h3 className='mt-2 text-sm font-medium text-gray-900'>
            No URLs found
          </h3>
          <p className='mt-1 text-sm text-gray-500'>
            Get started by creating your first short URL.
          </p>
          <div className='mt-6'>
            <Link
              href='/dashboard/urls/create'
              className='inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700'
            >
              Create URL
            </Link>
          </div>
        </div>
      ) : (
        <div className='bg-white shadow overflow-hidden sm:rounded-md'>
          <ul className='divide-y divide-gray-200'>
            {urls.map((url) => (
              <li key={url.id} className='px-6 py-4'>
                <div className='flex items-center justify-between'>
                  <div className='flex-1 min-w-0'>
                    <div className='flex items-center justify-between'>
                      <div className='flex-1'>
                        <h3 className='text-sm font-medium text-gray-900 truncate'>
                          {url.title}
                        </h3>
                        <p className='text-sm text-gray-500 truncate'>
                          {url.originalUrl}
                        </p>
                        <div className='flex items-center mt-1 space-x-4'>
                          <span className='text-xs text-gray-400'>
                            {url.shortUrl}
                          </span>
                          <span className='text-xs text-gray-400'>
                            {url.clickCount} clicks
                          </span>
                          {url.categories.length > 0 && (
                            <div className='flex space-x-1'>
                              {url.categories.map((category) => (
                                <span
                                  key={category.id}
                                  className='inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800'
                                >
                                  {category.name}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className='flex items-center space-x-2 ml-4'>
                    <button
                      onClick={() => copyToClipboard(url.shortUrl)}
                      className='text-gray-400 hover:text-gray-600'
                      title='Copy to clipboard'
                    >
                      <svg
                        className='w-5 h-5'
                        fill='none'
                        stroke='currentColor'
                        viewBox='0 0 24 24'
                      >
                        <path
                          strokeLinecap='round'
                          strokeLinejoin='round'
                          strokeWidth={2}
                          d='M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z'
                        />
                      </svg>
                    </button>
                    <Link
                      href={`/dashboard/urls/${url.id}`}
                      className='text-blue-600 hover:text-blue-900'
                    >
                      Edit
                    </Link>
                    <button
                      onClick={() => handleDelete(url.id)}
                      className='text-red-600 hover:text-red-900'
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className='flex items-center justify-between'>
          <div className='text-sm text-gray-700'>
            Showing {(page - 1) * 10 + 1} to {Math.min(page * 10, totalUrls)} of{' '}
            {totalUrls} results
          </div>
          <div className='flex space-x-2'>
            <button
              onClick={() => setPage(page - 1)}
              disabled={page === 1}
              className='px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed'
            >
              Previous
            </button>
            <button
              onClick={() => setPage(page + 1)}
              disabled={page === totalPages}
              className='px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed'
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
