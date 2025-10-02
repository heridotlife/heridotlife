'use client';

import { LogOut, Moon, Sun } from 'lucide-react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Suspense, useEffect, useState } from 'react';

import ProtectedRoute from '@/components/admin/ProtectedRoute';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ProtectedRoute>
      <Suspense
        fallback={
          <div className='min-h-screen bg-gradient-to-br from-sky-50 via-blue-50 to-cyan-100 dark:from-slate-900 dark:via-sky-950 dark:to-slate-950 flex items-center justify-center'>
            <div className='text-sky-600 dark:text-sky-400'>Loading...</div>
          </div>
        }
      >
        <DashboardLayout>{children}</DashboardLayout>
      </Suspense>
    </ProtectedRoute>
  );
}

function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [isDark, setIsDark] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const savedTheme = localStorage.getItem('theme');
    const shouldBeDark = savedTheme
      ? savedTheme === 'dark'
      : window.matchMedia('(prefers-color-scheme: dark)').matches;
    setIsDark(shouldBeDark);
    if (shouldBeDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, []);

  const toggleTheme = () => {
    const newTheme = !isDark;
    setIsDark(newTheme);
    localStorage.setItem('theme', newTheme ? 'dark' : 'light');
    if (newTheme) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/admin/login');
  };

  if (!mounted) {
    return null;
  }

  const navItems = [
    { href: '/admin/dashboard', label: 'Dashboard' },
    { href: '/admin/urls', label: 'URLs' },
    { href: '/admin/categories', label: 'Categories' },
  ];

  return (
    <div className='min-h-screen bg-gradient-to-br from-sky-50 via-blue-50 to-cyan-100 dark:from-slate-900 dark:via-sky-950 dark:to-slate-950 transition-colors duration-500'>
      {/* Gradient Background Effects */}
      <div className='absolute inset-0 overflow-hidden pointer-events-none'>
        <div className='absolute -top-40 -right-40 w-80 h-80 bg-sky-300 dark:bg-sky-900 rounded-full mix-blend-multiply dark:mix-blend-soft-light filter blur-3xl opacity-30 dark:opacity-20'></div>
        <div className='absolute -bottom-40 -left-40 w-80 h-80 bg-cyan-300 dark:bg-cyan-900 rounded-full mix-blend-multiply dark:mix-blend-soft-light filter blur-3xl opacity-30 dark:opacity-20'></div>
      </div>

      {/* Top Navigation */}
      <nav className='relative z-10 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border-b border-sky-200 dark:border-sky-700 shadow-lg'>
        <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
          <div className='flex items-center justify-between h-16'>
            {/* Logo */}
            <div className='flex items-center space-x-8'>
              <Link
                href='/admin/dashboard'
                className='text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-sky-700 via-blue-600 to-cyan-700 dark:from-sky-300 dark:via-cyan-200 dark:to-blue-300'
              >
                URL Admin
              </Link>

              {/* Nav Links */}
              <div className='hidden md:flex space-x-4'>
                {navItems.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200 ${
                      pathname === item.href
                        ? 'bg-sky-100 dark:bg-sky-900 text-sky-700 dark:text-sky-300'
                        : 'text-sky-600 dark:text-sky-400 hover:bg-sky-50 dark:hover:bg-slate-700'
                    }`}
                  >
                    {item.label}
                  </Link>
                ))}
              </div>
            </div>

            {/* Right Side - User & Actions */}
            <div className='flex items-center space-x-4'>
              {/* Theme Toggle */}
              <button
                onClick={toggleTheme}
                className='p-2 rounded-full bg-sky-100 dark:bg-slate-700 hover:bg-sky-200 dark:hover:bg-slate-600 transition-colors duration-200'
                aria-label='Toggle theme'
              >
                {isDark ? (
                  <Sun className='w-5 h-5 text-amber-500' />
                ) : (
                  <Moon className='w-5 h-5 text-sky-600' />
                )}
              </button>

              {/* User Info */}
              <div className='hidden sm:block text-sm text-sky-700 dark:text-sky-300'>
                Admin
              </div>

              {/* Logout Button */}
              <button
                onClick={handleLogout}
                className='flex items-center space-x-2 px-4 py-2 rounded-md bg-gradient-to-r from-sky-500 to-cyan-500 dark:from-sky-600 dark:to-cyan-600 text-white hover:from-sky-600 hover:to-cyan-600 dark:hover:from-sky-700 dark:hover:to-cyan-700 transition-all duration-200 shadow-md hover:shadow-lg'
              >
                <LogOut className='w-4 h-4' />
                <span className='hidden sm:inline'>Logout</span>
              </button>
            </div>
          </div>

          {/* Mobile Nav Links */}
          <div className='md:hidden pb-4 space-y-1'>
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`block px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200 ${
                  pathname === item.href
                    ? 'bg-sky-100 dark:bg-sky-900 text-sky-700 dark:text-sky-300'
                    : 'text-sky-600 dark:text-sky-400 hover:bg-sky-50 dark:hover:bg-slate-700'
                }`}
              >
                {item.label}
              </Link>
            ))}
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className='relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8'>
        {children}
      </main>
    </div>
  );
}
