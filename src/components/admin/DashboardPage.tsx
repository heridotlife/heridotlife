'use client';

import { Activity, CheckCircle, LinkIcon, XCircle } from '../ui/icons';
import { FileText, FileEdit, Eye } from 'lucide-react';
import { useEffect, useState } from 'react';

import StatsCard from './StatsCard';
import CacheManagement from './CacheManagement';

// Disable prerendering - this is a client-only page with auth
export const dynamic = 'force-dynamic';

interface Stats {
  totalUrls: number;
  activeUrls: number;
  expiredUrls: number;
  totalClicks: number;
  recentClicks: {
    id: number;
    shortUrl: string;
    title: string | null;
    latestClick: string;
  }[];
}

interface BlogStats {
  totalPosts: number;
  publishedPosts: number;
  draftPosts: number;
  totalViews: number;
  totalCategories: number;
  totalTags: number;
  topPosts: { id: number; title: string; slug: string; views: number }[];
}

export default function DashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [blogStats, setBlogStats] = useState<BlogStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/stats');
      if (!response.ok) {
        throw new Error('Failed to fetch stats');
      }
      const data = (await response.json()) as Stats;
      setStats(data);

      // Blog stats are non-critical: load them best-effort.
      try {
        const blogRes = await fetch('/api/admin/blog/stats');
        if (blogRes.ok) {
          setBlogStats((await blogRes.json()) as BlogStats);
        }
      } catch {
        // Ignore blog stats failures; the URL dashboard still renders.
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load stats');
    } finally {
      setLoading(false);
    }
  };

  // Prevent SSR hydration mismatch
  if (!mounted) {
    return null;
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-slate-500 dark:text-slate-400">Loading stats...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-red-600 dark:text-red-400">{error}</div>
      </div>
    );
  }

  if (!stats) {
    return null;
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-display-md font-bold text-slate-900 dark:text-white">Dashboard</h1>
          <p className="text-body-lg text-slate-500 dark:text-slate-400 mt-2">
            Overview of your short URLs
          </p>
        </div>
        <a
          href="/admin/urls/new"
          className="px-6 py-3 rounded-full bg-gradient-to-r from-sky-500 to-cyan-500 text-white font-medium shadow-lg shadow-sky-500/25 hover:scale-105 transition-transform duration-300"
        >
          Add New URL
        </a>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard
          title="Total URLs"
          value={stats.totalUrls}
          icon={LinkIcon}
          iconColor="text-sky-600 dark:text-sky-400"
        />
        <StatsCard
          title="Total Clicks"
          value={stats.totalClicks}
          icon={Activity}
          iconColor="text-cyan-600 dark:text-cyan-400"
        />
        <StatsCard
          title="Active URLs"
          value={stats.activeUrls}
          icon={CheckCircle}
          iconColor="text-green-600 dark:text-green-400"
        />
        <StatsCard
          title="Expired URLs"
          value={stats.expiredUrls}
          icon={XCircle}
          iconColor="text-red-600 dark:text-red-400"
        />
      </div>

      {/* Recent Activity */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
        <h2 className="text-heading-lg font-bold text-slate-900 dark:text-white mb-4">
          Recent Activity
        </h2>
        {stats.recentClicks.length > 0 ? (
          <div className="space-y-3">
            {stats.recentClicks.map((click) => (
              <div
                key={click.id}
                className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-700/40 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors duration-200"
              >
                <div className="flex-1">
                  <a
                    href={`/${click.shortUrl}`}
                    target="_blank"
                    className="text-body-md font-medium text-sky-600 dark:text-sky-400 hover:text-sky-700 dark:hover:text-sky-300"
                  >
                    /{click.shortUrl}
                  </a>
                  {click.title && (
                    <p className="text-body-sm text-slate-500 dark:text-slate-400 mt-1">
                      {click.title}
                    </p>
                  )}
                </div>
                <div className="text-caption text-slate-400 dark:text-slate-500">
                  {new Date(click.latestClick).toLocaleString()}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-body-md text-slate-500 dark:text-slate-400 text-center py-8">
            No recent activity yet
          </p>
        )}
      </div>

      {/* Blog Stats */}
      {blogStats && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-heading-lg font-bold text-slate-900 dark:text-white">Blog</h2>
            <a
              href="/admin/blog"
              className="text-body-sm font-medium text-sky-600 dark:text-sky-400 hover:text-sky-700 dark:hover:text-sky-300"
            >
              Manage posts →
            </a>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatsCard
              title="Total Posts"
              value={blogStats.totalPosts}
              icon={FileText}
              iconColor="text-sky-600 dark:text-sky-400"
            />
            <StatsCard
              title="Published"
              value={blogStats.publishedPosts}
              icon={CheckCircle}
              iconColor="text-green-600 dark:text-green-400"
            />
            <StatsCard
              title="Drafts"
              value={blogStats.draftPosts}
              icon={FileEdit}
              iconColor="text-amber-600 dark:text-amber-400"
            />
            <StatsCard
              title="Total Views"
              value={blogStats.totalViews}
              icon={Eye}
              iconColor="text-cyan-600 dark:text-cyan-400"
            />
          </div>

          {blogStats.topPosts.length > 0 && (
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
              <h3 className="text-heading-md font-bold text-slate-900 dark:text-white mb-4">
                Top Posts by Views
              </h3>
              <div className="space-y-3">
                {blogStats.topPosts.map((post) => (
                  <div
                    key={post.id}
                    className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-700/40 rounded-xl border border-slate-200 dark:border-slate-700"
                  >
                    <a
                      href={`/blog/${post.slug}`}
                      target="_blank"
                      className="text-body-md font-medium text-sky-600 dark:text-sky-400 hover:text-sky-700 dark:hover:text-sky-300 truncate"
                    >
                      {post.title}
                    </a>
                    <span className="text-caption text-slate-500 dark:text-slate-400 whitespace-nowrap ml-4">
                      {post.views.toLocaleString()} views
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Cache Management */}
      <CacheManagement />
    </div>
  );
}
