import { getSession } from '@/lib/auth';

export async function checkAuthLogic(): Promise<{ authenticated: boolean }> {
  const session = await getSession();
  return { authenticated: !!session };
}
