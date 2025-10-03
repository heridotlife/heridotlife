import { checkAuthLogic } from '@/lib/api-handlers/check-auth';
import { getSession } from '@/lib/auth';

jest.mock('@/lib/auth', () => ({
  getSession: jest.fn(),
}));

describe('checkAuthLogic', () => {
  it('should return authenticated: false if session is null', async () => {
    (getSession as jest.Mock).mockResolvedValue(null);
    const result = await checkAuthLogic();
    expect(result).toEqual({ authenticated: false });
  });

  it('should return authenticated: true if session exists', async () => {
    (getSession as jest.Mock).mockResolvedValue({ authenticated: true });
    const result = await checkAuthLogic();
    expect(result).toEqual({ authenticated: true });
  });
});
