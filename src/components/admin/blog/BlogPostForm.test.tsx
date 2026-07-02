import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import BlogPostForm from './BlogPostForm';

// Route-based fetch mock: taxonomy GETs return empty lists, POST /api/blog/posts
// is captured so tests can assert the exact payload sent to the API.
let createCalls: { url: string; init: RequestInit }[];

beforeEach(() => {
  createCalls = [];
  vi.stubGlobal('alert', vi.fn());
  vi.stubGlobal(
    'fetch',
    vi.fn(async (url: string, init?: RequestInit) => {
      if (init?.method === 'POST') {
        createCalls.push({ url, init });
        return new Response(JSON.stringify({ id: 1 }), { status: 201 });
      }
      return new Response(JSON.stringify([]), { status: 200 });
    })
  );
});

describe('BlogPostForm (create)', () => {
  const fillRequiredFields = () => {
    fireEvent.change(screen.getByPlaceholderText('Enter post title'), {
      target: { value: 'My Draft Post' },
    });
    fireEvent.change(screen.getByPlaceholderText('Short description (50-300 characters)'), {
      target: { value: 'An excerpt that is comfortably longer than the fifty character minimum.' },
    });
    fireEvent.change(screen.getByPlaceholderText('Write your post content (HTML)'), {
      target: {
        value:
          '<p>Body content that is comfortably longer than the one hundred character minimum required by validation.</p>',
      },
    });
  };

  it('generates the slug from the title', () => {
    render(<BlogPostForm mode="create" />);
    fillRequiredFields();

    expect(screen.getByPlaceholderText('post-url-slug')).toHaveValue('my-draft-post');
  });

  // Regression companion to the server-side fix: a new post must be submitted
  // as a draft (status: 'draft', isPublished: false, no publishedAt).
  it('submits a draft payload by default', async () => {
    const { container } = render(<BlogPostForm mode="create" />);
    fillRequiredFields();

    fireEvent.submit(container.querySelector('form')!);

    await waitFor(() => expect(createCalls).toHaveLength(1));
    expect(createCalls[0].url).toBe('/api/blog/posts');

    const payload = JSON.parse(createCalls[0].init.body as string);
    expect(payload.status).toBe('draft');
    expect(payload.isPublished).toBe(false);
    expect(payload.publishedAt).toBeUndefined();
    expect(payload.slug).toBe('my-draft-post');
  });

  it('submits a published payload with publishedAt when status is published', async () => {
    const { container } = render(<BlogPostForm mode="create" />);
    fillRequiredFields();

    fireEvent.change(screen.getByDisplayValue('Draft'), { target: { value: 'published' } });
    fireEvent.submit(container.querySelector('form')!);

    await waitFor(() => expect(createCalls).toHaveLength(1));
    const payload = JSON.parse(createCalls[0].init.body as string);
    expect(payload.status).toBe('published');
    expect(payload.isPublished).toBe(true);
    expect(payload.publishedAt).toBeGreaterThan(0);
  });

  it('blocks submission when the excerpt is under 50 characters', async () => {
    const { container } = render(<BlogPostForm mode="create" />);
    fillRequiredFields();
    fireEvent.change(screen.getByPlaceholderText('Short description (50-300 characters)'), {
      target: { value: 'too short' },
    });

    fireEvent.submit(container.querySelector('form')!);

    expect(alert).toHaveBeenCalledWith('Excerpt must be at least 50 characters');
    expect(createCalls).toHaveLength(0);
  });
});
