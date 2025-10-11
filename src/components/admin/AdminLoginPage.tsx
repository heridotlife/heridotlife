'use client';

import { FormEvent, useState } from 'react';

export default function AdminLoginPage() {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });

      const data = await response.json();

      if (response.ok) {
        window.location.href = '/admin/dashboard';
      } else {
        setError(data.error || 'Login failed');
      }
    } catch {
      setError('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className='min-h-screen bg-gradient-to-br from-sky-50 via-blue-50 to-cyan-100 dark:from-slate-900 dark:via-sky-950 dark:to-slate-950 transition-colors duration-500'>
      {/* Gradient Background Effects */}
      <div className='absolute inset-0 overflow-hidden pointer-events-none'>
        <div className='absolute -top-40 -right-40 w-80 h-80 bg-sky-300 dark:bg-sky-900 rounded-full mix-blend-multiply dark:mix-blend-soft-light filter blur-3xl opacity-30 dark:opacity-20'></div>
        <div className='absolute -bottom-40 -left-40 w-80 h-80 bg-cyan-300 dark:bg-cyan-900 rounded-full mix-blend-multiply dark:mix-blend-soft-light filter blur-3xl opacity-30 dark:opacity-20'></div>
        <div className='absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-blue-300 dark:bg-blue-900 rounded-full mix-blend-multiply dark:mix-blend-soft-light filter blur-3xl opacity-30 dark:opacity-20'></div>
      </div>

      {/* Main Content */}
      <div className='flex flex-col items-center justify-center min-h-screen px-4 py-12'>
        <div className='relative z-10 w-full max-w-md'>
          {/* Header */}
          <div className='text-center mb-8'>
            <h1 className='text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-sky-700 via-blue-600 to-cyan-700 dark:from-sky-300 dark:via-cyan-200 dark:to-blue-300 mb-2'>
              URL Admin
            </h1>
            <p className='text-sky-600 dark:text-sky-400'>
              Sign in to manage your short URLs
            </p>
          </div>

          {/* Login Card */}
          <div className='bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-lg shadow-xl border border-sky-200 dark:border-sky-700 p-8'>
            <form onSubmit={handleSubmit} className='space-y-6'>
              <div>
                <label
                  htmlFor='password'
                  className='block text-sm font-medium text-sky-700 dark:text-sky-300 mb-2'
                >
                  Password
                </label>
                <input
                  id='password'
                  type='password'
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className='w-full px-4 py-3 rounded-lg border border-sky-200 dark:border-sky-700 bg-white dark:bg-slate-900 text-sky-900 dark:text-sky-100 focus:ring-2 focus:ring-sky-500 focus:border-transparent transition-colors duration-200'
                  placeholder='Enter admin password'
                  required
                  autoFocus
                />
              </div>

              {error && (
                <div className='text-red-600 dark:text-red-400 text-sm'>
                  {error}
                </div>
              )}

              <button
                type='submit'
                disabled={loading}
                className='w-full px-6 py-3 rounded-lg bg-gradient-to-r from-sky-500 to-cyan-500 dark:from-sky-600 dark:to-cyan-600 text-white font-medium shadow-lg hover:shadow-xl hover:from-sky-600 hover:to-cyan-600 dark:hover:from-sky-700 dark:hover:to-cyan-700 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed'
              >
                {loading ? 'Signing in...' : 'Sign In'}
              </button>
            </form>
          </div>

          {/* Back to Home */}
          <div className='text-center mt-6'>
            <a
              href='/'
              className='text-sm text-sky-600 dark:text-sky-400 hover:text-sky-700 dark:hover:text-sky-300 transition-colors duration-200'
            >
              ← Back to Home
            </a>
          </div>
        </div>
      </div>
    </main>
  );
}
