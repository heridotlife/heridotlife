import { useEffect, useState } from 'react';
import { Plus, Edit, Trash2, Eye, Search } from 'lucide-react';
import Button from '../../ui/Button';
import type { BlogPost } from '../../../lib/blog/types';
import { formatRelativeTime } from '../../../lib/utils';

export default function BlogPostsPage() {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'published' | 'draft'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchPosts();
  }, [filter]);

  const fetchPosts = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filter !== 'all') {
        params.append('status', filter);
      }

      const response = await fetch(`/api/blog/posts?${params}`);
      const data = (await response.json()) as { posts: BlogPost[] };
      setPosts(data.posts || []);
    } catch (error) {
      console.error('Failed to fetch posts:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this post?')) return;

    try {
      await fetch(`/api/blog/posts/${id}`, { method: 'DELETE' });
      fetchPosts();
    } catch (error) {
      console.error('Failed to delete post:', error);
      alert('Failed to delete post');
    }
  };

  const handleTogglePublish = async (post: BlogPost) => {
    try {
      await fetch(`/api/blog/posts/${post.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          isPublished: !post.isPublished,
          status: post.isPublished ? 'draft' : 'published',
          publishedAt: !post.isPublished ? Math.floor(Date.now() / 1000) : post.publishedAt,
        }),
      });
      fetchPosts();
    } catch (error) {
      console.error('Failed to toggle publish:', error);
      alert('Failed to update post');
    }
  };

  const filteredPosts = posts.filter((post) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      post.title.toLowerCase().includes(query) ||
      post.excerpt.toLowerCase().includes(query) ||
      post.slug.toLowerCase().includes(query)
    );
  });

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-sky-600 dark:border-sky-400"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Blog Posts</h1>
          <p className="text-slate-600 dark:text-slate-400 mt-1">
            Manage your blog posts ({filteredPosts.length}{' '}
            {filteredPosts.length === 1 ? 'post' : 'posts'})
          </p>
        </div>
        <Button
          onClick={() => (window.location.href = '/admin/blog/new')}
          variant="primary"
          icon={Plus}
          className="min-h-[44px]"
        >
          New Post
        </Button>
      </div>

      {/* Search and Filter */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search posts..."
            className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-500 dark:placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500"
          />
        </div>
        <div className="flex gap-2 border-b border-slate-200 dark:border-slate-700 sm:border-none">
          {(['all', 'published', 'draft'] as const).map((status) => (
            <button
              key={status}
              onClick={() => setFilter(status)}
              className={`px-4 py-2 font-medium transition-colors capitalize min-h-[44px] ${
                filter === status
                  ? 'text-sky-600 dark:text-sky-400 border-b-2 border-sky-600 dark:border-sky-400 sm:bg-sky-50 dark:sm:bg-sky-900/20 sm:rounded-lg sm:border-0'
                  : 'text-slate-600 dark:text-slate-400 hover:text-sky-600 dark:hover:text-sky-400'
              }`}
            >
              {status}
            </button>
          ))}
        </div>
      </div>

      {/* Posts Grid */}
      {filteredPosts.length === 0 ? (
        <div className="bg-white dark:bg-slate-800 rounded-lg p-12 text-center border border-slate-200 dark:border-slate-700">
          <p className="text-slate-600 dark:text-slate-400 mb-4">
            {searchQuery ? 'No posts found matching your search' : 'No posts found'}
          </p>
          {!searchQuery && (
            <Button
              onClick={() => (window.location.href = '/admin/blog/new')}
              variant="primary"
              icon={Plus}
            >
              Create Your First Post
            </Button>
          )}
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredPosts.map((post) => (
            <div
              key={post.id}
              className="bg-white dark:bg-slate-800 rounded-lg shadow-lg overflow-hidden border border-slate-200 dark:border-slate-700 hover:shadow-xl transition-shadow"
            >
              {/* Featured Image */}
              {post.featuredImage && (
                <div className="aspect-video bg-slate-200 dark:bg-slate-700 overflow-hidden">
                  <img
                    src={post.featuredImage}
                    alt={post.featuredImageAlt || post.title}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}

              {/* Content */}
              <div className="p-6 space-y-4">
                {/* Title */}
                <div>
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white line-clamp-2">
                    {post.title}
                  </h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                    /blog/{post.slug}
                  </p>
                </div>

                {/* Excerpt */}
                <p className="text-slate-600 dark:text-slate-400 text-sm line-clamp-3">
                  {post.excerpt}
                </p>

                {/* Meta */}
                <div className="flex items-center gap-4 text-sm text-slate-600 dark:text-slate-400">
                  <span
                    className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      post.isPublished
                        ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
                        : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300'
                    }`}
                  >
                    {post.status}
                  </span>
                  <span className="flex items-center gap-1">
                    <Eye className="w-4 h-4" />
                    {post.viewCount}
                  </span>
                </div>

                {/* Date */}
                {post.publishedAt && (
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {formatRelativeTime(post.publishedAt)}
                  </p>
                )}

                {/* Actions */}
                <div className="flex gap-2 pt-4 border-t border-slate-200 dark:border-slate-700">
                  <Button
                    onClick={() => window.open(`/blog/${post.slug}`, '_blank')}
                    variant="ghost"
                    size="sm"
                    icon={Eye}
                    className="flex-1"
                  >
                    View
                  </Button>
                  <Button
                    onClick={() => (window.location.href = `/admin/blog/edit/${post.id}`)}
                    variant="ghost"
                    size="sm"
                    icon={Edit}
                    className="flex-1"
                  >
                    Edit
                  </Button>
                  <Button
                    onClick={() => handleDelete(post.id)}
                    variant="ghost"
                    size="sm"
                    icon={Trash2}
                    className="text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20"
                  >
                    Delete
                  </Button>
                </div>

                {/* Publish Toggle */}
                <Button
                  onClick={() => handleTogglePublish(post)}
                  variant={post.isPublished ? 'outline' : 'primary'}
                  size="sm"
                  fullWidth
                >
                  {post.isPublished ? 'Unpublish' : 'Publish'}
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
