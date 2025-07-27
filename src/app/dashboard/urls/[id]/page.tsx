'use client';

import { useParams, useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';

import UrlForm from '@/components/dashboard/UrlForm';

interface UrlData {
  id: number;
  shortUrl: string;
  originalUrl: string;
  title: string;
  clickCount: number;
  latestClick: Date | null;
  createdAt: Date;
  categories: Array<{
    id: number;
    name: string;
  }>;
}

export default function EditUrlPage() {
  const params = useParams();
  const router = useRouter();
  const [urlData, setUrlData] = useState<UrlData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');

  const fetchUrlData = useCallback(async () => {
    try {
      setLoading(true);
      setError('');

      const response = await fetch(`/api/urls/${params.id}`, {
        credentials: 'include',
      });

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('URL not found');
        }
        throw new Error('Failed to fetch URL data');
      }

      const data = await response.json();
      setUrlData(data.data);
    } catch (error) {
      setError(
        error instanceof Error ? error.message : 'Failed to fetch URL data',
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUrlData();
  }, [fetchUrlData]);

  if (loading) {
    return (
      <div className='space-y-6'>
        <div className='animate-pulse'>
          <div className='h-8 bg-gray-200 rounded w-1/3 mb-4'></div>
          <div className='h-4 bg-gray-200 rounded w-1/2 mb-8'></div>
          <div className='space-y-4'>
            <div className='h-12 bg-gray-200 rounded'></div>
            <div className='h-12 bg-gray-200 rounded'></div>
            <div className='h-12 bg-gray-200 rounded'></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className='space-y-6'>
        <div className='text-center py-8'>
          <div className='text-red-600 mb-4'>{error}</div>
          <button
            onClick={() => router.back()}
            className='px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700'
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  if (!urlData) {
    return (
      <div className='space-y-6'>
        <div className='text-center py-8'>
          <div className='text-gray-600 mb-4'>URL not found</div>
          <button
            onClick={() => router.back()}
            className='px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700'
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className='space-y-6'>
      {/* Header */}
      <div>
        <h1 className='text-2xl font-bold text-gray-900'>Edit URL</h1>
        <p className='text-gray-600'>Update your short URL settings</p>
      </div>

      {/* URL Stats */}
      <div className='bg-white shadow rounded-lg p-6'>
        <div className='grid grid-cols-1 md:grid-cols-3 gap-4 mb-6'>
          <div className='text-center'>
            <div className='text-2xl font-bold text-blue-600'>
              {urlData.clickCount}
            </div>
            <div className='text-sm text-gray-500'>Total Clicks</div>
          </div>
          <div className='text-center'>
            <div className='text-lg font-medium text-gray-900'>
              {urlData.shortUrl}
            </div>
            <div className='text-sm text-gray-500'>Short URL</div>
          </div>
          <div className='text-center'>
            <div className='text-sm text-gray-900'>
              {new Date(urlData.createdAt).toLocaleDateString()}
            </div>
            <div className='text-sm text-gray-500'>Created</div>
          </div>
        </div>
      </div>

      {/* Edit Form */}
      <div className='bg-white shadow rounded-lg p-6'>
        <UrlForm
          urlId={urlData.id}
          initialData={{
            originalUrl: urlData.originalUrl,
            shortUrl: urlData.shortUrl,
            title: urlData.title,
            categoryIds: urlData.categories.map((cat) => cat.id),
          }}
        />
      </div>
    </div>
  );
}
