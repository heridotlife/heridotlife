'use client';

import { Edit, ExternalLink, Power, Trash2 } from 'lucide-react';
import { useEffect, useState } from 'react';

interface ShortUrl {
  id: number;
  shortUrl: string;
  originalUrl: string;
  title: string | null;
  clickCount: number;
  isActive: boolean;
  expiresAt: string | null;
  categories: { id: number; name: string }[];
}

export default function URLsPage() {
  const [urls, setUrls] = useState<ShortUrl[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchUrls();
  }, []);

  const fetchUrls = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/urls');
      if (!response.ok) throw new Error('Failed to fetch URLs');
      const data = await response.json();
      setUrls(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load URLs');
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = async (id: number) => {
    try {
      const response = await fetch(`/api/admin/urls/id/toggle?id=${id}`, {
        method: 'PATCH',
      });
      if (!response.ok) throw new Error('Failed to toggle URL');
      fetchUrls();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to toggle URL');
    }
  };

  const handleDelete = async (id: number, shortUrl: string) => {
    if (!confirm(`Delete URL "/${shortUrl}"?`)) return;

    try {
      const response = await fetch(`/api/admin/urls/id?id=${id}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Failed to delete URL');
      fetchUrls();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to delete URL');
    }
  };

  const filteredUrls = urls.filter(
    (url) =>
      url.shortUrl.toLowerCase().includes(search.toLowerCase()) ||
      url.title?.toLowerCase().includes(search.toLowerCase()) ||
      url.originalUrl.toLowerCase().includes(search.toLowerCase()),
  );

  if (loading) {
    return (
      <div className='flex items-center justify-center min-h-[400px]'>
        <div className='text-sky-600 dark:text-sky-400'>Loading URLs...</div>
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
      <div className='flex items-center justify-between'>
        <div>
          <h1 className='text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-sky-700 via-blue-600 to-cyan-700 dark:from-sky-300 dark:via-cyan-200 dark:to-blue-300'>
            Short URLs
          </h1>
          <p className='text-sky-600 dark:text-sky-400 mt-2'>
            Manage your short URLs
          </p>
        </div>
        <a
          href='/admin/urls/new'
          className='px-6 py-3 rounded-lg bg-gradient-to-r from-sky-500 to-cyan-500 dark:from-sky-600 dark:to-cyan-600 text-white font-medium shadow-lg hover:shadow-xl hover:from-sky-600 hover:to-cyan-600 dark:hover:from-sky-700 dark:hover:to-cyan-700 transition-all duration-300'
        >
          Add New URL
        </a>
      </div>

      {/* Search */}
      <div className='bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-lg shadow-lg border border-sky-200 dark:border-sky-700 p-4'>
        <input
          type='text'
          placeholder='Search URLs...'
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className='w-full px-4 py-2 rounded-lg border border-sky-200 dark:border-sky-700 bg-white dark:bg-slate-900 text-sky-900 dark:text-sky-100 focus:ring-2 focus:ring-sky-500 focus:border-transparent transition-colors duration-200'
        />
      </div>

      {/* URLs Table */}
      <div className='bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-lg shadow-lg border border-sky-200 dark:border-sky-700 overflow-hidden'>
        <div className='overflow-x-auto'>
          <table className='w-full'>
            <thead className='bg-sky-100 dark:bg-sky-900/50'>
              <tr>
                <th className='px-6 py-3 text-left text-xs font-medium text-sky-700 dark:text-sky-300 uppercase tracking-wider'>
                  Short URL
                </th>
                <th className='px-6 py-3 text-left text-xs font-medium text-sky-700 dark:text-sky-300 uppercase tracking-wider'>
                  Original URL
                </th>
                <th className='px-6 py-3 text-left text-xs font-medium text-sky-700 dark:text-sky-300 uppercase tracking-wider'>
                  Clicks
                </th>
                <th className='px-6 py-3 text-left text-xs font-medium text-sky-700 dark:text-sky-300 uppercase tracking-wider'>
                  Status
                </th>
                <th className='px-6 py-3 text-left text-xs font-medium text-sky-700 dark:text-sky-300 uppercase tracking-wider'>
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className='divide-y divide-sky-200 dark:divide-sky-700'>
              {filteredUrls.length > 0 ? (
                filteredUrls.map((url) => (
                  <tr
                    key={url.id}
                    className='hover:bg-sky-50 dark:hover:bg-slate-700/50 transition-colors duration-200'
                  >
                    <td className='px-6 py-4 whitespace-nowrap'>
                      <div>
                        <a
                          href={`/${url.shortUrl}`}
                          target='_blank'
                          className='font-medium text-sky-700 dark:text-sky-300 hover:text-sky-800 dark:hover:text-sky-200 flex items-center gap-1'
                        >
                          /{url.shortUrl}
                          <ExternalLink className='w-3 h-3' />
                        </a>
                        {url.title && (
                          <p className='text-sm text-sky-600 dark:text-sky-400 mt-1'>
                            {url.title}
                          </p>
                        )}
                      </div>
                    </td>
                    <td className='px-6 py-4'>
                      <div className='text-sm text-sky-600 dark:text-sky-400 max-w-xs truncate'>
                        {url.originalUrl}
                      </div>
                      {url.categories.length > 0 && (
                        <div className='flex gap-1 mt-1 flex-wrap'>
                          {url.categories.map((cat) => (
                            <span
                              key={cat.id}
                              className='inline-block px-2 py-0.5 text-xs bg-sky-100 dark:bg-sky-900 text-sky-700 dark:text-sky-300 rounded'
                            >
                              {cat.name}
                            </span>
                          ))}
                        </div>
                      )}
                    </td>
                    <td className='px-6 py-4 whitespace-nowrap text-sm text-sky-600 dark:text-sky-400'>
                      {url.clickCount}
                    </td>
                    <td className='px-6 py-4 whitespace-nowrap'>
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          url.isActive
                            ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300'
                            : 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300'
                        }`}
                      >
                        {url.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className='px-6 py-4 whitespace-nowrap text-sm'>
                      <div className='flex items-center gap-2'>
                        <button
                          onClick={() => handleToggle(url.id)}
                          className='p-1 text-sky-600 dark:text-sky-400 hover:text-sky-800 dark:hover:text-sky-200 transition-colors'
                          title={url.isActive ? 'Deactivate' : 'Activate'}
                        >
                          <Power className='w-4 h-4' />
                        </button>
                        <a
                          href={`/admin/urls/${url.id}/edit`}
                          className='p-1 text-sky-600 dark:text-sky-400 hover:text-sky-800 dark:hover:text-sky-200 transition-colors'
                          title='Edit'
                        >
                          <Edit className='w-4 h-4' />
                        </a>
                        <button
                          onClick={() => handleDelete(url.id, url.shortUrl)}
                          className='p-1 text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-200 transition-colors'
                          title='Delete'
                        >
                          <Trash2 className='w-4 h-4' />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan={5}
                    className='px-6 py-8 text-center text-sky-600 dark:text-sky-400'
                  >
                    {search
                      ? 'No URLs match your search'
                      : 'No URLs yet. Create your first one!'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
