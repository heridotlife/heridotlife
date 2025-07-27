'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';

import UserMenu from '@/components/auth/UserMenu';

interface User {
  id: string;
  name: string | null;
  email: string | null;
  image: string | null;
}

export default function Header() {
  const pathname = usePathname();
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await fetch('/api/auth/me', {
          credentials: 'include',
        });

        if (response.ok) {
          const data = await response.json();
          setUser(data.user);
        }
      } catch (error) {
        console.error('Auth check failed:', error);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, []);

  const isActive = (path: string) => {
    return pathname === path;
  };

  return (
    <header className='bg-white shadow-sm border-b border-gray-200'>
      <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
        <div className='flex justify-between items-center h-16'>
          {/* Logo */}
          <div className='flex items-center'>
            <Link href='/' className='flex items-center space-x-2'>
              <div className='w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center'>
                <span className='text-white font-bold text-sm'>H</span>
              </div>
              <span className='text-xl font-bold text-gray-900'>
                heridotlife
              </span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <nav className='hidden md:flex items-center space-x-8'>
            <Link
              href='/'
              className={`text-sm font-medium ${
                isActive('/')
                  ? 'text-blue-600'
                  : 'text-gray-500 hover:text-gray-900'
              }`}
            >
              Profile
            </Link>

            {user && (
              <>
                <Link
                  href='/dashboard'
                  className={`text-sm font-medium ${
                    isActive('/dashboard')
                      ? 'text-blue-600'
                      : 'text-gray-500 hover:text-gray-900'
                  }`}
                >
                  Dashboard
                </Link>
                <Link
                  href='/urls'
                  className={`text-sm font-medium ${
                    isActive('/urls')
                      ? 'text-blue-600'
                      : 'text-gray-500 hover:text-gray-900'
                  }`}
                >
                  All URLs
                </Link>
                <Link
                  href='/category'
                  className={`text-sm font-medium ${
                    isActive('/category')
                      ? 'text-blue-600'
                      : 'text-gray-500 hover:text-gray-900'
                  }`}
                >
                  Categories
                </Link>
              </>
            )}
          </nav>

          {/* User Menu / Login */}
          <div className='flex items-center space-x-4'>
            {!isLoading && (
              <>
                {user ? (
                  <UserMenu user={user} />
                ) : (
                  <Link
                    href='/login'
                    className='inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500'
                  >
                    Sign in
                  </Link>
                )}
              </>
            )}

            {/* Mobile menu button */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className='md:hidden inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500'
            >
              <span className='sr-only'>Open main menu</span>
              <svg
                className={`${isMobileMenuOpen ? 'hidden' : 'block'} h-6 w-6`}
                fill='none'
                viewBox='0 0 24 24'
                stroke='currentColor'
              >
                <path
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  strokeWidth={2}
                  d='M4 6h16M4 12h16M4 18h16'
                />
              </svg>
              <svg
                className={`${isMobileMenuOpen ? 'block' : 'hidden'} h-6 w-6`}
                fill='none'
                viewBox='0 0 24 24'
                stroke='currentColor'
              >
                <path
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  strokeWidth={2}
                  d='M6 18L18 6M6 6l12 12'
                />
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMobileMenuOpen && (
          <div className='md:hidden'>
            <div className='px-2 pt-2 pb-3 space-y-1 sm:px-3 border-t border-gray-200'>
              <Link
                href='/'
                className={`block px-3 py-2 rounded-md text-base font-medium ${
                  isActive('/')
                    ? 'text-blue-600 bg-blue-50'
                    : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'
                }`}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Profile
              </Link>

              {user && (
                <>
                  <Link
                    href='/dashboard'
                    className={`block px-3 py-2 rounded-md text-base font-medium ${
                      isActive('/dashboard')
                        ? 'text-blue-600 bg-blue-50'
                        : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'
                    }`}
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    Dashboard
                  </Link>
                  <Link
                    href='/urls'
                    className={`block px-3 py-2 rounded-md text-base font-medium ${
                      isActive('/urls')
                        ? 'text-blue-600 bg-blue-50'
                        : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'
                    }`}
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    All URLs
                  </Link>
                  <Link
                    href='/category'
                    className={`block px-3 py-2 rounded-md text-base font-medium ${
                      isActive('/category')
                        ? 'text-blue-600 bg-blue-50'
                        : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'
                    }`}
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    Categories
                  </Link>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
