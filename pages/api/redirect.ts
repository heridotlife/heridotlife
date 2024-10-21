import { NextApiRequest, NextApiResponse } from 'next';
import prisma from '../../lib/prisma'; // Ensure the import is correct

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    const { shortUrl } = req.query;

    // Ensure shortUrl is defined
    if (!shortUrl || typeof shortUrl !== 'string') {
        return res.status(400).json({ error: 'Missing or invalid short URL' });
    }

    try {
        // Find the ShortUrl record in the database, including associated categories
        const shortUrlRecord = await prisma.shortUrl.findUnique({
            where: { shortUrl },
            include: { categories: true }, // Include categories for click count update
        });

        if (!shortUrlRecord) {
            console.log("Short URL not found:", shortUrl); // Log for debugging
            return res.status(404).json({ error: 'Short URL not found' });
        }

        // Increment click count in the ShortUrl
        await prisma.shortUrl.update({
            where: { id: shortUrlRecord.id },
            data: { 
                clickCount: { increment: 1 }, 
                latestClick: new Date() 
            },
        });

        // Increment click count in the associated categories
        const allCategories = shortUrlRecord.categories;
        await Promise.all(allCategories.map(category =>
            prisma.category.update({
                where: { id: category.id },
                data: { clickCount: { increment: 1 } },
            })
        ));

        // Log the original URL being returned
        console.log('Original URL:', shortUrlRecord.originalUrl);

        // Return the original URL for redirection
        return res.status(200).send(shortUrlRecord.originalUrl);
    } catch (error) {
        console.error("Error fetching URL:", error); // Log the error for debugging
        return res.status(500).json({ error: 'Internal server error' });
    }
}
