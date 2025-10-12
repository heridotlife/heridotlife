import { Suspense, lazy } from 'react';

interface LazyComponentWrapperProps {
  fallback?: React.ReactNode;
  children: React.ReactNode;
}

export function LazyComponentWrapper({ 
  fallback = (
    <div className="flex items-center justify-center min-h-[200px]">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-sky-600 dark:border-sky-400"></div>
    </div>
  ), 
  children 
}: LazyComponentWrapperProps) {
  return (
    <Suspense fallback={fallback}>
      {children}
    </Suspense>
  );
}

// Lazy load admin components for better code splitting
export const DashboardPageLazy = lazy(() => import('../admin/DashboardPage'));
export const URLsPageLazy = lazy(() => import('../admin/URLsPage'));
export const CategoriesPageLazy = lazy(() => import('../admin/CategoriesPage'));

export default LazyComponentWrapper;