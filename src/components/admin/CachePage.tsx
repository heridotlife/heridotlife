'use client';

import { useState, useEffect } from 'react';
import CacheManagement from './CacheManagement';

// Disable prerendering - this is a client-only page with auth
export const dynamic = 'force-dynamic';

export default function CachePage() {
  const [mounted, setMounted] = useState(false);

  // Use effect to ensure client-side mounting
  useEffect(() => {
    setMounted(true);
  }, []);

  // Prevent SSR hydration mismatch
  if (!mounted) {
    return null;
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-display-md font-bold bg-clip-text text-transparent bg-gradient-to-r from-sky-700 via-blue-600 to-cyan-700 dark:from-sky-300 dark:via-cyan-200 dark:to-blue-300">
            Cache Management
          </h1>
          <p className="text-body-lg text-sky-600 dark:text-sky-400 mt-2">
            Manage application cache, performance monitoring, and TTL configuration
          </p>
        </div>
      </div>

      {/* Cache Management Component */}
      <CacheManagement />
    </div>
  );
}
