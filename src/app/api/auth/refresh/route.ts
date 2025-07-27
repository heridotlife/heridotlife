import { NextRequest, NextResponse } from 'next/server';

import { generateToken, verifyToken } from '@/lib/auth';
import { validateSession } from '@/lib/session';

export async function POST(request: NextRequest) {
  try {
    // Get tokens from cookies
    const authToken = request.cookies.get('authToken')?.value;
    const sessionToken = request.cookies.get('sessionToken')?.value;

    if (!authToken || !sessionToken) {
      return NextResponse.json(
        { error: 'Missing authentication tokens' },
        { status: 401 },
      );
    }

    // Verify current token
    const payload = verifyToken(authToken);
    if (!payload) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    // Validate session
    const session = await validateSession(sessionToken);
    if (!session) {
      return NextResponse.json(
        { error: 'Invalid or expired session' },
        { status: 401 },
      );
    }

    // Generate new token
    const newToken = generateToken(payload.userId, payload.email);

    // Create response
    const response = NextResponse.json(
      {
        success: true,
        message: 'Token refreshed successfully',
      },
      { status: 200 },
    );

    // Update auth token cookie
    response.cookies.set('authToken', newToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60, // 7 days
      path: '/',
    });

    return response;
  } catch (error) {
    console.error('Token refresh error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}
