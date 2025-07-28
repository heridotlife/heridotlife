import Link from 'next/link';
import { notFound } from 'next/navigation';

import prisma from '@/lib/prisma';

export default async function CategoryDetails({
  params,
}: {
  params: Promise<{ category: string }>;
}) {
  const { category } = await params;
  const categoryName = category;

  // Fetch category data from Prisma
  const categoryData = await prisma.category.findUnique({
    where: { name: categoryName },
    include: {
      shortUrls: {
        select: {
          id: true,
          title: true,
          shortUrl: true, // Include shortUrl in the select
        },
      },
    },
  });

  if (!categoryData) {
    notFound(); // Trigger a 404 page if the category is not found
  }

  const shortUrls = categoryData.shortUrls;

  return (
    <div>
      <h1>Category: {categoryName}</h1>
      <ul>
        {shortUrls.length > 0 ? (
          shortUrls.map(
            (url: { shortUrl: string; id: number; title: string | null }) => (
              <li key={url.id}>
                {/* Use Link component for navigation */}
                <Link href={`/${url.shortUrl}`}>
                  {url.title} (Click to redirect)
                </Link>
              </li>
            ),
          )
        ) : (
          <li>No Short URLs in this category</li>
        )}
      </ul>
    </div>
  );
}
