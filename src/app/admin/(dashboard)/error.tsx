'use client';

import { useEffect } from 'react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // eslint-disable-next-line no-console
    console.error('Admin dashboard error:', error);
  }, [error]);

  return (
    <div className='min-h-screen bg-gradient-to-br from-sky-50 via-blue-50 to-cyan-100 dark:from-slate-900 dark:via-sky-950 dark:to-slate-950 flex items-center justify-center'>
      <div className='bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-lg shadow-lg border border-red-200 dark:border-red-700 p-8 max-w-md'>
        <h2 className='text-2xl font-bold text-red-700 dark:text-red-300 mb-4'>
          Something went wrong!
        </h2>
        <p className='text-red-600 dark:text-red-400 mb-6'>
          {error.message || 'An unexpected error occurred'}
        </p>
        <button
          onClick={() => reset()}
          className='px-6 py-3 rounded-lg bg-gradient-to-r from-sky-500 to-cyan-500 text-white hover:from-sky-600 hover:to-cyan-600 transition-all duration-200'
        >
          Try again
        </button>
      </div>
    </div>
  );
}
