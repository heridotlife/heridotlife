import { z } from 'zod';

import { createSession, verifyPassword } from '@/lib/auth';
import { loginSchema } from '@/lib/validations';

export async function loginLogic(body: z.infer<typeof loginSchema>) {
  const validation = loginSchema.safeParse(body);

  if (!validation.success) {
    const errorMessage = Object.values(
      validation.error.flatten().fieldErrors,
    )[0]?.[0];
    throw new Error(errorMessage || 'Unknown error.');
  }

  const { password } = validation.data;

  if (!verifyPassword(password)) {
    throw new Error('Invalid password');
  }

  await createSession();

  return { success: true };
}
