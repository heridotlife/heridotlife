'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';

interface AnalyticsData {
  totalUrls: number;
  totalClicks: number;
  averageClicks: number;
  growthPercentage: number;
  topUrls: Array<{
    id: number;
    title: string;
    shortUrl: string;
    clickCount: number;
    originalUrl: string;
    latestClick: string | null;
  }>;
  recentActivity: Array<{
    id: number;
    title: string;
    shortUrl: string;
    clickCount: number;
    latestClick: string | null;
  }>;
  categoryStats: Array<{
    name: string;
    urlCount: number;
    totalClicks: number;
  }>;
  dateRange: string;
}

export default function AnalyticsPage() {
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(
    null,
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [dateRange, setDateRange] = useState('7d');

  const fetchAnalyticsData = useCallback(async () => {
    try {
      setLoading(true);
      setError('');

      const response = await fetch(
        `/api/urls/analytics?dateRange=${dateRange}`,
        {
          credentials: 'include',
        },
      );

      if (!response.ok) {
        throw new Error('Failed to fetch analytics data');
      }

      const result = await response.json();
      setAnalyticsData(result.data);
    } catch (error) {
      setError(
        error instanceof Error ? error.message : 'Failed to fetch analytics',
      );
    } finally {
      setLoading(false);
    }
  }, [dateRange]);

  useEffect(() => {
    fetchAnalyticsData();
  }, [fetchAnalyticsData]);

  if (loading) {
    return (
      <div className='space-y-6'>
        <div className='animate-pulse'>
          <div className='h-8 bg-gray-200 rounded w-1/3 mb-4'></div>
          <div className='grid grid-cols-1 md:grid-cols-4 gap-6 mb-8'>
            {[...Array(4)].map((_, _i) => (
              <div key={_i} className='h-24 bg-gray-200 rounded'></div>
            ))}
          </div>
          <div className='space-y-4'>
            <div className='h-64 bg-gray-200 rounded'></div>
            <div className='h-64 bg-gray-200 rounded'></div>
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
            onClick={fetchAnalyticsData}
            className='px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700'
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (!analyticsData) {
    return (
      <div className='space-y-6'>
        <div className='text-center py-8'>
          <div className='text-gray-600 mb-4'>No analytics data available</div>
          <Link
            href='/dashboard/urls/create'
            className='px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700'
          >
            Create Your First URL
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className='space-y-6'>
      {/* Header */}
      <div className='flex items-center justify-between'>
        <div>
          <h1 className='text-2xl font-bold text-gray-900'>Analytics</h1>
          <p className='text-gray-600'>
            Track your URL performance and insights
          </p>
        </div>
        <div className='flex items-center space-x-2'>
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className='px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
          >
            <option value='7d'>Last 7 days</option>
            <option value='30d'>Last 30 days</option>
            <option value='90d'>Last 90 days</option>
            <option value='1y'>Last year</option>
          </select>
        </div>
      </div>

      {/* Key Metrics */}
      <div className='grid grid-cols-1 md:grid-cols-4 gap-6'>
        <div className='bg-white p-6 rounded-lg shadow-sm border border-gray-200'>
          <div className='flex items-center'>
            <div className='flex-shrink-0'>
              <div className='w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center'>
                <svg
                  className='w-5 h-5 text-blue-600'
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
              </div>
            </div>
            <div className='ml-4'>
              <p className='text-sm font-medium text-gray-500'>Total URLs</p>
              <p className='text-2xl font-bold text-gray-900'>
                {analyticsData.totalUrls}
              </p>
            </div>
          </div>
        </div>

        <div className='bg-white p-6 rounded-lg shadow-sm border border-gray-200'>
          <div className='flex items-center'>
            <div className='flex-shrink-0'>
              <div className='w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center'>
                <svg
                  className='w-5 h-5 text-green-600'
                  fill='none'
                  stroke='currentColor'
                  viewBox='0 0 24 24'
                >
                  <path
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    strokeWidth={2}
                    d='M15 12a3 3 0 11-6 0 3 3 0 016 0z'
                  />
                  <path
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    strokeWidth={2}
                    d='M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z'
                  />
                </svg>
              </div>
            </div>
            <div className='ml-4'>
              <p className='text-sm font-medium text-gray-500'>Total Clicks</p>
              <p className='text-2xl font-bold text-gray-900'>
                {analyticsData.totalClicks.toLocaleString()}
              </p>
            </div>
          </div>
        </div>

        <div className='bg-white p-6 rounded-lg shadow-sm border border-gray-200'>
          <div className='flex items-center'>
            <div className='flex-shrink-0'>
              <div className='w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center'>
                <svg
                  className='w-5 h-5 text-purple-600'
                  fill='none'
                  stroke='currentColor'
                  viewBox='0 0 24 24'
                >
                  <path
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    strokeWidth={2}
                    d='M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z'
                  />
                </svg>
              </div>
            </div>
            <div className='ml-4'>
              <p className='text-sm font-medium text-gray-500'>Avg. Clicks</p>
              <p className='text-2xl font-bold text-gray-900'>
                {analyticsData.averageClicks}
              </p>
            </div>
          </div>
        </div>

        <div className='bg-white p-6 rounded-lg shadow-sm border border-gray-200'>
          <div className='flex items-center'>
            <div className='flex-shrink-0'>
              <div className='w-8 h-8 bg-yellow-100 rounded-lg flex items-center justify-center'>
                <svg
                  className='w-5 h-5 text-yellow-600'
                  fill='none'
                  stroke='currentColor'
                  viewBox='0 0 24 24'
                >
                  <path
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    strokeWidth={2}
                    d='M13 7h8m0 0v8m0-8l-8 8-4-4-6 6'
                  />
                </svg>
              </div>
            </div>
            <div className='ml-4'>
              <p className='text-sm font-medium text-gray-500'>Growth</p>
              <p className='text-2xl font-bold text-gray-900'>+12%</p>
            </div>
          </div>
        </div>
      </div>

      {/* Top Performing URLs */}
      <div className='bg-white shadow rounded-lg'>
        <div className='px-6 py-4 border-b border-gray-200'>
          <h2 className='text-lg font-semibold text-gray-900'>
            Top Performing URLs
          </h2>
        </div>
        <div className='divide-y divide-gray-200'>
          {analyticsData.topUrls.map((url, index) => (
            <div key={url.id} className='px-6 py-4'>
              <div className='flex items-center justify-between'>
                <div className='flex items-center'>
                  <div className='flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center'>
                    <span className='text-sm font-medium text-blue-600'>
                      {index + 1}
                    </span>
                  </div>
                  <div className='ml-4'>
                    <h3 className='text-sm font-medium text-gray-900'>
                      {url.title}
                    </h3>
                    <p className='text-sm text-gray-500'>{url.shortUrl}</p>
                  </div>
                </div>
                <div className='flex items-center space-x-4'>
                  <div className='text-right'>
                    <p className='text-sm font-medium text-gray-900'>
                      {url.clickCount.toLocaleString()}
                    </p>
                    <p className='text-sm text-gray-500'>clicks</p>
                  </div>
                  <Link
                    href={`/dashboard/urls/${url.id}`}
                    className='text-blue-600 hover:text-blue-900 text-sm'
                  >
                    Edit
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Category Performance */}
      <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
        <div className='bg-white shadow rounded-lg'>
          <div className='px-6 py-4 border-b border-gray-200'>
            <h2 className='text-lg font-semibold text-gray-900'>
              Category Performance
            </h2>
          </div>
          <div className='p-6'>
            {analyticsData.categoryStats.map((category, index) => (
              <div
                key={category.name}
                className='flex items-center justify-between py-3'
              >
                <div className='flex items-center'>
                  <div className='w-3 h-3 rounded-full bg-blue-500 mr-3'></div>
                  <span className='text-sm font-medium text-gray-900'>
                    {category.name}
                  </span>
                </div>
                <div className='text-right'>
                  <p className='text-sm font-medium text-gray-900'>
                    {category.totalClicks.toLocaleString()}
                  </p>
                  <p className='text-xs text-gray-500'>
                    {category.urlCount} URLs
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className='bg-white shadow rounded-lg'>
          <div className='px-6 py-4 border-b border-gray-200'>
            <h2 className='text-lg font-semibold text-gray-900'>
              Recent Activity
            </h2>
          </div>
          <div className='p-6'>
            {analyticsData.recentActivity.map((activity) => (
              <div
                key={activity.id}
                className='flex items-center justify-between py-3'
              >
                <div>
                  <p className='text-sm font-medium text-gray-900'>
                    {activity.title}
                  </p>
                  <p className='text-xs text-gray-500'>{activity.shortUrl}</p>
                </div>
                <div className='text-right'>
                  <p className='text-sm text-gray-900'>
                    {activity.clickCount} clicks
                  </p>
                  <p className='text-xs text-gray-500'>
                    {activity.latestClick
                      ? new Date(activity.latestClick).toLocaleDateString()
                      : 'Never'}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
