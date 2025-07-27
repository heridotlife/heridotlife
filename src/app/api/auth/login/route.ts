import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { generateToken, validateCredentials } from '@/lib/auth';
import { createSession } from '@/lib/session';

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate input
    const validationResult = loginSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: validationResult.error.errors },
        { status: 400 },
      );
    }

    const { email, password } = validationResult.data;

    // Validate credentials
    const user = await validateCredentials(email, password);
    if (!user) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 },
      );
    }

    // Create session
    const session = await createSession(user.id);

    // Generate JWT token
    const token = generateToken(user.id, user.email || '');

    // Create response
    const response = NextResponse.json(
      {
        success: true,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          image: user.image,
        },
        message: 'Login successful',
      },
      { status: 200 },
    );

    // Set secure cookies
    response.cookies.set('sessionToken', session.sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60, // 7 days
      path: '/',
    });

    response.cookies.set('authToken', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60, // 7 days
      path: '/',
    });

    return response;
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}
