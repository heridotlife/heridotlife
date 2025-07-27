'use client';

import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';

interface User {
  id: string;
  name: string | null;
  email: string | null;
  image: string | null;
}

interface UserMenuProps {
  user: User;
  className?: string;
}

export default function UserMenu({ user, className = '' }: UserMenuProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      const response = await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include',
      });

      if (response.ok) {
        // Redirect to home page after logout
        router.push('/');
      } else {
        console.error('Logout failed');
      }
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setIsLoggingOut(false);
    }
  };

  const toggleMenu = () => {
    setIsOpen(!isOpen);
  };

  return (
    <div className={`relative ${className}`} ref={menuRef}>
      <button
        onClick={toggleMenu}
        className='flex items-center space-x-2 p-2 rounded-md hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500'
      >
        {user.image ? (
          <Image
            src={user.image}
            alt={user.name || 'User'}
            width={32}
            height={32}
            className='rounded-full'
          />
        ) : (
          <div className='w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm font-medium'>
            {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
          </div>
        )}
        <span className='text-sm font-medium text-gray-700'>
          {user.name || user.email}
        </span>
        <svg
          className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill='none'
          stroke='currentColor'
          viewBox='0 0 24 24'
        >
          <path
            strokeLinecap='round'
            strokeLinejoin='round'
            strokeWidth={2}
            d='M19 9l-7 7-7-7'
          />
        </svg>
      </button>

      {isOpen && (
        <div className='absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-50 border border-gray-200'>
          <div className='px-4 py-2 border-b border-gray-100'>
            <p className='text-sm font-medium text-gray-900'>
              {user.name || 'User'}
            </p>
            <p className='text-sm text-gray-500 truncate'>{user.email}</p>
          </div>

          <div className='py-1'>
            <button
              onClick={() => {
                setIsOpen(false);
                router.push('/dashboard');
              }}
              className='block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100'
            >
              Dashboard
            </button>

            <button
              onClick={() => {
                setIsOpen(false);
                router.push('/dashboard/settings');
              }}
              className='block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100'
            >
              Settings
            </button>
          </div>

          <div className='border-t border-gray-100 pt-1'>
            <button
              onClick={handleLogout}
              disabled={isLoggingOut}
              className='block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 disabled:opacity-50'
            >
              {isLoggingOut ? 'Signing out...' : 'Sign out'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
