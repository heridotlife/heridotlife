import { loginLogic } from '@/lib/api-handlers/login';
import { createSession, verifyPassword } from '@/lib/auth';

jest.mock('@/lib/auth', () => ({
  createSession: jest.fn(),
  verifyPassword: jest.fn(),
}));

describe('loginLogic', () => {
  beforeEach(() => {
    (createSession as jest.Mock).mockClear();
    (verifyPassword as jest.Mock).mockClear();
  });

  it('should throw error if invalid input', async () => {
    await expect(loginLogic({})).rejects.toThrow(
      'Invalid input: expected string, received undefined',
    );
  });

  it('should throw error if invalid password', async () => {
    (verifyPassword as jest.Mock).mockReturnValue(false);
    await expect(loginLogic({ password: 'wrong' })).rejects.toThrow(
      'Invalid password',
    );
    expect(verifyPassword).toHaveBeenCalledWith('wrong');
    expect(createSession).not.toHaveBeenCalled();
  });

  it('should create session and return success if valid password', async () => {
    (verifyPassword as jest.Mock).mockReturnValue(true);
    (createSession as jest.Mock).mockResolvedValue(undefined);

    const result = await loginLogic({ password: 'correct' });
    expect(result).toEqual({ success: true });
    expect(verifyPassword).toHaveBeenCalledWith('correct');
    expect(createSession).toHaveBeenCalledTimes(1);
  });

  it('should handle errors gracefully during session creation', async () => {
    (verifyPassword as jest.Mock).mockReturnValue(true);
    (createSession as jest.Mock).mockRejectedValue(new Error('Session Error'));

    await expect(loginLogic({ password: 'correct' })).rejects.toThrow(
      'Session Error',
    );
    expect(verifyPassword).toHaveBeenCalledWith('correct');
    expect(createSession).toHaveBeenCalledTimes(1);
  });
});
