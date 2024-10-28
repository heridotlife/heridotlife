import Link from 'next/link'; // Import Link from next/link

import prisma from '@/lib/prisma'; // Adjust the import path as needed

interface ShortUrl {
  shortUrl: string;
  id: number;
  title: string | null;
}

export default async function ShortUrlList() {
  // Fetch all short URLs from Prisma
  const shortUrls = await prisma.shortUrl.findMany({
    select: {
      id: true,
      title: true,
      shortUrl: true, // Include shortUrl in the select
    },
  });

  return (
    <div className='min-h-screen flex flex-col items-center justify-center bg-gray-100'>
      {/* Header */}
      <header className='w-full py-4 bg-blue-600 text-white text-center'>
        <h1 className='text-2xl font-bold'>All Short URLs</h1>
        <Link href='/' className='underline'>
          Home
        </Link>
      </header>

      <main className='flex flex-col items-center w-full max-w-3xl p-4 bg-white shadow-lg rounded-md'>
        <ul className='w-full space-y-4'>
          {shortUrls.length > 0 ? (
            shortUrls.map((url: ShortUrl) => (
              <li key={url.id} className='p-4 bg-gray-200 rounded-md shadow-md'>
                <Link
                  href={`/${url.shortUrl}`}
                  className='text-lg font-semibold text-blue-500 underline'
                >
                  {url.title} (Click to redirect)
                </Link>
              </li>
            ))
          ) : (
            <li className='text-center text-gray-500'>
              No Short URLs available
            </li>
          )}
        </ul>
      </main>
    </div>
  );
}
