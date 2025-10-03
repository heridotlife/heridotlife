import { checkAuthLogic } from '@/lib/api-handlers/check-auth';
import { respondSuccess, respondUnauthorized } from '@/lib/api-responses';
import logger from '@/lib/logger';

export async function GET() {
  try {
    const { authenticated } = await checkAuthLogic();

    if (!authenticated) {
      logger({ authenticated }, 'Check Auth: Unauthenticated');
      return respondUnauthorized();
    }

    logger({ authenticated }, 'Check Auth: Authenticated');
    return respondSuccess({ authenticated });
  } catch (error: unknown) {
    logger(error, 'Error during check-auth');
    return respondUnauthorized(); // Or respondError if it's a server error
  }
}
