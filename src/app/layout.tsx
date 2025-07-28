import type { Metadata } from 'next';
import { Inter } from 'next/font/google';

import './globals.css';

import { DarkModeProvider } from '@/context/DarkModeContext';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Heri Dot Life - URL Shortener & Analytics',
  description:
    'Professional URL shortener with analytics, category management, and user dashboard.',
  keywords: 'url shortener, link management, analytics, dashboard',
  authors: [{ name: 'Heri' }],
  creator: 'Heri',
  publisher: 'Heri',
  robots: 'index, follow',
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://heridotlife.com',
    title: 'Heri Dot Life - URL Shortener & Analytics',
    description:
      'Professional URL shortener with analytics, category management, and user dashboard.',
    siteName: 'Heri Dot Life',
    images: [
      {
        url: '/images/og.jpg',
        width: 1200,
        height: 630,
        alt: 'Heri Dot Life - URL Shortener',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Heri Dot Life - URL Shortener & Analytics',
    description:
      'Professional URL shortener with analytics, category management, and user dashboard.',
    images: ['/images/og.jpg'],
  },
  viewport: 'width=device-width, initial-scale=1',
  themeColor: '#000000',
  manifest: '/favicon/site.webmanifest',
  icons: {
    icon: [
      { url: '/favicon/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
      { url: '/favicon/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
      { url: '/favicon/favicon-96x96.png', sizes: '96x96', type: 'image/png' },
    ],
    apple: [
      {
        url: '/favicon/apple-touch-icon.png',
        sizes: '180x180',
        type: 'image/png',
      },
    ],
    other: [{ url: '/favicon/favicon.ico', sizes: 'any' }],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang='en' suppressHydrationWarning>
      <head>
        {/* Cloudflare Analytics */}
        <script
          defer
          src='https://static.cloudflareinsights.com/beacon.min.js'
          data-cf-beacon='{"token": "YOUR_CLOUDFLARE_ANALYTICS_TOKEN"}'
        />
      </head>
      <body className={inter.className}>
        <DarkModeProvider>{children}</DarkModeProvider>
      </body>
    </html>
  );
}
