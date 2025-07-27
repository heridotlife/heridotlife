import { Metadata } from 'next';

import AuthGuard from '@/components/auth/AuthGuard';
import Header from '@/components/layout/Header';
import Sidebar from '@/components/layout/Sidebar';

export const metadata: Metadata = {
  title: 'Dashboard | heridotlife',
  description: 'Manage your URLs and view analytics',
};

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthGuard>
      <div className='min-h-screen bg-gray-50'>
        <Header />

        <div className='flex'>
          {/* Sidebar */}
          <div className='hidden md:block w-64 flex-shrink-0'>
            <Sidebar className='h-screen sticky top-0' />
          </div>

          {/* Mobile sidebar overlay */}
          <div className='md:hidden fixed inset-0 z-40'>
            <div className='fixed inset-0 bg-gray-600 bg-opacity-75' />
            <div className='relative flex-1 flex flex-col max-w-xs w-full bg-white'>
              <Sidebar className='h-full' />
            </div>
          </div>

          {/* Main content */}
          <div className='flex-1'>
            <main className='p-6'>{children}</main>
          </div>
        </div>
      </div>
    </AuthGuard>
  );
}
