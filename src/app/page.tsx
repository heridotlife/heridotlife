'use client';

import { Moon, Sun } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useState } from 'react';

export default function HomePage() {
  const [isDark, setIsDark] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);

    // Check for saved preference first (user's manual choice overrides system)
    const savedTheme = localStorage.getItem('theme');

    let shouldBeDark: boolean;

    if (savedTheme !== null) {
      // User has manually chosen a theme - respect their choice
      shouldBeDark = savedTheme === 'dark';
    } else {
      // No saved preference - use system preference
      const systemPrefersDark = window.matchMedia(
        '(prefers-color-scheme: dark)',
      ).matches;
      shouldBeDark = systemPrefersDark;
    }

    setIsDark(shouldBeDark);

    // Explicitly set or remove the dark class on mount
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

    // Explicitly set or remove the dark class on html element
    if (newTheme) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  // Prevent flash of unstyled content
  if (!mounted) {
    return null;
  }

  return (
    <main className='min-h-screen bg-gradient-to-br from-sky-50 via-blue-50 to-cyan-100 dark:from-slate-900 dark:via-sky-950 dark:to-slate-950 transition-colors duration-500'>
      {/* Theme Toggle Button */}
      <button
        onClick={toggleTheme}
        className='fixed top-6 right-6 p-3 rounded-full bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-110 border border-sky-200 dark:border-sky-700 group z-10'
        aria-label='Toggle theme'
      >
        {isDark ? (
          <Sun className='w-5 h-5 text-amber-500 group-hover:rotate-180 transition-transform duration-500' />
        ) : (
          <Moon className='w-5 h-5 text-sky-600 group-hover:-rotate-12 transition-transform duration-300' />
        )}
      </button>

      {/* Main Content */}
      <div className='flex flex-col items-center justify-center min-h-screen px-4 py-12'>
        {/* Gradient Background Effects */}
        <div className='absolute inset-0 overflow-hidden pointer-events-none'>
          <div className='absolute -top-40 -right-40 w-80 h-80 bg-sky-300 dark:bg-sky-900 rounded-full mix-blend-multiply dark:mix-blend-soft-light filter blur-3xl opacity-30 dark:opacity-20 animate-blob'></div>
          <div className='absolute -bottom-40 -left-40 w-80 h-80 bg-cyan-300 dark:bg-cyan-900 rounded-full mix-blend-multiply dark:mix-blend-soft-light filter blur-3xl opacity-30 dark:opacity-20 animate-blob animation-delay-2000'></div>
          <div className='absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-blue-300 dark:bg-blue-900 rounded-full mix-blend-multiply dark:mix-blend-soft-light filter blur-3xl opacity-30 dark:opacity-20 animate-blob animation-delay-4000'></div>
        </div>

        {/* Profile Card */}
        <div className='relative z-10 text-center space-y-8 max-w-2xl mx-auto'>
          {/* Profile Picture with Gradient Ring */}
          <div className='relative inline-block'>
            <div className='absolute inset-0 bg-gradient-to-r from-sky-400 via-blue-500 to-cyan-400 rounded-full blur-lg opacity-60 dark:opacity-40 animate-pulse'></div>
            <div className='relative bg-gradient-to-r from-sky-400 via-blue-500 to-cyan-400 p-1 rounded-full'>
              <div className='bg-white dark:bg-slate-900 p-1 rounded-full'>
                <Image
                  className='rounded-full object-cover w-32 h-32 md:w-40 md:h-40 lg:w-48 lg:h-48'
                  src='/profile_picture.jpg'
                  alt='Heri Rusmanto Profile Picture'
                  width={192}
                  height={192}
                  priority
                />
              </div>
            </div>
          </div>

          {/* Name and Title */}
          <div className='space-y-4'>
            <h1 className='text-4xl md:text-5xl lg:text-6xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-sky-700 via-blue-600 to-cyan-700 dark:from-sky-300 dark:via-cyan-200 dark:to-blue-300 animate-gradient'>
              Heri Rusmanto
            </h1>
            <p className='text-lg md:text-xl lg:text-2xl text-sky-700 dark:text-sky-300 font-light tracking-wide'>
              Automation enthusiast
            </p>
          </div>

          {/* LinkedIn Link */}
          <div className='pt-4'>
            <Link
              href='https://www.linkedin.com/in/hveda/'
              target='_blank'
              rel='noopener noreferrer'
              className='inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-sky-500 to-cyan-500 dark:from-sky-600 dark:to-cyan-600 text-white rounded-full font-medium shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 hover:from-sky-600 hover:to-cyan-600 dark:hover:from-sky-700 dark:hover:to-cyan-700'
            >
              <svg
                className='w-5 h-5'
                fill='currentColor'
                viewBox='0 0 24 24'
                aria-hidden='true'
              >
                <path d='M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z' />
              </svg>
              Connect on LinkedIn
            </Link>
          </div>
        </div>

        {/* Footer */}
        <footer className='absolute bottom-6 text-center text-sm text-sky-600 dark:text-sky-400 z-10'>
          <p>
            © {new Date().getFullYear()}{' '}
            <Link
              href='https://heri.life'
              className='hover:text-sky-700 dark:hover:text-sky-300 transition-colors duration-200 font-medium'
            >
              Heri Rusmanto
            </Link>
          </p>
        </footer>
      </div>

      <style jsx>{`
        @keyframes blob {
          0% {
            transform: translate(0px, 0px) scale(1);
          }
          33% {
            transform: translate(30px, -50px) scale(1.1);
          }
          66% {
            transform: translate(-20px, 20px) scale(0.9);
          }
          100% {
            transform: translate(0px, 0px) scale(1);
          }
        }

        .animate-blob {
          animation: blob 7s infinite;
        }

        .animation-delay-2000 {
          animation-delay: 2s;
        }

        .animation-delay-4000 {
          animation-delay: 4s;
        }

        @keyframes gradient {
          0% {
            background-position: 0% 50%;
          }
          50% {
            background-position: 100% 50%;
          }
          100% {
            background-position: 0% 50%;
          }
        }

        .animate-gradient {
          background-size: 200% 200%;
          animation: gradient 3s ease infinite;
        }
      `}</style>
    </main>
  );
}
