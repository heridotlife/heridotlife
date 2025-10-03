import { loginLogic } from '@/lib/api-handlers/login';
import {
  respondBadRequest,
  respondError,
  respondSuccess,
  respondUnauthorized,
} from '@/lib/api-responses';
import logger from '@/lib/logger';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const result = await loginLogic(body);
    logger(result, 'Admin login successful');
    return respondSuccess(result);
  } catch (error: unknown) {
    logger(error, 'Admin login failed');
    if (error instanceof Error && error.message.startsWith('Invalid input')) {
      return respondBadRequest(error.message);
    }
    if (error instanceof Error && error.message === 'Invalid password') {
      return respondUnauthorized();
    }
    return respondError('Internal server error');
  }
}
