'use client';

import { useState, useEffect } from 'react';
import prisma from '../../../lib/prisma';
import Link from 'next/link';

type Props = {
  params: {
    category: string;
  };
};

export default async function CategoryDetails({ params }: Props) {
  const categoryName = params.category;

  const category = await prisma.category.findUnique({
    where: { name: categoryName },
  });

  // Light/Dark mode state
  const [theme, setTheme] = useState<'light' | 'dark'>('light');

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') as 'light' | 'dark';
    if (savedTheme) {
      setTheme(savedTheme);
      document.documentElement.classList.toggle('dark', savedTheme === 'dark');
    }
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
    document.documentElement.classList.toggle('dark', newTheme === 'dark');
  };

  if (!category) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 dark:bg-gray-900">
        <header className="w-full py-4 bg-blue-600 dark:bg-gray-800 text-white text-center">
          <h1 className="text-2xl font-bold">Category Not Found</h1>
          <div className="flex justify-between items-center">
            <Link href="/" className="underline">Home</Link>
            {/* Theme toggle button */}
            <button
              onClick={toggleTheme}
              className="ml-4 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 px-4 py-2 rounded-md"
            >
              Toggle {theme === 'light' ? 'Dark' : 'Light'} Mode
            </button>
          </div>
        </header>
        <div className="p-4 text-gray-600 dark:text-gray-400 text-center">
          The category you're looking for doesn't exist.
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 dark:bg-gray-900">
      {/* Header */}
      <header className="w-full py-4 bg-blue-600 dark:bg-gray-800 text-white text-center">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">Category: {category.name}</h1>
          <Link href="/" className="underline">Home</Link>
          {/* Theme toggle button */}
          <button
            onClick={toggleTheme}
            className="ml-4 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 px-4 py-2 rounded-md"
          >
            Toggle {theme === 'light' ? 'Dark' : 'Light'} Mode
          </button>
        </div>
      </header>

      <main className="flex flex-col items-center w-full max-w-3xl p-4 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 shadow-lg rounded-md">
        <p className="text-lg font-semibold">This category exists but contains no further details to display.</p>
      </main>
    </div>
  );
}
