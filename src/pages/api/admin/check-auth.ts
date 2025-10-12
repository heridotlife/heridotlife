import type { APIRoute } from 'astro';
import { getSession } from '../../../lib/auth';

export const GET: APIRoute = async (context) => {
  try {
    const session = await getSession(context);
    const authenticated = !!session;

    if (!authenticated) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
    }

    return new Response(JSON.stringify({ authenticated }), { status: 200 });
  } catch (error) {
    console.error('Check auth failed', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), { status: 500 });
  }
};
