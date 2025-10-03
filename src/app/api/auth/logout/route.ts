import { logoutLogic } from '@/lib/api-handlers/logout';
import { respondError, respondSuccess } from '@/lib/api-responses';
import logger from '@/lib/logger';

export async function POST() {
  try {
    const result = await logoutLogic();
    logger(result, 'Admin logout successful');
    return respondSuccess(result);
  } catch (error: unknown) {
    logger(error, 'Admin logout failed');
    return respondError('Internal server error');
  }
}
