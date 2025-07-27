import { Metadata } from 'next';

import UrlForm from '@/components/dashboard/UrlForm';

export const metadata: Metadata = {
  title: 'Create URL | heridotlife',
  description: 'Create a new short URL',
};

export default function CreateUrlPage() {
  return (
    <div className='space-y-6'>
      {/* Header */}
      <div>
        <h1 className='text-2xl font-bold text-gray-900'>Create New URL</h1>
        <p className='text-gray-600'>Create a short URL for your long link</p>
      </div>

      {/* Form */}
      <div className='bg-white shadow rounded-lg p-6'>
        <UrlForm />
      </div>
    </div>
  );
}
