import { getStatsLogic } from '@/lib/api-handlers/stats';
import {
  respondError,
  respondSuccess,
  respondUnauthorized,
} from '@/lib/api-responses';
import { getSession } from '@/lib/auth';
import logger from '@/lib/logger';

export async function GET() {
  try {
    const session = await getSession();
    const stats = await getStatsLogic(session);
    logger(stats, 'Fetched admin stats');
    return respondSuccess(stats);
  } catch (error: unknown) {
    logger(error, 'Error fetching admin stats');
    if (error instanceof Error && error.message === 'Unauthorized') {
      return respondUnauthorized();
    }
    return respondError('Internal server error');
  }
}
