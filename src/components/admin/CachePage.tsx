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
          <h1 className="text-display-md font-bold text-slate-900 dark:text-white">
            Cache Management
          </h1>
          <p className="text-body-lg text-slate-500 dark:text-slate-400 mt-2">
            Manage application cache, performance monitoring, and TTL configuration
          </p>
        </div>
      </div>

      {/* Cache Management Component */}
      <CacheManagement />
    </div>
  );
}
