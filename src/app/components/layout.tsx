import { Metadata } from 'next';
import * as React from 'react';

import '@/styles/colors.css';
import { Analytics } from '@vercel/analytics/react';

export const metadata: Metadata = {
  title: 'Components',
  description: 'Pre-built components with awesome default',
};

export default function ComponentsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <Analytics />
      {children}
    </>
  );
}
