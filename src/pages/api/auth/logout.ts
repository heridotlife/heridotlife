import type { APIRoute } from 'astro';
import { deleteSession } from '../../../lib/auth';

export const POST: APIRoute = async ({ cookies }) => {
  try {
    deleteSession(cookies);
    return new Response(JSON.stringify({ success: true }), { status: 200 });
  } catch (error) {
    console.error('Admin logout failed', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), { status: 500 });
  }
};
