import { Metadata } from 'next';
import Link from 'next/link';

import Button from '@/components/buttons/Button';

export const metadata: Metadata = {
  title: 'Dashboard Overview | heridotlife',
  description: 'View your URL shortener statistics and recent activity',
};

export default function DashboardPage() {
  return (
    <div className='space-y-6'>
      {/* Header */}
      <div className='flex items-center justify-between'>
        <div>
          <h1 className='text-2xl font-bold text-gray-900'>Dashboard</h1>
          <p className='text-gray-600'>
            Welcome back! Here's what's happening with your URLs.
          </p>
        </div>
        <Link href='/dashboard/urls/create'>
          <Button>Create New URL</Button>
        </Link>
      </div>

      {/* Stats Grid */}
      <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6'>
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
              <p className='text-2xl font-bold text-gray-900'>0</p>
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
              <p className='text-2xl font-bold text-gray-900'>0</p>
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
                    d='M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z'
                  />
                </svg>
              </div>
            </div>
            <div className='ml-4'>
              <p className='text-sm font-medium text-gray-500'>Categories</p>
              <p className='text-2xl font-bold text-gray-900'>0</p>
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
                    d='M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z'
                  />
                </svg>
              </div>
            </div>
            <div className='ml-4'>
              <p className='text-sm font-medium text-gray-500'>This Month</p>
              <p className='text-2xl font-bold text-gray-900'>0</p>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className='bg-white p-6 rounded-lg shadow-sm border border-gray-200'>
        <h2 className='text-lg font-semibold text-gray-900 mb-4'>
          Quick Actions
        </h2>
        <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
          <Link href='/dashboard/urls/create'>
            <div className='p-4 border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-colors cursor-pointer'>
              <div className='flex items-center'>
                <div className='w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center'>
                  <svg
                    className='w-6 h-6 text-blue-600'
                    fill='none'
                    stroke='currentColor'
                    viewBox='0 0 24 24'
                  >
                    <path
                      strokeLinecap='round'
                      strokeLinejoin='round'
                      strokeWidth={2}
                      d='M12 4v16m8-8H4'
                    />
                  </svg>
                </div>
                <div className='ml-3'>
                  <p className='text-sm font-medium text-gray-900'>
                    Create URL
                  </p>
                  <p className='text-sm text-gray-500'>Add a new short URL</p>
                </div>
              </div>
            </div>
          </Link>

          <Link href='/dashboard/urls'>
            <div className='p-4 border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-colors cursor-pointer'>
              <div className='flex items-center'>
                <div className='w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center'>
                  <svg
                    className='w-6 h-6 text-green-600'
                    fill='none'
                    stroke='currentColor'
                    viewBox='0 0 24 24'
                  >
                    <path
                      strokeLinecap='round'
                      strokeLinejoin='round'
                      strokeWidth={2}
                      d='M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z'
                    />
                  </svg>
                </div>
                <div className='ml-3'>
                  <p className='text-sm font-medium text-gray-900'>
                    Manage URLs
                  </p>
                  <p className='text-sm text-gray-500'>
                    View and edit your URLs
                  </p>
                </div>
              </div>
            </div>
          </Link>

          <Link href='/dashboard/analytics'>
            <div className='p-4 border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-colors cursor-pointer'>
              <div className='flex items-center'>
                <div className='w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center'>
                  <svg
                    className='w-6 h-6 text-purple-600'
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
                <div className='ml-3'>
                  <p className='text-sm font-medium text-gray-900'>
                    View Analytics
                  </p>
                  <p className='text-sm text-gray-500'>
                    Check your performance
                  </p>
                </div>
              </div>
            </div>
          </Link>
        </div>
      </div>

      {/* Recent Activity */}
      <div className='bg-white p-6 rounded-lg shadow-sm border border-gray-200'>
        <h2 className='text-lg font-semibold text-gray-900 mb-4'>
          Recent Activity
        </h2>
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
              d='M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2'
            />
          </svg>
          <h3 className='mt-2 text-sm font-medium text-gray-900'>
            No activity yet
          </h3>
          <p className='mt-1 text-sm text-gray-500'>
            Get started by creating your first short URL.
          </p>
          <div className='mt-6'>
            <Link href='/dashboard/urls/create'>
              <Button>Create Your First URL</Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
