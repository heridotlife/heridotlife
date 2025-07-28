// app/category/page.tsx
import Link from 'next/link';

import prisma from '@/lib/prisma';

// Force dynamic rendering to prevent build-time database access
export const dynamic = 'force-dynamic';

type Category = {
  id: number;
  name: string;
};

export default async function CategoryList() {
  // Fetch only the categories from Prisma
  const categories: Category[] = await prisma.category.findMany({
    select: {
      id: true,
      name: true, // Only fetch the category name and id
    },
  });

  return (
    <div className='min-h-screen flex flex-col items-center justify-center bg-gray-100'>
      {/* Header */}
      <header className='w-full py-4 bg-blue-600 text-white text-center'>
        <h1 className='text-2xl font-bold'>Categories</h1>
        <Link href='/' className='underline'>
          Home
        </Link>
      </header>

      <main className='flex flex-col items-center w-full max-w-3xl p-4 bg-white shadow-lg rounded-md'>
        <ul className='w-full space-y-4'>
          {categories.length > 0 ? (
            categories.map((category) => (
              <li
                key={category.id}
                className='p-4 bg-gray-200 rounded-md shadow-md'
              >
                <Link
                  href={`/category/${category.name}`}
                  className='text-lg font-semibold text-blue-500 underline'
                >
                  {category.name}
                </Link>
              </li>
            ))
          ) : (
            <li className='text-center text-gray-500'>
              No categories available
            </li>
          )}
        </ul>
      </main>
    </div>
  );
}
