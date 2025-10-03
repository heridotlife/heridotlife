import { logoutLogic } from '@/lib/api-handlers/logout';
import { deleteSession } from '@/lib/auth';

jest.mock('@/lib/auth', () => ({
  deleteSession: jest.fn(),
}));

describe('logoutLogic', () => {
  beforeEach(() => {
    (deleteSession as jest.Mock).mockClear();
  });

  it('should delete session and return success', async () => {
    (deleteSession as jest.Mock).mockResolvedValue(undefined);

    const result = await logoutLogic();
    expect(result).toEqual({ success: true });
    expect(deleteSession).toHaveBeenCalledTimes(1);
  });

  it('should handle errors gracefully during session deletion', async () => {
    (deleteSession as jest.Mock).mockRejectedValue(
      new Error('Session Deletion Error'),
    );

    await expect(logoutLogic()).rejects.toThrow('Session Deletion Error');
    expect(deleteSession).toHaveBeenCalledTimes(1);
  });
});
