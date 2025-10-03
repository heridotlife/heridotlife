import { NextResponse } from 'next/server';

import { createSession, verifyPassword } from '@/lib/auth';
import { loginSchema } from '@/lib/validations';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const validation = loginSchema.safeParse(body);

    if (!validation.success) {
      const errorMessage = Object.values(
        validation.error.flatten().fieldErrors,
      )[0]?.[0];
      return NextResponse.json(
        { error: errorMessage || 'Invalid input.' },
        { status: 400 },
      );
    }

    const { password } = validation.data;

    if (!verifyPassword(password)) {
      return NextResponse.json({ error: 'Invalid password' }, { status: 401 });
    }

    await createSession();

    return NextResponse.json({ success: true });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}
