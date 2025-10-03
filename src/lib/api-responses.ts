import { NextResponse } from 'next/server';

export function respondSuccess<T>(data: T, status: number = 200) {
  return NextResponse.json({ data }, { status });
}

export function respondError(message: string, status: number = 500) {
  return NextResponse.json({ error: { message } }, { status });
}

export function respondUnauthorized() {
  return respondError('Unauthorized', 401);
}

export function respondNotFound(message: string = 'Not Found') {
  return respondError(message, 404);
}

export function respondBadRequest(message: string = 'Bad Request') {
  return respondError(message, 400);
}

export function respondConflict(message: string = 'Conflict') {
  return respondError(message, 409);
}
