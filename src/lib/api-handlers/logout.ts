import { deleteSession } from '@/lib/auth';

export async function logoutLogic() {
  await deleteSession();
  return { success: true };
}
