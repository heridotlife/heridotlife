import { notFound } from 'next/navigation';
import prisma from '../../../lib/prisma'; // Adjust the import path as needed
import Link from 'next/link'; // Import Link from next/link

type ShortUrl = {
  id: number;
  title: string;
  shortUrl: string; // Include shortUrl in the ShortUrl type
};

type Props = {
  categoryName: string;
  shortUrls: ShortUrl[];
};

export default async function CategoryDetails({ params }: { params: { category: string } }) {
  const categoryName = params.category;

  // Fetch category data from Prisma
  const category = await prisma.category.findUnique({
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

  if (!category) {
    notFound(); // Trigger a 404 page if the category is not found
  }

  const shortUrls = category.shortUrls;

  return (
    <div>
      <h1>Category: {categoryName}</h1>
      <ul>
        {shortUrls.length > 0 ? (
          shortUrls.map((url) => (
            <li key={url.id}>
              {/* Use Link component for navigation */}
              <Link href={`/l/${url.shortUrl}`}>
                {url.title} (Click to redirect)
              </Link>
            </li>
          ))
        ) : (
          <li>No Short URLs in this category</li>
        )}
      </ul>
    </div>
  );
}
