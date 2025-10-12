'use client';

import React, { useState, useEffect } from 'react';
import Button from '../ui/Button';

interface TTLConfig {
  shortTerm: number;
  mediumTerm: number;
  longTerm: number;
  urlLookup: number;
  adminStats: number;
}

interface CacheStats {
  hits: number;
  misses: number;
  hitRate: number;
}

interface CacheResponse {
  cacheStats: CacheStats;
  timestamp: string;
  availableActions?: string[];
  message?: string;
}

export default function CacheManagement() {
  const [cacheStats, setCacheStats] = useState<CacheStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [showTTLConfig, setShowTTLConfig] = useState(false);
  const [ttlConfig, setTTLConfig] = useState<TTLConfig>({
    shortTerm: 300,    // 5 minutes
    mediumTerm: 3600,  // 1 hour
    longTerm: 86400,   // 24 hours
    urlLookup: 86400, // 24 hours
    adminStats: 1800  // 30 minutes
  });
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    fetchCacheStats();
  }, []);

  const fetchCacheStats = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch('/api/admin/cache');
      if (!response.ok) {
        throw new Error('Failed to fetch cache stats');
      }
      const data: CacheResponse = await response.json();
      setCacheStats(data.cacheStats);
      setLastUpdate(data.timestamp);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load cache stats');
    } finally {
      setLoading(false);
    }
  };

  const performCacheAction = async (action: string) => {
    try {
      setActionLoading(action);
      setError(null);
      setSuccessMessage(null);

      const response = await fetch('/api/admin/cache', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action }),
      });

      if (!response.ok) {
        throw new Error(`Failed to perform ${action}`);
      }

      const data: CacheResponse = await response.json();
      setSuccessMessage(data.message || `Successfully performed ${action}`);
      
      // Refresh stats after action
      await fetchCacheStats();
    } catch (err) {
      setError(err instanceof Error ? err.message : `Failed to perform ${action}`);
    } finally {
      setActionLoading(null);
    }
  };

  const updateTTLConfig = async () => {
    try {
      setActionLoading('set_ttl_config');
      setError(null);
      setSuccessMessage(null);

      const response = await fetch('/api/admin/cache', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          action: 'set_ttl_config',
          ttlConfig 
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update TTL configuration');
      }

      const data: CacheResponse = await response.json();
      setSuccessMessage(data.message || 'TTL configuration updated successfully');
      setShowTTLConfig(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update TTL configuration');
    } finally {
      setActionLoading(null);
    }
  };

  const loadCurrentTTLConfig = async () => {
    try {
      const response = await fetch('/api/admin/cache?action=get_ttl_config');
      if (response.ok) {
        const data = await response.json() as { ttlConfig?: TTLConfig };
        if (data.ttlConfig) {
          setTTLConfig(data.ttlConfig);
        }
      }
    } catch (err) {
      console.warn('Could not load current TTL config:', err);
    }
  };

  const handleTTLConfigShow = () => {
    setShowTTLConfig(true);
    loadCurrentTTLConfig();
  };

  const getActionLabel = (action: string): string => {
    switch (action) {
      case 'clear_all':
        return 'Clear All Caches';
      case 'warm_cache':
        return 'Warm Cache';
      case 'invalidate_urls':
        return 'Invalidate URL Caches';
      case 'get_stats':
        return 'Refresh Stats';
      default:
        return action;
    }
  };

  const getActionDescription = (action: string): string => {
    switch (action) {
      case 'clear_all':
        return 'Remove all cached data. Use when experiencing cache-related issues.';
      case 'warm_cache':
        return 'Preload popular URLs and categories for better performance.';
      case 'invalidate_urls':
        return 'Clear only URL-related caches while keeping other data cached.';
      case 'get_stats':
        return 'Get the latest cache performance statistics.';
      default:
        return 'Perform cache operation.';
    }
  };

  const getActionVariant = (action: string): 'primary' | 'secondary' | 'danger' => {
    switch (action) {
      case 'clear_all':
        return 'danger';
      case 'warm_cache':
        return 'primary';
      case 'invalidate_urls':
        return 'secondary';
      default:
        return 'secondary';
    }
  };

  const actions = ['warm_cache', 'invalidate_urls', 'clear_all'];

  return (
    <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-lg shadow-lg border border-sky-200 dark:border-sky-700 p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-heading-lg font-bold text-sky-900 dark:text-sky-100">
            Cache Management
          </h2>
          <p className="text-body-sm text-sky-600 dark:text-sky-400 mt-1">
            Monitor and control application cache
          </p>
        </div>
        <Button
          onClick={fetchCacheStats}
          disabled={loading}
          variant="secondary"
          size="sm"
        >
          {loading ? 'Refreshing...' : 'Refresh Stats'}
        </Button>
      </div>

      {/* Cache Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-sky-50 dark:bg-slate-700/50 rounded-lg p-4 border border-sky-100 dark:border-sky-800">
          <div className="text-caption text-sky-600 dark:text-sky-400 mb-1">Cache Hits</div>
          <div className="text-heading-md font-bold text-sky-900 dark:text-sky-100">
            {cacheStats?.hits ?? 'N/A'}
          </div>
        </div>
        <div className="bg-sky-50 dark:bg-slate-700/50 rounded-lg p-4 border border-sky-100 dark:border-sky-800">
          <div className="text-caption text-sky-600 dark:text-sky-400 mb-1">Cache Misses</div>
          <div className="text-heading-md font-bold text-sky-900 dark:text-sky-100">
            {cacheStats?.misses ?? 'N/A'}
          </div>
        </div>
        <div className="bg-sky-50 dark:bg-slate-700/50 rounded-lg p-4 border border-sky-100 dark:border-sky-800">
          <div className="text-caption text-sky-600 dark:text-sky-400 mb-1">Hit Rate</div>
          <div className="text-heading-md font-bold text-sky-900 dark:text-sky-100">
            {cacheStats?.hitRate ? `${(cacheStats.hitRate * 100).toFixed(1)}%` : 'N/A'}
          </div>
        </div>
      </div>

      {/* Status Messages */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3 mb-4">
          <div className="text-body-sm text-red-700 dark:text-red-300">{error}</div>
        </div>
      )}

      {successMessage && (
        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-3 mb-4">
          <div className="text-body-sm text-green-700 dark:text-green-300">{successMessage}</div>
        </div>
      )}

      {/* Cache Actions */}
      <div className="space-y-3">
        <h3 className="text-heading-sm font-semibold text-sky-900 dark:text-sky-100 mb-3">
          Cache Actions
        </h3>
        
        {actions.map((action) => (
          <div
            key={action}
            className="flex items-center justify-between p-4 bg-sky-50 dark:bg-slate-700/50 rounded-lg border border-sky-100 dark:border-sky-800"
          >
            <div className="flex-1">
              <div className="text-body-md font-medium text-sky-900 dark:text-sky-100">
                {getActionLabel(action)}
              </div>
              <div className="text-body-sm text-sky-600 dark:text-sky-400 mt-1">
                {getActionDescription(action)}
              </div>
            </div>
            <Button
              onClick={() => performCacheAction(action)}
              disabled={actionLoading === action}
              variant={getActionVariant(action)}
              size="sm"
              className="ml-4"
            >
              {actionLoading === action ? 'Processing...' : 'Execute'}
            </Button>
          </div>
        ))}

        {/* TTL Configuration Section */}
        <div className="p-4 bg-sky-50 dark:bg-slate-700/50 rounded-lg border border-sky-100 dark:border-sky-800">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <div className="text-body-md font-medium text-sky-900 dark:text-sky-100">
                TTL Configuration
              </div>
              <div className="text-body-sm text-sky-600 dark:text-sky-400 mt-1">
                Configure cache time-to-live settings for different cache layers
              </div>
            </div>
            <Button
              onClick={handleTTLConfigShow}
              disabled={showTTLConfig}
              variant="secondary"
              size="sm"
              className="ml-4"
            >
              {showTTLConfig ? 'Editing...' : 'Configure TTL'}
            </Button>
          </div>

          {showTTLConfig && (
            <div className="mt-4 space-y-4 border-t border-sky-200 dark:border-sky-700 pt-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-body-sm font-medium text-sky-900 dark:text-sky-100 mb-2">
                    Short Cache (seconds)
                  </label>
                  <input
                    type="number"
                    value={ttlConfig.shortTerm}
                    onChange={(e) => setTTLConfig(prev => ({ ...prev, shortTerm: parseInt(e.target.value) || 300 }))}
                    className="w-full px-3 py-2 border border-sky-200 dark:border-sky-700 rounded-md bg-white dark:bg-slate-800 text-sky-900 dark:text-sky-100"
                    min="60"
                    max="3600"
                  />
                  <p className="text-caption text-sky-500 dark:text-sky-400 mt-1">
                    For frequently changing data (60s - 1hr)
                  </p>
                </div>

                <div>
                  <label className="block text-body-sm font-medium text-sky-900 dark:text-sky-100 mb-2">
                    Medium Cache (seconds)
                  </label>
                  <input
                    type="number"
                    value={ttlConfig.mediumTerm}
                    onChange={(e) => setTTLConfig(prev => ({ ...prev, mediumTerm: parseInt(e.target.value) || 3600 }))}
                    className="w-full px-3 py-2 border border-sky-200 dark:border-sky-700 rounded-md bg-white dark:bg-slate-800 text-sky-900 dark:text-sky-100"
                    min="300"
                    max="86400"
                  />
                  <p className="text-caption text-sky-500 dark:text-sky-400 mt-1">
                    For moderately changing data (5min - 24hr)
                  </p>
                </div>

                <div>
                  <label className="block text-body-sm font-medium text-sky-900 dark:text-sky-100 mb-2">
                    Long Cache (seconds)
                  </label>
                  <input
                    type="number"
                    value={ttlConfig.longTerm}
                    onChange={(e) => setTTLConfig(prev => ({ ...prev, longTerm: parseInt(e.target.value) || 86400 }))}
                    className="w-full px-3 py-2 border border-sky-200 dark:border-sky-700 rounded-md bg-white dark:bg-slate-800 text-sky-900 dark:text-sky-100"
                    min="3600"
                    max="604800"
                  />
                  <p className="text-caption text-sky-500 dark:text-sky-400 mt-1">
                    For stable data (1hr - 7 days)
                  </p>
                </div>

                <div>
                  <label className="block text-body-sm font-medium text-sky-900 dark:text-sky-100 mb-2">
                    URL Lookup Cache (seconds)
                  </label>
                  <input
                    type="number"
                    value={ttlConfig.urlLookup}
                    onChange={(e) => setTTLConfig(prev => ({ ...prev, urlLookup: parseInt(e.target.value) || 86400 }))}
                    className="w-full px-3 py-2 border border-sky-200 dark:border-sky-700 rounded-md bg-white dark:bg-slate-800 text-sky-900 dark:text-sky-100"
                    min="3600"
                    max="604800"
                  />
                  <p className="text-caption text-sky-500 dark:text-sky-400 mt-1">
                    For URL slug lookups (1hr - 7 days)
                  </p>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-body-sm font-medium text-sky-900 dark:text-sky-100 mb-2">
                    Admin Stats Cache (seconds)
                  </label>
                  <input
                    type="number"
                    value={ttlConfig.adminStats}
                    onChange={(e) => setTTLConfig(prev => ({ ...prev, adminStats: parseInt(e.target.value) || 1800 }))}
                    className="w-full px-3 py-2 border border-sky-200 dark:border-sky-700 rounded-md bg-white dark:bg-slate-800 text-sky-900 dark:text-sky-100"
                    min="60"
                    max="3600"
                  />
                  <p className="text-caption text-sky-500 dark:text-sky-400 mt-1">
                    For admin dashboard statistics (1min - 1hr)
                  </p>
                </div>
              </div>

              <div className="flex justify-end space-x-3 pt-4 border-t border-sky-200 dark:border-sky-700">
                <Button
                  onClick={() => setShowTTLConfig(false)}
                  variant="secondary"
                  size="sm"
                >
                  Cancel
                </Button>
                <Button
                  onClick={updateTTLConfig}
                  disabled={actionLoading === 'set_ttl_config'}
                  variant="primary"
                  size="sm"
                >
                  {actionLoading === 'set_ttl_config' ? 'Updating...' : 'Update TTL Config'}
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Last Updated */}
      {lastUpdate && (
        <div className="mt-4 text-caption text-sky-500 dark:text-sky-500 text-center">
          Last updated: {new Date(lastUpdate).toLocaleString()}
        </div>
      )}
    </div>
  );
}