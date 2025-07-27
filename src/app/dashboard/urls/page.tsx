import { Metadata } from 'next';

import UrlList from '@/components/dashboard/UrlList';

export const metadata: Metadata = {
  title: 'My URLs | heridotlife',
  description: 'Manage your short URLs and track their performance',
};

export default function UrlsPage() {
  return (
    <div className='space-y-6'>
      {/* Header */}
      <div className='flex items-center justify-between'>
        <div>
          <h1 className='text-2xl font-bold text-gray-900'>My URLs</h1>
          <p className='text-gray-600'>Manage and track your short URLs</p>
        </div>
        <a
          href='/dashboard/urls/create'
          className='inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500'
        >
          <svg
            className='w-4 h-4 mr-2'
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
          Create URL
        </a>
      </div>

      {/* URL List */}
      <UrlList />
    </div>
  );
}
