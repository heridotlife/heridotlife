import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import BlogPostsPage from './BlogPostsPage';

const draftPost = {
  id: 1,
  slug: 'my-draft',
  title: 'My Draft',
  excerpt: 'A draft excerpt for the admin list.',
  featuredImage: null,
  featuredImageAlt: null,
  status: 'draft',
  isPublished: false,
  publishedAt: null,
  createdAt: 1750000000,
  readTime: 3,
  viewCount: 0,
  categories: [],
};

let requestedUrls: string[];

beforeEach(() => {
  requestedUrls = [];
  vi.stubGlobal(
    'fetch',
    vi.fn(async (url: string) => {
      requestedUrls.push(url);
      return new Response(JSON.stringify({ posts: [draftPost] }), { status: 200 });
    })
  );
});

describe('BlogPostsPage', () => {
  // Regression: the "all" tab must not send a status filter — the admin API
  // defaults to every status, so drafts show up in the default view.
  it('fetches without a status param on the default (all) tab', async () => {
    render(<BlogPostsPage />);

    await waitFor(() => expect(requestedUrls).toHaveLength(1));
    expect(requestedUrls[0]).toBe('/api/blog/posts?');
  });

  it('renders draft posts with their status badge and a Publish action', async () => {
    render(<BlogPostsPage />);

    expect(await screen.findByText('My Draft')).toBeInTheDocument();
    // the status badge (the filter tab button also says "draft")
    expect(screen.getByText('draft', { selector: 'span' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Publish' })).toBeInTheDocument();
  });

  it('passes the status filter to the API when a tab is selected', async () => {
    render(<BlogPostsPage />);
    await screen.findByText('My Draft');

    fireEvent.click(screen.getByRole('button', { name: 'draft' }));

    await waitFor(() => expect(requestedUrls).toHaveLength(2));
    expect(requestedUrls[1]).toBe('/api/blog/posts?status=draft');
  });
});
