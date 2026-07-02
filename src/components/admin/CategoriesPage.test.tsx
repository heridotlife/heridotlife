import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import CategoriesPage from './CategoriesPage';

const categories = [{ id: 7, name: 'Tech', clickCount: 12, _count: { shortUrls: 3 } }];

let calls: { url: string; method: string }[];

beforeEach(() => {
  calls = [];
  vi.stubGlobal('confirm', vi.fn().mockReturnValue(true));
  vi.stubGlobal(
    'fetch',
    vi.fn(async (url: string, init?: RequestInit) => {
      const method = init?.method ?? 'GET';
      calls.push({ url, method });
      if (method === 'DELETE') return new Response(null, { status: 204 });
      if (method === 'PUT')
        return new Response(JSON.stringify({ id: 7, name: 'Renamed' }), { status: 200 });
      return new Response(JSON.stringify(categories), { status: 200 });
    })
  );
});

// These tests pin the RESTful path-parameter convention: mutations go to
// /api/admin/categories/[id], not the legacy /api/admin/categories/id?id= form.
describe('CategoriesPage', () => {
  it('renders categories from the admin API', async () => {
    render(<CategoriesPage />);

    expect(await screen.findByText('Tech')).toBeInTheDocument();
    expect(calls[0]).toEqual({ url: '/api/admin/categories', method: 'GET' });
  });

  it('updates a category via PUT /api/admin/categories/[id]', async () => {
    render(<CategoriesPage />);
    await screen.findByText('Tech');

    fireEvent.click(screen.getByTitle('Edit category'));
    fireEvent.change(screen.getByDisplayValue('Tech'), { target: { value: 'Renamed' } });
    fireEvent.click(screen.getByRole('button', { name: /save/i }));

    await waitFor(() =>
      expect(calls).toContainEqual({ url: '/api/admin/categories/7', method: 'PUT' })
    );
  });

  it('deletes a category via DELETE /api/admin/categories/[id]', async () => {
    render(<CategoriesPage />);
    await screen.findByText('Tech');

    fireEvent.click(screen.getByTitle('Delete category'));

    await waitFor(() =>
      expect(calls).toContainEqual({ url: '/api/admin/categories/7', method: 'DELETE' })
    );
  });
});
