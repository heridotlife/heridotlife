import type { APIRoute } from 'astro';
import { createSession, verifyPassword } from '../../../lib/auth';
import { loginSchema } from '../../../lib/validations';

export const POST: APIRoute = async (context) => {
  try {
    const body = await context.request.json();
    const validation = loginSchema.safeParse(body);

    if (!validation.success) {
      const errorMessage = validation.error.issues[0]?.message;
      return new Response(JSON.stringify({ error: errorMessage || 'Invalid input.' }), {
        status: 400,
      });
    }

    const { password } = validation.data;

    if (!verifyPassword(password, context.locals)) {
      return new Response(JSON.stringify({ error: 'Invalid password' }), { status: 401 });
    }

    await createSession(context);

    return new Response(JSON.stringify({ success: true }), { status: 200 });
  } catch (error) {
    console.error('Admin login failed', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), { status: 500 });
  }
};
